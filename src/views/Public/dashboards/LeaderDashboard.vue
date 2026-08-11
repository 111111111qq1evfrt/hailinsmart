<template>
  <div class="leader-dashboard">
    <!-- 顶部统计 -->
    <div class="stats-row">
      <template v-for="(item, idx) in kpiList" :key="idx">
        <div class="stat-item">
          <span class="stat-num" :class="{ 'stat-good': !item.color }" :style="item.color ? { color: item.color } : {}">{{ item.value }}</span>
          <span class="stat-label">{{ item.label }}</span>
        </div>
        <div class="stat-divider" v-if="idx < kpiList.length - 1"></div>
      </template>
    </div>

    <!-- 中部图表 -->
    <div class="charts-row">
      <div class="chart-card wide">
        <div class="card-header">
            <span class="card-title">全校体育成绩趋势</span>
          <div class="time-tabs">
            <el-button 
              v-for="tab in timeTabs" 
              :key="tab.value"
              :class="['time-tab', { active: trendPeriod === tab.value }]"
              @click="trendPeriod = tab.value"
            >{{ tab.label }}</el-button>
          </div>
        </div>
        <div ref="trendChart" class="chart"></div>
      </div>
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">年级达标率</span>
        </div>
        <div ref="gradeChart" class="chart"></div>
      </div>
    </div>

    <!-- 上课与请假分析 - 第一行 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">请假类型分布</span>
        </div>
        <div ref="leaveTypeChart" class="chart"></div>
      </div>
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">年级月均请假率</span>
        </div>
        <div ref="leaveRateChart" class="chart"></div>
      </div>
    </div>

    <!-- 上课与请假分析 - 第二行 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">动态考勤追踪</span>
        </div>
        <div class="attendance-summary">
          <div class="attendance-item">
            <div class="attendance-icon attendance">
              <el-icon :size="24"><CircleCheck /></el-icon>
            </div>
            <div class="attendance-info">
              <span class="attendance-value">{{ attendanceStats.attendance }}</span>
              <span class="attendance-label">出勤</span>
            </div>
          </div>
          <div class="attendance-item">
            <div class="attendance-icon absent">
              <el-icon :size="24"><CircleClose /></el-icon>
            </div>
            <div class="attendance-info">
              <span class="attendance-value">{{ attendanceStats.absent }}</span>
              <span class="attendance-label">缺勤</span>
            </div>
          </div>
          <div class="attendance-item">
            <div class="attendance-icon leave">
              <el-icon :size="24"><Document /></el-icon>
            </div>
            <div class="attendance-info">
              <span class="attendance-value">{{ attendanceStats.leave }}</span>
              <span class="attendance-label">请假</span>
            </div>
          </div>
          <div class="attendance-item">
            <div class="attendance-icon late">
              <el-icon :size="24"><Clock /></el-icon>
            </div>
            <div class="attendance-info">
              <span class="attendance-value">{{ attendanceStats.late }}</span>
              <span class="attendance-label">迟到</span>
            </div>
          </div>
        </div>
      </div>
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">异常行为预警</span>
          <el-tag type="danger" size="small" v-if="anomalyList.length > 0">{{ anomalyList.length }}条预警</el-tag>
        </div>
        <div class="anomaly-list">
          <div class="anomaly-item" v-for="(item, idx) in anomalyList" :key="idx">
            <div class="anomaly-icon" :class="item.level">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="anomaly-content">
              <div class="anomaly-title">{{ item.title }}</div>
              <div class="anomaly-desc">{{ item.desc }}</div>
            </div>
            <div class="anomaly-time">{{ item.time }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 多源数据与高频请假 - 第三行 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">多源数据整合</span>
        </div>
        <div class="data-sources">
          <div class="data-source-item" v-for="(source, idx) in dataSources" :key="idx">
            <div class="source-icon" :class="source.status">
              <el-icon :size="24"><component :is="source.icon" /></el-icon>
            </div>
            <div class="source-info">
              <span class="source-name">{{ source.name }}</span>
              <span class="source-status" :class="source.status">{{ source.statusText }}</span>
            </div>
            <div class="source-data">{{ source.data }}</div>
          </div>
        </div>
      </div>
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">高频请假学生</span>
          <el-button text type="primary" size="small" @click="notifyTeacher">通知班主任</el-button>
        </div>
        <div class="high-frequency-leave-list">
          <div class="high-frequency-item" v-for="(student, idx) in highFrequencyLeaveStudents" :key="idx">
            <el-avatar :size="40" :icon="User" class="student-avatar" />
            <div class="student-info">
              <div class="student-name">{{ student.name }}</div>
              <div class="student-class">{{ student.class }}</div>
            </div>
            <div class="leave-info">
              <span class="leave-days">{{ student.days }}天</span>
              <span class="leave-reason">{{ student.reason }}</span>
            </div>
            <div class="teacher-info">
              <span class="teacher-name">{{ student.teacher }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部列表 - 第一行 -->
    <div class="bottom-row">
      <div class="list-card">
        <div class="card-header">
          <span class="card-title">预警列表</span>
          <el-button text type="primary" size="small" @click="viewAllWarnings">查看全部</el-button>
        </div>
        <div class="warning-list">
          <div class="warning-item" v-for="(w, i) in warningList" :key="i" @click="handleWarningClick(w)">
            <div class="warning-icon" :class="w.level">
              <el-icon><Warning /></el-icon>
            </div>
            <div class="warning-content">
              <div class="warning-title">{{ w.title }}</div>
              <div class="warning-desc">{{ w.desc }}</div>
            </div>
            <div class="warning-time">{{ w.time }}</div>
          </div>
        </div>
      </div>

      <!-- 热力图预警 -->
      <div class="list-card">
        <div class="card-header">
          <span class="card-title">热力图预警</span>
          <el-select v-model="heatmapType" size="small" style="width: 120px">
            <el-option label="达标率" value="passRate" />
            <el-option label="优秀率" value="excellentRate" />
            <el-option label="参与度" value="participation" />
          </el-select>
        </div>
        <div class="heatmap-container">
          <div class="heatmap-legend">
            <div class="legend-item">
              <span class="legend-color high"></span>
              <span class="legend-label">高 (>85%)</span>
            </div>
            <div class="legend-item">
              <span class="legend-color medium"></span>
              <span class="legend-label">中 (60-85%)</span>
            </div>
            <div class="legend-item">
              <span class="legend-color low"></span>
              <span class="legend-label">低 (<60%)</span>
            </div>
          </div>
          <div class="heatmap-grid">
            <div
              v-for="(cell, idx) in heatmapData"
              :key="idx"
              class="heatmap-cell"
              :class="cell.level"
              @mouseenter="showHeatmapTooltip($event, cell)"
              @mouseleave="hideHeatmapTooltip"
            >
              <div class="cell-grade">{{ cell.grade }}</div>
              <div class="cell-class">{{ cell.class }}</div>
              <div class="cell-value">{{ cell.value }}%</div>
            </div>
          </div>
          <!-- 热力图悬停详情弹窗 -->
          <div
            v-if="heatmapTooltip.show"
            class="heatmap-tooltip"
            :style="{ left: heatmapTooltip.x + 'px', top: heatmapTooltip.y + 'px' }"
          >
            <div class="tooltip-title">{{ heatmapTooltip.data.grade }} {{ heatmapTooltip.data.class }}</div>
            <div class="tooltip-content">
              <div class="tooltip-item">
                <span class="tooltip-label">人数：</span>
                <span class="tooltip-value">{{ heatmapTooltip.data.count || '45' }}人</span>
              </div>
              <div class="tooltip-item">
                <span class="tooltip-label">达标率：</span>
                <span class="tooltip-value">{{ heatmapTooltip.data.value }}%</span>
              </div>
              <div class="tooltip-item">
                <span class="tooltip-label">等级：</span>
                <span class="tooltip-value" :class="heatmapTooltip.data.level">
                  {{ heatmapTooltip.data.level === 'high' ? '优秀' : heatmapTooltip.data.level === 'medium' ? '良好' : '需关注' }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部列表 - 第二行 -->
    <div class="bottom-row">
      <!-- 个体画像 -->
      <div class="list-card">
        <div class="card-header">
          <span class="card-title">重点关注学生</span>
          <el-button text type="primary" size="small" @click="viewStudentProfiles">查看全部</el-button>
        </div>
        <div class="profile-list">
          <div
            v-for="(student, idx) in focusStudents"
            :key="idx"
            class="profile-item"
            @click="viewProfileDetail(student)"
          >
            <el-avatar :size="48" :icon="User" class="profile-avatar" />
            <div class="profile-info">
              <div class="profile-name">{{ student.name }}</div>
              <div class="profile-class">{{ student.class }}</div>
            </div>
            <div class="profile-status">
              <el-tag :type="student.status === 'warning' ? 'danger' : 'warning'" size="small">
                {{ student.status === 'warning' ? '需关注' : '进步中' }}
              </el-tag>
            </div>
          </div>
        </div>
        <div class="profile-summary">
          <div class="summary-item">
            <span class="summary-num">{{ focusStudents.length }}</span>
            <span class="summary-label">重点关注</span>
          </div>
          <div class="summary-item">
            <span class="summary-num">{{ improvedCount }}</span>
            <span class="summary-label">本月进步</span>
          </div>
        </div>
      </div>

      <div class="list-card">
        <div class="card-header">
          <span class="card-title">各项目平均分排行</span>
          <el-button text type="primary" size="small" @click="exportRanking">导出排行</el-button>
        </div>
        <div class="rank-list">
          <div class="rank-item" v-for="(r, i) in rankList" :key="i">
            <span class="rank-num" :class="i < 3 ? 'top3' : ''">{{ i + 1 }}</span>
            <span class="rank-name">{{ r.name }}</span>
            <el-progress
              :percentage="r.score"
              :color="getRankColor(i)"
              :show-text="false"
              style="width: 120px"
            />
            <span class="rank-score">{{ r.score }}分</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部列表 - 第三行 -->
    <div class="bottom-row">
      <div class="list-card wide">
        <div class="card-header">
          <span class="card-title">年级群体对比</span>
          <el-select v-model="selectedGrade" size="small" style="width: 120px">
            <el-option label="一年级" value="grade1" />
            <el-option label="二年级" value="grade2" />
            <el-option label="三年级" value="grade3" />
            <el-option label="四年级" value="grade4" />
            <el-option label="五年级" value="grade5" />
            <el-option label="六年级" value="grade6" />
          </el-select>
        </div>
        <div class="grade-comparison">
          <div class="comparison-base">
            <div class="base-label">基准年级：{{ gradeLabels[selectedGrade] }}</div>
            <div class="base-stats">
              <div class="stat-chip">出勤率 {{ gradeProfiles[selectedGrade].attendance }}%</div>
              <div class="stat-chip">体测优良率 {{ gradeProfiles[selectedGrade].excellentRate }}%</div>
              <div class="stat-chip">近视率 {{ gradeProfiles[selectedGrade].myopiaRate }}%</div>
              <div class="stat-chip">请假率 {{ gradeProfiles[selectedGrade].leaveRate }}%</div>
            </div>
          </div>
          <div class="comparison-targets">
            <div class="target-item" v-for="(item, idx) in comparisonTargets" :key="idx">
              <div class="target-header">
                <span class="target-name">{{ item.name }}</span>
              </div>
              <div class="target-stats">
                <div class="target-stat" v-for="(stat, sIdx) in item.stats" :key="sIdx">
                  <span class="stat-label">{{ stat.label }}</span>
                  <span class="stat-value" :class="stat.trend > 0 ? 'up' : 'down'">{{ stat.value }}%</span>
                  <span class="stat-trend">{{ stat.trend > 0 ? '↑' : '↓' }}{{ Math.abs(stat.trend) }}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预警详情 -->
    <el-dialog v-model="warningDetailVisible" title="预警详情" width="480px">
      <div v-if="currentWarning" class="warning-detail">
        <el-tag :type="currentWarning.level === 'high' ? 'danger' : currentWarning.level === 'medium' ? 'warning' : 'info'" style="margin-bottom: 12px">
          {{ currentWarning.level === 'high' ? '高风险' : currentWarning.level === 'medium' ? '中风险' : '低风险' }}
        </el-tag>
        <h4>{{ currentWarning.title }}</h4>
        <p>{{ currentWarning.desc }}</p>
        <p class="time">触发时间：{{ currentWarning.time }}</p>
      </div>
      <template #footer>
        <el-button @click="warningDetailVisible = false">关闭</el-button>
        <el-button type="primary">标记已处理</el-button>
      </template>
    </el-dialog>

    <!-- 个体画像详情 -->
    <el-dialog v-model="profileDetailVisible" title="学生画像详情" width="560px">
      <div v-if="selectedStudent" class="profile-detail">
        <div class="profile-header">
          <el-avatar :size="80" :icon="User" class="profile-big-avatar" />
          <div class="profile-main-info">
            <h3>{{ selectedStudent.name }}</h3>
            <p>{{ selectedStudent.class }}</p>
            <el-tag :type="selectedStudent.status === 'warning' ? 'danger' : 'success'" size="small">
              {{ selectedStudent.status === 'warning' ? '需关注' : '进步中' }}
            </el-tag>
          </div>
        </div>
        <div class="profile-stats">
          <div class="stats-grid">
            <div class="stat-box">
              <span class="stat-value">{{ selectedStudent.totalScore }}</span>
              <span class="stat-label">综合评分</span>
            </div>
            <div class="stat-box">
              <span class="stat-value">{{ selectedStudent.attendance }}%</span>
              <span class="stat-label">出勤率</span>
            </div>
            <div class="stat-box">
              <span class="stat-value">{{ selectedStudent.improvement }}%</span>
              <span class="stat-label">进步率</span>
            </div>
          </div>
        </div>
        <div class="profile-analysis">
          <h4>能力分析</h4>
          <div class="ability-list">
            <div class="ability-item" v-for="(ability, idx) in selectedStudent.abilities" :key="idx">
              <span class="ability-name">{{ ability.name }}</span>
              <el-progress :percentage="ability.score" :color="getAbilityColor(ability.score)" :stroke-width="8" />
            </div>
          </div>
        </div>
        <div class="profile-suggestion">
          <h4>改进建议</h4>
          <p>{{ selectedStudent.suggestion }}</p>
        </div>
      </div>
      <template #footer>
        <el-button @click="profileDetailVisible = false">关闭</el-button>
        <el-button type="primary" @click="viewFullReport">查看完整报告</el-button>
      </template>
    </el-dialog>

    <!-- 通知班主任弹窗 -->
    <el-dialog v-model="notifyDialogVisible" title="通知班主任" width="520px">
      <div class="notify-list">
        <div class="notify-item" v-for="(student, idx) in highFrequencyLeaveStudents" :key="idx">
          <el-avatar :size="40" :icon="User" class="notify-avatar" />
          <div class="notify-student-info">
            <div class="notify-name">{{ student.name }}</div>
            <div class="notify-class">{{ student.class }}</div>
          </div>
          <div class="notify-detail">
            <span class="notify-days">{{ student.days }}天{{ student.reason }}</span>
          </div>
          <div class="notify-teacher">
            <span class="teacher-label">班主任：</span>
            <span class="teacher-name">{{ student.teacher }}</span>
          </div>
          <el-tag type="success" size="small">已通知</el-tag>
        </div>
      </div>
      <template #footer>
        <el-button @click="notifyDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmNotify">确认通知</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import {
  User,
  ArrowUp, ArrowDown, Warning,
  Monitor, SwitchButton, Operation,
  CircleCheck, CircleClose, Document, Clock
} from '@element-plus/icons-vue'
import echarts from '@/utils/echarts'
import store from '@/store/global'
import { getSchoolProfile } from '@/mock/school-data/schoolProfiles'
import { calculateSchoolStats } from '@/utils/statistics'
import { getSchoolData } from '@/mock'
import { getSchoolMockData } from '@/utils/mockDataLoader'
import { usePersistedRef, sendNotifications } from '@/composables'

const router = useRouter()
const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')
const profile = computed(() => getSchoolProfile(schoolId.value))

const fixedKpiData = usePersistedRef(computed(() => `leader_kpi_${schoolId.value}`), () => {
  const defaults = {
    'hailin-second-primary': { avgPassRate: 87.5, excellentRate: 28.4 },
    'hailin-zirong-primary': { avgPassRate: 82.3, excellentRate: 24.1 },
    'linhai-experimental-primary': { avgPassRate: 85.7, excellentRate: 26.8 }
  }
  return defaults[schoolId.value] || defaults['hailin-second-primary']
})

const getPassRateColor = (rate) => {
  if (rate >= 85) return '#1E5AA8'
  if (rate >= 70) return '#3B82F6'
  if (rate >= 60) return '#F5A623'
  return '#E85D4E'
}

const getStudents = () => {
  const key = `students_${schoolId.value}`
  const stored = sessionStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  return getSchoolData(schoolId.value).students || []
}

const getTestResults = () => {
  const key = `smart_pe_imported_national_test_${schoolId.value}`
  const stored = sessionStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  const schoolData = getSchoolMockData(schoolId.value)
  return schoolData.nationalTestResults || []
}

const getExamResults = () => {
  const key = `exam_results_${schoolId.value}`
  const stored = sessionStorage.getItem(key)
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return []
    }
  }
  const schoolData = getSchoolMockData(schoolId.value)
  return schoolData.examResults || []
}

const students = ref(getStudents())
const testResults = ref(getTestResults())
const examResults = ref(getExamResults())

const dynamicStats = computed(() => {
  return calculateSchoolStats(students.value, testResults.value, examResults.value, profile.value)
})
const warningDetailVisible = ref(false)
const currentWarning = ref(null)
const trendPeriod = ref('month')
const heatmapType = ref('passRate')

// 热力图悬停提示
const heatmapTooltip = ref({
  show: false,
  x: 0,
  y: 0,
  data: {}
})

const showHeatmapTooltip = (event, cell) => {
  const rect = event.currentTarget.getBoundingClientRect()
  heatmapTooltip.value = {
    show: true,
    x: rect.left + rect.width / 2,
    y: rect.top - 10,
    data: cell
  }
}

const hideHeatmapTooltip = () => {
  heatmapTooltip.value.show = false
}

const timeTabs = [
  { value: 'week', label: '本周' },
  { value: 'month', label: '本月' },
  { value: 'term', label: '本学期' }
]
const trendChart = ref(null)
const gradeChart = ref(null)
const leaveTypeChart = ref(null)
const leaveRateChart = ref(null)
let trendChartInstance = null
let gradeChartInstance = null
let leaveTypeChartInstance = null
let leaveRateChartInstance = null

const attendanceStats = computed(() => {
  const schoolData = {
    'hailin-second-primary': { attendance: '98.5%', absent: '0.8%', leave: '0.5%', late: '0.2%' },
    'hailin-zirong-primary': { attendance: '97.8%', absent: '1.2%', leave: '0.7%', late: '0.3%' },
    'linhai-experimental-primary': { attendance: '99.1%', absent: '0.5%', leave: '0.3%', late: '0.1%' }
  }
  return schoolData[schoolId.value] || schoolData['hailin-second-primary']
})

const anomalyList = computed(() => {
  const schoolData = {
    'hailin-second-primary': [
      { title: '进班未上课', desc: '3年级2班 李明', level: 'high', time: '10分钟前' },
      { title: '进班未上课', desc: '4年级1班 王芳', level: 'medium', time: '15分钟前' },
      { title: '连续请假预警', desc: '5年级3班 张伟 连续请假3天', level: 'high', time: '1小时前' }
    ],
    'hailin-zirong-primary': [
      { title: '进班未上课', desc: '4年级2班 陈强', level: 'high', time: '8分钟前' },
      { title: '连续请假预警', desc: '5年级1班 赵丽 连续请假4天', level: 'high', time: '20分钟前' },
      { title: '进班未上课', desc: '3年级3班 孙磊', level: 'medium', time: '30分钟前' }
    ],
    'linhai-experimental-primary': [
      { title: '连续请假预警', desc: '5年级2班 吴涛 连续请假5天', level: 'high', time: '5分钟前' },
      { title: '进班未上课', desc: '4年级3班 郑丽', level: 'medium', time: '12分钟前' },
      { title: '进班未上课', desc: '6年级1班 王强', level: 'medium', time: '45分钟前' }
    ]
  }
  return schoolData[schoolId.value] || schoolData['hailin-second-primary']
})

const dataSources = computed(() => {
  const schoolData = {
    'hailin-second-primary': [
      { name: '门禁闸机系统', status: 'online', statusText: '已连接', data: '今日通行 3,256人次', icon: SwitchButton },
      { name: '课堂点名系统', status: 'online', statusText: '已连接', data: '今日点名 128班', icon: Operation },
      { name: '体测数据系统', status: 'online', statusText: '已连接', data: '本周体测 456人', icon: Monitor }
    ],
    'hailin-zirong-primary': [
      { name: '门禁闸机系统', status: 'online', statusText: '已连接', data: '今日通行 2,842人次', icon: SwitchButton },
      { name: '课堂点名系统', status: 'online', statusText: '已连接', data: '今日点名 96班', icon: Operation },
      { name: '体测数据系统', status: 'online', statusText: '已连接', data: '本周体测 382人', icon: Monitor }
    ],
    'linhai-experimental-primary': [
      { name: '门禁闸机系统', status: 'online', statusText: '已连接', data: '今日通行 3,891人次', icon: SwitchButton },
      { name: '课堂点名系统', status: 'online', statusText: '已连接', data: '今日点名 156班', icon: Operation },
      { name: '体测数据系统', status: 'online', statusText: '已连接', data: '本周体测 528人', icon: Monitor }
    ]
  }
  return schoolData[schoolId.value] || schoolData['hailin-second-primary']
})

const highFrequencyLeaveStudents = computed(() => {
  const schoolData = {
    'hailin-second-primary': [
      { name: '张伟', class: '5年级3班', days: 5, reason: '病假', teacher: '王惠玉', teacherUsername: 'wanghuiyu' },
      { name: '李明', class: '3年级2班', days: 4, reason: '病假', teacher: '高霞', teacherUsername: 'gaoxia' },
      { name: '王芳', class: '4年级1班', days: 3, reason: '事假', teacher: '乔晶', teacherUsername: 'qiaojing' },
      { name: '刘洋', class: '6年级4班', days: 3, reason: '病假', teacher: '卜琳娜', teacherUsername: 'bulina' }
    ],
    'hailin-zirong-primary': [
      { name: '陈强', class: '4年级2班', days: 5, reason: '病假', teacher: '孙老师', teacherUsername: 'user_孙老师' },
      { name: '赵丽', class: '5年级1班', days: 4, reason: '病假', teacher: '周老师', teacherUsername: 'user_周老师' },
      { name: '孙磊', class: '3年级3班', days: 3, reason: '事假', teacher: '吴老师', teacherUsername: 'user_吴老师' },
      { name: '周静', class: '6年级2班', days: 3, reason: '病假', teacher: '郑老师', teacherUsername: 'user_郑老师' }
    ],
    'linhai-experimental-primary': [
      { name: '吴涛', class: '5年级2班', days: 5, reason: '病假', teacher: '郑老师', teacherUsername: 'user_郑老师' },
      { name: '郑丽', class: '4年级3班', days: 4, reason: '事假', teacher: '王老师', teacherUsername: 'user_王老师' },
      { name: '王强', class: '6年级1班', days: 3, reason: '病假', teacher: '陈老师', teacherUsername: 'user_陈老师' },
      { name: '冯敏', class: '3年级2班', days: 3, reason: '病假', teacher: '周老师', teacherUsername: 'user_周老师' }
    ]
  }
  return schoolData[schoolId.value] || schoolData['hailin-second-primary']
})

const notifyDialogVisible = ref(false)

const notifyTeacher = () => {
  notifyDialogVisible.value = true
}

const confirmNotify = () => {
  const students = highFrequencyLeaveStudents.value

  const notificationList = students.map((student) => {
    return {
      teacherUsername: student.teacherUsername,
      teacherName: student.teacher,
      title: '高频请假学生关注通知',
      content: `您班上的${student.name}同学（${student.class}）近期请假${student.days}天（${student.reason}），请关注该生出勤情况并与家长沟通。`,
      type: 'attendance',
      relatedStudents: [{
        name: student.name,
        class: student.class,
        days: student.days,
        reason: student.reason
      }]
    }
  })

  sendNotifications(notificationList)
  notifyDialogVisible.value = false
  ElMessage.success(`已向${students.length}位班主任发送通知，登录后可在通知中心查看`)
}

const selectedGrade = ref('grade3')

const gradeLabels = {
  grade1: '一年级',
  grade2: '二年级',
  grade3: '三年级',
  grade4: '四年级',
  grade5: '五年级',
  grade6: '六年级'
}

const gradeProfiles = computed(() => {
  const schoolData = {
    'hailin-second-primary': {
      grade1: { attendance: 99, excellentRate: 20, myopiaRate: 25, leaveRate: 1.2 },
      grade2: { attendance: 98.5, excellentRate: 22, myopiaRate: 32, leaveRate: 1.8 },
      grade3: { attendance: 98, excellentRate: 25, myopiaRate: 42, leaveRate: 2.1 },
      grade4: { attendance: 95, excellentRate: 22, myopiaRate: 52, leaveRate: 3.2 },
      grade5: { attendance: 96, excellentRate: 28, myopiaRate: 58, leaveRate: 2.8 },
      grade6: { attendance: 94, excellentRate: 30, myopiaRate: 62, leaveRate: 1.9 }
    },
    'hailin-zirong-primary': {
      grade1: { attendance: 98.8, excellentRate: 18, myopiaRate: 28, leaveRate: 1.5 },
      grade2: { attendance: 98.2, excellentRate: 20, myopiaRate: 35, leaveRate: 2.1 },
      grade3: { attendance: 97.5, excellentRate: 23, myopiaRate: 45, leaveRate: 2.4 },
      grade4: { attendance: 94, excellentRate: 20, myopiaRate: 55, leaveRate: 3.5 },
      grade5: { attendance: 95, excellentRate: 26, myopiaRate: 60, leaveRate: 3.1 },
      grade6: { attendance: 93, excellentRate: 28, myopiaRate: 65, leaveRate: 2.2 }
    },
    'linhai-experimental-primary': {
      grade1: { attendance: 99.2, excellentRate: 22, myopiaRate: 22, leaveRate: 1.0 },
      grade2: { attendance: 98.8, excellentRate: 24, myopiaRate: 28, leaveRate: 1.5 },
      grade3: { attendance: 98.5, excellentRate: 27, myopiaRate: 38, leaveRate: 1.8 },
      grade4: { attendance: 96, excellentRate: 25, myopiaRate: 48, leaveRate: 2.8 },
      grade5: { attendance: 97, excellentRate: 30, myopiaRate: 55, leaveRate: 2.5 },
      grade6: { attendance: 95, excellentRate: 32, myopiaRate: 58, leaveRate: 1.6 }
    }
  }
  return schoolData[schoolId.value] || schoolData['hailin-second-primary']
})

const comparisonTargets = computed(() => {
  const profiles = gradeProfiles.value
  const base = profiles[selectedGrade.value]
  const otherGrades = Object.keys(gradeLabels).filter(g => g !== selectedGrade.value)
  return otherGrades.map((grade, idx) => {
    const target = profiles[grade]
    return {
      name: gradeLabels[grade],
      stats: [
        { label: '出勤率', value: target.attendance, trend: Number((target.attendance - base.attendance).toFixed(1)) },
        { label: '体测优良率', value: target.excellentRate, trend: Number((target.excellentRate - base.excellentRate).toFixed(1)) },
        { label: '近视率', value: target.myopiaRate, trend: Number((target.myopiaRate - base.myopiaRate).toFixed(1)) },
        { label: '请假率', value: target.leaveRate, trend: Number((target.leaveRate - base.leaveRate).toFixed(1)) }
      ]
    }
  })
})

const kpiList = computed(() => {
  const stats = dynamicStats.value
  const defaultKpi = profile.value.leaderDashboard.kpiList
  return [
    { 
      value: stats.totalStudents > 0 ? stats.totalStudents.toLocaleString() : defaultKpi[0]?.value, 
      label: '在校学生', 
      trend: 3.2, 
      color: '#1E5AA8' 
    },
    { 
      value: stats.classStats && Object.keys(stats.classStats).length > 0 ? Object.keys(stats.classStats).length : defaultKpi[1]?.value, 
      label: '体育班级', 
      trend: 1.5, 
      color: '#1E5AA8' 
    },
    { 
      value: fixedKpiData.value.avgPassRate + '%', 
      label: '平均达标率', 
      trend: 2.1, 
      color: getPassRateColor(fixedKpiData.value.avgPassRate)
    },
    { 
      value: fixedKpiData.value.excellentRate + '%', 
      label: '优秀率', 
      trend: 5.4, 
      color: '#1E5AA8' 
    },
    { 
      value: '94.8%', 
      label: '缴费完成率', 
      trend: 2.3, 
      color: '#1E5AA8' 
    }
  ]
})

const warningList = computed(() => {
  const schoolData = {
    'hailin-second-primary': [
      { level: 'high', title: '四年级(2)班达标率低于60%', desc: '需重点关注并制定提升计划', time: '10分钟前' },
      { level: 'medium', title: '立定跳远设备异常', desc: '操场A区设备连接中断', time: '30分钟前' },
      { level: 'low', title: '本周自由练习参与率下降', desc: '较上周下降8%', time: '1小时前' },
      { level: 'medium', title: '五年级BMI超标人数增加', desc: '较上月增加12人', time: '2小时前' }
    ],
    'hailin-zirong-primary': [
      { level: 'high', title: '三年级(1)班达标率低于55%', desc: '需制定专项训练方案', time: '15分钟前' },
      { level: 'medium', title: '50米跑计时设备校准', desc: 'B区跑道设备需校准', time: '45分钟前' },
      { level: 'high', title: '六年级仰卧起坐成绩下滑', desc: '平均成绩较上月下降15%', time: '1小时前' },
      { level: 'low', title: '课间操参与率偏低', desc: '较上周下降5%', time: '3小时前' }
    ],
    'linhai-experimental-primary': [
      { level: 'medium', title: '二年级柔韧性指标偏低', desc: '坐位体前屈达标率72%', time: '20分钟前' },
      { level: 'low', title: '本周跳绳比赛参与人数不足', desc: '目标100人，当前报名68人', time: '1小时前' },
      { level: 'medium', title: '操场B区照明设备故障', desc: '影响课后体育活动', time: '2小时前' },
      { level: 'high', title: '四年级肥胖率上升趋势', desc: '较上学期增长3.2个百分点', time: '3小时前' }
    ]
  }
  return schoolData[schoolId.value] || schoolData['hailin-second-primary']
})

const rankList = computed(() => {
  const schoolData = {
    'hailin-second-primary': [
      { name: '坐位体前屈', score: 92 },
      { name: '1分钟跳绳', score: 88 },
      { name: '50米跑', score: 85 },
      { name: '立定跳远', score: 82 },
      { name: '仰卧起坐', score: 78 },
      { name: '引体向上', score: 72 }
    ],
    'hailin-zirong-primary': [
      { name: '1分钟跳绳', score: 90 },
      { name: '坐位体前屈', score: 85 },
      { name: '立定跳远', score: 80 },
      { name: '50米跑', score: 78 },
      { name: '仰卧起坐', score: 74 },
      { name: '引体向上', score: 68 }
    ],
    'linhai-experimental-primary': [
      { name: '坐位体前屈', score: 94 },
      { name: '1分钟跳绳', score: 91 },
      { name: '50米跑', score: 88 },
      { name: '立定跳远', score: 86 },
      { name: '引体向上', score: 80 },
      { name: '仰卧起坐', score: 76 }
    ]
  }
  return schoolData[schoolId.value] || schoolData['hailin-second-primary']
})

// 当前显示数据 - 根据热力图类型和切换更新
const heatmapData = computed(() => {
  const schoolData = {
    'hailin-second-primary': {
      passRate: [
        { grade: '一年级', class: '1班', value: 92, level: 'high' },
        { grade: '一年级', class: '2班', value: 88, level: 'high' },
        { grade: '二年级', class: '1班', value: 85, level: 'high' },
        { grade: '二年级', class: '2班', value: 78, level: 'medium' },
        { grade: '三年级', class: '1班', value: 72, level: 'medium' },
        { grade: '三年级', class: '2班', value: 65, level: 'medium' },
        { grade: '四年级', class: '1班', value: 58, level: 'low' },
        { grade: '四年级', class: '2班', value: 52, level: 'low' },
        { grade: '五年级', class: '1班', value: 68, level: 'medium' },
        { grade: '五年级', class: '2班', value: 75, level: 'medium' },
        { grade: '六年级', class: '1班', value: 82, level: 'high' },
        { grade: '六年级', class: '2班', value: 90, level: 'high' }
      ],
      excellentRate: [
        { grade: '一年级', class: '1班', value: 76, level: 'medium' },
        { grade: '一年级', class: '2班', value: 82, level: 'high' },
        { grade: '二年级', class: '1班', value: 74, level: 'medium' },
        { grade: '二年级', class: '2班', value: 66, level: 'medium' },
        { grade: '三年级', class: '1班', value: 58, level: 'low' },
        { grade: '三年级', class: '2班', value: 62, level: 'medium' },
        { grade: '四年级', class: '1班', value: 48, level: 'low' },
        { grade: '四年级', class: '2班', value: 45, level: 'low' },
        { grade: '五年级', class: '1班', value: 71, level: 'medium' },
        { grade: '五年级', class: '2班', value: 80, level: 'high' },
        { grade: '六年级', class: '1班', value: 86, level: 'high' },
        { grade: '六年级', class: '2班', value: 89, level: 'high' }
      ],
      participation: [
        { grade: '一年级', class: '1班', value: 95, level: 'high' },
        { grade: '一年级', class: '2班', value: 93, level: 'high' },
        { grade: '二年级', class: '1班', value: 88, level: 'high' },
        { grade: '二年级', class: '2班', value: 84, level: 'medium' },
        { grade: '三年级', class: '1班', value: 79, level: 'medium' },
        { grade: '三年级', class: '2班', value: 76, level: 'medium' },
        { grade: '四年级', class: '1班', value: 61, level: 'medium' },
        { grade: '四年级', class: '2班', value: 56, level: 'low' },
        { grade: '五年级', class: '1班', value: 83, level: 'medium' },
        { grade: '五年级', class: '2班', value: 86, level: 'high' },
        { grade: '六年级', class: '1班', value: 91, level: 'high' },
        { grade: '六年级', class: '2班', value: 94, level: 'high' }
      ]
    },
    'hailin-zirong-primary': {
      passRate: [
        { grade: '一年级', class: '1班', value: 88, level: 'high' },
        { grade: '一年级', class: '2班', value: 84, level: 'medium' },
        { grade: '二年级', class: '1班', value: 80, level: 'medium' },
        { grade: '二年级', class: '2班', value: 72, level: 'medium' },
        { grade: '三年级', class: '1班', value: 65, level: 'medium' },
        { grade: '三年级', class: '2班', value: 58, level: 'low' },
        { grade: '四年级', class: '1班', value: 55, level: 'low' },
        { grade: '四年级', class: '2班', value: 50, level: 'low' },
        { grade: '五年级', class: '1班', value: 62, level: 'medium' },
        { grade: '五年级', class: '2班', value: 70, level: 'medium' },
        { grade: '六年级', class: '1班', value: 78, level: 'medium' },
        { grade: '六年级', class: '2班', value: 85, level: 'high' }
      ],
      excellentRate: [
        { grade: '一年级', class: '1班', value: 70, level: 'medium' },
        { grade: '一年级', class: '2班', value: 75, level: 'medium' },
        { grade: '二年级', class: '1班', value: 68, level: 'medium' },
        { grade: '二年级', class: '2班', value: 60, level: 'medium' },
        { grade: '三年级', class: '1班', value: 52, level: 'low' },
        { grade: '三年级', class: '2班', value: 48, level: 'low' },
        { grade: '四年级', class: '1班', value: 42, level: 'low' },
        { grade: '四年级', class: '2班', value: 38, level: 'low' },
        { grade: '五年级', class: '1班', value: 65, level: 'medium' },
        { grade: '五年级', class: '2班', value: 72, level: 'medium' },
        { grade: '六年级', class: '1班', value: 80, level: 'high' },
        { grade: '六年级', class: '2班', value: 84, level: 'high' }
      ],
      participation: [
        { grade: '一年级', class: '1班', value: 92, level: 'high' },
        { grade: '一年级', class: '2班', value: 88, level: 'high' },
        { grade: '二年级', class: '1班', value: 82, level: 'high' },
        { grade: '二年级', class: '2班', value: 78, level: 'medium' },
        { grade: '三年级', class: '1班', value: 72, level: 'medium' },
        { grade: '三年级', class: '2班', value: 68, level: 'medium' },
        { grade: '四年级', class: '1班', value: 58, level: 'low' },
        { grade: '四年级', class: '2班', value: 52, level: 'low' },
        { grade: '五年级', class: '1班', value: 76, level: 'medium' },
        { grade: '五年级', class: '2班', value: 80, level: 'high' },
        { grade: '六年级', class: '1班', value: 88, level: 'high' },
        { grade: '六年级', class: '2班', value: 90, level: 'high' }
      ]
    },
    'linhai-experimental-primary': {
      passRate: [
        { grade: '一年级', class: '1班', value: 95, level: 'high' },
        { grade: '一年级', class: '2班', value: 92, level: 'high' },
        { grade: '二年级', class: '1班', value: 90, level: 'high' },
        { grade: '二年级', class: '2班', value: 85, level: 'high' },
        { grade: '三年级', class: '1班', value: 80, level: 'medium' },
        { grade: '三年级', class: '2班', value: 75, level: 'medium' },
        { grade: '四年级', class: '1班', value: 68, level: 'medium' },
        { grade: '四年级', class: '2班', value: 62, level: 'medium' },
        { grade: '五年级', class: '1班', value: 78, level: 'medium' },
        { grade: '五年级', class: '2班', value: 82, level: 'high' },
        { grade: '六年级', class: '1班', value: 88, level: 'high' },
        { grade: '六年级', class: '2班', value: 93, level: 'high' }
      ],
      excellentRate: [
        { grade: '一年级', class: '1班', value: 82, level: 'high' },
        { grade: '一年级', class: '2班', value: 86, level: 'high' },
        { grade: '二年级', class: '1班', value: 78, level: 'medium' },
        { grade: '二年级', class: '2班', value: 72, level: 'medium' },
        { grade: '三年级', class: '1班', value: 65, level: 'medium' },
        { grade: '三年级', class: '2班', value: 68, level: 'medium' },
        { grade: '四年级', class: '1班', value: 55, level: 'low' },
        { grade: '四年级', class: '2班', value: 52, level: 'low' },
        { grade: '五年级', class: '1班', value: 75, level: 'medium' },
        { grade: '五年级', class: '2班', value: 82, level: 'high' },
        { grade: '六年级', class: '1班', value: 90, level: 'high' },
        { grade: '六年级', class: '2班', value: 92, level: 'high' }
      ],
      participation: [
        { grade: '一年级', class: '1班', value: 97, level: 'high' },
        { grade: '一年级', class: '2班', value: 95, level: 'high' },
        { grade: '二年级', class: '1班', value: 92, level: 'high' },
        { grade: '二年级', class: '2班', value: 88, level: 'high' },
        { grade: '三年级', class: '1班', value: 84, level: 'high' },
        { grade: '三年级', class: '2班', value: 80, level: 'medium' },
        { grade: '四年级', class: '1班', value: 72, level: 'medium' },
        { grade: '四年级', class: '2班', value: 66, level: 'medium' },
        { grade: '五年级', class: '1班', value: 86, level: 'high' },
        { grade: '五年级', class: '2班', value: 90, level: 'high' },
        { grade: '六年级', class: '1班', value: 94, level: 'high' },
        { grade: '六年级', class: '2班', value: 96, level: 'high' }
      ]
    }
  }
  const data = schoolData[schoolId.value] || schoolData['hailin-second-primary']
  return [...(data[heatmapType.value] || [])]
})

// 重点关注学生数据
const focusStudents = computed(() => {
  const schoolData = {
    'hailin-second-primary': [
      { id: 1, name: '陈思语', class: '四年级5班', status: 'warning', totalScore: 52, attendance: 65, improvement: -8, abilities: [
        { name: '力量', score: 45 }, { name: '速度', score: 50 }, { name: '柔韧性', score: 58 }, { name: '协调性', score: 48 }
      ], suggestion: '该生多项指标低于年级平均水平，建议增加基础体能训练，特别是腿部力量和核心力量的训练。' },
      { id: 2, name: '刘浩宇', class: '三年级6班', status: 'warning', totalScore: 55, attendance: 70, improvement: -5, abilities: [
        { name: '力量', score: 50 }, { name: '速度', score: 52 }, { name: '柔韧性', score: 55 }, { name: '协调性', score: 52 }
      ], suggestion: '该生体能发展较为均衡但整体偏低，建议制定系统性训练计划，循序渐进提升各项指标。' }
    ],
    'hailin-zirong-primary': [
      { id: 1, name: '赵子涵', class: '三年级4班', status: 'warning', totalScore: 48, attendance: 60, improvement: -10, abilities: [
        { name: '力量', score: 40 }, { name: '速度', score: 45 }, { name: '柔韧性', score: 50 }, { name: '协调性', score: 42 }
      ], suggestion: '该生体质健康多项不达标，建议与家长沟通，制定家校联合训练方案。' },
      { id: 2, name: '孙一鸣', class: '五年级2班', status: 'improving', totalScore: 62, attendance: 78, improvement: 5, abilities: [
        { name: '力量', score: 58 }, { name: '速度', score: 60 }, { name: '柔韧性', score: 65 }, { name: '协调性', score: 55 }
      ], suggestion: '该生近期进步明显，建议继续保持当前训练强度，重点关注耐力和力量的提升。' }
    ],
    'linhai-experimental-primary': [
      { id: 1, name: '吴佳怡', class: '四年级3班', status: 'warning', totalScore: 50, attendance: 62, improvement: -6, abilities: [
        { name: '力量', score: 42 }, { name: '速度', score: 48 }, { name: '柔韧性', score: 55 }, { name: '协调性', score: 46 }
      ], suggestion: '该生BMI超标且体能指标偏低，建议增加有氧运动频率，控制饮食结构。' },
      { id: 2, name: '郑凯文', class: '六年级1班', status: 'improving', totalScore: 68, attendance: 82, improvement: 8, abilities: [
        { name: '力量', score: 65 }, { name: '速度', score: 68 }, { name: '柔韧性', score: 70 }, { name: '协调性', score: 62 }
      ], suggestion: '该生进步显著，已接近年级平均水平，建议保持训练并适当增加挑战性项目。' }
    ]
  }
  return schoolData[schoolId.value] || schoolData['hailin-second-primary']
})

const improvedCount = computed(() => {
  return focusStudents.value.filter(s => s.status === 'improving').length
})

// 个体画像详情
const profileDetailVisible = ref(false)
const selectedStudent = ref(null)

const viewStudentProfiles = () => {
  router.push('/student-data')
}

const viewProfileDetail = (student) => {
  selectedStudent.value = student
  profileDetailVisible.value = true
}

const viewFullReport = () => {
  if (selectedStudent.value) {
    profileDetailVisible.value = false
    router.push({
      path: '/evaluation/assessment',
      query: {
        studentName: selectedStudent.value.name,
        studentClass: selectedStudent.value.class,
        tab: 'digitalPortrait'
      }
    })
  }
}

const getAbilityColor = (score) => {
  if (score >= 80) return '#1E5AA8'
  if (score >= 60) return '#F5A623'
  return '#E85D4E'
}

const getRankColor = (index) => {
  if (index === 0) return '#1E5AA8'
  if (index === 1) return '#3B82F6'
  if (index === 2) return '#F5A623'
  return '#6B7280'
}

const viewAllWarnings = () => {
  router.push('/evaluation/leader')
}

const handleWarningClick = (warning) => {
  currentWarning.value = warning
  warningDetailVisible.value = true
}

const exportRanking = () => {
  ElMessage.success('排行数据已导出')
}

const initTrendChart = () => {
  if (!trendChart.value) return
  if (trendChartInstance) { trendChartInstance.dispose(); trendChartInstance = null }
  trendChartInstance = echarts.init(trendChart.value)

  // 从kpiList提取基础达标率
  const passRateItem = (kpiList.value || []).find(k => k.label === '平均达标率')
  const basePassRate = passRateItem ? parseFloat(passRateItem.value) : 86
  const excellentItem = (kpiList.value || []).find(k => k.label === '优秀率')
  const baseExcellent = excellentItem ? parseFloat(excellentItem.value) : 92

  // 从heatmapData计算各年级平均达标率作为基准
  const gradeAvgs = {}
  const gradeCounts = {}
  ;(heatmapData.value || []).forEach(h => {
    if (!gradeAvgs[h.grade]) { gradeAvgs[h.grade] = 0; gradeCounts[h.grade] = 0 }
    gradeAvgs[h.grade] += h.value
    gradeCounts[h.grade]++
  })
  const overallAvg = Object.keys(gradeAvgs).length > 0
    ? Object.values(gradeAvgs).reduce((s, v, i) => s + v / (Object.values(gradeCounts)[i] || 1), 0) / Object.keys(gradeAvgs).length
    : basePassRate

  const weekLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const monthLabels = ['第1周', '第2周', '第3周', '第4周', '第5周', '第6周', '第7周', '第8周']
  const termLabels = ['9月', '10月', '11月', '12月', '1月', '2月', '3月', '4月']

  let labels = monthLabels
  if (trendPeriod.value === 'week') labels = weekLabels
  else if (trendPeriod.value === 'term') labels = termLabels

  const n = labels.length
  const scale = overallAvg / 80

  const avgScoreData = Array.from({ length: n }, (_, i) => {
    const progress = i / (n - 1)
    return Math.round((70 + progress * 18) * scale + Math.sin(i * 0.8) * 2)
  })
  const passRateData = Array.from({ length: n }, (_, i) => {
    const progress = i / (n - 1)
    return Math.round(basePassRate - 5 + progress * 8 + Math.cos(i * 0.6) * 1.5)
  })

  trendChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['平均分', '达标率'], bottom: 0, textStyle: { color: '#6B7280' } },
    grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280' }
    },
    yAxis: [
      {
        type: 'value',
        name: '平均分',
        axisLine: { show: false },
        splitLine: { lineStyle: { color: '#F7F8FA' } },
        axisLabel: { color: '#6B7280' }
      },
      {
        type: 'value',
        name: '达标率',
        axisLine: { show: false },
        splitLine: { show: false },
        axisLabel: { color: '#6B7280', formatter: '{value}%' }
      }
    ],
    series: [
      {
        name: '平均分',
        type: 'line',
        smooth: true,
        lineStyle: { color: '#1E5AA8', width: 2.5 },
        itemStyle: { color: '#1E5AA8' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(30, 90, 168, 0.2)' },
            { offset: 1, color: 'rgba(30, 90, 168, 0)' }
          ])
        },
        data: avgScoreData
      },
      {
        name: '达标率',
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        lineStyle: { color: '#3B82F6', width: 2.5 },
        itemStyle: { color: '#3B82F6' },
        data: passRateData
      }
    ]
  })
}

