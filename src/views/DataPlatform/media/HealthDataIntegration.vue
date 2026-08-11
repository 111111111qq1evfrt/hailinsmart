<template>
  <div class="health-integration">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ healthStats.greenCount }}</span>
        <span class="stat-label">达标指标</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num stat-warn">{{ healthStats.yellowCount }}</span>
        <span class="stat-label">预警指标</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num stat-danger">{{ healthStats.redCount }}</span>
        <span class="stat-label">危险指标</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ healthIndicators.length }}</span>
        <span class="stat-label">监测项目</span>
      </div>
    </div>

    <!-- 核心指标面板 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><DataAnalysis /> 健康指标状态</span>
        </div>
        <div class="indicators-grid">
          <div class="indicator-card" v-for="item in healthIndicators" :key="item.name">
            <div class="indicator-header">
              <span class="indicator-name">{{ item.name }}</span>
              <span 
                class="status-badge" 
                :class="getStatusClass(item.rate)"
              >
                {{ getStatusText(item.rate) }}
              </span>
            </div>
            <div class="indicator-value-row">
              <span class="indicator-value" :style="{ color: getStatusColor(item.rate) }">
                {{ item.rate }}%
              </span>
              <span class="indicator-target">国标: 85%</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: item.rate + '%', backgroundColor: getStatusColor(item.rate) }"
              ></div>
              <div class="threshold-line" :title="item.rate >= 85 ? '达标线' : '低于国标'"></div>
            </div>
            <div class="indicator-detail">
              <span>{{ item.desc }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI辅助分析 -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><Monitor /> AI健康分析</span>
          <el-tag size="small" type="success">分析完成</el-tag>
        </div>
        <div class="ai-analysis">
          <div class="analysis-item">
            <div class="analysis-icon"><TrendCharts /></div>
            <div class="analysis-content">
              <span class="analysis-label">视力下降趋势</span>
              <span class="analysis-value">{{ aiAnalysis.visionGrade }}</span>
              <div class="analysis-detail">
                <span>三年级近视率较去年+{{ aiAnalysis.visionRate }}%</span>
                <span>建议增加户外活动时间</span>
              </div>
            </div>
          </div>
          <div class="analysis-item">
            <div class="analysis-icon"><Aim /></div>
            <div class="analysis-content">
              <span class="analysis-label">体能达标情况</span>
              <span class="analysis-value">{{ aiAnalysis.fitnessGrade }}</span>
              <div class="analysis-detail">
                <span>BMI合格率: {{ aiAnalysis.bmiRate }}%</span>
                <span>肺活量优良率: {{ aiAnalysis.lungRate }}%</span>
              </div>
            </div>
          </div>
          <div class="analysis-item">
            <div class="analysis-icon"><Position /></div>
            <div class="analysis-content">
              <span class="analysis-label">运动建议</span>
              <span class="analysis-value">个性化</span>
              <div class="analysis-detail">
                <span>{{ aiAnalysis.advice1 }}</span>
                <span>{{ aiAnalysis.advice2 }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><TrendCharts /> 近视年增幅趋势</span>
        </div>
        <div ref="myopiaChart" class="chart"></div>
      </div>
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><DataAnalysis /> 体质指标对比</span>
        </div>
        <div ref="comparisonChart" class="chart"></div>
      </div>
    </div>

    <!-- 数据表格 -->
    <div class="charts-row">
      <div class="chart-card full-width">
        <div class="card-header">
          <span class="card-title"><Document /> 健康数据明细</span>
          <div class="header-actions">
            <el-select v-model="selectedGrade" placeholder="选择年级" style="width: 140px">
              <el-option label="全部年级" value="all" />
              <el-option label="一年级" value="1" />
              <el-option label="二年级" value="2" />
              <el-option label="三年级" value="3" />
              <el-option label="四年级" value="4" />
              <el-option label="五年级" value="5" />
              <el-option label="六年级" value="6" />
            </el-select>
            <el-input 
              v-model="searchKeyword" 
              placeholder="搜索指标" 
              clearable 
              style="width: 200px"
              :prefix-icon="Search"
            />
          </div>
        </div>
        <ExamTable
          :data="filteredHealthData"
          :columns="healthColumns"
          :title="''"
          :show-header="false"
          :searchable="false"
          :show-refresh="false"
          :show-pagination="true"
          :page-sizes="[10, 20, 30]"
          :default-page-size="10"
          :show-selection="false"
        >
          <template #rate="{ row }">
            <span :style="{ color: getStatusColor(row.rate) }">
              {{ row.rate }}%
            </span>
          </template>
          <template #status="{ row }">
            <el-tag :type="getStatusTagType(row.status)">
              {{ row.status }}
            </el-tag>
          </template>
          <template #trend="{ row }">
            <span :class="row.trend === '上升' ? 'trend-up' : 'trend-down'">
              {{ row.trend === '上升' ? '↑ 上升' : '↓ 下降' }}
            </span>
          </template>
          <template #actions="{ row }">
            <el-button text size="small" :icon="View" @click="viewHealthDetail(row)">详情</el-button>
          </template>
        </ExamTable>
      </div>
    </div>

    <!-- 健康数据详情弹窗 -->
    <el-dialog v-model="detailDialogVisible" title="健康数据详情" width="500px">
      <div v-if="selectedHealthData" class="health-detail">
        <div class="detail-header">
          <span class="detail-title">{{ selectedHealthData.name }}</span>
          <el-tag :type="getStatusTagType(selectedHealthData.status)">{{ selectedHealthData.status }}</el-tag>
        </div>
        <div class="detail-body">
          <div class="detail-row">
            <span class="detail-label">所属年级</span>
            <span class="detail-value">{{ selectedHealthData.grade }}年级</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">合格率</span>
            <span class="detail-value" :style="{ color: getStatusColor(selectedHealthData.rate) }">{{ selectedHealthData.rate }}%</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">检测人数</span>
            <span class="detail-value">{{ selectedHealthData.count }}人</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">平均值</span>
            <span class="detail-value">{{ selectedHealthData.avgValue }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">趋势</span>
            <span :class="selectedHealthData.trend === '上升' ? 'trend-up' : 'trend-down'">
              {{ selectedHealthData.trend === '上升' ? '↑ 上升' : '↓ 下降' }}
            </span>
          </div>
          <div class="detail-row full-width">
            <span class="detail-label">备注</span>
            <span class="detail-value">{{ selectedHealthData.note || '无' }}</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="closeDetail">关闭</el-button>
        <el-button type="primary" @click="exportReport">导出报告</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, View, DataAnalysis, Monitor, TrendCharts, Document, Aim, Position } from '@element-plus/icons-vue'
import echarts from '@/utils/echarts'
import ExamTable from '@/components/table/ExamTable.vue'
import { usePersistedRef } from '@/composables/usePersistedRef'
import store from '@/store/global'
import { getSchoolProfile } from '@/mock/school-data/schoolProfiles'

const selectedGrade = ref('all')
const searchKeyword = ref('')
const myopiaChart = ref(null)

// 表格列配置
const healthColumns = ref([
  { prop: 'name', label: '指标名称', minWidth: '180' },
  { prop: 'grade', label: '年级', minWidth: '100', align: 'center' },
  { slot: 'rate', label: '合格率', minWidth: '120', align: 'center' },
  { slot: 'status', label: '状态', minWidth: '100', align: 'center' },
  { prop: 'count', label: '检测人数', minWidth: '120', align: 'center' },
  { prop: 'avgValue', label: '平均值', minWidth: '120', align: 'center' },
  { slot: 'trend', label: '趋势', minWidth: '100', align: 'center' },
])
const comparisonChart = ref(null)
const detailDialogVisible = ref(false)
const selectedHealthData = ref(null)
let myopiaChartInstance = null
let comparisonChartInstance = null

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')
const schoolProfile = computed(() => getSchoolProfile(store.state.school.id || 'hailin-second-primary'))

// AI健康分析 — 各校不同数据
const aiAnalysis = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  const visionRate = isZirong ? 8 : isLinhai ? 6 : 12
  const bmiRate = isZirong ? 86 : isLinhai ? 94 : 92
  const lungRate = isZirong ? 82 : isLinhai ? 91 : 88
  const visionGrade = isZirong ? '需关注' : isLinhai ? '正常' : '需关注'
  const fitnessGrade = isZirong ? '一般' : isLinhai ? '优秀' : '良好'
  const advice1 = isZirong ? '建议增加排球户外训练' : isLinhai ? '建议增加游泳有氧训练' : '建议增加有氧运动'
  const advice2 = isZirong ? '每周至少2次体能训练' : isLinhai ? '每周至少4次体能训练' : '每周至少3次体能训练'
  return { visionRate, bmiRate, lungRate, visionGrade, fitnessGrade, advice1, advice2 }
})

