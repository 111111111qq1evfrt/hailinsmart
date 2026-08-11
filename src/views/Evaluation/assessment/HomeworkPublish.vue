<template>
  <div class="homework-publish-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索作业名称"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
        />
        <el-select v-model="filterGrade" placeholder="选择年级" clearable style="width: 140px">
          <el-option label="全部年级" value="all" />
          <el-option label="一年级" value="一年级" />
          <el-option label="二年级" value="二年级" />
          <el-option label="三年级" value="三年级" />
          <el-option label="四年级" value="四年级" />
          <el-option label="五年级" value="五年级" />
          <el-option label="六年级" value="六年级" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="作业状态" clearable style="width: 140px">
          <el-option label="进行中" value="ongoing" />
          <el-option label="已截止" value="ended" />
          <el-option label="已完成" value="completed" />
        </el-select>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="refreshData">刷新</el-button>
        <el-button :icon="Download" @click="exportData">导出记录</el-button>
        <el-button type="primary" :icon="Plus" @click="publishHomework">发布作业</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ stats.totalHomework }}</span>
        <span class="stat-label">已发布作业</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: stats.completedRate >= 80 ? '#1E5AA8' : stats.completedRate >= 60 ? '#F5A623' : '#E85D4E' }">{{ stats.completedRate }}%</span>
        <span class="stat-label">完成率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num text-primary">{{ stats.onGoing }}</span>
        <span class="stat-label">进行中</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num text-primary">{{ stats.thisWeek }}</span>
        <span class="stat-label">本周发布</span>
      </div>
    </div>

    <div class="content-row">
      <div class="homework-list">
        <div class="card-header">
          <span class="card-title">作业列表</span>
          <span class="total-count">共 {{ filteredHomework.length }} 条作业</span>
        </div>
        <div class="homework-cards">
          <div v-for="(homework, index) in filteredHomework" :key="index" class="homework-card">
            <div class="homework-status" :class="homework.status">{{ getStatusText(homework.status) }}</div>
            <div class="homework-info">
              <h3 class="homework-title">{{ homework.title }}</h3>
              <div class="homework-meta">
                <span><el-icon><Document /></el-icon> {{ homework.grade }}</span>
                <span><el-icon><Calendar /></el-icon> {{ homework.dueDate }}</span>
                <span><el-icon><User /></el-icon> {{ homework.participants }}人</span>
              </div>
              <div class="homework-desc">{{ homework.description }}</div>
              <div class="homework-tasks">
                <div v-for="(task, idx) in homework.tasks" :key="idx" class="task-item">
                  <span class="task-num">{{ idx + 1 }}.</span>
                  <span class="task-text">{{ task }}</span>
                </div>
              </div>
            </div>
            <div class="homework-progress">
              <div class="progress-header">
                <span>完成进度</span>
                <span>{{ homework.completed }}/{{ homework.total }}</span>
              </div>
              <el-progress :percentage="homework.progress" color="#1E5AA8" :show-text="false" />
            </div>
            <div class="homework-actions">
              <el-button size="small" :icon="Grid" @click="viewDetail(homework)">查看详情</el-button>
              <el-button size="small" :icon="Histogram" @click="viewStats(homework)">统计</el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="side-panel">
        <div class="chart-card">
          <div class="card-header">
            <span class="card-title">完成统计</span>
          </div>
          <div class="completion-chart">
            <div class="chart-bar">
              <div class="bar-segment completed" :style="{ width: stats.completedRate + '%' }"></div>
              <div class="bar-segment pending" :style="{ width: (100 - stats.completedRate) + '%' }"></div>
            </div>
            <div class="chart-labels">
              <span>已完成 {{ stats.completedRate }}%</span>
              <span>未完成 {{ 100 - stats.completedRate }}%</span>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="card-header">
            <span class="card-title">年级完成情况</span>
          </div>
          <div class="grade-list">
            <div v-for="(item, index) in gradeStats" :key="index" class="grade-item">
              <span class="grade-name">{{ item.grade }}</span>
              <el-progress :percentage="item.rate" :color="getGradeColor(item.rate)" :show-text="false" style="flex: 1; margin: 0 12px" />
              <span class="grade-rate">{{ item.rate }}%</span>
            </div>
          </div>
        </div>

        <div class="chart-card">
          <div class="card-header">
            <span class="card-title">作业类型统计</span>
          </div>
          <div class="type-list">
            <div v-for="(item, index) in typeStats" :key="index" class="type-item">
              <span class="type-icon"><el-icon :size="16" color="#1E5AA8"><component :is="item.icon" /></el-icon></span>
              <span class="type-name">{{ item.name }}</span>
              <span class="type-count">{{ item.count }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 发布作业弹窗 -->
    <el-dialog
      v-model="showPublishDialog"
      title="发布体育作业"
      width="900px"
      :close-on-click-modal="false"
      top="5vh"
    >
      <el-steps :active="publishStep" finish-status="success" align-center style="margin-bottom: 24px">
        <el-step title="基本信息" />
        <el-step title="逐人定制" />
        <el-step title="确认发布" />
      </el-steps>

      <!-- 步骤1：基本信息 -->
      <div v-show="publishStep === 0" class="publish-step">
        <el-form :model="publishForm" label-width="100px">
          <el-row :gutter="16">
            <el-col :span="12">
              <el-form-item label="作业名称" required>
                <el-input v-model="publishForm.title" placeholder="如：周末体能训练" />
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="运动项目" required>
                <el-select v-model="publishForm.project" placeholder="选择项目" class="w-full" @change="onProjectChange">
                  <el-option label="跳绳" value="跳绳" />
                  <el-option label="仰卧起坐" value="仰卧起坐" />
                  <el-option label="立定跳远" value="立定跳远" />
                  <el-option label="50米跑" value="50米跑" />
                  <el-option label="阳光跑" value="阳光跑" />
                  <el-option label="综合体能" value="综合体能" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>
          <el-row :gutter="16">
            <el-col :span="8">
              <el-form-item label="目标年级" required>
                <el-select v-model="publishForm.grade" placeholder="选择年级" class="w-full" @change="loadClassStudents">
                  <el-option v-for="g in gradeOptions" :key="g" :label="g" :value="g" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="目标班级">
                <el-select v-model="publishForm.className" placeholder="选择班级（不选为全年级）" class="w-full" @change="loadClassStudents">
                  <el-option label="全年级" value="" />
                  <el-option v-for="c in classOptions" :key="c" :label="c" :value="c" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :span="8">
              <el-form-item label="截止日期" required>
                <el-date-picker v-model="publishForm.dueDate" type="date" placeholder="选择日期" class="w-full" value-format="YYYY-MM-DD" />
              </el-form-item>
            </el-col>
          </el-row>
          <el-form-item label="作业说明">
            <el-input v-model="publishForm.description" type="textarea" :rows="3" placeholder="作业要求说明，将推送给学生和家长" />
          </el-form-item>
        </el-form>
      </div>

      <!-- 步骤2：逐人定制 -->
      <div v-show="publishStep === 1" class="publish-step">
        <div class="custom-toolbar">
          <span class="toolbar-info">共 {{ studentAssignments.length }} 名学生</span>
          <div class="toolbar-actions">
            <el-button size="small" @click="selectAllClass">选择整个班级</el-button>
            <el-button size="small" @click="showStudentSelector = true">手动添加学生</el-button>
            <el-button size="small" @click="autoMatchAll">一键智能匹配</el-button>
            <el-button size="small" @click="resetAllToDefault">恢复默认标准</el-button>
            <el-button size="small" type="danger" @click="clearAllStudents">清空全部</el-button>
          </div>
        </div>
        <el-table :data="studentAssignments" stripe max-height="400" size="small">
          <el-table-column prop="name" label="姓名" width="90" fixed />
          <el-table-column prop="id" label="学号" width="100" />
          <el-table-column prop="sportsInterest" label="体育兴趣" width="90" />
          <el-table-column label="运动能力" width="110">
            <template #default="{ row }">
              <el-tag :type="getAbilityTagType(row.abilityLevel)" size="small">{{ row.abilityLevel }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="最低达成标准" min-width="160">
            <template #default="{ row }">
              <el-input v-model="row.minStandard" size="small" :placeholder="getStandardPlaceholder()" />
            </template>
          </el-table-column>
          <el-table-column label="作业强度" width="130">
            <template #default="{ row }">
              <el-select v-model="row.intensity" size="small">
                <el-option label="低强度" value="low" />
                <el-option label="中强度" value="medium" />
                <el-option label="高强度" value="high" />
              </el-select>
            </template>
          </el-table-column>
          <el-table-column label="定制任务" min-width="180">
            <template #default="{ row }">
              <el-input v-model="row.customTask" size="small" placeholder="个性化任务描述" />
            </template>
          </el-table-column>
          <el-table-column label="操作" width="60">
            <template #default="{ row, $index }">
              <el-button size="small" type="danger" @click="removeStudent($index)">移除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 步骤3：确认发布 -->
      <div v-show="publishStep === 2" class="publish-step">
        <div class="confirm-summary">
          <h4>发布预览</h4>
          <div class="summary-grid">
            <div class="summary-item"><span class="label">作业名称</span><span class="value">{{ publishForm.title }}</span></div>
            <div class="summary-item"><span class="label">运动项目</span><span class="value">{{ publishForm.project }}</span></div>
            <div class="summary-item"><span class="label">发布对象</span><span class="value">{{ publishForm.grade }}{{ publishForm.className }}</span></div>
            <div class="summary-item"><span class="label">截止日期</span><span class="value">{{ publishForm.dueDate }}</span></div>
            <div class="summary-item"><span class="label">发布人数</span><span class="value">{{ studentAssignments.length }} 人</span></div>
            <div class="summary-item"><span class="label">强度分布</span><span class="value">{{ intensitySummary }}</span></div>
          </div>
          <el-alert title="将为每位学生推送定制化体育作业，标准与强度已根据运动能力个性化配置" type="success" :closable="false" show-icon />
        </div>
      </div>

      <template #footer>
        <el-button @click="showPublishDialog = false">取消</el-button>
        <el-button v-if="publishStep > 0" @click="publishStep--">上一步</el-button>
        <el-button v-if="publishStep < 2" type="primary" @click="nextPublishStep">下一步</el-button>
        <el-button v-if="publishStep === 2" type="primary" @click="confirmPublish">确认发布</el-button>
      </template>
    </el-dialog>

    <!-- 作业详情 -->
    <el-dialog v-model="detailVisible" :title="`作业详情 - ${currentHomework?.title || ''}`" width="560px">
      <div v-if="currentHomework" class="detail-panel">
        <div class="detail-row"><span class="label">作业名称</span><span>{{ currentHomework.title }}</span></div>
        <div class="detail-row"><span class="label">适用年级</span><span>{{ currentHomework.grade }}</span></div>
        <div class="detail-row"><span class="label">截止日期</span><span>{{ currentHomework.dueDate }}</span></div>
        <div class="detail-row"><span class="label">完成进度</span><span>{{ currentHomework.completed }}/{{ currentHomework.total }} ({{ currentHomework.progress }}%)</span></div>
        <div class="detail-row"><span class="label">状态</span><span>{{ getStatusText(currentHomework.status) }}</span></div>
        <div class="detail-desc"><span class="label">作业说明</span><p>{{ currentHomework.description }}</p></div>
        <div v-if="currentHomework.tasks?.length" class="detail-tasks">
          <span class="label">任务示例</span>
          <ul><li v-for="(t, i) in currentHomework.tasks" :key="i">{{ t }}</li></ul>
        </div>
      </div>
      <template #footer>
        <el-button type="primary" @click="detailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 学生选择弹窗 -->
    <el-dialog v-model="showStudentSelector" title="选择学生" width="700px">
      <div class="student-selector">
        <el-table :data="availableStudents" stripe size="small" @selection-change="selectedStudentIds = $event" :row-class-name="({ row }) => row.isAssigned ? 'assigned-row' : ''">
          <el-table-column type="selection" width="50">
            <template #default="{ row }">
              <el-checkbox :disabled="row.isAssigned" :checked="selectedStudentIds.includes(row.id)" @change="handleStudentSelect(row, $event)" />
            </template>
          </el-table-column>
          <el-table-column prop="name" label="姓名" width="80" />
          <el-table-column prop="id" label="学号" width="100" />
          <el-table-column prop="grade" label="年级" width="80" />
          <el-table-column prop="class" label="班级" width="80" />
          <el-table-column prop="sportsInterest" label="体育兴趣" min-width="100" />
          <el-table-column label="状态" width="80">
            <template #default="{ row }">
              <el-tag size="small" type="info" v-if="row.isAssigned">已添加</el-tag>
              <el-tag size="small" type="success" v-else>可选</el-tag>
            </template>
          </el-table-column>
        </el-table>
        <div class="selector-footer">
          <span>已选择 {{ selectedStudentIds.length }} 名学生</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showStudentSelector = false">取消</el-button>
        <el-button type="primary" @click="addSelectedStudents">确认添加</el-button>
      </template>
    </el-dialog>

    <!-- 作业统计 -->
    <el-dialog v-model="statsVisible" :title="`完成统计 - ${currentHomework?.title || ''}`" width="640px">
      <div v-if="currentHomework" class="stats-panel">
        <div class="stats-summary">
          <div class="summary-card"><span class="num">{{ currentHomework.progress }}%</span><span class="lbl">完成率</span></div>
          <div class="summary-card"><span class="num">{{ currentHomework.completed }}</span><span class="lbl">已完成</span></div>
          <div class="summary-card"><span class="num">{{ currentHomework.total - currentHomework.completed }}</span><span class="lbl">未完成</span></div>
        </div>
        <el-table :data="mockCompletionList" stripe size="small">
          <el-table-column prop="name" label="学生姓名" />
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="row.status === '已完成' ? 'success' : 'warning'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="submitTime" label="提交时间" />
        </el-table>
      </div>
      <template #footer>
        <el-button @click="statsVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus, Download, Search, Refresh, Document, Calendar, User, Grid, Histogram, Aim, TrendCharts, Football, Bicycle, Basketball } from '@element-plus/icons-vue'
import store from '../../../store/global'
import { getSchoolMockData } from '../../../utils/mockDataLoader'
import { isInterestClass, getMatchingStudents } from '@/utils/interestClassFilter'
import { usePersistedRef } from '@/composables/usePersistedRef'
import { getRealStudents, normalizeStudents } from '@/utils/realDataLoader'

// 日期格式化
const fmtDate = (d) => {
  if (!d) return ''
  const date = typeof d === 'string' ? new Date(d) : d
  return `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}`
}

const searchQuery = ref('')
const filterGrade = ref('all')
const filterStatus = ref('')
const showPublishDialog = ref(false)
const detailVisible = ref(false)
const statsVisible = ref(false)
const currentHomework = ref(null)
const publishStep = ref(0)

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

// 获取学校数据
const schoolData = computed(() => {
  return getSchoolMockData(schoolId.value)
})

// 优先使用真实学生数据（从学生管理页面导入的），回退到 mock 数据
const students = computed(() => {
  const realStudents = getRealStudents(schoolId.value)
  if (realStudents.length > 0) {
    return normalizeStudents(realStudents)
  }
  return schoolData.value?.students || []
})

const gradeOptions = computed(() => [...new Set(students.value.map(s => s.grade))].sort())
const classOptions = computed(() => {
  if (!publishForm.value.grade) return []
  const adminClasses = [...new Set(students.value.filter(s => s.grade === publishForm.value.grade).map(s => s.class))].sort()
  // 追加分项班/兴趣班
  const interestClasses = (schoolData.value?.classes || []).filter(c => c.type === '分项班').map(c => c.name)
  interestClasses.forEach(name => {
    if (!adminClasses.includes(name)) adminClasses.push(name)
  })
  return adminClasses
})

const publishForm = ref({
  title: '',
  project: '',
  grade: '',
  className: '',
  dueDate: '',
  description: ''
})

const studentAssignments = ref([])
const showStudentSelector = ref(false)
const selectedStudentIds = ref([])

const availableStudents = computed(() => {
  const grade = publishForm.value.grade
  const className = publishForm.value.className
  let filtered = students.value
  
  if (grade) {
    filtered = filtered.filter(s => s.grade === grade)
  }
  if (className) {
    if (isInterestClass(className)) {
      const matching = getMatchingStudents(className, students.value)
      const matchingIds = new Set(matching.map(s => s.id))
      filtered = filtered.filter(s => matchingIds.has(s.id))
    } else {
      filtered = filtered.filter(s => s.class === className)
    }
  }
  
  const assignedIds = new Set(studentAssignments.value.map(s => s.id))
  return filtered.map(s => ({
    ...s,
    isAssigned: assignedIds.has(s.id)
  }))
})

const selectAllClass = () => {
  const project = publishForm.value.project || '综合体能'
  const grade = publishForm.value.grade
  
  let matched = students.value.filter(s => s.grade === grade)
  if (publishForm.value.className) {
    if (isInterestClass(publishForm.value.className)) {
      const matching = getMatchingStudents(publishForm.value.className, students.value)
      const matchingIds = new Set(matching.map(s => s.id))
      matched = matched.filter(s => matchingIds.has(s.id))
    } else {
      matched = matched.filter(s => s.class === publishForm.value.className)
    }
  }
  
  const existingIds = new Set(studentAssignments.value.map(s => s.id))
  let count = 0
  
  matched.forEach(s => {
    if (!existingIds.has(s.id)) {
      const ability = getStudentAbility(s)
      studentAssignments.value.push({
        id: s.id,
        name: s.name,
        sportsInterest: s.sportsInterest,
        abilityLevel: ability,
        minStandard: abilityStandards[project]?.[ability] || '按能力匹配',
        intensity: getIntensityByAbility(ability),
        customTask: generateCustomTask(s, project, ability)
      })
      count++
    }
  })
  
  if (count > 0) {
    ElMessage.success(`已添加 ${count} 名学生`)
  } else {
    ElMessage.info('该班级学生已全部添加')
  }
}

const clearAllStudents = () => {
  ElMessageBox.confirm('确定要清空所有已选学生吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    studentAssignments.value = []
    ElMessage.success('已清空所有学生')
  }).catch(() => {})
}

const removeStudent = (index) => {
  studentAssignments.value.splice(index, 1)
}

const handleStudentSelect = (row, event) => {
  if (row.isAssigned) return
  
  const idx = selectedStudentIds.value.indexOf(row.id)
  if (event) {
    if (idx === -1) selectedStudentIds.value.push(row.id)
  } else {
    if (idx > -1) selectedStudentIds.value.splice(idx, 1)
  }
}

const addSelectedStudents = () => {
  if (!selectedStudentIds.value.length) {
    ElMessage.warning('请选择要添加的学生')
    return
  }
  
  const project = publishForm.value.project || '综合体能'
  let count = 0
  selectedStudentIds.value.forEach(studentId => {
    const student = students.value.find(s => String(s.id) === String(studentId))
    if (student) {
      const existing = studentAssignments.value.find(sa => String(sa.id) === String(studentId))
      if (!existing) {
        const ability = getStudentAbility(student)
        studentAssignments.value.push({
          id: student.id,
          name: student.name,
          sportsInterest: student.sportsInterest,
          abilityLevel: ability,
          minStandard: abilityStandards[project]?.[ability] || '按能力匹配',
          intensity: getIntensityByAbility(ability),
          customTask: generateCustomTask(student, project, ability)
        })
        count++
      }
    }
  })
  
  selectedStudentIds.value = []
  showStudentSelector.value = false
  ElMessage.success(`已成功添加 ${count} 名学生`)
}

const abilityStandards = {
  '跳绳': { '优秀': '180个/分钟', '良好': '150个/分钟', '一般': '120个/分钟', '待提升': '80个/分钟' },
  '仰卧起坐': { '优秀': '45个/分钟', '良好': '35个/分钟', '一般': '25个/分钟', '待提升': '15个/分钟' },
  '立定跳远': { '优秀': '2.0米', '良好': '1.8米', '一般': '1.6米', '待提升': '1.4米' },
  '50米跑': { '优秀': '8.5秒', '良好': '9.5秒', '一般': '10.5秒', '待提升': '12秒' },
  '阳光跑': { '优秀': '3公里', '良好': '2公里', '一般': '1.5公里', '待提升': '1公里' },
  '综合体能': { '优秀': '全部达标', '良好': '80%达标', '一般': '60%达标', '待提升': '40%达标' }
}

const intensityMap = { low: '低强度', medium: '中强度', high: '高强度' }

const getStudentAbility = (student) => {
  const hash = student.id.charCodeAt(student.id.length - 1) % 4
  return ['优秀', '良好', '一般', '待提升'][hash]
}

const getIntensityByAbility = (ability) => {
  if (ability === '优秀') return 'high'
  if (ability === '良好') return 'medium'
  return 'low'
}

const loadClassStudents = () => {
  if (!publishForm.value.grade) return
  
  let matched = students.value.filter(s => s.grade === publishForm.value.grade)
  
  if (publishForm.value.className) {
    matched = matched.filter(s => s.class === publishForm.value.className)
  }
  
  studentAssignments.value = matched.map(s => {
    const ability = getStudentAbility(s)
    const project = publishForm.value.project || '综合体能'
    return {
      id: s.id,
      name: s.name,
      sportsInterest: s.sportsInterest,
      abilityLevel: ability,
      minStandard: abilityStandards[project]?.[ability] || '按能力匹配',
      intensity: getIntensityByAbility(ability),
      customTask: generateCustomTask(s, project, ability)
    }
  })
}

const generateCustomTask = (student, project, ability) => {
  const standards = abilityStandards[project] || abilityStandards['综合体能']
  return `${student.name}：完成${project}，最低标准 ${standards[ability]}`
}

const onProjectChange = () => {
  if (studentAssignments.value.length) autoMatchAll()
}

const autoMatchAll = () => {
  const project = publishForm.value.project || '综合体能'
  studentAssignments.value.forEach(row => {
    row.minStandard = abilityStandards[project]?.[row.abilityLevel] || '按能力匹配'
    row.intensity = getIntensityByAbility(row.abilityLevel)
    row.customTask = generateCustomTask({ name: row.name, id: row.id }, project, row.abilityLevel)
  })
  ElMessage.success('已根据运动能力为全部学生匹配标准与强度')
}

const resetAllToDefault = () => {
  loadClassStudents()
  ElMessage.success('已恢复默认匹配标准')
}

const getStandardPlaceholder = () => {
  return publishForm.value.project ? `如：${abilityStandards[publishForm.value.project]?.['一般'] || ''}` : '请先选择项目'
}

const getAbilityTagType = (level) => {
  const map = { '优秀': 'success', '良好': 'primary', '一般': 'warning', '待提升': 'danger' }
  return map[level] || 'info'
}

const intensitySummary = computed(() => {
  const counts = { low: 0, medium: 0, high: 0 }
  studentAssignments.value.forEach(s => { counts[s.intensity]++ })
  return `低${counts.low} / 中${counts.medium} / 高${counts.high}`
})

const publishHomework = () => {
  publishStep.value = 0
  publishForm.value = { title: '', project: '', grade: '', className: '', dueDate: '', description: '' }
  studentAssignments.value = []
  showPublishDialog.value = true
}

const nextPublishStep = () => {
  if (publishStep.value === 0) {
    if (!publishForm.value.title || !publishForm.value.project || !publishForm.value.grade || !publishForm.value.dueDate) {
      ElMessage.warning('请填写完整的基本信息')
      return
    }
    const dueDate = new Date(publishForm.value.dueDate)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (dueDate < today) {
      ElMessage.warning('截止日期不能早于今天')
      return
    }
    loadClassStudents()
    if (!studentAssignments.value.length) {
      ElMessage.warning('该年级/班级暂无学生数据')
      return
    }
  }
  publishStep.value++
}

const confirmPublish = () => {
  if (!publishForm.value.title) { ElMessage.warning('请输入作业标题'); return }
  if (!publishForm.value.grade) { ElMessage.warning('请选择年级'); return }
  if (!publishForm.value.project) { ElMessage.warning('请选择作业项目'); return }
  const target = publishForm.value.className ? `${publishForm.value.grade}${publishForm.value.className}` : `${publishForm.value.grade}全年级`
  const newHomework = {
    title: publishForm.value.title,
    grade: target,
    dueDate: fmtDate(publishForm.value.dueDate),
    participants: studentAssignments.value.length,
    completed: 0,
    total: studentAssignments.value.length,
    progress: 0,
    status: 'ongoing',
    description: publishForm.value.description || `针对${target}的${publishForm.value.project}作业`,
    tasks: studentAssignments.value.slice(0, 4).map(s => s.customTask)
  }
  homeworkList.value.unshift(newHomework)
  showPublishDialog.value = false
  ElMessage.success(`已成功为 ${studentAssignments.value.length} 名学生发布定制化体育作业`)
}

const viewDetail = (homework) => {
  currentHomework.value = homework
  detailVisible.value = true
}

const mockCompletionList = computed(() => {
  if (!currentHomework.value) return []
  const parts = currentHomework.value.grade || ''
  const gradeMatch = parts.match(/^(.+?)(\d+班)$/)
  const grade = gradeMatch ? gradeMatch[1] : ''
  const cls = gradeMatch ? gradeMatch[2] : ''
  const matched = students.value.filter(s => s.grade === grade && s.class === cls)
  return matched.slice(0, 8).map((s, i) => ({
    name: s.name,
    status: i % 3 === 2 ? '未完成' : '已完成',
    submitTime: i % 3 === 2 ? '-' : `${fmtDate(new Date(Date.now() - i * 86400000))} 18:${String(30 + i).padStart(2, '0')}`
  }))
})

const viewStats = (homework) => {
  currentHomework.value = homework
  statsVisible.value = true
}

const refreshData = () => {
  searchQuery.value = ''
  filterGrade.value = 'all'
  filterStatus.value = ''
  ElMessage.success('数据已刷新')
}

const exportData = () => {
  // 导出CSV格式的作业数据
  const headers = ['作业名称', '年级', '截止日期', '参与人数', '已完成', '完成率', '状态']
  const rows = filteredHomework.value.map(homework => [
    homework.title,
    homework.grade,
    homework.dueDate,
    homework.participants,
    homework.completed,
    homework.progress + '%',
    homework.status === 'completed' ? '已完成' : homework.status === 'ongoing' ? '进行中' : '已截止'
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `体育作业记录_${fmtDate(new Date())}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('作业记录已导出')
}

const stats = computed(() => {
  const total = homeworkList.value.length
  const ongoing = homeworkList.value.filter(h => h.status === 'ongoing').length
  const avgRate = total ? Math.round(homeworkList.value.reduce((sum, h) => sum + (h.progress || 0), 0) / total) : 0
  const now = new Date('2026-07-16T08:00:00')
  const weekAgo = new Date(now.getTime() - 7 * 86400000)
  const thisWeek = homeworkList.value.filter(h => {
    if (!h.dueDate) return false
    const d = new Date(h.dueDate)
    return d >= weekAgo && d <= now
  }).length
  return { totalHomework: total, completedRate: avgRate, onGoing: ongoing, thisWeek }
})

const gradeStats = computed(() => {
  const gradeMap = {}
  homeworkList.value.forEach(h => {
    const gradeMatch = (h.grade || '').match(/^(.+?)(\d|$)/)
    const grade = gradeMatch ? gradeMatch[1] : h.grade
    if (!grade) return
    if (!gradeMap[grade]) gradeMap[grade] = { total: 0, sum: 0 }
    gradeMap[grade].total++
    gradeMap[grade].sum += (h.progress || 0)
  })
  return Object.entries(gradeMap).map(([grade, data]) => ({
    grade,
    rate: data.total ? Math.round(data.sum / data.total) : 0
  })).sort((a, b) => a.grade.localeCompare(b.grade, 'zh-CN'))
})

const typeStats = computed(() => {
  const typeMap = {}
  homeworkList.value.forEach(h => {
    const desc = h.description || ''
    const projectMatch = desc.match(/的(.+?)作业/)
    const type = projectMatch ? projectMatch[1] : h.title
    typeMap[type] = (typeMap[type] || 0) + 1
  })
  const iconMap = { '跳绳': Football, '仰卧起坐': TrendCharts, '立定跳远': Aim, '50米跑': Football, '阳光跑': Bicycle, '综合体能': Basketball }
  return Object.entries(typeMap).map(([name, count]) => ({
    icon: iconMap[name] || Document,
    name,
    count
  })).sort((a, b) => b.count - a.count)
})

// ---- 三校差异化默认作业数据 ----
const defaultHomeworkData = computed(() => {
  const sid = schoolId.value
  if (sid === 'hailin-zirong-primary') {
    return [
      { title: '排球垫球练习', grade: '三年级1班', dueDate: fmtDate('2026-01-17'), participants: 22, completed: 16, total: 22, progress: 73, status: 'ongoing', description: '排球基础垫球训练作业', tasks: ['对墙垫球50次', '双人垫球10分钟', '移动垫球练习'] },
      { title: '足球带球训练', grade: '四年级2班', dueDate: fmtDate('2026-01-18'), participants: 18, completed: 12, total: 18, progress: 67, status: 'ongoing', description: '足球带球过人基础练习', tasks: ['直线带球20米往返', '绕桩带球10分钟', '传球配合练习'] },
      { title: '田径短跑训练', grade: '五年级1班', dueDate: fmtDate('2026-01-16'), participants: 25, completed: 25, total: 25, progress: 100, status: 'completed', description: '50米短跑专项训练', tasks: ['起跑练习10次', '30米加速跑5组', '冲刺跑3组'] },
      { title: '跳绳达标训练', grade: '二年级2班', dueDate: fmtDate('2026-01-17'), participants: 20, completed: 14, total: 20, progress: 70, status: 'ongoing', description: '跳绳达标提升训练', tasks: ['连续跳绳5分钟', '计时1分钟跳绳3组', '花样跳绳尝试'] }
    ]
  }
  if (sid === 'linhai-experimental-primary') {
    return [
      { title: '游泳体能训练', grade: '四年级1班', dueDate: fmtDate('2026-01-17'), participants: 28, completed: 22, total: 28, progress: 79, status: 'ongoing', description: '游泳陆上体能辅助训练', tasks: ['蛙泳蹬腿模拟30次', '自由泳划臂练习20分钟', '水中呼吸练习'] },
      { title: '体操基本功', grade: '五年级2班', dueDate: fmtDate('2026-01-18'), participants: 24, completed: 18, total: 24, progress: 75, status: 'ongoing', description: '体操翻滚与平衡练习', tasks: ['前滚翻10次', '侧手翻练习', '平衡木行走5分钟'] },
      { title: '武术套路练习', grade: '六年级1班', dueDate: fmtDate('2026-01-16'), participants: 30, completed: 30, total: 30, progress: 100, status: 'completed', description: '初级长拳套路复习', tasks: ['初级长拳完整套路3遍', '基本功压腿10分钟', '马步站桩5分钟'] },
      { title: '柔韧性与舞蹈', grade: '三年级2班', dueDate: fmtDate('2026-01-17'), participants: 26, completed: 20, total: 26, progress: 77, status: 'ongoing', description: '柔韧性与舞蹈基础训练', tasks: ['压腿拉伸10分钟', '基本舞步练习', '形体训练15分钟'] }
    ]
  }
  return [
    { title: '周末体能训练', grade: '四年级1班', dueDate: fmtDate('2026-01-17'), participants: 35, completed: 28, total: 35, progress: 80, status: 'ongoing', description: '本周末体能训练作业，请家长督促孩子完成。', tasks: ['完成30分钟阳光跑', '跳绳10分钟，记录次数', '仰卧起坐3组，每组20个', '柔韧性拉伸10分钟'] },
    { title: '篮球基础练习', grade: '五年级2班', dueDate: fmtDate('2026-01-18'), participants: 32, completed: 24, total: 32, progress: 75, status: 'ongoing', description: '篮球兴趣班本周作业', tasks: ['运球练习10分钟', '定点投篮20次', '传球练习5分钟'] },
    { title: '冬季长跑训练', grade: '六年级3班', dueDate: fmtDate('2026-01-16'), participants: 40, completed: 40, total: 40, progress: 100, status: 'completed', description: '冬季长跑专项训练', tasks: ['每天晨跑20分钟', '记录跑步里程', '完成周跑量目标'] },
    { title: '柔韧性训练', grade: '三年级4班', dueDate: fmtDate('2026-01-17'), participants: 38, completed: 30, total: 38, progress: 79, status: 'ongoing', description: '提升身体柔韧性训练', tasks: ['压腿练习5分钟', '坐位体前屈练习', '瑜伽基础动作10分钟'] }
  ]
})

// 作业列表 — 持久化（修复多校隔离和双重持久化冲突）
const homeworkKey = computed(() => `smart_pe_homework_list_${schoolId.value}`)
const homeworkList = ref([])

watch(homeworkKey, (newKey) => {
  const stored = sessionStorage.getItem(newKey)
  if (stored) {
    homeworkList.value = JSON.parse(stored)
  } else {
    homeworkList.value = [...defaultHomeworkData.value]
    sessionStorage.setItem(newKey, JSON.stringify(homeworkList.value))
  }
}, { immediate: true })

watch(homeworkList, (newVal) => {
  sessionStorage.setItem(homeworkKey.value, JSON.stringify(newVal))
}, { deep: true })

const filteredHomework = computed(() => {
  return homeworkList.value.filter(homework => {
    const matchSearch = !searchQuery.value || homework.title.includes(searchQuery.value)
    const matchGrade = !filterGrade.value || filterGrade.value === 'all' || (homework.grade || '').startsWith(filterGrade.value)
    const matchStatus = !filterStatus.value || homework.status === filterStatus.value
    return matchSearch && matchGrade && matchStatus
  })
})

const getStatusText = (status) => {
  if (status === 'ongoing') return '进行中'
  if (status === 'completed') return '已完成'
  if (status === 'ended') return '已截止'
  return '未知状态'
}

const getGradeColor = (rate) => {
  if (rate >= 80) return '#1E5AA8'
  if (rate >= 60) return '#F5A623'
  return '#E85D4E'
}

// 年级变化时重置班级选择
watch(() => publishForm.value.grade, () => {
  publishForm.value.className = ''
  studentAssignments.value = []
})
</script>

<style scoped>
.homework-publish-page {
  padding: 24px;
  background: #F7F8FA;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.header-title h2 {
  margin: 0;
  font-size: 24px;
  color: #1A1A2E;
}

.header-title p {
  margin: 4px 0 0;
  font-size: 14px;
  color: #6B7280;
}

.header-filters {
  display: flex;
  gap: 12px;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.stat-value {
  font-size: 36px;
  font-weight: 700;
  color: #1E5AA8;
}

.stat-label {
  font-size: 14px;
  color: #6B7280;
  margin-top: 4px;
}

.filter-section {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  margin-bottom: 24px;
}

.content-row {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.homework-list {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  padding: 20px;
}

.total-count {
  font-size: 13px;
  color: #9CA3AF;
}

.homework-cards {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.homework-card {
  padding: 24px;
  background: #FFFFFF;
  border-radius: 12px;
  border: 1px solid #E8EAED;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  position: relative;
}

.homework-status {
  position: absolute;
  top: 20px;
  right: 20px;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 12px;
}

.homework-status.ongoing { background: #DCFCE7; color: #166534; }
.homework-status.completed { background: #1E5AA8; color: #fff; }
.homework-status.ended { background: #E8EAED; color: #6B7280; }

.homework-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.homework-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 12px;
}

.homework-desc {
  font-size: 14px;
  color: #6B7280;
  margin-bottom: 12px;
}

.homework-tasks {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.task-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
  color: #1A1A2E;
}

.task-num {
  color: #1E5AA8;
  font-weight: 600;
}

.homework-progress {
  margin-bottom: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 8px;
}

.homework-actions {
  display: flex;
  gap: 8px;
}

.side-panel {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.completion-chart {
  margin-top: 16px;
}

.chart-bar {
  display: flex;
  height: 24px;
  border-radius: 12px;
  overflow: hidden;
}

.bar-segment.completed { background: #1E5AA8; }
.bar-segment.pending { background: #E8EAED; }

.chart-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 8px;
  font-size: 13px;
  color: #6B7280;
}

.grade-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.grade-item {
  display: flex;
  align-items: center;
}

.grade-name {
  width: 60px;
  font-size: 13px;
  color: #6B7280;
}

.grade-rate {
  width: 45px;
  text-align: right;
  font-size: 13px;
  font-weight: 600;
  color: #1E5AA8;
}

.type-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 16px;
}

.type-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.type-icon {
  font-size: 20px;
}

.type-name {
  flex: 1;
  font-size: 14px;
  color: #1A1A2E;
}

.type-count {
  font-size: 16px;
  font-weight: 600;
  color: #1E5AA8;
}

.publish-step {
  min-height: 320px;
}

.custom-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.toolbar-info {
  font-size: 13px;
  color: #6B7280;
}

.toolbar-actions {
  display: flex;
  gap: 8px;
}

.confirm-summary h4 {
  margin: 0 0 16px;
  font-size: 16px;
  color: #1A1A2E;
}

.summary-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 16px;
}

.summary-item {
  display: flex;
  gap: 8px;
  font-size: 14px;
}

.summary-item .label {
  color: #6B7280;
  min-width: 70px;
}

.summary-item .value {
  color: #1A1A2E;
  font-weight: 500;
}

/* 统计弹窗样式 */
.stats-panel {
  padding: 16px 0;
}

.stats-summary {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
}

.summary-card {
  flex: 1;
  background: #F7F8FA;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.summary-card .num {
  font-size: 28px;
  font-weight: 700;
  color: #1E5AA8;
}

.summary-card .lbl {
  font-size: 13px;
  color: #6B7280;
}
</style>
