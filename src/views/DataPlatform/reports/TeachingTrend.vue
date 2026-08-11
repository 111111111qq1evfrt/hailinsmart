<template>
  <div class="teaching-trend">

    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ overview.teachers }}</span>
        <span class="stat-label">体育教师数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ overview.courses }}</span>
        <span class="stat-label">课程总数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :class="getValueColorClass(overview.activityRate)">{{ overview.activityRate }}%</span>
        <span class="stat-label">课堂活跃度</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num stat-good">{{ overview.resourceUsage }}</span>
        <span class="stat-label">资源调用次数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num stat-good">{{ overview.completionRate }}%</span>
        <span class="stat-label">课程完成率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num stat-danger">{{ overview.alerts }}</span>
        <span class="stat-label">异常预警</span>
      </div>
    </div>

    <!-- 课程进度达成率滚动监看 -->
    <div class="progress-monitor">
      <div class="monitor-header">
        <h3>课程进度达成率实时监控</h3>
      </div>
      <div class="progress-content">
        <div class="progress-summary">
          <div class="summary-card">
            <span class="summary-value">{{ progressStats.overallRate }}%</span>
            <span class="summary-label">总体达成率</span>
          </div>
          <div class="summary-card">
            <span class="summary-value good">{{ progressStats.onSchedule }}</span>
            <span class="summary-label">正常进度</span>
          </div>
          <div class="summary-card">
            <span class="summary-value warning">{{ progressStats.warning }}</span>
            <span class="summary-label">进度滞后</span>
          </div>
          <div class="summary-card">
            <span class="summary-value danger">{{ progressStats.delayed }}</span>
            <span class="summary-label">严重滞后</span>
          </div>
        </div>
        <div class="progress-scroll-area">
          <div class="progress-list">
            <div v-for="item in progressList" :key="item.id" class="progress-item" :class="getProgressClass(item.rate)">
              <div class="progress-info">
                <span class="progress-name">{{ item.className }}</span>
                <span class="progress-detail">{{ item.progress }}/{{ item.total }} 课时</span>
              </div>
              <div class="progress-bar-wrapper">
                <div class="progress-bar" :style="{ width: item.rate + '%', backgroundColor: getProgressColor(item.rate) }"></div>
              </div>
              <span class="progress-rate">{{ item.rate }}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 异常教学数据预警 -->
    <div class="alert-panel">
      <div class="alert-header">
        <h3>异常教学数据预警</h3>
        <span class="alert-count" :class="{ active: alertList.length > 0 }">{{ alertList.length }}</span>
      </div>
      <div class="alert-list">
        <div v-for="(alert, index) in alertList" :key="index" class="alert-item" :class="alert.level">
          <div class="alert-icon">
            <WarnTriangleFilled v-if="alert.level === 'danger'" />
            <WarningFilled v-else-if="alert.level === 'warning'" />
            <InfoFilled v-else />
          </div>
          <div class="alert-content">
            <div class="alert-title">{{ alert.title }}</div>
            <div class="alert-desc">{{ alert.description }}</div>
            <div class="alert-meta">
              <span class="alert-time">{{ alert.time }}</span>
              <span class="alert-source">{{ alert.source }}</span>
            </div>
          </div>
          <div class="alert-action">
            <el-button text size="small" @click="handleAlert(alert)">处理</el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="main-content">
      <div class="left-section">
        <div class="content-card">
          <div class="card-header">
            <h3>课堂活跃度趋势</h3>
            <div class="time-filter">
              <el-button 
                v-for="tab in timeTabs" 
                :key="tab.value"
                :class="['filter-tab', { active: activeTime === tab.value }]"
                @click="activeTime = tab.value"
              >{{ tab.label }}</el-button>
            </div>
          </div>
          <div class="card-body">
            <div ref="activityChart" class="chart"></div>
          </div>
        </div>

        <div class="content-card">
          <div class="card-header">
            <h3>教师授课覆盖率</h3>
          </div>
          <div class="card-body">
            <div ref="coverageChart" class="chart"></div>
          </div>
        </div>
      </div>

      <div class="right-section">
        <div class="content-card">
          <div class="card-header">
            <h3>资源调用热力图</h3>
          </div>
          <div class="card-body">
            <div ref="resourceHeatmap" class="chart heatmap-chart"></div>
          </div>
        </div>

        <div class="content-card tab-card">
          <el-tabs v-model="activeRightTab" class="right-tabs">
            <el-tab-pane label="教学质量评分" name="quality">
              <div class="scrollable-content">
                <div class="quality-list">
                  <div v-for="item in qualityData" :key="item.name" class="quality-item">
                    <div class="quality-info">
                      <span class="quality-name">{{ item.name }}</span>
                      <span :class="['quality-score', getScoreClass(item.score)]">{{ item.score }}</span>
                    </div>
                    <el-progress :percentage="item.score" :color="getProgressColor(item.score)" :show-text="false" stroke-width="6" />
                  </div>
                </div>
              </div>
            </el-tab-pane>
            <el-tab-pane label="本周热门课程" name="courses">
              <div class="scrollable-content">
                <div class="course-list">
                  <div v-for="(course, index) in hotCourses" :key="course.name" class="course-item">
                    <span class="course-rank">{{ index + 1 }}</span>
                    <span class="course-name">{{ course.name }}</span>
                    <span class="course-count">{{ course.count }}次</span>
                  </div>
                </div>
              </div>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </div>

    <div class="bottom-section">
      <div class="content-card full-width">
        <div class="card-header">
          <h3>教师教学统计</h3>
          <el-button type="text" class="export-btn" @click="exportTeacherReport">导出报表</el-button>
        </div>
        <ExamTable
          :data="teacherStats"
          :columns="teacherColumns"
          :searchable="false"
          :show-pagination="true"
          :default-page-size="12"
        >
          <template #avgScore="{ row }">
            <span :class="getScoreClass(row.avgScore)">{{ row.avgScore }}</span>
          </template>
          <template #activity="{ row }">
            <div class="progress-wrapper">
              <el-progress :percentage="row.activity" :color="getProgressColor(row.activity)" :show-text="false" stroke-width="8" width="100%" />
              <span :class="['progress-text', getScoreClass(row.activity)]">{{ row.activity }}%</span>
            </div>
          </template>
          <template #action="{ row }">
            <el-button type="text" @click="viewTeacherDetail(row)">查看</el-button>
          </template>
        </ExamTable>
      </div>
    </div>

    <el-dialog v-model="teacherDialogVisible" title="教师详情" width="500px">
      <div v-if="selectedTeacher" class="teacher-detail">
        <div class="detail-header">
          <div class="teacher-avatar"><UserFilled /></div>
          <div class="teacher-info">
            <h4>{{ selectedTeacher.name }}</h4>
            <span class="teacher-classes">{{ selectedTeacher.classes }}</span>
          </div>
        </div>
        <div class="detail-stats">
          <div class="detail-stat">
            <span class="stat-label">本周课程</span>
            <span class="stat-value">{{ selectedTeacher.courses }}节</span>
          </div>
          <div class="detail-stat">
            <span class="stat-label">平均评分</span>
            <span :class="['stat-value', getScoreClass(selectedTeacher.avgScore)]">{{ selectedTeacher.avgScore }}</span>
          </div>
          <div class="detail-stat">
            <span class="stat-label">课堂活跃度</span>
            <span class="stat-value good">{{ selectedTeacher.activity }}%</span>
          </div>
          <div class="detail-stat">
            <span class="stat-label">覆盖学生</span>
            <span class="stat-value">{{ selectedTeacher.students }}人</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="teacherDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="exportTeacherReport">导出报表</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { WarnTriangleFilled, WarningFilled, InfoFilled, UserFilled } from '@element-plus/icons-vue'
