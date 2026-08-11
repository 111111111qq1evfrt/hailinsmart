<template>
  <div class="ai-review-page">
    <div class="page-header">
      <div class="header-filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索学生姓名、学号"
          clearable
          style="width: 280px"
          :prefix-icon="Search"
        />
        <el-select v-model="filterClass" placeholder="选择班级" clearable style="width: 160px">
          <el-option label="全部班级" value="" />
          <el-option v-for="cls in classList" :key="cls" :label="cls" :value="cls" />
        </el-select>
        <el-select v-model="filterLevel" placeholder="综合评级" clearable style="width: 120px">
          <el-option label="全部" value="" />
          <el-option label="优秀" value="优秀" />
          <el-option label="良好" value="良好" />
          <el-option label="需改进" value="需改进" />
          <el-option label="待提升" value="待提升" />
        </el-select>
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="exportReviews">导出点评报告</el-button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ stats.totalStudents }}</span>
        <span class="stat-label">已点评学生</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ stats.excellentCount }}</span>
        <span class="stat-label">优秀评级</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #F5A623">{{ stats.needImproveCount }}</span>
        <span class="stat-label">需改进</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #3B82F6">{{ stats.planCount }}</span>
        <span class="stat-label">已制定训练计划</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.avgGenerationTime }}s</span>
        <span class="stat-label">平均生成时间</span>
      </div>
    </div>

    <div class="main-content">
      <div class="student-list">
        <div class="list-header">
          <span class="list-title">学生列表</span>
          <span class="list-count">共 {{ filteredStudents.length }} 人</span>
        </div>
        <div class="student-items">
          <div
            v-for="student in filteredStudents"
            :key="student.id"
            class="student-item"
            :class="{ active: selectedStudent?.id === student.id, generating: generatingId === student.id }"
            @click="selectStudent(student)"
          >
            <div class="student-avatar" :style="{ background: getAvatarColor(student.id) }">
              {{ student.name.charAt(0) }}
            </div>
            <div class="student-info">
              <div class="student-name">{{ student.name }}</div>
              <div class="student-class">{{ student.className }}</div>
            </div>
            <div class="student-rating" :class="getRatingClass(student.overallRating)">
              {{ student.overallRating || '-' }}
            </div>
            <div v-if="generatingId === student.id" class="generating-indicator">
              <el-icon class="loading-icon"><Loading /></el-icon>
            </div>
          </div>
        </div>
      </div>

      <div class="review-detail">
        <div v-if="selectedStudent" class="detail-content">
          <div class="detail-header">
            <div class="student-profile">
              <div class="profile-avatar" :style="{ background: getAvatarColor(selectedStudent.id) }">
                {{ selectedStudent.name.charAt(0) }}
              </div>
              <div class="profile-info">
                <h3 class="profile-name">{{ selectedStudent.name }}</h3>
                <p class="profile-class">{{ selectedStudent.className }} | 学号: {{ selectedStudent.id }}</p>
              </div>
              <div class="rating-badge" :class="getRatingClass(selectedStudent.overallRating)">
                {{ selectedStudent.overallRating }}
              </div>
            </div>
            <el-button type="primary" :icon="Star" @click="generateReview" :disabled="generating">
              {{ generating ? '生成中...' : '生成AI点评' }}
            </el-button>
          </div>

          <div class="data-overview">
            <h4 class="section-title">运动数据概览</h4>
            <div class="data-cards">
              <div v-for="data in selectedStudent.sportData" :key="data.event" class="data-card">
                <div class="data-value">{{ data.score }}</div>
                <div class="data-label">{{ data.event }}</div>
                <div class="data-grade" :class="getGradeClass(data.grade)">{{ data.grade }}</div>
              </div>
            </div>
          </div>

          <div v-if="currentReview" class="review-content">
            <div class="review-tabs">
              <el-button
                v-for="tab in reviewTabs"
                :key="tab.key"
                :class="['review-tab', { active: activeTab === tab.key }]"
                @click="activeTab = tab.key"
              >
                <el-icon v-if="tab.key === 'overview' || tab.key === 'suggestions'"><Star /></el-icon>
                <el-icon v-else-if="tab.key === 'history'"><Clock /></el-icon>
                {{ tab.label }}
              </el-button>
            </div>

            <div class="review-body">
              <div v-if="activeTab === 'overview'" class="tab-content">
                <div class="overview-section">
                  <h5 class="overview-title">综合评价</h5>
                  <p class="overview-text">{{ currentReview.overview }}</p>
                </div>
                <div class="strengths-section">
                  <h5 class="section-subtitle">🌟 优势分析</h5>
                  <ul class="points-list">
                    <li v-for="(point, idx) in currentReview.strengths" :key="idx">
                      <el-icon class="point-icon good"><CircleCheck /></el-icon>
                      {{ point }}
                    </li>
                  </ul>
                </div>
                <div class="weaknesses-section">
                  <h5 class="section-subtitle">📌 待改进项</h5>
                  <ul class="points-list">
                    <li v-for="(point, idx) in currentReview.weaknesses" :key="idx">
                      <el-icon class="point-icon warning"><Warning /></el-icon>
                      {{ point }}
                    </li>
                  </ul>
                </div>
              </div>

              <div v-if="activeTab === 'suggestions'" class="tab-content">
                <h5 class="section-subtitle">💡 个性化改进建议</h5>
                <div class="suggestions-list">
                  <div v-for="(suggestion, idx) in currentReview.suggestions" :key="idx" class="suggestion-item">
                    <div class="suggestion-number">{{ idx + 1 }}</div>
                    <div class="suggestion-content">
                      <div class="suggestion-title">{{ suggestion.title }}</div>
                      <p class="suggestion-desc">{{ suggestion.description }}</p>
                      <div class="suggestion-tags">
                        <el-tag size="small" v-for="tag in suggestion.tags" :key="tag">{{ tag }}</el-tag>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div v-if="activeTab === 'learning-path'" class="tab-content">
                <div class="learning-path-section">
                  <div class="path-header">
                    <h5 class="section-subtitle">🧭 学习路径规划</h5>
                    <div class="path-actions">
                      <el-button type="primary" size="small" @click="generateLearningPath">生成学习路径</el-button>
                    </div>
                  </div>

                  <div v-if="currentLearningPath" class="path-content">
                    <div class="path-overview-card">
                      <div class="path-title">{{ currentLearningPath.title }}</div>
                      <div class="path-description">{{ currentLearningPath.description }}</div>
                    </div>

                    <div class="level-indicator">
                      <div class="level-header">
                        <span class="level-label">当前水平</span>
                        <span class="level-value" :class="getLevelClass(currentLearningPath.currentLevel)">
                          {{ currentLearningPath.currentLevel }}
                        </span>
                      </div>
                      <div class="level-progress">
                        <div 
                          class="progress-bar" 
                          :style="{ width: currentLearningPath.progress + '%', background: getLevelColor(currentLearningPath.currentLevel) }"
                        ></div>
                      </div>
                      <div class="level-milestones">
                        <span class="milestone" :class="{ active: currentLearningPath.currentLevel === '入门' }">入门</span>
                        <span class="milestone" :class="{ active: currentLearningPath.currentLevel === '基础' }">基础</span>
                        <span class="milestone" :class="{ active: currentLearningPath.currentLevel === '进阶' }">进阶</span>
                        <span class="milestone" :class="{ active: currentLearningPath.currentLevel === '优秀' }">优秀</span>
                      </div>
                    </div>

                    <div class="path-stages">
                      <h6 class="stages-title">📚 推荐学习阶段</h6>
                      <div v-for="(stage, idx) in currentLearningPath.stages" :key="idx" class="stage-card">
                        <div class="stage-header">
                          <span class="stage-number">阶段{{ idx + 1 }}</span>
                          <span class="stage-duration">{{ stage.duration }}</span>
                        </div>
                        <div class="stage-title">{{ stage.title }}</div>
                        <div class="stage-description">{{ stage.description }}</div>
                        <div class="stage-content">
                          <div v-for="(item, iidx) in stage.content" :key="iidx" class="content-item">
                            <el-icon :size="16" color="#1E5AA8"><CircleCheck /></el-icon>
                            <span>{{ item }}</span>
                          </div>
                        </div>
                        <div class="stage-resources">
                          <span class="resources-label">推荐资源：</span>
                          <span class="resources-list">{{ stage.resources.join('、') }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="recommended-courses">
                      <h6 class="courses-title">🎬 推荐学习内容</h6>
                      <div class="courses-grid">
                        <div v-for="(course, idx) in currentLearningPath.courses" :key="idx" class="course-card">
                          <div class="course-icon">{{ course.icon }}</div>
                          <div class="course-info">
                            <div class="course-title">{{ course.title }}</div>
                            <div class="course-duration">{{ course.duration }}</div>
                            <div class="course-level" :class="getLevelClass(course.level)">
                              {{ course.level }}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div v-else class="empty-path">
                    <el-icon class="empty-icon" :size="48" color="#9CA3AF"><Compass /></el-icon>
                    <p>暂无学习路径</p>
                    <el-button type="primary" @click="generateLearningPath">生成学习路径</el-button>
                  </div>
                </div>
              </div>

              <div v-if="activeTab === 'training-plan'" class="tab-content">
                <div class="training-plan-section">
                  <div class="plan-header">
                    <h5 class="section-subtitle">📅 训练计划</h5>
                    <div class="plan-actions">
                      <el-button type="primary" size="small" @click="generateTrainingPlan">智能生成计划</el-button>
                      <el-button size="small" @click="exportTrainingPlan">导出计划</el-button>
                    </div>
                  </div>

                  <div v-if="currentTrainingPlan" class="plan-content">
                    <div class="plan-info-card">
                      <div class="plan-title">{{ currentTrainingPlan.title }}</div>
                      <div class="plan-meta">
                        <span class="meta-item"><el-icon :size="14" color="#1E5AA8"><Calendar /></el-icon> {{ currentTrainingPlan.startDate }} ~ {{ currentTrainingPlan.endDate }}</span>
                        <span class="meta-item"><el-icon :size="14" color="#1E5AA8"><Aim /></el-icon> {{ currentTrainingPlan.target }}</span>
                        <span class="meta-item"><el-icon :size="14" color="#1E5AA8"><Timer /></el-icon> {{ currentTrainingPlan.duration }}</span>
                      </div>
                      <div class="plan-progress">
                        <span class="progress-label">完成进度</span>
                        <el-progress :percentage="currentTrainingPlan.progress" :color="getProgressColor(currentTrainingPlan.progress)" />
                      </div>
                    </div>

                    <div class="weakness-analysis">
                      <h6 class="weakness-title">💪 薄弱项分析</h6>
                      <div class="weakness-grid">
                        <div v-for="item in weakItems" :key="item.event" class="weakness-item" :class="item.level">
                          <span class="weakness-name">{{ item.event }}</span>
                          <span class="weakness-score">{{ item.score }}{{ item.unit }}</span>
                          <span class="weakness-level">{{ item.levelText }}</span>
                        </div>
                      </div>
                    </div>

                    <div class="daily-tasks">
                      <h6 class="tasks-title"><el-icon :size="16" color="#1E5AA8"><Edit /></el-icon> 每日训练安排</h6>
                      <div v-for="(day, idx) in currentTrainingPlan.dailyTasks" :key="idx" class="day-task-card">
                        <div class="day-header">
                          <span class="day-number">第{{ idx + 1 }}天</span>
                          <span class="day-progress" :class="{ completed: idx < currentTrainingPlan.completedDays }">
                            {{ idx < currentTrainingPlan.completedDays ? '✓ 已完成' : '○ 待完成' }}
                          </span>
                        </div>
                        <div class="task-list">
                          <div v-for="(task, tidx) in day" :key="tidx" class="task-item">
                            <span class="task-dot"></span>
                            <span class="task-text">{{ task }}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div class="plan-notes">
                      <h6 class="notes-title">📌 注意事项</h6>
                      <p>{{ currentTrainingPlan.notes }}</p>
                    </div>
                  </div>

                  <div v-else class="empty-plan">
                    <el-icon class="empty-icon" :size="48" color="#9CA3AF"><Document /></el-icon>
                    <p>暂无训练计划</p>
                    <el-button type="primary" @click="generateTrainingPlan">智能生成</el-button>
                  </div>
                </div>
              </div>

              <div v-if="activeTab === 'history'" class="tab-content">
                <h5 class="section-subtitle"><el-icon :size="16" color="#1E5AA8"><Document /></el-icon> 点评历史</h5>
                <div class="history-list">
                  <div v-for="(record, idx) in reviewHistory" :key="idx" class="history-item">
                    <div class="history-date">{{ record.date }}</div>
                    <div class="history-content">
                      <div class="history-rating" :class="getRatingClass(record.rating)">
                        {{ record.rating }}
                      </div>
                      <p class="history-summary">{{ record.summary }}</p>
                    </div>
                    <el-button size="small" @click="viewHistoryDetail(record)">查看详情</el-button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon">
              <el-icon :size="64" color="#9CA3AF"><Document /></el-icon>
            </div>
            <h3 class="empty-title">暂无点评数据</h3>
            <p class="empty-desc">选择学生后点击"生成AI点评"按钮，系统将基于运动数据自动生成个性化点评建议</p>
            <el-button type="primary" :icon="Star" @click="generateReview" :disabled="generating">
              生成AI点评
            </el-button>
          </div>
        </div>

        <div v-else class="select-prompt">
          <div class="prompt-icon">
            <el-icon :size="48" color="#1E5AA8"><User /></el-icon>
          </div>
          <h3 class="prompt-title">请选择学生</h3>
          <p class="prompt-desc">从左侧列表中选择一名学生，查看其运动数据和AI智能点评</p>
        </div>
      </div>
    </div>

    <el-dialog v-model="detailDialogVisible" title="点评详情" width="600px" destroy-on-close>
      <div v-if="selectedHistoryRecord" class="detail-dialog-content">
        <div class="dialog-info-row">
          <div class="info-label">点评类型</div>
          <div class="info-value">{{ selectedHistoryRecord.type }}</div>
        </div>
        <div class="dialog-info-row">
          <div class="info-label">评价日期</div>
          <div class="info-value">{{ selectedHistoryRecord.date }}</div>
        </div>
        <div class="dialog-info-row">
          <div class="info-label">评价人</div>
          <div class="info-value">{{ selectedHistoryRecord.evaluator }}</div>
        </div>
        <div class="dialog-info-row">
          <div class="info-label">综合评级</div>
          <div class="info-value">
            <span class="rating-badge" :class="getRatingClass(selectedHistoryRecord.rating)">
              {{ selectedHistoryRecord.rating }}
            </span>
          </div>
        </div>
        <div class="dialog-section">
          <h4 class="section-title">点评详情</h4>
          <p class="detail-text">{{ selectedHistoryRecord.details }}</p>
        </div>
        <div class="dialog-section">
          <h4 class="section-title">各项成绩</h4>
          <div class="scores-grid">
            <div v-for="score in selectedHistoryRecord.scores" :key="score.event" class="score-item">
              <div class="score-label">{{ score.event }}</div>
              <div class="score-value">{{ score.score }}</div>
              <div class="score-grade" :class="getGradeClass(score.grade)">{{ score.grade }}</div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue'
import {
  Search, Download, Trophy, Star, Warning,
  Clock, Loading, Check, CircleCheck, User, Document, Compass,
  Calendar, Aim, Timer, Edit
} from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { usePersistedRef } from '@/composables'
import store from '@/store/global'
import { mockDB, getSchoolData } from '@/mock'
import { isInterestClass, getMatchingStudents } from '@/utils/interestClassFilter'
import { createSeededRandom, generateDeterministicId } from '@/utils/seededRandom'
import { getRealStudents, normalizeStudents } from '@/utils/realDataLoader'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const searchQuery = ref('')
const filterClass = ref('')
const filterLevel = ref('')
const selectedStudent = ref(null)
const activeTab = ref('overview')
const generating = ref(false)
const generatingId = ref(null)
const currentReview = ref(null)
const reviewHistory = ref([])
const detailDialogVisible = ref(false)
const selectedHistoryRecord = ref(null)
const currentTrainingPlan = ref(null)
const currentLearningPath = ref(null)

const reviewTabs = [
  { key: 'overview', label: '综合评价', iconName: 'star' },
  { key: 'suggestions', label: '改进建议', iconName: 'star' },
  { key: 'learning-path', label: '学习路径', iconName: 'compass' },
  { key: 'training-plan', label: '训练计划', iconName: 'timer' },
  { key: 'history', label: '点评历史', iconName: 'clock' }
]

const schoolData = getSchoolData(store.state.school.id) || {}

// 优先使用真实学生数据（从学生管理页面导入的），回退到 mock 数据
const realStudents = getRealStudents(store.state.school.id)
const baseStudents = normalizeStudents(realStudents.length > 0 ? realStudents : (schoolData.students || []))

const generateMockReviews = () => {
  const events = ['立定跳远', '跳绳', '50米跑', '仰卧起坐', '坐位体前屈', '引体向上']
  
  return baseStudents.map(student => {
    const sportData = events.map(event => {
      const score = generateScore(event)
      return {
        event,
        score,
        grade: getGradeByScore(event, score)
      }
    })
    
    const overallRating = calculateRating(sportData)
    
    return {
      ...student,
      className: `${student.grade || ''}${student.class || ''}`,
      sportsInterest: student.sportsInterest || '',
      sportData,
      overallRating
    }
  })
}

function generateScore(event) {
  const random = createSeededRandom(schoolId.value + '_score_' + event)
  const scores = {
    '立定跳远': () => (120 + random() * 100).toFixed(1),
    '仰卧起坐': () => Math.floor(10 + random() * 50),
    '坐位体前屈': () => (-10 + random() * 35).toFixed(1),
    '50米跑': () => (7 + random() * 4).toFixed(1),
    '跳绳': () => Math.floor(40 + random() * 100),
    '引体向上': () => Math.floor(0 + random() * 20)
  }
  return scores[event] ? scores[event]() : '-'
}

function getGradeByScore(event, score) {
  const numScore = parseFloat(score)
  
  const gradeRules = {
    '立定跳远': [
      { threshold: 200, grade: '优秀' },
      { threshold: 170, grade: '良好' },
      { threshold: 140, grade: '及格' },
      { threshold: 0, grade: '不及格' }
    ],
    '仰卧起坐': [
      { threshold: 45, grade: '优秀' },
      { threshold: 35, grade: '良好' },
      { threshold: 25, grade: '及格' },
      { threshold: 0, grade: '不及格' }
    ],
    '坐位体前屈': [
      { threshold: 15, grade: '优秀' },
      { threshold: 10, grade: '良好' },
      { threshold: 5, grade: '及格' },
      { threshold: -100, grade: '不及格' }
    ],
    '50米跑': [
      { threshold: 7.5, grade: '优秀', isLower: true },
      { threshold: 8.5, grade: '良好', isLower: true },
      { threshold: 9.5, grade: '及格', isLower: true },
      { threshold: 100, grade: '不及格', isLower: true }
    ],
    '跳绳': [
      { threshold: 140, grade: '优秀' },
      { threshold: 110, grade: '良好' },
      { threshold: 80, grade: '及格' },
      { threshold: 0, grade: '不及格' }
    ],
    '引体向上': [
      { threshold: 12, grade: '优秀' },
      { threshold: 8, grade: '良好' },
      { threshold: 4, grade: '及格' },
      { threshold: 0, grade: '不及格' }
    ]
  }
  
  const rules = gradeRules[event]
  if (!rules) return '良好'
  
  for (const rule of rules) {
    if (rule.isLower) {
      if (numScore <= rule.threshold) return rule.grade
    } else {
      if (numScore >= rule.threshold) return rule.grade
    }
  }
  
  return '不及格'
}

function calculateRating(sportData) {
  const gradeMap = { '优秀': 4, '良好': 3, '及格': 2, '不及格': 1 }
  const avgScore = sportData.reduce((sum, d) => sum + (gradeMap[d.grade] || 2), 0) / sportData.length
  if (avgScore >= 3.5) return '优秀'
  if (avgScore >= 2.5) return '良好'
  if (avgScore >= 1.5) return '需改进'
  return '待提升'
}

// 检查是否需要重新生成（真实学生数据更新后）
const studentsStorageKey = `students_${store.state.school.id}`
const aiReviewStorageKey = `ai_review_students_v2_${store.state.school.id}`

// 读取上次使用的学生数据指纹（简单长度比较）
const getLastStudentCount = () => {
  try {
    const raw = sessionStorage.getItem(aiReviewStorageKey + '_student_count')
    return raw ? parseInt(raw) : 0
  } catch (e) { return 0 }
}

// 获取当前真实学生数量
const currentStudentCount = baseStudents.length
const lastStudentCount = getLastStudentCount()

// 如果真实学生数量变化，重新生成点评数据
const needRegenerate = currentStudentCount !== lastStudentCount && currentStudentCount > 0

const students = usePersistedRef(aiReviewStorageKey, () => {
  if (needRegenerate) {
    // 保存当前学生数量
    sessionStorage.setItem(aiReviewStorageKey + '_student_count', currentStudentCount.toString())
    return generateMockReviews()
  }
  return generateMockReviews()
})

// 如果需要重新生成，强制更新
if (needRegenerate) {
  students.value = generateMockReviews()
  sessionStorage.setItem(aiReviewStorageKey + '_student_count', currentStudentCount.toString())
}

const classList = computed(() => {
  const classes = new Set(students.value.map(s => `${s.grade || ''}${s.class || ''}`))
  // 追加分项班/兴趣班
  const schoolClasses = schoolData.classes || []
  schoolClasses.filter(c => c.type === '分项班').forEach(c => classes.add(c.name))
  return Array.from(classes).filter(c => c)
})

const filteredStudents = computed(() => {
  return students.value.filter(s => {
    const matchName = !searchQuery.value || s.name.includes(searchQuery.value) || s.id.includes(searchQuery.value)
    let matchClass
    if (!filterClass.value) {
      matchClass = true
    } else if (isInterestClass(filterClass.value)) {
      const matching = getMatchingStudents(filterClass.value, baseStudents)
      const matchingIds = new Set(matching.map(ms => ms.id))
      matchClass = matchingIds.has(s.id)
    } else {
      matchClass = s.className.includes(filterClass.value)
    }
    const matchLevel = !filterLevel.value || s.overallRating === filterLevel.value
    return matchName && matchClass && matchLevel
  })
})

const stats = computed(() => {
  const total = students.value.length
  const excellent = students.value.filter(s => s.overallRating === '优秀').length
  const needImprove = students.value.filter(s => s.overallRating === '需改进' || s.overallRating === '待提升').length
  const planCount = students.value.filter(s => s.trainingPlan).length
  return {
    totalStudents: total,
    excellentCount: excellent,
    needImproveCount: needImprove,
    planCount: planCount,
    avgGenerationTime: '0.8'
  }
})

const getAvatarColor = (id) => {
  const colors = ['#1E5AA8', '#3B82F6', '#F5A623', '#E85D4E', '#8B5CF6', '#06B6D4']
  return colors[id.charCodeAt(0) % colors.length]
}

const getRatingClass = (rating) => {
  const map = { '优秀': 'rating-excellent', '良好': 'rating-good', '需改进': 'rating-warning', '待提升': 'rating-danger' }
  return map[rating] || ''
}

const getGradeClass = (grade) => {
  const map = { '优秀': 'grade-excellent', '良好': 'grade-good', '及格': 'grade-warning', '不及格': 'grade-danger' }
  return map[grade] || ''
}

const weakItems = computed(() => {
  if (!selectedStudent.value?.sportData) return []
  return selectedStudent.value.sportData
    .filter(d => d.grade === '需改进' || d.grade === '待提升')
    .map(d => ({
      event: d.event,
      score: d.score,
      unit: getUnit(d.event),
      level: d.grade === '待提升' ? 'danger' : 'warning',
      levelText: d.grade
    }))
})

const getUnit = (event) => {
  const units = { '立定跳远': 'cm', '跳绳': '次', '50米跑': '秒', '仰卧起坐': '个', '坐位体前屈': 'cm', '引体向上': '个' }
  return units[event] || ''
}

const getProgressColor = (percentage) => {
  if (percentage >= 80) return '#1E5AA8'
  if (percentage >= 60) return '#F5A623'
  return '#E85D4E'
}

const getLevelClass = (level) => {
  const map = { '入门': 'level-beginner', '基础': 'level-basic', '进阶': 'level-advanced', '优秀': 'level-excellent' }
  return map[level] || ''
}

const getLevelColor = (level) => {
  const map = { '入门': '#E85D4E', '基础': '#F5A623', '进阶': '#3B82F6', '优秀': '#1E5AA8' }
  return map[level] || '#9CA3AF'
}

const getLevelByRating = (rating) => {
  const map = { '待提升': '入门', '需改进': '基础', '良好': '进阶', '优秀': '优秀' }
  return map[rating] || '基础'
}

const getLevelProgress = (rating) => {
  const map = { '待提升': 15, '需改进': 40, '良好': 70, '优秀': 95 }
  return map[rating] || 40
}

const generateLearningPath = () => {
  if (!selectedStudent.value) return
  
  const rating = selectedStudent.value.overallRating || '良好'
  const level = getLevelByRating(rating)
  const progress = getLevelProgress(rating)
  
  const weakEvents = weakItems.value.map(w => w.event)
  
  const pathTemplates = {
    '入门': {
      title: '基础能力提升路径',
      description: '从基础动作开始，逐步建立正确的运动习惯和基本能力。本阶段重点培养运动兴趣和基础动作规范。',
      stages: [
        {
          duration: '第1-2周',
          title: '基础动作学习',
          description: '学习各项运动的标准动作要领，建立正确的动作模式。',
          content: ['学习标准热身流程', '掌握立定跳远正确姿势', '学习跳绳基本技巧', '了解50米跑起跑动作'],
          resources: ['体育基础教学视频', '动作规范图解', '基础热身教程']
        },
        {
          duration: '第3-4周',
          title: '基础能力培养',
          description: '通过简单练习，逐步提升基础运动能力和协调性。',
          content: ['每天10分钟跳绳练习', '每周3次立定跳远练习', '基础柔韧性训练', '简单核心力量练习'],
          resources: ['入门训练计划', '柔韧性训练视频', '核心力量入门']
        },
        {
          duration: '第5-6周',
          title: '动作巩固与提升',
          description: '巩固已学动作，尝试提高练习强度和难度。',
          content: ['跳绳连续练习', '立定跳远距离提升', '50米跑计时练习', '基础体能训练'],
          resources: ['动作巩固训练', '体能提升教程', '计时训练方法']
        }
      ],
      courses: [
        { icon: '🏃', title: '基础跑跳技巧', duration: '30分钟', level: '入门' },
        { icon: '🤸', title: '柔韧性入门训练', duration: '25分钟', level: '入门' },
        { icon: '🪢', title: '跳绳基础教学', duration: '20分钟', level: '入门' },
        { icon: '🏋️', title: '核心力量入门', duration: '20分钟', level: '入门' }
      ]
    },
    '基础': {
      title: '能力进阶提升路径',
      description: '在掌握基础动作的基础上，针对性提升薄弱项，逐步提高运动成绩。',
      stages: [
        {
          duration: '第1-2周',
          title: '薄弱项专项突破',
          description: `针对${weakEvents.join('、')}等薄弱项目进行专项训练。`,
          content: [`${weakEvents[0] || '基础'}专项训练`, '动作细节打磨', '力量基础提升', '每周2次模拟测试'],
          resources: ['专项训练计划', '动作分析视频', '力量训练教程']
        },
        {
          duration: '第3-4周',
          title: '综合能力提升',
          description: '全面提升各项运动能力，注重均衡发展。',
          content: ['爆发力训练', '耐力提升练习', '协调性训练', '综合体能训练'],
          resources: ['综合训练计划', '爆发力训练视频', '耐力提升方法']
        },
        {
          duration: '第5-6周',
          title: '成绩冲刺',
          description: '通过系统性训练，全力提升测试成绩。',
          content: ['高强度专项训练', '模拟测试训练', '心理调节训练', '恢复与放松'],
          resources: ['冲刺训练计划', '比赛心理指导', '恢复训练教程']
        }
      ],
      courses: [
        { icon: '⚡', title: '爆发力提升训练', duration: '35分钟', level: '基础' },
        { icon: '💪', title: '核心力量强化', duration: '30分钟', level: '基础' },
        { icon: '🏃', title: '速度训练技巧', duration: '25分钟', level: '基础' },
        { icon: '🧘', title: '柔韧性进阶训练', duration: '30分钟', level: '基础' }
      ]
    },
    '进阶': {
      title: '高水平突破路径',
      description: '针对优秀学生，突破瓶颈，向更高水平迈进。注重技术细节和竞技能力培养。',
      stages: [
        {
          duration: '第1-2周',
          title: '技术精细化',
          description: '深入分析动作细节，优化技术动作，提升动作效率。',
          content: ['动作视频分析', '技术细节优化', '运动力学学习', '专家指导'],
          resources: ['动作分析工具', '运动力学教程', '专家指导视频']
        },
        {
          duration: '第3-4周',
          title: '竞技能力提升',
          description: '培养竞技意识和比赛能力，适应高强度训练。',
          content: ['高强度间歇训练', '模拟比赛训练', '战术分析', '体能极限突破'],
          resources: ['HIIT训练计划', '比赛战术分析', '极限体能训练']
        },
        {
          duration: '第5-6周',
          title: '综合竞技',
          description: '全面提升竞技能力，为比赛和测试做好准备。',
          content: ['完整模拟测试', '心理抗压训练', '营养与恢复', '赛前准备'],
          resources: ['模拟测试方案', '心理训练教程', '运动营养指南']
        }
      ],
      courses: [
        { icon: '🎯', title: '技术精细化训练', duration: '40分钟', level: '进阶' },
        { icon: '🔥', title: 'HIIT高强度训练', duration: '35分钟', level: '进阶' },
        { icon: '⚽', title: '竞技心理训练', duration: '30分钟', level: '进阶' },
        { icon: '🥗', title: '运动营养指导', duration: '25分钟', level: '进阶' }
      ]
    },
    '优秀': {
      title: '卓越运动员培养路径',
      description: '针对顶尖学生，进行专业化训练，培养全面发展的优秀运动员。',
      stages: [
        {
          duration: '第1-2周',
          title: '专项深化',
          description: '深入研究优势项目，向专业水平迈进。',
          content: ['专项技术深造', '专业教练指导', '技术创新研究', '国内外优秀案例学习'],
          resources: ['专业训练计划', '国际训练视频', '技术研究资料']
        },
        {
          duration: '第3-4周',
          title: '综合素质提升',
          description: '全面提升运动素养，培养领袖气质。',
          content: ['领导力培养', '团队协作训练', '运动科学知识', '公众表达能力'],
          resources: ['领导力训练', '团队合作教程', '运动科学课程']
        },
        {
          duration: '第5-6周',
          title: '精英展示',
          description: '通过比赛和展示，展现优秀成果。',
          content: ['参加高水平比赛', '经验分享', '指导低年级同学', '个人成果展示'],
          resources: ['比赛报名指南', '演讲技巧', '成果展示模板']
        }
      ],
      courses: [
        { icon: '🌟', title: '专业技术深造', duration: '45分钟', level: '优秀' },
        { icon: '👑', title: '领导力培养', duration: '35分钟', level: '优秀' },
        { icon: '📚', title: '运动科学概论', duration: '40分钟', level: '优秀' },
        { icon: '🎤', title: '公众表达训练', duration: '30分钟', level: '优秀' }
      ]
    }
  }
  
  const template = pathTemplates[level] || pathTemplates['基础']
  
  const learningPath = {
    id: generateDeterministicId('learning-path', selectedStudent.value.id),
    title: template.title,
    description: template.description,
    currentLevel: level,
    progress: progress,
    stages: template.stages,
    courses: template.courses
  }
  
  currentLearningPath.value = learningPath
  
  const studentIndex = students.value.findIndex(s => s.id === selectedStudent.value.id)
  if (studentIndex !== -1) {
    students.value[studentIndex] = {
      ...students.value[studentIndex],
      learningPath: learningPath
    }
  }
  
  ElMessage.success('学习路径生成成功！')
}

const getTargetByWeakness = (weakItems) => {
  if (!weakItems || weakItems.length === 0) return '综合能力'
  
  const weakEvents = weakItems.map(w => w.event)
  
  if (weakEvents.includes('立定跳远') || weakEvents.includes('50米跑')) {
    return '爆发力'
  }
  if (weakEvents.includes('坐位体前屈')) {
    return '柔韧性'
  }
  if (weakEvents.includes('跳绳')) {
    return '协调性'
  }
  if (weakEvents.includes('仰卧起坐') || weakEvents.includes('引体向上')) {
    return '核心力量'
  }
  
  return '综合能力'
}

const generateTrainingPlan = () => {
  const weakEvents = weakItems.value.map(w => w.event).join('、') || '综合能力'
  const target = getTargetByWeakness(weakItems.value)
  
  const days = 7
  const dailyTasks = Array.from({ length: days }, (_, i) => [
    `热身运动 10分钟`,
    i < 3 ? `${weakEvents}基础训练 ${30 + i * 5}分钟` : `${weakEvents}进阶训练 ${40 + (i - 3) * 5}分钟`,
    i < 5 ? `辅助训练 ${20 + i * 5}分钟` : `核心力量训练 ${30 + (i - 5) * 5}分钟`,
    `拉伸放松 10分钟`
  ])

  const now = new Date()
  const endDate = new Date(now)
  endDate.setDate(endDate.getDate() + days)

  const plan = {
    id: generateDeterministicId('training-plan', selectedStudent.value.id),
    title: `${weakEvents}提升计划`,
    startDate: now.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0],
    duration: `${days}天`,
    totalDays: days,
    completedDays: 0,
    progress: 0,
    target: target,
    dailyTasks,
    notes: '训练前请做好热身，避免受伤。如有不适请立即停止训练。'
  }

  currentTrainingPlan.value = plan

  const studentIndex = students.value.findIndex(s => s.id === selectedStudent.value.id)
  if (studentIndex !== -1) {
    students.value[studentIndex] = {
      ...students.value[studentIndex],
      trainingPlan: plan
    }
  }

  ElMessage.success('训练计划生成成功！')
}

