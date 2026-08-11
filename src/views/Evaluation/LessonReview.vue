<template>
  <div class="lesson-review">
    <!-- 顶部操作 -->
    <div class="page-header">
      <div class="header-filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索课程名称/教师"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
        />
        <el-select v-model="filterStatus" placeholder="课程状态" clearable style="width: 140px">
          <el-option label="进行中" value="live" />
          <el-option label="已结束" value="completed" />
          <el-option label="即将开始" value="upcoming" />
        </el-select>
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="exportData">导出数据</el-button>
        <el-button type="primary" :icon="Plus" @click="startLesson">发起公开课</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ reviewStats.total }}</span>
        <span class="stat-label">公开课总数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num text-primary">{{ reviewStats.live }}</span>
        <span class="stat-label">进行中</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #3B82F6">{{ reviewStats.completed }}</span>
        <span class="stat-label">已结束</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #F5A623">{{ reviewStats.upcoming }}</span>
        <span class="stat-label">即将开始</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ reviewStats.totalViewers }}</span>
        <span class="stat-label">总听课人次</span>
      </div>
    </div>

    <!-- 课程列表 -->
    <div class="list-card">
      <div class="card-header">
        <span class="card-title">公开课列表</span>
        <div class="header-actions">
          <el-button text :icon="Refresh" @click="refreshData">刷新</el-button>
        </div>
      </div>
      <div class="lesson-grid">
        <div class="lesson-card" v-for="lesson in filteredLessons" :key="lesson.id">
          <div class="lesson-cover">
            <img v-if="lesson.frame" :src="lesson.frame" :alt="lesson.title" class="cover-image" />
            <div v-else class="cover-empty">
              <el-icon :size="40" color="#9CA3AF"><VideoCamera /></el-icon>
              <span class="empty-text">暂无视频源</span>
            </div>
            <span class="lesson-status-badge" :class="getStatusClass(lesson.status)">
              {{ getStatusText(lesson.status) }}
            </span>
          </div>
          <div class="lesson-info">
            <h4 class="lesson-title">{{ lesson.title }}</h4>
            <div class="lesson-meta">
              <span><el-icon><User /></el-icon> {{ lesson.teacher }}</span>
              <span><el-icon><Location /></el-icon> {{ lesson.location }}</span>
            </div>
            <div class="lesson-time">
              <el-icon><Calendar /></el-icon>
              <span>{{ lesson.date }} {{ lesson.time }}</span>
            </div>
            <div class="lesson-footer">
              <span class="viewer-count">
                <el-icon><View /></el-icon> {{ lesson.viewers || 0 }}人看过
              </span>
              <div class="lesson-actions">
                <el-button v-if="lesson.status === 'live'" type="primary" size="small" :icon="VideoPlay" @click="joinLesson(lesson)">进入</el-button>
                <el-button v-else-if="lesson.status === 'completed'" text type="primary" size="small" :icon="VideoPlay" @click="viewRecording(lesson)">回放</el-button>
                <el-button text size="small" :icon="Edit" @click="openReviewDialog(lesson)">评课</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 多模态评课区域 -->
    <div class="multi-modal-row">
      <!-- 拖拽评价指标 -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Histogram /></el-icon> 自定义评价指标</span>
          <el-button text size="small" @click="showDragConfig = !showDragConfig">
            {{ showDragConfig ? '收起配置' : '配置指标' }}
          </el-button>
        </div>
        <div v-if="showDragConfig" class="drag-config">
          <div class="drag-section">
            <h4>可用指标</h4>
            <div class="drag-list">
              <div 
                v-for="item in availableIndicators" 
                :key="item.id"
                class="drag-item"
                draggable="true"
                @dragstart="handleDragStart($event, item)"
              >
                {{ item.name }}
              </div>
            </div>
          </div>
          <div class="drag-section">
            <h4>已选指标（拖拽调整顺序）</h4>
            <div 
              class="drag-list active"
              @dragover.prevent
              @drop="handleDrop"
            >
              <div 
                v-for="(item, index) in selectedIndicators" 
                :key="item.id"
                class="drag-item selected"
                draggable="true"
                @dragstart="handleDragStart($event, item, index)"
                @dragover.prevent
                @drop="handleReorder($event, index)"
              >
                {{ item.name }}
                <el-slider 
                  :value="item.weight" 
                  @change="(val) => updateIndicatorWeight(index, val)"
                  :min="1" 
                  :max="100" 
                  :step="1" 
                  :show-input="false"
                  style="width: 80px; margin-left: 8px;"
                />
                <span class="weight-label">{{ item.weight }}%</span>
                <el-button text size="mini" @click="removeIndicator(index)">×</el-button>
              </div>
            </div>
          </div>
        </div>
        <div v-else>
          <div class="indicator-preview">
            <div v-for="item in selectedIndicators" :key="item.id" class="indicator-tag">
              {{ item.name }} <span class="weight">{{ item.weight }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI辅助评课 -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">🤖 AI辅助评课分析</span>
          <el-tag size="small" type="success">分析中</el-tag>
        </div>
        <div class="ai-analysis">
          <div class="analysis-item">
            <div class="analysis-icon">💬</div>
            <div class="analysis-content">
              <span class="analysis-label">高频互动点</span>
              <span class="analysis-value">23次</span>
              <div class="analysis-detail">
                <span>提问:"同学们理解了吗?" - 5次</span>
                <span>引导思考 - 8次</span>
                <span>小组讨论引导 - 10次</span>
              </div>
            </div>
          </div>
          <div class="analysis-item">
            <div class="analysis-icon">🎯</div>
            <div class="analysis-content">
              <span class="analysis-label">高阶思维提问</span>
              <span class="analysis-value">占比 45%</span>
              <div class="analysis-detail">
                <span>分析类问题 - 11次</span>
                <span>评价类问题 - 7次</span>
              </div>
            </div>
          </div>
          <div class="analysis-item">
            <div class="analysis-icon"><el-icon :size="18" color="#1E5AA8"><Timer /></el-icon></div>
            <div class="analysis-content">
              <span class="analysis-label">教师语言节奏</span>
              <span class="analysis-value">适中</span>
              <div class="analysis-detail">
                <span>平均语速: 120字/分钟</span>
                <span>停顿合理，给予思考时间</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 课堂行为热力图 -->
    <div class="chart-card">
      <div class="card-header">
        <span class="card-title">📈 课堂热力图</span>
        <el-select v-model="heatmapTime" placeholder="选择时段" style="width: 120px">
          <el-option label="第1节" value="1" />
          <el-option label="第2节" value="2" />
          <el-option label="第3节" value="3" />
          <el-option label="第4节" value="4" />
        </el-select>
      </div>
      <div class="heatmap-container">
        <div class="heatmap-legend">
          <span>低</span>
          <div class="legend-bar"></div>
          <span>高</span>
        </div>
        <div class="heatmap-grid">
          <div 
            v-for="(row, i) in heatmapData" 
            :key="i" 
            class="heatmap-row"
          >
            <div 
              v-for="(cell, j) in row" 
              :key="j" 
              class="heatmap-cell"
              :style="{ backgroundColor: getHeatColor(cell) }"
              :title="`热度: ${cell}`"
            ></div>
          </div>
        </div>
        <div class="heatmap-labels">
          <span>教师活动区域</span>
          <span>学生座位区</span>
        </div>
        <div class="behavior-stats">
          <div class="stat">
            <span>学生注意力集中时长</span>
            <span class="value">42分钟 (87.5%)</span>
          </div>
          <div class="stat">
            <span>教师移动轨迹</span>
            <span class="value">覆盖7个区域</span>
          </div>
          <div class="stat">
            <span>师生互动次数</span>
            <span class="value">38次</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 评课数据 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">评课指标得分</span>
        </div>
        <div ref="reviewChart" class="chart"></div>
      </div>
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">听课参与度趋势</span>
        </div>
        <div ref="attendanceChart" class="chart"></div>
      </div>
    </div>

    <!-- 教师能力分析 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Histogram /></el-icon> 教师能力雷达图</span>
          <el-select v-model="selectedTeacher" placeholder="选择教师" style="width: 140px">
            <el-option label="全部教师" value="" />
            <el-option v-for="teacher in teacherList" :key="teacher" :label="teacher" :value="teacher" />
          </el-select>
        </div>
        <div ref="teacherRadarChart" class="chart"></div>
      </div>
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">📈 历次课程成长曲线</span>
        </div>
        <div ref="growthChart" class="chart"></div>
      </div>
    </div>

    <!-- 评课质量分析 -->
    <div class="chart-card full-width">
      <div class="card-header">
        <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Document /></el-icon> 评课质量分析</span>
      </div>
      <div class="quality-analysis">
        <div class="quality-row">
      <div class="quality-item">
        <span class="quality-label">评课完成率</span>
        <span class="quality-value">{{ qualityStats.completionRate }}%</span>
        <el-progress :percentage="qualityStats.completionRate" color="#1E5AA8" :stroke-width="8" />
      </div>
      <div class="quality-item">
        <span class="quality-label">平均评语长度</span>
        <span class="quality-value">{{ qualityStats.avgCommentLength }}字</span>
        <el-progress :percentage="Math.min(100, qualityStats.avgCommentLength)" color="#3B82F6" :stroke-width="8" />
      </div>
      <div class="quality-item">
        <span class="quality-label">评分标准差</span>
        <span class="quality-value">{{ qualityStats.scoreStdDev.toFixed(1) }}</span>
        <el-progress :percentage="Math.min(100, qualityStats.scoreStdDev * 10)" color="#F5A623" :stroke-width="8" />
      </div>
      <div class="quality-item">
        <span class="quality-label">优质评价占比</span>
        <span class="quality-value">{{ qualityStats.highQualityRate }}%</span>
        <el-progress :percentage="qualityStats.highQualityRate" color="#1E5AA8" :stroke-width="8" />
      </div>
        </div>
        <div class="score-distribution">
          <h4>评分分布</h4>
          <div class="distribution-bars">
            <div v-for="(count, range) in qualityStats.scoreDistribution" :key="range" class="distribution-bar">
              <span class="bar-label">{{ range }}</span>
              <div class="bar-container">
                <div class="bar-fill" :style="{ width: (count / qualityStats.maxScoreCount * 100) + '%' }"></div>
              </div>
              <span class="bar-count">{{ count }}人</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="reviewDialogVisible" title="评课" width="550px">
      <div v-if="selectedLesson">
        <div class="review-header">
          <h4>{{ selectedLesson.title }}</h4>
          <p>授课教师：{{ selectedLesson.teacher }}</p>
        </div>
        <el-form :model="reviewForm" label-width="100px">
          <el-form-item label="教学目标">
            <el-slider v-model="reviewForm.objective" :min="0" :max="100" :step="1" show-input />
          </el-form-item>
          <el-form-item label="课堂组织">
            <el-slider v-model="reviewForm.organization" :min="0" :max="100" :step="1" show-input />
          </el-form-item>
          <el-form-item label="师生互动">
            <el-slider v-model="reviewForm.interaction" :min="0" :max="100" :step="1" show-input />
          </el-form-item>
          <el-form-item label="教学方法">
            <el-slider v-model="reviewForm.method" :min="0" :max="100" :step="1" show-input />
          </el-form-item>
          <el-form-item label="教学效果">
            <el-slider v-model="reviewForm.effect" :min="0" :max="100" :step="1" show-input />
          </el-form-item>
          <el-form-item label="综合评语">
            <el-input v-model="reviewForm.comments" type="textarea" :rows="4" placeholder="请输入评课意见和建议" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="reviewDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitReview">提交评课</el-button>
      </template>
    </el-dialog>

    <!-- 发起公开课 -->
    <el-dialog v-model="createLessonVisible" title="发起公开课" width="520px">
      <el-form :model="newLessonForm" label-width="100px">
        <el-form-item label="课程名称" required><el-input v-model="newLessonForm.title" /></el-form-item>
        <el-form-item label="授课教师" required><el-input v-model="newLessonForm.teacher" /></el-form-item>
        <el-form-item label="上课地点"><el-input v-model="newLessonForm.location" /></el-form-item>
        <el-form-item label="计划时间"><el-date-picker v-model="newLessonForm.date" type="datetime" class="w-full" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createLessonVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateLesson">确认发起</el-button>
      </template>
    </el-dialog>

    <!-- 直播/回放 -->
    <el-dialog v-model="playerVisible" :title="playerTitle" width="900px" destroy-on-close>
      <VideoPlayer src="/示例视频.mp4" :autoplay="true" :show-controls="true" :show-timeline="true" :show-fullscreen="true" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Search, Download, Plus, Refresh,
  VideoCamera, User, Location, Calendar, View, Edit, VideoPlay,
  Histogram, Timer, Document
} from '@element-plus/icons-vue'
import echarts from '@/utils/echarts'
import store from '../../store/global'
import { getSchoolMockData } from '../../utils/mockDataLoader'
import VideoPlayer from '@/components/media/VideoPlayer.vue'
import { usePersistedRef } from '@/composables/usePersistedRef'
import { generateDeterministicId } from '@/utils/seededRandom'
import { extractVideoFrame } from '@/utils/videoFrame'

