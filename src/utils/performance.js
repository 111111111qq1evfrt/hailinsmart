/**
 * 性能优化工具函数
 */

/**
 * 防抖函数
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Function} - 防抖后的函数
 */
export function debounce(fn, delay = 300) {
  let timer = null
  return function (...args) {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(this, args)
    }, delay)
  }
}

/**
 * 节流函数
 * @param {Function} fn - 需要节流的函数
 * @param {number} delay - 节流时间(ms)
 * @returns {Function} - 节流后的函数
 */
export function throttle(fn, delay = 300) {
  let lastTime = 0
  return function (...args) {
    const now = Date.now()
    if (now - lastTime >= delay) {
      lastTime = now
      fn.apply(this, args)
    }
  }
}

/**
 * 防抖Promise
 * @param {Function} fn - 返回Promise的函数
 * @param {number} delay - 延迟时间(ms)
 * @returns {Function} - 防抖后的函数
 */
export function debouncePromise(fn, delay = 300) {
  let timer = null
  return function (...args) {
    return new Promise((resolve, reject) => {
      if (timer) clearTimeout(timer)
      timer = setTimeout(async () => {
        try {
          const result = await fn.apply(this, args)
          resolve(result)
        } catch (error) {
          reject(error)
        }
      }, delay)
    })
  }
}

/**
 * 图片懒加载观察器
 * @param {string} selector - 图片选择器
 * @param {Object} options - IntersectionObserver 配置
 * @returns {IntersectionObserver} - 观察器实例
 */
export function lazyLoadImages(selector = 'img[data-src]', options = {}) {
  const defaultOptions = {
    rootMargin: '50px',
    threshold: 0.1
  }
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target
        const src = img.dataset.src
        if (src) {
          img.src = src
          img.removeAttribute('data-src')
        }
        observer.unobserve(img)
      }
    })
  }, { ...defaultOptions, ...options })
  
  document.querySelectorAll(selector).forEach(img => {
    observer.observe(img)
  })
  
  return observer
}

/**
 * 请求缓存工具
 */
export class RequestCache {
  constructor() {
    this.cache = new Map()
    this.expireTime = 5 * 60 * 1000 // 默认5分钟过期
  }
  
  /**
   * 获取缓存
   * @param {string} key - 缓存键
   * @returns {any|null} - 缓存值
   */
  get(key) {
    const item = this.cache.get(key)
    if (!item) return null
    
    if (Date.now() > item.expire) {
      this.cache.delete(key)
      return null
    }
    
    return item.value
  }
  
  /**
   * 设置缓存
   * @param {string} key - 缓存键
   * @param {any} value - 缓存值
   * @param {number} expire - 过期时间(ms)
   */
  set(key, value, expire = this.expireTime) {
    this.cache.set(key, {
      value,
      expire: Date.now() + expire
    })
  }
  
  /**
   * 删除缓存
   * @param {string} key - 缓存键
   */
  delete(key) {
    this.cache.delete(key)
  }
  
  /**
   * 清空所有缓存
   */
  clear() {
    this.cache.clear()
  }
  
  /**
   * 获取缓存数量
   * @returns {number} - 缓存数量
   */
  size() {
    return this.cache.size
  }
}

/**
 * 批量处理工具
 * @param {Array} items - 待处理的数组
 * @param {Function} handler - 处理函数
 * @param {number} batchSize - 每批处理数量
 * @param {number} delay - 批次间隔时间(ms)
 * @returns {Promise} - 处理完成的Promise
 */
export async function batchProcess(items, handler, batchSize = 10, delay = 100) {
  const results = []
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(handler))
    results.push(...batchResults)
    
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }
  return results
}

/**
 * 计算属性缓存装饰器
 * @param {Function} getter - 获取函数
 * @returns {Function} - 缓存后的函数
 */
export function memoize(getter) {
  let cache = null
  let cacheArgs = null
  
  return function (...args) {
    const argsString = JSON.stringify(args)
    if (cache === null || cacheArgs !== argsString) {
      cache = getter.apply(this, args)
      cacheArgs = argsString
    }
    return cache
  }
}

/**
 * 定时器管理器
 */
export class TimerManager {
  constructor() {
    this.timers = new Set()
  }
  
  /**
   * 设置定时器
   * @param {Function} callback - 回调函数
   * @param {number} delay - 延迟时间(ms)
   * @returns {number} - 定时器ID
   */
  setTimeout(callback, delay) {
    const timerId = window.setTimeout(() => {
      this.timers.delete(timerId)
      callback()
    }, delay)
    this.timers.add(timerId)
    return timerId
  }
  
  /**
   * 设置循环定时器
   * @param {Function} callback - 回调函数
   * @param {number} interval - 间隔时间(ms)
   * @returns {number} - 定时器ID
   */
  setInterval(callback, interval) {
    const timerId = window.setInterval(callback, interval)
    this.timers.add(timerId)
    return timerId
  }
  
  /**
   * 清除定时器
   * @param {number} timerId - 定时器ID
   */
  clearTimeout(timerId) {
    window.clearTimeout(timerId)
    this.timers.delete(timerId)
  }
  
  /**
   * 清除循环定时器
   * @param {number} timerId - 定时器ID
   */
  clearInterval(timerId) {
    window.clearInterval(timerId)
    this.timers.delete(timerId)
  }
  
  /**
   * 清除所有定时器
   */
  clearAll() {
    this.timers.forEach(timerId => {
      window.clearTimeout(timerId)
      window.clearInterval(timerId)
    })
    this.timers.clear()
  }
  
  /**
   * 获取定时器数量
   * @returns {number} - 定时器数量
   */
  size() {
    return this.timers.size
  }
}

/**
 * 生成虚拟列表数据（用于大数据量列表优化）
 * @param {Array} data - 原始数据
 * @param {number} visibleCount - 可见数量
 * @param {number} scrollTop - 滚动位置
 * @param {number} itemHeight - 每项高度
 * @returns {Object} - 包含可见数据和偏移量
 */
export function getVirtualListData(data, visibleCount, scrollTop, itemHeight) {
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(startIndex + visibleCount + 10, data.length)
  const offsetTop = startIndex * itemHeight
  
  return {
    visibleData: data.slice(startIndex, endIndex),
    offsetTop,
    startIndex,
    endIndex
  }
}