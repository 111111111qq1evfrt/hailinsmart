/**
 * 核心数据类型定义
 */

// 用户信息
export interface UserInfo {
  id: number | null
  name: string
  avatar: string
  role: string
  permissions: string[]
}

// 学生信息
export interface StudentInfo {
  id: number
  studentNo: string
  name: string
  gender: '男' | '女'
  birthday: string
  classId: number
  className: string
  gradeId: number
  gradeName: string
  status: 'active' | 'inactive'
  createTime: string
  updateTime: string
}

// 班级信息
export interface ClassInfo {
  id: number
  className: string
  gradeId: number
  gradeName: string
  studentCount: number
  createTime: string
}

// 年级信息
export interface GradeInfo {
  id: number
  gradeName: string
  classCount: number
  studentCount: number
}

// 测试项目
export interface TestProject {
  id: number
  projectName: string
  projectCode: string
  projectType: 'speed' | 'power' | 'flexibility' | 'endurance' | 'skill'
  unit: string
  gender: '男' | '女' | 'both'
  minScore: number
  maxScore: number
  isActive: boolean
  createTime: string
}

// 测试记录
export interface TestRecord {
  id: number
  taskId: number
  studentId: number
  studentNo: string
  studentName: string
  projectId: number
  projectName: string
  testRound: number
  score: number
  rawScore: number
  grade: string
  isPass: boolean
  videoId: string
  testTime: string
  status: 'pending' | 'testing' | 'completed' | 'aborted'
  createTime: string
  updateTime: string
  // 关联字段
  classId: number
  className: string
  gradeId: number
  gradeName: string
}

// 测试任务
export interface TestTask {
  id: number
  taskName: string
  taskType: 'exam' | 'practice' | 'competition' | 'national'
  projectIds: number[]
  gradeIds: number[]
  classIds: number[]
  startTime: string
  endTime: string
  status: 'draft' | 'active' | 'completed' | 'cancelled'
  createTime: string
  updateTime: string
}

// 评分配置
export interface ScoreConfig {
  id: number
  projectId: number
  projectName: string
  gender: '男' | '女'
  gradeId: number
  gradeName: string
  minValue: number
  maxValue: number
  score: number
  gradeLevel: 'excellent' | 'good' | 'pass' | 'fail'
  createTime: string
  updateTime: string
}

// 违规记录
export interface ViolationRecord {
  id: number
  recordId: number
  violationType: string
  description: string
  evidenceUrl: string
  createTime: string
}

// 分页响应
export interface PageResponse<T> {
  list: T[]
  total: number
  page: number
  size: number
}

// 统一响应
export interface ApiResponse<T = any> {
  code: number
  message: string
  data: T
  timestamp: number
}

// 考试场景
export type ExamScene = 'classroom' | 'sportsmeeting' | 'exam' | 'highschoolentrance'

// 状态枚举
export const ExamSceneMap: Record<ExamScene, string> = {
  classroom: '体育课堂',
  sportsmeeting: '运动会',
  exam: '体育考试',
  highschoolentrance: '体育中考'
}

// 成绩等级
export type GradeLevel = 'excellent' | 'good' | 'pass' | 'fail'

export const GradeLevelMap: Record<GradeLevel, string> = {
  excellent: '优秀',
  good: '良好',
  pass: '及格',
  fail: '不及格'
}

export const GradeLevelColorMap: Record<GradeLevel, string> = {
  excellent: '#166534',
  good: '#1E40AF',
  pass: '#92400E',
  fail: '#991B1B'
}

export const GradeLevelBgMap: Record<GradeLevel, string> = {
  excellent: '#DCFCE7',
  good: '#DBEAFE',
  pass: '#FEF3C7',
  fail: '#FEE2E2'
}