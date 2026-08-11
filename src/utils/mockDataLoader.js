/**
 * 多租户模拟数据加载器
 * 根据学校ID返回不同的模拟数据，实现数据隔离
 * 
 * 架构升级：从 transform 模式升级为真正的多租户数据库模式
 * 每个学校拥有完全独立的数据，不再依赖 baseData 转换
 */

import { mockDB, getSchoolData } from '@/mock'
import { createSeededRandom } from './seededRandom'

/**
 * 根据学校ID获取完整的学校数据
 * @param {string} schoolId - 学校ID
 * @returns {object} 学校数据对象
 */
export const getSchoolMockData = (schoolId) => {
  const schoolData = getSchoolData(schoolId)
  
  // 为每个学校创建固定的随机种子，保证数据可复现
  const random = createSeededRandom(schoolId || 'default-school')
  
  const result = {
    students: schoolData?.students || [],
    teachers: schoolData?.teachers || [],
    classes: schoolData?.classes || [],
    schoolInfo: schoolData?.schoolInfo || {},
    
    systemStats: {
      schoolName: schoolData?.schoolInfo?.name || '',
      ...(schoolData?.systemStats || {})
    },
    
    examResults: generateExamResults(schoolData?.students || [], schoolData?.schoolInfo?.name || '', random),
    nationalTestResults: generateNationalTestResults(schoolData?.students || [], schoolData?.schoolInfo?.name || '', random),
    practiceRecords: generatePracticeRecords(schoolData?.students || [], schoolData?.schoolInfo?.name || '', random),
    evaluationRecords: generateEvaluationRecords(schoolData?.students || [], schoolData?.schoolInfo?.name || '', schoolId, random),
    lessonRecords: generateLessonRecords(schoolData?.teachers || [], schoolData?.schoolInfo?.name || '', random)
  }
  
  return result
}

/**
 * 生成考试成绩数据
 */
function generateExamResults(students, schoolName, random) {
  const events = ['立定跳远', '仰卧起坐', '坐位体前屈', '50米跑', '跳绳', '引体向上']
  const grades = ['优秀', '良好', '及格', '不及格']
  const categories = ['体育考试', '体育课堂', '运动会', '体育中考']
  
  return students.slice(0, 20).flatMap(student => {
    const numEvents = Math.floor(random() * 3) + 2
    const selectedEvents = [...events].sort(() => random() - 0.5).slice(0, numEvents)
    
    return selectedEvents.map(event => ({
      studentId: student.id,
      studentName: student.name,
      class: `${student.grade || ''}${student.class || ''}`,
      className: `${student.grade || ''}${student.class || ''}`,
      event,
      score: generateScore(event, random),
      grade: grades[Math.floor(random() * grades.length)],
      date: generateDate(random),
      category: categories[Math.floor(random() * categories.length)]
    }))
  })
}

/**
 * 生成国家体测数据 - 为所有学生生成
 */
function generateNationalTestResults(students, schoolName, random) {
  const results = []
  
  students.forEach(student => {
    const age = parseInt(student.age) || 7
    const baseHeight = 100 + age * 8
    const baseWeight = 20 + age * 3
    const className = student.class || `${student.grade}1班`
    
    const height = parseFloat((baseHeight + random() * 15).toFixed(1))
    const weight = parseFloat((baseWeight + random() * 10).toFixed(1))
    const bmi = parseFloat((weight / ((height / 100) ** 2)).toFixed(1))
    const testDate = generateDate(random)

    results.push({
      id: `nt-${student.id}`,
      studentId: student.id,
      studentName: student.name,
      grade: student.grade,
      class: className,
      height,
      weight,
      bmi,
      visionLeft: parseFloat((4.5 + random() * 1.0).toFixed(1)),
      visionRight: parseFloat((4.5 + random() * 1.0).toFixed(1)),
      vitalCapacity: parseInt((1500 + age * 100 + random() * 500).toFixed(0)),
      longJump: parseFloat((1.0 + age * 0.1 + random() * 0.3).toFixed(2)),
      pullUp: Math.floor(age >= 9 ? (age - 9 + random() * 8) : random() * 5),
      sitUps: Math.floor(20 + age * 2 + random() * 20),
      sitAndReach: parseFloat((5 + random() * 25).toFixed(1)),
      fiftyMeter: parseFloat((10 - age * 0.3 + random() * 2).toFixed(2)),
      enduranceRun: (student.gender === '男' || student.gender === 'male')
          ? parseFloat((3 - age * 0.1 + random() * 1).toFixed(2))
          : parseFloat((3.5 - age * 0.1 + random() * 1).toFixed(2)),
      totalScore: Math.floor(40 + random() * 55),
      year: '2025-2026',
      date: testDate,
      testDate,
      schoolName
    })
  })
  
  return results
}

