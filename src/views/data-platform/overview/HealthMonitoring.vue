<template>
  <div class="health-monitoring">
    <div class="page-header">
      <div class="header-filters">
        <el-select v-model="selectedSchoolYear" placeholder="选择学年" style="width: 200px">
          <el-option label="2025-2026学年" value="2025-2026" />
          <el-option label="2024-2025学年" value="2024-2025" />
          <el-option label="2023-2024学年" value="2023-2024" />
        </el-select>
        <el-select v-model="selectedGrade" placeholder="选择年级" clearable style="width: 160px">
          <el-option label="一年级" value="一年级" />
          <el-option label="二年级" value="二年级" />
          <el-option label="三年级" value="三年级" />
          <el-option label="四年级" value="四年级" />
          <el-option label="五年级" value="五年级" />
          <el-option label="六年级" value="六年级" />
        </el-select>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num" :style="{ color: '#E85D4E' }">{{ stats.highRisk }}</span>
        <span class="stat-label">高风险病假</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: '#3B82F6' }">{{ stats.totalLeave }}</span>
        <span class="stat-label">本月请假</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: '#1E5AA8' }">{{ stats.attendanceRate }}%</span>
        <span class="stat-label">出勤率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: '#F5A623' }">{{ stats.feverCount }}</span>
        <span class="stat-label">发热学生</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: '#9CA3AF' }">{{ stats.recoveryPending }}</span>
        <span class="stat-label">待复课审核</span>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Calendar /></el-icon> 请假月度波动热力图</span>
        </div>
        <div class="heatmap-matrix">
          <div class="matrix-header-row">
            <span class="matrix-class-label">班级</span>
            <span v-for="m in heatmapMonths" :key="m" class="matrix-month-label">{{ m }}</span>
          </div>
          <template v-if="heatmapMatrix.length > 0">
            <div v-for="row in heatmapMatrix" :key="row.className" class="matrix-row">
              <span class="matrix-class-name">{{ row.className }}</span>
              <div
                v-for="(cell, idx) in row.cells"
                :key="idx"
                class="matrix-cell"
                :class="getHeatClass(cell)"
                :title="row.className + ' ' + heatmapMonths[idx] + ': ' + cell + '人请假'"
              >
                <span v-if="cell > 0" class="cell-num">{{ cell }}</span>
              </div>
            </div>
          </template>
          <el-empty v-else description="暂无请假数据" style="width: 100%; padding: 60px 0;" />
          <div class="heatmap-legend">
            <span>少</span>
            <div class="legend-item level-0"></div>
            <div class="legend-item level-1"></div>
            <div class="legend-item level-2"></div>
            <div class="legend-item level-3"></div>
            <div class="legend-item level-4"></div>
            <span>多</span>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Histogram /></el-icon> 请假类型分布</span>
        </div>
        <div ref="leaveTypeChart" class="chart"></div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><TrendCharts /></el-icon> 健康异常对出勤率影响趋势</span>
        </div>
        <div ref="attendanceTrendChart" class="chart"></div>
      </div>

      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><MapLocation /></el-icon> 高风险病假班级分布</span>
        </div>
        <div class="class-risk-list">
          <template v-if="highRiskClasses.length > 0">
            <div v-for="item in highRiskClasses" :key="item.className" class="class-risk-item">
              <div class="class-info">
                <span class="class-name">{{ item.className }}</span>
                <span class="class-count">{{ item.riskCount }}人高风险</span>
              </div>
              <div class="risk-bar">
                <div 
                  class="risk-fill" 
                  :style="{ width: item.riskRate + '%', backgroundColor: getRiskColor(item.riskRate) }"
                ></div>
              </div>
              <span class="risk-rate" :style="{ color: getRiskColor(item.riskRate) }">{{ item.riskRate }}%</span>
            </div>
          </template>
          <el-empty v-else description="暂无高风险病假班级数据" style="width: 100%; padding: 40px 0;" />
        </div>
      </div>
    </div>

    <div class="alert-card">
      <div class="card-header">
        <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Bell /></el-icon> 健康预警</span>
        <el-tag size="small" type="danger">{{ alerts.length }} 条预警</el-tag>
      </div>
      <el-table :data="alerts" class="w-full" :height="200" empty-text="暂无健康预警数据">
        <el-table-column prop="type" label="预警类型" width="120">
          <template #default="{ row }">
            <el-tag :type="row.type === 'highFever' ? 'danger' : row.type === 'outbreak' ? 'warning' : 'info'" size="small">
              {{ getAlertTypeText(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="content" label="预警内容" />
        <el-table-column prop="class" label="涉及班级" width="140" />
        <el-table-column prop="time" label="预警时间" width="140" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'processed' ? 'success' : 'danger'" size="small">
              {{ row.status === 'processed' ? '已处理' : '待处理' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button v-if="row.status !== 'processed'" link type="primary" size="small" @click="processAlert(row)">处理</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { Calendar, Histogram, TrendCharts, MapLocation, Bell } from '@element-plus/icons-vue'

import * as echarts from 'echarts'
import store from '@/store/global'
import { usePersistedRef } from '@/composables'
import { mockDB } from '@/mock'
import { getRealStudents, normalizeStudents } from '@/utils/realDataLoader'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const selectedSchoolYear = ref('2025-2026')
const selectedGrade = ref('')

const leaveTypeChart = ref(null)
const attendanceTrendChart = ref(null)
let leaveChartInstance = null
let trendChartInstance = null

const getAlertTypeText = (type) => ({ highFever: '高烧预警', outbreak: '传染病预警', absence: '缺勤预警', recovery: '复课异常' }[type] || type)

// Seeded random for attendance trend (still needed for that chart)
const seededRandom = (seed) => {
  let s = seed
  return () => {
    s = (s * 16807 + 0) % 2147483647
    return (s - 1) / 2147483646
  }
}
const getSchoolSeed = () => {
  const seeds = { 'hailin-second-primary': 101, 'hailin-zirong-primary': 202, 'linhai-experimental-primary': 303 }
  return seeds[schoolId.value] || 101
}

// Seeded random — same algorithm as LeaveApproval for deterministic shared data
const seededRng = (seed) => {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const getSchoolYear = (year, month) => {
  if (month >= 9 && month <= 12) return `${year}-${year + 1}`
  if (month >= 1 && month <= 7) return `${year - 1}-${year}`
  return `${year}-${year + 1}`
}

const generateDefaultApplications = () => {
  const sid = schoolId.value
  // 优先使用真实学生数据，回退到 mock 数据
  const realStudents = getRealStudents(sid)
  const students = realStudents.length > 0 ? normalizeStudents(realStudents) : (mockDB[sid]?.students || [])
  if (students.length === 0) return []
  const seedMap = { 'hailin-second-primary': 5001, 'hailin-zirong-primary': 6002, 'linhai-experimental-primary': 7003 }
  const rng = seededRng(seedMap[sid] || 5001)
  const totalBySchool = { 'hailin-second-primary': 90, 'hailin-zirong-primary': 65, 'linhai-experimental-primary': 110 }
  const total = totalBySchool[sid] || 90
  const mWeights = [6, 8, 12, 16, 14, 6, 4, 6, 10, 8, 4, 6]
  const tw = mWeights.reduce((a, b) => a + b, 0)
  const sickReasons = ['感冒发烧，医生建议休息', '急性肠胃炎', '扁桃体发炎', '水痘隔离期', '骨折恢复期', '过敏性哮喘发作', '病毒性感冒', '食物中毒观察期']
  const personalReasons = ['家中有事需处理', '参加亲属婚礼', '搬家需要协助', '家庭旅行', '回老家探亲']
  const urgentReasons = ['家庭突发紧急情况', '亲属住院需探望', '住所突发状况需处理']
  const otherReasons = ['复查预约', '牙科手术', '疫苗接种观察']
  const records = []
  
  for (let i = 0; i < total; i++) {
    let r = rng() * tw, mi = 0
    for (let m = 0; m < 12; m++) { r -= mWeights[m]; if (r <= 0) { mi = m; break } }
    const year = mi <= 3 ? 2025 : mi <= 6 ? 2024 : mi <= 9 ? 2023 : 2025
    const month = mi + 1
    const day = Math.floor(rng() * 27) + 1
    const schoolYear = getSchoolYear(year, month)
    const startDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const tr = rng()
    const type = tr < 0.45 ? 'sick' : tr < 0.75 ? 'personal' : tr < 0.90 ? 'urgent' : 'other'
    const student = students[i % students.length]
    const days = type === 'sick' ? Math.floor(rng() * 5) + 1 : type === 'urgent' ? 1 : Math.floor(rng() * 3) + 1
    const endDay = Math.min(day + days - 1, 28)
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`
    const sr = rng()
    const status = sr < 0.55 ? 'approved' : sr < 0.80 ? 'pending' : 'rejected'
    const approvalStep = status === 'approved'
      ? (type === 'sick' ? (days > 3 ? 5 : 4) : days <= 1 ? 2 : days <= 3 ? 3 : 4)
      : status === 'pending' ? 1 : 2
    const highRisk = type === 'sick' && rng() < 0.25
    const tempBase = highRisk ? 37.3 + rng() * 1.5 : 36.2 + rng() * 0.8
    const reason = type === 'sick' ? sickReasons[Math.floor(rng() * sickReasons.length)]
      : type === 'personal' ? personalReasons[Math.floor(rng() * personalReasons.length)]
      : type === 'urgent' ? urgentReasons[Math.floor(rng() * urgentReasons.length)]
      : otherReasons[Math.floor(rng() * otherReasons.length)]
    records.push({
      id: `LQ${startDate.replace(/-/g, '')}${String(i + 1).padStart(3, '0')}`,
      studentId: student.id, studentName: student.name, grade: student.grade, class: student.class,
      schoolYear, type, startDate, endDate, days, reason,
      vagueReason: reason.length < 6,
      parentSignature: student.name.charAt(0) + '先生/女士',
      status, submitTime: `${startDate} ${String(8 + Math.floor(rng() * 10)).padStart(2, '0')}:${String(Math.floor(rng() * 60)).padStart(2, '0')}`,
      approvalStep,
      teacherApprovalTime: status !== 'pending' ? `${startDate} 16:00` : '',
      leaderApprovalTime: status === 'approved' && days >= 2 ? `${startDate} 16:30` : '',
      deptApprovalTime: status === 'approved' && days > 3 ? `${startDate} 17:00` : '',
      doctorApprovalTime: (status === 'approved' && type === 'sick') ? `${startDate} 17:00` : '',
      rejectReason: status === 'rejected' ? '症状轻微，可边上学边观察' : '',
      temperatureRecords: type === 'sick' ? [
        Math.round(tempBase * 10) / 10,
        Math.round((tempBase + rng() * 0.5) * 10) / 10,
        Math.round((tempBase - rng() * 0.3) * 10) / 10
      ] : [],
      hasInfectiousHistory: type === 'sick' && rng() < 0.15,
      highRisk,
      returnStatus: status === 'approved' ? (rng() < 0.5 ? 'approved' : '') : '',
      returnTime: '', returnReminder: null,
      medicalProofs: type === 'sick' && rng() < 0.6 ? [{ name: '病历照片.jpg' }] : []
    })
  }
  return records
}

// Same sessionStorage key as LeaveApproval — ensures data consistency
const leaveApplications = usePersistedRef(
  computed(() => `leave_applications_${schoolId.value}`),
  generateDefaultApplications()
)

// Migration: old data may be empty or incomplete, or missing schoolYear field
if (!leaveApplications.value || leaveApplications.value.length < 15 || !leaveApplications.value[0]?.schoolYear) {
  leaveApplications.value = generateDefaultApplications()
}

// Filtered records: apply grade and school year filter
const filteredRecords = computed(() => {
  let records = leaveApplications.value
  if (selectedSchoolYear.value) {
    records = records.filter(r => r.schoolYear === selectedSchoolYear.value)
  }
  if (selectedGrade.value) {
    records = records.filter(r => r.grade === selectedGrade.value)
1  }
  return records
})

// Month index: 9月=0, 10月=1, ..., 7月=10
const getMonthIdx = (dateStr) => {
  const parts = dateStr.split('-')
  const m = parseInt(parts[1])
  return m >= 9 ? m - 9 : m + 3
}

const heatmapMonths = ['9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月', '5月', '6月', '7月']

// All derived data from filtered records
const stats = computed(() => {
  const records = filteredRecords.value
  const totalLeave = records.length
  const highRisk = records.filter(r => r.highRisk).length
  const feverCount = records.filter(r => r.type === 'sick' && r.temperatureRecords?.some(t => t >= 37.3)).length
  const recoveryPending = records.filter(r => r.status === 'approved' && !r.returnStatus).length
  const schoolRates = {
    'hailin-second-primary': 96.8, 'hailin-zirong-primary': 97.5, 'linhai-experimental-primary': 95.2
  }
  return {
    highRisk,
    totalLeave,
    attendanceRate: schoolRates[schoolId.value] || 96.8,
    feverCount,
    recoveryPending
  }
})

const heatmapMatrix = computed(() => {
  const records = filteredRecords.value
  const classSet = [...new Set(records.map(r => `${r.grade}${r.class}`))]
  classSet.sort()
  return classSet.map(cls => {
    const cells = []
    for (let m = 0; m < 11; m++) {
      cells.push(records.filter(r => `${r.grade}${r.class}` === cls && getMonthIdx(r.startDate) === m).length)
    }
    return { className: cls, cells }
  })
})

const highRiskClasses = computed(() => {
  const records = filteredRecords.value
  const classRiskMap = {}
  const classTotalMap = {}
  records.forEach(r => {
    const cls = `${r.grade}${r.class}`
    classTotalMap[cls] = (classTotalMap[cls] || 0) + 1
    if (r.highRisk) classRiskMap[cls] = (classRiskMap[cls] || 0) + 1
  })
  return Object.entries(classRiskMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([cls, count]) => ({
      className: cls,
      riskCount: count,
      riskRate: Math.round((count / (classTotalMap[cls] || 1)) * 100)
    }))
})

const alerts = computed(() => {
  const records = filteredRecords.value
  const alertRecs = records.filter(r => r.highRisk || (r.type === 'sick' && r.temperatureRecords?.some(t => t >= 38.0)))
  const alertTypes = ['highFever', 'outbreak', 'absence', 'recovery']
  const alertContents = {
    highFever: (cls, name) => `${name}同学体温38.5℃，已触发校医优先审批`,
    outbreak: (cls) => `${cls}出现3例流感症状，建议加强通风`,
    absence: (cls) => `${cls}有学生连续3天未到校，已通知家长`,
    recovery: (cls) => `${cls}复课申请待审核，健康数据需确认`
  }
  return alertRecs.slice(0, 5).map((r, i) => ({
    type: alertTypes[i % alertTypes.length],
    content: alertContents[alertTypes[i % alertTypes.length]](`${r.grade}${r.class}`, r.studentName),
    class: `${r.grade}${r.class}`,
    time: `${r.submitTime || r.startDate}`,
    status: i % 2 === 0 ? 'pending' : 'processed'
  }))
})

const getLeaveTypeData = () => {
  const records = filteredRecords.value
  return [
    { value: records.filter(r => r.type === 'sick').length, name: '病假', itemStyle: { color: '#F5A623' } },
    { value: records.filter(r => r.type === 'personal').length, name: '事假', itemStyle: { color: '#3B82F6' } },
    { value: records.filter(r => r.type === 'urgent').length, name: '紧急事假', itemStyle: { color: '#E85D4E' } },
    { value: records.filter(r => r.type === 'other').length, name: '其他', itemStyle: { color: '#9CA3AF' } }
  ]
}

const getHeatClass = (count) => {
  if (count === 0) return 'level-0'
  if (count <= 2) return 'level-1'
  if (count <= 4) return 'level-2'
  if (count <= 6) return 'level-3'
  return 'level-4'
}

const getRiskColor = (rate) => {
  if (rate >= 15) return '#E85D4E'
  if (rate >= 10) return '#F5A623'
  return '#3B82F6'
}

const getAttendanceTrendData = () => {
  const rng = seededRandom(getSchoolSeed() + 7)
  const baseRates = {
    'hailin-second-primary': { attendance: [97.2, 96.8, 96.5, 96.8], anomaly: [2.1, 2.5, 3.2, 2.8] },
    'hailin-zirong-primary': { attendance: [97.8, 97.5, 97.2, 97.5], anomaly: [1.5, 1.8, 2.4, 2.0] },
    'linhai-experimental-primary': { attendance: [96.0, 95.5, 95.0, 95.2], anomaly: [3.5, 4.0, 4.8, 4.2] }
  }
  return baseRates[schoolId.value] || baseRates['hailin-second-primary']
}

const initCharts = () => {
  if (leaveTypeChart.value) {
    if (leaveChartInstance) leaveChartInstance.dispose()
    leaveChartInstance = echarts.init(leaveTypeChart.value)
    leaveChartInstance.setOption({
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', right: '5%', top: 'center' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
        data: getLeaveTypeData()
      }]
    })
  }

  if (attendanceTrendChart.value) {
    if (trendChartInstance) trendChartInstance.dispose()
    trendChartInstance = echarts.init(attendanceTrendChart.value)
    const trendData = getAttendanceTrendData()
    trendChartInstance.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['出勤率', '健康异常率'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: ['第1周', '第2周', '第3周', '第4周'] },
      yAxis: [{ type: 'value', name: '出勤率(%)', axisLabel: { formatter: '{value}%' } }, { type: 'value', name: '异常率(%)', axisLabel: { formatter: '{value}%' } }],
      series: [
        { name: '出勤率', type: 'line', data: trendData.attendance, smooth: true, lineStyle: { width: 2.5, color: '#1E5AA8' }, itemStyle: { color: '#1E5AA8' } },
        { name: '健康异常率', type: 'line', yAxisIndex: 1, data: trendData.anomaly, smooth: true, lineStyle: { width: 2.5, color: '#E85D4E' }, itemStyle: { color: '#E85D4E' } }
      ]
    })
  }
}

const processAlert = (row) => {
  row.status = 'processed'
  ElMessage.success('预警已处理')
}

const handleResize = () => {
  leaveChartInstance && leaveChartInstance.resize()
  trendChartInstance && trendChartInstance.resize()
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  leaveChartInstance && leaveChartInstance.dispose()
  trendChartInstance && trendChartInstance.dispose()
})

watch([selectedSchoolYear, selectedGrade], () => {
  nextTick(() => {
    initCharts()
  })
})

watch(schoolId, () => {
  nextTick(() => {
    initCharts()
  })
})
</script>

<style scoped>
.health-monitoring {
  min-height: calc(100vh - 140px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0;
}

.header-filters {
  display: flex;
  gap: 12px;
}

.stats-row {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.stat-divider {
  width: 1px;
  height: 48px;
  background: #E8EAED;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EAED;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  display: flex;
  align-items: center;
  gap: 8px;
}



.chart {
  height: 280px;
}

.heatmap-container {
  padding: 16px;
}

.heatmap-weekdays {
  display: flex;
  margin-left: 32px;
  gap: 4px;
  margin-bottom: 4px;
}

.heatmap-weekdays span {
  width: 28px;
  text-align: center;
  font-size: 12px;
  color: #6B7280;
}

.heatmap-grid {
  display: flex;
  gap: 4px;
}

.heatmap-week {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.heatmap-cell {
  width: 28px;
  height: 28px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.cell-num {
  font-size: 10px;
  color: #FFFFFF;
  font-weight: 600;
}

.level-0 { background: #F0F0F0; }
.level-1 { background: #EEF6FF; }
.level-2 { background: #93C5FD; }
.level-3 { background: #3B82F6; }
.level-4 { background: #1E5AA8; }

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 12px;
  font-size: 12px;
  color: #6B7280;
}

.legend-item {
  width: 20px;
  height: 12px;
  border-radius: 2px;
}

.class-risk-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px;
}

.class-risk-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.class-info {
  width: 140px;
}

.class-name {
  font-size: 14px;
  color: #1A1A2E;
  display: block;
}

.class-count {
  font-size: 12px;
  color: #6B7280;
}

.risk-bar {
  flex: 1;
  height: 8px;
  background: #E8EAED;
  border-radius: 4px;
  overflow: hidden;
}

.risk-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s;
}

.risk-rate {
  width: 48px;
  text-align: right;
  font-size: 14px;
  font-weight: 600;
}

.alert-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.heatmap-matrix {
  padding: 12px;
  overflow-x: auto;
}

.matrix-header-row {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 4px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E8EAED;
}

.matrix-class-label {
  width: 80px;
  min-width: 80px;
  font-size: 12px;
  color: #6B7280;
  font-weight: 600;
}

.matrix-month-label {
  width: 40px;
  min-width: 40px;
  text-align: center;
  font-size: 11px;
  color: #6B7280;
}

.matrix-row {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 2px;
}

.matrix-class-name {
  width: 80px;
  min-width: 80px;
  font-size: 12px;
  color: #1A1A2E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.matrix-cell {
  width: 40px;
  min-width: 40px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1px 2px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.matrix-cell:hover {
  opacity: 0.8;
}

.matrix-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 12px;
  font-size: 12px;
  color: #6B7280;
}

.legend-item {
  width: 20px;
  height: 12px;
  border-radius: 2px;
}
</style>