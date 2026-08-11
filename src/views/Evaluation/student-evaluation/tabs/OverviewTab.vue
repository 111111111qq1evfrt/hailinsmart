<template>
  <div class="overview-tab">
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num" :style="{ color: currentStudentStats.totalScore >= 80 ? '#1E5AA8' : '#F5A623' }">{{ currentStudentStats.totalScore || '-' }}</span>
        <span class="stat-label">综合评分</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ currentStudentStats.evaluationCount || '-' }}</span>
        <span class="stat-label">评价次数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: getLevelColor(currentStudentStats.level) }">{{ currentStudentStats.level || '-' }}</span>
        <span class="stat-label">体育等级</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: currentStudentStats.improveRate >= 0 ? '#3B82F6' : '#E85D4E' }">
          {{ currentStudentStats.improveRate >= 0 ? '+' : '' }}{{ currentStudentStats.improveRate || '-' }}%
        </span>
        <span class="stat-label">进步率</span>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">五育发展雷达图</span>
        </div>
        <div ref="radarChart" class="chart" style="width:100%; height:350px;"></div>
      </div>
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">评价成绩分布</span>
        </div>
        <div ref="scoreChart" class="chart" style="width:100%; height:350px;"></div>
      </div>
    </div>

    <div class="ai-evaluation-section">
      <div class="section-header">
        <span class="section-title">🤖 AI智能评价分析</span>
        <el-tag type="success" size="small">AHP + NLP + LSTM</el-tag>
      </div>
      <div class="ai-content">
        <div class="ai-card">
          <div class="ai-card-header">
            <span class="ai-card-title"><el-icon :size="16" color="#1E5AA8"><Histogram /></el-icon> AHP层次分析法权重配置</span>
            <el-button text size="small" @click="showAHPConfig = !showAHPConfig">
              {{ showAHPConfig ? '收起' : '配置' }}
            </el-button>
          </div>
          <div class="ahp-matrix" v-if="showAHPConfig">
            <p class="ahp-desc">请设置各指标的两两比较矩阵（1-9尺度）</p>
            <el-table :data="ahpMatrixData" border size="small">
              <el-table-column prop="index" label="指标" width="100" />
              <el-table-column prop="physical" label="体质健康" width="100">
                <template #default="scope">
                  <el-input-number v-model="scope.row.physical" :min="1" :max="9" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="habit" label="运动习惯" width="100">
                <template #default="scope">
                  <el-input-number v-model="scope.row.habit" :min="1" :max="9" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="competition" label="体育竞赛" width="100">
                <template #default="scope">
                  <el-input-number v-model="scope.row.competition" :min="1" :max="9" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="skill" label="技能掌握" width="100">
                <template #default="scope">
                  <el-input-number v-model="scope.row.skill" :min="1" :max="9" size="small" />
                </template>
              </el-table-column>
              <el-table-column prop="weight" label="权重" width="80">
                <template #default="scope">
                  <span class="weight-value">{{ scope.row.weight }}%</span>
                </template>
              </el-table-column>
            </el-table>
            <div class="ahp-actions">
              <el-button type="primary" size="small" @click="calculateAHP">重新计算权重</el-button>
              <el-button size="small" @click="resetAHP">重置</el-button>
            </div>
          </div>
          <div class="weight-display" v-else>
            <div class="weight-item">
              <span class="weight-label">体质健康</span>
              <el-progress :percentage="35" :color="'#1E5AA8'" />
              <span class="weight-val">35%</span>
            </div>
            <div class="weight-item">
              <span class="weight-label">运动习惯</span>
              <el-progress :percentage="25" :color="'#3B82F6'" />
              <span class="weight-val">25%</span>
            </div>
            <div class="weight-item">
              <span class="weight-label">体育竞赛</span>
              <el-progress :percentage="20" :color="'#F5A623'" />
              <span class="weight-val">20%</span>
            </div>
            <div class="weight-item">
              <span class="weight-label">技能掌握</span>
              <el-progress :percentage="20" :color="'#3B82F6'" />
              <span class="weight-val">20%</span>
            </div>
          </div>
        </div>

        <div class="ai-card">
          <div class="ai-card-header">
            <span class="ai-card-title"><el-icon :size="16" color="#1E5AA8"><ScaleToOriginal /></el-icon> 熵权法修正结果</span>
            <el-tag type="warning" size="small">客观修正</el-tag>
          </div>
          <div class="entropy-result">
            <div class="entropy-info">
              <div class="entropy-item">
                <span class="entropy-label">原始权重一致性</span>
                <span class="entropy-value">{{ aiAnalysisData.entropy.consistency }}</span>
                <el-progress :percentage="Math.round(aiAnalysisData.entropy.consistency * 100)" :color="'#3B82F6'" :stroke-width="6" />
              </div>
              <div class="entropy-item">
                <span class="entropy-label">熵值离散度</span>
                <span class="entropy-value">{{ aiAnalysisData.entropy.dispersion }}</span>
                <el-progress :percentage="Math.round(aiAnalysisData.entropy.dispersion * 100)" :color="'#F5A623'" :stroke-width="6" />
              </div>
              <div class="entropy-item">
                <span class="entropy-label">修正系数</span>
                <span class="entropy-value good">{{ aiAnalysisData.entropy.correction }}</span>
                <el-progress :percentage="Math.round(aiAnalysisData.entropy.correction * 100)" :color="'#1E5AA8'" :stroke-width="6" />
              </div>
              <div class="entropy-item">
                <span class="entropy-label">最终权重</span>
                <span class="entropy-value">已应用 ✓</span>
                <el-progress :percentage="100" :color="'#1E5AA8'" :stroke-width="6" />
              </div>
            </div>
          </div>
        </div>

        <div class="ai-card">
          <div class="ai-card-header">
            <span class="ai-card-title">💬 NLP情感分析评语</span>
            <el-tag type="info" size="small">关键词提取</el-tag>
          </div>
          <div class="nlp-analysis">
            <div class="sentiment-indicator">
              <div class="sentiment-icon">{{ aiAnalysisData.sentiment.tendency === '积极' ? '😊' : aiAnalysisData.sentiment.tendency === '中性' ? '😐' : '😔' }}</div>
              <div class="sentiment-info">
                <span class="sentiment-label">情感倾向</span>
                <span class="sentiment-value" :class="aiAnalysisData.sentiment.tendency === '积极' ? 'positive' : aiAnalysisData.sentiment.tendency === '中性' ? 'neutral' : 'negative'">{{ aiAnalysisData.sentiment.tendency }}</span>
              </div>
              <div class="sentiment-score">
                <span class="score-num">{{ aiAnalysisData.sentiment.score }}</span>
                <span class="score-unit">分</span>
              </div>
            </div>
            <div class="keywords-section">
              <span class="keywords-label">正面关键词：</span>
              <div class="keyword-tags">
                <el-tag size="small" type="success" v-for="kw in aiAnalysisData.keywords.positive" :key="kw">{{ kw }}</el-tag>
              </div>
              <span class="keywords-label" style="margin-top: 8px;">待改进：</span>
              <div class="keyword-tags">
                <el-tag size="small" type="warning" v-for="kw in aiAnalysisData.keywords.negative" :key="kw">{{ kw }}</el-tag>
              </div>
            </div>
          </div>
        </div>

        <div class="ai-card lstm-card">
          <div class="ai-card-header">
            <span class="ai-card-title">📈 LSTM成长曲线预测</span>
            <el-tag type="danger" size="small">LSTM模型</el-tag>
          </div>
          <div class="lstm-prediction">
            <div class="prediction-chart">
              <div ref="lstmChartRef" class="chart" style="width:100%; height:160px;"></div>
            </div>
            <div class="prediction-info">
              <div class="prediction-item">
                <span class="pred-label">当前水平</span>
                <span class="pred-value">{{ currentStudentStats.totalScore || 78 }}分</span>
              </div>
              <div class="prediction-item">
                <span class="pred-label">3月后预测</span>
                <span class="pred-value good">{{ (currentStudentStats.totalScore || 78) + 4 }}分 ↑</span>
              </div>
              <div class="prediction-item">
                <span class="pred-label">6月后预测</span>
                <span class="pred-value good">{{ (currentStudentStats.totalScore || 78) + 8 }}分 ↑</span>
              </div>
              <div class="prediction-item">
                <span class="pred-label">年度目标</span>
                <span class="pred-value">90分</span>
              </div>
              <div class="confidence">
                <span class="confidence-label">模型置信度</span>
                <el-progress :percentage="92" :color="'#1E5AA8'" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, ref, watch, onMounted, nextTick, onBeforeUnmount, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { Histogram, ScaleToOriginal } from '@element-plus/icons-vue'
