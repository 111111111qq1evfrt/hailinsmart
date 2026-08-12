<template>
  <div class="student-data-page">
    <div class="page-header">
      <div class="header-filters">
        <el-select v-model="filterGrade" placeholder="选择年级" class="grade-select" @change="onGradeChange">
          <el-option label="全部年级" value="all"></el-option>
          <el-option label="一年级" value="一年级"></el-option>
          <el-option label="二年级" value="二年级"></el-option>
          <el-option label="三年级" value="三年级"></el-option>
          <el-option label="四年级" value="四年级"></el-option>
          <el-option label="五年级" value="五年级"></el-option>
          <el-option label="六年级" value="六年级"></el-option>
        </el-select>
        <el-select v-model="filterClass" placeholder="选择班级" class="grade-select">
          <el-option label="全部班级" value="all"></el-option>
          <el-option v-for="cls in classOptions" :key="cls" :label="cls" :value="cls"></el-option>
        </el-select>
        <el-select v-model="timeRange" placeholder="时间范围" class="time-select">
          <el-option label="近7天" value="7days"></el-option>
          <el-option label="近30天" value="30days"></el-option>
          <el-option label="本周" value="week"></el-option>
          <el-option label="本月" value="month"></el-option>
          <el-option label="本学期" value="term"></el-option>
        </el-select>
      </div>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData">刷新数据</el-button>
        <el-button type="primary" @click="exportAllData" :icon="Download">导出数据</el-button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ classStats.totalClasses }}</span>
        <span class="stat-label">班级总数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num stat-good">{{ classStats.activeClasses }}</span>
        <span class="stat-label">本周活跃</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :class="getValueColorClass(classStats.avgScore)">{{ classStats.avgScore }}</span>
        <span class="stat-label">平均得分</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num stat-good">{{ classStats.avgDuration }}</span>
        <span class="stat-label">人均运动时长</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num stat-good">{{ classStats.sportsRate }}%</span>
        <span class="stat-label">运动人数占比</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num stat-good">{{ classStats.passRate }}%</span>
        <span class="stat-label">达标人数占比</span>
      </div>
    </div>

    <div class="content-section">
      <div class="content-card full-width">
        <div class="card-header">
          <h3>班级排行榜</h3>
          <el-button type="text" class="export-btn" @click="exportRanking">导出</el-button>
        </div>
        <ExamTable
          :data="filteredRanking"
          :columns="rankingColumns"
          :searchable="false"
          :show-pagination="true"
          :default-page-size="12"
        >
          <template #rank="{ row }">
            <span :class="['rank-badge', getRankClass(row.rank)]">{{ row.rank }}</span>
          </template>
          <template #score="{ row }">
            <span :class="getScoreClass(row.score)">{{ row.score }}</span>
          </template>
          <template #passRate="{ row }">
            <div class="progress-wrapper">
              <el-progress :percentage="row.passRate" :color="getProgressColor(row.passRate)" :show-text="false" stroke-width="8" width="100%" />
              <span :class="['progress-text', getScoreClass(row.passRate)]">{{ row.passRate }}%</span>
            </div>
          </template>
          <template #action="{ row }">
            <el-button type="text" @click="viewClassDetail(row)">查看详情</el-button>
          </template>
        </ExamTable>
      </div>

      <div class="content-row">
        <div class="content-card">
          <div class="card-header">
            <h3>运动一小时统计</h3>
          </div>
          <div ref="hourChart" class="chart"></div>
        </div>
        <div class="content-card">
          <div class="card-header">
            <h3>参与率趋势</h3>
          </div>
          <div ref="participationChart" class="chart"></div>
        </div>
      </div>

      <div class="content-row">
        <div class="content-card">
          <div class="card-header">
            <h3>班级达标率分布</h3>
          </div>
          <div ref="distributionChart" class="chart"></div>
        </div>
        <div class="content-card">
          <div class="card-header">
            <h3>年级达标对比</h3>
          </div>
          <div ref="gradeChart" class="chart"></div>
        </div>
      </div>

      <div class="content-card full-width">
        <div class="card-header">
          <h3>每日人均运动时长趋势</h3>
        </div>
        <div ref="durationChart" class="chart chart-large"></div>
      </div>

      <div class="content-row">
        <div class="content-card">
          <div class="card-header">
            <h3>年级达标率趋势</h3>
          </div>
          <div ref="gradePassTrend" class="chart"></div>
        </div>
        <div class="content-card">
          <div class="card-header">
            <h3>运动项目达标率</h3>
          </div>
          <div ref="projectPassChart" class="chart"></div>
        </div>
      </div>

      <div class="content-card full-width">
        <div class="card-header">
          <h3>班级运动一小时明细</h3>
          <el-button type="text" class="export-btn" @click="exportClassDetail">导出明细</el-button>
        </div>
        <ExamTable
          :data="filteredClassHourDetail"
          :columns="hourDetailColumns"
          :searchable="false"
          :show-pagination="true"
          :default-page-size="10"
        >
          <template #sportsRate="{ row }">
            <span :class="getScoreClass(row.sportsRate)">{{ row.sportsRate }}%</span>
          </template>
          <template #passRate="{ row }">
            <span :class="getScoreClass(row.passRate)">{{ row.passRate }}%</span>
          </template>
          <template #action="{ row }">
            <el-button type="text" @click="viewClassTestRecords(row)">查看测试记录</el-button>
          </template>
        </ExamTable>
      </div>

      <div class="content-card full-width">
        <div class="card-header">
          <h3>班级运动活跃度</h3>
          <div class="legend">
            <span><span class="legend-dot high"></span> 高活跃</span>
            <span><span class="legend-dot medium"></span> 中活跃</span>
            <span><span class="legend-dot low"></span> 低活跃</span>
          </div>
        </div>
        <div class="activity-grid">
          <div 
            v-for="cls in filteredActivity" 
            :key="cls.className"
            :class="['activity-item', cls.level]"
            @click="viewClassDetail(cls)"
          >
            <span class="class-name">{{ cls.className }}</span>
            <span class="active-rate">{{ cls.rate }}%</span>
          </div>
        </div>
      </div>

      <!-- 班级/年级学业水平波动热力图 -->
      <div class="content-card full-width">
        <div class="card-header">
          <h3>班级学业水平波动热力图</h3>
          <div class="legend">
            <span><span class="legend-color" style="background: #DCFCE7"></span> 优秀</span>
            <span><span class="legend-color" style="background: #DBEAFE"></span> 良好</span>
            <span><span class="legend-color" style="background: #FEF3C7"></span> 及格</span>
            <span><span class="legend-color" style="background: #FEE2E2"></span> 待提升</span>
          </div>
        </div>
        <div ref="academicHeatmap" class="chart chart-large"></div>
      </div>

      <!-- 综合素质评价穿透分析 -->
      <div class="content-row">
        <div class="content-card">
          <div class="card-header">
            <h3>综合素质评价雷达图</h3>
          </div>
          <div ref="comprehensiveRadar" class="chart"></div>
        </div>
        <div class="content-card">
          <div class="card-header">
            <h3>评价维度分布</h3>
          </div>
          <div class="evaluation-distribution">
            <div v-for="item in evaluationData" :key="item.name" class="evaluation-item">
              <div class="eval-header">
                <span class="eval-name">{{ item.name }}</span>
                <span :class="['eval-score', getScoreClass(item.score)]">{{ item.score }}分</span>
              </div>
              <div class="eval-bar">
                <div class="eval-fill" :style="{ width: item.score + '%', backgroundColor: getProgressColor(item.score) }"></div>
              </div>
              <div class="eval-desc">{{ item.desc }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="detailDialogVisible" title="班级详情" width="600px">
      <div v-if="selectedClass" class="class-detail">
        <div class="detail-header">
          <span class="class-title">{{ selectedClass.className }}</span>
          <span :class="['level-badge', selectedClass.level?.toLowerCase() || 'medium']">{{ selectedClass.level || '中等' }}</span>
        </div>
        <div class="detail-stats">
          <div class="detail-stat">
            <span class="detail-label">综合得分</span>
            <span class="detail-value">{{ selectedClass.score }}</span>
          </div>
          <div class="detail-stat">
            <span class="detail-label">达标率</span>
            <span class="detail-value">{{ selectedClass.passRate }}%</span>
          </div>
          <div class="detail-stat">
            <span class="detail-label">日均运动时长</span>
            <span class="detail-value">{{ selectedClass.avgTime }}</span>
          </div>
        </div>
        <div class="detail-section">
          <h4>学生成绩分布</h4>
          <div ref="detailChart" class="detail-chart"></div>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="testRecordsDialogVisible" title="班级测试记录" width="800px">
      <div v-if="currentClassRecords" class="test-records">
        <div class="records-header">
          <span class="records-title">{{ currentClassRecords.className }} - 测试记录</span>
          <span class="records-count">共 {{ testRecordsList.length }} 条记录</span>
        </div>
        <!-- 测试人数分析统计 -->
        <div class="test-analysis-bar">
          <div class="analysis-item">
            <span class="analysis-num">{{ testAnalysisStats.totalStudents }}</span>
            <span class="analysis-label">测试总人数</span>
          </div>
          <div class="analysis-divider"></div>
          <div class="analysis-item">
            <span class="analysis-num stat-good">{{ testAnalysisStats.testedStudents }}</span>
            <span class="analysis-label">已测人数</span>
          </div>
          <div class="analysis-divider"></div>
          <div class="analysis-item">
            <span class="analysis-num stat-danger">{{ testAnalysisStats.untestedStudents }}</span>
            <span class="analysis-label">未测人数</span>
          </div>
          <div class="analysis-divider"></div>
          <div class="analysis-item">
            <span class="analysis-num stat-good">{{ testAnalysisStats.completionRate }}%</span>
            <span class="analysis-label">完成率</span>
          </div>
        </div>
        <ExamTable
          :data="testRecordsList"
          :columns="testRecordsColumns"
          :searchable="true"
          :show-pagination="true"
          :default-page-size="8"
        >
          <template #gradeLevel="{ row }">
            <span :class="['level-tag', row.gradeLevel.toLowerCase()]">{{ row.gradeLevel }}</span>
          </template>
          <template #testMode="{ row }">
            <span :class="['mode-tag', getTestModeClass(row.testMode)]">{{ row.testMode }}</span>
          </template>
          <template #action="{ row }">
            <el-button type="text" @click.stop="viewStudentProfile(row)">查看档案</el-button>
          </template>
        </ExamTable>
      </div>
      <template #footer>
        <el-button @click="testRecordsDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="studentProfileDialogVisible" title="个人成绩档案" width="900px">
      <div v-if="selectedStudent" class="student-profile">
        <div class="profile-header">
          <div class="profile-info">
            <h3>{{ selectedStudent.name }}</h3>
            <p>{{ selectedStudent.className }} | {{ selectedStudent.studentId }}</p>
          </div>
        </div>
        
        
        <div class="profile-tabs">
          <el-tabs v-model="activeProfileTab" type="card">
            <el-tab-pane label="成绩记录" name="records">
              <div class="tab-content">
                <h4>历次测试成绩</h4>
                <div ref="studentRecordsChart" class="chart-medium"></div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="项目成绩排名" name="projectRank">
              <div class="tab-content">
                <h4>各项目最佳成绩、得分、等级及排名</h4>
                <ExamTable
                  :data="projectBestScores"
                  :columns="projectRankColumns"
                  :searchable="false"
                  :show-pagination="false"
                >
                  <template #gradeLevel="{ row }">
                    <span :class="['level-tag', row.gradeLevel]">{{ row.gradeLevel }}</span>
                  </template>
                  <template #rank="{ row }">
                    <span :class="['rank-badge', getRankClass(row.rank)]" style="width:24px;height:24px;font-size:11px;">{{ row.rank }}</span>
                  </template>
                </ExamTable>
              </div>
            </el-tab-pane>
            <el-tab-pane label="姿态指标分析" name="posture">
              <div class="tab-content">
                <h4>姿态评估指标</h4>
                <div class="posture-grid">
                  <div class="posture-item" v-for="item in postureData" :key="item.name">
                    <span class="posture-label">{{ item.name }}</span>
                    <span :class="['posture-value', getScoreClass(item.value)]">{{ item.value }}</span>
                  </div>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="肌群分析" name="muscle">
              <div class="tab-content">
                <h4>肌群力量评估</h4>
                <div class="muscle-grid">
                  <div class="muscle-item" v-for="item in muscleData" :key="item.name">
                    <div class="muscle-header">
                      <span class="muscle-label">{{ item.name }}</span>
                      <span :class="['muscle-score', getScoreClass(item.value)]">{{ item.value }}%</span>
                    </div>
                    <el-progress :percentage="item.value" :stroke-width="12" :color="getProgressColor(item.value)" :show-text="false" />
                    <div class="muscle-desc">{{ item.desc }}</div>
                  </div>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="点评及建议" name="feedback">
              <div class="tab-content">
                <h4>教练点评</h4>
                <div class="feedback-content">
                  <p>{{ selectedStudent.feedback }}</p>
                </div>
                <h4>训练建议</h4>
                <ul class="suggestions">
                  <li v-for="(suggestion, index) in trainingSuggestions" :key="index">{{ suggestion }}</li>
                </ul>
              </div>
            </el-tab-pane>
            <el-tab-pane label="动作关键帧" name="keyframes">
              <div class="tab-content">
                <h4>动作分析关键帧</h4>
                <div class="keyframes-grid">
                  <div class="keyframe-item" v-for="(frame, index) in keyframeData" :key="index">
                    <div class="keyframe-image" :style="{ background: frame.color }"></div>
                    <span class="keyframe-label">{{ frame.label }}</span>
                    <span class="keyframe-desc">{{ frame.desc }}</span>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
      <template #footer>
        <el-button @click="studentProfileDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch, onUnmounted } from 'vue'
import echarts from '@/utils/echarts'
import { Download } from '@element-plus/icons-vue'
import ExamTable from '@/components/table/ExamTable.vue'
import { ElMessage } from 'element-plus'
import { throttle } from '@/utils/performance'
import store from '../../../store/global'
import { usePersistedRef } from '../../../composables/usePersistedRef'
import { getSchoolProfile } from '@/mock/school-data/schoolProfiles'
import { getSchoolData } from '@/mock'
import { getSchoolMockData } from '@/utils/mockDataLoader'
import { isInterestClass, getMatchingClassNames } from '@/utils/interestClassFilter'
import { getValueColorClass } from '@/utils/format'
import { useOperationLog } from '@/composables/useOperationLog'
import { calculateClassRanking, calculateActivityData } from '@/utils/statistics'
import { createSeededRandom } from '@/utils/seededRandom'

const { addLog } = useOperationLog('data')

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')
const schoolProfile = computed(() => getSchoolProfile(schoolId.value))

const getStudents = () => {
  const key = `students_${schoolId.value}`
  const stored = sessionStorage.getItem(key)
  const validGrades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
  
  if (stored) {
    try {
      const data = JSON.parse(stored)
      if (Array.isArray(data) && data.length > 0) {
        // 检查数据中是否包含非小学年级（七年级及以上）
        const hasInvalidGrade = data.some(s => {
          const className = s.className || ''
          const grade = s.grade || ''
          const allGrades = className.match(/([一二三四五六七八九十]+年级)/g) || []
          return allGrades.some(g => !validGrades.includes(g)) || 
                 (grade && !validGrades.includes(grade))
        })
        if (!hasInvalidGrade) {
          return data
        }
      }
    } catch {}
  }
  // 回退到模拟数据
  const schoolData = getSchoolMockData(schoolId.value)
  return schoolData.students || []
}

const getTestResults = () => {
  const key = `smart_pe_imported_national_test_${schoolId.value}`
  const stored = sessionStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  const schoolData = getSchoolMockData(schoolId.value)
  return schoolData.nationalTestResults || []
}

const students = ref(getStudents())
const testResults = ref(getTestResults())

// 动态生成学年选项（基于当前日期）
const academicYearOptions = computed(() => {
  const now = new Date('2026-07-16T08:00:00')
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startYear = month >= 9 ? year : year - 1
  const options = []
  for (let i = 0; i < 4; i++) {
    const sy = startYear - i
    options.push({ label: `${sy}-${sy + 1}学年`, value: `${sy}-${sy + 1}` })
  }
  return options
})

const filterGrade = usePersistedRef(`smart_pe_student_data_filter_grade_${schoolId.value}`, 'all')
const filterClass = usePersistedRef(`smart_pe_student_data_filter_class_${schoolId.value}`, 'all')
const timeRange = usePersistedRef(`smart_pe_student_data_time_range_${schoolId.value}`, 'week')
const currentPage = ref(1)
const pageSize = ref(12)
const detailDialogVisible = ref(false)
const testRecordsDialogVisible = ref(false)
const studentProfileDialogVisible = ref(false)
const selectedClass = ref(null)
const currentClassRecords = ref(null)
const selectedStudent = ref(null)
const activeProfileTab = ref('records')

// 班级选项（根据年级动态生成，包含分项班/兴趣班）
const classOptions = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  const classCounts = isZirong
    ? [2, 2, 2, 2, 2, 2]
    : isLinhai
      ? [4, 4, 4, 3, 3, 4]
      : [6, 5, 5, 5, 5, 5]
  const gradeNames = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
  const grade = filterGrade.value
  let classes = []
  if (!grade || grade === 'all') {
    gradeNames.forEach((g, gi) => {
      const count = classCounts[gi]
      for (let i = 1; i <= count; i++) {
        classes.push(`${g}${i}班`)
      }
    })
  } else {
    const gradeIdx = gradeNames.indexOf(grade)
    if (gradeIdx !== -1) {
      const count = classCounts[gradeIdx]
      classes = Array.from({ length: count }, (_, i) => `${grade}${i + 1}班`)
    }
  }
  // 追加分项班/兴趣班选项
  const schoolData = getSchoolData(schoolId.value)
  const interestClasses = (schoolData?.classes || []).filter(c => c.type === '分项班').map(c => c.name)
  if (interestClasses.length > 0) {
    classes.push('--- 分项班/兴趣班 ---')
    classes.push(...interestClasses)
  }
  return classes
})

