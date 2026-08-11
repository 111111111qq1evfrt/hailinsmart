<template>
  <div class="diagnosis-analysis">
    <div class="stats-row" style="margin-bottom: 20px;">
      <div class="stat-item">
        <span class="stat-num" style="color: #E85D4E">{{ diagnosisStats.warningCount }}</span>
        <span class="stat-label">预警学生</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #3B82F6">{{ diagnosisStats.improveRate }}%</span>
        <span class="stat-label">进步率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ diagnosisStats.classCount }}</span>
        <span class="stat-label">对比班级</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ diagnosisStats.trainPlan }}</span>
        <span class="stat-label">训练计划</span>
      </div>
    </div>
    
    <div class="list-card">
      <div class="card-header">
        <span class="card-title"><el-icon :size="18" color="#E85D4E"><Warning /></el-icon> 动作掌握度标红预警</span>
        <div class="header-actions">
          <el-button text :icon="Bell" @click="viewAllWarnings">查看全部</el-button>
        </div>
      </div>
      <el-table :data="warningList" stripe class="w-full" :height="250">
        <el-table-column prop="studentName" label="学生姓名" width="120" />
        <el-table-column prop="className" label="班级" width="120" />
        <el-table-column prop="actionName" label="动作名称" width="140" />
        <el-table-column prop="masteryRate" label="掌握度" width="120">
          <template #default="scope">
            <span :class="getMasteryClass(scope.row.masteryRate)">
              {{ scope.row.masteryRate }}%
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="预警状态" width="120">
          <template #default="scope">
            <span class="warning-tag" :class="scope.row.status">
              {{ scope.row.status === 'high' ? '高危' : scope.row.status === 'medium' ? '中等' : '低危' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="suggestion" label="建议训练" width="140" />
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button text type="primary" size="small" @click="viewWarningDetail(scope.row)">详情</el-button>
            <el-button text type="success" size="small" @click="pushTraining(scope.row)">推送训练</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
    
    <div class="list-card" style="margin-top: 16px;">
      <div class="card-header">
        <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Histogram /></el-icon> 班级横向对比</span>
        <el-select v-model="compareSubject" placeholder="选择项目" style="width: 140px">
          <el-option label="立定跳远" value="longJump" />
          <el-option label="仰卧起坐" value="sitUp" />
          <el-option label="50米跑" value="run50m" />
          <el-option label="跳绳" value="skipping" />
          <el-option label="引体向上" value="pullUp" />
        </el-select>
      </div>
      <div class="compare-legend">
        <span class="legend-item"><span class="legend-color" style="background: #1E5AA8"></span>优秀(85-100)</span>
        <span class="legend-item"><span class="legend-color" style="background: #3B82F6"></span>良好(70-84)</span>
        <span class="legend-item"><span class="legend-color" style="background: #F5A623"></span>及格(55-69)</span>
        <span class="legend-item"><span class="legend-color" style="background: #E85D4E"></span>不及格(&lt;55)</span>
      </div>
      <div class="compare-chart">
        <div class="compare-bar" v-for="(item, idx) in classCompareData" :key="idx">
          <span class="bar-label">{{ item.className }}</span>
          <div class="bar-container">
            <div class="bar-fill" :style="{ width: item.score + '%', background: getBarColor(item.score) }"></div>
          </div>
          <span class="bar-value">{{ item.score }}分</span>
        </div>
      </div>
    </div>
    
    <div class="list-card" style="margin-top: 16px;">
      <div class="card-header">
        <span class="card-title">📈 学期纵向进步率追踪</span>
      </div>
      <div class="progress-tracking">
        <div class="progress-item" v-for="(item, idx) in progressData" :key="idx">
          <div class="progress-header">
            <span class="progress-name">{{ item.studentName }}</span>
            <span class="progress-rate" :class="item.rate >= 0 ? 'positive' : 'negative'">
              {{ item.rate >= 0 ? '+' : '' }}{{ item.rate }}%
            </span>
          </div>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: Math.abs(item.rate) + '%', background: item.rate >= 0 ? '#1E5AA8' : '#E85D4E' }"></div>
          </div>
          <div class="progress-detail">
            <span>上学期: {{ item.lastScore }}分</span>
            <span>本学期: {{ item.currentScore }}分</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { Bell, Histogram, Warning } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const evalContext = inject('evalContext')

const diagnosisStats = evalContext?.diagnosisStats
const warningList = evalContext?.warningList
const classCompareData = evalContext?.classCompareData
const progressData = evalContext?.progressData
const compareSubject = evalContext?.compareSubject

const warningDetailVisible = inject('warningDetailVisible')
const currentWarning = inject('currentWarning')
const pushTraining = inject('pushTraining')
const showResourcePushDialog = inject('showResourcePushDialog')
const currentPushStudent = inject('currentPushStudent')
const recommendedResources = inject('recommendedResources')
const resourcePushForm = inject('resourcePushForm')
const getResourceTypeTag = inject('getResourceTypeTag')
const getResourceTypeText = inject('getResourceTypeText')
const confirmPushResource = inject('confirmPushResource')

const getMasteryClass = (rate) => {
  if (rate < 50) return 'mastery-danger'
  if (rate < 70) return 'mastery-warning'
  return 'mastery-success'
}

const getBarColor = (score) => {
  if (score >= 85) return '#1E5AA8'
  if (score >= 70) return '#3B82F6'
  if (score >= 60) return '#F5A623'
  return '#E85D4E'
}

const viewAllWarnings = () => {
  ElMessage.info('查看全部预警')
}

const viewWarningDetail = (row) => {
  if (currentWarning) currentWarning.value = row
  if (warningDetailVisible) warningDetailVisible.value = true
}
</script>

<style scoped>
.mastery-danger { color: #E85D4E; font-weight: 600; }
.mastery-warning { color: #F5A623; font-weight: 600; }
.mastery-success { color: #1E5AA8; font-weight: 600; }

.warning-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.warning-tag.high { background: #FEE2E2; color: #991B1B; }
.warning-tag.medium { background: #FEF3C7; color: #92400E; }
.warning-tag.low { background: #DBEAFE; color: #1E40AF; }

.compare-legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  padding: 8px 0;
  margin-bottom: 8px;
  border-bottom: 1px solid #F1F5F9;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6B7280;
}

.legend-color {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 3px;
}

.compare-chart {
  padding: 16px;
}

.compare-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.bar-label {
  width: 100px;
  font-size: 13px;
  color: #6B7280;
}

.bar-container {
  flex: 1;
  height: 24px;
  background: #F3F4F6;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-value {
  width: 60px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #1A1A2E;
}

.progress-tracking {
  padding: 16px;
}

.progress-item {
  margin-bottom: 20px;
}

.progress-item:last-child {
  margin-bottom: 0;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.progress-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.progress-rate {
  font-size: 14px;
  font-weight: 600;
}

.progress-rate.positive { color: #1E5AA8; }
.progress-rate.negative { color: #E85D4E; }

.progress-bar {
  height: 8px;
  background: #F3F4F6;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-detail {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #6B7280;
}

@media (max-width: 768px) {
  .compare-legend {
    gap: 12px;
  }
  .legend-item {
    font-size: 11px;
  }
}

@media (max-width: 480px) {
  .compare-legend {
    gap: 8px;
  }
  .legend-item {
    font-size: 11px;
  }
}
</style>
