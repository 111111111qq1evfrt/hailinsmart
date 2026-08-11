<template>
  <div class="trend-chart-container">
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
  title: {
    type: String,
    default: ''
  },
  smooth: {
    type: Boolean,
    default: true
  },
  showArea: {
    type: Boolean,
    default: true
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
  if (!chartInstance || !props.data.length || !props.xAxisData.length) return
  
  const series = props.data.map((item, index) => ({
    name: item.name,
    type: 'line',
    data: item.values,
    smooth: props.smooth,
    symbol: 'circle',
    symbolSize: 8,
    lineStyle: {
      width: 2.5,
      color: getColor(index)
    },
    itemStyle: {
      color: getColor(index)
    },
    areaStyle: props.showArea ? {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: getColor(index) + '40' },
        { offset: 1, color: getColor(index) + '05' }
      ])
    } : undefined
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
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#E8EAED',
      borderWidth: 1,
      textStyle: {
        color: '#1A1A2E'
      },
      formatter: (params) => {
        let result = `<div style="font-weight: 600; margin-bottom: 8px;">${params[0].axisValue}</div>`
        params.forEach(param => {
          result += `<div style="display: flex; align-items: center; gap: 8px; margin: 4px 0;">
            <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background: ${param.color};"></span>
            <span>${param.seriesName}: <strong>${param.value}</strong></span>
          </div>`
        })
        return result
      }
    },
    legend: {
      data: props.data.map(item => item.name),
      bottom: 10,
      textStyle: {
        color: '#6B7280'
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      top: 60,
      bottom: 60,
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.xAxisData,
      axisLine: {
        lineStyle: {
          color: '#E8EAED'
        }
      },
      axisLabel: {
        color: '#6B7280',
        fontSize: 12
      }
    },
    yAxis: {
      type: 'value',
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        lineStyle: {
          color: '#E8EAED',
          type: 'dashed'
        }
      },
      axisLabel: {
        color: '#6B7280',
        fontSize: 12
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
watch(() => props.xAxisData, updateChart)
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
.trend-chart-container {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
}
</style>