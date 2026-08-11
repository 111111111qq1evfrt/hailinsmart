<template>
  <div class="video-storage-container">
    <!-- 页面标题和操作栏 -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">视频存储管理</h2>
        <div class="storage-info">
          <el-tag type="info" size="large">
            <el-icon><FolderOpened /></el-icon>
            总视频数: {{ totalVideos }}
          </el-tag>
          <el-tag type="warning" size="large">
            <el-icon><PieChart /></el-icon>
            已用空间: {{ usedSpace }} GB
          </el-tag>
          <el-tag type="success" size="large">
            <el-icon><DataLine /></el-icon>
            总容量: {{ totalSpace }} GB
          </el-tag>
        </div>
      </div>
      <div class="header-right">
        <el-button type="primary" :icon="Upload" @click="handleUpload">
          上传视频
        </el-button>
        <el-button :icon="Delete" @click="handleBatchDelete" :disabled="selectedVideos.length === 0">
          批量删除
        </el-button>
        <el-button :icon="Download" @click="handleBatchDownload" :disabled="selectedVideos.length === 0">
          批量下载
        </el-button>
      </div>
    </div>

    <!-- 筛选栏 -->
    <div class="filter-bar">
      <el-input
        v-model="searchKeyword"
        placeholder="搜索视频名称、学生姓名、学号"
        :prefix-icon="Search"
        style="width: 280px"
        clearable
      />
      <el-select v-model="filterType" placeholder="视频类型" style="width: 150px" clearable>
        <el-option label="全部类型" value="" />
        <el-option label="体育考试" value="exam" />
        <el-option label="国家体测" value="national" />
        <el-option label="自由练习" value="practice" />
        <el-option label="教学视频" value="teaching" />
      </el-select>
      <el-select v-model="filterGrade" placeholder="年级" style="width: 120px" clearable>
        <el-option label="全部年级" value="all" />
        <el-option label="一年级" value="1" />
        <el-option label="二年级" value="2" />
        <el-option label="三年级" value="3" />
        <el-option label="四年级" value="4" />
        <el-option label="五年级" value="5" />
        <el-option label="六年级" value="6" />
      </el-select>
      <el-date-picker
        v-model="dateRange"
        type="daterange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        style="width: 280px"
      />
      <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
      <el-button :icon="Refresh" @click="handleReset">重置</el-button>
    </div>

    <!-- 视频列表 -->
    <div class="video-list">
      <el-table
        :data="filteredVideos"
        class="w-full"
        @selection-change="handleSelectionChange"
        :row-key="row => row.id"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column label="缩略图" width="120">
          <template #default="scope">
            <div class="thumbnail">
              <img :src="scope.row.thumbnail" alt="视频缩略图" />
              <div class="play-icon">
                <el-icon><VideoPlay /></el-icon>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="videoName" label="视频名称" min-width="180" />
        <el-table-column prop="studentName" label="学生姓名" width="100" />
        <el-table-column prop="studentId" label="学号" width="120" />
        <el-table-column prop="grade" label="年级" width="80" />
        <el-table-column prop="class" label="班级" width="100" />
        <el-table-column label="视频类型" width="100">
          <template #default="scope">
            <el-tag :type="getTypeTagType(scope.row.type)" size="small">
              {{ getTypeText(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="project" label="测试项目" width="120" />
        <el-table-column prop="duration" label="时长" width="80" />
        <el-table-column prop="size" label="大小" width="100" />
        <el-table-column prop="uploadTime" label="上传时间" width="160" />
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <el-button text type="primary" size="small" @click="handlePlay(scope.row)">
              <el-icon><VideoPlay /></el-icon>
              播放
            </el-button>
            <el-button text type="primary" size="small" @click="handleDownload(scope.row)">
              <el-icon><Download /></el-icon>
              下载
            </el-button>
            <el-button text type="danger" size="small" @click="handleDelete(scope.row)">
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 分页 -->
    <div class="pagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="filteredVideos.length"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>

    <!-- 视频播放弹窗 -->
    <el-dialog
      v-model="playDialogVisible"
      title="视频播放"
      width="70%"
      :close-on-click-modal="false"
      @close="handlePlayDialogClose"
    >
      <div class="video-player">
        <VideoPlayer
          ref="videoPlayerRef"
          :src="currentVideo?.videoUrl"
        />
      </div>
      <div class="video-info">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="视频名称">{{ currentVideo?.videoName }}</el-descriptions-item>
          <el-descriptions-item label="学生姓名">{{ currentVideo?.studentName }}</el-descriptions-item>
          <el-descriptions-item label="学号">{{ currentVideo?.studentId }}</el-descriptions-item>
          <el-descriptions-item label="班级">{{ currentVideo?.grade }}{{ currentVideo?.class }}班</el-descriptions-item>
          <el-descriptions-item label="测试项目">{{ currentVideo?.project }}</el-descriptions-item>
          <el-descriptions-item label="成绩">{{ currentVideo?.score }}分</el-descriptions-item>
          <el-descriptions-item label="视频类型">{{ getTypeText(currentVideo?.type) }}</el-descriptions-item>
          <el-descriptions-item label="上传时间">{{ currentVideo?.uploadTime }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 上传视频弹窗 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传视频"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="视频文件">
          <el-upload
            class="upload-demo"
            drag
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
            :file-list="fileList"
            accept="video/*"
          >
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将视频文件拖到此处，或<em>点击上传</em>
            </div>
            <template #tip>
              <div class="el-upload__tip">
                支持 MP4、AVI、MOV 格式，单个文件不超过 500MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item label="视频类型">
          <el-select v-model="uploadForm.type" placeholder="请选择视频类型" class="w-full">
            <el-option label="体育考试" value="exam" />
            <el-option label="国家体测" value="national" />
            <el-option label="自由练习" value="practice" />
            <el-option label="教学视频" value="teaching" />
          </el-select>
        </el-form-item>
        <el-form-item label="测试项目">
          <el-select v-model="uploadForm.project" placeholder="请选择测试项目" class="w-full">
            <el-option label="立定跳远" value="立定跳远" />
            <el-option label="仰卧起坐" value="仰卧起坐" />
            <el-option label="引体向上" value="引体向上" />
            <el-option label="坐位体前屈" value="坐位体前屈" />
            <el-option label="50米跑" value="50米跑" />
            <el-option label="800米跑" value="800米跑" />
            <el-option label="1000米跑" value="1000米跑" />
          </el-select>
        </el-form-item>
        <el-form-item label="学生姓名">
          <el-input v-model="uploadForm.studentName" placeholder="请输入学生姓名" />
        </el-form-item>
        <el-form-item label="学号">
          <el-input v-model="uploadForm.studentId" placeholder="请输入学号" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleConfirmUpload" :loading="uploading">
          确认上传
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Search, Refresh, Upload, Download, Delete, VideoPlay,
  FolderOpened, PieChart, DataLine, UploadFilled
} from '@element-plus/icons-vue'
import VideoPlayer from '@/components/media/VideoPlayer.vue'
import store from '@/store/global'
import { mockDB } from '@/mock'
import { usePersistedRef } from '@/composables/usePersistedRef'
import { generateDeterministicId } from '@/utils/seededRandom'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

// 生成初始视频数据
const generateInitialVideos = (sid) => {
  const students = mockDB[sid]?.students || []
  const projects = ['立定跳远', '50米跑', '仰卧起坐', '坐位体前屈', '引体向上', '1分钟跳绳']
  const types = ['exam', 'national', 'practice']
  const count = Math.min(8, students.length)
  const list = []
  for (let i = 0; i < count; i++) {
    const stu = students[i % students.length]
    const proj = projects[i % projects.length]
    const type = types[i % types.length]
    const month = ((i * 3 + 1) % 12) + 1
    const day = ((i * 7 + 5) % 28) + 1
    list.push({
      id: generateDeterministicId('video', stu.name + '_' + proj + '_' + i),
      videoName: `20260${month}${day < 10 ? '0' + day : day}_${stu.name}_${proj}.mp4`,
      studentName: stu.name,
      studentId: stu.id,
      grade: stu.grade || '三年级',
      class: (stu.class || '1班').replace('班', ''),
      type,
      project: proj,
      duration: `00:${30 + i * 8}`,
      size: `${80 + i * 15}.1 MB`,
      uploadTime: `2026-${month < 10 ? '0' + month : month}-${day < 10 ? '0' + day : day} ${9 + i}:${15 + i * 3}:00`,
      thumbnail: `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sports%20video%20thumbnail%20${i + 1}&image_size=square`,
      videoUrl: '/示例视频.mp4',
      score: 70 + i * 3
    })
  }
  return list
}

// 使用 sessionStorage 持久化视频数据
const videos = usePersistedRef(`smart_pe_video_storage_${schoolId.value}`, generateInitialVideos(schoolId.value))

// 存储信息 - 按视频数量动态计算
const totalVideos = computed(() => videos.value.length)
const usedSpace = computed(() => +((videos.value.length * 150 + 100) / 1024).toFixed(1))
const totalSpace = ref(500)

// 监听学校切换时重新加载数据
watch(schoolId, (newId) => {
  videos.value = generateInitialVideos(newId)
})

// 筛选条件
const searchKeyword = ref('')
const filterType = ref('')
const filterGrade = ref('all')
const dateRange = ref([])

// 分页
const currentPage = ref(1)
const pageSize = ref(20)

// 选中的视频
const selectedVideos = ref([])

// 弹窗状态
const playDialogVisible = ref(false)
const uploadDialogVisible = ref(false)
const currentVideo = ref(null)
const videoPlayerRef = ref(null)

// 上传相关
const uploadForm = ref({
  type: '',
  project: '',
  studentName: '',
  studentId: ''
})
const fileList = ref([])
const uploading = ref(false)

// 过滤后的视频列表
const filteredVideos = computed(() => {
  let result = [...videos.value]

  // 关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    result = result.filter(video =>
      video.videoName.toLowerCase().includes(keyword) ||
      video.studentName.toLowerCase().includes(keyword) ||
      video.studentId.toLowerCase().includes(keyword)
    )
  }

  // 类型筛选
  if (filterType.value) {
    result = result.filter(video => video.type === filterType.value)
  }

  // 年级筛选
  if (filterGrade.value && filterGrade.value !== 'all') {
    result = result.filter(video => video.grade.includes(filterGrade.value))
  }

  // 日期范围筛选
  if (dateRange.value && dateRange.value.length === 2) {
    const startDate = new Date(dateRange.value[0])
    const endDate = new Date(dateRange.value[1])
    result = result.filter(video => {
      const uploadDate = new Date(video.uploadTime)
      return uploadDate >= startDate && uploadDate <= endDate
    })
  }

  return result
})

// 获取类型标签颜色
const getTypeTagType = (type) => {
  const typeMap = {
    exam: 'primary',
    national: 'success',
    practice: 'warning',
    teaching: 'info'
  }
  return typeMap[type] || 'info'
}

// 获取类型文本
const getTypeText = (type) => {
  const typeMap = {
    exam: '体育考试',
    national: '国家体测',
    practice: '自由练习',
    teaching: '教学视频'
  }
  return typeMap[type] || type
}

// 搜索
const handleSearch = () => {
  currentPage.value = 1
}

// 重置
const handleReset = () => {
  searchKeyword.value = ''
  filterType.value = ''
  filterGrade.value = 'all'
  dateRange.value = []
  currentPage.value = 1
}

// 选择变化
const handleSelectionChange = (selection) => {
  selectedVideos.value = selection
}

// 分页变化
const handleSizeChange = (size) => {
  pageSize.value = size
}

const handleCurrentChange = (page) => {
  currentPage.value = page
}

// 播放视频
const handlePlay = (video) => {
  currentVideo.value = video
  playDialogVisible.value = true
}

// 下载视频
const handleDownload = (video) => {
  ElMessage.success(`开始下载: ${video.videoName}`)
}

// 关闭播放弹窗时停止视频
const handlePlayDialogClose = () => {
  if (videoPlayerRef.value && videoPlayerRef.value.videoRef) {
    videoPlayerRef.value.videoRef.pause()
    videoPlayerRef.value.videoRef.currentTime = 0
  }
}

// 删除视频
const handleDelete = (video) => {
  ElMessageBox.confirm(
    `确定要删除视频 "${video.videoName}" 吗？删除后无法恢复。`,
    '确认删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const index = videos.value.findIndex(v => v.id === video.id)
    if (index > -1) {
      videos.value.splice(index, 1)
      totalVideos.value = videos.value.length
      ElMessage.success('删除成功')
    }
  }).catch(() => { ElMessage.error('删除视频失败，请重试') })
}

