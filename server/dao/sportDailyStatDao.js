const db = require('../database/connection')

async function upsert(schoolId, statDate, sportType, mode, conn) {
  const exec = conn || db
  
  const sql = `
    INSERT INTO sport_daily_stat (school_id, stat_date, sport_type, mode, total_sessions, total_results, total_score, avg_score)
    SELECT 
      ?, ?, ?, ?,
      COUNT(DISTINCT s.id),
      COUNT(r.id),
      COALESCE(SUM(r.score), 0),
      COALESCE(AVG(r.score), 0)
    FROM sport_session s
    LEFT JOIN sport_result r ON s.id = r.session_id AND r.is_deleted = 0
    WHERE s.school_id = ? 
      AND s.sport_type = ? 
      AND s.mode = ? 
      AND s.is_deleted = 0
      AND DATE(s.created_at) = ?
    ON DUPLICATE KEY UPDATE
      total_sessions = VALUES(total_sessions),
      total_results = VALUES(total_results),
      total_score = VALUES(total_score),
      avg_score = VALUES(avg_score),
      updated_at = CURRENT_TIMESTAMP
  `
  
  await exec.query(sql, [schoolId, statDate, sportType, mode, schoolId, sportType, mode, statDate])
}

async function getByDateRange(schoolId, startDate, endDate, options = {}) {
  const { sport_type, mode } = options
  
  let sql = 'SELECT * FROM sport_daily_stat WHERE school_id = ? AND stat_date >= ? AND stat_date <= ?'
  const params = [schoolId, startDate, endDate]
  
  if (sport_type !== undefined && sport_type !== null) {
    sql += ' AND sport_type = ?'
    params.push(sport_type)
  }
  
  if (mode !== undefined && mode !== null) {
    sql += ' AND mode = ?'
    params.push(mode)
  }
  
  sql += ' ORDER BY stat_date DESC'
  
  return db.query(sql, params)
}

async function getTodayStats(schoolId, options = {}) {
  const { sport_type, mode } = options
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  let sql = 'SELECT * FROM sport_daily_stat WHERE school_id = ? AND stat_date = ?'
  const params = [schoolId, todayStr]
  
  if (sport_type !== undefined && sport_type !== null) {
    sql += ' AND sport_type = ?'
    params.push(sport_type)
  }
  
  if (mode !== undefined && mode !== null) {
    sql += ' AND mode = ?'
    params.push(mode)
  }
  
  return db.query(sql, params)
}

async function rebuildAll(schoolId) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  const types = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23]
  const modes = [1, 2]
  
  for (const type of types) {
    for (const mode of modes) {
      await upsert(schoolId, todayStr, type, mode)
    }
  }
  
  console.log(`[DailyStat] Rebuilt stats for school: ${schoolId}`)
}

module.exports = { upsert, getByDateRange, getTodayStats, rebuildAll }