const searchQuery = ref('')
const filterStatus = ref('')
const reviewChart = ref(null)
const attendanceChart = ref(null)
const teacherRadarChart = ref(null)
const growthChart = ref(null)
let reviewChartInstance = null
let attendanceChartInstance = null
let teacherRadarChartInstance = null
let growthChartInstance = null

const selectedTeacher = ref('')

const schoolTeacherAbility = {
  'hailin-second-primary': {
    '乔晶': { objective: 88, organization: 82, interaction: 92, method: 85, effect: 86 },
    '宋丽君': { objective: 85, organization: 90, interaction: 78, method: 92, effect: 82 },
    '于化龙': { objective: 92, organization: 88, interaction: 85, method: 88, effect: 90 },
    '宫秋楠': { objective: 78, organization: 85, interaction: 90, method: 80, effect: 82 },
    '高霞': { objective: 82, organization: 88, interaction: 88, method: 76, effect: 80 },
    '卢伟珍': { objective: 90, organization: 92, interaction: 86, method: 94, effect: 88 }
  },
  'hailin-zirong-primary': {
    '马建华': { objective: 85, organization: 88, interaction: 80, method: 86, effect: 84 },
    '陈秀英': { objective: 80, organization: 82, interaction: 92, method: 78, effect: 86 },
    '孙老师': { objective: 90, organization: 94, interaction: 85, method: 90, effect: 88 },
    '李老师': { objective: 75, organization: 80, interaction: 88, method: 82, effect: 80 },
    '周老师': { objective: 88, organization: 85, interaction: 82, method: 92, effect: 85 },
    '吴老师': { objective: 86, organization: 84, interaction: 90, method: 88, effect: 87 }
  },
  'linhai-experimental-primary': {
    '王海燕': { objective: 86, organization: 84, interaction: 90, method: 88, effect: 87 },
    '张志远': { objective: 82, organization: 90, interaction: 85, method: 84, effect: 86 },
    '刘老师': { objective: 91, organization: 88, interaction: 82, method: 90, effect: 92 },
    '陈老师': { objective: 79, organization: 86, interaction: 92, method: 80, effect: 83 },
    '杨老师': { objective: 87, organization: 92, interaction: 84, method: 88, effect: 90 },
    '郭老师': { objective: 85, organization: 88, interaction: 80, method: 86, effect: 84 }
  }
}

