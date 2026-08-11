/**
 * Excel数据读取服务
 * 用于读取public文件夹中的Excel文件并转换为应用数据格式
 */
import * as XLSX from 'xlsx'

/**
 * 读取Excel文件
 * @param {string} filePath - 文件路径（相对于public文件夹）
 * @returns {Promise<Array>} 解析后的数据数组
 */
export const readExcelFile = async (filePath) => {
  try {
    const response = await fetch(filePath)
    const arrayBuffer = await response.arrayBuffer()
    const workbook = XLSX.read(arrayBuffer, { type: 'array' })
    
    // 获取第一个工作表
    const firstSheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[firstSheetName]
    
    // 转换为JSON
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    return data
  } catch (error) {
    console.error('读取Excel文件失败:', error)
    return []
  }
}

/**
 * 解析家校通讯录数据
 * @param {Array} excelData - Excel原始数据
 * @returns {Object} 分类后的数据
 */
export const parseContactData = (excelData) => {
  if (!excelData || excelData.length < 2) {
    return { students: [], parents: [], teachers: [] }
  }
  
  const headers = excelData[0]
  const rows = excelData.slice(1)
  
  const students = []
  const parents = []
  const teachers = []
  
  rows.forEach((row, index) => {
    const item = {}
    headers.forEach((header, i) => {
      item[header] = row[i] || ''
    })
    
    // 根据角色分类
    const role = item['角色'] || item['role'] || ''
    const name = item['姓名'] || item['name'] || ''
    const phone = item['手机号'] || item['电话'] || item['phone'] || ''
    
    const baseData = {
      id: `USER${String(index + 1).padStart(4, '0')}`,
      name: name,
      phone: phone,
      // 保留其他字段
      ...item
    }
    
    if (role.includes('学生')) {
      students.push({
        ...baseData,
        studentId: item['学号'] || item['studentId'] || baseData.id,
        grade: item['年级'] || item['grade'] || '',
        class: item['班级'] || item['class'] || '',
        gender: item['性别'] || item['gender'] || '男',
        age: item['年龄'] || item['age'] || 10,
        faceRegistered: false,
        sportsInterest: ''
      })
    } else if (role.includes('家长')) {
      parents.push({
        ...baseData,
        relation: item['关系'] || item['relation'] || '',
        studentName: item['学生姓名'] || item['studentName'] || ''
      })
    } else if (role.includes('教师') || role.includes('老师')) {
      teachers.push({
        ...baseData,
        teacherId: item['工号'] || item['teacherId'] || baseData.id,
        subject: item['学科'] || item['subject'] || '体育',
        grade: item['年级'] || item['grade'] || ''
      })
    }
  })
  
  return { students, parents, teachers }
}

/**
 * 解析教师统计数据
 * @param {Array} excelData - Excel原始数据
 * @returns {Array} 教师统计数组
 */
export const parseTeacherStats = (excelData) => {
  if (!excelData || excelData.length < 2) {
    return []
  }
  
  const headers = excelData[0]
  const rows = excelData.slice(1)
  
  return rows.map((row, index) => {
    const item = {}
    headers.forEach((header, i) => {
      item[header] = row[i] || ''
    })
    
    return {
      id: `T${String(index + 1).padStart(4, '0')}`,
      name: item['姓名'] || item['name'] || '',
      teacherId: item['工号'] || item['teacherId'] || '',
      subject: item['学科'] || item['subject'] || '体育',
      grade: item['年级'] || item['grade'] || '',
      class: item['班级'] || item['class'] || '',
      phone: item['手机号'] || item['电话'] || item['phone'] || '',
      // 保留其他所有字段
      ...item
    }
  })
}

/**
 * 合并Excel数据与mock数据
 * 保留mock数据的完整字段结构，用Excel数据填充姓名和手机号等基础信息
 * @param {Array} mockData - 现有的mock数据
 * @param {Array} excelData - Excel中的数据
 * @returns {Array} 合并后的数据
 */
export const mergeData = (mockData, excelData) => {
  if (!excelData || excelData.length === 0) {
    return mockData
  }
  
  return mockData.map((item, index) => {
    if (excelData[index]) {
      const excelItem = excelData[index]
      return {
        ...item,
        // 优先使用Excel中的姓名和手机号
        name: excelItem.name || excelItem['姓名'] || item.name,
        phone: excelItem.phone || excelItem['手机号'] || excelItem['电话'] || item.phone,
        // 如果有其他字段也进行合并
        studentName: excelItem.name || excelItem['姓名'] || item.studentName || item.name,
      }
    }
    return item
  })
}

/**
 * 加载并解析所有Excel数据
 * @returns {Promise<Object>} 所有解析后的数据
 */
export const loadAllExcelData = async () => {
  try {
    // 读取家校通讯录
    const contactRawData = await readExcelFile('/家校通讯录.xlsx')
    const contactData = parseContactData(contactRawData)
    
    // 读取教师统计表
    const teacherRawData = await readExcelFile('/教师统计表.xlsx')
    const teacherStats = parseTeacherStats(teacherRawData)
    
    return {
      ...contactData,
      teacherStats
    }
  } catch (error) {
    console.error('加载Excel数据失败:', error)
    return {
      students: [],
      parents: [],
      teachers: [],
      teacherStats: []
    }
  }
}
