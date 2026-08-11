<template>
  <div class="data-analysis-config-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h2 class="page-title">测试数据分析服务配置</h2>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="handleRefresh">刷新状态</el-button>
        <el-button type="primary" :icon="Setting" @click="handleSaveConfig" :loading="saving">
          保存配置
        </el-button>
      </div>
    </div>

    <!-- 服务状态概览 -->
    <div class="status-overview">
      <el-row :gutter="16">
        <el-col :span="6">
          <el-card class="status-card" :class="serviceStatus.aiAnalysis.status">
            <div class="status-content">
              <el-icon class="status-icon" :size="32">
                <Cpu />
              </el-icon>
              <div class="status-info">
                <div class="status-label">AI分析服务</div>
                <div class="status-value">{{ serviceStatus.aiAnalysis.status === 'active' ? '运行中' : '已停止' }}</div>
              </div>
            </div>
            <div class="status-toggle">
              <el-switch
                v-model="serviceStatus.aiAnalysis.enabled"
                @change="handleToggleService('aiAnalysis')"
                active-color="#1E5AA8"
                inactive-color="#E8EAED"
              />
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="status-card" :class="serviceStatus.dataProcessing.status">
            <div class="status-content">
              <el-icon class="status-icon" :size="32">
                <DataAnalysis />
              </el-icon>
              <div class="status-info">
                <div class="status-label">数据处理服务</div>
                <div class="status-value">{{ serviceStatus.dataProcessing.status === 'active' ? '运行中' : '已停止' }}</div>
              </div>
            </div>
            <div class="status-toggle">
              <el-switch
                v-model="serviceStatus.dataProcessing.enabled"
                @change="handleToggleService('dataProcessing')"
                active-color="#1E5AA8"
                inactive-color="#E8EAED"
              />
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="status-card" :class="serviceStatus.reportGeneration.status">
            <div class="status-content">
              <el-icon class="status-icon" :size="32">
                <Document />
              </el-icon>
              <div class="status-info">
                <div class="status-label">报告生成服务</div>
                <div class="status-value">{{ serviceStatus.reportGeneration.status === 'active' ? '运行中' : '已停止' }}</div>
              </div>
            </div>
            <div class="status-toggle">
              <el-switch
                v-model="serviceStatus.reportGeneration.enabled"
                @change="handleToggleService('reportGeneration')"
                active-color="#1E5AA8"
                inactive-color="#E8EAED"
              />
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="status-card" :class="serviceStatus.predictionModel.status">
            <div class="status-content">
              <el-icon class="status-icon" :size="32">
                <TrendCharts />
              </el-icon>
              <div class="status-info">
                <div class="status-label">预测模型服务</div>
                <div class="status-value">{{ serviceStatus.predictionModel.status === 'active' ? '运行中' : '已停止' }}</div>
              </div>
            </div>
            <div class="status-toggle">
              <el-switch
                v-model="serviceStatus.predictionModel.enabled"
                @change="handleToggleService('predictionModel')"
                active-color="#1E5AA8"
                inactive-color="#E8EAED"
              />
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 配置选项卡 -->
    <el-tabs v-model="activeTab" class="config-tabs">
      <!-- AI分析配置 -->
      <el-tab-pane label="AI分析配置" name="aiAnalysis">
        <el-card class="config-card">
          <template #header>
            <div class="card-header">
              <span>AI行为分析配置</span>
              <el-tag type="info">智能识别与违规检测</el-tag>
            </div>
          </template>
          <el-form :model="aiConfig" label-width="180px">
            <el-form-item label="违规检测灵敏度">
              <el-slider
                v-model="aiConfig.violationSensitivity"
                :min="1"
                :max="10"
                :marks="{ 1: '低', 5: '中', 10: '高' }"
                show-stops
              />
            </el-form-item>
            <el-form-item label="动作识别置信度阈值">
              <el-input-number
                v-model="aiConfig.confidenceThreshold"
                :min="0.5"
                :max="1"
                :step="0.05"
                :precision="2"
                style="width: 200px"
              />
              <span class="unit-text">（0.5-1.0）</span>
            </el-form-item>
            <el-form-item label="实时分析帧率">
              <el-select v-model="aiConfig.frameRate" style="width: 200px">
                <el-option label="15 FPS" :value="15" />
                <el-option label="30 FPS" :value="30" />
                <el-option label="60 FPS" :value="60" />
              </el-select>
            </el-form-item>
            <el-form-item label="违规类型检测">
              <el-checkbox-group v-model="aiConfig.violationTypes">
                <el-checkbox label="单脚跳" />
                <el-checkbox label="提前起跳" />
                <el-checkbox label="越线" />
                <el-checkbox label="动作不标准" />
                <el-checkbox label="借助外力" />
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="自动标记违规">
              <el-switch v-model="aiConfig.autoMarkViolation" />
              <span class="switch-label">违规动作自动标记为无效成绩</span>
            </el-form-item>
            <el-form-item label="违规语音播报">
              <el-switch v-model="aiConfig.voiceAlert" />
              <span class="switch-label">检测到违规时实时语音提示</span>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 数据处理配置 -->
      <el-tab-pane label="数据处理配置" name="dataProcessing">
        <el-card class="config-card">
          <template #header>
            <div class="card-header">
              <span>数据处理与清洗配置</span>
              <el-tag type="success">数据质量控制</el-tag>
            </div>
          </template>
          <el-form :model="dataConfig" label-width="180px">
            <el-form-item label="数据自动清洗">
              <el-switch v-model="dataConfig.autoClean" />
              <span class="switch-label">自动过滤异常数据</span>
            </el-form-item>
            <el-form-item label="异常值检测方法">
              <el-select v-model="dataConfig.outlierMethod" style="width: 200px">
                <el-option label="3σ原则" value="sigma" />
                <el-option label="IQR方法" value="iqr" />
                <el-option label="百分位法" value="percentile" />
              </el-select>
            </el-form-item>
            <el-form-item label="数据同步频率">
              <el-select v-model="dataConfig.syncFrequency" style="width: 200px">
                <el-option label="实时同步" value="realtime" />
                <el-option label="每5分钟" value="5min" />
                <el-option label="每15分钟" value="15min" />
                <el-option label="每小时" value="1hour" />
              </el-select>
            </el-form-item>
            <el-form-item label="数据备份策略">
              <el-radio-group v-model="dataConfig.backupStrategy">
                <el-radio label="auto">自动备份</el-radio>
                <el-radio label="manual">手动备份</el-radio>
                <el-radio label="none">不备份</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="数据保留周期">
              <el-input-number
                v-model="dataConfig.retentionDays"
                :min="30"
                :max="365"
                style="width: 200px"
              />
              <span class="unit-text">天</span>
            </el-form-item>
            <el-form-item label="数据质量检查">
              <el-checkbox-group v-model="dataConfig.qualityChecks">
                <el-checkbox label="完整性检查" />
                <el-checkbox label="一致性检查" />
                <el-checkbox label="准确性检查" />
                <el-checkbox label="时效性检查" />
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 报告生成配置 -->
      <el-tab-pane label="报告生成配置" name="reportGeneration">
        <el-card class="config-card">
          <template #header>
            <div class="card-header">
              <span>报告生成与导出配置</span>
              <el-tag type="warning">自动化报告</el-tag>
            </div>
          </template>
          <el-form :model="reportConfig" label-width="180px">
            <el-form-item label="自动生成报告">
              <el-switch v-model="reportConfig.autoGenerate" />
              <span class="switch-label">测试完成后自动生成报告</span>
            </el-form-item>
            <el-form-item label="报告模板">
              <el-select v-model="reportConfig.template" style="width: 200px">
                <el-option label="标准模板" value="standard" />
                <el-option label="详细模板" value="detailed" />
                <el-option label="简化模板" value="simple" />
                <el-option label="自定义模板" value="custom" />
              </el-select>
            </el-form-item>
            <el-form-item label="报告格式">
              <el-checkbox-group v-model="reportConfig.formats">
                <el-checkbox label="PDF" />
                <el-checkbox label="Word" />
                <el-checkbox label="Excel" />
                <el-checkbox label="HTML" />
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="报告内容">
              <el-checkbox-group v-model="reportConfig.contents">
                <el-checkbox label="成绩汇总" />
                <el-checkbox label="姿态分析" />
                <el-checkbox label="肌群分析" />
                <el-checkbox label="运动处方" />
                <el-checkbox label="关键帧截图" />
                <el-checkbox label="视频回放链接" />
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="报告发送方式">
              <el-checkbox-group v-model="reportConfig.deliveryMethods">
                <el-checkbox label="系统内通知" />
                <el-checkbox label="邮件发送" />
                <el-checkbox label="微信推送" />
                <el-checkbox label="短信通知" />
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="报告生成时间">
              <el-select v-model="reportConfig.generateTime" style="width: 200px">
                <el-option label="立即生成" value="immediate" />
                <el-option label="测试后5分钟" value="5min" />
                <el-option label="测试后30分钟" value="30min" />
                <el-option label="每日定时" value="daily" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>

      <!-- 预测模型配置 -->
      <el-tab-pane label="预测模型配置" name="predictionModel">
        <el-card class="config-card">
          <template #header>
            <div class="card-header">
              <span>LSTM成长预测模型配置</span>
              <el-tag type="primary">AI预测</el-tag>
            </div>
          </template>
          <el-form :model="predictionConfig" label-width="180px">
            <el-form-item label="预测周期">
              <el-select v-model="predictionConfig.predictionPeriod" style="width: 200px">
                <el-option label="1个月" value="1month" />
                <el-option label="3个月" value="3months" />
                <el-option label="6个月" value="6months" />
                <el-option label="1学期" value="1semester" />
              </el-select>
            </el-form-item>
            <el-form-item label="预测置信度">
              <el-slider
                v-model="predictionConfig.confidence"
                :min="70"
                :max="95"
                :marks="{ 70: '70%', 85: '85%', 95: '95%' }"
                show-stops
              />
            </el-form-item>
            <el-form-item label="模型训练数据量">
              <el-input-number
                v-model="predictionConfig.trainingDataSize"
                :min="100"
                :max="10000"
                :step="100"
                style="width: 200px"
              />
              <span class="unit-text">条记录</span>
            </el-form-item>
            <el-form-item label="模型更新频率">
              <el-select v-model="predictionConfig.updateFrequency" style="width: 200px">
                <el-option label="每周更新" value="weekly" />
                <el-option label="每月更新" value="monthly" />
                <el-option label="每学期更新" value="semester" />
              </el-select>
            </el-form-item>
            <el-form-item label="预测项目">
              <el-checkbox-group v-model="predictionConfig.predictionProjects">
                <el-checkbox label="立定跳远" />
                <el-checkbox label="仰卧起坐" />
                <el-checkbox label="引体向上" />
                <el-checkbox label="坐位体前屈" />
                <el-checkbox label="50米跑" />
                <el-checkbox label="800/1000米跑" />
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="预测结果展示">
              <el-checkbox-group v-model="predictionConfig.displayOptions">
                <el-checkbox label="预测分数" />
                <el-checkbox label="预测等级" />
                <el-checkbox label="提升空间" />
                <el-checkbox label="训练建议" />
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </el-card>
      </el-tab-pane>
    </el-tabs>

    <!-- 系统资源监控 -->
    <el-card class="resource-card">
      <template #header>
        <div class="card-header">
          <span>系统资源监控</span>
          <el-tag type="success">实时</el-tag>
        </div>
      </template>
      <el-row :gutter="24">
        <el-col :span="12">
          <div class="resource-item">
            <div class="resource-label">CPU使用率</div>
            <el-progress
              :percentage="resourceUsage.cpu"
              :color="getProgressColor(resourceUsage.cpu)"
              :stroke-width="20"
            />
          </div>
        </el-col>
        <el-col :span="12">
          <div class="resource-item">
            <div class="resource-label">内存使用率</div>
            <el-progress
              :percentage="resourceUsage.memory"
              :color="getProgressColor(resourceUsage.memory)"
              :stroke-width="20"
            />
          </div>
        </el-col>
        <el-col :span="12">
          <div class="resource-item">
            <div class="resource-label">GPU使用率</div>
            <el-progress
              :percentage="resourceUsage.gpu"
              :color="getProgressColor(resourceUsage.gpu)"
              :stroke-width="20"
            />
          </div>
        </el-col>
        <el-col :span="12">
          <div class="resource-item">
            <div class="resource-label">磁盘使用率</div>
            <el-progress
              :percentage="resourceUsage.disk"
              :color="getProgressColor(resourceUsage.disk)"
              :stroke-width="20"
            />
          </div>
        </el-col>
      </el-row>
    </el-card>

    <!-- 服务日志 -->
    <el-card class="log-card">
      <template #header>
        <div class="card-header">
          <span>服务运行日志</span>
          <el-button text type="primary" size="small" @click="handleExportLog">
            导出日志
          </el-button>
        </div>
      </template>
      <div class="log-container">
        <div
          v-for="(log, index) in serviceLogs"
          :key="index"
          class="log-item"
          :class="log.level"
        >
          <span class="log-time">{{ log.time }}</span>
          <span class="log-level">{{ log.level }}</span>
          <span class="log-message">{{ log.message }}</span>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'
