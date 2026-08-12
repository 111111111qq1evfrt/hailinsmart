/**
 * 统一数据访问层
 * 从 sessionStorage 读取真实的学生和职工数据
 * 如果没有真实数据，回退到 mock 数据
 */

import { getSchoolMockData } from './mockDataLoader'

/**
 * 获取真实学生数据（优先从 sessionStorage，回退到 mock）
 * @param {string} schoolId - 学校ID
 * @returns {Array} 学生数据数组
 */
export function getRealStudents(schoolId) {
  if (!schoolId) return []
  
  try {
    const raw = sessionStorage.getItem(`students_${schoolId}`)
    if (raw && raw !== 'undefined' && raw !== 'null') {
      const data = JSON.parse(raw)
      if (Array.isArray(data) && data.length > 0) {
        return data
      }
    }
  } catch (e) {
    console.warn('读取真实学生数据失败:', e.message)
  }
  
  // 回退到 mock 数据
  const mockData = getSchoolMockData(schoolId)
  return mockData.students || []
}

/**
 * 获取真实职工数据（优先从 sessionStorage，回退到 mock）
 * @param {string} schoolId - 学校ID
 * @returns {Array} 职工数据数组
 */
export function getRealTeachers(schoolId) {
  if (!schoolId) return []
  
  try {
    const raw = sessionStorage.getItem(`teachers_${schoolId}`)
    if (raw && raw !== 'undefined' && raw !== 'null') {
      const data = JSON.parse(raw)
      if (Array.isArray(data) && data.length > 0) {
        return data
      }
    }
  } catch (e) {
    console.warn('读取真实职工数据失败:', e.message)
  }
  
  // 回退到 mock 数据
  const mockData = getSchoolMockData(schoolId)
  return mockData.teachers || []
}

/**
 * 获取真实班级数据
 * @param {string} schoolId - 学校ID
 * @returns {Array} 班级数据数组
 */
export function getRealClasses(schoolId) {
  if (!schoolId) return []
  
  try {
    const raw = sessionStorage.getItem(`classes_${schoolId}`)
    if (raw && raw !== 'undefined' && raw !== 'null') {
      const data = JSON.parse(raw)
      if (Array.isArray(data) && data.length > 0) {
        return data
      }
    }
  } catch (e) {
    console.warn('读取班级数据失败:', e.message)
  }
  
  // 回退到 mock 数据
  const mockData = getSchoolMockData(schoolId)
  return mockData.classes || []
}

/**
 * 获取学生的班级名称（如 "一年级1班"）
 * @param {Object} student - 学生对象
 * @returns {string} 班级名称
 */
export function getStudentClassName(student) {
  if (!student) return ''
  if (student.className) return student.className
  if (student.grade && student.class) return `${student.grade}${student.class}`
  return ''
}

/**
 * 获取学生的唯一ID
 * @param {Object} student - 学生对象
 * @returns {string} 学生ID
 */
export function getStudentId(student) {
  if (!student) return ''
  return student.id || student.student_id || student.studentNumber || ''
}

/**
 * 检查是否有真实学生数据
 * @param {string} schoolId - 学校ID
 * @returns {boolean} 是否有真实数据
 */
export function hasRealStudents(schoolId) {
  if (!schoolId) return false
  
  try {
    const raw = sessionStorage.getItem(`students_${schoolId}`)
    if (raw && raw !== 'undefined' && raw !== 'null') {
      const data = JSON.parse(raw)
      return Array.isArray(data) && data.length > 0
    }
  } catch (e) {}
  
  return false
}

/**
 * 检查是否有真实职工数据
 * @param {string} schoolId - 学校ID
 * @returns {boolean} 是否有真实数据
 */
export function hasRealTeachers(schoolId) {
  if (!schoolId) return false
  
  try {
    const raw = sessionStorage.getItem(`teachers_${schoolId}`)
    if (raw && raw !== 'undefined' && raw !== 'null') {
      const data = JSON.parse(raw)
      return Array.isArray(data) && data.length > 0
    }
  } catch (e) {}
  
  return false
}

/**
 * 标准化学生数据结构
 * 将不同来源的学生数据统一格式
 * @param {Array} students - 学生数据数组
 * @returns {Array} 标准化后的学生数据
 */
export function normalizeStudents(students) {
  if (!Array.isArray(students)) return []
  
  return students.map(s => {
    // 从 className 解析 grade 和 class（如果缺失）
    let grade = s.grade || ''
    let cls = s.class || ''
    
    if (!grade || !cls) {
      const source = s.className || s.class_name || ''
      if (source) {
        if (!grade) {
          const gradeMatch = source.match(/([一二三四五六七八九十]+年级)/)
          grade = gradeMatch ? gradeMatch[1] : ''
        }
        if (!cls) {
          const classMatch = source.match(/(\d+)班$/)
          cls = classMatch ? classMatch[0] : ''
        }
      }
    }
    
    const className = s.className || (grade && cls ? `${grade}${cls}` : '')
    
    return {
      id: s.id || s.student_id || s.studentNumber || '',
      name: s.name || '',
      gender: s.gender || '',
      grade,
      class: cls,
      className,
      age: s.age || 0,
      faceRegistered: s.faceRegistered || false,
      sportsInterest: s.sportsInterest || '',
      itemClass: s.itemClass || '',
      studentNumber: s.studentNumber || s.id || s.student_id || '',
      cimgUrl: s.cimgUrl || '',
      phone: s.phone || '',
      idCard: s.idCard || '',
      parentName: s.parentName || '',
      parentPhone: s.parentPhone || '',
      status: s.status || '正常'
    }
  })
}
