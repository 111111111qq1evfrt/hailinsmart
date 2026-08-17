<template>
  <!-- 表格列设置弹窗 -->
  <ElDialog
    v-model="model"
    title="表格列设置"
    width="450px"
  >
    <div class="column-settings">
      <el-checkbox-group v-model="columnSettings">
        <div class="column-option">
          <el-checkbox label="selection">选择框</el-checkbox>
        </div>
        <div class="column-option">
          <el-checkbox label="id">学号</el-checkbox>
        </div>
        <div class="column-option">
          <el-checkbox label="studentInfo">学生信息</el-checkbox>
        </div>
        <div class="column-option">
          <el-checkbox label="gender">性别</el-checkbox>
        </div>
        <div class="column-option">
          <el-checkbox label="grade">年级</el-checkbox>
        </div>
        <div class="column-option">
          <el-checkbox label="class">班级</el-checkbox>
        </div>
        <div class="column-option">
          <el-checkbox label="age">年龄</el-checkbox>
        </div>
        <div class="column-option">
          <el-checkbox label="faceRegistered">面部信息</el-checkbox>
        </div>
        <div class="column-option">
          <el-checkbox label="testStatus">体测状态</el-checkbox>
        </div>
        <div class="column-option">
          <el-checkbox label="sportsInterest">体育兴趣</el-checkbox>
        </div>
        <div class="column-option">
          <el-checkbox label="actions">操作</el-checkbox>
        </div>
      </el-checkbox-group>
    </div>
    <template #footer>
      <el-button @click="resetColumnSettings">重置</el-button>
      <el-button @click="model = false">取消</el-button>
      <el-button type="primary" @click="saveColumnSettings">确认</el-button>
    </template>
  </ElDialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import { DEFAULT_COLUMN_SETTINGS } from '../constants.js'

// 弹窗可见性
const model = defineModel({ type: Boolean, default: false })

// 列设置相关
const columnSettings = ref([...DEFAULT_COLUMN_SETTINGS])

// 计算属性：每列是否可见
const visibleColumns = computed(() => {
  const cols = {}
  DEFAULT_COLUMN_SETTINGS.forEach(key => {
    cols[key] = columnSettings.value.includes(key)
  })
  return cols
})

// 保存列设置到 localStorage 并关闭弹窗
const saveColumnSettings = () => {
  localStorage.setItem('studentColumnSettings', JSON.stringify(columnSettings.value))
  model.value = false
  ElMessage.success('列设置已保存')
}

// 重置为默认列设置
const resetColumnSettings = () => {
  columnSettings.value = [...DEFAULT_COLUMN_SETTINGS]
}

// 页面加载时读取保存的列设置
const loadColumnSettings = () => {
  const saved = localStorage.getItem('studentColumnSettings')
  if (saved) {
    try {
      const savedSettings = JSON.parse(saved)
      DEFAULT_COLUMN_SETTINGS.forEach(col => {
        if (!savedSettings.includes(col)) {
          savedSettings.push(col)
        }
      })
      columnSettings.value = savedSettings
    } catch (e) {
      columnSettings.value = [...DEFAULT_COLUMN_SETTINGS]
    }
  }
}

// 组件创建时自动加载列设置
loadColumnSettings()

// 暴露给父组件使用
defineExpose({
  visibleColumns,
  loadColumnSettings
})
</script>