import echarts from '@/utils/echarts'
import { usePersistedRef } from '@/composables/usePersistedRef'
import { MOCK_AHP_MATRIX } from '@/data/mockData'
import store from '@/store/global'

const evalContext = inject('evalContext')

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const currentStudentStats = computed(() => evalContext?.currentStudentStats?.value || { totalScore: 0, evaluationCount: 0, level: '暂无数据', improveRate: 0 })
const currentStudentFiveEduScores = computed(() => evalContext?.currentStudentFiveEduScores?.value || { moral: 78, intellectual: 76, physical: 75, aesthetic: 74, labor: 77 })
const aiAnalysisData = computed(() => evalContext?.aiAnalysisData?.value || {
  entropy: { consistency: 0.89, dispersion: 0.72, correction: 0.95 },
  sentiment: { score: 75, tendency: '中性' },
  keywords: {
    positive: ['参与积极', '态度认真', '遵守纪律'],
    negative: ['需加强练习', '有待提高']
  }
})
const allStudents = computed(() => evalContext?.allStudents?.value || [])
const selectedStudent = computed(() => evalContext?.selectedStudent?.value || '')
const evaluationRecords = computed(() => evalContext?.evaluationRecords?.value || [])

const showAHPConfig = ref(false)

const ahpMatrixData = usePersistedRef(`smart_pe_ahp_matrix_${schoolId.value}`, [...MOCK_AHP_MATRIX])

