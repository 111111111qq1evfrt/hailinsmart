<template>
  <div class="radar-chart-container">
    <div ref="chartRef" class="chart-wrapper"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue'
import echarts from '@/utils/echarts'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  dimensions: {
    type: Array,
    default: () => ['速度', '力量', '耐力', '灵敏', '柔韧', '协调']
  },
  title: {
    type: String,
    default: ''
  }
})

const chartRef = ref(null)
let chartInstance = null

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  updateChart()
  
  window.addEventListener('resize', handleResize)
}

const handleResize = () => {
  chartInstance?.resize()
}

const updateChart = () => {
  if (!chartInstance || !props.data.length) return
  
  const indicator = props.dimensions.map(dim => ({
    name: dim,
    max: 100
  }))
  
  const series = props.data.map((item, index) => ({
    name: item.name,
    type: 'radar',
    value: item.values,
    symbol: 'circle',
    symbolSize: 6,
    lineStyle: {
      width: 2,
      color: getColor(index)
    },
    areaStyle: {
      color: getColor(index),
      opacity: 0.2
    },
    itemStyle: {
      color: getColor(index)
    }
  }))
  
  const option = {
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    title: {
      text: props.title,
      left: 'center',
      top: 10,
      textStyle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#1A1A2E'
      }
    },
    radar: {
      indicator,
      center: ['50%', '55%'],
      radius: '65%',
      shape: 'polygon',
      splitNumber: 5,
      axisName: {
        color: '#6B7280',
        fontSize: 12
      },
      splitLine: {
        lineStyle: {
          color: '#E8EAED'
        }
      },
      splitArea: {
        show: true,
        areaStyle: {
          color: ['#FFFFFF', '#F7F8FA', '#FFFFFF', '#F7F8FA', '#FFFFFF']
        }
      },
      axisLine: {
        lineStyle: {
          color: '#E8EAED'
        }
      }
    },
    series
  }
  
  chartInstance.setOption(option, true)
}

const getColor = (index) => {
  const colors = ['#1E5AA8', '#3B82F6', '#F5A623', '#E85D4E', '#8B5CF6', '#06B6D4']
  return colors[index % colors.length]
}

watch(() => props.data, updateChart, { deep: true })
watch(() => props.dimensions, updateChart)
watch(() => props.title, updateChart)

onMounted(() => {
  nextTick(() => {
    initChart()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  chartInstance?.dispose()
})
</script>

<style scoped>
.radar-chart-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
}
</style>