import echarts from '@/utils/echarts'
import ExamTable from '@/components/table/ExamTable.vue'
import { usePersistedRef } from '@/composables/usePersistedRef'
import { getValueColorClass } from '@/utils/format'
import store from '@/store/global'
import { createSeededRandom } from '@/utils/seededRandom'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const overviewDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  return isZirong
    ? { teachers: 16, courses: 320, activityRate: 88, resourceUsage: 2156, completionRate: 82.5, alerts: 6 }
    : isLinhai
    ? { teachers: 22, courses: 420, activityRate: 94, resourceUsage: 3280, completionRate: 90.2, alerts: 3 }
    : { teachers: 28, courses: 520, activityRate: 92, resourceUsage: 3856, completionRate: 86.5, alerts: 5 }
})
const overview = usePersistedRef(computed(() => `smart_pe_teaching_overview_${schoolId.value}`), overviewDefault.value)

const activeProgressTab = ref('all')

const progressStatsDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  return isZirong
    ? { overallRate: 80.5, onSchedule: 18, warning: 5, delayed: 3 }
    : isLinhai
    ? { overallRate: 91.2, onSchedule: 22, warning: 3, delayed: 1 }
    : { overallRate: 86.5, onSchedule: 28, warning: 6, delayed: 2 }
})
const progressStats = usePersistedRef(computed(() => `smart_pe_teaching_progress_stats_${schoolId.value}`), progressStatsDefault.value)

const progressListDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  const classCounts = isZirong ? [2,2,2,2,2,2] : isLinhai ? [4,4,4,3,3,4] : [6,5,5,5,5,5]
  const gradeNames = ['一年级','二年级','三年级','四年级','五年级','六年级']
  const baseRate = isZirong ? 72 : isLinhai ? 85 : 78
  const result = []
  let id = 1
  // 取前12个班级
  for (let gi = 0; gi < 6 && result.length < 12; gi++) {
    for (let ci = 0; ci < classCounts[gi] && result.length < 12; ci++) {
      const seed = (gi * 7 + ci * 13) % 40
      const rate = Math.min(100, Math.max(40, baseRate + seed - 10))
      const progress = Math.round(40 * rate / 100)
      result.push({
        id: id++,
        className: `${gradeNames[gi]}${ci + 1}班`,
        progress,
        total: 40,
        rate
      })
    }
  }
  return result
})
const progressList = usePersistedRef(computed(() => `smart_pe_teaching_progress_list_${schoolId.value}`), progressListDefault.value)

// 异常预警数据 — 各校不同内容
const alertListDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  if (isZirong) {
    return [
      { level: 'danger', title: '空堂预警', description: '三年级2班体育课连续2节未签到，可能存在空堂情况', time: '5分钟前', source: '考勤系统' },
      { level: 'warning', title: '拖堂提醒', description: '四年级1班体育课超出规定时间12分钟', time: '20分钟前', source: '课程计时' },
      { level: 'danger', title: '设备故障', description: '排球训练区设备信号中断，请及时检修', time: '30分钟前', source: '设备监控' },
      { level: 'warning', title: '进度滞后', description: '五年级1班体育课程完成率仅58%，严重滞后于教学计划', time: '1小时前', source: '教学管理' },
      { level: 'info', title: '数据同步', description: '部分班级体测数据同步延迟超过1小时', time: '2小时前', source: '数据中心' }
    ]
  }
  if (isLinhai) {
    return [
      { level: 'danger', title: '空堂预警', description: '四年级3班体育课连续2节未签到，可能存在空堂情况', time: '8分钟前', source: '考勤系统' },
      { level: 'warning', title: '拖堂提醒', description: '二年级4班体育课超出规定时间10分钟', time: '15分钟前', source: '课程计时' },
      { level: 'danger', title: '设备故障', description: '游泳馆计时系统信号中断，请及时检修', time: '25分钟前', source: '设备监控' },
      { level: 'warning', title: '进度滞后', description: '五年级2班体育课程完成率仅62%，滞后于教学计划', time: '1小时前', source: '教学管理' },
      { level: 'info', title: '数据同步', description: '健康数据同步已完成，新增3条记录', time: '3小时前', source: '数据中心' }
    ]
  }
  return [
    { level: 'danger', title: '空堂预警', description: '四年级3班体育课连续2节未签到，可能存在空堂情况', time: '5分钟前', source: '考勤系统' },
    { level: 'warning', title: '拖堂提醒', description: '二年级1班体育课超出规定时间15分钟', time: '20分钟前', source: '课程计时' },
    { level: 'danger', title: '设备故障', description: '体测室B区摄像头信号中断，请及时检修', time: '30分钟前', source: '设备监控' },
    { level: 'warning', title: '进度滞后', description: '五年级2班体育课程完成率仅55%，严重滞后于教学计划', time: '1小时前', source: '教学管理' },
    { level: 'info', title: '数据同步', description: '部分班级体测数据同步延迟超过1小时', time: '2小时前', source: '数据中心' }
  ]
})
const alertList = usePersistedRef(computed(() => `smart_pe_teaching_alert_list_${schoolId.value}`), alertListDefault.value)

