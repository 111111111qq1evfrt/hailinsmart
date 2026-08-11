<template>
  <LoadingOverlay :visible="loading" text="正在加载数据..." subText="请稍候" />
  <div class="leave-approval-page">
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
        <el-select v-model="filterStatus" placeholder="审批状态" clearable style="width: 140px">
          <el-option label="待审批" value="pending" />
          <el-option label="已通过" value="approved" />
          <el-option label="已拒绝" value="rejected" />
        </el-select>
        <el-select v-model="filterType" placeholder="请假类型" clearable style="width: 140px">
          <el-option label="病假" value="sick" />
          <el-option label="事假" value="personal" />
          <el-option label="其他" value="other" />
        </el-select>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" />
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="refreshData">刷新</el-button>
        <el-button :icon="Download" @click="exportData">导出记录</el-button>
        <el-button type="primary" :icon="Plus" @click="createApplication">新建请假</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ stats.pending }}</span>
        <span class="stat-label">待审批</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num text-primary">{{ stats.approved }}</span>
        <span class="stat-label">已通过</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #E85D4E">{{ stats.rejected }}</span>
        <span class="stat-label">已拒绝</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #3B82F6">{{ stats.total }}</span>
        <span class="stat-label">本月申请</span>
      </div>
      <div class="stat-divider"></div>
        <div class="stat-item">
        <span class="stat-num" style="color: #1E5AA8">{{ stats.historyTotal }}</span>
        <span class="stat-label">历史申请</span>
      </div>
    </div>

    <!-- 图表区域：上下堆叠，图表并排 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">请假统计</span>
        </div>
        <div ref="statusChart" class="chart"></div>
      </div>

      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">请假类型分布</span>
        </div>
        <div ref="typeChart" class="chart"></div>
      </div>
    </div>

    <!-- 列表区域：在下 -->
    <div class="list-card">
      <ExamTable
        :data="filteredApplications"
        :columns="leaveColumns"
        title="请假申请列表"
        :search-fields="['studentName', 'id', 'studentId']"
        search-placeholder="搜索学生姓名/学号"
        :show-pagination="true"
        :default-page-size="12"
        :action-width="'240'"
      >
        <template #type="{ row }">
          <span class="status-tag" :class="row.type === 'sick' ? 'status-warning' : 'status-info'">
            {{ row.type === 'sick' ? '病假' : row.type === 'personal' ? '事假' : '其他' }}
          </span>
        </template>
        <template #leaveDate="{ row }">
          <span>{{ row.startDate }} 至 {{ row.endDate }}</span>
        </template>
        <template #approvalLevel="{ row }">
          <span class="status-tag" :class="getApprovalLevelClass(row.days)">
            {{ getApprovalLevelText(row.days) }}
          </span>
        </template>
        <template #status="{ row }">
          <span class="status-tag" :class="getStatusClass(row.status)">
            {{ getStatusText(row.status) }}
          </span>
        </template>
        <template #actions="{ row }">
          <el-button text type="primary" size="small" @click="viewDetail(row)">查看详情</el-button>
          <el-button v-if="row.status === 'pending'" text type="primary" size="small" @click="approve(row)">通过</el-button>
          <el-button v-if="row.status === 'pending'" text type="danger" size="small" @click="reject(row)">拒绝</el-button>
        </template>
      </ExamTable>
    </div>

    <el-dialog v-model="showDetail" title="请假详情" width="700px">
      <div v-if="currentApplication" class="detail-content">
        <div class="detail-section">
          <h4 class="section-title">基本信息</h4>
          <div class="detail-row">
            <span class="detail-label">学生信息</span>
            <span>{{ currentApplication.studentName }} | {{ currentApplication.grade }} {{ currentApplication.class }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">学号</span>
            <span>{{ currentApplication.studentId }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">请假类型</span>
            <span class="type-badge" :class="currentApplication.type === 'sick' ? 'sick' : currentApplication.type === 'urgent' ? 'urgent' : ''">
              {{ currentApplication.type === 'sick' ? '病假' : currentApplication.type === 'urgent' ? '紧急事假' : currentApplication.type === 'personal' ? '事假' : '其他' }}
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">请假时间</span>
            <span>{{ currentApplication.startDate }} 至 {{ currentApplication.endDate }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">请假天数</span>
            <span class="status-tag" :class="getApprovalLevelClass(currentApplication.days)">
              {{ currentApplication.days }}天
            </span>
          </div>
          <div class="detail-row">
            <span class="detail-label">请假原因</span>
            <span>{{ currentApplication.reason }}</span>
          </div>
          <div v-if="currentApplication.vagueReason" class="warning-row">
            <span class="warning-text"><el-icon :size="14" color="#E85D4E"><Warning /></el-icon> 系统检测到原因描述模糊，请补充详细信息</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">家长签字</span>
            <span>{{ currentApplication.parentSignature }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">提交时间</span>
            <span>{{ currentApplication.submitTime }}</span>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="section-title">证明材料</h4>
          <div v-if="currentApplication.type === 'sick'" class="proof-section">
            <div class="upload-zone">
              <div class="upload-placeholder">
                <span class="upload-icon">📄</span>
                <span class="upload-text">点击上传病历/药单照片</span>
              </div>
              <div v-if="currentApplication.medicalProofs?.length" class="proof-list">
                <div v-for="(proof, idx) in currentApplication.medicalProofs" :key="idx" class="proof-item">
                  <span class="file-icon"><el-icon :size="14" color="#1E5AA8"><Picture /></el-icon></span>
                  <span class="file-name">{{ proof.name }}</span>
                  <el-button link type="primary" size="small">预览</el-button>
                </div>
              </div>
            </div>
            <el-alert v-if="!currentApplication.medicalProofs?.length" title="病假建议上传病历或药单照片" type="warning" :closable="false" size="small" />
          </div>
          <div v-else-if="currentApplication.type === 'personal'" class="proof-section">
            <p class="proof-tip">请详细说明事假事由，系统会自动检测描述是否完整。</p>
          </div>
        </div>

        <div v-if="currentApplication.type === 'sick'" class="detail-section">
          <h4 class="section-title">健康数据 <span class="health-badge" :class="currentApplication.highRisk ? 'high-risk' : 'normal'">{{ currentApplication.highRisk ? '高风险' : '正常' }}</span></h4>
          <div class="health-records">
            <div class="health-item">
              <span class="health-label">近3日体温记录</span>
              <div class="temp-records">
                <span v-for="(temp, idx) in currentApplication.temperatureRecords" :key="idx" class="temp-record" :class="temp >= 37.3 ? 'high-temp' : ''">
                  {{ temp }}℃
                </span>
              </div>
            </div>
            <div class="health-item">
              <span class="health-label">传染病接触史</span>
              <span :class="currentApplication.hasInfectiousHistory ? 'risk-text' : ''">{{ currentApplication.hasInfectiousHistory ? '有接触' : '无接触' }}</span>
            </div>
            <div class="health-item">
              <span class="health-label">高风险标记</span>
              <span v-if="currentApplication.highRisk" class="risk-warning"><el-icon :size="14" color="#E85D4E"><Warning /></el-icon> 体温≥37.3℃触发校医优先审批</span>
              <span v-else class="normal-text">正常</span>
            </div>
          </div>
        </div>

        <div v-if="currentApplication.type === 'urgent'" class="detail-section">
          <h4 class="section-title">紧急事假通道</h4>
          <div class="urgent-info">
            <div class="detail-row">
              <span class="detail-label">餐费状态</span>
              <el-tag :type="currentApplication.mealFeeFrozen ? 'warning' : 'success'" size="small">
                {{ currentApplication.mealFeeFrozen ? '已冻结' : '未冻结' }}
              </el-tag>
            </div>
            <p class="urgent-tip">* 紧急事假当天申请，自动冻结当日餐费，缴费系统内不予收费</p>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="section-title">审批流程</h4>
          <el-steps :active="currentApplication.approvalStep" finish-status="success" simple>
            <el-step title="提交申请" :description="currentApplication.submitTime" />
            <el-step title="班主任审批" :description="currentApplication.teacherApprovalTime || '待审批'" />
            <el-step title="年级组长审批" v-if="currentApplication.days >= 2" :description="currentApplication.leaderApprovalTime || '待审批'" />
            <el-step title="德育处审批" v-if="currentApplication.days > 3" :description="currentApplication.deptApprovalTime || '待审批'" />
            <el-step title="校医审批" v-if="currentApplication.type === 'sick'" :description="currentApplication.doctorApprovalTime || (currentApplication.highRisk ? '优先处理中' : '待审批')" />
            <el-step title="完成" />
          </el-steps>
        </div>

        <div v-if="currentApplication.status !== 'pending'" class="detail-section">
          <h4 class="section-title">审批结果</h4>
          <div class="approval-result">
            <el-tag :type="currentApplication.status === 'approved' ? 'success' : 'danger'" size="large">
              {{ currentApplication.status === 'approved' ? '已通过' : '已拒绝' }}
            </el-tag>
            <span v-if="currentApplication.status === 'rejected'" class="reject-reason">拒绝原因：{{ currentApplication.rejectReason }}</span>
          </div>
        </div>

        <div v-if="currentApplication.status === 'approved'" class="detail-section">
          <h4 class="section-title">复课申请</h4>
          <div class="return-school">
            <div v-if="currentApplication.returnStatus === 'pending'" class="return-pending">
              <el-button type="primary" @click="showReturnDialog = true">申请复课</el-button>
              <span class="return-tip">请在健康监测系统中确认身体状况后再申请复课</span>
            </div>
            <div v-else-if="currentApplication.returnStatus === 'approved'" class="return-approved">
              <el-tag type="success">已复课</el-tag>
              <span>复课时间：{{ currentApplication.returnTime }}</span>
              <div class="return-success">
                <el-alert title="复课成功" type="success" :closable="false" size="small">
                  <p>该生已自动加入课堂考勤名单</p>
                  <p>任课教师已收到复课通知</p>
                </el-alert>
              </div>
            </div>
            <div v-else-if="currentApplication.returnStatus === 'rejected'" class="return-rejected">
              <el-tag type="danger">复课被拒</el-tag>
              <span class="reject-reason">原因：{{ currentApplication.returnRejectReason }}</span>
              <el-button type="primary" size="small" @click="retryReturn">重新申请</el-button>
            </div>
            <div v-else class="return-waiting">
              <el-tag type="warning">待校医确认</el-tag>
              <span>健康监测数据异常，等待校医介入处理</span>
            </div>
          </div>
          <div v-if="currentApplication.returnReminder" class="reminder-section">
            <el-alert title="复课提醒" type="warning" :closable="false" size="small">
              <p>⏰ 假条将于 {{ currentApplication.returnReminder.time }} 到期</p>
              <p>系统已在 {{ currentApplication.returnReminder.sentTime }} 向家长发送复课确认提醒</p>
              <p v-if="currentApplication.returnReminder.unconfirmed" class="danger-text"><el-icon :size="14" color="#E85D4E"><Warning /></el-icon> 家长尚未确认，请注意跟踪</p>
            </el-alert>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <template v-if="currentApplication?.status === 'pending'">
          <el-button type="success" @click="approve(currentApplication)">通过</el-button>
          <el-button type="danger" @click="showRejectDialog = true">拒绝</el-button>
        </template>
      </template>
    </el-dialog>

    <el-dialog v-model="showRejectDialog" title="拒绝原因" width="400px">
      <el-input v-model="rejectReason" type="textarea" :rows="3" placeholder="请输入拒绝原因" />
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="confirmReject">确认拒绝</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showReturnDialog" title="申请复课" width="500px">
      <div class="return-form">
        <p class="return-notice">请确认以下健康监测数据正常后再申请复课：</p>
        <div class="health-checklist">
          <div class="check-item">
            <span>体温正常（&lt;37.3℃）</span>
            <el-switch v-model="healthCheck.temperature" />
          </div>
          <div class="check-item">
            <span>无发热症状</span>
            <el-switch v-model="healthCheck.noFever" />
          </div>
          <div class="check-item">
            <span>无咳嗽症状</span>
            <el-switch v-model="healthCheck.noCough" />
          </div>
          <div class="check-item">
            <span>传染病已痊愈</span>
            <el-switch v-model="healthCheck.recovered" />
          </div>
        </div>
        <el-alert v-if="!allHealthChecked" title="请完成所有健康检查项" type="warning" show-icon :closable="false" />
      </div>
      <template #footer>
        <el-button @click="showReturnDialog = false">取消</el-button>
        <el-button type="primary" :disabled="!allHealthChecked" @click="submitReturn">提交复课申请</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="showCreateDialog" title="新建请假申请" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="学生姓名">
          <el-input v-model="createForm.studentName" placeholder="请输入学生姓名" />
        </el-form-item>
        <el-form-item label="班级类型">
          <el-radio-group v-model="createForm.classType" @change="createForm.class = ''">
            <el-radio label="行政班" />
            <el-radio label="兴趣班" />
          </el-radio-group>
        </el-form-item>
        <template v-if="createForm.classType === '行政班'">
          <el-form-item label="年级">
            <el-select v-model="createForm.grade" placeholder="请选择年级" class="w-full" @change="createForm.class = ''">
              <el-option label="一年级" value="一年级" />
              <el-option label="二年级" value="二年级" />
              <el-option label="三年级" value="三年级" />
              <el-option label="四年级" value="四年级" />
              <el-option label="五年级" value="五年级" />
              <el-option label="六年级" value="六年级" />
            </el-select>
          </el-form-item>
          <el-form-item label="班级">
            <el-select v-model="createForm.class" placeholder="请先选择年级" class="w-full" :disabled="!createForm.grade">
              <el-option v-for="c in leaveClassOptions" :key="c" :label="c" :value="c" />
            </el-select>
          </el-form-item>
        </template>
        <template v-else>
          <el-form-item label="兴趣班">
            <el-input v-model="createForm.class" placeholder="请输入兴趣班名称，如：篮球兴趣班" />
          </el-form-item>
        </template>
        <el-form-item label="请假类型">
          <el-select v-model="createForm.type" placeholder="请选择请假类型" class="w-full">
            <el-option label="病假" value="sick" />
            <el-option label="事假" value="personal" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="请假时间">
          <el-date-picker
            v-model="createForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            class="w-full"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="请假天数">
          <span class="days-display">{{ createForm.days || 0 }}天</span>
          <span class="approval-hint">（{{ createForm.days <= 1 ? '班主任审批' : createForm.days <= 3 ? '班主任+年级组长双审' : '德育处终审' }}）</span>
        </el-form-item>
        <el-form-item label="请假原因">
          <el-input
            v-model="createForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请详细说明请假原因"
          />
          <span v-if="createForm.vagueReason" class="vague-warning"><el-icon :size="14" color="#E85D4E"><Warning /></el-icon> 原因描述过短，建议补充详细信息</span>
        </el-form-item>
        <el-form-item v-if="createForm.type === 'sick'" label="证明材料">
          <el-upload drag action="/upload" :auto-upload="false">
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">
              将病历/药单照片拖到此处，或 <em>点击上传</em>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">提交申请</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { Plus, Download, Search, Refresh, UploadFilled, Warning, Picture } from '@element-plus/icons-vue'
import echarts from '@/utils/echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import ExamTable from '@/components/table/ExamTable.vue'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { usePersistedRef } from '@/composables'
import store from '@/store/global'
import { mockDB } from '@/mock'
import { generateDeterministicId } from '@/utils/seededRandom'
import { getRealStudents, normalizeStudents } from '@/utils/realDataLoader'
import { getTokenData, getClassList, getStudentListV4 } from '@/utils/daiweiApi'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const searchQuery = ref('')
const filterStatus = ref('')
const filterType = ref('')
const dateRange = ref([])
const showDetail = ref(false)
const showRejectDialog = ref(false)
const showReturnDialog = ref(false)
const showCreateDialog = ref(false)
const rejectReason = ref('')
const currentApplication = ref(null)
const currentPage = ref(1)
const pageSize = ref(12)
const healthCheck = ref({
  temperature: false,
  noFever: false,
  noCough: false,
  recovered: false
})

const createForm = ref({
  studentName: '',
  grade: '',
  class: '',
  type: '',
  dateRange: [],
  days: 0,
  reason: '',
  vagueReason: false,
  classType: '行政班'
})

// 班级数据
const classesStorageKey = computed(() => `classes_${schoolId.value}`)

// 检查是否有缓存数据
const hasCachedClasses = () => {
  try {
    const raw = sessionStorage.getItem(classesStorageKey.value)
    return raw && raw !== 'undefined' && raw !== 'null'
  } catch {
    return false
  }
}

// 默认 mock 班级数据
const defaultClasses = computed(() => mockDB[schoolId.value]?.classes || mockDB['hailin-second-primary'].classes)

// 班级数据：使用 usePersistedRef，自动从 sessionStorage 读取，回退到 mock
const classes = usePersistedRef(computed(() => `classes_${schoolId.value}`), defaultClasses.value)

// 加载状态：有缓存则不显示蒙版
const loading = ref(!hasCachedClasses())

// 加载大沩数据
const loadDaiweiData = async () => {
  const sid = schoolId.value
  const studentsStorageKey = `students_${sid}`

  try {
    const tokenResult = await getTokenData(sid)
    if (!tokenResult || !tokenResult.token) {
      throw new Error('Token获取失败')
    }

    // 1. 加载班级数据
    const classResult = await getClassList({}, sid)
    if (String(classResult.code) !== '0' || !classResult.data) {
      throw new Error('班级数据获取失败')
    }

    const classesMap = {}
    const parseClasses = (nodes) => {
      nodes.forEach(node => {
        if (node.type === 4) {
          classesMap[node.dept_id] = {
            id: node.dept_id,
            name: node.name,
            type: '行政班',
            grade: node.name.replace(/\d+班$/, ''),
            className: node.name.replace(/^[一二三四五六]年级/, '')
          }
        }
        if (node.children && node.children.length > 0) {
          parseClasses(node.children)
        }
      })
    }
    parseClasses(classResult.data)

    const newClasses = Object.values(classesMap).map(c => ({
      id: c.id,
      name: c.name,
      type: '行政班',
      grade: c.grade,
      className: c.className,
      teacher: '',
      studentCount: 0
    }))

    if (newClasses.length > 0) {
      classes.value = newClasses
    }

    // 2. 加载学生数据
    const studentResult = await getStudentListV4({ page: 1, size: 2000 }, sid)
    const studentList = studentResult.list || []
    
    if (studentList.length > 0) {
      const newStudents = studentList.map(s => {
        const classInfo = classesMap[s.class_id]
        const grade = classInfo?.grade || ''
        const className = classInfo?.className || ''
        const gradeNum = grade ? parseInt(grade.replace('年级', '')) : 0
        const age = gradeNum > 0 ? gradeNum + 6 : 8
        
        return {
          id: s.student_id,
          name: s.name,
          gender: s.gender === 1 ? '男' : '女',
          grade: grade,
          class: className,
          className: className,
          class_id: s.class_id,
          age: age,
          faceRegistered: !!s.cimg_url,
          sportsInterest: '',
          itemClass: '',
          studentNumber: s.student_number || '-',
          cimgUrl: s.cimg_url || '',
          facePhoto: '',
          phone: '',
          idCard: '',
          parentName: '',
          parentPhone: '',
          address: '',
          createTime: new Date().toISOString(),
          status: '正常'
        }
      })
      
      // 保存到 sessionStorage，供 getRealStudents 读取
      const oldStudentsRaw = sessionStorage.getItem(studentsStorageKey)
      const oldStudents = oldStudentsRaw ? JSON.parse(oldStudentsRaw) : []
      const oldIds = new Set(oldStudents.map(s => s.id))
      const newIds = new Set(newStudents.map(s => s.id))
      const dataChanged = oldStudents.length !== newStudents.length || 
                           [...newIds].some(id => !oldIds.has(id))
      
      sessionStorage.setItem(studentsStorageKey, JSON.stringify(newStudents))
     
      
      // 3. 只有当学生数据变化时才清除请假记录缓存，触发重新生成
      if (dataChanged) {
        const applicationsStorageKey = `leave_applications_${sid}`
        sessionStorage.removeItem(applicationsStorageKey)
        applications.value = generateDefaultApplications()
       
      }
    }
  } catch (err) {
   
  } finally {
    loading.value = false
  }
}

// 行政班时，根据选中年级过滤班级下拉选项
const leaveClassOptions = computed(() => {
  const g = createForm.value.grade
  if (!g) return []
  const allClasses = classes.value || []
  return allClasses
    .filter(c => c.type === '行政班' && c.name.startsWith(g))
    .map(c => c.name.replace(g, ''))
})

const statusChart = ref(null)
const typeChart = ref(null)
let statusChartInstance = null
let typeChartInstance = null

const stats = computed(() => {
  const data = filteredApplications.value.length > 0 ? filteredApplications.value : applications.value
  const pending = data.filter(a => a.status === 'pending').length
  const approved = data.filter(a => a.status === 'approved').length
  const rejected = data.filter(a => a.status === 'rejected').length
  
  const now = new Date()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()
  const currentMonthCount = data.filter(a => {
    const d = new Date(a.startDate)
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear
  }).length
  
  return {
    pending,
    approved,
    rejected,
    total: currentMonthCount,
    historyTotal: applications.value.length
  }
})

const leaveColumns = ref([
  { prop: 'id', label: '申请编号', minWidth: '140' },
  { prop: 'studentName', label: '学生姓名', minWidth: '100' },
  { prop: 'grade', label: '年级', minWidth: '100' },
  { prop: 'class', label: '班级', minWidth: '120' },
  { slot: 'type', label: '请假类型', minWidth: '100' },
  { slot: 'leaveDate', label: '请假时间', minWidth: '200' },
  { prop: 'days', label: '天数', minWidth: '80', align: 'center' },
  { slot: 'approvalLevel', label: '审批级别', minWidth: '120' },
  { slot: 'status', label: '状态', minWidth: '100' },
  { prop: 'submitTime', label: '提交时间', minWidth: '140' }
])

const typeDistribution = computed(() => {
  const data = filteredApplications.value.length > 0 ? filteredApplications.value : applications.value
  const total = data.length || 1
  const sick = data.filter(a => a.type === 'sick').length
  const personal = data.filter(a => a.type === 'personal').length
  const urgent = data.filter(a => a.type === 'urgent').length
  const other = data.filter(a => a.type === 'other').length
  return [
    { name: '病假', count: sick, percent: Math.round((sick / total) * 100), color: '#F5A623' },
    { name: '事假', count: personal, percent: Math.round((personal / total) * 100), color: '#3B82F6' },
    { name: '紧急事假', count: urgent, percent: Math.round((urgent / total) * 100), color: '#E85D4E' },
    { name: '其他', count: other, percent: Math.round((other / total) * 100), color: '#9CA3AF' }
  ]
})

const allHealthChecked = computed(() => {
  return healthCheck.value.temperature &&
    healthCheck.value.noFever &&
    healthCheck.value.noCough &&
    healthCheck.value.recovered
})

// Seeded random for deterministic per-school data
const seededRng = (seed) => {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

const getSchoolYear = (year, month) => {
  if (month >= 9 && month <= 12) return `${year}-${year + 1}`
  if (month >= 1 && month <= 7) return `${year - 1}-${year}`
  return `${year}-${year + 1}`
}

const generateDefaultApplications = () => {
  const sid = schoolId.value
  
  // 1. 获取班级数据，构建 class_id -> { grade, className } 映射
  const currentClasses = classes.value || []
  const classesMap = {}
  currentClasses.forEach(c => {
    classesMap[c.id] = {
      grade: c.name?.replace(/\d+班$/, '') || '',
      className: c.name?.replace(/^[一二三四五六]年级/, '') || ''
    }
  })
  
 
  // 2. 获取学生数据，确保每个学生都有 grade 和 class
  const realStudents = getRealStudents(sid)
  let students = realStudents.length > 0 ? normalizeStudents(realStudents) : (mockDB[sid]?.students || [])
  
  // 关联班级信息：通过 class_id 或 class 字段
  students = students.map(s => {
    // 如果已经有 grade 和 class，直接使用
    if (s.grade && s.class) return s
    
    // 尝试通过 class_id 查找
    if (s.class_id && classesMap[s.class_id]) {
      const info = classesMap[s.class_id]
      return { ...s, grade: info.grade, class: info.className }
    }
    
    // 尝试通过 className 匹配
    if (s.className) {
      const found = currentClasses.find(c => c.name === s.className)
      if (found) {
        return { ...s, grade: found.name.replace(/\d+班$/, ''), class: found.name.replace(/^[一二三四五六]年级/, '') }
      }
    }
    
    // 如果学生的 class 字段是 "4班" 这样的格式，尝试匹配
    if (s.class && typeof s.class === 'string' && s.class.includes('班')) {
      const matched = currentClasses.find(c => c.name === `${s.grade}${s.class}` || c.name.endsWith(s.class))
      if (matched) {
        return { ...s, grade: matched.name.replace(/\d+班$/, ''), class: matched.name.replace(/^[一二三四五六]年级/, '') }
      }
    }
    
    // 返回原始数据
    return s
  })
  
  const teachers = mockDB[sid]?.teachers || []
  if (students.length === 0) return []
  
 
  const seedMap = { 'hailin-second-primary': 5001, 'hailin-zirong-primary': 6002, 'linhai-experimental-primary': 7003 }
  const rng = seededRng(seedMap[sid] || 5001)
  const totalBySchool = { 'hailin-second-primary': 90, 'hailin-zirong-primary': 65, 'linhai-experimental-primary': 110 }
  const total = totalBySchool[sid] || 90
  // Month weights: 1月→12月, winter peak (11-2月)
  const mWeights = [6, 8, 12, 16, 14, 6, 4, 6, 10, 8, 4, 6]
  const tw = mWeights.reduce((a, b) => a + b, 0)

  const sickReasons = ['感冒发烧，医生建议休息', '急性肠胃炎', '扁桃体发炎', '水痘隔离期', '骨折恢复期', '过敏性哮喘发作', '病毒性感冒', '食物中毒观察期']
  const personalReasons = ['家中有事需处理', '参加亲属婚礼', '搬家需要协助', '家庭旅行', '回老家探亲']
  const urgentReasons = ['家庭突发紧急情况', '亲属住院需探望', '住所突发状况需处理']
  const otherReasons = ['复查预约', '牙科手术', '疫苗接种观察']

  const records = []
  for (let i = 0; i < total; i++) {
    // Pick month by weighted random
    let r = rng() * tw, mi = 0
    for (let m = 0; m < 12; m++) { r -= mWeights[m]; if (r <= 0) { mi = m; break } }
    const year = mi <= 3 ? 2025 : mi <= 6 ? 2024 : mi <= 9 ? 2023 : 2025
    const month = mi + 1
    const day = Math.floor(rng() * 27) + 1
    const schoolYear = getSchoolYear(year, month)
    const startDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`

    // Type: ~45% sick, ~30% personal, ~15% urgent, ~10% other
    const tr = rng()
    const type = tr < 0.45 ? 'sick' : tr < 0.75 ? 'personal' : tr < 0.90 ? 'urgent' : 'other'

    const student = students[i % students.length]
    const days = type === 'sick' ? Math.floor(rng() * 5) + 1 : type === 'urgent' ? 1 : Math.floor(rng() * 3) + 1
    const endDay = Math.min(day + days - 1, 28)
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`

    // Status: ~55% approved, ~25% pending, ~20% rejected
    const sr = rng()
    const status = sr < 0.55 ? 'approved' : sr < 0.80 ? 'pending' : 'rejected'

    const approvalStep = status === 'approved'
      ? (type === 'sick' ? (days > 3 ? 5 : 4) : days <= 1 ? 2 : days <= 3 ? 3 : 4)
      : status === 'pending' ? 1 : 2

    const teacherName = teachers[i % teachers.length]?.name || '张老师'
    const highRisk = type === 'sick' && rng() < 0.25
    const tempBase = highRisk ? 37.3 + rng() * 1.5 : 36.2 + rng() * 0.8
    const reason = type === 'sick' ? sickReasons[Math.floor(rng() * sickReasons.length)]
      : type === 'personal' ? personalReasons[Math.floor(rng() * personalReasons.length)]
      : type === 'urgent' ? urgentReasons[Math.floor(rng() * urgentReasons.length)]
      : otherReasons[Math.floor(rng() * otherReasons.length)]

    const rec = {
      id: `LQ${startDate.replace(/-/g, '')}${String(i + 1).padStart(3, '0')}`,
      studentId: student.id,
      studentName: student.name,
      grade: student.grade,
      class: student.class,
      schoolYear,
      type,
      startDate,
      endDate,
      days,
      reason,
      vagueReason: reason.length < 6,
      parentSignature: student.name.charAt(0) + '先生/女士',
      status,
      submitTime: `${startDate} ${String(8 + Math.floor(rng() * 10)).padStart(2, '0')}:${String(Math.floor(rng() * 60)).padStart(2, '0')}`,
      approvalStep,
      teacherApprovalTime: status !== 'pending' ? `${startDate} 16:00` : '',
      leaderApprovalTime: status === 'approved' && days >= 2 ? `${startDate} 16:30` : '',
      deptApprovalTime: status === 'approved' && days > 3 ? `${startDate} 17:00` : '',
      doctorApprovalTime: (status === 'approved' && type === 'sick') ? `${startDate} 17:00` : '',
      rejectReason: status === 'rejected' ? '症状轻微，可边上学边观察' : '',
      temperatureRecords: type === 'sick' ? [
        Math.round(tempBase * 10) / 10,
        Math.round((tempBase + rng() * 0.5) * 10) / 10,
        Math.round((tempBase - rng() * 0.3) * 10) / 10
      ] : [],
      hasInfectiousHistory: type === 'sick' && rng() < 0.15,
      highRisk,
      returnStatus: status === 'approved' ? (rng() < 0.5 ? 'approved' : '') : '',
      returnTime: '',
      returnReminder: null,
      medicalProofs: type === 'sick' && rng() < 0.6 ? [{ name: '病历照片.jpg' }] : []
    }
    records.push(rec)
  }
  
  // 调试：检查生成的请假记录中的 class 字段
  return records
}

const defaultApplications = computed(() => generateDefaultApplications())

// 使用持久化存储，每个学校独立数据
const applications = usePersistedRef(computed(() => `leave_applications_${schoolId.value}`), defaultApplications.value)

// 检查数据完整性：如果请假记录缺少 grade/class 字段，重新生成
const checkAndRegenerate = () => {
  const firstApp = applications.value[0]
  const hasMissingFields = !firstApp || !firstApp.class || !firstApp.grade
  const classesLoaded = classes.value && classes.value.length > 0
  
  if (hasMissingFields && classesLoaded) {
   
    applications.value = generateDefaultApplications()
  }
}

// 初始检查
checkAndRegenerate()

// 班级数据加载完成后，检查是否需要重新生成
watch(classes, (newClasses) => {
  if (newClasses && newClasses.length > 0) {
    checkAndRegenerate()
  }
}, { immediate: false })

const filteredApplications = computed(() => {
  return applications.value.filter(app => {
    const matchSearch = !searchQuery.value ||
      app.studentName.includes(searchQuery.value) ||
      app.id.includes(searchQuery.value)
    const matchStatus = !filterStatus.value || app.status === filterStatus.value
    const matchType = !filterType.value || app.type === filterType.value
    
    let matchDate = true
    if (dateRange.value && dateRange.value.length === 2) {
      const startDate = new Date(dateRange.value[0])
      const endDate = new Date(dateRange.value[1])
      const appDate = new Date(app.startDate)
      matchDate = appDate >= startDate && appDate <= endDate
    }
    
    return matchSearch && matchStatus && matchType && matchDate
  })
})

const getStatusClass = (status) => {
  if (status === 'pending') return 'status-warning'
  if (status === 'approved') return 'status-success'
  return 'status-danger'
}

const getStatusText = (status) => {
  if (status === 'pending') return '待审批'
  if (status === 'approved') return '已通过'
  return '已拒绝'
}

const getApprovalLevelClass = (days) => {
  if (days <= 1) return 'status-success'
  if (days <= 3) return 'status-info'
  return 'status-warning'
}

const getApprovalLevelText = (days) => {
  if (days <= 1) return '班主任审批'
  if (days <= 3) return '班主任+年级组长'
  return '德育处终审'
}

watch(() => createForm.value.dateRange, (newRange) => {
  if (newRange && newRange.length === 2) {
    const start = new Date(newRange[0])
    const end = new Date(newRange[1])
    const diffTime = Math.abs(end - start)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1
    createForm.value.days = diffDays
  } else {
    createForm.value.days = 0
  }
})

watch(() => createForm.value.reason, (newReason) => {
  createForm.value.vagueReason = !newReason || newReason.length < 5
})

// 学校切换时重新加载班级数据
watch(schoolId, async (newId) => {
  if (newId) {
    loading.value = true
    await loadDaiweiData()
    nextTick(() => {
      initCharts()
    })
  }
})

const initStatusChart = () => {
  if (!statusChart.value) return
  if (statusChartInstance) { statusChartInstance.dispose(); statusChartInstance = null }
  statusChartInstance = echarts.init(statusChart.value)
  statusChartInstance.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { color: '#6B7280' } },
    series: [{
      type: 'pie',
      radius: ['40%', '65%'],
      center: ['50%', '45%'],
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: [
        { value: stats.value.pending, name: '待审批', itemStyle: { color: '#F5A623' } },
        { value: stats.value.approved, name: '已通过', itemStyle: { color: '#1E5AA8' } },
        { value: stats.value.rejected, name: '已拒绝', itemStyle: { color: '#E85D4E' } }
      ]
    }]
  })
}

const initTypeChart = () => {
  if (!typeChart.value) return
  if (typeChartInstance) { typeChartInstance.dispose(); typeChartInstance = null }
  typeChartInstance = echarts.init(typeChart.value)
  typeChartInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '8%', bottom: '3%', top: '5%', containLabel: true },
    xAxis: {
      type: 'value',
      axisLine: { show: false },
      splitLine: { lineStyle: { color: '#F7F8FA' } },
      axisLabel: { color: '#6B7280' }
    },
    yAxis: {
      type: 'category',
      data: typeDistribution.value.map(i => i.name),
      axisLine: { lineStyle: { color: '#E8EAED' } },
      axisLabel: { color: '#6B7280' },
      axisTick: { show: false }
    },
    series: [{
      type: 'bar',
      barWidth: '50%',
      itemStyle: { borderRadius: [0, 4, 4, 0] },
      data: typeDistribution.value.map((item, index) => ({
        value: item.count,
        itemStyle: { color: item.color }
      }))
    }]
  })
}

