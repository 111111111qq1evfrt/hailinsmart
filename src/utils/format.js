/**
 * 格式化工具函数
 */

import { createSeededRandom, generateDeterministicId } from './seededRandom'

/**
 * 格式化数字，添加千位分隔符
 * @param {number|string} num - 数字
 * @returns {string} - 格式化后的字符串
 */
export function formatNumber(num) {
  const n = parseFloat(num)
  if (isNaN(n)) return '0'
  return n.toLocaleString('zh-CN')
}

/**
 * 格式化金额
 * @param {number|string} amount - 金额
 * @param {string} currency - 货币符号
 * @returns {string} - 格式化后的金额
 */
export function formatMoney(amount, currency = '¥') {
  const n = parseFloat(amount)
  if (isNaN(n)) return `${currency}0.00`
  return `${currency}${n.toFixed(2)}`
}

/**
 * 格式化百分比
 * @param {number|string} value - 数值
 * @param {number} decimals - 小数位数
 * @returns {string} - 格式化后的百分比
 */
export function formatPercent(value, decimals = 1) {
  const n = parseFloat(value)
  if (isNaN(n)) return '0%'
  return `${n.toFixed(decimals)}%`
}

/**
 * 格式化时长（秒转换为时分秒）
 * @param {number} seconds - 秒数
 * @returns {string} - 格式化后的时长
 */
export function formatDuration(seconds) {
  const s = parseInt(seconds)
  if (isNaN(s) || s < 0) return '00:00:00'
  
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

/**
 * 格式化时长为分钟和秒
 * @param {number} seconds - 秒数
 * @returns {string} - 格式化后的时长
 */
export function formatMinutes(seconds) {
  const s = parseInt(seconds)
  if (isNaN(s) || s < 0) return '0分0秒'
  
  const m = Math.floor(s / 60)
  const sec = s % 60
  
  if (m === 0) return `${sec}秒`
  return `${m}分${sec}秒`
}

/**
 * 格式化文件大小
 * @param {number} bytes - 字节数
 * @returns {string} - 格式化后的文件大小
 */
export function formatFileSize(bytes) {
  const b = parseInt(bytes)
  if (isNaN(b) || b < 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let index = 0
  let size = b
  
  while (size >= 1024 && index < units.length - 1) {
    size /= 1024
    index++
  }
  
  return `${size.toFixed(index === 0 ? 0 : 2)} ${units[index]}`
}

/**
 * 截断字符串并添加省略号
 * @param {string} str - 字符串
 * @param {number} maxLength - 最大长度
 * @returns {string} - 截断后的字符串
 */
export function truncateString(str, maxLength = 20) {
  if (!str) return ''
  const s = String(str)
  return s.length > maxLength ? s.substring(0, maxLength) + '...' : s
}

/**
 * 首字母大写
 * @param {string} str - 字符串
 * @returns {string} - 首字母大写后的字符串
 */
export function capitalizeFirst(str) {
  if (!str) return ''
  const s = String(str)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/**
 * 全部大写
 * @param {string} str - 字符串
 * @returns {string} - 大写字符串
 */
export function toUpperCase(str) {
  if (!str) return ''
  return String(str).toUpperCase()
}

/**
 * 全部小写
 * @param {string} str - 字符串
 * @returns {string} - 小写字符串
 */
export function toLowerCase(str) {
  if (!str) return ''
  return String(str).toLowerCase()
}

/**
 * 去除字符串两端空格
 * @param {string} str - 字符串
 * @returns {string} - 去除空格后的字符串
 */
export function trim(str) {
  if (!str) return ''
  return String(str).trim()
}

/**
 * 格式化手机号（中间4位用*代替）
 * @param {string} phone - 手机号
 * @returns {string} - 格式化后的手机号
 */
export function formatPhone(phone) {
  if (!phone) return ''
  const p = String(phone).replace(/\D/g, '')
  if (p.length !== 11) return phone
  return `${p.substring(0, 3)}****${p.substring(7)}`
}

/**
 * 格式化身份证号（中间8位用*代替）
 * @param {string} idCard - 身份证号
 * @returns {string} - 格式化后的身份证号
 */
export function formatIdCard(idCard) {
  if (!idCard) return ''
  const id = String(idCard)
  if (id.length !== 18) return idCard
  return `${id.substring(0, 4)}********${id.substring(12)}`
}

/**
 * 生成随机字符串
 * @param {number} length - 长度
 * @param {string} chars - 可选字符集
 * @returns {string} - 随机字符串
 */
export function generateRandomString(length = 8, chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789') {
  const random = createSeededRandom('generate-random-string')
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(random() * chars.length))
  }
  return result
}

/**
 * 生成唯一ID
 * @returns {string} - 唯一ID
 */
let _idCounter = 0
export function generateId() {
  return generateDeterministicId('id', 'gen_' + (++_idCounter))
}

/**
 * 格式化数组为字符串
 * @param {Array} arr - 数组
 * @param {string} separator - 分隔符
 * @returns {string} - 格式化后的字符串
 */
export function formatArray(arr, separator = ', ') {
  if (!Array.isArray(arr)) return ''
  return arr.join(separator)
}

/**
 * 格式化对象为查询字符串
 * @param {Object} obj - 对象
 * @returns {string} - 查询字符串
 */
export function formatQueryString(obj) {
  if (!obj || typeof obj !== 'object') return ''
  const params = []
  for (const key in obj) {
    if (obj[key] !== undefined && obj[key] !== null) {
      params.push(`${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    }
  }
  return params.join('&')
}

/**
 * 安全获取对象属性
 * @param {Object} obj - 对象
 * @param {string} path - 属性路径，如 'a.b.c'
 * @param {any} defaultValue - 默认值
 * @returns {any} - 属性值
 */
export function getProperty(obj, path, defaultValue = undefined) {
  if (!obj) return defaultValue
  const keys = path.split('.')
  let result = obj
  for (const key of keys) {
    if (result === null || result === undefined) return defaultValue
    result = result[key]
  }
  return result !== undefined ? result : defaultValue
}

/**
 * 根据数值和阈值返回对应的 CSS 类名（stat-good / stat-warn / stat-danger）
 * 用于统计数字的条件着色，替代内联 :style 三元表达式
 * @param {number} value - 当前数值
 * @param {number} goodThreshold - 达标阈值（>= 为 good）
 * @param {number} warnThreshold - 警告阈值（>= 为 warn，< 为 danger）
 * @returns {string} CSS 类名
 */
export function getValueColorClass(value, goodThreshold = 80, warnThreshold = 60) {
  if (value >= goodThreshold) return 'stat-good'
  if (value >= warnThreshold) return 'stat-warn'
  return 'stat-danger'
}