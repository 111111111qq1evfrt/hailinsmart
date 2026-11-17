<template>
  <div class="dashboard">
    <!-- 智能分析卡片 -->
    <div class="analysis-card">
      <div class="analysis-header">
        <div class="analysis-icon">
          <MagicStick />
        </div>
        <div class="analysis-title">
          <h3><el-icon :size="18" color="#1E5AA8"><Odometer /></el-icon> 智能数据分析</h3>
          <p class="analysis-subtitle">{{ currentDate }}</p>
        </div>
        <el-icon class="refresh-icon" @click="refreshAnalysis"><Refresh /></el-icon>
      </div>
      <div class="analysis-content">
        <div class="analysis-item">
          <div class="analysis-value-wrap">
            <span class="analysis-value" :class="getPassRateClass(analysisData.monthPassRate)">{{ analysisData.monthPassRate.toFixed(1) }}%</span>
            <span class="analysis-trend" :class="analysisData.monthIncrease >= 0 ? 'up' : 'down'">{{ analysisData.monthIncrease >= 0 ? '↑' : '↓' }} {{ Math.abs(analysisData.monthIncrease) }}%</span>
          </div>
          <span class="analysis-label">本月达标率</span>
          <p class="analysis-desc">较上月提升 <strong>{{ analysisData.monthIncrease }}%</strong>，继续保持良好态势</p>
        </div>
        <div class="analysis-divider"></div>
        <div class="analysis-item">
          <div class="analysis-value-wrap">
            <span class="analysis-value good">{{ analysisData.improveCount }}</span>
            <span class="analysis-badge">人</span>
          </div>
          <span class="analysis-label">本月提升人数</span>
          <p class="analysis-desc">{{ analysisData.improveCount }}名学生成绩较上月有明显提升，其中<strong>{{ analysisData.excellentCount }}人</strong>进入优秀行列</p>
        </div>
        <div class="analysis-divider"></div>
        <div class="analysis-item">
          <div class="analysis-value-wrap">
            <span class="analysis-value excellent">{{ analysisData.highestScore }}</span>
            <span class="analysis-badge">分</span>
          </div>
          <span class="analysis-label">最高综合得分</span>
          <p class="analysis-desc">{{ analysisData.topStudent }}同学以{{ analysisData.highestScore }}分蝉联年级第一，{{ analysisData.recordInfo }}</p>
        </div>
      </div>
      <div class="analysis-footer">
        <span class="analysis-tips">💡 建议关注：{{ analysisData.suggestion }}</span>
      </div>
    </div>

    <!-- 整合的 KPI 统计卡片 - 统一卡片布局 -->
    <div class="stats-card">
      <div class="stats-grid">
        <!-- 基础KPI数据 -->
        <div class="stat-item" v-for="(item, index) in kpiList" :key="'kpi-' + index" @click="showKpiDetail(item)">
          <div class="stat-value" :style="{ color: item.color || '#1E5AA8' }">{{ item.value }}</div>
          <div class="stat-label">{{ item.label }}</div>
        </div>
        
        <!-- 增强统计数据 -->
        <div class="stat-item" :key="'enhanced-1'">
          <div class="stat-value">{{ improvementStats.improvementCount }}</div>
          <div class="stat-label">本月成绩提升人次</div>
          <div class="stat-trend positive">↑ {{ improvementStats.improvementRate }}%</div>
        </div>
        
        <div class="stat-item" :key="'enhanced-2'">
          <div class="stat-value">{{ improvementStats.avgExerciseCount }}</div>
          <div class="stat-label">全校人均运动次数</div>
          <div class="stat-trend positive">↑ {{ improvementStats.exerciseRate }}%</div>
        </div>
        
        <div class="stat-item" :key="'enhanced-3'">
          <div class="stat-value">{{ improvementStats.activeRate }}%</div>
          <div class="stat-label">学生运动参与率</div>
          <div class="stat-trend positive">↑ {{ improvementStats.activeRateChange }}%</div>
        </div>
        
        <div class="stat-item" :key="'enhanced-4'">
          <div class="stat-value">{{ improvementStats.avgDistance }}km</div>
          <div class="stat-label">人均跑步里程</div>
          <div class="stat-trend positive">↑ {{ improvementStats.distanceRate }}%</div>
        </div>
      </div>
    </div>

    <!-- 中部图表区 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">成绩等级分布</span>
          <el-button text size="small" @click="refreshCharts">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
        <div ref="scoreChart" class="chart"></div>
      </div>
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">体测指标合格率</span>
          <el-button text size="small" @click="refreshCharts">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
        <div ref="testChart" class="chart"></div>
      </div>
    </div>

    <!-- 底部表格区 -->
    <div class="bottom-row">
      <div class="list-card table-card">
        <div class="table-header">
          <span class="card-title">最近考试记录</span>
          <el-button text type="primary" size="small" @click="viewMore('exams')">查看更多</el-button>
        </div>
        <ExamTable
          :data="recentExams"
          :columns="examColumns"
          :searchable="false"
          :show-pagination="false"
        >
          <template #grade="{ row }">
            <span class="grade-tag" :class="getGradeClass(row.grade)">{{ row.grade }}</span>
          </template>
        </ExamTable>
      </div>
      <div class="list-card table-card">
        <div class="table-header">
          <span class="card-title">今日练习记录</span>
          <el-button text type="primary" size="small" @click="viewMore('practice')">查看更多</el-button>
        </div>
        <ExamTable
          :data="todayPractice"
          :columns="practiceColumns"
          :searchable="false"
          :show-pagination="false"
        />
      </div>
    </div>

    <!-- 课程进度监控 -->
    <div class="list-card progress-card">
      <div class="card-header">
        <span class="card-title">课程进度达成率</span>
        <div class="header-actions">
          <el-button text size="small" @click="refreshProgress">刷新</el-button>
          <el-button text size="small" @click="viewProgressDetail">查看详情</el-button>
        </div>
      </div>
      <div class="progress-content">
        <div class="progress-summary">
          <div class="summary-item">
            <span class="summary-value">{{ progressStats.overallRate }}%</span>
            <span class="summary-label">总体达成率</span>
          </div>
          <div class="summary-item">
            <span class="summary-value">{{ progressStats.onSchedule }}</span>
            <span class="summary-label">正常进度班级</span>
          </div>
          <div class="summary-item">
            <span class="summary-value warning">{{ progressStats.delayed }}</span>
            <span class="summary-label">进度滞后班级</span>
          </div>
        </div>
        <div class="progress-bars">
          <div v-for="(item, index) in progressList" :key="index" class="progress-item">
            <div class="progress-header">
              <span class="progress-name">{{ item.className }}</span>
              <span class="progress-rate" :class="getRateClass(item.rate)">{{ item.rate }}%</span>
            </div>
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: item.rate + '%', backgroundColor: getRateColor(item.rate) }"></div>
            </div>
            <span class="progress-desc">{{ item.progress }} / {{ item.total }} 课时</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 异常预警 -->
    <div class="list-card warning-card">
      <div class="card-header">
        <span class="card-title">异常预警</span>
        <span class="warning-count">{{ warningList.length }}</span>
      </div>
      <div class="warning-list">
        <div v-for="(warning, index) in warningList" :key="index" class="warning-item" :class="warning.level">
          <div class="warning-icon">
            <WarnTriangleFilled v-if="warning.level === 'danger'" />
            <Warning v-else-if="warning.level === 'warning'" />
            <InfoFilled v-else />
          </div>
          <div class="warning-content">
            <h4>{{ warning.title }}</h4>
            <p>{{ warning.description }}</p>
          </div>
          <div class="warning-meta">
            <span class="warning-time">{{ warning.time }}</span>
            <el-button text size="small" @click="handleWarning(warning)">处理</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 模块快捷入口 -->
    <div class="list-card module-card">
      <div class="card-header">
        <span class="card-title">功能模块</span>
      </div>
      <div class="module-grid">
        <div class="module-item" v-for="(mod, idx) in moduleList" :key="idx" @click="$router.push(mod.path)">
          <div class="module-icon" :style="{ backgroundColor: mod.bgColor }">
            <span class="module-badge" :style="{ color: mod.iconColor }">{{ mod.badge }}</span>
          </div>
          <span class="module-name">{{ mod.name }}</span>
          <span class="module-desc">{{ mod.desc }}</span>
        </div>
      </div>
    </div>

    <!-- KPI 详情 -->
    <el-dialog v-model="kpiDetailVisible" :title="currentKpi?.label || '指标详情'" width="420px">
      <div v-if="currentKpi" class="kpi-detail">
        <div class="kpi-value" :style="{ color: currentKpi.color }">{{ currentKpi.value }}</div>
        <p>{{ currentKpi.desc || `${currentKpi.label}是当前系统的核心统计指标，数据实时更新。` }}</p>
      </div>
      <template #footer>
        <el-button type="primary" @click="kpiDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 预警处理弹窗 -->
    <el-dialog v-model="warningDialogVisible" title="预警处理" width="500px">
      <div v-if="currentWarning" class="warning-detail">
        <div class="warning-detail-header">
          <span class="warning-level-badge" :class="currentWarning.level">
            {{ currentWarning.level === 'danger' ? '严重' : currentWarning.level === 'warning' ? '警告' : '提示' }}
          </span>
          <h3>{{ currentWarning.title }}</h3>
        </div>
        <p class="warning-detail-desc">{{ currentWarning.description }}</p>
        <p class="warning-detail-time">发现时间：{{ currentWarning.time }}</p>
      </div>
      <template #footer>
        <el-button @click="ignoreWarning">忽略</el-button>
        <el-button type="primary" @click="resolveWarning">标记已处理</el-button>
      </template>
    </el-dialog>
    
    <!-- 数据加载蒙版 -->
    <LoadingOverlay 
      :visible="pushLoading" 
      text="正在加载运动数据..." 
      subText="首次加载可能需要几秒"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, nextTick, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User, TrendCharts, Check, Trophy,
  ArrowUp, ArrowDown, Refresh, School,
  Basketball, Star, VideoCamera, DataLine, VideoPlay, MagicStick,
  WarnTriangleFilled, Warning, InfoFilled,
  UserFilled, Odometer
} from '@element-plus/icons-vue'
import echarts from '@/utils/echarts'
import store from '../../store/global'
import { getSchoolMockData } from '../../utils/mockDataLoader'
import { getSchoolProfile } from '@/mock/school-data/schoolProfiles'
import ExamTable from '@/components/table/ExamTable.vue'
import { calculateSchoolStats } from '@/utils/statistics'
import { usePersistedRef } from '@/composables'
import { createSeededRandom } from '@/utils/seededRandom'
import sportsApi, { transformPushList } from '@/utils/daiweiPushApi'
import { getStudentListV4 } from '@/utils/daiweiApi'
import { evaluateScore, getScoreStandards, formatExamDate } from '@/utils/scoreStandard'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { useSportsData } from '@/composables/useSportsData'


