<template>
  <div class="backup-restore-page">
    <div class="page-header">
      <h2>数据备份与恢复</h2>
      <p class="subtitle">定期备份数据，确保数据安全，支持一键恢复</p>
    </div>

    <div class="content-section">
      <!-- 手动备份 -->
      <div class="backup-card">
        <div class="card-header">
          <div class="header-left">
            <div class="icon-box blue">
              <el-icon><Coin /></el-icon>
            </div>
            <div class="header-text">
              <h3>手动备份</h3>
              <span class="tip">建议每周至少备份一次</span>
            </div>
          </div>
        </div>
        <div class="backup-info">
          <div class="info-item">
            <span class="info-label">上次备份时间</span>
            <span class="info-value">{{ lastBackupTime }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">备份文件大小</span>
            <span class="info-value">{{ lastBackupSize }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">备份状态</span>
            <span :class="['info-value', 'status-badge', backupStatus]">
              <el-icon v-if="backupStatus === 'success'"><CircleCheck /></el-icon>
              <el-icon v-else><Warning /></el-icon>
              {{ backupStatus === 'success' ? '备份正常' : '需要备份' }}
            </span>
          </div>
        </div>
        <div class="backup-actions">
          <el-button 
            type="primary" 
            :icon="UploadFilled" 
            :loading="isBackingUp"
            size="large"
            @click="performBackup"
          >
            {{ isBackingUp ? '备份中...' : '立即备份' }}
          </el-button>
          <el-button 
            type="default" 
            :icon="Download" 
            size="large"
            @click="downloadBackup"
            :disabled="!lastBackupTime"
          >
            下载备份文件
          </el-button>
        </div>
      </div>

      <!-- 自动备份 -->
      <div class="auto-backup-card">
        <div class="card-header">
          <div class="header-left">
            <div class="icon-box green">
              <el-icon><Clock /></el-icon>
            </div>
            <div class="header-text">
              <h3>自动备份设置</h3>
              <span class="tip">{{ autoBackupEnabled ? '已开启自动备份' : '自动备份已关闭' }}</span>
            </div>
          </div>
          <el-switch 
            v-model="autoBackupEnabled" 
            @change="toggleAutoBackup"
            size="large"
          />
        </div>
        <div class="auto-backup-settings" v-if="autoBackupEnabled">
          <div class="setting-row">
            <div class="setting-item">
              <label>备份频率</label>
              <el-select v-model="backupFrequency" style="width: 140px">
                <el-option label="每天" value="daily">
                  <el-icon><Calendar /></el-icon> 每天
                </el-option>
                <el-option label="每周" value="weekly">
                  <el-icon><Calendar /></el-icon> 每周
                </el-option>
                <el-option label="每月" value="monthly">
                  <el-icon><Calendar /></el-icon> 每月
                </el-option>
              </el-select>
            </div>
            <div class="setting-item">
              <label>备份时间</label>
              <el-time-picker v-model="backupTime" format="HH:mm" style="width: 140px" />
            </div>
            <div class="setting-item">
              <label>保留份数</label>
              <el-input-number v-model="keepCount" :min="1" :max="30" style="width: 140px" />
            </div>
          </div>
          <el-button type="primary" @click="saveAutoBackupSettings" :icon="Check">
            保存设置
          </el-button>
        </div>
        <div v-else class="disabled-hint">
          <el-icon><InfoFilled /></el-icon>
          <span>开启自动备份后，系统将按设定频率自动执行备份任务</span>
        </div>
      </div>

      <!-- 数据恢复 -->
      <div class="restore-card">
        <div class="card-header">
          <div class="header-left">
            <div class="icon-box orange">
              <el-icon><RefreshLeft /></el-icon>
            </div>
            <div class="header-text">
              <h3>数据恢复</h3>
              <span class="tip warning-text">恢复操作将覆盖当前数据，请谨慎操作</span>
            </div>
          </div>
        </div>
        <div class="restore-content">
          <p class="restore-desc">选择备份文件进行恢复，支持 .bak 格式的备份文件</p>
          <div class="file-upload-wrapper">
            <el-upload
              class="upload-demo"
              drag
              :action="''"
              :auto-upload="false"
              :on-change="handleFileChange"
              accept=".bak"
            >
              <el-icon class="el-icon--upload"><Upload /></el-icon>
              <div class="el-upload__text">点击或拖拽文件到此处上传</div>
              <div class="el-upload__tip">仅支持 .bak 格式文件</div>
            </el-upload>
          </div>
          <div v-if="selectedFile" class="selected-file">
            <div class="file-info">
              <el-icon class="file-icon"><Document /></el-icon>
              <div class="file-meta">
                <span class="file-name">{{ selectedFile.name }}</span>
                <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
              </div>
            </div>
            <el-button text type="danger" :icon="Delete" @click="clearFile">移除</el-button>
          </div>
        </div>
        <div class="restore-actions">
          <el-button 
            type="danger" 
            :icon="RefreshLeft" 
            :loading="isRestoring"
            size="large"
            :disabled="!selectedFile"
            @click="confirmRestore"
          >
            {{ isRestoring ? '恢复中...' : '确认恢复' }}
          </el-button>
        </div>
      </div>

      <!-- 备份历史 -->
      <div class="backup-history-card">
        <div class="card-header">
          <div class="header-left">
            <div class="icon-box purple">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="header-text">
              <h3>备份历史记录</h3>
              <span class="tip">共 {{ backupHistory.length }} 条记录</span>
            </div>
          </div>
        </div>
        <ExamTable
          :data="backupHistory"
          :columns="backupColumns"
          :title="''"
          :show-header="false"
          :searchable="false"
          :show-refresh="false"
          :show-pagination="true"
          :page-sizes="[5, 10, 20]"
          :default-page-size="10"
          :show-selection="false"
        >
          <template #time="{ row }">
            <div class="time-cell">
              <el-icon><Clock /></el-icon>
              <span>{{ row.time }}</span>
            </div>
          </template>
          <template #size="{ row }">
            <span class="size-cell">{{ row.size }}</span>
          </template>
          <template #type="{ row }">
            <el-tag :type="row.type === 'auto' ? 'primary' : 'success'" size="small" effect="light">
              <el-icon v-if="row.type === 'auto'"><Timer /></el-icon>
              <el-icon v-else><Coin /></el-icon>
              {{ row.type === 'auto' ? '自动备份' : '手动备份' }}
            </el-tag>
          </template>
          <template #status="{ row }">
            <el-tag :type="row.status === 'success' ? 'success' : 'danger'" size="small" effect="light">
              <el-icon v-if="row.status === 'success'"><CircleCheck /></el-icon>
              <el-icon v-else><CircleClose /></el-icon>
              {{ row.status === 'success' ? '成功' : '失败' }}
            </el-tag>
          </template>
          <template #actions="{ row }">
            <el-button text type="primary" size="small" :icon="Download" @click="downloadBackupFile(row)">下载</el-button>
            <el-button text type="danger" size="small" :icon="Delete" @click="deleteBackupFile(row)">删除</el-button>
          </template>
        </ExamTable>
      </div>
    </div>

    <!-- 确认恢复弹窗 -->
    <el-dialog v-model="confirmDialogVisible" title="数据恢复确认" width="480px" :show-close="false" class="restore-dialog">
      <div class="confirm-content">
        <div class="warning-icon">
          <el-icon><WarningFilled /></el-icon>
        </div>
        <h4>数据恢复确认</h4>
        <p class="desc">您即将从备份文件恢复数据，此操作将覆盖当前所有数据，且无法撤销。</p>
        <div class="file-info-box">
          <el-icon><Document /></el-icon>
          <span>{{ selectedFile?.name }}</span>
        </div>
        <el-input 
          v-model="confirmCode" 
          placeholder="请输入确认码 'CONFIRM' 以继续"
          class="confirm-input"
          size="large"
        />
      </div>
      <template #footer>
        <el-button @click="confirmDialogVisible = false" size="large">取消</el-button>
        <el-button 
          type="danger" 
          size="large"
          @click="performRestore"
          :disabled="confirmCode !== 'CONFIRM'"
          :icon="RefreshLeft"
        >确认恢复</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  Coin, UploadFilled, Download, Clock, RefreshLeft,
  Upload, Document, Timer, Warning, CircleCheck,
  CircleClose, WarningFilled, InfoFilled, Check, Delete, Calendar
} from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import ExamTable from '@/components/table/ExamTable.vue'
import { usePersistedRef } from '@/composables/usePersistedRef'
import { useOperationLog } from '@/composables/useOperationLog'
import { MOCK_BACKUP_HISTORY, MOCK_BACKUP_SETTINGS } from '@/data/mockData'
import store from '@/store/global'
import { generateDeterministicId } from '@/utils/seededRandom'

const { addLog } = useOperationLog('system')

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const isBackingUp = ref(false)
const isRestoring = ref(false)
const selectedFile = ref(null)
const confirmDialogVisible = ref(false)
const confirmCode = ref('')

// 表格列配置
const backupColumns = ref([
  { slot: 'time', label: '备份时间', minWidth: '200' },
  { slot: 'size', label: '文件大小', minWidth: '120' },
  { slot: 'type', label: '备份类型', minWidth: '120' },
  { slot: 'status', label: '状态', minWidth: '100', align: 'center' },
])

// 持久化备份设置
const backupSettings = usePersistedRef(computed(() => `smart_pe_backup_settings_${schoolId.value}`), { ...MOCK_BACKUP_SETTINGS })
const lastBackupTime = ref(backupSettings.value.lastBackupTime)
const lastBackupSize = ref(backupSettings.value.lastBackupSize)
const backupStatus = ref(backupSettings.value.backupStatus)
const autoBackupEnabled = ref(backupSettings.value.autoBackupEnabled)
const backupFrequency = ref(backupSettings.value.backupFrequency)
const backupTime = ref(new Date('2026-07-16T22:00:00'))
const keepCount = ref(backupSettings.value.keepCount)

// 持久化备份历史
const backupHistory = usePersistedRef(computed(() => `smart_pe_backup_history_${schoolId.value}`), [...MOCK_BACKUP_HISTORY])

const calculateBackupSize = () => {
  let totalBytes = 0
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && key.includes(schoolId.value)) {
      const value = sessionStorage.getItem(key)
      if (value) {
        totalBytes += new Blob([value]).size
      }
    }
  }
  // Add a base overhead for system data not keyed by schoolId
  totalBytes += 1024 * 1024 * 50 // ~50 MB baseline for media references and indexes
  if (totalBytes < 1024 * 1024) {
    return (totalBytes / 1024).toFixed(1) + ' KB'
  }
  return (totalBytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const performBackup = () => {
  isBackingUp.value = true
  setTimeout(() => {
    try {
      const backupData = collectBackupData()
      const backupJson = JSON.stringify(backupData, null, 2)
      const blob = new Blob([backupJson], { type: 'application/json' })
      const fileUrl = URL.createObjectURL(blob)
      
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const fileName = `smart_pe_backup_${schoolId.value}_${timestamp}.bak`
      
      const a = document.createElement('a')
      a.href = fileUrl
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(fileUrl)
      
      const backupSize = calculateBackupSize()
      lastBackupTime.value = new Date().toLocaleString('zh-CN')
      lastBackupSize.value = backupSize
      backupStatus.value = 'success'
      
      backupSettings.value.lastBackupTime = lastBackupTime.value
      backupSettings.value.lastBackupSize = lastBackupSize.value
      backupSettings.value.backupStatus = backupStatus.value
      
      const backupRecord = {
        id: generateDeterministicId('backup', fileName),
        time: new Date().toLocaleString('zh-CN'),
        size: backupSize,
        type: 'manual',
        status: 'success',
        fileName: fileName,
        data: backupData
      }
      backupHistory.value.unshift(backupRecord)
      
      if (backupHistory.value.length > keepCount.value) {
        backupHistory.value = backupHistory.value.slice(0, keepCount.value)
      }
      
      ElMessage.success('备份成功，文件已下载')
      addLog('数据备份', '', '执行数据备份')
    } catch (error) {
      console.error('备份失败:', error)
      ElMessage.error('备份失败，请重试')
      backupStatus.value = 'warning'
    }
    isBackingUp.value = false
  }, 500)
}

const collectBackupData = () => {
  const data = {}
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i)
    if (key && key.includes(schoolId.value)) {
      const value = sessionStorage.getItem(key)
      if (value) {
        try {
          data[key] = JSON.parse(value)
        } catch {
          data[key] = value
        }
      }
    }
  }
  return {
    schoolId: schoolId.value,
    timestamp: Date.now(),
    data: data,
    version: '1.0.0'
  }
}