const schoolTeacherGrowth = {
  'hailin-second-primary': {
    '乔晶': { dates: ['2026-01-08', '2026-01-14'], scores: [85, 87] },
    '宋丽君': { dates: ['2026-01-07', '2026-01-13'], scores: [82, 85] },
    '于化龙': { dates: ['2026-01-12'], scores: [90] },
    '宫秋楠': { dates: ['2026-01-11'], scores: [79] },
    '高霞': { dates: ['2026-01-10'], scores: [80] },
    '卢伟珍': { dates: ['2026-01-09'], scores: [89] }
  },
  'hailin-zirong-primary': {
    '马建华': { dates: ['2026-01-08', '2026-01-14'], scores: [82, 84] },
    '陈秀英': { dates: ['2026-01-07', '2026-01-13'], scores: [78, 82] },
    '孙老师': { dates: ['2026-01-12'], scores: [91] },
    '李老师': { dates: ['2026-01-11'], scores: [77] },
    '周老师': { dates: ['2026-01-09'], scores: [86] },
    '吴老师': { dates: ['2026-01-08'], scores: [84] }
  },
  'linhai-experimental-primary': {
    '王海燕': { dates: ['2026-01-08', '2026-01-14'], scores: [84, 87] },
    '张志远': { dates: ['2026-01-07', '2026-01-13'], scores: [80, 85] },
    '刘老师': { dates: ['2026-01-12'], scores: [92] },
    '陈老师': { dates: ['2026-01-11'], scores: [78] },
    '杨老师': { dates: ['2026-01-09'], scores: [88] },
    '郭老师': { dates: ['2026-01-08'], scores: [85] }
  }
}

const teacherAbilityData = computed(() => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  return schoolTeacherAbility[schoolId] || schoolTeacherAbility['hailin-second-primary']
})

const teacherGrowthData = computed(() => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  return schoolTeacherGrowth[schoolId] || schoolTeacherGrowth['hailin-second-primary']
})

const reviewDialogVisible = ref(false)
const createLessonVisible = ref(false)
const playerVisible = ref(false)
const playerTitle = ref('')
const newLessonForm = ref({ title: '', teacher: '', location: '', date: null })

// 获取学校数据
const schoolData = computed(() => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  return getSchoolMockData(schoolId)
})

