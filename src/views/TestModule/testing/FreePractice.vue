<template>
  <div class="free-practice">
    <div class="mode-switch-container">
      <div class="mode-switch-wrapper">
        <span class="mode-label">练习模式</span>
        <el-switch v-model="practiceEnabled" @change="handlePracticeModeChange"  />
      </div>
    </div>

    <div v-if="practiceEnabled" class="mode-banner">
      <el-alert title="自由练习模式已开启 — 当前学生可自助测试" type="warning" :closable="false" show-icon />
    </div>

    <div class="page-header">
      <div class="header-left">
        <div class="gesture-status" :class="{ active: gestureRecognitionActive }" @click="toggleGestureRecognition">
          <span class="gesture-icon">{{ gestureRecognitionActive ? '✋' : '✋' }}</span>
          <span class="gesture-text">{{ gestureRecognitionActive ? '手势识别中' : '手势已关闭' }}</span>
          <span class="gesture-toggle">点击切换</span>
        </div>
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="exportRecords">导出记录</el-button>
        <el-button :icon="Monitor" @click="showControlPanel = true">远程控制</el-button>
        <el-button :icon="Clock" @click="showScheduleDialog = true">设备定时</el-button>
        <el-button :icon="Tools" @click="showScoreConfig = true">评分标准</el-button>
        <el-button type="primary" :icon="VideoPlay" @click="remoteStart">远程开启</el-button>
        <el-button type="danger" :icon="SwitchButton" @click="closeAll">一键关闭</el-button>
      </div>
    </div>

    <!-- 使用统计 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ usageStats.today }}</span>
        <span class="stat-label">今日练习人次</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ usageStats.week }}</span>
        <span class="stat-label">本周练习人次</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ usageStats.month }}</span>
        <span class="stat-label">本月练习人次</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ practiceRecords.length }}</span>
        <span class="stat-label">总记录数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num completed">{{ practiceRecords.filter(r => r.status === '已完成').length }}</span>
        <span class="stat-label">已完成</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num pending">{{ practiceRecords.filter(r => r.status === '进行中' || r.status === '待评分').length }}</span>
        <span class="stat-label">待测</span>
      </div>
    </div>

    <!-- 个人最佳成绩展示 -->
    <div class="personal-best-section">
      <div class="section-header">
        <h3 class="section-title">
          个人最佳成绩
        </h3>
        <el-button text size="small" @click="refreshBestRecords">刷新记录</el-button>
      </div>
      
      <div class="best-records">
        <div v-for="(record, index) in bestRecords" :key="index" class="best-card" :class="record.level">
          <div class="card-badge">{{ getRankBadge(index) }}</div>
          <div class="card-content">
            <div class="student-info">
              <div class="student-details">
                <span class="student-name">{{ record.studentName }}</span>
                <span class="student-class">{{ record.grade }}{{ record.class }}</span>
              </div>
            </div>
            <div class="record-info">
              <div class="record-item">
                <span class="record-label">{{ record.event }}</span>
                <span class="record-value">{{ record.score }}</span>
              </div>
              <div class="record-compare">
               
                <span :class="record.improvement >= 0 ? 'improve-positive' : 'improve-negative'">
                  {{ record.improvement >= 0 ? '+' : '' }}{{ record.improvement }}%
                </span>
                <span class="improve-label">较上次</span>
              </div>
            </div>
            <div class="record-time">
              <el-icon :size="14"><Clock /></el-icon>
              <span>{{ record.date }}</span>
            </div>
          </div>
          <div class="card-actions">
            <el-button text size="small" @click="viewRecordDetail(record)">查看详情</el-button>
            <el-button text size="small" @click="shareRecord(record)">分享</el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 手势自助触发区域 -->
    <div class="gesture-panel">
      <div class="panel-header">
        <h3 class="panel-title">
          <span class="gesture-title-icon">✋</span>
          手势自助触发
        </h3>

      </div>
      
      <div class="gesture-guide">
        <div class="guide-title">支持的手势</div>
        <div class="gesture-grid">
          <div v-for="gesture in gestureTypes" :key="gesture.name" class="gesture-item">
            <span class="gesture-emoji">{{ gesture.icon }}</span>
            <span class="gesture-name">{{ gesture.name }}</span>
            <span class="gesture-desc">{{ gesture.description }}</span>
          </div>
        </div>
      </div>
      
      <div class="gesture-history">
        <div class="history-title">最近手势记录</div>
        <div v-if="gestureHistory.length === 0" class="history-empty">
          暂无手势记录
        </div>
        <div v-else class="history-list">
          <div v-for="(record, index) in gestureHistory" :key="index" class="history-item">
            <span class="history-time">{{ record.time }}</span>
            <span class="history-gesture">{{ record.gesture.icon }} {{ record.gesture.name }}</span>
            <span :class="['history-status', record.success ? 'success' : 'failed']">
              {{ record.success ? '成功' : '失败' }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <!-- 项目使用量图表 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">各项目使用量统计</span>
          <el-button :icon="Download" size="small" @click="downloadChart(usageChartInstance, '各项目使用量统计')">下载图表</el-button>
        </div>
        <div ref="usageChart" class="chart"></div>
      </div>
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">时段分布</span>
          <el-button :icon="Download" size="small" @click="downloadChart(timeChartInstance, '时段分布')">下载图表</el-button>
        </div>
        <div ref="timeChart" class="chart"></div>
      </div>
    </div>

    <!-- 练习记录列表 -->
    <div class="practice-records-card">
      <div class="card-header">
        <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Document /></el-icon> 练习记录列表</span>
        <div class="header-right">
          <div class="filter-group">
            <el-select v-model="filterProject" placeholder="选择项目" style="width: 140px">
              <el-option label="全部" value="" />
              <el-option label="立定跳远" value="立定跳远" />
              <el-option label="仰卧起坐" value="仰卧起坐" />
              <el-option label="坐位体前屈" value="坐位体前屈" />
              <el-option label="50米跑" value="50米跑" />
              <el-option label="跳绳" value="跳绳" />
              <el-option label="引体向上" value="引体向上" />
            </el-select>
            <el-select v-model="filterStatus" placeholder="选择状态" style="width: 120px">
              <el-option label="全部" value="" />
              <el-option label="已完成" value="已完成" />
              <el-option label="进行中" value="进行中" />
              <el-option label="待评分" value="待评分" />
            </el-select>
            <el-date-picker
              v-model="filterDate"
              type="date"
              placeholder="选择日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
              style="width: 150px"
            />
          </div>
          <el-button :icon="Refresh" @click="refreshRecords" text size="small">刷新</el-button>
        </div>
      </div>

      <ExamTable
        :data="filteredPracticeRecords"
        :columns="practiceColumns"
        :title="''"
        :show-header="false"
        :searchable="false"
        :show-refresh="false"
        :show-pagination="true"
        :page-sizes="[10, 20, 30]"
        :default-page-size="10"
        :show-selection="false"
      >
        <template #studentInfo="{ row }">
          <div class="student-mini-info">
            <div class="mini-detail">
              <span class="mini-name">{{ row.studentName }}</span>
              <span class="mini-class">{{ row.grade }}{{ row.className }}</span>
            </div>
          </div>
        </template>
        <template #score="{ row }">
          <span class="practice-score" :class="getScoreClass(row.score, row.event)">
            {{ row.score }}
          </span>
        </template>
        <template #level="{ row }">
          <el-tag :type="getScoreLevel(row.score, row.event)" size="small">
            {{ getScoreLevelText(row.score, row.event) }}
          </el-tag>
        </template>
        <template #bestScore="{ row }">
          <span class="best-score">{{ getBestScore(row.studentId, row.event) }}</span>
        </template>
        <template #rank="{ row }">
          <span class="rank-value">{{ getRank(row) }}</span>
        </template>
        <template #duration="{ row }">
          <span>{{ row.duration }}秒</span>
        </template>
        <template #status="{ row }">
          <span class="status-tag" :class="row.status === '已完成' ? 'status-completed' : 'status-pending'">
            {{ row.status === '已完成' ? '已完成' : row.status === '进行中' ? '进行中' : '待评分' }}
          </span>
        </template>
        <template #actions="{ row }">
          <el-button text type="primary" size="small" @click="viewDetail(row)">详情</el-button>
          <el-button text type="primary" size="small" @click="migrateToExam(row)" :disabled="row.migrated && row.migratedTo === 'exam'">
            {{ row.migratedTo === 'exam' ? '已迁考试' : '迁移考试' }}
          </el-button>
          <el-button text type="primary" size="small" @click="migrateToTest(row)" :disabled="row.migrated && row.migratedTo === 'test'">
            {{ row.migratedTo === 'test' ? '已迁体测' : '迁移体测' }}
          </el-button>
        </template>
      </ExamTable>
    </div>

    <!-- 远程控制面板 -->
    <el-dialog 
      v-model="showControlPanel"
      title="远程控制面板" 
      width="720px"
    >
      <div class="control-panel">
        <div class="panel-header">
          <span class="panel-title">设备状态监控</span>
          <div class="panel-stats">
            <span class="stat-badge online">{{ devices.filter(d => d.status === 'online').length }} 在线</span>
            <span class="stat-badge offline">{{ devices.filter(d => d.status === 'offline').length }} 离线</span>
            <span class="stat-badge fault">{{ devices.filter(d => d.status === 'fault').length }} 故障</span>
          </div>
        </div>
        
        <div class="device-list">
          <div v-for="device in devices" :key="device.id" class="device-card" :class="device.status">
            <div class="device-info">
              <div class="device-header">
                <span class="device-name">{{ device.name }}</span>
                <el-tag size="small" type="info">{{ getProjectText(device.project) }}</el-tag>
                <span class="status-dot" :class="device.status"></span>
              </div>
              <span class="device-location">{{ device.location }}</span>
              <span class="device-active">开放时段: {{ device.openTime }} - {{ device.closeTime }}</span>
            </div>
            <div class="device-actions">
              <el-switch v-model="device.enabled" size="small" active-text="启用" inactive-text="禁用" style="margin-right:8px" @change="handleDeviceEnabledChange(device)" />
              <el-button 
                v-if="device.status !== 'online'" 
                type="primary" 
                size="small" 
                :disabled="!device.enabled"
                @click="controlDevice(device.id, 'start')"
              >
                启动
              </el-button>
              <el-button 
                v-if="device.status === 'online'" 
                type="danger" 
                size="small" 
                @click="controlDevice(device.id, 'stop')"
              >
                停止
              </el-button>
              <el-button text size="small" @click="viewDeviceLog(device.id)">日志</el-button>
            </div>
          </div>
        </div>
        
        <div class="panel-actions">
          <el-button type="primary" @click="controlAllDevices('start')">一键开启所有设备</el-button>
          <el-button type="danger" @click="controlAllDevices('stop')">一键关闭所有设备</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="showControlPanel = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 设备定时锁定 -->
    <el-dialog
      v-model="showScheduleDialog"
      title="设备定时锁定"
      width="720px"
    >
      <div class="schedule-panel">
        <div class="schedule-global">
          <h4>全局定时策略</h4>
          <el-form label-width="120px">
            <el-form-item label="启用定时锁定">
              <el-switch v-model="scheduleSettings.enabled" active-text="开启" inactive-text="关闭" />
            </el-form-item>
            <el-form-item label="法定工作日">
              <el-time-picker
                v-model="scheduleSettings.weekdayRange"
                is-range
                range-separator="至"
                start-placeholder="开启时间"
                end-placeholder="关闭时间"
                format="HH:mm"
                value-format="HH:mm"
              />
            </el-form-item>
            <el-form-item label="节假日策略">
              <el-radio-group v-model="scheduleSettings.holidayMode">
                <el-radio label="autoClose">节假日自动关闭</el-radio>
                <el-radio label="followWeekday">按工作日时段</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-form>
        </div>

        <div class="schedule-devices">
          <div class="schedule-header">
            <h4>各项目设备自定义开启时间</h4>
            <el-button size="small" type="primary" @click="applyGlobalSchedule">应用到全部设备</el-button>
          </div>
          <el-table :data="devices" stripe size="small">
            <el-table-column prop="name" label="设备名称" min-width="140" />
            <el-table-column label="项目" width="110">
              <template #default="{ row }">
                <el-tag size="small" type="info">{{ getProjectText(row.project) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column label="自定义时段" min-width="200">
              <template #default="{ row }">
                <el-time-picker
                  :model-value="[row.openTime, row.closeTime]"
                  is-range
                  range-separator="-"
                  start-placeholder="开始"
                  end-placeholder="结束"
                  format="HH:mm"
                  value-format="HH:mm"
                  size="small"
                  class="w-full"
                  @update:model-value="(val) => { if(val){ row.openTime = val[0]; row.closeTime = val[1] } }"
                />
              </template>
            </el-table-column>
            <el-table-column label="锁定状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getDeviceLockStatus(row).type" size="small">
                  {{ getDeviceLockStatus(row).text }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <el-alert
          title="节假日设备将自动关闭；非法定工作时段内设备处于锁定状态，学生无法自助开启测试。"
          type="info"
          :closable="false"
          show-icon
        />
      </div>
      <template #footer>
        <el-button @click="showScheduleDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSchedule">保存定时设置</el-button>
      </template>
    </el-dialog>

    <!-- 练习详情 -->
    <el-dialog v-model="detailVisible" title="练习记录详情" width="560px">
      <div v-if="selectedRecord" class="detail-panel">
        <div class="detail-row"><span class="label">记录编号</span><span>{{ selectedRecord.id }}</span></div>
        <div class="detail-row"><span class="label">学生姓名</span><span>{{ selectedRecord.studentName }}</span></div>
        <div class="detail-row"><span class="label">年级/班级</span><span>{{ selectedRecord.grade || '-' }} {{ selectedRecord.className || '-' }}</span></div>
        <div class="detail-row"><span class="label">练习项目</span><span>{{ selectedRecord.event }}</span></div>
        <div class="detail-row"><span class="label">成绩</span><span class="score-value">{{ selectedRecord.score }}</span></div>
        <div class="detail-row"><span class="label">原始分数</span><span>{{ selectedRecord.scoreRaw || '-' }}</span></div>
        <div class="detail-row"><span class="label">练习时长</span><span>{{ selectedRecord.duration || '-' }} 秒</span></div>
        <div class="detail-row"><span class="label">消耗卡路里</span><span>{{ selectedRecord.calories || '-' }} kcal</span></div>
        <div class="detail-row"><span class="label">练习时间</span><span>{{ selectedRecord.date }}</span></div>
        <div class="detail-row"><span class="label">状态</span>
          <span class="status-tag" :class="selectedRecord.status === '已完成' ? 'status-completed' : 'status-pending'">
            {{ selectedRecord.status === '已完成' ? '已完成' : selectedRecord.status === '进行中' ? '进行中' : '待评分' }}
          </span>
        </div>
        <div class="detail-row"><span class="label">迁移状态</span>
          <span v-if="selectedRecord.migrated" class="status-tag status-migrated">
            已迁移至{{ selectedRecord.migratedTo === 'exam' ? '考试' : '体测' }}系统
          </span>
          <span v-else class="status-tag status-pending">未迁移</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 评分标准配置对话框 -->
    <el-dialog
      v-model="showScoreConfig"
      title="评分标准配置"
      width="800px"
      max-height="85vh"
    >
      <ScoreConfig />
      <template #footer>
        <el-button @click="showScoreConfig = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 设备日志 -->
    <el-dialog v-model="deviceLogVisible" :title="`${logDevice?.name || ''} - 操作日志`" width="640px">
      <el-table :data="deviceLogs" stripe size="small" max-height="360">
        <el-table-column prop="time" label="时间" min-width="160" />
        <el-table-column prop="action" label="操作" min-width="120" />
        <el-table-column prop="operator" label="操作人" min-width="100" />
        <el-table-column prop="result" label="结果" min-width="100" />
      </el-table>
      <template #footer>
        <el-button @click="deviceLogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, onBeforeUnmount, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePersistedRef } from '@/composables/usePersistedRef'
import { Download, VideoPlay, SwitchButton, Refresh, Monitor, Clock, Tools, Document } from '@element-plus/icons-vue'
import ExamTable from '../../components/table/ExamTable.vue'
import * as echarts from 'echarts'
import store from '../../store/global'
import { getSchoolMockData } from '../../utils/mockDataLoader'
import ScoreConfig from '@/components/config/ScoreConfig.vue'
import { useOperationLog } from '@/composables/useOperationLog'
import { createSeededRandom } from '@/utils/seededRandom'

const { addLog } = useOperationLog('test')

const practiceEnabled = ref(true)
const gestureRecognitionActive = ref(false)
const usageChart = ref(null)
const timeChart = ref(null)
let usageChartInstance = null
let timeChartInstance = null

const showControlPanel = ref(false)
const showScheduleDialog = ref(false)
const detailVisible = ref(false)
const selectedRecord = ref(null)
const deviceLogVisible = ref(false)

// 获取学校数据
const schoolData = computed(() => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  return getSchoolMockData(schoolId)
})

// practiceRecords 使用 sessionStorage 持久化，刷新保留，关闭标签页清空
const practiceRecords = usePersistedRef(
  `smart_pe_practice_${store.state.school?.id || 'default'}`,
  [...(schoolData.value?.practiceRecords || [])]
)
const logDevice = ref(null)
const deviceLogs = ref([])
const showScoreConfig = ref(false)

// 练习记录筛选变量
const filterProject = ref('')
const filterStatus = ref('')
const filterDate = ref('')

// 表格列配置
const practiceColumns = ref([
  { prop: 'id', label: '记录编号', minWidth: '120' },
  { slot: 'studentInfo', label: '学生信息', minWidth: '180' },
  { prop: 'event', label: '练习项目', minWidth: '120' },
  { slot: 'score', label: '成绩', minWidth: '120', align: 'center', sortable: true },
  { slot: 'level', label: '成绩等级', minWidth: '100', align: 'center' },
  { slot: 'bestScore', label: '历史最好', minWidth: '100', align: 'center', sortable: true },
  { slot: 'rank', label: '排名', minWidth: '80', align: 'center', sortable: true },
  { slot: 'duration', label: '练习时长', minWidth: '100', align: 'center' },
  { prop: 'date', label: '练习时间', minWidth: '160', sortable: true },
  { slot: 'status', label: '状态', minWidth: '100', align: 'center' },
])

// 手势触发相关 - 静态模拟数据
const gestureHistory = ref([
  { time: '14:32:18', gesture: { name: '挥手', icon: '✋' }, success: true },
  { time: '14:28:45', gesture: { name: '点赞', icon: '👍' }, success: true },
  { time: '14:25:12', gesture: { name: '双手举起', icon: '🙌' }, success: true },
  { time: '14:20:30', gesture: { name: '比心', icon: '❤️' }, success: false }
])

// 支持的手势类型
const gestureTypes = [
  { name: '挥手', icon: '✋', description: '挥手示意开始测试', action: 'startTest' },
  { name: '点赞', icon: '👍', description: '点赞确认成绩', action: 'confirmScore' },
  { name: '比心', icon: '❤️', description: '比心分享成绩', action: 'shareScore' },
  { name: '双手举起', icon: '🙌', description: '双手举起结束测试', action: 'endTest' }
]

// 切换手势识别
const toggleGestureRecognition = () => {
  gestureRecognitionActive.value = !gestureRecognitionActive.value
  if (gestureRecognitionActive.value) {
    ElMessage.success('手势识别已开启')
  } else {
    ElMessage.info('手势识别已关闭')
  }
}

const scheduleSettings = ref({
  enabled: true,
  weekdayRange: ['08:00', '18:00'],
  holidayMode: 'autoClose'
})

// 学校ID（与设备管理页共享）
const schoolId = computed(() => store.state.school?.id || 'hailin-second-primary')

// 项目映射
const projectMap = {
  'fiftyMeter': '短跑', 'fiftyMeter8': '50米*8往返跑', 'running': '长跑',
  'longJump': '立定跳远', 'sitAndReach': '坐位体前屈', 'pullUp': '引体向上',
  'sitUps': '仰卧起坐', 'ropeSkipping': '跳绳', 'vitalCapacity': '肺活量', 'bmi': 'BMI测试'
}
const getProjectText = (key) => projectMap[key] || key

// 设备默认数据（与设备管理页完全一致）
const getDefaultDevices = () => {
  const schoolDevices = {
    'hailin-second-primary': [
      { id: 'DEV001', name: '短跑计时器1号(50米)', project: 'fiftyMeter', location: '田径场A区', status: 'online', openTime: '08:00', closeTime: '18:00', enabled: true, manualOverride: null },
      { id: 'DEV002', name: '短跑计时器2号(50米)', project: 'fiftyMeter', location: '田径场A区', status: 'online', openTime: '08:00', closeTime: '18:00', enabled: true, manualOverride: null },
      { id: 'DEV003', name: '短跑计时器3号(100米)', project: 'fiftyMeter', location: '田径场B区', status: 'online', openTime: '08:00', closeTime: '18:00', enabled: true, manualOverride: null },
      { id: 'DEV004', name: '50米*8往返跑计时器', project: 'fiftyMeter8', location: '田径场A区', status: 'online', openTime: '08:00', closeTime: '18:00', enabled: true, manualOverride: null },
      { id: 'DEV005', name: '立定跳远测试仪1号', project: 'longJump', location: '体育馆1号馆', status: 'online', openTime: '08:00', closeTime: '18:00', enabled: true, manualOverride: null },
      { id: 'DEV006', name: '立定跳远测试仪2号', project: 'longJump', location: '体育馆1号馆', status: 'offline', openTime: '08:00', closeTime: '18:00', enabled: false, manualOverride: null },
      { id: 'DEV007', name: '坐位体前屈测试仪1号', project: 'sitAndReach', location: '体育馆2号馆', status: 'online', openTime: '08:00', closeTime: '18:00', enabled: true, manualOverride: null },
      { id: 'DEV008', name: '坐位体前屈测试仪2号', project: 'sitAndReach', location: '体育馆2号馆', status: 'online', openTime: '08:00', closeTime: '18:00', enabled: true, manualOverride: null },
      { id: 'DEV009', name: '仰卧起坐计数器1号', project: 'sitUps', location: '体育馆3号馆', status: 'online', openTime: '08:00', closeTime: '18:00', enabled: true, manualOverride: null },
      { id: 'DEV010', name: '仰卧起坐计数器2号', project: 'sitUps', location: '体育馆3号馆', status: 'fault', openTime: '08:00', closeTime: '18:00', enabled: false, manualOverride: null },
      { id: 'DEV011', name: '引体向上测试仪', project: 'pullUp', location: '室外单杠区', status: 'online', openTime: '08:00', closeTime: '17:30', enabled: true, manualOverride: null },
      { id: 'DEV012', name: '长跑计时器', project: 'running', location: '田径场B区', status: 'online', openTime: '08:00', closeTime: '18:00', enabled: true, manualOverride: null },
      { id: 'DEV013', name: '跳绳计数器1号', project: 'ropeSkipping', location: '体育馆3号馆', status: 'online', openTime: '08:00', closeTime: '18:00', enabled: true, manualOverride: null },
      { id: 'DEV014', name: '肺活量测试仪', project: 'vitalCapacity', location: '体质测试室', status: 'online', openTime: '08:00', closeTime: '17:30', enabled: true, manualOverride: null }
    ],
    'hailin-zirong-primary': [
      { id: 'ZR-DEV001', name: '短跑计时器1号(50米)', project: 'fiftyMeter', location: '操场东侧', status: 'online', openTime: '07:30', closeTime: '17:30', enabled: true, manualOverride: null },
      { id: 'ZR-DEV002', name: '短跑计时器2号(100米)', project: 'fiftyMeter', location: '操场东侧', status: 'online', openTime: '07:30', closeTime: '17:30', enabled: true, manualOverride: null },
      { id: 'ZR-DEV003', name: '50米*8往返跑计时器', project: 'fiftyMeter8', location: '操场东侧', status: 'online', openTime: '07:30', closeTime: '17:30', enabled: true, manualOverride: null },
      { id: 'ZR-DEV004', name: '立定跳远测试仪', project: 'longJump', location: '体育馆', status: 'online', openTime: '07:30', closeTime: '17:30', enabled: true, manualOverride: null },
      { id: 'ZR-DEV005', name: '坐位体前屈测试仪', project: 'sitAndReach', location: '体育馆', status: 'offline', openTime: '07:30', closeTime: '17:30', enabled: false, manualOverride: null },
      { id: 'ZR-DEV006', name: '仰卧起坐计数器', project: 'sitUps', location: '体育馆', status: 'online', openTime: '07:30', closeTime: '17:30', enabled: true, manualOverride: null },
      { id: 'ZR-DEV007', name: '引体向上测试仪', project: 'pullUp', location: '操场西侧', status: 'fault', openTime: '07:30', closeTime: '17:00', enabled: false, manualOverride: null },
      { id: 'ZR-DEV008', name: '长跑计时器', project: 'running', location: '操场跑道', status: 'online', openTime: '07:30', closeTime: '17:30', enabled: true, manualOverride: null },
      { id: 'ZR-DEV009', name: '跳绳计数器', project: 'ropeSkipping', location: '操场东侧', status: 'online', openTime: '07:30', closeTime: '17:30', enabled: true, manualOverride: null }
    ],
    'linhai-experimental-primary': [
      { id: 'LH-DEV001', name: '短跑计时器1号(50米)', project: 'fiftyMeter', location: '田径场', status: 'online', openTime: '08:30', closeTime: '16:30', enabled: true, manualOverride: null },
      { id: 'LH-DEV002', name: '短跑计时器2号(50米)', project: 'fiftyMeter', location: '田径场', status: 'online', openTime: '08:30', closeTime: '16:30', enabled: true, manualOverride: null },
      { id: 'LH-DEV003', name: '短跑计时器3号(100米)', project: 'fiftyMeter', location: '田径场', status: 'online', openTime: '08:30', closeTime: '16:30', enabled: true, manualOverride: null },
      { id: 'LH-DEV004', name: '50米*8往返跑计时器1号', project: 'fiftyMeter8', location: '田径场', status: 'online', openTime: '08:30', closeTime: '16:30', enabled: true, manualOverride: null },
      { id: 'LH-DEV005', name: '50米*8往返跑计时器2号', project: 'fiftyMeter8', location: '田径场', status: 'online', openTime: '08:30', closeTime: '16:30', enabled: true, manualOverride: null },
      { id: 'LH-DEV006', name: '立定跳远测试仪1号', project: 'longJump', location: '综合馆', status: 'online', openTime: '08:30', closeTime: '16:30', enabled: true, manualOverride: null },
      { id: 'LH-DEV007', name: '立定跳远测试仪2号', project: 'longJump', location: '综合馆', status: 'online', openTime: '08:30', closeTime: '16:30', enabled: true, manualOverride: null },
      { id: 'LH-DEV008', name: '坐位体前屈测试仪1号', project: 'sitAndReach', location: '综合馆', status: 'online', openTime: '08:30', closeTime: '16:30', enabled: true, manualOverride: null },
      { id: 'LH-DEV009', name: '坐位体前屈测试仪2号', project: 'sitAndReach', location: '综合馆', status: 'online', openTime: '08:30', closeTime: '16:30', enabled: true, manualOverride: null },
      { id: 'LH-DEV010', name: '仰卧起坐计数器1号', project: 'sitUps', location: '综合馆', status: 'online', openTime: '08:30', closeTime: '16:30', enabled: true, manualOverride: null },
      { id: 'LH-DEV011', name: '仰卧起坐计数器2号', project: 'sitUps', location: '综合馆', status: 'online', openTime: '08:30', closeTime: '16:30', enabled: true, manualOverride: null },
      { id: 'LH-DEV012', name: '引体向上测试仪1号', project: 'pullUp', location: '室外运动区', status: 'offline', openTime: '08:30', closeTime: '16:00', enabled: false, manualOverride: null },
      { id: 'LH-DEV013', name: '引体向上测试仪2号', project: 'pullUp', location: '室外运动区', status: 'online', openTime: '08:30', closeTime: '16:00', enabled: true, manualOverride: null },
      { id: 'LH-DEV014', name: '长跑计时器', project: 'running', location: '田径场', status: 'online', openTime: '08:30', closeTime: '16:30', enabled: true, manualOverride: null },
      { id: 'LH-DEV015', name: '肺活量测试仪', project: 'vitalCapacity', location: '综合馆', status: 'online', openTime: '08:30', closeTime: '16:30', enabled: true, manualOverride: null },
      { id: 'LH-DEV016', name: '跳绳计数器1号', project: 'ropeSkipping', location: '综合馆', status: 'online', openTime: '08:30', closeTime: '16:30', enabled: true, manualOverride: null },
      { id: 'LH-DEV017', name: '跳绳计数器2号', project: 'ropeSkipping', location: '综合馆', status: 'online', openTime: '08:30', closeTime: '16:30', enabled: true, manualOverride: null }
    ]
  }
  return schoolDevices[schoolId.value] || schoolDevices['hailin-second-primary']
}

// 设备列表 — 与设备管理页共享同一 sessionStorage key，数据互通
const devices = usePersistedRef(computed(() => `smart_pe_devices_${schoolId.value}`), getDefaultDevices())

const usageStats = computed(() => {
  const records = practiceRecords.value || []
  const today = new Date('2026-07-16T08:00:00').toISOString().split('T')[0]
  const now = new Date('2026-07-16T08:00:00')
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const todayCount = records.filter(r => r.date && r.date.split(' ')[0] === today).length
  const weekCount = records.filter(r => r.date && r.date.split(' ')[0] >= weekAgo).length
  const monthCount = records.filter(r => r.date && r.date.split(' ')[0] >= monthAgo).length
  const completedCount = records.filter(r => r.status === '已完成').length
  const pendingCount = records.filter(r => r.status === '进行中' || r.status === '待评分').length
  const activeProjects = new Set(records.filter(r => r.status === '进行中').map(r => r.event)).size

  return { today: todayCount, week: weekCount, month: monthCount, activeProjects }
})

// 个人最佳成绩数据 — 从实际练习记录中计算
const bestRecords = computed(() => {
  const random = createSeededRandom((store.state.school?.id || 'default') + '_bestRecords')
  const records = practiceRecords.value || []
  const completed = records.filter(r => r.status === '已完成')
  // 按学生+项目分组，取最高分
  const groupMap = {}
  completed.forEach(r => {
    const key = `${r.studentId}_${r.event}`
    if (!groupMap[key] || (r.scoreRaw || 0) > (groupMap[key].scoreRaw || 0)) {
      groupMap[key] = r
    }
  })
  // 按分数排序取前5
  const topRecords = Object.values(groupMap)
    .sort((a, b) => (b.scoreRaw || 0) - (a.scoreRaw || 0))
    .slice(0, 5)

  return topRecords.map((r, idx) => ({
    id: r.id,
    studentName: r.studentName,
    grade: r.grade || '',
    class: r.className || '',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${r.studentId || idx}`,
    event: r.event,
    score: r.score,
    improvement: (random() * 15 - 3).toFixed(1),
    date: r.date,
    level: (r.scoreRaw || 0) >= 90 ? 'excellent' : (r.scoreRaw || 0) >= 75 ? 'good' : 'pass',
    personalBest: true,
    schoolRecord: idx === 0
  }))
})

// 获取排名徽章
const getRankBadge = (index) => {
  const badges = ['🥇', '🥈', '🥉', '4', '5']
  return badges[index] || (index + 1)
}

// 刷新最佳记录
const refreshBestRecords = () => {
  ElMessage.success('最佳记录已刷新')
}

// 查看详情
const viewRecordDetail = (record) => {
  selectedRecord.value = record
  detailVisible.value = true
}

// 分享记录
const shareRecord = (record) => {
  ElMessage.success(`已生成分享链接: ${record.studentName}的${record.event}最佳成绩${record.score}`)
}

const filteredRecords = computed(() => {
  const today = new Date().toISOString().split('T')[0] // 获取今日日期 YYYY-MM-DD
  return (practiceRecords.value || []).filter(record => {
    const recordDate = record.date.split(' ')[0] // 提取记录的日期部分
    return recordDate === today // 只显示今日记录
  })
})

// 练习记录列表筛选
const filteredPracticeRecords = computed(() => {
  return (practiceRecords.value || []).filter(record => {
    if (filterProject.value && record.event !== filterProject.value) {
      return false
    }
    if (filterStatus.value && record.status !== filterStatus.value) {
      return false
    }
    if (filterDate.value) {
      const recordDate = record.date.split(' ')[0]
      if (recordDate !== filterDate.value) {
        return false
      }
    }
    return true
  })
})

// 刷新记录
const refreshRecords = () => {
  filterProject.value = ''
  filterStatus.value = ''
  filterDate.value = ''
  ElMessage.success('练习记录已刷新')
}

const getCustomScoreStandard = (event) => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  const storageKey = `smart_pe_score_standards_${schoolId}`
  const savedStandards = localStorage.getItem(storageKey)
  if (!savedStandards) return null
  
  try {
    const standards = JSON.parse(savedStandards)
    const found = standards.find(s => s.name === event)
    if (found) {
      const rules = found.rules || []
      return {
        excellent: rules.find(r => r.level === '优秀')?.minValue || 80,
        good: rules.find(r => r.level === '良好')?.minValue || 60,
        pass: rules.find(r => r.level === '及格')?.minValue || 40,
        isReverse: found.category === '速度类'
      }
    }
  } catch {
    return null
  }
  return null
}

const getScoreLevel = (score, event) => {
  const scoreStr = typeof score === 'string' ? score : String(score)
  const numericScore = parseFloat(scoreStr.replace(/[^0-9.]/g, ''))
  
  const customStandard = getCustomScoreStandard(event)
  const defaultStandards = {
    '立定跳远': { excellent: 2.2, good: 1.9, pass: 1.5, isReverse: false },
    '仰卧起坐': { excellent: 50, good: 40, pass: 30, isReverse: false },
    '坐位体前屈': { excellent: 20, good: 15, pass: 10, isReverse: false },
    '50米跑': { excellent: 8.0, good: 9.0, pass: 10.0, isReverse: true },
    '跳绳': { excellent: 160, good: 130, pass: 100, isReverse: false },
    '引体向上': { excellent: 15, good: 10, pass: 6, isReverse: false }
  }
  
  const standard = customStandard || defaultStandards[event] || { excellent: 80, good: 60, pass: 40, isReverse: false }
  
  if (standard.isReverse) {
    if (numericScore <= standard.excellent) return 'success'
    if (numericScore <= standard.good) return 'primary'
    if (numericScore <= standard.pass) return 'warning'
    return 'danger'
  }
  
  if (numericScore >= standard.excellent) return 'success'
  if (numericScore >= standard.good) return 'primary'
  if (numericScore >= standard.pass) return 'warning'
  return 'danger'
}

// 获取成绩等级文本
const getScoreLevelText = (score, event) => {
  const level = getScoreLevel(score, event)
  const levelMap = {
    success: '优秀',
    primary: '良好',
    warning: '及格',
    danger: '不及格'
  }
  return levelMap[level] || '未知'
}

// 获取成绩样式类
const getScoreClass = (score, event) => {
  const level = getScoreLevel(score, event)
  const classMap = {
    success: 'score-excellent',
    primary: 'score-good',
    warning: 'score-pass',
    danger: 'score-fail'
  }
  return classMap[level] || ''
}

const getBestScore = (studentId, event) => {
  const records = (practiceRecords.value || []).filter(r => r.studentId === studentId && r.event === event && r.status === '已完成')
  if (records.length === 0) return '-'
  const scores = records.map(r => {
    const num = parseFloat(String(r.score).replace(/[^0-9.]/g, ''))
    return isNaN(num) ? 0 : num
  })
  const max = Math.max(...scores)
  return max > 0 ? max : '-'
}

const getRank = (row) => {
  const records = (practiceRecords.value || []).filter(r => r.event === row.event && r.status === '已完成')
  if (records.length === 0) return '-'
  const sorted = [...records].sort((a, b) => {
    const numA = parseFloat(String(a.score).replace(/[^0-9.]/g, ''))
    const numB = parseFloat(String(b.score).replace(/[^0-9.]/g, ''))
    return (isNaN(numB) ? 0 : numB) - (isNaN(numA) ? 0 : numA)
  })
  const rank = sorted.findIndex(r => r.studentId === row.studentId) + 1
  return rank || '-'
}

const refreshData = () => {
  filterProject.value = ''
  filterStatus.value = ''
  filterDate.value = ''
  nextTick(() => {
    initUsageChart()
    initTimeChart()
  })
  ElMessage.success('数据已刷新')
}

const exportRecords = () => {
  addLog('导出记录', '', `导出自由练习记录`)
  const exportData = filteredPracticeRecords.value.length > 0 
    ? filteredPracticeRecords.value 
    : practiceRecords.value || []
  
  if (exportData.length === 0) {
    ElMessage.warning('没有可导出的练习记录')
    return
  }
  
  const headers = ['学号', '姓名', '班级', '练习项目', '成绩', '等级', '状态', '练习日期', '时长(秒)', '消耗卡路里']
  const rows = exportData.map(record => [
    record.studentId || '',
    record.studentName || '',
    record.className || '',
    record.event || '',
    record.score || '',
    getScoreLevelText(record.score, record.event),
    record.status || '',
    record.date || '',
    record.duration || '',
    record.calories || ''
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `练习记录_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success(`成功导出 ${exportData.length} 条练习记录`)
}

const saveDeviceStatusToStorage = () => {
  const sid = schoolId.value
  sessionStorage.setItem(`smart_pe_practice_mode_${sid}`, JSON.stringify({ practiceEnabled: practiceEnabled.value }))
}

// 保存设备状态并通知 TestTerminal 重新检查（storage事件在同标签页不会自动触发，需手动dispatch）
const notifyDeviceStatusChange = () => {
  const sid = schoolId.value
  sessionStorage.setItem(`smart_pe_devices_${sid}`, JSON.stringify(devices.value))
  window.dispatchEvent(new StorageEvent('storage', { key: `smart_pe_devices_${sid}` }))
}

const remoteStart = () => {
  practiceEnabled.value = true
  devices.value.forEach(d => {
    if (d.status !== 'fault') {
      d.status = 'online'
      d.manualOverride = 'on'
    }
  })
  saveDeviceStatusToStorage()
  notifyDeviceStatusChange()
  addLog('远程开启', '', '远程开启所有练习设备')
  ElMessage.success('已远程开启所有练习设备')
}

const closeAll = () => {
  practiceEnabled.value = false
  devices.value.forEach(d => {
    d.status = 'offline'
    d.manualOverride = 'off'
  })
  saveDeviceStatusToStorage()
  notifyDeviceStatusChange()
  addLog('一键关闭', '', '一键关闭所有练习设备')
  ElMessage.warning('已关闭所有练习设备')
}

watch(practiceEnabled, (enabled) => {
  if (!enabled) {
    devices.value.forEach(d => {
      d.status = 'offline'
    })
  }
  saveDeviceStatusToStorage()
})

// 下载图表为图片
const downloadChart = (chartInstance, fileName) => {
  if (!chartInstance) {
    ElMessage.warning('图表尚未渲染，请稍后再试')
    return
  }
  const url = chartInstance.getDataURL({
    type: 'png',
    pixelRatio: 2,
    backgroundColor: '#fff'
  })
  const a = document.createElement('a')
  a.href = url
  a.download = `${fileName}_${new Date().toLocaleDateString()}.png`
  a.click()
  ElMessage.success(`${fileName} 已下载`)
}

const viewDetail = (row) => {
  selectedRecord.value = row
  detailVisible.value = true
}

// 迁移数据存取
const getMigratedRecords = () => {
  try {
    return JSON.parse(sessionStorage.getItem('smart_pe_migrated_records') || '[]')
  } catch { return [] }
}

const saveMigratedRecords = (records) => {
  sessionStorage.setItem('smart_pe_migrated_records', JSON.stringify(records))
}

// 将练习记录字段映射为考试记录格式
const mapToExamRecord = (row) => ({
  id: `migrated-exam-${row.id}`,
  studentId: row.studentId,
  studentName: row.studentName,
  event: row.event,
  score: row.score,
  grade: row.scoreRaw >= 90 ? '优秀' : row.scoreRaw >= 80 ? '良好' : row.scoreRaw >= 60 ? '及格' : '不及格',
  date: row.date,
  source: '自由练习迁移',
  migratedAt: new Date().toLocaleString()
})

// 将练习记录字段映射为体测记录格式
const mapToTestRecord = (row) => {
  const base = {
    id: `migrated-test-${row.id}`,
    studentId: row.studentId,
    studentName: row.studentName,
    grade: row.grade || '',
    class: row.className || '',
    testDate: row.date,
    source: '自由练习迁移',
    migratedAt: new Date().toLocaleString()
  }
  // 按项目映射到对应体测字段
  const scoreVal = parseFloat(String(row.score).replace(/[^0-9.]/g, ''))
  switch (row.event) {
    case '50米跑': base.fiftyMeter = scoreVal; break
    case '立定跳远': base.longJump = scoreVal; break
    case '仰卧起坐': base.sitUps = scoreVal; break
    case '坐位体前屈': base.sitAndReach = scoreVal; break
    case '引体向上': base.pullUp = scoreVal; break
    default: base.extraEvent = row.event; base.extraScore = row.score; break
  }
  return base
}

const migrateToExam = (row) => {
  if (row.migrated && row.migratedTo === 'exam') {
    ElMessage.warning('该记录已迁移至考试系统')
    return
  }
  ElMessageBox.confirm(
    `确定将 ${row.studentName} 的「${row.event}」练习记录迁移至考试系统吗？\n迁移后可在体育考试页面查看。`,
    '迁移至考试',
    { type: 'info', confirmButtonText: '确认迁移', cancelButtonText: '取消' }
  ).then(() => {
    // 标记练习记录为已迁移
    row.migrated = true
    row.migratedTo = 'exam'
    // 写入迁移存储
    const migrated = getMigratedRecords()
    migrated.push({ type: 'exam', record: mapToExamRecord(row), practiceId: row.id })
    saveMigratedRecords(migrated)
    ElMessage.success(`已将 ${row.studentName} 的「${row.event}」迁移至考试系统`)
  }).catch(() => { ElMessage.error('迁移到体测系统失败，请重试') })
}

const migrateToTest = (row) => {
  if (row.migrated && row.migratedTo === 'test') {
    ElMessage.warning('该记录已迁移至体测系统')
    return
  }
  ElMessageBox.confirm(
    `确定将 ${row.studentName} 的「${row.event}」练习记录迁移至体测系统吗？\n迁移后可在国家体测页面查看。`,
    '迁移至体测',
    { type: 'info', confirmButtonText: '确认迁移', cancelButtonText: '取消' }
  ).then(() => {
    row.migrated = true
    row.migratedTo = 'test'
    const migrated = getMigratedRecords()
    migrated.push({ type: 'test', record: mapToTestRecord(row), practiceId: row.id })
    saveMigratedRecords(migrated)
    ElMessage.success(`已将 ${row.studentName} 的「${row.event}」迁移至体测系统`)
  }).catch(() => { ElMessage.error('迁移到考试系统失败，请重试') })
}

const handleDeviceEnabledChange = (device) => {
  if (!device.enabled && device.status === 'online') {
    device.status = 'offline'
    device.manualOverride = 'off'
    notifyDeviceStatusChange()
    ElMessage.warning(`${device.name} 已禁用并停止`)
  }
}

const controlDevice = (deviceId, action) => {
  const device = devices.value.find(d => d.id === deviceId)
  if (!device) return
  if (action === 'start') {
    if (!device.enabled) {
      ElMessage.warning(`${device.name} 已被禁用，请先启用`)
      return
    }
    device.status = 'online'
    device.manualOverride = 'on'
    notifyDeviceStatusChange()
    ElMessage.success(`${device.name} 已启动`)
  } else {
    device.status = 'offline'
    device.manualOverride = 'off'
    notifyDeviceStatusChange()
    ElMessage.warning(`${device.name} 已停止`)
  }
}

const controlAllDevices = (action) => {
  if (action === 'start') {
    let startedCount = 0
    let disabledCount = 0
    devices.value.forEach(d => {
      if (d.status !== 'fault') {
        if (d.enabled) {
          d.status = 'online'
          d.manualOverride = 'on'
          startedCount++
        } else {
          disabledCount++
        }
      }
    })
    notifyDeviceStatusChange()
    if (disabledCount > 0) {
      ElMessage.success(`已启动 ${startedCount} 台设备，${disabledCount} 台设备已被禁用`)
    } else {
      ElMessage.success('所有设备已开启')
    }
  } else {
    devices.value.forEach(d => {
      d.status = 'offline'
      d.manualOverride = 'off'
    })
    notifyDeviceStatusChange()
    ElMessage.warning('所有设备已关闭')
  }
}

const viewDeviceLog = (deviceId) => {
  const device = devices.value.find(d => d.id === deviceId)
  if (!device) return
  logDevice.value = device
  deviceLogs.value = [
    { time: '2026-07-17 14:30:25', action: '远程启动', operator: '管理员', result: '成功' },
    { time: '2026-07-17 12:15:10', action: '定时锁定', operator: '系统', result: '已锁定' },
    { time: '2026-07-17 08:00:00', action: '定时解锁', operator: '系统', result: '已开放' },
    { time: '2026-07-16 18:00:05', action: '远程停止', operator: '管理员', result: '成功' },
  ]
  deviceLogVisible.value = true
}

const getDeviceLockStatus = (device) => {
  if (!scheduleSettings.value.enabled) {
    return { type: 'info', text: '未锁定' }
  }
  const now = new Date()
  const isWeekend = now.getDay() === 0 || now.getDay() === 6
  if (isWeekend && scheduleSettings.value.holidayMode === 'autoClose') {
    return { type: 'danger', text: '节假日锁定' }
  }
  const start = device.openTime || scheduleSettings.value.weekdayRange[0]
  const end = device.closeTime || scheduleSettings.value.weekdayRange[1]
  const current = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
  if (current >= start && current <= end) {
    return { type: 'success', text: '开放中' }
  }
  return { type: 'warning', text: '时段锁定' }
}

const applyGlobalSchedule = () => {
  const [start, end] = scheduleSettings.value.weekdayRange
  devices.value.forEach(device => {
    device.openTime = start
    device.closeTime = end
  })
  ElMessage.success('已将全局时段应用到全部设备')
}

const saveSchedule = () => {
  addLog('保存排程', '', `保存练习排程`)
  const sid = schoolId.value
  localStorage.setItem(`smart_pe_practice_schedule_${sid}`, JSON.stringify({
    settings: scheduleSettings.value,
    devices: devices.value.map(d => ({ id: d.id, openTime: d.openTime, closeTime: d.closeTime }))
  }))
  showScheduleDialog.value = false
  ElMessage.success('设备定时锁定设置已保存')
}

const initUsageChart = () => {
  if (!usageChart.value) return
  if (usageChartInstance) { usageChartInstance.dispose(); usageChartInstance = null }
  usageChartInstance = echarts.init(usageChart.value)

  // 从实际练习记录中统计各项目使用量
  const records = practiceRecords.value || []
  const projectCounts = {}
  const allProjects = ['立定跳远', '跳绳', '50米跑', '仰卧起坐', '坐位体前屈', '引体向上']
  allProjects.forEach(p => { projectCounts[p] = 0 })
  records.forEach(r => {
    if (projectCounts.hasOwnProperty(r.event)) {
      projectCounts[r.event]++
    }
  })

  const categories = Object.keys(projectCounts)
  const counts = categories.map(k => projectCounts[k])

  usageChartInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: categories,
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280', fontSize: 11,rotate: 30, interval: 0}
    },
    yAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F7F8FA' } },
      axisLabel: { color: '#6B7280' }
    },
    series: [{
      type: 'bar',
      barWidth: '45%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#1E5AA8' },
          { offset: 1, color: '#4ADE80' }
        ])
      },
      data: counts
    }]
  })
}

