const express = require('express')
const cors = require('cors')
const path = require('path')
const config = require('./config')
const sportDataRouter = require('./routes/sportData')
const fileUploadRouter = require('./routes/fileUpload')

const app = express()

app.use(cors())
app.use(express.json({ limit: '50mb' }))
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

app.use('/api/sports', sportDataRouter)
app.use('/api/sports/files', fileUploadRouter)

app.get('/api/health', async (req, res) => {
  let dbStatus = 'disconnected'
  
  try {
    const { getPool } = require('./database/connection')
    const pool = await getPool()
    await pool.query('SELECT 1')
    dbStatus = 'connected'
  } catch (err) {
    // 数据库不可用，但服务仍可运行
  }
  
  res.json({ 
    status: 'ok', 
    service: 'smart-pe-push-server', 
    timestamp: Date.now(),
    database: dbStatus
  })
})

app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err.message)
  res.status(200).json({ code: '50001', message: '服务器内部错误', data: null })
})

async function startServer() {
  if (config.storage.useMySQL) {
    try {
      const { createPool } = require('./database/connection')
      await createPool()
      console.log('[Smart PE] MySQL 数据库连接成功')
    } catch (err) {
      console.warn('[Smart PE] MySQL 连接失败，服务仍可运行：', err.message)
    }
  }
  
  app.listen(config.port, () => {
    console.log(`[Smart PE] 推送接收服务运行在 http://localhost:${config.port}`)
    console.log(`[Smart PE] check_string: ${config.checkString}`)
    console.log(`[Smart PE] 数据存储: ${config.storage.useMySQL ? 'MySQL' : 'JSON文件'}`)
  })
}

startServer()