const getProgressClass = (rate) => {
  if (rate >= 85) return 'progress-excellent'
  if (rate >= 70) return 'progress-good'
  if (rate >= 60) return 'progress-warning'
  return 'progress-danger'
}

const handleAlert = (alert) => {
  ElMessage.success(`已处理预警: ${alert.title}`)
}

const timeTabs = [
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
  { label: '本学期', value: 'term' }
]

const activeTime = ref('month')
const activeRightTab = ref('quality')

const qualityDataDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  return isZirong
    ? [
        { name: '教学目标达成', score: 84 },
        { name: '课堂组织管理', score: 80 },
        { name: '师生互动质量', score: 82 },
        { name: '教学方法创新', score: 78 },
        { name: '教学效果评估', score: 83 }
      ]
    : isLinhai
    ? [
        { name: '教学目标达成', score: 95 },
        { name: '课堂组织管理', score: 92 },
        { name: '师生互动质量', score: 94 },
        { name: '教学方法创新', score: 90 },
        { name: '教学效果评估', score: 93 }
      ]
    : [
        { name: '教学目标达成', score: 92 },
        { name: '课堂组织管理', score: 88 },
        { name: '师生互动质量', score: 90 },
        { name: '教学方法创新', score: 85 },
        { name: '教学效果评估', score: 91 }
      ]
})
const qualityData = usePersistedRef(computed(() => `smart_pe_teaching_quality_data_${schoolId.value}`), qualityDataDefault.value)

const hotCoursesDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  return isZirong
    ? [
        { name: '排球垫球技巧', count: 128 },
        { name: '足球运球训练', count: 115 },
        { name: '跳绳基础训练', count: 108 },
        { name: '引体向上训练', count: 100 },
        { name: '50米跑提升', count: 96 },
        { name: '体能训练课', count: 88 }
      ]
    : isLinhai
    ? [
        { name: '游泳50米技巧', count: 168 },
        { name: '体操基础训练', count: 145 },
        { name: '武术套路练习', count: 132 },
        { name: '引体向上训练', count: 125 },
        { name: '跳绳提升课', count: 120 },
        { name: '体能训练课', count: 108 }
      ]
    : [
        { name: '立定跳远技巧', count: 156 },
        { name: '跳绳基础训练', count: 142 },
        { name: '50米跑提升', count: 138 },
        { name: '引体向上训练', count: 130 },
        { name: '仰卧起坐训练', count: 124 },
        { name: '体能训练课', count: 118 }
      ]
})
const hotCourses = usePersistedRef(computed(() => `smart_pe_teaching_hot_courses_${schoolId.value}`), hotCoursesDefault.value)

const teacherStatsDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  return isZirong
    ? [
        { name: '马老师', classes: '三年级(1-2)', courses: 10, avgScore: 88, activity: 90, students: 76 },
        { name: '李老师', classes: '四年级(1-2)', courses: 10, avgScore: 85, activity: 87, students: 72 },
        { name: '张老师', classes: '五年级(1-2)', courses: 9, avgScore: 82, activity: 84, students: 68 },
        { name: '赵老师', classes: '六年级(1-2)', courses: 9, avgScore: 86, activity: 88, students: 70 },
        { name: '孙老师', classes: '二年级(1-2)', courses: 10, avgScore: 84, activity: 86, students: 74 },
        { name: '周老师', classes: '一年级(1-2)', courses: 10, avgScore: 87, activity: 89, students: 78 }
      ]
    : isLinhai
    ? [
        { name: '杨老师', classes: '三年级(1-4)', courses: 12, avgScore: 94, activity: 96, students: 128 },
        { name: '朱老师', classes: '四年级(1-4)', courses: 11, avgScore: 91, activity: 93, students: 118 },
        { name: '林老师', classes: '五年级(1-3)', courses: 11, avgScore: 89, activity: 91, students: 108 },
        { name: '徐老师', classes: '六年级(1-4)', courses: 12, avgScore: 93, activity: 95, students: 132 },
        { name: '高老师', classes: '二年级(1-4)', courses: 11, avgScore: 90, activity: 92, students: 120 },
        { name: '何老师', classes: '一年级(1-4)', courses: 12, avgScore: 92, activity: 94, students: 136 }
      ]
    : [
        { name: '王老师', classes: '四年级(1-4)', courses: 12, avgScore: 95, activity: 98, students: 145 },
        { name: '李老师', classes: '三年级(1-3)', courses: 10, avgScore: 92, activity: 95, students: 118 },
        { name: '张老师', classes: '五年级(2-4)', courses: 11, avgScore: 89, activity: 92, students: 132 },
        { name: '刘老师', classes: '二年级(1-4)', courses: 12, avgScore: 91, activity: 94, students: 148 },
        { name: '陈老师', classes: '五年级(2-5)', courses: 10, avgScore: 88, activity: 88, students: 156 },
        { name: '赵老师', classes: '六年级(1-3)', courses: 8, avgScore: 93, activity: 96, students: 108 }
      ]
})
const teacherStats = usePersistedRef(computed(() => `smart_pe_teaching_teacher_stats_${schoolId.value}`), teacherStatsDefault.value)

const teacherColumns = ref([
  { prop: 'name', label: '教师姓名', minWidth: '120' },
  { prop: 'classes', label: '授课班级', minWidth: '120' },
  { prop: 'courses', label: '本周课程', minWidth: '100' },
  { slot: 'avgScore', label: '平均评分', minWidth: '100' },
  { slot: 'activity', label: '课堂活跃度', minWidth: '160' },
  { prop: 'students', label: '覆盖学生', minWidth: '100' },
  { slot: 'action', label: '详情', minWidth: '80' },
])

const currentPage = ref(1)
const pageSize = ref(12)

const paginatedTeacherStats = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return (teacherStats.value || []).slice(start, end)
})

const activityChart = ref(null)
const coverageChart = ref(null)
const resourceHeatmap = ref(null)

let activityChartInstance = null
let coverageChartInstance = null
let resourceHeatmapInstance = null

const teacherDialogVisible = ref(false)
const selectedTeacher = ref(null)

const getScoreClass = (score) => {
  if (score >= 90) return 'score-excellent'
  if (score >= 80) return 'score-good'
  if (score >= 60) return 'score-pass'
  return 'score-fail'
}

const getProgressColor = (rate) => {
  if (rate >= 90) return '#1E5AA8'
  if (rate >= 70) return '#3B82F6'
  if (rate >= 60) return '#F5A623'
  return '#E85D4E'
}

const viewTeacherDetail = (teacher) => {
  selectedTeacher.value = teacher
  teacherDialogVisible.value = true
}

const exportTeacherReport = () => {
  const headers = ['教师姓名', '授课班级', '本周课程', '平均评分', '课堂活跃度', '覆盖学生']
  const rows = teacherStats.value.map(t => [t.name, t.classes, t.courses, t.avgScore, t.activity + '%', t.students])
  const csv = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `教师教学统计报表_${new Date().toLocaleDateString('zh-CN')}.csv`
  link.click()
  URL.revokeObjectURL(url)
  ElMessage.success('教师教学统计报表已导出')
}