const downloadBackup = () => {
  if (!lastBackupTime.value) {
    ElMessage.warning('暂无备份文件，请先执行备份')
    return
  }
  
  const latestBackup = backupHistory.value.find(h => h.status === 'success' && h.data)
  if (latestBackup && latestBackup.data) {
    const backupJson = JSON.stringify(latestBackup.data, null, 2)
    const blob = new Blob([backupJson], { type: 'application/json' })
    const fileUrl = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = fileUrl
    a.download = latestBackup.fileName || `smart_pe_backup_${schoolId.value}_${lastBackupTime.value}.bak`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(fileUrl)
    
    ElMessage.success('备份文件已下载')
  } else {
    const backupData = collectBackupData()
    const backupJson = JSON.stringify(backupData, null, 2)
    const blob = new Blob([backupJson], { type: 'application/json' })
    const fileUrl = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = fileUrl
    a.download = `smart_pe_backup_${schoolId.value}_${lastBackupTime.value}.bak`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(fileUrl)
    
    ElMessage.success('备份文件已下载')
  }
}

const toggleAutoBackup = (val) => {
  backupSettings.value.autoBackupEnabled = val
  ElMessage.info(val ? '已开启自动备份' : '已关闭自动备份')
}

const saveAutoBackupSettings = () => {
  backupSettings.value.autoBackupEnabled = autoBackupEnabled.value
  backupSettings.value.backupFrequency = backupFrequency.value
  backupSettings.value.keepCount = keepCount.value
  ElMessage.success('自动备份设置已保存')
}