const initGradeChart = () => {
  if (!gradeChart.value) return
  if (gradeChartInstance) { gradeChartInstance.dispose(); gradeChartInstance = null }
  gradeChartInstance = echarts.init(gradeChart.value)

  // 从heatmapData按年级分组计算平均达标率
  const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
  const gradeSums = {}
  const gradeCounts = {}
  ;(heatmapData.value || []).forEach(h => {
    if (!gradeSums[h.grade]) { gradeSums[h.grade] = 0; gradeCounts[h.grade] = 0 }
    gradeSums[h.grade] += h.value
    gradeCounts[h.grade]++
  })
  const gradeData = grades.map(g => {
    if (gradeSums[g] && gradeCounts[g]) return Math.round(gradeSums[g] / gradeCounts[g])
    return 0
  })
  // 如果heatmapData为空，使用默认值
  const finalData = gradeData.some(v => v > 0) ? gradeData : (profile.value.leaderDashboard.gradeChartData || [85, 80, 75, 82, 78, 80])

  gradeChartInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F7F8FA' } },
      axisLabel: { color: '#6B7280', formatter: '{value}%' }
    },
    yAxis: {
      type: 'category',
      data: grades,
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280' }
    },
    series: [{
      type: 'bar',
      barWidth: '50%',
      itemStyle: {
        borderRadius: [0, 4, 4, 0],
        color: (params) => {
          const colors = ['#1E5AA8', '#3B82F6', '#F5A623', '#1E5AA8', '#3B82F6', '#F5A623']
          return colors[params.dataIndex]
        }
      },
      data: finalData
    }]
  })
}