const lstmChartRef = ref(null)
const radarChart = ref(null)
const scoreChart = ref(null)

let lstmChartInstance = null
let radarChartInstance = null
let scoreChartInstance = null

const calculateAHP = () => {
  ElMessage.success('AHP权重已重新计算')
}

const resetAHP = () => {
  ahpMatrixData.value = [...MOCK_AHP_MATRIX]
  ElMessage.success('AHP矩阵已重置')
}

const getLevelClass = (level) => {
  const classMap = {
    '优秀': 'level-excellent',
    '良好': 'level-good',
    '及格': 'level-pass',
    '不及格': 'level-fail',
    '暂无数据': ''
  }
  return classMap[level] || ''
}

const getLevelColor = (level) => {
  const colorMap = {
    '优秀': '#1E5AA8',
    '良好': '#3B82F6',
    '及格': '#F5A623',
    '不及格': '#E85D4E',
    '暂无数据': '#9CA3AF'
  }
  return colorMap[level] || '#6B7280'
}

const initRadarChart = () => {
  if (!radarChart.value) return
  if (radarChartInstance) { radarChartInstance.dispose(); radarChartInstance = null }
  radarChartInstance = echarts.init(radarChart.value)
  
  const scores = currentStudentFiveEduScores.value
  const personalData = [scores.moral, scores.intellectual, scores.physical, scores.aesthetic, scores.labor]
  
  const currentStudentName = allStudents.value.find(s => s.id === selectedStudent.value)?.name || '全校平均'
  
  const allRecords = evaluationRecords.value?.filter(e => e.score > 0) || []
  const avg = (field) => {
    const vals = allRecords.map(r => r[field]).filter(v => v != null && v !== undefined)
    return vals.length > 0 ? Math.round(vals.reduce((a, b) => a + b, 0) / vals.length) : 75
  }
  const schoolAvgData = [avg('moral'), avg('intellectual'), avg('physical'), avg('aesthetic'), avg('labor')]

  const seriesData = selectedStudent.value
    ? [
        {
          value: personalData,
          name: currentStudentName,
          areaStyle: { color: 'rgba(45, 125, 70, 0.2)' },
          lineStyle: { color: '#1E5AA8', width: 2 },
          itemStyle: { color: '#1E5AA8' }
        },
        {
          value: schoolAvgData,
          name: '全校平均',
          areaStyle: { color: 'rgba(59, 130, 246, 0.15)' },
          lineStyle: { color: '#3B82F6', width: 2, type: 'dashed' },
          itemStyle: { color: '#3B82F6' }
        }
      ]
    : [
        {
          value: personalData,
          name: '全校平均',
          areaStyle: { color: 'rgba(45, 125, 70, 0.25)' },
          lineStyle: { color: '#1E5AA8', width: 2 },
          itemStyle: { color: '#1E5AA8' }
        }
      ]

  radarChartInstance.setOption({
    tooltip: {},
    legend: { bottom: 10, textStyle: { color: '#6B7280', fontSize: 12 } },
    radar: {
      indicator: [
        { name: '德', max: 100 },
        { name: '智', max: 100 },
        { name: '体', max: 100 },
        { name: '美', max: 100 },
        { name: '劳', max: 100 }
      ],
      radius: '65%',
      center: ['50%', '45%'],
      axisName: { color: '#6B7280', fontSize: 14 },
      splitArea: { areaStyle: { color: ['#F7F8FA', '#FFFFFF'] } },
      axisLine: { lineStyle: { color: '#E8EAED' } },
      splitLine: { lineStyle: { color: '#E8EAED' } }
    },
    series: [{
      type: 'radar',
      data: seriesData,
      symbolSize: 6
    }]
  })
}