const router = useRouter()

// 运动推送数据
const sportsData = useSportsData()
const pushData = ref([])
const pushLoading = ref(true)
const pushDataLoaded = ref(false)

// Mock 数据兜底
const mockPushData = computed(() => {
  const schoolId = store.state.school?.id || ''
  const mockData = getSchoolMockData(schoolId)
  return (mockData.students || []).slice(0, 20).map((s, i) => ({
    id: `mock_${i}`,
    personId: s.id,
    score: Math.floor(Math.random() * 100 + 50),
    duration: Math.floor(Math.random() * 30 + 10),
    sportType: [1, 2, 6, 7][Math.floor(Math.random() * 4)],
    receivedAt: Date.now() - Math.random() * 86400000
  }))
})

const loadPushData = async () => {
  try {
    const schoolId = store.state.school?.id || ''
    const res = await sportsApi.getList(schoolId, { limit: 500 })
    if (res.code === '0' && res.data?.list?.length > 0) {
      pushData.value = transformPushList(res.data.list)
      pushDataLoaded.value = true
    } else {
      // API 返回空，使用 Mock 数据
      pushData.value = mockPushData.value
      pushDataLoaded.value = false
    }
  } catch (e) {
    console.warn('推送服务不可用，使用本地Mock数据')
    pushData.value = mockPushData.value
    pushDataLoaded.value = false
  }
}

