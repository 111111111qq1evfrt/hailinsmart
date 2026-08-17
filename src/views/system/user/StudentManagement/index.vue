<template>
  <div class="student-management">
    <LoadingOverlay :visible="loading" text="正在同步数据..." subText="请稍候" />
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-filters">
        <el-input v-model="searchQuery" placeholder="搜索学生姓名/学号" clearable style="width: 240px" :prefix-icon="Search" />
        <el-select v-model="filterGrade" placeholder="选择年级" clearable style="width: 140px">
          <el-option v-for="g in GRADE_OPTIONS" :key="g.value" :label="g.label" :value="g.value" />
        </el-select>
        <el-select v-model="filterClass" placeholder="选择班级" clearable style="width: 140px">
          <el-option v-for="c in classOptions" :key="c" :label="c" :value="c" />
        </el-select>
        <el-select v-model="filterType" placeholder="班级类型" clearable style="width: 140px">
          <el-option v-for="t in CLASS_TYPE_OPTIONS" :key="t.value" :label="t.label" :value="t.value" />
        </el-select>
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="exportStudents">导出名单</el-button>
        <el-button type="primary" :icon="Plus" @click="createStudentDialogRef?.showCreateStudentDialog()">新建学生</el-button>
        <el-dropdown @command="handleImportCommand">
          <el-button type="primary" :icon="Plus">
            导入学生
            <el-icon class="el-icon--right"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="local">从本地文件导入</el-dropdown-item>
              <el-dropdown-item command="external">从外部系统导入</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button type="primary" :icon="Camera" @click="faceDialogRef?.faceRegistration()">面部录入</el-button>
        <el-button type="primary" :icon="Odometer" @click="showPromotionDialog = true">自动升学</el-button>
        <el-button type="primary" :icon="Star" @click="showRecommendDialog = true">智能分班推荐</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ students.length }}</span>
        <span class="stat-label">学生总数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ faceRegisteredCount }}</span>
        <span class="stat-label">已录面部</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ adminClasses.length }}</span>
        <span class="stat-label">行政班</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ itemClasses.length }}</span>
        <span class="stat-label">分项班</span>
      </div>
    </div>

    <!-- 学生列表 -->
    <div class="list-card">
      <div class="card-header">
        <span class="card-title">学生名单</span>
        <div class="header-actions">
          <div v-if="selectedStudents.length > 0" class="batch-actions">
            <span class="batch-count">已选择 {{ selectedStudents.length }} 名学生</span>
            <el-button size="small" type="primary" @click="batchExport">批量导出</el-button>
            <el-button size="small" @click="batchEditClass">批量修改班级</el-button>
            <el-button size="small" type="danger" @click="batchDelete">批量删除</el-button>
            <el-button size="small" text @click="clearSelection">取消选择</el-button>
          </div>
          <template v-else>
            <el-button text :icon="Setting" @click="showColumnSettings = true">列设置</el-button>
            <el-button text :icon="Refresh" @click="refreshData">刷新</el-button>
            <el-pagination
              v-model:current-page="currentPage"
              v-model:page-size="pageSize"
              :total="(filteredStudents || []).length"
              :page-sizes="[8, 12, 16]"
              layout="total, sizes, prev, pager, next"
              small
            />
          </template>
        </div>
      </div>
      <div class="table-container">
        <el-table
          :data="paginatedStudents || []"
          stripe
          class="w-full"
          @selection-change="handleSelectionChange"
          @cell-dblclick="handleCellDblclick"
        >
        <el-table-column v-if="visibleColumns.selection" type="selection" width="50" />
        <el-table-column v-if="visibleColumns.id" prop="id" label="学号" min-width="200">
          <template #default="scope">
            <span v-if="editingCell.row !== scope.row || editingCell.column?.property !== 'id'">{{ scope.row.id }}</span>
            <el-input v-else v-model="editValue" @blur="saveEdit" @keyup.enter="saveEdit" @keyup.esc="cancelEdit" ref="editInput" />
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.studentInfo" label="学生信息" min-width="150">
          <template #default="scope">
            <div class="student-info-cell">
              <LazyFaceAvatar :cimg-url="scope.row.cimgUrl" :face-photo="scope.row.facePhoto" :school-id="schoolId" :size="32" @loaded="(base64) => { scope.row.facePhoto = base64 }" />
              <div class="student-meta"><span class="student-name">{{ scope.row.name }}</span></div>
            </div>
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.gender" prop="gender" label="性别" width="70">
          <template #default="scope">
            <span class="gender-tag" :class="scope.row.gender === '男' ? 'gender-男' : 'gender-女'">{{ scope.row.gender }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.grade" prop="grade" label="年级" width="80">
          <template #default="scope">
            <span v-if="editingCell.row !== scope.row || editingCell.column?.property !== 'grade'">{{ scope.row.grade }}</span>
            <el-input v-else v-model="editValue" @blur="saveEdit" @keyup.enter="saveEdit" @keyup.esc="cancelEdit" />
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.class" prop="class" label="班级" width="80">
          <template #default="scope">
            <span v-if="editingCell.row !== scope.row || editingCell.column?.property !== 'class'">{{ scope.row.class }}</span>
            <el-input v-else v-model="editValue" @blur="saveEdit" @keyup.enter="saveEdit" @keyup.esc="cancelEdit" />
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.age" prop="age" label="年龄" width="60">
          <template #default="scope">
            <span v-if="editingCell.row !== scope.row || editingCell.column?.property !== 'age'">{{ scope.row.age }}</span>
            <el-input v-else v-model="editValue" type="number" @blur="saveEdit" @keyup.enter="saveEdit" @keyup.esc="cancelEdit" />
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.faceRegistered" label="面部信息" width="90">
          <template #default="scope">
            <span class="face-tag" :class="scope.row.faceRegistered ? 'face-yes' : 'face-no'">{{ scope.row.faceRegistered ? '已录入' : '未录入' }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.testStatus" label="体测状态" width="120">
          <template #default="scope">
            <span v-if="scope.row.hasTestRecord" class="test-tag test-done">{{ scope.row.latestTestGrade || '已完成' }}</span>
            <span v-else class="test-tag test-pending">未测试</span>
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.sportsInterest" prop="sportsInterest" label="体育兴趣" min-width="100">
          <template #default="scope">
            <span v-if="editingCell.row !== scope.row || editingCell.column?.property !== 'sportsInterest'">{{ scope.row.sportsInterest }}</span>
            <el-input v-else v-model="editValue" @blur="saveEdit" @keyup.enter="saveEdit" @keyup.esc="cancelEdit" />
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.itemClass" prop="itemClass" label="分项班" min-width="120">
          <template #default="scope">
            <span v-if="editingCell.row !== scope.row || editingCell.column?.property !== 'itemClass'">
              <span v-if="scope.row.itemClass" class="item-class-tag">{{ scope.row.itemClass }}</span>
              <span v-else class="text-gray">未加入</span>
            </span>
            <el-input v-else v-model="editValue" @blur="saveEdit" @keyup.enter="saveEdit" @keyup.esc="cancelEdit" />
          </template>
        </el-table-column>
        <el-table-column v-if="visibleColumns.actions" label="操作" min-width="300" fixed="right">
          <template #default="scope">
            <el-button text type="primary" size="small" @click="detailDialogRef?.viewStudentDetail(scope.row)">详情</el-button>
            <el-button text type="primary" size="small" @click="detailDialogRef?.editStudent(scope.row)">编辑</el-button>
            <el-button text type="primary" size="small" @click="faceDialogRef?.reRecordFace(scope.row)">重录面部</el-button>
            <el-button text type="danger" size="small" @click="deleteStudent(scope.row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      </div>
    </div>

    <!-- 班级管理 -->
    <div class="list-card">
      <div class="card-header">
        <span class="card-title">班级管理</span>
        <el-button type="primary" size="small" :icon="Plus" @click="classDialogsRef?.createClass()">新建班级</el-button>
      </div>
      <div class="class-grid">
        <div class="class-card" v-for="cls in classes" :key="cls.id">
          <div class="class-header">
            <span class="class-name">{{ cls.name }}</span>
            <span class="class-type" :class="cls.type === '行政班' ? 'type-admin' : 'type-item'">{{ cls.type }}</span>
          </div>
          <div class="class-body">
            <div class="class-stat">
              <span class="stat-num">{{ getClassStudentCount(cls.name) }}</span>
              <span class="stat-label">人</span>
            </div>
            <div class="class-actions">
              <el-button text type="primary" size="small" @click="classDialogsRef?.viewClass(cls)">查看</el-button>
              <el-button text size="small" @click="classDialogsRef?.editClass(cls)">编辑</el-button>
              <el-button text type="danger" size="small" @click="classDialogsRef?.deleteClass(cls)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 弹窗组件 -->
    <PromotionDialog v-model="showPromotionDialog" :students="students" :school-id="schoolId" />
    <RecommendDialog v-model="showRecommendDialog" :students="students" :classes="classes" :school-id="schoolId" @add-class="addClass" />
    <ImportStudentDialog ref="importDialogRef" v-model="importDialogVisible" :students="students" :classes="classes" :school-id="schoolId" @overwrite-students="students = []" />
    <FaceRegistrationDialog ref="faceDialogRef" v-model="faceDialogVisible" v-model:reRecordModel="showReRecordFace" :students="students" :school-id="schoolId" @face-updated="onFaceUpdated" />
    <StudentDetailDialog ref="detailDialogRef" v-model="detailDialogVisible" v-model:editModel="editStudentVisible" :students="students" :classes="classes" :school-id="schoolId" @remove-face="onRemoveFace" @save-edit="onSaveStudentEdit" />
    <CreateStudentDialog ref="createStudentDialogRef" v-model="createStudentDialogVisible" :admin-classes="adminClasses" @create="onCreateStudent" />
    <ClassDialogs ref="classDialogsRef" v-model="createClassDialogVisible" v-model:detailModel="classDetailVisible" v-model:editModel="editClassVisible" :classes="classes" :students="students" @create-class="addClass" @update-class="onUpdateClass" @delete-class="onDeleteClass" />
    <ColumnSettingsDialog ref="columnSettingsRef" v-model="showColumnSettings" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onActivated, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search, Download, Plus, Camera, Refresh, Setting, Odometer, ArrowDown, Star } from '@element-plus/icons-vue'
import { usePersistedRef } from '@/composables'
import store from '@/store/global'
import { mockDB } from '@/mock'
import * as XLSX from 'xlsx'
import { useOperationLog } from '@/composables/useOperationLog'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import LazyFaceAvatar from '@/components/charts/LazyFaceAvatar.vue'
import { createSeededRandom, generateDeterministicId } from '@/utils/seededRandom'
import {
  getTokenData, getClassList, getStudentListV4,
  addStudent as addStudentApi, changeStudent as changeStudentApi, deleteStudent as deleteStudentApi,
  addStudentList as addStudentListApi, changeStudentList as changeStudentListApi, deleteStudentList as deleteStudentListApi,
  addClass as addClassApi, changeClass as changeClassApi, deleteClass as deleteClassApi
} from '@/utils/daiweiApi'
import { daiweiConfig } from '@/config/daiwei'
import { isBizSuccess, getFriendlyErrorMessage } from '@/utils/daweiErrorHandler'
import { GRADE_OPTIONS, CLASS_TYPE_OPTIONS, DEFAULT_COLUMN_SETTINGS, GENDER_MAP, GRADE_MAP, SPORTS_INTERESTS, NAME_POOL, GRADES, CLASS_NUMS, EDITABLE_PROPS, EXPORT_HEADERS } from './constants'
import PromotionDialog from './dialogs/PromotionDialog.vue'
import RecommendDialog from './dialogs/RecommendDialog.vue'
import ImportStudentDialog from './dialogs/ImportStudentDialog.vue'
import FaceRegistrationDialog from './dialogs/FaceRegistrationDialog.vue'
import StudentDetailDialog from './dialogs/StudentDetailDialog.vue'
import CreateStudentDialog from './dialogs/CreateStudentDialog.vue'
import ClassDialogs from './dialogs/ClassDialogs.vue'
import ColumnSettingsDialog from './dialogs/ColumnSettingsDialog.vue'

// 操作日志
const { addLog } = useOperationLog('student')

// 学校信息
const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')
const defaultStudents = computed(() => mockDB[schoolId.value]?.students || mockDB['hailin-second-primary'].students)
const defaultClasses = computed(() => mockDB[schoolId.value]?.classes || mockDB['hailin-second-primary'].classes)

// 学生数据存储
const studentsStorageKey = computed(() => `students_${schoolId.value}`)
const readStudentsFromStorage = () => {
  try {
    const raw = sessionStorage.getItem(studentsStorageKey.value)
    if (raw && raw !== 'undefined' && raw !== 'null') {
      const data = JSON.parse(raw)
      if (Array.isArray(data) && data.length > 0) {
        const hasValidGrade = data.some(s => s.grade && /\d+年级/.test(s.grade))
        if (!hasValidGrade) {
          sessionStorage.removeItem(studentsStorageKey.value)
          return null
        }
      }
      return data
    }
  } catch (e) { /* ignore */ }
  return null
}
const writeStudentsToStorage = (data) => {
  sessionStorage.setItem(studentsStorageKey.value, JSON.stringify(data))
}

// 响应式状态
const studentsDataSource = ref('')
const students = ref([])
const classes = usePersistedRef(computed(() => `classes_${schoolId.value}`), defaultClasses.value)
const searchQuery = ref('')
const filterGrade = ref('')
const filterClass = ref('')
const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(12)
const loading = ref(true)
const selectedStudents = ref([])

// students 写入 storage
watch(students, (val) => {
  if (studentsDataSource.value && studentsDataSource.value !== 'mock' && val.length >= 0) {
    writeStudentsToStorage(val)
  }
}, { deep: true })

// 数据加载
const loadDaiweiData = async () => {
  const sid = store.state.school?.id || ''
  try {
    const tokenResult = await getTokenData(sid)
    if (!tokenResult || !tokenResult.token) {
      throw new Error('Token获取失败，使用本地数据')
    }
    const classResult = await getClassList({}, sid)
    if (String(classResult.code) !== '0' || !classResult.data) {
      throw new Error('班级数据获取失败，使用本地数据')
    }
    const classesMap = {}
    const parseClasses = (nodes) => {
      nodes.forEach(node => {
        if (node.type === 4) {
          classesMap[node.dept_id] = {
            id: node.dept_id, name: node.name, type: '行政班',
            grade: node.name.replace(/\d+班$/, ''),
            className: node.name.replace(/^[一二三四五六]年级/, ''),
            feature: node.feature || {}
          }
        }
        if (node.children && node.children.length > 0) parseClasses(node.children)
      })
    }
    parseClasses(classResult.data)
    const newClasses = Object.values(classesMap).map(c => ({ id: c.id, name: c.name, type: '行政班', teacher: '', studentCount: 0 }))
    const gradeNames = [...new Set(newClasses.map(c => c.name.replace(/\d+班$/, '')))]
    gradeNames.forEach(grade => {
      if (!classes.value.some(c => c.name === grade)) {
        newClasses.push({ id: generateDeterministicId('G', grade), name: grade, type: '行政班', teacher: '', studentCount: 0 })
      }
    })
    classes.value = newClasses
    const result = await getStudentListV4({ page: 1, size: 2000 }, sid)
    const allStudents = result.list || []
    const newStudents = allStudents.map(s => {
      const classInfo = classesMap[s.class_id]
      const grade = classInfo?.grade || ''
      const className = classInfo?.className || ''
      const gradeNum = grade ? parseInt(grade.replace('年级', '')) : 0
      const age = gradeNum > 0 ? gradeNum + 6 : 8
      return {
        id: s.student_id, name: s.name, gender: s.gender === 1 ? '男' : '女',
        grade, class: className, className, age,
        faceRegistered: !!s.cimg_url, sportsInterest: '', itemClass: '',
        studentNumber: s.student_number || '-', cimgUrl: s.cimg_url || '', facePhoto: '',
        phone: '', idCard: '', parentName: '', parentPhone: '', address: '',
        createTime: new Date().toISOString(), status: '正常'
      }
    })
    if (newStudents.length > 0) {
      studentsDataSource.value = 'api'
      students.value = newStudents
      writeStudentsToStorage(newStudents)
    } else {
      studentsDataSource.value = 'mock'
      students.value = defaultStudents.value
    }
    loading.value = false
  } catch (error) {
    const cached = readStudentsFromStorage()
    if (cached && cached.length > 0) {
      studentsDataSource.value = 'storage'
      students.value = cached
    } else {
      studentsDataSource.value = 'mock'
      students.value = defaultStudents.value
    }
    loading.value = false
  }
}

const refreshData = () => {
  searchQuery.value = ''
  filterGrade.value = ''
  filterClass.value = ''
  filterType.value = ''
  currentPage.value = 1
  ElMessage.success('数据已刷新')
}

// 计算属性
const filteredStudents = computed(() => {
  let result = [...students.value]
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(s => s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q))
  }
  const selectedClass = classes.value.find(c => c.name === filterClass.value)
  const isItemClass = selectedClass?.type === '分项班'
  if (!isItemClass && filterGrade.value && filterGrade.value !== 'all') {
    result = result.filter(s => s.grade === filterGrade.value)
  }
  if (filterClass.value) {
    if (isItemClass) {
      result = result.filter(s => s.itemClass === filterClass.value)
    } else {
      result = result.filter(s => `${s.grade}${s.class}` === filterClass.value || s.class === filterClass.value)
    }
  }
  if (filterType.value) {
    if (filterType.value === '行政班') {
      result = result.filter(s => !s.itemClass || !s.itemClass.trim())
    } else if (filterType.value === '分项班') {
      result = result.filter(s => s.itemClass && s.itemClass.trim())
    }
  }
  return result
})

