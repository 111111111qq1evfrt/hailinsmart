<template>
  <!-- 导入学生弹窗 -->
  <ElDialog
    v-model="model"
    title="导入学生名单"
    width="550px"
    :close-on-click-modal="false"
  >
    <div class="import-form">
      <div class="form-item">
        <label>选择文件</label>
        <el-upload
          class="upload-demo"
          drag
          :auto-upload="false"
          :on-change="handleImportFileChange"
          :on-remove="resetImport"
          :file-list="importFileList"
          accept=".xlsx,.xls,.csv"
        >
          <el-icon class="el-icon--upload"><Plus /></el-icon>
          <div class="el-upload__text">点击或拖拽文件到此处上传</div>
          <div class="el-upload__hint">支持 .xlsx, .xls, .csv 格式文件</div>
        </el-upload>
      </div>
      <div class="form-item" v-if="importPreviewData.length > 0">
        <label>数据预览（前5条）</label>
        <div class="import-preview">
          <el-table :data="importPreviewData" border size="small" class="preview-table">
            <el-table-column
              v-for="(header, idx) in importHeaders"
              :key="idx"
              :label="header"
              :prop="`${idx}`"
              show-overflow-tooltip
            >
              <template #default="scope">{{ scope.row[idx] }}</template>
            </el-table-column>
          </el-table>
        </div>
      </div>
      <div class="form-item" v-if="importStats.total > 0">
        <label>导入统计</label>
        <div class="import-stats">
          <div class="stat-chip">
            <span class="chip-num">{{ importStats.total }}</span>
            <span class="chip-label">总条数</span>
          </div>
          <div class="stat-chip chip-new">
            <span class="chip-num">{{ importStats.new }}</span>
            <span class="chip-label">新增</span>
          </div>
          <div class="stat-chip chip-update">
            <span class="chip-num">{{ importStats.update }}</span>
            <span class="chip-label">更新</span>
          </div>
          <div v-if="importStats.duplicate > 0" class="stat-chip chip-duplicate">
            <span class="chip-num">{{ importStats.duplicate }}</span>
            <span class="chip-label">重复</span>
          </div>
        </div>
      </div>
      <div class="form-item">
        <label>覆盖现有数据</label>
        <el-switch v-model="importOverwrite" />
        <span class="switch-desc">开启后将清空当前学校所有学生数据后导入</span>
      </div>
      <div class="form-item">
        <el-button type="primary" :icon="Document" @click="showTemplateDownload = true">下载导入模板</el-button>
      </div>
    </div>
    <template #footer>
      <el-button @click="resetImport">重置</el-button>
      <el-button @click="model = false">取消</el-button>
      <el-button
        type="primary"
        @click="confirmImport"
        :disabled="!importFile"
      >
        确认导入
      </el-button>
    </template>
  </ElDialog>

  <!-- 模板下载弹窗 -->
  <TemplateDownload
    v-model:visible="showTemplateDownload"
    template-type="student"
    :custom-templates="customTemplates"
  />
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Document } from '@element-plus/icons-vue'
import { usePersistedRef } from '@/composables'
import { MOCK_CUSTOM_TEMPLATES } from '@/data/mockData'
import * as XLSX from 'xlsx'
import TemplateDownload from '@/components/export/TemplateDownload.vue'
import store from '@/store/global'
import { addStudentListApi, changeStudentListApi } from '@/utils/daiweiApi'
import { daiweiConfig } from '@/config/daiwei'
import { createSeededRandom, generateDeterministicId } from '@/utils/seededRandom'
import { GRADES, GRADE_MAP, SPORTS_INTERESTS, NAME_POOL, GENDER_MAP } from '../constants.js'

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

const emit = defineEmits(['import-complete', 'overwrite-students'])

// 弹窗可见性（v-model）
const model = defineModel({ type: Boolean, default: false })

// 内部状态
const importOverwrite = ref(false)
const importFile = ref(null)
const importFileList = ref([])
const importHeaders = ref([])
const importPreviewData = ref([])
const importAllData = ref([])
const importStats = ref({ total: 0, new: 0, update: 0, duplicate: 0 })
const showTemplateDownload = ref(false)
const customTemplates = usePersistedRef(
  `smart_pe_custom_templates_${props.schoolId}`,
  [...MOCK_CUSTOM_TEMPLATES]
)

// 根据班级名称查找班级 ID（简化版，从 props.classes 中查找）
const getClassIdByName = (className, grade = '') => {
  if (!className) return ''

  let cls = props.classes.find(c => c.name === className || c.label === className)

  if (!cls && grade) {
    cls = props.classes.find(c => c.name === `${grade}${className}` || c.label === `${grade}${className}`)
  }

  if (!cls && !grade) {
    cls = props.classes.find(c => c.name?.endsWith(className) || c.label?.endsWith(className))
  }

  if (cls) return cls.id || cls.dept_id || ''
  return ''
}

// 生成外部学生数据（供父组件调用）
const generateExternalStudents = (count = 50, existingIds = new Set()) => {
  const random = createSeededRandom(props.schoolId + '_generateExternalStudents')
  const classes = ['1班', '2班', '3班', '4班', '5班', '6班']

  const result = []

  for (let i = 0; i < count; i++) {
    const grade = GRADES[Math.floor(random() * GRADES.length)]
    const cls = classes[Math.floor(random() * classes.length)]
    const lastName = NAME_POOL.lastNames[Math.floor(random() * NAME_POOL.lastNames.length)]
    const firstName = NAME_POOL.firstNames[Math.floor(random() * NAME_POOL.firstNames.length)]
    const name = lastName + firstName

    const id = generateDeterministicId('ext', name + '_' + i)
    existingIds.add(id)

    const gradeNum = GRADE_MAP[grade] || 1
    const age = gradeNum + 6 + Math.floor(random() * 2)

    result.push({
      id: id,
      name: name,
      gender: random() > 0.5 ? '男' : '女',
      grade: grade,
      class: cls,
      age: age,
      faceRegistered: false,
      sportsInterest: SPORTS_INTERESTS[Math.floor(random() * SPORTS_INTERESTS.length)],
      itemClass: ''
    })
  }

  return result
}