const kpiDetailVisible = ref(false)
const currentKpi = ref(null)
const scoreChart = ref(null)
const testChart = ref(null)
let scoreChartInstance = null
let testChartInstance = null

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const fixedAnalysisData = usePersistedRef(`dashboard_analysis_${schoolId.value}`, () => {
  const defaults = {
    'hailin-second-primary': { monthPassRate: 87.5, monthIncrease: 5.2 },
    'hailin-zirong-primary': { monthPassRate: 82.6, monthIncrease: 4.8 },
    'linhai-experimental-primary': { monthPassRate: 85.8, monthIncrease: 5.5 }
  }
  return defaults[schoolId.value] || defaults['hailin-second-primary']
})

const getStudents = () => {
  const key = `students_${schoolId.value}`
  const stored = sessionStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return getSchoolMockData(schoolId.value).students || []
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

const getExamResults = () => {
  const key = `exam_results_${schoolId.value}`
  const stored = sessionStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  const schoolData = getSchoolMockData(schoolId.value)
  return schoolData.examResults || []
}

const students = ref(getStudents())
const testResults = ref(getTestResults())
const examResults = ref(getExamResults())

const schoolData = computed(() => getSchoolMockData(schoolId.value))
const schoolProfile = computed(() => getSchoolProfile(schoolId.value))

const dynamicStats = computed(() => {
  return calculateSchoolStats(students.value, testResults.value, examResults.value, schoolProfile.value)
})

// 智能分析数据
const formatToday = () => {
  const d = new Date()
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日 ${weekdays[d.getDay()]}`
}
const currentDate = ref(formatToday())

const analysisData = computed(() => {
  const stats = dynamicStats.value
  const defaultAnalysis = {
    'hailin-second-primary': {
      monthPassRate: 87.5, monthIncrease: 5.2, improveCount: 156, excellentCount: 48,
      highestScore: 98.6, topStudent: '李明轩', recordInfo: '打破校运会记录',
      suggestion: '二年级3班的坐位体前屈项目达标率较低，建议加强柔韧性训练'
    },
    'hailin-zirong-primary': {
      monthPassRate: 79.2, monthIncrease: 3.8, improveCount: 68, excellentCount: 22,
      highestScore: 96.2, topStudent: '赵子涵', recordInfo: '年级最高分',
      suggestion: '三年级1班达标率偏低，建议增加基础体能训练'
    },
    'linhai-experimental-primary': {
      monthPassRate: 83.8, monthIncrease: 4.5, improveCount: 98, excellentCount: 35,
      highestScore: 97.8, topStudent: '黄子豪', recordInfo: '连续三月进步奖',
      suggestion: '五年级3班需重点关注，建议制定个性化训练方案'
    }
  }
  const defaultData = defaultAnalysis[schoolId.value] || defaultAnalysis['hailin-second-primary']
  
  const topStudent = students.value.length > 0 && students.value[0].name && students.value[0].name !== '1'
    ? students.value[0].name 
    : defaultData.topStudent
  
  return {
    monthPassRate: fixedAnalysisData.value.monthPassRate,
    monthIncrease: fixedAnalysisData.value.monthIncrease,
    improveCount: stats.improvementCount > 0 ? stats.improvementCount : defaultData.improveCount,
    excellentCount: Math.round(stats.improvementCount * 0.3) || defaultData.excellentCount,
    highestScore: defaultData.highestScore,
    topStudent,
    recordInfo: defaultData.recordInfo,
    suggestion: defaultData.suggestion
  }
})

// 成绩提升人次与运动次数统计
const improvementStats = computed(() => {
  const stats = dynamicStats.value
  const defaultStats = schoolData.value?.systemStats || { activityStats: {} }
  const activity = defaultStats.activityStats || { monthlyActive: 0, avgFrequency: 0, participationRate: 0, avgDistance: 0 }
  const fallbacks = {
    'hailin-second-primary': { monthlyActive: 1256, avgFrequency: 8.6, participationRate: 92.3, avgDistance: 12.5 },
    'hailin-zirong-primary': { monthlyActive: 438, avgFrequency: 7.2, participationRate: 88.5, avgDistance: 10.8 },
    'linhai-experimental-primary': { monthlyActive: 580, avgFrequency: 7.9, participationRate: 90.1, avgDistance: 11.6 }
  }
  const fb = fallbacks[schoolId.value] || fallbacks['hailin-second-primary']
  
  return {
    improvementCount: stats.improvementCount > 0 ? stats.improvementCount : activity.monthlyActive || fb.monthlyActive,
    improvementRate: stats.improvementRate > 0 ? stats.improvementRate : 12.8,
    avgExerciseCount: stats.avgExerciseCount > 0 ? stats.avgExerciseCount : activity.avgFrequency || fb.avgFrequency,
    exerciseRate: stats.exerciseRate > 0 ? stats.exerciseRate : 8.5,
    activeRate: stats.passRate > 0 ? stats.passRate : activity.participationRate || fb.participationRate,
    activeRateChange: 3.2,
    avgDistance: activity.avgDistance || fb.avgDistance,
    distanceRate: 15.3
  }
})

const refreshAnalysis = () => {
  ElMessage.success('分析数据已刷新')
}

const getPassRateClass = (rate) => {
  if (rate >= 90) return 'excellent'
  if (rate >= 80) return 'good'
  if (rate >= 60) return 'pass'
  return 'fail'
}

// 课程进度数据
const progressStats = computed(() => {
  const cpList = schoolProfile.value?.nationalTest?.classProgress || []
  const defaultStats = cpList.length > 0
    ? {
        overallRate: Number((cpList.reduce((sum, cp) => sum + cp.rate, 0) / cpList.length).toFixed(1)),
        onSchedule: cpList.filter(cp => cp.rate >= 80).length,
        delayed: cpList.filter(cp => cp.rate < 70).length
      }
    : { overallRate: 82.5, onSchedule: 28, delayed: 4 }
  const stats = schoolData.value?.systemStats?.progressStats || defaultStats
  return {
    overallRate: Number(stats.overallRate.toFixed(1)),
    onSchedule: stats.onSchedule,
    delayed: stats.delayed
  }
})

const progressList = computed(() => {
  return schoolData.value?.systemStats?.progressList ||
    (schoolProfile.value?.nationalTest?.classProgress || []).map(cp => ({
      className: cp.className,
      rate: cp.rate,
      progress: cp.completed,
      total: cp.total
    }))
})

const refreshProgress = () => {
  ElMessage.success('进度数据已刷新')
}

const viewProgressDetail = () => {
  router.push('/data/overview')
}

const getRateClass = (rate) => {
  if (rate >= 85) return 'excellent'
  if (rate >= 70) return 'good'
  if (rate >= 60) return 'warning'
  return 'danger'
}

const getRateColor = (rate) => {
  if (rate >= 85) return '#1E5AA8'
  if (rate >= 70) return '#3B82F6'
  if (rate >= 60) return '#F5A623'
  return '#E85D4E'
}

// 异常预警数据
const warningSource = computed(() => {
  const raw = schoolData.value?.systemStats?.warnings ||
    (schoolProfile.value?.leaderDashboard?.warningList || []).map(w => ({
      level: w.level === 'high' ? 'danger' : w.level === 'medium' ? 'warning' : 'info',
      title: w.title,
      description: w.desc,
      time: w.time
    }))
  // 确保每条预警都有唯一 id，避免处理一条时全部被标记
  return (raw || []).map(w => ({
    ...w,
    id: w.id || (w.title + '_' + w.time)
  }))
})

// 使用ref跟踪已解决的警告，用computed过滤显示的警告
const resolvedWarningIds = ref([])

const warningList = computed(() => {
  const sourceWarnings = warningSource.value || []
  return sourceWarnings.filter(warning => 
    !resolvedWarningIds.value.includes(warning.id)
  )
})

const handleWarning = (warning) => {
  currentWarning.value = warning
  warningDialogVisible.value = true
}

// 预警处理弹窗
const warningDialogVisible = ref(false)
const currentWarning = ref(null)

const resolveWarning = () => {
  if (currentWarning.value) {
    const warningId = currentWarning.value.id
    if (!resolvedWarningIds.value.includes(warningId)) {
      resolvedWarningIds.value.push(warningId)
    }
    ElMessage.success(`预警"${currentWarning.value.title}"已处理`)
  }
  warningDialogVisible.value = false
}

const ignoreWarning = () => {
  ElMessage.info('已忽略该预警')
  warningDialogVisible.value = false
}

const kpiList = computed(() => {
  const stats = dynamicStats.value
  const defaultStats = schoolData.value?.systemStats || { totalStudents: 0, onlineStudents: 0, examCompleted: 0, nationalTestCompleted: 0 }
  const activity = defaultStats.activityStats || { monthlyActive: 0, avgFrequency: 0, participationRate: 0, avgDistance: 0 }
  
  // 如果有推送数据，使用推送数据作为补充
  const pushTotal = pushData.value.length
  const todayPushCount = pushData.value.filter(item => {
    const today = new Date().toDateString()
    return item.receivedAt && new Date(item.receivedAt).toDateString() === today
  }).length

  return [
    { label: '在校学生', value: stats.totalStudents > 0 ? stats.totalStudents : defaultStats.totalStudents, icon: 'User', bgColor: '#DCFCE7', iconColor: '#1E5AA8', color: '#1E5AA8', trend: 5.2 },
    { label: '实时运动人次', value: pushDataLoaded.value ? todayPushCount : (stats.todayActive > 0 ? stats.todayActive : defaultStats.onlineStudents), icon: 'TrendCharts', bgColor: '#DBEAFE', iconColor: '#3B82F6', color: '#3B82F6', trend: 3.8 },
    { label: '本月运动人次', value: pushDataLoaded.value ? pushTotal : (stats.monthTotal > 0 ? Math.round(stats.monthTotal / 10) : activity.monthlyActive), icon: 'Check', bgColor: '#FEF3C7', iconColor: '#F5A623', color: '#F5A623', trend: 12.8 },
    { label: '体测完成', value: stats.nationalTestCompleted > 0 ? stats.nationalTestCompleted : defaultStats.nationalTestCompleted, icon: 'Check', bgColor: '#DCFCE7', iconColor: '#1E5AA8', color: '#1E5AA8', trend: 5.4 }
  ]
})

const moduleList = [
  { name: '学生管理', desc: '信息录入与班级管理', icon: 'User', path: '/system/students', bgColor: '#DCFCE7', iconColor: '#1E5AA8', badge: '学' },
  { name: '体育考试', desc: '考试管理与成绩分析', icon: 'Trophy', path: '/exam', bgColor: '#DBEAFE', iconColor: '#3B82F6', badge: '考' },
  { name: '国家体测', desc: '体测数据与上报', icon: 'School', path: '/national-test', bgColor: '#FEF3C7', iconColor: '#F5A623', badge: '体' },
  { name: '自由练习', desc: '自主练习与成绩记录', icon: 'Basketball', path: '/practice', bgColor: '#E0F2FE', iconColor: '#06B6D4', badge: '练' },
  { name: '学生评价', desc: '多维度评价分析', icon: 'Star', path: '/evaluation/assessment', bgColor: '#F3E8FF', iconColor: '#8B5CF6', badge: '评' },
  { name: '听评课', desc: '课堂评价与直播', icon: 'VideoCamera', path: '/evaluation/teaching', bgColor: '#FCE7F3', iconColor: '#EC4899', badge: '课' },
  { name: '校领导面板', desc: '数据总览与决策', icon: 'DataLine', path: '/evaluation/leader', bgColor: '#FFEDD5', iconColor: '#F97316', badge: '领' }
]

/**
 * 大沩推送记录 → 首页表格行
 * 学号（大沩 person_id）在本校学生表中找不到时不展示，避免出现不相干学生
 */
const buildPushRows = (records) => {
  const standards = getScoreStandards(schoolId.value)
  const studentsArr = students.value || []
  const rows = []

  for (const record of records) {
    for (const item of (record.items || [])) {
      const student = item.personId ? studentsArr.find(s => s.id === item.personId) : null
      if (!student) continue
      const evaluated = evaluateScore(record.sportType, item.score, standards)
      // start_time 与接收时间相差过大（测试用旧时间戳）时改用接收时间
      const startTs = Number(item.startTime)
      const receivedTs = Number(record.receivedAt)
      const timeDiff = startTs && receivedTs ? Math.abs(receivedTs - startTs) : 0
      const ts = startTs && (!receivedTs || timeDiff <= 30 * 24 * 60 * 60 * 1000) ? startTs : (receivedTs || startTs)

      rows.push({
        id: `push_${record.id}_${item.personId}`,
        studentName: student.name,
        event: record.sportTypeName || '综合运动',
        score: evaluated ? `${evaluated.score}` : `${item.score ?? '—'}`,
        grade: evaluated ? evaluated.level : '未评级',
        date: formatExamDate(ts),
        _ts: ts || 0,
        _mode: record.mode
      })
    }
  }

  return rows.sort((a, b) => b._ts - a._ts)
}

const isToday = (ts) => {
  const d = new Date(Number(ts))
  if (isNaN(d.getTime())) return false
  const now = new Date()
  return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate()
}

// 最近考试记录：优先用大沩真实推送，没有推送时才回退本地模拟数据
const recentExams = computed(() => {
  if (pushDataLoaded.value) {
    const rows = buildPushRows(pushData.value)
    if (rows.length) return rows.slice(0, 5)
  }
  return (schoolData.value?.examResults || []).slice(0, 5)
})

// 今日练习记录：只统计真实推送里的练习模式（mode=1）且发生在今天的，无数据则为空
const todayPractice = computed(() => {
  if (!pushDataLoaded.value) return []
  return buildPushRows(pushData.value.filter(r => r.mode === 1))
    .filter(row => isToday(row._ts))
    .slice(0, 5)
})

const examColumns = ref([
  { prop: 'studentName', label: '学生姓名', minWidth: '100' },
  { prop: 'event', label: '项目', minWidth: '100' },
  { prop: 'score', label: '成绩', minWidth: '80' },
  { slot: 'grade', label: '等级', minWidth: '80' },
  { prop: 'date', label: '日期', minWidth: '100' },
])

const practiceColumns = ref([
  { prop: 'studentName', label: '学生姓名', minWidth: '100' },
  { prop: 'event', label: '项目', minWidth: '100' },
  { prop: 'score', label: '成绩', minWidth: '80' },
  { prop: 'date', label: '时间', minWidth: '120' },
])

const getGradeClass = (grade) => {
  const map = { '优秀': 'grade-excellent', '良好': 'grade-good', '及格': 'grade-pass', '不及格': 'grade-fail' }
  return map[grade] || ''
}

const showKpiDetail = (item) => {
  currentKpi.value = item
  kpiDetailVisible.value = true
}

const refreshCharts = () => {
  scoreChartInstance?.showLoading()
  testChartInstance?.showLoading()
  initScoreChart()
  initTestChart()
  ElMessage.success('图表已刷新')
}

const viewMore = (type) => {
  if (type === 'exams') {
    router.push('/exam')
  } else if (type === 'practice') {
    router.push('/practice')
  }
}

const initScoreChart = () => {
  if (!scoreChart.value) return
 
  scoreChartInstance = echarts.init(scoreChart.value)
  scoreChartInstance.showLoading()
  const stats = dynamicStats.value
  const defaultStats = schoolData.value?.systemStats || { excellentRate: 28, goodRate: 35, passRate: 25, failRate: 12 }
  
  const excellentRate = stats.excellentRate > 0 ? stats.excellentRate : defaultStats.excellentRate
  const goodRate = stats.goodRate > 0 ? stats.goodRate : defaultStats.goodRate
  const passRate = stats.passRate > 0 ? Math.round(stats.passRate * 0.3) : defaultStats.passRate
  const failRate = 100 - excellentRate - goodRate - passRate
  
  scoreChartInstance.setOption({
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    tooltip: { trigger: 'item' },
    legend: { bottom: 0, textStyle: { color: '#6B7280', fontSize: 12 } },
    series: [{
      name: '成绩分布',
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['50%', '45%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      animationType: 'expansion',
      animationDurationUpdate: 500,
      data: [
        { value: excellentRate, name: '优秀', itemStyle: { color: '#1E5AA8' } },
        { value: goodRate, name: '良好', itemStyle: { color: '#3B82F6' } },
        { value: passRate, name: '及格', itemStyle: { color: '#F5A623' } },
        { value: Math.max(failRate, 0), name: '不及格', itemStyle: { color: '#E85D4E' } }
      ]
    }]
  })
  scoreChartInstance.hideLoading()
}

const initTestChart = () => {
  if (!testChart.value) return
  if (testChartInstance) { testChartInstance.dispose(); testChartInstance = null }
  testChartInstance = echarts.init(testChart.value)
  testChartInstance.showLoading()
  const stats = dynamicStats.value
  const defaultData = [85.6, 62.3, 88.5, 78.2, 82.1, 75.8, 90.2, 84.5]
  const random = createSeededRandom('dashboard-test-chart')
  
  const baseRate = stats.passRate > 0 ? stats.passRate : 82.5
  const testChartData = defaultData.map(v => {
    const variance = (random() - 0.5) * 20
    return Math.round((baseRate * (v / 85) + variance) * 10) / 10
  })
  
  testChartInstance.setOption({
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['立定跳远', '跳绳', '50米跑', '仰卧起坐', '坐位体前屈', '1000米跑', '50*8往返跑', '引体向上'],
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F7F8FA' } },
      axisLabel: { color: '#6B7280', fontSize: 12, formatter: '{value}%' }
    },
    series: [{
      data: testChartData.map(v => Math.max(0, Math.min(100, v))),
      type: 'bar',
      barWidth: '45%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#1E5AA8' },
          { offset: 1, color: '#4ADE80' }
        ])
      },
      animationDelay: function(idx) { return idx * 100 }
    }]
  })
  testChartInstance.hideLoading()
}

// 统一加载所有接口数据，共享 loading 蒙版
const loadAllData = async () => {
  pushLoading.value = true
  try {
    // 并行加载学生数据和推送数据
    const [studentResult] = await Promise.allSettled([
      getStudentListV4({ page: 1, size: 2000 }, schoolId.value),
      loadPushData()
    ])

    // 处理学生数据
    if (studentResult.status === 'fulfilled') {
      const apiStudents = studentResult.value?.list || []
      if (apiStudents.length > 0) {
        students.value = apiStudents
          .map(s => {
            const rawClassName = s.class_name || s.className || ''
            const rawGrade = s.grade_name || s.gradeName || s.grade || ''
            
            let grade = ''
            let cls = ''
            
            if (rawClassName) {
              const gradeMatch = rawClassName.match(/([一二三四五六七八九十]+年级)/)
              const classMatch = rawClassName.match(/(\d+)班$/)
              grade = gradeMatch ? gradeMatch[1] : ''
              cls = classMatch ? classMatch[0] : ''
            }
            
            if (!grade && rawGrade) {
              const gradeMatch = rawGrade.match(/([一二三四五六七八九十]+年级)/)
              grade = gradeMatch ? gradeMatch[1] : ''
            }
            
            if (!cls && rawClassName) {
              const classNumMatch = rawClassName.match(/(\d+)班$/)
              cls = classNumMatch ? classNumMatch[0] : ''
            }
            
            const finalClassName = grade && cls ? `${grade}${cls}` : (rawClassName || `${grade}${cls}`)
            
            return {
              id: s.student_id || s.id,
              name: s.name,
              studentId: s.student_id || s.student_no,
              grade,
              class: cls,
              className: finalClassName,
              gradeName: grade || rawGrade,
              gender: s.gender === 1 ? '男' : s.gender === 2 ? '女' : (s.gender || ''),
              school: store.state.school?.name || '',
              hasTestRecord: false,
              age: s.age || 8,
              sportsInterest: s.sports_interest || ''
            }
          })
        
        sessionStorage.setItem(`students_${schoolId.value}`, JSON.stringify(students.value))
      }
    } else {
      console.warn('[主页] 学生API加载失败，使用本地数据:', studentResult.reason?.message)
    }

    // 初始化图表
    scoreChartInstance?.showLoading()
    testChartInstance?.showLoading()
    nextTick(() => {
      setTimeout(() => { initScoreChart(); initTestChart() }, 200)
    })
  } finally {
    pushLoading.value = false
  }
}

onMounted(() => {
  loadAllData()
  window.addEventListener('resize', handleChartResize)
})

// keep-alive 重新激活时刷新数据
onActivated(() => {
  loadAllData()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleChartResize)
  if (scoreChartInstance) scoreChartInstance.dispose()
  if (testChartInstance) testChartInstance.dispose()
})

const handleChartResize = () => {
  if (scoreChartInstance) scoreChartInstance.resize()
  if (testChartInstance) testChartInstance.resize()
}
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 整合的统计卡片 - 统一卡片布局 */
.stats-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
}

.stat-item:hover {
  background: #F7F8FA;
  transform: translateY(-2px);
}

.stat-item.enhanced {
  position: relative;
}

.stat-value {
  font-size: clamp(24px, 2vw, 32px);
  font-weight: 700;
  line-height: 1.2;
  color: #1E5AA8;
}

.stat-label {
  font-size: clamp(12px, 1vw, 14px);
  color: #6B7280;
  white-space: nowrap;
}

.stat-trend {
  font-size: 12px;
  font-weight: 600;
  margin-top: 4px;
}

.stat-trend.positive {
  color: #22C55E;
}

.stat-trend.negative {
  color: #E85D4E;
}

/* 响应式媒体查询 */
@media screen and (max-width: 1600px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
    gap: 20px;
  }
}

@media screen and (max-width: 1200px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .stats-card {
    padding: 20px;
  }
}

@media screen and (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  
  .stats-card {
    padding: 14px;
  }
  
  .stat-item {
    padding: 10px;
  }
  
  .stat-value {
    font-size: 22px;
  }
  
  .stat-label {
    font-size: 12px;
  }
}

@media screen and (max-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }
  
  .stats-card {
    padding: 12px;
  }
  
  .stat-item {
    padding: 8px;
  }
  
  .stat-value {
    font-size: 20px;
  }
  
  .stat-label {
    font-size: 11px;
    white-space: normal;
  }
}

/* 智能分析卡片 */
.analysis-card {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  color: #0F172A;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.02);
  border: 1px solid #E2E8F0;
}

.analysis-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
}

.analysis-icon {
  width: 44px;
  height: 44px;
  background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #2563EB;
}

.refresh-icon {
  margin-left: auto;
  font-size: 18px;
  color: #94A3B8;
  cursor: pointer;
  transition: color 0.2s;
}

.refresh-icon:hover {
  color: #1E5AA8;
}

.analysis-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #0F172A;
}

.analysis-subtitle {
  margin: 4px 0 0 0;
  font-size: 13px;
  color: #94A3B8;
}

.analysis-content {
  display: flex;
  gap: 24px;
  align-items: stretch;
}

.analysis-content .analysis-item {
  flex: 1;
  min-width: 0;
}

.analysis-item {
  background: #F8FAFC;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.analysis-value-wrap {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.analysis-value {
  font-size: 32px;
  font-weight: 700;
  color: #0F172A;
}

.analysis-value.excellent {
  color: #1E5AA8;
}

.analysis-value.good {
  color: #3B82F6;
}

.analysis-value.pass {
  color: #F5A623;
}

.analysis-value.fail {
  color: #E85D4E;
}

.analysis-trend {
  font-size: 14px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.analysis-trend.up {
  background: #DCFCE7;
  color: #16A34A;
}

.analysis-trend.down {
  background: #FEE2E2;
  color: #DC2626;
}

.analysis-badge {
  font-size: 14px;
  color: #94A3B8;
  font-weight: 500;
}

.analysis-label {
  display: block;
  font-size: 14px;
  color: #64748B;
  margin-top: 8px;
}

.analysis-desc {
  font-size: 12px;
  color: #94A3B8;
  line-height: 1.5;
  margin: 8px 0 0 0;
}

.analysis-desc strong {
  color: #2563EB;
}

.analysis-divider {
  display: none;
}

.analysis-footer {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #F1F5F9;
}

.analysis-tips {
  font-size: 13px;
  color: #64748B;
}

/* 图表区 */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.chart {
  height: 260px;
  width: 100%;
}

/* 底部表格 */
.bottom-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  align-items: stretch;
}

.table-card {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.table-card :deep(.el-table) {
  border-radius: 0;
}

.table-card :deep(.el-table__header) {
  background: transparent;
}

.table-card :deep(.el-table th.el-table__cell) {
  background: #F7F8FA;
  font-weight: 600;
  color: #1A1A2E;
  border-bottom: 1px solid #E8EAED;
}

.table-card :deep(.el-table td.el-table__cell) {
  border-bottom: 1px solid #F3F4F6;
}

.table-card :deep(.el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell) {
  background: #F7F8FA;
}

/* 等级标签 */
.grade-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.grade-excellent { background: #DCFCE7; color: #166534; }
.grade-good { background: #DBEAFE; color: #1E40AF; }
.grade-pass { background: #FEF3C7; color: #92400E; }
.grade-fail { background: #FEE2E2; color: #991B1B; }

/* 模块卡片 */
.module-card {
  grid-column: span 2;
}

.module-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 16px;
}

.module-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px 8px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.module-item:hover {
  background: #F7F8FA;
  transform: translateY(-2px);
}

.module-icon {
  width: 56px;
  height: 56px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.module-badge {
  font-size: 22px;
  font-weight: 700;
}

.module-name {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.module-desc {
  font-size: 12px;
  color: #9CA3AF;
  text-align: center;
}

/* 课程进度监控 */
.header-actions {
  display: flex;
  gap: 8px;
}

.progress-content {
  padding-top: 12px;
}

.progress-summary {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8EAED;
}

.summary-item {
  flex: 1;
  text-align: center;
}

.summary-value {
  display: block;
  font-size: 24px;
  font-weight: 700;
  color: #1E5AA8;
}

.summary-value.warning {
  color: #F5A623;
}

.summary-label {
  font-size: 12px;
  color: #6B7280;
}

.progress-bars {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-item {
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-name {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.progress-rate {
  font-size: 14px;
  font-weight: 600;
}

.progress-rate.excellent {
  color: #1E5AA8;
}

.progress-rate.good {
  color: #3B82F6;
}

.progress-rate.warning {
  color: #F5A623;
}

.progress-rate.danger {
  color: #E85D4E;
}

.progress-bar {
  height: 6px;
  background: #E8EAED;
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-desc {
  font-size: 12px;
  color: #9CA3AF;
  margin-top: 6px;
}

/* 异常预警 */
.warning-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.02);
}

.warning-count {
  background: #E85D4E;
  color: #FFFFFF;
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
}

.warning-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.warning-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: #F8FAFC;
  border-radius: 8px;
  border-left: 4px solid;
}

.warning-item.danger {
  border-color: #E85D4E;
}

.warning-item.warning {
  border-color: #F5A623;
}

.warning-item.info {
  border-color: #3B82F6;
}

.warning-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.warning-item.danger .warning-icon {
  color: #E85D4E;
}

.warning-item.warning .warning-icon {
  color: #F5A623;
}

.warning-item.info .warning-icon {
  color: #3B82F6;
}

.warning-content {
  flex: 1;
}

.warning-content h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 4px 0;
}

.warning-content p {
  font-size: 12px;
  color: #6B7280;
  margin: 0;
  line-height: 1.4;
}

.warning-meta {
  text-align: right;
}

.warning-time {
  display: block;
  font-size: 11px;
  color: #9CA3AF;
  margin-bottom: 8px;
}

/* Dashboard响应式布局 */
@media screen and (max-width: 992px) {
  .analysis-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .analysis-divider {
    display: none;
  }
  
  .charts-row {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .bottom-row {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .progress-summary {
    flex-wrap: wrap;
    gap: 16px;
  }
  
  .summary-item {
    flex: 1;
    min-width: 120px;
  }
}

@media screen and (max-width: 768px) {
  .dashboard {
    gap: 16px;
  }
  
  .analysis-card {
    padding: 16px;
    margin-bottom: 16px;
  }
  
  .analysis-header {
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .analysis-title h3 {
    font-size: 16px;
  }
  
  .analysis-subtitle {
    font-size: 12px;
  }
  
  .analysis-content {
    flex-direction: column;
    gap: 12px;
  }
  
  .analysis-item {
    padding: 16px;
  }
  
  .analysis-value {
    font-size: 24px;
  }
  
  .analysis-label {
    font-size: 13px;
  }
  
  .analysis-desc {
    font-size: 11px;
  }
  
  .charts-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .chart-card {
    padding: 16px;
  }
  
  .chart {
    height: 200px;
  }
  
  .bottom-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .table-card {
    padding: 16px;
    overflow-x: auto;
  }
  
  .table-card :deep(.el-table) {
    min-width: 600px;
  }
  
  .progress-summary {
    flex-direction: column;
    gap: 12px;
  }
  
  .summary-item {
    text-align: left;
    padding: 8px 0;
    border-bottom: 1px solid #F1F5F9;
  }
  
  .summary-value {
    font-size: 20px;
  }
  
  .warning-item {
    flex-direction: column;
    gap: 8px;
  }
  
  .warning-meta {
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
  }
  
  .warning-time {
    margin-bottom: 0;
  }
}

@media screen and (max-width: 480px) {
  .analysis-card {
    padding: 12px;
  }
  
  .analysis-title h3 {
    font-size: 14px;
  }
  
  .analysis-item {
    padding: 12px;
  }
  
  .analysis-value {
    font-size: 20px;
  }
  
  .chart-card {
    padding: 12px;
  }
  
  .card-title {
    font-size: 14px;
  }
  
  .chart {
    height: 160px;
  }
}
</style>