const exportTrainingPlan = async () => {
  if (!currentTrainingPlan.value) {
    ElMessage.warning('请先生成训练计划')
    return
  }

  try {
    const xlsxModule = await import('xlsx')
    const xlsx = xlsxModule.default || xlsxModule

    const plan = currentTrainingPlan.value
    const data = []

    data.push({ '项目': '训练计划名称', '内容': plan.title })
    data.push({ '项目': '训练周期', '内容': `${plan.startDate} ~ ${plan.endDate} (${plan.duration})` })
    data.push({ '项目': '训练目标', '内容': plan.target })
    data.push({ '项目': '完成进度', '内容': `${plan.progress}%` })
    data.push({ '项目': '', '内容': '' })

    data.push({ '项目': '薄弱项分析', '内容': '' })
    weakItems.value.forEach(item => {
      data.push({ '项目': item.event, '内容': `${item.score}${item.unit} (${item.levelText})` })
    })
    data.push({ '项目': '', '内容': '' })

    data.push({ '项目': '每日训练安排', '内容': '' })
    plan.dailyTasks.forEach((day, idx) => {
      data.push({ '项目': `第${idx + 1}天`, '内容': '' })
      day.forEach(task => {
        data.push({ '项目': '', '内容': `• ${task}` })
      })
    })
    data.push({ '项目': '', '内容': '' })
    data.push({ '项目': '注意事项', '内容': plan.notes })

    const worksheet = xlsx.utils.json_to_sheet(data)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, '训练计划')

    const cols = [{ wch: 20 }, { wch: 60 }]
    worksheet['!cols'] = cols

    const now = new Date()
    const filename = `训练计划_${selectedStudent.value.name}_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.xlsx`

    xlsx.writeFile(workbook, filename)
    ElMessage.success('训练计划导出成功！')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

const selectStudent = (student) => {
  generatingId.value = null
  generating.value = false
  selectedStudent.value = student
  if (student.review) {
    currentReview.value = student.review
  } else {
    currentReview.value = null
  }
  if (student.reviewHistory) {
    reviewHistory.value = student.reviewHistory
  } else {
    reviewHistory.value = []
  }
  if (student.trainingPlan) {
    currentTrainingPlan.value = student.trainingPlan
  } else {
    currentTrainingPlan.value = null
  }
  if (student.learningPath) {
    currentLearningPath.value = student.learningPath
  } else {
    currentLearningPath.value = null
  }
  activeTab.value = 'overview'
}

const generateReview = async () => {
  if (!selectedStudent.value || generating.value) return
  
  generating.value = true
  generatingId.value = selectedStudent.value.id
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const student = selectedStudent.value
    const sportData = student.sportData || []
    
    const excellentItems = sportData.filter(d => d.grade === '优秀')
    const weakItemsLocal = sportData.filter(d => d.grade === '需改进' || d.grade === '待提升' || d.grade === '不及格')
    
    const strengthDescriptions = {
      '立定跳远': (score) => `立定跳远${score}cm，爆发力出色`,
      '跳绳': (score) => `跳绳${score}次，协调性优秀`,
      '50米跑': (score) => `50米跑${score}秒，速度敏捷`,
      '仰卧起坐': (score) => `仰卧起坐${score}个，核心力量强`,
      '坐位体前屈': (score) => `坐位体前屈${score}cm，柔韧性极佳`,
      '引体向上': (score) => `引体向上${score}个，上肢力量突出`
    }
    
    const weaknessDescriptions = {
      '立定跳远': (score) => `立定跳远${score}cm，爆发力不足`,
      '跳绳': (score) => `跳绳${score}次，协调性有待提高`,
      '50米跑': (score) => `50米跑${score}秒，速度较慢`,
      '仰卧起坐': (score) => `仰卧起坐${score}个，核心力量薄弱`,
      '坐位体前屈': (score) => `坐位体前屈${score}cm，柔韧性较差`,
      '引体向上': (score) => `引体向上${score}个，上肢力量不足`
    }
    
    const suggestionTemplates = {
      '立定跳远': {
        title: '爆发力专项训练',
        description: '建议增加深蹲跳、弓步跳、蛙跳等训练，每周3次，每次30分钟，重点提升下肢爆发力。',
        tags: ['爆发力', '下肢力量', '专项训练']
      },
      '跳绳': {
        title: '协调性提升训练',
        description: '建议每天进行10-15分钟跳绳练习，从慢到快，逐步提升手脚协调性和节奏感。',
        tags: ['协调性', '节奏感', '日常训练']
      },
      '50米跑': {
        title: '速度训练计划',
        description: '建议进行短距离冲刺训练，每周3次，每次20分钟，配合高抬腿、后蹬跑等辅助练习。',
        tags: ['速度', '冲刺', '爆发力']
      },
      '仰卧起坐': {
        title: '核心力量强化',
        description: '建议进行平板支撑、仰卧起坐变式、臀桥等训练，增强核心稳定性，提升整体运动表现。',
        tags: ['核心力量', '稳定性', '力量训练']
      },
      '坐位体前屈': {
        title: '柔韧性训练',
        description: '建议每周进行2-3次柔韧性训练，包括瑜伽拉伸、动态拉伸等，重点提升坐位体前屈成绩。',
        tags: ['柔韧性', '拉伸', '日常训练']
      },
      '引体向上': {
        title: '上肢力量训练',
        description: '建议进行俯卧撑、哑铃训练、弹力带练习等，每周3次，每次25分钟，增强上肢和背部力量。',
        tags: ['上肢力量', '背部力量', '力量训练']
      }
    }
    
    const strengths = excellentItems.map(d => {
      const desc = strengthDescriptions[d.event]
      return desc ? desc(d.score) : `${d.event}成绩${d.score}，表现优秀`
    })
    
    const weaknesses = weakItemsLocal.map(d => {
      const desc = weaknessDescriptions[d.event]
      return desc ? desc(d.score) : `${d.event}成绩${d.score}，需要加强`
    })
    
    const suggestions = weakItemsLocal.slice(0, 3).map(d => {
      const template = suggestionTemplates[d.event]
      if (template) {
        return {
          ...template,
          description: `${d.event}当前成绩${d.score}${getUnit(d.event)}，${template.description}`
        }
      }
      return {
        title: `${d.event}提升计划`,
        description: `${d.event}当前成绩${d.score}${getUnit(d.event)}，建议加强日常训练，逐步提升该项能力。`,
        tags: ['专项训练', '日常锻炼']
      }
    })
    
    const ratingText = student.overallRating || '良好'
    const ratingAdjectives = {
      '优秀': '表现优秀，各项运动能力均衡发展',
      '良好': '表现良好，具备较好的运动基础',
      '需改进': '有一定运动基础，但整体表现有待提升',
      '待提升': '运动能力较弱，需要加强基础训练'
    }
    
    let overview = `${student.name}同学整体${ratingAdjectives[ratingText] || '表现良好'}。`
    
    if (strengths.length > 0) {
      overview += ` ${strengths[0]}，是你的优势项目。`
    }
    if (weaknesses.length > 0) {
      overview += ` ${weaknesses[0]}，建议加强训练。`
    }
    if (strengths.length === 0 && weaknesses.length === 0) {
      overview += ' 建议保持现有状态，继续努力提升。'
    }
    
    const reviewData = {
      overview,
      strengths: strengths.length > 0 ? strengths : ['参与态度积极，训练认真'],
      weaknesses: weaknesses.length > 0 ? weaknesses : ['暂无明显薄弱项'],
      suggestions: suggestions.length > 0 ? suggestions : [
        { title: '保持优势', description: '继续保持现有训练状态，争取更优秀的成绩。', tags: ['保持', '日常训练'] }
      ]
    }
    
    const historyData = [
      { 
        date: new Date().toISOString().split('T')[0], 
        rating: student.overallRating, 
        summary: 'AI智能点评已生成', 
        evaluator: '系统AI', 
        type: 'AI点评', 
        details: `基于${student.name}同学的运动数据自动生成的个性化点评，包含综合评价、优势分析、待改进项和改进建议。`, 
        scores: sportData.slice(0, 3).map(d => ({ event: d.event, score: d.score, grade: d.grade })) 
      },
      { 
        date: getPastDate(30), 
        rating: getRandomRating(), 
        summary: '教师手动点评', 
        evaluator: '王老师', 
        type: '教师点评', 
        details: `${student.name}同学学习态度积极，课堂表现良好，建议加强核心力量训练，提高运动稳定性。`, 
        scores: sportData.slice(2, 5).map(d => ({ event: d.event, score: d.score, grade: d.grade })) 
      },
      { 
        date: getPastDate(60), 
        rating: getRandomRating(), 
        summary: '月度测评点评', 
        evaluator: '系统', 
        type: '月度测评', 
        details: `本月测评成绩显示${weakItemsLocal.length > 0 ? weakItemsLocal[0].event : '综合能力'}需要加强，建议增加专项训练。`, 
        scores: sportData.slice(0, 2).map(d => ({ event: d.event, score: d.score, grade: d.grade })) 
      }
    ]
    
    // 先清除生成状态，确保动画/加载指示器消失
    generatingId.value = null
    generating.value = false
    
    // 更新点评数据
    currentReview.value = reviewData
    reviewHistory.value = historyData
    
    // 更新 students 数组并刷新 selectedStudent 引用
    const studentIndex = students.value.findIndex(s => s.id === student.id)
    if (studentIndex !== -1) {
      students.value[studentIndex] = {
        ...students.value[studentIndex],
        review: reviewData,
        reviewHistory: historyData,
        lastReviewDate: new Date().toISOString().split('T')[0]
      }
      // 刷新 selectedStudent 指向更新后的对象，避免引用过期
      selectedStudent.value = students.value[studentIndex]
    }
    
    activeTab.value = 'overview'
    
    // 点评生成后自动生成学习路径和训练计划（基于点评结果）
    await nextTick()
    
    // 自动生成学习路径
    try {
      generateLearningPath()
      // generateLearningPath 会替换 students 数组中的对象，需刷新引用
      const idx = students.value.findIndex(s => s.id === student.id)
      if (idx !== -1) selectedStudent.value = students.value[idx]
    } catch (e) {
      console.warn('学习路径自动生成失败:', e)
    }
    
    // 自动生成训练计划
    try {
      generateTrainingPlan()
      const idx = students.value.findIndex(s => s.id === student.id)
      if (idx !== -1) selectedStudent.value = students.value[idx]
    } catch (e) {
      console.warn('训练计划自动生成失败:', e)
    }
    
    ElMessage.success('AI点评生成成功！')
  } catch (error) {
    console.error('AI点评生成失败:', error)
    ElMessage.error('AI点评生成失败，请重试')
  } finally {
    // 确保无论成功或失败，加载状态都被清除
    generatingId.value = null
    generating.value = false
  }
}

