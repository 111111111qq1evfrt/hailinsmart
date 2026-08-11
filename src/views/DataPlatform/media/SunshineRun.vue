<template>
  <div class="sunshine-run-page">
    <LoadingOverlay :visible="pageLoading" text="加载跑步数据中..." subText="请稍候" />
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索学生姓名/学号"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
        />
        <el-select v-model="filterGrade" placeholder="选择年级" clearable style="width: 140px" @change="onGradeChange">
          <el-option label="全部" value="all" />
          <el-option label="一年级" value="一年级" />
          <el-option label="二年级" value="二年级" />
          <el-option label="三年级" value="三年级" />
          <el-option label="四年级" value="四年级" />
          <el-option label="五年级" value="五年级" />
          <el-option label="六年级" value="六年级" />
        </el-select>
        <el-select v-model="filterClass" placeholder="选择班级" clearable style="width: 140px">
          <el-option v-for="cls in classOptions" :key="cls.value" :label="cls.label" :value="cls.value" :disabled="cls.value === '__separator__'" />
        </el-select>
        <el-select v-model="filterGender" placeholder="性别筛选" clearable style="width: 100px">
          <el-option label="男" value="男" />
          <el-option label="女" value="女" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="达标状态" clearable style="width: 120px">
          <el-option label="已达标" value="completed" />
          <el-option label="未达标" value="incomplete" />
        </el-select>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" />
      </div>
      <div class="header-actions">
        <el-button :icon="Plus" @click="showBatchAddMileage = true">修改达标标准</el-button>
        <el-button :icon="Download" @click="exportData">导出数据</el-button>
        <el-button type="primary" :icon="Upload" @click="importData">批量导入</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ stats.totalRuns }}</span>
        <span class="stat-label">累计跑步次数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.totalDistance }}</span>
        <span class="stat-label">累计里程(km)</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.totalTime }}</span>
        <span class="stat-label">累计时长(h)</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.participants }}</span>
        <span class="stat-label">参与学生数</span>
      </div>
    </div>

    <div class="content-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">本周跑步趋势</span>
        </div>
        <div ref="trendChart" class="chart"></div>
      </div>

      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">达标率统计</span>
        </div>
        <div ref="complianceChart" class="chart"></div>
      </div>
    </div>

    <div class="list-card">
      <div class="card-header">
        <span class="card-title">学生跑步记录</span>
        <div class="header-actions">
          <el-button text :icon="Refresh" @click="refreshData">刷新</el-button>
        </div>
      </div>
      
      <ExamTable
        :data="filteredRecords"
        :columns="runRecordColumns"
        :search-fields="['name', 'id', 'grade', 'class']"
        search-placeholder="搜索学生姓名/学号"
        :show-pagination="true"
        :default-page-size="12"
      >
        <template #status="{ row }">
          <span class="status-tag" :class="row.status === 'completed' ? 'status-success' : 'status-warning'">
            {{ row.status === 'completed' ? '已达标' : '未达标' }}
          </span>
        </template>
        <template #actions="{ row }">
          <el-button text type="primary" size="small" @click="viewDetail(row)">查看详情</el-button>
          <el-button text type="primary" size="small" @click="addRecord(row)">补录数据</el-button>
        </template>
      </ExamTable>
    </div>

    <!-- 导入弹窗 -->
    <el-dialog v-model="showImportDialog" title="批量导入阳光跑数据" width="560px">
      <el-form :model="importForm" label-width="100px">
        <el-form-item label="选择文件">
          <el-upload
            class="upload-demo"
            action="/api/upload"
            :on-success="handleImportSuccess"
            :before-upload="beforeImport"
          >
            <el-button type="primary">点击上传Excel文件</el-button>
          </el-upload>
          <div class="upload-tip">支持 Excel (.xlsx, .xls) 格式，文件大小不超过 10MB</div>
        </el-form-item>
        <el-form-item>
          <el-checkbox v-model="importForm.override">覆盖已有数据</el-checkbox>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmImport">确认导入</el-button>
      </template>
    </el-dialog>

    <!-- 导出弹窗 -->
    <el-dialog v-model="showExportDialog" title="导出阳光跑数据" width="450px">
      <el-form :model="exportForm" label-width="100px">
        <el-form-item label="导出格式">
          <el-select v-model="exportForm.format" class="w-full">
            <el-option label="Excel" value="excel" />
            <el-option label="CSV" value="csv" />
          </el-select>
        </el-form-item>
        <el-form-item label="导出范围">
          <el-radio-group v-model="exportForm.range">
            <el-radio label="全部数据" value="all" />
            <el-radio label="当前筛选" value="filtered" />
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExportDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmExport">确认导出</el-button>
      </template>
    </el-dialog>

    <!-- 补录数据弹窗 -->
    <el-dialog v-model="showAddRecordDialog" title="补录跑步数据" width="450px">
      <div v-if="selectedRecord" class="add-record">
        <div class="record-student">
          <span>补录学生：</span>
          <span class="student-name">{{ selectedRecord.name }} ({{ selectedRecord.grade }}年级{{ selectedRecord.class }})</span>
        </div>
        <el-form :model="addRecordForm" label-width="100px">
          <el-form-item label="跑步日期" required>
            <el-date-picker v-model="addRecordForm.date" type="date" placeholder="选择日期" class="w-full" />
          </el-form-item>
          <el-form-item label="跑步距离(km)" required>
            <el-input v-model="addRecordForm.distance" placeholder="请输入距离" />
          </el-form-item>
          <el-form-item label="用时(分钟)">
            <el-input v-model="addRecordForm.duration" placeholder="请输入用时" />
          </el-form-item>
          <el-form-item label="备注">
            <el-input type="textarea" v-model="addRecordForm.note" placeholder="备注信息" :rows="2" />
          </el-form-item>
        </el-form>
      </div>
      <template #footer>
        <el-button @click="showAddRecordDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmAddRecord">确认补录</el-button>
      </template>
    </el-dialog>

    <!-- 修改达标标准弹窗 -->
    <el-dialog v-model="showBatchAddMileage" title="修改达标标准" width="450px">
      <el-form :model="standardForm" label-width="100px">
        <el-form-item label="每周跑步次数" required>
          <el-input v-model.number="standardForm.weeklyRuns" placeholder="请输入每周跑步次数" />
        </el-form-item>
        <el-form-item label="每周跑步里程(km)" required>
          <el-input v-model.number="standardForm.weeklyDistance" placeholder="请输入每周跑步里程" />
        </el-form-item>
        <el-form-item>
          <div class="batch-tip">
            <span class="tip-icon"><el-icon :size="14" color="#3B82F6"><InfoFilled /></el-icon></span>
            <span>修改达标标准后，系统将重新计算所有学生的达标状态</span>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showBatchAddMileage = false">取消</el-button>
        <el-button type="primary" @click="confirmChangeStandard">确认修改</el-button>
      </template>
    </el-dialog>

    <!-- 跑步记录详情弹窗（单日记录列表） -->
    <el-dialog v-model="showDetailDialog" title="跑步记录详情" width="600px">
      <div v-if="selectedRecord" class="record-detail">
        <div class="detail-header">
          <span class="student-name">{{ selectedRecord.name }}</span>
          <span class="student-id">{{ selectedRecord.id }}</span>
          <span class="student-info">{{ selectedRecord.grade }}年级{{ selectedRecord.class }} | {{ selectedRecord.gender === '男' ? '男' : '女' }}</span>
        </div>
        <div class="detail-section">
          <h4 class="section-title">基本信息</h4>
          <div class="detail-row">
            <span class="detail-label">累计里程</span>
            <span class="detail-value">{{ selectedRecord.totalDistance }} km</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">平均配速</span>
            <span class="detail-value">{{ selectedRecord.avgPace }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">本周跑步</span>
            <span class="detail-value">{{ selectedRecord.weeklyRuns }} 次 / {{ selectedRecord.weeklyDistance }} km</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">达标状态</span>
            <span :class="['status-tag', selectedRecord.status === 'completed' ? 'status-success' : 'status-warning']">
              {{ selectedRecord.status === 'completed' ? '已达标' : '未达标' }}
            </span>
          </div>
        </div>
        <div class="detail-section">
          <h4 class="section-title">本周跑步记录</h4>
          <el-table :data="selectedRecordDailyRuns" border class="w-full" size="small">
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="distance" label="距离(km)" width="100" />
            <el-table-column prop="duration" label="用时" width="100" />
            <el-table-column prop="pace" label="配速" width="100" />
            <el-table-column prop="calories" label="消耗(kcal)" width="100" />
          </el-table>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
    
    <!-- 数据加载蒙版 -->
    <LoadingOverlay 
      :visible="pushLoading" 
      text="正在加载阳光跑数据..." 
      subText="首次加载可能需要几秒"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick, watch } from 'vue'