const healthStats = computed(() => {
  const list = filteredHealthData.value || []
  return {
    greenCount: list.filter(d => d.rate >= 85).length,
    yellowCount: list.filter(d => d.rate >= 75 && d.rate < 85).length,
    redCount: list.filter(d => d.rate < 75).length
  }
})

const healthIndicators = computed(() => {
  const grouped = {}
  ;(healthData.value || []).forEach(d => {
    if (!grouped[d.name]) grouped[d.name] = { total: 0, count: 0, desc: '' }
    grouped[d.name].total += d.rate
    grouped[d.name].count++
  })
  const descMap = {
    'BMI合格率': '体重指数达标人数占比',
    '肺活量优良率': '肺活量达到优良标准比例',
    '50米跑标准差': '50米跑成绩标准差',
    '视力合格率': '裸眼视力达标人数占比',
    '坐位体前屈': '柔韧性达标率',
    '立定跳远': '爆发力达标率'
  }
  return Object.keys(grouped).map(name => ({
    name,
    rate: Math.round(grouped[name].total / grouped[name].count),
    desc: descMap[name] || name
  }))
})

const healthDataDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  const baseCount = isZirong ? 80 : isLinhai ? 100 : 200
  return schoolProfile.value.healthData.map(item => ({
    name: item.name,
    grade: item.grade,
    rate: item.normalRate,
    count: baseCount + (item.normalRate % 30),
    avgValue: item.normalRate + '%',
    trend: item.normalRate >= 80 ? '上升' : '下降'
  }))
})
const healthData = usePersistedRef(computed(() => `smart_pe_health_data_${schoolId.value}`), [...healthDataDefault.value])

