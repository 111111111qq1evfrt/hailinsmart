<template>
  <div class="report-management-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索举报内容/举报人"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
        />
        <el-select v-model="filterStatus" placeholder="处理状态" clearable style="width: 140px">
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已办结" value="resolved" />
          <el-option label="已驳回" value="rejected" />
        </el-select>
        <el-select v-model="filterType" placeholder="举报类型" clearable style="width: 140px">
          <el-option label="违规行为" value="violation" />
          <el-option label="设施损坏" value="facility" />
          <el-option label="教师投诉" value="teacher" />
          <el-option label="学生冲突" value="conflict" />
          <el-option label="其他" value="other" />
        </el-select>
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="refreshData">刷新</el-button>
        <el-button :icon="Download" @click="exportData">导出记录</el-button>
        <el-button type="primary" :icon="Plus" @click="createReport">新建举报</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ stats.total }}</span>
        <span class="stat-label">总举报数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #F5A623">{{ stats.pending }}</span>
        <span class="stat-label">待处理</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" style="color: #3B82F6">{{ stats.processing }}</span>
        <span class="stat-label">处理中</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num text-primary">{{ stats.resolved }}</span>
        <span class="stat-label">已办结</span>
      </div>
    </div>

    <!-- 列表区域 -->
    <div class="list-card">
      <div class="card-header">
        <span class="card-title">举报记录列表</span>
        <div class="header-actions">
          <el-input
            v-model="searchQuery"
            placeholder="搜索"
            clearable
            style="width: 200px"
            :prefix-icon="Search"
            size="small"
          />
          <el-button text :icon="Refresh" @click="refreshData">刷新</el-button>
        </div>
      </div>
      <el-table :data="paginatedReports || []" stripe class="w-full" :height="500">
        <el-table-column prop="id" label="举报编号" width="140" />
        <el-table-column prop="type" label="举报类型" width="120">
          <template #default="{ row }">
            <span class="status-tag" :class="getTypeClass(row.type)">
              {{ getTypeText(row.type) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="举报标题" min-width="200" />
        <el-table-column prop="reporter" label="举报人" width="100" />
        <el-table-column prop="reporterType" label="举报人类别" width="120">
          <template #default="{ row }">
            <span class="type-badge">{{ row.reporterType === 'student' ? '学生' : row.reporterType === 'parent' ? '家长' : '教职工' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="举报时间" width="140" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <span class="status-tag" :class="getStatusClass(row.status)">
              {{ getStatusText(row.status) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }">
            <el-tag :type="row.priority === 'high' ? 'danger' : row.priority === 'medium' ? 'warning' : 'info'" size="small">
              {{ row.priority === 'high' ? '高' : row.priority === 'medium' ? '中' : '低' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="viewDetail(row)">查看详情</el-button>
            <el-button v-if="row.status === 'pending'" text type="primary" size="small" @click="startProcess(row)">开始处理</el-button>
            <el-button v-if="row.status === 'processing'" text type="success" size="small" @click="completeProcess(row)">完成处理</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="(filteredReports || []).length"
          :page-sizes="[8, 12, 16]"
          layout="total, sizes, prev, pager, next"
          small
        />
      </div>
    </div>

    <!-- 详情弹窗 -->
    <el-dialog v-model="showDetail" title="举报详情" width="700px">
      <div v-if="currentReport" class="detail-content">
        <div class="detail-section">
          <h4 class="section-title">基本信息</h4>
          <div class="detail-row">
            <span class="detail-label">举报编号</span>
            <span>{{ currentReport.id }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">举报类型</span>
            <span class="type-badge" :class="currentReport.type">{{ getTypeText(currentReport.type) }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">举报标题</span>
            <span>{{ currentReport.title }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">举报人</span>
            <span>{{ currentReport.reporter }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">举报人类别</span>
            <span>{{ currentReport.reporterType === 'student' ? '学生' : currentReport.reporterType === 'parent' ? '家长' : '教职工' }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">联系方式</span>
            <span>{{ currentReport.contact }}</span>
          </div>
          <div class="detail-row">
            <span class="detail-label">举报时间</span>
            <span>{{ currentReport.createTime }}</span>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="section-title">举报内容</h4>
          <div class="report-content">
            {{ currentReport.content }}
          </div>
        </div>

        <div v-if="currentReport.attachments?.length" class="detail-section">
          <h4 class="section-title">附件材料</h4>
          <div class="attachment-list">
            <div v-for="(file, idx) in currentReport.attachments" :key="idx" class="attachment-item">
              <span class="file-icon"><el-icon :size="16" color="#1E5AA8"><component :is="getFileIcon(file.type)" /></el-icon></span>
              <span class="file-name">{{ file.name }}</span>
              <span class="file-size">{{ file.size }}</span>
              <el-button link type="primary" size="small">预览</el-button>
            </div>
          </div>
        </div>

        <div class="detail-section">
          <h4 class="section-title">处理进度</h4>
          <el-timeline>
            <el-timeline-item
              v-for="(step, idx) in currentReport.processSteps"
              :key="idx"
              :timestamp="step.time"
              :color="step.status === 'done' ? 'green' : step.status === 'current' ? 'blue' : 'gray'"
            >
              <div class="timeline-content">
                <div class="step-title">{{ step.title }}</div>
                <div class="step-desc">{{ step.description }}</div>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <div v-if="currentReport.status !== 'pending'" class="detail-section">
          <h4 class="section-title">处理结果</h4>
          <div class="process-result">
            <el-tag :type="currentReport.status === 'resolved' ? 'success' : 'danger'" size="large">
              {{ currentReport.status === 'resolved' ? '已办结' : '已驳回' }}
            </el-tag>
            <div v-if="currentReport.processResult" class="result-content">
              <p><strong>处理意见：</strong>{{ currentReport.processResult }}</p>
              <p><strong>处理人：</strong>{{ currentReport.handler }}</p>
              <p><strong>处理时间：</strong>{{ currentReport.processTime }}</p>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetail = false">关闭</el-button>
        <template v-if="currentReport?.status === 'pending'">
          <el-button type="primary" @click="startProcess(currentReport)">开始处理</el-button>
        </template>
        <template v-else-if="currentReport?.status === 'processing'">
          <el-button type="success" @click="showCompleteDialog = true">完成处理</el-button>
        </template>
      </template>
    </el-dialog>

    <!-- 完成处理弹窗 -->
    <el-dialog v-model="showCompleteDialog" title="完成处理" width="500px">
      <el-form :model="processForm" label-width="80px">
        <el-form-item label="处理结果">
          <el-radio-group v-model="processForm.result">
            <el-radio label="resolved">已办结</el-radio>
            <el-radio label="rejected">驳回</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="处理意见">
          <el-input
            v-model="processForm.comment"
            type="textarea"
            :rows="4"
            placeholder="请输入处理意见..."
          />
        </el-form-item>
        <el-form-item label="处理人">
          <el-input v-model="processForm.handler" placeholder="请输入处理人姓名" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCompleteDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmComplete">确认处理</el-button>
      </template>
    </el-dialog>

    <!-- 新建举报弹窗 -->
    <el-dialog v-model="showCreateDialog" title="新建举报" width="600px">
      <el-form :model="createForm" label-width="100px">
        <el-form-item label="举报类型">
          <el-select v-model="createForm.type" placeholder="请选择举报类型" class="w-full">
            <el-option label="违规行为" value="violation" />
            <el-option label="设施损坏" value="facility" />
            <el-option label="教师投诉" value="teacher" />
            <el-option label="学生冲突" value="conflict" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="举报标题">
          <el-input v-model="createForm.title" placeholder="请输入举报标题" />
        </el-form-item>
        <el-form-item label="举报内容">
          <el-input
            v-model="createForm.content"
            type="textarea"
            :rows="4"
            placeholder="请详细描述举报内容..."
          />
        </el-form-item>
        <el-form-item label="举报人">
          <el-input v-model="createForm.reporter" placeholder="请输入举报人姓名" />
        </el-form-item>
        <el-form-item label="举报人类别">
          <el-select v-model="createForm.reporterType" placeholder="请选择举报人类别" class="w-full">
            <el-option label="学生" value="student" />
            <el-option label="家长" value="parent" />
            <el-option label="教职工" value="staff" />
          </el-select>
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="createForm.contact" placeholder="请输入联系电话" />
        </el-form-item>
        <el-form-item label="附件上传">
          <el-upload drag action="/upload" :auto-upload="false">
            <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
            <div class="el-upload__text">
              将文件拖到此处，或 <em>点击上传</em>
            </div>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="submitCreate">提交举报</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { Plus, Download, Search, Refresh, UploadFilled, Picture, Document, Edit, Histogram, Link } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { usePersistedRef } from '@/composables'
import store from '@/store/global'
import { mockDB } from '@/mock'
import { generateDeterministicId } from '@/utils/seededRandom'

const searchQuery = ref('')
const filterStatus = ref('')
const filterType = ref('')
const showDetail = ref(false)
const showCompleteDialog = ref(false)
const showCreateDialog = ref(false)
const currentReport = ref(null)
const currentPage = ref(1)
const pageSize = ref(12)

const processForm = ref({
  result: 'resolved',
  comment: '',
  handler: ''
})

const createForm = ref({
  type: '',
  title: '',
  content: '',
  reporter: '',
  reporterType: '',
  contact: ''
})

const stats = computed(() => {
  const data = reports.value || []
  return {
    total: data.length || 45,
    pending: data.filter(r => r.status === 'pending').length || 12,
    processing: data.filter(r => r.status === 'processing').length || 8,
    resolved: data.filter(r => r.status === 'resolved').length || 25
  }
})

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const defaultReports = computed(() => {
  const sid = schoolId.value
  const teachers = mockDB[sid]?.teachers || []
  const students = mockDB[sid]?.students || []
  const t = (i) => teachers[i % teachers.length]?.name || '张老师'
  const s = (i) => students[i % students.length]?.name || '某同学'

  // 三个学校完全不同的举报数据
  if (sid === 'hailin-zirong-primary') {
    // 子荣小学：以设施和安全类举报为主
    return [
      { id: 'JB-ZR-001', type: 'facility', title: '操场跑道地面开裂', content: '操场西侧跑道出现多处裂缝，学生跑步时容易绊倒。', reporter: t(0), reporterType: 'staff', contact: '13900139001', priority: 'high', status: 'pending', createTime: '2026-01-16 08:30', attachments: [{ name: '裂缝照片.jpg', type: 'image', size: '2.1MB' }], processSteps: [{ title: '举报提交', time: '2026-01-16 08:30', status: 'done' }, { title: '待审核', time: '', status: 'current' }] },
      { id: 'JB-ZR-002', type: 'safety', title: '教学楼消防通道被占用', content: '二楼消防通道堆放了大量桌椅，影响紧急疏散。', reporter: t(1), reporterType: 'staff', contact: '13900139002', priority: 'high', status: 'processing', createTime: '2026-01-15 14:20', attachments: [], processSteps: [{ title: '举报提交', time: '2026-01-15 14:20', status: 'done' }, { title: '已派单处理', time: '2026-01-15 15:00', status: 'current' }] },
      { id: 'JB-ZR-003', type: 'facility', title: '厕所水管漏水', content: '一楼女厕所水管破裂，地面积水严重。', reporter: s(2), reporterType: 'student', contact: '13900139003', priority: 'medium', status: 'resolved', createTime: '2026-01-14 11:00', attachments: [], processSteps: [{ title: '举报提交', time: '2026-01-14 11:00', status: 'done' }, { title: '维修完成', time: '2026-01-14 16:00', status: 'done' }], processResult: '已修复水管，地面清理干净。', handler: '后勤组', processTime: '2026-01-14 16:00' },
      { id: 'JB-ZR-004', type: 'safety', title: '校门口交通隐患', content: '放学时段校门口车辆乱停，学生过马路危险。', reporter: (s(3) || '某').charAt(0) + '家长', reporterType: 'parent', contact: '13900139004', priority: 'high', status: 'pending', createTime: '2026-01-15 17:30', attachments: [], processSteps: [{ title: '举报提交', time: '2026-01-15 17:30', status: 'done' }, { title: '待审核', time: '', status: 'current' }] },
      { id: 'JB-ZR-005', type: 'facility', title: '教室灯管闪烁', content: '三年级教室日光灯频繁闪烁，影响学生视力。', reporter: t(2), reporterType: 'staff', contact: '13900139005', priority: 'medium', status: 'resolved', createTime: '2026-01-13 09:15', attachments: [], processSteps: [{ title: '举报提交', time: '2026-01-13 09:15', status: 'done' }, { title: '已更换灯管', time: '2026-01-13 14:00', status: 'done' }], processResult: '已更换全部老化灯管。', handler: '电工师傅', processTime: '2026-01-13 14:00' },
    ]
  } else if (sid === 'linhai-experimental-primary') {
    // 林海实验小学：以建议和教学类举报为主
    return [
      { id: 'JB-LH-001', type: 'suggestion', title: '建议增加课后体育兴趣班', content: '希望学校能开设篮球、足球等课后兴趣班，丰富学生课余生活。', reporter: '学生会', reporterType: 'student', contact: '13800138011', priority: 'low', status: 'processing', createTime: '2026-01-16 10:00', attachments: [], processSteps: [{ title: '建议提交', time: '2026-01-16 10:00', status: 'done' }, { title: '教务处评估中', time: '2026-01-16 14:00', status: 'current' }] },
      { id: 'JB-LH-002', type: 'teaching', title: '反映体育课内容单一', content: '孩子反映体育课总是跑步，希望能增加球类和体操等内容。', reporter: (s(0) || '某').charAt(0) + '家长', reporterType: 'parent', contact: '13800138012', priority: 'medium', status: 'pending', createTime: '2026-01-15 19:30', attachments: [], processSteps: [{ title: '举报提交', time: '2026-01-15 19:30', status: 'done' }, { title: '待审核', time: '', status: 'current' }] },
      { id: 'JB-LH-003', type: 'suggestion', title: '建议举办校际体育交流赛', content: '希望与周边学校开展体育友谊赛，提升学生竞技水平和团队意识。', reporter: t(0), reporterType: 'staff', contact: '13800138013', priority: 'low', status: 'resolved', createTime: '2026-01-12 15:00', attachments: [], processSteps: [{ title: '建议提交', time: '2026-01-12 15:00', status: 'done' }, { title: '已采纳并列入计划', time: '2026-01-13 10:00', status: 'done' }], processResult: '已纳入本学期校际交流计划，预计3月举办。', handler: '教务处', processTime: '2026-01-13 10:00' },
      { id: 'JB-LH-004', type: 'other', title: '食堂菜品建议', content: '建议食堂增加蔬菜种类，部分学生反映蔬菜品种太少。', reporter: s(4), reporterType: 'student', contact: '13800138014', priority: 'low', status: 'processing', createTime: '2026-01-14 12:30', attachments: [], processSteps: [{ title: '建议提交', time: '2026-01-14 12:30', status: 'done' }, { title: '后勤处评估中', time: '2026-01-14 15:00', status: 'current' }] },
      { id: 'JB-LH-005', type: 'teaching', title: '作业量偏多', content: '多位家长反映近期作业量偏多，孩子写到很晚。', reporter: '家长委员会', reporterType: 'parent', contact: '13800138015', priority: 'medium', status: 'pending', createTime: '2026-01-16 20:00', attachments: [], processSteps: [{ title: '举报提交', time: '2026-01-16 20:00', status: 'done' }, { title: '待审核', time: '', status: 'current' }] },
      { id: 'JB-LH-006', type: 'suggestion', title: '建议开放周末图书馆', content: '希望周末能开放学校图书馆，方便学生借阅。', reporter: s(5), reporterType: 'student', contact: '13800138016', priority: 'low', status: 'resolved', createTime: '2026-01-10 09:00', attachments: [], processSteps: [{ title: '建议提交', time: '2026-01-10 09:00', status: 'done' }, { title: '已实施', time: '2026-01-11 10:00', status: 'done' }], processResult: '已安排周末图书馆值班，即日起开放。', handler: '图书馆', processTime: '2026-01-11 10:00' },
    ]
  } else {
    // 海林市第二小学：以违规和纪律类举报为主
    return [
      { id: 'JB-HL-001', type: 'violation', title: '发现学生在操场吸烟', content: '今天下午放学后，我在操场角落发现有几名学生聚集吸烟，严重违反校规校纪。', reporter: t(3), reporterType: 'staff', contact: '13303634456', priority: 'high', status: 'pending', createTime: '2026-01-15 16:30', attachments: [{ name: '现场照片1.jpg', type: 'image', size: '2.3MB' }, { name: '现场照片2.jpg', type: 'image', size: '1.8MB' }], processSteps: [{ title: '举报提交', time: '2026-01-15 16:30', status: 'done' }, { title: '待审核', time: '', status: 'current' }] },
      { id: 'JB-HL-002', type: 'conflict', title: `学生间发生肢体冲突`, content: `昨天下午课间，${s(0)}和${s(1)}因小事发生争执并动手，造成轻微擦伤。`, reporter: (s(0) || '某').charAt(0) + '家长', reporterType: 'parent', contact: '13945357355', priority: 'high', status: 'resolved', createTime: '2026-01-13 09:00', attachments: [], processSteps: [{ title: '举报提交', time: '2026-01-13 09:00', status: 'done' }, { title: '调查核实', time: '2026-01-13 10:00', status: 'done' }, { title: '双方调解', time: '2026-01-13 15:00', status: 'done' }, { title: '处理完成', time: '2026-01-13 16:30', status: 'done' }], processResult: '经调查属实，双方达成和解，涉事学生已批评教育。', handler: '德育处', processTime: '2026-01-13 16:30' },
      { id: 'JB-HL-003', type: 'violation', title: '学生携带手机进校园', content: '多名学生违反规定携带手机进入教室，影响课堂秩序。', reporter: t(1), reporterType: 'staff', contact: '15046301567', priority: 'medium', status: 'processing', createTime: '2026-01-14 08:30', attachments: [], processSteps: [{ title: '举报提交', time: '2026-01-14 08:30', status: 'done' }, { title: '班主任排查中', time: '2026-01-14 10:00', status: 'current' }] },
      { id: 'JB-HL-004', type: 'teacher', title: '教师体罚学生', content: '我孩子反映数学老师经常体罚学生，用戒尺打手，希望学校调查处理。', reporter: (s(2) || '某').charAt(0) + '家长', reporterType: 'parent', contact: '15245370456', priority: 'high', status: 'rejected', createTime: '2026-01-12 18:00', attachments: [], processSteps: [{ title: '举报提交', time: '2026-01-12 18:00', status: 'done' }, { title: '调查核实', time: '2026-01-13 09:00', status: 'done' }, { title: '举报驳回', time: '2026-01-13 16:00', status: 'done' }], processResult: '经调查不属实，教师使用教具进行教学演示。', handler: '张校长', processTime: '2026-01-13 16:00' },
      { id: 'JB-HL-005', type: 'facility', title: '教学楼卫生间漏水', content: '教学楼三楼男卫生间漏水严重，地面湿滑。', reporter: s(3), reporterType: 'student', contact: '15945716146', priority: 'medium', status: 'resolved', createTime: '2026-01-11 14:30', attachments: [{ name: '漏水照片.jpg', type: 'image', size: '3.2MB' }], processSteps: [{ title: '举报提交', time: '2026-01-11 14:30', status: 'done' }, { title: '维修完成', time: '2026-01-12 10:00', status: 'done' }], processResult: '已修复漏水问题。', handler: '后勤处', processTime: '2026-01-12 10:00' },
    ]
  }
})

// 使用持久化存储，每个学校独立数据
const reports = usePersistedRef(computed(() => `reports_${schoolId.value}`), defaultReports.value)

const filteredReports = computed(() => {
  return reports.value.filter(report => {
    const matchSearch = !searchQuery.value ||
      report.title.includes(searchQuery.value) ||
      report.reporter.includes(searchQuery.value) ||
      report.content.includes(searchQuery.value)
    const matchStatus = !filterStatus.value || report.status === filterStatus.value
    const matchType = !filterType.value || report.type === filterType.value
    return matchSearch && matchStatus && matchType
  })
})

const paginatedReports = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return (filteredReports.value || []).slice(start, end)
})

const getTypeClass = (type) => {
  const map = { violation: 'status-danger', facility: 'status-warning', teacher: 'status-info', conflict: 'status-danger', safety: 'status-danger', suggestion: 'status-success', teaching: 'status-warning', other: 'status-info' }
  return map[type] || 'status-info'
}

const getTypeText = (type) => {
  const map = { violation: '违规行为', facility: '设施损坏', teacher: '教师投诉', conflict: '学生冲突', safety: '安全隐患', suggestion: '建议', teaching: '教学反映', other: '其他' }
  return map[type] || '其他'
}

const getStatusClass = (status) => {
  if (status === 'pending') return 'status-warning'
  if (status === 'processing') return 'status-info'
  if (status === 'resolved') return 'status-success'
  return 'status-danger'
}

const getStatusText = (status) => {
  if (status === 'pending') return '待处理'
  if (status === 'processing') return '处理中'
  if (status === 'resolved') return '已办结'
  return '已驳回'
}

const getFileIcon = (type) => {
  const map = { image: Picture, pdf: Document, doc: Edit, excel: Histogram }
  return map[type] || Link
}

const refreshData = () => {
  searchQuery.value = ''
  filterStatus.value = ''
  filterType.value = ''
  currentPage.value = 1
  ElMessage.info('数据已刷新')
}

const exportData = () => {
  // 导出CSV格式的举报数据
  const headers = ['举报编号', '类型', '标题', '举报人', '举报类型', '优先级', '状态', '创建时间']
  const reporterTypeMap = { staff: '教职工', student: '学生', parent: '家长' }
  const priorityMap = { high: '高', medium: '中', low: '低' }
  const rows = filteredReports.value.map(report => [
    report.id,
    getTypeText(report.type),
    report.title,
    report.reporter,
    reporterTypeMap[report.reporterType] || '其他',
    priorityMap[report.priority] || '低',
    getStatusText(report.status),
    report.createTime
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `举报记录_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('举报记录已导出')
}

const createReport = () => {
  createForm.value = {
    type: '',
    title: '',
    content: '',
    reporter: '',
    reporterType: '',
    contact: ''
  }
  showCreateDialog.value = true
}

const submitCreate = () => {
  if (!createForm.value.type) {
    ElMessage.warning('请选择举报类型')
    return
  }
  if (!createForm.value.title) {
    ElMessage.warning('请输入举报标题')
    return
  }
  if (!createForm.value.content) {
    ElMessage.warning('请输入举报内容')
    return
  }
  if (!createForm.value.reporter) {
    ElMessage.warning('请输入举报人姓名')
    return
  }
  const newReport = {
    id: generateDeterministicId('JB', createForm.value.title + '-' + createForm.value.reporter),
    type: createForm.value.type,
    title: createForm.value.title,
    content: createForm.value.content,
    reporter: createForm.value.reporter,
    reporterType: createForm.value.reporterType || 'other',
    contact: createForm.value.contact,
    priority: 'medium', // 默认中等优先级
    status: 'pending',
    createTime: new Date().toLocaleString('zh-CN'),
    attachments: [],
    processSteps: [
      { title: '举报提交', description: '举报人提交举报信息', time: new Date().toLocaleString('zh-CN'), status: 'done' },
      { title: '待审核', description: '等待管理员审核', time: '', status: 'current' }
    ]
  }
  
  reports.value.unshift(newReport) // 添加到列表最前面
  ElMessage.success('举报已提交')
  showCreateDialog.value = false
  createForm.value = { // 重置表单
    type: '',
    title: '',
    content: '',
    reporter: '',
    reporterType: '',
    contact: ''
  }
}

const viewDetail = (row) => {
  currentReport.value = row
  showDetail.value = true
}

const startProcess = (row) => {
  row.status = 'processing'
  row.processSteps.push({
    title: '处理中',
    description: '管理员开始处理此举报',
    time: new Date().toLocaleString('zh-CN'),
    status: 'current'
  })
  showDetail.value = false
  ElMessage.info('已开始处理')
}

const confirmComplete = () => {
  if (!processForm.value.comment) {
    ElMessage.warning('请输入处理意见')
    return
  }
  if (!processForm.value.handler) {
    ElMessage.warning('请输入处理人姓名')
    return
  }

  const report = reports.value.find(r => r.id === currentReport.value?.id)
  if (report) {
    report.status = processForm.value.result
    report.processResult = processForm.value.comment
    report.handler = processForm.value.handler
    report.processTime = new Date().toLocaleString('zh-CN')
    report.processSteps.push({
      title: processForm.value.result === 'resolved' ? '处理完成' : '举报驳回',
      description: processForm.value.comment,
      time: report.processTime,
      status: 'done'
    })
  }

  showCompleteDialog.value = false
  showDetail.value = false
  processForm.value = { result: 'resolved', comment: '', handler: '' }
  ElMessage.success('处理已完成')
}

const completeProcess = (row) => {
  currentReport.value = row
  showCompleteDialog.value = true
}
</script>

<style scoped>
.report-management-page {
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

.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
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

.type-badge {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  background: #F7F8FA;
  color: #6B7280;
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
  gap: 16px;
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
}

.detail-row {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
}

.detail-label {
  width: 100px;
  font-size: 13px;
  color: #6B7280;
}

.report-content {
  background: #F7F8FA;
  padding: 12px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.6;
  color: #1A1A2E;
}

.attachment-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.attachment-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: #F7F8FA;
  border-radius: 6px;
}

.file-icon {
  font-size: 18px;
}

.file-name {
  flex: 1;
  font-size: 13px;
  color: #1A1A2E;
}

.file-size {
  font-size: 12px;
  color: #9CA3AF;
}

.timeline-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.step-title {
  font-size: 13px;
  font-weight: 600;
  color: #1A1A2E;
}

.step-desc {
  font-size: 12px;
  color: #6B7280;
}

.process-result {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.result-content {
  margin-top: 8px;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.result-content p {
  margin: 4px 0;
  font-size: 13px;
  color: #1A1A2E;
}
</style>