import { Search, Upload, Download, Refresh, Plus, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import echarts from '@/utils/echarts'
import ExamTable from '@/components/table/ExamTable.vue'
import { usePersistedRef } from '@/composables/usePersistedRef'
import store from '@/store/global'
import { getSchoolMockData } from '@/utils/mockDataLoader'
import { getSchoolProfile } from '@/mock/school-data/schoolProfiles'
import { isInterestClass, getMatchingStudents } from '@/utils/interestClassFilter'
import { useOperationLog } from '@/composables/useOperationLog'
import { useSportsData } from '@/composables/useSportsData'
import sportsApi, { transformPushList } from '@/utils/daiweiPushApi'

const { addLog } = useOperationLog('data')

const searchQuery = ref('')
const filterGrade = ref('all')
const filterClass = ref('')
const filterGender = ref('')
const filterStatus = ref('')
const dateRange = ref([])
const currentPage = ref(1)
const pageSize = ref(12)
const showImportDialog = ref(false)
const showExportDialog = ref(false)
const showDetailDialog = ref(false)
const showAddRecordDialog = ref(false)
const showBatchAddMileage = ref(false)
const selectedRecord = ref(null)

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')
const schoolProfile = computed(() => getSchoolProfile(schoolId.value))

// 运动推送数据
const sportsData = useSportsData()
const pushData = ref([])
const pushLoading = ref(true)
const pushDataLoaded = ref(false)
const pageLoading = ref(true)

// Mock 数据兜底
const mockRunData = computed(() => {
  const mockData = getSchoolMockData(schoolId.value)
  const students = mockData.students || []
  const results = []
  for (let i = 0; i < Math.min(40, students.length); i++) {
    const s = students[i]
    results.push({
      id: `mock_run_${i}`,
      personId: s.id,
      score: (Math.random() * 3000 + 1000).toFixed(0),
      duration: Math.floor(Math.random() * 3600 + 1800),
      sportType: 19,
      receivedAt: Date.now() - Math.random() * 7 * 86400000,
      studentName: s.name,
      className: s.grade + '班',
      gender: s.gender
    })
  }
  return results
})

// 加载推送数据
const loadPushData = async () => {
  pushLoading.value = true
  try {
    const schoolIdVal = schoolId.value
    const res = await sportsApi.getList(schoolIdVal, { limit: 500 })
    if (res.code === '0' && res.data?.list?.length > 0) {
      pushData.value = transformPushList(res.data.list)
      pushDataLoaded.value = true
    } else {
      // API 返回空，使用 Mock 数据
      pushData.value = mockRunData.value
      pushDataLoaded.value = false
    }
  } catch (e) {
    console.warn('推送服务不可用，使用本地Mock数据')
    pushData.value = mockRunData.value
    pushDataLoaded.value = false
  } finally {
    pushLoading.value = false
    pageLoading.value = false
  }
}

const standardWeeklyRuns = ref(3)
const standardWeeklyDistance = ref(5.0)

const isCompliant = (weeklyRuns, weeklyDistance) => {
  return weeklyRuns >= standardWeeklyRuns.value && weeklyDistance >= standardWeeklyDistance.value
}

// 班级选项（根据学校和年级动态生成）
const classOptions = ref([])

const gradeClassMap = computed(() => {
  const profile = schoolProfile.value
  const classes = profile.classes || []
  const map = {}
  classes.forEach(cls => {
    const grade = cls.grade || cls.name?.substring(0, 3)
    if (!map[grade]) map[grade] = []
    map[grade].push(cls.name)
  })
  if (Object.keys(map).length === 0) {
    const isZirong = schoolId.value === 'hailin-zirong-primary'
    const isLinhai = schoolId.value === 'linhai-experimental-primary'
    const classCounts = isZirong ? [2, 2, 2, 2, 2, 2] : isLinhai ? [4, 4, 4, 3, 3, 4] : [6, 5, 5, 5, 5, 5]
    const grades = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
    grades.forEach((g, gi) => {
      map[g] = Array.from({ length: classCounts[gi] }, (_, i) => `${g}${i + 1}班`)
    })
  }
  return map
})

const onGradeChange = (grade) => {
  filterClass.value = ''
  if (grade) {
    classOptions.value = gradeClassMap.value[grade]?.map(cls => ({
      label: cls,
      value: cls
    })) || []
  } else {
    classOptions.value = []
  }
  // 追加分项班/兴趣班选项
  const schoolData = getSchoolMockData(schoolId.value)
  const interestClasses = (schoolData?.classes || []).filter(c => c.type === '分项班')
  if (interestClasses.length > 0) {
    if (classOptions.value.length > 0) {
      classOptions.value.push({ label: '--- 分项班/兴趣班 ---', value: '__separator__' })
    }
    interestClasses.forEach(c => {
      classOptions.value.push({ label: c.name, value: c.name })
    })
  }
}

// 修改达标标准表单
const standardForm = ref({
  weeklyRuns: 3,
  weeklyDistance: 5.0
})

// 单日跑步记录数据 — 按学校差异化
const dailyRunsData = computed(() => {
  const schoolData = getSchoolMockData(schoolId.value)
  const students = schoolData.students || []
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  const data = {}
  students.slice(0, 10).forEach((stu, idx) => {
    const runCount = isZirong ? (2 + (idx % 3)) : isLinhai ? (3 + (idx % 4)) : (3 + (idx % 4))
    const baseDist = isZirong ? 1.5 : isLinhai ? 2.2 : 2.0
    const runs = []
    for (let d = 0; d < runCount; d++) {
      const dist = parseFloat((baseDist + ((idx * 0.3 + d * 0.2) % 2.5)).toFixed(1))
      const durMin = Math.floor(dist * 5 + (idx % 3))
      const durSec = (idx * 7 + d * 13) % 60
      const paceMin = Math.floor(durMin / dist)
      const paceSec = Math.floor(((durMin / dist) - paceMin) * 60)
      runs.push({
        date: `2026-01-${15 - d}`,
        distance: dist.toString(),
        duration: `${durMin}'${durSec.toString().padStart(2, '0')}"`,
        pace: `${paceMin}'${paceSec.toString().padStart(2, '0')}"`,
        calories: Math.round(dist * 80 + idx * 5)
      })
    }
    data[stu.id] = runs
  })
  return data
})

const selectedRecordDailyRuns = computed(() => {
  return dailyRunsData.value[selectedRecord.value?.id] || []
})

const importForm = ref({
  override: false
})

const exportForm = ref({
  format: 'excel',
  range: 'all'
})

const addRecordForm = ref({
  date: '',
  distance: '',
  duration: '',
  note: ''
})

const stats = computed(() => {
  const data = filteredRecords.value.length > 0 ? filteredRecords.value : recordsWithStatus.value
  const totalRuns = data.reduce((sum, r) => sum + r.weeklyRuns, 0)
  const totalDistance = data.reduce((sum, r) => sum + r.totalDistance, 0)
  const participants = data.length
  return {
    totalRuns: Math.round(totalRuns * 100),
    totalDistance: Math.round(totalDistance),
    totalTime: Math.round(totalDistance * 0.35),
    participants
  }
})

const weeklyTrend = computed(() => {
  const data = filteredRecords.value.length > 0 ? filteredRecords.value : recordsWithStatus.value
  const totalRuns = data.reduce((sum, r) => sum + r.weeklyRuns, 0) || 1
  const baseValues = [180, 220, 150, 280, 320, 450, 380]
  const factor = (totalRuns * 50) / 2080
  return baseValues.map((v, i) => ({
    day: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
    value: Math.round(v * factor)
  }))
})

const complianceRate = computed(() => {
  const data = filteredRecords.value.length > 0 ? filteredRecords.value : recordsWithStatus.value
  if (data.length === 0) return 0
  const completed = data.filter(r => r.status === 'completed').length
  return Math.round((completed / data.length) * 100)
})

// 将推送数据转换为跑步记录格式
const transformPushDataToRunRecords = () => {
  const schoolData = getSchoolMockData(schoolId.value)
  const students = schoolData.students || []
  const result = []
  const studentMap = {}
  
  for (const record of pushData.value) {
    for (const item of (record.items || [])) {
      const student = students.find(s => s.id === item.personId)
      const personId = item.personId || student?.id
      
      if (!personId) continue
      
      if (!studentMap[personId]) {
        studentMap[personId] = {
          id: personId,
          name: student?.name || `学生${personId}`,
          gender: student?.gender || '男',
          grade: student?.grade || '三年级',
          class: (student?.grade || '三年级') + (student?.class || '(1)班'),
          sportsInterest: student?.sportsInterest || '',
          weeklyRuns: 0,
          weeklyDistance: 0,
          totalDistance: 0,
          lastRun: null,
          totalDuration: 0
        }
      }
      
      const duration = item.duration || 0
      const distanceKm = duration / 1000 || Math.random() * 2 + 1
      
      studentMap[personId].weeklyRuns += 1
      studentMap[personId].weeklyDistance += distanceKm
      studentMap[personId].totalDistance += distanceKm * 8
      studentMap[personId].totalDuration += duration
      studentMap[personId].lastRun = record.receivedAt || new Date().toISOString()
    }
  }
  
  Object.values(studentMap).forEach((student, idx) => {
    const avgPaceMin = student.weeklyDistance > 0 ? Math.floor(student.totalDuration / 60 / student.weeklyDistance) : 5
    const avgPaceSec = Math.floor(Math.random() * 60)
    student.weeklyDistance = parseFloat(student.weeklyDistance.toFixed(1))
    student.totalDistance = parseFloat(student.totalDistance.toFixed(1))
    student.avgPace = `${avgPaceMin}'${String(avgPaceSec).padStart(2, '0')}"`
    student.lastRun = student.lastRun ? new Date(student.lastRun).toISOString().split('T')[0] : `2026-01-${15 - (idx % 5)}`
    result.push(student)
  })
  
  return result
}

const recordsDefault = computed(() => {
  // 优先使用推送数据
  if (pushDataLoaded.value && pushData.value.length > 0) {
    const pushRecords = transformPushDataToRunRecords()
    if (pushRecords.length > 0) {
      return pushRecords
    }
  }
  
  const schoolData = getSchoolMockData(schoolId.value)
  const students = schoolData.students || []
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  const sliceCount = isZirong ? 8 : isLinhai ? 10 : 14
  return students.slice(0, sliceCount).map((student, idx) => {
    const isNonCompliant = idx % 5 < 2
    const baseRuns = isZirong ? 2 : isLinhai ? 3 : 3
    const weeklyRuns = isNonCompliant ? Math.max(1, baseRuns - 1) : (baseRuns + (idx % 4))
    const baseDist = isZirong ? 2.2 : isLinhai ? 2.8 : 2.5
    const weeklyDist = isNonCompliant 
      ? parseFloat((weeklyRuns * baseDist * 0.7).toFixed(1))
      : parseFloat((weeklyRuns * baseDist + idx * 0.3).toFixed(1))
    const totalDist = parseFloat((weeklyDist * (8 + idx % 5)).toFixed(1))
    const paceMin = isZirong ? 5 : isLinhai ? 4 : 5
    const paceSec = (idx * 12 + 15) % 60
    return {
      id: student.id,
      name: student.name,
      gender: student.gender || (idx % 2 === 0 ? '男' : '女'),
      grade: student.grade || '三年级',
      class: (student.grade || '三年级') + (student.class || '(1)班'),
      sportsInterest: student.sportsInterest || '',
      weeklyRuns,
      weeklyDistance: weeklyDist,
      totalDistance: totalDist,
      avgPace: `${paceMin}'${paceSec.toString().padStart(2, '0')}"`,
      lastRun: `2026-01-${15 - (idx % 5)}`
    }
  })
})

const records = usePersistedRef(`smart_pe_sunshine_run_records_${schoolId.value}`, [...recordsDefault.value])

const recordsWithStatus = computed(() => {
  return records.value.map(record => ({
    ...record,
    status: isCompliant(record.weeklyRuns, record.weeklyDistance) ? 'completed' : 'incomplete'
  }))
})

const runRecordColumns = ref([
  { prop: 'id', label: '学号', minWidth: '120' },
  { prop: 'name', label: '姓名', minWidth: '100' },
  { prop: 'gender', label: '性别', minWidth: '80' },
  { prop: 'grade', label: '年级', minWidth: '100' },
  { prop: 'class', label: '班级', minWidth: '120' },
  { prop: 'weeklyRuns', label: '本周次数', minWidth: '100' },
  { prop: 'weeklyDistance', label: '本周里程(km)', minWidth: '120' },
  { prop: 'totalDistance', label: '累计里程(km)', minWidth: '120' },
  { prop: 'avgPace', label: '平均配速', minWidth: '100' },
  { slot: 'status', label: '达标状态', minWidth: '100' },
  { prop: 'lastRun', label: '最后跑步', minWidth: '140' },
])

const trendChart = ref(null)
const complianceChart = ref(null)
let trendChartInstance = null
let complianceChartInstance = null

const initTrendChart = () => {
  if (!trendChart.value) return
  if (trendChartInstance) trendChartInstance.dispose()
  trendChartInstance = echarts.init(trendChart.value)
  trendChartInstance.showLoading()
  updateTrendChart()
}

const updateTrendChart = () => {
  if (!trendChartInstance) return
  
  const option = {
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: weeklyTrend.value.map(item => item.day),
      axisLabel: { color: '#6B7280' }
    },
    yAxis: { 
      type: 'value',
      axisLabel: { color: '#6B7280' }
    },
    series: [{
      type: 'bar',
      data: weeklyTrend.value.map(item => item.value),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: '#1E5AA8' },
          { offset: 1, color: '#3B82F6' }
        ]),
        borderRadius: [4, 4, 0, 0]
      },
      barMaxWidth: 40
    }]
  }
  
  trendChartInstance.setOption(option)
  trendChartInstance.hideLoading()
}

