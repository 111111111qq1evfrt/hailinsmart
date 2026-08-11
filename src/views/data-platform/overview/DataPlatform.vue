<template>
  <div class="data-platform">

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ stats.totalStudents.toLocaleString() }}</span>
        <span class="stat-label">在校学生总数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :class="getValueColorClass(stats.passRate)">{{ stats.passRate }}%</span>
        <span class="stat-label">总体达标率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :class="getValueColorClass(stats.excellentRate)">{{ stats.excellentRate }}%</span>
        <span class="stat-label">优秀率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.todayActive.toLocaleString() }}</span>
        <span class="stat-label">实时运动人次</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-main">
          <span class="stat-num">{{ stats.todaySportsCount.toLocaleString() }}</span>
          <span class="stat-sub">{{ stats.todaySportsRate }}%</span>
        </div>
        <span class="stat-label">今日运动人数/占比</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-main">
          <span class="stat-num">{{ stats.yesterdaySportsCount.toLocaleString() }}</span>
          <span class="stat-sub">{{ stats.yesterdaySportsRate }}%</span>
        </div>
        <span class="stat-label">昨日运动人数/占比</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-main">
          <span class="stat-num">{{ stats.improvementCount.toLocaleString() }}</span>
          <span class="stat-sub stat-good">+{{ stats.improvementRate }}%</span>
        </div>
        <span class="stat-label">成绩提升人次/增幅</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <div class="stat-main">
          <span class="stat-num">{{ stats.avgExerciseCount }}</span>
          <span class="stat-sub stat-primary">+{{ stats.exerciseRate }}%</span>
        </div>
        <span class="stat-label">人均运动次数/增幅</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.monthTotal.toLocaleString() }}</span>
        <span class="stat-label">本月运动人次</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.termTotal.toLocaleString() }}</span>
        <span class="stat-label">学期运动人次</span>
      </div>
    </div>

    <!-- 第一行图表 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">达标率趋势</span>
          <div class="time-tabs">
            <el-button 
              v-for="tab in timeTabs" 
              :key="tab.value"
              :class="['time-tab', { active: activeTimeTab === tab.value }]"
              @click="activeTimeTab = tab.value"
            >{{ tab.label }}</el-button>
          </div>
        </div>
        <div ref="trendChart" class="chart"></div>
      </div>
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">运动项目分布</span>
        </div>
        <div ref="projectChart" class="chart"></div>
      </div>
    </div>

    <!-- 第二行图表 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">年级达标率对比</span>
        </div>
        <div ref="gradeChart" class="chart"></div>
      </div>
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">今日运动热力图</span>
        </div>
        <div ref="heatmapChart" class="chart heatmap-chart"></div>
      </div>
    </div>

    <!-- 第三行图表：成绩提升与运动次数趋势 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">全校成绩提升人次趋势</span>
          <div class="time-tabs">
            <el-button 
              v-for="tab in timeTabs" 
              :key="tab.value"
              :class="['time-tab', { active: activeTimeTab === tab.value }]"
              @click="activeTimeTab = tab.value"
            >{{ tab.label }}</el-button>
          </div>
        </div>
        <div ref="improvementChart" class="chart"></div>
      </div>
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">全校人均运动次数趋势</span>
        </div>
        <div ref="exerciseChart" class="chart"></div>
      </div>
    </div>

    <!-- 校园运动风云榜 -->
    <div class="list-card">
      <div class="card-header">
        <span class="card-title">校园运动风云榜</span>
        <el-button text :icon="View" class="view-all" @click="viewAllRanking">查看全部</el-button>
      </div>
      <ExamTable
        :data="rankingList"
        :columns="rankingColumns"
        :showHeader="false"
        :searchable="false"
        :showRefresh="false"
        :showPagination="true"
        :defaultPageSize="10"
        :pageSizes="[10, 20, 50]"
        :actionWidth="0"
      >
        <template #rank="{ row }">
          <span :class="['rank-badge', getRankClass(row.rank)]">{{ row.rank }}</span>
        </template>
        <template #level="{ row }">
          <span :class="['level-tag', getLevelClass(row.level)]">{{ row.level }}</span>
        </template>
      </ExamTable>
    </div>

    <!-- 个人最好成绩展示 -->
    <div class="list-card">
      <div class="card-header">
        <span class="card-title">个人最好成绩</span>
        <div class="header-actions">
          <el-button type="primary" size="small" @click="showBestScoreModal = true">截图上屏</el-button>
        </div>
      </div>
      <div class="best-scores-grid">
        <div class="best-score-card" v-for="(project, idx) in personalBestScores" :key="idx">
          <div class="project-header">
            <span class="project-name">{{ project.name }}</span>
          </div>
          <div class="top-students">
            <div class="student-row" v-for="(student, sIdx) in project.top3" :key="sIdx">
              <span :class="['medal', `medal-${sIdx + 1}`]">{{ ['🥇', '🥈', '🥉'][sIdx] }}</span>
              <span class="student-name">{{ student.name }}</span>
              <span class="student-class">{{ student.class }}</span>
              <span class="student-score">{{ student.score }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预警规则配置入口 -->
    <div class="list-card">
      <div class="card-header">
        <span class="card-title">预警规则配置</span>
        <el-button type="primary" size="small" @click="showWarningRuleDialog = true">配置规则</el-button>
      </div>
      <div class="warning-rules-list">
        <div class="rule-item" v-for="rule in warningRules" :key="rule.id">
          <div class="rule-info">
            <span class="rule-name">{{ rule.name }}</span>
            <span class="rule-condition">{{ rule.condition }}</span>
          </div>
          <div class="rule-status">
            <el-tag :type="rule.enabled ? 'success' : 'info'" size="small">{{ rule.enabled ? '已启用' : '已禁用' }}</el-tag>
          </div>
          <div class="rule-actions">
            <el-button text type="primary" size="small" @click="editRule(rule)">编辑</el-button>
            <el-button text type="danger" size="small" @click="deleteRule(rule.id)">删除</el-button>
          </div>
        </div>
        <div class="empty-rules" v-if="warningRules.length === 0">
          <p>暂无预警规则，点击"配置规则"添加</p>
        </div>
      </div>
    </div>
  </div>

  <!-- 个人最好成绩截图弹窗 -->
  <el-dialog v-model="showBestScoreModal" title="个人最好成绩截图" width="700px">
    <div ref="bestScoreScreenshot" class="screenshot-content">
      <div class="screenshot-header">
        <h3>{{ schoolProfile.name }} - 个人最好成绩榜</h3>
        <p class="screenshot-date">生成时间：{{ currentDate }}</p>
      </div>
      <div class="screenshot-grid">
        <div class="screenshot-project" v-for="(project, idx) in personalBestScores" :key="idx">
          <div class="sp-header"> {{ project.name }}</div>
          <div class="sp-students">
            <div class="sp-row" v-for="(student, sIdx) in project.top3" :key="sIdx">
              <span class="sp-rank">{{ ['🥇', '🥈', '🥉'][sIdx] }}</span>
              <span class="sp-name">{{ student.name }}</span>
              <span class="sp-class">{{ student.class }}</span>
              <span class="sp-score">{{ student.score }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="showBestScoreModal = false">关闭</el-button>
      <el-button type="primary" @click="captureScreenshot">保存截图</el-button>
    </template>
  </el-dialog>

  <!-- 预警规则配置弹窗 -->
  <el-dialog v-model="showWarningRuleDialog" :title="editingRule ? '编辑预警规则' : '新增预警规则'" width="500px">
    <el-form :model="ruleForm" label-width="100px">
      <el-form-item label="规则名称">
        <el-input v-model="ruleForm.name" placeholder="如：达标率预警" />
      </el-form-item>
      <el-form-item label="预警类型">
        <el-select v-model="ruleForm.type" placeholder="请选择">
          <el-option label="达标率预警" value="pass_rate" />
          <el-option label="优秀率预警" value="excellent_rate" />
          <el-option label="运动时长预警" value="exercise_duration" />
          <el-option label="请假率预警" value="leave_rate" />
        </el-select>
      </el-form-item>
      <el-form-item label="触发条件">
        <div class="condition-row">
          <el-select v-model="ruleForm.operator" style="width: 80px">
            <el-option label=">" value=">" />
            <el-option label="<" value="<" />
            <el-option label=">=" value=">=" />
            <el-option label="<=" value="<=" />
            <el-option label="=" value="=" />
          </el-select>
          <el-input-number v-model="ruleForm.threshold" :min="0" :max="100" style="width: 120px" />
          <span class="condition-unit">%</span>
        </div>
      </el-form-item>
      <el-form-item label="通知方式">
        <el-checkbox-group v-model="ruleForm.notifyMethods">
          <el-checkbox label="system">系统通知</el-checkbox>
          <el-checkbox label="email">邮件</el-checkbox>
          <el-checkbox label="sms">短信</el-checkbox>
        </el-checkbox-group>
      </el-form-item>
      <el-form-item label="启用状态">
        <el-switch v-model="ruleForm.enabled" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="showWarningRuleDialog = false">取消</el-button>
      <el-button type="primary" @click="saveRule">保存</el-button>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { View } from '@element-plus/icons-vue'
import echarts from '@/utils/echarts'
import { useRouter } from 'vue-router'
import ExamTable from '../../../components/table/ExamTable.vue'
import store from '../../../store/global'
import { getSchoolMockData } from '../../../utils/mockDataLoader'
import { getSchoolProfile } from '@/mock/school-data/schoolProfiles'
import { usePersistedRef } from '../../../composables/usePersistedRef'
import { getValueColorClass } from '@/utils/format'
import { calculateSchoolStats, calculateStudentRanking, generateTrendData, generateHeatmapData } from '@/utils/statistics'
import { createSeededRandom, generateDeterministicId } from '@/utils/seededRandom'

const router = useRouter()

const schoolId = store.state.school.id || 'hailin-second-primary'
const schoolProfile = computed(() => getSchoolProfile(schoolId))

const getStudents = () => {
  const key = `students_${schoolId}`
  const stored = sessionStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  const schoolData = getSchoolMockData(schoolId)
  return schoolData.students || []
}

const getTestResults = () => {
  const key = `smart_pe_imported_national_test_${schoolId}`
  const stored = sessionStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  const schoolData = getSchoolMockData(schoolId)
  return schoolData.nationalTestResults || []
}

const getExamResults = () => {
  const key = `exam_results_${schoolId}`
  const stored = sessionStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  const schoolData = getSchoolMockData(schoolId)
  return schoolData.examResults || []
}

const students = ref(getStudents())
const testResults = ref(getTestResults())
const examResults = ref(getExamResults())

const dynamicStats = computed(() => {
  return calculateSchoolStats(students.value, testResults.value, examResults.value, schoolProfile.value)
})

const stats = usePersistedRef(`smart_pe_data_platform_stats_${schoolId}`, dynamicStats.value)

watch([students, testResults, examResults], () => {
  const newStats = calculateSchoolStats(students.value, testResults.value, examResults.value, schoolProfile.value)
  Object.assign(stats.value, newStats)
}, { deep: true })

const timeTabs = [
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本学期', value: 'term' }
]

const activeTimeTab = usePersistedRef(`smart_pe_data_platform_time_tab_${schoolId}`, 'month')

const defaultRankingList = computed(() => {
  return calculateStudentRanking(students.value, testResults.value).slice(0, 12)
})

const rankingList = usePersistedRef(`smart_pe_data_platform_ranking_${schoolId}`, [...defaultRankingList.value])

// 风云榜列配置 - 使用 minWidth 让表格自适应填满
const rankingColumns = ref([
  { prop: 'rank', label: '排名', slot: 'rank', minWidth: '70', align: 'center' },
  { prop: 'name', label: '姓名', minWidth: '100' },
  { prop: 'class', label: '班级', minWidth: '130' },
  { prop: 'project', label: '项目', minWidth: '120' },
  { prop: 'score', label: '成绩', minWidth: '100' },
  { prop: 'level', label: '等级', slot: 'level', minWidth: '90', align: 'center' }
])

// 分页 - 已移除，直接使用 rankingList

const trendChart = ref(null)
const projectChart = ref(null)
const gradeChart = ref(null)
const heatmapChart = ref(null)
const improvementChart = ref(null)
const exerciseChart = ref(null)

let trendChartInstance = null
let projectChartInstance = null
let gradeChartInstance = null
let heatmapChartInstance = null
let improvementChartInstance = null
let exerciseChartInstance = null

const getRankClass = (rank) => {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  return ''
}

const getLevelClass = (level) => {
  const map = { '优秀': 'excellent', '良好': 'good', '及格': 'pass', '不及格': 'fail' }
  return map[level] || ''
}

const viewAllRanking = () => {
  router.push('/sports-ranking')
}

const initTrendChart = () => {
  if (!trendChart.value) return
  if (trendChartInstance) { trendChartInstance.dispose(); trendChartInstance = null }
  trendChartInstance = echarts.init(trendChart.value)
  trendChartInstance.showLoading()

  const basePassRate = (stats.value && stats.value.passRate > 0) ? stats.value.passRate : 85
  const baseExcellentRate = (stats.value && stats.value.excellentRate > 0) ? stats.value.excellentRate : 35

  const data = generateTrendData(basePassRate, activeTimeTab.value, 'up')
  
  let xAxisData = ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周', '第9周', '第10周', '第11周', '第12周']
  if (activeTimeTab.value === 'week') {
    xAxisData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  } else if (activeTimeTab.value === 'term') {
    xAxisData = ['第1月', '第2月', '第3月', '第4月', '第5月', '第6月', '第7月', '第8月', '第9月', '第10月', '第11月', '第12月']
  }

  // 防止除零：当达标率为0时优良率比例无意义
  const excellentRatio = basePassRate > 0 ? baseExcellentRate / basePassRate : 0.4

  // 计算数据范围用于自适应y轴
  const allValues = [...data, ...data.map(v => Math.round(v * excellentRatio))]
  const dataMin = Math.min(...allValues)
  const dataMax = Math.max(...allValues)
  const yMin = Math.floor(dataMin / 10) * 10
  const yMax = Math.ceil(dataMax / 10) * 10 + 10

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: xAxisData, axisLabel: { color: '#6B7280', fontSize: 11 } },
    yAxis: { 
      type: 'value', 
      min: yMin, 
      max: yMax, 
      axisLabel: { formatter: '{value}%', color: '#6B7280', fontSize: 11 } 
    },
    series: [
      {
        name: '达标率',
        type: 'line',
        data: data,
        smooth: true,
        lineStyle: { color: '#1E5AA8', width: 3 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(30, 90, 168, 0.2)' }, { offset: 1, color: 'rgba(30, 90, 168, 0.02)' }]) },
        itemStyle: { color: '#1E5AA8' }
      },
      {
        name: '优良率',
        type: 'line',
        data: data.map(v => Math.round(v * excellentRatio)),
        smooth: true,
        lineStyle: { color: '#3B82F6', width: 2, type: 'dashed' },
        itemStyle: { color: '#3B82F6' }
      }
    ]
  }

  trendChartInstance.setOption(option)
  trendChartInstance.hideLoading()
}

const initProjectChart = () => {
  if (!projectChart.value) return
  if (projectChartInstance) { projectChartInstance.dispose(); projectChartInstance = null }
  projectChartInstance = echarts.init(projectChart.value)
  projectChartInstance.showLoading()

  // 从 rankingList 动态统计各项目出现次数
  const projectCount = {}
  rankingList.value.forEach(item => {
    projectCount[item.project] = (projectCount[item.project] || 0) + 1
  })
  const colors = ['#1E5AA8', '#3B82F6', '#F5A623', '#E85D4E', '#8B5CF6', '#FF9900', '#FF6600', '#22C55E', '#06B6D4']
  const chartData = Object.entries(projectCount).map(([name, value], idx) => ({
    value, name,
    itemStyle: { color: colors[idx % colors.length] }
  }))

  if (!chartData || chartData.length === 0) {
    projectChartInstance.setOption({ graphic: { type: 'text', left: 'center', top: 'center', text: '暂无运动项目数据', style: { fontSize: 14, fill: '#999' } } })
    projectChartInstance.hideLoading()
    return
  }

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { color: '#6B7280', fontSize: 12 } },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: chartData
    }]
  }

  projectChartInstance.setOption(option)
  projectChartInstance.hideLoading()
}

