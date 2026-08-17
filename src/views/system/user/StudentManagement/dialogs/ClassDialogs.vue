<template>
  <!-- 新建班级弹窗 -->
  <ElDialog
    v-model="model"
    title="新建班级"
    width="450px"
  >
    <div class="class-form">
      <el-form :model="newClass" label-width="80px">
        <el-form-item label="班级类型">
          <el-radio-group v-model="newClass.type">
            <el-radio label="行政班" />
            <el-radio label="分项班" />
          </el-radio-group>
        </el-form-item>
        <template v-if="newClass.type === '行政班'">
          <el-form-item label="年级" required>
            <el-select v-model="newClass.grade" placeholder="选择年级" class="w-full" @change="newClass.classNum = ''">
              <el-option label="一年级" value="一年级" />
              <el-option label="二年级" value="二年级" />
              <el-option label="三年级" value="三年级" />
              <el-option label="四年级" value="四年级" />
              <el-option label="五年级" value="五年级" />
              <el-option label="六年级" value="六年级" />
            </el-select>
          </el-form-item>
          <el-form-item label="班级号" required>
            <el-select v-model="newClass.classNum" :disabled="!newClass.grade" placeholder="请先选择年级" class="w-full">
              <el-option v-for="n in 12" :key="n" :label="`${n}班`" :value="n" />
            </el-select>
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="兴趣班名称" required>
            <el-input v-model="newClass.name" placeholder="请输入兴趣班名称，如：篮球兴趣班" />
          </el-form-item>
        </template>
        <el-form-item label="班主任">
          <el-input v-model="newClass.teacher" placeholder="请输入班主任姓名" />
        </el-form-item>
      </el-form>
    </div>
    <template #footer>
      <el-button @click="model = false">取消</el-button>
      <el-button type="primary" @click="confirmCreateClass">确认创建</el-button>
    </template>
  </ElDialog>

  <!-- 班级详情弹窗 -->
  <ElDialog v-model="detailModel" :title="`班级详情 - ${selectedClass?.name || ''}`" width="520px">
    <div v-if="selectedClass" class="class-detail">
      <div class="detail-row"><span class="detail-label">班级名称</span><span>{{ selectedClass.name }}</span></div>
      <div class="detail-row"><span class="detail-label">班级类型</span><span>{{ selectedClass.type }}</span></div>
      <div class="detail-row"><span class="detail-label">班主任</span><span>{{ selectedClass.teacher }}</span></div>
      <div class="detail-row"><span class="detail-label">学生人数</span><span>{{ getClassStudentCount(selectedClass.name) }} 人</span></div>
      <div class="detail-row"><span class="detail-label">所属年级</span><span>{{ getGradeFromClassName(selectedClass.name) }}</span></div>
    </div>
    <template #footer>
      <el-button @click="handleEditFromDetail">编辑</el-button>
      <el-button type="primary" @click="detailModel = false">关闭</el-button>
    </template>
  </ElDialog>

  <!-- 编辑班级弹窗 -->
  <ElDialog v-model="editModel" title="编辑班级" width="450px">
    <el-form v-if="classForm" :model="classForm" label-width="80px">
      <el-form-item label="班级名称">
        <el-input v-model="classForm.name" />
      </el-form-item>
      <el-form-item label="班级类型">
        <el-radio-group v-model="classForm.type">
          <el-radio label="行政班" />
          <el-radio label="分项班" />
        </el-radio-group>
      </el-form-item>
      <el-form-item label="班主任">
        <el-input v-model="classForm.teacher" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="editModel = false">取消</el-button>
      <el-button type="primary" @click="saveClassEdit">保存</el-button>
    </template>
  </ElDialog>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

const props = defineProps({
  classes: {
    type: Array,
    default: () => []
  },
  students: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['create-class', 'update-class', 'delete-class', 'edit-class'])

// 三个弹窗的可见性（v-model）
const model = defineModel({ type: Boolean, default: false })                              // 新建班级弹窗
const detailModel = defineModel('detailModel', { type: Boolean, default: false })         // 班级详情弹窗
const editModel = defineModel('editModel', { type: Boolean, default: false })             // 编辑班级弹窗

// 内部状态
const newClass = ref({
  name: '',
  type: '行政班',
  grade: '',
  classNum: '',
  teacher: ''
})
const classForm = ref(null)
const selectedClass = ref(null)

// 从班级名称中解析年级
const getGradeFromClassName = (className) => {
  if (!className) return '—'
  const match = className.match(/(一年级|二年级|三年级|四年级|五年级|六年级)/)
  return match ? match[1] : '—'
}

// 统计班级学生人数
const getClassStudentCount = (className) => {
  const cls = props.classes.find(c => c.name === className)
  if (!cls) return 0
  if (cls.type === '行政班') {
    return props.students.filter(s => className.includes(s.grade) && className.includes(s.class)).length
  } else {
    return props.students.filter(s => s.itemClass === className).length
  }
}

// 打开新建班级弹窗
const createClass = () => {
  model.value = true
}

// 校验并提交新建班级
const confirmCreateClass = () => {
  if (newClass.value.type === '行政班') {
    if (!newClass.value.grade) {
      ElMessage.warning('请选择年级')
      return
    }
    if (!newClass.value.classNum) {
      ElMessage.warning('请选择班级号')
      return
    }
  } else {
    if (!newClass.value.name) {
      ElMessage.warning('请输入兴趣班名称')
      return
    }
  }
  emit('create-class', { ...newClass.value })
  model.value = false

  const className = newClass.value.type === '行政班'
    ? `${newClass.value.grade}${newClass.value.classNum}班`
    : newClass.value.name
  ElMessage.success(`班级 "${className}" 创建成功`)

  newClass.value = { name: '', type: '行政班', grade: '', classNum: '', teacher: '' }
}

// 查看班级详情
const viewClass = (cls) => {
  selectedClass.value = cls
  detailModel.value = true
}

// 详情弹窗点击编辑：emit 通知父组件，并打开编辑弹窗
const handleEditFromDetail = () => {
  if (!selectedClass.value) return
  emit('edit-class', selectedClass.value)
  editClass(selectedClass.value)
}

// 打开编辑弹窗
const editClass = (cls) => {
  classForm.value = { ...cls }
  editModel.value = true
  detailModel.value = false
}

// 保存编辑
const saveClassEdit = () => {
  if (!classForm.value?.name) {
    ElMessage.warning('请输入班级名称')
    return
  }
  emit('update-class', { id: classForm.value.id, data: { ...classForm.value } })
  editModel.value = false
  ElMessage.success(`班级 "${classForm.value.name}" 已更新`)
}

// 删除班级
const deleteClass = (cls) => {
  ElMessageBox.confirm(
    `确定要删除班级 "${cls.name}" 吗？此操作不可撤销。`,
    '删除确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    emit('delete-class', cls.id)
    detailModel.value = false
    ElMessage.success(`班级 "${cls.name}" 已删除`)
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 暴露方法供父组件调用
defineExpose({
  createClass,
  viewClass,
  editClass,
  deleteClass,
  getGradeFromClassName,
  getClassStudentCount
})
</script>