import {
  Refresh, Setting, Cpu, DataAnalysis, Document, TrendCharts
} from '@element-plus/icons-vue'
import {
  MOCK_SERVICE_STATUS, MOCK_AI_CONFIG, MOCK_DATA_CONFIG,
  MOCK_REPORT_CONFIG, MOCK_PREDICTION_CONFIG, MOCK_SERVICE_LOGS
} from '@/data/mockData'
import store from '@/store/global'
import { createSeededRandom } from '@/utils/seededRandom'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

// 当前激活的标签页
const activeTab = ref('aiAnalysis')

// 保存中状态
const saving = ref(false)

// 服务状态（持久化）
const serviceStatus = ref({ ...MOCK_SERVICE_STATUS })

// AI分析配置（持久化）
const aiConfig = ref({ ...MOCK_AI_CONFIG })

// 数据处理配置（持久化）
const dataConfig = ref({ ...MOCK_DATA_CONFIG })

// 报告生成配置（持久化）
const reportConfig = ref({ ...MOCK_REPORT_CONFIG })

// 预测模型配置（持久化）
const predictionConfig = ref({ ...MOCK_PREDICTION_CONFIG })

// 系统资源使用情况
const resourceUsage = ref({
  cpu: 45,
  memory: 62,
  gpu: 38,
  disk: 55
})