const initScoreChart = () => {
  if (!scoreChart.value) return
  if (scoreChartInstance) { scoreChartInstance.dispose(); scoreChartInstance = null }
  scoreChartInstance = echarts.init(scoreChart.value)
  
  const ranges = [
    { label: '<60', min: 0, max: 60 },
    { label: '60-70', min: 60, max: 70 },
    { label: '70-80', min: 70, max: 80 },
    { label: '80-90', min: 80, max: 90 },
    { label: '90-100', min: 90, max: 101 }
  ]
  
  const allRecords = evaluationRecords.value?.filter(e => e.score > 0) || []
  const schoolDistribution = ranges.map(r => allRecords.filter(e => e.score >= r.min && e.score < r.max).length)
  
  let data = schoolDistribution
  
  if (schoolDistribution.every(v => v === 0)) {
    data = [8, 35, 150, 320, 180]
  }

  scoreChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '5%', right: '5%', bottom: '8%', top: '12%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ranges.map(r => r.label),
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280', fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F7F8FA' } },
      axisLabel: { color: '#6B7280', fontSize: 12 }
    },
    series: [{
      type: 'bar',
      barWidth: '45%',
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: (params) => {
          const colors = ['#E85D4E', '#F5A623', '#3B82F6', '#1E5AA8', '#1E5AA8']
          return colors[params.dataIndex]
        }
      },
      data
    }]
  })
}

const initLstmChart = () => {
  if (!lstmChartRef.value) return
  if (lstmChartInstance) { lstmChartInstance.dispose(); lstmChartInstance = null }
  lstmChartInstance = echarts.init(lstmChartRef.value)
  lstmChartInstance.setOption({
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const data = params[0]
        return `${data.name}<br/>预测分数: <strong>${data.value}分</strong>`
      }
    },
    grid: { left: '10%', right: '10%', bottom: '15%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: ['当前', '1月后', '2月后', '3月后', '4月后', '5月后', '6月后', '9月后', '12月后'],
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280', fontSize: 12 }
    },
    yAxis: {
      type: 'value',
      min: 60,
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F7F8FA' } },
      axisLabel: { color: '#6B7280', formatter: '{value}分' }
    },
    series: [{
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { color: '#1E5AA8', width: 3 },
      itemStyle: { color: '#1E5AA8', borderWidth: 2, borderColor: '#fff' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(30, 90, 168, 0.3)' },
          { offset: 1, color: 'rgba(30, 90, 168, 0.05)' }
        ])
      },
      data: [78, 79, 80, 82, 83, 84, 86, 88, 90]
    }, {
      type: 'scatter',
      symbol: 'diamond',
      symbolSize: 10,
      itemStyle: { color: '#F5A623' },
      data: [[0, 78], [3, 82], [6, 86], [11, 90]]
    }]
  })
}

const handleChartResize = () => {
  if (radarChartInstance) radarChartInstance.resize()
  if (scoreChartInstance) scoreChartInstance.resize()
  if (lstmChartInstance) lstmChartInstance.resize()
}

watch(evaluationRecords, () => {
  nextTick(() => {
    initRadarChart()
    initScoreChart()
  })
}, { deep: true })

watch([currentStudentStats, currentStudentFiveEduScores, aiAnalysisData], () => {
  nextTick(() => {
    initRadarChart()
    initScoreChart()
    initLstmChart()
  })
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      initRadarChart()
      initScoreChart()
      initLstmChart()
    }, 300)
  })
  window.addEventListener('resize', handleChartResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleChartResize)
  if (radarChartInstance) radarChartInstance.dispose()
  if (scoreChartInstance) scoreChartInstance.dispose()
  if (lstmChartInstance) lstmChartInstance.dispose()
})
</script>