const handleFileChange = (file) => {
  selectedFile.value = file.raw
}

const clearFile = () => {
  selectedFile.value = null
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const confirmRestore = () => {
  confirmDialogVisible.value = true
}

const performRestore = () => {
  if (!selectedFile.value) return
  
  isRestoring.value = true
  confirmDialogVisible.value = false
  
  const fileName = selectedFile.value.name
  const fileSize = selectedFile.value.size
  
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const backupJson = e.target.result
      const backupData = JSON.parse(backupJson)
      
      if (!backupData || !backupData.data || !backupData.schoolId) {
        throw new Error('无效的备份文件格式')
      }
      
      if (backupData.schoolId !== schoolId.value) {
        throw new Error(`备份文件属于${backupData.schoolId}，与当前学校不匹配`)
      }
      
      for (const [key, value] of Object.entries(backupData.data)) {
        if (typeof value === 'string') {
          sessionStorage.setItem(key, value)
        } else {
          sessionStorage.setItem(key, JSON.stringify(value))
        }
      }
      
      isRestoring.value = false
      confirmCode.value = ''
      selectedFile.value = null
      
      lastBackupTime.value = new Date().toLocaleString('zh-CN')
      backupSettings.value.lastBackupTime = lastBackupTime.value
      backupSettings.value.backupStatus = 'success'
      
      backupHistory.value.unshift({
        id: generateDeterministicId('restore', fileName),
        time: new Date().toLocaleString('zh-CN'),
        size: formatFileSize(fileSize),
        type: 'restore',
        status: 'success',
        fileName: fileName,
        data: backupData
      })
      
      ElMessage.success('数据恢复成功，页面将刷新')
      addLog('数据恢复', '', `从备份文件"${fileName}"恢复数据`)
      
      setTimeout(() => {
        window.location.reload()
      }, 1000)
      
    } catch (error) {
      console.error('恢复失败:', error)
      isRestoring.value = false
      ElMessage.error(`恢复失败：${error.message}`)
    }
  }
  
  reader.onerror = () => {
    isRestoring.value = false
    ElMessage.error('读取备份文件失败')
  }
  
  reader.readAsText(selectedFile.value)
}

