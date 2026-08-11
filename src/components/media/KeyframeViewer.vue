<template>
  <div class="keyframe-viewer-container">
    <div class="viewer-content">
      <div class="canvas-wrapper">
        <canvas ref="canvasRef" class="analysis-canvas"></canvas>
        <img ref="frameImage" class="frame-image" :src="currentFrame" />
      </div>
      
      <div class="tools-panel">
        <div class="tool-section">
          <h4>绘图工具</h4>
          <div class="tool-buttons">
            <el-button 
              :icon="Mouse" 
              :class="{ active: currentTool === 'select' }" 
              @click="setTool('select')"
              title="选择"
            />
            <el-button 
              :icon="EditPen" 
              :class="{ active: currentTool === 'draw' }" 
              @click="setTool('draw')"
              title="画线"
            />
            <el-button 
              :icon="CircleCheck" 
              :class="{ active: currentTool === 'circle' }" 
              @click="setTool('circle')"
              title="画圆"
            />
            <el-button 
              :icon="Box" 
              :class="{ active: currentTool === 'rect' }" 
              @click="setTool('rect')"
              title="画矩形"
            />
            <el-button 
              :icon="Document" 
              :class="{ active: currentTool === 'text' }" 
              @click="setTool('text')"
              title="文字"
            />
            <el-button 
              :icon="Delete" 
              @click="deleteSelected"
              title="删除"
            />
          </div>
        </div>
        
        <div class="tool-section">
          <h4>颜色选择</h4>
          <div class="color-picker">
            <span 
              v-for="color in colors" 
              :key="color" 
              class="color-chip"
              :style="{ background: color }"
              :class="{ active: currentColor === color }"
              @click="currentColor = color"
            ></span>
          </div>
        </div>
        
        <div class="tool-section">
          <h4>标注列表</h4>
          <div class="annotation-list">
            <div 
              v-for="(anno, index) in annotations" 
              :key="index"
              class="annotation-item"
              :class="{ selected: selectedAnnotation === index }"
              @click="selectAnnotation(index)"
            >
              <span class="anno-color" :style="{ background: anno.color }"></span>
              <span class="anno-label">{{ anno.label || '标注 ' + (index + 1) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="frame-navigator">
      <div class="nav-buttons">
        <el-button text :icon="ArrowLeft" @click="prevFrame" />
        <span class="frame-info">帧 {{ currentFrameIndex + 1 }} / {{ totalFrames }}</span>
        <el-button text :icon="ArrowRight" @click="nextFrame" />
      </div>
      <input 
        type="range" 
        v-model="currentFrameIndex" 
        :max="totalFrames - 1"
        class="frame-slider"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { 
  Mouse, EditPen, CircleCheck, Box, Document, Delete, 
  ArrowLeft, ArrowRight 
} from '@element-plus/icons-vue'

const props = defineProps({
  frames: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['annotation-added', 'annotation-updated', 'annotation-deleted'])

const canvasRef = ref(null)
const frameImage = ref(null)
const currentFrameIndex = ref(0)
const currentTool = ref('select')
const currentColor = ref('#E85D4E')
const annotations = ref([])
const selectedAnnotation = ref(null)
const isDrawing = ref(false)
const startPoint = ref({ x: 0, y: 0 })
const currentPath = ref([])

const colors = ['#E85D4E', '#1E5AA8', '#3B82F6', '#F5A623', '#8B5CF6', '#06B6D4']

const currentFrame = ref('')
const totalFrames = ref(0)

let ctx = null

const initCanvas = () => {
  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  canvas.width = rect.width
  canvas.height = rect.height
  ctx = canvas.getContext('2d')
  
  canvas.addEventListener('mousedown', handleMouseDown)
  canvas.addEventListener('mousemove', handleMouseMove)
  canvas.addEventListener('mouseup', handleMouseUp)
  canvas.addEventListener('mouseleave', handleMouseUp)
}

const handleMouseDown = (e) => {
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  if (currentTool.value === 'select') {
    selectAnnotationAt(x, y)
    return
  }
  
  isDrawing.value = true
  startPoint.value = { x, y }
  
  if (currentTool.value === 'draw') {
    currentPath.value = [{ x, y }]
  }
}

const handleMouseMove = (e) => {
  if (!isDrawing.value) return
  
  const rect = canvasRef.value.getBoundingClientRect()
  const x = e.clientX - rect.left
  const y = e.clientY - rect.top
  
  ctx.clearRect(0, 0, canvasRef.value.width, canvasRef.value.height)
  drawAnnotations()
  
  ctx.strokeStyle = currentColor.value
  ctx.lineWidth = 2
  ctx.setLineDash([])
  
  if (currentTool.value === 'draw') {
    currentPath.value.push({ x, y })
    ctx.beginPath()
    ctx.moveTo(currentPath.value[0].x, currentPath.value[0].y)
    currentPath.value.forEach(point => ctx.lineTo(point.x, point.y))
    ctx.stroke()
  } else if (currentTool.value === 'circle') {
    const radius = Math.sqrt(Math.pow(x - startPoint.value.x, 2) + Math.pow(y - startPoint.value.y, 2))
    ctx.beginPath()
    ctx.arc(startPoint.value.x, startPoint.value.y, radius, 0, Math.PI * 2)
    ctx.stroke()
  } else if (currentTool.value === 'rect') {
    ctx.strokeRect(startPoint.value.x, startPoint.value.y, x - startPoint.value.x, y - startPoint.value.y)
  }
}

const handleMouseUp = () => {
  if (!isDrawing.value) return
  isDrawing.value = false
  
  if (currentTool.value === 'draw' && currentPath.value.length > 1) {
    annotations.value.push({
      type: 'path',
      color: currentColor.value,
      points: [...currentPath.value],
      label: ''
    })
    emit('annotation-added', annotations.value[annotations.value.length - 1])
  }
  
  currentPath.value = []
  drawAnnotations()
}

const drawAnnotations = () => {
  if (!ctx) return
  
  annotations.value.forEach((anno, index) => {
    ctx.strokeStyle = anno.color
    ctx.lineWidth = index === selectedAnnotation.value ? 3 : 2
    
    if (anno.type === 'path') {
      ctx.beginPath()
      ctx.moveTo(anno.points[0].x, anno.points[0].y)
      anno.points.forEach(point => ctx.lineTo(point.x, point.y))
      ctx.stroke()
    }
  })
}

const selectAnnotationAt = (x, y) => {
  for (let i = annotations.value.length - 1; i >= 0; i--) {
    const anno = annotations.value[i]
    if (anno.type === 'path') {
      for (let j = 0; j < anno.points.length - 1; j++) {
        const p1 = anno.points[j]
        const p2 = anno.points[j + 1]
        if (pointNearLine(x, y, p1.x, p1.y, p2.x, p2.y)) {
          selectedAnnotation.value = i
          return
        }
      }
    }
  }
  selectedAnnotation.value = null
}

const pointNearLine = (px, py, x1, y1, x2, y2) => {
  const dx = x2 - x1
  const dy = y2 - y1
  const dist = Math.sqrt(dx * dx + dy * dy)
  if (dist === 0) return false
  
  const t = Math.max(0, Math.min(1, ((px - x1) * dx + (py - y1) * dy) / (dist * dist)))
  const nearX = x1 + t * dx
  const nearY = y1 + t * dy
  const nearDist = Math.sqrt((px - nearX) * (px - nearX) + (py - nearY) * (py - nearY))
  
  return nearDist < 10
}

const setTool = (tool) => {
  currentTool.value = tool
}

const selectAnnotation = (index) => {
  selectedAnnotation.value = selectedAnnotation.value === index ? null : index
}

const deleteSelected = () => {
  if (selectedAnnotation.value !== null) {
    annotations.value.splice(selectedAnnotation.value, 1)
    emit('annotation-deleted', selectedAnnotation.value)
    selectedAnnotation.value = null
    drawAnnotations()
  }
}

const clearAnnotations = () => {
  annotations.value = []
  selectedAnnotation.value = null
  drawAnnotations()
}

const exportAnnotations = () => {
  const data = {
    frameIndex: currentFrameIndex.value,
    annotations: annotations.value
  }
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `annotations_frame_${currentFrameIndex.value + 1}.json`
  a.click()
  URL.revokeObjectURL(url)
}

const prevFrame = () => {
  if (currentFrameIndex.value > 0) {
    currentFrameIndex.value--
  }
}

const nextFrame = () => {
  if (currentFrameIndex.value < totalFrames.value - 1) {
    currentFrameIndex.value++
  }
}

const updateFrame = () => {
  if (props.frames.length > 0) {
    currentFrame.value = props.frames[currentFrameIndex.value] || ''
    nextTick(() => {
      drawAnnotations()
    })
  }
}

watch(currentFrameIndex, updateFrame)
watch(() => props.frames, () => {
  totalFrames.value = props.frames.length
  currentFrameIndex.value = 0
  updateFrame()
}, { immediate: true })

onMounted(() => {
  nextTick(() => {
    initCanvas()
    updateFrame()
  })
})

onUnmounted(() => {
  if (canvasRef.value) {
    canvasRef.value.removeEventListener('mousedown', handleMouseDown)
    canvasRef.value.removeEventListener('mousemove', handleMouseMove)
    canvasRef.value.removeEventListener('mouseup', handleMouseUp)
    canvasRef.value.removeEventListener('mouseleave', handleMouseUp)
  }
})
</script>

<style scoped>
.keyframe-viewer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e293b;
  border-radius: 0;
  box-shadow: none;
  overflow: hidden;
}

.viewer-content {
  flex: 1;
  display: flex;
  overflow: hidden;
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  background: #0f172a;
}

.analysis-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}

.frame-image {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.tools-panel {
  width: 200px;
  padding: 16px;
  border-left: 1px solid rgba(255, 255, 255, 0.1);
  overflow-y: auto;
  background: #1e293b;
}

.tool-section {
  margin-bottom: 20px;
}

.tool-section h4 {
  font-size: 12px;
  font-weight: 600;
  color: #9CA3AF;
  text-transform: uppercase;
  margin-bottom: 12px;
}

.tool-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.tool-buttons .el-button {
  width: 36px;
  height: 36px;
  padding: 0;
  background: #0f172a;
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: #9CA3AF;
}

.tool-buttons .el-button:hover {
  background: #334155;
  border-color: rgba(255, 255, 255, 0.2);
  color: #FFFFFF;
}

.tool-buttons .el-button.active {
  background: rgba(45, 125, 70, 0.2);
  border-color: #1E5AA8;
  color: #1E5AA8;
}

.color-picker {
  display: flex;
  gap: 8px;
}

.color-chip {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
}

.color-chip.active {
  border-color: #1A1A2E;
}

.annotation-list {
  max-height: 200px;
  overflow-y: auto;
}

.annotation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 4px;
}

.annotation-item:hover {
  background: rgba(255, 255, 255, 0.05);
}

.annotation-item.selected {
  background: rgba(45, 125, 70, 0.2);
}

.anno-color {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.anno-label {
  font-size: 12px;
  color: #9CA3AF;
}

.frame-navigator {
  padding: 12px 16px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  background: #1e293b;
}

.nav-buttons {
  display: flex;
  align-items: center;
  gap: 8px;
}

.frame-info {
  font-size: 12px;
  color: #9CA3AF;
  min-width: 80px;
}

.frame-slider {
  flex: 1;
  height: 6px;
  cursor: pointer;
}
</style>