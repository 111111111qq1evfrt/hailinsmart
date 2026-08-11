const crypto = require('crypto')
const config = require('../config')
const { SPORT_TYPES, PRODUCT_TYPES, SPORT_MODES } = require('../config/sport-types')
const sportSessionDao = require('../dao/sportSessionDao')
const sportResultDao = require('../dao/sportResultDao')
const sportDailyStatDao = require('../dao/sportDailyStatDao')
const { query, transaction } = require('../database/connection')

function getDateStr(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const sportDataService = {
  async createSportResult(data) {
    const sessionUuid = crypto.randomUUID()
    const now = new Date()
    
    const sessionData = {
      session_uuid: sessionUuid,
      version: data.version || 'v1.1',
      school_id: data.school_id,
      product_type: data.product_type,
      sport_type: data.sport_type,
      mode: data.mode,
      created_at: now,
      received_at: now
    }
    
    const results = data.sport_result.map(item => ({
      person_id: item.person_id || null,
      start_time: item.start_time || null,
      all_time: item.all_time || null,
      score: item.score || null,
      interrupt_count: item.interrupt_count || null,
      jump_speed: item.jump_speed || null,
      jump_height: item.jump_height || null,
      jump_angle: item.jump_angle || null,
      arm_angle: item.arm_angle || null,
      sub_count_list: item.sub_count_list || null,
      reaction_time: item.reaction_time || null,
      weight: item.weight || null,
      height: item.height || null,
      video_file_id: item.video_file_id || null,
      face_file_id: item.face_file_id || null
    }))
    
    try {
      await transaction(async (conn) => {
        const sessionId = await sportSessionDao.insert(sessionData, results, conn)
        await sportResultDao.batchInsert(sessionId, results, conn)
      })
      
      const statDate = getDateStr(now)
      await sportDailyStatDao.upsert(data.school_id, statDate, data.sport_type, data.mode)
      
      return {
        id: sessionUuid,
        session_id: null,
        school_id: data.school_id,
        sport_type: data.sport_type,
        mode: data.mode,
        sport_result: data.sport_result,
        received_at: now.getTime()
      }
    } catch (err) {
      console.error('[Service] createSportResult error:', err.message)
      throw err
    }
  },

  async getSportResults(schoolId, filters = {}) {
    try {
      const options = {
        sport_type: filters.sport_type ? Number(filters.sport_type) : undefined,
        mode: filters.mode ? Number(filters.mode) : undefined,
        limit: 500,
        offset: 0
      }
      
      const sessions = await sportSessionDao.listBySchool(schoolId, options)
      const results = []
      
      for (const session of sessions) {
        const resultItems = await sportResultDao.findBySessionId(session.id)
        
        const record = {
          id: session.session_uuid,
          version: session.version,
          school_id: session.school_id,
          product_type: session.product_type,
          sport_type: session.sport_type,
          mode: session.mode,
          received_at: session.received_at ? new Date(session.received_at).getTime() : Date.now(),
          sport_result: resultItems.map(item => ({
            person_id: item.person_id,
            start_time: item.start_time,
            all_time: item.all_time,
            score: item.score,
            interrupt_count: item.interrupt_count,
            jump_speed: item.jump_speed,
            jump_height: item.jump_height,
            jump_angle: item.jump_angle,
            arm_angle: item.arm_angle,
            sub_count_list: item.sub_count_list,
            reaction_time: item.reaction_time,
            weight: item.weight,
            height: item.height,
            video_file_id: item.video_file_id,
            face_file_id: item.face_file_id
          }))
        }
        
        results.push(record)
      }
      
      return results
    } catch (err) {
      console.error('[Service] getSportResults error:', err.message)
      return []
    }
  },

  async getTodayStats(schoolId) {
    try {
      const today = new Date()
      const todayStr = getDateStr(today)
      
      const todayData = await sportDailyStatDao.getTodayStats(schoolId)
      
      let totalSessions = 0
      let totalItems = 0
      let totalScore = 0
      
      for (const stat of todayData) {
        totalSessions += stat.total_sessions
        totalItems += stat.total_results
        totalScore += Number(stat.total_score) || 0
      }
      
      const avgScore = totalItems > 0 ? (totalScore / totalItems).toFixed(1) : '0.0'
      
      return {
        date: todayStr,
        total_sessions: totalSessions,
        total_items: totalItems,
        total_score: totalScore,
        avg_score: avgScore,
        violations: 0,
        pass_rate: '100.0'
      }
    } catch (err) {
      console.error('[Service] getTodayStats error:', err.message)
      const today = new Date()
      return {
        date: getDateStr(today),
        total_sessions: 0,
        total_items: 0,
        total_score: 0,
        avg_score: '0.0',
        violations: 0,
        pass_rate: '0.0'
      }
    }
  },

  getSportTypeInfo(sportType) {
    return SPORT_TYPES[sportType] || null
  },

  getProductTypeInfo(productType) {
    return PRODUCT_TYPES[productType] || null
  },

  getModeInfo(mode) {
    return SPORT_MODES[mode] || null
  },

  async getRanking(schoolId, sportType, limit = 500) {
    try {
      const sportInfo = SPORT_TYPES[sportType]
      const isTimeBased = sportInfo?.scoreType === 'time'
      
      const rankings = await sportResultDao.getRanking(schoolId, sportType, limit)
      
      return rankings.map(r => ({
        person_id: r.person_id,
        score: Number(r.score) || 0,
        all_time: r.all_time,
        sport_type: r.sport_type,
        mode: r.mode,
        received_at: r.session_created_at || r.created_at
      }))
    } catch (err) {
      console.error('[Service] getRanking error:', err.message)
      return []
    }
  },

  async getStatistics(schoolId) {
    try {
      const stats = await sportResultDao.getStatistics(schoolId)
      
      const bySportType = {}
      const byMode = { 1: { count: 0, items: 0 }, 2: { count: 0, items: 0 } }
      
      for (const row of stats.total) {
        const sportType = row.sport_type
        const mode = row.mode
        
        if (!bySportType[sportType]) {
          bySportType[sportType] = { count: 0, items: 0, total_score: 0 }
        }
        bySportType[sportType].count += row.session_count || 0
        bySportType[sportType].items += row.result_count || 0
        bySportType[sportType].total_score += Number(row.total_score) || 0
        
        if (byMode[mode]) {
          byMode[mode].count += row.session_count || 0
          byMode[mode].items += row.result_count || 0
        }
      }
      
      const dailyStats = {}
      for (const row of stats.today) {
        const dateKey = getDateStr()
        if (!dailyStats[dateKey]) {
          dailyStats[dateKey] = { sessions: 0, items: 0 }
        }
        dailyStats[dateKey].sessions += row.session_count || 0
        dailyStats[dateKey].items += row.result_count || 0
      }
      
      let totalSessions = 0
      for (const key in bySportType) {
        totalSessions += bySportType[key].count
      }
      
      return {
        total_sessions: totalSessions,
        by_sport_type: bySportType,
        by_mode: byMode,
        by_product_type: {},
        daily: dailyStats
      }
    } catch (err) {
      console.error('[Service] getStatistics error:', err.message)
      return {
        total_sessions: 0,
        by_sport_type: {},
        by_mode: { 1: { count: 0, items: 0 }, 2: { count: 0, items: 0 } },
        by_product_type: {},
        daily: {}
      }
    }
  }
}

module.exports = sportDataService