const gradeMap = { '1': '一年级', '2': '二年级', '3': '三年级', '4': '四年级', '5': '五年级', '6': '六年级' }

const filteredHealthData = computed(() => {
  let result = [...healthData.value]
  if (selectedGrade.value && selectedGrade.value !== 'all') {
    const gradeName = gradeMap[selectedGrade.value] || `${selectedGrade.value}年级`
    result = result.filter(d => d.grade === gradeName)
  }
  if (searchKeyword.value) {
    const q = searchKeyword.value.toLowerCase()
    result = result.filter(d => d.name.includes(q))
  }
  return result.map(item => ({
    ...item,
    status: item.rate >= 85 ? '达标' : item.rate >= 75 ? '预警' : '危险'
  }))
})

const getStatusClass = (rate) => {
  if (rate >= 85) return 'status-green'
  if (rate >= 75) return 'status-yellow'
  return 'status-red'
}

const getStatusText = (rate) => {
  if (rate >= 85) return '达标'
  if (rate >= 75) return '预警'
  return '危险'
}

const getStatusColor = (rate) => {
  if (rate >= 85) return '#1E5AA8'
  if (rate >= 75) return '#F5A623'
  return '#E85D4E'
}

const getStatusTagType = (status) => {
  const map = { '达标': 'success', '预警': 'warning', '危险': 'danger' }
  return map[status] || 'info'
}