// 服务日志（持久化）
const serviceLogs = ref([...MOCK_SERVICE_LOGS])

// 加载配置数据
const loadConfigs = () => {
  const loadItem = (key, defaultValue, targetRef) => {
    const stored = sessionStorage.getItem(`${key}_${schoolId.value}`)
    if (stored) {
      try {
        targetRef.value = JSON.parse(stored)
      } catch (e) {
        targetRef.value = { ...defaultValue }
      }
    } else {
      targetRef.value = { ...defaultValue }
    }
    sessionStorage.setItem(`${key}_${schoolId.value}`, JSON.stringify(targetRef.value))
  }

  loadItem('smart_pe_service_status', MOCK_SERVICE_STATUS, serviceStatus)
  loadItem('smart_pe_ai_config', MOCK_AI_CONFIG, aiConfig)
  loadItem('smart_pe_data_config', MOCK_DATA_CONFIG, dataConfig)
  loadItem('smart_pe_report_config', MOCK_REPORT_CONFIG, reportConfig)
  loadItem('smart_pe_prediction_config', MOCK_PREDICTION_CONFIG, predictionConfig)
  
  const logsStored = sessionStorage.getItem(`smart_pe_service_logs_${schoolId.value}`)
  serviceLogs.value = logsStored ? JSON.parse(logsStored) : [...MOCK_SERVICE_LOGS]
  sessionStorage.setItem(`smart_pe_service_logs_${schoolId.value}`, JSON.stringify(serviceLogs.value))
}

