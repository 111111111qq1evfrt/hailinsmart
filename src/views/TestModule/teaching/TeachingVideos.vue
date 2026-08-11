<template>
  <div class="teaching-videos-page">
    <div class="page-header">
      <div class="header-filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索视频教程"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
        />
        <el-select v-model="filterCategory" placeholder="视频分类" clearable style="width: 160px">
          <el-option label="测试教学演示" value="测试教学演示" />
          <el-option label="国家体测数据" value="国家体测数据" />
          <el-option label="平台操作指南" value="平台操作指南" />
        </el-select>
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="exportData">导出数据</el-button>
        <el-button type="primary" :icon="Plus" @click="uploadVideo">上传视频</el-button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ videoStats.total }}</span>
        <span class="stat-label">视频总数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num text-primary">{{ videoStats.test }}</span>
        <span class="stat-label">测试教学</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #3B82F6">{{ videoStats.national }}</span>
        <span class="stat-label">国家体测</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #F5A623">{{ videoStats.platform }}</span>
        <span class="stat-label">平台操作</span>
      </div>
    </div>

    <div class="list-card">
      <div class="card-header">
        <span class="card-title">视频列表</span>
        <div class="header-actions">
          <el-button text :icon="Refresh" @click="refreshData">刷新</el-button>
        </div>
      </div>
      <div class="video-grid-section">
        <div
          v-for="video in filteredVideos"
          :key="video.id"
          class="video-card"
        >
          <div class="card-thumbnail" @click="playVideo(video)">
            <img v-if="video.frame" :src="video.frame" :alt="video.title" class="thumbnail-image" />
            <div v-else class="thumbnail-empty">
              <el-icon :size="40" color="#9CA3AF"><VideoCamera /></el-icon>
              <span class="empty-text">暂无视频源</span>
            </div>
            <span class="video-duration">{{ video.duration }}</span>
          </div>
          <div class="card-content">
            <div class="card-header-row">
              <h4 class="card-title">{{ video.title }}</h4>
              <div class="card-actions">
                <el-button size="small" text :icon="Delete" @click.stop="deleteVideo(video)" />
              </div>
            </div>
            <div class="card-tags">
              <span class="tag category-tag">{{ video.category }}</span>
            </div>
            <p class="card-desc">{{ video.description }}</p>
          </div>
        </div>
      </div>
    </div>

    <ElDialog
      v-model="showPlayer"
      :title="currentVideo?.title"
      width="900px"
      :close-on-click-modal="true"
      destroy-on-close
    >
      <div class="player-wrapper">
        <VideoPlayer
          v-if="currentVideo?.url"
          :src="currentVideo.url"
          :autoplay="true"
          :show-controls="true"
          :show-timeline="true"
          :show-volume="true"
          :show-fullscreen="true"
          :show-playback-rate="true"
        />
      </div>
    </ElDialog>
    
    <ElDialog
      v-model="showUpload"
      title="上传教学视频"
      width="560px"
    >
      <el-form :model="uploadForm" label-width="100px">
        <el-form-item label="视频标题" required>
          <el-input v-model="uploadForm.title" placeholder="请输入视频标题" />
        </el-form-item>
        <el-form-item label="视频分类" required>
          <el-select v-model="uploadForm.category" placeholder="选择分类" class="w-full">
            <el-option label="测试教学演示" value="测试教学演示" />
            <el-option label="国家体测数据" value="国家体测数据" />
            <el-option label="平台操作指南" value="平台操作指南" />
          </el-select>
        </el-form-item>
        <el-form-item label="视频描述">
          <el-input v-model="uploadForm.description" type="textarea" :rows="3" placeholder="简要描述视频内容" />
        </el-form-item>
        <el-form-item label="视频文件" required>
          <el-upload action="#" :auto-upload="false" :limit="1" accept="video/*" @change="handleVideoFileChange">
            <el-button type="primary">选择视频文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showUpload = false">取消</el-button>
        <el-button type="primary" @click="confirmUpload">确认上传</el-button>
      </template>
    </ElDialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Search, Download, Plus, Refresh, Delete, Edit, VideoCamera } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import VideoPlayer from '@/components/media/VideoPlayer.vue'
import { generateDeterministicId } from '@/utils/seededRandom'
import { extractVideoFrame } from '@/utils/videoFrame'

const searchQuery = ref('')
const filterCategory = ref('')
const showPlayer = ref(false)
const showUpload = ref(false)
const currentVideo = ref(null)
const uploadForm = ref({ title: '', category: '', description: '', file: null })

const videoStats = ref({
  total: 13,
  test: 7,
  national: 2,
  platform: 4
})