const initTimeChart = () => {
  if (!timeChart.value) return
  if (timeChartInstance) { timeChartInstance.dispose(); timeChartInstance = null }
  timeChartInstance = echarts.init(timeChart.value)

  // 从实际练习记录中按日期统计分布
  const records = practiceRecords.value || []
  const dateCounts = {}
  records.forEach(r => {
    const d = r.date ? r.date.split(' ')[0] : ''
    if (d) {
      dateCounts[d] = (dateCounts[d] || 0) + 1
    }
  })

  // 按日期排序
  const sortedDates = Object.keys(dateCounts).sort()
  const counts = sortedDates.map(d => dateCounts[d])
  // 简化日期标签显示
  const labels = sortedDates.map(d => d.slice(5)) // 显示 MM-DD

  timeChartInstance.setOption({
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
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
      lineStyle: { color: '#3B82F6', width: 2.5 },
      itemStyle: { color: '#3B82F6' },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59, 130, 246, 0.2)' },
          { offset: 1, color: 'rgba(59, 130, 246, 0)' }
        ])
      },
      data: counts
    }]
  })
}

const loadDeviceStatusFromStorage = () => {
  const sid = schoolId.value
  const stored = sessionStorage.getItem(`smart_pe_practice_mode_${sid}`)
  if (stored) {
    try {
      const saved = JSON.parse(stored)
      if (saved.practiceEnabled !== undefined) {
        practiceEnabled.value = saved.practiceEnabled
      }
    } catch (e) {
      console.error('加载练习模式状态失败:', e)
    }
  }
}

