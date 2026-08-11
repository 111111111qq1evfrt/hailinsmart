<template>
  <div class="teacher-evaluation">
    <div class="card-header" style="margin-bottom: 16px;">
      <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Document /></el-icon> 教师课堂表现打分</span>
      <el-button type="primary" :icon="Plus" @click="teacherScoreDialogVisible = true">新建打分</el-button>
    </div>
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ teacherStats.avgScore }}</span>
        <span class="stat-label">平均评分</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ teacherStats.totalCourses }}</span>
        <span class="stat-label">已打分课程</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #F5A623">{{ teacherStats.pendingCount }}</span>
        <span class="stat-label">待打分</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ teacherStats.teacherCount }}</span>
        <span class="stat-label">教师数量</span>
      </div>
    </div>
    
    <div class="list-card" style="margin-top: 16px;">
      <div class="card-header">
        <span class="card-title">🎯 拖拽式评分卡（1-5星）</span>
        <div class="header-actions">
          <el-button text :icon="Refresh" @click="refreshTeacherScores">刷新</el-button>
        </div>
      </div>
      <div class="drag-score-container">
        <div class="drag-score-card" v-for="(item, idx) in teacherScoreItems" :key="idx">
          <div class="score-card-header">
            <div class="teacher-info">
              <el-avatar :size="48" :icon="UserFilled" />
              <div class="teacher-detail">
                <span class="teacher-name">{{ item.teacherName }}</span>
                <span class="teacher-course">{{ item.course }}</span>
              </div>
            </div>
            <span class="score-date">{{ item.date }}</span>
          </div>
          <div class="drag-score-section">
            <div class="score-criteria">
              <div class="criteria-item">
                <span class="criteria-label">教学内容</span>
                <div class="star-rating">
                  <el-rate 
                    v-model="item.scores.content" 
                    :max="5" 
                    :disabled="false"
                    text-color="#F5A623"
                    :allow-half="true"
                  />
                  <span class="score-value">{{ item.scores.content }}分</span>
                </div>
              </div>
              <div class="criteria-item">
                <span class="criteria-label">教学方法</span>
                <div class="star-rating">
                  <el-rate 
                    v-model="item.scores.method" 
                    :max="5" 
                    :disabled="false"
                    text-color="#F5A623"
                    :allow-half="true"
                  />
                  <span class="score-value">{{ item.scores.method }}分</span>
                </div>
              </div>
              <div class="criteria-item">
                <span class="criteria-label">课堂互动</span>
                <div class="star-rating">
                  <el-rate 
                    v-model="item.scores.interaction" 
                    :max="5" 
                    :disabled="false"
                    text-color="#F5A623"
                    :allow-half="true"
                  />
                  <span class="score-value">{{ item.scores.interaction }}分</span>
                </div>
              </div>
              <div class="criteria-item">
                <span class="criteria-label">学生参与</span>
                <div class="star-rating">
                  <el-rate 
                    v-model="item.scores.participation" 
                    :max="5" 
                    :disabled="false"
                    text-color="#F5A623"
                    :allow-half="true"
                  />
                  <span class="score-value">{{ item.scores.participation }}分</span>
                </div>
              </div>
              <div class="criteria-item">
                <span class="criteria-label">教学效果</span>
                <div class="star-rating">
                  <el-rate 
                    v-model="item.scores.effectiveness" 
                    :max="5" 
                    :disabled="false"
                    text-color="#F5A623"
                    :allow-half="true"
                  />
                  <span class="score-value">{{ item.scores.effectiveness }}分</span>
                </div>
              </div>
            </div>
            <div class="score-summary">
              <div class="summary-header">
                <span class="summary-label">综合评分</span>
                <span class="summary-score">{{ item.totalScore }}</span>
              </div>
              <el-rate 
                v-model="item.totalScore" 
                :max="5" 
                :disabled="false"
                text-color="#F5A623"
                :allow-half="true"
                class="summary-rate"
              />
              <textarea 
                v-model="item.comment" 
                placeholder="请输入评价意见..." 
                class="comment-input"
              ></textarea>
              <div class="score-actions">
                <el-button type="primary" @click="saveTeacherScore(item)">保存评分</el-button>
                <el-button @click="resetScore(item)">重置</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="list-card" style="margin-top: 16px;">
      <div class="card-header">
        <span class="card-title">教师评分记录</span>
      </div>
      <el-table :data="teacherScoreRecords" stripe class="w-full" :height="300">
        <el-table-column prop="teacherName" label="教师姓名" width="120" />
        <el-table-column prop="course" label="课程名称" width="140" />
        <el-table-column prop="className" label="授课班级" width="120" />
        <el-table-column prop="score" label="综合评分" width="120">
          <template #default="scope">
            <el-rate v-model="scope.row.score" disabled :max="5" text-color="#F5A623" />
          </template>
        </el-table-column>
        <el-table-column prop="date" label="评分日期" width="120" />
        <el-table-column prop="evaluator" label="评分人" width="100" />
        <el-table-column prop="comment" label="评价意见" />
      </el-table>
    </div>

    <ElDialog v-model="teacherScoreDialogVisible" title="新建教师评分打分项" width="550px" :close-on-click-modal="false">
      <el-form :model="newTeacherScoreForm" label-width="100px">
        <el-form-item label="教师姓名" required>
          <el-input v-model="newTeacherScoreForm.teacherName" placeholder="请输入教师姓名" />
        </el-form-item>
        <el-form-item label="课程名称" required>
          <el-input v-model="newTeacherScoreForm.course" placeholder="如：五年级体育课" />
        </el-form-item>
        <el-form-item label="班级类型" required>
          <el-radio-group v-model="newTeacherScoreForm.classType" @change="newTeacherScoreForm.className = ''">
            <el-radio label="行政班">行政班</el-radio>
            <el-radio label="兴趣班">兴趣班</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="授课班级" required>
          <template v-if="newTeacherScoreForm.classType === '行政班'">
            <el-select v-model="newTeacherScoreForm.className" placeholder="请选择班级" class="w-full">
              <el-option v-for="cls in adminClassesForTeacherScore" :key="cls.name" :label="cls.name" :value="cls.name" />
            </el-select>
          </template>
          <template v-else>
            <el-input v-model="newTeacherScoreForm.className" placeholder="请输入兴趣班名称，如：篮球兴趣班" />
          </template>
        </el-form-item>
        <el-form-item label="评分日期">
          <el-date-picker
            v-model="newTeacherScoreForm.date"
            type="date"
            placeholder="选择日期"
            class="w-full"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="teacherScoreDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmNewTeacherScore">确认新建</el-button>
      </template>
    </ElDialog>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { Plus, Refresh, Document, UserFilled } from '@element-plus/icons-vue'

