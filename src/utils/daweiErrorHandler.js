/**
 * 大沩智慧体育 API 错误处理工具
 * 
 * 核心设计：大沩接口是"HTTP 200 包装业务错误"的设计
 * 真正的错误在响应体的 code 和 message 字段中
 * 
 * 由于大沩文档的错误码表不完整，无法靠维护错误码映射表来处理
 * 采用方案：按 message 关键词自动分类，写一次，永久覆盖所有未知错误
 */

// 错误分类定义（按 message 关键词匹配）
const ERROR_PATTERNS = [
  {
    category: 'duplicate',
    label: '数据重复',
    keywords: ['重复', '已存在', 'duplicate', 'already exist', 'already exists'],
    suggestion: '请检查是否已创建过该记录，或使用编辑功能修改现有数据'
  },
  {
    category: 'phone',
    label: '手机号问题',
    keywords: ['手机号', 'phone', 'mobile', '电话号码'],
    suggestion: '请检查手机号格式是否正确，或该手机号是否已被注册'
  },
  {
    category: 'permission',
    label: '权限不足',
    keywords: ['权限', 'permission', 'forbidden', 'unauthorized', '无权限', 'not allowed'],
    suggestion: '当前账号权限不足，请联系管理员授权或使用其他账号'
  },
  {
    category: 'auth',
    label: '认证失败',
    keywords: ['token', 'expired', 'invalid token', '认证', '过期', '未登录'],
    suggestion: '登录状态已过期，请重新登录或刷新Token'
  },
  {
    category: 'not_found',
    label: '数据不存在',
    keywords: ['不存在', '未找到', 'not found', 'not exist', '无法找到', '找不到'],
    suggestion: '目标数据可能已被删除或ID不正确，请检查后重试'
  },
  {
    category: 'param',
    label: '参数错误',
    keywords: ['参数', 'param', 'invalid', '不能为空', '不能为空', '参数错误', '格式错误', '类型错误'],
    suggestion: '请检查填写的信息是否完整、格式是否正确'
  },
  {
    category: 'format',
    label: '格式问题',
    keywords: ['格式', 'format', 'invalid format', '日期格式', '手机号格式', '邮箱格式'],
    suggestion: '请检查输入格式是否符合要求'
  },
  {
    category: 'network',
    label: '网络问题',
    keywords: ['network', 'timeout', 'timeout', '连接', '超时', 'connection', 'socket'],
    suggestion: '网络连接异常，请检查网络后重试'
  },
  {
    category: 'limit',
    label: '数量限制',
    keywords: ['上限', '限制', 'limit', '超过', 'max', '超出', '配额'],
    suggestion: '已达到数量上限，请减少操作数量后重试'
  },
  {
    category: 'conflict',
    label: '状态冲突',
    keywords: ['冲突', 'conflict', '状态', '进行中', '已锁定', 'locked'],
    suggestion: '数据状态存在冲突，可能被其他人修改，请刷新后重试'
  },
  {
    category: 'data',
    label: '数据异常',
    keywords: ['数据', 'data error', '数据错误', '数据异常', '数据格式'],
    suggestion: '数据存在异常，请检查数据格式或联系技术支持'
  },
  {
    category: 'school',
    label: '学校配置',
    keywords: ['学校', 'school', '机构', 'org', '部门', 'dept', 'class', '班级'],
    suggestion: '学校/班级配置异常，请检查学校ID或班级信息'
  }
]

// 成功码
const SUCCESS_CODES = ['0', '200', '0000']

/**
 * 判断 API 响应是否为业务成功
 * @param {Object|String} response - API 响应对象或 code 字符串
 * @returns {boolean} 是否成功
 */
export function isBizSuccess(response) {
  if (!response) return false
  const code = typeof response === 'object' ? String(response.code) : String(response)
  return SUCCESS_CODES.includes(code)
}

/**
 * 分类错误信息 - 核心函数
 * 按 message 关键词自动分类，不依赖错误码
 * 
 * @param {string} message - 错误消息
 * @param {string} code - 错误码
 * @returns {Object} 分类结果
 */
export function classifyErrorMessage(message, code = '') {
  if (!message) {
    return {
      category: 'unknown',
      label: '未知错误',
      suggestion: '未知错误，请联系技术支持',
      matched: null
    }
  }

  const msgLower = message.toLowerCase()

  // 按优先级匹配：遍历所有模式，取第一个匹配的
  for (const pattern of ERROR_PATTERNS) {
    for (const keyword of pattern.keywords) {
      if (msgLower.includes(keyword.toLowerCase())) {
        return {
          category: pattern.category,
          label: pattern.label,
          suggestion: pattern.suggestion,
          matched: keyword
        }
      }
    }
  }

  // 未匹配到任何模式，返回通用错误
  return {
    category: 'unknown',
    label: '业务错误',
    suggestion: '操作失败，请稍后重试或联系技术支持',
    matched: null
  }
}