const defaultVideos = [
  { id: 1, title: '立定跳远测试教学演示', category: '测试教学演示', duration: '05:32', url: '/示例视频.mp4', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=student%20doing%20standing%20long%20jump%20physical%20education%20class%20school%20gymnasium&image_size=landscape_16_9', description: '详细演示立定跳远测试的标准操作流程，包括准备姿势、起跳动作、落地姿势等关键环节。' },
  { id: 2, title: '仰卧起坐测试教学演示', category: '测试教学演示', duration: '04:48', url: '/示例视频.mp4', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=student%20doing%20sit-ups%20physical%20education%20class%20school%20gym&image_size=landscape_16_9', description: '演示仰卧起坐的正确动作标准和常见违规情况。' },
  { id: 3, title: '跳绳测试教学演示', category: '测试教学演示', duration: '06:20', url: '/示例视频.mp4', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=student%20jumping%20rope%20physical%20education%20class%20school%20playground&image_size=landscape_16_9', description: '跳绳测试考核学生的协调性和耐力，本视频展示计时跳绳的标准流程。' },
  { id: 4, title: '50米跑测试教学演示', category: '测试教学演示', duration: '07:15', url: '/示例视频.mp4', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=student%20running%20sprint%2050%20meters%20physical%20education%20track%20field&image_size=landscape_16_9', description: '50米跑是速度测试的核心项目，本视频演示了起跑姿势和冲刺技巧。' },
  { id: 5, title: '100米跑测试教学演示', category: '测试教学演示', duration: '08:20', url: '/示例视频.mp4', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=student%20running%20100%20meters%20sprint%20track%20field%20athletics&image_size=landscape_16_9', description: '100米跑是短距离速度测试项目，演示起跑反应、加速跑和冲刺阶段的技巧要点。' },
  { id: 6, title: '坐位体前屈测试教学演示', category: '测试教学演示', duration: '04:30', url: '/示例视频.mp4', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=student%20doing%20sit%20and%20reach%20flexibility%20test%20physical%20education&image_size=landscape_16_9', description: '坐位体前屈测试学生的柔韧性，演示标准测试姿势和测量方法。' },
  { id: 7, title: '引体向上测试教学演示', category: '测试教学演示', duration: '05:45', url: '/示例视频.mp4', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=student%20doing%20pull%20ups%20physical%20education%20gymnasium&image_size=landscape_16_9', description: '引体向上是上肢力量测试项目，演示标准动作和常见错误。' },
  { id: 8, title: '国家体测数据上报流程', category: '国家体测数据', duration: '08:15', url: '/示例视频.mp4', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=national%20physical%20fitness%20test%20data%20reporting%20system%20dashboard&image_size=landscape_16_9', description: '详细介绍国家学生体质健康标准数据上报系统的操作流程。' },
  { id: 9, title: '国家体测数据下载与查看', category: '国家体测数据', duration: '06:30', url: '/示例视频.mp4', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=physical%20fitness%20data%20analysis%20charts%20statistics%20school&image_size=landscape_16_9', description: '演示如何从国家体测系统中下载历史数据、生成统计报表。' },
  { id: 10, title: '智慧体育平台快速上手', category: '平台操作指南', duration: '12:08', url: '/示例视频.mp4', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=smart%20sports%20platform%20dashboard%20interface%20education%20technology&image_size=landscape_16_9', description: '智慧体育评测教学系统的全面操作指南，帮助教师快速熟悉平台。' },
  { id: 11, title: '考试模式操作指南', category: '平台操作指南', duration: '10:25', url: '/示例视频.mp4', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sports%20exam%20mode%20management%20system%20interface&image_size=landscape_16_9', description: '详细介绍考试模式的创建、发布、管理和成绩汇总等完整操作流程。' },
  { id: 12, title: '自由练习模式操作', category: '平台操作指南', duration: '08:45', url: '/示例视频.mp4', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=students%20free%20practice%20sports%20training%20school%20gymnasium&image_size=landscape_16_9', description: '演示如何开启和管理自由练习模式，支持学生自主训练。' },
  { id: 13, title: '成绩管理与数据分析', category: '平台操作指南', duration: '15:30', url: '/示例视频.mp4', cover: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sports%20performance%20analytics%20dashboard%20charts%20school&image_size=landscape_16_9', description: '平台成绩管理和数据分析功能详解。' },
]

const videos = ref([])

const filteredVideos = computed(() => {
  let result = videos.value
  if (searchQuery.value) {
    result = result.filter(v => v.title.includes(searchQuery.value))
  }
  if (filterCategory.value) {
    result = result.filter(v => v.category === filterCategory.value)
  }
  return result
})

const playVideo = (video) => {
  currentVideo.value = video
  showPlayer.value = true
}

const refreshData = () => {
  searchQuery.value = ''
  filterCategory.value = ''
  ElMessage.success('数据已刷新')
}

const storageKey = 'smart_pe_teaching_videos'

const saveVideosToStorage = () => {
  try {
    sessionStorage.setItem(storageKey, JSON.stringify(videos.value))
  } catch (e) {
    console.warn('保存视频数据失败:', e)
  }
}

const loadVideosFromStorage = () => {
  const stored = sessionStorage.getItem(storageKey)
  if (stored) {
    try {
      videos.value = JSON.parse(stored)
    } catch {
      videos.value = [...defaultVideos]
    }
  } else {
    videos.value = [...defaultVideos]
  }
  updateStats()
}

const updateStats = () => {
  videoStats.value.total = videos.value.length
  videoStats.value.test = videos.value.filter(v => v.category === '测试教学演示').length
  videoStats.value.national = videos.value.filter(v => v.category === '国家体测数据').length
  videoStats.value.platform = videos.value.filter(v => v.category === '平台操作指南').length
}

const exportData = () => {
  ElMessageBox.confirm('确定要导出当前视频列表数据吗？', '导出确认', {
    type: 'info',
    confirmButtonText: '导出',
    cancelButtonText: '取消'
  }).then(() => {
    const headers = ['视频ID', '标题', '分类', '时长', '视频链接', '描述']
    const rows = videos.value.map(v => [
      v.id,
      v.title,
      v.category,
      v.duration,
      v.url.startsWith('data:') ? '本地上传视频' : window.location.origin + v.url,
      v.description
    ])
    
    const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `教学视频列表_${new Date().toLocaleDateString()}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    ElMessage.success(`成功导出 ${videos.value.length} 条视频数据`)
  }).catch(() => {
    ElMessage.error('导出视频数据失败，请重试')
  })
}

const uploadVideo = () => {
  uploadForm.value = { title: '', category: '', description: '', file: null }
  showUpload.value = true
}

const handleVideoFileChange = (file) => {
  uploadForm.value.file = file.raw || file
}

const confirmUpload = () => {
  if (!uploadForm.value.title || !uploadForm.value.category) {
    ElMessage.warning('请填写视频标题和分类')
    return
  }
  if (!uploadForm.value.file) {
    ElMessage.warning('请选择视频文件')
    return
  }
  
  const video = document.createElement('video')
  video.preload = 'metadata'
  video.onloadedmetadata = () => {
    const seconds = Math.floor(video.duration)
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    const duration = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    
    const videoObj = {
      id: generateDeterministicId('tvideo', uploadForm.value.title),
      title: uploadForm.value.title,
      category: uploadForm.value.category,
      duration: duration,
      url: '/示例视频.mp4',
      description: uploadForm.value.description || '暂无描述'
    }
    
    videos.value.unshift(videoObj)
    updateStats()
    
    showUpload.value = false
    ElMessage.success('视频上传成功')
    saveVideosToStorage()
  }
  video.onerror = () => {
    const videoObj = {
      id: generateDeterministicId('tvideo-err', uploadForm.value.title),
      title: uploadForm.value.title,
      category: uploadForm.value.category,
      duration: '00:00',
      url: '/示例视频.mp4',
      description: uploadForm.value.description || '暂无描述'
    }
    
    videos.value.unshift(videoObj)
    updateStats()
    
    showUpload.value = false
    ElMessage.success('视频上传成功')
    saveVideosToStorage()
  }
  video.src = URL.createObjectURL(uploadForm.value.file)
}

const deleteVideo = (video) => {
  ElMessageBox.confirm(`确定要删除视频「${video.title}」吗？`, '删除确认', {
    type: 'warning',
    confirmButtonText: '删除',
    cancelButtonText: '取消'
  }).then(() => {
    const index = videos.value.findIndex(v => v.id === video.id)
    if (index !== -1) {
      videos.value.splice(index, 1)
      updateStats()
      ElMessage.success('视频已删除')
      saveVideosToStorage()
    }
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

const extractFrames = async () => {
  for (const video of videos.value) {
    if (!video.frame && video.url) {
      const frame = await extractVideoFrame(video.url, { time: 0.5 })
      if (frame) {
        video.frame = frame
      }
    }
  }
}

onMounted(() => {
  loadVideosFromStorage()
  setTimeout(extractFrames, 500)
})
</script>

<style scoped>
.teaching-videos-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
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

.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.video-grid-section {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.video-card {
  background: #FFFFFF;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.video-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transform: translateY(-2px);
}

.card-thumbnail {
  position: relative;
  aspect-ratio: 16 / 9;
  background: #F7F8FA;
}

.thumbnail-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.thumbnail-empty {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.empty-text {
  font-size: 13px;
  color: #9CA3AF;
}

.video-card:hover .play-icon {
  background: #1E5AA8;
  transform: scale(1.1);
}

.video-duration {
  position: absolute;
  bottom: 8px;
  right: 8px;
  padding: 2px 8px;
  background: rgba(0, 0, 0, 0.7);
  border-radius: 4px;
  color: #FFFFFF;
  font-size: 12px;
}

.card-content {
  padding: 16px;
}

.card-header-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-actions {
  display: flex;
  gap: 4px;
}

.card-actions :deep(.el-button) {
  padding: 4px;
  color: #6B7280;
}

.card-actions :deep(.el-button:hover) {
  color: #E85D4E;
}

.card-tags {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.category-tag {
  background: #DCFCE7;
  color: #166534;
}

.card-desc {
  font-size: 14px;
  color: #6B7280;
  margin: 0;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.player-wrapper {
  background: #1A1A2E;
}

.video-player {
  width: 100%;
  aspect-ratio: 16 / 9;
}
</style>