const initLeaveTypeChart = () => {
  if (!leaveTypeChart.value) return
  if (leaveTypeChartInstance) { leaveTypeChartInstance.dispose(); leaveTypeChartInstance = null }
  leaveTypeChartInstance = echarts.init(leaveTypeChart.value)

  const leaveTypeData = {
    'hailin-second-primary': [
      { value: 45, name: '病假', itemStyle: { color: '#3B82F6' } },
      { value: 32, name: '事假', itemStyle: { color: '#F5A623' } },
      { value: 18, name: '公假', itemStyle: { color: '#1E5AA8' } }
    ],
    'hailin-zirong-primary': [
      { value: 52, name: '病假', itemStyle: { color: '#3B82F6' } },
      { value: 28, name: '事假', itemStyle: { color: '#F5A623' } },
      { value: 15, name: '公假', itemStyle: { color: '#1E5AA8' } }
    ],
    'linhai-experimental-primary': [
      { value: 38, name: '病假', itemStyle: { color: '#3B82F6' } },
      { value: 25, name: '事假', itemStyle: { color: '#F5A623' } },
      { value: 22, name: '公假', itemStyle: { color: '#1E5AA8' } }
    ]
  }

  leaveTypeChartInstance.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: { orient: 'vertical', right: '5%', top: 'center', textStyle: { color: '#6B7280' } },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 8,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: { show: false },
      emphasis: {
        label: { show: true, fontSize: 14, fontWeight: 'bold' }
      },
      labelLine: { show: false },
      data: leaveTypeData[schoolId.value] || leaveTypeData['hailin-second-primary']
    }]
  })
}

