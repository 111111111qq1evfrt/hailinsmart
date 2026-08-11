/**
 * 日期处理工具函数
 */

/**
 * 格式化日期为指定格式
 * @param {Date|string|number} date - 日期对象、日期字符串或时间戳
 * @param {string} format - 格式化字符串，如 'YYYY-MM-DD HH:mm:ss'
 * @returns {string} - 格式化后的日期字符串
 */
export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = new Date(date)
  if (isNaN(d.getTime())) return ''
  
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

/**
 * 获取今天的日期字符串
 * @param {string} format - 格式化字符串
 * @returns {string} - 今天的日期字符串
 */
export function getToday(format = 'YYYY-MM-DD') {
  return formatDate(new Date(), format)
}

/**
 * 获取当前时间戳（毫秒）
 * @returns {number} - 当前时间戳
 */
export function getTimestamp() {
  return Date.now()
}

/**
 * 计算两个日期之间的天数差
 * @param {Date|string} date1 - 起始日期
 * @param {Date|string} date2 - 结束日期
 * @returns {number} - 天数差
 */
export function daysBetween(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  const diffTime = Math.abs(d2 - d1)
  return Math.floor(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * 判断是否是今天
 * @param {Date|string} date - 日期
 * @returns {boolean} - 是否是今天
 */
export function isToday(date) {
  const d = new Date(date)
  const today = new Date()
  return d.toDateString() === today.toDateString()
}

/**
 * 判断是否是本周
 * @param {Date|string} date - 日期
 * @returns {boolean} - 是否是本周
 */
export function isThisWeek(date) {
  const d = new Date(date)
  const today = new Date()
  const dayOfWeek = today.getDay() || 7
  const monday = new Date(today)
  monday.setDate(today.getDate() - dayOfWeek + 1)
  monday.setHours(0, 0, 0, 0)
  const nextMonday = new Date(monday)
  nextMonday.setDate(monday.getDate() + 7)
  return d >= monday && d < nextMonday
}

/**
 * 判断是否是本月
 * @param {Date|string} date - 日期
 * @returns {boolean} - 是否是本月
 */
export function isThisMonth(date) {
  const d = new Date(date)
  const today = new Date()
  return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear()
}

/**
 * 获取星期几
 * @param {Date|string} date - 日期
 * @returns {string} - 星期几
 */
export function getDayOfWeek(date) {
  const d = new Date(date)
  const days = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return days[d.getDay()]
}

/**
 * 获取相对时间（如 刚刚、5分钟前、3小时前等）
 * @param {Date|string|number} date - 日期
 * @returns {string} - 相对时间描述
 */
export function getRelativeTime(date) {
  const d = new Date(date)
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day
  const month = 30 * day
  
  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
  if (diff < day) return `${Math.floor(diff / hour)}小时前`
  if (diff < week) return `${Math.floor(diff / day)}天前`
  if (diff < month) return `${Math.floor(diff / week)}周前`
  
  return formatDate(d, 'YYYY-MM-DD')
}

/**
 * 获取指定月份的第一天
 * @param {Date|string} date - 日期
 * @returns {Date} - 该月第一天
 */
export function getFirstDayOfMonth(date) {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/**
 * 获取指定月份的最后一天
 * @param {Date|string} date - 日期
 * @returns {Date} - 该月最后一天
 */
export function getLastDayOfMonth(date) {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

/**
 * 添加天数
 * @param {Date|string} date - 日期
 * @param {number} days - 要添加的天数
 * @returns {Date} - 新日期
 */
export function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

/**
 * 添加月份
 * @param {Date|string} date - 日期
 * @param {number} months - 要添加的月份
 * @returns {Date} - 新日期
 */
export function addMonths(date, months) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

/**
 * 比较两个日期
 * @param {Date|string} date1 - 日期1
 * @param {Date|string} date2 - 日期2
 * @returns {number} - -1: date1 < date2, 0: date1 === date2, 1: date1 > date2
 */
export function compareDates(date1, date2) {
  const d1 = new Date(date1)
  const d2 = new Date(date2)
  if (d1 < d2) return -1
  if (d1 > d2) return 1
  return 0
}

/**
 * 判断日期是否在指定范围内
 * @param {Date|string} date - 要判断的日期
 * @param {Date|string} startDate - 开始日期
 * @param {Date|string} endDate - 结束日期
 * @returns {boolean} - 是否在范围内
 */
export function isDateInRange(date, startDate, endDate) {
  const d = new Date(date)
  const start = new Date(startDate)
  const end = new Date(endDate)
  return d >= start && d <= end
}