const schoolLessonRecords = {
  'hailin-second-primary': [
    {
      id: 1,
      title: '篮球基础训练课程',
      teacher: '乔晶',
      subject: '篮球',
      grade: '四年级',
      date: '2026-01-14',
      time: '09:00-10:30',
      location: '体育馆',
      status: 'completed',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=basketball%20training%20class%20students%20school%20gymnasium&image_size=landscape_16_9',
      hasReview: true,
      review: {
        objective: 85,
        organization: 88,
        interaction: 90,
        method: 82,
        effect: 86,
        comments: '本节课教学目标明确，教师示范标准，学生参与度高，互动环节设计合理，建议增加对抗练习环节。'
      },
      viewers: 128,
      peakViewers: 256
    },
    {
      id: 2,
      title: '足球战术分析',
      teacher: '宋丽君',
      subject: '足球',
      grade: '五年级',
      date: '2026-01-13',
      time: '14:00-15:30',
      location: '足球场',
      status: 'completed',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=football%20soccer%20tactics%20analysis%20training%20school&image_size=landscape_16_9',
      hasReview: true,
      review: {
        objective: 82,
        organization: 85,
        interaction: 78,
        method: 88,
        effect: 80,
        comments: '战术讲解清晰，配合图示演示，学生理解较快。建议增加更多实战演练时间。'
      },
      viewers: 86,
      peakViewers: 189
    },
    {
      id: 3,
      title: '田径体能训练',
      teacher: '于化龙',
      subject: '田径',
      grade: '六年级',
      date: '2026-01-12',
      time: '10:00-11:30',
      location: '田径场',
      status: 'completed',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=track%20and%20field%20athletics%20training%20school%20sports&image_size=landscape_16_9',
      hasReview: true,
      review: {
        objective: 90,
        organization: 92,
        interaction: 85,
        method: 88,
        effect: 91,
        comments: '体能训练计划科学合理，强度适中，学生表现积极，教学效果显著。'
      },
      viewers: 54,
      peakViewers: 145
    },
    {
      id: 4,
      title: '羽毛球发球技巧',
      teacher: '宫秋楠',
      subject: '羽毛球',
      grade: '三年级',
      date: '2026-01-11',
      time: '15:00-16:30',
      location: '体育馆',
      status: 'completed',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=badminton%20serve%20technique%20training%20school%20gymnasium&image_size=landscape_16_9',
      hasReview: false,
      viewers: 42,
      peakViewers: 98
    },
    {
      id: 5,
      title: '体操基础动作',
      teacher: '高霞',
      subject: '体操',
      grade: '二年级',
      date: '2026-01-10',
      time: '09:00-10:30',
      location: '体操馆',
      status: 'completed',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=gymnastics%20basic%20movements%20training%20school%20gym&image_size=landscape_16_9',
      hasReview: true,
      review: {
        objective: 78,
        organization: 82,
        interaction: 88,
        method: 75,
        effect: 80,
        comments: '动作示范规范，保护措施到位，学生学习积极性高。'
      },
      viewers: 67,
      peakViewers: 134
    },
    {
      id: 6,
      title: '游泳入门教学',
      teacher: '卢伟珍',
      subject: '游泳',
      grade: '一年级',
      date: '2026-01-09',
      time: '14:00-15:30',
      location: '游泳馆',
      status: 'completed',
      cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=swimming%20beginner%20lesson%20school%20pool&image_size=landscape_16_9',
      hasReview: true,
      review: {
        objective: 88,
        organization: 90,
        interaction: 85,
        method: 92,
        effect: 86,
        comments: '安全措施到位，教学循序渐进，学生进步明显。'
      },
      viewers: 38,
      peakViewers: 89
    },
    {
      id: 7,
      title: '篮球投篮训练',
      teacher: '乔晶',
      subject: '篮球',
      grade: '四年级',
      date: '2026-01-08',
      time: '10:00-11:30',
      location: '体育馆',
      status: 'completed',
      hasReview: true,
      review: {
        objective: 86,
        organization: 84,
        interaction: 88,
        method: 85,
        effect: 87,
        comments: '投篮技巧讲解详细，分组练习效果好。'
      },
      viewers: 75,
      peakViewers: 162
    },
    {
      id: 8,
      title: '足球传球训练',
      teacher: '宋丽君',
      subject: '足球',
      grade: '五年级',
      date: '2026-01-07',
      time: '09:00-10:30',
      location: '足球场',
      status: 'completed',
      hasReview: true,
      review: {
        objective: 80,
        organization: 85,
        interaction: 78,
        method: 82,
        effect: 84,
        comments: '传球训练组织有序，学生配合良好。'
      },
      viewers: 45,
      peakViewers: 0
    }
  ],
  'hailin-zirong-primary': [
    {
      id: 1,
      title: '篮球进阶技巧',
      teacher: '马建华',
      subject: '篮球',
      grade: '五年级',
      date: '2026-01-14',
      time: '09:00-10:30',
      location: '体育馆',
      status: 'completed',
      hasReview: true,
      review: {
        objective: 85,
        organization: 88,
        interaction: 80,
        method: 86,
        effect: 84,
        comments: '教学目标明确，技术讲解到位，学生掌握较好。'
      },
      viewers: 95,
      peakViewers: 180
    },
    {
      id: 2,
      title: '足球基础训练',
      teacher: '陈秀英',
      subject: '足球',
      grade: '四年级',
      date: '2026-01-13',
      time: '14:00-15:30',
      location: '足球场',
      status: 'completed',
      hasReview: true,
      review: {
        objective: 80,
        organization: 82,
        interaction: 92,
        method: 78,
        effect: 86,
        comments: '互动环节设计出色，学生参与热情高。'
      },
      viewers: 72,
      peakViewers: 145
    },
    {
      id: 3,
      title: '田径短跑训练',
      teacher: '孙老师',
      subject: '田径',
      grade: '六年级',
      date: '2026-01-12',
      time: '10:00-11:30',
      location: '田径场',
      status: 'completed',
      hasReview: true,
      review: {
        objective: 90,
        organization: 94,
        interaction: 85,
        method: 90,
        effect: 88,
        comments: '教学组织严谨，训练效果显著。'
      },
      viewers: 48,
      peakViewers: 112
    },
    {
      id: 4,
      title: '羽毛球基础',
      teacher: '李老师',
      subject: '羽毛球',
      grade: '三年级',
      date: '2026-01-11',
      time: '15:00-16:30',
      location: '体育馆',
      status: 'completed',
      hasReview: false,
      viewers: 35,
      peakViewers: 78
    },
    {
      id: 5,
      title: '游泳提高班',
      teacher: '周老师',
      subject: '游泳',
      grade: '二年级',
      date: '2026-01-10',
      time: '14:00-15:30',
      location: '游泳馆',
      status: 'completed',
      hasReview: true,
      review: {
        objective: 88,
        organization: 85,
        interaction: 82,
        method: 92,
        effect: 85,
        comments: '教学方法新颖，学生进步明显。'
      },
      viewers: 42,
      peakViewers: 95
    },
    {
      id: 6,
      title: '篮球对抗训练',
      teacher: '马建华',
      subject: '篮球',
      grade: '五年级',
      date: '2026-01-08',
      time: '10:00-11:30',
      location: '体育馆',
      status: 'completed',
      hasReview: true,
      review: {
        objective: 82,
        organization: 86,
        interaction: 84,
        method: 84,
        effect: 84,
        comments: '对抗训练安排合理，学生积极性高。'
      },
      viewers: 68,
      peakViewers: 135
    },
    {
      id: 7,
      title: '足球射门训练',
      teacher: '吴老师',
      subject: '足球',
      grade: '四年级',
      date: '2026-01-07',
      time: '09:00-10:30',
      location: '足球场',
      status: 'completed',
      hasReview: true,
      review: {
        objective: 78,
        organization: 82,
        interaction: 76,
        method: 80,
        effect: 83,
        comments: '射门训练效果良好，学生进步明显。'
      },
      viewers: 38,
      peakViewers: 0
    }
  ],
  'linhai-experimental-primary': [
    {
      id: 1,
      title: '篮球战术配合',
      teacher: '王海燕',
      subject: '篮球',
      grade: '五年级',
      date: '2026-01-14',
      time: '09:00-10:30',
      location: '体育馆',
      status: 'completed',
      hasReview: true,
      review: {
        objective: 86,
        organization: 84,
        interaction: 90,
        method: 88,
        effect: 87,
        comments: '战术配合讲解清晰，学生理解到位。'
      },
      viewers: 88,
      peakViewers: 172
    },
    {
      id: 2,
      title: '足球控球训练',
      teacher: '张志远',
      subject: '足球',
      grade: '四年级',
      date: '2026-01-13',
      time: '14:00-15:30',
      location: '足球场',
      status: 'completed',
      hasReview: true,
      review: {
        objective: 82,
        organization: 90,
        interaction: 85,
        method: 84,
        effect: 86,
        comments: '课堂组织有序，控球训练效果好。'
      },
      viewers: 65,
      peakViewers: 130
    },
    {
      id: 3,
      title: '田径长跑训练',
      teacher: '刘老师',
      subject: '田径',
      grade: '六年级',
      date: '2026-01-12',
      time: '10:00-11:30',
      location: '田径场',
      status: 'completed',
      hasReview: true,
      review: {
        objective: 91,
        organization: 88,
        interaction: 82,
        method: 90,
        effect: 92,
        comments: '训练计划科学，学生耐力提升明显。'
      },
      viewers: 42,
      peakViewers: 98
    },
    {
      id: 4,
      title: '羽毛球技巧提升',
      teacher: '陈老师',
      subject: '羽毛球',
      grade: '三年级',
      date: '2026-01-11',
      time: '15:00-16:30',
      location: '体育馆',
      status: 'completed',
      hasReview: false,
      viewers: 38,
      peakViewers: 85
    },
    {
      id: 5,
      title: '体操技巧训练',
      teacher: '杨老师',
      subject: '体操',
      grade: '二年级',
      date: '2026-01-10',
      time: '09:00-10:30',
      location: '体操馆',
      status: 'completed',
      hasReview: true,
      review: {
        objective: 87,
        organization: 92,
        interaction: 84,
        method: 88,
        effect: 90,
        comments: '课堂组织优秀，技巧训练扎实。'
      },
      viewers: 55,
      peakViewers: 120
    },
    {
      id: 6,
      title: '篮球投篮技巧',
      teacher: '王海燕',
      subject: '篮球',
      grade: '五年级',
      date: '2026-01-08',
      time: '10:00-11:30',
      location: '体育馆',
      status: 'completed',
      hasReview: true,
      review: {
        objective: 84,
        organization: 82,
        interaction: 88,
        method: 86,
        effect: 87,
        comments: '投篮技巧讲解详细，学生进步明显。'
      },
      viewers: 72,
      peakViewers: 145
    },
    {
      id: 7,
      title: '足球传球技巧',
      teacher: '郭老师',
      subject: '足球',
      grade: '四年级',
      date: '2026-01-07',
      time: '09:00-10:30',
      location: '足球场',
      status: 'completed',
      hasReview: true,
      review: {
        objective: 82,
        organization: 86,
        interaction: 80,
        method: 84,
        effect: 85,
        comments: '传球技巧讲解清晰，学生掌握良好。'
      },
      viewers: 52,
      peakViewers: 0
    }
  ]
}