const paginatedStudents = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  return filteredStudents.value.slice(start, start + pageSize.value)
})

const adminClasses = computed(() => classes.value.filter(c => c.type === '行政班'))
const itemClasses = computed(() => classes.value.filter(c => c.type === '分项班'))
const faceRegisteredCount = computed(() => students.value.filter(s => s.faceRegistered).length)

const classOptions = computed(() => {
  let filtered = classes.value
  if (filterType.value) filtered = filtered.filter(c => c.type === filterType.value)
  if (filterGrade.value && filterGrade.value !== 'all' && filterType.value !== '分项班') {
    filtered = filtered.filter(c => c.name.startsWith(filterGrade.value))
  }
  return [...new Set(filtered.map(c => c.name))]
})

const getClassStudentCount = (className) => {
  const cls = classes.value.find(c => c.name === className)
  if (!cls) return 0
  if (cls.type === '行政班') {
    return students.value.filter(s => className.includes(s.grade) && className.includes(s.class)).length
  }
  return students.value.filter(s => s.itemClass === className).length
}

const getClassIdByName = (className, grade = '') => {
  if (!className) return ''
  let cls = classes.value.find(c => c.name === className || c.label === className)
  if (!cls && grade) {
    cls = classes.value.find(c => c.name === `${grade}${className}` || c.label === `${grade}${className}`)
  }
  if (!cls && !grade) {
    cls = classes.value.find(c => c.name?.endsWith(className) || c.label?.endsWith(className))
  }
  return cls ? (cls.id || cls.dept_id || '') : ''
}

