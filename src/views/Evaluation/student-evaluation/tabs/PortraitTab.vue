<template>
  <div class="digital-portrait">
    <div class="portrait-overview">
      <div class="portrait-card main-card">
        <div class="portrait-header">
          <el-avatar :size="80" :icon="UserFilled" class="portrait-avatar" />
          <div class="portrait-info">
            <h3>{{ currentPortrait.name }}</h3>
            <p>{{ currentPortrait.className }}</p>
            <p class="portrait-level">体育等级: <span :class="currentPortrait.levelClass">{{ currentPortrait.level }}</span></p>
          </div>
          <div class="portrait-score">
            <span class="score-label">综合评分</span>
            <span class="score-value">{{ currentPortrait.totalScore }}</span>
          </div>
        </div>
      </div>
      
      <div class="portrait-cards">
        <div class="portrait-card">
          <div class="card-icon" style="background: #DCFCE7">💪</div>
          <div class="card-content">
            <span class="card-value">{{ currentPortrait.physicalScore }}</span>
            <span class="card-label">体能评分</span>
          </div>
        </div>
        <div class="portrait-card">
          <div class="card-icon" style="background: #DBEAFE">🎯</div>
          <div class="card-content">
            <span class="card-value">{{ currentPortrait.skillScore }}</span>
            <span class="card-label">技能评分</span>
          </div>
        </div>
        <div class="portrait-card">
          <div class="card-icon" style="background: #FEF3C7">🔥</div>
          <div class="card-content">
            <span class="card-value">{{ currentPortrait.interestScore }}</span>
            <span class="card-label">兴趣评分</span>
          </div>
        </div>
        <div class="portrait-card">
          <div class="card-icon" style="background: #FEE2E2">🏃</div>
          <div class="card-content">
            <span class="card-value">{{ currentPortrait.activityCount }}</span>
            <span class="card-label">活动次数</span>
          </div>
        </div>
      </div>
    </div>
    
    <div class="list-card" style="margin-top: 16px;">
      <div class="card-header">
        <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Histogram /></el-icon> 能力维度雷达图</span>
      </div>
      <div class="radar-container">
        <div class="radar-chart" id="portraitRadarChart"></div>
      </div>
    </div>
    
    <div class="list-card" style="margin-top: 16px;">
      <div class="card-header">
        <span class="card-title">📈 成长轨迹</span>
      </div>
      <div class="growth-timeline">
        <div class="timeline-item" v-for="(item, idx) in currentPortrait.growthHistory" :key="idx">
          <div class="timeline-dot" :style="{ background: item.type === 'improve' ? '#1E5AA8' : '#F5A623' }"></div>
          <div class="timeline-content">
            <div class="timeline-header">
              <span class="timeline-date">{{ item.date }}</span>
              <span class="timeline-tag" :class="item.type">{{ item.type === 'improve' ? '进步' : '训练' }}</span>
            </div>
            <p class="timeline-desc">{{ item.description }}</p>
          </div>
        </div>
      </div>
    </div>
    
    <div class="list-card" style="margin-top: 16px;">
      <div class="card-header">
        <span class="card-title">🎨 特长分析与推荐</span>
      </div>
      <div class="strengths-section">
        <div class="strengths-list">
          <div class="strength-item" v-for="(item, idx) in currentPortrait.strengths" :key="idx">
            <span class="strength-tag">{{ item.name }}</span>
            <span class="strength-level">{{ item.level }}</span>
          </div>
        </div>
        <div class="recommendations">
          <h4>推荐发展方向</h4>
          <ul>
            <li v-for="(item, idx) in currentPortrait.recommendations" :key="idx">{{ item }}</li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject, onMounted, onBeforeUnmount, watch, nextTick } from 'vue'
import { UserFilled, Histogram } from '@element-plus/icons-vue'
import echarts from '@/utils/echarts'

const evalContext = inject('evalContext')

const currentPortrait = evalContext.currentPortrait
const portraitsData = evalContext.portraitsData
const selectedStudent = evalContext.selectedStudent
const getLevelClass = evalContext.getLevelClass
const initPortraitRadarChart = evalContext.initPortraitRadarChart
const portraitRadarChartInstance = evalContext.portraitRadarChartInstance

onMounted(() => {
  nextTick(() => {
    setTimeout(() => {
      initPortraitRadarChart()
    }, 300)
  })
  window.addEventListener('resize', handleChartResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleChartResize)
})

const handleChartResize = () => {
  if (portraitRadarChartInstance.value) portraitRadarChartInstance.value.resize()
}

watch(() => selectedStudent, (newVal) => {
  if (!newVal) return
  nextTick(() => {
    setTimeout(() => {
      initPortraitRadarChart()
    }, 200)
  })
})
</script>

<style scoped>
.digital-portrait {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.portrait-overview {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.portrait-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.portrait-card.main-card {
  grid-column: span 1;
}

.portrait-header {
  display: flex;
  align-items: center;
  gap: 16px;
}

.portrait-avatar {
  background: linear-gradient(135deg, #1E5AA8, #3B82F6);
}

.portrait-info {
  flex: 1;
}

.portrait-info h3 {
  font-size: 20px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 4px 0;
}

.portrait-info p {
  font-size: 14px;
  color: #6B7280;
  margin: 4px 0;
}

.portrait-level {
  font-size: 13px !important;
}

.level-excellent { color: #1E5AA8; font-weight: 600; }
.level-good { color: #3B82F6; font-weight: 600; }
.level-pass { color: #F5A623; font-weight: 600; }
.level-fail { color: #E85D4E; font-weight: 600; }

.portrait-score {
  text-align: center;
}

.score-label {
  display: block;
  font-size: 12px;
  color: #9CA3AF;
  margin-bottom: 4px;
}

.score-value {
  font-size: 36px;
  font-weight: 700;
  color: #1E5AA8;
}

.portrait-cards {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.portrait-cards .portrait-card {
  display: flex;
  align-items: center;
  gap: 12px;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.card-content {
  display: flex;
  flex-direction: column;
}

.card-content .card-value {
  font-size: 20px;
  font-weight: 600;
  color: #1A1A2E;
}

.card-content .card-label {
  font-size: 12px;
  color: #6B7280;
}

.radar-container {
  height: 300px;
}

.radar-chart {
  width: 100%;
  height: 100%;
}

.growth-timeline {
  padding: 16px;
}

.timeline-item {
  display: flex;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #F3F4F6;
  margin-bottom: 16px;
}

.timeline-item:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.timeline-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 4px;
  flex-shrink: 0;
}

.timeline-content {
  flex: 1;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.timeline-date {
  font-size: 13px;
  color: #9CA3AF;
}

.timeline-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.timeline-tag.improve { background: #EEF6FF; color: #1E5AA8; }
.timeline-tag.training { background: #FEF3C7; color: #92400E; }

.timeline-desc {
  font-size: 14px;
  color: #1A1A2E;
  margin: 0;
}

.strengths-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  padding: 16px;
}

.strengths-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.strength-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.strength-tag {
  padding: 6px 12px;
  background: #F7F8FA;
  border-radius: 6px;
  font-size: 13px;
  color: #1A1A2E;
}

.strength-level {
  font-size: 12px;
  color: #6B7280;
}

.recommendations h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 12px 0;
}

.recommendations ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.recommendations li {
  font-size: 13px;
  color: #6B7280;
  padding: 6px 0;
  padding-left: 16px;
  position: relative;
}

.recommendations li::before {
  content: '•';
  position: absolute;
  left: 0;
  color: #1E5AA8;
  font-weight: bold;
}
</style>
