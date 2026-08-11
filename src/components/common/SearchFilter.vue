<template>
  <div class="search-filter" :class="{ 'is-collapsed': collapsed }">
    <!-- 搜索框区域 -->
    <div class="filter-row">
      <!-- 搜索输入 -->
      <div class="search-wrapper" v-if="showSearch">
        <el-input
          v-model="localSearchQuery"
          :placeholder="searchPlaceholder"
          clearable
          @clear="handleSearchClear"
          @keyup.enter="handleSearch"
        >
          <template #prefix>
            <el-icon><Search /></el-icon>
          </template>
          <template #append v-if="showSearchButton">
            <el-button @click="handleSearch">搜索</el-button>
          </template>
        </el-input>
      </div>

      <!-- 筛选条件 -->
      <div class="filter-items">
        <slot name="filters" />
      </div>

      <!-- 操作按钮 -->
      <div class="filter-actions">
        <slot name="actions" />
        
        <!-- 收起/展开按钮 -->
        <el-button 
          v-if="collapsible" 
          text 
          @click="toggleCollapse"
        >
          {{ collapsed ? '展开' : '收起' }}
          <el-icon class="collapse-icon">
            <ArrowUp v-if="!collapsed" />
            <ArrowDown v-else />
          </el-icon>
        </el-button>
      </div>
    </div>

    <!-- 收起时的标签显示 -->
    <div v-if="collapsed && activeFilters.length > 0" class="active-filters">
      <el-tag
        v-for="(filter, index) in activeFilters"
        :key="index"
        closable
        @close="handleFilterClose(filter)"
      >
        {{ filter.label }}: {{ filter.value }}
      </el-tag>
      <el-button text size="small" @click="clearAllFilters" v-if="activeFilters.length > 1">
        清除全部
      </el-button>
    </div>

    <!-- 高级筛选区域 -->
    <div v-show="!collapsed" class="advanced-filters">
      <slot />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { Search, ArrowUp, ArrowDown } from '@element-plus/icons-vue'

const props = defineProps({
  // 搜索相关
  modelValue: {
    type: String,
    default: ''
  },
  showSearch: {
    type: Boolean,
    default: true
  },
  showSearchButton: {
    type: Boolean,
    default: true
  },
  searchPlaceholder: {
    type: String,
    default: '搜索...'
  },
  
  // 折叠相关
  collapsible: {
    type: Boolean,
    default: true
  },
  defaultCollapsed: {
    type: Boolean,
    default: false
  },
  
  // 高级筛选
  filters: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['update:modelValue', 'search', 'filter-change', 'reset'])

// 本地搜索值
const localSearchQuery = ref(props.modelValue)

// 折叠状态
const collapsed = ref(props.defaultCollapsed)

// 监听 modelValue 变化
watch(() => props.modelValue, (newVal) => {
  localSearchQuery.value = newVal
})

// 监听本地搜索值变化
watch(localSearchQuery, (newVal) => {
  emit('update:modelValue', newVal)
})

// 活跃的筛选条件
const activeFilters = computed(() => {
  return props.filters.filter(f => f.value !== '' && f.value !== null && f.value !== undefined)
})

// 搜索
const handleSearch = () => {
  emit('search', localSearchQuery.value)
}

// 清除搜索
const handleSearchClear = () => {
  emit('search', '')
}

// 收起/展开
const toggleCollapse = () => {
  collapsed.value = !collapsed.value
}

// 清除单个筛选
const handleFilterClose = (filter) => {
  emit('filter-change', { ...filter, value: filter.defaultValue || '' })
}

// 清除全部筛选
const clearAllFilters = () => {
  props.filters.forEach(filter => {
    emit('filter-change', { ...filter, value: filter.defaultValue || '' })
  })
  emit('reset')
}

// 重置
const reset = () => {
  localSearchQuery.value = ''
  collapsed.value = props.defaultCollapsed
  clearAllFilters()
}

// 暴露方法
defineExpose({
  reset,
  collapse: () => { collapsed.value = true },
  expand: () => { collapsed.value = false }
})
</script>

<style scoped>
.search-filter {
  padding: 16px 20px;
  background: #FFFFFF;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.search-wrapper {
  flex-shrink: 0;
  min-width: 280px;
  max-width: 400px;
}

.filter-items {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  flex-wrap: wrap;
}

.filter-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.collapse-icon {
  margin-left: 4px;
  transition: transform 0.3s;
}

.active-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px dashed #E8EAED;
}

.advanced-filters {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E8EAED;
}

/* 收起状态 */
.search-filter.is-collapsed .filter-row {
  margin-bottom: 0;
}

/* 响应式 */
@media (max-width: 768px) {
  .filter-row {
    flex-direction: column;
    align-items: stretch;
  }

  .search-wrapper {
    width: 100%;
    max-width: none;
  }

  .filter-items {
    width: 100%;
  }

  .filter-actions {
    width: 100%;
    justify-content: flex-end;
  }
}
</style>
