import axios from 'axios'
import md5 from 'md5'
import { daiweiConfig, getSchoolConfig } from '@/config/daiwei'
import { isBizSuccess, parseDaweiResponse, handleDaweiResult } from './daweiErrorHandler'

let tokenInfo = null
let isRefreshing = false
let refreshSubscribers = []

// 只读 API 请求级缓存（30 秒 TTL），避免多个页面重复请求全量学生/班级列表
const apiCache = new Map()
const API_CACHE_TTL = 30000

function getCachedApiCall(cacheKey, apiCallFn) {
  const cached = apiCache.get(cacheKey)
  if (cached && Date.now() - cached.time < API_CACHE_TTL) {
    return cached.promise
  }
  const promise = apiCallFn()
  apiCache.set(cacheKey, { promise, time: Date.now() })
  return promise
}

const createSign = (accessKeyId, timestamp, accessKeySecret) => {
  return md5(accessKeyId + timestamp + accessKeySecret)
}

const saveToken = (token, expiresIn) => {
  tokenInfo = {
    token,
    expiresIn: Number(expiresIn),
    timestamp: Date.now()
  }
  sessionStorage.setItem('daiwei_token', JSON.stringify(tokenInfo))
}

const getToken = () => {
  if (!tokenInfo) {
    const stored = sessionStorage.getItem('daiwei_token')
    if (stored) {
      try {
        tokenInfo = JSON.parse(stored)
      } catch (e) {
        tokenInfo = null
      }
    }
  }
  return tokenInfo
}

const isTokenExpired = () => {
  const token = getToken()
  if (!token) return true
  const now = Date.now()
  return now >= token.expiresIn - 30000
}

const clearToken = () => {
  tokenInfo = null
  sessionStorage.removeItem('daiwei_token')
}

const subscribeTokenRefresh = (callback) => {
  refreshSubscribers.push(callback)
}

const onTokenRefreshed = (newToken) => {
  refreshSubscribers.forEach(callback => callback(newToken))
  refreshSubscribers = []
}

const axiosInstance = axios.create({
  baseURL: daiweiConfig.baseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
})

axiosInstance.interceptors.request.use(async (config) => {
  if (config.url === '/v3/token/get_token') {
    return config
  }

  if (isTokenExpired()) {
    if (!isRefreshing) {
      isRefreshing = true
      try {
        const newToken = await fetchToken()
        saveToken(newToken.token, newToken.expires_in)
        onTokenRefreshed(newToken.token)
      } catch (error) {
        clearToken()
        refreshSubscribers.forEach(callback => callback(null))
        refreshSubscribers = []
      } finally {
        isRefreshing = false
      }
    }

    await new Promise((resolve, reject) => {
      subscribeTokenRefresh((newToken) => {
        if (newToken) {
          resolve(newToken)
        } else {
          reject(new Error('Token refresh failed'))
        }
      })
    })
  }

  const token = getToken()
  if (token) {
    config.headers.Authorization = token.token
  }

  return config
}, (error) => {
  return Promise.reject(error)
})

axiosInstance.interceptors.response.use((response) => {
  return response
}, async (error) => {
  const originalRequest = error.config
  const response = error.response

  if (response && String(response.data.code) === '9000' && !originalRequest._retry) {
    originalRequest._retry = true
    try {
      const newToken = await fetchToken()
      saveToken(newToken.token, newToken.expires_in)
      originalRequest.headers.Authorization = newToken.token
      return axiosInstance(originalRequest)
    } catch (refreshError) {
      clearToken()
      return Promise.reject(refreshError)
    }
  }

  return Promise.reject(error)
})

const fetchToken = async (config = daiweiConfig) => {
  const timestamp = Date.now()
  const sign = createSign(config.accessKeyId, timestamp, config.accessKeySecret)
  const response = await axiosInstance.post('/v3/token/get_token', {
    access_key_id: config.accessKeyId,
    access_key_secret: config.accessKeySecret,
    timestamp,
    sign
  })
  return response.data.data
}

const transformPageParams = (params) => {
  if (params.page !== undefined && params.size !== undefined) {
    return {
      ...params,
      offset: (Number(params.page) - 1) * Number(params.size),
      count: params.size
    }
  }
  return params
}

