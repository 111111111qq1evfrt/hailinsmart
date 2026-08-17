<template>
  <!-- 新建学生弹窗 -->
  <ElDialog
    v-model="model"
    title="新建学生"
    width="500px"
  >
    <el-form :model="newStudent" label-width="80px">
      <el-form-item label="学号" required>
        <el-input v-model="newStudent.id" placeholder="请输入学号" />
      </el-form-item>
      <el-form-item label="姓名" required>
        <el-input v-model="newStudent.name" placeholder="请输入姓名" />
      </el-form-item>
      <el-form-item label="性别" required>
        <el-radio-group v-model="newStudent.gender">
          <el-radio label="男" />
          <el-radio label="女" />
        </el-radio-group>
      </el-form-item>
      <el-form-item label="班级类型" required>
        <el-radio-group v-model="newStudent.classType" @change="newStudent.class = ''">
          <el-radio label="行政班" />
          <el-radio label="兴趣班" />
        </el-radio-group>
      </el-form-item>
      <template v-if="newStudent.classType === '行政班'">
        <el-form-item label="年级" required>
          <el-select v-model="newStudent.grade" placeholder="选择年级" class="w-full" @change="newStudent.class = ''">
            <el-option label="一年级" value="一年级" />
            <el-option label="二年级" value="二年级" />
            <el-option label="三年级" value="三年级" />
            <el-option label="四年级" value="四年级" />
            <el-option label="五年级" value="五年级" />
            <el-option label="六年级" value="六年级" />
          </el-select>
        </el-form-item>
        <el-form-item label="班级" required>
          <el-select v-model="newStudent.class" placeholder="请先选择年级" :disabled="!newStudent.grade" class="w-full">
            <el-option v-for="c in newStudentClassOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
      </template>
      <template v-else>
        <el-form-item label="兴趣班" required>
          <el-input v-model="newStudent.class" placeholder="请输入兴趣班名称，如：篮球兴趣班" />
        </el-form-item>
      </template>
      <el-form-item label="年龄">
        <el-input-number v-model="newStudent.age" :min="1" :max="20" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="model = false">取消</el-button>
      <el-button type="primary" @click="confirmCreateStudent">确认创建</el-button>
    </template>
  </ElDialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'

const props = defineProps({
  adminClasses: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['create'])

// 弹窗可见性（v-model）
const model = defineModel({ type: Boolean, default: false })

// 内部状态：新建学生表单
const newStudent = ref({
  id: '',
  name: '',
  gender: '男',
  grade: '',
  class: '',
  age: 8,
  classType: '行政班'
})

// 行政班时，根据选中年级从 props.adminClasses 过滤班级下拉选项
const newStudentClassOptions = computed(() => {
  const g = newStudent.value.grade
  if (!g) return []
  return props.adminClasses
    .filter(c => c.name.startsWith(g))
    .map(c => c.name.replace(g, ''))
})

// 重置表单并打开弹窗
const showCreateStudentDialog = () => {
  newStudent.value = { id: '', name: '', gender: '男', grade: '', class: '', age: 8, classType: '行政班' }
  model.value = true
}

// 校验并提交创建学生
const confirmCreateStudent = () => {
  if (!newStudent.value.id) {
    ElMessage.warning('请输入学号')
    return
  }
  if (!newStudent.value.name) {
    ElMessage.warning('请输入姓名')
    return
  }
  if (newStudent.value.classType === '行政班') {
    if (!newStudent.value.grade) {
      ElMessage.warning('请选择年级')
      return
    }
    if (!newStudent.value.class) {
      ElMessage.warning('请选择班级')
      return
    }
  } else {
    newStudent.value.grade = ''
    if (!newStudent.value.class) {
      ElMessage.warning('请输入兴趣班名称')
      return
    }
  }
  emit('create', { ...newStudent.value })
  model.value = false
}

// 暴露方法供父组件调用
defineExpose({
  showCreateStudentDialog
})
</script>