/**
 * 生成练习记录数据
 */
function generatePracticeRecords(students, schoolName, random) {
  const projects = ['跳绳', '仰卧起坐', '立定跳远', '50米跑', '坐位体前屈', '引体向上']
  const statuses = ['已完成', '已完成', '已完成', '进行中', '待评分']

  return students.slice(0, 12).flatMap(student => {
    const numRecords = Math.floor(random() * 4) + 1
    return Array.from({ length: numRecords }, (_, i) => {
      const event = projects[Math.floor(random() * projects.length)]
      const status = statuses[Math.floor(random() * statuses.length)]
      return {
        id: `pr-${student.id}-${i}`,
        studentId: student.id,
        studentName: student.name,
        grade: student.grade || '',
        className: student.class || '',
        event,
        score: generatePracticeScore(event, random),
        scoreRaw: Math.floor(60 + random() * 40),
        duration: Math.floor(10 + random() * 50),
        count: Math.floor(20 + random() * 100),
        calories: Math.floor(50 + random() * 200),
        date: generateRecentDate(i, random),
        status,
        migrated: false,
        migratedTo: null,
        schoolName
      }
    })
  })
}

/**
 * 生成练习成绩（带单位）
 */
function generatePracticeScore(event, random) {
  switch (event) {
    case '立定跳远': return (1.2 + random() * 0.8).toFixed(2) + 'm'
    case '50米跑': return (7 + random() * 4).toFixed(1) + '秒'
    case '跳绳': return Math.floor(80 + random() * 80) + '个'
    case '仰卧起坐': return Math.floor(20 + random() * 40) + '个'
    case '坐位体前屈': return (5 + random() * 25).toFixed(1) + 'cm'
    case '引体向上': return Math.floor(2 + random() * 16) + '个'
    default: return Math.floor(60 + random() * 40) + '分'
  }
}

/**
 * 生成评价记录数据
 */
function generateEvaluationRecords(students, schoolName, schoolId, random) {
  const themes = ['综合素质评价', '体育表现评价', '学习态度评价', '团队协作评价']
  const types = ['teacher', 'parent', 'self', 'ai']
  const typeLabels = { teacher: '教师评价', parent: '家长评价', self: '自我评价', ai: 'AI评价' }

  // 三校差异化配置
  const isZirong = schoolId === 'hailin-zirong-primary'
  const isLinhai = schoolId === 'linhai-experimental-primary'

  // 按学校规模取不同数量的学生：A=18, B=10, C=12
  const sliceCount = isZirong ? 10 : isLinhai ? 12 : 18

  // 各校教师名
  const teachers = mockDB[schoolId]?.teachers || []
  const teacherNames = isZirong
    ? teachers.slice(0, 4).map(t => t.name).concat(['赵校长', '孙老师'])
    : isLinhai
      ? teachers.slice(0, 4).map(t => t.name).concat(['林校长', '海老师'])
      : teachers.slice(0, 4).map(t => t.name).concat(['卜琳娜', '卢伟珍'])

  const parentNames = isZirong
    ? ['赵先生', '孙女士', '李先生', '周女士', '吴先生', '郑女士']
    : isLinhai
      ? ['林先生', '海女士', '王先生', '陈女士', '张先生', '刘女士']
      : ['张先生', '高女士', '范先生', '刘女士', '王先生', '赵女士']

  // 各校评语差异化
  const comments = isZirong
    ? ['排球垫球进步明显', '足球带球能力突出', '田径训练刻苦认真', '跳绳成绩显著提升', '课堂表现积极活跃', '团队协作意识强']
    : isLinhai
      ? ['游泳技术动作规范', '体操翻滚完成出色', '武术套路掌握扎实', '柔韧性提升明显', '舞蹈表现力优秀', '体能训练积极']
      : ['表现优秀，积极参与各项活动', '认真刻苦，进步明显', '团队合作精神良好', '态度端正，值得表扬', '体能有所提升，继续保持', '课堂表现积极，需注意纪律']

  // 各校分数范围不同
  const scoreMin = isZirong ? 60 : isLinhai ? 72 : 65
  const scoreMax = isZirong ? 95 : isLinhai ? 99 : 98

  // 每校每人记录数不同：A=1~3, B=1~2, C=2~3
  const recordsPerStudent = isZirong ? 2 : isLinhai ? 3 : 3

  const rand = (min, max) => Math.floor(min + random() * (max - min + 1))

  return students.slice(0, sliceCount).flatMap((student, idx) => {
    const className = `${student.grade || '三年级'}${student.class || '1班'}`
    const numRecords = isZirong ? (1 + (idx % 2)) : isLinhai ? (2 + (idx % 2)) : (1 + (idx % recordsPerStudent))
    return Array.from({ length: numRecords }, (_, i) => {
      const type = types[(idx + i) % types.length]
      // 部分记录待评分（score=0），各校比例不同
      const isPending = isZirong ? (idx % 3 === 2) : isLinhai ? (idx % 5 === 4) : (idx % 7 === 6)
      const score = isPending ? 0 : rand(scoreMin, scoreMax)
      return {
        id: `ev-${student.id}-${i}`,
        studentId: student.id,
        studentName: student.name,
        className,
        grade: student.grade || '',
        theme: themes[(idx + i) % themes.length],
        type,
        score,
        moral: rand(scoreMin, 100),
        intellectual: rand(scoreMin, 100),
        physical: rand(scoreMin, 100),
        aesthetic: rand(scoreMin, 100),
        labor: rand(scoreMin, 100),
        satisfaction: type === 'parent' ? (3 + random() * 2).toFixed(1) : null,
        parentName: type === 'parent' ? parentNames[idx % parentNames.length] : null,
        teacherName: type === 'teacher' ? teacherNames[idx % teacherNames.length] : null,
        evaluator: type === 'parent' ? parentNames[idx % parentNames.length]
          : type === 'teacher' ? teacherNames[idx % teacherNames.length]
          : type === 'ai' ? 'AI系统'
          : student.name,
        date: generateRecentDate(i, random),
        comments: comments[(idx + i) % comments.length],
        schoolName
      }
    })
  })
}

