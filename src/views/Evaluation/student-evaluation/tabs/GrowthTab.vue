<template>
  <div class="growth-log">
    <div class="card-header" style="margin-bottom: 16px;">
      <span class="card-title">学生自我反思与成长日志</span>
      <el-button type="primary" :icon="Plus" @click="showGrowthLogDialog">撰写日志</el-button>
    </div>
    <div class="stats-row">
      <div class="stat-item" v-for="(cat, idx) in growthCategoriesComputed" :key="cat.id">
        <span class="stat-num" style="color: #1E5AA8">{{ cat.count }}</span>
        <span class="stat-label">{{ cat.name }}</span>
      </div>
    </div>
    <div class="list-card" style="margin-top: 16px;">
      <div class="card-header">
        <span class="card-title">日志记录</span>
        <div class="header-actions">
          <el-button text :icon="Refresh" @click="refreshGrowthData">刷新</el-button>
        </div>
      </div>
      <el-table :data="growthLogs" stripe class="w-full" :height="300">
        <el-table-column prop="studentName" label="学生姓名" width="100" />
        <el-table-column prop="type" label="日志类型" width="120">
          <template #default="scope">
            <el-tag size="small">{{ scope.row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="标题" />
        <el-table-column prop="sports" label="体育活动" width="120" />
        <el-table-column prop="duration" label="时长" width="80" />
        <el-table-column prop="date" label="撰写日期" width="120" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button text type="primary" size="small" @click="viewGrowthLog(scope.row)">查看</el-button>
            <el-button text type="primary" size="small" @click="editGrowthLog(scope.row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { Plus, Refresh } from '@element-plus/icons-vue'

const evalContext = inject('evalContext')

const {
  growthCategoriesComputed,
  growthLogs,
  growthLogVisible,
  growthLogMode,
  growthLogTypeOptions,
  growthLogForm,
  showGrowthLogDialog,
  viewGrowthLog,
  editGrowthLog,
  saveGrowthLog,
  refreshGrowthData,
  getSportsByType
} = evalContext
</script>

<style scoped>
.growth-log {
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
