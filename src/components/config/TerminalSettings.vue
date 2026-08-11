<template>
  <div class="terminal-settings-container">
    <div class="settings-header">
      <h3 class="settings-title">终端设置</h3>
      <div class="header-actions">
        <el-button @click="resetSettings">重置</el-button>
        <el-button type="primary" @click="saveSettings">保存设置</el-button>
      </div>
    </div>
    
    <div class="settings-content">
      <!-- 摄像头参数配置 -->
      <div class="settings-section">
        <div class="section-header">
          <h4 class="section-title"><el-icon :size="18"><Camera /></el-icon> 摄像头参数</h4>
          <el-switch v-model="settings.cameraEnabled" class="section-switch" />
        </div>
        
        <div class="section-content" v-if="settings.cameraEnabled">
          <div class="setting-row">
            <div class="setting-item">
              <label class="setting-label">摄像头数量</label>
              <el-select v-model="settings.cameraCount">
                <el-option label="单摄像头" :value="1" />
                <el-option label="双摄像头" :value="2" />
                <el-option label="三摄像头" :value="3" />
                <el-option label="四摄像头" :value="4" />
              </el-select>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">分辨率</label>
              <el-select v-model="settings.resolution">
                <el-option label="720P (1280×720)" value="720p" />
                <el-option label="1080P (1920×1080)" value="1080p" />
                <el-option label="2K (2560×1440)" value="2k" />
              </el-select>
            </div>
          </div>
          
          <div class="setting-row">
            <div class="setting-item">
              <label class="setting-label">帧率</label>
              <el-select v-model="settings.frameRate">
                <el-option label="15 FPS" :value="15" />
                <el-option label="24 FPS" :value="24" />
                <el-option label="30 FPS" :value="30" />
                <el-option label="60 FPS" :value="60" />
              </el-select>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">曝光模式</label>
              <el-select v-model="settings.exposureMode">
                <el-option label="自动" value="auto" />
                <el-option label="手动" value="manual" />
              </el-select>
            </div>
          </div>
          
          <div class="setting-row">
            <div class="setting-item">
              <label class="setting-label">对比度</label>
              <div class="slider-wrapper">
                <el-slider 
                  v-model="settings.contrast" 
                  :min="0" 
                  :max="100" 
                  :step="1"
                />
                <span class="slider-value">{{ settings.contrast }}%</span>
              </div>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">亮度</label>
              <div class="slider-wrapper">
                <el-slider 
                  v-model="settings.brightness" 
                  :min="0" 
                  :max="100" 
                  :step="1"
                />
                <span class="slider-value">{{ settings.brightness }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- AI识别灵敏度设置 -->
      <div class="settings-section">
        <div class="section-header">
          <h4 class="section-title"><el-icon :size="18"><Cpu /></el-icon> AI识别设置</h4>
          <el-switch v-model="settings.aiEnabled" class="section-switch" />
        </div>
        
        <div class="section-content" v-if="settings.aiEnabled">
          <div class="setting-row">
            <div class="setting-item">
              <label class="setting-label">识别灵敏度</label>
              <div class="slider-wrapper">
                <el-slider 
                  v-model="settings.aiSensitivity" 
                  :min="1" 
                  :max="10" 
                  :step="1"
                  :marks="{ 1: '低', 5: '中', 10: '高' }"
                />
                <span class="slider-value">{{ getSensitivityLabel(settings.aiSensitivity) }}</span>
              </div>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">姿态检测</label>
              <el-switch v-model="settings.poseDetection" />
            </div>
          </div>
          
          <div class="setting-row">
            <div class="setting-item">
              <label class="setting-label">面部识别</label>
              <el-switch v-model="settings.faceRecognition" />
            </div>
            
            <div class="setting-item">
              <label class="setting-label">骨骼追踪</label>
              <el-switch v-model="settings.skeletonTracking" />
            </div>
          </div>
          
          <div class="setting-row">
            <div class="setting-item">
              <label class="setting-label">识别距离</label>
              <el-input-number 
                v-model="settings.recognitionDistance" 
                :min="1" 
                :max="10"
                style="width: 120px;"
              />
              <span class="unit">米</span>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">识别超时</label>
              <el-input-number 
                v-model="settings.recognitionTimeout" 
                :min="3" 
                :max="30"
                style="width: 120px;"
              />
              <span class="unit">秒</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 语音播报设置 -->
      <div class="settings-section">
        <div class="section-header">
          <h4 class="section-title"><el-icon :size="18"><Microphone /></el-icon> 语音播报</h4>
          <el-switch v-model="settings.voiceEnabled" class="section-switch" />
        </div>
        
        <div class="section-content" v-if="settings.voiceEnabled">
          <div class="setting-row">
            <div class="setting-item">
              <label class="setting-label">音量</label>
              <div class="slider-wrapper">
                <el-slider 
                  v-model="settings.voiceVolume" 
                  :min="0" 
                  :max="100" 
                  :step="1"
                />
                <span class="slider-value">{{ settings.voiceVolume }}%</span>
              </div>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">语速</label>
              <el-select v-model="settings.voiceSpeed">
                <el-option label="慢速" value="slow" />
                <el-option label="正常" value="normal" />
                <el-option label="快速" value="fast" />
              </el-select>
            </div>
          </div>
          
          <div class="setting-row">
            <div class="setting-item">
              <label class="setting-label">开始提示</label>
              <el-switch v-model="settings.voiceStart" />
            </div>
            
            <div class="setting-item">
              <label class="setting-label">成绩播报</label>
              <el-switch v-model="settings.voiceResult" />
            </div>
            
            <div class="setting-item">
              <label class="setting-label">违规提醒</label>
              <el-switch v-model="settings.voiceViolation" />
            </div>
          </div>
        </div>
      </div>
      
      <!-- 测试时长配置 -->
      <div class="settings-section">
        <div class="section-header">
          <h4 class="section-title"><el-icon :size="18"><Timer /></el-icon> 测试时长配置</h4>
        </div>
        
        <div class="section-content">
          <div class="setting-row">
            <div class="setting-item">
              <label class="setting-label">跳绳测试时长</label>
              <el-select v-model="settings.ropeSkippingDuration">
                <el-option label="30秒" :value="30" />
                <el-option label="60秒" :value="60" />
                <el-option label="120秒" :value="120" />
                <el-option label="180秒" :value="180" />
                <el-option label="240秒" :value="240" />
              </el-select>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">仰卧起坐时长</label>
              <el-select v-model="settings.sitUpsDuration">
                <el-option label="30秒" :value="30" />
                <el-option label="60秒" :value="60" />
                <el-option label="90秒" :value="90" />
                <el-option label="120秒" :value="120" />
              </el-select>
            </div>
          </div>
          
          <div class="setting-row">
            <div class="setting-item">
              <label class="setting-label">准备倒计时</label>
              <el-input-number 
                v-model="settings.countdownDuration" 
                :min="3" 
                :max="10"
                style="width: 120px;"
              />
              <span class="unit">秒</span>
            </div>
            
            <div class="setting-item">
              <label class="setting-label">间隔休息</label>
              <el-input-number 
                v-model="settings.restDuration" 
                :min="0" 
                :max="60"
                style="width: 120px;"
              />
              <span class="unit">秒</span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 违规检测阈值设置 -->
      <div class="settings-section">
        <div class="section-header">
          <h4 class="section-title"><el-icon :size="18"><Warning /></el-icon> 违规检测</h4>
        </div>
        
        <div class="section-content">
          <div class="setting-row">
            <div class="setting-item">
              <label class="setting-label">启用违规检测</label>
              <el-switch v-model="settings.violationDetection" />
            </div>
            
            <div class="setting-item">
              <label class="setting-label">自动重测次数</label>
              <el-input-number 
                v-model="settings.retestCount" 
                :min="0" 
                :max="3"
                style="width: 120px;"
              />
              <span class="unit">次</span>
            </div>
          </div>
          
          <div class="setting-row">
            <div class="setting-item">
              <label class="setting-label">踩线检测灵敏度</label>
              <div class="slider-wrapper">
                <el-slider 
                  v-model="settings.lineCrossSensitivity" 
                  :min="1" 
                  :max="10" 
                  :step="1"
                  :marks="{ 1: '宽松', 5: '标准', 10: '严格' }"
                />
                <span class="slider-value">{{ getViolationLabel(settings.lineCrossSensitivity) }}</span>
              </div>
            </div>
          </div>
          
          <div class="setting-row">
            <div class="setting-item">
              <label class="setting-label">疑似作弊时间阈值</label>
              <el-input-number 
                v-model="settings.suspiciousTimeThreshold" 
                :min="1" 
                :max="30"
                style="width: 120px;"
              />
              <span class="unit">秒</span>
              <span class="tip">成绩小于此值将被标记为疑似作弊</span>
            </div>
          </div>
          
          <div class="violation-types">
            <label class="setting-label">检测类型</label>
            <div class="violation-options">
              <el-checkbox v-model="settings.violationTypes.lineCross">踩线违规</el-checkbox>
              <el-checkbox v-model="settings.violationTypes.foulStart">抢跑违规</el-checkbox>
              <el-checkbox v-model="settings.violationTypes.noFace">未识别面部</el-checkbox>
              <el-checkbox v-model="settings.violationTypes.cheating">疑似作弊</el-checkbox>
              <el-checkbox v-model="settings.violationTypes.posture">姿态违规</el-checkbox>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, watch } from 'vue'
