const mysql = require('mysql2/promise')
const config = require('../config')

let pool = null

async function createPool() {
  if (pool) return pool

  pool = mysql.createPool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.database,
    waitForConnections: config.database.waitForConnection,
    connectionLimit: config.database.connectionLimit,
    charset: 'utf8mb4'
  })

  pool.on('error', (err) => {
    console.error('[MySQL] Connection error:', err.message)
  })

  console.log(`[MySQL] Connected to ${config.database.host}:${config.database.port}/${config.database.database}`)
  return pool
}

async function getPool() {
  if (!pool) {
    await createPool()
  }
  return pool
}

async function query(sql, params) {
  const p = await getPool()
  const [rows] = await p.query(sql, params)
  return rows
}

async function transaction(callback) {
  const p = await getPool()
  const conn = await p.getConnection()
  
  try {
    await conn.beginTransaction()
    const result = await callback(conn)
    await conn.commit()
    return result
  } catch (err) {
    await conn.rollback()
    throw err
  } finally {
    conn.release()
  }
}

async function closePool() {
  if (pool) {
    await pool.end()
    pool = null
    console.log('[MySQL] Connection pool closed')
  }
}

module.exports = { createPool, getPool, query, transaction, closePool }