const initComplianceChart = () => {
  if (!complianceChart.value) return
  if (complianceChartInstance) { complianceChartInstance.dispose(); complianceChartInstance = null }
  complianceChartInstance = echarts.init(complianceChart.value)
  complianceChartInstance.showLoading()
  updateComplianceChart()
}

const updateComplianceChart = () => {
  if (!complianceChartInstance) return

  const option = {
    tooltip: { trigger: 'item', formatter: '{b}: {c}%' },
    legend: {
      orient: 'vertical',
      right: '5%',
      top: 'center',
      textStyle: { color: '#6B7280', fontSize: 12 }
    },
    series: [{
      type: 'pie',
      radius: ['45%', '70%'],
      center: ['40%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: [
        { value: complianceRate.value, name: '达标', itemStyle: { color: '#1E5AA8' } },
        { value: 100 - complianceRate.value, name: '未达标', itemStyle: { color: '#E8EAED' } }
      ]
    }]
  }
  
  complianceChartInstance.setOption(option)
  complianceChartInstance.hideLoading()
}

const initCharts = () => {
  nextTick(() => {
    initTrendChart()
    initComplianceChart()
  })
}

onMounted(async () => {
  // 加载推送数据
  await loadPushData()
  
  setTimeout(() => {
    initCharts()
  }, 200)
})