const initLeaveRateChart = () => {
  if (!leaveRateChart.value) return
  if (leaveRateChartInstance) { leaveRateChartInstance.dispose(); leaveRateChartInstance = null }
  leaveRateChartInstance = echarts.init(leaveRateChart.value)

  const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
  const profiles = gradeProfiles.value
  const leaveRates = [
    profiles.grade1?.leaveRate || 2.1,
    profiles.grade2?.leaveRate || 1.8,
    profiles.grade3?.leaveRate || 3.2,
    profiles.grade4?.leaveRate || 2.5,
    profiles.grade5?.leaveRate || 1.9,
    profiles.grade6?.leaveRate || 2.8
  ]

  leaveRateChartInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: '{b}: {c}%' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: {
      type: 'category',
      data: grades,
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280', rotate: 30 }
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F7F8FA' } },
      axisLabel: { color: '#6B7280', formatter: '{value}%' }
    },
    series: [{
      type: 'bar',
      barWidth: '50%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: (params) => {
          const colors = ['#1E5AA8', '#3B82F6', '#F5A623', '#E85D4E', '#1E5AA8', '#3B82F6']
          return colors[params.dataIndex]
        }
      },
      data: leaveRates
    }]
  })
}

watch(trendPeriod, () => {
  nextTick(() => initTrendChart())
})