import { Camera, Cpu, Microphone, Timer, Warning } from '@element-plus/icons-vue'

const props = defineProps({
  currentSettings: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['save'])

const defaultSettings = {
  // 摄像头设置
  cameraEnabled: true,
  cameraCount: 2,
  resolution: '1080p',
  frameRate: 30,
  exposureMode: 'auto',
  contrast: 50,
  brightness: 70,
  
  // AI识别设置
  aiEnabled: true,
  aiSensitivity: 7,
  poseDetection: true,
  faceRecognition: true,
  skeletonTracking: true,
  recognitionDistance: 3,
  recognitionTimeout: 10,
  
  // 语音播报设置
  voiceEnabled: true,
  voiceVolume: 80,
  voiceSpeed: 'normal',
  voiceStart: true,
  voiceResult: true,
  voiceViolation: true,
  
  // 测试时长配置
  ropeSkippingDuration: 60,
  sitUpsDuration: 60,
  countdownDuration: 5,
  restDuration: 10,
  
  // 违规检测设置
  violationDetection: true,
  retestCount: 2,
  lineCrossSensitivity: 5,
  suspiciousTimeThreshold: 5,
  violationTypes: {
    lineCross: true,
    foulStart: true,
    noFace: true,
    cheating: true,
    posture: true
  }
}

const settings = reactive({ ...defaultSettings })

// 初始化设置
watch(() => props.currentSettings, (newVal) => {
  if (newVal) {
    Object.assign(settings, newVal)
  }
}, { immediate: true, deep: true })

const getSensitivityLabel = (value) => {
  if (value <= 3) return '低'
  if (value <= 7) return '中'
  return '高'
}

const getViolationLabel = (value) => {
  if (value <= 3) return '宽松'
  if (value <= 7) return '标准'
  return '严格'
}

const resetSettings = () => {
  Object.assign(settings, defaultSettings)
}

const saveSettings = () => {
  emit('save', { ...settings })
}
</script>

<style scoped>
.terminal-settings-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
  max-height: 600px;
  display: flex;
  flex-direction: column;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #E8EAED;
  flex-shrink: 0;
}