const getPastDate = (days) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}

const getRandomRating = () => {
  const random = createSeededRandom(schoolId.value + '_randomRating')
  const ratings = ['优秀', '良好', '需改进', '待提升']
  return ratings[Math.floor(random() * ratings.length)]
}

const handleSearch = () => {
  if (!searchQuery.value && !filterClass.value && !filterLevel.value) {
    ElMessage.info('请输入搜索条件')
    return
  }
  ElMessage.success(`搜索完成，共找到 ${filteredStudents.value.length} 名学生`)
}

const exportReviews = async () => {
  try {
    const xlsxModule = await import('xlsx')
    const xlsx = xlsxModule.default || xlsxModule
    
    const data = students.value.map(s => ({
      '学号': s.id,
      '姓名': s.name,
      '班级': s.className,
      '综合评级': s.overallRating,
      '立定跳远': s.sportData?.find(d => d.event === '立定跳远')?.score || '',
      '立定跳远评级': s.sportData?.find(d => d.event === '立定跳远')?.grade || '',
      '跳绳': s.sportData?.find(d => d.event === '跳绳')?.score || '',
      '跳绳评级': s.sportData?.find(d => d.event === '跳绳')?.grade || '',
      '50米跑': s.sportData?.find(d => d.event === '50米跑')?.score || '',
      '50米跑评级': s.sportData?.find(d => d.event === '50米跑')?.grade || '',
      '仰卧起坐': s.sportData?.find(d => d.event === '仰卧起坐')?.score || '',
      '仰卧起坐评级': s.sportData?.find(d => d.event === '仰卧起坐')?.grade || '',
      '坐位体前屈': s.sportData?.find(d => d.event === '坐位体前屈')?.score || '',
      '坐位体前屈评级': s.sportData?.find(d => d.event === '坐位体前屈')?.grade || '',
      '引体向上': s.sportData?.find(d => d.event === '引体向上')?.score || '',
      '引体向上评级': s.sportData?.find(d => d.event === '引体向上')?.grade || '',
      '综合评价': s.review?.overview || ''
    }))
    
    const worksheet = xlsx.utils.json_to_sheet(data)
    const workbook = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(workbook, worksheet, 'AI点评报告')
    
    const cols = [
      { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 10 },
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 10 },
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 10 },
      { wch: 15 }, { wch: 10 }, { wch: 15 }, { wch: 10 },
      { wch: 60 }
    ]
    worksheet['!cols'] = cols
    
    const now = new Date()
    const filename = `AI点评报告_${now.getFullYear()}${String(now.getMonth()+1).padStart(2,'0')}${String(now.getDate()).padStart(2,'0')}.xlsx`
    
    xlsx.writeFile(workbook, filename)
    ElMessage.success('点评报告导出成功！')
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败，请重试')
  }
}

