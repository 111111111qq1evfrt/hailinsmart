/**
 * 请求封装层
 * 模拟后端API调用，支持多租户数据隔离
 */

import { ElMessage } from 'element-plus'
import store from '@/store/global'
import { getSchoolMockData } from './mockDataLoader'

// 模拟延迟时间
const mockDelay = 500 // ms

/**
 * 统一响应格式
 */
const createResponse = (data, success = true, message = 'success') => ({
  code: success ? 200 : 500,
  message,
  data,
  timestamp: Date.now()
})

/**
 * 统一分页响应格式
 */
const createPageResponse = (list, page = 1, size = 10, total = list.length) => ({
  code: 200,
  message: 'success',
  data: {
    list: list.slice((page - 1) * size, page * size),
    total,
    page,
    size
  },
  timestamp: Date.now()
})

/**
 * 模拟API路由映射
 */
const apiRoutes = {
  // 用户认证
  'POST /api/auth/login': (params) => {
    // 模拟登录验证
    if (params.username && params.password) {
      return createResponse({
        token: 'mock-token-' + params.username,
        user: {
          id: 'user-' + params.username,
          name: params.username === 'admin' ? '管理员' : 
                params.username === 'teacher' ? '李老师' : '班主任',
          avatar: '',
          role: params.role,
          permissions: ['view', 'edit', 'export']
        }
      })
    }
    return createResponse(null, false, '登录失败')
  },
  
  // 学生管理
  'GET /api/students': (params) => {
    const schoolId = store.state.school.id || 'hailin-second-primary'
    const mockData = getSchoolMockData(schoolId)
    let result = mockData.students
    
    // 过滤条件
    if (params.grade) {
      result = result.filter(s => s.grade === params.grade)
    }
    if (params.class) {
      result = result.filter(s => s.class === params.class)
    }
    if (params.name) {
      result = result.filter(s => s.name.includes(params.name))
    }
    
    return createPageResponse(result, params.page, params.size)
  },
  
  'GET /api/students/:id': (params, id) => {
    const schoolId = store.state.school.id || 'hailin-second-primary'
    const mockData = getSchoolMockData(schoolId)
    const student = mockData.students.find(s => s.id === id || s.studentId === id)
    if (student) {
      return createResponse(student)
    }
    return createResponse(null, false, '学生不存在')
  },
  
  // 班级管理
  'GET /api/classes': (params) => {
    const schoolId = store.state.school.id || 'hailin-second-primary'
    const mockData = getSchoolMockData(schoolId)
    return createPageResponse(mockData.classes, params.page, params.size)
  },
  
  // 教师管理
  'GET /api/teachers': (params) => {
    const schoolId = store.state.school.id || 'hailin-second-primary'
    const mockData = getSchoolMockData(schoolId)
    return createPageResponse(mockData.teachers, params.page, params.size)
  },
  
  // 考试成绩
  'GET /api/exam/results': (params) => {
    const schoolId = store.state.school.id || 'hailin-second-primary'
    const mockData = getSchoolMockData(schoolId)
    let result = mockData.examResults
    
    if (params.studentId) {
      result = result.filter(r => r.studentId === params.studentId)
    }
    if (params.event) {
      result = result.filter(r => r.event === params.event)
    }
    
    return createPageResponse(result, params.page, params.size)
  },
  
  // 国家体测
  'GET /api/national/test': (params) => {
    const schoolId = store.state.school.id || 'hailin-second-primary'
    const mockData = getSchoolMockData(schoolId)
    let result = mockData.nationalTestResults
    
    if (params.grade) {
      result = result.filter(r => r.grade === params.grade)
    }
    if (params.class) {
      result = result.filter(r => r.class === params.class)
    }
    
    return createPageResponse(result, params.page, params.size)
  },
  
  // 练习记录
  'GET /api/practice/records': (params) => {
    const schoolId = store.state.school.id || 'hailin-second-primary'
    const mockData = getSchoolMockData(schoolId)
    return createPageResponse(mockData.practiceRecords, params.page, params.size)
  },
  
  // 评价记录
  'GET /api/evaluation/records': (params) => {
    const schoolId = store.state.school.id || 'hailin-second-primary'
    const mockData = getSchoolMockData(schoolId)
    return createPageResponse(mockData.evaluationRecords, params.page, params.size)
  },
  
  // 课程记录
  'GET /api/lessons': (params) => {
    const schoolId = store.state.school.id || 'hailin-second-primary'
    const mockData = getSchoolMockData(schoolId)
    return createPageResponse(mockData.lessonRecords, params.page, params.size)
  },
  
  // 系统统计
  'GET /api/stats': () => {
    const schoolId = store.state.school.id || 'hailin-second-primary'
    const mockData = getSchoolMockData(schoolId)
    return createResponse(mockData.systemStats)
  },
  
  // 学校信息
  'GET /api/school/info': () => {
    const school = store.state.school
    return createResponse({
      id: school.id,
      name: school.name,
      logo: school.logo,
      primaryColor: school.primaryColor,
      secondaryColor: school.secondaryColor
    })
  }
}

