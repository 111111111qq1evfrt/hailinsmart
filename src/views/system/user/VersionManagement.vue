<template>
  <div class="version-management">
    <div class="page-header">
      <div class="header-actions">
        <el-button :icon="Refresh" @click="checkUpdate" :loading="checking">检查更新</el-button>
        <el-button type="primary" :icon="Download" @click="downloadUpdate" :disabled="currentVersion.isLatest">立即更新</el-button>
        <el-button v-if="latestVersion && !currentVersion.isLatest" :icon="Clock" @click="remindLater">稍后提醒</el-button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ historyVersions.length }}</span>
        <span class="stat-label">历史版本</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ currentVersion.isLatest ? '0' : '1' }}</span>
        <span class="stat-label">待更新</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ updateSettings.autoCheck ? '开启' : '关闭' }}</span>
        <span class="stat-label">自动检查</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ frequencyText }}</span>
        <span class="stat-label">检查频率</span>
      </div>
    </div>

    <div class="main-content">
      <div class="info-card">
        <div class="card-header"> 
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Monitor /></el-icon> 当前版本</span>
          <el-tag v-if="currentVersion.isLatest" type="success" size="small">已是最新版本</el-tag>
          <el-tag v-else type="warning" size="small">有新版本可用</el-tag>
        </div>
        <div class="version-info">
          <div class="version-row">
            <span class="label">版本号</span>
            <span class="value version-num">{{ currentVersion.version }}</span>
          </div>
          <div class="version-row">
            <span class="label">构建日期</span>
            <span class="value">{{ currentVersion.buildDate || currentVersion.releaseDate }}</span>
          </div>
          <div class="version-row">
            <span class="label">发布日期</span>
            <span class="value">{{ currentVersion.releaseDate }}</span>
          </div>
          <div class="version-row">
            <span class="label">更新日志</span>
            <div class="value">
              <ul class="changelog-list">
                <li v-for="(item, idx) in currentVersion.changelog" :key="idx">
                  <el-tag v-if="item.type" :type="getUpdateTypeTag(item.type)" size="small" class="type-tag">{{ getUpdateTypeText(item.type) }}</el-tag>
                  {{ item.text || item }}
                </li>
              </ul>
            </div>
          </div>
          <div class="version-row">
            <span class="label">更新包大小</span>
            <span class="value">{{ currentVersion.size }}</span>
          </div>
        </div>
      </div>

      <div class="info-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Setting /></el-icon> 更新设置</span>
        </div>
        <div class="settings-form">
          <div class="setting-item">
            <span class="setting-label">自动检查更新</span>
            <el-switch :model-value="updateSettings.autoCheck" @change="saveSettings" />
          </div>
          <div class="setting-item">
            <span class="setting-label">更新提醒方式</span>
            <el-select v-model="updateSettings.notifyType" @change="saveSettings" style="width: 200px">
              <el-option label="弹窗提醒" value="popup" />
              <el-option label="通知栏提醒" value="notification" />
              <el-option label="弹窗+通知栏" value="both" />
            </el-select>
          </div>
          <div class="setting-item">
            <span class="setting-label">检查频率</span>
            <el-select v-model="updateSettings.checkFrequency" @change="saveSettings" style="width: 200px">
              <el-option label="每次启动" value="startup" />
              <el-option label="每天" value="daily" />
              <el-option label="每周" value="weekly" />
              <el-option label="手动" value="manual" />
            </el-select>
          </div>
        </div>
      </div>

      <div class="info-card" v-if="latestVersion && !currentVersion.isLatest">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Promotion /></el-icon> 最新版本</span>
          <el-tag type="danger" size="small">推荐更新</el-tag>
        </div>
        <div class="version-info">
          <div class="version-row">
            <span class="label">版本号</span>
            <span class="value version-num" style="color: #1E5AA8">{{ latestVersion.version }}</span>
          </div>
          <div class="version-row">
            <span class="label">构建日期</span>
            <span class="value">{{ latestVersion.buildDate || latestVersion.releaseDate }}</span>
          </div>
          <div class="version-row">
            <span class="label">发布日期</span>
            <span class="value">{{ latestVersion.releaseDate }}</span>
          </div>
          <div class="version-row">
            <span class="label">更新内容</span>
            <div class="value">
              <ul class="changelog-list">
                <li v-for="(item, idx) in latestVersion.changelog" :key="idx">
                  <el-tag v-if="item.type" :type="getUpdateTypeTag(item.type)" size="small" class="type-tag">{{ getUpdateTypeText(item.type) }}</el-tag>
                  {{ item.text || item }}
                </li>
              </ul>
            </div>
          </div>
          <div class="version-row">
            <span class="label">更新包大小</span>
            <span class="value">{{ latestVersion.size }}</span>
          </div>
          <div class="version-row">
            <span class="label">强制更新</span>
            <span class="value">
              <el-tag v-if="latestVersion.forceUpdate" type="danger">是</el-tag>
              <el-tag v-else type="success">否</el-tag>
            </span>
          </div>
        </div>
      </div>

      <div class="info-card wide-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Document /></el-icon> 历史版本</span>
        </div>
        <el-table :data="historyVersions" stripe class="w-full" :height="300">
          <el-table-column prop="version" label="版本号" width="120">
            <template #default="{ row }"><span class="version-text">{{ row.version }}</span></template>
          </el-table-column>
          <el-table-column prop="releaseDate" label="发布日期" width="140" />
          <el-table-column prop="size" label="包大小" width="100" />
          <el-table-column prop="type" label="更新类型" width="120">
            <template #default="{ row }">
              <el-tag :type="getUpdateTypeTag(row.type)" size="small">{{ getUpdateTypeText(row.type) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="description" label="更新描述" />
          <el-table-column prop="forceUpdate" label="强制更新" width="100">
            <template #default="{ row }">
              <el-tag :type="row.forceUpdate ? 'danger' : 'success'" size="small">
                {{ row.forceUpdate ? '是' : '否' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewVersionDetail(row)">查看详情</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Update Progress Dialog -->
    <el-dialog v-model="showProgressDialog" :title="progressTitle" width="480px" :close-on-click-modal="false">
      <div class="progress-dialog-content">
        <div class="progress-step" v-for="(step, idx) in progressSteps" :key="idx" :class="{ active: step.status === 'active', done: step.status === 'done' }">
          <div class="step-indicator">
            <el-icon v-if="step.status === 'done'" color="#67C23A"><CircleCheckFilled /></el-icon>
            <el-icon v-else-if="step.status === 'active'" class="is-loading" color="#1E5AA8"><Loading /></el-icon>
            <span v-else class="step-dot"></span>
          </div>
          <div class="step-info">
            <span class="step-name">{{ step.name }}</span>
            <el-progress v-if="step.status === 'active' || step.status === 'done'" 
              :percentage="step.status === 'done' ? 100 : step.percent" 
              :stroke-width="8" 
              :show-text="true" 
              :color="step.color || '#1E5AA8'" 
              style="width: 280px" />
            <span v-if="step.status === 'done'" class="step-done-text">完成</span>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button v-if="progressComplete" type="primary" @click="finishUpdate">完成</el-button>
        <el-button v-else-if="!checking" @click="remindLater">稍后提醒</el-button>
      </template>
    </el-dialog>

    <!-- Version Detail Dialog -->
    <el-dialog v-model="showVersionDetail" title="版本详情" width="560px">
      <div v-if="selectedVersion" class="version-detail">
        <div class="detail-header">
          <span class="detail-version">{{ selectedVersion.version }}</span>
          <el-tag :type="getUpdateTypeTag(selectedVersion.type)" size="small">{{ getUpdateTypeText(selectedVersion.type) }}</el-tag>
          <el-tag v-if="selectedVersion.forceUpdate" type="danger" size="small">强制更新</el-tag>
        </div>
        <div class="detail-meta">
          <span>发布日期：{{ selectedVersion.releaseDate }}</span>
          <span>包大小：{{ selectedVersion.size }}</span>
        </div>
        <div class="detail-desc">
          <div class="detail-section-title">更新说明</div>
          <p>{{ selectedVersion.description }}</p>
        </div>
        <div v-if="selectedVersion.changelog && selectedVersion.changelog.length" class="detail-changelog">
          <div class="detail-section-title">变更日志</div>
          <ul>
            <li v-for="(item, idx) in selectedVersion.changelog" :key="idx">
              <el-tag v-if="item.type" :type="getUpdateTypeTag(item.type)" size="small" class="type-tag">{{ getUpdateTypeText(item.type) }}</el-tag>
              {{ item.text || item }}
            </li>
          </ul>
        </div>
      </div>
      <template #footer>
        <el-button @click="showVersionDetail = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh, Download, CircleCheckFilled, Loading, Monitor, Setting, Promotion, Document } from '@element-plus/icons-vue'
import store from '@/store/global'
import { usePersistedRef } from '@/composables/usePersistedRef'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

/* ---- Progress dialog state ---- */
const showProgressDialog = ref(false)
const showVersionDetail = ref(false)
const selectedVersion = ref(null)
const checking = ref(false)
const progressComplete = ref(false)

const progressTitle = ref('检查更新')
const progressSteps = ref([])

const getDefaultVersions = () => ({
  'hailin-second-primary': {
    current: {
      version: 'v2.1.3',
      releaseDate: '2026-06-15',
      buildDate: '2026-06-14',
      changelog: [
        { type: 'optimize', text: '优化设备管理模块' },
        { type: 'fix', text: '修复部分设备状态显示异常' },
        { type: 'optimize', text: '提升数据同步速度' }
      ],
      size: '25.6MB',
      isLatest: false
    },
    latest: {
      version: 'v2.2.0',
      releaseDate: '2026-07-15',
      buildDate: '2026-07-14',
      changelog: [
        { type: 'feature', text: '新增功能' },
        { type: 'optimize', text: '优化健康监测看板' },
        { type: 'feature', text: '新增设备定时任务' },
        { type: 'fix', text: '修复多处已知问题' }
      ],
      size: '32.1MB',
      forceUpdate: false
    },
    history: [
      { version: 'v2.1.2', releaseDate: '2026-05-20', size: '23.4MB', type: 'optimize', description: '优化视频播放体验', changelog: [{ type: 'optimize', text: '视频加载策略优化' }], forceUpdate: false },
      { version: 'v2.1.0', releaseDate: '2026-04-10', size: '28.7MB', type: 'feature', description: '新增AI智能点评功能', changelog: [{ type: 'feature', text: 'AI智能点评上线' }, { type: 'optimize', text: '性能优化' }], forceUpdate: true },
      { version: 'v2.0.0', releaseDate: '2026-03-01', size: '45.2MB', type: 'feature', description: '系统全面升级，新增多个核心模块', changelog: [{ type: 'feature', text: '全新UI框架升级' }, { type: 'feature', text: '新增体测管理' }, { type: 'feature', text: '新增自由练习' }], forceUpdate: true },
      { version: 'v1.8.5', releaseDate: '2026-01-15', size: '18.9MB', type: 'fix', description: '修复部分bug', changelog: [{ type: 'fix', text: '修复登录异常' }, { type: 'fix', text: '修复数据导出问题' }], forceUpdate: false }
    ]
  },
  'hailin-zirong-primary': {
    current: {
      version: 'v2.0.5',
      releaseDate: '2026-05-01',
      buildDate: '2026-04-30',
      changelog: [
        { type: 'optimize', text: '优化数据同步' },
        { type: 'fix', text: '修复登录问题' }
      ],
      size: '22.1MB',
      isLatest: false
    },
    latest: {
      version: 'v2.2.0',
      releaseDate: '2026-07-15',
      buildDate: '2026-07-14',
      changelog: [
        { type: 'feature', text: '新增功能' },
        { type: 'optimize', text: '优化健康监测看板' }
      ],
      size: '32.1MB',
      forceUpdate: false
    },
    history: [
      { version: 'v2.0.0', releaseDate: '2026-03-01', size: '42.5MB', type: 'feature', description: '系统升级', forceUpdate: true },
      { version: 'v1.9.0', releaseDate: '2026-01-20', size: '20.3MB', type: 'optimize', description: '新增功能与优化', forceUpdate: false }
    ]
  },
  'linhai-experimental-primary': {
    current: {
      version: 'v2.2.0',
      releaseDate: '2026-07-15',
      buildDate: '2026-07-14',
      changelog: [
        { type: 'feature', text: '新增功能' },
        { type: 'optimize', text: '优化健康监测' }
      ],
      size: '32.1MB',
      isLatest: true
    },
    latest: null,
    history: [
      { version: 'v2.1.0', releaseDate: '2026-04-10', size: '26.8MB', type: 'feature', description: '新增AI点评', forceUpdate: true },
      { version: 'v2.0.0', releaseDate: '2026-03-01', size: '40.1MB', type: 'feature', description: '全面升级', forceUpdate: true }
    ]
  }
})

const versionData = usePersistedRef(computed(() => `smart_pe_version_data_${schoolId.value}`), () => getDefaultVersions()[schoolId.value])

const currentVersion = computed(() => versionData.value.current)
const latestVersion = computed(() => versionData.value.latest)
const historyVersions = computed(() => versionData.value.history)

const updateSettings = usePersistedRef(computed(() => `smart_pe_update_settings_${schoolId.value}`), {
  autoCheck: true,
  notifyType: 'both',
  checkFrequency: 'daily'
})

const frequencyText = computed(() => {
  const map = { startup: '每次启动', daily: '每天', weekly: '每周', manual: '手动' }
  return map[updateSettings.value.checkFrequency] || updateSettings.value.checkFrequency
})

/* ---- Update type helpers ---- */
const getUpdateTypeText = (type) => ({ feature: '新功能', fix: '修复', optimize: '优化' }[type] || '更新')
const getUpdateTypeTag = (type) => ({ feature: 'success', fix: 'danger', optimize: 'warning' }[type] || 'info')

/* ---- Check update with progress dialog ---- */
const checkUpdate = () => {
  checking.value = true
  progressTitle.value = '检查更新'
  progressComplete.value = false
  progressSteps.value = [
    { name: '连接更新服务器', status: 'active', percent: 0, color: '#1E5AA8' },
    { name: '比对版本信息', status: 'waiting', percent: 0 },
    { name: '生成检查报告', status: 'waiting', percent: 0 }
  ]
  showProgressDialog.value = true

  // Step 1: connect
  let p = 0
  const t1 = setInterval(() => {
    p += Math.random() * 25 + 10
    if (p >= 100) { p = 100; clearInterval(t1) }
    progressSteps.value[0].percent = Math.round(p)
  }, 200)

  setTimeout(() => {
    progressSteps.value[0].status = 'done'
    progressSteps.value[0].percent = 100
    // Step 2: compare
    progressSteps.value[1].status = 'active'
    progressSteps.value[1].percent = 0
    let p2 = 0
    const t2 = setInterval(() => {
      p2 += Math.random() * 30 + 15
      if (p2 >= 100) { p2 = 100; clearInterval(t2) }
      progressSteps.value[1].percent = Math.round(p2)
    }, 200)

    setTimeout(() => {
      progressSteps.value[1].status = 'done'
      progressSteps.value[1].percent = 100
      // Step 3: report
      progressSteps.value[2].status = 'active'
      progressSteps.value[2].percent = 0
      let p3 = 0
      const t3 = setInterval(() => {
        p3 += Math.random() * 40 + 20
        if (p3 >= 100) { p3 = 100; clearInterval(t3) }
        progressSteps.value[2].percent = Math.round(p3)
      }, 150)

      setTimeout(() => {
        progressSteps.value[2].status = 'done'
        progressSteps.value[2].percent = 100
        checking.value = false
        if (latestVersion.value) {
          progressTitle.value = `发现新版本 ${latestVersion.value.version}`
          ElMessage.success(`检测到新版本 ${latestVersion.value.version}`)
        } else {
          progressTitle.value = '检查完成'
          ElMessage.success('当前已是最新版本')
        }
      }, 1200)
    }, 1500)
  }, 1500)
}

/* ---- Download update with progress dialog ---- */
const downloadUpdate = () => {
  if (!latestVersion.value) {
    ElMessage.warning('当前已是最新版本')
    return
  }
  progressTitle.value = `正在更新到 ${latestVersion.value.version}`
  progressComplete.value = false
  progressSteps.value = [
    { name: '下载更新包', status: 'active', percent: 0, color: '#1E5AA8' },
    { name: '校验文件完整性', status: 'waiting', percent: 0 },
    { name: '安装更新', status: 'waiting', percent: 0 },
    { name: '清理临时文件', status: 'waiting', percent: 0 }
  ]
  showProgressDialog.value = true

  // Step 1: download
  let p = 0
  const t1 = setInterval(() => {
    p += Math.random() * 8 + 3
    if (p >= 100) { p = 100; clearInterval(t1) }
    progressSteps.value[0].percent = Math.round(p)
  }, 250)

  setTimeout(() => {
    progressSteps.value[0].status = 'done'
    progressSteps.value[0].percent = 100
    // Step 2: verify
    progressSteps.value[1].status = 'active'
    progressSteps.value[1].percent = 0
    let p2 = 0
    const t2 = setInterval(() => {
      p2 += Math.random() * 35 + 20
      if (p2 >= 100) { p2 = 100; clearInterval(t2) }
      progressSteps.value[1].percent = Math.round(p2)
    }, 200)

    setTimeout(() => {
      progressSteps.value[1].status = 'done'
      progressSteps.value[1].percent = 100
      // Step 3: install
      progressSteps.value[2].status = 'active'
      progressSteps.value[2].percent = 0
      let p3 = 0
      const t3 = setInterval(() => {
        p3 += Math.random() * 15 + 5
        if (p3 >= 100) { p3 = 100; clearInterval(t3) }
        progressSteps.value[2].percent = Math.round(p3)
      }, 300)

      setTimeout(() => {
        progressSteps.value[2].status = 'done'
        progressSteps.value[2].percent = 100
        // Step 4: cleanup
        progressSteps.value[3].status = 'active'
        progressSteps.value[3].percent = 0
        let p4 = 0
        const t4 = setInterval(() => {
          p4 += Math.random() * 50 + 30
          if (p4 >= 100) { p4 = 100; clearInterval(t4) }
          progressSteps.value[3].percent = Math.round(p4)
        }, 150)

        setTimeout(() => {
          progressSteps.value[3].status = 'done'
          progressSteps.value[3].percent = 100
          progressComplete.value = true
          progressTitle.value = '更新完成'
          // Apply the update to data
          versionData.value.current = { ...latestVersion.value, isLatest: true }
          // Move old current to history
          const oldCurrent = { ...latestVersion.value }
          delete oldCurrent.isLatest
          versionData.value.history.unshift({
            version: oldCurrent.version,
            releaseDate: oldCurrent.releaseDate,
            size: oldCurrent.size,
            type: 'feature',
            description: '版本更新',
            forceUpdate: oldCurrent.forceUpdate || false
          })
          versionData.value.latest = null
          ElMessage.success('系统更新完成，请刷新页面')
        }, 1000)
      }, 2800)
    }, 1200)
  }, 4000)
}

const remindLater = () => {
  showProgressDialog.value = false
  ElMessage.info('已设置稍后提醒，下次启动时将再次检查更新')
}

const finishUpdate = () => {
  showProgressDialog.value = false
  ElMessage.success('更新已完成，建议刷新页面以加载最新版本')
}

/* ---- Version detail dialog ---- */
const viewVersionDetail = (row) => {
  selectedVersion.value = row
  showVersionDetail.value = true
}

const saveSettings = () => {
  ElMessage.success('设置已保存')
}

onMounted(() => {})
</script>

<style scoped>
.version-management {
  min-height: calc(100vh - 140px);
}

.page-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.stats-row {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
  color: #1E5AA8;
}

.stat-label {
  font-size: 12px;
  color: #6B7280;
}

.stat-divider {
  width: 1px;
  height: 48px;
  background: #E8EAED;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.info-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.wide-card {
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



.version-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.version-row {
  display: flex;
  gap: 16px;
}

.label {
  width: 100px;
  font-size: 14px;
  color: #6B7280;
  flex-shrink: 0;
}

.value {
  font-size: 14px;
  color: #1A1A2E;
  flex: 1;
}

.version-num {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A2E;
}

.changelog-list {
  margin: 0;
  padding-left: 20px;
}

.changelog-list li {
  font-size: 14px;
  color: #1A1A2E;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.type-tag {
  flex-shrink: 0;
}

.version-text {
  font-size: 14px;
  font-weight: 600;
  color: #1E5AA8;
}

.settings-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #F0F0F0;
}

.setting-label {
  font-size: 14px;
  color: #1A1A2E;
}

/* ---- Progress dialog ---- */
.progress-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 12px 0;
}

.progress-step {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  opacity: 0.45;
  transition: opacity 0.3s;
}

.progress-step.active,
.progress-step.done {
  opacity: 1;
}

.step-indicator {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 2px;
}

.step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #D9D9D9;
}

.step-info {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.step-name {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.step-done-text {
  font-size: 13px;
  color: #67C23A;
}

/* ---- Version detail dialog ---- */
.version-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.detail-version {
  font-size: 22px;
  font-weight: 700;
  color: #1E5AA8;
}

.detail-meta {
  display: flex;
  gap: 24px;
  font-size: 13px;
  color: #6B7280;
}

.detail-desc p {
  font-size: 14px;
  color: #1A1A2E;
  line-height: 1.8;
  margin: 0;
}

.detail-section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 8px;
}

.detail-changelog ul {
  margin: 0;
  padding-left: 20px;
}

.detail-changelog li {
  font-size: 14px;
  color: #1A1A2E;
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}
</style>
