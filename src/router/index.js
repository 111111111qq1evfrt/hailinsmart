/**
 * 路由配置
 * 使用懒加载和代码分割优化首屏加载
 * 优化策略：合并相似功能页面，减少路由数量
 */

import { createRouter, createWebHistory } from 'vue-router'

// 路由加载错误处理组件
const createLazyComponent = (loader) => {
  return () => loader().catch((error) => {
    console.error('组件加载失败:', error)
    return import('../views/dashboard/Dashboard.vue')
  })
}

// 公共页面路由
const publicRoutes = [
  {
    path: '/',
    name: 'Login',
    component: createLazyComponent(() => import('../views/auth/Login.vue')),
    meta: { title: '智慧体育 - 登录', layout: 'public' }
  },
  {
    path: '/home',
    name: 'Dashboard',
    component: createLazyComponent(() => import('../views/dashboard/Dashboard.vue')),
    meta: { title: '智慧体育 - 首页', layout: 'main' }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: createLazyComponent(() => import('../views/profile/Profile.vue')),
    meta: { title: '智慧体育 - 个人中心', layout: 'main' }
  }
]

// 系统管理路由（tab容器页面，每个子页面独立路由，侧边栏逐项显示）
const systemRoutes = [
  {
    path: '/system/users',
    name: 'SystemUsers',
    component: createLazyComponent(() => import('../views/system/index.vue')),
    meta: { title: '智慧体育 - 用户管理', layout: 'main', module: 'system' }
  },
  {
    path: '/system/students',
    name: 'SystemStudents',
    component: createLazyComponent(() => import('../views/system/index.vue')),
    meta: { title: '智慧体育 - 学生管理', layout: 'main', module: 'system' }
  },
  {
    path: '/system/devices',
    name: 'SystemDevices',
    component: createLazyComponent(() => import('../views/system/index.vue')),
    meta: { title: '智慧体育 - 设备管理', layout: 'main', module: 'system' }
  },
  {
    path: '/system/workorders',
    name: 'SystemWorkorders',
    component: createLazyComponent(() => import('../views/system/index.vue')),
    meta: { title: '智慧体育 - 工单管理', layout: 'main', module: 'system' }
  },
  {
    path: '/system/resources',
    name: 'SystemResources',
    component: createLazyComponent(() => import('../views/system/index.vue')),
    meta: { title: '智慧体育 - 资源管理', layout: 'main', module: 'system' }
  },
  {
    path: '/system/notifications',
    name: 'SystemNotifications',
    component: createLazyComponent(() => import('../views/system/index.vue')),
    meta: { title: '智慧体育 - 通知中心', layout: 'main', module: 'system' }
  },
  {
    path: '/system/settings',
    name: 'SystemSettings',
    component: createLazyComponent(() => import('../views/system/index.vue')),
    meta: { title: '智慧体育 - 系统设置', layout: 'main', module: 'system' }
  },
  {
    path: '/system/version',
    name: 'SystemVersion',
    component: createLazyComponent(() => import('../views/system/index.vue')),
    meta: { title: '智慧体育 - 版本管理', layout: 'main', module: 'system' }
  },
  {
    path: '/system/feedback',
    name: 'SystemFeedback',
    component: createLazyComponent(() => import('../views/system/index.vue')),
    meta: { title: '智慧体育 - 客服反馈', layout: 'main', module: 'system' }
  }
]

// 测试模块路由（保持不变）
const testModuleRoutes = [
  {
    path: '/exam',
    name: 'SportsExam',
    component: createLazyComponent(() => import('../views/testing/SportsExam.vue')),
    meta: { title: '智慧体育 - 体育考试', layout: 'main', module: 'test' }
  },
  {
    path: '/national-test',
    name: 'NationalTest',
    component: createLazyComponent(() => import('../views/testing/NationalTest.vue')),
    meta: { title: '智慧体育 - 国家体测', layout: 'main', module: 'test' }
  },
  {
    path: '/practice',
    name: 'FreePractice',
    component: createLazyComponent(() => import('../views/testing/FreePractice.vue')),
    meta: { title: '智慧体育 - 自由练习', layout: 'main', module: 'test' }
  },
  {
    path: '/test-terminal',
    name: 'TestTerminal',
    component: createLazyComponent(() => import('../views/testing/TestTerminal.vue')),
    meta: { title: '智慧体育 - 测试终端', layout: 'main', module: 'test' }
  },
  {
    path: '/teaching-videos',
    name: 'TeachingVideos',
    component: createLazyComponent(() => import('../views/testing/TeachingVideos.vue')),
    meta: { title: '智慧体育 - 教学视频', layout: 'main', module: 'test' }
  }
]

