<template>
  <div class="video-player" ref="playerContainer">
    <div class="video-wrapper">
      <video
        ref="videoRef"
        class="video-element"
        :src="encodedSrc"
        playsinline
        preload="metadata"
        :muted="isMuted"
        :volume="volume"
        :playback-rate="playbackRate"
        @timeupdate="handleTimeUpdate"
        @loadedmetadata="handleLoadedMetadata"
        @durationchange="handleDurationChange"
        @loadeddata="handleLoadedData"
        @canplay="handleCanPlay"
        @ended="handleEnded"
        @play="handlePlay"
        @pause="handlePause"
        @volumechange="handleVolumeChange"
        @error="handleError"
      />

      <div v-if="!src || !isLoaded" class="video-overlay">
        <div class="placeholder-content">
          <div class="play-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="2" y="2" width="20" height="15" rx="2" />
              <path d="m7 10 5 3-5 3Z" />
            </svg>
          </div>
          <p>{{ src ? '加载中...' : '暂无视频数据' }}</p>
        </div>
      </div>
    </div>

    <div class="controls-container">
      <div class="controls-left">
        <button class="control-btn play-btn" @click="togglePlay" :disabled="!src">
          <svg v-if="!isPlaying" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="6" y="4" width="4" height="16" />
            <rect x="14" y="4" width="4" height="16" />
          </svg>
        </button>

        <button class="control-btn" @click="stepBackward" :disabled="!src || currentTime <= 0" title="后退一帧">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
            <path d="M22 12H18" />
          </svg>
        </button>

        <button class="control-btn" @click="stepForward" :disabled="!src || currentTime >= duration" title="前进一帧">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
            <path d="M2 12h4" />
          </svg>
        </button>
      </div>

      <div class="progress-container">
        <span class="time-display">{{ formatTime(currentTime) }}</span>
        <div class="progress-bar-wrapper" @click="seek">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: progressPercent + '%' }" />
            <div
              v-for="(marker, index) in markers"
              :key="index"
              class="progress-marker"
              :style="{ left: (marker.time / duration * 100) + '%' }"
              :title="marker.label"
            />
          </div>
          <div class="progress-thumb" :style="{ left: progressPercent + '%' }" />
        </div>
        <span class="time-display">{{ formatTime(duration) }}</span>
      </div>

      <div class="controls-right">
        <div class="volume-control">
          <button class="control-btn" @click="toggleMute">
            <svg v-if="isMuted || volume === 0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
            <svg v-else-if="volume < 0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            :value="volume"
            @input="handleVolumeInput"
            class="volume-slider"
          />
        </div>

        <select class="speed-select" :value="playbackRate" @change="handleSpeedChange">
          <option :value="0.25">0.25x</option>
          <option :value="0.5">0.5x</option>
          <option :value="0.75">0.75x</option>
          <option :value="1">1x</option>
          <option :value="1.25">1.25x</option>
          <option :value="1.5">1.5x</option>
          <option :value="2">2x</option>
        </select>

        <button class="control-btn" @click="handleDownload" :disabled="!src" title="下载视频">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </button>

        <button class="control-btn" @click="toggleFullscreen">
          <FullScreen :size="18" :class="{ 'rotate-180': isFullscreen }" />
        </button>
      </div>
    </div>

    <div v-if="markers.length > 0" class="markers-panel">
      <div class="markers-header">
        <span class="markers-title">关键帧标记</span>
        <span class="markers-count">{{ markers.length }} 个标记</span>
      </div>
      <div class="markers-list">
        <div
          v-for="(marker, index) in markers"
          :key="index"
          class="marker-item"
          @click="seekToMarker(marker.time)"
        >
          <span class="marker-time">{{ formatTime(marker.time) }}</span>
          <span class="marker-label">{{ marker.label }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, watch, computed } from 'vue'
import { FullScreen} from '@element-plus/icons-vue'

