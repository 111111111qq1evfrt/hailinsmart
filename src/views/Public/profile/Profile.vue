<template>
  <div class="profile-page">
    <div class="profile-header">
      <div class="user-card">
        <div class="avatar-section">
          <el-avatar :size="96" class="user-avatar">{{ userInfo.avatar || '管' }}</el-avatar>
          <div class="role-badge" :class="roleClass">{{ roleLabel }}</div>
        </div>
        <div class="info-section">
          <h1 class="user-name">{{ userInfo.name || userInfo.username || '用户' }}</h1>
          <div class="user-meta">
            <span class="meta-item">
                <el-icon class="meta-icon"><School /></el-icon>
                {{ schoolInfo.name || '海林第二小学' }}
              </span>
            <span class="meta-item">
              <el-icon class="meta-icon"><User /></el-icon>
              {{ userInfo.username || 'admin' }}
            </span>
            <span class="meta-item">
              <el-icon class="meta-icon"><Clock /></el-icon>
              登录时间：{{ loginTime }}
            </span>
          </div>
        </div>
        <div class="actions-section">
          <el-button type="primary" @click="showEditDialog = true">
            <el-icon><Edit /></el-icon>
            编辑资料
          </el-button>
          <el-button @click="logout">
            <el-icon><SwitchButton /></el-icon>
            退出登录
          </el-button>
        </div>
      </div>
    </div>

    <div class="profile-body">
      <div class="profile-content">
        <div class="left-panel">
          <div class="card">
            <div class="card-header">
              <el-icon class="card-icon"><Lock /></el-icon>
              <span class="card-title">账户安全</span>
            </div>
            <div class="card-body">
              <div class="info-row">
                <span class="info-label">登录账号</span>
                <span class="info-value">{{ userInfo.username || 'admin' }}</span>
              </div>
              <div class="info-row">
                <span class="info-label">角色权限</span>
                <el-tag :type="roleTagType" size="small">{{ roleLabel }}</el-tag>
              </div>
              <div class="info-row">
                <span class="info-label">登录方式</span>
                <span class="info-value">账号密码</span>
              </div>
              <div class="info-row">
                <span class="info-label">安全等级</span>
                <div class="security-row">
                  <el-progress :percentage="securityScore" :stroke-width="8" :color="securityColor" />
                  <span class="security-text" :style="{ color: securityColor }">{{ securityLevel }}</span>
                </div>
              </div>
              <div class="action-buttons">
                <el-button size="small" type="primary" @click="handleChangePassword">修改密码</el-button>
                <el-button size="small" @click="ElMessage.info('绑定手机功能开发中')">绑定手机</el-button>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <el-icon class="card-icon"><Setting /></el-icon>
              <span class="card-title">系统偏好</span>
            </div>
            <div class="card-body">
              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">消息通知</span>
                  <span class="setting-desc">接收系统通知和数据变更提醒</span>
                </div>
                <el-switch v-model="preferences.notifications" @change="savePreferences" />
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">数据自动刷新</span>
                  <span class="setting-desc">页面数据每5秒自动更新</span>
                </div>
                <el-switch v-model="preferences.autoRefresh" @change="savePreferences" />
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">图表动画</span>
                  <span class="setting-desc">图表加载和更新时显示动画效果</span>
                </div>
                <el-switch v-model="preferences.chartAnimation" @change="savePreferences" />
              </div>
              <div class="setting-item">
                <div class="setting-info">
                  <span class="setting-label">紧凑模式</span>
                  <span class="setting-desc">减小页面元素间距，显示更多内容</span>
                </div>
                <el-switch v-model="preferences.compactMode" @change="savePreferences" />
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <el-icon class="card-icon"><Grid /></el-icon>
              <span class="card-title">快捷操作</span>
            </div>
            <div class="card-body">
              <div class="quick-actions-grid">
                <button class="quick-action-btn" @click="$router.push('/system/users')">
                  <el-icon><User /></el-icon>
                  <span>用户管理</span>
                </button>
                <button class="quick-action-btn" @click="$router.push('/system/students')">
                  <el-icon><User /></el-icon>
                  <span>学生管理</span>
                </button>
                <button class="quick-action-btn" @click="$router.push('/data/student')">
                  <el-icon><DataLine /></el-icon>
                  <span>学生数据</span>
                </button>
                <button class="quick-action-btn" @click="$router.push('/evaluation/assessment')">
                  <el-icon><Document /></el-icon>
                  <span>体测评估</span>
                </button>
                <button class="quick-action-btn" @click="$router.push('/system/notifications')">
                  <el-icon><Bell /></el-icon>
                  <span>通知中心</span>
                </button>
                <button class="quick-action-btn" @click="$router.push('/system/resources')">
                  <el-icon><VideoCamera /></el-icon>
                  <span>资源管理</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="right-panel">
          <div class="card">
            <div class="card-header">
              <el-icon class="card-icon"><DataAnalysis /></el-icon>
              <span class="card-title">使用统计</span>
              <el-button text size="small" @click="refreshStats">
                <el-icon><Refresh /></el-icon>
              </el-button>
            </div>
            <div class="card-body">
              <div class="stats-grid">
                <div class="stat-card">
                  <span class="stat-value">{{ usageStats.loginDays }}</span>
                  <span class="stat-label">累计登录(天)</span>
                </div>
                <div class="stat-card">
                  <span class="stat-value">{{ usageStats.dataViews }}</span>
                  <span class="stat-label">数据查看(次)</span>
                </div>
                <div class="stat-card">
                  <span class="stat-value">{{ usageStats.exports }}</span>
                  <span class="stat-label">数据导出(次)</span>
                </div>
                <div class="stat-card">
                  <span class="stat-value">{{ usageStats.alerts }}</span>
                  <span class="stat-label">处理预警(条)</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <el-icon class="card-icon"><Timer /></el-icon>
              <span class="card-title">最近活动</span>
            </div>
            <div class="card-body">
              <div class="activity-list">
                <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
                  <div class="activity-dot" :class="activity.type"></div>
                  <div class="activity-content">
                    <span class="activity-text">{{ activity.content }}</span>
                    <span class="activity-time">{{ activity.time }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <el-icon class="card-icon"><Bell /></el-icon>
              <span class="card-title">通知提醒</span>
              <span class="badge">{{ notifications.length }}</span>
            </div>
            <div class="card-body">
              <div class="notification-list">
                <div v-for="notification in notifications" :key="notification.id" class="notification-item">
                  <el-icon class="notification-icon" :class="notification.type">
                    <Warning v-if="notification.type === 'warning'" />
                    <CircleCheck v-else-if="notification.type === 'success'" />
                    <InfoFilled v-else />
                  </el-icon>
                  <div class="notification-content">
                    <span class="notification-title">{{ notification.title }}</span>
                    <span class="notification-time">{{ notification.time }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="showEditDialog" title="编辑个人资料" width="480px">
      <el-form :model="editForm" label-width="80px">
        <el-form-item label="显示名称">
          <el-input v-model="editForm.name" placeholder="请输入显示名称" />
        </el-form-item>
        <el-form-item label="联系电话">
          <el-input v-model="editForm.phone" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="editForm.email" placeholder="请输入邮箱地址" />
        </el-form-item>
        <el-form-item label="个人简介">
          <el-input v-model="editForm.bio" type="textarea" :rows="3" placeholder="请输入个人简介" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveProfile">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showPasswordDialog" title="修改密码" width="480px">
      <el-form :model="passwordForm" label-width="100px">
        <el-form-item label="旧密码">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入旧密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码（至少6位）" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showPasswordDialog = false">取消</el-button>
        <el-button type="primary" @click="changePassword">确认修改</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Edit, User, Lock, Setting, Clock, DataAnalysis, List, Grid,
  DataLine, Document, Bell, Refresh, SwitchButton, School, VideoCamera,
  Warning, CircleCheck, InfoFilled, Timer
} from '@element-plus/icons-vue'
import store from '../../store/global'
import { usePersistedRef } from '../../composables/usePersistedRef'
import { generateDefaultPassword } from '../../mock/passwordUtils'
import { getCachedIP } from '../../utils/clientInfo'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')
const schoolInfo = computed(() => ({
  name: store.state.school.name || '海林第二小学',
  logo: store.state.school.logo || ''
}))

const refreshCounter = ref(0)

const userInfo = computed(() => {
  // refreshCounter forces re-evaluation when refreshStats is called
  void refreshCounter.value
  const stored = sessionStorage.getItem(`smart_pe_user_${schoolId.value}`)
  if (stored) {
    try { return JSON.parse(stored) } catch { /* ignore */ }
  }
  return store.state.user || {}
})

const roleLabel = computed(() => {
  if (userInfo.value.roleName) {
    return userInfo.value.roleName
  }
  const role = userInfo.value.role
  const map = { school: '学校管理员', teacher: '班主任', class: '班级管理员' }
  return map[role] || '管理员'
})

const roleClass = computed(() => {
  const role = userInfo.value.role
  return role === 'teacher' ? 'badge-teacher' : role === 'class' ? 'badge-class' : 'badge-admin'
})

const roleTagType = computed(() => {
  const role = userInfo.value.role
  return role === 'teacher' ? 'success' : role === 'class' ? 'warning' : ''
})

const loginTime = computed(() => {
  const userId = userInfo.value.id
  if (userId) {
    const d = new Date(Number(userId))
    if (!isNaN(d.getTime())) {
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
    }
  }
  return '今天'
})

const securityScore = 60
const securityColor = '#F5A623'
const securityLevel = '中'

const preferences = reactive({
  notifications: usePersistedRef(`smart_pe_pref_notifications_${schoolId.value}`, true),
  autoRefresh: usePersistedRef(`smart_pe_pref_autoRefresh_${schoolId.value}`, true),
  chartAnimation: usePersistedRef(`smart_pe_pref_chartAnimation_${schoolId.value}`, true),
  compactMode: usePersistedRef(`smart_pe_pref_compactMode_${schoolId.value}`, false)
})

const usageStats = reactive({
  loginDays: 28,
  dataViews: 156,
  exports: 23,
  alerts: 12
})

const recentActivities = ref([
  { id: 1, content: '查看了学生数据概览', time: '10分钟前', type: 'primary' },
  { id: 2, content: '导入了体测成绩数据', time: '1小时前', type: 'success' },
  { id: 3, content: '处理了一条预警通知', time: '2小时前', type: 'warning' },
  { id: 4, content: '修改了系统配置参数', time: '昨天 16:30', type: 'info' },
  { id: 5, content: '发布了全校通知公告', time: '昨天 09:15', type: 'primary' }
])

const notifications = ref([
  { id: 1, title: '体测数据已更新，请及时查看', time: '5分钟前', type: 'info' },
  { id: 2, title: '张三同学体测成绩未达标', time: '30分钟前', type: 'warning' },
  { id: 3, title: '公开课报名成功通知', time: '1小时前', type: 'success' }
])

const showEditDialog = ref(false)
const editForm = reactive({
  name: '',
  phone: '',
  email: '',
  bio: ''
})

const showPasswordDialog = ref(false)
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

onMounted(() => {
  const profileData = sessionStorage.getItem(`smart_pe_profile_${schoolId.value}`)
  if (profileData) {
    try {
      const data = JSON.parse(profileData)
      Object.assign(editForm, data)
    } catch { /* ignore */ }
  }
  if (!editForm.name) {
    editForm.name = userInfo.value.name || '学校管理员'
  }
})

const saveProfile = () => {
  if (!editForm.name || !editForm.name.trim()) { ElMessage.warning('请输入显示名称'); return }
  sessionStorage.setItem(`smart_pe_profile_${schoolId.value}`, JSON.stringify({ ...editForm }))
  showEditDialog.value = false
  ElMessage.success('个人资料已保存')
}

const savePreferences = () => {
  ElMessage.success('偏好设置已保存')
}

const handleChangePassword = () => {
  passwordForm.oldPassword = ''
  passwordForm.newPassword = ''
  passwordForm.confirmPassword = ''
  showPasswordDialog.value = true
}

const validateOldPassword = (password) => {
  const usersKey = `users_${schoolId.value}`
  const storedUsers = sessionStorage.getItem(usersKey)
  if (!storedUsers) return false
  
  try {
    const users = JSON.parse(storedUsers)
    const matchedUser = users.find(
      u => u.username === userInfo.value.username && u.role === userInfo.value.role
    )
    if (!matchedUser) return false
    
    if (matchedUser.password) {
      return matchedUser.password === password
    }
    
    const defaultPassword = generateDefaultPassword(schoolId.value)
    return password === defaultPassword
  } catch {
    return false
  }
}

const changePassword = async () => {
  if (!passwordForm.oldPassword) {
    ElMessage.warning('请输入旧密码')
    return
  }
  
  if (!passwordForm.newPassword) {
    ElMessage.warning('请输入新密码')
    return
  }
  
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    ElMessage.warning('两次输入的新密码不一致')
    return
  }
  
  if (passwordForm.newPassword.length < 6) {
    ElMessage.warning('新密码长度不能少于6位')
    return
  }
  
  if (!validateOldPassword(passwordForm.oldPassword)) {
    ElMessage.error('旧密码不正确')
    return
  }
  
  const usersKey = `users_${schoolId.value}`
  let storedUsers = sessionStorage.getItem(usersKey)
  let users = []
  
  if (storedUsers) {
    try {
      users = JSON.parse(storedUsers)
    } catch {}
  }
  
  if (users.length === 0) {
    try {
      const { getDefaultUsersForSchool } = await import('../../mock/school-data/schoolUsers.js')
      users = getDefaultUsersForSchool(schoolId.value)
    } catch {
      ElMessage.error('密码修改失败：无法获取用户数据')
      return
    }
  }
  
  const matchedUser = users.find(
    u => u.username === userInfo.value.username && u.role === userInfo.value.role
  )
  
  if (matchedUser) {
    matchedUser.password = passwordForm.newPassword
    sessionStorage.setItem(usersKey, JSON.stringify(users))
    
    recordPasswordChangeLog()
    
    showPasswordDialog.value = false
    ElMessage({
      message: '密码修改成功，当前登录已失效，请重新登录',
      type: 'success',
      duration: 3000
    })
    
    setTimeout(() => {
      logout()
    }, 2000)
  } else {
    ElMessage.error('密码修改失败：未找到用户')
  }
}