// 学校切换时重新初始化所有图表
watch(schoolId, () => {
  nextTick(() => {
    initTrendChart()
    initGradeChart()
    initLeaveTypeChart()
    initLeaveRateChart()
  })
})

// 数据变化时重新初始化图表
watch([heatmapData, kpiList], () => {
  nextTick(() => {
    initTrendChart()
    initGradeChart()
  })
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    setTimeout(() => { 
      initTrendChart(); 
      initGradeChart();
      initLeaveTypeChart();
      initLeaveRateChart();
    }, 200)
  })
  window.addEventListener('resize', handleChartResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleChartResize)
  if (trendChartInstance) trendChartInstance.dispose()
  if (gradeChartInstance) gradeChartInstance.dispose()
  if (leaveTypeChartInstance) leaveTypeChartInstance.dispose()
  if (leaveRateChartInstance) leaveRateChartInstance.dispose()
})

const handleChartResize = () => {
  if (trendChartInstance) trendChartInstance.resize()
  if (gradeChartInstance) gradeChartInstance.resize()
  if (leaveTypeChartInstance) leaveTypeChartInstance.resize()
  if (leaveRateChartInstance) leaveRateChartInstance.resize()
}
</script>

<style scoped>
.leader-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
}

.stat-label {
  font-size: 12px;
  color: #6B7280;
}