const initActivityChart = () => {
  if (!activityChart.value) return
  if (activityChartInstance) {
    activityChartInstance.dispose()
  }
  activityChartInstance = echarts.init(activityChart.value)
  activityChartInstance.showLoading()

  // 从 overview.activityRate 生成趋势数据
  const baseRate = overview.value.activityRate || 92

  const weekData = Array.from({ length: 7 }, (_, i) => Math.round(baseRate + Math.sin(i * 0.9) * 4))
  const monthData = Array.from({ length: 12 }, (_, i) => Math.round(baseRate - 5 + Math.sin(i * 0.5) * 5 + i * 0.5))
  const termData = Array.from({ length: 12 }, (_, i) => Math.round(baseRate - 12 + i * 1.5))

  let data = monthData
  let xAxisData = ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周', '第9周', '第10周', '第11周', '第12周']

  if (activeTime.value === 'week') {
    data = weekData
    xAxisData = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  } else if (activeTime.value === 'term') {
    data = termData
    xAxisData = ['9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月']
  }

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: xAxisData },
    yAxis: { type: 'value', min: 60, max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      {
        name: '课堂活跃度',
        type: 'line',
        data: data,
        smooth: true,
        lineStyle: { color: '#1E5AA8', width: 3 },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(45, 125, 70, 0.3)' }, { offset: 1, color: 'rgba(45, 125, 70, 0.05)' }]) },
        itemStyle: { color: '#1E5AA8' }
      }
    ]
  }

  activityChartInstance.setOption(option, true)
  activityChartInstance.hideLoading()
}

const initCoverageChart = () => {
  const random = createSeededRandom(schoolId.value + '_coverage')
  if (!coverageChart.value) return
  if (coverageChartInstance) { coverageChartInstance.dispose(); coverageChartInstance = null }
  coverageChartInstance = echarts.init(coverageChart.value)
  coverageChartInstance.showLoading()

  // 从 progressList 按年级分组计算平均完成率
  const gradeOrder = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
  const gradeRates = {}
  progressList.value.forEach(item => {
    const grade = gradeOrder.find(g => (item.className || '').startsWith(g))
    if (grade) {
      if (!gradeRates[grade]) gradeRates[grade] = []
      gradeRates[grade].push(item.rate)
    }
  })
  const existingGrades = gradeOrder.filter(g => gradeRates[g])
  const grades = existingGrades.length > 0 ? existingGrades : gradeOrder
  const chartData = grades.map(g => {
    if (gradeRates[g] && gradeRates[g].length > 0) {
      return Math.round(gradeRates[g].reduce((a, b) => a + b, 0) / gradeRates[g].length)
    }
    return Math.round((overview.value.completionRate || 86) + (random() * 6 - 3))
  })

  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { type: 'category', data: grades },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
    series: [{
      type: 'bar',
      data: chartData,
      itemStyle: { borderRadius: [4, 4, 0, 0] },
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#3B82F6' },
        { offset: 1, color: '#93C5FD' }
      ])
    }]
  }

  coverageChartInstance.setOption(option)
  coverageChartInstance.hideLoading()
}

const initResourceHeatmap = () => {
  const random = createSeededRandom(schoolId.value + '_heatmap')
  if (!resourceHeatmap.value) return
  if (resourceHeatmapInstance) { resourceHeatmapInstance.dispose(); resourceHeatmapInstance = null }
  resourceHeatmapInstance = echarts.init(resourceHeatmap.value)
  resourceHeatmapInstance.showLoading()

  const resources = ['视频教学', '课件资料', '训练计划', '考核标准', '安全指南']
  const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']

  // 基于 overview.resourceUsage 生成热力图数据
  const baseUsage = overview.value.resourceUsage || 3856
  const scaleFactor = Math.min(1.5, baseUsage / 3856)

  const data = []
  for (let i = 0; i < grades.length; i++) {
    for (let j = 0; j < resources.length; j++) {
      let base = Math.floor(50 * scaleFactor)
      if (j === 0 || j === 2) {
        base = Math.floor(75 * scaleFactor)
      }
      const value = Math.min(100, Math.max(0, base + Math.floor((random() - 0.5) * 30)))
      data.push([j, i, value])
    }
  }

  const option = {
    tooltip: { position: 'top' },
    grid: { left: '12%', right: '8%', bottom: '18%', top: '5%' },
    xAxis: { type: 'category', data: resources, splitArea: { show: true } },
    yAxis: { type: 'category', data: grades, splitArea: { show: true } },
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
        color: ['#F3F4F6', '#DCFCE7', '#86EFAC', '#22C55E', '#16A34A']
      }
    },
    series: [{
      name: '资源调用',
      type: 'heatmap',
      data: data,
      label: { show: false },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
    }]
  }

  resourceHeatmapInstance.setOption(option)
  resourceHeatmapInstance.hideLoading()
}

