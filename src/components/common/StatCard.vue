<template>
  <div class="stat-card" :class="{ 'clickable': clickable }" @click="handleClick">
    <!-- 左侧图标区域 -->
    <div class="stat-icon-wrapper" :style="iconWrapperStyle">
      <el-icon class="stat-icon" :size="iconSize">
        <component :is="iconComponent" />
      </el-icon>
    </div>

    <!-- 数值区域 -->
    <div class="stat-content">
      <div class="stat-value-wrapper">
        <span class="stat-value" :style="{ color: valueColor }">
          {{ displayValue }}
        </span>
        <!-- 趋势指示 -->
        <span v-if="trend !== undefined" class="stat-trend" :class="trendClass">
          <el-icon v-if="trend > 0"><Top /></el-icon>
          <el-icon v-else-if="trend < 0"><Bottom /></el-icon>
          <span class="trend-text">{{ trendText }}</span>
        </span>
      </div>

      <!-- 标签 -->
      <span class="stat-label">{{ label }}</span>

      <!-- 额外描述 -->
      <span v-if="description" class="stat-description">{{ description }}</span>
    </div>

    <!-- 右侧额外内容 -->
    <div class="stat-extra" v-if="$slots.extra">
      <slot name="extra" />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { Top, Bottom } from '@element-plus/icons-vue'

const props = defineProps({
  // 数值
  value: {
    type: [String, Number],
    required: true
  },
  // 标签
  label: {
    type: String,
    required: true
  },
  // 图标
  icon: {
    type: [String, Object],
    default: 'DataLine'
  },
  // 图标背景色
  iconBgColor: {
    type: String,
    default: '#EEF6FF'
  },
  // 图标颜色
  iconColor: {
    type: String,
    default: '#1E5AA8'
  },
  // 图标大小
  iconSize: {
    type: Number,
    default: 24
  },
  // 数值颜色
  valueColor: {
    type: String,
    default: '#1A1A2E'
  },
  // 趋势值（正数上升，负数下降）
  trend: {
    type: Number,
    default: undefined
  },
  // 是否可点击
  clickable: {
    type: Boolean,
    default: false
  },
  // 描述文字
  description: {
    type: String,
    default: ''
  },
  // 前缀
  prefix: {
    type: String,
    default: ''
  },
  // 后缀
  suffix: {
    type: String,
    default: ''
  },
  // 动画时长（毫秒）
  animateDuration: {
    type: Number,
    default: 1000
  }
})

const emit = defineEmits(['click'])

// 计算显示值
const displayValue = computed(() => {
  return `${props.prefix}${props.value}${props.suffix}`
})

// 图标样式
const iconWrapperStyle = computed(() => ({
  background: props.iconBgColor,
  color: props.iconColor
}))

// 趋势样式
const trendClass = computed(() => ({
  'trend-up': props.trend > 0,
  'trend-down': props.trend < 0,
  'trend-flat': props.trend === 0
}))

// 趋势文本
const trendText = computed(() => {
  if (props.trend === undefined) return ''
  const absValue = Math.abs(props.trend)
  return `${props.trend > 0 ? '+' : ''}${absValue}%`
})

// 图标组件
const iconComponent = computed(() => {
  if (typeof props.icon === 'string') {
    return props.icon
  }
  return props.icon
})

// 点击处理
const handleClick = () => {
  if (props.clickable) {
    emit('click')
  }
}
</script>

<style scoped>
.stat-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 20px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  transition: all 0.3s ease;
}

.stat-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.stat-card.clickable {
  cursor: pointer;
}

.stat-card.clickable:hover {
  transform: translateY(-2px);
}

.stat-icon-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 12px;
  flex-shrink: 0;
}

.stat-icon {
  font-weight: 600;
}

.stat-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 4px;
  min-width: 0;
}

.stat-value-wrapper {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  line-height: 36px;
  color: #1A1A2E;
}

.stat-trend {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  font-size: 12px;
  font-weight: 500;
}

.stat-trend.trend-up {
  color: #1E5AA8;
}

.stat-trend.trend-down {
  color: #E85D4E;
}

.stat-trend.trend-flat {
  color: #6B7280;
}

.trend-text {
  margin-left: 2px;
}

.stat-label {
  font-size: 14px;
  color: #6B7280;
  line-height: 22px;
}

.stat-description {
  font-size: 12px;
  color: #9CA3AF;
  line-height: 18px;
  margin-top: 2px;
}

.stat-extra {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .stat-card {
    padding: 16px;
  }

  .stat-icon-wrapper {
    width: 40px;
    height: 40px;
  }

  .stat-value {
    font-size: 24px;
  }

  .stat-icon {
    font-size: 20px;
  }
}
</style>