.charts-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.charts-row:first-of-type {
  grid-template-columns: 2fr 1fr;
}

.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.chart {
  height: 300px;
  width: 100%;
}

.time-tabs {
  display: flex;
  gap: 8px;
}

.time-tab {
  padding: 4px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  background: #F7F8FA;
  color: #6B7280;
  border: none;
  transition: all 0.2s;
}

.time-tab:hover {
  background: #E8F5EC;
  color: #1E5AA8;
}

.time-tab.active {
  background: #1E5AA8;
  color: #FFFFFF;
}

.bottom-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 24px;
}

.list-card.wide {
  grid-column: span 2;
}

.warning-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.warning-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #FAFBFC;
  cursor: pointer;
  transition: all 0.2s;
}

.warning-item:hover {
  background: #EEF6FF;
}

.warning-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.warning-icon.high { background: #FEE2E2; color: #991B1B; }
.warning-icon.medium { background: #FEF3C7; color: #92400E; }
.warning-icon.low { background: #DBEAFE; color: #1E40AF; }

.warning-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.warning-title {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.warning-desc {
  font-size: 12px;
  color: #6B7280;
}

.warning-time {
  font-size: 12px;
  color: #9CA3AF;
  white-space: nowrap;
}

.rank-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rank-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: #FAFBFC;
}

.rank-num {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
  background: #F3F4F6;
  flex-shrink: 0;
}

.rank-num.top3 {
  background: #FEF3C7;
  color: #92400E;
}

.rank-name {
  flex: 1;
  font-size: 14px;
  color: #1A1A2E;
}

.rank-score {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  width: 50px;
  text-align: right;
}

/* 热力图样式 */
.heatmap-container {
  padding: 12px;
}

.heatmap-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 12px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.legend-color {
  width: 20px;
  height: 20px;
  border-radius: 4px;
}

.legend-color.high {
  background: #1E5AA8;
}

.legend-color.medium {
  background: #F5A623;
}

.legend-color.low {
  background: #E85D4E;
}

.legend-label {
  font-size: 12px;
  color: #6B7280;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.heatmap-cell {
  padding: 12px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.heatmap-cell:hover {
  transform: scale(1.05);
}

.heatmap-cell.high {
  background: rgba(30, 90, 168, 0.2);
  border: 1px solid #1E5AA8;
}

.heatmap-cell.medium {
  background: rgba(245, 166, 35, 0.2);
  border: 1px solid #F5A623;
}

.heatmap-cell.low {
  background: rgba(232, 93, 78, 0.2);
  border: 1px solid #E85D4E;
}

.cell-grade {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 4px;
}

.cell-class {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 4px;
}

.cell-value {
  font-size: 16px;
  font-weight: 700;
}

.heatmap-cell.high .cell-value {
  color: #1E5AA8;
}

.heatmap-cell.medium .cell-value {
  color: #F5A623;
}

.heatmap-cell.low .cell-value {
  color: #E85D4E;
}

.heatmap-tooltip {
  position: fixed;
  z-index: 1000;
  background: #FFFFFF;
  border-radius: 8px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
  padding: 12px 16px;
  min-width: 180px;
  transform: translateX(-50%);
  pointer-events: none;
}

.heatmap-tooltip::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  border-left: 8px solid transparent;
  border-right: 8px solid transparent;
  border-top: 8px solid #FFFFFF;
}

.tooltip-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E8EAED;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.tooltip-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 13px;
}

.tooltip-label {
  color: #6B7280;
}

.tooltip-value {
  font-weight: 500;
  color: #1A1A2E;
}

.tooltip-value.high {
  color: #1E5AA8;
}

.tooltip-value.medium {
  color: #F5A623;
}

.tooltip-value.low {
  color: #E85D4E;
}

/* 个体画像样式 */
.profile-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 16px;
}

.profile-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #FAFBFC;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.profile-item:hover {
  background: #EEF6FF;
}

