// 注入测试数据脚本（含完整字段）
const crypto = require('crypto')
const mysql = require('mysql2/promise')

const config = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  database: 'smart_pe_sports'
}

// 三所学校
const schools = [
  { id: 'hailin-second-primary', name: '海林市第二小学' },
  { id: 'hailin-zirong-primary', name: '海林市子荣小学' },
  { id: 'linhai-experimental-primary', name: '林海实验小学' }
]

// 运动类型（新增 BMI）
const sportTypes = [1, 2, 6, 7, 10, 11, 19]

// 运动类型对应的分数范围
const scoreRanges = {
  1: [100, 200],    // 跳绳 100-200个/分钟
  2: [150, 250],    // 跳远 150-250cm
  6: [30, 60],      // 仰卧起坐 30-60个/分钟
  7: [80, 150],     // 高抬腿 80-150个/分钟
  10: [16, 24],     // BMI 16-24
  11: [7, 12],      // 50米跑 7-12秒
  19: [1000, 5000]  // 阳光跑 1000-5000米
}

// 学生ID
function generateStudentId(schoolId, index) {
  const prefix = schoolId === 'hailin-second-primary' ? 'S_903' : 
                 schoolId === 'hailin-zirong-primary' ? 'S_904' : 'S_905'
  return `${prefix}${String(100 + index).padStart(4, '0')}`
}

function getRandomScore(type) {
  const [min, max] = scoreRanges[type]
  if (type === 10) {
    // BMI 特殊计算
    const height = 130 + Math.random() * 40 // 130-170cm
    const bmi = 16 + Math.random() * 8 // 16-24
    const weight = bmi * Math.pow(height / 100, 2)
    return { score: bmi.toFixed(1), weight: weight.toFixed(1), height: height.toFixed(1) }
  }
  return { score: (Math.random() * (max - min) + min).toFixed(1) }
}

function getRandomItem(sportType, studentId) {
  const scoreData = getRandomScore(sportType)
  const item = {
    person_id: studentId,
    start_time: Date.now() - Math.random() * 3600000,
    all_time: Math.floor(Math.random() * 60) + 30,
    score: scoreData.score,
    interrupt_count: sportType === 1 || sportType === 6 ? Math.floor(Math.random() * 3) : 0
  }
  
  // 根据运动类型添加特定字段
  if (sportType === 2) { // 跳远
    item.jump_speed = (Math.random() * 3 + 2).toFixed(2)
    item.jump_height = (Math.random() * 20 + 30).toFixed(1)
    item.jump_angle = (Math.random() * 15 + 30).toFixed(1)
    item.arm_angle = (Math.random() * 20 + 50).toFixed(1)
  } else if (sportType === 10) { // BMI
    item.weight = scoreData.weight
    item.height = scoreData.height
  } else if (sportType === 11 || sportType === 12 || sportType === 13 || sportType === 14 || sportType === 15) { // 跑步
    item.reaction_time = Math.floor(Math.random() * 100) + 100
  }
  
  return item
}

