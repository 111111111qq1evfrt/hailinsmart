<template>
  <div class="ppt-export-container">
    <el-dialog 
      title="导出PPT演示文稿" 
      :model-value="visible"
      width="500px"
      @update:model-value="(val) => emit('update:visible', val)"
    >
      <div class="export-form">
        <div class="form-item">
          <label class="form-label">演示文稿标题</label>
          <el-input v-model="config.title" placeholder="请输入演示文稿标题" />
        </div>
        
        <div class="form-item">
          <label class="form-label">模板类型</label>
          <el-select v-model="config.template">
            <el-option label="标准报告模板" value="standard" />
            <el-option label="数据可视化模板" value="visualization" />
            <el-option label="简洁商务模板" value="business" />
            <el-option label="教育汇报模板" value="education" />
          </el-select>
        </div>
        
        <div class="form-item">
          <label class="form-label">包含页面</label>
          <div class="checkbox-group">
            <el-checkbox v-model="config.includeCover">封面页</el-checkbox>
            <el-checkbox v-model="config.includeSummary">数据概览</el-checkbox>
            <el-checkbox v-model="config.includeCharts">图表分析</el-checkbox>
            <el-checkbox v-model="config.includeComparison">对比分析</el-checkbox>
            <el-checkbox v-model="config.includeRecommend">建议总结</el-checkbox>
          </div>
        </div>
        
        <div class="form-item">
          <label class="form-label">主题颜色</label>
          <div class="color-options">
            <span 
              v-for="color in themeColors" 
              :key="color.value"
              class="color-option"
              :class="{ active: config.themeColor === color.value }"
              :style="{ background: color.value }"
              @click="config.themeColor = color.value"
              :title="color.label"
            ></span>
          </div>
        </div>
        
        <div class="form-item">
          <label class="form-label">每页数据数量</label>
          <el-slider 
            v-model="config.itemsPerPage" 
            :min="3" 
            :max="10" 
            :step="1"
            :marks="{ 3: '3项', 5: '5项', 8: '8项', 10: '10项' }"
          />
        </div>
      </div>
      
      <template #footer>
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" :loading="isExporting" @click="startExport">
          {{ isExporting ? '导出中...' : '导出PPT' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'

const props = defineProps({
  visible: {
    type: Boolean,
    default: false
  },
  slideData: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:visible', 'export-start', 'export-end'])

const isExporting = ref(false)

const themeColors = [
  { label: '深蓝色', value: '#1E5AA8' },
  { label: '活力蓝', value: '#3B82F6' },
  { label: '暖橙色', value: '#F5A623' },
  { label: '珊瑚红', value: '#E85D4E' },
  { label: '紫色', value: '#8B5CF6' }
]

const config = reactive({
  title: '',
  template: 'standard',
  includeCover: true,
  includeSummary: true,
  includeCharts: true,
  includeComparison: false,
  includeRecommend: true,
  themeColor: '#1E5AA8',
  itemsPerPage: 5
})

const handleClose = () => {
  emit('update:visible', false)
}

const startExport = async () => {
  isExporting.value = true
  emit('export-start', { ...config, data: props.slideData })
  
  await new Promise(resolve => setTimeout(resolve, 2500))
  
  isExporting.value = false
  emit('export-end')
  emit('update:visible', false)
  
  const blob = new Blob([generateSlideContent()], { type: 'application/vnd.ms-powerpoint' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${config.title || '演示文稿'}.ppt`
  a.click()
  URL.revokeObjectURL(url)
}

const generateSlideContent = () => {
  const slides = []
  
  if (config.includeCover) {
    slides.push(`封面页: ${config.title || '体育数据报告'}`)
  }
  
  if (config.includeSummary) {
    slides.push(`数据概览: ${JSON.stringify(props.slideData.summary || {})}`)
  }
  
  if (config.includeCharts) {
    slides.push(`图表分析: 包含 ${props.slideData.charts?.length || 0} 个图表`)
  }
  
  if (config.includeComparison) {
    slides.push(`对比分析: ${JSON.stringify(props.slideData.comparison || {})}`)
  }
  
  if (config.includeRecommend) {
    slides.push(`建议总结: ${props.slideData.recommendation || '暂无建议'}`)
  }
  
  return slides.join('\n---\n')
}
</script>

<style scoped>
.ppt-export-container {
  display: none;
}

.export-form {
  padding: 16px 0;
}

.form-item {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
  margin-bottom: 8px;
}

.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.color-options {
  display: flex;
  gap: 12px;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.color-option.active {
  border-color: #1A1A2E;
  transform: scale(1.1);
}
</style>