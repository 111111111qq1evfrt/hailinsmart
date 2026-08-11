<template>
  <div class="integration-management">
    <div class="page-header">
      <div class="header-actions">
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num text-primary">{{ stats.totalIntegrations }}</span>
        <span class="stat-label">集成系统</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #3B82F6">{{ stats.connectedCount }}</span>
        <span class="stat-label">已连接</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #F5A623">{{ stats.apiCount }}</span>
        <span class="stat-label">API接口</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num text-primary">{{ stats.totalCalls.toLocaleString() }}</span>
        <span class="stat-label text-primary">今日调用</span>
      </div>
    </div>

    <div class="main-content">
      <div class="integration-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Link /></el-icon> 身份同步</span>
          <el-button type="primary" size="small" :icon="Refresh" @click="syncAll" :loading="syncing">一键同步</el-button>
        </div>
        <div class="integration-list">
          <div v-for="item in integrations" :key="item.name" class="integration-item">
            <div class="integration-icon" :class="item.status === 'connected' ? 'connected' : 'disconnected'">
              <component :is="item.icon" />
            </div>
            <div class="integration-info">
              <span class="integration-name">{{ item.name }}</span>
              <span class="integration-desc">{{ item.description }}</span>
              <div v-if="item.syncCounts" class="sync-counts">
                <el-tag size="small" type="info">班级: {{ item.syncCounts.classes }}</el-tag>
                <el-tag size="small" type="info">教师: {{ item.syncCounts.teachers }}</el-tag>
                <el-tag size="small" type="info">学生: {{ item.syncCounts.students }}</el-tag>
              </div>
            </div>
            <div class="integration-status">
              <el-tag :type="item.status === 'connected' ? 'success' : 'danger'" size="small">
                {{ item.status === 'connected' ? '已连接' : '未连接' }}
              </el-tag>
              <span class="last-sync">{{ item.lastSync }}</span>
            </div>
            <div class="integration-actions">
              <el-button v-if="item.status === 'connected'" link type="primary" size="small" @click="syncData(item)">同步数据</el-button>
              <el-button v-else type="primary" size="small" @click="connect(item)">连接</el-button>
              <el-button link type="primary" size="small" @click="configure(item)">配置</el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="multi-terminal-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Monitor /></el-icon> 多端协同状态</span>
        </div>
        <div class="terminal-list">
          <div v-for="terminal in terminals" :key="terminal.name" class="terminal-item">
            <div class="terminal-icon" :class="terminal.online ? 'online' : 'offline'">
              <component :is="terminal.icon" />
            </div>
            <div class="terminal-info">
              <span class="terminal-name">{{ terminal.name }}</span>
              <span class="terminal-last-active">最后活跃: {{ terminal.lastActive }}</span>
            </div>
            <el-tag :type="terminal.online ? 'success' : 'info'" size="small">
              {{ terminal.online ? '在线' : '离线' }}
            </el-tag>
          </div>
        </div>
      </div>

      <div class="api-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Connection /></el-icon> API接口管理</span>
          <el-button type="primary" size="small" :icon="Plus" @click="showApiDialog = true">新增接口</el-button>
        </div>
        <el-table :data="apiList" stripe class="w-full" :height="300">
          <el-table-column prop="name" label="接口名称" width="180" />
          <el-table-column prop="path" label="接口路径" />
          <el-table-column prop="method" label="方法" width="80">
            <template #default="{ row }">
              <el-tag :type="getMethodType(row.method)" size="small">{{ row.method }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="启用" width="80">
            <template #default="{ row }">
              <el-switch :model-value="row.status === 'enabled'" @change="toggleApi(row)" size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="calls" label="调用次数" width="100" />
          <el-table-column prop="lastCall" label="最后调用" width="140" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="testApi(row)">测试</el-button>
              <el-button link type="primary" size="small" @click="editApi(row)">编辑</el-button>
              <el-button link type="danger" size="small" @click="deleteApi(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="config-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Lock /></el-icon> 安全配置</span>
        </div>
        <div class="settings-grid">
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-icon"><Lock /></span>
              <div class="setting-text">
                <span class="setting-name">数据传输加密</span>
                <span class="setting-desc">AES-256加密传输</span>
              </div>
            </div>
            <el-switch v-model="securitySettings.encryption" @change="saveSecuritySettings" />
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-icon"><Key /></span>
              <div class="setting-text">
                <span class="setting-name">敏感操作验证</span>
                <span class="setting-desc">短信/邮箱双重验证</span>
              </div>
            </div>
            <el-switch v-model="securitySettings.sensitiveVerify" @change="saveSecuritySettings" />
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-icon"><CircleCheck /></span>
              <div class="setting-text">
                <span class="setting-name">等保合规</span>
                <span class="setting-desc">三级等保认证</span>
              </div>
            </div>
            <el-tag type="success" size="small">已认证</el-tag>
          </div>
          <div class="setting-item">
            <div class="setting-info">
              <span class="setting-icon"><DataLine /></span>
              <div class="setting-text">
                <span class="setting-name">实时数据库</span>
                <span class="setting-desc">Redis缓存工单状态</span>
              </div>
            </div>
            <el-switch v-model="securitySettings.redisCache" @change="saveSecuritySettings" />
          </div>
        </div>
      </div>

      <div class="redis-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Histogram /></el-icon> Redis缓存指标</span>
        </div>
        <div class="redis-metrics">
          <div class="redis-item">
            <span class="redis-label">命中率</span>
            <el-progress :percentage="redisMetrics.hitRate" :stroke-width="10" color="#1E5AA8" />
          </div>
          <div class="redis-item">
            <span class="redis-label">内存使用</span>
            <span class="redis-value">{{ redisMetrics.memoryUsed }} / {{ redisMetrics.memoryMax }}</span>
          </div>
          <div class="redis-item">
            <span class="redis-label">缓存Key数</span>
            <span class="redis-value">{{ redisMetrics.keyCount }}</span>
          </div>
          <div class="redis-item">
            <span class="redis-label">连接客户端</span>
            <span class="redis-value">{{ redisMetrics.connectedClients }}</span>
          </div>
        </div>
      </div>


    </div>

    <el-dialog v-model="showApiDialog" title="新增API接口" width="500px">
      <el-form :model="apiForm" label-width="100px">
        <el-form-item label="接口名称" required>
          <el-input v-model="apiForm.name" placeholder="请输入接口名称" />
        </el-form-item>
        <el-form-item label="接口路径" required>
          <el-input v-model="apiForm.path" placeholder="请输入接口路径" />
        </el-form-item>
        <el-form-item label="请求方法" required>
          <el-select v-model="apiForm.method">
            <el-option label="GET" value="GET" />
            <el-option label="POST" value="POST" />
            <el-option label="PUT" value="PUT" />
            <el-option label="DELETE" value="DELETE" />
          </el-select>
        </el-form-item>
        <el-form-item label="接口描述">
          <el-input v-model="apiForm.description" type="textarea" :rows="3" placeholder="请输入接口描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showApiDialog = false">取消</el-button>
        <el-button type="primary" @click="saveApi">保存</el-button>
      </template>
    </el-dialog>

    <!-- Integration Config Dialog -->
    <el-dialog v-model="showConfigDialog" :title="`配置 - ${configTarget?.name || ''}`" width="520px">
      <div v-if="configTarget" class="config-dialog-content">
        <div class="config-status-row">
          <span class="config-label">当前状态</span>
          <el-tag :type="configTarget.status === 'connected' ? 'success' : 'danger'" size="small">
            {{ configTarget.status === 'connected' ? '已连接' : '未连接' }}
          </el-tag>
        </div>
        <div class="config-status-row">
          <span class="config-label">最近同步</span>
          <span>{{ configTarget.lastSync }}</span>
        </div>
        <el-divider />
        <el-form :model="configForm" label-width="110px">
          <el-form-item label="同步间隔">
            <el-select v-model="configForm.syncInterval" style="width: 100%">
              <el-option label="实时同步" value="realtime" />
              <el-option label="每5分钟" value="5min" />
              <el-option label="每15分钟" value="15min" />
              <el-option label="每30分钟" value="30min" />
              <el-option label="每小时" value="1hour" />
              <el-option label="手动" value="manual" />
            </el-select>
          </el-form-item>
          <el-form-item label="数据范围">
            <el-checkbox-group v-model="configForm.dataScope">
              <el-checkbox label="students">学生数据</el-checkbox>
              <el-checkbox label="teachers">教师数据</el-checkbox>
              <el-checkbox label="classes">班级数据</el-checkbox>
              <el-checkbox label="scores">成绩数据</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="失败重试">
            <el-switch v-model="configForm.autoRetry" />
            <span style="margin-left: 8px; font-size: 12px; color: #6B7280">同步失败时自动重试（最多3次）</span>
          </el-form-item>
          <el-form-item label="变更通知">
            <el-switch v-model="configForm.notifyOnChange" />
            <span style="margin-left: 8px; font-size: 12px; color: #6B7280">数据变更时发送通知</span>
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showConfigDialog = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">保存配置</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Lock, Key, CircleCheck, Histogram, Collection, MessageBox, CreditCard, Cellphone, Refresh, Document, Monitor, DataLine, Link, Connection } from '@element-plus/icons-vue'
import store from '@/store/global'
import { usePersistedRef } from '@/composables/usePersistedRef'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const showApiDialog = ref(false)
const showConfigDialog = ref(false)
const syncing = ref(false)
const configTarget = ref(null)

const apiForm = ref({
  name: '',
  path: '',
  method: 'GET',
  description: ''
})

const configForm = ref({
  syncInterval: '15min',
  dataScope: ['students', 'teachers', 'classes'],
  autoRetry: true,
  notifyOnChange: false
})

const getMethodType = (method) => ({ GET: 'success', POST: 'primary', PUT: 'warning', DELETE: 'danger' }[method] || 'info')

const getDefaultIntegrations = () => {
  const schoolData = {
    'hailin-second-primary': [
      { name: '教务系统', description: '同步班级/师生数据', icon: Collection, status: 'connected', lastSync: '2026-07-17 09:00', syncCounts: { classes: 18, teachers: 94, students: 2286 } },
      { name: '财务系统', description: '耗材库存自动扣减', icon: CreditCard, status: 'connected', lastSync: '2026-07-17 10:30', syncCounts: null },
      { name: '健康系统', description: '体温、症状数据互通', icon: DataLine, status: 'connected', lastSync: '2026-07-17 08:15', syncCounts: null },
      { name: '消息推送', description: '微信/短信通知通道', icon: MessageBox, status: 'connected', lastSync: '2026-07-17 11:00', syncCounts: null },
      { name: '移动端', description: '小程序/APP数据同步', icon: Cellphone, status: 'connected', lastSync: '2026-07-17 09:30', syncCounts: null },
      { name: '大屏看板', description: '领导决策大屏对接', icon: Histogram, status: 'disconnected', lastSync: '未连接', syncCounts: null }
    ],
    'hailin-zirong-primary': [
      { name: '教务系统', description: '同步班级/师生数据', icon: Collection, status: 'connected', lastSync: '2026-07-17 08:45', syncCounts: { classes: 12, teachers: 62, students: 1480 } },
      { name: '财务系统', description: '耗材库存自动扣减', icon: CreditCard, status: 'connected', lastSync: '2026-07-16 17:00', syncCounts: null },
      { name: '健康系统', description: '体温、症状数据互通', icon: DataLine, status: 'disconnected', lastSync: '2026-07-15 14:00', syncCounts: null },
      { name: '消息推送', description: '微信/短信通知通道', icon: MessageBox, status: 'connected', lastSync: '2026-07-17 10:20', syncCounts: null },
      { name: '移动端', description: '小程序/APP数据同步', icon: Cellphone, status: 'connected', lastSync: '2026-07-17 09:00', syncCounts: null },
      { name: '大屏看板', description: '领导决策大屏对接', icon: Histogram, status: 'connected', lastSync: '2026-07-17 08:30', syncCounts: null }
    ],
    'linhai-experimental-primary': [
      { name: '教务系统', description: '同步班级/师生数据', icon: Collection, status: 'connected', lastSync: '2026-07-17 10:00', syncCounts: { classes: 24, teachers: 128, students: 3150 } },
      { name: '财务系统', description: '耗材库存自动扣减', icon: CreditCard, status: 'connected', lastSync: '2026-07-17 11:00', syncCounts: null },
      { name: '健康系统', description: '体温、症状数据互通', icon: DataLine, status: 'connected', lastSync: '2026-07-17 09:30', syncCounts: null },
      { name: '消息推送', description: '微信/短信通知通道', icon: MessageBox, status: 'connected', lastSync: '2026-07-17 11:15', syncCounts: null },
      { name: '移动端', description: '小程序/APP数据同步', icon: Cellphone, status: 'connected', lastSync: '2026-07-17 10:45', syncCounts: null },
      { name: '大屏看板', description: '领导决策大屏对接', icon: Histogram, status: 'connected', lastSync: '2026-07-17 10:30', syncCounts: null }
    ]
  }
  return schoolData[schoolId.value] || schoolData['hailin-second-primary']
}

const getDefaultApiList = () => {
  return [
    { name: '学生数据接口', path: '/api/students', method: 'GET', status: 'enabled', calls: 12580, lastCall: '2026-07-17 11:30' },
    { name: '成绩上报接口', path: '/api/scores', method: 'POST', status: 'enabled', calls: 8920, lastCall: '2026-07-17 11:25' },
    { name: '设备状态接口', path: '/api/devices/status', method: 'GET', status: 'enabled', calls: 5670, lastCall: '2026-07-17 11:30' },
    { name: '通知推送接口', path: '/api/notifications', method: 'POST', status: 'enabled', calls: 3240, lastCall: '2026-07-17 11:15' },
    { name: '请假审批接口', path: '/api/leave', method: 'PUT', status: 'enabled', calls: 1890, lastCall: '2026-07-17 10:45' },
    { name: '维修工单接口', path: '/api/workorders', method: 'GET', status: 'enabled', calls: 2340, lastCall: '2026-07-17 11:00' },
    { name: '数据导出接口', path: '/api/export', method: 'POST', status: 'enabled', calls: 890, lastCall: '2026-07-17 10:00' },
    { name: '权限验证接口', path: '/api/auth', method: 'POST', status: 'enabled', calls: 15600, lastCall: '2026-07-17 11:30' }
  ]
}

const integrations = usePersistedRef(computed(() => `smart_pe_integrations_${schoolId.value}`), getDefaultIntegrations)
const apiList = usePersistedRef(computed(() => `smart_pe_api_list_${schoolId.value}`), getDefaultApiList)
const securitySettings = usePersistedRef(computed(() => `smart_pe_security_settings_${schoolId.value}`), {
  encryption: true,
  sensitiveVerify: true,
  redisCache: true
})

const terminals = computed(() => {
  const data = {
    'hailin-second-primary': [
      { name: '校长办公室 PC', icon: Monitor, online: true, lastActive: '2026-07-17 11:30' },
      { name: '教务处 PC', icon: Monitor, online: true, lastActive: '2026-07-17 11:28' },
      { name: '体育教师 平板', icon: Cellphone, online: true, lastActive: '2026-07-17 11:25' },
      { name: '门卫室 PC', icon: Monitor, online: false, lastActive: '2026-07-16 17:00' },
      { name: '家长端 小程序', icon: Cellphone, online: true, lastActive: '2026-07-17 10:45' }
    ],
    'hailin-zirong-primary': [
      { name: '校长办公室 PC', icon: Monitor, online: true, lastActive: '2026-07-17 11:15' },
      { name: '体育组 PC', icon: Monitor, online: true, lastActive: '2026-07-17 11:10' },
      { name: '体育教师 平板', icon: Cellphone, online: false, lastActive: '2026-07-16 16:30' },
      { name: '家长端 小程序', icon: Cellphone, online: true, lastActive: '2026-07-17 09:20' }
    ],
    'linhai-experimental-primary': [
      { name: '校长办公室 PC', icon: Monitor, online: true, lastActive: '2026-07-17 11:32' },
      { name: '教务处 PC', icon: Monitor, online: true, lastActive: '2026-07-17 11:30' },
      { name: '体育组 PC', icon: Monitor, online: true, lastActive: '2026-07-17 11:28' },
      { name: '体育教师A 平板', icon: Cellphone, online: true, lastActive: '2026-07-17 11:25' },
      { name: '体育教师B 平板', icon: Cellphone, online: true, lastActive: '2026-07-17 11:20' },
      { name: '家长端 小程序', icon: Cellphone, online: true, lastActive: '2026-07-17 11:10' },
      { name: '大屏看板终端', icon: Monitor, online: true, lastActive: '2026-07-17 11:30' }
    ]
  }
  return data[schoolId.value] || data['hailin-second-primary']
})

const redisMetrics = computed(() => {
  const data = {
    'hailin-second-primary': { hitRate: 94.5, memoryUsed: '256MB', memoryMax: '512MB', keyCount: 12680, connectedClients: 18 },
    'hailin-zirong-primary': { hitRate: 89.2, memoryUsed: '128MB', memoryMax: '256MB', keyCount: 6420, connectedClients: 8 },
    'linhai-experimental-primary': { hitRate: 96.8, memoryUsed: '384MB', memoryMax: '1024MB', keyCount: 21500, connectedClients: 24 }
  }
  return data[schoolId.value] || data['hailin-second-primary']
})

const auditLogs = computed(() => {
  const data = {
    'hailin-second-primary': [
      { time: '2026-07-17 11:30', user: '张校长', action: '同步教务系统数据', type: 'sync' },
      { time: '2026-07-17 10:45', user: '李老师', action: '导出学生成绩', type: 'export' },
      { time: '2026-07-17 09:30', user: '系统', action: '自动备份数据库', type: 'backup' },
      { time: '2026-07-17 09:00', user: '张校长', action: '修改安全配置', type: 'config' },
      { time: '2026-07-16 16:00', user: '系统', action: 'API接口异常告警', type: 'alert' }
    ],
    'hailin-zirong-primary': [
      { time: '2026-07-17 10:20', user: '王主任', action: '同步教务系统数据', type: 'sync' },
      { time: '2026-07-17 09:15', user: '赵老师', action: '导出设备报表', type: 'export' },
      { time: '2026-07-16 17:00', user: '系统', action: '自动备份数据库', type: 'backup' },
      { time: '2026-07-16 14:30', user: '王主任', action: '连接大屏看板系统', type: 'config' }
    ],
    'linhai-experimental-primary': [
      { time: '2026-07-17 11:15', user: '陈校长', action: '同步教务系统数据', type: 'sync' },
      { time: '2026-07-17 11:00', user: '刘老师', action: '导出学生体测数据', type: 'export' },
      { time: '2026-07-17 10:30', user: '系统', action: 'API调用量超阈值告警', type: 'alert' },
      { time: '2026-07-17 09:00', user: '系统', action: '自动备份数据库', type: 'backup' },
      { time: '2026-07-17 08:30', user: '陈校长', action: '配置消息推送通道', type: 'config' },
      { time: '2026-07-16 15:00', user: '刘老师', action: '批量导入学生数据', type: 'sync' }
    ]
  }
  return data[schoolId.value] || data['hailin-second-primary']
})

const stats = computed(() => ({
  totalIntegrations: integrations.value.length,
  connectedCount: integrations.value.filter(i => i.status === 'connected').length,
  apiCount: apiList.value.length,
  totalCalls: apiList.value.reduce((sum, api) => sum + api.calls, 0)
}))

const syncData = (item) => {
  ElMessage.info(`正在同步 ${item.name} 数据...`)
  setTimeout(() => {
    item.lastSync = new Date().toLocaleString('zh-CN')
    ElMessage.success(`${item.name} 数据同步完成`)
  }, 1500)
}

const syncAll = () => {
  syncing.value = true
  ElMessage.info('正在同步所有系统数据...')
  setTimeout(() => {
    integrations.value.forEach(item => {
      if (item.status === 'connected') {
        item.lastSync = '2026-07-17 11:35'
      }
    })
    syncing.value = false
    ElMessage.success('所有系统数据同步完成')
  }, 2000)
}

const connect = (item) => {
  ElMessage.info(`正在连接 ${item.name}...`)
  setTimeout(() => {
    item.status = 'connected'
    item.lastSync = new Date().toLocaleString('zh-CN')
    ElMessage.success(`${item.name} 连接成功`)
  }, 1500)
}

const configure = (item) => {
  configTarget.value = item
  configForm.value = {
    syncInterval: '15min',
    dataScope: ['students', 'teachers', 'classes'],
    autoRetry: true,
    notifyOnChange: false
  }
  showConfigDialog.value = true
}

const testApi = (row) => {
  ElMessage.info(`正在测试接口 ${row.name}...`)
  setTimeout(() => {
    ElMessage.success(`接口 ${row.name} 测试成功`)
  }, 1000)
}

const editApi = (row) => {
  apiForm.value = { name: row.name, path: row.path, method: row.method, description: '' }
  showApiDialog.value = true
}

const deleteApi = (row) => {
  apiList.value = apiList.value.filter(a => a.path !== row.path)
  ElMessage.success('接口已删除')
}

const toggleApi = (row) => {
  row.status = row.status === 'enabled' ? 'disabled' : 'enabled'
  ElMessage.success(`接口已${row.status === 'enabled' ? '启用' : '禁用'}`)
}

const saveApi = () => {
  if (!apiForm.value.name || !apiForm.value.path) {
    ElMessage.warning('请填写完整信息')
    return
  }
  apiList.value.unshift({
    ...apiForm.value,
    status: 'enabled',
    calls: 0,
    lastCall: '未调用'
  })
  showApiDialog.value = false
  apiForm.value = { name: '', path: '', method: 'GET', description: '' }
  ElMessage.success('接口已添加')
}

const saveSecuritySettings = () => {
  ElMessage.success('安全配置已保存')
}

const saveConfig = () => {
  if (configTarget.value) {
    if (configTarget.value.status === 'connected') {
      configTarget.value.lastSync = new Date().toLocaleString('zh-CN')
    }
  }
  showConfigDialog.value = false
  ElMessage.success(`${configTarget.value?.name || ''} 配置已保存`)
}

onMounted(() => {})
</script>

<style scoped>
.integration-management {
  min-height: calc(100vh - 140px);
}

.page-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 24px;
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

  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: none;  /* 取消等分 */
}

