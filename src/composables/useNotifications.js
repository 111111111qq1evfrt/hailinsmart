/**
 * 内部消息通知管理
 * 用于校领导向教师发送通知，教师登录后在通知中心查看
 * 数据存储在 sessionStorage，按 schoolId + username 隔离
 */

import { ref, computed, watch } from 'vue'
import store from '@/store/global'
import { createSeededRandom, generateDeterministicId } from '@/utils/seededRandom'

const STORAGE_PREFIX = 'smart_pe_notifications_'

function getStorageKey(username) {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  return `${STORAGE_PREFIX}${schoolId}_${username}`
}

function getAllNotificationsKey() {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  return `${STORAGE_PREFIX}all_${schoolId}`
}

/**
 * 获取当前用户的所有通知
 */
export function useNotifications() {
  const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')
  const username = computed(() => store.state.user.username || '')

  const notifications = ref([])
  const unreadCount = ref(0)

  function loadNotifications() {
    if (!username.value) {
      notifications.value = []
      unreadCount.value = 0
      return
    }
    const key = getStorageKey(username.value)
    try {
      const raw = sessionStorage.getItem(key)
      notifications.value = raw ? JSON.parse(raw) : []
    } catch {
      notifications.value = []
    }
    unreadCount.value = notifications.value.filter(n => !n.read).length
  }

  function saveNotifications(list) {
    if (!username.value) return
    const key = getStorageKey(username.value)
    sessionStorage.setItem(key, JSON.stringify(list))
    notifications.value = list
    unreadCount.value = list.filter(n => !n.read).length
  }

  function markAsRead(id) {
    const list = notifications.value.map(n =>
      n.id === id ? { ...n, read: true, readTime: new Date().toISOString() } : n
    )
    saveNotifications(list)
  }

  function markAllAsRead() {
    const list = notifications.value.map(n =>
      n.read ? n : { ...n, read: true, readTime: new Date().toISOString() }
    )
    saveNotifications(list)
  }

  function deleteNotification(id) {
    const list = notifications.value.filter(n => n.id !== id)
    saveNotifications(list)
  }

  function clearAll() {
    saveNotifications([])
  }

  // 监听用户切换，重新加载
  watch([schoolId, username], () => {
    loadNotifications()
  })

  // 初始加载
  loadNotifications()

  return {
    notifications,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll
  }
}

/**
 * 发送通知给指定教师（由校领导端调用）
 * @param {string} teacherUsername - 教师用户名
 * @param {string} teacherName - 教师姓名
 * @param {object} notification - 通知内容 { title, content, type, relatedStudents }
 */
export function sendNotification(teacherUsername, teacherName, notification) {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  const key = getStorageKey(teacherUsername)
  const random = createSeededRandom('notification-id')

  let list = []
  try {
    const raw = sessionStorage.getItem(key)
    list = raw ? JSON.parse(raw) : []
  } catch {
    list = []
  }

  const newNotification = {
    id: generateDeterministicId('notif', `${teacherUsername}_${notification.title || '新通知'}`),
    title: notification.title || '新通知',
    content: notification.content || '',
    type: notification.type || 'attendance', // attendance, warning, general
    sender: store.state.user.name || '校领导',
    senderRole: store.state.user.role || 'school',
    relatedStudents: notification.relatedStudents || [],
    createTime: new Date().toISOString(),
    read: false,
    readTime: null
  }

  list.unshift(newNotification)
  sessionStorage.setItem(key, JSON.stringify(list))

  return newNotification
}

/**
 * 批量发送通知（通知多位教师）
 */
export function sendNotifications(notifications) {
  // notifications: [{ teacherUsername, teacherName, title, content, type, relatedStudents }]
  const results = []
  for (const n of notifications) {
    const result = sendNotification(
      n.teacherUsername,
      n.teacherName,
      {
        title: n.title,
        content: n.content,
        type: n.type || 'attendance',
        relatedStudents: n.relatedStudents || []
      }
    )
    results.push(result)
  }
  return results
}