const viewHistoryDetail = (record) => {
  selectedHistoryRecord.value = record
  detailDialogVisible.value = true
}
</script>

<style scoped>
.ai-review-page {
  padding: 16px;
  background: #F7F8FA;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-top: 24px;
  margin-bottom: 24px;
}

.header-filters {
  display: flex;
  gap: 16px;
  align-items: center;
}

.header-left {
  h2.page-title {
    font-size: 24px;
    font-weight: 600;
    color: #1A1A2E;
    margin: 0 0 8px 0;
  }
  p.page-desc {
    font-size: 14px;
    color: #6B7280;
    margin: 0;
  }
}



.stats-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stats-row {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  gap: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-item .stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #1E5AA8;
}

.stat-item .stat-label {
  font-size: 12px;
  color: #6B7280;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #E8EAED;
}

.main-content {
  display: flex;
  gap: 20px;
}

.student-list {
  width: 260px;
  flex-shrink: 0;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 300px);
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #E8EAED;
  
  .list-title {
    font-size: 16px;
    font-weight: 600;
    color: #1A1A2E;
  }
  .list-count {
    font-size: 12px;
    color: #9CA3AF;
  }
}

.student-items {
  flex: 1;
  overflow-y: auto;
}

.student-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover { background: #F0FDF4; }
  &.active { background: #F0FDF4; border-left: 3px solid #1E5AA8; }
  &.generating { opacity: 0.6; }
}

.student-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 16px;
  font-weight: 600;
}