/**
 * 生成课程记录数据
 */
function generateLessonRecords(teachers, schoolName, random) {
  const locations = ['体育馆', '操场', '室内篮球场', '田径场']
  const statuses = ['live', 'completed', 'upcoming']
  const subjects = ['篮球', '足球', '田径', '体操', '羽毛球', '游泳']
  const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
  
  return teachers.slice(0, 8).flatMap(teacher => {
    const numLessons = Math.floor(random() * 3) + 2
    return Array.from({ length: numLessons }, (_, i) => {
      const status = statuses[Math.floor(random() * statuses.length)]
      const subject = subjects[Math.floor(random() * subjects.length)]
      const grade = grades[Math.floor(random() * grades.length)]
      return {
        id: `ls-${teacher.id}-${i}`,
        title: `${subject}${grade}课程`,
        teacher: teacher.name,
        location: locations[Math.floor(random() * locations.length)],
        date: generateRecentDate(i, random),
        time: i === 0 ? '09:00-10:30' : i === 1 ? '14:00-15:30' : '10:40-12:10',
        duration: 45,
        status,
        subject,
        grade,
        attendance: Math.floor(25 + random() * 15),
        totalStudents: Math.floor(30 + random() * 10),
        viewers: status === 'live' ? Math.floor(10 + random() * 50) : 0,
        rating: Math.floor(70 + random() * 30),
        reviewed: status === 'completed',
        schoolName
      }
    })
  })
}

/**
 * 生成分数
 */
function generateScore(event, random) {
  switch (event) {
    case '立定跳远':
      return (1.2 + random() * 0.8).toFixed(2)
    case '仰卧起坐':
      return Math.floor(20 + random() * 40)
    case '坐位体前屈':
      return (5 + random() * 25).toFixed(1)
    case '50米跑':
      return (8 + random() * 5).toFixed(2)
    case '跳绳':
      return Math.floor(80 + random() * 80)
    case '引体向上':
      return Math.floor(2 + random() * 16)
    default:
      return Math.floor(60 + random() * 40)
  }
}

/**
 * 生成日期
 */
function generateDate(random) {
  const start = new Date('2026-01-01')
  const end = new Date('2026-07-16')  // 固定结束日期，保证可复现
  const date = new Date(start.getTime() + random() * (end.getTime() - start.getTime()))
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

/**
 * 生成最近日期
 */
function generateRecentDate(daysAgo, random) {
  // 使用固定锚点日期而非当前日期，保证可复现
  const anchorDate = new Date('2026-07-16')
  const date = new Date(anchorDate.getTime())
  date.setDate(date.getDate() - daysAgo)
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

// 导出 mockDB 供其他模块使用
export { mockDB, getSchoolData }