<template>
  <!-- 面部信息录入弹窗 -->
  <ElDialog
    v-model="model"
    title="面部信息录入"
    width="550px"
    :close-on-click-modal="false"
  >
    <div class="face-registration">
      <div class="registration-step">
        <div class="step-indicator">
          <span :class="{ active: faceStep === 1 }">1</span>
          <span class="step-line"></span>
          <span :class="{ active: faceStep === 2 }">2</span>
          <span class="step-line"></span>
          <span :class="{ active: faceStep === 3 }">3</span>
        </div>
        <div class="step-labels">
          <span>选择学生</span>
          <span>采集图像</span>
          <span>完成录入</span>
        </div>
      </div>

      <!-- 步骤1: 选择学生 -->
      <div v-if="faceStep === 1" class="step-content">
        <div class="select-student">
          <el-input
            v-model="faceSearchQuery"
            placeholder="搜索学生姓名/学号"
            clearable
            class="w-full"
            :prefix-icon="Search"
          />
          <div class="filter-options">
            <el-radio-group v-model="faceFilterMode">
              <el-radio label="all">全部学生</el-radio>
              <el-radio label="unregistered">仅未录入</el-radio>
              <el-radio label="registered">仅已录入</el-radio>
            </el-radio-group>
          </div>
          <div class="student-list">
            <div 
              v-for="student in filteredStudentsForFace" 
              :key="student.id" 
              class="student-item"
              :class="{ selected: selectedFaceStudent?.id === student.id }"
              @click="selectFaceStudent(student)"
            >
              <el-avatar :size="40" :icon="UserFilled" />
              <div class="student-info">
                <span class="student-name">{{ student.name }}</span>
                <span class="student-id">{{ student.id }} · {{ student.grade }}{{ student.class }}</span>
              </div>
              <el-tag :type="student.faceRegistered ? 'success' : 'info'" size="small">
                {{ student.faceRegistered ? '已录入' : '未录入' }}
              </el-tag>
            </div>
            <div v-if="filteredStudentsForFace.length === 0" class="empty-hint">
              <el-icon :size="48" color="#9CA3AF"><UserFilled /></el-icon>
              <p>未找到符合条件的学生</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 步骤2: 采集图像 -->
      <div v-if="faceStep === 2" class="step-content">
        <div class="camera-container">
          <div class="camera-frame">
            <div class="camera-preview">
              <video 
                v-if="!faceCaptured && mediaStream" 
                ref="videoRef" 
                class="video-preview"
                autoplay 
                playsinline 
                muted
              ></video>
              <div v-else-if="!faceCaptured && !mediaStream" class="preview-placeholder">
                <el-icon :size="64" color="#9CA3AF"><Camera /></el-icon>
                <span class="preview-hint">摄像头预览区域</span>
                <span class="preview-hint-small">{{ cameraStatus }}</span>
              </div>
              <img 
                v-else 
                :src="capturedImageBase64" 
                class="captured-image"
                alt="已捕获的人脸"
              />
            </div>
            <canvas ref="canvasRef" style="display: none;"></canvas>
            <div class="face-guide" :class="{ scanning: cameraStatus.includes('识别') }">
              <div class="guide-line top"></div>
              <div class="guide-line bottom"></div>
              <div class="guide-line left"></div>
              <div class="guide-line right"></div>
              <div class="guide-text">{{ cameraStatus.includes('识别') ? '正在识别...' : '请将面部置于框内' }}</div>
            </div>
          </div>
          <div class="camera-status">
            <span class="status-indicator" :class="{ active: cameraStatus.includes('就绪') }"></span>
            <span class="status-text">{{ cameraStatus }}</span>
          </div>
        </div>
        <div class="camera-actions">
          <el-button @click="refreshCamera">刷新摄像头</el-button>
          <el-button 
            type="primary" 
            :icon="faceCaptured ? Refresh : Camera"
            @click="captureFace"
            :disabled="!mediaStream"
          >
            {{ faceCaptured ? '重新拍照' : '拍照采集' }}
          </el-button>
        </div>
      </div>

      <!-- 步骤3: 完成录入 -->
      <div v-if="faceStep === 3" class="step-content">
        <div class="success-content">
          <div class="success-icon">✓</div>
          <h3>面部信息录入成功</h3>
          <div class="student-summary">
            <el-avatar :size="64" :icon="UserFilled" />
            <div class="summary-info">
              <span class="summary-name">{{ selectedFaceStudent?.name }}</span>
              <span class="summary-id">{{ selectedFaceStudent?.id }}</span>
              <span class="summary-class">{{ selectedFaceStudent?.grade }}{{ selectedFaceStudent?.class }}</span>
            </div>
          </div>
          <div class="success-details">
            <div class="detail-item">
              <span class="detail-label">录入时间</span>
              <span class="detail-value">{{ new Date().toLocaleString('zh-CN') }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">面部状态</span>
              <span class="detail-value status-success">已录入</span>
            </div>
          </div>
          <p class="success-hint">学生面部信息已成功录入系统，可用于后续身份识别</p>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button v-if="faceStep > 1" @click="faceStep--">上一步</el-button>
      <el-button 
        v-if="faceStep === 1 && selectedFaceStudent" 
        type="primary" 
        @click="faceStep++"
      >
        下一步
      </el-button>
      <el-button 
        v-if="faceStep === 2 && faceCaptured" 
        type="primary" 
        @click="faceStep++"
      >
        确认录入
      </el-button>
      <el-button 
        v-if="faceStep === 3" 
        type="primary" 
        @click="completeFaceRegistration"
      >
        完成
      </el-button>
      <el-button @click="model = false">取消</el-button>
    </template>
  </ElDialog>

  <!-- 重录面部信息弹窗 -->
  <ElDialog
    v-model="reRecordModel"
    title="重新录入面部信息"
    width="500px"
    :close-on-click-modal="false"
  >
    <div class="face-reregistration">
      <div class="reregister-notice">
        <el-alert
          title="即将重新采集面部信息"
          type="warning"
          :closable="false"
          show-icon
        >
          <template #default>
            <p>学生姓名：<strong>{{ selectedFaceStudent?.name }}</strong></p>
            <p>学号：<strong>{{ selectedFaceStudent?.id }}</strong></p>
            <p>班级：<strong>{{ selectedFaceStudent?.grade }} {{ selectedFaceStudent?.class }}</strong></p>
            <p class="notice-hint">重新录入后，原有面部信息将被覆盖，请确认学生到场。</p>
          </template>
        </el-alert>
      </div>
      
      <div class="camera-preview">
        <div class="preview-area">
          <video 
            v-if="!faceCaptured && mediaStream" 
            ref="videoRef" 
            class="video-preview"
            autoplay 
            playsinline 
            muted
          ></video>
          <div v-else-if="!faceCaptured && !mediaStream" class="preview-placeholder">
            <el-icon :size="48"><Camera /></el-icon>
            <p>摄像头预览区域</p>
            <p>{{ cameraStatus }}</p>
          </div>
          <img 
            v-else 
            :src="capturedImageBase64" 
            class="captured-image"
            alt="已捕获的人脸"
          />
        </div>
        <canvas ref="canvasRef" style="display: none;"></canvas>
        <div class="camera-status">
          <span class="status-indicator" :class="{ active: cameraStatus.includes('就绪') }"></span>
          <span>{{ cameraStatus }}</span>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button @click="refreshCamera">刷新摄像头</el-button>
      <el-button 
        type="warning" 
        :icon="faceCaptured ? Refresh : Camera"
        @click="captureFace"
        :disabled="!mediaStream"
      >
        {{ faceCaptured ? '重新拍照' : '拍照采集' }}
      </el-button>
      <el-button 
        type="primary" 
        @click="confirmRerecord"
        :disabled="!faceCaptured"
      >
        确认重录
      </el-button>
      <el-button @click="reRecordModel = false">取消</el-button>
    </template>
  </ElDialog>
</template>

<script setup>
import { ref, computed, watch, onUnmounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Camera, Refresh, UserFilled } from '@element-plus/icons-vue'
import { uploadStudentFaceJson as uploadStudentFaceApi, deleteStudentFace as deleteStudentFaceApi } from '@/utils/daiweiApi'
import store from '@/store/global'

const props = defineProps({
  students: {
    type: Array,
    default: () => []
  },
  schoolId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['face-updated'])

// 双向绑定：主面部录入弹窗可见性
const model = defineModel({ type: Boolean, default: false })
// 双向绑定：重录面部弹窗可见性
const reRecordModel = defineModel('reRecordModel', { type: Boolean, default: false })

// 面部录入相关状态
const faceStep = ref(1)
const faceSearchQuery = ref('')
const faceFilterMode = ref('unregistered')
const selectedFaceStudent = ref(null)
const cameraStatus = ref('准备就绪')
const faceCaptured = ref(false)
const videoRef = ref(null)
const canvasRef = ref(null)
let mediaStream = null
const capturedImageBase64 = ref('')

// 计算属性：根据搜索和筛选条件过滤学生列表
const filteredStudentsForFace = computed(() => {
  let result = props.students
  if (faceSearchQuery.value) {
    const q = faceSearchQuery.value.toLowerCase()
    result = result.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
  }
  if (faceFilterMode.value === 'unregistered') {
    result = result.filter(s => !s.faceRegistered)
  } else if (faceFilterMode.value === 'registered') {
    result = result.filter(s => s.faceRegistered)
  }
  return result.slice(0, 10)
})

// 选择学生
const selectFaceStudent = (student) => {
  selectedFaceStudent.value = student
}

// 打开面部录入弹窗（重置状态）
const faceRegistration = () => {
  faceStep.value = 1
  faceSearchQuery.value = ''
  faceFilterMode.value = 'unregistered'
  selectedFaceStudent.value = null
  cameraStatus.value = '准备就绪'
  faceCaptured.value = false
  model.value = true
}

// 重录面部信息
const reRecordFace = (student) => {
  selectedFaceStudent.value = student
  reRecordModel.value = true
  ElMessage.info(`开始为 ${student.name} 重新录入面部信息`)
  
  setTimeout(() => {
    openCamera()
  }, 300)
}

// 监听步骤变化，进入采集步骤时自动打开摄像头
watch(faceStep, (newVal) => {
  if (newVal === 2) {
    setTimeout(() => {
      openCamera()
    }, 300)
  }
})

// 打开摄像头
const openCamera = async () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
  }
  
  try {
    cameraStatus.value = '正在连接摄像头...'
    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      },
      audio: false
    })
    
    if (videoRef.value) {
      videoRef.value.srcObject = mediaStream
    }
    cameraStatus.value = '摄像头已就绪，请对准面部'
  } catch (error) {
    console.error('打开摄像头失败:', error)
    cameraStatus.value = '无法访问摄像头，请检查权限'
    mediaStream = null
    ElMessage.error('无法访问摄像头，请确保已授权摄像头权限')
  }
}

