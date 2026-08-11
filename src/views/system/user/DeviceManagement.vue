<template>
  <div class="device-management">
    <el-tabs v-model="activeTab" class="tab-container" @tab-change="handleTabChange">
      <!-- ==================== 设备列表 Tab ==================== -->
      <el-tab-pane label="设备列表" name="devices">
        <div class="page-header">
          <div class="header-filters">
            <el-input v-model="searchQuery" placeholder="搜索设备名称/位置" clearable style="width: 240px" :prefix-icon="Search" />
            <el-select v-model="filterProject" placeholder="所属项目" clearable style="width: 160px">
              <el-option label="短跑(50米/100米)" value="fiftyMeter" />
              <el-option label="50米*8往返跑" value="fiftyMeter8" />
              <el-option label="长跑" value="running" />
              <el-option label="立定跳远" value="longJump" />
              <el-option label="坐位体前屈" value="sitAndReach" />
              <el-option label="引体向上" value="pullUp" />
              <el-option label="仰卧起坐" value="sitUps" />
              <el-option label="跳绳" value="ropeSkipping" />
              <el-option label="肺活量" value="vitalCapacity" />
              <el-option label="BMI测试" value="bmi" />
            </el-select>
            <el-select v-model="filterStatus" placeholder="设备状态" clearable style="width: 120px">
              <el-option label="在线" value="online" />
              <el-option label="离线" value="offline" />
              <el-option label="故障" value="fault" />
            </el-select>
          </div>
          <div class="header-actions">
            <el-button :icon="Refresh" @click="refreshData">刷新</el-button>
            <el-button type="primary" :icon="Plus" @click="openAddDevice">新增设备</el-button>
          </div>
        </div>

        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-num text-primary">{{ stats.total }}</span>
            <span class="stat-label">设备总数</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num text-primary">{{ stats.online }}</span>
            <span class="stat-label">在线</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num" style="color: #F5A623">{{ stats.offline }}</span>
            <span class="stat-label">离线</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num stat-danger">{{ stats.fault }}</span>
            <span class="stat-label">故障</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num" style="color: #E8A045">{{ stats.manualOverride }}</span>
            <span class="stat-label">手动覆盖中</span>
          </div>
        </div>

        <div class="list-card">
          <el-table :data="filteredDevices" stripe class="w-full" :height="500">
            <el-table-column prop="id" label="设备编号" width="120" />
            <el-table-column prop="name" label="设备名称" min-width="160" />
            <el-table-column prop="project" label="所属项目" width="140">
              <template #default="{ row }"><el-tag size="small">{{ getProjectText(row.project) }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="location" label="位置" width="150" />
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)" size="small">
                  {{ getStatusText(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="openTime" label="开启时间" width="100" />
            <el-table-column prop="closeTime" label="关闭时间" width="100" />
            <el-table-column label="自动启停" width="100">
              <template #default="{ row }">
                <el-switch :model-value="row.enabled" @change="toggleDevice(row)" />
              </template>
            </el-table-column>
            <el-table-column label="手动覆盖" width="120">
              <template #default="{ row }">
                <el-tag v-if="row.manualOverride" type="warning" size="small" effect="dark" class="override-tag">
                  {{ row.manualOverride === 'on' ? '手动开启' : '手动关闭' }}
                </el-tag>
                <span v-else class="text-muted">自动</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="260" fixed="right">
              <template #default="{ row }">
                <el-button link type="success" size="small" @click="manualOverride(row, 'on')">手动开启</el-button>
                <el-button link type="warning" size="small" @click="manualOverride(row, 'off')">手动关闭</el-button>
                <el-button v-if="row.manualOverride" link type="info" size="small" @click="manualOverrideReset(row)">恢复自动</el-button>
                <el-button link type="primary" size="small" @click="editDevice(row)">编辑</el-button>
                <el-button link type="primary" size="small" @click="setSchedule(row)">定时设置</el-button>
                <el-button link type="danger" size="small" @click="deleteDevice(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
          <div class="pagination-wrapper">
            <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="filteredDevices.length" :page-sizes="[10, 20, 50]" layout="total, sizes, prev, pager, next" small />
          </div>
        </div>
      </el-tab-pane>

      <!-- ==================== 定时任务 Tab ==================== -->
      <el-tab-pane label="定时任务" name="schedule">
        <div class="page-header">
          <div class="header-filters">
            <el-input v-model="scheduleSearch" placeholder="搜索设备名称" clearable style="width: 240px" :prefix-icon="Search" />
            <el-select v-model="scheduleFilterStatus" placeholder="任务状态" clearable style="width: 120px">
              <el-option label="启用" value="enabled" />
              <el-option label="禁用" value="disabled" />
            </el-select>
          </div>
          <div class="header-actions">
            <el-button :icon="Refresh" @click="refreshSchedule">刷新</el-button>
            <el-button type="primary" :icon="Plus" @click="openAddSchedule">新增定时任务</el-button>
          </div>
        </div>

        <div class="list-card">
          <div class="card-header">
            <span class="card-title">定时任务列表</span>
            <el-tag size="small" type="info">节假日设备自动关闭</el-tag>
          </div>
          <el-table :data="filteredSchedule" stripe class="w-full" :height="500">
            <el-table-column prop="id" label="任务编号" width="120" />
            <el-table-column prop="deviceName" label="关联设备" min-width="160" />
            <el-table-column prop="executeTime" label="执行时间" width="140" />
            <el-table-column prop="repeatCycle" label="重复周期" width="140">
              <template #default="{ row }"><el-tag size="small">{{ getCycleText(row.repeatCycle) }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="action" label="操作" width="100">
              <template #default="{ row }"><el-tag :type="row.action === 'open' ? 'success' : 'danger'" size="small">{{ row.action === 'open' ? '开启' : '关闭' }}</el-tag></template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-switch :model-value="row.status === 'enabled'" @change="toggleSchedule(row)" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160">
              <template #default="{ row }">
                <el-button link type="primary" size="small" @click="editSchedule(row)">编辑</el-button>
                <el-button link type="danger" size="small" @click="deleteSchedule(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- ==================== 节假日管理 Tab ==================== -->
      <el-tab-pane label="节假日管理" name="holidays">
        <div class="page-header">
          <div class="header-filters">
            <el-tag type="info" effect="plain">节假日期间所有设备将自动关闭</el-tag>
          </div>
          <div class="header-actions">
            <el-button type="primary" :icon="Plus" @click="openAddHoliday">新增节假日</el-button>
          </div>
        </div>

        <div class="list-card">
          <div class="card-header">
            <span class="card-title">2026 年节假日列表</span>
            <el-tag size="small" type="warning">共 {{ holidays.length }} 个节假日</el-tag>
          </div>
          <el-table :data="holidays" stripe class="w-full">
            <el-table-column prop="name" label="节假日名称" min-width="160" />
            <el-table-column prop="startDate" label="开始日期" width="150" />
            <el-table-column prop="endDate" label="结束日期" width="150" />
            <el-table-column label="天数" width="100">
              <template #default="{ row }">
                {{ computeDays(row.startDate, row.endDate) }} 天
              </template>
            </el-table-column>
            <el-table-column label="状态" width="120">
              <template #default="{ row }">
                <el-tag :type="isHolidayActive(row) ? 'success' : 'info'" size="small">
                  {{ isHolidayActive(row) ? '当前假期中' : '未到' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120">
              <template #default="{ row }">
                <el-button link type="danger" size="small" @click="deleteHoliday(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- ==================== 新增/编辑设备 Dialog ==================== -->
    <el-dialog v-model="showAddDialog" :title="isEditingDevice ? '编辑设备' : '新增设备'" width="500px">
      <el-form :model="deviceForm" label-width="100px">
        <el-form-item label="设备名称" required>
          <el-input v-model="deviceForm.name" placeholder="请输入设备名称" />
        </el-form-item>
        <el-form-item label="所属项目" required>
          <el-select v-model="deviceForm.project" placeholder="请选择项目">
            <el-option label="短跑(50米/100米)" value="fiftyMeter" />
            <el-option label="50米*8往返跑" value="fiftyMeter8" />
            <el-option label="长跑" value="running" />
            <el-option label="立定跳远" value="longJump" />
            <el-option label="坐位体前屈" value="sitAndReach" />
            <el-option label="引体向上" value="pullUp" />
            <el-option label="仰卧起坐" value="sitUps" />
            <el-option label="跳绳" value="ropeSkipping" />
            <el-option label="肺活量" value="vitalCapacity" />
            <el-option label="BMI测试" value="bmi" />
          </el-select>
        </el-form-item>
        <el-form-item label="位置" required>
          <el-input v-model="deviceForm.location" placeholder="请输入位置" />
        </el-form-item>
        <el-form-item label="开启时间">
          <el-time-select v-model="deviceForm.openTime" start="06:00" end="22:00" step="00:30" />
        </el-form-item>
        <el-form-item label="关闭时间">
          <el-time-select v-model="deviceForm.closeTime" start="06:00" end="22:00" step="00:30" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" @click="saveDevice">保存</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 定时任务 Dialog ==================== -->
    <el-dialog v-model="showScheduleDialog" :title="isEditingSchedule ? '编辑定时任务' : '新增定时任务'" width="500px">
      <el-form :model="scheduleForm" label-width="100px">
        <el-form-item label="关联设备">
          <el-select v-model="scheduleForm.deviceId" placeholder="请选择设备（留空为所有设备）" clearable>
            <el-option v-for="d in devices" :key="d.id" :label="d.name" :value="d.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="执行时间" required>
          <el-time-select v-model="scheduleForm.executeTime" start="06:00" end="22:00" step="00:30" />
        </el-form-item>
        <el-form-item label="重复周期" required>
          <el-select v-model="scheduleForm.repeatCycle">
            <el-option label="每天" value="daily" />
            <el-option label="工作日" value="workday" />
            <el-option label="周末" value="weekend" />
            <el-option label="周一至周五" value="mon-fri" />
          </el-select>
        </el-form-item>
        <el-form-item label="操作" required>
          <el-select v-model="scheduleForm.action">
            <el-option label="开启设备" value="open" />
            <el-option label="关闭设备" value="close" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showScheduleDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSchedule">保存</el-button>
      </template>
    </el-dialog>

    <!-- ==================== 节假日 Dialog ==================== -->
    <el-dialog v-model="showHolidayDialog" title="新增节假日" width="500px">
      <el-form :model="holidayForm" label-width="100px">
        <el-form-item label="节假日名称" required>
          <el-input v-model="holidayForm.name" placeholder="如：国庆节" />
        </el-form-item>
        <el-form-item label="开始日期" required>
          <el-date-picker
            v-model="holidayForm.startDate"
            type="date"
            placeholder="选择开始日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="结束日期" required>
          <el-date-picker
            v-model="holidayForm.endDate"
            type="date"
            placeholder="选择结束日期"
            value-format="YYYY-MM-DD"
            style="width: 100%"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showHolidayDialog = false">取消</el-button>
        <el-button type="primary" @click="saveHoliday">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Refresh, Plus } from '@element-plus/icons-vue'
import store from '@/store/global'
import { usePersistedRef } from '@/composables/usePersistedRef'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

// ======================== Tab & Filter State ========================
const activeTab = ref('devices')
const searchQuery = ref('')
const filterProject = ref('')
const filterStatus = ref('')
const currentPage = ref(1)
const pageSize = ref(10)

const scheduleSearch = ref('')
const scheduleFilterStatus = ref('')

// ======================== Dialog Visibility ========================
const showAddDialog = ref(false)
const showScheduleDialog = ref(false)
const showHolidayDialog = ref(false)
const isEditingDevice = ref(false)
const isEditingSchedule = ref(false)

// ======================== Forms ========================
const deviceForm = ref({
  name: '',
  project: '',
  location: '',
  openTime: '08:00',
  closeTime: '18:00'
})

const scheduleForm = ref({
  deviceId: '',
  executeTime: '',
  repeatCycle: 'workday',
  action: 'open'
})

const holidayForm = ref({
  name: '',
  startDate: '',
  endDate: ''
})

// ======================== Helpers ========================
const projectMap = {
  'fiftyMeter': '短跑',
  'fiftyMeter8': '50米*8往返跑',
  'running': '长跑',
  'longJump': '立定跳远',
  'sitAndReach': '坐位体前屈',
  'pullUp': '引体向上',
  'sitUps': '仰卧起坐',
  'ropeSkipping': '跳绳',
  'vitalCapacity': '肺活量',
  'bmi': 'BMI测试'
}

const getProjectText = (key) => projectMap[key] || key
const getStatusText = (status) => ({ online: '在线', offline: '离线', fault: '故障' }[status] || status)
const getStatusType = (status) => ({ online: 'success', offline: 'info', fault: 'danger' }[status] || 'info')
const getCycleText = (cycle) => ({ daily: '每天', workday: '工作日', weekend: '周末', 'mon-fri': '周一至周五' }[cycle] || cycle)

const computeDays = (start, end) => {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  return Math.max(1, Math.round((e - s) / 86400000) + 1)
}

const isHolidayActive = (row) => {
  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  return today >= row.startDate && today <= row.endDate
}

// ======================== Default Data — Devices (per school) ========================
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

// ======================== Default Data — Schedules (per school) ========================
const getDefaultSchedule = () => {
  const schoolSchedule = {
    'hailin-second-primary': [
      { id: 'SCH001', deviceName: '短跑计时器1号(50米)', deviceId: 'DEV001', executeTime: '08:00', repeatCycle: 'workday', action: 'open', status: 'enabled' },
      { id: 'SCH002', deviceName: '短跑计时器1号(50米)', deviceId: 'DEV001', executeTime: '18:00', repeatCycle: 'workday', action: 'close', status: 'enabled' },
      { id: 'SCH003', deviceName: '立定跳远测试仪1号', deviceId: 'DEV005', executeTime: '08:00', repeatCycle: 'workday', action: 'open', status: 'enabled' },
      { id: 'SCH004', deviceName: '立定跳远测试仪1号', deviceId: 'DEV005', executeTime: '18:00', repeatCycle: 'workday', action: 'close', status: 'enabled' },
      { id: 'SCH005', deviceName: '坐位体前屈测试仪1号', deviceId: 'DEV007', executeTime: '08:00', repeatCycle: 'workday', action: 'open', status: 'enabled' },
      { id: 'SCH006', deviceName: '坐位体前屈测试仪1号', deviceId: 'DEV007', executeTime: '18:00', repeatCycle: 'workday', action: 'close', status: 'enabled' },
      { id: 'SCH007', deviceName: '所有设备', deviceId: '', executeTime: '00:00', repeatCycle: 'weekend', action: 'close', status: 'enabled' },
      { id: 'SCH008', deviceName: '长跑计时器', deviceId: 'DEV012', executeTime: '08:00', repeatCycle: 'workday', action: 'open', status: 'enabled' },
      { id: 'SCH009', deviceName: '长跑计时器', deviceId: 'DEV012', executeTime: '18:00', repeatCycle: 'workday', action: 'close', status: 'enabled' }
    ],
    'hailin-zirong-primary': [
      { id: 'ZR-SCH001', deviceName: '短跑计时器1号(50米)', deviceId: 'ZR-DEV001', executeTime: '07:30', repeatCycle: 'workday', action: 'open', status: 'enabled' },
      { id: 'ZR-SCH002', deviceName: '短跑计时器1号(50米)', deviceId: 'ZR-DEV001', executeTime: '17:30', repeatCycle: 'workday', action: 'close', status: 'enabled' },
      { id: 'ZR-SCH003', deviceName: '立定跳远测试仪', deviceId: 'ZR-DEV004', executeTime: '07:30', repeatCycle: 'workday', action: 'open', status: 'enabled' },
      { id: 'ZR-SCH004', deviceName: '立定跳远测试仪', deviceId: 'ZR-DEV004', executeTime: '17:30', repeatCycle: 'workday', action: 'close', status: 'enabled' },
      { id: 'ZR-SCH005', deviceName: '所有设备', deviceId: '', executeTime: '00:00', repeatCycle: 'weekend', action: 'close', status: 'enabled' },
      { id: 'ZR-SCH006', deviceName: '长跑计时器', deviceId: 'ZR-DEV008', executeTime: '07:30', repeatCycle: 'workday', action: 'open', status: 'enabled' },
      { id: 'ZR-SCH007', deviceName: '长跑计时器', deviceId: 'ZR-DEV008', executeTime: '17:30', repeatCycle: 'workday', action: 'close', status: 'enabled' }
    ],
    'linhai-experimental-primary': [
      { id: 'LH-SCH001', deviceName: '所有设备', deviceId: '', executeTime: '08:30', repeatCycle: 'workday', action: 'open', status: 'enabled' },
      { id: 'LH-SCH002', deviceName: '所有设备', deviceId: '', executeTime: '16:30', repeatCycle: 'workday', action: 'close', status: 'enabled' },
      { id: 'LH-SCH003', deviceName: '所有设备', deviceId: '', executeTime: '00:00', repeatCycle: 'weekend', action: 'close', status: 'enabled' },
      { id: 'LH-SCH004', deviceName: '短跑计时器1号(50米)', deviceId: 'LH-DEV001', executeTime: '08:30', repeatCycle: 'workday', action: 'open', status: 'enabled' },
      { id: 'LH-SCH005', deviceName: '短跑计时器1号(50米)', deviceId: 'LH-DEV001', executeTime: '16:30', repeatCycle: 'workday', action: 'close', status: 'enabled' },
      { id: 'LH-SCH006', deviceName: '立定跳远测试仪1号', deviceId: 'LH-DEV006', executeTime: '08:30', repeatCycle: 'workday', action: 'open', status: 'enabled' },
      { id: 'LH-SCH007', deviceName: '立定跳远测试仪1号', deviceId: 'LH-DEV006', executeTime: '16:30', repeatCycle: 'workday', action: 'close', status: 'enabled' },
      { id: 'LH-SCH008', deviceName: '引体向上测试仪1号', deviceId: 'LH-DEV012', executeTime: '08:30', repeatCycle: 'workday', action: 'open', status: 'enabled' },
      { id: 'LH-SCH009', deviceName: '引体向上测试仪1号', deviceId: 'LH-DEV012', executeTime: '16:00', repeatCycle: 'workday', action: 'close', status: 'enabled' }
    ]
  }
  return schoolSchedule[schoolId.value] || schoolSchedule['hailin-second-primary']
}

// ======================== Default Data — Holidays (2026 Chinese holidays) ========================
const getDefaultHolidays = () => {
  return [
    { name: '元旦', startDate: '2026-01-01', endDate: '2026-01-03' },
    { name: '春节', startDate: '2026-02-15', endDate: '2026-02-21' },
    { name: '清明节', startDate: '2026-04-04', endDate: '2026-04-06' },
    { name: '劳动节', startDate: '2026-05-01', endDate: '2026-05-05' },
    { name: '端午节', startDate: '2026-06-19', endDate: '2026-06-21' },
    { name: '中秋节', startDate: '2026-09-25', endDate: '2026-09-27' },
    { name: '国庆节', startDate: '2026-10-01', endDate: '2026-10-07' }
  ]
}

// ======================== Persisted Data ========================
const devices = usePersistedRef(computed(() => `smart_pe_devices_${schoolId.value}`), getDefaultDevices())
const schedules = usePersistedRef(computed(() => `smart_pe_device_schedule_${schoolId.value}`), getDefaultSchedule())
const holidays = usePersistedRef(computed(() => `smart_pe_holidays_${schoolId.value}`), getDefaultHolidays())

// ======================== Computed ========================
const filteredDevices = computed(() => {
  let result = devices.value
  if (searchQuery.value) {
    result = result.filter(d => d.name.includes(searchQuery.value) || d.location.includes(searchQuery.value))
  }
  if (filterProject.value) {
    result = result.filter(d => d.project === filterProject.value)
  }
  if (filterStatus.value) {
    result = result.filter(d => d.status === filterStatus.value)
  }
  return result
})

const filteredSchedule = computed(() => {
  let result = schedules.value
  if (scheduleSearch.value) {
    result = result.filter(s => s.deviceName.includes(scheduleSearch.value))
  }
  if (scheduleFilterStatus.value) {
    result = result.filter(s => s.status === scheduleFilterStatus.value)
  }
  return result
})

const stats = computed(() => ({
  total: devices.value.length,
  online: devices.value.filter(d => d.status === 'online').length,
  offline: devices.value.filter(d => d.status === 'offline').length,
  fault: devices.value.filter(d => d.status === 'fault').length,
  manualOverride: devices.value.filter(d => d.manualOverride != null).length
}))

// ======================== Device Actions ========================
const refreshData = () => {
  searchQuery.value = ''
  filterProject.value = ''
  filterStatus.value = ''
}

const openAddDevice = () => {
  isEditingDevice.value = false
  deviceForm.value = { name: '', project: '', location: '', openTime: '08:00', closeTime: '18:00' }
  showAddDialog.value = true
}

const toggleDevice = (row) => {
  row.enabled = !row.enabled
  ElMessage.success(row.enabled ? '设备已启用' : '设备已禁用')
}

const editDevice = (row) => {
  isEditingDevice.value = true
  deviceForm.value = { ...row }
  showAddDialog.value = true
}

const setSchedule = (row) => {
  isEditingSchedule.value = false
  scheduleForm.value = { deviceId: row.id, executeTime: row.openTime, repeatCycle: 'workday', action: 'open' }
  showScheduleDialog.value = true
}

const deleteDevice = (row) => {
  devices.value = devices.value.filter(d => d.id !== row.id)
  ElMessage.success('设备已删除')
}

const saveDevice = () => {
  if (!deviceForm.value.name || !deviceForm.value.project || !deviceForm.value.location) {
    ElMessage.warning('请填写完整信息')
    return
  }
  if (isEditingDevice.value) {
    // Update existing device in-place
    const idx = devices.value.findIndex(d => d.id === deviceForm.value.id)
    if (idx !== -1) {
      devices.value[idx] = { ...devices.value[idx], ...deviceForm.value }
    }
    ElMessage.success('设备已更新')
  } else {
    const newDevice = {
      ...deviceForm.value,
      id: `DEV${String(Date.now()).slice(-3)}`,
      status: 'online',
      enabled: true,
      manualOverride: null
    }
    devices.value.unshift(newDevice)
    ElMessage.success('设备已添加')
  }
  showAddDialog.value = false
  deviceForm.value = { name: '', project: '', location: '', openTime: '08:00', closeTime: '18:00' }
}

// ======================== Manual Override Actions ========================
const manualOverride = (row, mode) => {
  row.manualOverride = mode
  ElMessage.success(mode === 'on' ? `${row.name} 已手动开启` : `${row.name} 已手动关闭`)
}

const manualOverrideReset = (row) => {
  row.manualOverride = null
  ElMessage.success(`${row.name} 已恢复自动调度`)
}

// ======================== Schedule Actions ========================
const refreshSchedule = () => {
  scheduleSearch.value = ''
  scheduleFilterStatus.value = ''
}

const openAddSchedule = () => {
  isEditingSchedule.value = false
  scheduleForm.value = { deviceId: '', executeTime: '', repeatCycle: 'workday', action: 'open' }
  showScheduleDialog.value = true
}

const toggleSchedule = (row) => {
  row.status = row.status === 'enabled' ? 'disabled' : 'enabled'
  ElMessage.success(row.status === 'enabled' ? '任务已启用' : '任务已禁用')
}

const editSchedule = (row) => {
  isEditingSchedule.value = true
  scheduleForm.value = { ...row }
  showScheduleDialog.value = true
}

const deleteSchedule = (row) => {
  schedules.value = schedules.value.filter(s => s.id !== row.id)
  ElMessage.success('任务已删除')
}

const saveSchedule = () => {
  if (!scheduleForm.value.executeTime) {
    ElMessage.warning('请填写执行时间')
    return
  }
  const device = devices.value.find(d => d.id === scheduleForm.value.deviceId)
  if (isEditingSchedule.value) {
    const idx = schedules.value.findIndex(s => s.id === scheduleForm.value.id)
    if (idx !== -1) {
      schedules.value[idx] = {
        ...schedules.value[idx],
        ...scheduleForm.value,
        deviceName: device ? device.name : '所有设备'
      }
    }
    ElMessage.success('任务已更新')
  } else {
    const newSchedule = {
      ...scheduleForm.value,
      id: `SCH${String(Date.now()).slice(-3)}`,
      deviceName: device ? device.name : '所有设备',
      status: 'enabled'
    }
    schedules.value.unshift(newSchedule)
    ElMessage.success('任务已添加')
  }
  showScheduleDialog.value = false
  scheduleForm.value = { deviceId: '', executeTime: '', repeatCycle: 'workday', action: 'open' }
}

// ======================== Holiday Actions ========================
const openAddHoliday = () => {
  holidayForm.value = { name: '', startDate: '', endDate: '' }
  showHolidayDialog.value = true
}

const deleteHoliday = (row) => {
  holidays.value = holidays.value.filter(h => h.name !== row.name || h.startDate !== row.startDate)
  ElMessage.success('节假日已删除')
}

const saveHoliday = () => {
  if (!holidayForm.value.name || !holidayForm.value.startDate || !holidayForm.value.endDate) {
    ElMessage.warning('请填写完整的节假日信息')
    return
  }
  if (holidayForm.value.startDate > holidayForm.value.endDate) {
    ElMessage.warning('结束日期不能早于开始日期')
    return
  }
  holidays.value.unshift({ ...holidayForm.value })
  showHolidayDialog.value = false
  holidayForm.value = { name: '', startDate: '', endDate: '' }
  ElMessage.success('节假日已添加')
}

// ======================== Tab Change ========================
const handleTabChange = () => {
  setTimeout(() => {
    window.dispatchEvent(new Event('resize'))
  }, 100)
}

onMounted(() => {})
</script>

<style scoped>
.device-management {
  min-height: calc(100vh - 140px);
}

.tab-container {
  min-height: calc(100vh - 140px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 0 20px;
}

.header-filters {
  display: flex;
  gap: 12px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.stats-row {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.stat-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: none;  /* 取消等分 */
}

.stat-num {
  font-size: 24px;
  font-weight: 600;
  color: #1A1A2E;
}

.stat-num.text-primary {
  color: #1E5AA8;
}

.stat-num.stat-danger {
  color: #E85D4E;
}

.stat-label {
  font-size: 12px;
  color: #6B7280;
  margin-top: 4px;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #E8EAED;
  margin: 0 20px;
}

.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EAED;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.override-tag {
  font-weight: 600;
}

.text-muted {
  color: #9CA3AF;
  font-size: 13px;
}
</style>