const downloadBackupFile = (row) => {
  if (row.data) {
    const backupJson = JSON.stringify(row.data, null, 2)
    const blob = new Blob([backupJson], { type: 'application/json' })
    const fileUrl = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = fileUrl
    a.download = row.fileName || `smart_pe_backup_${schoolId.value}_${row.time}.bak`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(fileUrl)
    
    ElMessage.success(`备份文件已下载`)
  } else {
    ElMessage.warning('该备份记录没有保存数据，无法下载')
  }
}

const deleteBackupFile = (row) => {
  ElMessageBox.confirm(
    '确定要删除此备份文件吗？删除后无法恢复。',
    '删除确认',
    { 
      type: 'warning',
      confirmButtonText: '确认删除',
      cancelButtonText: '取消'
    }
  ).then(() => {
    backupHistory.value = backupHistory.value.filter(h => h.id !== row.id)
    ElMessage.success('删除成功')
    addLog('删除备份', row.time, `删除备份文件"${row.time}"`)
  }).catch(() => { ElMessage.error('删除备份记录失败，请重试') })
}
</script>

<style scoped>
.backup-restore-page {
  padding: 24px;
  background: linear-gradient(180deg, #F8FAFC 0%, #F1F5F9 100%);
  min-height: 100vh;
}

.page-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  font-weight: 700;
  color: #0F172A;
  letter-spacing: -0.02em;
}