// 批量删除
const handleBatchDelete = () => {
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedVideos.value.length} 个视频吗？删除后无法恢复。`,
    '确认批量删除',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    const selectedIds = selectedVideos.value.map(v => v.id)
    videos.value = videos.value.filter(v => !selectedIds.includes(v.id))
    totalVideos.value = videos.value.length
    selectedVideos.value = []
    ElMessage.success(`成功删除 ${selectedIds.length} 个视频`)
  }).catch(() => { ElMessage.error('批量删除视频失败，请重试') })
}

// 批量下载
const handleBatchDownload = () => {
  ElMessage.success(`开始下载 ${selectedVideos.value.length} 个视频`)
}

// 上传视频
const handleUpload = () => {
  uploadDialogVisible.value = true
}

// 文件变化
const handleFileChange = (file) => {
  fileList.value = [file]
}

// 确认上传
const handleConfirmUpload = () => {
  if (fileList.value.length === 0) {
    ElMessage.warning('请选择要上传的视频文件')
    return
  }

  uploading.value = true
  const file = fileList.value[0].raw

  const video = document.createElement('video')
  video.preload = 'metadata'
  
  video.onloadedmetadata = () => {
    const seconds = Math.floor(video.duration)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    const duration = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    
    const canvas = document.createElement('canvas')
    canvas.width = 120
    canvas.height = 80
    const ctx = canvas.getContext('2d')
    video.currentTime = Math.min(1, video.duration / 2)
    
    video.onseeked = () => {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const thumbnail = canvas.toDataURL('image/jpeg')
      
      const newVideo = {
        id: generateDeterministicId('video', file.name),
        videoName: file.name,
        studentName: uploadForm.value.studentName || '未知',
        studentId: uploadForm.value.studentId || '未知',
        grade: '一年级',
        class: '1',
        type: uploadForm.value.type || 'practice',
        project: uploadForm.value.project || '未知',
        duration: duration,
        size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
        uploadTime: new Date().toLocaleString('zh-CN', { hour12: false }),
        thumbnail: thumbnail,
        videoUrl: '/示例视频.mp4',
        score: 0
      }

      videos.value.unshift(newVideo)

      uploadForm.value = {
        type: '',
        project: '',
        studentName: '',
        studentId: ''
      }
      fileList.value = []
      uploadDialogVisible.value = false
      uploading.value = false

      ElMessage.success('视频上传成功')
    }
  }
  
  video.onerror = () => {
    const newVideo = {
      id: generateDeterministicId('video-err', file.name),
      videoName: file.name,
      studentName: uploadForm.value.studentName || '未知',
      studentId: uploadForm.value.studentId || '未知',
      grade: '一年级',
      class: '1',
      type: uploadForm.value.type || 'practice',
      project: uploadForm.value.project || '未知',
      duration: '00:00',
      size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
      uploadTime: new Date().toLocaleString('zh-CN', { hour12: false }),
      thumbnail: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sports%20video%20thumbnail%20new&image_size=square',
      videoUrl: '/示例视频.mp4',
      score: 0
    }

    videos.value.unshift(newVideo)

    uploadForm.value = {
      type: '',
      project: '',
      studentName: '',
      studentId: ''
    }
    fileList.value = []
    uploadDialogVisible.value = false
    uploading.value = false

    ElMessage.success('视频上传成功')
  }
  
  video.src = URL.createObjectURL(file)
}

onMounted(() => {
  // 初始化数据
})
</script>

<style scoped>
.video-storage-container {
  padding: 24px;
  background: #F7F8FA;
  min-height: 100vh;
}

.header-left {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.page-title {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1A1A2E;
}

.storage-info {
  display: flex;
  gap: 12px;
}

.header-right {
  display: flex;
  gap: 12px;
}

.filter-bar {
  display: flex;
  gap: 12px;
  background: #FFFFFF;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.video-list {
  background: #FFFFFF;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.thumbnail {
  position: relative;
  width: 100px;
  height: 70px;
  border-radius: 6px;
  overflow: hidden;
}

.thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.play-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 32px;
  height: 32px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #FFFFFF;
  cursor: pointer;
}

.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 24px;
  background: #FFFFFF;
  padding: 16px 20px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.video-player {
  margin-bottom: 20px;
}

.video-info {
  background: #F7F8FA;
  padding: 16px;
  border-radius: 8px;
}

.upload-demo {
  width: 100%;
}

:deep(.el-upload-dragger) {
  width: 100%;
}
</style>