/**
 * 解析大沩 API 响应 - 统一入口
 * 
 * @param {Object} response - 原始 API 响应
 * @param {Object} options - 配置选项
 * @param {string} options.operation - 操作名称（如"添加学生"、"修改职工"）
 * @param {boolean} options.throwOnError - 是否在错误时抛出异常（默认 false）
 * @returns {Object} 解析结果
 */
export function parseDaweiResponse(response, options = {}) {
  const { operation = '操作', throwOnError = false } = options

  // 情况1：HTTP 错误（无响应体）
  if (!response) {
    const result = {
      success: false,
      code: null,
      message: '网络请求失败，无响应',
      category: 'network',
      label: '网络错误',
      suggestion: '请检查网络连接后重试',
      data: null,
      formattedMessage: `${operation}失败：网络请求失败，请检查网络连接`
    }
    if (throwOnError) throw new Error(result.formattedMessage)
    return result
  }

  // 情况2：HTTP 错误码（非 200）
  if (response.status && response.status !== 200) {
    const result = {
      success: false,
      code: String(response.status),
      message: `HTTP ${response.status}`,
      category: 'network',
      label: '网络错误',
      suggestion: `服务器返回异常状态码 ${response.status}，请稍后重试`,
      data: null,
      formattedMessage: `${operation}失败：服务器异常(${response.status})`
    }
    if (throwOnError) throw new Error(result.formattedMessage)
    return result
  }

  // 情况3：响应体为业务错误（HTTP 200 但 code != 0）
  // 判断 body：优先用包含 code/message 的层级
  let body
  if (response.code !== undefined) {
    // 已经是扁平化的响应体（如 { code: 10002, message: "手机号重复", data: {} }）
    body = response
  } else if (response.data !== undefined) {
    // 是 axios 原始响应，需要提取 .data
    body = response.data
  } else {
    body = response
  }
  const code = String(body.code || '')
  const message = body.message || ''

  if (isBizSuccess({ code })) {
    // 成功
    return {
      success: true,
      code,
      message: body.message || 'success',
      category: null,
      label: null,
      suggestion: null,
      data: body.data || body.list || null,
      formattedMessage: null
    }
  }

  // 业务失败：按 message 关键词分类
  const classification = classifyErrorMessage(message, code)

  const result = {
    success: false,
    code,
    message,
    category: classification.category,
    label: classification.label,
    suggestion: classification.suggestion,
    data: null,
    formattedMessage: `${operation}失败[${classification.label}]：${message}`
  }

  if (throwOnError) {
    const error = new Error(result.formattedMessage)
    error.code = code
    error.category = classification.category
    error.suggestion = classification.suggestion
    throw error
  }

  return result
}

/**
 * 便捷方法：直接判断操作是否成功，并给出友好提示
 * 
 * @param {Object} response - 原始 API 响应
 * @param {string} operation - 操作名称
 * @returns {Object} { success, message, suggestion }
 */
export function handleDaweiResult(response, operation = '操作') {
  const parsed = parseDaweiResponse(response, { operation })

  if (parsed.success) {
    return { success: true, message: parsed.message }
  }

  return {
    success: false,
    message: parsed.formattedMessage,
    suggestion: parsed.suggestion,
    category: parsed.category,
    label: parsed.label,
    code: parsed.code
  }
}

/**
 * 便捷方法：获取错误的友好提示消息
 * 
 * @param {Object} response - 原始 API 响应
 * @param {string} operation - 操作名称
 * @returns {string} 友好的错误提示消息
 */
export function getFriendlyErrorMessage(response, operation = '操作') {
  const parsed = parseDaweiResponse(response, { operation })
  if (parsed.success) return ''
  // 返回简洁的错误提示，便于直接显示
  return `${parsed.label}：${parsed.message}`
}

/**
 * 验证响应是否为业务成功（HTTP 200 + code='0'）
 * 这是一个更严格的检查
 * 
 * @param {Object} response - 原始 API 响应
 * @returns {boolean}
 */
export function isDaweiResponseSuccess(response) {
  if (!response) return false
  if (response.status && response.status !== 200) return false
  const body = response.data || response
  return isBizSuccess(body)
}

// 导出分类模式（方便扩展）
export const errorPatterns = ERROR_PATTERNS

// 导出成功码列表
export const successCodes = SUCCESS_CODES
