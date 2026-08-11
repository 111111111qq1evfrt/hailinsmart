<template>
  <div class="operation-log-page">
    <div class="page-header">
      <div class="header-filters">
        <el-select v-model="filterType" placeholder="操作类型" clearable style="width: 140px">
          <el-option label="全部" value="all"></el-option>
          <el-option label="登录" value="login"></el-option>
          <el-option label="退出" value="logout"></el-option>
          <el-option label="导出" value="export"></el-option>
          <el-option label="修改" value="update"></el-option>
          <el-option label="删除" value="delete"></el-option>
          <el-option label="新增" value="create"></el-option>
        </el-select>
        <el-select v-model="filterModule" placeholder="操作模块" clearable style="width: 140px">
          <el-option label="全部" value="all"></el-option>
          <el-option label="用户管理" value="user"></el-option>
          <el-option label="学生管理" value="student"></el-option>
          <el-option label="考试管理" value="exam"></el-option>
          <el-option label="体测管理" value="test"></el-option>
          <el-option label="数据平台" value="data"></el-option>
          <el-option label="系统设置" value="system"></el-option>
        </el-select>
        <el-select v-model="filterStatus" placeholder="操作状态" clearable style="width: 120px">
          <el-option label="全部" value="all"></el-option>
          <el-option label="成功" value="success"></el-option>
          <el-option label="失败" value="fail"></el-option>
        </el-select>
        <el-input v-model="filterKeyword" placeholder="搜索用户名/IP" clearable style="width: 180px">
          <template #append>
            <Search />
          </template>
        </el-input>
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          style="width: 240px"
        />
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="exportLogs">导出日志</el-button>
        <el-button :icon="Refresh" @click="refreshData">刷新数据</el-button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ stats.total }}</span>
        <span class="stat-label">今日操作</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num success">{{ stats.success }}</span>
        <span class="stat-label">成功</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num fail">{{ stats.fail }}</span>
        <span class="stat-label">失败</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.users }}</span>
        <span class="stat-label">活跃用户</span>
      </div>
    </div>

    <div class="content-card">
      <div class="card-header">
        <h3>操作日志记录</h3>
        <span class="record-count">共 {{ allFilteredLogs.length }} 条记录</span>
      </div>
      <el-table :data="filteredLogs" stripe :highlight-current-row="true" :default-sort="{ prop: 'time', order: 'descending' }">
        <el-table-column prop="time" label="操作时间" width="180" sortable>
          <template #default="{ row }">{{ formatTime(row.time) }}</template>
        </el-table-column>
        <el-table-column prop="userName" label="操作人" width="120">
          <template #default="{ row }">
            <div class="user-info" :title="row.userName">
              <span class="user-avatar">{{ row.userName.charAt(0) }}</span>
              <span>{{ abbreviateOperator(row.userName) }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" width="150"></el-table-column>
        <el-table-column prop="module" label="操作模块" width="120">
          <template #default="{ row }">
            <span class="module-tag">{{ getModuleName(row.module) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="type" label="操作类型" width="100">
          <template #default="{ row }">
            <span :class="['type-tag', row.type]">{{ getTypeName(row.type) }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="操作描述" min-width="200"></el-table-column>
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <span :class="['status-tag', row.status]">{{ row.status === 'success' ? '成功' : '失败' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="detail" label="详情" width="80">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="viewDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="allFilteredLogs.length"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
        />
      </div>
    </div>

    <el-dialog v-model="detailVisible" title="操作详情" width="600px">
      <div v-if="selectedLog" class="log-detail">
        <div class="detail-row">
          <span class="detail-label">操作时间</span>
          <span class="detail-value">{{ selectedLog.time }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">操作人</span>
          <span class="detail-value">{{ selectedLog.userName }} ({{ selectedLog.userId }})</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">IP地址</span>
          <span class="detail-value">{{ selectedLog.ip }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">操作模块</span>
          <span class="detail-value">{{ getModuleName(selectedLog.module) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">操作类型</span>
          <span class="detail-value">{{ getTypeName(selectedLog.type) }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">操作描述</span>
          <span class="detail-value">{{ selectedLog.description }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">操作状态</span>
          <span :class="['detail-value', selectedLog.status]">{{ selectedLog.status === 'success' ? '成功' : '失败' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">操作数据</span>
          <pre class="detail-json">{{ formatJson(selectedLog.data) }}</pre>
        </div>
        <div class="detail-row">
          <span class="detail-label">错误信息</span>
          <span class="detail-value error">{{ selectedLog.error || '-' }}</span>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { Download, Refresh, Search } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { MOCK_OPERATION_LOGS } from '@/data/mockData'
import store from '@/store/global'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const filterType = ref('all')
const filterModule = ref('all')
const filterStatus = ref('all')
const filterKeyword = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(20)
const detailVisible = ref(false)
const selectedLog = ref(null)

const operationLogs = ref([])

const stats = computed(() => {
  const logs = operationLogs.value
  const total = logs.length
  const success = logs.filter(l => l.status === 'success').length
  const fail = logs.filter(l => l.status === 'fail').length
  const uniqueUsers = new Set(logs.map(l => l.userName)).size
  return { total, success, fail, users: uniqueUsers }
})

const loadData = () => {
  const logsKey = `smart_pe_sys_operation_logs_${schoolId.value}`
  
  const storedLogs = sessionStorage.getItem(logsKey)
  if (storedLogs) {
    try {
      operationLogs.value = JSON.parse(storedLogs)
    } catch {
      operationLogs.value = [...MOCK_OPERATION_LOGS]
    }
  } else {
    operationLogs.value = [...MOCK_OPERATION_LOGS]
    sessionStorage.setItem(logsKey, JSON.stringify(operationLogs.value))
  }
  
  currentPage.value = 1
}

watch(schoolId, () => {
  loadData()
})

watch(currentPage, () => {
  if (currentPage.value > Math.ceil(allFilteredLogs.value.length / pageSize.value)) {
    currentPage.value = Math.max(1, Math.ceil(allFilteredLogs.value.length / pageSize.value))
  }
})

watch([filterType, filterModule, filterStatus, filterKeyword, dateRange], () => {
  currentPage.value = 1
})

let refreshTimer = null
const startAutoRefresh = () => {
  if (refreshTimer) clearInterval(refreshTimer)
  refreshTimer = setInterval(() => {
    const logsKey = `smart_pe_sys_operation_logs_${schoolId.value}`
    const storedLogs = sessionStorage.getItem(logsKey)
    if (storedLogs) {
      try {
        operationLogs.value = JSON.parse(storedLogs)
      } catch {}
    }
  }, 3000)
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

onMounted(() => {
  loadData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

const allFilteredLogs = computed(() => {
  let result = [...operationLogs.value]
  if (filterType.value && filterType.value !== 'all') {
    result = result.filter(log => log.type === filterType.value)
  }
  if (filterModule.value && filterModule.value !== 'all') {
    result = result.filter(log => log.module === filterModule.value)
  }
  if (filterStatus.value && filterStatus.value !== 'all') {
    result = result.filter(log => log.status === filterStatus.value)
  }
  if (filterKeyword.value) {
    const keyword = filterKeyword.value.toLowerCase()
    result = result.filter(log => 
      log.userName.toLowerCase().includes(keyword) || 
      log.ip.includes(keyword)
    )
  }
  if (dateRange.value && dateRange.value.length === 2) {
    const start = dateRange.value[0].getTime()
    const end = dateRange.value[1].getTime()
    result = result.filter(log => {
      const time = new Date(log.time.replace(/-/g, '/')).getTime()
      return time >= start && time <= end
    })
  }
  return result.sort((a, b) => new Date(b.time) - new Date(a.time))
})

const filteredLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return allFilteredLogs.value.slice(start, end)
})

const getModuleName = (module) => {
  const names = {
    user: '用户管理',
    student: '学生管理',
    exam: '考试管理',
    test: '体测管理',
    data: '数据平台',
    system: '系统设置'
  }
  return names[module] || module
}

const getTypeName = (type) => {
  const names = {
    login: '登录',
    logout: '退出',
    export: '导出',
    update: '修改',
    delete: '删除',
    create: '新增'
  }
  return names[type] || type
}

const formatTime = (time) => {
  if (!time) return '-'
  const date = new Date(time.replace(/-/g, '/'))
  const now = new Date()
  const diff = now - date
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes <= 0 ? '刚刚' : `${minutes}分钟前`
    }
    return `${hours}小时前`
  } else if (days === 1) {
    return '昨天 ' + time.split(' ')[1]
  } else if (days < 7) {
    return `${days}天前`
  }
  return time
}

const abbreviateOperator = (name) => {
  if (!name) return '-'
  if (name.length <= 3) return name
  return name.charAt(0) + '*'
}

const formatJson = (jsonStr) => {
  try {
    return JSON.stringify(JSON.parse(jsonStr), null, 2)
  } catch {
    return jsonStr
  }
}

const viewDetail = (row) => {
  selectedLog.value = row
  detailVisible.value = true
}

const exportLogs = () => {
  const headers = ['操作时间', '操作人', 'IP地址', '操作模块', '操作类型', '操作描述', '状态']
  const rows = filteredLogs.value.map(log => [
    log.time,
    log.userName,
    log.ip,
    getModuleName(log.module),
    getTypeName(log.type),
    log.description,
    log.status === 'success' ? '成功' : '失败'
  ])
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `操作日志_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('操作日志已导出')
}

const refreshData = () => {
  filterType.value = 'all'
  filterModule.value = 'all'
  filterStatus.value = 'all'
  filterKeyword.value = ''
  dateRange.value = []
  loadData()
  ElMessage.success('日志数据已刷新')
}
</script>

<style scoped>
.operation-log-page {
  padding: 24px;
  background: #F7F8FA;
  min-height: 100vh;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 16px;
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

.stats-row {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 24px;
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  gap: 32px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 4px;
}

.stat-item .stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #1E5AA8;
}

.stat-item .stat-label {
  font-size: 12px;
  color: #6B7280;
}

.stat-item .stat-num.success {
  color: #1E5AA8;
}

.stat-item .stat-num.fail {
  color: #E85D4E;
}

.stat-divider {
  width: 1px;
  height: 40px;
  background: #E8EAED;
  flex-shrink: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid #E8EAED;
}

.stat-item .stat-num.success {
  color: #1E5AA8;
}

.stat-item .stat-num.fail {
  color: #E85D4E;
}

.content-card {
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.record-count {
  font-size: 12px;
  color: #9CA3AF;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #E8F5E9;
  color: #1E5AA8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.module-tag {
  background: #E8F5E9;
  color: #1E5AA8;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.type-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.type-tag.login { background: #E8F5E9; color: #1E5AA8; }
.type-tag.export { background: #DBEAFE; color: #1E40AF; }
.type-tag.update { background: #FEF3C7; color: #92400E; }
.type-tag.delete { background: #FEE2E2; color: #991B1B; }
.type-tag.create { background: #ECFDF5; color: #059669; }

.status-tag {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
}

.status-tag.success { background: #E8F5E9; color: #1E5AA8; }
.status-tag.fail { background: #FEE2E2; color: #E85D4E; }

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #E8EAED;
}

.log-detail {
  padding: 16px;
}

.detail-row {
  display: flex;
  margin-bottom: 12px;
}

.detail-label {
  width: 120px;
  font-weight: 600;
  color: #6B7280;
  font-size: 14px;
}

.detail-value {
  flex: 1;
  color: #1A1A2E;
  font-size: 14px;
}

.detail-value.error {
  color: #E85D4E;
}

.detail-json {
  flex: 1;
  background: #F7F8FA;
  padding: 12px;
  border-radius: 8px;
  font-size: 12px;
  color: #6B7280;
  overflow-x: auto;
}
</style>
