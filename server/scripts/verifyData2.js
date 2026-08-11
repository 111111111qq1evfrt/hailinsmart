const mysql = require('mysql2/promise');
(async () => {
  const pool = mysql.createPool({host:'localhost',port:3306,user:'root',password:'123456',database:'smart_pe_sports'});
  
  // 检查数据统计
  const [stats] = await pool.query(`
    SELECT s.school_id, 
           COUNT(DISTINCT s.id) as sessions, 
           COUNT(r.id) as results,
           SUM(CASE WHEN s.sport_type = 10 THEN 1 ELSE 0 END) as bmi_sessions
    FROM sport_session s
    LEFT JOIN sport_result r ON s.id = r.session_id
    GROUP BY s.school_id
  `);
  
  const schoolNames = {
    'hailin-second-primary': '海林市第二小学',
    'hailin-zirong-primary': '海林市子荣小学',
    'linhai-experimental-primary': '林海实验小学'
  };
  
  console.log('数据统计:');
  stats.forEach(s => {
    console.log(`  ${schoolNames[s.school_id]}: ${s.sessions} 个会话, ${s.results} 条结果, ${s.bmi_sessions} 个BMI会话`);
  });
  
  // 验证 BMI 数据
  const [bmiData] = await pool.query('SELECT COUNT(*) as cnt FROM sport_result WHERE weight IS NOT NULL');
  console.log(`\n带体重数据的记录: ${bmiData[0].cnt} 条`);
  
  const [heightData] = await pool.query('SELECT COUNT(*) as cnt FROM sport_result WHERE height IS NOT NULL');
  console.log(`带身高数据的记录: ${heightData[0].cnt} 条`);
  
  // 验证跳远姿态数据
  const [jumpData] = await pool.query('SELECT COUNT(*) as cnt FROM sport_result WHERE jump_speed IS NOT NULL');
  console.log(`\n带跳远速度的记录: ${jumpData[0].cnt} 条`);
  
  // 验证跑步反应时间
  const [reactData] = await pool.query('SELECT COUNT(*) as cnt FROM sport_result WHERE reaction_time IS NOT NULL');
  console.log(`带反应时间的记录: ${reactData[0].cnt} 条`);
  
  await pool.end();
})();