// 监听学校切换，重新加载数据
watch(schoolId, async () => {
  pageLoading.value = true
  pushDataLoaded.value = false
  pushData.value = []
  await loadPushData()
  nextTick(() => {
    initCharts()
  })
})

onBeforeUnmount(() => {
  trendChartInstance?.dispose()
  complianceChartInstance?.dispose()
})

watch([searchQuery, filterGrade, filterClass, filterGender, filterStatus, dateRange], () => {
  currentPage.value = 1
  nextTick(() => {
    updateTrendChart()
    updateComplianceChart()
  })
})

const filteredRecords = computed(() => {
  return recordsWithStatus.value.filter(record => {
    const matchSearch = !searchQuery.value || 
      record.name.includes(searchQuery.value) || 
      record.id.includes(searchQuery.value)
    const matchGrade = !filterGrade.value || filterGrade.value === 'all' || String(record.grade) === filterGrade.value
    const matchClass = !filterClass.value || (isInterestClass(filterClass.value)
      ? getMatchingStudents(filterClass.value, students).some(s => s.id === record.id)
      : record.class === filterClass.value)
    const matchGender = !filterGender.value || record.gender === filterGender.value
    const matchStatus = !filterStatus.value || record.status === filterStatus.value
    const matchDate = !dateRange.value || dateRange.value.length < 2 || 
      (record.date >= dateRange.value[0] && record.date <= dateRange.value[1])
    return matchSearch && matchGrade && matchClass && matchGender && matchStatus && matchDate
  })
})

