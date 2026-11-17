const db = require('../database/connection')

async function insert(fileData) {
  const [result] = await db.query(
    `INSERT INTO sport_file (file_id, school_id, file_type, file_name, file_size, file_path, mime_type)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      fileData.file_id,
      fileData.school_id,
      fileData.file_type,
      fileData.file_name || null,
      fileData.file_size || null,
      fileData.file_path || null,
      fileData.mime_type || null
    ]
  )
  return result.insertId
}

async function findByFileId(fileId) {
  const rows = await db.query(
    'SELECT * FROM sport_file WHERE file_id = ? AND is_deleted = 0',
    [fileId]
  )
  return rows[0] || null
}

async function listBySchool(schoolId, options = {}) {
  const { file_type, limit = 500, offset = 0 } = options
  
  let sql = 'SELECT * FROM sport_file WHERE school_id = ? AND is_deleted = 0'
  const params = [schoolId]
  
  if (file_type !== undefined && file_type !== null) {
    sql += ' AND file_type = ?'
    params.push(file_type)
  }
  
  sql += ` ORDER BY uploaded_at DESC LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`
  
  return db.query(sql, params)
}

async function softDelete(fileId) {
  await db.query(
    'UPDATE sport_file SET is_deleted = 1 WHERE file_id = ?',
    [fileId]
  )
}

module.exports = { insert, findByFileId, listBySchool, softDelete }