.student-info {
  flex: 1;
  
  .student-name {
    font-size: 14px;
    font-weight: 500;
    color: #1A1A2E;
  }
  .student-class {
    font-size: 12px;
    color: #6B7280;
  }
}

.student-rating {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 4px;
  
  &.rating-excellent { background: #DCFCE7; color: #166534; }
  &.rating-good { background: #DBEAFE; color: #1E40AF; }
  &.rating-warning { background: #FEF3C7; color: #92400E; }
  &.rating-danger { background: #FEE2E2; color: #991B1B; }
}

.generating-indicator {
  .loading-icon {
    animation: spin 1s linear infinite;
    color: #1E5AA8;
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.review-detail {
  flex: 1;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  overflow: hidden;
  min-height: 600px;
  display: flex;
  flex-direction: column;
}

.detail-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #E8EAED;
}

.student-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.profile-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  font-size: 24px;
  font-weight: 600;
}

.profile-info {
  .profile-name {
    font-size: 20px;
    font-weight: 600;
    color: #1A1A2E;
    margin: 0 0 4px 0;
  }
  .profile-class {
    font-size: 14px;
    color: #6B7280;
    margin: 0;
  }
}

.rating-badge {
  font-size: 16px;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 8px;
  
  &.rating-excellent { background: #DCFCE7; color: #166534; }
  &.rating-good { background: #DBEAFE; color: #1E40AF; }
  &.rating-warning { background: #FEF3C7; color: #92400E; }
  &.rating-danger { background: #FEE2E2; color: #991B1B; }
}

.data-overview {
  padding: 16px;
  border-bottom: 1px solid #E8EAED;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 16px 0;
}

.data-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.data-card {
  padding: 16px;
  background: #F7F8FA;
  border-radius: 10px;
  text-align: center;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  
  .data-value {
    font-size: 24px;
    font-weight: 700;
    color: #1A1A2E;
    margin-bottom: 6px;
  }
  .data-label {
    font-size: 13px;
    color: #6B7280;
    margin-bottom: 8px;
  }
  .data-grade {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 4px;
    
    &.grade-excellent { background: #DCFCE7; color: #166534; }
    &.grade-good { background: #DBEAFE; color: #1E40AF; }
    &.grade-warning { background: #FEF3C7; color: #92400E; }
    &.grade-danger { background: #FEE2E2; color: #991B1B; }
  }
}

.review-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.review-tabs {
  display: flex;
  padding: 0 16px;
  border-bottom: 1px solid #E8EAED;
}

.review-tab {
  padding: 12px 20px;
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  
  &:hover { color: #1E5AA8; }
  &.active {
    color: #1E5AA8;
    border-bottom-color: #1E5AA8;
    background: #F0FDF4;
  }
}

.review-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.tab-content {
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.overview-section {
  margin-bottom: 20px;
  
  .overview-title {
    font-size: 15px;
    font-weight: 600;
    color: #6B7280;
    margin: 0 0 12px 0;
  }
  .overview-text {
    font-size: 15px;
    line-height: 1.8;
    color: #1A1A2E;
    margin: 0;
    padding: 16px;
    background: #F7F8FA;
    border-radius: 8px;
  }
}

.strengths-section, .weaknesses-section {
  margin-bottom: 18px;
  
  .section-subtitle {
    font-size: 15px;
    font-weight: 600;
    color: #1A1A2E;
    margin: 0 0 12px 0;
  }
}

.points-list {
  list-style: none;
  padding: 0;
  margin: 0;
}

.points-list li {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 14px;
  background: #F7F8FA;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 14px;
  color: #1A1A2E;
  
  .point-icon {
    flex-shrink: 0;
    font-size: 16px;
    
    &.good { color: #1E5AA8; }
    &.warning { color: #F5A623; }
  }
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.suggestion-item {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.suggestion-number {
  width: 32px;
  height: 32px;
  background: #1E5AA8;
  color: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.suggestion-content {
  flex: 1;
  
  .suggestion-title {
    font-size: 15px;
    font-weight: 600;
    color: #1A1A2E;
    margin: 0 0 8px 0;
  }
  .suggestion-desc {
    font-size: 14px;
    line-height: 1.7;
    color: #6B7280;
    margin: 0 0 12px 0;
  }
}

.suggestion-tags {
  display: flex;
  gap: 6px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: #F7F8FA;
  border-radius: 6px;
  min-height: 44px;
}

.history-date {
  font-size: 12px;
  color: #6B7280;
  width: 120px;
  font-weight: 500;
}

.history-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  
  .history-rating {
    font-size: 12px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 4px;
    
    &.rating-excellent { background: #DCFCE7; color: #166534; }
    &.rating-good { background: #DBEAFE; color: #1E40AF; }
    &.rating-warning { background: #FEF3C7; color: #92400E; }
    &.rating-danger { background: #FEE2E2; color: #991B1B; }
  }
  .history-summary {
    font-size: 14px;
    color: #1A1A2E;
    margin: 0;
  }
}

.empty-state, .select-prompt {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.empty-icon, .prompt-icon {
  margin-bottom: 16px;
}

.empty-title, .prompt-title {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 8px 0;
}

.empty-desc, .prompt-desc {
  font-size: 14px;
  color: #6B7280;
  margin: 0 0 24px 0;
}

@media (max-width: 1200px) {
  .main-content {
    flex-direction: column;
    height: auto;
  }
  
  .student-list {
    width: 100%;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .stats-row {
    grid-template-columns: 1fr;
  }
  
  .search-bar {
    flex-wrap: wrap;
  }
  
  .page-header {
    flex-direction: column;
    gap: 16px;
  }
  
  .detail-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
}

.detail-dialog-content {
  padding: 8px 0;
}

.dialog-info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #E8EAED;
  
  &:last-of-type {
    border-bottom: none;
  }
}

.info-label {
  font-size: 14px;
  font-weight: 600;
  color: #6B7280;
}

.info-value {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.dialog-section {
  margin-top: 20px;
}

.dialog-section .section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 12px 0;
}

.detail-text {
  font-size: 14px;
  line-height: 1.8;
  color: #6B7280;
  margin: 0;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.scores-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.score-item {
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
  text-align: center;
  
  .score-label {
    font-size: 12px;
    color: #6B7280;
    margin-bottom: 4px;
  }
  .score-value {
    font-size: 20px;
    font-weight: 700;
    color: #1A1A2E;
    margin-bottom: 6px;
  }
  .score-grade {
    font-size: 11px;
    font-weight: 600;
    padding: 2px 8px;
    border-radius: 4px;
    
    &.grade-excellent { background: #DCFCE7; color: #166534; }
    &.grade-good { background: #DBEAFE; color: #1E40AF; }
    &.grade-warning { background: #FEF3C7; color: #92400E; }
    &.grade-danger { background: #FEE2E2; color: #991B1B; }
  }
}

.training-plan-section {
  padding: 8px 0;
}

.plan-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.plan-actions {
  display: flex;
  gap: 8px;
}

.plan-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.plan-info-card {
  background: #F7F8FA;
  border-radius: 12px;
  padding: 16px 20px;
  
  .plan-title {
    font-size: 18px;
    font-weight: 600;
    color: #1A1A2E;
    margin: 0 0 12px 0;
  }
  
  .plan-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    margin-bottom: 12px;
    
    .meta-item {
      font-size: 13px;
      color: #6B7280;
    }
  }
  
  .plan-progress {
    display: flex;
    align-items: center;
    gap: 12px;
    
    .progress-label {
      font-size: 13px;
      color: #6B7280;
      font-weight: 500;
      width: 80px;
    }
  }
}

.weakness-analysis {
  .weakness-title {
    font-size: 15px;
    font-weight: 600;
    color: #1A1A2E;
    margin: 0 0 12px 0;
  }
  
  .weakness-grid {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
  }
  
  .weakness-item {
    padding: 8px 14px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    gap: 8px;
    
    &.warning {
      background: #FEF3C7;
      .weakness-name { color: #92400E; }
      .weakness-score { color: #B45309; }
      .weakness-level { background: #F59E0B; color: #FFFFFF; }
    }
    
    &.danger {
      background: #FEE2E2;
      .weakness-name { color: #991B1B; }
      .weakness-score { color: #DC2626; }
      .weakness-level { background: #EF4444; color: #FFFFFF; }
    }
    
    .weakness-name {
      font-size: 13px;
      font-weight: 500;
    }
    
    .weakness-score {
      font-size: 14px;
      font-weight: 600;
    }
    
    .weakness-level {
      font-size: 11px;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
    }
  }
}

.daily-tasks {
  .tasks-title {
    font-size: 15px;
    font-weight: 600;
    color: #1A1A2E;
    margin: 0 0 12px 0;
  }
  
  .day-task-card {
    background: #F7F8FA;
    border-radius: 10px;
    padding: 14px 16px;
    margin-bottom: 8px;
    
    .day-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
      
      .day-number {
        font-size: 14px;
        font-weight: 600;
        color: #1E5AA8;
      }
      
      .day-progress {
        font-size: 12px;
        color: #9CA3AF;
        
        &.completed {
          color: #1E5AA8;
        }
      }
    }
    
    .task-list {
      display: flex;
      flex-direction: column;
      gap: 6px;
      
      .task-item {
        display: flex;
        align-items: center;
        gap: 8px;
        
        .task-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #1E5AA8;
          flex-shrink: 0;
        }
        
        .task-text {
          font-size: 13px;
          color: #6B7280;
        }
      }
    }
  }
}

.plan-notes {
  .notes-title {
    font-size: 15px;
    font-weight: 600;
    color: #1A1A2E;
    margin: 0 0 12px 0;
  }
  
  p {
    font-size: 14px;
    line-height: 1.7;
    color: #6B7280;
    margin: 0;
    padding: 14px;
    background: #FEF3C7;
    border-radius: 8px;
    border-left: 3px solid #F5A623;
  }
}

.empty-plan {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  
  p {
    font-size: 14px;
    color: #6B7280;
    margin: 12px 0 20px 0;
  }
}

.learning-path-section {
  padding: 8px 0;
}

.path-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.path-actions {
  display: flex;
  gap: 8px;
}

.path-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.path-overview-card {
  background: linear-gradient(135deg, #1E5AA8 0%, #236B3A 100%);
  border-radius: 12px;
  padding: 20px;
  color: #FFFFFF;
  
  .path-title {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 10px 0;
  }
  
  .path-description {
    font-size: 14px;
    line-height: 1.7;
    opacity: 0.9;
    margin: 0;
  }
}

.level-indicator {
  background: #F7F8FA;
  border-radius: 12px;
  padding: 16px 20px;
  
  .level-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    
    .level-label {
      font-size: 13px;
      color: #6B7280;
      font-weight: 500;
    }
    
    .level-value {
      font-size: 16px;
      font-weight: 600;
      padding: 4px 12px;
      border-radius: 6px;
      
      &.level-beginner { background: #FEE2E2; color: #991B1B; }
      &.level-basic { background: #FEF3C7; color: #92400E; }
      &.level-advanced { background: #DBEAFE; color: #1E40AF; }
      &.level-excellent { background: #DCFCE7; color: #166534; }
    }
  }
  
  .level-progress {
    height: 8px;
    background: #E8EAED;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 12px;
    
    .progress-bar {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
  }
  
  .level-milestones {
    display: flex;
    justify-content: space-between;
    
    .milestone {
      font-size: 12px;
      color: #9CA3AF;
      font-weight: 500;
      
      &.active {
        color: #1E5AA8;
        font-weight: 600;
      }
    }
  }
}

.path-stages {
  .stages-title {
    font-size: 15px;
    font-weight: 600;
    color: #1A1A2E;
    margin: 0 0 12px 0;
  }
  
  .stage-card {
    background: #F7F8FA;
    border-radius: 10px;
    padding: 16px;
    margin-bottom: 10px;
    border-left: 3px solid #1E5AA8;
    
    .stage-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      
      .stage-number {
        font-size: 12px;
        font-weight: 600;
        color: #1E5AA8;
        padding: 2px 8px;
        background: #E0F2FE;
        border-radius: 4px;
      }
      
      .stage-duration {
        font-size: 12px;
        color: #6B7280;
      }
    }
    
    .stage-title {
      font-size: 15px;
      font-weight: 600;
      color: #1A1A2E;
      margin: 0 0 6px 0;
    }
    
    .stage-description {
      font-size: 13px;
      color: #6B7280;
      margin: 0 0 10px 0;
    }
    
    .stage-content {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 10px;
      
      .content-item {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: #4B5563;
      }
    }
    
    .stage-resources {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #9CA3AF;
      
      .resources-label {
        font-weight: 500;
      }
      
      .resources-list {
        color: #6B7280;
      }
    }
  }
}

.recommended-courses {
  .courses-title {
    font-size: 15px;
    font-weight: 600;
    color: #1A1A2E;
    margin: 0 0 12px 0;
  }
  
  .courses-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
  }
  
  .course-card {
    display: flex;
    align-items: center;
    gap: 12px;
    background: #FFFFFF;
    border: 1px solid #E8EAED;
    border-radius: 10px;
    padding: 14px;
    transition: all 0.2s;
    
    &:hover {
      border-color: #1E5AA8;
      box-shadow: 0 2px 8px rgba(30, 90, 168, 0.1);
    }
    
    .course-icon {
      font-size: 32px;
    }
    
    .course-info {
      flex: 1;
      
      .course-title {
        font-size: 14px;
        font-weight: 600;
        color: #1A1A2E;
        margin: 0 0 4px 0;
      }
      
      .course-duration {
        font-size: 12px;
        color: #6B7280;
        margin: 0 0 4px 0;
      }
      
      .course-level {
        font-size: 11px;
        font-weight: 600;
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
        
        &.level-beginner { background: #FEE2E2; color: #991B1B; }
        &.level-basic { background: #FEF3C7; color: #92400E; }
        &.level-advanced { background: #DBEAFE; color: #1E40AF; }
        &.level-excellent { background: #DCFCE7; color: #166534; }
      }
    }
  }
}

.empty-path {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  text-align: center;
  
  p {
    font-size: 14px;
    color: #6B7280;
    margin: 12px 0 20px 0;
  }
}
</style>