const props = defineProps({
  src: {
    type: String,
    // 默认使用本地示例视频
    // 如需移除示例视频，请将 default 改为 ''
    default: '/示例视频.mp4'
  },
  autoplay: {
    type: Boolean,
    default: false
  },
  loop: {
    type: Boolean,
    default: false
  },
  markers: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['timeupdate', 'loadedmetadata', 'ended', 'play', 'pause', 'seek'])

const playerContainer = ref(null)
const videoRef = ref(null)
const isPlaying = ref(false)
const isFullscreen = ref(false)
const isMuted = ref(false)
const isLoaded = ref(false)
const currentTime = ref(0)
const duration = ref(0)
const volume = ref(1)
const playbackRate = ref(1)

const progressPercent = computed(() => {
  if (!duration.value || !currentTime.value) return 0
  return (currentTime.value / duration.value) * 100
})

const encodedSrc = computed(() => {
  if (!props.src) return ''
  if (props.src.startsWith('data:')) return props.src
  if (props.src.startsWith('http://') || props.src.startsWith('https://')) return props.src
  
  const url = new URL(props.src, window.location.origin)
  return url.toString()
})

const formatTime = (time) => {
  if (isNaN(time) || time === 0) return '00:00'
  const minutes = Math.floor(time / 60)
  const seconds = Math.floor(time % 60)
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

const handleDownload = () => {
  if (!props.src) return
  const link = document.createElement('a')
  link.href = props.src
  link.download = props.src.split('/').pop() || 'video.mp4'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const togglePlay = () => {
  if (!videoRef.value) return
  if (isPlaying.value) {
    videoRef.value.pause()
  } else {
    videoRef.value.play().catch(() => {})
  }
}

const stepForward = () => {
  if (!videoRef.value || currentTime.value >= duration.value) return
  const frameTime = 1 / 30
  videoRef.value.currentTime = Math.min(currentTime.value + frameTime, duration.value)
}

const stepBackward = () => {
  if (!videoRef.value || currentTime.value <= 0) return
  const frameTime = 1 / 30
  videoRef.value.currentTime = Math.max(currentTime.value - frameTime, 0)
}

const seek = (event) => {
  if (!videoRef.value || !duration.value) return
  const rect = event.currentTarget.getBoundingClientRect()
  const percent = (event.clientX - rect.left) / rect.width
  videoRef.value.currentTime = percent * duration.value
  emit('seek', videoRef.value.currentTime)
}

const seekToMarker = (time) => {
  if (!videoRef.value) return
  videoRef.value.currentTime = time
  emit('seek', time)
}

const toggleMute = () => {
  if (!videoRef.value) return
  videoRef.value.muted = !videoRef.value.muted
}

const handleVolumeInput = (event) => {
  if (!videoRef.value) return
  videoRef.value.volume = parseFloat(event.target.value)
}

const toggleFullscreen = async () => {
  if (!playerContainer.value) return

  try {
    if (!document.fullscreenElement) {
      await playerContainer.value.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch (e) {
    console.error('Fullscreen error:', e)
  }
}

const handleSpeedChange = (event) => {
  if (!videoRef.value) return
  playbackRate.value = parseFloat(event.target.value)
  videoRef.value.playbackRate = playbackRate.value
}

const handleTimeUpdate = () => {
  if (videoRef.value) {
    currentTime.value = videoRef.value.currentTime
    emit('timeupdate', currentTime.value)
  }
}

const handleLoadedMetadata = () => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration
    isLoaded.value = true
    emit('loadedmetadata', duration.value)
  }
}

const handleLoadedData = () => {
  isLoaded.value = true
}

const handleCanPlay = () => {
  isLoaded.value = true
}

const handleError = (event) => {
  const video = event.target
  const error = video.error
  const errorMessages = {
    1: 'MEDIA_ERR_ABORTED - 视频加载被用户中断',
    2: 'MEDIA_ERR_NETWORK - 网络错误导致视频加载失败',
    3: 'MEDIA_ERR_DECODE - 视频解码失败',
    4: 'MEDIA_ERR_SRC_NOT_SUPPORTED - 视频格式不支持或资源不存在',
    5: 'MEDIA_ERR_ENCRYPTED - 视频加密无法解密'
  }
  
  console.error('视频加载错误:', errorMessages[error?.code] || '未知错误')
  console.error('视频URL:', video.src)
  console.error('视频error对象:', error)
  isLoaded.value = false
}

const handleDurationChange = () => {
  if (videoRef.value) {
    duration.value = videoRef.value.duration
  }
}

const handleEnded = () => {
  isPlaying.value = false
  if (props.loop && videoRef.value) {
    videoRef.value.currentTime = 0
    videoRef.value.play().catch(() => {})
  }
  emit('ended')
}

const handlePlay = () => {
  isPlaying.value = true
  emit('play')
}

const handlePause = () => {
  isPlaying.value = false
  emit('pause')
}

const handleVolumeChange = () => {
  if (videoRef.value) {
    volume.value = videoRef.value.volume
    isMuted.value = videoRef.value.muted
  }
}

const handleKeydown = (event) => {
  if (!videoRef.value || !props.src) return

  const target = event.target
  if (target.tagName === 'INPUT' || target.tagName === 'SELECT') return

  switch (event.code) {
    case 'Space':
      event.preventDefault()
      togglePlay()
      break
    case 'ArrowLeft':
      event.preventDefault()
      videoRef.value.currentTime = Math.max(currentTime.value - 5, 0)
      break
    case 'ArrowRight':
      event.preventDefault()
      videoRef.value.currentTime = Math.min(currentTime.value + 5, duration.value)
      break
    case 'ArrowUp':
      event.preventDefault()
      stepForward()
      break
    case 'ArrowDown':
      event.preventDefault()
      stepBackward()
      break
    case 'KeyF':
      event.preventDefault()
      toggleFullscreen()
      break
    case 'KeyM':
      event.preventDefault()
      toggleMute()
      break
  }
}

const handleFullscreenChange = () => {
  isFullscreen.value = !!document.fullscreenElement
}

watch(() => props.src, () => {
  isLoaded.value = false
  currentTime.value = 0
  duration.value = 0
  if (videoRef.value) {
    videoRef.value.load()
    if (props.autoplay) {
      videoRef.value.play().catch(() => {})
    }
  }
})

onMounted(() => {
  if (videoRef.value && props.autoplay) {
    videoRef.value.play().catch(() => {})
  }
  document.addEventListener('keydown', handleKeydown)
  document.addEventListener('fullscreenchange', handleFullscreenChange)
})

onBeforeUnmount(() => {
  if (videoRef.value) {
    videoRef.value.pause()
    videoRef.value.src = ''
    if (videoRef.value.parentNode) {
      videoRef.value.parentNode.removeChild(videoRef.value)
    }
  }
  document.removeEventListener('keydown', handleKeydown)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
})

defineExpose({
  videoRef
})
</script>

<style scoped>
.video-player {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  background: #1a1a2e;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
}

.video-wrapper {
  flex: 1;
  position: relative;
  background: #000;
  min-height: 200px;
}

.video-element {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.video-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.9);
  z-index: 10;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #9CA3AF;
}

.play-icon {
  opacity: 0.6;
}

.placeholder-content p {
  margin: 0;
  font-size: 14px;
}

.controls-container {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.95) 0%, rgba(0, 0, 0, 0.85) 100%);
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.control-btn {
  width: 34px;
  height: 34px;
  border: none;
  background: rgba(255, 255, 255, 0.08);
  border-radius: 8px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  transition: all 0.2s ease;
  padding: 0;
}

.control-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.15);
  transform: scale(1.05);
}