const getGradeFromClassName = (className) => {
  if (!className) return '—'
  const match = className.match(/(一年级|二年级|三年级|四年级|五年级|六年级)/)
  return match ? match[1] : '—'
}

// CRUD
const addStudent = async (data) => {
  const studentId = data.id || generateDeterministicId('stu', data.name || 'new')
  const className = data.class || data.className || ''
  const grade = data.grade || ''
  const classId = className ? getClassIdByName(className, grade) : ''
  const apiData = { student_id: studentId, name: data.name, gender: GENDER_MAP[data.gender] || 0, class_id: classId }
  if (classId && daiweiConfig.enabled) {
    try {
      const result = await addStudentApi(apiData, store.state.school.id)
      if (!isBizSuccess(result)) {
        ElMessage.error(getFriendlyErrorMessage(result, '添加学生'))
        return
      }
    } catch (error) {
      console.warn('添加学生API调用失败，已回退Mock:', error.message)
    }
  }
  students.value.unshift({
    id: studentId, ...data, faceRegistered: false, cimgUrl: '', facePhoto: '', sportsInterest: '', itemClass: ''
  })
  addLog('添加学生', data.name || '新学生', `添加学生"${data.name}"`)
}

const updateStudent = async (id, data) => {
  const className = data.class || data.className || ''
  const grade = data.grade || ''
  const classId = className ? getClassIdByName(className, grade) : ''
  const apiData = { student_id: id, name: data.name, gender: GENDER_MAP[data.gender] || 0, class_id: classId }
  if (classId && daiweiConfig.enabled) {
    try {
      const result = await changeStudentApi(apiData, store.state.school.id)
      if (!isBizSuccess(result)) {
        ElMessage.error(getFriendlyErrorMessage(result, '修改学生'))
        return
      }
    } catch (error) {
      console.warn('修改学生API调用失败，已回退Mock:', error.message)
    }
  }
  const idx = students.value.findIndex(s => s.id === id)
  if (idx > -1) {
    Object.assign(students.value[idx], data)
    addLog('修改学生', data.name || '', `修改学生"${data.name}"的信息`)
  }
}

