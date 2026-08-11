<template>
  <div class="test-settings-container">
    <div class="settings-header">
      <h3 class="settings-title">体测设置</h3>
      <el-button type="primary" @click="saveSettings">保存设置</el-button>
    </div>
    
    <div class="settings-content">
      <div class="settings-section">
        <h4 class="section-title">时间段设置</h4>
        
        <div class="time-settings">
          <div class="setting-item">
            <label class="setting-label">测试开始时间</label>
            <el-date-picker 
              v-model="settings.startDate" 
              type="date" 
              placeholder="选择开始日期"
            />
          </div>
          
          <div class="setting-item">
            <label class="setting-label">测试结束时间</label>
            <el-date-picker 
              v-model="settings.endDate" 
              type="date" 
              placeholder="选择结束日期"
            />
          </div>
          
          <div class="setting-item">
            <label class="setting-label">每日测试时段</label>
            <div class="time-range">
              <el-time-picker 
                v-model="settings.startTime" 
                format="HH:mm"
                placeholder="开始时间"
              />
              <span class="time-separator">至</span>
              <el-time-picker 
                v-model="settings.endTime" 
                format="HH:mm"
                placeholder="结束时间"
              />
            </div>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">休息时间</label>
            <el-input-number 
              v-model="settings.restMinutes" 
              :min="0" 
              :max="120"
              style="width: 120px;"
            />
            <span class="unit">分钟</span>
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <h4 class="section-title">预约模式</h4>
        
        <div class="mode-settings">
          <div class="mode-option" :class="{ active: settings.bookingMode === 'free' }" @click="settings.bookingMode = 'free'">
            <div class="mode-icon">
              <Calendar />
            </div>
            <div class="mode-info">
              <h5>自由预约</h5>
              <p>学生可自由选择测试时间</p>
            </div>
          </div>
          
          <div class="mode-option" :class="{ active: settings.bookingMode === 'fixed' }" @click="settings.bookingMode = 'fixed'">
            <div class="mode-icon">
              <Clock />
            </div>
            <div class="mode-info">
              <h5>固定时段</h5>
              <p>按班级或年级安排固定测试时间</p>
            </div>
          </div>
          
          <div class="mode-option" :class="{ active: settings.bookingMode === 'hybrid' }" @click="settings.bookingMode = 'hybrid'">
            <div class="mode-icon">
              <Grid />
            </div>
            <div class="mode-info">
              <h5>混合模式</h5>
              <p>部分时段固定，部分时段开放预约</p>
            </div>
          </div>
        </div>
        
        <div v-if="settings.bookingMode !== 'free'" class="booking-options">
          <div class="setting-item">
            <label class="setting-label">每班人数限制</label>
            <el-input-number 
              v-model="settings.classLimit" 
              :min="1" 
              :max="100"
              style="width: 120px;"
            />
            <span class="unit">人</span>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">预约开放时间</label>
            <el-select v-model="settings.bookingOpenDays">
              <el-option label="测试前1天" :value="1" />
              <el-option label="测试前3天" :value="3" />
              <el-option label="测试前7天" :value="7" />
              <el-option label="测试前14天" :value="14" />
            </el-select>
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <h4 class="section-title">设备配置</h4>
        
        <div class="device-settings">
          <div class="setting-item">
            <label class="setting-label">启用AI识别</label>
            <el-switch v-model="settings.enableAI" />
          </div>
          
          <div class="setting-item">
            <label class="setting-label">摄像头数量</label>
            <el-input-number 
              v-model="settings.cameraCount" 
              :min="1" 
              :max="4"
              style="width: 120px;"
            />
            <span class="unit">个</span>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">自动重测次数</label>
            <el-input-number 
              v-model="settings.retestCount" 
              :min="0" 
              :max="3"
              style="width: 120px;"
            />
            <span class="unit">次</span>
          </div>
          
          <div class="setting-item">
            <label class="setting-label">语音提示</label>
            <el-switch v-model="settings.voicePrompt" />
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <h4 class="section-title">体测任务管理</h4>
        
        <!-- 学年选择和筛选 -->
        <div class="task-filter-bar">
          <div class="filter-item">
            <label class="filter-label">学年</label>
            <el-select v-model="selectedAcademicYear" class="year-select">
              <el-option label="全部学年" value="all" />
              <el-option label="2025-2026学年" value="2025-2026" />
              <el-option label="2024-2025学年" value="2024-2025" />
              <el-option label="2023-2024学年" value="2023-2024" />
            </el-select>
          </div>
          <div class="filter-item">
            <label class="filter-label">学期</label>
            <el-select v-model="selectedSemester" style="width: 200px;">
              <el-option label="全部学期" value="all" />
              <el-option label="秋季学期" value="autumn" />
              <el-option label="春季学期" value="spring" />
            </el-select>
          </div>
          <div class="filter-item">
            <label class="filter-label">状态</label>
            <el-select v-model="selectedStatus" style="width: 200px;">
              <el-option label="全部状态" value="all" />
              <el-option label="未开始" value="未开始" />
              <el-option label="进行中" value="进行中" />
              <el-option label="已暂停" value="已暂停" />
              <el-option label="已结束" value="已结束" />
            </el-select>
          </div>
        </div>
        
        <!-- 快捷操作 -->
        <div class="task-actions-bar">
          <el-button type="primary" size="small" @click="showAddTask = true">
            <Plus /> 添加任务
          </el-button>
          <el-button type="primary" size="small" @click="showBatchCreate = true">
            <Grid /> 批量创建
          </el-button>
          <el-button type="primary" size="small" @click="showImport = true">
            <Upload /> 导入任务
          </el-button>
        </div>
        
        <!-- 任务时间线视图 -->
        <div class="task-timeline">
          <div class="timeline-header">
            <span>一学年任务时间线</span>
          </div>
          <div class="timeline-content">
            <div class="timeline-axis">
              <span class="axis-label">秋季学期</span>
              <span class="axis-label">寒假</span>
              <span class="axis-label">春季学期</span>
            </div>
            <div class="timeline-tasks">
              <div 
                v-for="(task, index) in filteredTasks" 
                :key="index" 
                class="timeline-task"
                :class="getTaskStatusClass(task.status)"
                :style="getTaskPosition(task)"
                @click="viewTaskDetail(task)"
              >
                <span class="task-name">{{ task.name }}</span>
                <span class="task-date">{{ task.dateRange.split(' ')[0] }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 任务列表 -->
        <div class="task-list-container">
          <div class="task-list-header">
            <span class="task-list-title">任务列表</span>
            <span class="task-count">共 {{ filteredTasks.length }} 个任务</span>
          </div>
          
          <div class="task-list">
            <div v-for="(task, index) in filteredTasks" :key="index" class="task-item">
              <div class="task-status-dot" :class="getTaskStatusClass(task.status)"></div>
              <div class="task-info">
                <div class="task-header">
                  <h5>{{ task.name }}</h5>
                  <span :class="['status-tag', getTaskStatusClass(task.status)]">{{ task.status }}</span>
                </div>
                <p class="task-meta">{{ task.dateRange }} | {{ task.grade }}</p>
                <p class="task-projects" v-if="task.projects">{{ task.projects }}</p>
              </div>
              <div class="task-actions">
                <el-button text size="small" @click="duplicateTask(task)">复制</el-button>
                <el-button text size="small" @click="editTask(task)">编辑</el-button>
                <el-button text size="small" :class="{ danger: task.status === '进行中' }" @click="toggleTask(task)">
                  {{ task.status === '进行中' ? '暂停' : task.status === '已暂停' ? '开启' : '开始' }}
                </el-button>
                <el-button text size="small" class="danger" @click="deleteTask(index)">删除</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="settings-section">
        <h4 class="section-title">数据管理</h4>
        
        <div class="data-settings">
          <div class="setting-item">
            <label class="setting-label">自动保存成绩</label>
            <el-switch v-model="settings.autoSave" />
          </div>
          
          <div class="setting-item">
            <label class="setting-label">成绩审核流程</label>
            <el-switch v-model="settings.requireReview" />
          </div>
          
          <div class="setting-item">
            <label class="setting-label">数据导出格式</label>
            <el-select v-model="settings.exportFormat">
              <el-option label="Excel (.xlsx)" value="xlsx" />
              <el-option label="CSV" value="csv" />
              <el-option label="PDF" value="pdf" />
            </el-select>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 添加任务弹窗 -->
    <el-dialog v-model="showAddTask" title="添加体测任务" width="600px">
      <div class="task-form">
        <div class="form-item">
          <label class="form-label">任务名称</label>
          <el-input v-model="newTask.name" placeholder="如：2025年秋季体测" />
        </div>
        <div class="form-item">
          <label class="form-label">学年</label>
          <el-select v-model="newTask.academicYear">
            <el-option label="2025-2026学年" value="2025-2026" />
            <el-option label="2024-2025学年" value="2024-2025" />
            <el-option label="2023-2024学年" value="2023-2024" />
          </el-select>
        </div>
        <div class="form-item">
          <label class="form-label">学期</label>
          <el-select v-model="newTask.semester">
            <el-option label="秋季学期" value="autumn" />
            <el-option label="春季学期" value="spring" />
          </el-select>
        </div>
        <div class="form-item">
          <label class="form-label">适用年级</label>
          <el-select v-model="newTask.grade" multiple>
            <el-option label="一年级" value="一年级" />
            <el-option label="二年级" value="二年级" />
            <el-option label="三年级" value="三年级" />
            <el-option label="四年级" value="四年级" />
            <el-option label="五年级" value="五年级" />
            <el-option label="六年级" value="六年级" />
          </el-select>
        </div>
        <div class="form-item">
          <label class="form-label">测试日期</label>
          <el-date-picker 
            v-model="newTask.dateRange" 
            type="daterange" 
            range-separator="至" 
            start-placeholder="开始日期" 
            end-placeholder="结束日期"
          />
        </div>
        <div class="form-item">
          <label class="form-label">测试项目</label>
          <el-select v-model="newTask.projects" multiple>
            <el-option label="BMI" value="BMI" />
            <el-option label="视力" value="视力" />
            <el-option label="50米跑" value="50米跑" />
            <el-option label="坐位体前屈" value="坐位体前屈" />
            <el-option label="仰卧起坐" value="仰卧起坐" />
            <el-option label="立定跳远" value="立定跳远" />
            <el-option label="跳绳" value="跳绳" />
            <el-option label="1000米跑" value="1000米跑" />
            <el-option label="800米跑" value="800米跑" />
          </el-select>
        </div>
        <div class="form-item">
          <label class="form-label">监考老师</label>
          <el-input v-model="newTask.teacher" placeholder="输入老师姓名" />
        </div>
        <div class="form-item">
          <label class="form-label">备注</label>
          <el-input v-model="newTask.remark" type="textarea" rows="3" placeholder="输入任务备注信息" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showAddTask = false">取消</el-button>
        <el-button type="primary" @click="addTask">确认添加</el-button>
      </template>
    </el-dialog>
    
    <!-- 批量创建任务弹窗 -->
    <el-dialog v-model="showBatchCreate" title="批量创建体测任务" width="700px">
      <div class="batch-form">
        <div class="form-item">
          <label class="form-label">选择模板</label>
          <el-select v-model="batchForm.template" @change="loadTemplate">
            <el-option label="标准学年任务" value="standard" />
            <el-option label="国家体测任务" value="national" />
            <el-option label="运动会选拔" value="sports" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </div>
        <div class="form-item">
          <label class="form-label">学年</label>
          <el-select v-model="batchForm.academicYear">
            <el-option label="2025-2026学年" value="2025-2026" />
            <el-option label="2024-2025学年" value="2024-2025" />
          </el-select>
        </div>
        <div class="form-item">
          <label class="form-label">适用年级</label>
          <el-select v-model="batchForm.grades" multiple>
            <el-option label="一年级" value="一年级" />
            <el-option label="二年级" value="二年级" />
            <el-option label="三年级" value="三年级" />
            <el-option label="四年级" value="四年级" />
            <el-option label="五年级" value="五年级" />
            <el-option label="六年级" value="六年级" />
          </el-select>
        </div>
        <div class="form-item">
          <label class="form-label">预览任务</label>
          <div class="preview-tasks">
            <div v-for="(task, index) in previewTasks" :key="index" class="preview-task">
              <span class="preview-name">{{ task.name }}</span>
              <span class="preview-date">{{ task.dateRange }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showBatchCreate = false">取消</el-button>
        <el-button type="primary" @click="batchCreateTasks">确认创建</el-button>
      </template>
    </el-dialog>
    
    <!-- 导入任务弹窗 -->
    <el-dialog v-model="showImport" title="导入体测任务" width="600px">
      <div class="import-form">
        <div class="upload-area">
          <div class="upload-icon">
            <Upload />
          </div>
          <p class="upload-text">点击或拖拽Excel文件到此处上传</p>
          <p class="upload-hint">支持 .xlsx, .xls 格式</p>
          <el-button type="primary" size="small" @click="downloadTemplate">下载模板</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="showImport = false">取消</el-button>
        <el-button type="primary" @click="importTasks">导入</el-button>
      </template>
    </el-dialog>
    
    <!-- 任务详情弹窗 -->
    <el-dialog v-model="showTaskDetail" title="任务详情" width="600px">
      <div v-if="selectedTask" class="task-detail">
        <div class="detail-row">
          <span class="detail-label">任务名称</span>
          <span class="detail-value">{{ selectedTask.name }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">学年学期</span>
          <span class="detail-value">{{ selectedTask.academicYear }} {{ selectedTask.semester === 'autumn' ? '秋季学期' : '春季学期' }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">适用年级</span>
          <span class="detail-value">{{ selectedTask.grade }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">测试日期</span>
          <span class="detail-value">{{ selectedTask.dateRange }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">测试项目</span>
          <span class="detail-value">{{ selectedTask.projects }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">监考老师</span>
          <span class="detail-value">{{ selectedTask.teacher }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">状态</span>
          <span :class="['status-tag', getTaskStatusClass(selectedTask.status)]">{{ selectedTask.status }}</span>
        </div>
        <div class="detail-row" v-if="selectedTask.remark">
          <span class="detail-label">备注</span>
          <span class="detail-value">{{ selectedTask.remark }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="showTaskDetail = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue'
import { Calendar, Clock, Grid, Plus, Upload } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

const settings = reactive({
  startDate: '',
  endDate: '',
  startTime: '',
  endTime: '',
  restMinutes: 10,
  
  bookingMode: 'free',
  classLimit: 30,
  bookingOpenDays: 7,
  
  enableAI: true,
  cameraCount: 2,
  retestCount: 2,
  voicePrompt: true,
  
  autoSave: true,
  requireReview: true,
  exportFormat: 'xlsx'
})

const saveSettings = () => {
}

// 筛选条件
const selectedAcademicYear = ref('all')
const selectedSemester = ref('all')
const selectedStatus = ref('all')

// 体测任务列表
const taskList = ref([
  { name: '2025-2026学年秋季学期体检', dateRange: '2025-09-01 至 2025-09-15', grade: '全体年级', status: '已结束', academicYear: '2025-2026', semester: 'autumn', projects: 'BMI、视力', teacher: '张老师' },
  { name: '2025-2026学年秋季学期体能测试', dateRange: '2025-10-10 至 2025-10-25', grade: '三年级、四年级、五年级', status: '已结束', academicYear: '2025-2026', semester: 'autumn', projects: '50米跑、立定跳远、仰卧起坐', teacher: '李老师' },
  { name: '2025-2026学年春季学期国家体测', dateRange: '2025-04-15 至 2025-05-20', grade: '三年级、四年级、五年级', status: '进行中', academicYear: '2025-2026', semester: 'spring', projects: 'BMI、视力、50米跑、坐位体前屈、仰卧起坐、立定跳远', teacher: '王老师' },
  { name: '2025-2026学年春季学期跳绳比赛选拔', dateRange: '2025-05-25 至 2025-06-05', grade: '一年级、二年级', status: '未开始', academicYear: '2025-2026', semester: 'spring', projects: '跳绳', teacher: '赵老师' },
  { name: '2024-2025学年秋季学期运动会选拔', dateRange: '2024-09-01 至 2024-09-15', grade: '全体年级', status: '已结束', academicYear: '2024-2025', semester: 'autumn', projects: '50米跑、1000米跑、立定跳远', teacher: '张老师' },
  { name: '2024-2025学年春季学期体测补测', dateRange: '2025-03-10 至 2025-03-20', grade: '四年级、五年级', status: '已结束', academicYear: '2024-2025', semester: 'spring', projects: '全部项目', teacher: '李老师' },
  { name: '2025-2026学年春季学期毕业体测', dateRange: '2025-06-10 至 2025-06-20', grade: '六年级', status: '未开始', academicYear: '2025-2026', semester: 'spring', projects: 'BMI、视力、50米跑、坐位体前屈、仰卧起坐、立定跳远、800米跑', teacher: '王老师' }
])

// 筛选后的任务列表
const filteredTasks = computed(() => {
  return taskList.value.filter(task => {
    const yearMatch = selectedAcademicYear.value === 'all' || task.academicYear === selectedAcademicYear.value
    const semesterMatch = selectedSemester.value === 'all' || task.semester === selectedSemester.value
    const statusMatch = selectedStatus.value === 'all' || task.status === selectedStatus.value
    return yearMatch && semesterMatch && statusMatch
  })
})

// 添加任务弹窗
const showAddTask = ref(false)
const showBatchCreate = ref(false)
const showImport = ref(false)
const showTaskDetail = ref(false)

// 当前选中的任务
const selectedTask = ref(null)

// 新任务表单
const newTask = reactive({
  name: '',
  academicYear: '2025-2026',
  semester: 'spring',
  grade: [],
  dateRange: '',
  projects: [],
  teacher: '',
  remark: ''
})

// 批量创建表单
const batchForm = reactive({
  template: 'standard',
  academicYear: '2025-2026',
  grades: []
})

// 预览任务列表
const previewTasks = ref([])

// 加载模板
const loadTemplate = () => {
  const year = batchForm.academicYear
  previewTasks.value = []
  
  if (batchForm.template === 'standard') {
    previewTasks.value = [
      { name: `${year}秋季学期体检`, dateRange: `${year.split('-')[0]}-09-01 至 ${year.split('-')[0]}-09-15` },
      { name: `${year}秋季学期体能测试`, dateRange: `${year.split('-')[0]}-10-10 至 ${year.split('-')[0]}-10-25` },
      { name: `${year}春季学期国家体测`, dateRange: `${year.split('-')[1]}-04-15 至 ${year.split('-')[1]}-05-20` },
      { name: `${year}春季学期毕业体测`, dateRange: `${year.split('-')[1]}-06-10 至 ${year.split('-')[1]}-06-20` }
    ]
  } else if (batchForm.template === 'national') {
    previewTasks.value = [
      { name: `${year}国家学生体质健康标准测试(秋季)`, dateRange: `${year.split('-')[0]}-11-01 至 ${year.split('-')[0]}-11-30` },
      { name: `${year}国家学生体质健康标准测试(春季补测)`, dateRange: `${year.split('-')[1]}-04-01 至 ${year.split('-')[1]}-04-30` }
    ]
  } else if (batchForm.template === 'sports') {
    previewTasks.value = [
      { name: `${year}秋季运动会选拔`, dateRange: `${year.split('-')[0]}-09-01 至 ${year.split('-')[0]}-09-15` },
      { name: `${year}春季运动会选拔`, dateRange: `${year.split('-')[1]}-03-01 至 ${year.split('-')[1]}-03-15` }
    ]
  }
}

// 添加任务
const addTask = () => {
  if (!newTask.name) {
    ElMessage.warning('请输入任务名称')
    return
  }
  if (!newTask.grade || newTask.grade.length === 0) {
    ElMessage.warning('请选择适用年级')
    return
  }
  if (!newTask.dateRange) {
    ElMessage.warning('请选择测试日期')
    return
  }
  
  taskList.value.unshift({
    name: newTask.name,
    academicYear: newTask.academicYear,
    semester: newTask.semester,
    dateRange: `${newTask.dateRange[0]} 至 ${newTask.dateRange[1]}`,
    grade: newTask.grade.join('、'),
    status: '未开始',
    projects: newTask.projects.join('、'),
    teacher: newTask.teacher,
    remark: newTask.remark
  })
  
  // 重置表单
  newTask.name = ''
  newTask.academicYear = '2025-2026'
  newTask.semester = 'spring'
  newTask.grade = []
  newTask.dateRange = ''
  newTask.projects = []
  newTask.teacher = ''
  newTask.remark = ''
  
  showAddTask.value = false
  ElMessage.success('任务添加成功')
}

// 批量创建任务
const batchCreateTasks = () => {
  if (!batchForm.grades || batchForm.grades.length === 0) {
    ElMessage.warning('请选择适用年级')
    return
  }
  
  const newTasks = []
  previewTasks.value.forEach(task => {
    newTasks.push({
      name: task.name,
      academicYear: batchForm.academicYear,
      semester: task.name.includes('秋季') ? 'autumn' : 'spring',
      dateRange: task.dateRange,
      grade: batchForm.grades.join('、'),
      status: '未开始',
      projects: batchForm.template === 'national' ? 'BMI、视力、50米跑、坐位体前屈、仰卧起坐、立定跳远' : 
                batchForm.template === 'sports' ? '50米跑、1000米跑、立定跳远' : 'BMI、视力',
      teacher: '',
      remark: ''
    })
  })
  taskList.value.unshift(...newTasks)
  
  showBatchCreate.value = false
  ElMessage.success(`已批量创建 ${previewTasks.value.length} 个任务`)
}

// 复制任务
const duplicateTask = (task) => {
  const newTask = {
    ...task,
    name: `${task.name}(复制)`,
    status: '未开始',
    dateRange: task.dateRange.replace(/\d{4}-\d{2}-\d{2}/g, '2025-09-01')
  }
  taskList.value.unshift(newTask)
  ElMessage.success('任务已复制')
}

// 编辑任务
const editTask = (task) => {
  ElMessage.info('编辑功能开发中')
}

// 切换任务状态
const toggleTask = (task) => {
  if (task.status === '进行中') {
    task.status = '已暂停'
  } else if (task.status === '已暂停') {
    task.status = '进行中'
  } else {
    task.status = '进行中'
  }
  ElMessage.success(`任务${task.status}`)
}

// 删除任务
const deleteTask = (index) => {
  taskList.value.splice(index, 1)
  ElMessage.success('任务已删除')
}

// 查看任务详情
const viewTaskDetail = (task) => {
  selectedTask.value = task
  showTaskDetail.value = true
}

// 获取任务状态样式类
const getTaskStatusClass = (status) => {
  switch (status) {
    case '进行中': return 'status-active'
    case '已暂停': return 'status-paused'
    case '已结束': return 'status-completed'
    default: return 'status-pending'
  }
}

// 获取任务在时间线上的位置
const getTaskPosition = (task) => {
  const date = task.dateRange.split(' ')[0]
  const month = parseInt(date.split('-')[1])
  // 9-12月为秋季学期(0-50%), 1-2月为寒假(50-60%), 3-6月为春季学期(60-100%)
  let position
  if (month >= 9 && month <= 12) {
    position = ((month - 9) / 3) * 45 + 2
  } else if (month >= 1 && month <= 2) {
    position = 52 + ((month - 1) / 2) * 6
  } else if (month >= 3 && month <= 6) {
    position = 60 + ((month - 3) / 3) * 38
  } else {
    position = 50
  }
  return { left: `${position}%` }
}

// 导入任务
const importTasks = () => {
  ElMessage.info('导入功能开发中')
  showImport.value = false
}

// 下载模板
const downloadTemplate = () => {
  ElMessage.info('模板下载功能开发中')
}
</script>

<style scoped>
.test-settings-container {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.settings-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #E8EAED;
}

.settings-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0;
}

.settings-content {
  padding: 20px;
}

.settings-section {
  margin-bottom: 24px;
}

.settings-section:last-child {
  margin-bottom: 0;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 16px 0;
}

.time-settings, .device-settings, .data-settings {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.setting-label {
  width: 140px;
  font-size: 13px;
  color: #6B7280;
}

.time-range {
  display: flex;
  align-items: center;
  gap: 8px;
}

.time-separator {
  color: #6B7280;
}

.unit {
  font-size: 13px;
  color: #6B7280;
}

.mode-settings {
  display: flex;
  gap: 16px;
  margin-bottom: 20px;
}

.mode-option {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border: 2px solid #E8EAED;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-option:hover {
  border-color: #1E5AA8;
}

.mode-option.active {
  border-color: #1E5AA8;
  background: #EEF6FF;
}

.mode-icon {
  width: 40px;
  height: 40px;
  background: #F7F8FA;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1E5AA8;
}

.mode-info h5 {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 4px 0;
}

.mode-info p {
  font-size: 12px;
  color: #6B7280;
  margin: 0;
}

.booking-options {
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
  display: flex;
  gap: 24px;
}

/* 任务列表 */
.task-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-list-title {
  font-size: 13px;
  color: #6B7280;
}

.task-list {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 8px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: #FFFFFF;
  border-radius: 6px;
  margin-bottom: 8px;
}

.task-item:last-child {
  margin-bottom: 0;
}

.task-info h5 {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 4px 0;
}

.task-info p {
  font-size: 12px;
  color: #6B7280;
  margin: 0;
}

.task-actions {
  display: flex;
  gap: 8px;
}

.task-actions .danger {
  color: #E85D4E;
}

/* 任务筛选栏 */
.task-filter-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  flex-wrap: wrap;
}

.filter-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: #6B7280;
}

.year-select {
  width: 160px;
}

/* 任务操作栏 */
.task-actions-bar {
  display: flex;
  gap: 12px;
  margin-bottom: 20px;
}

/* 任务时间线 */
.task-timeline {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.timeline-header {
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 16px;
}

.timeline-content {
  position: relative;
  padding-left: 20px;
}

.timeline-axis {
  position: relative;
  display: flex;
  justify-content: space-between;
  padding-bottom: 16px;
  border-bottom: 2px solid #E8EAED;
}

.timeline-axis::before {
  content: '';
  position: absolute;
  top: 50%;
  left: -20px;
  right: 0;
  height: 2px;
  background: #E8EAED;
  transform: translateY(-50%);
}

.axis-label {
  font-size: 11px;
  color: #9CA3AF;
  position: relative;
}

.axis-label::before {
  content: '';
  position: absolute;
  top: -8px;
  left: 50%;
  width: 12px;
  height: 12px;
  background: #E8EAED;
  border-radius: 50%;
  transform: translateX(-50%);
}

.timeline-tasks {
  position: relative;
  padding-top: 16px;
}

.timeline-task {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  background: #FFFFFF;
  border: 1px solid #E8EAED;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 1;
}

.timeline-task:hover {
  transform: translateX(-50%) scale(1.05);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timeline-task .task-name {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #1A1A2E;
  white-space: nowrap;
}

.timeline-task .task-date {
  display: block;
  font-size: 10px;
  color: #9CA3AF;
}

.timeline-task.status-active {
  border-color: #1E5AA8;
  background: #EEF6FF;
}

.timeline-task.status-active .task-name {
  color: #1E5AA8;
}

.timeline-task.status-pending {
  border-color: #F5A623;
  background: #FFFBEB;
}

.timeline-task.status-pending .task-name {
  color: #F5A623;
}

.timeline-task.status-completed {
  border-color: #E8EAED;
  opacity: 0.7;
}

/* 任务列表容器 */
.task-list-container {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 16px;
}

.task-list-container .task-list-header {
  margin-bottom: 12px;
}

.task-count {
  font-size: 12px;
  color: #9CA3AF;
}

/* 任务项 */
.task-list-container .task-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  margin-bottom: 8px;
}

.task-status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.task-status-dot.status-active {
  background: #1E5AA8;
}

.task-status-dot.status-pending {
  background: #F5A623;
}

.task-status-dot.status-completed {
  background: #9CA3AF;
}

.task-status-dot.status-paused {
  background: #E85D4E;
}

.task-list-container .task-info {
  flex: 1;
  min-width: 0;
}

.task-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.task-header h5 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.status-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
}

.status-tag.status-active {
  background: #DCFCE7;
  color: #166534;
}

.status-tag.status-pending {
  background: #FEF3C7;
  color: #92400E;
}

.status-tag.status-completed {
  background: #F3F4F6;
  color: #6B7280;
}

.status-tag.status-paused {
  background: #FEE2E2;
  color: #991B1B;
}

.task-meta {
  font-size: 12px;
  color: #6B7280;
  margin: 0;
}

.task-projects {
  font-size: 12px;
  color: #9CA3AF;
  margin: 4px 0 0;
}

/* 批量表单 */
.batch-form {
  padding: 16px 0;
}

.preview-tasks {
  background: #F7F8FA;
  border-radius: 6px;
  padding: 12px;
  max-height: 200px;
  overflow-y: auto;
}

.preview-task {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid #E8EAED;
}

.preview-task:last-child {
  border-bottom: none;
}

.preview-name {
  font-size: 13px;
  color: #1A1A2E;
}

.preview-date {
  font-size: 12px;
  color: #6B7280;
}

/* 导入表单 */
.import-form {
  padding: 16px 0;
}

.upload-area {
  border: 2px dashed #E8EAED;
  border-radius: 8px;
  padding: 32px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.upload-area:hover {
  border-color: #1E5AA8;
  background: #F0FDF4;
}

.upload-icon {
  width: 48px;
  height: 48px;
  margin: 0 auto 12px;
  background: #F7F8FA;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1E5AA8;
}

.upload-text {
  font-size: 14px;
  color: #1A1A2E;
  margin: 0 0 4px 0;
}

.upload-hint {
  font-size: 12px;
  color: #9CA3AF;
  margin: 0 0 16px 0;
}

/* 任务详情 */
.task-detail {
  padding: 16px 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom: 1px solid #E8EAED;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 13px;
  color: #6B7280;
}

.detail-value {
  font-size: 13px;
  color: #1A1A2E;
  font-weight: 500;
}

/* 任务表单 */
.task-form {
  padding: 16px 0;
}

.form-item {
  margin-bottom: 16px;
}

.form-item:last-child {
  margin-bottom: 0;
}

.form-label {
  display: block;
  font-size: 13px;
  color: #6B7280;
  margin-bottom: 8px;
}
</style>