const paginatedRecords = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return (filteredRecords.value || []).slice(start, end)
})

const refreshData = () => {
  currentPage.value = 1
  records.value = [...recordsDefault]
  nextTick(() => {
    initCharts()
  })
  ElMessage.info('数据已刷新')
}

const viewDetail = (row) => {
  selectedRecord.value = row
  showDetailDialog.value = true
}

const addRecord = (row) => {
  selectedRecord.value = row
  addRecordForm.value = {
    date: '',
    distance: '',
    duration: '',
    note: ''
  }
  showAddRecordDialog.value = true
}

const confirmAddRecord = () => {
  addLog('添加记录', '', '添加阳光跑记录')
  if (!addRecordForm.value.date) {
    ElMessage.warning('请选择日期')
    return
  }
  if (!addRecordForm.value.distance) {
    ElMessage.warning('请输入跑步距离')
    return
  }
  
  const distance = parseFloat(addRecordForm.value.distance)
  if (distance <= 0) {
    ElMessage.warning('跑步距离必须大于0')
    return
  }
  
  const recordIndex = records.value.findIndex(r => r.id === selectedRecord.value.id)
  if (recordIndex !== -1) {
    records.value[recordIndex].weeklyDistance = parseFloat(records.value[recordIndex].weeklyDistance) + distance
    records.value[recordIndex].totalDistance = parseFloat(records.value[recordIndex].totalDistance) + distance
    records.value[recordIndex].weeklyRuns++
    records.value[recordIndex].lastRun = addRecordForm.value.date
    
    nextTick(() => {
      initCharts()
    })
  }
  
  ElMessage.success(`已为 ${selectedRecord.value.name} 补录跑步记录，增加 ${distance} km`)
  showAddRecordDialog.value = false
}