onMounted(() => {
  loadDeviceStatusFromStorage()
  nextTick(() => {
    setTimeout(() => { initUsageChart(); initTimeChart() }, 200)
  })
})

// 数据变化时重新渲染图表
watch(practiceRecords, () => {
  nextTick(() => {
    initUsageChart()
    initTimeChart()
  })
}, { deep: true })

onBeforeUnmount(() => {
  if (usageChartInstance) usageChartInstance.dispose()
  if (timeChartInstance) timeChartInstance.dispose()
})
</script>

<style scoped>
.free-practice {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
  padding: 16px 20px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
}

@media (min-width: 1200px) {
  .page-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-text {
  font-size: 14px;
  font-weight: 500;
}

.status-on { color: #1E5AA8; }
.status-off { color: #E85D4E; }

/* 手势状态 */
.gesture-status {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: #F7F8FA;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
}

.gesture-status:hover {
  background: #E8EAED;
}

.gesture-status.active {
  background: #DCFCE7;
}

.gesture-status.active .gesture-text {
  color: #166534;
}

.gesture-icon {
  font-size: 16px;
}

.gesture-text {
  font-size: 13px;
  color: #6B7280;
  font-weight: 500;
}

.gesture-toggle {
  font-size: 11px;
  color: #9CA3AF;
  margin-left: 4px;
}

/* 手势面板 */
.gesture-panel {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  padding: 20px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EAED;
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0;
}

.gesture-title-icon {
  font-size: 20px;
}

.gesture-guide {
  margin-bottom: 16px;
}

.guide-title {
  font-size: 13px;
  font-weight: 600;
  color: #6B7280;
  margin-bottom: 12px;
}

.gesture-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.gesture-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
  gap: 6px;
}

.gesture-emoji {
  font-size: 28px;
}

.gesture-name {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
}

.gesture-desc {
  font-size: 11px;
  color: #9CA3AF;
  text-align: center;
}

.gesture-history {
  padding-top: 12px;
  border-top: 1px solid #E8EAED;
}

.history-title {
  font-size: 13px;
  font-weight: 600;
  color: #6B7280;
  margin-bottom: 12px;
}

.history-empty {
  text-align: center;
  padding: 16px;
  color: #9CA3AF;
  font-size: 13px;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.history-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #F7F8FA;
  border-radius: 6px;
}

.history-time {
  font-size: 12px;
  color: #9CA3AF;
}

.history-gesture {
  font-size: 13px;
  color: #1A1A2E;
}

.history-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.history-status.success {
  background: #DCFCE7;
  color: #166534;
}

.history-status.failed {
  background: #FEE2E2;
  color: #991B1B;
}

.header-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.mode-switch-container {
  display: flex;
  align-items: center;
  margin-bottom: 1px;
}

.mode-switch-wrapper {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mode-switch-wrapper .mode-label {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

/* 图表区 */
.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.chart {
  height: 260px;
  width: 100%;
}

/* 成绩值 */
.score-value {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

/* 状态标签 */
.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-completed { background: #DCFCE7; color: #166534; }
.status-pending { background: #F3F4F6; color: #6B7280; }

/* 分页 */
.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #E8EAED;
}

.schedule-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.schedule-global h4,
.schedule-header h4 {
  margin: 0 0 12px;
  font-size: 15px;
  color: #1A1A2E;
}

.schedule-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.schedule-header h4 {
  margin: 0;
}

.detail-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #F9FAFB;
  border-radius: 8px;
  font-size: 14px;
}

.detail-row .label {
  color: #6B7280;
}

/* 远程控制面板样式 */
.control-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 8px;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #F7F8FA;
  border-radius: 10px;
}

.panel-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.panel-stats {
  display: flex;
  gap: 12px;
}

.stat-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.stat-badge.online {
  background: #DCFCE7;
  color: #166534;
}

.stat-badge.offline {
  background: #FEE2E2;
  color: #991B1B;
}

.stat-badge.fault {
  background: #FEF3C7;
  color: #92400E;
}

.device-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.device-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #FFFFFF;
  border-radius: 10px;
  border: 1px solid #E8EAED;
  transition: all 0.2s ease;
}

.device-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #1E5AA8;
}

.device-card.online {
  border-left: 3px solid #1E5AA8;
}

.device-card.offline {
  border-left: 3px solid #9CA3AF;
  opacity: 0.7;
}

.device-card.fault {
  border-left: 3px solid #E85D4E;
  opacity: 0.8;
}

.device-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.device-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.device-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.status-dot.online {
  background: #1E5AA8;
  box-shadow: 0 0 8px rgba(30, 90, 168, 0.4);
}

.status-dot.offline {
  background: #9CA3AF;
}

.status-dot.fault {
  background: #E85D4E;
  box-shadow: 0 0 8px rgba(232, 93, 78, 0.4);
}

.device-location {
  font-size: 12px;
  color: #6B7280;
}

.device-active {
  font-size: 11px;
  color: #9CA3AF;
}

.device-actions {
  display: flex;
  gap: 8px;
}

.panel-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding-top: 12px;
  border-top: 1px solid #E8EAED;
}

/* 弹窗样式覆盖 */
:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  background: #FFFFFF;
  border-bottom: 1px solid #E8EAED;
  padding: 16px 20px;
}