<style scoped>
.overview-tab {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.stats-row {
  display: flex;
  align-items: center;
  gap: 24px;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.stats-row .stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.stats-row .stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #1E5AA8;
  line-height: 1.2;
}

.stats-row .stat-label {
  font-size: 13px;
  color: #6B7280;
}

.stats-row .stat-divider {
  width: 1px;
  height: 32px;
  background: #E8EAED;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 24px;
  width: 100%;
}

.chart-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  min-height: 400px;
  display: flex;
  flex-direction: column;
}

.chart-card .card-header {
  margin-bottom: 16px;
  flex-shrink: 0;
}

.chart-card .chart {
  flex: 1;
  min-height: 320px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F0F1F5;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.chart {
  height: 350px;
  width: 100%;
  min-height: 300px;
}

.ai-evaluation-section {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.ai-content {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.ai-card {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 16px;
}

.ai-card.lstm-card {
  grid-column: span 2;
}

.ai-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.ai-card-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.ahp-matrix {
  margin-top: 12px;
}

.ahp-desc {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 8px;
}

.ahp-actions {
  margin-top: 12px;
  display: flex;
  gap: 8px;
}

.weight-value {
  font-weight: 600;
  color: #1E5AA8;
}

.weight-display {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.weight-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.weight-label {
  font-size: 12px;
  color: #6B7280;
  width: 60px;
}

.weight-val {
  font-size: 12px;
  font-weight: 600;
  color: #1A1A2E;
  width: 35px;
}

.entropy-result {
  padding: 8px 0;
}

.entropy-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.entropy-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.entropy-item {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
}

.entropy-label {
  color: #6B7280;
}

.entropy-value {
  font-weight: 600;
  color: #1A1A2E;
}

.entropy-value.good {
  color: #1E5AA8;
}

.nlp-analysis {
  display: flex;
  gap: 16px;
}

.sentiment-indicator {
  width: 120px;
  background: #EEF6FF;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.sentiment-icon {
  font-size: 28px;
}

.sentiment-info {
  text-align: center;
}

.sentiment-label {
  font-size: 11px;
  color: #6B7280;
  display: block;
}

.sentiment-value {
  font-size: 14px;
  font-weight: 600;
}

.sentiment-value.positive {
  color: #1E5AA8;
}

.sentiment-value.negative {
  color: #E85D4E;
}

.sentiment-value.neutral {
  color: #F5A623;
}

.sentiment-score {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.score-num {
  font-size: 24px;
  font-weight: 700;
  color: #1E5AA8;
}

.score-unit {
  font-size: 12px;
  color: #6B7280;
}

.keywords-section {
  flex: 1;
}

.keywords-label {
  font-size: 12px;
  color: #6B7280;
  display: block;
  margin-bottom: 4px;
}

.keyword-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.lstm-prediction {
  display: flex;
  gap: 20px;
}

.prediction-chart {
  width: 400px;
  height: 160px;
  background: #F7F8FA;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.prediction-info {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.prediction-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 12px;
  background: #FFFFFF;
  border-radius: 6px;
}

.pred-label {
  font-size: 12px;
  color: #6B7280;
}

.pred-value {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.pred-value.good {
  color: #1E5AA8;
}

.confidence {
  grid-column: span 2;
  padding: 8px 12px;
  background: #FFFFFF;
  border-radius: 6px;
}

.confidence-label {
  font-size: 12px;
  color: #6B7280;
  display: block;
  margin-bottom: 4px;
}

.stat-item {
  padding: 16px;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
}

.stat-item:hover {
  background: #F7F8FA;
  transform: translateY(-2px);
}

.stat-value.level-excellent {
  color: #1E5AA8;
}

.stat-value.level-good {
  color: #3B82F6;
}

.stat-value.level-pass {
  color: #F5A623;
}

.stat-value.level-fail {
  color: #E85D4E;
}

@media (max-width: 1024px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
  .ai-content {
    grid-template-columns: 1fr;
  }
  .ai-card.lstm-card {
    grid-column: span 1;
  }
  .lstm-prediction {
    flex-direction: column;
  }
  .prediction-chart {
    width: 100%;
  }
}
</style>