const onGradeChange = () => {
  filterClass.value = 'all'
}

// 档案筛选
const profileFilterGrade = ref('all')
const profileFilterClass = ref('')
const profileFilterYear = ref('all')

const profileClassOptions = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  // 各学校每班班级数不同：海林=6/5/5/5/5/5, 子荣=2/2/2/2/2/2, 林海=4/4/4/3/3/4
  const classCounts = isZirong
    ? [2, 2, 2, 2, 2, 2]
    : isLinhai
      ? [4, 4, 4, 3, 3, 4]
      : [6, 5, 5, 5, 5, 5]
  const gradeNames = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
  const grade = profileFilterGrade.value
  if (!grade || grade === 'all') {
    // 默认显示三年级
    const count = classCounts[2]
    return Array.from({ length: count }, (_, i) => `三年级${i + 1}班`)
  }
  const gradeIdx = gradeNames.indexOf(grade)
  if (gradeIdx === -1) return []
  const count = classCounts[gradeIdx]
  return Array.from({ length: count }, (_, i) => `${grade}${i + 1}班`)
})

const onProfileGradeChange = () => {
  profileFilterClass.value = ''
}

// 项目最佳成绩排名数据（按学校差异化）
const projectBestScores = computed(() => {
  const profile = schoolProfile.value
  const rankings = profile.studentData.classRanking || []
  const avgScore = rankings.length
    ? Math.round(rankings.reduce((s, r) => s + r.avgScore, 0) / rankings.length)
    : 82
  const scale = avgScore / 85
  const tests = profile.studentData.testRecordsList || []
  const names = tests.map(t => t.studentName)
  const nameIdx = names.length > 0 ? names[0].charCodeAt(0) % 3 : 0
  const offsets = [0, 2, -2]
  const o = offsets[nameIdx]
  return [
    { project: '50米跑', bestScore: '8.5秒', score: Math.min(100, Math.round(92 * scale) + o), gradeLevel: Math.round(92 * scale) + o >= 90 ? '优秀' : '良好', rank: Math.max(1, 3 + o) },
    { project: '立定跳远', bestScore: '1.92米', score: Math.min(100, Math.round(95 * scale) + o), gradeLevel: Math.round(95 * scale) + o >= 90 ? '优秀' : '良好', rank: Math.max(1, 2 + o) },
    { project: '坐位体前屈', bestScore: '18.5cm', score: Math.min(100, Math.round(78 * scale) + o), gradeLevel: Math.round(78 * scale) + o >= 80 ? '良好' : Math.round(78 * scale) + o >= 60 ? '及格' : '不及格', rank: Math.max(1, 15 + o) },
    { project: '仰卧起坐', bestScore: '45个', score: Math.min(100, Math.round(85 * scale) + o), gradeLevel: Math.round(85 * scale) + o >= 90 ? '优秀' : '良好', rank: Math.max(1, 8 + o) },
    { project: '引体向上', bestScore: '12个', score: Math.min(100, Math.round(78 * scale) + o), gradeLevel: Math.round(78 * scale) + o >= 90 ? '优秀' : Math.round(78 * scale) + o >= 60 ? '及格' : '不及格', rank: Math.max(1, 12 + o) },
    { project: '跳绳', bestScore: '158个/分', score: Math.min(100, Math.round(90 * scale) + o), gradeLevel: Math.round(90 * scale) + o >= 90 ? '优秀' : '良好', rank: Math.max(1, 5 + o) },
    { project: '800米跑', bestScore: '3分28秒', score: Math.min(100, Math.round(82 * scale) + o), gradeLevel: Math.round(82 * scale) + o >= 80 ? '良好' : '及格', rank: Math.max(1, 10 + o) },
    { project: '肺活量', bestScore: '2800ml', score: Math.min(100, Math.round(88 * scale) + o), gradeLevel: Math.round(88 * scale) + o >= 90 ? '优秀' : '良好', rank: Math.max(1, 6 + o) },
    { project: 'BMI', bestScore: '17.2', score: Math.min(100, Math.round(95 * scale) + o), gradeLevel: Math.round(95 * scale) + o >= 90 ? '优秀' : '良好', rank: Math.max(1, 1 + o) }
  ]
})

