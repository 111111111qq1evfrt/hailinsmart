/**
 * 固定种子随机数生成器
 * 使用相同的种子会生成相同的随机数序列，保证数据可复现
 */

/**
 * 创建一个基于种子的随机数生成器
 * @param {number|string} seed - 随机数种子（数字或字符串）
 * @returns {function} 返回一个函数，调用时返回 0-1 之间的随机数
 */
export function createSeededRandom(seed) {
  // 将字符串种子转换为数字
  let seedNum = typeof seed === 'string' ? hashString(seed) : seed
  
  /**
   * 生成 0-1 之间的随机数
   * @returns {number}
   */
  return function() {
    // 使用线性同余生成器算法
    seedNum = (seedNum * 9301 + 49297) % 233280
    return seedNum / 233280
  }
}

/**
 * 将字符串转换为数字哈希
 * @param {string} str - 输入字符串
 * @returns {number} 数字哈希值
 */
function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash)
}

/**
 * 生成固定范围的随机整数
 * @param {function} random -  seeded random 函数
 * @param {number} min - 最小值（包含）
 * @param {number} max - 最大值（包含）
 * @returns {number}
 */
export function seededRandomInt(random, min, max) {
  return Math.floor(random() * (max - min + 1)) + min
}

/**
 * 生成固定范围的随机浮点数
 * @param {function} random - seeded random 函数
 * @param {number} min - 最小值
 * @param {number} max - 最大值
 * @returns {number}
 */
export function seededRandomFloat(random, min, max) {
  return random() * (max - min) + min
}

/**
 * 从数组中随机选择一个元素
 * @param {function} random - seeded random 函数
 * @param {Array} array - 数组
 * @returns {*}
 */
export function seededRandomChoice(random, array) {
  if (!array || array.length === 0) return null
  const index = Math.floor(random() * array.length)
  return array[index]
}

/**
 * 生成确定性 ID（替代 Date.now()）
 * @param {string} prefix - ID 前缀
 * @param {string|number} seed - 种子值
 * @returns {string}
 */
export function generateDeterministicId(prefix = 'id', seed) {
  const hash = typeof seed === 'string' ? hashString(seed) : seed
  return `${prefix}_${hash}`
}

/**
 * 全局 seeded random 实例（使用固定种子）
 * 用于需要全局一致随机序列的场景
 */
export const globalSeededRandom = createSeededRandom(42)
