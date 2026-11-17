<template>
  <div class="generic-table-wrapper">
    <div class="table-header" v-if="showHeader">
      <span class="table-title" v-if="title">{{ title }}</span>
      <div class="header-actions">
        <div v-if="showSelection && selectedRows.length > 0" class="batch-actions">
          <span class="batch-count">已选择 {{ selectedRows.length }} 项</span>
          <slot name="batch-actions" :selected-rows="selectedRows" :clear-selection="clearSelection" />
        </div>
        <template v-else>
          <el-input
            v-if="searchable"
            v-model="searchQuery"
            :placeholder="searchPlaceholder"
            clearable
            size="small"
            style="width: 200px"
            :prefix-icon="Search"
          />
          <slot name="header-actions" />
          <el-button v-if="showRefresh" text :icon="Refresh" size="small" @click="$emit('refresh')">
            刷新
          </el-button>
        </template>
      </div>
    </div>

    <el-table
      :data="paginatedData"
      stripe
      border
      style="width: 100%"
      :header-cell-style="{ background: '#f5f7fa', color: '#606266', fontWeight: 600 }"
      @selection-change="handleSelectionChange"
      @sort-change="handleSortChange"
    >
      <el-table-column
        v-if="showSelection"
        type="selection"
        width="55"
        fixed="left"
      />
      
      <template v-for="(col, index) in safeColumns" :key="col.prop || index">
        <el-table-column
          v-if="col.slot && $slots[col.slot]"
          :label="col.label"
          :min-width="col.minWidth || col.width || '100'"
          :width="col.width"
          :resizable="col.resizable !== false"
          :align="col.align || 'left'"
          :sortable="col.sortable === true || col.sortable === 'custom'"
          :sort-order="sortConfig.prop === (col.prop || col.slot) ? sortConfig.order : undefined"
          :class-name="col.className"
          :label-class-name="col.labelClassName"
        >
          <template #default="scope">
            <div @dblclick="handleCellDoubleClick(scope.row, col.prop || col.slot, index)">
              <slot :name="col.slot" :row="scope.row" :$index="scope.$index" :editing="editingCell.row === scope.row && editingCell.field === (col.prop || col.slot)" :value="scope.row[col.prop || col.slot]" />
            </div>
          </template>
        </el-table-column>

        <el-table-column
          v-else
          :prop="col.prop"
          :label="col.label"
          :min-width="col.minWidth || col.width || '100'"
          :width="col.width"
          :resizable="col.resizable !== false"
          :align="col.align || 'left'"
          :formatter="col.formatter"
          :sortable="col.sortable === true || col.sortable === 'custom'"
          :sort-order="sortConfig.prop === col.prop ? sortConfig.order : undefined"
          :class-name="col.className"
          :label-class-name="col.labelClassName"
        >
          <template #default="scope">
            <div @dblclick="handleCellDoubleClick(scope.row, col.prop, scope.$index)" class="cell-content">
              <template v-if="editingCell.row === scope.row && editingCell.field === col.prop && col.editable">
                <el-input
                  v-if="col.type !== 'select'"
                  v-model="editingValue"
                  size="small"
                  @blur="handleCellBlur(scope.row, col.prop)"
                  @keyup.enter="handleCellBlur(scope.row, col.prop)"
                  @keyup.esc="cancelEdit"
                  ref="editInputRef"
                  :type="col.inputType || 'text'"
                />
                <el-select
                  v-else
                  v-model="editingValue"
                  size="small"
                  @blur="handleCellBlur(scope.row, col.prop)"
                  @change="handleCellBlur(scope.row, col.prop)"
                >
                  <el-option
                    v-for="option in col.options"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </el-select>
              </template>
              <template v-else>
                {{ scope.row[col.prop] }}
              </template>
            </div>
          </template>
        </el-table-column>
      </template>

      <el-table-column
        v-if="$slots.actions"
        label="操作"
        :min-width="actionColumn?.minWidth || actionColumn?.width || actionWidth"
        :width="actionColumn?.width || actionWidth"
        :resizable="actionColumn?.resizable !== false"
        align="center"
      >
        <template #default="scope">
          <slot name="actions" :row="scope.row" :$index="scope.$index" />
        </template>
      </el-table-column>
    </el-table>

    <div class="pagination-wrapper" v-if="showPagination">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :total="sortedData.length"
        :page-sizes="pageSizes"
        layout="total, sizes, prev, pager, next"
        small
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick, watch } from 'vue'
import { Search, Refresh } from '@element-plus/icons-vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  columns: {
    type: Array,
    default: () => []
  },
  title: {
    type: String,
    default: ''
  },
  showHeader: {
    type: Boolean,
    default: true
  },
  searchable: {
    type: Boolean,
    default: true
  },
  searchPlaceholder: {
    type: String,
    default: '搜索...'
  },
  searchFields: {
    type: Array,
    default: () => []
  },
  showRefresh: {
    type: Boolean,
    default: true
  },
  showPagination: {
    type: Boolean,
    default: true
  },
  pageSizes: {
    type: Array,
    default: () => [8, 12, 16, 20]
  },
  defaultPageSize: {
    type: Number,
    default: 12
  },
  actionWidth: {
    type: [String, Number],
    default: '300'
  },
  actionColumn: {
    type: Object,
    default: null
  },
  showSelection: {
    type: Boolean,
    default: false
  },
  defaultSortProp: {
    type: String,
    default: ''
  },
  defaultSortOrder: {
    type: String,
    default: 'descending'
  }
})