const initGradeChart = () => {
  if (!gradeChart.value) return
  if (gradeChartInstance) { gradeChartInstance.dispose(); gradeChartInstance = null }
  gradeChartInstance = echarts.init(gradeChart.value)
  gradeChartInstance.showLoading()
  const random = createSeededRandom('data-platform-grade-chart')

  const gradeOrder = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
  const classRanking = schoolProfile.value.studentData.classRanking || []
  
  const gradeScores = {}
  classRanking.forEach(item => {
    const grade = gradeOrder.find(g => (item.className || '').startsWith(g))
    if (grade) {
      if (!gradeScores[grade]) gradeScores[grade] = []
      gradeScores[grade].push(item.passRate || item.avgScore || 80)
    }
  })
  
  const chartData = gradeOrder.map(g => {
    if (gradeScores[g] && gradeScores[g].length > 0) {
      return Math.round(gradeScores[g].reduce((a, b) => a + b, 0) / gradeScores[g].length)
    }
    return Math.round((stats.value.passRate || 85) + (random() * 6 - 3))
  })

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: gradeOrder, axisLabel: { color: '#6B7280', fontSize: 11 } },
    yAxis: { type: 'value', min: 60, max: 100, axisLabel: { formatter: '{value}%', color: '#6B7280', fontSize: 11 } },
    series: [{
      type: 'bar',
      data: chartData,
      barWidth: '40%',
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#1E5AA8' },
        { offset: 1, color: '#3B82F6' }
      ])
    }]
  }

  gradeChartInstance.setOption(option)
  gradeChartInstance.hideLoading()
}