const projectRankColumns = ref([
  { prop: 'project', label: '测试项目', minWidth: '120' },
  { prop: 'bestScore', label: '最佳成绩', minWidth: '120' },
  { prop: 'score', label: '得分', minWidth: '80' },
  { slot: 'gradeLevel', label: '等级', minWidth: '80' },
  { slot: 'rank', label: '排名', minWidth: '80' }
])

const filteredRanking = ref([])
const filteredActivity = ref([])

const hourChart = ref(null)
const participationChart = ref(null)
const distributionChart = ref(null)
const gradeChart = ref(null)
const detailChart = ref(null)
const durationChart = ref(null)
const gradePassTrend = ref(null)
const projectPassChart = ref(null)
const studentRecordsChart = ref(null)
const academicHeatmap = ref(null)
const comprehensiveRadar = ref(null)

let hourChartInstance = null
let participationChartInstance = null
let distributionChartInstance = null
let gradeChartInstance = null
let detailChartInstance = null
let durationChartInstance = null
let gradePassTrendInstance = null
let projectPassChartInstance = null
let studentRecordsChartInstance = null
let academicHeatmapInstance = null
let comprehensiveRadarInstance = null

const timeRangeFactor = computed(() => {
  const factors = {
    '7days': 1.0,
    '30days': 0.95,
    'week': 1.05,
    'month': 0.92,
    'term': 0.88
  }
  return factors[timeRange.value] || 1.0
})

const classStats = computed(() => {
  const data = filteredClassHourDetail.value.length > 0 ? filteredClassHourDetail.value : classHourDetail.value
  const totalClasses = data.length
  const factor = timeRangeFactor.value
  
  if (totalClasses === 0) {
    return {
      totalClasses: 0,
      activeClasses: 0,
      avgScore: 0,
      topClass: '-',
      avgDuration: '-',
      sportsRate: 0,
      passRate: 0
    }
  }
  
  const activeClasses = Math.round(data.filter(item => item.sportsRate >= 70).length * factor)
  const avgScore = Math.round(data.reduce((sum, item) => sum + item.passRate, 0) / totalClasses * factor)
  
  const sortedByScore = [...data].sort((a, b) => b.sportsRate - a.sportsRate)
  const topClass = sortedByScore[0]?.className || '-'
  
  const avgDuration = Math.round(data.reduce((sum, item) => sum + item.sportsRate * 0.5, 0) / totalClasses * factor)
  
  const sportsRate = Math.round(data.reduce((sum, item) => sum + item.sportsRate, 0) / totalClasses * 10 * factor) / 10
  const passRate = Math.round(data.reduce((sum, item) => sum + item.passRate, 0) / totalClasses * 10 * factor) / 10
  
  return {
    totalClasses,
    activeClasses: Math.max(0, Math.min(totalClasses, activeClasses)),
    avgScore: Math.max(0, Math.min(100, avgScore)),
    topClass,
    avgDuration: `${Math.max(0, avgDuration)}分钟`,
    sportsRate: Math.max(0, Math.min(100, sportsRate)),
    passRate: Math.max(0, Math.min(100, passRate))
  }
})

const classRanking = computed(() => {
  const dynamicRanking = calculateClassRanking(students.value, testResults.value, schoolProfile.value)
  if (dynamicRanking.length > 0) {
    return dynamicRanking.map(item => ({
      rank: item.rank,
      className: item.className,
      score: item.score,
      avgTime: item.avgTime,
      passRate: item.passRate,
      level: item.passRate >= 90 ? '高活跃' : item.passRate >= 80 ? '中活跃' : '低活跃'
    }))
  }
  return schoolProfile.value.studentData.classRanking.map(item => ({
    rank: item.rank,
    className: item.className,
    score: item.avgScore,
    avgTime: item.bestTime,
    passRate: item.passRate,
    level: item.passRate >= 90 ? '高活跃' : item.passRate >= 80 ? '中活跃' : '低活跃'
  }))
})

const rankingColumns = ref([
  { slot: 'rank', label: '排名', minWidth: '60' },
  { prop: 'className', label: '班级', minWidth: '120' },
  { slot: 'score', label: '综合得分', minWidth: '100' },
  { prop: 'avgTime', label: '日均运动时长', minWidth: '120' },
  { slot: 'passRate', label: '达标率', minWidth: '160' },
  { slot: 'action', label: '操作', minWidth: '100' },
])

const activityData = computed(() => {
  const dynamicActivity = calculateActivityData(students.value, schoolProfile.value)
  if (dynamicActivity.length > 0) {
    return dynamicActivity.map(item => ({
      className: item.className,
      rate: item.rate,
      level: item.level,
      score: Math.round(item.rate * 0.98),
      passRate: Math.round(item.rate * 0.95),
      avgTime: Math.round(item.rate * 0.5) + '分钟'
    }))
  }
  return schoolProfile.value.studentData.activityData.map(item => ({
    className: item.className,
    rate: item.participationRate,
    level: item.participationRate >= 90 ? 'high' : item.participationRate >= 80 ? 'medium' : 'low',
    score: Math.round(item.participationRate * 0.98),
    passRate: Math.round(item.participationRate * 0.95),
    avgTime: Math.round(item.activityMinutes / 5) + '分钟'
  }))
})

