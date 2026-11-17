const path = require('path')

const config = {
  port: process.env.PUSH_SERVER_PORT || 8000,
  // 默认 check_string（兜底，未匹配到学校时使用）
  checkString: process.env.PUSH_CHECK_STRING || 'hailin_sport_check_2026',
  // 每校独立 check_string（key 为大沩 school_id）
  schoolCheckStrings: {
    '9e3bfcd0-4b7e-11f1-866e-1deb8b635fb2': 'hailin_second_sport_check_2026',
    '3134e620-8c87-11f1-9123-4f0e35b91b9f': 'hailin_zirong_sport_check_2026',
    '495753d0-8a2c-11f1-a428-61f2db7ec537': 'linhai_experimental_sport_check_2026'
  },
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
    password: process.env.DB_PASSWORD || 'jingyuan88',
    database: process.env.DB_NAME || 'smart_pe_sports',
    waitForConnection: true,
    connectionLimit: 10
  },
  
  storage: {
    useMySQL: process.env.USE_MYSQL !== 'false'
  }
}

module.exports = config
