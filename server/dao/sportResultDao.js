const db = require('../database/connection')

async function batchInsert(sessionId, results, conn) {
  const exec = conn || db
  
  const values = results.map(r => [
    sessionId,
    r.person_id || null,
    r.person_id ? 0 : 1,
    r.start_time || null,
    r.all_time || null,
    r.score || null,
    r.interrupt_count || null,
    r.jump_speed || null,
    r.jump_height || null,
    r.jump_angle || null,
    r.arm_angle || null,
    r.sub_count_list ? JSON.stringify(r.sub_count_list) : null,
    r.reaction_time || null,
    r.weight || null,
    r.height || null,
    r.video_file_id || null,
    r.face_file_id || null
  ])
  
  await exec.execute(
    `INSERT INTO sport_result 
     (session_id, person_id, person_id_empty, start_time, all_time, score, 
      interrupt_count, jump_speed, jump_height, jump_angle, arm_angle, 
      sub_count_list, reaction_time, weight, height, video_file_id, face_file_id)
     VALUES ?`,
    [values]
  )
}

async function findById(id) {
  const rows = await db.query(
    'SELECT * FROM sport_result WHERE id = ? AND is_deleted = 0',
    [id]
  )
  return rows[0] || null
}

async function findBySessionId(sessionId) {
  return db.query(
    'SELECT * FROM sport_result WHERE session_id = ? AND is_deleted = 0',
    [sessionId]
  )
}

async function listBySchool(schoolId, options = {}) {
  const { sport_type, mode, person_id, offset = 0, start_date, end_date } = options
  
  let sql = `SELECT r.*, s.sport_type, s.mode, s.school_id, s.created_at as session_created_at
             FROM sport_result r
             JOIN sport_session s ON r.session_id = s.id
             WHERE s.school_id = ? AND r.is_deleted = 0 AND s.is_deleted = 0`
  const params = [schoolId]
  
  if (sport_type !== undefined && sport_type !== null) {
    sql += ' AND s.sport_type = ?'
    params.push(sport_type)
  }
  
  if (mode !== undefined && mode !== null) {
    sql += ' AND s.mode = ?'
    params.push(mode)
  }
  
  if (person_id) {
    sql += ' AND r.person_id = ?'
    params.push(person_id)
  }
  
  if (start_date) {
    sql += ' AND s.created_at >= ?'
    params.push(start_date)
  }
  
  if (end_date) {
    sql += ' AND s.created_at <= ?'
    params.push(end_date)
  }
  
  sql += ` ORDER BY s.created_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`
  
  return db.query(sql, params)
}

async function getRanking(schoolId, sportType) {
  let sql = `SELECT r.person_id, r.score, r.all_time, s.sport_type, s.mode, s.created_at
             FROM sport_result r
             JOIN sport_session s ON r.session_id = s.id
             WHERE s.school_id = ? AND r.is_deleted = 0 AND s.is_deleted = 0`
  const params = [schoolId]
  
  if (sportType) {
    sql += ' AND s.sport_type = ?'
    params.push(sportType)
  }
  
  const isTimeType = [11, 12, 13, 14, 15, 20, 21].includes(Number(sportType))
  
  if (isTimeType) {
    sql += ' AND r.score IS NOT NULL ORDER BY r.score ASC'
  } else {
    sql += ' AND r.score IS NOT NULL ORDER BY r.score DESC'
  }
  
  sql += ` LIMIT ${parseInt(limit)}`
  
  return db.query(sql, params)
}

async function getStatistics(schoolId) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  
  const sql = `
    SELECT 
      s.sport_type,
      s.mode,
      COUNT(DISTINCT s.id) as session_count,
      COUNT(r.id) as result_count,
      COUNT(DISTINCT r.person_id) as person_count,
      SUM(r.score) as total_score,
      AVG(r.score) as avg_score
    FROM sport_session s
    LEFT JOIN sport_result r ON s.id = r.session_id AND r.is_deleted = 0
    WHERE s.school_id = ? AND s.is_deleted = 0
    GROUP BY s.sport_type, s.mode
  `
  
  const dailySql = `
    SELECT 
      s.sport_type,
      s.mode,
      COUNT(DISTINCT s.id) as session_count,
      COUNT(r.id) as result_count,
      COUNT(DISTINCT r.person_id) as person_count,
      SUM(r.score) as total_score
    FROM sport_session s
    LEFT JOIN sport_result r ON s.id = r.session_id AND r.is_deleted = 0
    WHERE s.school_id = ? AND s.is_deleted = 0 AND DATE(s.created_at) = ?
    GROUP BY s.sport_type, s.mode
  `
  
  const [bySportType, todayStats] = await Promise.all([
    db.query(sql, [schoolId]),
    db.query(dailySql, [schoolId, todayStr])
  ])
  
  return {
    total: bySportType,
    today: todayStats
  }
}

module.exports = { batchInsert, findById, findBySessionId, listBySchool, getRanking, getStatistics }