const initCharts = () => {
  nextTick(() => {
    initStatusChart()
    initTypeChart()
  })
}

onMounted(async () => {
  // 先初始化图表，不等待 API 加载
  nextTick(() => initCharts())
  
  // 后台加载数据
  await loadDaiweiData()
})

onBeforeUnmount(() => {
  if (statusChartInstance) statusChartInstance.dispose()
  if (typeChartInstance) typeChartInstance.dispose()
})

// 当请假记录数据变化时，重新渲染图表
watch(() => applications.value.length, () => {
  nextTick(() => {
    initCharts()
  })
})

watch([searchQuery, filterStatus, filterType], () => {
  nextTick(() => {
    initCharts()
  })
})

const refreshData = () => {
  searchQuery.value = ''
  filterStatus.value = ''
  filterType.value = ''
  currentPage.value = 1
  nextTick(() => {
    initCharts()
  })
  ElMessage.info('数据已刷新')
}

const exportData = () => {
  // 导出CSV格式的请假数据
  const headers = ['请假编号', '学生姓名', '年级', '班级', '请假类型', '开始日期', '结束日期', '天数', '状态', '提交时间']
  const rows = filteredApplications.value.map(app => [
    app.id,
    app.studentName,
    app.grade,
    app.class,
    app.type === 'sick' ? '病假' : app.type === 'personal' ? '事假' : '其他',
    app.startDate,
    app.endDate,
    app.days,
    app.status === 'pending' ? '待审批' : app.status === 'approved' ? '已批准' : app.status === 'rejected' ? '已驳回' : '已撤销',
    app.submitTime
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `请假记录_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('请假记录已导出')
}

const createApplication = () => {
  createForm.value = {
    studentName: '',
    grade: '',
    class: '',
    type: '',
    dateRange: [],
    days: 0,
    reason: '',
    vagueReason: false,
    classType: '行政班'
  }
  showCreateDialog.value = true
}

const submitCreate = () => {
  if (!createForm.value.studentName) {
    ElMessage.warning('请输入学生姓名')
    return
  }
  if (createForm.value.classType === '行政班') {
    if (!createForm.value.grade) {
      ElMessage.warning('请选择年级')
      return
    }
    if (!createForm.value.class) {
      ElMessage.warning('请选择班级')
      return
    }
  } else {
    createForm.value.grade = ''
    if (!createForm.value.class) {
      ElMessage.warning('请输入兴趣班名称')
      return
    }
  }
  if (!createForm.value.type) {
    ElMessage.warning('请选择请假类型')
    return
  }
  if (!createForm.value.dateRange || createForm.value.dateRange.length !== 2) {
    ElMessage.warning('请选择请假时间')
    return
  }
  if (!createForm.value.reason) {
    ElMessage.warning('请输入请假原因')
    return
  }
  
  const newApplication = {
    id: generateDeterministicId('LQ', createForm.value.studentName + '-' + (createForm.value.dateRange ? createForm.value.dateRange[0] : '')),
    studentName: createForm.value.studentName,
    grade: createForm.value.grade,
    class: createForm.value.class,
    type: createForm.value.type,
    status: 'pending',
    submitTime: new Date().toLocaleString('zh-CN'),
    approvalStep: 0,
    dateRange: createForm.value.dateRange,
    startDate: createForm.value.dateRange[0],
    endDate: createForm.value.dateRange[1],
    days: createForm.value.days,
    reason: createForm.value.reason,
    vagueReason: createForm.value.vagueReason,
    parentSignature: '',
    temperatureRecords: [],
    hasInfectiousHistory: false,
    highRisk: false,
    returnReminder: null
  }
  
  applications.value.unshift(newApplication)
  
  ElMessage.success('请假申请已提交')
  showCreateDialog.value = false
  nextTick(() => { initCharts() })
  
  createForm.value = {
    studentName: '',
    grade: '',
    class: '',
    type: '',
    dateRange: [],
    days: 0,
    reason: '',
    vagueReason: false,
    classType: '行政班'
  }
}

const viewDetail = (row) => {
  currentApplication.value = row
  healthCheck.value = { temperature: false, noFever: false, noCough: false, recovered: false }
  showDetail.value = true
}

const approve = (row) => {
  row.status = 'approved'
  row.approvalStep = row.type === 'sick' ? (row.days > 3 ? 6 : 5) : (row.days <= 1 ? 2 : row.days <= 3 ? 3 : 4)
  if (row.type === 'sick') {
    row.doctorApprovalTime = new Date().toLocaleString('zh-CN')
  } else if (row.days <= 1) {
    row.teacherApprovalTime = new Date().toLocaleString('zh-CN')
  } else if (row.days <= 3) {
    row.teacherApprovalTime = new Date().toLocaleString('zh-CN')
    row.leaderApprovalTime = new Date().toLocaleString('zh-CN')
  } else {
    row.teacherApprovalTime = new Date().toLocaleString('zh-CN')
    row.leaderApprovalTime = new Date().toLocaleString('zh-CN')
    row.deptApprovalTime = new Date().toLocaleString('zh-CN')
  }
  showDetail.value = false
  ElMessage.success('请假申请已通过，已通知家长')
  nextTick(() => { initCharts() })
}

const reject = (row) => {
  showRejectDialog.value = true
}

const confirmReject = () => {
  if (!rejectReason.value.trim()) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  const app = applications.value.find(a => a.id === currentApplication.value?.id)
  if (app) {
    app.status = 'rejected'
    app.rejectReason = rejectReason.value
    app.approvalStep = app.type === 'sick' ? 3 : 2
  }
  showRejectDialog.value = false
  rejectReason.value = ''
  showDetail.value = false
  ElMessage.warning('请假申请已拒绝，已通知家长')
  nextTick(() => { initCharts() })
}

const submitReturn = () => {
  if (!allHealthChecked.value) {
    ElMessage.warning('请完成所有健康检查项')
    return
  }
  const app = applications.value.find(a => a.id === currentApplication.value?.id)
  if (app) {
    const healthAbnormal = !healthCheck.value.temperature || !healthCheck.value.noCough
    if (healthAbnormal) {
      app.returnStatus = 'waiting'
      ElMessage.warning('健康监测数据异常，已通知校医介入，复课申请暂时搁置')
    } else {
      app.returnStatus = 'pending'
      ElMessage.success('复课申请已提交，等待校医审批')
    }
  }
  showReturnDialog.value = false
}

const retryReturn = () => {
  const app = applications.value.find(a => a.id === currentApplication.value?.id)
  if (app) {
    app.returnStatus = 'pending'
  }
  healthCheck.value = { temperature: false, noFever: false, noCough: false, recovered: false }
  showReturnDialog.value = true
}
</script>

<style scoped>
.leave-approval-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
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

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.chart {
  height: 260px;
  width: 100%;
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-warning {
  background: #FEF3C7;
  color: #92400E;
}

.status-success {
  background: #DCFCE7;
  color: #166534;
}

.status-danger {
  background: #FEE2E2;
  color: #991B1B;
}

.status-info {
  background: #DBEAFE;
  color: #1E40AF;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid #E8EAED;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-row {
  display: flex;
  gap: 12px;
}

.detail-label {
  width: 100px;
  font-size: 13px;
  color: #6B7280;
}

.detail-section {
  padding: 12px 0;
  border-bottom: 1px solid #E8EAED;
}

.detail-section:last-child {
  border-bottom: none;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 12px 0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.type-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: #F7F8FA;
  color: #6B7280;
}

.type-badge.sick {
  background: #FEF3C7;
  color: #92400E;
}

.type-badge.urgent {
  background: #FEE2E2;
  color: #991B1B;
}

.health-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: normal;
}

.health-badge.normal {
  background: #DCFCE7;
  color: #166534;
}

.health-badge.high-risk {
  background: #FEE2E2;
  color: #991B1B;
}

.health-records {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.health-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.health-label {
  font-size: 12px;
  color: #6B7280;
}

.temp-records {
  display: flex;
  gap: 8px;
}

.temp-record {
  padding: 2px 8px;
  background: #FFFFFF;
  border-radius: 4px;
  font-size: 13px;
}

.temp-record.high-temp {
  background: #FEE2E2;
  color: #991B1B;
  font-weight: 600;
}

.risk-text {
  color: #E85D4E;
  font-weight: 500;
}

.risk-warning {
  color: #E85D4E;
  font-size: 13px;
}

.normal-text {
  color: #1E5AA8;
}

.urgent-info {
  background: #FEF3C7;
  border-radius: 8px;
  padding: 12px;
}

.urgent-tip {
  font-size: 12px;
  color: #92400E;
  margin: 8px 0 0 0;
}

.approval-result {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reject-reason {
  font-size: 13px;
  color: #E85D4E;
}

.return-school {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 12px;
}

.return-pending,
.return-approved,
.return-rejected,
.return-waiting {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.return-tip {
  font-size: 12px;
  color: #6B7280;
}

.return-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.return-notice {
  font-size: 14px;
  color: #1A1A2E;
  margin: 0;
}

.health-checklist {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: #F7F8FA;
  padding: 16px;
  border-radius: 8px;
}

.check-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.days-display {
  font-size: 18px;
  font-weight: 600;
  color: #1E5AA8;
  margin-right: 8px;
}

.approval-hint {
  font-size: 12px;
  color: #6B7280;
}

.vague-warning {
  font-size: 12px;
  color: #E85D4E;
  margin-top: 4px;
  display: block;
}

.return-success {
  margin-top: 12px;
}

.return-success p {
  margin: 4px 0;
  font-size: 13px;
  color: #166534;
}

.danger-text {
  color: #E85D4E;
  font-weight: 500;
}

.reminder-section {
  margin-top: 12px;
}

.warning-row {
  margin-top: 8px;
}

.warning-text {
  font-size: 13px;
  color: #E85D4E;
}

.proof-section {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 12px;
}

.proof-tip {
  font-size: 13px;
  color: #6B7280;
  margin: 0;
}

.upload-zone {
  border: 2px dashed #E8EAED;
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.3s;
}

.upload-zone:hover {
  border-color: #1E5AA8;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.upload-icon {
  font-size: 32px;
}

.upload-text {
  font-size: 13px;
  color: #6B7280;
}

.proof-list {
  margin-top: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.proof-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #FFFFFF;
  border-radius: 6px;
}

.file-icon {
  font-size: 20px;
}

.file-name {
  flex: 1;
  font-size: 13px;
  color: #1A1A2E;
}
</style>