const recordPasswordChangeLog = () => {
  const now = new Date()
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  
  const operator = userInfo.value.name || userInfo.value.username || '用户'
  const target = userInfo.value.username
  const detail = `用户自行修改密码`
  
  const userLogKey = `smart_pe_user_operation_logs_${schoolId.value}`
  const sysLogKey = `smart_pe_sys_operation_logs_${schoolId.value}`
  
  const newLog = {
    time: timeStr,
    operator,
    action: '修改密码',
    target,
    ip: getCachedIP(),
    device: 'Windows PC',
    result: '成功',
    detail
  }
  
  const userLogs = JSON.parse(sessionStorage.getItem(userLogKey) || '[]')
  userLogs.unshift(newLog)
  if (userLogs.length > 50) userLogs.pop()
  sessionStorage.setItem(userLogKey, JSON.stringify(userLogs))
  
  const sysLogs = JSON.parse(sessionStorage.getItem(sysLogKey) || '[]')
  sysLogs.unshift(newLog)
  if (sysLogs.length > 100) sysLogs.pop()
  sessionStorage.setItem(sysLogKey, JSON.stringify(sysLogs))
}

const refreshStats = () => {
  refreshCounter.value++
  ElMessage.success('数据已刷新')
}

const logout = () => {
  sessionStorage.removeItem(`smart_pe_token_${schoolId.value}`)
  sessionStorage.removeItem(`smart_pe_user_${schoolId.value}`)
  sessionStorage.removeItem('smart_pe_school')
  window.location.href = '/'
}
</script>

