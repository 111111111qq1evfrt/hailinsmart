<template>
  <div class="page-header">
    <!-- 面包屑 -->
    <div class="breadcrumb-wrapper" v-if="showBreadcrumb && breadcrumbs.length > 0">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item 
          v-for="(item, index) in breadcrumbs" 
          :key="index"
          :to="item.path"
        >
          {{ item.title }}
        </el-breadcrumb-item>
      </el-breadcrumb>
    </div>

    <!-- 主标题区域 -->
    <div class="header-content">
      <div class="header-left">
        <!-- 返回按钮 -->
        <el-button 
          v-if="showBack" 
          text 
          class="back-button"
          @click="handleBack"
        >
          <el-icon><ArrowLeft /></el-icon>
        </el-button>

        <!-- 标题 -->
        <div class="title-wrapper">
          <h1 class="page-title">{{ title }}</h1>
          <p class="page-subtitle" v-if="subtitle">{{ subtitle }}</p>
        </div>
      </div>

      <!-- 操作按钮区域 -->
      <div class="header-actions" v-if="$slots.actions">
        <slot name="actions" />
      </div>
    </div>

    <!-- 额外信息区域 -->
    <div class="header-extra" v-if="$slots.extra">
      <slot name="extra" />
    </div>

    <!-- 分隔线 -->
    <div class="header-divider" v-if="showDivider"></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ArrowLeft } from '@element-plus/icons-vue'

const props = defineProps({
  // 页面标题
  title: {
    type: String,
    default: ''
  },
  // 副标题
  subtitle: {
    type: String,
    default: ''
  },
  // 是否显示返回按钮
  showBack: {
    type: Boolean,
    default: false
  },
  // 是否显示面包屑
  showBreadcrumb: {
    type: Boolean,
    default: true
  },
  // 是否显示分隔线
  showDivider: {
    type: Boolean,
    default: true
  },
  // 自定义面包屑
  breadcrumbs: {
    type: Array,
    default: () => []
  },
  // 返回按钮点击回调
  onBack: {
    type: Function,
    default: null
  }
})

const router = useRouter()
const route = useRoute()

// 自动生成面包屑
const autoBreadcrumbs = computed(() => {
  if (props.breadcrumbs.length > 0) return props.breadcrumbs
  
  // 从路由 meta 生成面包屑
  const matched = route.matched.filter(item => item.meta?.title)
  return matched.map(item => ({
    title: item.meta.title,
    path: item.path
  }))
})

// 返回处理
const handleBack = () => {
  if (props.onBack && typeof props.onBack === 'function') {
    props.onBack()
  } else {
    router.back()
  }
}
</script>

<style scoped>
.page-header {
  margin-bottom: 24px;
}

.breadcrumb-wrapper {
  margin-bottom: 16px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.back-button {
  margin-top: 4px;
  padding: 8px;
  font-size: 20px;
  color: #6B7280;
}

.back-button:hover {
  color: #1E5AA8;
}

.title-wrapper {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #1A1A2E;
  line-height: 32px;
}

.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: #6B7280;
  line-height: 22px;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.header-extra {
  margin-top: 16px;
}

.header-divider {
  margin-top: 20px;
  height: 1px;
  background: #E8EAED;
}

/* 响应式 */
@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
  }

  .header-left {
    width: 100%;
  }

  .header-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .page-title {
    font-size: 20px;
  }
}
</style>
