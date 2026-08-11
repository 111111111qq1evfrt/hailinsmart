<template>
  <div class="score-migration-container">
    <div class="migration-header">
      <h3 class="migration-title">成绩迁移配置</h3>
      <el-button type="primary" @click="startMigration">开始迁移</el-button>
    </div>
    
    <div class="migration-content">
      <div class="migration-section">
        <h4 class="section-title">迁移目标</h4>
        <div class="target-selector">
          <div class="target-item" :class="{ active: migration.target === 'exam' }" @click="migration.target = 'exam'">
            <span class="target-icon">🏆</span>
            <span class="target-label">迁移至考试系统</span>
          </div>
          <div class="target-item" :class="{ active: migration.target === 'test' }" @click="migration.target = 'test'">
            <span class="target-icon">📊</span>
            <span class="target-label">迁移至体测系统</span>
          </div>
        </div>
      </div>

      <div class="migration-section">
        <h4 class="section-title">源数据选择</h4>
        
        <div class="source-selector">
          <div class="selector-item" :class="{ active: migration.sourceType === 'local' }" @click="migration.sourceType = 'local'">
            <div class="selector-icon">
              <Document />
            </div>
            <span class="selector-label">本地练习数据</span>
          </div>

          <div class="selector-item" :class="{ active: migration.sourceType === 'file' }" @click="migration.sourceType = 'file'">
            <div class="selector-icon">
              <Upload />
            </div>
            <span class="selector-label">上传文件</span>
          </div>
          
          <div class="selector-item" :class="{ active: migration.sourceType === 'database' }" @click="migration.sourceType = 'database'">
            <div class="selector-icon">
              <Folder />
            </div>
            <span class="selector-label">数据库导入</span>
          </div>
          
          <div class="selector-item" :class="{ active: migration.sourceType === 'api' }" @click="migration.sourceType = 'api'">
            <div class="selector-icon">
              <Link />
            </div>
            <span class="selector-label">API接口</span>
          </div>
        </div>
        
        <div v-if="migration.sourceType === 'local'" class="local-data-preview">
          <div class="preview-summary">
            <span class="summary-label">可用练习记录：</span>
            <span class="summary-count">{{ localPracticeRecords.length }} 条</span>
            <span class="summary-migrated">（已迁移 {{ localPracticeRecords.filter(r => r.migrated).length }} 条）</span>
          </div>
          <el-table :data="localPracticeRecords.filter(r => !r.migrated)" stripe size="small" max-height="240" style="margin-top: 12px">
            <el-table-column prop="studentName" label="学生" min-width="80" />
            <el-table-column prop="event" label="项目" min-width="80" />
            <el-table-column prop="score" label="成绩" min-width="80" />
            <el-table-column prop="date" label="日期" min-width="100" />
            <el-table-column prop="status" label="状态" min-width="70" />
          </el-table>
        </div>

        <div v-if="migration.sourceType === 'file'" class="file-upload">
          <el-upload 
            class="upload-demo"
            action="#"
            :auto-upload="false"
            :show-file-list="false"
            @change="handleFileChange"
          >
            <el-button type="primary" :icon="Upload">选择文件</el-button>
          </el-upload>
          <div v-if="selectedFile" class="file-info">
            <span class="file-name">{{ selectedFile.name }}</span>
            <span class="file-size">{{ formatFileSize(selectedFile.size) }}</span>
          </div>
        </div>
        
        <div v-if="migration.sourceType === 'database'" class="db-config">
          <div class="config-row">
            <label class="config-label">数据库类型</label>
            <el-select v-model="migration.dbType">
              <el-option label="MySQL" value="mysql" />
              <el-option label="SQL Server" value="mssql" />
              <el-option label="Oracle" value="oracle" />
            </el-select>
          </div>
          <div class="config-row">
            <label class="config-label">服务器地址</label>
            <el-input v-model="migration.dbHost" placeholder="localhost" />
          </div>
          <div class="config-row">
            <label class="config-label">端口</label>
            <el-input v-model="migration.dbPort" placeholder="3306" />
          </div>
          <div class="config-row">
            <label class="config-label">数据库名</label>
            <el-input v-model="migration.dbName" />
          </div>
          <div class="config-row">
            <label class="config-label">用户名</label>
            <el-input v-model="migration.dbUser" />
          </div>
          <div class="config-row">
            <label class="config-label">密码</label>
            <el-input v-model="migration.dbPassword" type="password" />
          </div>
        </div>
        
        <div v-if="migration.sourceType === 'api'" class="api-config">
          <div class="config-row">
            <label class="config-label">API地址</label>
            <el-input v-model="migration.apiUrl" />
          </div>
          <div class="config-row">
            <label class="config-label">请求方式</label>
            <el-select v-model="migration.apiMethod">
              <el-option label="GET" value="get" />
              <el-option label="POST" value="post" />
            </el-select>
          </div>
          <div class="config-row">
            <label class="config-label">认证方式</label>
            <el-select v-model="migration.authType">
              <el-option label="无" value="none" />
              <el-option label="API Key" value="apikey" />
              <el-option label="Bearer Token" value="bearer" />
            </el-select>
          </div>
          <div v-if="migration.authType !== 'none'" class="config-row">
            <label class="config-label">认证信息</label>
            <el-input v-model="migration.authValue" type="password" />
          </div>
        </div>
      </div>
      
      <div class="migration-section">
        <h4 class="section-title">字段映射</h4>
        
        <div class="field-mapping">
          <div class="mapping-header">
            <span class="mapping-col">源字段</span>
            <span class="mapping-col">目标字段</span>
            <span class="mapping-col">操作</span>
          </div>
          
          <div 
            v-for="(mapping, index) in migration.fieldMappings" 
            :key="index"
            class="mapping-row"
          >
            <span class="mapping-col">
              <el-select v-model="mapping.source">
                <el-option v-for="field in sourceFields" :key="field" :label="field" :value="field" />
              </el-select>
            </span>
            <span class="mapping-col">
              <el-select v-model="mapping.target">
                <el-option v-for="field in targetFields" :key="field" :label="field" :value="field" />
              </el-select>
            </span>
            <span class="mapping-col">
              <el-button text size="mini" type="danger" @click="removeMapping(index)">删除</el-button>
            </span>
          </div>
          
          <div class="mapping-row add-row">
            <el-button text size="small" @click="addMapping">+ 添加映射</el-button>
          </div>
        </div>
      </div>
      
      <div class="migration-section">
        <h4 class="section-title">迁移选项</h4>
        
        <div class="migration-options">
          <div class="option-item">
            <el-switch v-model="migration.overwrite" />
            <span class="option-label">覆盖已有数据</span>
          </div>
          
          <div class="option-item">
            <el-switch v-model="migration.validate" />
            <span class="option-label">数据验证</span>
          </div>
          
          <div class="option-item">
            <el-switch v-model="migration.logEnabled" />
            <span class="option-label">生成日志</span>
          </div>
          
          <div class="option-item">
            <el-switch v-model="migration.sendNotification" />
            <span class="option-label">发送通知</span>
          </div>
        </div>
      </div>
      
      <div v-if="migrationStatus" class="migration-status">
        <h4 class="section-title">迁移状态</h4>
        <div class="status-content">
          <div class="progress-info">
            <span class="progress-text">{{ migrationStatus.text }}</span>
            <span class="progress-percent">{{ migrationStatus.percent }}%</span>
          </div>
          <el-progress :percentage="migrationStatus.percent" :status="migrationStatus.status" />
          <div v-if="migrationStatus.details" class="status-details">
            <span>成功: {{ migrationStatus.details.success }}</span>
            <span>失败: {{ migrationStatus.details.failed }}</span>
            <span>跳过: {{ migrationStatus.details.skipped }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { Upload, Folder, Link, Document } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import store from '../../store/global'
import { getSchoolMockData } from '../../utils/mockDataLoader'
import { createSeededRandom } from '@/utils/seededRandom'

const selectedFile = ref(null)

const migration = reactive({
  sourceType: 'local',
  target: 'exam',
  
  dbType: 'mysql',
  dbHost: '',
  dbPort: '',
  dbName: '',
  dbUser: '',
  dbPassword: '',
  
  apiUrl: '',
  apiMethod: 'get',
  authType: 'none',
  authValue: '',
  
  fieldMappings: [
    { source: '学号', target: 'student_id' },
    { source: '姓名', target: 'name' },
    { source: '班级', target: 'class_name' },
    { source: '成绩', target: 'score' },
    { source: '测试日期', target: 'test_date' }
  ],
  
  overwrite: false,
  validate: true,
  logEnabled: true,
  sendNotification: false
})

const sourceFields = ['学号', '姓名', '班级', '性别', '年龄', '成绩', '测试日期', '项目名称', '测试类型', '备注']
const targetFields = ['student_id', 'name', 'class_name', 'gender', 'age', 'score', 'test_date', 'item_name', 'test_type', 'remarks']

const migrationStatus = ref(null)

const schoolData = computed(() => {
  const schoolId = store.state.school.id || 'hailin-second-primary'
  return getSchoolMockData(schoolId)
})

const localPracticeRecords = computed(() => {
  return schoolData.value?.practiceRecords || []
})

const handleFileChange = (event) => {
  selectedFile.value = event.raw
}

const formatFileSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const addMapping = () => {
  migration.fieldMappings.push({ source: '', target: '' })
}

const removeMapping = (index) => {
  if (migration.fieldMappings.length > 1) {
    migration.fieldMappings.splice(index, 1)
  }
}

// 将练习记录映射为考试记录
const mapRecordToExam = (record) => ({
  id: `migrated-exam-${record.id}`,
  studentId: record.studentId,
  studentName: record.studentName,
  event: record.event,
  score: record.score,
  grade: (record.scoreRaw || 0) >= 90 ? '优秀' : (record.scoreRaw || 0) >= 80 ? '良好' : (record.scoreRaw || 0) >= 60 ? '及格' : '不及格',
  date: record.date,
  source: '自由练习迁移',
  migratedAt: new Date().toLocaleString()
})

// 将练习记录映射为体测记录
const mapRecordToTest = (record) => {
  const base = {
    id: `migrated-test-${record.id}`,
    studentId: record.studentId,
    studentName: record.studentName,
    grade: record.grade || '',
    class: record.className || '',
    testDate: record.date,
    source: '自由练习迁移',
    migratedAt: new Date().toLocaleString()
  }
  const scoreVal = parseFloat(String(record.score).replace(/[^0-9.]/g, ''))
  switch (record.event) {
    case '50米跑': base.fiftyMeter = scoreVal; break
    case '立定跳远': base.longJump = scoreVal; break
    case '仰卧起坐': base.sitUps = scoreVal; break
    case '坐位体前屈': base.sitAndReach = scoreVal; break
    default: base.extraEvent = record.event; base.extraScore = record.score; break
  }
  return base
}

const startMigration = () => {
  if (migration.sourceType === 'local') {
    const unmigrated = localPracticeRecords.value.filter(r => !r.migrated)
    if (unmigrated.length === 0) {
      ElMessage.warning('没有可迁移的练习记录')
      return
    }

    migrationStatus.value = {
      text: '正在准备数据...',
      percent: 0,
      status: 'active',
      details: { success: 0, failed: 0, skipped: 0 }
    }

    const steps = [
      { text: '读取练习数据', percent: 20 },
      { text: '验证数据格式', percent: 40 },
      { text: '执行字段映射', percent: 60 },
      { text: '写入目标系统', percent: 80 },
      { text: '生成迁移日志', percent: 100 }
    ]

    let stepIndex = 0
    const total = unmigrated.length
    const migrated = JSON.parse(sessionStorage.getItem(`smart_pe_migrated_records_${store.state.school.id || 'hailin-second-primary'}`) || '[]')

    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        migrationStatus.value.text = steps[stepIndex].text
        migrationStatus.value.percent = steps[stepIndex].percent

        if (stepIndex === 3) {
          // 实际写入数据
          unmigrated.forEach(record => {
            try {
              const mapped = migration.target === 'exam'
                ? mapRecordToExam(record)
                : mapRecordToTest(record)
              migrated.push({ type: migration.target, record: mapped, practiceId: record.id })
              record.migrated = true
              record.migratedTo = migration.target
              migrationStatus.value.details.success++
            } catch {
              migrationStatus.value.details.failed++
            }
          })
          sessionStorage.setItem(`smart_pe_migrated_records_${store.state.school.id || 'hailin-second-primary'}`, JSON.stringify(migrated))
        }

        stepIndex++
      } else {
        clearInterval(interval)
        migrationStatus.value.text = '迁移完成'
        migrationStatus.value.status = 'success'
        ElMessage.success(`成功迁移 ${migrationStatus.value.details.success} 条记录到${migration.target === 'exam' ? '考试' : '体测'}系统`)
      }
    }, 800)
  } else {
    // 文件/数据库/API 源：保持模拟行为
    const random = createSeededRandom('score-migration')
    migrationStatus.value = {
      text: '正在准备数据...',
      percent: 0,
      status: 'active',
      details: { success: 0, failed: 0, skipped: 0 }
    }

    const steps = [
      { text: '读取源数据', percent: 20 },
      { text: '验证数据格式', percent: 40 },
      { text: '执行字段映射', percent: 60 },
      { text: '写入目标数据', percent: 80 },
      { text: '生成迁移日志', percent: 100 }
    ]

    let stepIndex = 0
    const interval = setInterval(() => {
      if (stepIndex < steps.length) {
        migrationStatus.value.text = steps[stepIndex].text
        migrationStatus.value.percent = steps[stepIndex].percent
        migrationStatus.value.details.success += Math.floor(random() * 10) + 1
        stepIndex++
      } else {
        clearInterval(interval)
        migrationStatus.value.text = '迁移完成'
        migrationStatus.value.status = 'success'
      }
    }, 800)
  }
}
</script>

