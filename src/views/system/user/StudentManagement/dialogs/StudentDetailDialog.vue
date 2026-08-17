<template>
  <!-- 学生详情弹窗 -->
  <ElDialog
    v-model="model"
    title="学生详情"
    width="600px"
  >
    <div v-if="selectedStudent" class="student-detail">
      <div class="detail-header">
        <LazyFaceAvatar
          :cimg-url="selectedStudent.cimgUrl"
          :face-photo="selectedStudent.facePhoto"
          :school-id="schoolId"
          :size="80"
          class="detail-avatar"
          @loaded="(base64) => { selectedStudent.facePhoto = base64 }"
        />
        <div class="student-info">
          <h3>{{ selectedStudent.name }}</h3>
          <p>学号: {{ selectedStudent.id }}</p>
        </div>
      </div>
      <div class="detail-body">
        <div class="detail-row">
          <span class="detail-label">性别</span>
          <span class="detail-value">{{ selectedStudent.gender }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">年级</span>
          <span class="detail-value">{{ selectedStudent.grade }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">班级</span>
          <span class="detail-value">{{ selectedStudent.class }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">年龄</span>
          <span class="detail-value">{{ selectedStudent.age }}岁</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">面部信息</span>
          <span class="detail-value" :class="selectedStudent.faceRegistered ? 'face-registered' : 'face-unregistered'">
            {{ selectedStudent.faceRegistered ? '已录入' : '未录入' }}
          </span>
        </div>
        <div class="detail-row">
          <span class="detail-label">体育兴趣</span>
          <span class="detail-value">{{ selectedStudent.sportsInterest }}</span>
        </div>
      </div>
    </div>
    <template #footer>
      <el-button v-if="selectedStudent?.faceRegistered" type="danger" @click="removeFace">删除人脸</el-button>
      <el-button @click="editStudent(selectedStudent)">编辑</el-button>
      <el-button type="primary" @click="model = false">关闭</el-button>
    </template>
  </ElDialog>

  <!-- 编辑学生弹窗 -->
  <ElDialog v-model="editModel" title="编辑学生信息" width="500px">
    <el-form v-if="studentForm" :model="studentForm" label-width="90px">
      <el-form-item label="学号">
        <el-input v-model="studentForm.id" disabled />
      </el-form-item>
      <el-form-item label="姓名">
        <el-input v-model="studentForm.name" />
      </el-form-item>
      <el-form-item label="年级">
        <el-select v-model="studentForm.grade" class="w-full" @change="studentForm.class = ''">
          <el-option v-for="g in ['一年级','二年级','三年级','四年级','五年级','六年级']" :key="g" :label="g" :value="g" />
        </el-select>
      </el-form-item>
      <el-form-item label="班级">
        <el-select v-model="studentForm.class" :disabled="!studentForm.grade" class="w-full">
          <el-option v-for="c in editStudentClassOptions" :key="c" :label="c" :value="c" />
        </el-select>
      </el-form-item>
      <el-form-item label="性别">
        <el-radio-group v-model="studentForm.gender">
          <el-radio label="男" />
          <el-radio label="女" />
        </el-radio-group>
      </el-form-item>
      <el-form-item label="体育兴趣">
        <el-input v-model="studentForm.sportsInterest" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="editModel = false">取消</el-button>
      <el-button type="primary" @click="saveStudentEdit">保存</el-button>
    </template>
  </ElDialog>
</template>

<script setup>
import { ref, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import LazyFaceAvatar from '@/components/charts/LazyFaceAvatar.vue'

const props = defineProps({
  students: {
    type: Array,
    default: () => []
  },
  classes: {
    type: Array,
    default: () => []
  },
  schoolId: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['edit', 'remove-face', 'save-edit'])

// 双向绑定：详情弹窗可见性
const model = defineModel({ type: Boolean, default: false })
// 双向绑定：编辑弹窗可见性
const editModel = defineModel('editModel', { type: Boolean, default: false })

// 内部状态
const selectedStudent = ref(null)
const studentForm = ref(null)

// 计算属性：根据 studentForm.grade 过滤班级
const editStudentClassOptions = computed(() => {
  const g = studentForm.value?.grade || ''
  if (!g) return []
  return props.classes
    .filter(c => c.name.startsWith(g))
    .map(c => c.name.replace(g, ''))
})

// 查看学生详情
const viewStudentDetail = (student) => {
  selectedStudent.value = student
  model.value = true
}

// 删除人脸
const removeFace = () => {
  const studentId = selectedStudent.value?.id
  const studentName = selectedStudent.value?.name

  ElMessageBox.confirm(
    `确定要删除学生 "${studentName}" 的人脸信息吗？此操作不可撤销。`,
    '删除人脸确认',
    {
      confirmButtonText: '确定删除',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    emit('remove-face', studentId)
  }).catch(() => {
    ElMessage.info('已取消删除')
  })
}

// 编辑学生（打开编辑弹窗）
const editStudent = (student) => {
  studentForm.value = { ...student }
  editModel.value = true
  model.value = false
  emit('edit', student)
}

// 保存学生编辑
const saveStudentEdit = () => {
  if (!studentForm.value?.name) {
    ElMessage.warning('请填写学生姓名')
    return
  }
  emit('save-edit', { id: studentForm.value.id, data: studentForm.value })
  editModel.value = false
}

defineExpose({ viewStudentDetail, selectedStudent })
</script>