const getSchoolLessonRecords = () => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  return schoolLessonRecords[schoolId] || schoolLessonRecords['hailin-second-primary']
}

// 课程记录 — 持久化（学校隔离）
const lessonRecords = usePersistedRef(`smart_pe_review_lessons_${store.state.school.id || 'hailin-second-primary'}`, getSchoolLessonRecords())

// 初始化课程记录
import { watch } from 'vue'
watch(schoolData, (newData) => {
  if (newData?.lessonRecords && lessonRecords.value.length === 0) {
    lessonRecords.value = [...newData.lessonRecords]
  }
}, { immediate: true })
const selectedLesson = ref(null)
const reviewForm = ref({
  objective: 80,
  organization: 85,
  interaction: 75,
  method: 82,
  effect: 88,
  comments: ''
})

// 拖拽评价指标
const showDragConfig = ref(false)
const availableIndicators = ref([
  { id: 1, name: '教学目标达成度', weight: 20 },
  { id: 2, name: '学生参与率', weight: 20 },
  { id: 3, name: '课堂互动质量', weight: 20 },
  { id: 4, name: '教学方法创新', weight: 20 },
  { id: 5, name: '教学节奏把控', weight: 20 },
  { id: 6, name: '课堂氛围营造', weight: 20 },
  { id: 7, name: '多媒体运用', weight: 20 },
  { id: 8, name: '差异化教学', weight: 20 },
  { id: 9, name: '教学评价反馈', weight: 20 },
  { id: 10, name: '作业布置合理性', weight: 20 }
])
const selectedIndicators = usePersistedRef(`smart_pe_review_indicators_${store.state.school.id || 'hailin-second-primary'}`, [
  { id: 1, name: '教学目标达成度', weight: 30 },
  { id: 3, name: '课堂互动质量', weight: 25 },
  { id: 2, name: '学生参与率', weight: 25 },
  { id: 4, name: '教学方法创新', weight: 20 }
])
const draggedItem = ref(null)
const draggedIndex = ref(-1)

// 热力图数据
const heatmapTime = ref('1')
const schoolHeatmapData = {
  'hailin-second-primary': [
    [85, 72, 65, 58, 52, 48, 45, 42],
    [78, 90, 82, 75, 68, 62, 55, 48],
    [72, 85, 95, 88, 80, 72, 65, 58],
    [65, 78, 90, 98, 92, 85, 78, 70],
    [58, 72, 85, 95, 100, 95, 88, 80],
    [52, 65, 78, 90, 95, 98, 92, 85],
    [48, 58, 72, 85, 92, 95, 90, 82],
    [42, 52, 65, 78, 85, 90, 85, 78]
  ],
  'hailin-zirong-primary': [
    [78, 65, 58, 52, 45, 42, 38, 35],
    [72, 85, 78, 70, 62, 55, 48, 42],
    [65, 80, 90, 85, 78, 70, 62, 55],
    [58, 72, 85, 95, 88, 80, 72, 65],
    [52, 65, 80, 92, 98, 92, 85, 78],
    [45, 58, 72, 85, 92, 95, 90, 82],
    [42, 52, 65, 78, 88, 92, 88, 80],
    [38, 48, 58, 72, 82, 88, 82, 75]
  ],
  'linhai-experimental-primary': [
    [92, 82, 75, 68, 62, 58, 55, 50],
    [85, 95, 88, 82, 75, 68, 62, 55],
    [78, 90, 100, 95, 88, 80, 75, 68],
    [72, 85, 95, 100, 95, 88, 82, 75],
    [65, 78, 90, 98, 100, 98, 92, 85],
    [60, 72, 85, 95, 98, 100, 95, 88],
    [55, 65, 78, 90, 95, 98, 92, 85],
    [50, 60, 72, 85, 92, 95, 90, 82]
  ]
}

const getSchoolHeatmapData = () => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  return schoolHeatmapData[schoolId] || schoolHeatmapData['hailin-second-primary']
}

const heatmapData = usePersistedRef(`smart_pe_review_heatmap_${store.state.school.id || 'hailin-second-primary'}`, getSchoolHeatmapData())

// 统计数据从实际课程列表动态计算
const reviewStats = computed(() => {
  const allLessons = lessonRecords.value
  return {
    total: allLessons.length,
    live: allLessons.filter(l => l.status === 'live').length,
    completed: allLessons.filter(l => l.status === 'completed').length,
    upcoming: allLessons.filter(l => l.status === 'upcoming').length,
    totalViewers: allLessons.reduce((sum, l) => sum + (l.viewers || 0), 0)
  }
})

// 教师列表
const teacherList = computed(() => {
  const teachers = [...new Set((lessonRecords.value || []).map(l => l.teacher))]
  return teachers.filter(t => t)
})