<style scoped>
.score-migration-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.migration-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #E8EAED;
}

.migration-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0;
}

.migration-content {
  padding: 20px;
}

.migration-section {
  margin-bottom: 24px;
}

.migration-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 16px 0;
}

.source-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

.target-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.target-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 16px;
  border: 2px solid #E8EAED;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.target-item:hover {
  border-color: #1E5AA8;
}

.target-item.active {
  border-color: #1E5AA8;
  background: #EEF6FF;
}

.target-icon {
  font-size: 20px;
}

.target-label {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
}

.local-data-preview {
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
  margin-bottom: 16px;
}

.preview-summary {
  display: flex;
  align-items: center;
  gap: 8px;
}

.summary-label {
  font-size: 13px;
  color: #6B7280;
}

.summary-count {
  font-size: 14px;
  font-weight: 600;
  color: #1E5AA8;
}

.summary-migrated {
  font-size: 12px;
  color: #9CA3AF;
}

.selector-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 16px;
  border: 2px solid #E8EAED;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.selector-item:hover {
  border-color: #1E5AA8;
}

.selector-item.active {
  border-color: #1E5AA8;
  background: #EEF6FF;
}

.selector-icon {
  width: 40px;
  height: 40px;
  background: #F7F8FA;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1E5AA8;
}

