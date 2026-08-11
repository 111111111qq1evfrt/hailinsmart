/**
 * 全局状态管理
 * 使用Vue 3响应式API实现全局状态管理
 */

import { reactive, readonly } from 'vue'
import { getSchoolList } from '@/mock'

// 学校配置列表 - 从 mockDB 获取，保持数据一致性
export const schoolList = getSchoolList()

// 从 sessionStorage 恢复学校信息（每个标签页独立）
const savedSchool = JSON.parse(sessionStorage.getItem('smart_pe_school') || '{}')

// 从 sessionStorage 恢复用户信息（每个标签页独立，按学校隔离）
const savedUser = JSON.parse(sessionStorage.getItem(`smart_pe_user_${savedSchool.id || ''}`) || '{}')

// 全局状态
const state = reactive({
  // 加载状态
  loading: {
    count: 0,
    text: '加载中...'
  },

  // 错误状态
  error: {
    visible: false,
    message: ''
  },

  // 学校信息（多租户隔离）
  school: {
    id: savedSchool.id || '',
    name: savedSchool.name || '',
    logo: savedSchool.logo || '',
    primaryColor: savedSchool.primaryColor || '#1E5AA8',
    secondaryColor: savedSchool.secondaryColor || '#F5A623'
  },

  // 用户信息
  user: {
    id: savedUser.id || null,
    username: savedUser.username || '',
    name: savedUser.name || '',
    avatar: savedUser.avatar || '',
    role: savedUser.role || '',
    permissions: savedUser.permissions || []
  },

  // 系统配置
  config: {
    theme: 'light',
    language: 'zh-CN',
    sidebarCollapsed: false
  },

  // 运动推送数据（从大沩接收）
  sportsData: {
    list: [],
    todayStats: null,
    loading: false,
    error: null,
    lastUpdated: null
  }
})

// 状态操作方法
const actions = {
  // 加载状态控制
  startLoading(text = '加载中...') {
    state.loading.count++
    state.loading.text = text
  },
  
  stopLoading() {
    if (state.loading.count > 0) {
      state.loading.count--
    }
  },
  
  // 错误状态控制
  showError(message) {
    state.error.message = message
    state.error.visible = true
  },
  
  hideError() {
    state.error.visible = false
    state.error.message = ''
  },
  
  // 学校信息操作（多租户隔离）
  setSchool(school) {
    state.school = { ...state.school, ...school }
    // 保存到 sessionStorage（每个标签页独立）
    sessionStorage.setItem('smart_pe_school', JSON.stringify(school))
    // 更新主题色
    document.documentElement.style.setProperty('--school-primary', school.primaryColor)
    document.documentElement.style.setProperty('--school-secondary', school.secondaryColor)
  },

  clearSchool() {
    state.school = {
      id: '',
      name: '',
      logo: '',
      primaryColor: '#1E5AA8',
      secondaryColor: '#F5A623'
    }
    // 清除 sessionStorage
    sessionStorage.removeItem('smart_pe_school')
  },
  
  // 用户信息操作
  setUser(user) {
    state.user = { ...state.user, ...user }
  },
  
  clearUser() {
    state.user = {
      id: null,
      name: '',
      avatar: '',
      role: '',
      permissions: []
    }
  },
  
  hasPermission(permission) {
    return state.user.permissions.includes(permission)
  },
  
  // 主题切换
  toggleTheme() {
    state.config.theme = state.config.theme === 'light' ? 'dark' : 'light'
  },
  
  setTheme(theme) {
    state.config.theme = theme
  },
  
  // 语言切换
  setLanguage(language) {
    state.config.language = language
  },
  
  // 侧边栏状态
  toggleSidebar() {
    state.config.sidebarCollapsed = !state.config.sidebarCollapsed
  },
  
  setSidebarCollapsed(collapsed) {
    state.config.sidebarCollapsed = collapsed
  },

  // 运动推送数据操作
  async fetchSportsData(filters = {}) {
    const { default: sportsApi } = await import('@/utils/daiweiPushApi')
    const schoolId = state.school.id || ''
    if (!schoolId) {
      state.sportsData.error = '未选择学校'
      return
    }

    state.sportsData.loading = true
    state.sportsData.error = null
    try {
      const [listRes, statsRes] = await Promise.all([
        sportsApi.getList(schoolId, filters),
        sportsApi.getTodayStats(schoolId)
      ])

      if (listRes.code === '0') {
        state.sportsData.list = listRes.data.list
      }
      if (statsRes.code === '0') {
        state.sportsData.todayStats = statsRes.data
      }
      state.sportsData.lastUpdated = Date.now()
    } catch (err) {
      state.sportsData.error = err.message || '获取运动数据失败'
    } finally {
      state.sportsData.loading = false
    }
  },

  async refreshSportsData(filters = {}) {
    await actions.fetchSportsData(filters)
  },

  clearSportsData() {
    state.sportsData.list = []
    state.sportsData.todayStats = null
    state.sportsData.error = null
    state.sportsData.lastUpdated = null
  },
  
  // 重置状态
  resetState() {
    state.loading = { count: 0, text: '加载中...' }
    state.error = { visible: false, message: '' }
    state.school = { id: '', name: '', logo: '', primaryColor: '#1E5AA8', secondaryColor: '#F5A623' }
    state.user = { id: null, name: '', avatar: '', role: '', permissions: [] }
    state.config = { theme: 'light', language: 'zh-CN', sidebarCollapsed: false }
    state.sportsData = { list: [], todayStats: null, loading: false, error: null, lastUpdated: null }
  }
}

// 导出只读状态和操作方法
export const useGlobalState = () => ({
  state: readonly(state),
  actions
})

export default {
  state: readonly(state),
  ...actions
}