// 评课质量统计
const qualityStats = computed(() => {
  const reviewedLessons = (lessonRecords.value || []).filter(l => l.hasReview && l.review)
  const totalLessons = (lessonRecords.value || []).filter(l => l.status === 'completed').length
  
  const completionRate = totalLessons > 0 ? Math.round((reviewedLessons.length / totalLessons) * 100) : 0
  
  const commentLengths = reviewedLessons.map(l => l.review.comments?.length || 0)
  const avgCommentLength = commentLengths.length > 0 
    ? Math.round(commentLengths.reduce((a, b) => a + b, 0) / commentLengths.length) 
    : 0
  
  const scores = reviewedLessons.map(l => {
    const r = l.review
    return Math.round((r.objective + r.organization + r.interaction + r.method + r.effect) / 5)
  })
  const avgScore = scores.length > 0 
    ? scores.reduce((a, b) => a + b, 0) / scores.length 
    : 0
  const scoreStdDev = scores.length > 0 
    ? Math.sqrt(scores.reduce((sum, s) => sum + Math.pow(s - avgScore, 2), 0) / scores.length) 
    : 0
  
  const highQualityReviews = reviewedLessons.filter(l => {
    const r = l.review
    return r.comments && r.comments.length >= 50
  })
  const highQualityRate = reviewedLessons.length > 0 
    ? Math.round((highQualityReviews.length / reviewedLessons.length) * 100) 
    : 0
  
  const scoreDistribution = {
    '0-60': scores.filter(s => s >= 0 && s < 60).length,
    '60-70': scores.filter(s => s >= 60 && s < 70).length,
    '70-80': scores.filter(s => s >= 70 && s < 80).length,
    '80-90': scores.filter(s => s >= 80 && s < 90).length,
    '90-100': scores.filter(s => s >= 90 && s <= 100).length
  }
  const maxScoreCount = Math.max(...Object.values(scoreDistribution), 1)
  
  return {
    completionRate,
    avgCommentLength,
    scoreStdDev,
    highQualityRate,
    scoreDistribution,
    maxScoreCount
  }
})

const filteredLessons = computed(() => {
  let result = [...(lessonRecords.value || [])]
  if (filterStatus.value) {
    result = result.filter(l => l.status === filterStatus.value)
  }
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(l => l.title.includes(q) || l.teacher.includes(q))
  }
  return result
})

const getStatusClass = (status) => {
  const map = { live: 'status-live', completed: 'status-completed', upcoming: 'status-upcoming' }
  return map[status] || ''
}

const getStatusText = (status) => {
  const map = { live: '直播中', completed: '已结束', upcoming: '即将开始' }
  return map[status] || status
}

// 拖拽功能
const handleDragStart = (event, item, index = -1) => {
  draggedItem.value = item
  draggedIndex.value = index
  event.dataTransfer.effectAllowed = 'move'
}

const handleDrop = (event) => {
  if (!draggedItem.value || draggedIndex.value !== -1) return
  
  const exists = selectedIndicators.value.find(i => i.id === draggedItem.value.id)
  if (!exists) {
    selectedIndicators.value.push({ ...draggedItem.value })
  }
  draggedItem.value = null
  draggedIndex.value = -1
}

const handleReorder = (event, targetIndex) => {
  if (draggedIndex.value === -1 || draggedIndex.value === targetIndex) return
  
  const item = selectedIndicators.value.splice(draggedIndex.value, 1)[0]
  selectedIndicators.value.splice(targetIndex, 0, item)
  draggedItem.value = null
  draggedIndex.value = -1
}

const removeIndicator = (index) => {
  selectedIndicators.value.splice(index, 1)
}

const updateIndicatorWeight = (index, value) => {
  selectedIndicators.value = selectedIndicators.value.map((item, i) => 
    i === index ? { ...item, weight: value } : item
  )
}

// 热力图颜色
const getHeatColor = (value) => {
  if (value < 30) return 'rgba(45, 125, 70, 0.15)'
  if (value < 50) return 'rgba(45, 125, 70, 0.3)'
  if (value < 70) return 'rgba(245, 166, 35, 0.45)'
  if (value < 90) return 'rgba(245, 166, 35, 0.7)'
  return 'rgba(232, 93, 78, 0.85)'
}

const refreshData = () => {
  searchQuery.value = ''
  filterStatus.value = ''
  nextTick(() => {
    initReviewChart()
    initAttendanceChart()
  })
  ElMessage.success('数据已刷新')
}