.selector-label {
  font-size: 13px;
  color: #1A1A2E;
}

.file-upload {
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.file-info {
  display: flex;
  gap: 12px;
  margin-top: 12px;
}

.file-name {
  font-size: 13px;
  color: #1A1A2E;
}

.file-size {
  font-size: 12px;
  color: #6B7280;
}

.db-config, .api-config {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.config-row {
  width: calc(50% - 8px);
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.config-label {
  font-size: 12px;
  color: #6B7280;
}

.field-mapping {
  border: 1px solid #E8EAED;
  border-radius: 8px;
  overflow: hidden;
}

.mapping-header {
  display: flex;
  background: #F7F8FA;
  padding: 12px 16px;
}

.mapping-row {
  display: flex;
  padding: 12px 16px;
  border-top: 1px solid #E8EAED;
  align-items: center;
}

.mapping-row:first-child {
  border-top: none;
}

.add-row {
  justify-content: center;
}

.mapping-col {
  flex: 1;
}

.migration-options {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option-label {
  font-size: 13px;
  color: #1A1A2E;
}

.migration-status {
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.status-content {
  margin-top: 12px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 12px;
}

.progress-text {
  font-size: 13px;
  color: #1A1A2E;
}

.progress-percent {
  font-size: 13px;
  font-weight: 600;
  color: #1E5AA8;
}

.status-details {
  display: flex;
  justify-content: flex-end;
  gap: 24px;
  margin-top: 12px;
}

.status-details span {
  font-size: 12px;
  color: #6B7280;
}
</style>