.control-btn:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.control-btn svg {
  width: 18px;
  height: 18px;
}

.play-btn {
  width: 40px;
  height: 40px;
  background: #1E5AA8;
}

.play-btn:hover:not(:disabled) {
  background: #236B3A;
}

.progress-container {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
}

.time-display {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
  min-width: 48px;
  text-align: center;
  font-variant-numeric: tabular-nums;
}

.progress-bar-wrapper {
  flex: 1;
  height: 5px;
  position: relative;
  cursor: pointer;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  overflow: visible;
}

.progress-bar {
  width: 100%;
  height: 100%;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #1E5AA8 0%, #3B82F6 100%);
  border-radius: 3px;
  transition: width 0.1s linear;
}

.progress-marker {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 10px;
  height: 10px;
  background: #F5A623;
  border-radius: 50%;
  border: 2px solid #fff;
  cursor: pointer;
  transition: transform 0.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
}

.progress-marker:hover {
  transform: translate(-50%, -50%) scale(1.4);
}

.progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 12px;
  height: 12px;
  background: #fff;
  border-radius: 50%;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
  transition: left 0.1s linear;
}

.volume-control {
  display: flex;
  align-items: center;
  gap: 8px;
}

.volume-slider {
  width: 55px;
  height: 4px;
  cursor: pointer;
  accent-color: #1E5AA8;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 2px;
  outline: none;
}

.speed-select {
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #fff;
  padding: 4px 10px;
  border-radius: 6px;
  font-size: 12px;
  cursor: pointer;
  outline: none;
  min-width: 60px;
}

.speed-select option {
  background: #1a1a2e;
  color: #fff;
  border: none;
}

.markers-panel {
  background: rgba(0, 0, 0, 0.85);
  padding: 10px 14px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.markers-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.markers-title {
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 500;
}

.markers-count {
  color: rgba(255, 255, 255, 0.5);
  font-size: 11px;
}

.markers-list {
  max-height: 100px;
  overflow-y: auto;
}

.marker-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 6px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.marker-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

.marker-time {
  color: #1E5AA8;
  font-size: 12px;
  font-weight: 600;
  min-width: 48px;
  font-variant-numeric: tabular-nums;
}

.marker-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 12px;
}

::-webkit-scrollbar {
  width: 4px;
}

.rotate-180 {
  transform: rotate(180deg);
  transition: transform 0.3s ease;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}
</style>