const exportData = () => {
  // 导出CSV格式的听课数据
  const headers = ['课程名称', '授课教师', '地点', '日期', '状态', '观看人数', '评分']
  const rows = filteredLessons.value.map(lesson => [
    lesson.title,
    lesson.teacher,
    lesson.location,
    lesson.date,
    getStatusText(lesson.status),
    lesson.viewers,
    lesson.score
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `听课记录_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('听课数据已导出')
}

const startLesson = () => {
  newLessonForm.value = { title: '', teacher: '', location: '', date: null }
  createLessonVisible.value = true
}

const confirmCreateLesson = () => {
  if (!newLessonForm.value.title || !newLessonForm.value.teacher) {
    ElMessage.warning('请填写课程名称和授课教师')
    return
  }
  lessonRecords.value.unshift({
    id: generateDeterministicId('lesson', `${newLessonForm.value.title}-${newLessonForm.value.teacher}`),
    title: newLessonForm.value.title,
    teacher: newLessonForm.value.teacher,
    location: newLessonForm.value.location,
    date: newLessonForm.value.date ? newLessonForm.value.date.toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    time: '09:00-10:30',
    subject: '其他',
    grade: '全校',
    status: 'upcoming',
    viewers: 0,
    rating: 0,
    reviewed: false
  })
  reviewStats.value.total++
  reviewStats.value.upcoming++
  createLessonVisible.value = false
  ElMessage.success('公开课发起成功')
}

const viewLessonDetail = (lesson) => {
  selectedLesson.value = lesson
  reviewDialogVisible.value = true
}

const joinLesson = (lesson) => {
  playerTitle.value = `直播中 - ${lesson.title}`
  playerVisible.value = true
}

const viewRecording = (lesson) => {
  playerTitle.value = `回放 - ${lesson.title}`
  playerVisible.value = true
}

const openReviewDialog = (lesson) => {
  selectedLesson.value = lesson
  reviewDialogVisible.value = true
}

const submitReview = () => {
  if (!reviewForm.value.comments || !reviewForm.value.comments.trim()) { ElMessage.warning('请输入评课意见'); return }
  if (selectedLesson.value) {
    const lessonIndex = lessonRecords.value.findIndex(l => l.id === selectedLesson.value.id)
    if (lessonIndex !== -1) {
      lessonRecords.value[lessonIndex] = {
        ...lessonRecords.value[lessonIndex],
        review: {
          ...reviewForm.value,
          submitTime: new Date().toISOString(),
          submitter: '教师'
        },
        hasReview: true
      }
      selectedLesson.value = lessonRecords.value[lessonIndex]
    }
  }
  reviewDialogVisible.value = false
  ElMessage.success('评课提交成功')
  reviewForm.value = {
    objective: 80,
    organization: 85,
    interaction: 75,
    method: 82,
    effect: 88,
    comments: ''
  }
}

const initReviewChart = () => {
  if (!reviewChart.value) return
  if (reviewChartInstance) { reviewChartInstance.dispose(); reviewChartInstance = null }
  reviewChartInstance = echarts.init(reviewChart.value)

  // 从 selectedIndicators 的权重生成雷达图数据
  const indicators = selectedIndicators.value.map(i => ({
    name: i.name.length > 5 ? i.name.slice(0, 5) : i.name,
    max: 100
  }))
  const values = selectedIndicators.value.map(i =>
    Math.min(100, Math.round((reviewStats.value.total || 100) / 2 + i.weight * 1.2))
  )

  reviewChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    radar: {
      indicator: indicators.length >= 3 ? indicators : [
        { name: '教学目标', max: 100 },
        { name: '课堂组织', max: 100 },
        { name: '师生互动', max: 100 },
        { name: '教学方法', max: 100 },
        { name: '教学效果', max: 100 }
      ],
      radius: '60%',
      axisName: { color: '#6B7280', fontSize: 12 },
      splitArea: { areaStyle: { color: ['#F7F8FA', '#FFFFFF'] } },
      axisLine: { lineStyle: { color: '#E8EAED' } },
      splitLine: { lineStyle: { color: '#E8EAED' } }
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: values.length >= 3 ? values : [88, 85, 90, 82, 86],
          name: '本次评课',
          areaStyle: { color: 'rgba(45, 125, 70, 0.2)' },
          lineStyle: { color: '#1E5AA8', width: 2 },
          itemStyle: { color: '#1E5AA8' }
        }
      ]
    }]
  })
}

const initAttendanceChart = () => {
  if (!attendanceChart.value) return
  if (attendanceChartInstance) { attendanceChartInstance.dispose(); attendanceChartInstance = null }
  attendanceChartInstance = echarts.init(attendanceChart.value)

  // 从 lessonRecords 统计每天的听课人数
  const days = ['周一', '周二', '周三', '周四', '周五']
  const dayCounts = days.map(() => 0)
  const now = new Date('2026-07-16T08:00:00')
  ;(lessonRecords.value || []).forEach(l => {
    if (l.date) {
      const d = new Date(l.date)
      const dayIdx = d.getDay() - 1
      if (dayIdx >= 0 && dayIdx < 5) {
        dayCounts[dayIdx] += (l.viewers || l.participants || 1)
      }
    }
  })
  const chartData = dayCounts.every(v => v === 0)
    ? [120, 156, 180, 145, 210]
    : dayCounts

  attendanceChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: days,
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280' }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F7F8FA' } },
      axisLabel: { color: '#6B7280' }
    },
    series: [{
      type: 'line',
      smooth: true,
      lineStyle: { color: '#1E5AA8', width: 2.5 },
      itemStyle: { color: '#1E5AA8' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(45, 125, 70, 0.2)' },
          { offset: 1, color: 'rgba(45, 125, 70, 0)' }
        ])
      },
      data: chartData
    }]
  })
}

const initTeacherRadarChart = () => {
  if (!teacherRadarChart.value) return
  if (teacherRadarChartInstance) { teacherRadarChartInstance.dispose(); teacherRadarChartInstance = null }
  teacherRadarChartInstance = echarts.init(teacherRadarChart.value)

  let avgScores = {
    objective: 80,
    organization: 85,
    interaction: 75,
    method: 82,
    effect: 88
  }

  if (selectedTeacher.value && teacherAbilityData[selectedTeacher.value]) {
    avgScores = { ...teacherAbilityData[selectedTeacher.value] }
  } else {
    const targetLessons = lessonRecords.value || []
    const reviewedLessons = targetLessons.filter(l => l.hasReview && l.review)
    
    if (reviewedLessons.length > 0) {
      avgScores.objective = Math.round(reviewedLessons.reduce((sum, l) => sum + l.review.objective, 0) / reviewedLessons.length)
      avgScores.organization = Math.round(reviewedLessons.reduce((sum, l) => sum + l.review.organization, 0) / reviewedLessons.length)
      avgScores.interaction = Math.round(reviewedLessons.reduce((sum, l) => sum + l.review.interaction, 0) / reviewedLessons.length)
      avgScores.method = Math.round(reviewedLessons.reduce((sum, l) => sum + l.review.method, 0) / reviewedLessons.length)
      avgScores.effect = Math.round(reviewedLessons.reduce((sum, l) => sum + l.review.effect, 0) / reviewedLessons.length)
    }
  }

  teacherRadarChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    radar: {
      indicator: [
        { name: '教学目标', max: 100 },
        { name: '课堂组织', max: 100 },
        { name: '师生互动', max: 100 },
        { name: '教学方法', max: 100 },
        { name: '教学效果', max: 100 }
      ],
      radius: '60%',
      axisName: { color: '#6B7280', fontSize: 12 },
      splitArea: { areaStyle: { color: ['#F7F8FA', '#FFFFFF'] } },
      axisLine: { lineStyle: { color: '#E8EAED' } },
      splitLine: { lineStyle: { color: '#E8EAED' } }
    },
    series: [{
      type: 'radar',
      data: [
        {
          value: [avgScores.objective, avgScores.organization, avgScores.interaction, avgScores.method, avgScores.effect],
          name: selectedTeacher.value ? selectedTeacher.value : '教师平均',
          areaStyle: { color: 'rgba(30, 90, 168, 0.2)' },
          lineStyle: { color: '#1E5AA8', width: 2 },
          itemStyle: { color: '#1E5AA8' }
        }
      ]
    }]
  })
}

const initGrowthChart = () => {
  if (!growthChart.value) return
  if (growthChartInstance) { growthChartInstance.dispose(); growthChartInstance = null }
  growthChartInstance = echarts.init(growthChart.value)

  let chartDates = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06']
  let chartScores = [78, 82, 80, 85, 83, 88]

  if (selectedTeacher.value && teacherGrowthData[selectedTeacher.value]) {
    chartDates = teacherGrowthData[selectedTeacher.value].dates
    chartScores = teacherGrowthData[selectedTeacher.value].scores
  } else {
    const targetLessons = lessonRecords.value || []
    const reviewedLessons = targetLessons
      .filter(l => l.hasReview && l.review && l.date)
      .sort((a, b) => new Date(a.date) - new Date(b.date))

    if (reviewedLessons.length > 0) {
      chartDates = reviewedLessons.map(l => l.date)
      chartScores = reviewedLessons.map(l => {
        const r = l.review
        return Math.round((r.objective + r.organization + r.interaction + r.method + r.effect) / 5)
      })
    }
  }

  growthChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: chartDates,
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280', rotate: 30 }
    },
    yAxis: {
      type: 'value',
      min: 60,
      max: 100,
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F7F8FA' } },
      axisLabel: { color: '#6B7280' }
    },
    series: [{
      type: 'line',
      smooth: true,
      lineStyle: { color: '#F5A623', width: 2.5 },
      itemStyle: { color: '#F5A623' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(245, 166, 35, 0.2)' },
          { offset: 1, color: 'rgba(245, 166, 35, 0)' }
        ])
      },
      data: chartScores
    }]
  })
}

watch([reviewStats, lessonRecords, selectedIndicators, selectedTeacher], () => {
  nextTick(() => {
    initReviewChart()
    initAttendanceChart()
    initTeacherRadarChart()
    initGrowthChart()
  })
}, { deep: true })

const extractLessonFrames = async () => {
  const videoUrl = '/示例视频.mp4'
  for (const lesson of lessonRecords.value) {
    if (!lesson.frame) {
      const frame = await extractVideoFrame(videoUrl, { time: 0.5 })
      if (frame) {
        lesson.frame = frame
      }
    }
  }
}

onMounted(() => {
  nextTick(() => {
    setTimeout(() => { 
      initReviewChart()
      initAttendanceChart()
      initTeacherRadarChart()
      initGrowthChart()
    }, 200)
  })
  setTimeout(extractLessonFrames, 500)
})

onBeforeUnmount(() => {
  if (reviewChartInstance) reviewChartInstance.dispose()
  if (attendanceChartInstance) attendanceChartInstance.dispose()
  if (teacherRadarChartInstance) teacherRadarChartInstance.dispose()
  if (growthChartInstance) growthChartInstance.dispose()
})
</script>

<style scoped>
.lesson-review {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 卡片 */
.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* 课程网格 */
.lesson-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}

.lesson-card {
  border: 1px solid #E8EAED;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.2s;
}

.lesson-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.lesson-cover {
  position: relative;
  height: 160px;
  background: #F7F8FA;
  display: flex;
  align-items: center;
  justify-content: center;
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-empty {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.empty-text {
  font-size: 13px;
  color: #9CA3AF;
}

.lesson-status-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-live { background: #FEE2E2; color: #991B1B; }
.status-completed { background: #DCFCE7; color: #166534; }
.status-upcoming { background: #DBEAFE; color: #1E40AF; }

.lesson-info {
  padding: 16px;
}

.lesson-title {
  font-size: 15px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 10px 0;
  line-height: 1.4;
}

.lesson-meta {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;
}

.lesson-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6B7280;
}

.lesson-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 12px;
}

.lesson-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #E8EAED;
}

.viewer-count {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #6B7280;
}

.lesson-actions {
  display: flex;
  gap: 4px;
}

/* 多模态评课 */
.multi-modal-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

/* 拖拽配置 */
.drag-config {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  padding: 16px 0;
}

.drag-section h4 {
  font-size: 14px;
  font-weight: 600;
  color: #6B7280;
  margin: 0 0 12px 0;
}

.drag-list {
  min-height: 200px;
  background: #F7F8FA;
  border-radius: 8px;
  padding: 8px;
  border: 1px dashed #E8EAED;
}

.drag-list.active {
  border-style: solid;
  border-color: #1E5AA8;
}

.drag-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  background: #FFFFFF;
  border-radius: 6px;
  margin-bottom: 8px;
  cursor: grab;
  transition: all 0.2s;
  font-size: 13px;
  border: 1px solid #E8EAED;
}

.drag-item:hover {
  background: #F0FDF4;
  border-color: #1E5AA8;
}

.drag-item.selected {
  justify-content: flex-start;
  gap: 8px;
}

.drag-item.dragging {
  opacity: 0.5;
  transform: scale(0.98);
}

.weight-label {
  font-size: 12px;
  color: #6B7280;
  min-width: 36px;
}

/* 指标预览 */
.indicator-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  padding: 12px 0;
}

.indicator-tag {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: #F0FDF4;
  border-radius: 20px;
  font-size: 13px;
  color: #1E5AA8;
  border: 1px solid #BBF7D0;
}

.indicator-tag .weight {
  font-size: 12px;
  color: #166534;
  font-weight: 600;
}

/* AI分析 */
.ai-analysis {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}

.analysis-item {
  display: flex;
  gap: 12px;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.analysis-icon {
  font-size: 24px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #FFFFFF;
  border-radius: 8px;
}

.analysis-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.analysis-label {
  font-size: 13px;
  color: #6B7280;
}

.analysis-value {
  font-size: 15px;
  font-weight: 600;
  color: #1E5AA8;
}

.analysis-detail {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.analysis-detail span {
  font-size: 12px;
  color: #9CA3AF;
}

/* 热力图 */
.heatmap-container {
  padding: 16px 0;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 12px;
  color: #6B7280;
}

.legend-bar {
  flex: 1;
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(to right, 
    rgba(45, 125, 70, 0.15), 
    rgba(45, 125, 70, 0.3), 
    rgba(245, 166, 35, 0.45), 
    rgba(245, 166, 35, 0.7), 
    rgba(232, 93, 78, 0.85)
  );
}

.heatmap-grid {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 400px;
  margin: 0 auto;
}

.heatmap-row {
  display: flex;
  gap: 4px;
}

.heatmap-cell {
  width: 45px;
  height: 45px;
  border-radius: 4px;
  transition: all 0.2s;
}

.heatmap-cell:hover {
  transform: scale(1.1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.heatmap-labels {
  display: flex;
  justify-content: space-between;
  width: 400px;
  margin: 8px auto 0;
  font-size: 12px;
  color: #6B7280;
}

.behavior-stats {
  display: flex;
  justify-content: center;
  gap: 48px;
  margin-top: 20px;
  padding-top: 16px;
  border-top: 1px solid #E8EAED;
}

.behavior-stats .stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.behavior-stats .stat span:first-child {
  font-size: 13px;
  color: #6B7280;
}

.behavior-stats .stat .value {
  font-size: 15px;
  font-weight: 600;
  color: #1E5AA8;
}

/* 图表区 */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.chart {
  height: 280px;
  width: 100%;
}

/* 评课质量分析 */
.quality-analysis {
  padding: 8px 0;
}

.quality-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid #E8EAED;
}

.quality-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.quality-label {
  font-size: 13px;
  color: #6B7280;
}

.quality-value {
  font-size: 20px;
  font-weight: 700;
  color: #1A1A2E;
}

.score-distribution {
  padding-top: 20px;
}

.score-distribution h4 {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 16px;
}

.distribution-bars {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.distribution-bar {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  font-size: 13px;
  color: #6B7280;
  width: 60px;
}

.bar-container {
  flex: 1;
  height: 24px;
  background: #F7F8FA;
  border-radius: 4px;
  overflow: hidden;
}

.bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #1E5AA8, #3B82F6);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-count {
  font-size: 13px;
  color: #6B7280;
  min-width: 40px;
  text-align: right;
}

@media (max-width: 768px) {
  .quality-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