.settings-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.settings-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.settings-section {
  margin-bottom: 24px;
  background: #F7F8FA;
  border-radius: 10px;
  overflow: hidden;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #FFFFFF;
  border-bottom: 1px solid #E8EAED;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-switch {
  margin: 0;
}

.section-content {
  padding: 20px;
}

.setting-row {
  display: flex;
  gap: 24px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.setting-row:last-child {
  margin-bottom: 0;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 280px;
}

.setting-label {
  width: 140px;
  font-size: 13px;
  color: #6B7280;
  flex-shrink: 0;
}

.slider-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 200px;
}

.slider-value {
  font-size: 13px;
  color: #1E5AA8;
  font-weight: 500;
  width: 40px;
  text-align: right;
}

.unit {
  font-size: 13px;
  color: #6B7280;
}

.tip {
  font-size: 12px;
  color: #9CA3AF;
  margin-left: 8px;
}

.violation-types {
  margin-top: 12px;
}

.violation-options {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
}

:deep(.el-slider__runway) {
  background: #E8EAED;
}

:deep(.el-slider__bar) {
  background: #1E5AA8;
}

:deep(.el-slider__button) {
  border-color: #1E5AA8;
}

:deep(.el-checkbox__input.is-checked .el-checkbox__inner) {
  background: #1E5AA8;
  border-color: #1E5AA8;
}
</style>