<style scoped>
.profile-page {
  padding: 24px;
  background: #F7F8FA;
  min-height: calc(100vh - 60px);
}

.profile-header {
  margin-bottom: 24px;
}

.user-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 32px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  gap: 24px;
}

.avatar-section {
  position: relative;
  flex-shrink: 0;
}

.user-avatar {
  background: #1E5AA8;
  color: #FFFFFF;
  font-size: 32px;
  font-weight: 600;
}

.role-badge {
  position: absolute;
  bottom: -4px;
  left: 50%;
  transform: translateX(-50%);
  padding: 2px 12px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 500;
  white-space: nowrap;
}

.badge-admin { background: #FEF3C7; color: #92400E; }
.badge-teacher { background: #DCFCE7; color: #166534; }
.badge-class { background: #DBEAFE; color: #1E40AF; }

.info-section {
  flex: 1;
}

.user-name {
  font-size: 24px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 12px 0;
}

.user-meta {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: #6B7280;
}

.meta-icon {
  font-size: 14px;
  color: #9CA3AF;
}

.actions-section {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.profile-content {
  display: grid;
  grid-template-columns: 360px 1fr;
  gap: 24px;
}

.card {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  margin-bottom: 24px;
  overflow: hidden;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border-bottom: 1px solid #E8EAED;
}

.card-icon {
  font-size: 18px;
  color: #1E5AA8;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  flex: 1;
}

.card-body {
  padding: 20px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F7F8FA;
}

.info-row:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 13px;
  color: #6B7280;
}

.info-value {
  font-size: 13px;
  color: #1A1A2E;
  font-weight: 500;
}

.security-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.security-row .el-progress {
  width: 120px;
}

.security-text {
  font-size: 12px;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 0;
  border-bottom: 1px solid #F7F8FA;
}

.setting-item:last-child {
  border-bottom: none;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.setting-label {
  font-size: 14px;
  color: #1A1A2E;
  font-weight: 500;
}

.setting-desc {
  font-size: 12px;
  color: #9CA3AF;
}

.quick-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.quick-action-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #F7F8FA;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 13px;
  color: #1A1A2E;
  transition: all 0.2s;
}

.quick-action-btn:hover {
  background: #EEF6FF;
  color: #1E5AA8;
}

.quick-action-btn el-icon {
  font-size: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.stat-card {
  text-align: center;
  padding: 20px 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  color: #1E5AA8;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 12px;
  color: #6B7280;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.activity-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}

.activity-dot.primary { background: #1E5AA8; }
.activity-dot.success { background: #10B981; }
.activity-dot.warning { background: #F5A623; }
.activity-dot.info { background: #6B7280; }

.activity-content {
  flex: 1;
}

.activity-text {
  display: block;
  font-size: 14px;
  color: #1A1A2E;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: #9CA3AF;
}

.notification-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.notification-icon {
  font-size: 18px;
  flex-shrink: 0;
}

.notification-icon.warning { color: #F5A623; }
.notification-icon.success { color: #10B981; }
.notification-icon.info { color: #3B82F6; }

.notification-content {
  flex: 1;
}

.notification-title {
  display: block;
  font-size: 13px;
  color: #1A1A2E;
  margin-bottom: 2px;
}

.notification-time {
  font-size: 11px;
  color: #9CA3AF;
}

.badge {
  background: #E85D4E;
  color: #FFFFFF;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 10px;
}

@media (max-width: 1024px) {
  .profile-content {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .user-card {
    flex-direction: column;
    text-align: center;
  }

  .user-meta {
    justify-content: center;
  }

  .actions-section {
    margin-top: 16px;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }
}
</style>