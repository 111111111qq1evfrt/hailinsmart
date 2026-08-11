const mysql = require('mysql2/promise');
(async () => {
  const pool = mysql.createPool({host:'localhost',port:3306,user:'root',password:'123456',database:'smart_pe_sports'});
  
  // 检查 BMI 数据
  const [bmiData] = await pool.query('SELECT s.sport_type, r.person_id, r.score, r.weight, r.height FROM sport_session s JOIN sport_result r ON s.id = r.session_id WHERE s.sport_type = 10 LIMIT 5');
  console.log('BMI 数据示例:');
  bmiData.forEach(row => {
    console.log(`  学生: ${row.person_id}, BMI: ${row.score}, 体重: ${row.weight}kg, 身高: ${row.height}cm`);
  });
  
  // 检查跳远数据
  const [longJumpData] = await pool.query('SELECT s.sport_type, r.person_id, r.jump_speed, r.jump_height, r.jump_angle, r.arm_angle FROM sport_session s JOIN sport_result r ON s.id = r.session_id WHERE s.sport_type = 2 LIMIT 3');
  console.log('\n跳远数据示例:');
  longJumpData.forEach(row => {
    console.log(`  学生: ${row.person_id}, 速度: ${row.jump_speed}m/s, 高度: ${row.jump_height}cm, 角度: ${row.jump_angle}°, 摆臂: ${row.arm_angle}°`);
  });
  
  // 检查跑步数据
  const [runData] = await pool.query('SELECT s.sport_type, r.person_id, r.reaction_time FROM sport_session s JOIN sport_result r ON s.id = r.session_id WHERE s.sport_type IN (11,12,13) LIMIT 3');
  console.log('\n跑步数据示例:');
  runData.forEach(row => {
    console.log(`  学生: ${row.person_id}, 反应时间: ${row.reaction_time}ms`);
  });
  
  await pool.end();
})();
