<template>
  <div class="parent-evaluation">
    <div class="card-header" style="margin-bottom: 16px;">
      <span class="card-title">家长月度问卷评价</span>
      <el-button type="primary" :icon="Plus" @click="showParentSurveyDialog">发起问卷</el-button>
    </div>
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ parentStatsComputed.sent }}</span>
        <span class="stat-label">已发送问卷</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ parentStatsComputed.completed }}</span>
        <span class="stat-label">已完成</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #F5A623">{{ parentStatsComputed.pending }}</span>
        <span class="stat-label">待填写</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ parentStatsComputed.photos }}</span>
        <span class="stat-label">照片证据</span>
      </div>
    </div>
    <div class="list-card" style="margin-top: 16px;">
      <div class="card-header">
        <span class="card-title">家长评价记录</span>
        <div class="header-actions">
          <el-button text :icon="Refresh" @click="refreshParentData">刷新</el-button>
        </div>
      </div>
      <el-table :data="parentEvaluations" stripe class="w-full" :height="300">
        <el-table-column prop="studentName" label="学生姓名" width="100" />
        <el-table-column prop="parentName" label="家长姓名" width="100" />
        <el-table-column prop="month" label="月份" width="100" />
        <el-table-column prop="satisfaction" label="满意度" width="140">
          <template #default="scope">
            <el-rate v-model="scope.row.satisfaction" disabled text-color="#F5A623" />
          </template>
        </el-table-column>
        <el-table-column prop="photos" label="照片" width="80">
          <template #default="scope">
            <span v-if="scope.row.photos > 0">📷 {{ scope.row.photos }}</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column prop="comment" label="家长评语" />
        <el-table-column prop="date" label="评价日期" width="120" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'

const evalContext = inject('evalContext')

const {
  parentStatsComputed,
  parentEvaluations,
  parentSurveyVisible,
  parentSurveyForm,
  showParentSurveyDialog,
  submitParentSurvey,
  previewVisible,
  previewUrl,
  handlePictureCardPreview,
  refreshParentData,
  classCodeToClassName
} = evalContext
</script>

<style scoped>
.parent-evaluation {
  display: flex;
  flex-direction: column;
  gap: 0;
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

.header-actions {
  display: flex;
  gap: 8px;
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
  padding: 16px;
  border-radius: 8px;
  transition: all 0.2s;
  cursor: pointer;
}

.stats-row .stat-item:hover {
  background: #F7F8FA;
  transform: translateY(-2px);
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
  white-space: nowrap;
  margin-top: 4px;
}

.stats-row .stat-divider {
  width: 1px;
  height: 32px;
  background: #E8EAED;
}

.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.w-full {
  width: 100%;
}
</style>