watch(activeTime, () => {
  nextTick(() => {
    initActivityChart()
  })
})

watch([overview, progressList], () => {
  nextTick(() => {
    initActivityChart()
    initCoverageChart()
    initResourceHeatmap()
  })
}, { deep: true })

onMounted(() => {
  initActivityChart()
  initCoverageChart()
  initResourceHeatmap()

  const handleResize = () => {
    activityChartInstance?.resize()
    coverageChartInstance?.resize()
    resourceHeatmapInstance?.resize()
  }
  window.addEventListener('resize', handleResize)

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
  })
})
</script>

<style scoped>
.teaching-trend {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: #F7F8FA;
  min-height: 100vh;
}

/* 课程进度监控面板 */
.progress-monitor {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.monitor-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EAED;
}

.monitor-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.monitor-tabs {
  display: flex;
  gap: 8px;
}

.monitor-tab {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 16px;
  border: 1px solid #E8EAED;
  background: #FFFFFF;
  color: #6B7280;
}

.monitor-tab.active {
  background: #1E5AA8;
  color: #FFFFFF;
  border-color: #1E5AA8;
}

.progress-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.progress-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.summary-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.summary-value {
  font-size: 24px;
  font-weight: 700;
  color: #1E5AA8;
}

.summary-value.good {
  color: #1E5AA8;
}

.summary-value.warning {
  color: #F5A623;
}

.summary-value.danger {
  color: #E85D4E;
}

.summary-label {
  font-size: 12px;
  color: #6B7280;
  margin-top: 4px;
}

.progress-scroll-area {
  max-height: 200px;
  overflow: hidden;
  position: relative;
}

.progress-list {
  animation: scrollUp 20s linear infinite;
}

.progress-list:hover {
  animation-play-state: paused;
}

@keyframes scrollUp {
  0% {
    transform: translateY(0);
  }
  100% {
    transform: translateY(-50%);
  }
}

.progress-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 8px;
  background: #F7F8FA;
  transition: background 0.2s;
}

.progress-item:hover {
  background: #EEF6FF;
}

.progress-item.progress-excellent {
  border-left: 3px solid #1E5AA8;
}

.progress-item.progress-good {
  border-left: 3px solid #3B82F6;
}

.progress-item.progress-warning {
  border-left: 3px solid #F5A623;
}

.progress-item.progress-danger {
  border-left: 3px solid #E85D4E;
}

.progress-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.progress-name {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.progress-detail {
  font-size: 12px;
  color: #6B7280;
}

.progress-bar-wrapper {
  flex: 1;
  height: 8px;
  background: #E8EAED;
  border-radius: 4px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.progress-rate {
  font-size: 14px;
  font-weight: 600;
  color: #1E5AA8;
  min-width: 45px;
  text-align: right;
}

/* 异常预警面板 */
.alert-panel {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EAED;
}

.alert-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.alert-count {
  background: #F3F4F6;
  color: #6B7280;
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 12px;
}

.alert-count.active {
  background: #FEE2E2;
  color: #E85D4E;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.7;
  }
}

.alert-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.alert-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  background: #F7F8FA;
  transition: all 0.2s;
}

.alert-item:hover {
  transform: translateX(4px);
}

.alert-item.danger {
  border-left: 4px solid #E85D4E;
}

.alert-item.warning {
  border-left: 4px solid #F5A623;
}

.alert-item.info {
  border-left: 4px solid #3B82F6;
}

.alert-icon {
  font-size: 20px;
  flex-shrink: 0;
}

.alert-item.danger .alert-icon {
  color: #E85D4E;
}

.alert-item.warning .alert-icon {
  color: #F5A623;
}

.alert-item.info .alert-icon {
  color: #3B82F6;
}

.alert-content {
  flex: 1;
}

.alert-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 4px;
}

.alert-desc {
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 8px;
  line-height: 1.5;
}

.alert-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #9CA3AF;
}

.alert-action {
  flex-shrink: 0;
}