const evalContext = inject('evalContext')

const {
  teacherScoreDialogVisible,
  newTeacherScoreForm,
  teacherScoreItems,
  teacherScoreRecords,
  teacherStats,
  adminClassesForTeacherScore,
  openTeacherScoreDialog,
  confirmNewTeacherScore,
  saveTeacherScore,
  resetScore,
  refreshTeacherScores
} = evalContext
</script>

<style scoped>
.teacher-evaluation {
  width: 100%;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 4px 12px 4px;
  border-bottom: 1px solid #E8EAED;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  display: flex;
  align-items: center;
  gap: 6px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stats-row {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  gap: 16px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #6B7280;
  margin-top: 6px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #E8EAED;
}

.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.w-full {
  width: 100%;
}

.drag-score-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.drag-score-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  transition: all 0.2s;
  border: 1px solid #F0F0F0;
}

.drag-score-card:hover {
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.score-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8EAED;
  margin-bottom: 16px;
}

.teacher-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.teacher-detail {
  display: flex;
  flex-direction: column;
}

.teacher-name {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.teacher-course {
  font-size: 13px;
  color: #6B7280;
}

.score-date {
  font-size: 13px;
  color: #9CA3AF;
}

.drag-score-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.score-criteria {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.criteria-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.criteria-label {
  font-size: 14px;
  color: #6B7280;
}

.star-rating {
  display: flex;
  align-items: center;
  gap: 8px;
}

.score-value {
  font-size: 13px;
  color: #1A1A2E;
  font-weight: 500;
  min-width: 36px;
}

.score-summary {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.summary-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.summary-label {
  font-size: 14px;
  color: #6B7280;
}

.summary-score {
  font-size: 24px;
  font-weight: 700;
  color: #1E5AA8;
}

.summary-rate {
  display: flex;
  justify-content: center;
}

.comment-input {
  width: 100%;
  height: 80px;
  padding: 12px;
  border: 1px solid #E8EAED;
  border-radius: 8px;
  font-size: 14px;
  resize: none;
  background: #FFFFFF;
}

.comment-input:focus {
  outline: none;
  border-color: #3B82F6;
}

.score-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}
</style>
