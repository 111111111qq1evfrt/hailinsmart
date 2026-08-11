import axios from 'axios'
import { SPORT_TYPES, getSportTypeName, getSportTypeUnit, getProductTypeName, getModeName } from '@/config/sport-types'
import { sportTypeMapping, getSportConfigByType } from '@/config/sport-config'

const BASE_URL = '/api/sports'

// 请求级缓存：相同参数 30 秒内复用 Promise，避免重复请求
const requestCache = new Map()
const CACHE_TTL = 30000

function getCachedRequest(cacheKey, requestFn) {
  const cached = requestCache.get(cacheKey)
  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return cached.promise
  }
  const promise = requestFn()
  requestCache.set(cacheKey, { promise, time: Date.now() })
  return promise
}

const sportsApi = {
  async getList(schoolId, filters = {}) {
    const params = { school_id: schoolId, ...filters }
    const cacheKey = `${BASE_URL}/list?${new URLSearchParams(params).toString()}`
    return getCachedRequest(cacheKey, async () => {
      const res = await axios.get(`${BASE_URL}/list`, { params })
      return res.data
    })
  },

  async getTodayStats(schoolId) {
    const cacheKey = `${BASE_URL}/stats/today?school_id=${schoolId}`
    return getCachedRequest(cacheKey, async () => {
      const res = await axios.get(`${BASE_URL}/stats/today`, { params: { school_id: schoolId } })
      return res.data
    })
  },

  async getRanking(schoolId, sportType, limit = 100) {
    const params = { school_id: schoolId, sport_type: sportType, limit }
    const cacheKey = `${BASE_URL}/ranking?${new URLSearchParams(params).toString()}`
    return getCachedRequest(cacheKey, async () => {
      const res = await axios.get(`${BASE_URL}/ranking`, { params })
      return res.data
    })
  },

  async getStatistics(schoolId) {
    const cacheKey = `${BASE_URL}/statistics?school_id=${schoolId}`
    return getCachedRequest(cacheKey, async () => {
      const res = await axios.get(`${BASE_URL}/statistics`, {
        params: { school_id: schoolId }
      })
      return res.data
    })
  },

  async healthCheck() {
    const res = await axios.get('/api/health')
    return res.data
  }
}

// 数据转换层：大沩推送数据 → 前端展示结构

// 转换单条推送记录
export function transformPushRecord(record) {
  if (!record) return null

  const sportType = record.sport_type
  const sportInfo = SPORT_TYPES[sportType]
  const sportConfig = getSportConfigByType(sportType)

  // 转换运动结果列表
  const items = (record.sport_result || []).map(item => {
    const base = {
      personId: item.person_id,
      startTime: item.start_time,
      duration: item.all_time,
      score: Number(item.score) || 0,
      interruptCount: item.interrupt_count || 0,
      subCountList: item.sub_count_list || [],
      videoFileId: item.video_file_id,
      faceFileId: item.face_file_id
    }

    // BMI测试：身高体重
    if (item.weight !== undefined) base.weight = item.weight
    if (item.height !== undefined) base.height = item.height
    if (item.weight && item.height) {
      base.bmi = (item.weight / Math.pow(item.height / 100, 2)).toFixed(1)
    }

    // 跳远项目：姿态数据
    if (item.jump_speed !== undefined) base.jumpSpeed = item.jump_speed
    if (item.jump_height !== undefined) base.jumpHeight = item.jump_height
    if (item.jump_angle !== undefined) base.jumpAngle = item.jump_angle
    if (item.arm_angle !== undefined) base.armAngle = item.arm_angle

    // 跑步项目：反应时间
    if (item.reaction_time !== undefined) base.reactionTime = item.reaction_time

    return base
  })

  return {
    id: record.id,
    schoolId: record.school_id,
    sportType: sportType,
    sportTypeName: getSportTypeName(sportType),
    sportTypeUnit: getSportTypeUnit(sportType),
    sportConfig: sportConfig,
    productType: record.product_type,
    productTypeName: getProductTypeName(record.product_type),
    mode: record.mode,
    modeName: getModeName(record.mode),
    items: items,
    itemCount: items.length,
    receivedAt: record.received_at,
    receivedAtFormatted: formatTime(record.received_at)
  }
}

// 转换列表数据
export function transformPushList(list) {
  if (!Array.isArray(list)) return []
  return list.map(transformPushRecord).filter(Boolean)
}

// 转换统计数据
export function transformStatistics(stats) {
  if (!stats) return null

  // 转换运动类型统计
  const bySportType = {}
  Object.entries(stats.by_sport_type || {}).forEach(([type, data]) => {
    const sportInfo = SPORT_TYPES[type]
    bySportType[type] = {
      name: sportInfo?.name || '未知',
      count: data.count,
      items: data.items,
      totalScore: data.total_score,
      avgScore: data.items > 0 ? (data.total_score / data.items).toFixed(1) : '0.0'
    }
  })

  return {
    totalSessions: stats.total_sessions || 0,
    bySportType,
    byMode: stats.by_mode || { 1: { count: 0, items: 0 }, 2: { count: 0, items: 0 } },
    byProductType: stats.by_product_type || {},
    daily: stats.daily || {}
  }
}

// 转换今日统计
export function transformTodayStats(stats) {
  if (!stats) return null
  return {
    date: stats.date,
    totalSessions: stats.total_sessions || 0,
    totalItems: stats.total_items || 0,
    avgScore: stats.avg_score || '0.0',
    passRate: stats.pass_rate || '0.0'
  }
}

// 转换排行榜数据
export function transformRankingList(rankingList, sportType) {
  if (!Array.isArray(rankingList)) return []
  return rankingList.map((item, index) => ({
    rank: index + 1,
    personId: item.person_id,
    score: item.score,
    unit: getSportTypeUnit(sportType),
    time: item.all_time,
    sportType: item.sport_type,
    mode: item.mode,
    receivedAt: item.received_at
  }))
}

// 格式化时间
function formatTime(timestamp) {
  if (!timestamp) return '-'
  const d = new Date(timestamp)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export default sportsApi