.alert-action .el-button {
  padding: 4px 12px;
  font-size: 12px;
}

/* ===== 主内容区 ===== */
.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.left-section,
.right-section {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* ===== 卡片：直接固定高度 380px ===== */
.content-card {
  height: 380px;                    /* ← 固定高度 */
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

/* body 填充剩余空间 */
.card-body {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

/* 图表固定高度 */
.chart {
  width: 100%;
  height: 260px;
}

/* ===== Tab 卡片：同样 380px，内容可滚动 ===== */
.tab-card {
  padding: 0;
}

.tab-card :deep(.el-tabs) {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.tab-card :deep(.el-tabs__header) {
  margin: 0;
  padding: 16px 20px 0;
  border-bottom: 1px solid #E8EAED;
  flex-shrink: 0;
}

.tab-card :deep(.el-tabs__nav-wrap::after) {
  height: 1px;
  background-color: #E8EAED;
}

.tab-card :deep(.el-tabs__item) {
  font-size: 14px;
  font-weight: 500;
  color: #9CA3AF;
  padding: 0 16px;
  height: 40px;
  line-height: 40px;
}

.tab-card :deep(.el-tabs__item.is-active) {
  color: #1A1A2E;
  font-weight: 600;
}

.tab-card :deep(.el-tabs__active-bar) {
  background-color: #1E5AA8;
  height: 2px;
}

/* Tab 内容区 */
.tab-card :deep(.el-tabs__content) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.tab-card :deep(.el-tab-pane) {
  height: 100%;
  padding: 0;
}

/* 滚动内容容器 */
.scrollable-content {
  height: 100%;
  padding: 16px 20px 20px;
  overflow-y: auto;
  box-sizing: border-box;
}

/* 细滚动条 */
.scrollable-content::-webkit-scrollbar {
  width: 4px;
}

.scrollable-content::-webkit-scrollbar-track {
  background: transparent;
}

.scrollable-content::-webkit-scrollbar-thumb {
  background: #D1D5DB;
  border-radius: 2px;
}

.scrollable-content::-webkit-scrollbar-thumb:hover {
  background: #9CA3AF;
}

.content-card.full-width {
  grid-column: span 2;
  height: auto;                       /* 底部表格不固定高度 */
}

/* 底部表格 header */
.bottom-section .card-header {
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EAED;
}

.time-filter {
  display: flex;
  gap: 8px;
}

.filter-tab {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 16px;
  border: 1px solid #E8EAED;
  background: #FFFFFF;
  color: #6B7280;
}

.filter-tab.active {
  background: #1E5AA8;
  color: #FFFFFF;
  border-color: #1E5AA8;
}

.export-btn {
  color: #1E5AA8;
  font-size: 13px;
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

.quality-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quality-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quality-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.quality-name {
  font-size: 14px;
  color: #1A1A2E;
}

.quality-score {
  font-size: 14px;
  font-weight: 600;
}

.score-excellent {
  color: #1E5AA8;
}

.score-good {
  color: #3B82F6;
}

.score-pass {
  color: #F5A623;
}

.score-fail {
  color: #E85D4E;
}

.course-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.course-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: #F7F8FA;
  border-radius: 10px;
  transition: background 0.2s;
}

.course-item:hover {
  background: #EEF6FF;
}

.course-rank {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #1E5AA8;
  color: #FFFFFF;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.course-name {
  flex: 1;
  font-size: 14px;
  color: #1A1A2E;
}

.course-count {
  font-size: 13px;
  color: #6B7280;
}

.teacher-table {
  width: 100%;
}

.teacher-detail {
  padding: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8EAED;
  margin-bottom: 16px;
}

.teacher-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: #F0FDF4;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.teacher-avatar svg {
  width: 32px;
  height: 32px;
}

.teacher-info h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1A1A2E;
}

.teacher-classes {
  font-size: 13px;
  color: #6B7280;
}

.detail-stats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.detail-stat {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.detail-stat .stat-label {
  font-size: 12px;
  color: #6B7280;
}

.stat-value {
  font-size: 20px;
  font-weight: 600;
  color: #1A1A2E;
}

.stat-value.good {
  color: #1E5AA8;
}
</style>