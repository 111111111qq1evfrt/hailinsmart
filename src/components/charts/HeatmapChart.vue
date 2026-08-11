<template>
  <div class="heatmap-chart-container">
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
  xAxisData: {
    type: Array,
    default: () => []
  },
  yAxisData: {
    type: Array,
    default: () => []
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
    tooltip: {
      position: 'top',
      formatter: (params) => {
        return `${params.name}<br/>${params.seriesName}: <strong>${params.value}</strong>`
      }
    },
    grid: {
      left: '10%',
      right: '15%',
      top: 60,
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: props.xAxisData,
      splitArea: {
        show: true
      },
      axisLabel: {
        color: '#6B7280',
        fontSize: 12,
        rotate: 45
      }
    },
    yAxis: {
      type: 'category',
      data: props.yAxisData,
      splitArea: {
        show: true
      },
      axisLabel: {
        color: '#6B7280',
        fontSize: 12
      }
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: true,
      orient: 'vertical',
      right: '2%',
      top: 'center',
      inRange: {
        color: ['#DCFCE7', '#86EFAC', '#22C55E', '#FDE047', '#F59E0B', '#EF4444']
      },
      textStyle: {
        color: '#6B7280'
      }
    },
    series: [
      {
        name: '成绩',
        type: 'heatmap',
        data: props.data,
        label: {
          show: true,
          color: '#1A1A2E',
          fontSize: 12
        },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)'
          }
        }
      }
    ]
  }
  
  chartInstance.setOption(option, true)
}

watch(() => props.data, updateChart, { deep: true })
watch(() => props.xAxisData, updateChart)
watch(() => props.yAxisData, updateChart)
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
.heatmap-chart-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
}
</style>