import { getDefaultUsersForSchool } from './school-data/schoolUsers'

const schoolAbbreviationMap = {
  'hailin-second-primary': 'HL',
  'hailin-zirong-primary': 'ZR',
  'linhai-experimental-primary': 'LH'
}

export const getSchoolAbbreviation = (schoolId) => {
  return schoolAbbreviationMap[schoolId] || 'XX'
}

export const generateDefaultPassword = (schoolId) => {
  const abbreviation = getSchoolAbbreviation(schoolId)
  return `${abbreviation}123456`
}

export const validateLoginCredentials = (username, password, role, schoolId) => {
  const users = getUsersFromStorage(schoolId)
  // 标准化输入的手机号：去掉 +86 前缀和短横线
  const normalizedInput = username.replace(/^(\+?86)/, '').replace(/-/g, '')
  
  const match = users.find(u => {
    if (u.role !== role || u.status !== 'active') return false
    // 精确匹配用户名
    if (u.username === username) return true
    // 手机号匹配：去掉存储手机号的前缀和短横线后比较
    const userPhone = (u.phone || '').replace(/^(\+?86)/, '').replace(/-/g, '')
    if (userPhone && normalizedInput && userPhone === normalizedInput) return true
    return false
  })
  
  if (!match) return false
  
  if (match.password) {
    return match.password === password
  }
  
  const defaultPassword = generateDefaultPassword(schoolId)
  return password === defaultPassword
}

const getUsersFromStorage = (schoolId) => {
  const usersKey = `users_${schoolId}`
  const stored = sessionStorage.getItem(usersKey)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return getDefaultUsersWithPasswords(schoolId)
    }
  }
  
  return getDefaultUsersWithPasswords(schoolId)
}

const getDefaultUsersWithPasswords = (schoolId) => {
  const defaultPassword = generateDefaultPassword(schoolId)
  
  const users = getDefaultUsersForSchool(schoolId)
  return users.map(user => ({
    ...user,
    password: defaultPassword
  }))
}

export const addCustomAccount = (username, role, schoolId, password) => {
  const finalPassword = password || generateDefaultPassword(schoolId)
  
  const usersKey = `users_${schoolId}`
  const existing = JSON.parse(sessionStorage.getItem(usersKey) || '[]')
  
  const existingUser = existing.find(u => u.username === username && u.role === role)
  if (existingUser) {
    existingUser.password = finalPassword
  }
  
  sessionStorage.setItem(usersKey, JSON.stringify(existing))
  
  return finalPassword
}

export const getAllValidAccounts = (schoolId) => {
  return getUsersFromStorage(schoolId).filter(u => u.status === 'active').map(u => ({
    username: u.username,
    password: u.password || generateDefaultPassword(schoolId),
    role: u.role,
    schoolId
  }))
}