const initHeatmapChart = () => {
  if (!heatmapChart.value) return
  if (heatmapChartInstance) { heatmapChartInstance.dispose(); heatmapChartInstance = null }
  heatmapChartInstance = echarts.init(heatmapChart.value)
  heatmapChartInstance.showLoading()

  const baseActive = stats.value.todayActive || 234
  const { hours, days, data } = generateHeatmapData(baseActive)

  const option = {
    tooltip: { position: 'top' },
    grid: { left: '12%', right: '5%', bottom: '18%', top: '5%' },
    xAxis: { 
      type: 'category', 
      data: hours, 
      splitArea: { show: true },
      axisLabel: { color: '#6B7280', fontSize: 11 }
    },
    yAxis: { 
      type: 'category', 
      data: days, 
      splitArea: { show: true },
      axisLabel: { color: '#6B7280', fontSize: 11 }
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '2%',
      itemWidth: 12,
      itemHeight: 100,
      inRange: {
        color: ['#DCFCE7', '#86EFAC', '#22C55E', '#16A34A', '#F5A623', '#E85D4E']
      }
    },
    series: [{
      name: '运动人数',
      type: 'heatmap',
      data: data,
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
    }]
  }

  heatmapChartInstance.setOption(option)
  heatmapChartInstance.hideLoading()
}