onMounted(() => {
  loadConfigs()
  // 启动定时更新资源使用情况
  resourceTimer = setInterval(updateResourceUsage, 5000)
})

watch(schoolId, () => {
  loadConfigs()
})

// 监听配置变化，自动保存
const watchConfig = (ref, key) => {
  watch(ref, (newVal) => {
    sessionStorage.setItem(`${key}_${schoolId.value}`, JSON.stringify(newVal))
  }, { deep: true })
}

watchConfig(serviceStatus, 'smart_pe_service_status')
watchConfig(aiConfig, 'smart_pe_ai_config')
watchConfig(dataConfig, 'smart_pe_data_config')
watchConfig(reportConfig, 'smart_pe_report_config')
watchConfig(predictionConfig, 'smart_pe_prediction_config')
watchConfig(serviceLogs, 'smart_pe_service_logs')

// 定时器
let resourceTimer = null

// 切换服务状态
const handleToggleService = (serviceName) => {
  const service = serviceStatus.value[serviceName]
  if (service.enabled) {
    service.status = 'active'
    ElMessage.success(`${serviceName}服务已启动`)
  } else {
    service.status = 'inactive'
    ElMessage.warning(`${serviceName}服务已停止`)
  }
}

// 刷新状态
const handleRefresh = () => {
  loadConfigs()
  updateResourceUsage()
  ElMessage.success('状态已刷新')
}