async function injectTestData() {
  const pool = mysql.createPool(config)
  
  try {
    console.log('清空旧数据...')
    await pool.query('SET FOREIGN_KEY_CHECKS = 0')
    await pool.query('TRUNCATE TABLE sport_daily_stat')
    await pool.query('TRUNCATE TABLE sport_result')
    await pool.query('TRUNCATE TABLE sport_session')
    await pool.query('SET FOREIGN_KEY_CHECKS = 1')
    
    console.log('开始注入测试数据...')
    
    let sessionCount = 0
    let resultCount = 0
    
    for (const school of schools) {
      console.log(`\n处理学校: ${school.name}`)
      
      // 每所学校生成 40 条记录（增加 BMI 数据）
      for (let i = 0; i < 40; i++) {
        // 确保 BMI 类型占一定比例
        let sportType
        if (i < 8) {
          sportType = 10 // 前 8 条强制 BMI
        } else {
          sportType = sportTypes[Math.floor(Math.random() * sportTypes.length)]
        }
        
        const mode = Math.random() > 0.3 ? 1 : 2 // 70%练习模式，30%测试模式
        const studentCount = Math.floor(Math.random() * 5) + 1 // 每次1-5个学生
        const sessionDate = new Date()
        sessionDate.setDate(sessionDate.getDate() - Math.floor(Math.random() * 7)) // 最近7天
        
        // 生成会话
        const sessionUuid = crypto.randomUUID()
        const [sessionResult] = await pool.execute(
          `INSERT INTO sport_session 
           (session_uuid, version, school_id, product_type, sport_type, mode, result_count, created_at, received_at)
           VALUES (?, 'v1.1', ?, 1, ?, ?, ?, ?, ?)`,
          [sessionUuid, school.id, sportType, mode, studentCount, sessionDate, sessionDate]
        )
        const sessionId = sessionResult.insertId
        sessionCount++
        
        // 生成运动结果
        const results = []
        for (let j = 0; j < studentCount; j++) {
          const studentId = generateStudentId(school.id, i * 5 + j)
          const item = getRandomItem(sportType, studentId)
          results.push([
            sessionId,
            item.person_id,
            0,
            item.start_time,
            item.all_time,
            item.score,
            item.interrupt_count,
            item.jump_speed || null,
            item.jump_height || null,
            item.jump_angle || null,
            item.arm_angle || null,
            null, // sub_count_list
            item.reaction_time || null,
            item.weight || null,
            item.height || null,
            null, // video_file_id
            null  // face_file_id
          ])
          resultCount++
        }
        
        await pool.query(
          `INSERT INTO sport_result 
           (session_id, person_id, person_id_empty, start_time, all_time, score, 
            interrupt_count, jump_speed, jump_height, jump_angle, arm_angle, 
            sub_count_list, reaction_time, weight, height, video_file_id, face_file_id)
           VALUES ?`,
          [results]
        )
        
        // 更新每日统计
        const statDate = sessionDate.toISOString().split('T')[0]
        const totalScore = results.reduce((sum, r) => sum + Number(r[5]), 0)
        const avgScore = (totalScore / studentCount).toFixed(1)
        
        await pool.execute(
          `INSERT INTO sport_daily_stat 
           (school_id, stat_date, sport_type, mode, total_sessions, total_results, total_score, avg_score)
           VALUES (?, ?, ?, ?, 1, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           total_sessions = total_sessions + 1,
           total_results = total_results + VALUES(total_results),
           total_score = total_score + VALUES(total_score),
           avg_score = (total_score + VALUES(total_score)) / (total_results + VALUES(total_results))`,
          [school.id, statDate, sportType, mode, studentCount, totalScore, avgScore]
        )
        
        if ((i + 1) % 10 === 0) {
          console.log(`  已处理 ${i + 1}/40 条记录`)
        }
      }
      
      console.log(`  ✓ ${school.name} 完成`)
    }
    
    console.log(`\n数据注入完成！`)
    console.log(`  会话记录: ${sessionCount} 条`)
    console.log(`  运动结果: ${resultCount} 条`)
    
    // 查询统计
    const [stats] = await pool.query(`
      SELECT s.school_id, COUNT(DISTINCT s.id) as sessions, COUNT(r.id) as results
      FROM sport_session s
      LEFT JOIN sport_result r ON s.id = r.session_id
      GROUP BY s.school_id
    `)
    
    console.log('\n各学校数据统计:')
    for (const stat of stats) {
      const school = schools.find(s => s.id === stat.school_id)
      console.log(`  ${school?.name || stat.school_id}: ${stat.sessions} 个会话, ${stat.results} 条结果`)
    }
    
    // BMI 数据统计
    const [bmiStats] = await pool.query(`
      SELECT s.school_id, COUNT(*) as bmi_count, 
             AVG(r.weight) as avg_weight, AVG(r.height) as avg_height
      FROM sport_session s
      JOIN sport_result r ON s.id = r.session_id
      WHERE s.sport_type = 10
      GROUP BY s.school_id
    `)
    
    console.log('\nBMI 数据统计:')
    for (const stat of bmiStats) {
      const school = schools.find(s => s.id === stat.school_id)
      console.log(`  ${school?.name || stat.school_id}: ${stat.bmi_count} 条, 平均体重 ${stat.avg_weight?.toFixed(1)}kg, 平均身高 ${stat.avg_height?.toFixed(1)}cm`)
    }
    
  } catch (err) {
    console.error('数据注入失败:', err.message)
  } finally {
    await pool.end()
  }
}

injectTestData()
