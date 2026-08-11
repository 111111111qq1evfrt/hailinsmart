/**
 * 验证工具函数
 */

/**
 * 判断是否为空
 * @param {any} value - 要判断的值
 * @returns {boolean} - 是否为空
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * 判断是否不为空
 * @param {any} value - 要判断的值
 * @returns {boolean} - 是否不为空
 */
export function isNotEmpty(value) {
  return !isEmpty(value)
}

/**
 * 判断是否是数字
 * @param {any} value - 要判断的值
 * @returns {boolean} - 是否是数字
 */
export function isNumber(value) {
  return typeof value === 'number' && !isNaN(value)
}

/**
 * 判断是否是整数
 * @param {any} value - 要判断的值
 * @returns {boolean} - 是否是整数
 */
export function isInteger(value) {
  return isNumber(value) && Number.isInteger(value)
}

/**
 * 判断是否是浮点数
 * @param {any} value - 要判断的值
 * @returns {boolean} - 是否是浮点数
 */
export function isFloat(value) {
  return isNumber(value) && !Number.isInteger(value)
}

/**
 * 判断是否是字符串
 * @param {any} value - 要判断的值
 * @returns {boolean} - 是否是字符串
 */
export function isString(value) {
  return typeof value === 'string'
}

/**
 * 判断是否是布尔值
 * @param {any} value - 要判断的值
 * @returns {boolean} - 是否是布尔值
 */
export function isBoolean(value) {
  return typeof value === 'boolean'
}

/**
 * 判断是否是对象
 * @param {any} value - 要判断的值
 * @returns {boolean} - 是否是对象
 */
export function isObject(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * 判断是否是数组
 * @param {any} value - 要判断的值
 * @returns {boolean} - 是否是数组
 */
export function isArray(value) {
  return Array.isArray(value)
}

/**
 * 判断是否是函数
 * @param {any} value - 要判断的值
 * @returns {boolean} - 是否是函数
 */
export function isFunction(value) {
  return typeof value === 'function'
}

/**
 * 判断是否是日期对象
 * @param {any} value - 要判断的值
 * @returns {boolean} - 是否是日期对象
 */
export function isDate(value) {
  return value instanceof Date && !isNaN(value.getTime())
}

/**
 * 判断是否是有效的日期字符串
 * @param {string} value - 日期字符串
 * @returns {boolean} - 是否有效
 */
export function isValidDateString(value) {
  if (!isString(value)) return false
  const date = new Date(value)
  return !isNaN(date.getTime())
}

/**
 * 验证邮箱格式
 * @param {string} email - 邮箱地址
 * @returns {boolean} - 是否有效
 */
export function isValidEmail(email) {
  if (!isString(email)) return false
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return regex.test(email)
}

/**
 * 验证手机号格式
 * @param {string} phone - 手机号
 * @returns {boolean} - 是否有效
 */
export function isValidPhone(phone) {
  if (!isString(phone)) return false
  const regex = /^1[3-9]\d{9}$/
  return regex.test(phone.replace(/\D/g, ''))
}

/**
 * 验证身份证号格式
 * @param {string} idCard - 身份证号
 * @returns {boolean} - 是否有效
 */
export function isValidIdCard(idCard) {
  if (!isString(idCard)) return false
  const regex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/
  return regex.test(idCard)
}

/**
 * 验证URL格式
 * @param {string} url - URL
 * @returns {boolean} - 是否有效
 */
export function isValidUrl(url) {
  if (!isString(url)) return false
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 验证IP地址格式
 * @param {string} ip - IP地址
 * @returns {boolean} - 是否有效
 */
export function isValidIp(ip) {
  if (!isString(ip)) return false
  const regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return regex.test(ip)
}

/**
 * 验证密码强度（至少8位，包含大小写字母和数字）
 * @param {string} password - 密码
 * @returns {boolean} - 是否符合要求
 */
export function isValidPassword(password) {
  if (!isString(password)) return false
  // 至少8位，包含大小写字母和数字
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/
  return regex.test(password)
}

/**
 * 验证字符串长度
 * @param {string} str - 字符串
 * @param {number} min - 最小长度
 * @param {number} max - 最大长度
 * @returns {boolean} - 是否在范围内
 */
export function isValidLength(str, min = 0, max = Infinity) {
  if (!isString(str)) return false
  return str.length >= min && str.length <= max
}

/**
 * 验证数字范围
 * @param {number} num - 数字
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {boolean} - 是否在范围内
 */
export function isValidRange(num, min = -Infinity, max = Infinity) {
  if (!isNumber(num)) return false
  return num >= min && num <= max
}

/**
 * 验证是否是中文
 * @param {string} str - 字符串
 * @returns {boolean} - 是否全是中文
 */
export function isChinese(str) {
  if (!isString(str)) return false
  const regex = /^[\u4e00-\u9fa5]+$/
  return regex.test(str)
}

/**
 * 验证是否包含中文
 * @param {string} str - 字符串
 * @returns {boolean} - 是否包含中文
 */
export function containsChinese(str) {
  if (!isString(str)) return false
  const regex = /[\u4e00-\u9fa5]/
  return regex.test(str)
}

/**
 * 验证是否是合法的用户名（字母、数字、下划线，开头不能是数字）
 * @param {string} username - 用户名
 * @returns {boolean} - 是否有效
 */
export function isValidUsername(username) {
  if (!isString(username)) return false
  const regex = /^[a-zA-Z_][a-zA-Z0-9_]{2,15}$/
  return regex.test(username)
}

/**
 * 验证数组是否包含指定元素
 * @param {Array} arr - 数组
 * @param {any} element - 元素
 * @returns {boolean} - 是否包含
 */
export function arrayContains(arr, element) {
  if (!isArray(arr)) return false
  return arr.includes(element)
}

/**
 * 验证对象是否包含指定属性
 * @param {Object} obj - 对象
 * @param {string} property - 属性名
 * @returns {boolean} - 是否包含
 */
export function objectHasProperty(obj, property) {
  if (!isObject(obj)) return false
  return Object.prototype.hasOwnProperty.call(obj, property)
}