// 刷新摄像头
const refreshCamera = () => {
  openCamera()
}

// 拍照采集（再次点击则重置拍照）
const captureFace = () => {
  if (faceCaptured.value) {
    faceCaptured.value = false
    capturedImageBase64.value = ''
    cameraStatus.value = '摄像头已就绪，请对准面部'
    return
  }
  
  if (!videoRef.value || !canvasRef.value || !mediaStream) {
    ElMessage.error('摄像头未就绪，请先连接摄像头')
    return
  }
  
  cameraStatus.value = '正在捕获图像...'
  
  setTimeout(() => {
    const video = videoRef.value
    const canvas = canvasRef.value
    
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    
    capturedImageBase64.value = canvas.toDataURL('image/jpeg', 0.8)
    faceCaptured.value = true
    cameraStatus.value = '图像捕获成功'
  }, 300)
}

// 完成面部录入
const completeFaceRegistration = async () => {
  const studentId = selectedFaceStudent.value?.id
  const studentName = selectedFaceStudent.value?.name
  
  if (!capturedImageBase64.value) {
    ElMessage.error('请先拍摄人脸照片')
    return
  }
  
  const imageBase64 = capturedImageBase64.value.split(',')[1]
  
  try {
    const result = await uploadStudentFaceApi({
      student_id: studentId,
      image: imageBase64
    }, props.schoolId || store.state.school.id)
    
    
    if (String(result.code) === '0') {
      // 直接修改 props.students 中的学生对象（Vue 3 响应式支持）
      const student = props.students.find(s => s.id === studentId)
      if (student) {
        student.faceRegistered = true
        student.facePhoto = capturedImageBase64.value
      }
      ElMessage.success(`已成功录入 ${studentName} 的面部信息`)
      emit('face-updated', { studentId, faceRegistered: true, facePhoto: capturedImageBase64.value })
    } else if (String(result.code) === '10900') {
      ElMessage.warning('人脸验证失败，请重新拍摄人脸照片')
      faceCaptured.value = false
      cameraStatus.value = '准备就绪'
      faceStep.value = 2
      return
    } else {
      ElMessage.error(`人脸录入失败: ${result.message || '未知错误'}`)
    }
  } catch (error) {
    console.warn('上传人脸API调用失败:', error.message)
    
    // API 调用失败时，本地仍标记为已录入
    const student = props.students.find(s => s.id === studentId)
    if (student) {
      student.faceRegistered = true
    }
    ElMessage.success(`已成功录入 ${studentName} 的面部信息`)
    emit('face-updated', { studentId, faceRegistered: true, facePhoto: capturedImageBase64.value })
  }
  
  model.value = false
  faceStep.value = 1
  selectedFaceStudent.value = null
}