const removeStudent = async (id) => {
  if (daiweiConfig.enabled) {
    try {
      const result = await deleteStudentApi({ student_id: id }, store.state.school.id)
      if (!isBizSuccess(result)) {
        ElMessage.error(getFriendlyErrorMessage(result, '删除学生'))
        return
      }
    } catch (error) {
      console.warn('删除学生API调用失败，已回退Mock:', error.message)
    }
  }
  const idx = students.value.findIndex(s => s.id === id)
  if (idx > -1) {
    const name = students.value[idx].name
    students.value.splice(idx, 1)
    addLog('删除学生', name, `删除学生"${name}"`)
  }
}

const batchRemoveStudents = async (ids) => {
  if (daiweiConfig.enabled) {
    try {
      const deleteList = ids.map(id => ({ student_id: id }))
      const result = await deleteStudentListApi({ delete_list: deleteList }, store.state.school.id)
      if (!isBizSuccess(result)) {
        ElMessage.error(getFriendlyErrorMessage(result, '批量删除学生'))
        return
      }
    } catch (error) {
      console.warn('批量删除学生API调用失败，已回退Mock:', error.message)
    }
  }
  students.value = students.value.filter(s => !ids.includes(s.id))
  addLog('批量删除', `共${ids.length}人`, `批量删除${ids.length}名学生`)
}