:deep(.el-dialog__title) {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

:deep(.el-dialog__body) {
  padding: 0;
  background: #F7F8FA;
}

:deep(.el-dialog__footer) {
  background: #FFFFFF;
  border-top: 1px solid #E8EAED;
  padding: 12px 20px;
}

/* 个人最佳成绩 */
.personal-best-section {
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
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title :deep(.el-icon) {
  font-size: 18px;
  color: #1E5AA8;
}

.best-records {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 16px;
}

.best-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  position: relative;
  transition: all 0.2s ease;
}

.best-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.best-card.excellent {
  /* 优秀 - 使用阴影替代边框 */
  box-shadow: 0 1px 3px rgba(30, 90, 168, 0.15);
}

.best-card.good {
  /* 良好 */
}

.best-card.pass {
  /* 及格 */
}

.best-card.fail {
  /* 不及格 */
}

.card-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  font-size: 20px;
}

.card-content {
  padding-right: 36px;
}

.student-info {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.student-info :deep(.el-avatar) {
  background: #F3F4F6;
}

.student-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.student-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.student-class {
  font-size: 12px;
  color: #6B7280;
}

.record-info {
  margin-bottom: 8px;
}

.record-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 6px;
}

.record-label {
  font-size: 12px;
  color: #6B7280;
}