const initImprovementChart = () => {
  if (!improvementChart.value) return
  if (improvementChartInstance) { improvementChartInstance.dispose(); improvementChartInstance = null }
  improvementChartInstance = echarts.init(improvementChart.value)
  improvementChartInstance.showLoading()

  const baseCount = (stats.value && stats.value.improvementCount > 0) ? stats.value.improvementCount : 1256
  // 根据时间维度调整基准值，避免除以12后值太小导致平线
  let baseValue
  if (activeTimeTab.value === 'week') {
    baseValue = Math.max(Math.round(baseCount / 52), 20)
  } else if (activeTimeTab.value === 'term') {
    baseValue = Math.max(Math.round(baseCount / 12), 80)
  } else {
    baseValue = Math.max(Math.round(baseCount / 12), 80)
  }
  const data = generateTrendData(baseValue, activeTimeTab.value, 'up')
  
  let xAxisData = ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周', '第9周', '第10周', '第11周', '第12周']
  if (activeTimeTab.value === 'week') {
    xAxisData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  } else if (activeTimeTab.value === 'term') {
    xAxisData = ['第1月', '第2月', '第3月', '第4月', '第5月', '第6月', '第7月', '第8月', '第9月', '第10月', '第11月', '第12月']
  }

  // 自适应y轴上限
  const dataMax = Math.max(...data)
  const yMaxVal = Math.ceil(dataMax / 10) * 10 + 10

  const option = {
    tooltip: { trigger: 'axis', formatter: '{b}: {c} 人次' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: xAxisData, axisLabel: { color: '#6B7280', fontSize: 11 } },
    yAxis: { 
      type: 'value', 
      min: 0, 
      max: yMaxVal, 
      axisLabel: { color: '#6B7280', fontSize: 11 } 
    },
    series: [
      {
        name: '提升人次',
        type: 'line',
        data: data,
        smooth: true,
        lineStyle: { color: '#1E5AA8', width: 3 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(30, 90, 168, 0.2)' }, { offset: 1, color: 'rgba(30, 90, 168, 0.02)' }]) },
        itemStyle: { color: '#1E5AA8' }
      }
    ]
  }

  improvementChartInstance.setOption(option)
  improvementChartInstance.hideLoading()
}

const initExerciseChart = () => {
  if (!exerciseChart.value) return
  if (exerciseChartInstance) { exerciseChartInstance.dispose(); exerciseChartInstance = null }
  exerciseChartInstance = echarts.init(exerciseChart.value)
  exerciseChartInstance.showLoading()

  // 从 stats.avgExerciseCount 生成月均运动次数数据
  const baseAvg = stats.value.avgExerciseCount || 8.6
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const seasonal = Math.sin((i - 1) * Math.PI / 6) * 2.5
    return Math.round((baseAvg + seasonal) * 10) / 10
  })

  const option = {
    tooltip: { trigger: 'axis', formatter: '{b}: {c} 次/人' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'], axisLabel: { color: '#6B7280', fontSize: 11 } },
    yAxis: { type: 'value', min: 0, max: 15, axisLabel: { color: '#6B7280', fontSize: 11 } },
    series: [
      {
        name: '人均运动次数',
        type: 'bar',
        data: monthlyData,
        barWidth: '40%',
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#3B82F6' },
          { offset: 1, color: '#60A5FA' }
        ])
      }
    ]
  }

  exerciseChartInstance.setOption(option)
  exerciseChartInstance.hideLoading()
}