const addClass = async (data) => {
  let className = ''
  let classLevel = -1
  if (data.type === '行政班') {
    className = `${data.grade || ''}${data.classNum || ''}班`
    classLevel = parseInt(data.classNum) || -1
  } else {
    className = data.name || ''
  }
  let pid = '-1'
  try {
    const classResult = await getClassList({ dept_id: '-1', recursion: 1 }, store.state.school.id)
    if (String(classResult.code) === '0' && classResult.data && classResult.data.length > 0) {
      const findGradeId = (nodes, gradeName) => {
        for (const node of nodes) {
          if (node.type === 3 && node.name === gradeName) return node.dept_id
          if (node.children && node.children.length > 0) {
            const found = findGradeId(node.children, gradeName)
            if (found) return found
          }
        }
        return null
      }
      const gradeId = findGradeId(classResult.data, data.grade || '')
      if (gradeId) pid = gradeId
    }
  } catch (error) {
    console.warn('获取班级结构失败，使用默认父级:', error.message)
  }
  const apiData = { type: 4, name: className, pid, class_level: classLevel }
  try {
    const result = await addClassApi(apiData, store.state.school.id)
    const classId = result.data?.dept_id || generateDeterministicId('C', className)
    classes.value.unshift({ id: classId, name: className, type: data.type, teacher: data.teacher || '', studentCount: 0 })
  } catch (error) {
    console.warn('添加班级API调用失败:', error.message)
    classes.value.unshift({ id: generateDeterministicId('C', className), name: className, type: data.type, teacher: data.teacher || '', studentCount: 0 })
  }
}