const classHourDetailDefault = computed(() => {
  if (students.value.length > 0) {
    const classMap = {}
    students.value.forEach(s => {
      // 优先使用已有的 className 字段，确保格式为 "几年级几班"
      let className = ''
      if (s.className) {
        className = s.className
      } else if (s.grade || s.class) {
        const grade = s.grade || ''
        const cls = s.class || ''
        const clsStr = cls.endsWith('班') ? cls : (cls ? cls + '班' : '')
        className = `${grade}${clsStr}`
      }
      
      if (!className) return
      
      if (!classMap[className]) {
        classMap[className] = {
          className,
          totalStudents: 0,
          sportsStudents: 0,
          passStudents: 0
        }
      }
      classMap[className].totalStudents++
    })
    
    const gradeNames = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
    const schoolBaseRate = schoolId.value === 'hailin-zirong-primary' ? -3 
      : schoolId.value === 'linhai-experimental-primary' ? 5 : 0
    
    return Object.values(classMap)
      .sort((a, b) => {
        const gradeA = gradeNames.indexOf(a.className.replace(/\d+班$/, ''))
        const gradeB = gradeNames.indexOf(b.className.replace(/\d+班$/, ''))
        if (gradeA !== gradeB) return gradeA - gradeB
        const matchA = a.className.match(/(\d+)班$/)
        const matchB = b.className.match(/(\d+)班$/)
        const classNumA = matchA ? parseInt(matchA[1]) : 0
        const classNumB = matchB ? parseInt(matchB[1]) : 0
        return classNumA - classNumB
      })
      .map((cls, idx) => {
        const seed = idx % 20
        const sportsRate = Math.min(100, Math.round(68 + seed * 1.8 + schoolBaseRate))
        const passRate = Math.min(100, Math.round(60 + seed * 2.0 + schoolBaseRate))
        return {
          className: cls.className,
          totalStudents: cls.totalStudents,
          sportsStudents: Math.round(cls.totalStudents * sportsRate / 100),
          passStudents: Math.round(cls.totalStudents * passRate / 100),
          sportsRate,
          passRate
        }
      })
  }
  
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  const gradeNames = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
  const classCounts = isZirong
    ? [2, 2, 2, 2, 2, 2]
    : isLinhai
      ? [4, 4, 4, 3, 3, 4]
      : [6, 5, 5, 5, 5, 5]
  const baseStudents = isZirong ? 38 : isLinhai ? 42 : 44
  const result = []
  gradeNames.forEach((grade, gi) => {
    const count = classCounts[gi]
    for (let ci = 0; ci < count; ci++) {
      const className = `${grade}${ci + 1}班`
      const seed = (gi * 7 + ci * 13) % 20
      const totalStudents = baseStudents - 4 + seed
      const sportsRate = Math.min(100, Math.round(68 + seed * 1.8 + (isZirong ? -3 : isLinhai ? 5 : 0)))
      const passRate = Math.min(100, Math.round(60 + seed * 2.0 + (isZirong ? -2 : isLinhai ? 6 : 0)))
      const sportsStudents = Math.round(totalStudents * sportsRate / 100)
      const passStudents = Math.round(totalStudents * passRate / 100)
      result.push({ className, totalStudents, sportsStudents, passStudents, sportsRate, passRate })
    }
  })
  return result
})

// 增加版本号v2强制刷新旧的持久化数据，确保班级名称格式正确
const classHourDetail = usePersistedRef(`smart_pe_student_data_class_hour_detail_v2_${schoolId.value}`, [...classHourDetailDefault.value])

const filteredClassHourDetail = computed(() => {
  if (filterGrade.value === 'all') {
    return classHourDetail.value
  }
  const gradeMap = {
    'g1': '一年级',
    'g2': '二年级',
    'g3': '三年级',
    'g4': '四年级',
    'g5': '五年级',
    'g6': '六年级'
  }
  const gradeName = gradeMap[filterGrade.value]
  return classHourDetail.value.filter(item => item.className.includes(gradeName))
})

const hourDetailColumns = ref([
  { prop: 'className', label: '班级', minWidth: '120' },
  { prop: 'totalStudents', label: '总人数', minWidth: '80' },
  { prop: 'sportsStudents', label: '运动人数', minWidth: '80' },
  { prop: 'passStudents', label: '达标人数', minWidth: '80' },
  { slot: 'sportsRate', label: '运动人数占比', minWidth: '100' },
  { slot: 'passRate', label: '达标人数占比', minWidth: '100' },
  { slot: 'action', label: '操作', minWidth: '100' }
])

const testRecordsList = computed(() => {
  const records = schoolProfile.value.studentData.testRecordsList || []
  let filtered = records
  if (currentClassRecords.value) {
    filtered = records.filter(item => item.className === currentClassRecords.value.className)
  }
  return filtered.map(item => ({
    className: item.className,
    name: item.studentName,
    studentId: item.id,
    score: item.score,
    gradeLevel: item.score >= 90 ? '优秀' : item.score >= 80 ? '良好' : item.score >= 60 ? '及格' : '不及格',
    testDate: item.date,
    project: item.event,
    testMode: '国家体测'
  }))
})

const testRecordsColumns = ref([
  { prop: 'className', label: '班级', minWidth: '120' },
  { prop: 'name', label: '姓名', minWidth: '80' },
  { prop: 'studentId', label: '学号', minWidth: '120' },
  { prop: 'project', label: '项目', minWidth: '100' },
  { prop: 'score', label: '成绩', minWidth: '80' },
  { slot: 'gradeLevel', label: '评分等级', minWidth: '100' },
  { slot: 'testMode', label: '测试模式', minWidth: '100' },
  { prop: 'testDate', label: '测试日期', minWidth: '120' },
  { slot: 'action', label: '操作', minWidth: '100' }
])

// 测试人数分析统计
const testAnalysisStats = computed(() => {
  const detail = classHourDetail.value
  const totalStudents = detail.length > 0
    ? Math.round(detail.reduce((sum, d) => sum + d.totalStudents, 0) / detail.length)
    : 44
  const testedStudents = new Set(testRecordsList.value.map(r => r.studentId)).size
  const untestedStudents = Math.max(0, totalStudents - testedStudents)
  const completionRate = totalStudents > 0 ? ((testedStudents / totalStudents) * 100).toFixed(1) : '0.0'
  return { totalStudents, testedStudents, untestedStudents, completionRate }
})

const postureData = computed(() => {
  const profile = schoolProfile.value
  const rankings = profile.studentData.classRanking || []
  const avgPass = rankings.length
    ? Math.round(rankings.reduce((s, r) => s + r.passRate, 0) / rankings.length)
    : 85
  const scale = avgPass / 88
  return [
    { name: '身体质量指数', value: Math.round(18.5 * scale * 10) / 10 },
    { name: '体脂率', value: Math.round(18 * scale) },
    { name: '身高', value: Math.round(145 * scale) },
    { name: '体重', value: Math.round(38 * scale) },
    { name: '肺活量', value: Math.round(2800 * scale) },
    { name: '柔韧性', value: Math.min(100, Math.round(85 * scale)) },
    { name: '平衡能力', value: Math.min(100, Math.round(90 * scale)) },
    { name: '协调能力', value: Math.min(100, Math.round(88 * scale)) }
  ]
})

const muscleData = computed(() => {
  const profile = schoolProfile.value
  const activities = profile.studentData.activityData || []
  const avgParticipation = activities.length
    ? Math.round(activities.reduce((s, a) => s + a.participationRate, 0) / activities.length)
    : 85
  const scale = avgParticipation / 88
  const descSets = [
    ['腿部力量良好，建议加强爆发力训练', '腹部和腰部力量优秀，保持稳定', '手臂力量有待提高，建议加强俯卧撑训练', '关节灵活性优秀，继续保持拉伸训练'],
    ['腿部力量优秀，爆发力突出', '核心力量良好，建议增加耐力训练', '上肢力量中等，需持续训练', '柔韧性达标，建议增加动态拉伸'],
    ['下肢力量均衡，建议加强弹跳训练', '核心稳定性良好，继续保持', '上肢力量需加强，建议增加引体向上', '柔韧性较好，注意保持训练频率']
  ]
  const idx = avgParticipation % 3
  const descs = descSets[idx]
  return [
    { name: '下肢肌群', value: Math.min(100, Math.round(78 * scale)), desc: descs[0] },
    { name: '核心肌群', value: Math.min(100, Math.round(85 * scale)), desc: descs[1] },
    { name: '上肢肌群', value: Math.min(100, Math.round(72 * scale)), desc: descs[2] },
    { name: '柔韧性', value: Math.min(100, Math.round(88 * scale)), desc: descs[3] }
  ]
})

const keyframeData = computed(() => {
  const profile = schoolProfile.value
  const rankings = profile.studentData.classRanking || []
  const topScore = rankings.length ? (Number(rankings[0].avgScore) || 85) : 85
  const descSets = [
    ['预备动作标准', '爆发力良好', '身体伸展充分', '缓冲稍显不足'],
    ['预备动作稳定', '起跳角度理想', '空中姿态优美', '落地平稳有力'],
    ['预备姿势规范', '发力顺序正确', '腾空高度充足', '着地缓冲到位']
  ]
  const idx = Math.floor(topScore) % 3
  const descs = descSets[idx] || descSets[0]
  return [
    { label: '起始姿势', color: '#DCFCE7', desc: descs[0] },
    { label: '发力阶段', color: '#DBEAFE', desc: descs[1] },
    { label: '空中姿态', color: '#FEF3C7', desc: descs[2] },
    { label: '落地缓冲', color: '#FEE2E2', desc: descs[3] }
  ]
})

const trainingSuggestions = computed(() => {
  const profile = schoolProfile.value
  const activities = profile.studentData.activityData || []
  const avgParticipation = activities.length
    ? Math.round(activities.reduce((s, a) => s + a.participationRate, 0) / activities.length)
    : 85
  const suggestionSets = [
    [
      '每周坚持3-4次有氧运动，每次30分钟以上',
      '加强下肢力量训练，建议增加深蹲、弓步等动作',
      '注意落地姿势，避免膝盖内扣',
      '增加核心稳定性训练，可进行平板支撑练习',
      '建议每天进行10分钟柔韧性练习'
    ],
    [
      '每天坚持跳绳500个，提升心肺功能',
      '加强上肢力量，建议进行俯卧撑和引体向上训练',
      '注重运动前的热身和运动后的拉伸',
      '增加敏捷性训练，如折返跑和绳梯练习',
      '保持良好的作息和饮食习惯，促进身体发育'
    ],
    [
      '每周进行2-3次耐力跑训练，逐步提升距离',
      '加强核心肌群训练，推荐仰卧起坐和平板支撑',
      '注意运动姿势的规范性，避免运动损伤',
      '增加协调性训练，如单脚站立和平衡木练习',
      '定期进行体质测试，跟踪训练效果'
    ]
  ]
  return suggestionSets[avgParticipation % 3]
})