.subtitle {
  margin: 0;
  color: #64748B;
  font-size: 14px;
}

.content-section {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  max-width: 100%;
  overflow: hidden;
}

/* 卡片通用样式 */
.backup-card,
.auto-backup-card,
.restore-card,
.backup-history-card {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 4px 12px rgba(0, 0, 0, 0.02);
  padding: 24px;
  border: 1px solid #E2E8F0;
  transition: box-shadow 0.2s ease;
}

.backup-card:hover,
.auto-backup-card:hover,
.restore-card:hover,
.backup-history-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06), 0 8px 24px rgba(0, 0, 0, 0.03);
}

.backup-history-card {
  grid-column: span 2;
  max-width: 100%;
  overflow: hidden;
}

.backup-history-card .card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #F1F5F9;
}

.backup-history-card .header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.backup-history-card .icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.backup-history-card .icon-box.purple {
  background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%);
  color: #7C3AED;
}

.backup-history-card .header-text h3 {
  margin: 0 0 2px 0;
  font-size: 16px;
  font-weight: 600;
  color: #0F172A;
}

.backup-history-card .tip {
  font-size: 12px;
  color: #94A3B8;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.icon-box {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
}

.icon-box.blue {
  background: linear-gradient(135deg, #DBEAFE 0%, #BFDBFE 100%);
  color: #2563EB;
}

.icon-box.green {
  background: linear-gradient(135deg, #DCFCE7 0%, #BBF7D0 100%);
  color: #16A34A;
}

.icon-box.orange {
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  color: #D97706;
}

.icon-box.purple {
  background: linear-gradient(135deg, #EDE9FE 0%, #DDD6FE 100%);
  color: #7C3AED;
}

.header-text h3 {
  margin: 0 0 2px 0;
  font-size: 16px;
  font-weight: 600;
  color: #0F172A;
}

.tip {
  font-size: 12px;
  color: #94A3B8;
}

.warning-text {
  color: #DC2626;
}

/* 备份信息 */
.backup-info {
  display: flex;
  gap: 24px;
  margin-bottom: 24px;
  padding: 16px;
  background: #F8FAFC;
  border-radius: 12px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
}

.info-label {
  font-size: 12px;
  color: #94A3B8;
  font-weight: 500;
}

.info-value {
  font-size: 15px;
  font-weight: 600;
  color: #0F172A;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  width: fit-content;
}

.status-badge.success {
  background: #DCFCE7;
  color: #16A34A;
}

.status-badge.warning {
  background: #FEF3C7;
  color: #D97706;
}

/* 操作按钮 */
.backup-actions,
.restore-actions {
  display: flex;
  gap: 12px;
}

/* 自动备份设置 */
.auto-backup-settings {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.setting-row {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.setting-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item label {
  font-size: 13px;
  color: #64748B;
  font-weight: 500;
}

.disabled-hint {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 20px;
  background: #F8FAFC;
  border-radius: 12px;
  color: #94A3B8;
  font-size: 13px;
}

/* 恢复区域 */
.restore-content {
  margin-bottom: 20px;
}

.restore-desc {
  margin: 0 0 16px 0;
  color: #64748B;
  font-size: 14px;
}

.file-upload-wrapper {
  margin-bottom: 16px;
}

.upload-demo :deep(.el-upload-dragger) {
  border-radius: 12px;
  border: 2px dashed #CBD5E1;
  background: #F8FAFC;
  transition: all 0.2s ease;
}

.upload-demo :deep(.el-upload-dragger:hover) {
  border-color: #3B82F6;
  background: #EFF6FF;
}

.upload-demo :deep(.el-icon--upload) {
  font-size: 48px;
  color: #94A3B8;
  margin-bottom: 8px;
}

.selected-file {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: #F0FDF4;
  border: 1px solid #BBF7D0;
  border-radius: 12px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.file-icon {
  font-size: 24px;
  color: #16A34A;
}

.file-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: #0F172A;
}

.file-size {
  color: #94A3B8;
  font-size: 12px;
}

/* 历史记录表格 */
.history-table {
  border-radius: 8px;
  overflow: hidden;
}

.history-table :deep(.el-table__header th) {
  background: #F8FAFC;
  color: #475569;
  font-weight: 600;
  font-size: 13px;
}

.time-cell {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #475569;
}

.size-cell {
  color: #64748B;
  font-weight: 500;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  padding-top: 16px;
  margin-top: 8px;
  border-top: 1px solid #F1F5F9;
}

/* 确认弹窗 */
.restore-dialog :deep(.el-dialog__header) {
  text-align: center;
  padding-bottom: 0;
}

.restore-dialog :deep(.el-dialog__title) {
  font-weight: 600;
  font-size: 18px;
}

.confirm-content {
  text-align: center;
  padding: 8px 16px 16px;
}

.warning-icon {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 20px;
  font-size: 36px;
  color: #D97706;
  box-shadow: 0 4px 12px rgba(217, 119, 6, 0.15);
}

.confirm-content h4 {
  margin: 0 0 12px 0;
  font-size: 18px;
  font-weight: 600;
  color: #0F172A;
}

.confirm-content .desc {
  margin: 0 0 16px 0;
  color: #64748B;
  font-size: 14px;
  line-height: 1.6;
}

.file-info-box {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  background: #F8FAFC;
  padding: 12px 20px;
  border-radius: 10px;
  margin: 16px 0;
  font-size: 14px;
  color: #475569;
  font-weight: 500;
}

.file-info-box .el-icon {
  color: #3B82F6;
  font-size: 18px;
}

.confirm-input {
  margin-top: 16px;
}

.confirm-input :deep(.el-input__wrapper) {
  border-radius: 10px;
}

/* 响应式 */
@media (max-width: 1024px) {
  .content-section {
    grid-template-columns: 1fr;
  }
  .backup-history-card {
    grid-column: span 1;
  }
  .setting-row {
    flex-direction: column;
  }
}

/* 备份历史表格样式 */
.backup-history-card :deep(.el-table) {
  width: 100%;
}

.backup-history-card :deep(.el-pagination) {
  margin-top: 16px;
  justify-content: flex-end;
}
</style>