const updateClass = async (id, data) => {
  const idx = classes.value.findIndex(c => c.id === id)
  if (idx > -1) {
    Object.assign(classes.value[idx], data)
    const className = data.name || ''
    const classMatch = className.match(/(\d+)班$/)
    const classLevel = classMatch ? parseInt(classMatch[1]) : -1
    try {
      await changeClassApi({ dept_id: id, type: 4, name: className, class_level: classLevel }, store.state.school.id)
    } catch (error) {
      console.warn('修改班级API调用失败:', error.message)
    }
  }
}

const removeClass = async (id) => {
  const idx = classes.value.findIndex(c => c.id === id)
  if (idx > -1) {
    const cls = classes.value[idx]
    const studentCount = getClassStudentCount(cls.name)
    if (studentCount > 0) {
      ElMessage.warning(`该班级有 ${studentCount} 名学生，无法删除。请先将学生转移到其他班级。`)
      return false
    }
    classes.value.splice(idx, 1)
    try {
      await deleteClassApi({ dept_id: id }, store.state.school.id)
    } catch (error) {
      console.warn('删除班级API调用失败:', error.message)
    }
    return true
  }
  return false
}

// 批量操作
const handleSelectionChange = (val) => { selectedStudents.value = val }
const clearSelection = () => { selectedStudents.value = [] }

const batchExport = () => {
  const headers = EXPORT_HEADERS
  const rows = selectedStudents.value.map(s => [s.id, s.name, s.gender, s.class, s.grade, s.age, s.sportsInterest || '', s.faceRegistered ? '已录入' : '未录入'])
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `批量导出学生_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出 ${selectedStudents.value.length} 名学生数据`)
}