const emit = defineEmits(['refresh', 'cell-edit', 'selection-change'])

const safeData = computed(() => (Array.isArray(props.data) ? props.data : []))
const safeColumns = computed(() => (Array.isArray(props.columns) ? props.columns : []))
const safeSearchFields = computed(() => {
  if (Array.isArray(props.searchFields) && props.searchFields.length) {
    return props.searchFields
  }
  return safeColumns.value.filter(c => c.prop).map(c => c.prop)
})

const searchQuery = ref('')
const currentPage = ref(1)
const pageSize = ref(props.defaultPageSize)
const sortConfig = ref(
  props.defaultSortProp
    ? { prop: props.defaultSortProp, order: props.defaultSortOrder }
    : { prop: '', order: '' }
)

const filteredData = computed(() => {
  if (!searchQuery.value) return [...safeData.value]

  const q = searchQuery.value.toLowerCase()
  const fields = safeSearchFields.value

  if (fields.length === 0) return [...safeData.value]

  return safeData.value.filter(row => {
    return fields.some(field => {
      const value = row?.[field]
      const val = value != null ? String(value).toLowerCase() : ''
      return val.includes(q)
    })
  })
})

const sortedData = computed(() => {
  if (!sortConfig.value.prop) return filteredData.value

  const data = [...filteredData.value]
  const { prop, order } = sortConfig.value
  const col = safeColumns.value.find(c => c.prop === prop || c.slot === prop)
  
  data.sort((a, b) => {
    if (col?.sortMethod) {
      const result = col.sortMethod(a, b)
      return order === 'descending' ? -result : result
    }

    const valA = a[prop]
    const valB = b[prop]
    
    const numA = parseFloat(valA)
    const numB = parseFloat(valB)
    
    if (!isNaN(numA) && !isNaN(numB)) {
      return order === 'descending' ? numB - numA : numA - numB
    }

    const strA = String(valA || '')
    const strB = String(valB || '')
    return order === 'descending' 
      ? strB.localeCompare(strA, 'zh-CN') 
      : strA.localeCompare(strB, 'zh-CN')
  })

  return data
})

const paginatedData = computed(() => {
  if (!props.showPagination) return sortedData.value
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return sortedData.value.slice(start, end)
})

const handleSortChange = ({ prop, order }) => {
  sortConfig.value = { prop, order }
  currentPage.value = 1
}

// 数据变化时重置页码，避免筛选后停留在空页
watch(() => sortedData.value, () => {
  currentPage.value = 1
})

const selectedRows = ref([])
const handleSelectionChange = (selection) => {
  selectedRows.value = selection
  emit('selection-change', selection)
}
const clearSelection = () => {
  selectedRows.value = []
}

const editingCell = ref({ row: null, field: null })
const editingValue = ref(null)
const editInputRef = ref(null)

const handleCellDoubleClick = (row, field, index) => {
  const col = safeColumns.value.find(c => c.prop === field || c.slot === field)
  
  editingCell.value = { row, field }
  editingValue.value = row[field]
  
  emit('cell-edit', { 
    row, 
    field, 
    editable: col?.editable, 
    value: row[field],
    isEditing: true
  })
}

const handleCellBlur = (row, field) => {
  if (editingValue.value !== undefined && editingValue.value !== null && editingValue.value !== '') {
    row[field] = editingValue.value
    emit('cell-edit', { 
      row, 
      field, 
      editable: true, 
      value: editingValue.value, 
      action: 'save',
      isEditing: false
    })
  }
  cancelEdit()
}

const cancelEdit = () => {
  editingCell.value = { row: null, field: null }
  editingValue.value = null
  emit('cell-edit', { 
    row: null, 
    field: null, 
    isEditing: false
  })
}

defineExpose({
  editingCell,
  editingValue,
  cancelEdit
})
</script>

<style scoped>
.generic-table-wrapper {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  width: 100%;
  display: flex;
  flex-direction: column;
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EAED;
  flex-shrink: 0;
}

.table-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.batch-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: #EFF6FF;
  border-radius: 8px;
  flex-wrap: wrap;
}

.batch-count {
  font-size: 14px;
  color: #1A1A2E;
  font-weight: 500;
  margin-right: 8px;
}

.cell-content {
  min-height: 32px;
  display: flex;
  align-items: center;
}

.generic-table-wrapper :deep(.el-table) {
  flex: 1;
  width: 100% !important;
  table-layout: auto;
}

.generic-table-wrapper :deep(.el-table__inner-wrapper) {
  height: 100%;
}

.generic-table-wrapper :deep(.el-table__body-wrapper) {
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
}

.generic-table-wrapper :deep(.el-table__header-wrapper) {
  flex-shrink: 0;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #E8EAED;
  flex-shrink: 0;
}
</style>