const initMyopiaChart = () => {
  if (!myopiaChart.value) return
  if (myopiaChartInstance) { myopiaChartInstance.dispose(); myopiaChartInstance = null }
  myopiaChartInstance = echarts.init(myopiaChart.value)
  myopiaChartInstance.showLoading()

  // 从筛选后的健康数据中计算视力相关平均合格率作为预警基准
  const data = filteredHealthData.value.length > 0 ? filteredHealthData.value : healthData.value
  const visionItems = data.filter(d => d.name.includes('视力'))
  const avgVisionRate = visionItems.length
    ? Math.round(visionItems.reduce((sum, d) => sum + d.rate, 0) / visionItems.length)
    : 82
  const warningValue = Math.max(10, Math.round((100 - avgVisionRate) * 1.2))

  // 各校不同的近视增幅趋势数据
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  const myopiaData = isZirong ? [6, 9, 11, 14, 17] : isLinhai ? [5, 8, 10, 12, 15] : [8, 12, 15, 18, 22]
  const yearLabels = isZirong ? ['2021', '2022', '2023', '2024', '2026'] : isLinhai ? ['2021', '2022', '2023', '2025', '2026'] : ['2020', '2021', '2022', '2023', '2026']

  myopiaChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['近视增幅', '预警线'], top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: yearLabels,
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F7F8FA' } },
      axisLabel: { color: '#6B7280' }
    },
    series: [
      {
        name: '近视增幅',
        type: 'line',
        smooth: true,
        lineStyle: { color: '#E85D4E', width: 2.5 },
        itemStyle: { color: '#E85D4E' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(232, 93, 78, 0.2)' },
            { offset: 1, color: 'rgba(232, 93, 78, 0)' }
          ])
        },
        data: myopiaData
      },
      {
        name: '预警线',
        type: 'line',
        lineStyle: { color: '#F5A623', width: 1.5, type: 'dashed' },
        data: Array(5).fill(warningValue)
      }
    ]
  })
  myopiaChartInstance.hideLoading()
}

const initComparisonChart = () => {
  if (!comparisonChart.value) return
  if (comparisonChartInstance) { comparisonChartInstance.dispose(); comparisonChartInstance = null }
  comparisonChartInstance = echarts.init(comparisonChart.value)
  comparisonChartInstance.showLoading()

  const data = filteredHealthData.value.length > 0 ? filteredHealthData.value : healthData.value
  const gradeOrder = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
  const indicatorMap = {}
  const indicatorAvgMap = {}
  
  data.forEach(d => {
    if (!indicatorMap[d.name]) indicatorMap[d.name] = {}
    if (!indicatorAvgMap[d.name]) indicatorAvgMap[d.name] = { total: 0, count: 0 }
    indicatorMap[d.name][d.grade] = d.rate
    indicatorAvgMap[d.name].total += d.rate
    indicatorAvgMap[d.name].count++
  })

  const indicatorNames = Object.keys(indicatorMap)
  const colors = ['#1E5AA8', '#3B82F6', '#E85D4E', '#F5A623', '#8B5CF6', '#22C55E']

  const series = indicatorNames.map((name, idx) => {
    const avgRate = indicatorAvgMap[name].count > 0 
      ? indicatorAvgMap[name].total / indicatorAvgMap[name].count 
      : 80
    return {
      name,
      type: 'bar',
      itemStyle: { color: colors[idx % colors.length], borderRadius: [4, 4, 0, 0] },
      data: gradeOrder.map((g, gIdx) => {
        const rate = indicatorMap[name][g]
        if (rate !== undefined && rate !== null && rate > 0) {
          return rate
        }
        const gradeOffset = gIdx - 2
        return Math.round(avgRate + gradeOffset * 1.5)
      })
    }
  })

  comparisonChartInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: indicatorNames, top: 0 },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: gradeOrder,
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F7F8FA' } },
      axisLabel: { color: '#6B7280' },
      max: 100
    },
    series
  })
  comparisonChartInstance.hideLoading()
}

