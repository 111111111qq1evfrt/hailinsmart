const mysql = require('mysql2/promise')
const config = require('../config')

const CREATE_DATABASE_SQL = `
CREATE DATABASE IF NOT EXISTS ${config.database.database} 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci
`

const USE_DATABASE_SQL = `USE ${config.database.database}`

const CREATE_SESSION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS sport_session (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_uuid VARCHAR(64) NOT NULL COMMENT '会话唯一标识',
  version VARCHAR(10) NOT NULL DEFAULT 'v1.1' COMMENT '协议版本',
  school_id VARCHAR(64) NOT NULL COMMENT '学校ID',
  product_type TINYINT NOT NULL COMMENT '产品类型 1:AI运动吧 2:AI体测吧 3:AI操场吧',
  sport_type TINYINT NOT NULL COMMENT '运动类型',
  mode TINYINT NOT NULL COMMENT '运动模式 1:练习 2:测试',
  result_count INT NOT NULL DEFAULT 0 COMMENT '结果条数',
  created_at DATETIME NOT NULL COMMENT '设备推送时间',
  received_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '接收时间',
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除',
  INDEX idx_school_id (school_id),
  INDEX idx_sport_type (sport_type),
  INDEX idx_mode (mode),
  INDEX idx_created_at (created_at),
  INDEX idx_school_sport (school_id, sport_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运动会话表'
`

const CREATE_RESULT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS sport_result (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id BIGINT UNSIGNED NOT NULL COMMENT '关联会话ID',
  person_id VARCHAR(64) NULL COMMENT '人员ID',
  person_id_empty TINYINT NOT NULL DEFAULT 1 COMMENT '是否未识别 0:已识别 1:未识别',
  start_time BIGINT NULL COMMENT '开始时间戳',
  all_time INT NULL COMMENT '运动时长(秒)',
  score DECIMAL(10,2) NULL COMMENT '成绩',
  interrupt_count INT NULL COMMENT '中断次数',
  jump_speed DECIMAL(6,2) NULL COMMENT '平均速度',
  jump_height DECIMAL(6,1) NULL COMMENT '腾空高度',
  jump_angle DECIMAL(5,1) NULL COMMENT '起跳角度',
  arm_angle DECIMAL(5,1) NULL COMMENT '摆臂振幅',
  sub_count_list JSON NULL COMMENT '分段计数',
  reaction_time INT NULL COMMENT '反应时间',
  weight DECIMAL(5,1) NULL COMMENT '体重',
  height DECIMAL(5,1) NULL COMMENT '身高',
  video_file_id VARCHAR(128) NULL COMMENT '视频文件ID',
  face_file_id VARCHAR(128) NULL COMMENT '人脸文件ID',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除',
  INDEX idx_session_id (session_id),
  INDEX idx_person_id (person_id),
  INDEX idx_score (score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运动结果表'
`

const CREATE_FILE_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS sport_file (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  file_id VARCHAR(128) NOT NULL COMMENT '文件ID',
  school_id VARCHAR(64) NOT NULL COMMENT '学校ID',
  file_type TINYINT NOT NULL COMMENT '文件类型 1:jpg 2:mp4',
  file_name VARCHAR(255) NULL COMMENT '原始文件名',
  file_size BIGINT NULL COMMENT '文件大小',
  file_path VARCHAR(500) NULL COMMENT '存储路径',
  mime_type VARCHAR(50) NULL COMMENT 'MIME类型',
  related_result_id BIGINT UNSIGNED NULL COMMENT '关联结果ID',
  uploaded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '上传时间',
  is_deleted TINYINT NOT NULL DEFAULT 0 COMMENT '软删除',
  UNIQUE INDEX idx_file_id (file_id),
  INDEX idx_school_id (school_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='运动文件表'
`

const CREATE_DAILY_STAT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS sport_daily_stat (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id VARCHAR(64) NOT NULL COMMENT '学校ID',
  stat_date DATE NOT NULL COMMENT '统计日期',
  sport_type TINYINT NOT NULL COMMENT '运动类型',
  mode TINYINT NOT NULL COMMENT '运动模式',
  total_sessions INT NOT NULL DEFAULT 0 COMMENT '总会话数',
  total_results INT NOT NULL DEFAULT 0 COMMENT '总结果数',
  total_score DECIMAL(12,2) NULL COMMENT '总分数',
  avg_score DECIMAL(8,2) NULL COMMENT '平均分数',
  person_count INT NULL COMMENT '参与人数',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  UNIQUE INDEX idx_school_date_sport_mode (school_id, stat_date, sport_type, mode)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='每日统计表'
`

async function initDatabase() {
  let mainPool = null
  let tempPool = null
  
  try {
    console.log('[DB] Connecting to MySQL server...')
    
    // 先连接MySQL服务器（不指定数据库）
    tempPool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      charset: 'utf8mb4'
    })
    
    console.log('[DB] Creating database...')
    await tempPool.query(CREATE_DATABASE_SQL)
    console.log('[DB] Database created successfully')
    
    await tempPool.end()
    
    // 连接到新建的数据库
    mainPool = mysql.createPool({
      host: config.database.host,
      port: config.database.port,
      user: config.database.user,
      password: config.database.password,
      database: config.database.database,
      charset: 'utf8mb4'
    })
    
    console.log('[DB] Creating tables...')
    
    await mainPool.query(CREATE_SESSION_TABLE_SQL)
    console.log('[DB] sport_session table created')
    
    await mainPool.query(CREATE_RESULT_TABLE_SQL)
    console.log('[DB] sport_result table created')
    
    await mainPool.query(CREATE_FILE_TABLE_SQL)
    console.log('[DB] sport_file table created')
    
    await mainPool.query(CREATE_DAILY_STAT_TABLE_SQL)
    console.log('[DB] sport_daily_stat table created')
    
    console.log('[DB] Database initialization completed!')
  } catch (err) {
    console.error('[DB] Initialization failed:', err.message)
    throw err
  } finally {
    if (tempPool) await tempPool.end().catch(() => {})
    if (mainPool) await mainPool.end().catch(() => {})
  }
}

if (require.main === module) {
  initDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err)
      process.exit(1)
    })
}

module.exports = { initDatabase }