// 评价分析路由（合并后）
const evaluationRoutes = [
  {
    path: '/evaluation/assessment',
    name: 'AssessmentManagement',
    component: createLazyComponent(() => import('../views/evaluation/assessment/AssessmentManagement.vue')),
    meta: { title: '智慧体育 - 评价管理', layout: 'main', module: 'evaluation' }
  },
  {
    path: '/evaluation/teaching',
    name: 'TeachingManagement',
    component: createLazyComponent(() => import('../views/evaluation/teaching/TeachingManagement.vue')),
    meta: { title: '智慧体育 - 教学管理', layout: 'main', module: 'evaluation' }
  },
  {
    path: '/evaluation/leader',
    name: 'LeaderPanel',
    component: createLazyComponent(() => import('../views/evaluation/LeaderDashboard.vue')),
    meta: { title: '智慧体育 - 校领导面板', layout: 'main', module: 'evaluation' }
  },
  {
    path: '/evaluation/ai-review',
    name: 'AiReview',
    component: createLazyComponent(() => import('../views/evaluation/ai/AiReview.vue')),
    meta: { title: '智慧体育 - AI智能点评', layout: 'main', module: 'evaluation' }
  }
]

// 数据平台路由（tab容器页面，每个子页面独立路由，侧边栏逐项显示）
const dataRoutes = [
  {
    path: '/data/overview',
    name: 'DataOverview',
    component: createLazyComponent(() => import('../views/data-platform/index.vue')),
    meta: { title: '智慧体育 - 数据总览', layout: 'main', module: 'data' }
  },
  {
    path: '/data/student',
    name: 'DataStudent',
    component: createLazyComponent(() => import('../views/data-platform/index.vue')),
    meta: { title: '智慧体育 - 学生数据中心', layout: 'main', module: 'data' }
  },
  {
    path: '/data/analysis',
    name: 'DataAnalysis',
    component: createLazyComponent(() => import('../views/data-platform/index.vue')),
    meta: { title: '智慧体育 - 数据分析中心', layout: 'main', module: 'data' }
  },
  {
    path: '/data/health',
    name: 'DataHealth',
    component: createLazyComponent(() => import('../views/data-platform/index.vue')),
    meta: { title: '智慧体育 - 健康监测看板', layout: 'main', module: 'data' }
  },
  {
    path: '/data/maintenance',
    name: 'DataMaintenance',
    component: createLazyComponent(() => import('../views/data-platform/index.vue')),
    meta: { title: '智慧体育 - 维修数据分析', layout: 'main', module: 'data' }
  },
  {
    path: '/data/visualization',
    name: 'DataVisualization',
    component: createLazyComponent(() => import('../views/data-platform/visualization/VisualizationScreen.vue')),
    meta: { title: '智慧体育 - 数据可视化大屏', layout: 'fullscreen', module: 'data' }
  }
]

// 组合所有路由
const routes = [
  ...publicRoutes,
  ...systemRoutes,
  ...testModuleRoutes,
  ...evaluationRoutes,
  ...dataRoutes,
  // 默认页重定向
  { path: '/system', redirect: '/system/users' },
  { path: '/evaluation', redirect: '/evaluation/assessment' },
  { path: '/data', redirect: '/data/overview' },
  { path: '/data-platform', redirect: '/data/overview' },
  { path: '/leader-panel', redirect: '/evaluation/leader' },
  // 404 页面
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: createLazyComponent(() => import('../views/dashboard/Dashboard.vue')),
    meta: { title: '智慧体育 - 页面未找到', layout: 'main' }
  }
]

// 创建路由实例
const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

/**
 * 检查用户是否已选择学校并登录
 * 从 sessionStorage 读取学校信息和 token（与 Login.vue 的存储逻辑一致）
 */
function isAuthenticated() {
  try {
    const schoolData = sessionStorage.getItem('smart_pe_school')
    if (!schoolData) return false
    const school = JSON.parse(schoolData)
    if (!school || !school.id) return false
    const token = sessionStorage.getItem(`smart_pe_token_${school.id}`)
    return !!token
  } catch {
    return false
  }
}

// 路由守卫 - 认证检查 + 设置页面标题
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title
  }

  // 登录页和学校选择页不需要认证
  if (to.path === '/' || to.path === '/login') {
    return next()
  }

  // 未登录或未选择学校时，跳转到登录页（含学校选择）
  if (!isAuthenticated()) {
    return next('/')
  }

  next()
})

// 路由导航错误处理
router.onError((error) => {
  console.error('路由导航错误:', error)
  if (error.message.includes('Failed to fetch dynamically imported module')) {
    console.warn('路由组件加载失败，跳转到首页')
    router.push('/home').catch(() => {})
  }
})

export default router