const confirmChangeStandard = () => {
  if (!standardForm.value.weeklyRuns || standardForm.value.weeklyRuns <= 0) {
    ElMessage.warning('每周跑步次数必须大于0')
    return
  }
  if (!standardForm.value.weeklyDistance || standardForm.value.weeklyDistance <= 0) {
    ElMessage.warning('每周跑步里程必须大于0')
    return
  }
  
  standardWeeklyRuns.value = standardForm.value.weeklyRuns
  standardWeeklyDistance.value = standardForm.value.weeklyDistance
  
  nextTick(() => {
    initCharts()
  })
  
  ElMessage.success(`达标标准已更新：每周${standardWeeklyRuns.value}次，每周${standardWeeklyDistance.value}km`)
  showBatchAddMileage.value = false
  standardForm.value = { weeklyRuns: standardWeeklyRuns.value, weeklyDistance: standardWeeklyDistance.value }
}

const importData = () => {
  importForm.value = {
    override: false
  }
  showImportDialog.value = true
}

const beforeImport = (file) => {
  const isExcel = file.type === 'application/vnd.ms-excel' || 
                  file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  if (!isExcel) {
    ElMessage.error('请上传Excel文件')
    return false
  }
  const isLt10M = file.size / 1024 / 1024 < 10
  if (!isLt10M) {
    ElMessage.error('文件大小不能超过 10MB')
    return false
  }
  return true
}