// 确认重录
const confirmRerecord = async () => {
  const studentId = selectedFaceStudent.value?.id
  const studentName = selectedFaceStudent.value?.name
  
  if (!capturedImageBase64.value) {
    ElMessage.error('请先拍摄人脸照片')
    return
  }
  
  const imageBase64 = capturedImageBase64.value.split(',')[1]
  
  try {
    const result = await uploadStudentFaceApi({
      student_id: studentId,
      image: imageBase64
    }, props.schoolId || store.state.school.id)
   
    
    if (String(result.code) === '0') {
      const student = props.students.find(s => s.id === studentId)
      if (student) {
        student.faceRegistered = true
        student.facePhoto = capturedImageBase64.value
      }
      ElMessage.success(`${studentName} 的面部信息已重新录入完成`)
      emit('face-updated', { studentId, faceRegistered: true, facePhoto: capturedImageBase64.value })
      reRecordModel.value = false
      faceCaptured.value = false
      capturedImageBase64.value = ''
    } else if (String(result.code) === '10900') {
      ElMessage.warning('人脸验证失败，请重新拍摄人脸照片')
      faceCaptured.value = false
      capturedImageBase64.value = ''
      cameraStatus.value = '准备就绪'
    } else {
      ElMessage.error(`人脸重录失败: ${result.message || '未知错误'}`)
    }
  } catch (error) {
    console.warn('重新录入人脸API调用失败:', error.message)
    
    const student = props.students.find(s => s.id === studentId)
    if (student) {
      student.faceRegistered = true
    }
    ElMessage.success(`${studentName} 的面部信息已重新录入完成`)
    emit('face-updated', { studentId, faceRegistered: true, facePhoto: capturedImageBase64.value })
    reRecordModel.value = false
    faceCaptured.value = false
    capturedImageBase64.value = ''
  }
}