const transformPageResponse = (response, page, size) => {
  if (!response) return response
  
  // 处理嵌套结构：response.data.data 或 response.data
  // API 返回: { code: 0, message: "success", data: { total_count: 8, student_list: [...] } }
  const innerData = response.data && typeof response.data === 'object' ? response.data : response
  
  const innerTotal = innerData.total_count ?? innerData.total
  if (innerTotal !== undefined) {
    const list = innerData.student_list || innerData.staff_list || innerData.list || innerData.data || []
    return {
      code: response.code,
      message: response.message,
      list,
      total: innerTotal,
      page: page || 1,
      size: size || 20
    }
  }
  
  // 扁平结构（兼容）
  const flatTotal = response.total_count ?? response.total
  if (flatTotal !== undefined) {
    const list = response.student_list || response.staff_list || response.list || response.data || []
    return {
      code: response.code,
      message: response.message,
      list,
      total: flatTotal,
      page: page || 1,
      size: size || 20
    }
  }
  
  return response
}

// ========== API 调用（无缓存，每次直接请求） ==========
/**
 * 统一的 API 调用回退机制
 * 
 * 核心逻辑：
 * 1. HTTP 200 + code='0' → 成功，返回真实数据
 * 2. HTTP 200 + code!='0' → 业务错误，返回错误信息（不回退 mock）
 * 3. HTTP 错误（网络/服务器异常） → 回退到 mock 数据
 * 
 * @param {Function} apiFn - 真实 API 调用函数
 * @param {Function} mockFn - mock 回退函数
 * @param {Object} params - 请求参数
 * @param {Object} options - 配置
 * @param {string} options.operation - 操作名称
 * @param {boolean} options.throwOnBizError - 业务错误时是否抛出（默认 false）
 */
const apiCallWithFallback = async (apiFn, mockFn, params, options = {}) => {
  const { operation = '操作', throwOnBizError = false } = options

  if (!daiweiConfig.enabled) {
    return {
      ...mockFn(params),
      _mock: true
    }
  }

  try {
    const result = await apiFn(params)
    
    // 判断业务成功：HTTP 200 + code='0'
    if (isBizSuccess(result)) {
      return {
        ...result,
        _mock: false,
        _success: true
      }
    }
    
    // 业务失败：HTTP 200 但 code!='0'
    // 这是大沩的业务错误，不是网络问题，不回退 mock
    const parsed = parseDaweiResponse(result, { operation })
    
    console.warn(`[大沩API] ${operation}业务失败:`, {
      code: parsed.code,
      message: parsed.message,
      category: parsed.category,
      suggestion: parsed.suggestion
    })
    
    if (throwOnBizError) {
      const error = new Error(parsed.formattedMessage)
      error.code = parsed.code
      error.category = parsed.category
      error.suggestion = parsed.suggestion
      error._isBizError = true
      throw error
    }
    
    return {
      code: parsed.code,
      message: parsed.message,
      _mock: false,
      _success: false,
      _error: parsed
    }
  } catch (error) {
    // 如果是业务错误（已在上面设置 _isBizError），直接抛出不回退
    if (error._isBizError) {
      throw error
    }
    
    // HTTP/网络错误：才回退到 mock 数据
    const response = error.response
    if (response) {
      const parsed = parseDaweiResponse(response, { operation })
      console.warn(`[大沩API] ${operation}HTTP错误，回退Mock:`, {
        status: response.status,
        message: error.message
      })
    } else {
      console.warn(`[大沩API] ${operation}网络错误，回退Mock:`, error.message)
    }
    
    return {
      ...mockFn(params),
      _mock: true,
      _fallback: true,
      _error: { message: error.message }
    }
  }
}

export const getTokenData = async (localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return null
  }
  if (isTokenExpired()) {
    const token = await fetchToken(config)
    saveToken(token.token, token.expires_in)
    return token
  }
  return getToken()
}