const evaluationData = computed(() => {
  const data = filteredActivity.value.length > 0 ? filteredActivity.value : activityData.value
  const rankings = filteredRanking.value.length > 0 ? filteredRanking.value : classRanking.value
  const avgScore = rankings.length
    ? Math.round(rankings.reduce((s, r) => s + (r.score || r.avgScore || 0), 0) / rankings.length)
    : 82
  const avgParticipation = data.length
    ? Math.round(data.reduce((s, a) => s + (a.participationRate || a.rate || 0), 0) / data.length)
    : 85
  const scale = (avgScore + avgParticipation) / 170
  const descSets = [
    ['各项体能指标综合评价优秀，爆发力和耐力均衡发展', '基本运动技能掌握良好，部分技巧需加强练习', '课堂表现积极，主动参与各项体育活动', '能够与同学良好配合，团队意识强', '遵守规则，尊重他人，体育精神良好'],
    ['体能指标良好，速度和力量表现突出', '运动技能扎实，建议增加实战应用', '学习态度认真，课堂纪律优秀', '团队协作意识强，善于帮助同学', '体育品德优良，以身作则'],
    ['体能均衡发展，耐力方面需加强', '基本技能达标，柔韧性训练需增加', '学习态度端正，参与度有待提升', '团队配合良好，沟通能力需加强', '遵守体育道德，表现稳定']
  ]
  const idx = Math.round(avgScore) % 3
  const descs = descSets[idx]
  return [
    { name: '身体素质', score: Math.min(100, Math.round(88 * scale)), desc: descs[0] },
    { name: '运动技能', score: Math.min(100, Math.round(82 * scale)), desc: descs[1] },
    { name: '学习态度', score: Math.min(100, Math.round(95 * scale)), desc: descs[2] },
    { name: '团队协作', score: Math.min(100, Math.round(90 * scale)), desc: descs[3] },
    { name: '体育品德', score: Math.min(100, Math.round(92 * scale)), desc: descs[4] }
  ]
})

const paginatedRanking = computed(() => {
  const data = ((filteredRanking.value || []).length > 0 ? filteredRanking.value : classRanking.value) || []
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return data.slice(start, end)
})

const filterData = () => {
  let data = [...classRanking.value]
  let activity = [...activityData.value]
  
  if (filterGrade.value && filterGrade.value !== 'all') {
    data = data.filter(item => item.className.includes(filterGrade.value))
    activity = activity.filter(item => item.className.includes(filterGrade.value))
  }
  
  if (filterClass.value && filterClass.value !== 'all') {
    if (isInterestClass(filterClass.value)) {
      // 分项班：找到匹配学生所属的行政班，按行政班名称过滤
      const allStudents = students.value.length > 0 ? students.value : (getSchoolData(schoolId.value)?.students || [])
      const matchingClassNames = getMatchingClassNames(filterClass.value, allStudents)
      data = data.filter(item => matchingClassNames.has(item.className))
      activity = activity.filter(item => matchingClassNames.has(item.className))
    } else {
      data = data.filter(item => item.className === filterClass.value)
      activity = activity.filter(item => item.className === filterClass.value)
    }
  }
  
  filteredRanking.value = data
  filteredActivity.value = activity
}

const refreshData = () => {
  hourChartInstance?.showLoading()
  participationChartInstance?.showLoading()
  distributionChartInstance?.showLoading()
  gradeChartInstance?.showLoading()
  detailChartInstance?.showLoading()
  durationChartInstance?.showLoading()
  gradePassTrendInstance?.showLoading()
  projectPassChartInstance?.showLoading()
  studentRecordsChartInstance?.showLoading()
  academicHeatmapInstance?.showLoading()
  comprehensiveRadarInstance?.showLoading()
  currentPage.value = 1
  filterGrade.value = 'all'
  timeRange.value = 'week'
  filterData()
  nextTick(() => {
    initCharts()
  })
}

