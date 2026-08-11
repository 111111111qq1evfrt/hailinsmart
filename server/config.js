const path = require('path')

const config = {
  port: process.env.PUSH_SERVER_PORT || 8000,
  checkString: process.env.PUSH_CHECK_STRING || 'hailin_sport_check_2026',
  dataDir: path.join(__dirname, 'data', 'sport_results'),
  fileDir: path.join(__dirname, 'uploads'),
  maxFileSize: 50 * 1024 * 1024,
  allowedFileTypes: [1, 2],
  requestLimit: 1000,
  requestWindow: 60000,
  timestampTolerance: 5 * 60 * 1000,
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'smart_pe_sports',
    waitForConnection: true,
    connectionLimit: 10
  },
  
  storage: {
    useMySQL: process.env.USE_MYSQL !== 'false'
  }
}

module.exports = config