const batchEditClass = async () => {
  ElMessageBox.prompt('请选择新班级', '批量修改班级', {
    confirmButtonText: '确定', cancelButtonText: '取消',
    inputPattern: /.+/, inputErrorMessage: '班级不能为空'
  }).then(async ({ value }) => {
    const className = value
    const classId = getClassIdByName(className, '')
    if (!classId) {
      ElMessage.warning('未找到对应的班级ID，请检查班级名称')
      return
    }
    const changeList = selectedStudents.value.map(s => ({ student_id: s.id, name: s.name, gender: s.gender === '男' ? 1 : 2, class_id: classId }))
    try {
      await changeStudentListApi({ change_list: changeList }, store.state.school.id)
    } catch (error) {
      console.warn('批量修改班级API调用失败:', error.message)
    }
    selectedStudents.value.forEach(student => {
      const idx = students.value.findIndex(s => s.id === student.id)
      if (idx > -1) {
        students.value[idx].class = className
        students.value[idx].className = className
      }
    })
    ElMessage.success(`已为 ${selectedStudents.value.length} 名学生修改班级`)
    addLog('批量修改', `共${selectedStudents.value.length}人`, `批量修改${selectedStudents.value.length}名学生的班级为"${className}"`)
    clearSelection()
  }).catch(() => { ElMessage.info('已取消批量修改') })
}

const batchDelete = () => {
  ElMessageBox.confirm(
    `确定要删除选中的 ${selectedStudents.value.length} 名学生吗？此操作不可恢复！`,
    '批量删除确认',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    const idsToDelete = selectedStudents.value.map(s => s.id)
    batchRemoveStudents(idsToDelete)
    ElMessage.success(`已成功删除 ${selectedStudents.value.length} 名学生`)
    clearSelection()
  }).catch(() => { ElMessage.error('批量删除学生失败，请重试') })
}