.profile-avatar {
  flex-shrink: 0;
}

.profile-info {
  flex: 1;
}

.profile-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.profile-class {
  font-size: 12px;
  color: #6B7280;
}

.profile-summary {
  display: flex;
  justify-content: center;
  gap: 40px;
  padding-top: 12px;
  border-top: 1px solid #E8EAED;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-num {
  font-size: 24px;
  font-weight: 700;
  color: #1E5AA8;
}

.summary-label {
  font-size: 12px;
  color: #6B7280;
}

/* 个体画像详情样式 */
.profile-detail {
  padding: 8px;
}

.profile-header {
  display: flex;
  gap: 16px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
  margin-bottom: 16px;
}

.profile-big-avatar {
  flex-shrink: 0;
}

.profile-main-info {
  flex: 1;
}

.profile-main-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1A1A2E;
}

.profile-main-info p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #6B7280;
}

.profile-stats {
  margin-bottom: 16px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.stat-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #1E5AA8;
}

.stat-label {
  font-size: 12px;
  color: #6B7280;
}

.profile-analysis {
  margin-bottom: 16px;
}

.profile-analysis h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.ability-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ability-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.ability-name {
  font-size: 12px;
  color: #6B7280;
}

.profile-suggestion {
  padding: 16px;
  background: #F0FDF4;
  border-radius: 8px;
}