const handleImportFileChange = (file) => {
  importFile.value = file.raw
  importFileList.value = [file]
  parseImportFile(file.raw)
}

const parseImportFile = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    try {
      const data = new Uint8Array(e.target.result)
      const workbook = XLSX.read(data, { type: 'array' })
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 })

      if (jsonData.length < 2) {
        ElMessage.warning('文件内容为空或格式不正确')
        return
      }

      importHeaders.value = jsonData[0]
      importPreviewData.value = jsonData.slice(1, 6)
      importAllData.value = jsonData.slice(1)

      calculateImportStats()
    } catch (error) {
      console.error('解析文件失败:', error)
      ElMessage.error('文件解析失败，请检查文件格式')
    }
  }
  reader.readAsArrayBuffer(file)
}

const calculateImportStats = () => {
  const currentIds = new Set(props.students.map(s => s.id))
  let newCount = 0
  let updateCount = 0
  let duplicateCount = 0
  const seenIds = new Set()

  importAllData.value.forEach(row => {
    const id = row[0]?.toString().trim()
    if (!id) return

    if (seenIds.has(id)) {
      duplicateCount++
    } else {
      seenIds.add(id)
      if (currentIds.has(id)) {
        updateCount++
      } else {
        newCount++
      }
    }
  })

  importStats.value = {
    total: importAllData.value.length,
    new: newCount,
    update: updateCount,
    duplicate: duplicateCount
  }
}

const resetImport = () => {
  importFile.value = null
  importFileList.value = []
  importHeaders.value = []
  importPreviewData.value = []
  importAllData.value = []
  importStats.value = { total: 0, new: 0, update: 0, duplicate: 0 }
}

const downloadImportTemplate = () => {
  const templateData = [
    ['学号', '姓名', '性别', '年级', '班级', '年龄', '体育兴趣'],
    ['stu-001', '张三', '男', '一年级', '1班', '8', '篮球'],
    ['stu-002', '李四', '女', '一年级', '1班', '8', '跳绳'],
    ['stu-003', '王五', '男', '二年级', '2班', '9', '足球']
  ]

  const worksheet = XLSX.utils.aoa_to_sheet(templateData)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, '学生导入模板')

  XLSX.writeFile(workbook, '学生导入模板.xlsx')
  ElMessage.success('导入模板已下载')
}

const confirmImport = async () => {
  if (!importFile.value) return

  ElMessageBox.confirm(
    `即将导入 ${importStats.value.new} 条新数据，更新 ${importStats.value.update} 条数据${importStats.value.duplicate > 0 ? `，跳过 ${importStats.value.duplicate} 条重复数据` : ''}。${importOverwrite.value ? '覆盖模式将清空现有数据！' : ''}`,
    '导入确认',
    {
      confirmButtonText: '确定导入',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    // 覆盖模式：通知父组件清空学生数据，等待 props 同步刷新
    if (importOverwrite.value) {
      emit('overwrite-students')
      await nextTick()
    }

    const seenIds = new Set()
    let successCount = 0
    const addList = []
    const changeList = []
    const importedStudents = []

    importAllData.value.forEach(row => {
      const id = row[0]?.toString().trim()
      if (!id || seenIds.has(id)) return
      seenIds.add(id)

      const grade = row[3]?.toString().trim() || ''
      const className = row[4]?.toString().trim() || ''
      const classId = className ? getClassIdByName(className, grade) : ''
      const studentData = {
        id: id,
        name: row[1]?.toString().trim() || '',
        gender: row[2]?.toString().trim() || '男',
        grade: grade,
        class: className,
        age: parseInt(row[5]) || 8,
        sportsInterest: row[6]?.toString().trim() || ''
      }

      if (classId) {
        const apiData = {
          student_id: id,
          name: studentData.name,
          gender: GENDER_MAP[studentData.gender] || 0,
          class_id: classId
        }

        const existingIndex = props.students.findIndex(s => s.id === id)
        if (existingIndex > -1) {
          Object.assign(props.students[existingIndex], studentData)
          changeList.push(apiData)
        } else {
          props.students.push({
            ...studentData,
            faceRegistered: false,
            itemClass: ''
          })
          addList.push(apiData)
        }
      } else {
        console.warn('班级名称"', className, '"未找到对应的班级ID，跳过API调用')
        const existingIndex = props.students.findIndex(s => s.id === id)
        if (existingIndex > -1) {
          Object.assign(props.students[existingIndex], studentData)
        } else {
          props.students.push({
            ...studentData,
            faceRegistered: false,
            itemClass: ''
          })
        }
      }
      successCount++
      importedStudents.push(studentData)
    })

    try {
      if (addList.length > 0) {
        const addResult = await addStudentListApi({ add_list: addList }, store.state.school.id)
      }
      if (changeList.length > 0) {
        const changeResult = await changeStudentListApi({ change_list: changeList }, store.state.school.id)
      }
    } catch (error) {
      console.warn('批量导入学生API调用失败:', error.message)
    }

    ElMessage.success(`成功导入 ${successCount} 条学生数据`)
    emit('import-complete', importedStudents)
    resetImport()
    model.value = false
  }).catch(() => {
    ElMessage.info('已取消导入')
  })
}

// 暴露 generateExternalStudents 供父组件调用
defineExpose({
  generateExternalStudents
})
</script>