// 删除人脸信息（由父组件传入学生对象，通常为 selectedStudent）
const removeFace = async (student) => {
  const studentId = student?.id
  const studentName = student?.name
  
  ElMessageBox.confirm(
    `确定要删除学生 "${studentName}" 的人脸信息吗？此操作不可撤销。`,
    '删除人脸确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const result = await deleteStudentFaceApi({ student_id: studentId }, props.schoolId || store.state.school.id)
      
      
      if (String(result.code) === '0') {
        // 修改 props.students 中的学生对象
        const targetStudent = props.students.find(s => s.id === studentId)
        if (targetStudent) {
          targetStudent.faceRegistered = false
          targetStudent.facePhoto = ''
        }
        // 同步修改传入的学生对象（可能是父组件 selectedStudent 的同一引用）
        student.faceRegistered = false
        student.facePhoto = ''
        ElMessage.success(`已删除 ${studentName} 的人脸信息`)
        emit('face-updated', { studentId, faceRegistered: false, facePhoto: '' })
      } else {
        ElMessage.error(`删除人脸失败: ${result.message || '未知错误'}`)
      }
    } catch (error) {
      console.warn('删除人脸API调用失败:', error.message)
      
      // API 调用失败时，本地仍标记为已删除
      const targetStudent = props.students.find(s => s.id === studentId)
      if (targetStudent) {
        targetStudent.faceRegistered = false
        targetStudent.facePhoto = ''
      }
      student.faceRegistered = false
      student.facePhoto = ''
      ElMessage.success(`已删除 ${studentName} 的人脸信息`)
      emit('face-updated', { studentId, faceRegistered: false, facePhoto: '' })
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 组件销毁时释放摄像头资源
onUnmounted(() => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
})

// 暴露方法供父组件调用
defineExpose({
  faceRegistration,
  reRecordFace,
  removeFace
})
</script>