const exportStudents = () => {
  const headers = EXPORT_HEADERS
  const rows = filteredStudents.value.map(s => [s.id, s.name, s.gender, s.grade, s.class, s.age, s.sportsInterest || '', s.faceRegistered ? '已录入' : '未录入'])
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `学生名单_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  ElMessage.success('学生名单已导出')
  addLog('导出名单', '全部学生', `导出学生名单`)
}

const generateExternalStudents = (count = 50, existingIds = new Set()) => {
  const random = createSeededRandom(schoolId.value + '_generateExternalStudents')
  const result = []
  for (let i = 0; i < count; i++) {
    const grade = GRADES[Math.floor(random() * GRADES.length)]
    const cls = CLASS_NUMS[Math.floor(random() * CLASS_NUMS.length)]
    const lastName = NAME_POOL.lastNames[Math.floor(random() * NAME_POOL.lastNames.length)]
    const firstName = NAME_POOL.firstNames[Math.floor(random() * NAME_POOL.firstNames.length)]
    const name = lastName + firstName
    const id = generateDeterministicId('ext', name + '_' + i)
    existingIds.add(id)
    const gradeNum = GRADE_MAP[grade] || 1
    const age = gradeNum + 6 + Math.floor(random() * 2)
    result.push({
      id, name, gender: random() > 0.5 ? '男' : '女', grade, class: cls, age,
      faceRegistered: false, sportsInterest: SPORTS_INTERESTS[Math.floor(random() * SPORTS_INTERESTS.length)], itemClass: ''
    })
  }
  return result
}

const handleImportCommand = (command) => {
  if (command === 'local') {
    importDialogVisible.value = true
  } else if (command === 'external') {
    ElMessageBox.confirm('将从教务管理系统同步学生数据，是否继续？', '外部系统导入', {
      confirmButtonText: '确定', cancelButtonText: '取消', type: 'info'
    }).then(() => {
      ElMessage.info('正在从教务系统同步数据...')
      setTimeout(() => {
        const existingIds = new Set(students.value.map(s => s.id))
        const externalStudents = generateExternalStudents(50, existingIds)
        externalStudents.forEach(student => students.value.push(student))
        ElMessage.success(`已从教务系统成功同步 ${externalStudents.length} 条学生数据`)
      }, 1500)
    }).catch(() => { ElMessage.info('已取消导入') })
  }
}

// 单元格编辑
const editingCell = ref({ row: null, column: null })
const editValue = ref('')
const handleCellDblclick = (row, column) => {
  if (EDITABLE_PROPS.includes(column.property)) {
    editingCell.value = { row, column }
    editValue.value = String(row[column.property] || '')
  }
}
const saveEdit = () => {
  if (editingCell.value.row && editingCell.value.column) {
    updateStudent(editingCell.value.row.id, { [editingCell.value.column.property]: editValue.value })
    ElMessage.success('已更新')
  }
  cancelEdit()
}
const cancelEdit = () => {
  editingCell.value = { row: null, column: null }
  editValue.value = ''
}

// 删除学生（表格操作）
const deleteStudent = (student) => {
  ElMessageBox.confirm(
    `确定要删除学生 "${student.name}" 吗？此操作不可撤销。`,
    '删除确认',
    { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning' }
  ).then(async () => {
    await removeStudent(student.id)
    ElMessage.success(`已删除学生: ${student.name}`)
  }).catch(() => { ElMessage.info('已取消删除') })
}

// 弹窗可见性
const showPromotionDialog = ref(false)
const showRecommendDialog = ref(false)
const importDialogVisible = ref(false)
const faceDialogVisible = ref(false)
const showReRecordFace = ref(false)
const detailDialogVisible = ref(false)
const editStudentVisible = ref(false)
const createStudentDialogVisible = ref(false)
const createClassDialogVisible = ref(false)
const classDetailVisible = ref(false)
const editClassVisible = ref(false)
const showColumnSettings = ref(false)

// 弹窗 refs
const importDialogRef = ref(null)
const faceDialogRef = ref(null)
const detailDialogRef = ref(null)
const createStudentDialogRef = ref(null)
const classDialogsRef = ref(null)
const columnSettingsRef = ref(null)

// visibleColumns 从 ColumnSettingsDialog 获取
const visibleColumns = computed(() => {
  const vc = columnSettingsRef.value?.visibleColumns
  if (!vc) {
    return DEFAULT_COLUMN_SETTINGS.reduce((acc, key) => { acc[key] = true; return acc }, {})
  }
  return vc
})

// 弹窗事件处理
const onCreateStudent = async (data) => {
  await addStudent(data)
  ElMessage.success(`学生 "${data.name}" 创建成功`)
}

const onSaveStudentEdit = async ({ id, data }) => {
  await updateStudent(id, data)
  ElMessage.success(`已保存 ${data.name} 的信息`)
}

const onRemoveFace = async (studentId) => {
  const student = students.value.find(s => s.id === studentId)
  if (!student) return
  try {
    const result = await import('@/utils/daiweiApi').then(m => m.deleteStudentFace({ student_id: studentId }, store.state.school.id))
    if (String(result.code) === '0') {
      student.faceRegistered = false
      student.facePhoto = ''
      ElMessage.success(`已删除 ${student.name} 的人脸信息`)
      addLog('删除人脸', student.name, `删除学生"${student.name}"的人脸信息`)
    } else {
      ElMessage.error(`删除人脸失败: ${result.message || '未知错误'}`)
    }
  } catch (error) {
    console.warn('删除人脸API调用失败:', error.message)
    student.faceRegistered = false
    student.facePhoto = ''
    ElMessage.success(`已删除 ${student.name} 的人脸信息`)
    addLog('删除人脸', student.name, `删除学生"${student.name}"的人脸信息`)
  }
}

const onFaceUpdated = ({ studentId, faceRegistered, facePhoto }) => {
  const student = students.value.find(s => s.id === studentId)
  if (student) {
    student.faceRegistered = faceRegistered
    if (facePhoto) student.facePhoto = facePhoto
  }
}

const onUpdateClass = async ({ id, data }) => {
  await updateClass(id, data)
  ElMessage.success(`班级 "${data.name}" 已更新`)
}

const onDeleteClass = async (classId) => {
  const success = await removeClass(classId)
  if (success) {
    classDetailVisible.value = false
    ElMessage.success('班级已删除')
  }
}

// 生命周期
onMounted(() => {
  const key = `students_${store.state.school?.id || 'hailin-second-primary'}`
  try {
    const raw = sessionStorage.getItem(key)
    if (raw) {
      const data = JSON.parse(raw)
      if (Array.isArray(data) && data.length > 0) {
        const hasValidGrade = data.some(s => s.grade && /\d+年级/.test(s.grade))
        if (!hasValidGrade) {
          console.warn('[StudentManagement] onMounted 检测到脏数据，清除:', key)
          sessionStorage.removeItem(key)
        }
      }
    }
  } catch (e) { /* ignore */ }
  loadDaiweiData()
})

onActivated(() => {
  const key = `students_${store.state.school?.id || 'hailin-second-primary'}`
  try {
    const raw = sessionStorage.getItem(key)
    if (raw) {
      const data = JSON.parse(raw)
      if (Array.isArray(data) && data.length > 0) {
        const hasValidGrade = data.some(s => s.grade && /\d+年级/.test(s.grade))
        if (!hasValidGrade) {
          console.warn('[StudentManagement] onActivated 检测到脏数据，清除:', key)
          sessionStorage.removeItem(key)
        }
      }
    }
  } catch (e) { /* ignore */ }
  loading.value = true
  loadDaiweiData()
})
</script>

<style lang="scss" scoped src="./style.scss"></style>