/**
 * 解析URL路径
 */
const parseUrl = (url) => {
  const parts = url.split('/')
  const path = '/' + parts.slice(2).join('/')
  return path
}

/**
 * 请求拦截器
 */
const requestInterceptor = (config) => {
  // 添加学校标识到请求头
  const schoolId = store.state.school.id || ''
  if (schoolId) {
    config.headers = config.headers || {}
    config.headers['X-School-Id'] = schoolId
  }
  
  // 添加认证Token（优先从学校隔离的 sessionStorage 获取，每个标签页独立）
  const token = sessionStorage.getItem(`smart_pe_token_${schoolId}`)
    || sessionStorage.getItem('token')
    || localStorage.getItem('token')
  if (token) {
    config.headers = config.headers || {}
    config.headers['Authorization'] = 'Bearer ' + token
  }
  
  return config
}

/**
 * 响应拦截器
 */
const responseInterceptor = (response) => {
  if (response.code === 200) {
    return response.data
  } else {
    ElMessage.error(response.message || '请求失败')
    throw new Error(response.message)
  }
}

/**
 * 错误处理
 */
const errorHandler = (error) => {
  ElMessage.error(error.message || '网络错误')
  throw error
}

/**
 * 核心请求方法
 */
const request = async (config) => {
  try {
    // 请求拦截
    const processedConfig = requestInterceptor(config)
    
    // 解析URL
    const path = parseUrl(processedConfig.url)
    const method = (processedConfig.method || 'GET').toUpperCase()
    
    // 查找对应的API路由
    const routeKey = `${method} ${path}`
    const handler = apiRoutes[routeKey]
    
    if (!handler) {
      // 尝试带参数的路由匹配
      const paramRoute = Object.keys(apiRoutes).find(key => {
        const keyPath = key.split(' ')[1]
        if (keyPath.includes(':id')) {
          const regex = new RegExp('^' + keyPath.replace(':id', '\\w+') + '$')
          return regex.test(path)
        }
        return false
      })
      
      if (paramRoute) {
        const paramName = paramRoute.split(':')[1]
        const match = path.match(new RegExp(paramRoute.split(' ')[1].replace(':id', '(\\w+)')))
        const paramValue = match ? match[1] : null
        await new Promise(resolve => setTimeout(resolve, mockDelay))
        const response = handler(apiRoutes[paramRoute], processedConfig.params || processedConfig.data, paramValue)
        return responseInterceptor(response)
      }
      
      // 默认返回空数据
      await new Promise(resolve => setTimeout(resolve, mockDelay))
      return createResponse([])
    }
    
    // 模拟网络延迟
    await new Promise(resolve => setTimeout(resolve, mockDelay))
    
    // 执行API处理
    const response = handler(processedConfig.params || processedConfig.data)
    
    // 响应拦截
    return responseInterceptor(response)
    
  } catch (error) {
    return errorHandler(error)
  }
}

// 便捷方法
request.get = (url, params = {}) => request({ url, method: 'GET', params })
request.post = (url, data = {}) => request({ url, method: 'POST', data })
request.put = (url, data = {}) => request({ url, method: 'PUT', data })
request.delete = (url, params = {}) => request({ url, method: 'DELETE', params })

export default request