.profile-suggestion h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: #166534;
}

.profile-suggestion p {
  margin: 0;
  font-size: 14px;
  color: #1A1A2E;
  line-height: 1.6;
}

/* 动态考勤追踪样式 */
.attendance-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
  padding: 12px 0;
}

.attendance-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  background: #FAFBFC;
  border-radius: 8px;
}

.attendance-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.attendance-icon.attendance {
  background: rgba(30, 90, 168, 0.15);
  color: #1E5AA8;
}

.attendance-icon.absent {
  background: rgba(232, 93, 78, 0.15);
  color: #E85D4E;
}

.attendance-icon.leave {
  background: rgba(245, 166, 35, 0.15);
  color: #F5A623;
}

.attendance-icon.late {
  background: rgba(156, 163, 175, 0.15);
  color: #9CA3AF;
}

.attendance-info {
  text-align: center;
}

.attendance-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #1A1A2E;
}

.attendance-label {
  font-size: 12px;
  color: #6B7280;
}

/* 异常预警样式 */
.anomaly-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.anomaly-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: #FAFBFC;
  cursor: pointer;
  transition: all 0.2s;
}

.anomaly-item:hover {
  background: #FEE2E2;
}

.anomaly-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.anomaly-icon.high {
  background: #FEE2E2;
  color: #991B1B;
}

.anomaly-icon.medium {
  background: #FEF3C7;
  color: #92400E;
}

.anomaly-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.anomaly-title {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.anomaly-desc {
  font-size: 12px;
  color: #6B7280;
}

.anomaly-time {
  font-size: 12px;
  color: #9CA3AF;
  white-space: nowrap;
}

/* 多源数据整合样式 */
.data-sources {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.data-source-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #FAFBFC;
  border-radius: 8px;
}

.source-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.source-icon.online {
  background: rgba(30, 90, 168, 0.15);
  color: #1E5AA8;
}

.source-icon.offline {
  background: rgba(232, 93, 78, 0.15);
  color: #E85D4E;
}

.source-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.source-name {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.source-status {
  font-size: 12px;
}

.source-status.online {
  color: #1E5AA8;
}

.source-status.offline {
  color: #E85D4E;
}

.source-data {
  font-size: 12px;
  color: #6B7280;
  white-space: nowrap;
}

/* 高频请假学生列表样式 */
.high-frequency-leave-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.high-frequency-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #FAFBFC;
  border-radius: 8px;
}

.student-avatar {
  flex-shrink: 0;
}

.student-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.student-name {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.student-class {
  font-size: 12px;
  color: #6B7280;
}

.leave-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.leave-days {
  font-size: 16px;
  font-weight: 700;
  color: #E85D4E;
}

.leave-reason {
  font-size: 11px;
  color: #9CA3AF;
}

.teacher-info {
  text-align: right;
}

.teacher-name {
  font-size: 12px;
  color: #6B7280;
}

/* 年级群体对比样式 */
.grade-comparison {
  padding: 12px 0;
}

.comparison-base {
  margin-bottom: 16px;
  padding: 12px;
  background: #EEF6FF;
  border-radius: 8px;
}

.base-label {
  font-size: 14px;
  font-weight: 600;
  color: #1E5AA8;
  margin-bottom: 8px;
}

.base-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.stat-chip {
  padding: 4px 12px;
  background: #FFFFFF;
  border-radius: 16px;
  font-size: 12px;
  color: #1A1A2E;
}

.comparison-targets {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.target-item {
  padding: 12px;
  background: #FAFBFC;
  border-radius: 8px;
}

.target-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.target-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.target-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.target-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
}

.stat-label {
  color: #6B7280;
}

.stat-value {
  font-weight: 600;
  color: #1A1A2E;
}

.stat-value.up {
  color: #1E5AA8;
}

.stat-value.down {
  color: #E85D4E;
}

.stat-trend {
  font-size: 11px;
  padding: 1px 4px;
  border-radius: 4px;
}

.stat-trend.up {
  color: #1E5AA8;
  background: rgba(30, 90, 168, 0.1);
}

.stat-trend.down {
  color: #E85D4E;
  background: rgba(232, 93, 78, 0.1);
}

/* 领导看板响应式布局 */
@media screen and (max-width: 992px) {
  .stats-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    padding: 16px;
  }
  
  .stat-divider {
    display: none;
  }
  
  .stat-item {
    text-align: center;
  }
  
  .charts-row {
    grid-template-columns: 1fr;
    gap: 20px;
  }
  
  .bottom-row {
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }
}

@media screen and (max-width: 768px) {
  .leader-dashboard {
    padding: 12px;
    gap: 12px;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px;
  }
  
  .stat-num {
    font-size: 20px;
  }
  
  .stat-label {
    font-size: 11px;
  }
  
  .charts-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .chart-card {
    padding: 16px;
  }
  
  .card-title {
    font-size: 14px;
  }
  
  .chart {
    height: 200px;
  }
  
  .bottom-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .bottom-row .list-card:last-child {
    grid-column: span 1;
  }
  
  .heatmap-container {
    overflow-x: auto;
  }
  
  .heatmap-grid {
    min-width: 400px;
  }
  
  .heatmap-cell {
    width: 50px;
    height: 40px;
  }
  
  .warning-item {
    flex-direction: column;
    gap: 8px;
  }
  
  .warning-time {
    text-align: left;
  }
}

@media screen and (max-width: 480px) {
  .stats-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    padding: 10px 12px;
    background: #F7F8FA;
    border-radius: 8px;
  }
  
  .stat-label {
    text-align: right;
  }
  
  .chart {
    height: 160px;
  }
  
  .heatmap-cell {
    width: 40px;
    height: 32px;
  }
  
  .cell-grade {
    font-size: 11px;
  }
  
  .cell-value {
    font-size: 10px;
  }
}

.notify-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.notify-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: #F8F9FA;
  border-radius: 8px;
}

.notify-avatar {
  flex-shrink: 0;
}

.notify-student-info {
  flex: 1;
  min-width: 0;
}

.notify-name {
  font-size: 14px;
  font-weight: 600;
  color: #1F2937;
}

.notify-class {
  font-size: 12px;
  color: #6B7280;
}

.notify-detail {
  flex-shrink: 0;
}

.notify-days {
  font-size: 13px;
  color: #E85D4E;
  font-weight: 500;
}

.notify-teacher {
  flex-shrink: 0;
}

.teacher-label {
  font-size: 12px;
  color: #6B7280;
}

.teacher-name {
  font-size: 13px;
  color: #1E5AA8;
  font-weight: 500;
}
</style>