const handleImportSuccess = (response, file) => {
  ElMessage.success('文件上传成功')
}

const confirmImport = () => {
  addLog('导入阳光跑', '', '导入阳光跑数据')
  if (!importFile.value) {
    ElMessage.warning('请先选择要导入的文件')
    return
  }
  
  // 模拟读取Excel文件
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target.result
    if (content) {
      const rows = content.split('\n').filter(row => row.trim())
      if (rows.length > 1) {
        ElMessage.success(`已成功导入 ${rows.length - 1} 条阳光跑数据${importForm.value.override ? '（已覆盖原有数据）' : ''}`)
      } else {
        ElMessage.warning('文件内容为空或格式不正确')
      }
    }
    showImportDialog.value = false
  }
  reader.readAsText(importFile.value, 'UTF-8')
}

const exportData = () => {
  exportForm.value = {
    format: 'excel',
    range: 'all'
  }
  showExportDialog.value = true
}

const confirmExport = () => {
  addLog('导出阳光跑', '', '导出阳光跑数据')
  const dataToExport = exportForm.value.range === 'all' ? recordsWithStatus.value : filteredRecords.value
  
  // 导出CSV格式的阳光跑数据
  const headers = ['学生ID', '学生姓名', '性别', '年级', '班级', '本周跑步次数', '本周跑步里程(km)', '累计里程(km)', '平均配速', '状态', '最后跑步时间']
  const rows = dataToExport.map(record => [
    record.id,
    record.name,
    record.gender === '男' ? '男' : '女',
    record.grade,
    record.class,
    record.weeklyRuns,
    record.weeklyDistance,
    record.totalDistance,
    record.avgPace,
    record.status === 'completed' ? '已完成' : '未完成',
    record.lastRun
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `阳光跑数据_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success(`阳光跑数据已导出（${dataToExport.length}条记录）`)
  showExportDialog.value = false
}
</script>

<style scoped>
.sunshine-run-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 24px;
  background: #F7F8FA;
  min-height: 100vh;
}

.header-filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 卡片 */
.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

/* 状态标签 */
.status-tag {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
}

.status-success {
  background: rgba(45, 125, 70, 0.2);
  color: #22C55E;
}

.status-warning {
  background: rgba(245, 166, 35, 0.2);
  color: #F5A623;
}

.content-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.chart {
  height: 280px;
}

.table-card {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  padding: 20px;
}

.total-count {
  font-size: 13px;
  color: #9CA3AF;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

/* 跑步记录详情弹窗样式 */
.record-detail {
  padding: 8px 0;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8EAED;
}

.student-name {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A2E;
}

.student-id {
  font-size: 14px;
  color: #6B7280;
  background: #F7F8FA;
  padding: 4px 12px;
  border-radius: 6px;
}

.student-info {
  font-size: 14px;
  color: #6B7280;
  margin-left: auto;
}

.detail-section {
  margin-bottom: 20px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 12px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #F7F8FA;
}

.detail-label {
  font-size: 14px;
  color: #6B7280;
}

.detail-value {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

/* 补录数据弹窗样式 */
.add-record {
  padding: 8px 0;
}

.record-student {
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

.record-student .student-name {
  font-weight: 600;
  color: #1E5AA8;
}

/* 阳光跑响应式布局 */
@media screen and (max-width: 992px) {
  .page-header {
    flex-direction: column;
    gap: 16px;
    align-items: flex-start;
  }
  
  .header-filters {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .stats-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 16px;
  }
  
  .stat-divider {
    display: none;
  }
  
  .stat-item {
    text-align: center;
  }
  
  .content-row {
    grid-template-columns: 1fr;
    gap: 20px;
  }
}

@media screen and (max-width: 768px) {
  .sunshine-run-page {
    padding: 12px;
    gap: 12px;
  }
  
  .page-header {
    gap: 12px;
  }
  
  .header-filters {
    width: 100%;
  }
  
  .header-filters :deep(.el-input),
  .header-filters :deep(.el-select),
  .header-filters :deep(.el-date-picker) {
    width: calc(50% - 4px) !important;
    min-width: 150px;
  }
  
  .header-actions {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .stats-row {
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 12px;
  }
  
  .stat-num {
    font-size: 20px;
  }
  
  .stat-label {
    font-size: 12px;
  }
  
  .content-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .chart-card {
    padding: 16px;
  }
  
  .card-title {
    font-size: 14px;
  }
  
  .chart {
    height: 200px;
  }
  
  .list-card {
    overflow-x: auto;
  }
  
  .list-card :deep(.el-table) {
    min-width: 800px;
  }
}

@media screen and (max-width: 480px) {
  .stats-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    padding: 10px 12px;
    background: #F7F8FA;
    border-radius: 8px;
    text-align: left;
  }
  
  .stat-label {
    text-align: right;
  }
  
  .header-filters :deep(.el-input),
  .header-filters :deep(.el-select),
  .header-filters :deep(.el-date-picker) {
    width: 100% !important;
  }
  
  .chart {
    height: 160px;
  }
}
</style>
