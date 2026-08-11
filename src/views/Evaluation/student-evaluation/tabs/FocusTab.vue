<template>
  <div class="focus-analysis">
    <div class="card-header" style="margin-bottom: 16px;">
      <span class="card-title">课堂专注力分析</span>
      <el-select v-model="evalContext.focusFilter" placeholder="选择班级" filterable style="width: 160px">
        <el-option label="全部班级" value="all" />
        <el-option label="一年级1班" value="1-1" />
        <el-option label="二年级1班" value="2-1" />
        <el-option label="三年级1班" value="3-1" />
        <el-option label="四年级1班" value="4-1" />
        <el-option label="五年级1班" value="5-1" />
        
      </el-select>
    </div>
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ evalContext.focusSummaryStats.avgRate }}%</span>
        <span class="stat-label">平均专注力</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ evalContext.focusSummaryStats.avgDuration }}分钟</span>
        <span class="stat-label">专注时长</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #E85D4E">{{ evalContext.focusSummaryStats.totalDistractions }}次</span>
        <span class="stat-label">分散次数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ evalContext.focusSummaryStats.level }}</span>
        <span class="stat-label">参与度</span>
      </div>
    </div>
    
    <!-- 专注力热力图 -->
    <div class="list-card" style="margin-top: 16px;">
      <div class="card-header">
        <span class="card-title"> AI行为分析</span>
        <div class="header-actions">
          <el-button text :icon="Refresh" @click="evalContext.refreshHeatmap">刷新数据</el-button>
        </div>
      </div>
      <div class="heatmap-container">
        <div class="heatmap-legend">
          <span class="legend-label">专注度:</span>
          <div class="legend-colors">
            <span class="legend-color" style="background: #1E5AA8"></span>
            <span class="legend-text">高</span>
            <span class="legend-color" style="background: #3B82F6"></span>
            <span class="legend-text">中高</span>
            <span class="legend-color" style="background: #F5A623"></span>
            <span class="legend-text">中</span>
            <span class="legend-color" style="background: #E85D4E"></span>
            <span class="legend-text">低</span>
          </div>
        </div>
        <div class="heatmap-wrapper">
          <!-- 时间标签 -->
          <div class="time-labels">
            <div class="time-label-spacer"></div>
            <span v-for="time in ['0min', '10min', '20min', '30min', '40min', '50min']" :key="time">{{ time }}</span>
          </div>
          
          <!-- 热力图网格 + 学生标签 -->
          <div class="heatmap-body">
            <!-- 学生标签列 -->
            <div class="student-labels">
              <span v-for="(row, idx) in evalContext.filteredHeatmapData" :key="idx">{{ row[0]?.student || `学生${idx + 1}` }}</span>
            </div>
            
            <!-- 热力图网格 -->
            <div class="heatmap-grid">
              <div class="heatmap-row" v-for="(row, rowIdx) in evalContext.filteredHeatmapData" :key="rowIdx">
                <div 
                  v-for="(cell, colIdx) in row" 
                  :key="colIdx"
                  class="heatmap-cell"
                  :style="{ background: evalContext.getHeatmapColor(cell.value) }"
                  @mouseenter="evalContext.showHeatmapTooltip($event, cell)"
                  @mouseleave="evalContext.hideHeatmapTooltip"
                >
                  <span v-if="cell.value >= 70" class="cell-value">{{ cell.value }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="list-card" style="margin-top: 16px;">
      <div class="card-header">
        <span class="card-title">专注力记录</span>
        <div class="header-actions">
          <el-button text :icon="Refresh" @click="evalContext.refreshFocusData">刷新</el-button>
        </div>
      </div>
      <el-table :data="evalContext.filteredFocusRecords" stripe class="w-full" :height="300">
        <el-table-column prop="studentName" label="学生姓名" width="100" />
        <el-table-column prop="class" label="班级" width="100" />
        <el-table-column prop="focusRate" label="专注力" width="180">
          <template #default="scope">
            <el-progress :percentage="scope.row.focusRate" :color="scope.row.focusRate >= 80 ? '#1E5AA8' : scope.row.focusRate >= 60 ? '#F5A623' : '#E85D4E'" />
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="专注时长" width="100" />
        <el-table-column prop="distractions" label="分散次数" width="100" />
        <el-table-column prop="date" label="记录日期" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { Refresh } from '@element-plus/icons-vue'

const evalContext = inject('evalContext')
</script>

<style scoped>
.focus-analysis {
  width: 100%;
}

.heatmap-container {
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.legend-label {
  font-size: 12px;
  color: #6B7280;
}

.legend-colors {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 24px;
  height: 16px;
  border-radius: 4px;
}

.legend-text {
  font-size: 11px;
  color: #6B7280;
  margin-right: 8px;
}

.heatmap-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.time-labels {
  display: flex;
  gap: 4px;
  padding-left: 60px;
}

.time-label-spacer {
  width: 60px;
  flex-shrink: 0;
}

.time-labels span {
  width: 60px;
  text-align: center;
  font-size: 11px;
  color: #9CA3AF;
}

.heatmap-body {
  display: flex;
  gap: 8px;
}

.student-labels {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 60px;
  flex-shrink: 0;
}

.student-labels span {
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  color: #9CA3AF;
}

.heatmap-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}

.heatmap-row {
  display: flex;
  gap: 4px;
}

.heatmap-cell {
  width: 60px;
  height: 36px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  opacity: 0.85;
}

.heatmap-cell:hover {
  opacity: 1;
  transform: scale(1.05);
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.cell-value {
  font-size: 11px;
  font-weight: 600;
  color: #FFFFFF;
}

.heatmap-tooltip {
  position: fixed;
  background: #1A1A2E;
  color: #FFFFFF;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 13px;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
  pointer-events: none;
}

.heatmap-tooltip div {
  margin-bottom: 4px;
}

.heatmap-tooltip div:last-child {
  margin-bottom: 0;
}

@media screen and (max-width: 992px) {
  .heatmap-container {
    overflow-x: auto;
  }
  
  .heatmap-wrapper {
    min-width: 600px;
  }
}

@media screen and (max-width: 768px) {
  .heatmap-container {
    overflow-x: auto;
    padding: 12px;
  }
  
  .heatmap-wrapper {
    min-width: 500px;
  }
  
  .heatmap-cell {
    width: 50px;
    height: 32px;
  }
  
  .cell-value {
    font-size: 10px;
  }
  
  .heatmap-legend {
    flex-wrap: wrap;
  }
  
  .legend-label {
    width: 100%;
    margin-bottom: 8px;
  }
}

@media screen and (max-width: 480px) {
  .heatmap-wrapper {
    min-width: 400px;
  }
  
  .heatmap-cell {
    width: 40px;
    height: 28px;
  }
  
  .cell-value {
    font-size: 9px;
  }
  
  .student-labels {
    min-width: 60px;
  }
  
  .student-labels span {
    font-size: 11px;
  }
  
  .time-labels span {
    font-size: 11px;
  }
}
</style>
