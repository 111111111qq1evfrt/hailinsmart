<template>
  <div class="feedback-support">
    <div class="page-header">
      <div class="header-actions">
        <el-button type="primary" :icon="Message" @click="showFeedbackDialog = true">提交反馈</el-button>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num" :style="{ color: '#1E5AA8' }">{{ stats.totalFeedback }}</span>
        <span class="stat-label">反馈总数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: '#3B82F6' }">{{ stats.resolved }}</span>
        <span class="stat-label">已解决</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: '#F5A623' }">{{ stats.pending }}</span>
        <span class="stat-label">处理中</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: '#1A1A2E' }">{{ stats.satisfaction }}%</span>
        <span class="stat-label">满意度</span>
      </div>
    </div>

    <div class="main-content">
      <div class="support-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Headset /></el-icon> 在线客服</span>
        </div>
        <div class="support-content">
          <div class="support-item">
            <div class="support-icon">
              <Phone />
            </div>
            <div class="support-info">
              <span class="support-title">客服热线</span>
              <span class="support-value">400-888-6666</span>
              <span class="support-desc">服务时间：周一至周日 9:00-21:00</span>
            </div>
          </div>
          <div class="support-item">
            <div class="support-icon">
              <MessageBox />
            </div>
            <div class="support-info">
              <span class="support-title">邮箱支持</span>
              <span class="support-value">sunyihan_007@163.com</span>
              <span class="support-desc">24小时内回复</span>
            </div>
          </div>

        </div>
      </div>

      <div class="faq-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><QuestionFilled /></el-icon> 常见问题</span>
          <el-input
            v-model="faqKeyword"
            placeholder="搜索问题关键词..."
            :prefix-icon="Search"
            clearable
            style="width: 240px"
          />
        </div>
        <div v-if="filteredFaqList.length === 0" class="faq-empty">
          <el-empty description="未找到匹配的常见问题" :image-size="60" />
        </div>
        <div v-else class="faq-list">
          <div v-for="(item, idx) in filteredFaqList" :key="idx" class="faq-item">
            <div class="faq-header" @click="toggleFaq(idx)">
              <span class="faq-icon">{{ idx + 1 }}</span>
              <span class="faq-question">{{ item.question }}</span>
              <el-icon :class="{ expanded: expandedFaq === idx }"><ArrowRight /></el-icon>
            </div>
            <div v-show="expandedFaq === idx" class="faq-answer">
              {{ item.answer }}
            </div>
          </div>
        </div>
      </div>

      <div class="feedback-list-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><ChatDotRound /></el-icon> 我的反馈</span>
          <div class="filter-group">
            <el-select v-model="filterType" placeholder="类型筛选" clearable style="width: 140px">
              <el-option label="功能建议" value="suggestion" />
              <el-option label="Bug报告" value="bug" />
              <el-option label="使用问题" value="technical" />
              <el-option label="其他" value="other" />
            </el-select>
            <el-select v-model="filterStatus" placeholder="状态筛选" clearable style="width: 140px">
              <el-option label="待处理" value="pending" />
              <el-option label="处理中" value="processing" />
              <el-option label="已解决" value="resolved" />
              <el-option label="已关闭" value="closed" />
            </el-select>
          </div>
        </div>
        <el-table :data="filteredFeedbacks" stripe class="w-full" :height="400">
          <el-table-column prop="id" label="反馈编号" width="120" />
          <el-table-column prop="title" label="反馈标题" />
          <el-table-column prop="type" label="反馈类型" width="120">
            <template #default="{ row }"><el-tag size="small">{{ getTypeText(row.type) }}</el-tag></template>
          </el-table-column>
          <el-table-column prop="priority" label="优先级" width="100">
            <template #default="{ row }">
              <el-tag :type="getPriorityType(row.priority)" size="small">
                {{ getPriorityText(row.priority) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="提交时间" width="140" />
          <el-table-column prop="replyTime" label="回复时间" width="140" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="viewDetail(row)">查看详情</el-button>
              <el-button v-if="row.status === 'resolved'" link type="success" size="small" @click="satisfy(row)">满意</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- Submit Feedback Dialog -->
    <el-dialog v-model="showFeedbackDialog" title="提交反馈" width="600px">
      <el-form :model="feedbackForm" label-width="100px">
        <el-form-item label="反馈标题" required>
          <el-input v-model="feedbackForm.title" placeholder="请输入反馈标题" />
        </el-form-item>
        <el-form-item label="反馈类型" required>
          <el-select v-model="feedbackForm.type">
            <el-option label="功能建议" value="suggestion" />
            <el-option label="Bug报告" value="bug" />
            <el-option label="使用问题" value="technical" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级" required>
          <el-select v-model="feedbackForm.priority">
            <el-option label="紧急" value="high" />
            <el-option label="一般" value="normal" />
            <el-option label="低" value="low" />
          </el-select>
        </el-form-item>
        <el-form-item label="详细描述" required>
          <el-input v-model="feedbackForm.description" type="textarea" :rows="4" placeholder="请详细描述您的问题或建议" />
        </el-form-item>
        <el-form-item label="联系方式">
          <el-input v-model="feedbackForm.contact" placeholder="手机号或邮箱（选填，方便我们联系您）" />
        </el-form-item>
        <el-form-item label="附件">
          <el-upload
            class="upload-demo"
            :limit="3"
            action="#"
            :auto-upload="false"
            :on-change="handleFileChange"
          >
            <el-button :icon="Upload">选择文件</el-button>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showFeedbackDialog = false">取消</el-button>
        <el-button type="primary" @click="submitFeedback">提交</el-button>
      </template>
    </el-dialog>

    <!-- Feedback Detail Dialog -->
    <el-dialog v-model="showDetailDialog" title="反馈详情" width="700px">
      <div v-if="currentFeedback" class="detail-content">
        <div class="detail-row">
          <span class="detail-label">反馈编号</span>
          <span class="detail-value">{{ currentFeedback.id }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">标题</span>
          <span class="detail-value">{{ currentFeedback.title }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">类型</span>
          <el-tag size="small">{{ getTypeText(currentFeedback.type) }}</el-tag>
        </div>
        <div class="detail-row">
          <span class="detail-label">优先级</span>
          <el-tag :type="getPriorityType(currentFeedback.priority)" size="small">{{ getPriorityText(currentFeedback.priority) }}</el-tag>
        </div>
        <div class="detail-row">
          <span class="detail-label">状态</span>
          <el-tag :type="getStatusType(currentFeedback.status)" size="small">{{ getStatusText(currentFeedback.status) }}</el-tag>
        </div>
        <div class="detail-row">
          <span class="detail-label">描述</span>
          <div class="detail-value">{{ currentFeedback.description }}</div>
        </div>
        <div v-if="currentFeedback.contact" class="detail-row">
          <span class="detail-label">联系方式</span>
          <span class="detail-value">{{ currentFeedback.contact }}</span>
        </div>
        <div v-if="currentFeedback.reply" class="detail-row">
          <span class="detail-label">客服回复</span>
          <div class="reply-content">{{ currentFeedback.reply }}</div>
        </div>

        <!-- Processing Timeline -->
        <div class="timeline-section">
          <div class="section-title"><el-icon><Clock /></el-icon> 处理进度</div>
          <el-timeline>
            <el-timeline-item
              v-for="(entry, idx) in currentTimeline"
              :key="idx"
              :timestamp="entry.time"
              :type="entry.type"
              :hollow="!entry.done"
              placement="top"
            >
              <div class="timeline-card">
                <span class="timeline-title">{{ entry.title }}</span>
                <span v-if="entry.content" class="timeline-desc">{{ entry.content }}</span>
              </div>
            </el-timeline-item>
          </el-timeline>
        </div>

        <!-- Follow-up Comments -->
        <div class="comments-section">
          <div class="section-title"><el-icon><ChatDotRound /></el-icon> 追加留言</div>
          <div v-if="currentComments.length > 0" class="comments-list">
            <div v-for="(cmt, idx) in currentComments" :key="idx" class="comment-item">
              <div class="comment-meta">
                <span class="comment-author">{{ cmt.author }}</span>
                <span class="comment-time">{{ cmt.time }}</span>
              </div>
              <div class="comment-body">{{ cmt.content }}</div>
            </div>
          </div>
          <div v-else class="comments-empty">暂无留言，您可以追加留言补充问题描述</div>
          <div class="comment-input-row">
            <el-input
              v-model="newComment"
              placeholder="输入追加留言内容..."
              @keyup.enter="addComment"
            />
            <el-button type="primary" :disabled="!newComment.trim()" @click="addComment">发送</el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showDetailDialog = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Message, Phone, MessageBox, ChatDotRound, Histogram, ArrowRight, Upload, Search, Headset, QuestionFilled } from '@element-plus/icons-vue'
import store from '@/store/global'
import { usePersistedRef } from '@/composables/usePersistedRef'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const showFeedbackDialog = ref(false)
const showDetailDialog = ref(false)
const filterStatus = ref('')
const filterType = ref('')
const expandedFaq = ref(-1)
const faqKeyword = ref('')
const newComment = ref('')

const feedbackForm = ref({
  title: '',
  type: 'suggestion',
  priority: 'normal',
  description: '',
  contact: '',
  attachments: []
})

const currentFeedback = ref(null)

const getTypeText = (type) => ({ suggestion: '功能建议', bug: 'Bug报告', technical: '使用问题', other: '其他' }[type] || type)
const getPriorityText = (priority) => ({ high: '紧急', normal: '一般', low: '低' }[priority] || priority)
const getPriorityType = (priority) => ({ high: 'danger', normal: 'warning', low: 'info' }[priority] || 'info')
const getStatusText = (status) => ({ pending: '待处理', processing: '处理中', resolved: '已解决', closed: '已关闭' }[status] || status)
const getStatusType = (status) => ({ pending: 'info', processing: 'warning', resolved: 'success', closed: 'info' }[status] || 'info')

/* ---- Mock timeline data ---- */
const getDefaultTimelines = () => ({
  'FB001': [
    { title: '提交反馈', content: '用户提交了反馈', time: '2026-07-10 14:30', type: 'primary', done: true },
    { title: '受理反馈', content: '客服已受理，分配给产品组', time: '2026-07-10 16:00', type: 'warning', done: true },
    { title: '客服回复', content: '感谢您的建议，该功能已列入开发计划', time: '2026-07-11 10:00', type: 'warning', done: true },
    { title: '问题已解决', content: '功能已上线，请更新版本体验', time: '2026-07-15 09:00', type: 'success', done: true }
  ],
  'FB002': [
    { title: '提交反馈', content: '用户提交了反馈', time: '2026-07-14 09:15', type: 'primary', done: true },
    { title: '受理反馈', content: '客服已受理，转交技术排查', time: '2026-07-14 11:00', type: 'warning', done: true },
    { title: '处理中', content: '技术正在排查导出模块问题', time: '', type: 'info', done: false },
    { title: '问题已解决', content: '', time: '', type: 'success', done: false }
  ],
  'FB003': [
    { title: '提交反馈', content: '用户提交了反馈', time: '2026-07-05 16:45', type: 'primary', done: true },
    { title: '受理反馈', content: '客服已受理', time: '2026-07-05 17:30', type: 'warning', done: true },
    { title: '客服回复', content: '已优化视频加载策略，建议使用稳定网络', time: '2026-07-06 11:30', type: 'warning', done: true },
    { title: '问题已解决', content: '视频播放已恢复正常', time: '2026-07-07 09:00', type: 'success', done: true }
  ],
  'FB004': [
    { title: '提交反馈', content: '用户提交了反馈', time: '2026-07-16 10:20', type: 'primary', done: true },
    { title: '受理反馈', content: '', time: '', type: 'warning', done: false },
    { title: '客服回复', content: '', time: '', type: 'warning', done: false },
    { title: '问题已解决', content: '', time: '', type: 'success', done: false }
  ]
})

/* ---- Mock comments data ---- */
const getDefaultComments = () => ({
  'FB001': [
    { author: '用户', content: '希望能支持批量远程控制', time: '2026-07-11 14:00' },
    { author: '客服小王', content: '好的，已记录您的补充需求，会反馈给产品团队', time: '2026-07-11 15:30' }
  ],
  'FB002': [
    { author: '用户', content: '补充一下，我用的是Chrome浏览器，Win10系统', time: '2026-07-14 10:00' }
  ],
  'FB003': [],
  'FB004': []
})

/* ---- Default feedbacks ---- */
const getDefaultFeedbacks = () => {
  const schoolFeedbacks = {
    'hailin-second-primary': [
      { id: 'FB001', title: '建议增加设备远程控制功能', type: 'suggestion', priority: 'normal', status: 'resolved', description: '希望能够远程开启和关闭设备，方便管理', contact: '138****1234', createTime: '2026-07-10 14:30', replyTime: '2026-07-11 10:00', reply: '感谢您的建议，该功能已列入开发计划，预计下个版本上线。' },
      { id: 'FB002', title: '部分数据无法导出', type: 'bug', priority: 'high', status: 'processing', description: '导出Excel时提示错误，无法正常下载', contact: '', createTime: '2026-07-14 09:15', replyTime: '', reply: '' },
      { id: 'FB003', title: '视频播放卡顿', type: 'technical', priority: 'normal', status: 'resolved', description: '观看学生运动视频时经常卡顿', contact: 'zhang@school.edu', createTime: '2026-07-05 16:45', replyTime: '2026-07-06 11:30', reply: '已优化视频加载策略，建议使用稳定网络。' },
      { id: 'FB004', title: '希望增加批量导入功能', type: 'suggestion', priority: 'low', status: 'pending', description: '批量导入学生信息时操作不便', contact: '', createTime: '2026-07-16 10:20', replyTime: '', reply: '' }
    ],
    'hailin-zirong-primary': [
      { id: 'FB005', title: '系统登录缓慢', type: 'technical', priority: 'high', status: 'resolved', description: '高峰期登录系统需要等待很长时间', contact: '139****5678', createTime: '2026-07-12 08:30', replyTime: '2026-07-13 09:00', reply: '已优化服务器配置，登录速度已提升。' },
      { id: 'FB006', title: '建议优化通知推送', type: 'suggestion', priority: 'normal', status: 'pending', description: '希望通知能够按优先级排序', contact: '', createTime: '2026-07-15 11:00', replyTime: '', reply: '' }
    ],
    'linhai-experimental-primary': [
      { id: 'FB007', title: '人脸识别偶尔失败', type: 'bug', priority: 'normal', status: 'processing', description: '部分学生人脸识别成功率较低', contact: 'li@school.edu', createTime: '2026-07-13 15:20', replyTime: '', reply: '' },
      { id: 'FB008', title: '数据统计不准确', type: 'bug', priority: 'high', status: 'resolved', description: '体测成绩统计有偏差', contact: '', createTime: '2026-07-08 10:00', replyTime: '2026-07-09 14:00', reply: '已修复统计逻辑错误，数据已重新计算。' }
    ]
  }
  return schoolFeedbacks[schoolId.value] || schoolFeedbacks['hailin-second-primary']
}

const feedbacks = usePersistedRef(computed(() => `smart_pe_feedback_${schoolId.value}`), getDefaultFeedbacks)
const timelines = usePersistedRef(computed(() => `smart_pe_timelines_${schoolId.value}`), getDefaultTimelines)
const comments = usePersistedRef(computed(() => `smart_pe_comments_${schoolId.value}`), getDefaultComments)

/* ---- Filtered feedbacks (by type AND status) ---- */
const filteredFeedbacks = computed(() => {
  let result = feedbacks.value
  if (filterType.value) {
    result = result.filter(f => f.type === filterType.value)
  }
  if (filterStatus.value) {
    result = result.filter(f => f.status === filterStatus.value)
  }
  return result
})

const satisfactionRatings = usePersistedRef(computed(() => `smart_pe_satisfaction_${schoolId.value}`), {
  'FB001': 5,
  'FB003': 4,
  'FB005': 5,
  'FB008': 4
})

const stats = computed(() => {
  const total = feedbacks.value.length
  const resolved = feedbacks.value.filter(f => f.status === 'resolved' || f.status === 'closed').length
  const ratedIds = Object.keys(satisfactionRatings.value)
  const ratedCount = ratedIds.length
  const avgSatisfaction = ratedCount > 0
    ? Math.round(ratedIds.reduce((sum, id) => sum + (satisfactionRatings.value[id] || 0), 0) / ratedCount / 5 * 100)
    : (total > 0 ? Math.round((feedbacks.value.filter(f => f.status === 'resolved' || f.status === 'closed').length / total) * 100) : 0)
  return {
    totalFeedback: total,
    resolved,
    pending: feedbacks.value.filter(f => f.status === 'pending' || f.status === 'processing').length,
    satisfaction: avgSatisfaction
  }
})

/* ---- FAQ with search ---- */
const defaultFaqList = [
  { question: '如何重置密码？', answer: '登录页面点击"忘记密码"，通过手机号或邮箱验证后即可重置密码。如无法重置，请联系学校管理员。' },
  { question: '数据导出失败怎么办？', answer: '请检查网络连接，确保浏览器支持下载功能。如问题持续，可尝试更换浏览器或联系客服。' },
  { question: '视频无法播放？', answer: '请检查网络连接，确保浏览器支持HTML5视频播放。建议使用Chrome或Edge浏览器。' },
  { question: '如何批量导入学生信息？', answer: '在学生管理页面点击"导入"按钮，下载模板并填写数据后上传。支持Excel格式。' },
  { question: '设备离线如何处理？', answer: '请检查设备电源和网络连接。如设备状态持续异常，请提交维修工单或联系客服。' },
  { question: '如何修改学校信息？', answer: '进入系统设置页面，选择"学校信息管理"，可修改学校名称、地址等基本信息。修改后需重新登录生效。' },
  { question: '体测成绩如何录入？', answer: '在体测管理页面选择对应班级和项目，支持手动录入和设备自动上传两种方式。录入后请核实数据准确性。' },
  { question: '系统支持哪些浏览器？', answer: '推荐使用Chrome 90+、Edge 90+、Firefox 88+等现代浏览器。暂不支持IE浏览器。' }
]

const faqList = usePersistedRef(computed(() => `smart_pe_faq_${schoolId.value}`), () => defaultFaqList)

const filteredFaqList = computed(() => {
  if (!faqKeyword.value.trim()) return faqList.value
  const kw = faqKeyword.value.trim().toLowerCase()
  return faqList.value.filter(
    item => item.question.toLowerCase().includes(kw) || item.answer.toLowerCase().includes(kw)
  )
})

/* ---- Timeline for current feedback ---- */
const currentTimeline = computed(() => {
  if (!currentFeedback.value) return []
  const id = currentFeedback.value.id
  if (timelines.value[id]) return timelines.value[id]
  // Auto-generate a basic timeline from feedback data
  const fb = currentFeedback.value
  const tl = [
    { title: '提交反馈', content: '用户提交了反馈', time: fb.createTime, type: 'primary', done: true }
  ]
  if (fb.status === 'processing' || fb.status === 'resolved' || fb.status === 'closed') {
    tl.push({ title: '受理反馈', content: '客服已受理', time: fb.createTime, type: 'warning', done: true })
  }
  if (fb.status === 'resolved' || fb.status === 'closed') {
    if (fb.reply) {
      tl.push({ title: '客服回复', content: fb.reply, time: fb.replyTime, type: 'warning', done: true })
    }
    tl.push({ title: '问题已解决', content: '', time: fb.replyTime, type: 'success', done: true })
  }
  return tl
})

/* ---- Comments for current feedback ---- */
const currentComments = computed(() => {
  if (!currentFeedback.value) return []
  const id = currentFeedback.value.id
  return comments.value[id] || []
})

/* ---- Actions ---- */
const startChat = () => {
  ElMessage.info('正在连接在线客服...')
  setTimeout(() => {
    ElMessage.success('客服已接入，正在为您服务')
  }, 1500)
}

const toggleFaq = (idx) => {
  expandedFaq.value = expandedFaq.value === idx ? -1 : idx
}

const handleFileChange = (file) => {
  feedbackForm.value.attachments.push(file.name)
}

const submitFeedback = () => {
  if (!feedbackForm.value.title || !feedbackForm.value.description) {
    ElMessage.warning('请填写完整信息')
    return
  }
  const now = new Date().toLocaleString('zh-CN')
  const newId = `FB${String(Date.now()).slice(-3)}`
  const newFeedback = {
    ...feedbackForm.value,
    id: newId,
    status: 'pending',
    createTime: now,
    replyTime: '',
    reply: ''
  }
  feedbacks.value.unshift(newFeedback)

  // Create initial timeline for the new feedback
  timelines.value[newId] = [
    { title: '提交反馈', content: '用户提交了反馈', time: now, type: 'primary', done: true },
    { title: '受理反馈', content: '', time: '', type: 'warning', done: false },
    { title: '客服回复', content: '', time: '', type: 'warning', done: false },
    { title: '问题已解决', content: '', time: '', type: 'success', done: false }
  ]
  // Initialize empty comments
  comments.value[newId] = []

  showFeedbackDialog.value = false
  feedbackForm.value = { title: '', type: 'suggestion', priority: 'normal', description: '', contact: '', attachments: [] }
  ElMessage.success('反馈已提交，我们会尽快处理')
}

const viewDetail = (row) => {
  currentFeedback.value = row
  newComment.value = ''
  showDetailDialog.value = true
}

const addComment = () => {
  if (!newComment.value.trim() || !currentFeedback.value) return
  const id = currentFeedback.value.id
  if (!comments.value[id]) {
    comments.value[id] = []
  }
  comments.value[id].push({
    author: '用户',
    content: newComment.value.trim(),
    time: new Date().toLocaleString('zh-CN')
  })
  newComment.value = ''
  ElMessage.success('留言已追加')
}

const satisfy = (row) => {
  ElMessageBox({
    title: '满意度评价',
    message: '请为本次服务打分',
    showCancelButton: true,
    confirmButtonText: '提交评价',
    cancelButtonText: '取消',
    distinguishCancelAndClose: true,
    type: 'info'
  }).then(() => {
    // Default to 5 stars if user clicks confirm (simplified for demo)
    satisfactionRatings.value[row.id] = 5
    row.status = 'closed'
    ElMessage.success('感谢您的评价，我们会继续努力')
  }).catch(() => {
    // User cancelled
  })
}

onMounted(() => {})
</script>

<style scoped>
.feedback-support {
  min-height: calc(100vh - 140px);
}

.page-header {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 24px;
}

.header-actions {
  display: flex;
  gap: 8px;
}

.stats-row {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px 24px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-divider {
  width: 1px;
  height: 48px;
  background: #E8EAED;
}

.main-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.support-card, .faq-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.feedback-list-card {
  grid-column: span 2;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EAED;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  display: flex;
  align-items: center;
  gap: 8px;
}



.filter-group {
  display: flex;
  gap: 10px;
}

.support-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.support-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.support-icon {
  width: 36px;
  height: 36px;
  background: #EEF6FF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.support-icon :deep(.el-icon),
.support-icon :deep(svg) {
  font-size: 18px !important;
  width: 18px !important;
  height: 18px !important;
  color: #1E5AA8;
}

.support-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.support-title {
  font-size: 12px;
  color: #6B7280;
}

.support-value {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 4px 0;
}

.support-desc {
  font-size: 12px;
  color: #9CA3AF;
}

.faq-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.faq-empty {
  padding: 20px 0;
}

.faq-item {
  border: 1px solid #E8EAED;
  border-radius: 8px;
  overflow: hidden;
}

.faq-header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  background: #F7F8FA;
}

.faq-icon {
  width: 24px;
  height: 24px;
  background: #1E5AA8;
  color: #FFFFFF;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}

.faq-question {
  flex: 1;
  font-size: 14px;
  color: #1A1A2E;
}

.expanded {
  transform: rotate(90deg);
}

.faq-answer {
  padding: 16px;
  font-size: 14px;
  color: #6B7280;
  line-height: 1.8;
}

/* ---- Detail dialog ---- */
.detail-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 65vh;
  overflow-y: auto;
  padding-right: 4px;
}

.detail-row {
  display: flex;
  gap: 16px;
  padding: 8px 0;
}

.detail-label {
  width: 80px;
  font-size: 14px;
  color: #6B7280;
  flex-shrink: 0;
}

.detail-value {
  font-size: 14px;
  color: #1A1A2E;
  flex: 1;
}

.reply-content {
  flex: 1;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
  font-size: 14px;
  color: #1A1A2E;
}

/* ---- Timeline section ---- */
.timeline-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E8EAED;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1A1A2E;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 16px;
}

.section-title :deep(.el-icon) {
  color: #1E5AA8;
}

.timeline-card {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.timeline-title {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.timeline-desc {
  font-size: 13px;
  color: #6B7280;
}

/* ---- Comments section ---- */
.comments-section {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #E8EAED;
}

.comments-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 14px;
}

.comment-item {
  padding: 10px 14px;
  background: #F7F8FA;
  border-radius: 8px;
  border-left: 3px solid #1E5AA8;
}

.comment-meta {
  display: flex;
  justify-content: space-between;
  margin-bottom: 6px;
}

.comment-author {
  font-size: 13px;
  font-weight: 600;
  color: #1E5AA8;
}

.comment-time {
  font-size: 12px;
  color: #9CA3AF;
}

.comment-body {
  font-size: 14px;
  color: #1A1A2E;
  line-height: 1.6;
}

.comments-empty {
  font-size: 13px;
  color: #9CA3AF;
  margin-bottom: 14px;
  padding: 8px 0;
}

.comment-input-row {
  display: flex;
  gap: 10px;
  align-items: center;
}
</style>