// 保存配置
const handleSaveConfig = () => {
  saving.value = true
  setTimeout(() => {
    try {
      const schoolId = store.state.school.id || 'hailin-second-primary'
      sessionStorage.setItem(`smart_pe_analysis_config_${schoolId}`, JSON.stringify({
        aiConfig: aiConfig.value,
        dataConfig: dataConfig.value,
        reportConfig: reportConfig.value,
        predictionConfig: predictionConfig.value
      }))
      saving.value = false
      ElMessage.success('配置保存成功')
    } catch (e) {
      saving.value = false
      ElMessage.error('配置保存失败')
    }
  }, 1500)
}

// 导出日志
const handleExportLog = () => {
  ElMessage.success('日志导出成功')
}

// 获取进度条颜色
const getProgressColor = (percentage) => {
  if (percentage < 50) return '#1E5AA8'
  if (percentage < 80) return '#F5A623'
  return '#E85D4E'
}

// 更新资源使用情况
const updateResourceUsage = () => {
  const random = createSeededRandom(schoolId.value + '_resourceUsage')
  resourceUsage.value = {
    cpu: Math.floor(random() * 30) + 35,
    memory: Math.floor(random() * 20) + 55,
    gpu: Math.floor(random() * 25) + 30,
    disk: Math.floor(random() * 10) + 50
  }
}

onMounted(() => {
  // 启动定时更新资源使用情况
  resourceTimer = setInterval(updateResourceUsage, 5000)
})

onUnmounted(() => {
  // 清理定时器
  if (resourceTimer) {
    clearInterval(resourceTimer)
  }
})
</script>

<style scoped>
.data-analysis-config-container {
  padding: 24px;
  background: #F7F8FA;
  min-height: 100vh;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1A1A2E;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.status-overview {
  margin-bottom: 24px;
}

.status-card {
  position: relative;
  margin-bottom: 16px;
}

.status-card.active {
  border-left: 4px solid #1E5AA8;
}

.status-card.inactive {
  border-left: 4px solid #E85D4E;
}

.status-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.status-icon {
  color: #1E5AA8;
}

.status-card.inactive .status-icon {
  color: #9CA3AF;
}

.status-info {
  flex: 1;
}

.status-label {
  font-size: 14px;
  color: #6B7280;
  margin-bottom: 4px;
}

.status-value {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A2E;
}

.status-card.inactive .status-value {
  color: #9CA3AF;
}

.status-toggle {
  position: absolute;
  top: 16px;
  right: 16px;
}

.config-tabs {
  margin-bottom: 24px;
}

.config-card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
}

.unit-text {
  margin-left: 8px;
  color: #6B7280;
  font-size: 14px;
}

.switch-label {
  margin-left: 8px;
  color: #6B7280;
  font-size: 14px;
}

.resource-card {
  margin-bottom: 24px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.resource-item {
  margin-bottom: 20px;
}

.resource-item:last-child {
  margin-bottom: 0;
}

.resource-label {
  font-size: 14px;
  color: #6B7280;
  margin-bottom: 8px;
}

.log-card {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.log-container {
  max-height: 300px;
  overflow-y: auto;
  background: #F7F8FA;
  padding: 16px;
  border-radius: 8px;
}

.log-item {
  display: flex;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid #E8EAED;
  font-size: 14px;
}

.log-item:last-child {
  border-bottom: none;
}

.log-time {
  color: #9CA3AF;
  min-width: 150px;
}

.log-level {
  font-weight: 600;
  min-width: 80px;
}

.log-item.INFO .log-level {
  color: #1E5AA8;
}

.log-item.SUCCESS .log-level {
  color: #1E5AA8;
}

.log-item.WARNING .log-level {
  color: #F5A623;
}

.log-item.ERROR .log-level {
  color: #E85D4E;
}

.log-message {
  color: #1A1A2E;
  flex: 1;
}

:deep(.el-form-item__label) {
  color: #1A1A2E;
  font-weight: 500;
}

:deep(.el-slider__marks-text) {
  font-size: 12px;
}
</style>