.record-value {
  font-size: 24px;
  font-weight: 700;
  color: #1E5AA8;
}

.record-compare {
  display: flex;
  align-items: center;
  gap: 4px;
}

.improve-icon {
  font-size: 12px;
}

.improve-icon.up {
  color: #1E5AA8;
}

.improve-icon.down {
  color: #E85D4E;
}

.improve-positive {
  font-size: 12px;
  font-weight: 600;
  color: #1E5AA8;
}

.improve-negative {
  font-size: 12px;
  font-weight: 600;
  color: #E85D4E;
}

.improve-label {
  font-size: 11px;
  color: #9CA3AF;
}

.record-time {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #9CA3AF;
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #F3F4F6;
}

.record-time :deep(.el-icon) {
  font-size: 14px;
}

.card-actions {
  margin-top: 10px;
  display: flex;
  gap: 6px;
}

.card-actions :deep(.el-button) {
  font-size: 11px;
  padding: 4px 8px;
}

/* 练习记录列表卡片 */
.practice-records-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.practice-records-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8EAED;
  margin-bottom: 16px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-group {
  display: flex;
  gap: 8px;
}

/* 学生信息迷你样式 */
.student-mini-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.mini-detail {
  display: flex;
  flex-direction: column;
}

.mini-name {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
}