const exportAllData = () => {
  addLog('导出数据', '全部数据', '导出学生数据')
  const headers = ['班级', '总人数', '运动人数', '达标人数', '运动人数占比', '达标人数占比']
  const rows = classHourDetail.value.map(item => [
    item.className,
    item.totalStudents,
    item.sportsStudents,
    item.passStudents,
    item.sportsRate + '%',
    item.passRate + '%'
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `班级运动数据_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('数据已导出')
}

const exportClassDetail = () => {
  addLog('导出班级', '', '导出班级详细数据')
  const headers = ['班级', '总人数', '运动人数', '达标人数', '运动人数占比', '达标人数占比']
  const data = filteredClassHourDetail.value.length > 0 ? filteredClassHourDetail.value : classHourDetail.value
  const rows = data.map(item => [
    item.className,
    item.totalStudents,
    item.sportsStudents,
    item.passStudents,
    item.sportsRate + '%',
    item.passRate + '%'
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `班级运动一小时明细_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('班级明细数据已导出')
}

const viewClassTestRecords = (cls) => {
  currentClassRecords.value = cls
  testRecordsDialogVisible.value = true
}

const testProfileDialog = () => {
  selectedStudent.value = {
    name: '测试学生',
    className: '一年级1班',
    studentId: '2025101',
    feedback: '测试反馈内容',
    records: [65, 72, 78, 85, 88, 92, 95, 96],
    recordDates: ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08']
  }
  activeProfileTab.value = 'records'
  studentProfileDialogVisible.value = true

  setTimeout(() => {
    initStudentRecordsChart()
  }, 300)
}

const viewStudentProfile = (student) => {
 
  selectedStudent.value = {
    ...student,
    feedback: '该生运动天赋良好，爆发力强，协调性优秀。建议加强耐力训练，提高心肺功能。整体表现优秀，继续保持！',
    records: [65, 72, 78, 85, 88, 92, 95, 96],
    recordDates: ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08']
  }
  activeProfileTab.value = 'records'
  studentProfileDialogVisible.value = true
 
  setTimeout(() => {
    initStudentRecordsChart()
  }, 300)
}

const exportRanking = () => {
  addLog('导出排名', '', '导出排名数据')
  const headers = ['排名', '班级', '综合得分', '日均运动时长', '达标率', '活跃度等级']
  const data = filteredRanking.value.length > 0 ? filteredRanking.value : classRanking.value
  const rows = data.map((item, index) => [
    index + 1,
    item.className,
    item.score,
    item.avgTime,
    item.passRate + '%',
    item.level
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `班级排行榜_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('班级排名数据已导出')
}

const viewClassDetail = (cls) => {
  selectedClass.value = cls
  detailDialogVisible.value = true
  nextTick(() => {
    initDetailChart()
  })
}

const getRankClass = (rank) => {
  if (rank === 1) return 'rank-gold'
  if (rank === 2) return 'rank-silver'
  if (rank === 3) return 'rank-bronze'
  return ''
}

const getScoreClass = (score) => {
  if (score >= 90) return 'score-excellent'
  if (score >= 80) return 'score-good'
  if (score >= 60) return 'score-pass'
  return 'score-fail'
}

const getProgressColor = (rate) => {
  if (rate >= 90) return '#1E5AA8'
  if (rate >= 80) return '#3B82F6'
  if (rate >= 60) return '#F5A623'
  return '#E85D4E'
}

const getTestModeClass = (mode) => {
  const map = { '国家体测': 'mode-national', '课堂测试': 'mode-class', '自助测试': 'mode-self', '补测': 'mode-retest' }
  return map[mode] || ''
}

const initHourChart = () => {
  if (!hourChart.value) return
  try {
    if (hourChartInstance) hourChartInstance.dispose()
    hourChartInstance = echarts.init(hourChart.value)
    hourChartInstance.showLoading()
    
    const data = filteredActivity.value.length > 0 ? filteredActivity.value : activityData.value
    const factor = timeRangeFactor.value
    
    const totalClasses = data.length
    const passClasses = data.filter(item => item.passRate >= 80).length
    const failClasses = totalClasses - passClasses
    
    const basePass = Math.max(10, Math.round(passClasses * 2 * factor))
    const baseFail = Math.max(5, Math.round(failClasses * 1.5 * (2 - factor)))
    
    let xData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    let passData = [basePass - 2, basePass, basePass + 2, basePass - 1, basePass + 1, basePass - 5, basePass - 7]
    let failData = [baseFail + 2, baseFail, baseFail - 2, baseFail + 1, baseFail - 1, baseFail + 5, baseFail + 7]
    
    if (timeRange.value === 'month' || timeRange.value === '30days') {
      xData = Array.from({ length: 4 }, (_, i) => `第${i + 1}周`)
      passData = [basePass - 3, basePass + 1, basePass + 3, basePass]
      failData = [baseFail + 3, baseFail - 1, baseFail - 3, baseFail]
    } else if (timeRange.value === 'term') {
      xData = ['9月', '10月', '11月', '12月', '1月', '2月']
      passData = [basePass - 5, basePass - 2, basePass + 1, basePass + 3, basePass + 2, basePass - 1]
      failData = [baseFail + 5, baseFail + 2, baseFail - 1, baseFail - 3, baseFail - 2, baseFail + 1]
    }
    
    const option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['达标班级', '未达标班级'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: xData },
      yAxis: { type: 'value' },
      series: [
        {
          name: '达标班级',
          type: 'bar',
          data: passData,
          itemStyle: { borderRadius: [4, 4, 0, 0], color: '#1E5AA8' }
        },
        {
          name: '未达标班级',
          type: 'bar',
          data: failData,
          itemStyle: { borderRadius: [4, 4, 0, 0], color: '#E8EAED' }
        }
      ]
    }
    
    hourChartInstance.setOption(option)
    hourChartInstance.hideLoading()
  } catch (e) {
    console.error('initHourChart error:', e)
    if (hourChartInstance) {
      hourChartInstance.hideLoading()
    }
  }
}

const initParticipationChart = () => {
  if (!participationChart.value) return
  try {
    if (participationChartInstance) participationChartInstance.dispose()
    participationChartInstance = echarts.init(participationChart.value)
    participationChartInstance.showLoading()
    
    const data = filteredActivity.value.length > 0 ? filteredActivity.value : activityData.value
    const factor = timeRangeFactor.value
    
    const avgRate = data.length > 0 
      ? Math.round(data.reduce((sum, item) => sum + item.rate, 0) / data.length * factor) 
      : 85
    
    let xData = ['周一', '周二', '周三', '周四', '周五']
    let baseRates = [avgRate - 5, avgRate - 2, avgRate, avgRate - 4, avgRate + 2]
    
    if (timeRange.value === 'month' || timeRange.value === '30days') {
      xData = Array.from({ length: 4 }, (_, i) => `第${i + 1}周`)
      baseRates = [avgRate - 8, avgRate - 3, avgRate + 2, avgRate]
    } else if (timeRange.value === 'term') {
      xData = ['9月', '10月', '11月', '12月', '1月', '2月']
      baseRates = [avgRate - 10, avgRate - 5, avgRate - 2, avgRate + 1, avgRate + 3, avgRate]
    }
    
    const option = {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: xData },
      yAxis: { type: 'value', min: 0, max: 100 },
      series: [{
        name: '参与率',
        type: 'line',
        data: baseRates,
        smooth: true,
        lineStyle: { color: '#1E5AA8', width: 2 },
        itemStyle: { color: '#1E5AA8' }
      }]
    }
    
    participationChartInstance.setOption(option)
    participationChartInstance.hideLoading()
  } catch (e) {
    console.error('initParticipationChart error:', e)
    if (participationChartInstance) {
      participationChartInstance.hideLoading()
    }
  }
}

const initDistributionChart = () => {
  if (!distributionChart.value) return
  try {
    if (distributionChartInstance) distributionChartInstance.dispose()
    distributionChartInstance = echarts.init(distributionChart.value)
    distributionChartInstance.showLoading()
    
    const data = filteredActivity.value.length > 0 ? filteredActivity.value : activityData.value
    const factor = timeRangeFactor.value
    
    let excellent = data.filter(item => item.score >= 85).length
    let good = data.filter(item => item.score >= 70 && item.score < 85).length
    let pass = data.filter(item => item.score >= 60 && item.score < 70).length
    let fail = data.filter(item => item.score < 60).length
    
    if (factor < 1.0) {
      const diff = Math.round((1 - factor) * 10)
      excellent = Math.max(0, excellent - diff)
      good = Math.min(data.length, good + diff)
      pass = Math.max(0, pass - Math.floor(diff / 2))
      fail = Math.max(0, fail + Math.floor(diff / 2))
    }
    
    const option = {
      tooltip: { trigger: 'item', formatter: '{b}: {c}个班级 ({d}%)' },
      series: [{
        type: 'pie',
        radius: '60%',
        center: ['50%', '50%'],
        data: [
          { value: excellent || 18, name: '优秀(≥85分)', itemStyle: { color: '#1E5AA8' } },
          { value: good || 22, name: '良好(70-84分)', itemStyle: { color: '#3B82F6' } },
          { value: pass || 6, name: '及格(60-69分)', itemStyle: { color: '#F5A623' } },
          { value: fail || 2, name: '待提升(<60分)', itemStyle: { color: '#E8EAED' } }
        ],
        label: { fontSize: 11 }
      }]
    }
    
    distributionChartInstance.setOption(option)
    distributionChartInstance.hideLoading()
  } catch (e) {
    console.error('initDistributionChart error:', e)
    if (distributionChartInstance) {
      distributionChartInstance.hideLoading()
    }
  }
}

const initGradeChart = () => {
  if (!gradeChart.value) return
  try {
    if (gradeChartInstance) gradeChartInstance.dispose()
    gradeChartInstance = echarts.init(gradeChart.value)
    gradeChartInstance.showLoading()
    
    const data = filteredActivity.value.length > 0 ? filteredActivity.value : activityData.value
    
    const gradeMap = { '一年级': [], '二年级': [], '三年级': [], '四年级': [], '五年级': [], '六年级': [] }
    data.forEach(item => {
      const grade = item.className.substring(0, 3)
      if (gradeMap[grade]) {
        gradeMap[grade].push(item)
      }
    })
    
    const gradeLabels = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
    const gradeData = gradeLabels.map(grade => {
      const items = gradeMap[grade]
      if (items && items.length > 0) {
        return Math.round(items.reduce((sum, item) => sum + item.passRate, 0) / items.length)
      }
      return 0
    })
    
    const option = {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: gradeLabels.filter((_, i) => gradeData[i] > 0) },
      yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
      series: [{
        type: 'bar',
        data: gradeData.filter(v => v > 0),
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        color: '#3B82F6'
      }]
    }
    
    gradeChartInstance.setOption(option)
    gradeChartInstance.hideLoading()
  } catch (e) {
    console.error('initGradeChart error:', e)
    if (gradeChartInstance) {
      gradeChartInstance.hideLoading()
    }
  }
}

const initDetailChart = () => {
  if (!detailChart.value) return
  if (detailChartInstance) detailChartInstance.dispose()
  detailChartInstance = echarts.init(detailChart.value)
  detailChartInstance.showLoading()
  
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  // 各学校运动项目差异化
  const projects = isZirong
    ? ['排球垫球', '足球运球', '跳绳', '50米跑', '仰卧起坐', '800米跑', '肺活量', 'BMI', '引体向上']
    : isLinhai
      ? ['游泳50米', '体操', '武术套路', '跳绳', '立定跳远', '50米跑', '仰卧起坐', '坐位体前屈', '引体向上']
      : ['立定跳远', '跳绳', '50米跑', '仰卧起坐', '坐位体前屈', '1000米跑', '50*8往返跑', '引体向上']
  const baseData = isZirong
    ? [85, 88, 90, 92, 86, 80, 84, 91, 72]
    : isLinhai
      ? [90, 87, 85, 93, 89, 91, 83, 86, 80]
      : [88, 92, 85, 90, 86, 82, 78, 84]
  
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: projects,
      axisLabel: { fontSize: 11 }
    },
    yAxis: { type: 'value', min: 0, max: 100 },
    series: [{
      type: 'bar',
      barWidth: '45%',
      data: baseData,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#1E5AA8' },
        { offset: 1, color: '#86EFAC' }
      ])
    }]
  }
  
  detailChartInstance.setOption(option)
  detailChartInstance.hideLoading()
}

const initDurationChart = () => {
  const random = createSeededRandom(schoolId.value + '_duration')
  if (!durationChart.value) return
  if (durationChartInstance) durationChartInstance.dispose()
  durationChartInstance = echarts.init(durationChart.value)
  durationChartInstance.showLoading()
  
  const data = filteredActivity.value.length > 0 ? filteredActivity.value : activityData.value
  
  const avgScore = data.length > 0 
    ? Math.round(data.reduce((sum, item) => sum + item.score, 0) / data.length) 
    : 85
  
  const baseDuration = Math.max(30, Math.round(avgScore * 0.5))
  
  const weekData = [baseDuration - 3, baseDuration, baseDuration + 3, baseDuration - 1, baseDuration + 5, baseDuration - 5, baseDuration - 8]
  const monthData = Array.from({ length: 30 }, (_, i) => baseDuration + Math.floor(random() * 15) - 7)
  const termData = Array.from({ length: 36 }, (_, i) => baseDuration + Math.floor(random() * 12) - 6)
  
  let xData = []
  let seriesData = []
  
  if (timeRange.value === 'week') {
    xData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    seriesData = weekData
  } else if (timeRange.value === 'month') {
    xData = Array.from({ length: 30 }, (_, i) => `${i + 1}日`)
    seriesData = monthData
  } else {
    xData = Array.from({ length: 36 }, (_, i) => `第${i + 1}周`)
    seriesData = termData
  }
  
  const option = {
    tooltip: { trigger: 'axis', formatter: '{b}: {c}分钟' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: xData, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', min: 0, max: 60, axisLabel: { formatter: '{value}分钟' } },
    series: [{
      name: '人均运动时长',
      type: 'line',
      data: seriesData,
      smooth: true,
      lineStyle: { color: '#1E5AA8', width: 3 },
      itemStyle: { color: '#1E5AA8' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(30, 90, 168, 0.3)' },
          { offset: 1, color: 'rgba(30, 90, 168, 0.05)' }
        ])
      },
      markLine: {
        silent: true,
        data: [{ yAxis: 60, label: { formatter: '达标线', position: 'end' }, lineStyle: { color: '#E85D4E', type: 'dashed' } }]
      }
    }]
  }
  
  durationChartInstance.setOption(option)
  durationChartInstance.hideLoading()
}

const initGradePassTrend = () => {
  if (!gradePassTrend.value) return
  if (gradePassTrendInstance) gradePassTrendInstance.dispose()
  gradePassTrendInstance = echarts.init(gradePassTrend.value)
  gradePassTrendInstance.showLoading()
  
  // 从 classHourDetail 按年级聚合计算达标率和优良率
  const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
  const data = filteredActivity.value.length > 0 ? filteredActivity.value : activityData.value
  const source = classHourDetail.value && classHourDetail.value.length > 0 ? classHourDetail.value : classHourDetailDefault.value
  
  const passRates = grades.map(g => {
    const classes = source.filter(c => c.className.includes(g))
    return classes.length ? Math.round(classes.reduce((s, c) => s + c.passRate, 0) / classes.length) : 0
  })
  const excellentRates = grades.map(g => {
    const classes = data.filter(c => c.className.includes(g))
    return classes.length ? Math.round(classes.reduce((s, c) => s + c.passRate, 0) / classes.length) : 0
  })
  
  const option = {
    tooltip: { trigger: 'axis' },
    legend: { data: ['达标率', '优良率'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: grades },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      {
        name: '达标率',
        type: 'line',
        data: passRates,
        smooth: true,
        lineStyle: { color: '#1E5AA8', width: 2 },
        itemStyle: { color: '#1E5AA8' }
      },
      {
        name: '优良率',
        type: 'line',
        data: excellentRates,
        smooth: true,
        lineStyle: { color: '#F5A623', width: 2 },
        itemStyle: { color: '#F5A623' }
      }
    ]
  }
  
  gradePassTrendInstance.setOption(option)
  gradePassTrendInstance.hideLoading()
}

const initProjectPassChart = () => {
  if (!projectPassChart.value) return
  if (projectPassChartInstance) projectPassChartInstance.dispose()
  projectPassChartInstance = echarts.init(projectPassChart.value)
  projectPassChartInstance.showLoading()
  
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  // 各学校运动项目差异化
  const projects = isZirong
    ? ['排球垫球', '足球运球', '跳绳', '50米跑', '仰卧起坐', '800米跑', '引体向上']
    : isLinhai
      ? ['游泳50米', '体操', '武术套路', '跳绳', '立定跳远', '50米跑', '引体向上']
      : ['立定跳远', '跳绳', '50米跑', '仰卧起坐', '坐位体前屈', '1000米跑', '引体向上']
  const data = filteredActivity.value.length > 0 ? filteredActivity.value : activityData.value
  
  // 基于班级整体得分和达标率，按项目维度生成差异化数据
  const avgScore = data.length ? data.reduce((s, c) => s + (c.score || c.passRate || 0), 0) / data.length : 80
  const baseRates = isZirong
    ? [85, 82, 90, 92, 88, 80, 72]
    : isLinhai
      ? [92, 86, 84, 94, 88, 90, 80]
      : [92, 88, 95, 85, 82, 88, 75]
  const scale = avgScore / 85
  const passRates = baseRates.map(r => Math.min(100, Math.round(r * scale)))
  const excellentRates = passRates.map(r => Math.max(0, Math.round(r * 0.72)))
  
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['达标率', '优良率'] },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: projects, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      {
        name: '达标率',
        type: 'bar',
        barWidth: '40%',
        data: passRates,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: '#1E5AA8' }
      },
      {
        name: '优良率',
        type: 'bar',
        barWidth: '40%',
        data: excellentRates,
        itemStyle: { borderRadius: [4, 4, 0, 0], color: '#F5A623' }
      }
    ]
  }
  
  projectPassChartInstance.setOption(option)
  projectPassChartInstance.hideLoading()
}

const initStudentRecordsChart = () => {
  if (!studentRecordsChart.value || !selectedStudent.value) return
  const rect = studentRecordsChart.value.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) {
    setTimeout(() => initStudentRecordsChart(), 100)
    return
  }
  try {
    if (studentRecordsChartInstance) studentRecordsChartInstance.dispose()
    studentRecordsChartInstance = echarts.init(studentRecordsChart.value)
    studentRecordsChartInstance.showLoading()
    
    const option = {
      tooltip: { trigger: 'axis', formatter: '{b}: {c}分' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: selectedStudent.value.recordDates },
      yAxis: { type: 'value', min: 0, max: 100 },
      series: [{
        name: '成绩',
        type: 'line',
        data: selectedStudent.value.records,
        smooth: true,
        lineStyle: { color: '#1E5AA8', width: 3 },
        itemStyle: { color: '#1E5AA8' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(30, 90, 168, 0.3)' },
            { offset: 1, color: 'rgba(30, 90, 168, 0.05)' }
          ])
        }
      }]
    }
    
    studentRecordsChartInstance.setOption(option)
    studentRecordsChartInstance.hideLoading()
  } catch (e) {
    console.error('初始化学生记录图表失败:', e)
  }
}

const initAcademicHeatmap = () => {
  if (!academicHeatmap.value) return
  if (academicHeatmapInstance) academicHeatmapInstance.dispose()
  academicHeatmapInstance = echarts.init(academicHeatmap.value)
  academicHeatmapInstance.showLoading()
  
  const weeks = ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周', '第9周', '第10周', '第11周', '第12周']
  // 从 filteredActivity 动态获取班级列表
  const data = filteredActivity.value.length > 0 ? filteredActivity.value : activityData.value
  const classes = data.map(c => c.className)
  
  // 基于每个班级的达标率和得分动态生成每周数据
  const values = data.map(item => {
    const base = item.score || item.passRate || 80
    return weeks.map((_, weekIdx) => {
      // 随周次递增，加入基于 base 的波动
      const trend = Math.round(base * 0.05 * (weekIdx / 11))
      const variation = Math.round((base * 0.08) * Math.sin(weekIdx * 0.8))
      return Math.min(100, Math.max(60, base + trend + variation))
    })
  })
  
  const heatmapData = []
  for (let i = 0; i < classes.length; i++) {
    for (let j = 0; j < weeks.length; j++) {
      heatmapData.push({
        value: [j, i, values[i][j]],
        itemStyle: { color: getHeatmapColor(values[i][j]) }
      })
    }
  }
  
  const option = {
    tooltip: {
      position: 'top',
      formatter: (params) => {
        return `${classes[params.data.value[1]]}<br/>${weeks[params.data.value[0]]}: ${params.data.value[2]}分`
      }
    },
    grid: { left: '8%', right: '12%', top: '5%', bottom: '15%' },
    xAxis: {
      type: 'category',
      data: weeks,
      splitArea: { show: true },
      axisLabel: { fontSize: 11, color: '#6B7280' }
    },
    yAxis: {
      type: 'category',
      data: classes,
      splitArea: { show: true },
      axisLabel: { fontSize: 11, color: '#6B7280' }
    },
    visualMap: {
      min: 60,
      max: 100,
      calculable: true,
      orient: 'vertical',
      right: '2%',
      top: 'center',
      inRange: { color: ['#FEE2E2', '#FEF3C7', '#DBEAFE', '#DCFCE7'] },
      textStyle: { color: '#6B7280' }
    },
    series: [{
      name: '学业水平',
      type: 'heatmap',
      data: heatmapData,
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
    }]
  }
  
  academicHeatmapInstance.setOption(option)
  academicHeatmapInstance.hideLoading()
}

const getHeatmapColor = (value) => {
  if (value >= 90) return '#DCFCE7'
  if (value >= 80) return '#DBEAFE'
  if (value >= 60) return '#FEF3C7'
  return '#FEE2E2'
}

const initComprehensiveRadar = () => {
  if (!comprehensiveRadar.value) return
  if (comprehensiveRadarInstance) comprehensiveRadarInstance.dispose()
  comprehensiveRadarInstance = echarts.init(comprehensiveRadar.value)
  comprehensiveRadarInstance.showLoading()
  
  // 从 filteredActivity 动态计算五维雷达数据
  const data = filteredActivity.value.length > 0 ? filteredActivity.value : activityData.value
  const avgPassRate = data.length ? data.reduce((s, c) => s + (c.passRate || 0), 0) / data.length : 80
  const avgScore = data.length ? data.reduce((s, c) => s + (c.score || 0), 0) / data.length : 80
  
  // 五维：身体素质、运动技能、学习态度、团队协作、体育品德
  const comprehensive = [
    Math.round(avgPassRate * 1.05),
    Math.round(avgScore * 0.98),
    Math.min(100, Math.round(avgScore * 1.12)),
    Math.round(avgPassRate * 1.02),
    Math.round(avgScore * 1.05)
  ].map(v => Math.min(100, Math.max(0, v)))
  
  const gradeAvg = comprehensive.map(v => Math.max(0, Math.round(v * 0.88)))
  
  const option = {
    tooltip: { 
      trigger: 'item',
      formatter: (params) => {
        return `${params.name}<br/>${params.seriesName}: ${params.value}`
      }
    },
    legend: { 
      data: ['综合评价', '年级平均'],
      bottom: 0,
      left: 'center',
      textStyle: { color: '#6B7280', fontSize: 12 },
      itemWidth: 14,
      itemHeight: 10
    },
    radar: {
      indicator: [
        { name: '身体素质', max: 100 },
        { name: '运动技能', max: 100 },
        { name: '学习态度', max: 100 },
        { name: '团队协作', max: 100 },
        { name: '体育品德', max: 100 }
      ],
      center: ['50%', '50%'],
      radius: '40%',
      axisName: { color: '#6B7280', fontSize: 12 },
      splitArea: { areaStyle: { color: ['rgba(30, 90, 168, 0.05)', 'rgba(30, 90, 168, 0.1)'] } },
      axisLine: { lineStyle: { color: '#E8EAED' } },
      splitLine: { lineStyle: { color: '#E8EAED' } }
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: comprehensive,
          name: '综合评价',
          areaStyle: { color: 'rgba(30, 90, 168, 0.2)' },
          lineStyle: { color: '#1E5AA8', width: 2 },
          itemStyle: { color: '#1E5AA8' },
          symbol: 'circle',
          symbolSize: 6
        },
        {
          value: gradeAvg,
          name: '年级平均',
          areaStyle: { color: 'rgba(245, 166, 35, 0.1)' },
          lineStyle: { color: '#F5A623', width: 2, type: 'dashed' },
          itemStyle: { color: '#F5A623' },
          symbol: 'circle',
          symbolSize: 6
        }
      ]
    }]
  }
  
  comprehensiveRadarInstance.setOption(option)
  comprehensiveRadarInstance.hideLoading()
}

const initCharts = () => {
  filterData()
  nextTick(() => {
    initHourChart()
    initParticipationChart()
    initDistributionChart()
    initGradeChart()
    initDurationChart()
    initGradePassTrend()
    initProjectPassChart()
    initAcademicHeatmap()
    initComprehensiveRadar()
  })
}

watch(filterGrade, () => {
  currentPage.value = 1
  filterData()
  nextTick(() => {
    initCharts()
  })
})

watch(filterClass, () => {
  currentPage.value = 1
  filterData()
  nextTick(() => {
    initCharts()
  })
})

const dataInitialized = ref(false)

watch(timeRange, () => {
  if (!dataInitialized.value) return
  nextTick(() => {
    initDurationChart()
    initHourChart()
    initParticipationChart()
    initDistributionChart()
    initGradeChart()
  })
})

// 监听个人档案tab切换，初始化成绩记录图表
watch(activeProfileTab, (newTab) => {
  if (newTab === 'records') {
    nextTick(() => {
      initStudentRecordsChart()
    })
  }
})

// 节流处理resize事件
const handleResize = throttle(() => {
  hourChartInstance?.resize()
  participationChartInstance?.resize()
  distributionChartInstance?.resize()
  gradeChartInstance?.resize()
  detailChartInstance?.resize()
  durationChartInstance?.resize()
  gradePassTrendInstance?.resize()
  projectPassChartInstance?.resize()
  studentRecordsChartInstance?.resize()
  academicHeatmapInstance?.resize()
  comprehensiveRadarInstance?.resize()
}, 200)

onMounted(() => {
  hourChartInstance?.showLoading()
  participationChartInstance?.showLoading()
  distributionChartInstance?.showLoading()
  gradeChartInstance?.showLoading()
  detailChartInstance?.showLoading()
  durationChartInstance?.showLoading()
  gradePassTrendInstance?.showLoading()
  projectPassChartInstance?.showLoading()
  studentRecordsChartInstance?.showLoading()
  academicHeatmapInstance?.showLoading()
  comprehensiveRadarInstance?.showLoading()
  nextTick(() => {
    initCharts()
    dataInitialized.value = true
  })
  
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.student-data-page {
  padding: 24px;
  background: #F7F8FA;
  min-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.header-info h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1A1A2E;
}

.header-info p {
  margin: 4px 0 0;
  font-size: 14px;
  color: #6B7280;
}

.header-actions {
  display: flex;
  gap: 12px;
  align-items: center;
}

.grade-select {
  width: 140px;
}

.content-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.content-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.content-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.content-card.full-width {
  grid-column: span 2;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.export-btn {
  color: #1E5AA8;
}

.progress-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-text {
  font-size: 13px;
  font-weight: 600;
  min-width: 40px;
  text-align: right;
}

.chart {
  height: 250px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #E8EAED;
}

.rank-badge {
  display: inline-block;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #F3F4F6;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
}

.rank-gold {
  background: linear-gradient(135deg, #FCD34D, #F59E0B);
  color: #92400E;
}

.rank-silver {
  background: linear-gradient(135deg, #E5E7EB, #9CA3AF);
  color: #4B5563;
}

.rank-bronze {
  background: linear-gradient(135deg, #FDBA74, #D97706);
  color: #78350F;
}

.score-excellent {
  color: #1E5AA8;
  font-weight: 600;
}

.score-good {
  color: #3B82F6;
  font-weight: 600;
}

.score-pass {
  color: #F5A623;
  font-weight: 600;
}

.score-fail {
  color: #E85D4E;
  font-weight: 600;
}

.legend {
  display: flex;
  gap: 16px;
}

.legend-dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 4px;
}

.legend-dot.high {
  background: #1E5AA8;
}

.legend-dot.medium {
  background: #F5A623;
}

.legend-dot.low {
  background: #E85D4E;
}

.activity-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 12px;
}

.activity-item {
  padding: 16px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
}

.activity-item:hover {
  transform: translateY(-2px);
}

.activity-item.high {
  background: #DCFCE7;
  border: 1px solid #BBF7D0;
}

.activity-item.medium {
  background: #FEF3C7;
  border: 1px solid #FDE68A;
}

.activity-item.low {
  background: #FEE2E2;
  border: 1px solid #FECACA;
}

.class-name {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
  margin-bottom: 4px;
}

.active-rate {
  font-size: 20px;
  font-weight: 700;
  color: #1E5AA8;
}

.class-detail {
  padding: 16px 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8EAED;
}

.class-title {
  font-size: 20px;
  font-weight: 600;
  color: #1A1A2E;
}

.level-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.level-badge.high {
  background: #DCFCE7;
  color: #166534;
}

.level-badge.medium {
  background: #FEF3C7;
  color: #92400E;
}

.level-badge.low {
  background: #FEE2E2;
  color: #991B1B;
}

.detail-stats {
  display: flex;
  gap: 32px;
  margin-bottom: 20px;
}

.detail-stat {
  display: flex;
  flex-direction: column;
}

.detail-label {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 4px;
}

.detail-value {
  font-size: 20px;
  font-weight: 600;
  color: #1A1A2E;
}

.detail-section {
  padding-top: 16px;
  border-top: 1px solid #E8EAED;
}

.detail-section h4 {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.detail-chart {
  height: 200px;
}

/* 新增样式 */
.header-filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.time-select {
  width: 120px;
}

.chart-large {
  height: 300px;
}

.chart-medium {
  height: 220px;
}

/* 测试记录弹窗 */
.test-records {
  padding: 16px 0;
}

.records-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EAED;
}

.records-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.records-count {
  font-size: 13px;
  color: #6B7280;
}

.level-tag {
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.level-tag.优秀 {
  background: #DCFCE7;
  color: #166534;
}

.level-tag.良好 {
  background: #DBEAFE;
  color: #1E40AF;
}

.level-tag.及格 {
  background: #FEF3C7;
  color: #92400E;
}

.level-tag.不及格 {
  background: #FEE2E2;
  color: #991B1B;
}

/* 测试模式标签 */
.mode-tag {
  padding: 3px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}
.mode-national {
  background: #DBEAFE;
  color: #1E40AF;
}
.mode-class {
  background: #DCFCE7;
  color: #166534;
}
.mode-self {
  background: #FEF3C7;
  color: #92400E;
}
.mode-retest {
  background: #FEE2E2;
  color: #991B1B;
}

/* 测试人数分析统计 */
.test-analysis-bar {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 14px 20px;
  background: #F7F8FA;
  border-radius: 8px;
  margin-bottom: 16px;
}
.analysis-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}
.analysis-num {
  font-size: 22px;
  font-weight: 700;
  color: #1A1A2E;
}
.analysis-label {
  font-size: 12px;
  color: #6B7280;
}
.analysis-divider {
  width: 1px;
  height: 32px;
  background: #E8EAED;
}

/* 个人档案弹窗 */
.student-profile {
  padding: 16px 0;
}



.profile-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8EAED;
}

.profile-info h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1A1A2E;
}

.profile-info p {
  margin: 4px 0 0;
  font-size: 14px;
  color: #6B7280;
}

.profile-tabs {
  margin-top: 16px;
}

.tab-content {
  padding: 16px 0;
}

.tab-content h4 {
  margin: 0 0 16px;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

/* 姿态指标分析 */
.posture-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.posture-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.posture-label {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 4px;
}

.posture-value {
  font-size: 18px;
  font-weight: 600;
}

/* 关键帧分析 */
.keyframes-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.keyframe-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.keyframe-image {
  width: 80px;
  height: 80px;
  border-radius: 8px;
}

.keyframe-label {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
}

.keyframe-desc {
  font-size: 11px;
  color: #6B7280;
  text-align: center;
}

/* 肌群分析 */
.muscle-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.muscle-item {
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.muscle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.muscle-label {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.muscle-score {
  font-size: 18px;
  font-weight: 600;
}

.muscle-desc {
  font-size: 12px;
  color: #6B7280;
  margin-top: 8px;
  line-height: 1.5;
}

/* 点评及建议 */
.feedback-content {
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
  margin-bottom: 16px;
}

.feedback-content p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: #1A1A2E;
}

.suggestions {
  margin: 0;
  padding-left: 20px;
}

.suggestions li {
  font-size: 14px;
  color: #1A1A2E;
  margin-bottom: 8px;
}

.suggestions li:last-child {
  margin-bottom: 0;
}

/* ===== 评价维度分布 ===== */
.evaluation-distribution {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 4px;
}

.evaluation-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.eval-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
}

.eval-name {
  font-size: 15px;
  font-weight: 500;
  color: #1A1A2E;
}

.eval-score {
  font-size: 18px;
  font-weight: 700;
}

.eval-bar {
  width: 100%;
  height: 8px;
  background: #F3F4F6;
  border-radius: 4px;
  overflow: hidden;
}

.eval-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.6s ease;
}

.eval-desc {
  font-size: 13px;
  color: #6B7280;
  line-height: 1.5;
  margin-top: 2px;
}
</style> 