.stat-num {
  font-size: 32px;
  font-weight: 700;
  color: #1A1A2E;
}

.stat-num.text-primary {
  color: #1E5AA8;
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
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.integration-card, .api-card, .config-card, .stats-card, .multi-terminal-card, .redis-card, .audit-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.api-card, .audit-card {
  grid-column: span 2;
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
  display: flex;
  align-items: center;
  gap: 8px;
}



.integration-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.integration-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.integration-icon {
  width: 36px;
  height: 36px;
  background: #E8EAED;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #6B7280;
}

.integration-icon :deep(.el-icon),
.integration-icon :deep(svg) {
  font-size: 18px !important;
  width: 18px !important;
  height: 18px !important;
}

.integration-icon.connected {
  background: #EEF6FF;
  color: #1E5AA8;
}

.integration-icon.disconnected {
  background: #FEE2E2;
  color: #E85D4E;
}

.integration-info {
  flex: 1;
}

.integration-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  display: block;
}

.integration-desc {
  font-size: 12px;
  color: #6B7280;
}

.integration-status {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.last-sync {
  font-size: 12px;
  color: #9CA3AF;
}

.integration-actions {
  display: flex;
  gap: 8px;
}

.settings-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.setting-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-icon {
  width: 36px;
  height: 36px;
  background: #EEF6FF;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  color: #1E5AA8;
}

.setting-icon :deep(.el-icon),
.setting-icon :deep(svg) {
  font-size: 18px !important;
  width: 18px !important;
  height: 18px !important;
}

.setting-text {
  display: flex;
  flex-direction: column;
}

.setting-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.setting-desc {
  font-size: 12px;
  color: #6B7280;
}



.sync-counts {
  display: flex;
  gap: 6px;
  margin-top: 4px;
}

.terminal-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.terminal-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.terminal-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.terminal-icon :deep(.el-icon),
.terminal-icon :deep(svg) {
  font-size: 18px !important;
  width: 18px !important;
  height: 18px !important;
}

.terminal-icon.online {
  background: #EEF6FF;
  color: #1E5AA8;
}

.terminal-icon.offline {
  background: #E8EAED;
  color: #9CA3AF;
}

.terminal-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.terminal-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.terminal-last-active {
  font-size: 12px;
  color: #9CA3AF;
}

.redis-metrics {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.redis-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.redis-label {
  font-size: 12px;
  color: #6B7280;
}

.redis-value {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.config-dialog-content {
  padding: 0 4px;
}

.config-status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.config-label {
  font-size: 14px;
  color: #6B7280;
  min-width: 70px;
}
</style>