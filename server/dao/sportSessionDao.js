const db = require('../database/connection')

async function insert(sessionData, results, conn) {
  const exec = conn || db
  
  const [result] = await exec.query(
    `INSERT INTO sport_session 
     (session_uuid, version, school_id, product_type, sport_type, mode, result_count, created_at, received_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      sessionData.session_uuid,
      sessionData.version || 'v1.1',
      sessionData.school_id,
      sessionData.product_type,
      sessionData.sport_type,
      sessionData.mode,
      results.length,
      sessionData.created_at || new Date(),
      sessionData.received_at || new Date()
    ]
  )
  
  return result.insertId
}

async function findById(id) {
  const rows = await db.query(
    'SELECT * FROM sport_session WHERE id = ? AND is_deleted = 0',
    [id]
  )
  return rows[0] || null
}

async function findByUuid(uuid) {
  const rows = await db.query(
    'SELECT * FROM sport_session WHERE session_uuid = ? AND is_deleted = 0',
    [uuid]
  )
  return rows[0] || null
}

async function listBySchool(schoolId, options = {}) {
  const { sport_type, mode, limit = 500, offset = 0, start_date, end_date } = options
  
  let sql = `SELECT s.*, 
             (SELECT COUNT(*) FROM sport_result r WHERE r.session_id = s.id AND r.is_deleted = 0) as result_count
             FROM sport_session s 
             WHERE s.school_id = ? AND s.is_deleted = 0`
  const params = [schoolId]
  
  if (sport_type !== undefined && sport_type !== null) {
    sql += ' AND s.sport_type = ?'
    params.push(sport_type)
  }
  
  if (mode !== undefined && mode !== null) {
    sql += ' AND s.mode = ?'
    params.push(mode)
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

async function countBySchool(schoolId, options = {}) {
  const { sport_type, mode, start_date, end_date } = options
  
  let sql = 'SELECT COUNT(*) as total FROM sport_session WHERE school_id = ? AND is_deleted = 0'
  const params = [schoolId]
  
  if (sport_type !== undefined && sport_type !== null) {
    sql += ' AND sport_type = ?'
    params.push(sport_type)
  }
  
  if (mode !== undefined && mode !== null) {
    sql += ' AND mode = ?'
    params.push(mode)
  }
  
  if (start_date) {
    sql += ' AND created_at >= ?'
    params.push(start_date)
  }
  
  if (end_date) {
    sql += ' AND created_at <= ?'
    params.push(end_date)
  }
  
  const rows = await db.query(sql, params)
  return rows[0].total
}

async function softDelete(id) {
  await db.query(
    'UPDATE sport_session SET is_deleted = 1 WHERE id = ?',
    [id]
  )
}

module.exports = { insert, findById, findByUuid, listBySchool, countBySchool, softDelete }