export const getStudentListV3 = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return {
      code: '0',
      message: 'success',
      data: {
        student_id_list: [],
        total_count: 0
      }
    }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v3/student/list', {
      school_id: config.schoolId,
      ...p
    })
    return response.data
  }
  const mockFn = (p) => ({
    code: '0',
    message: 'success',
    data: {
      student_id_list: [],
      total_count: 0
    }
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const getStudentListV4 = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return {
      code: '0',
      list: [],
      total: 0,
      page: params.page || 1,
      size: params.size || 20
    }
  }
  const cacheKey = `student_list_v4:${config.schoolId}:${JSON.stringify(params)}`
  return getCachedApiCall(cacheKey, () => {
    const apiFn = async (p) => {
      const transformedParams = transformPageParams(p)
      const response = await axiosInstance.post('/v4/student/list', {
        school_id: config.schoolId,
        dept_id: '-1',
        recursion: 1,
        ...transformedParams
      })
      return transformPageResponse(response.data, p.page, p.size)
    }
    const mockFn = (p) => ({
      code: '0',
      list: [],
      total: 0,
      page: p.page || 1,
      size: p.size || 20
    })
    return apiCallWithFallback(apiFn, mockFn, params)
  })
}

export const addStudent = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success' }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v4/student/add', {
      school_id: config.schoolId,
      ...p
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success'
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const addStudentList = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success', data: [] }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v4/student/add_list', {
      school_id: config.schoolId,
      add_list: p.add_list
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success',
    data: []
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const changeStudent = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success' }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v4/student/change', {
      school_id: config.schoolId,
      ...p
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success'
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const changeStudentList = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success', data: [] }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v4/student/change_list', {
      school_id: config.schoolId,
      change_list: p.change_list
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success',
    data: []
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const deleteStudent = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success' }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v3/student/delete', {
      school_id: config.schoolId,
      ...p
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success'
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const deleteStudentList = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success', data: [] }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v3/student/delete_list', {
      school_id: config.schoolId,
      delete_list: p.delete_list
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success',
    data: []
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const uploadStudentFaceFormData = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success' }
  }
  const apiFn = async (p) => {
    const formData = new FormData()
    formData.append('school_id', config.schoolId)
    formData.append('student_id', p.student_id)
    formData.append('image', p.image)
    const response = await axiosInstance.post('/v3/student/face/upload/form_data', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success'
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const uploadStudentFaceJson = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success' }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v3/student/face/upload/json', {
      school_id: config.schoolId,
      ...p
    }, {
      headers: { 'Content-Type': 'application/json' }
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success'
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const deleteStudentFace = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success' }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v3/student/face/delete', {
      school_id: config.schoolId,
      ...p
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success'
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const getClassList = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success', data: [] }
  }
  const cacheKey = `class_list_v4:${config.schoolId}:${JSON.stringify(params)}`
  return getCachedApiCall(cacheKey, () => {
    const apiFn = async (p) => {
      const response = await axiosInstance.post('/v4/class/list', {
        school_id: config.schoolId,
        dept_id: '-1',
        recursion: 1,
        ...p
      })
      return response.data
    }
    const mockFn = () => ({
      code: '0',
      message: 'success',
      data: []
    })
    return apiCallWithFallback(apiFn, mockFn, params)
  })
}

export const addClass = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success', data: { dept_id: 'mock-dept-id' } }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v4/class/add', {
      school_id: config.schoolId,
      ...p
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success',
    data: { dept_id: 'mock-dept-id' }
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const changeClass = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success' }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v4/class/change', {
      school_id: config.schoolId,
      ...p
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success'
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const deleteClass = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success' }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v4/class/delete', {
      school_id: config.schoolId,
      ...p
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success'
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const createClass = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success' }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v4/class/create', {
      school_id: config.schoolId,
      ...p
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success'
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

// ========== 人脸图片缓存与并发控制 ==========
const faceImageCache = new Map()         // imagePath → base64 dataURL（会话级缓存，图片不会变）
const pendingFaceRequests = new Map()    // imagePath → Promise（去重：同一张图只请求一次）
const FACE_CONCURRENCY = 4              // 最多同时下载 4 张
let activeFaceDownloads = 0
const faceDownloadQueue = []             // 等待队列

const processFaceQueue = () => {
  while (activeFaceDownloads < FACE_CONCURRENCY && faceDownloadQueue.length > 0) {
    const { resolve, reject, task } = faceDownloadQueue.shift()
    activeFaceDownloads++
    task()
      .then(resolve)
      .catch(reject)
      .finally(() => {
        activeFaceDownloads--
        processFaceQueue()  // 完成一个，处理下一个
      })
  }
}

const enqueueFaceDownload = (taskFn) => {
  return new Promise((resolve, reject) => {
    faceDownloadQueue.push({ resolve, reject, task: taskFn })
    processFaceQueue()
  })
}

export const getStudentFaceImage = async (imagePath, localSchoolId) => {
  // 1. 会话级缓存：同一张图只下载一次
  if (faceImageCache.has(imagePath)) {
    return faceImageCache.get(imagePath)
  }

  // 2. 去重：同一张图正在下载中，复用 promise
  if (pendingFaceRequests.has(imagePath)) {
    return pendingFaceRequests.get(imagePath)
  }

  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return ''
  }

  // 3. 并发控制 + 实际下载
  const downloadPromise = enqueueFaceDownload(async () => {
    try {
      const time = Date.now()
      const sign = createSign(config.accessKeyId, time, config.accessKeySecret)
      const fullUrl = `${daiweiConfig.baseUrl}/${imagePath}`

      const response = await axios.get(fullUrl, {
        responseType: 'blob',
        timeout: 30000,
        params: {
          access_key_id: config.accessKeyId,
          school_id: config.schoolId,
          third_party: 1,
          time: time,
          sign: sign
        }
      })

      const blob = response.data
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader()
        reader.onloadend = () => resolve(reader.result)
        reader.readAsDataURL(blob)
      })

      // 缓存成功结果（图片不会变，永久缓存到会话结束）
      faceImageCache.set(imagePath, base64)
      return base64
    } catch (error) {
      console.warn('获取人脸图片失败:', {
        path: imagePath,
        status: error.response?.status,
        statusText: error.response?.statusText,
        message: error.message
      })
      return ''
    }
  })

  pendingFaceRequests.set(imagePath, downloadPromise)

  try {
    const result = await downloadPromise
    return result
  } finally {
    pendingFaceRequests.delete(imagePath)
  }
}

export const addStaff = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success' }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v4/staff/add', {
      school_id: config.schoolId,
      ...p
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success'
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const changeStaff = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success' }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v4/staff/change', {
      school_id: config.schoolId,
      ...p
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success'
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const deleteStaff = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success' }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v4/staff/delete', {
      school_id: config.schoolId,
      ...p
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success'
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const getStaffList = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return {
      code: '0',
      list: [],
      total: 0,
      page: params.page || 1,
      size: params.size || 20
    }
  }
  const apiFn = async (p) => {
    const transformedParams = transformPageParams(p)
    const response = await axiosInstance.post('/v4/staff/list', {
      school_id: config.schoolId,
      ...transformedParams
    })
    // 传递完整的 response.data（包含 code、message、data）
    return transformPageResponse(response.data, p.page, p.size)
  }
  const mockFn = (p) => ({
    code: '0',
    list: [],
    total: 0,
    page: p.page || 1,
    size: p.size || 20
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const uploadStaffFaceFormData = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success' }
  }
  const apiFn = async (p) => {
    const formData = new FormData()
    formData.append('school_id', config.schoolId)
    formData.append('staff_id', p.staff_id)
    formData.append('image', p.image)
    const response = await axiosInstance.post('/v4/staff/face/upload/form_data', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success'
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const uploadStaffFaceJson = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success' }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v4/staff/face/upload/json', {
      school_id: config.schoolId,
      ...p
    }, {
      headers: { 'Content-Type': 'application/json' }
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success'
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}

export const deleteStaffFace = async (params, localSchoolId) => {
  const config = getSchoolConfig(localSchoolId)
  if (!config) {
    return { code: '0', message: 'success' }
  }
  const apiFn = async (p) => {
    const response = await axiosInstance.post('/v4/staff/face/delete', {
      school_id: config.schoolId,
      ...p
    })
    return response.data
  }
  const mockFn = () => ({
    code: '0',
    message: 'success'
  })
  return apiCallWithFallback(apiFn, mockFn, params)
}