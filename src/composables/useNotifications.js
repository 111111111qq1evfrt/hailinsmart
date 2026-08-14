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
    let personalList = []
    try {
      const raw = sessionStorage.getItem(key)
      personalList = raw ? JSON.parse(raw) : []
    } catch {
      personalList = []
    }
    // 合并广播通知（去重）
    let broadcastList = []
    try {
      const broadcastRaw = sessionStorage.getItem(getAllNotificationsKey())
      broadcastList = broadcastRaw ? JSON.parse(broadcastRaw) : []
    } catch {
      broadcastList = []
    }
    const existingIds = new Set(personalList.map(n => n.id))
    const merged = [...personalList, ...broadcastList.filter(n => !existingIds.has(n.id))]
    // 按时间倒序
    merged.sort((a, b) => new Date(b.createTime || 0) - new Date(a.createTime || 0))
    notifications.value = merged
    unreadCount.value = merged.filter(n => !n.read).length
  }

  function saveNotifications(list) {
    if (!username.value) return
    const key = getStorageKey(username.value)
    sessionStorage.setItem(key, JSON.stringify(list))
    notifications.value = list
    unreadCount.value = list.filter(n => !n.read).length
  }

  function markAsRead(id) {
    // 先在个人通知中查找
    const personalKey = getStorageKey(username.value)
    let personalList = []
    try {
      personalList = JSON.parse(sessionStorage.getItem(personalKey) || '[]')
    } catch { personalList = [] }
    const inPersonal = personalList.find(n => n.id === id)
    if (inPersonal) {
      personalList = personalList.map(n =>
        n.id === id ? { ...n, read: true, readTime: new Date().toISOString() } : n
      )
      sessionStorage.setItem(personalKey, JSON.stringify(personalList))
    } else {
      // 在广播通知中查找
      const broadcastKey = getAllNotificationsKey()
      let broadcastList = []
      try {
        broadcastList = JSON.parse(sessionStorage.getItem(broadcastKey) || '[]')
      } catch { broadcastList = [] }
      broadcastList = broadcastList.map(n =>
        n.id === id ? { ...n, read: true, readTime: new Date().toISOString() } : n
      )
      sessionStorage.setItem(broadcastKey, JSON.stringify(broadcastList))
    }
    loadNotifications()
  }

  function markAllAsRead() {
    const now = new Date().toISOString()
    // 个人通知全部已读
    const personalKey = getStorageKey(username.value)
    let personalList = []
    try {
      personalList = JSON.parse(sessionStorage.getItem(personalKey) || '[]')
    } catch { personalList = [] }
    personalList = personalList.map(n => n.read ? n : { ...n, read: true, readTime: now })
    sessionStorage.setItem(personalKey, JSON.stringify(personalList))
    // 广播通知全部已读
    const broadcastKey = getAllNotificationsKey()
    let broadcastList = []
    try {
      broadcastList = JSON.parse(sessionStorage.getItem(broadcastKey) || '[]')
    } catch { broadcastList = [] }
    broadcastList = broadcastList.map(n => n.read ? n : { ...n, read: true, readTime: now })
    sessionStorage.setItem(broadcastKey, JSON.stringify(broadcastList))
    loadNotifications()
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

/**
 * 发送广播通知（所有用户都能在铃铛中看到）
 * @param {object} notification - 通知内容 { title, content, type, relatedStudents }
 */
export function sendBroadcastNotification(notification) {
  const key = getAllNotificationsKey()

  let list = []
  try {
    const raw = sessionStorage.getItem(key)
    list = raw ? JSON.parse(raw) : []
  } catch {
    list = []
  }

  const newNotification = {
    id: generateDeterministicId('broadcast', (notification.title || '新通知') + Date.now()),
    title: notification.title || '新通知',
    content: notification.content || '',
    type: notification.type || 'general',
    sender: store.state.user?.name || '系统',
    senderRole: store.state.user?.role || 'school',
    relatedStudents: notification.relatedStudents || [],
    createTime: new Date().toISOString(),
    read: false,
    readTime: null,
    isBroadcast: true
  }

  list.unshift(newNotification)
  sessionStorage.setItem(key, JSON.stringify(list))

  return newNotification
}