watch(activeTimeTab, () => {
  nextTick(() => {
    initTrendChart()
    initImprovementChart()
  })
})

watch([stats, rankingList], () => {
  nextTick(() => {
    initTrendChart()
    initProjectChart()
    initGradeChart()
    initHeatmapChart()
    initImprovementChart()
    initExerciseChart()
  })
}, { deep: true })

// ===== 个人最好成绩 =====
const showBestScoreModal = ref(false)
const bestScoreScreenshot = ref(null)

const currentDate = computed(() => {
  const d = new Date('2026-07-16T08:00:00')
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`
})

const personalBestScores = computed(() => {
  const projectIcons = {
    '50米跑': '🏃', '50米': '🏃',
    '坐位体前屈': '🤸',
    '一分钟跳绳': '🪢', '跳绳': '🪢',
    '仰卧起坐': '💪', '一分钟仰卧起坐': '💪',
    '立定跳远': '🦘',
    '800米跑': '🏃', '1000米跑': '🏃',
    '引体向上': '🏋️'
  }

  // 从 rankingList 中按项目分组取前三名
  const projectMap = {}
  rankingList.value.forEach(item => {
    const name = item.project || '综合'
    if (!projectMap[name]) projectMap[name] = []
    if (projectMap[name].length < 3) {
      projectMap[name].push({
        name: item.name,
        class: item.class,
        score: item.score
      })
    }
  })

  // 如果 rankingList 数据不足，用 mock 数据补充
  if (Object.keys(projectMap).length === 0) {
    const mockProjects = [
      { name: '50米跑', icon: '🏃', top3: [
        { name: '李明轩', class: '三年级2班', score: "7.8秒" },
        { name: '王思远', class: '四年级1班', score: "8.1秒" },
        { name: '张浩宇', class: '五年级3班', score: "8.3秒" }
      ]},
      { name: '一分钟跳绳', icon: '🪢', top3: [
        { name: '刘雨涵', class: '二年级1班', score: "168个" },
        { name: '陈诗琪', class: '三年级3班', score: "155个" },
        { name: '赵子涵', class: '四年级2班', score: "149个" }
      ]},
      { name: '坐位体前屈', icon: '🤸', top3: [
        { name: '孙悦', class: '五年级1班', score: "23.5cm" },
        { name: '周雨彤', class: '六年级2班', score: "21.8cm" },
        { name: '吴佳怡', class: '四年级3班', score: "20.2cm" }
      ]},
      { name: '仰卧起坐', icon: '💪', top3: [
        { name: '郑博文', class: '六年级1班', score: "52个" },
        { name: '黄子豪', class: '五年级2班', score: "48个" },
        { name: '林子墨', class: '四年级1班', score: "45个" }
      ]},
      { name: '立定跳远', icon: '🦘', top3: [
        { name: '杨浩宇', class: '三年级1班', score: "2.15m" },
        { name: '徐梓轩', class: '五年级3班', score: "2.08m" },
        { name: '马一诺', class: '六年级2班', score: "1.98m" }
      ]}
    ]
    return mockProjects
  }

  return Object.entries(projectMap).map(([name, top3]) => ({
    name,
    icon: projectIcons[name] || '🏅',
    top3
  }))
})

const captureScreenshot = () => {
  // Demo模式：使用打印功能保存
  ElMessage.success('截图已生成，可通过浏览器打印保存')
  window.print()
}

// ===== 预警规则配置 =====
const showWarningRuleDialog = ref(false)
const editingRule = ref(null)

const defaultWarningRules = [
  { id: 'rule_001', name: '达标率预警', type: 'pass_rate', condition: '< 60%', operator: '<', threshold: 60, enabled: true, notifyMethods: ['system'] },
  { id: 'rule_002', name: '优秀率预警', type: 'excellent_rate', condition: '< 20%', operator: '<', threshold: 20, enabled: true, notifyMethods: ['system'] },
  { id: 'rule_003', name: '运动时长预警', type: 'exercise_duration', condition: '< 30分钟', operator: '<', threshold: 30, enabled: false, notifyMethods: ['system'] }
]

const warningRulesKey = `smart_pe_warning_rules_${schoolId}`
const loadWarningRules = () => {
  const stored = sessionStorage.getItem(warningRulesKey)
  if (stored) {
    try { return JSON.parse(stored) } catch { return [...defaultWarningRules] }
  }
  return [...defaultWarningRules]
}
const warningRules = ref(loadWarningRules())

watch(warningRules, (val) => {
  sessionStorage.setItem(warningRulesKey, JSON.stringify(val))
}, { deep: true })

const ruleForm = ref({
  name: '',
  type: 'pass_rate',
  operator: '<',
  threshold: 60,
  notifyMethods: ['system'],
  enabled: true
})

const resetRuleForm = () => {
  ruleForm.value = {
    name: '',
    type: 'pass_rate',
    operator: '<',
    threshold: 60,
    notifyMethods: ['system'],
    enabled: true
  }
}

const editRule = (rule) => {
  editingRule.value = rule
  ruleForm.value = {
    name: rule.name,
    type: rule.type,
    operator: rule.operator || '<',
    threshold: rule.threshold || 60,
    notifyMethods: rule.notifyMethods ? [...rule.notifyMethods] : ['system'],
    enabled: rule.enabled
  }
  showWarningRuleDialog.value = true
}

const deleteRule = (ruleId) => {
  warningRules.value = warningRules.value.filter(r => r.id !== ruleId)
  ElMessage.success('规则已删除')
}

const saveRule = () => {
  if (!ruleForm.value.name) {
    ElMessage.warning('请输入规则名称')
    return
  }

  const typeLabels = {
    pass_rate: '达标率',
    excellent_rate: '优秀率',
    exercise_duration: '运动时长',
    leave_rate: '请假率'
  }
  const condition = `${ruleForm.value.operator} ${ruleForm.value.threshold}%`

  if (editingRule.value) {
    const idx = warningRules.value.findIndex(r => r.id === editingRule.value.id)
    if (idx !== -1) {
      warningRules.value[idx] = {
        ...warningRules.value[idx],
        name: ruleForm.value.name,
        type: ruleForm.value.type,
        condition,
        operator: ruleForm.value.operator,
        threshold: ruleForm.value.threshold,
        notifyMethods: [...ruleForm.value.notifyMethods],
        enabled: ruleForm.value.enabled
      }
    }
  } else {
    warningRules.value.unshift({
      id: generateDeterministicId('rule', ruleForm.value.name),
      name: ruleForm.value.name,
      type: ruleForm.value.type,
      condition,
      operator: ruleForm.value.operator,
      threshold: ruleForm.value.threshold,
      notifyMethods: [...ruleForm.value.notifyMethods],
      enabled: ruleForm.value.enabled
    })
  }

  showWarningRuleDialog.value = false
  editingRule.value = null
  resetRuleForm()
  ElMessage.success('规则已保存')
}

const handleResize = () => {
  trendChartInstance?.resize()
  projectChartInstance?.resize()
  gradeChartInstance?.resize()
  heatmapChartInstance?.resize()
  improvementChartInstance?.resize()
  exerciseChartInstance?.resize()
}

onMounted(() => {
  const newStats = calculateSchoolStats(students.value, testResults.value, examResults.value, schoolProfile.value)
  Object.assign(stats.value, newStats)

  initTrendChart()
  initProjectChart()
  initGradeChart()
  initHeatmapChart()
  initImprovementChart()
  initExerciseChart()

  window.addEventListener('resize', handleResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  if (trendChartInstance) trendChartInstance.dispose()
  if (projectChartInstance) projectChartInstance.dispose()
  if (gradeChartInstance) gradeChartInstance.dispose()
  if (heatmapChartInstance) heatmapChartInstance.dispose()
  if (improvementChartInstance) improvementChartInstance.dispose()
  if (exerciseChartInstance) exerciseChartInstance.dispose()
})
</script>

<style scoped>
.data-platform {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: #F7F8FA;
  min-height: 100vh;
}

.stat-item:hover {
  background: #F7F8FA;
  transform: translateY(-2px);
}

.stat-item .stat-main {
  display: flex;
  align-items: baseline;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}

.stat-item .stat-sub {
  font-size: clamp(14px, 1.5vw, 18px);
  font-weight: 600;
  color: #3B82F6;
}

/* 响应式媒体查询 */
@media screen and (max-width: 1920px) {
  .stats-row {
    grid-template-columns: repeat(5, 1fr);
  }
}

@media screen and (max-width: 1600px) {
  .stats-row {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media screen and (max-width: 1366px) {
  .stats-row {
    grid-template-columns: repeat(3, 1fr);
  }
  
  .chart {
    height: 250px;
  }
  
  .heatmap-chart {
    height: 280px;
  }
}

@media screen and (max-width: 1024px) {
  .data-platform {
    padding: 16px;
    gap: 16px;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    padding: 16px;
    gap: 12px;
  }
  
  .charts-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .chart-card {
    padding: 16px;
  }
  
  .chart {
    height: 220px;
  }
  
  .heatmap-chart {
    height: 260px;
  }
}

@media screen and (max-width: 768px) {
  .data-platform {
    padding: 12px;
    gap: 12px;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    padding: 12px;
    gap: 8px;
  }
  
  .stat-item {
    padding: 8px 4px;
  }
  
  .stat-item .stat-num {
    font-size: 18px;
  }
  
  .stat-item .stat-sub {
    font-size: 14px;
  }
  
  .stat-item .stat-label {
    font-size: 11px;
  }
  
  .chart-card {
    padding: 12px;
  }
  
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .card-title {
    font-size: 14px;
  }
  
  .chart {
    height: 200px;
  }
  
  .heatmap-chart {
    height: 240px;
  }
  
  .list-card {
    padding: 12px;
  }
}

@media screen and (max-width: 480px) {
  .stats-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    padding: 10px 12px;
  }
  
  .stat-item .stat-label {
    text-align: right;
  }
  
  .chart {
    height: 180px;
  }
  
  .heatmap-chart {
    height: 200px;
  }
}

/* 图表行 - 响应式布局 */
.charts-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

@media screen and (max-width: 1024px) {
  .charts-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media screen and (max-width: 768px) {
  .charts-row {
    gap: 12px;
  }
}

.chart-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

@media screen and (max-width: 768px) {
  .chart-card {
    border-radius: 8px;
  }
}

.time-tabs {
  display: flex;
  gap: 8px;
}

.time-tab {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 16px;
  border: 1px solid #E8EAED;
  background: #FFFFFF;
  color: #6B7280;
}

.time-tab.active {
  background: #1E5AA8;
  color: #FFFFFF;
  border-color: #1E5AA8;
}

.chart {
  height: 280px;
}

.heatmap-chart {
  height: 320px;
}

/* 列表卡片 */
.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  width: 100%;
  box-sizing: border-box;
}

.ranking-card {
  width: 100%;
}

.ranking-card :deep(.el-table) {
  width: 100% !important;
}

.ranking-card :deep(.el-table__inner-wrapper) {
  width: 100% !important;
}

.ranking-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EAED;
}

.ranking-card .card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.ranking-card .view-all {
  color: #1E5AA8;
}

.view-all {
  color: #1E5AA8;
  font-size: 13px;
}

/* 排名徽章样式 */
.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 13px;
  font-weight: 700;
  background: #F3F4F6;
  color: #6B7280;
}

.rank-badge.gold {
  background: #FCD34D;
  color: #92400E;
}

.rank-badge.silver {
  background: #E5E7EB;
  color: #4B5563;
}

.rank-badge.bronze {
  background: #F59E0B;
  color: #78350F;
}

/* 等级标签样式 */
.level-tag {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.level-tag.excellent {
  background: #DCFCE7;
  color: #166534;
}

.level-tag.good {
  background: #DBEAFE;
  color: #1E40AF;
}

.level-tag.pass {
  background: #FEF3C7;
  color: #92400E;
}

.level-tag.fail {
  background: #FEE2E2;
  color: #991B1B;
}

/* ===== 个人最好成绩 ===== */
.best-scores-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}

.best-score-card {
  background: #F9FAFB;
  border-radius: 10px;
  padding: 16px;
  border: 1px solid #E8EAED;
  transition: box-shadow 0.2s;
}

.best-score-card:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.project-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E8EAED;
}

.project-icon {
  font-size: 20px;
}

.project-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.top-students {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.student-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.medal {
  font-size: 16px;
  flex-shrink: 0;
}

.student-row .student-name {
  font-weight: 500;
  color: #1A1A2E;
  min-width: 50px;
}

.student-row .student-class {
  color: #6B7280;
  flex: 1;
  font-size: 12px;
}

.student-row .student-score {
  font-weight: 600;
  color: #1E5AA8;
  white-space: nowrap;
}

/* ===== 截图弹窗 ===== */
.screenshot-content {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 24px;
}

.screenshot-header {
  text-align: center;
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 2px solid #1E5AA8;
}

.screenshot-header h3 {
  font-size: 18px;
  font-weight: 700;
  color: #1A1A2E;
  margin: 0 0 8px 0;
}

.screenshot-date {
  font-size: 13px;
  color: #6B7280;
  margin: 0;
}

.screenshot-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.screenshot-project {
  background: #F9FAFB;
  border-radius: 8px;
  padding: 12px;
}

.sp-header {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 8px;
  padding-bottom: 6px;
  border-bottom: 1px solid #E8EAED;
}

.sp-students {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.sp-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
}

.sp-rank {
  font-size: 14px;
}

.sp-name {
  font-weight: 500;
  color: #1A1A2E;
}

.sp-class {
  color: #6B7280;
  flex: 1;
}

.sp-score {
  font-weight: 600;
  color: #1E5AA8;
}

/* ===== 预警规则配置 ===== */
.header-actions {
  display: flex;
  gap: 8px;
}

.warning-rules-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rule-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #F9FAFB;
  border-radius: 8px;
  border: 1px solid #E8EAED;
  transition: background 0.2s;
}

.rule-item:hover {
  background: #F3F4F6;
}

.rule-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.rule-name {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.rule-condition {
  font-size: 12px;
  color: #6B7280;
}

.rule-status {
  margin: 0 16px;
}

.rule-actions {
  display: flex;
  gap: 4px;
}

.empty-rules {
  text-align: center;
  padding: 32px 16px;
  color: #9CA3AF;
}

.empty-rules p {
  margin: 0;
  font-size: 14px;
}

/* ===== 预警规则弹窗 ===== */
.condition-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.condition-unit {
  font-size: 14px;
  color: #6B7280;
}

/* ===== 响应式 - 个人最好成绩 ===== */
@media screen and (max-width: 1024px) {
  .best-scores-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 12px;
  }
}

@media screen and (max-width: 768px) {
  .best-scores-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 8px;
  }

  .best-score-card {
    padding: 12px;
  }

  .rule-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .rule-status {
    margin: 0;
  }

  .screenshot-grid {
    grid-template-columns: 1fr;
  }
}
</style>