<template>
  <div class="app-container">
    <!-- 全屏加载遮罩 - 放在最外层，覆盖整个页面 -->
    <div v-if="isLoading" class="fullscreen-loading">
      <div class="loading-spinner">
        <div class="loader"></div>
        <p class="loading-text">加载中...</p>
      </div>
    </div>
    
    <!-- 登录页面 -->
    <router-view v-if="route.path === '/' || route.path === '/login'" />
    
    <!-- 全屏页面（可视化大屏等） -->
    <router-view v-else-if="isFullscreenPage" />
    
    <!-- 主应用布局 -->
    <el-container v-else>
      <el-header class="top-nav">
        <div class="nav-logo">
          <img :src="companyLogoUrl" alt="大准科技LOGO" class="logo-icon" width="160" height="40" decoding="async" />
        </div>
        <div ref="navTabsContainerRef" class="nav-tabs-container">
          <div ref="navTabsRef" class="nav-tabs">
            <div
              v-for="item in displayedNavModules"
              :key="item.key"
              :class="['nav-tab', { active: activeModule === item.key }]"
              @click="switchModule(item.key)"
            >
              <el-icon><component :is="item.icon" /></el-icon>
              <span class="nav-tab-label">{{ item.label }}</span>
            </div>
          </div>
          <el-dropdown
            v-if="hiddenNavModules.length > 0"
            trigger="click"
            @command="switchModule"
          >
            <div class="nav-tab overflow-tab">
              <el-icon><More /></el-icon>
              <span>更多</span>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item
                  v-for="item in hiddenNavModules"
                  :key="item.key"
                  :command="item.key"
                >
                  <el-icon><component :is="item.icon" /></el-icon>
                  <span>{{ item.label }}</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="nav-user">
          <div class="school-info">
            <el-icon><School /></el-icon>
            <span class="school-name-full">{{ currentSchool }}</span>
            <span class="school-name-short">{{ schoolFirstChar }}</span>
          </div>
          <!-- 通知铃铛 -->
          <el-popover
            v-if="store.state.user.username"
            placement="bottom-end"
            :width="380"
            trigger="click"
            popper-class="notification-popover"
            @show="loadNotifications"
          >
            <template #reference>
              <div class="notification-bell" :class="{ 'has-unread': unreadCount > 0 }">
                <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
                  <el-icon :size="20"><Bell /></el-icon>
                </el-badge>
              </div>
            </template>
            <div class="notification-panel">
              <div class="notification-header">
                <span class="notification-title">消息通知</span>
                <div class="notification-actions">
                  <el-button text type="primary" size="small" @click="markAllAsRead" v-if="unreadCount > 0">全部已读</el-button>
                  <el-button text type="danger" size="small" @click="clearNotifications" v-if="notifications.length > 0">清空</el-button>
                </div>
              </div>
              <div class="notification-list" v-if="notifications.length > 0">
                <div
                  v-for="notif in notifications"
                  :key="notif.id"
                  class="notification-item"
                  :class="{ unread: !notif.read }"
                  @click="markAsRead(notif.id)"
                >
                  <div class="notif-icon" :class="notif.type">
                    <el-icon><Bell /></el-icon>
                  </div>
                  <div class="notif-content">
                    <div class="notif-title">{{ notif.title }}</div>
                    <div class="notif-text">{{ notif.content }}</div>
                    <div class="notif-meta">
                      <span class="notif-sender">{{ notif.sender }}</span>
                      <span class="notif-time">{{ formatNotifTime(notif.createTime) }}</span>
                    </div>
                  </div>
                  <div class="notif-status">
                    <el-tag v-if="notif.read" type="info" size="small">已读</el-tag>
                    <el-tag v-else type="danger" size="small">未读</el-tag>
                  </div>
                </div>
              </div>
              <div class="notification-empty" v-else>
                <el-icon :size="40" color="#D1D5DB"><Bell /></el-icon>
                <p>暂无通知</p>
              </div>
            </div>
          </el-popover>
          <el-dropdown @command="handleUserCommand">
            <div class="user-info">
              <el-avatar :size="32" class="nav-avatar">{{ userAvatar }}</el-avatar>
              <span class="user-name-full">{{ currentUser }}</span>
              <span class="user-name-short">{{ userFirstChar }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="password">修改密码</el-dropdown-item>
                <el-dropdown-item command="version">版本信息</el-dropdown-item>
                <el-dropdown-item command="service">联系客服</el-dropdown-item>
                <el-dropdown-item divided command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-container class="main-container">
        <el-aside v-if="activeModule !== 'home'" :width="isCollapse ? '64px' : '200px'" class="side-menu">
          <div class="collapse-btn" @click="toggleCollapse">
            <el-icon><Fold v-if="!isCollapse" /><Expand v-else /></el-icon>
          </div>
          <el-menu
            :default-active="activeRoute"
            class="el-menu-vertical"
            :collapse="isCollapse"
            :collapse-transition="false"
            :router="true"
          >
            <el-menu-item v-for="item in currentMenuItems" :key="item.path" :index="item.path">
              <el-icon><component :is="item.icon" /></el-icon>
              <template #title>{{ item.label }}</template>
            </el-menu-item>
          </el-menu>
        </el-aside>

        <el-main :class="['main-content', { 'full-width': activeModule === 'home' }]">
          <!-- ===== GSAP 路由过渡 ===== -->
          <router-view v-slot="{ Component }">
            <transition
              name="page"
              mode="out-in"
              @before-leave="onBeforeLeave"
              @leave="onLeave"
              @enter="onEnter"
              @after-enter="onAfterEnter"
            >
              <keep-alive :include="cachedViews">
                <component :is="Component" :key="route.fullPath" />
              </keep-alive>
            </transition>
          </router-view>
          <!-- ======================== -->
        </el-main>
      </el-container>
    </el-container>

    <el-dialog v-model="passwordDialogVisible" title="修改密码" width="400px">
      <el-form :model="passwordForm" label-width="90px" :rules="passwordRules" ref="passwordFormRef">
        <el-form-item label="原密码" prop="oldPassword">
          <el-input v-model="passwordForm.oldPassword" type="password" placeholder="请输入原密码" show-password />
        </el-form-item>
        <el-form-item label="新密码" prop="newPassword">
          <el-input v-model="passwordForm.newPassword" type="password" placeholder="请输入新密码" show-password />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="passwordForm.confirmPassword" type="password" placeholder="请再次输入新密码" show-password />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="passwordDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitPasswordChange">确认修改</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="basicSettingsVisible" title="个人中心" width="450px">
      <div class="basic-settings">
        <div class="setting-section">
          <h4 class="section-title">账户信息</h4>
          <div class="info-row">
            <span class="info-label">用户名</span>
            <span class="info-value">{{ store.state.user.username || 'admin' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">姓名</span>
            <span class="info-value">{{ store.state.user.name || '-' }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">角色</span>
            <span class="info-value">{{ getRoleLabel(store.state.user.role) }}</span>
          </div>
          <div class="info-row">
            <span class="info-label">所属学校</span>
            <span class="info-value">{{ store.state.school.name || '-' }}</span>
          </div>
        </div>
        <div class="setting-section">
          <h4 class="section-title">快捷操作</h4>
          <div class="action-buttons">
            <el-button size="small" type="primary" @click="openPasswordDialog(); basicSettingsVisible.value = false">修改密码</el-button>
            <el-button size="small" @click="handleMoreSettings">更多设置</el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="basicSettingsVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="versionDialogVisible" title="版本信息" width="480px">
      <div class="version-panel">
        <div class="version-header">
          <span class="version-name">智慧体育评测教学系统</span>
          <el-tag type="success">v{{ appVersion.current }}</el-tag>
        </div>
        <div class="version-meta">
          <p>最新版本：<strong>v{{ appVersion.latest }}</strong></p>
          <p>发布日期：{{ appVersion.releaseDate }}</p>
          <p v-if="hasNewVersion" class="update-tip">检测到新版本，建议更新</p>
          <p v-else class="uptodate-tip">当前已是最新版本</p>
        </div>
        <div class="changelog">
          <h4>更新日志</h4>
          <ul>
            <li v-for="(item, index) in appVersion.changelog" :key="index">{{ item }}</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <el-button @click="versionDialogVisible = false">关闭</el-button>
        <el-button v-if="hasNewVersion" type="primary" @click="confirmUpdate">立即更新</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="serviceDialogVisible" title="在线客服" width="520px">
      <el-form :model="serviceForm" label-width="90px">
        <el-form-item label="反馈类型">
          <el-select v-model="serviceForm.type" placeholder="请选择反馈类型" style="width: 100%">
            <el-option label="功能建议" value="feature" />
            <el-option label="问题反馈" value="bug" />
            <el-option label="使用咨询" value="help" />
            <el-option label="售后服务" value="service" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="serviceForm.contact" placeholder="手机号或邮箱" />
        </el-form-item>
        <el-form-item label="问题描述">
          <el-input
            v-model="serviceForm.content"
            type="textarea"
            :rows="5"
            placeholder="请详细描述您的需求或遇到的问题"
          />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload action="#" :auto-upload="false" :limit="3">
            <el-button size="small">上传截图/文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <div class="service-info">
        <p>客服热线：400-888-6666（周一至周日 9:00-21:00）</p>
        <p>邮箱支持：support@smartpe.com（24小时内回复）</p>
        <p>平均响应时间：≤ 2 小时</p>
      </div>
      <template #footer>
        <el-button @click="serviceDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitServiceFeedback">提交反馈</el-button>
      </template>
    </el-dialog>

    <!-- AI 助手组件 - 已暂时关闭 -->
    <!-- <AiAssistant /> -->
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, markRaw, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import gsap from 'gsap'
import {
  Odometer, User, Trophy, Medal, Basketball,
  Star, VideoCamera, DataLine, Setting, Bell,
  ArrowDown, Fold, Expand, UserFilled,
  Grid, Document, Collection, Histogram,
  Calendar, FirstAidKit, Lock, Link, VideoPlay, More, School, DataAnalysis,
  Monitor, Promotion, Service, Connection, Tools
} from '@element-plus/icons-vue'
// import AiAssistant from '@/components/common/AiAssistant.vue'
import store from '@/store/global'
import { generateDefaultPassword } from '@/mock/passwordUtils'
import { useNotifications } from '@/composables/useNotifications'
import { generateDeterministicId } from '@/utils/seededRandom'
import { getCachedIP } from '@/utils/clientInfo'

const companyLogoUrl = '/%E5%A4%A7%E5%87%86%E7%A7%91%E6%8A%80LOGO.png'

const route = useRoute()
const router = useRouter()
const isCollapse = ref(false)
const activeRoute = ref('/home')
const activeModule = ref('home')
const isLoading = ref(false)

// ==================== GSAP 路由过渡配置 ====================
// 可选预设：'slide'（推荐） | 'zoom' | 'lift'
const transitionPreset = ref('slide')

const presetConfig = {
  // 推荐：左右滑入，有方位感，适合后台管理系统
  slide: {
    leave:  { x: -40, opacity: 0, scale: 0.97, duration: 0.22, ease: 'power2.in' },
    enter:  { x: 40, opacity: 0, scale: 0.97, duration: 0.38, ease: 'power3.out' }
  },
  // 柔和：缩放淡入，适合数据看板
  zoom: {
    leave:  { scale: 0.92, opacity: 0, duration: 0.2, ease: 'power2.in' },
    enter:  { scale: 0.92, opacity: 0, duration: 0.4, ease: 'back.out(1.4)' }
  },
  // 轻盈：上下滑入，适合表单页
  lift: {
    leave:  { y: -15, opacity: 0, duration: 0.2, ease: 'power2.in' },
    enter:  { y: 25, opacity: 0, duration: 0.35, ease: 'power3.out' }
  }
}

const onBeforeLeave = (el) => {
  gsap.set(el, { willChange: 'transform, opacity' })
}

const onLeave = (el, done) => {
  const cfg = presetConfig[transitionPreset.value].leave
  gsap.to(el, {
    ...cfg,
    onComplete: done
  })
}

const onEnter = (el, done) => {
  const cfg = presetConfig[transitionPreset.value].enter
  gsap.fromTo(el,
    { x: cfg.x, y: cfg.y, scale: cfg.scale, opacity: 0 },
    {
      x: 0,
      y: 0,
      scale: 1,
      opacity: 1,
      duration: cfg.duration,
      ease: cfg.ease,
      clearProps: 'willChange',
      onComplete: done
    }
  )
}

const onAfterEnter = (el) => {
  gsap.set(el, { clearProps: 'all' })
}
// ========================================================

// 全屏页面列表（不需要侧边栏和顶栏）
const fullscreenPages = ['/data/visualization']
const isFullscreenPage = computed(() => fullscreenPages.includes(route.path))

// 通知系统
const { notifications, unreadCount, loadNotifications, markAsRead, markAllAsRead, clearAll: clearNotifications } = useNotifications()

// 格式化通知时间
const formatNotifTime = (isoString) => {
  if (!isoString) return ''
  const date = new Date(isoString)
  const now = new Date()
  const diff = now - date
  if (diff < 60000) return '刚刚'
  if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const navModules = [
  { key: 'home', label: '系统概览', icon: markRaw(Odometer) },
  { key: 'system', label: '系统管理', icon: markRaw(Grid) },
  { key: 'test', label: '测试模块', icon: markRaw(Trophy) },
  { key: 'evaluation', label: '评价分析', icon: markRaw(Star) },
  { key: 'data', label: '数据平台', icon: markRaw(Histogram) },
  { key: 'more', label: '智慧体育助手软件', icon: markRaw(More), isExternal: true, url: 'https://daweiai.net/weifuture_app/#/login' }
]

const navTabsContainerRef = ref(null)
const overflowHiddenModules = ref([])

const detectOverflow = () => {
  const container = document.querySelector('.nav-tabs-container')
  if (!container) return

  const containerWidth = container.clientWidth

  if (containerWidth < 140) {
    overflowHiddenModules.value = [...visibleNavModules.value]
    return
  }

  overflowHiddenModules.value = []

  nextTick(() => {
    const tabsWrap = container.querySelector('.nav-tabs')
    if (!tabsWrap) return

    const scrollWidth = tabsWrap.scrollWidth
    if (scrollWidth <= containerWidth) {
      overflowHiddenModules.value = []
      return
    }

    const overflowBtnWidth = 88
    const remaining = containerWidth - overflowBtnWidth

    let usedWidth = 0
    const visible = []
    const hidden = []

    for (let i = 0; i < visibleNavModules.value.length; i++) {
      const tabEl = tabsWrap.children[i]
      const tabWidth = tabEl ? tabEl.offsetWidth + 8 : 95

      if (usedWidth + tabWidth > remaining) {
        hidden.push(visibleNavModules.value[i])
      } else {
        visible.push(visibleNavModules.value[i])
        usedWidth += tabWidth
      }
    }

    if (visible.length > 0) {
      overflowHiddenModules.value = hidden
    } else {
      overflowHiddenModules.value = [...visibleNavModules.value]
    }
  })
}

const displayedNavModules = computed(() => {
  return visibleNavModules.value.filter(m => !overflowHiddenModules.value.includes(m))
})

const hiddenNavModules = computed(() => {
  return overflowHiddenModules.value
})

let resizeObserver = null

const currentUser = computed(() => {
  const schoolId = store.state.school.id || ''
  const stored = sessionStorage.getItem(`smart_pe_user_${schoolId}`)
  if (stored) {
    try {
      const user = JSON.parse(stored)
      return user.name || user.username || store.state.user.name || '管理员'
    } catch {}
  }
  return store.state.user.name || '管理员'
})

const userAvatar = computed(() => {
  const schoolId = store.state.school.id || ''
  const stored = sessionStorage.getItem(`smart_pe_user_${schoolId}`)
  if (stored) {
    try {
      const user = JSON.parse(stored)
      return user.avatar || (user.name || user.username || '管').charAt(0)
    } catch {}
  }
  return (store.state.user.name || '管').charAt(0)
})

const currentSchool = computed(() => {
  if (!store.state.school.id) return ''
  return store.state.school.name
})

const schoolFirstChar = computed(() => {
  const name = currentSchool.value
  return name ? name.charAt(0) : ''
})
const userFirstChar = computed(() => {
  const name = currentUser.value
  return name ? name.charAt(0) : ''
})

// 缓存的页面列表 - 使用路由名称作为缓存key
const cachedViews = ref([
  'Dashboard',
  'SportsExam', 'NationalTest', 'FreePractice', 'TestTerminal', 'TeachingVideos',
  'AssessmentManagement', 'TeachingManagement', 'LeaderPanel',
  'DataPlatform'
])

const rolePermissions = {
  district: {
    modules: ['system', 'test', 'evaluation', 'data'],
    menus: {
      system: ['/system/users', '/system/students', '/system/devices', '/system/workorders', '/system/resources', '/system/notifications', '/system/settings', '/system/version', '/system/feedback'],
      test: ['/exam', '/national-test', '/practice', '/test-terminal', '/teaching-videos'],
      evaluation: ['/evaluation/assessment', '/evaluation/teaching', '/evaluation/leader'],
      data: ['/data/overview', '/data/student', '/data/analysis', '/data/health', '/data/maintenance', '/data/parent', '/data/visualization']
    }
  },
  school: {
    modules: ['system', 'test', 'evaluation', 'data'],
    menus: {
      system: ['/system/users', '/system/students', '/system/devices', '/system/workorders', '/system/resources', '/system/notifications', '/system/settings', '/system/version', '/system/feedback'],
      test: ['/exam', '/national-test', '/practice', '/test-terminal', '/teaching-videos'],
      evaluation: ['/evaluation/assessment', '/evaluation/teaching', '/evaluation/leader'],
      data: ['/data/overview', '/data/student', '/data/analysis', '/data/health', '/data/maintenance', '/data/parent', '/data/visualization']
    }
  },
  campus: {
    modules: ['test', 'evaluation', 'data'],
    menus: {
      test: ['/exam', '/national-test', '/practice', '/test-terminal', '/teaching-videos'],
      evaluation: ['/evaluation/assessment', '/evaluation/teaching'],
      data: ['/data/overview', '/data/student', '/data/health', '/data/parent', '/data/visualization']
    }
  },
  admin_teacher: {
    modules: ['system', 'test', 'evaluation', 'data'],
    menus: {
      system: ['/system/students', '/system/notifications', '/system/feedback'],
      test: ['/exam', '/national-test', '/practice', '/teaching-videos'],
      evaluation: ['/evaluation/assessment', '/evaluation/teaching'],
      data: ['/data/student', '/data/health', '/data/parent', '/data/visualization']
    }
  },
  teacher: {
    modules: ['test', 'evaluation', 'data'],
    menus: {
      test: ['/practice', '/test-terminal', '/teaching-videos'],
      evaluation: ['/evaluation/assessment'],
      data: ['/data/student', '/data/health', '/data/visualization']
    }
  },
  class: {
    modules: ['test', 'evaluation', 'data'],
    menus: {
      test: ['/practice', '/teaching-videos'],
      evaluation: ['/evaluation/assessment'],
      data: ['/data/student', '/data/health', '/data/visualization']
    }
  }
}

const currentRole = computed(() => {
  const schoolId = store.state.school.id || ''
  const stored = sessionStorage.getItem(`smart_pe_user_${schoolId}`)
  if (stored) {
    try {
      const user = JSON.parse(stored)
      return user.role || 'school'
    } catch {}
  }
  return store.state.user.role || 'school'
})

const menuConfig = {
  system: [
    { path: '/system/users', label: '用户管理', icon: markRaw(UserFilled) },
    { path: '/system/students', label: '学生管理', icon: markRaw(User) },
    { path: '/system/devices', label: '设备管理', icon: markRaw(Monitor) },
    { path: '/system/workorders', label: '工单管理', icon: markRaw(Document) },
    { path: '/system/resources', label: '资源管理', icon: markRaw(Link) },
    { path: '/system/notifications', label: '通知中心', icon: markRaw(Bell) },
    { path: '/system/settings', label: '系统设置', icon: markRaw(Setting) },
    { path: '/system/version', label: '版本管理', icon: markRaw(Promotion) },
    { path: '/system/feedback', label: '客服反馈', icon: markRaw(Service) }
  ],
  test: [
    { path: '/exam', label: '体育考试', icon: markRaw(Trophy) },
    { path: '/national-test', label: '国家体测', icon: markRaw(Medal) },
    { path: '/practice', label: '自由练习', icon: markRaw(Basketball) },
    { path: '/test-terminal', label: '测试终端', icon: markRaw(VideoCamera) },
    { path: '/teaching-videos', label: '教学视频', icon: markRaw(VideoPlay) }
  ],
  evaluation: [
    { path: '/evaluation/assessment', label: '评价管理', icon: markRaw(Star) },
    { path: '/evaluation/teaching', label: '教学管理', icon: markRaw(VideoCamera) },
    { path: '/evaluation/leader', label: '校领导面板', icon: markRaw(DataLine) }
  ],
  data: [
    { path: '/data/overview', label: '数据总览', icon: markRaw(DataLine) },
    { path: '/data/student', label: '学生数据中心', icon: markRaw(Histogram) },
    { path: '/data/analysis', label: '数据分析中心', icon: markRaw(DataAnalysis) },
    { path: '/data/health', label: '健康监测看板', icon: markRaw(FirstAidKit) },
    { path: '/data/maintenance', label: '维修数据分析', icon: markRaw(Tools) },
    { path: '/data/visualization', label: '可视化大屏', icon: markRaw(Monitor) }
  ]
}
const visibleNavModules = computed(() => {
  const role = currentRole.value
  const permissions = rolePermissions[role] || rolePermissions.school
  return navModules.filter(m => m.key === 'home' || m.key === 'more' || permissions.modules.includes(m.key))
})

const currentMenuItems = computed(() => {
  const role = currentRole.value
  const permissions = rolePermissions[role] || rolePermissions.school
  const moduleMenus = menuConfig[activeModule.value] || []
  
  if (permissions.menus[activeModule.value]) {
    const allowedPaths = permissions.menus[activeModule.value]
    return moduleMenus.filter(item => allowedPaths.includes(item.path))
  }
  
  return moduleMenus
})

const switchModule = (key) => {
  const module = navModules.find(m => m.key === key)
  if (module && module.isExternal && module.url) {
    window.open(module.url, '_blank')
    return
  }
  
  activeModule.value = key
  
  let targetPath = '/home'
  if (key !== 'home' && menuConfig[key] && menuConfig[key].length > 0) {
    targetPath = menuConfig[key][0].path
  }
  
  if (route.path !== targetPath) {
    router.push(targetPath).then(() => {
      activeRoute.value = targetPath
    }).catch(() => {
      activeRoute.value = targetPath
    })
  } else {
    activeRoute.value = targetPath
  }
}

// 监听路由变化，显示加载状态
watch(
  () => route.path,
  (path) => {
    activeRoute.value = path
    
    let matchedModule = 'home'
    for (const [key, items] of Object.entries(menuConfig)) {
      if (items.some(item => item.path === path)) {
        matchedModule = key
        break
      }
    }
    
    if (activeModule.value !== matchedModule) {
      activeModule.value = matchedModule
    }

    // 重置页面滚动到顶部（解决 el-main 容器滚动问题）
    setTimeout(() => {
      const mainContent = document.querySelector('.main-content')
      if (mainContent) {
        mainContent.scrollTop = 0
      }
    }, 350)
  }
)

const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value
}

const passwordDialogVisible = ref(false)
const passwordFormRef = ref(null)
const passwordForm = ref({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validateConfirmPassword = (rule, value, callback) => {
  if (value !== passwordForm.value.newPassword) {
    callback(new Error('两次输入的密码不一致'))
  } else {
    callback()
  }
}

const passwordRules = {
  oldPassword: [{ required: true, message: '请输入原密码', trigger: 'blur' }],
  newPassword: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请再次输入新密码', trigger: 'blur' },
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const openPasswordDialog = () => {
  passwordDialogVisible.value = true
}

const submitPasswordChange = async () => {
  try {
    await passwordFormRef.value.validate()
  } catch (e) {
    return
  }
  
  const schoolId = store.state.school.id || 'hailin-second-primary'
  const user = store.state.user
  const defaultPassword = generateDefaultPassword(schoolId)
  
  if (!validateOldPassword(passwordForm.value.oldPassword, user, schoolId)) {
    ElMessage.error('原密码不正确')
    return
  }
  
  const usersKey = `users_${schoolId}`
  let storedUsers = sessionStorage.getItem(usersKey)
  let users = []
  
  if (storedUsers) {
    try {
      users = JSON.parse(storedUsers)
    } catch {}
  }
  
  if (users.length === 0) {
    try {
      const { getDefaultUsersForSchool } = await import('@/mock/school-data/schoolUsers')
      users = getDefaultUsersForSchool(schoolId)
      users = users.map(u => ({ ...u, password: u.password || defaultPassword }))
    } catch {
      ElMessage.error('密码修改失败：无法获取用户数据')
      return
    }
  }
  
  const matchedUser = users.find(u => u.username === user.username)
  
  if (matchedUser) {
    matchedUser.password = passwordForm.value.newPassword
    sessionStorage.setItem(usersKey, JSON.stringify(users))
    
    recordPasswordChangeLog(user, schoolId)
    
    passwordDialogVisible.value = false
    passwordForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
    
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

const validateOldPassword = (password, user, schoolId) => {
  const usersKey = `users_${schoolId}`
  const storedUsers = sessionStorage.getItem(usersKey)
  const defaultPassword = generateDefaultPassword(schoolId)
  
  if (storedUsers) {
    try {
      const users = JSON.parse(storedUsers)
      const matchedUser = users.find(u => u.username === user.username)
      if (matchedUser) {
        if (matchedUser.password) {
          return matchedUser.password === password
        }
        return password === defaultPassword
      }
    } catch {}
  }
  
  return password === defaultPassword
}

const recordPasswordChangeLog = (user, schoolId) => {
  const now = new Date()
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`
  
  const operator = user.name || user.username || '用户'
  const target = user.username
  
  const sysLogKey = `smart_pe_sys_operation_logs_${schoolId}`
  
  const newLog = {
    time: timeStr,
    userName: operator,
    userId: user.id || 'admin',
    type: 'update',
    module: 'user',
    description: `修改密码 - ${target}`,
    status: 'success',
    ip: getCachedIP(),
    device: 'Windows PC'
  }
  
  const sysLogs = JSON.parse(sessionStorage.getItem(sysLogKey) || '[]')
  sysLogs.unshift(newLog)
  if (sysLogs.length > 100) sysLogs.pop()
  sessionStorage.setItem(sysLogKey, JSON.stringify(sysLogs))
}

const logout = () => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  const userName = store.state.user.name || '管理员'
  const userId = store.state.user.id || 'admin001'

  const now = new Date()
  const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`

  const sysLog = {
    id: generateDeterministicId('log', 'logout_' + userId),
    time: timeStr,
    userName,
    userId,
    ip: getCachedIP(),
    module: 'system',
    type: 'logout',
    description: `退出登录 - ${userName}`,
    status: 'success',
    data: JSON.stringify({ action: '退出登录', target: userName, detail: '正常退出系统' }),
    error: ''
  }
  const sysLogsKey = `smart_pe_sys_operation_logs_${schoolId}`
  let sysLogs = []
  try { sysLogs = JSON.parse(sessionStorage.getItem(sysLogsKey) || '[]') } catch {}
  sysLogs.unshift(sysLog)
  if (sysLogs.length > 100) sysLogs.pop()
  sessionStorage.setItem(sysLogsKey, JSON.stringify(sysLogs))

  sessionStorage.removeItem(`smart_pe_user_${schoolId}`)
  sessionStorage.removeItem(`smart_pe_token_${schoolId}`)
  localStorage.removeItem('token')
  sessionStorage.removeItem('token')
  store.clearSchool()
  ElMessage.success('已退出登录')
  window.location.href = '/'
}

const goToProfile = () => {
  router.push('/profile')
}

const handleUserCommand = (command) => {
  switch (command) {
    case 'profile':
      basicSettingsVisible.value = true
      break
    case 'password':
      openPasswordDialog()
      break
    case 'version':
      openVersionDialog()
      break
    case 'service':
      openServiceDialog()
      break
    case 'logout':
      logout()
      break
  }
}

const handleMoreSettings = () => {
  basicSettingsVisible.value = false
  router.push('/system/settings?tab=profile')
}

const versionDialogVisible = ref(false)
const serviceDialogVisible = ref(false)
const basicSettingsVisible = ref(false)

const getRoleLabel = (role) => {
  const roleMap = {
    district: '区管理员',
    school: '学校管理员',
    campus: '校园代理',
    admin_teacher: '行政老师',
    teacher: '班主任',
    class: '班级管理员'
  }
  return roleMap[role] || role
}

const getDefaultVersions = () => ({
  'hailin-second-primary': {
    current: 'v2.1.3',
    latest: 'v2.2.0',
    releaseDate: '2026-07-15',
    changelog: ['新增家长通知门户功能', '优化健康监测看板', '新增设备定时任务', '修复多处已知问题'],
    size: '32.1MB'
  },
  'hailin-zirong-primary': {
    current: 'v2.0.5',
    latest: 'v2.2.0',
    releaseDate: '2026-07-15',
    changelog: ['新增家长通知门户功能', '优化健康监测看板'],
    size: '32.1MB'
  },
  'linhai-experimental-primary': {
    current: 'v2.2.0',
    latest: 'v2.2.0',
    releaseDate: '2026-07-15',
    changelog: ['新增家长通知门户', '优化健康监测'],
    size: '32.1MB'
  }
})

const currentSchoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const appVersion = computed(() => {
  const versions = getDefaultVersions()
  const schoolData = versions[currentSchoolId.value] || versions['hailin-second-primary']
  const savedVersion = localStorage.getItem('app_version')
  const current = savedVersion || schoolData.current
  return {
    current: current.replace(/^v/, ''),
    latest: schoolData.latest.replace(/^v/, ''),
    releaseDate: schoolData.releaseDate,
    changelog: schoolData.changelog.map(c => `${schoolData.latest}：${c}`)
  }
})

const hasNewVersion = computed(() => appVersion.value.current !== appVersion.value.latest)

const serviceForm = ref({
  type: 'help',
  contact: '',
  content: ''
})

const openVersionDialog = () => {
  versionDialogVisible.value = true
}

const openServiceDialog = () => {
  serviceDialogVisible.value = true
}

const confirmUpdate = () => {
  ElMessageBox.confirm(
    `确定更新到 v${appVersion.value.latest} 吗？更新过程中请勿关闭页面。`,
    '版本更新确认',
    { confirmButtonText: '确认更新', cancelButtonText: '稍后更新', type: 'info' }
  ).then(() => {
    localStorage.setItem('app_version', `v${appVersion.value.latest}`)
    ElMessage.success(`已成功更新到 v${appVersion.value.latest}`)
    versionDialogVisible.value = false
  }).catch(() => {
    ElMessage.info('已取消更新')
  })
}

const submitServiceFeedback = () => {
  if (!serviceForm.value.content.trim()) {
    ElMessage.warning('请填写问题描述')
    return
  }
  ElMessage.success('反馈已提交，客服将在2小时内与您联系')
  serviceForm.value = { type: 'help', contact: '', content: '' }
  serviceDialogVisible.value = false
}

const initActiveModule = () => {
  let matchedModule = 'home'
  for (const [key, items] of Object.entries(menuConfig)) {
    if (items.some(item => item.path === route.path)) {
      matchedModule = key
      break
    }
  }
  activeModule.value = matchedModule
  activeRoute.value = route.path
}

onMounted(() => {
  if (hasNewVersion.value && route.path !== '/') {
    setTimeout(() => {
      ElMessage({
        message: `发现新版本 v${appVersion.value.latest}，可在用户菜单中查看`,
        type: 'info',
        duration: 5000
      })
    }, 1500)
  }

  nextTick(() => {
    initActiveModule()
    
    setTimeout(() => {
      detectOverflow()
      window.addEventListener('resize', detectOverflow)
    }, 500)
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', detectOverflow)
})
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: "PingFang SC", "Microsoft YaHei", -apple-system, sans-serif;
  overflow-x: hidden;
  max-width: 100vw;
}

#app {
  height: 100%;
  max-width: 100vw;
}

/* ========== 全局 el-tabs 动画增强（零侵入） ========== */

/* 1. 下划线丝滑滑动 —— 所有页面立刻生效 */
.el-tabs__active-bar {
  transition: transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1),
              width 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) !important;
}

/* 2. Tab 文字颜色过渡 */
.el-tabs__item {
  transition: color 0.2s ease;
}

/* 3. 内容区防止切换时闪动 */
.el-tabs__content {
  overflow-x: hidden;
}
</style>

<style scoped>
.app-container {
  height: 100%;
}

.top-nav {
  display: flex;
  align-items: center;
  height: 60px;
  background: #FFFFFF;
  border-bottom: 1px solid #E8EAED;
  padding: 0 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.nav-logo {
  display: flex;
  align-items: center;
  gap: 20px;
  margin-right: 48px;
}

.logo-icon {
  height: 40px;
  width: auto;
  margin-left: 15px;
}

.nav-tabs-container {
  display: flex;
  align-items: center;
  gap: 4px;
  flex: 1;
  overflow: hidden;
}

.nav-tabs {
  display: flex;
  gap: 8px;
  flex-wrap: nowrap;
  min-width: 0;
}

.nav-tab-label {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.4;
}

.nav-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  color: #6B7280;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  flex-shrink: 0;
  white-space: nowrap;
  min-width: fit-content;
}

.nav-tab:hover {
  background: #EEF6FF;
  color: #1E5AA8;
}

.nav-tab.active {
  background: #EEF6FF;
  color: #1E5AA8;
  border-bottom: 2px solid #1E5AA8;
}

.nav-tab .el-icon {
  font-size: 18px;
}

.nav-tab.overflow-tab {
  background: #EEF6FF;
  color: #1E5AA8;
  flex-shrink: 0;
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 16px;
}

.nav-avatar {
  background: #1E5AA8;
  color: #FFFFFF;
  font-size: 14px;
  font-weight: 600;
}

.school-info {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #F0FDF4;
  border-radius: 6px;
  color: #1E5AA8;
  font-size: 13px;
  font-weight: 500;
}

.school-info .el-icon {
  font-size: 16px;
}

.school-name-full {
  display: inline;
}
.school-name-short {
  display: none;
}
.user-name-full {
  display: inline;
}
.user-name-short {
  display: none;
}

@media (max-width: 768px) {
  .school-name-full {
    display: none;
  }
  .school-name-short {
    display: inline;
    font-size: 15px;
    font-weight: 600;
  }
  .user-name-full {
    display: none;
  }
  .user-name-short {
    display: inline;
    font-size: 15px;
    font-weight: 600;
  }
  .school-info {
    padding: 6px 10px;
  }
  .user-info {
    padding: 8px 10px;
  }
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.3s;
}

.user-info:hover {
  background: #F7F8FA;
}

.user-name {
  font-size: 14px;
  color: #1A1A2E;
}

.main-container {
  height: calc(100vh - 60px);
}

.side-menu {
  background: #FFFFFF;
  border-right: 1px solid #E8EAED;
  transition: width 0.3s;
  overflow: hidden;
}

.collapse-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 48px;
  cursor: pointer;
  color: #6B7280;
  border-bottom: 1px solid #E8EAED;
}

.collapse-btn:hover {
  color: #1E5AA8;
}

.el-menu-vertical {
  border: none;
  padding-top: 8px;
}

.el-menu-item {
  height: 48px;
  line-height: 48px;
  color: #6B7280;
  margin: 2px 8px;
  border-radius: 8px;
}

.el-menu-item:hover {
  background: #EEF6FF;
  color: #1E5AA8;
}

.el-menu-item.is-active {
  background: #EEF6FF;
  color: #1E5AA8;
  border-left: 3px solid #1E5AA8;
  margin-left: 5px;
}

.main-content {
  background: #F7F8FA;
  padding: 20px;
  overflow-y: auto;
  overflow-x: hidden;   /* 防止 GSAP 位移动画时出现横向滚动条 */
  position: relative;
}

.main-content.full-width {
  padding: 0;
}

/* 全屏加载状态 - 覆盖整个页面 */
.fullscreen-loading {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #F7F8FA;
  z-index: 9999;
  pointer-events: auto;
  overflow: hidden;
}

.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-text {
  font-size: 14px;
  color: #6B7280;
}

.loader {
  width: 48px;
  height: 48px;
  border: 4px solid #E8EAED;
  border-top-color: #1E5AA8;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.version-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.version-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.version-name {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.version-meta p {
  margin: 4px 0;
  font-size: 14px;
  color: #6B7280;
}

.update-tip {
  color: #F5A623 !important;
  font-weight: 500;
}

.uptodate-tip {
  color: #1E5AA8 !important;
}

.changelog h4 {
  margin: 0 0 8px;
  font-size: 14px;
  color: #1A1A2E;
}

.changelog ul {
  margin: 0;
  padding-left: 20px;
  color: #6B7280;
  font-size: 13px;
  line-height: 1.8;
}

.service-info {
  margin-top: 8px;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
  font-size: 13px;
  color: #6B7280;
}

.service-info p {
  margin: 4px 0;
}

/* ========== GSAP 路由过渡基础样式 ========== */
/* Vue Transition 类只保留 display 控制，动画由 GSAP 接管 */
.page-enter-active,
.page-leave-active {
  position: absolute;
  width: 100%;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

/* 通知铃铛 */
.notification-bell {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  cursor: pointer;
  color: #6B7280;
  transition: all 0.2s;
}

.notification-bell:hover {
  background: #F3F4F6;
  color: #1E5AA8;
}

.notification-bell.has-unread {
  color: #1E5AA8;
}

.notification-bell.has-unread:hover {
  background: rgba(30, 90, 168, 0.08);
}

/* 通知面板 */
.notification-panel {
  max-height: 420px;
  overflow-y: auto;
}

.notification-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #F0F0F0;
}

.notification-title {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
}

.notification-actions {
  display: flex;
  gap: 4px;
}

.notification-list {
  max-height: 340px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #F5F5F5;
  cursor: pointer;
  transition: background 0.15s;
}

.notification-item:hover {
  background: #F9FAFB;
}

.notification-item.unread {
  background: #F0F5FF;
}

.notification-item.unread:hover {
  background: #E8F0FE;
}

.notif-icon {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.notif-icon.attendance {
  background: rgba(30, 90, 168, 0.1);
  color: #1E5AA8;
}

.notif-icon.warning {
  background: rgba(232, 93, 78, 0.1);
  color: #E85D4E;
}

.notif-icon.general {
  background: rgba(107, 114, 128, 0.1);
  color: #6B7280;
}

.notif-content {
  flex: 1;
  min-width: 0;
}

.notif-title {
  font-size: 13px;
  font-weight: 600;
  color: #1F2937;
  margin-bottom: 4px;
}

.notif-text {
  font-size: 12px;
  color: #6B7280;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  margin-bottom: 6px;
}

.notif-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #9CA3AF;
}

.notif-sender {
  color: #1E5AA8;
}

.notif-status {
  flex-shrink: 0;
}

.notification-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  color: #9CA3AF;
}

.notification-empty p {
  margin-top: 8px;
  font-size: 13px;
}

.basic-settings {
  padding: 8px 0;
}

.setting-section {
  margin-bottom: 24px;
}

.setting-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E8EAED;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
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

.action-buttons {
  display: flex;
  gap: 12px;
}
</style>