.mini-class {
  font-size: 11px;
  color: #6B7280;
}

/* 练习成绩样式 */
.practice-score {
  font-size: 14px;
  font-weight: 600;
}

.score-excellent { color: #1E5AA8; }
.score-good { color: #3B82F6; }
.score-pass { color: #F5A623; }
.score-fail { color: #E85D4E; }

/* 状态标签 */
.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 500;
}

.status-completed {
  background: #DCFCE7;
  color: #166534;
}

.status-pending {
  background: #FEF3C7;
  color: #92400E;
}

.status-migrated {
  background: #DBEAFE;
  color: #1E5AA8;
}

/* 记录统计 */
.records-summary {
  display: flex;
  justify-content: flex-end;
  gap: 32px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E8EAED;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: #6B7280;
}

.summary-value {
  font-size: 20px;
  font-weight: 600;
  color: #1A1A2E;
}

.summary-value.completed {
  color: #1E5AA8;
}

.summary-value.pending {
  color: #F5A623;
}

/* 表格样式覆盖 */
.practice-records-card :deep(.el-table) {
  --el-table-header-text-color: #6B7280;
  --el-table-row-hover-bg-color: #F0FDF4;
}

.practice-records-card :deep(.el-table__header) {
  background: #F7F8FA;
}

.practice-records-card :deep(.el-table__header th) {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
}

.practice-records-card :deep(.el-table__body tr) {
  height: 52px;
}

.practice-records-card :deep(.el-table__body td) {
  font-size: 13px;
  color: #1A1A2E;
}

.practice-records-card :deep(.el-pagination) {
  margin-top: 16px;
  text-align: right;
}
</style>