watch([selectedGrade, searchKeyword], () => {
  nextTick(() => {
    initMyopiaChart()
    initComparisonChart()
  })
})

watch(healthData, () => {
  nextTick(() => {
    initMyopiaChart()
    initComparisonChart()
  })
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    setTimeout(() => { initMyopiaChart(); initComparisonChart() }, 200)
  })
})

const viewHealthDetail = (row) => {
  selectedHealthData.value = row
  detailDialogVisible.value = true
}

const closeDetail = () => {
  detailDialogVisible.value = false
  selectedHealthData.value = null
}

const exportReport = () => {
  if (!selectedHealthData.value) return
  ElMessage.success(`正在导出 ${selectedHealthData.value.name} 报告...`)
  detailDialogVisible.value = false
}

onBeforeUnmount(() => {
  if (myopiaChartInstance) myopiaChartInstance.dispose()
  if (comparisonChartInstance) comparisonChartInstance.dispose()
})
</script>

<style scoped>
.health-integration {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 图表行 */
.charts-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

@media (max-width: 900px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
  .chart-card.full-width {
    grid-column: span 1;
  }
}

.card-title :deep(.el-icon),
.card-title :deep(svg) {
  width: 18px;
  height: 18px;
  font-size: 16px;
  flex-shrink: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* 指标网格 */
.indicators-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

@media (max-width: 600px) {
  .indicators-grid {
    grid-template-columns: 1fr;
  }
}

.indicator-card {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 16px;
}

.indicator-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.indicator-name {
  font-size: 13px;
  font-weight: 600;
  color: #1A1A2E;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.status-green { background: #DCFCE7; color: #166534; }
.status-badge.status-yellow { background: #FEF3C7; color: #92400E; }
.status-badge.status-red { background: #FEE2E2; color: #991B1B; }

.indicator-value-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 8px;
}

.indicator-value {
  font-size: 24px;
  font-weight: 700;
}

.indicator-target {
  font-size: 12px;
  color: #9CA3AF;
}

.progress-bar {
  position: relative;
  height: 6px;
  background: #E8EAED;
  border-radius: 3px;
  overflow: visible;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  border-radius: 3px;
}

.threshold-line {
  position: absolute;
  top: 0;
  left: 85%;
  width: 2px;
  height: 10px;
  background: #9CA3AF;
  transform: translateY(-25%);
}

.indicator-detail {
  font-size: 12px;
  color: #6B7280;
}

/* AI分析 */
.ai-analysis {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.analysis-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.analysis-icon {
  font-size: 20px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  border-radius: 8px;
}

.analysis-icon svg {
  width: 24px;
  height: 24px;
}

.analysis-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.analysis-label {
  font-size: 12px;
  color: #6B7280;
}

.analysis-value {
  font-size: 14px;
  font-weight: 600;
  color: #1E5AA8;
}

.analysis-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.analysis-detail span {
  font-size: 11px;
  color: #9CA3AF;
}

/* 图表 */
.chart {
  height: 260px;
}

/* 数据表格 */
.data-table {
  width: 100%;
}

.trend-up {
  color: #1E5AA8;
  font-weight: 500;
}

.trend-down {
  color: #E85D4E;
  font-weight: 500;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 健康数据详情弹窗样式 */
.health-detail {
  padding: 8px 0;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EAED;
}

.detail-title {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A2E;
}

.detail-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.detail-row.full-width {
  flex-direction: column;
  align-items: flex-start;
  gap: 8px;
}

.detail-label {
  font-size: 13px;
  font-weight: 500;
  color: #6B7280;
  min-width: 100px;
}

.detail-row.full-width .detail-label {
  margin-bottom: 4px;
}

.detail-value {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.detail-row.full-width .detail-value {
  width: 100%;
  word-break: break-all;
}
</style>
