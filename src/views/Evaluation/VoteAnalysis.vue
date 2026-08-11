<template>
  <div class="vote-analysis-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-filters">
        <el-input
          v-model="searchQuery"
          placeholder="搜索投票标题"
          clearable
          style="width: 240px"
          :prefix-icon="Search"
        />
        <el-select v-model="filterType" placeholder="投票类型" clearable style="width: 140px">
          <el-option label="评选类" value="selection" />
          <el-option label="赛事类" value="match" />
          <el-option label="决策类" value="decision" />
          <el-option label="调研类" value="survey" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="投票状态" clearable style="width: 140px">
          <el-option label="进行中" value="active" />
          <el-option label="已结束" value="ended" />
        </el-select>
        <el-select v-model="filterGrade" placeholder="选择年级" clearable style="width: 120px">
          <el-option label="全部年级" value="all" />
          <el-option label="一年级" value="1" />
          <el-option label="二年级" value="2" />
          <el-option label="三年级" value="3" />
          <el-option label="四年级" value="4" />
          <el-option label="五年级" value="5" />
          <el-option label="六年级" value="6" />
        </el-select>
      </div>
      <div class="header-actions">
        <el-button :icon="Download" @click="exportAllReports">导出全部报告</el-button>
        <el-button :icon="Refresh" @click="refreshData">刷新数据</el-button>
        <el-button type="primary" :icon="Plus" @click="showCreateModal = true">发起投票</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ stats.totalVotes }}</span>
        <span class="stat-label">总投票数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.activePolls }}</span>
        <span class="stat-label">进行中投票</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.participants }}</span>
        <span class="stat-label">参与人数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.responseRate }}%</span>
        <span class="stat-label">响应率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.lowParticipation }}</span>
        <span class="stat-label">低参与班级</span>
      </div>
    </div>

    <!-- 实时数据看板 -->
    <div class="dashboard-row">
      <!-- 动态排名 -->
      <div class="chart-card ranking-card">
        <div class="card-header">
          <span class="card-title">实时排名 TOP10</span>
          <span class="live-badge">实时更新</span>
        </div>
        <div class="ranking-list">
          <div v-for="(item, index) in realtimeRanking" :key="index" 
               :class="['ranking-item', index < 3 ? 'top-three' : '', `rank-${index + 1}`]">
            <span class="rank-number">{{ index + 1 }}</span>
            <div class="rank-content">
              <div class="rank-avatar">
                <img v-if="item.avatar" :src="item.avatar" :alt="item.name" />
                <span v-else class="avatar-placeholder">{{ item.name.charAt(0) }}</span>
              </div>
              <div class="rank-info">
                <span class="rank-name">{{ item.name }}</span>
                <span class="rank-class">{{ item.className }}</span>
              </div>
            </div>
            <div class="rank-votes">
              <span class="vote-count">{{ item.votes }}</span>
              <span class="vote-label">票</span>
            </div>
            <div class="rank-progress">
              <div class="progress-bar" :style="{ width: (item.votes / maxVotes * 100) + '%' }"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 参与率热力图 -->
      <div class="chart-card heatmap-card">
        <div class="card-header">
          <span class="card-title">班级参与率热力图</span>
          <div class="legend">
            <span class="legend-item"><span class="legend-color high"></span> ≥80%</span>
            <span class="legend-item"><span class="legend-color medium"></span> 60-79%</span>
            <span class="legend-item"><span class="legend-color low"></span> <60%</span>
          </div>
        </div>
        <div class="heatmap-container">
          <div v-for="grade in gradeClasses" :key="grade.grade" class="grade-section">
            <span class="grade-label">{{ grade.grade }}</span>
            <div class="class-grid">
              <div v-for="cls in grade.classes" :key="cls.name" 
                   :class="['class-cell', getParticipationLevel(cls.rate)]"
                   @click="showClassDetail(cls)">
                <span class="class-name">{{ cls.name }}</span>
                <span class="class-rate">{{ cls.rate }}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图表区域 -->
    <div class="content-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">投票时段分布</span>
        </div>
        <div ref="timeChartRef" class="chart"></div>
      </div>
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">投票类型分布</span>
        </div>
        <div ref="typeChartRef" class="chart"></div>
      </div>
    </div>

    <!-- 投票列表 -->
    <div class="list-card">
      <ExamTable
        :data="filteredPolls"
        :columns="voteColumns"
        title="投票列表"
        :show-header="true"
        :searchable="false"
        :show-refresh="true"
        :show-pagination="true"
        :page-sizes="[8, 12, 16]"
        :default-page-size="12"
        :show-selection="false"
        @refresh="refreshData"
      >
        <template #type="{ row }">
          <span :class="['type-tag', `type-${row.type}`]">{{ getTypeLabel(row.type) }}</span>
        </template>
        <template #strategy="{ row }">
          <span class="strategy-tag">{{ row.strategy }}</span>
        </template>
        <template #groupRange="{ row }">
          <span class="group-tag">{{ row.groupRange }}</span>
        </template>
        <template #status="{ row }">
          <span :class="['status-tag', row.status === 'active' ? 'status-success' : 'status-info']">
            {{ row.status === 'active' ? '进行中' : '已结束' }}
          </span>
        </template>
        <template #actions="{ row }">
          <el-button text type="primary" size="small" @click="viewDetail(row)">详情</el-button>
          <el-button text type="primary" size="small" @click="shareVote(row)">分享</el-button>
          <el-button text type="primary" size="small" @click="generateReport(row)">生成报告</el-button>
          <el-button text type="danger" size="small" @click="deletePoll(row)">删除</el-button>
        </template>
      </ExamTable>
    </div>

    <!-- 创建投票弹窗 -->
    <ElDialog
      v-model="showCreateModal"
      title="发起投票"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="create-vote-form">
        <!-- 模板选择 -->
        <div class="form-section">
          <h4>选择模板</h4>
          <div class="template-grid">
            <div v-for="template in voteTemplates" :key="template.id" 
                 :class="['template-card', selectedTemplate?.id === template.id ? 'selected' : '']"
                 @click="selectedTemplate = template">
              <div class="template-icon"><el-icon :size="24" color="#1E5AA8"><component :is="template.icon" /></el-icon></div>
              <span class="template-name">{{ template.name }}</span>
              <span class="template-desc">{{ template.desc }}</span>
            </div>
          </div>
        </div>

        <!-- 基本信息 -->
        <div class="form-section">
          <h4>基本信息</h4>
          <el-form :model="voteForm" label-width="100px">
            <el-form-item label="投票标题" required>
              <el-input v-model="voteForm.title" placeholder="请输入投票标题" />
            </el-form-item>
            <el-form-item label="投票类型">
              <el-select v-model="voteForm.type">
                <el-option label="评选类（优秀学生/教师）" value="selection" />
                <el-option label="赛事类" value="match" />
                <el-option label="决策类（活动方案）" value="decision" />
                <el-option label="调研类（课程满意度）" value="survey" />
              </el-select>
            </el-form-item>
            <el-form-item label="投票策略">
              <el-select v-model="voteForm.strategy">
                <el-option label="单选" value="single" />
                <el-option label="多选" value="multiple" />
                <el-option label="评分制" value="rating" />
              </el-select>
            </el-form-item>
            <el-form-item label="匿名投票">
              <el-switch v-model="voteForm.anonymous" active-text="开启" inactive-text="关闭" />
            </el-form-item>
            <el-form-item label="每日限投次数">
              <el-input-number v-model="voteForm.dailyLimit" :min="1" :max="10" />
            </el-form-item>
          </el-form>
        </div>

        <!-- 分组设置 -->
        <div class="form-section">
          <h4>分组设置</h4>
          <div class="group-settings">
            <el-checkbox-group v-model="voteForm.grades">
              <el-checkbox label="一年级" value="1" />
              <el-checkbox label="二年级" value="2" />
              <el-checkbox label="三年级" value="3" />
              <el-checkbox label="四年级" value="4" />
              <el-checkbox label="五年级" value="5" />
              <el-checkbox label="六年级" value="6" />
            </el-checkbox-group>
          </div>
        </div>

        <!-- 时间设置 -->
        <div class="form-section">
          <h4>时间设置</h4>
          <el-form :model="voteForm" label-width="100px">
            <el-form-item label="开始时间">
              <el-date-picker v-model="voteForm.startTime" type="datetime" placeholder="选择开始时间" />
            </el-form-item>
            <el-form-item label="结束时间">
              <el-date-picker v-model="voteForm.endTime" type="datetime" placeholder="选择结束时间" />
            </el-form-item>
          </el-form>
        </div>

        <!-- 富媒体内容 -->
        <div class="form-section">
          <h4>富媒体内容</h4>
          <div class="media-upload">
            <el-button type="primary" :icon="Picture" @click="uploadPictures">上传图片</el-button>
            <el-button :icon="VideoCamera" @click="uploadVideoCamera">上传视频</el-button>
            <el-button :icon="Document" @click="uploadDocument">上传文档</el-button>
          </div>
          <div v-if="voteForm.media.length" class="media-preview">
            <div v-for="(media, index) in voteForm.media" :key="index" class="media-item">
              <span>{{ media.name }}</span>
              <el-button text size="small" @click="removeMedia(index)">删除</el-button>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showCreateModal = false">取消</el-button>
        <el-button type="primary" @click="saveVote">保存并发布</el-button>
      </template>
    </ElDialog>

    <!-- 分享弹窗 -->
    <ElDialog
      v-model="showShareModal"
      title="分享投票"
      width="500px"
    >
      <div class="share-content">
        <div class="share-qrcode">
          <div class="qrcode-placeholder">
            <svg viewBox="0 0 100 100" class="qrcode-svg">
              <rect x="10" y="10" width="80" height="80" fill="white" stroke="#E8EAED" stroke-width="1"/>
              <rect x="15" y="15" width="15" height="15" fill="#333"/>
              <rect x="70" y="15" width="15" height="15" fill="#333"/>
              <rect x="15" y="70" width="15" height="15" fill="#333"/>
              <rect x="70" y="70" width="15" height="15" fill="#333"/>
              <rect x="30" y="30" width="10" height="10" fill="#333"/>
              <rect x="60" y="30" width="10" height="10" fill="#333"/>
              <rect x="30" y="60" width="10" height="10" fill="#333"/>
              <rect x="45" y="45" width="10" height="10" fill="#333"/>
              <rect x="38" y="22" width="4" height="4" fill="#333"/>
              <rect x="48" y="22" width="4" height="4" fill="#333"/>
              <rect x="58" y="22" width="4" height="4" fill="#333"/>
              <rect x="22" y="38" width="4" height="4" fill="#333"/>
              <rect x="22" y="48" width="4" height="4" fill="#333"/>
              <rect x="22" y="58" width="4" height="4" fill="#333"/>
              <rect x="74" y="38" width="4" height="4" fill="#333"/>
              <rect x="74" y="48" width="4" height="4" fill="#333"/>
              <rect x="74" y="58" width="4" height="4" fill="#333"/>
              <rect x="38" y="74" width="4" height="4" fill="#333"/>
              <rect x="48" y="74" width="4" height="4" fill="#333"/>
              <rect x="58" y="74" width="4" height="4" fill="#333"/>
            </svg>
          </div>
          <span class="qrcode-label">扫码参与投票</span>
        </div>
        <div class="share-links">
          <div class="link-item">
            <label>投票链接</label>
            <el-input v-model="shareLink" readonly />
            <el-button text type="primary" @click="copyLink">复制链接</el-button>
          </div>
          <div class="share-buttons">
            <el-button type="primary" :icon="Share">生成海报</el-button>
            <el-button :icon="CopyDocument">复制二维码</el-button>
          </div>
        </div>
      </div>
    </ElDialog>

    <!-- 投票详情 -->
    <ElDialog v-model="detailVisible" :title="currentPoll?.title || '投票详情'" width="640px">
      <div v-if="currentPoll" class="poll-detail">
        <div class="detail-row"><span>投票类型</span><span>{{ getTypeLabel(currentPoll.type) }}</span></div>
        <div class="detail-row"><span>投票策略</span><span>{{ currentPoll.strategy }}</span></div>
        <div class="detail-row"><span>参与人数</span><span>{{ currentPoll.participants }} 人</span></div>
        <div class="detail-row"><span>参与率</span><span>{{ currentPoll.participationRate }}%</span></div>
        <div class="detail-row"><span>总票数</span><span>{{ currentPoll.totalVotes }} 票</span></div>
        <div class="detail-row"><span>选项数量</span><span>{{ currentPoll.options }} 个</span></div>
        <div class="detail-row"><span>参与范围</span><span>{{ currentPoll.groupRange }}</span></div>
        <div class="detail-row"><span>状态</span><el-tag :type="currentPoll.status === 'active' ? 'success' : 'info'" size="small">{{ currentPoll.status === 'active' ? '进行中' : '已结束' }}</el-tag></div>
        <div class="detail-row"><span>创建时间</span><span>{{ currentPoll.createTime }}</span></div>
        <div class="detail-row"><span>结束时间</span><span>{{ currentPoll.endDate }}</span></div>
      </div>
      <template #footer>
        <el-button @click="detailVisible = false">关闭</el-button>
        <el-button type="primary" @click="generateReport(currentPoll)">生成报告</el-button>
      </template>
    </ElDialog>

    <!-- 班级参与详情 -->
    <ElDialog v-model="classDetailVisible" :title="`${currentClass?.name || ''} 参与详情`" width="520px">
      <div v-if="currentClass" class="class-detail-panel">
        <div class="rate-display">{{ currentClass.rate }}%</div>
        <p>班级参与率</p>
        <el-table :data="classStudentList" stripe size="small">
          <el-table-column prop="name" label="学生" />
          <el-table-column prop="status" label="状态">
            <template #default="{ row }">
              <el-tag :type="row.status === '已参与' ? 'success' : 'info'" size="small">{{ row.status }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="classDetailVisible = false">关闭</el-button>
      </template>
    </ElDialog>

    <!-- 媒体上传 -->
    <input ref="mediaFileInput" type="file" style="display: none" @change="handleMediaFile" />

    <!-- PDF导出组件 -->
    <PdfExport
      v-if="showReportExport"
      :visible="showReportExport"
      :report-data="reportData"
      @update:visible="showReportExport = $event"
      @export-start="handleReportExportStart"
      @export-end="handleReportExportEnd"
    />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { Plus, Refresh, Search, Download, Picture, VideoCamera, Document, Share, CopyDocument, Trophy, User, Histogram, Star, Basketball } from '@element-plus/icons-vue'
import { ElMessage, ElDialog, ElMessageBox } from 'element-plus'
import echarts from '@/utils/echarts'
import store from '../../store/global'
import { getSchoolMockData } from '../../utils/mockDataLoader'
import { usePersistedRef } from '@/composables/usePersistedRef'
import { mockDB } from '@/mock'
import PdfExport from '@/components/export/PdfExport.vue'
import ExamTable from '@/components/table/ExamTable.vue'
import { createSeededRandom, generateDeterministicId } from '@/utils/seededRandom'
import { getRealStudents, normalizeStudents } from '@/utils/realDataLoader'

// 搜索和筛选
const searchQuery = ref('')
const filterType = ref('')
const filterStatus = ref('')
const filterGrade = ref('')

// 表格列配置
const voteColumns = ref([
  { prop: 'title', label: '投票标题', minWidth: '200' },
  { slot: 'type', label: '投票类型', minWidth: '90' },
  { slot: 'strategy', label: '投票策略', minWidth: '120' },
  { prop: 'participants', label: '参与人数', minWidth: '80', align: 'center' },
  { prop: 'options', label: '选项数', minWidth: '70', align: 'center' },
  { slot: 'groupRange', label: '分组范围', minWidth: '120' },
  { slot: 'status', label: '状态', minWidth: '80', align: 'center' },
  { prop: 'endDate', label: '截止日期', minWidth: '120' },
])

// 弹窗控制
const showCreateModal = ref(false)
const showShareModal = ref(false)
const detailVisible = ref(false)
const classDetailVisible = ref(false)
const currentPoll = ref(null)
const currentClass = ref(null)
const mediaFileInput = ref(null)
const pendingMediaType = ref('image')
const selectedTemplate = ref(null)

watch(selectedTemplate, (newTemplate) => {
  if (newTemplate) {
    voteForm.value.type = newTemplate.type || 'selection'
    voteForm.value.title = newTemplate.name || ''
    if (newTemplate.type === 'survey') {
      voteForm.value.strategy = 'rating'
    } else if (newTemplate.type === 'decision') {
      voteForm.value.strategy = 'multiple'
    } else {
      voteForm.value.strategy = 'single'
    }
  }
})
const shareLink = ref('')
const showReportExport = ref(false)
const reportData = ref(null)

// 获取学校数据
const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')
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

// 日期格式化
const fmtDate = (d) => `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`

// ---- 三校差异化投票数据 ----
const schoolPollsData = computed(() => {
  const sid = schoolId.value
  if (sid === 'hailin-zirong-primary') {
    return [
      { id: 1, title: '子荣小学体育之星评选', type: 'selection', strategy: '单选', participants: 128, options: 8, groupRange: '全校', status: 'active', endDate: '2026/2/28', createTime: '2026/2/1', participationRate: 82, totalVotes: 198 },
      { id: 2, title: '校园文化节主题投票', type: 'match', strategy: '单选', participants: 156, options: 6, groupRange: '全校', status: 'ended', endDate: '2026/1/15', createTime: '2025/12/20', participationRate: 88, totalVotes: 234 },
      { id: 3, title: '课间活动方案投票', type: 'decision', strategy: '多选', participants: 98, options: 5, groupRange: '3-6年级', status: 'ended', endDate: '2026/1/20', createTime: '2026/1/5', participationRate: 75, totalVotes: 156 },
      { id: 4, title: '体育课程满意度调查', type: 'survey', strategy: '评分制', participants: 180, options: 8, groupRange: '全校', status: 'active', endDate: '2026/3/1', createTime: '2026/2/10', participationRate: 90, totalVotes: 270 },
      { id: 5, title: '最受欢迎体育老师评选', type: 'selection', strategy: '多选', participants: 210, options: 10, groupRange: '全校', status: 'ended', endDate: '2026/1/10', createTime: '2025/12/15', participationRate: 93, totalVotes: 315 },
      { id: 6, title: '体育器材增补投票', type: 'decision', strategy: '多选', participants: 105, options: 6, groupRange: '4-6年级', status: 'active', endDate: '2026/2/15', createTime: '2026/1/25', participationRate: 78, totalVotes: 168 }
    ]
  }
  if (sid === 'linhai-experimental-primary') {
    return [
      { id: 1, title: '林海实验体育标兵评选', type: 'selection', strategy: '单选', participants: 185, options: 10, groupRange: '全校', status: 'active', endDate: '2026/2/28', createTime: '2026/2/1', participationRate: 86, totalVotes: 278 },
      { id: 2, title: '校运动会会徽设计投票', type: 'match', strategy: '单选', participants: 220, options: 7, groupRange: '全校', status: 'ended', endDate: '2026/1/15', createTime: '2025/12/20', participationRate: 91, totalVotes: 330 },
      { id: 3, title: '课外拓展项目投票', type: 'decision', strategy: '多选', participants: 148, options: 6, groupRange: '3-6年级', status: 'ended', endDate: '2026/1/20', createTime: '2026/1/5', participationRate: 80, totalVotes: 222 },
      { id: 4, title: '游泳课程开设意向调查', type: 'survey', strategy: '评分制', participants: 260, options: 10, groupRange: '全校', status: 'active', endDate: '2026/3/1', createTime: '2026/2/10', participationRate: 92, totalVotes: 390 },
      { id: 5, title: '年度最佳体育班级评选', type: 'selection', strategy: '多选', participants: 305, options: 12, groupRange: '全校', status: 'ended', endDate: '2026/1/10', createTime: '2025/12/15', participationRate: 96, totalVotes: 458 },
      { id: 6, title: '体育馆设施升级投票', type: 'decision', strategy: '多选', participants: 175, options: 8, groupRange: '全校', status: 'active', endDate: '2026/2/15', createTime: '2026/1/25', participationRate: 84, totalVotes: 262 }
    ]
  }
  return [
    { id: 1, title: '优秀学生评选活动', type: 'selection', strategy: '单选', participants: 342, options: 12, groupRange: '全校', status: 'active', endDate: '2026/2/28', createTime: '2026/2/1', participationRate: 85, totalVotes: 512 },
    { id: 2, title: '运动会吉祥物投票', type: 'match', strategy: '单选', participants: 456, options: 8, groupRange: '全校', status: 'ended', endDate: '2026/1/15', createTime: '2025/12/20', participationRate: 92, totalVotes: 684 },
    { id: 3, title: '校园活动方案投票', type: 'decision', strategy: '多选', participants: 289, options: 6, groupRange: '3-6年级', status: 'ended', endDate: '2026/1/20', createTime: '2026/1/5', participationRate: 78, totalVotes: 432 },
    { id: 4, title: '课程满意度调查', type: 'survey', strategy: '评分制', participants: 512, options: 10, groupRange: '全校', status: 'active', endDate: '2026/3/1', createTime: '2026/2/10', participationRate: 88, totalVotes: 768 },
    { id: 5, title: '优秀教师评选', type: 'selection', strategy: '多选', participants: 623, options: 15, groupRange: '全校', status: 'ended', endDate: '2026/1/10', createTime: '2025/12/15', participationRate: 95, totalVotes: 935 },
    { id: 6, title: '体育器材采购投票', type: 'decision', strategy: '多选', participants: 321, options: 10, groupRange: '4-6年级', status: 'active', endDate: '2026/2/15', createTime: '2026/1/25', participationRate: 82, totalVotes: 480 }
  ]
})

const schoolVoteTemplatesData = computed(() => {
  const sid = schoolId.value
  if (sid === 'hailin-zirong-primary') {
    return [
      { id: 1, name: '体育之星评选', desc: '评选校级体育之星', icon: Trophy, type: 'selection' },
      { id: 2, name: '优秀教师评选', desc: '评选年度优秀教师', icon: User, type: 'selection' },
      { id: 3, name: '文化节投票', desc: '校园文化节主题投票', icon: Star, type: 'match' },
      { id: 4, name: '活动方案投票', desc: '选择最佳活动方案', icon: Document, type: 'decision' },
      { id: 5, name: '课程满意度调查', desc: '收集课程反馈意见', icon: Histogram, type: 'survey' },
      { id: 6, name: '器材增补投票', desc: '投票决定器材采购', icon: Basketball, type: 'decision' }
    ]
  }
  if (sid === 'linhai-experimental-primary') {
    return [
      { id: 1, name: '体育标兵评选', desc: '评选校级体育标兵', icon: Trophy, type: 'selection' },
      { id: 2, name: '最佳体育班级', desc: '评选年度最佳体育班级', icon: User, type: 'selection' },
      { id: 3, name: '会徽设计投票', desc: '校运动会会徽设计投票', icon: Star, type: 'match' },
      { id: 4, name: '拓展项目投票', desc: '选择课外拓展项目', icon: Document, type: 'decision' },
      { id: 5, name: '游泳课程调查', desc: '游泳课开设意向调查', icon: Histogram, type: 'survey' },
      { id: 6, name: '设施升级投票', desc: '体育馆设施升级投票', icon: Basketball, type: 'decision' }
    ]
  }
  return [
    { id: 1, name: '优秀学生评选', desc: '评选班级/年级优秀学生', icon: Trophy, type: 'selection' },
    { id: 2, name: '优秀教师评选', desc: '评选年度优秀教师', icon: User, type: 'selection' },
    { id: 3, name: '运动会投票', desc: '运动会项目/吉祥物投票', icon: Star, type: 'match' },
    { id: 4, name: '活动方案投票', desc: '选择最佳活动方案', icon: Document, type: 'decision' },
    { id: 5, name: '课程满意度调查', desc: '收集课程反馈意见', icon: Histogram, type: 'survey' },
    { id: 6, name: '体育器材采购', desc: '投票决定采购项目', icon: Basketball, type: 'decision' }
  ]
})

// 投票列表 — 持久化（修复多校隔离）
const pollsKey = computed(() => `smart_pe_polls_${schoolId.value}`)
const polls = ref([])

watch(pollsKey, (newKey) => {
  const stored = sessionStorage.getItem(newKey)
  if (stored) {
    polls.value = JSON.parse(stored)
  } else {
    polls.value = [...schoolPollsData.value]
    sessionStorage.setItem(newKey, JSON.stringify(polls.value))
  }
}, { immediate: true })

watch(polls, (newVal) => {
  sessionStorage.setItem(pollsKey.value, JSON.stringify(newVal))
}, { deep: true })

// 统计数据 — 从 polls 动态计算
const stats = computed(() => {
  const p = polls.value || []
  const totalVotes = p.reduce((sum, x) => sum + (x.totalVotes || 0), 0)
  const activePolls = p.filter(x => x.status === 'active').length
  const participants = p.reduce((sum, x) => sum + (x.participants || 0), 0)
  const totalStudents = students.value.length || 1
  const responseRate = Math.min(99, Math.round((participants / totalStudents) * 100))
  const lowParticipation = p.filter(x => (x.participationRate || 0) < 60).length
  return { totalVotes, activePolls, participants, responseRate, lowParticipation }
})

// 投票模板 — 持久化（修复多校隔离）
const templatesKey = computed(() => `smart_pe_vote_templates_${schoolId.value}`)
const voteTemplates = ref([])

watch(templatesKey, (newKey) => {
  const stored = sessionStorage.getItem(newKey)
  if (stored) {
    voteTemplates.value = JSON.parse(stored)
  } else {
    voteTemplates.value = [...schoolVoteTemplatesData.value]
    sessionStorage.setItem(newKey, JSON.stringify(voteTemplates.value))
  }
}, { immediate: true })

watch(voteTemplates, (newVal) => {
  sessionStorage.setItem(templatesKey.value, JSON.stringify(newVal))
}, { deep: true })

// 创建投票表单
const voteForm = ref({
  title: '',
  type: 'selection',
  strategy: 'single',
  anonymous: false,
  dailyLimit: 1,
  grades: [],
  startTime: null,
  endTime: null,
  media: []
})

// 伪随机数生成器 — 使用种子确保数据稳定
const seededRandom = (seed) => {
  if (isNaN(seed)) seed = 1
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// 字符串转数字种子
const getSeedFromString = (str) => {
  if (!str) return 1
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash)
}

// 实时排名数据 — 稳定且响应年级筛选
const realtimeRanking = computed(() => {
  const p = polls.value || []
  if (p.length === 0) return []
  
  const activePolls = p.filter(x => x.status === 'active')
  if (activePolls.length === 0) return []
  
  let stu = students.value || []
  if (stu.length === 0) return []
  
  if (filterGrade.value && filterGrade.value !== 'all') {
    const gradeMap = {
      '1': '一年级', '2': '二年级', '3': '三年级',
      '4': '四年级', '5': '五年级', '6': '六年级'
    }
    const targetGrade = gradeMap[filterGrade.value] || filterGrade.value
    stu = stu.filter(s => s.grade === targetGrade)
  }
  
  if (stu.length === 0) return []
  
  const rankings = stu.map((s) => {
    const seed = parseInt(s.id || s.studentId || s.code || '1') || getSeedFromString(s.id || s.name || '1')
    const baseVotes = 20 + Math.floor(seededRandom(seed) * 40)
    const variance = Math.floor(seededRandom(seed * 100) * 10) - 5
    
    const votes = Math.max(5, baseVotes + variance)
    
    return {
      name: s.name,
      className: `${s.grade}${s.class}`,
      votes: votes,
      avatar: ''
    }
  }).sort((a, b) => b.votes - a.votes)
  
  return rankings.slice(0, 10)
})

const maxVotes = computed(() => Math.max(...(realtimeRanking.value.map(item => item.votes) || [1])))

// 班级参与率数据 — 从 polls 数据计算真实参与率
const gradeClasses = computed(() => {
  const random = createSeededRandom(schoolId.value + '_gradeClasses')
  const p = polls.value || []
  const stu = students.value || []
  const gradeMap = {}
  
  stu.forEach(s => {
    const g = s.grade || '未知'
    const c = s.class || '未知'
    if (!gradeMap[g]) gradeMap[g] = {}
    if (!gradeMap[g][c]) gradeMap[g][c] = { total: 0, voted: 0 }
    gradeMap[g][c].total++
  })
  
  const activePolls = p.filter(x => x.status === 'active')
  if (activePolls.length > 0) {
    const avgParticipationRate = activePolls.reduce((sum, poll) => sum + (poll.participationRate || 0), 0) / activePolls.length
    
    Object.keys(gradeMap).forEach(g => {
      Object.keys(gradeMap[g]).forEach(c => {
        const variance = Math.floor(random() * 30) - 15
        gradeMap[g][c].voted = Math.floor(gradeMap[g][c].total * (avgParticipationRate + variance) / 100)
      })
    })
  } else {
    Object.keys(gradeMap).forEach(g => {
      Object.keys(gradeMap[g]).forEach(c => {
        gradeMap[g][c].voted = Math.floor(gradeMap[g][c].total * (50 + random() * 40) / 100)
      })
    })
  }
  
  return Object.entries(gradeMap).map(([grade, classes]) => ({
    grade,
    classes: Object.entries(classes).map(([name, data]) => ({
      name: `${name}`,
      rate: data.total > 0 ? Math.round((data.voted / data.total) * 100) : 0
    }))
  })).sort((a, b) => a.grade.localeCompare(b.grade, 'zh-CN'))
})

// 计算属性
const filteredPolls = computed(() => {
  return (polls.value || []).filter(poll => {
    const matchSearch = !searchQuery.value || poll.title.includes(searchQuery.value)
    const matchType = !filterType.value || poll.type === filterType.value
    const matchStatus = !filterStatus.value || poll.status === filterStatus.value
    const matchGrade = !filterGrade.value || filterGrade.value === 'all' || poll.groupRange === '全校' || poll.groupRange.includes(filterGrade.value)
    return matchSearch && matchType && matchStatus && matchGrade
  })
})

// 方法
const getTypeLabel = (type) => {
  const map = { selection: '评选类', match: '赛事类', decision: '决策类', survey: '调研类' }
  return map[type] || type
}

const getParticipationLevel = (rate) => {
  if (rate >= 80) return 'high'
  if (rate >= 60) return 'medium'
  return 'low'
}

const refreshData = () => {
  searchQuery.value = ''
  filterType.value = ''
  filterStatus.value = ''
  filterGrade.value = ''
  nextTick(() => { initCharts() })
  ElMessage.success('数据已刷新')
}

const viewDetail = (row) => {
  currentPoll.value = row
  detailVisible.value = true
}

const shareVote = (row) => {
  shareLink.value = `https://example.com/vote/${row.title.replace(/\s/g, '-')}`
  showShareModal.value = true
}

const copyLink = () => {
  navigator.clipboard.writeText(shareLink.value)
  ElMessage.success('链接已复制')
}

const generateReport = (row) => {
  if (!row) return
  reportData.value = {
    type: 'vote',
    studentName: row.title,
    className: '全校',
    studentId: row.id,
    scores: {
      '总票数': row.totalVotes,
      '参与率': row.participationRate,
      '满意度': 92
    },
    recommendation: `本次投票活动共收到${row.totalVotes}票，参与率${row.participationRate}%，活动效果良好。`
  }
  showReportExport.value = true
}

const deletePoll = (row) => {
  ElMessageBox.confirm(`确定删除投票「${row.title}」吗？`, '删除确认', { type: 'warning' })
    .then(() => {
      polls.value = (polls.value || []).filter(p => p.id !== row.id)
      ElMessage.success('投票已删除')
    })
    .catch(() => { ElMessage.error('删除投票失败，请重试') })
}

const handleReportExportStart = (data) => {
}

const handleReportExportEnd = () => {
  ElMessage.success('投票分析报告导出成功')
}

const classStudentList = computed(() => {
  if (!currentClass.value) return []
  const stu = students.value || []
  const className = currentClass.value.name
  return stu.slice(0, 10).map(s => ({
    name: s.name,
    status: s.name.charCodeAt(0) % 3 !== 0 ? '已参与' : '未参与'
  }))
})

const uploadPictures = () => {
  pendingMediaType.value = 'image'
  mediaFileInput.value?.click()
}

const uploadVideoCamera = () => {
  pendingMediaType.value = 'video'
  mediaFileInput.value?.click()
}

const uploadDocument = () => {
  pendingMediaType.value = 'document'
  mediaFileInput.value?.click()
}

const handleMediaFile = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  voteForm.value.media.push({ name: file.name, type: pendingMediaType.value })
  ElMessage.success(`已添加${pendingMediaType.value === 'image' ? '图片' : pendingMediaType.value === 'video' ? '视频' : '文档'}：${file.name}`)
  e.target.value = ''
}

const showClassDetail = (cls) => {
  currentClass.value = cls
  classDetailVisible.value = true
}

const removeMedia = (index) => {
  voteForm.value.media.splice(index, 1)
}

const exportAllReports = () => {
  // 导出CSV格式的投票数据
  const headers = ['学生姓名', '班级', '票数', '排名']
  const rows = realtimeRanking.value.map((item, index) => [
    item.name,
    item.className,
    item.votes,
    index + 1
  ])
  
  const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `投票分析报告_${fmtDate(new Date())}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
  
  ElMessage.success('投票分析报告已导出')
}

const saveVote = () => {
  if (!voteForm.value.title) {
    ElMessage.warning('请输入投票标题')
    return
  }
  
  const newPoll = {
    id: generateDeterministicId('vote', voteForm.value.title),
    title: voteForm.value.title,
    type: voteForm.value.type,
    strategy: voteForm.value.strategy === 'single' ? '单选' : voteForm.value.strategy === 'multiple' ? '多选' : '评分制',
    participants: 0,
    options: voteForm.value.type === 'selection' ? 6 : voteForm.value.type === 'decision' ? 4 : 5,
    groupRange: voteForm.value.grades.length > 0 ? voteForm.value.grades.join('-') + '年级' : '全校',
    status: 'active',
    endDate: voteForm.value.endTime ? fmtDate(new Date(voteForm.value.endTime)) : '',
    createTime: fmtDate(new Date()),
    participationRate: 0,
    totalVotes: 0,
    anonymous: voteForm.value.anonymous,
    dailyLimit: voteForm.value.dailyLimit
  }
  polls.value = [newPoll, ...(polls.value || [])]
  showCreateModal.value = false
  ElMessage.success('投票创建成功')
  voteForm.value = {
    title: '',
    type: 'selection',
    strategy: 'single',
    anonymous: false,
    dailyLimit: 1,
    grades: [],
    startTime: null,
    endTime: null,
    media: []
  }
  selectedTemplate.value = null
}

// 图表实例引用
const timeChartRef = ref(null)
const typeChartRef = ref(null)
let timeChartInstance = null
let typeChartInstance = null

const initCharts = () => {
  const random = createSeededRandom(schoolId.value + '_voteAnalysisCharts')
  // 投票时段分布图表 — 从 polls 动态计算
  if (timeChartRef.value) {
    if (timeChartInstance) { timeChartInstance.dispose(); timeChartInstance = null }
    timeChartInstance = echarts.init(timeChartRef.value)
    // 从 polls 计算时段分布（模拟：根据 createTime 分桶）
    const p = polls.value || []
    const hourBuckets = [0, 0, 0, 0, 0, 0]
    p.forEach(poll => {
      let hour = 12
      if (poll.createTime) {
        const parts = poll.createTime.split(' ')
        if (parts.length > 1) {
          hour = parseInt(parts[1].split(':')[0]) || 12
        } else {
          hour = 8 + Math.floor(random() * 8)
        }
      }
      const bucket = Math.floor(hour / 4)
      if (bucket >= 0 && bucket < 6) hourBuckets[bucket] += poll.totalVotes || 0
    })
    const barData = hourBuckets.some(v => v > 0) ? hourBuckets : [23, 156, 456, 623, 892, 345]

    timeChartInstance.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'bar' } },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: ['0-4时', '4-8时', '8-12时', '12-16时', '16-20时', '20-24时'] },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: barData,
        itemStyle: { color: '#1E5AA8', borderRadius: [4, 4, 0, 0] }
      }]
    })
  }

  // 投票类型分布图表 — 从 polls 动态计算
  if (typeChartRef.value) {
    if (typeChartInstance) { typeChartInstance.dispose(); typeChartInstance = null }
    typeChartInstance = echarts.init(typeChartRef.value)
    const p = polls.value || []
    const typeCount = {}
    p.forEach(poll => {
      const label = getTypeLabel(poll.type)
      typeCount[label] = (typeCount[label] || 0) + 1
    })
    const colors = { '评选类': '#1E5AA8', '赛事类': '#3B82F6', '决策类': '#F5A623', '调研类': '#E85D4E' }
    const pieData = Object.entries(typeCount).length > 0
      ? Object.entries(typeCount).map(([name, value]) => ({ value, name, itemStyle: { color: colors[name] || '#999' } }))
      : [
          { value: 35, name: '评选类', itemStyle: { color: '#1E5AA8' } },
          { value: 25, name: '赛事类', itemStyle: { color: '#3B82F6' } },
          { value: 20, name: '决策类', itemStyle: { color: '#F5A623' } },
          { value: 20, name: '调研类', itemStyle: { color: '#E85D4E' } }
        ]

    typeChartInstance.setOption({
      tooltip: { trigger: 'item' },
      legend: { bottom: 0 },
      series: [{
        type: 'pie',
        radius: ['50%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        data: pieData
      }]
    })
  }
}

// 监听 polls 变化重绘图表
watch(polls, () => {
  nextTick(() => { initCharts() })
}, { deep: true })

onMounted(() => {
  nextTick(() => {
    setTimeout(initCharts, 200)
  })
  window.addEventListener('resize', handleChartResize)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleChartResize)
  if (timeChartInstance) { timeChartInstance.dispose(); timeChartInstance = null }
  if (typeChartInstance) { typeChartInstance.dispose(); typeChartInstance = null }
})

const handleChartResize = () => {
  if (timeChartInstance) timeChartInstance.resize()
  if (typeChartInstance) typeChartInstance.resize()
}
</script>

<style scoped>
.vote-analysis-page {
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

.dashboard-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.content-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}

.live-badge {
  padding: 2px 8px;
  background: #FEE2E2;
  color: #991B1B;
  font-size: 12px;
  border-radius: 4px;
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 实时排名 */
.ranking-card {
  padding: 20px;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ranking-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #F7F8FA;
  border-radius: 8px;
}

.ranking-item.top-three {
  background: #F0FDF4;
}

.ranking-item.rank-1 {
  border-left: 4px solid #F5A623;
}

.ranking-item.rank-2 {
  border-left: 4px solid #9CA3AF;
}

.ranking-item.rank-3 {
  border-left: 4px solid #CD7C32;
}

.rank-number {
  font-size: 20px;
  font-weight: 700;
  color: #6B7280;
  width: 30px;
  text-align: center;
}

.top-three .rank-number {
  color: #1E5AA8;
}

.rank-content {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.rank-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #1E5AA8;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  overflow: hidden;
}

.rank-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  font-size: 16px;
}

.rank-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rank-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.rank-class {
  font-size: 12px;
  color: #6B7280;
}

.rank-votes {
  display: flex;
  align-items: baseline;
  gap: 2px;
}

.vote-count {
  font-size: 20px;
  font-weight: 700;
  color: #1E5AA8;
}

.vote-label {
  font-size: 12px;
  color: #6B7280;
}

.rank-progress {
  width: 120px;
  height: 6px;
  background: #E8EAED;
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: linear-gradient(90deg, #1E5AA8, #3B82F6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

/* 热力图 */
.heatmap-card {
  padding: 20px;
}

.legend {
  display: flex;
  gap: 16px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #6B7280;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 4px;
}

.legend-color.high { background: #1E5AA8; }
.legend-color.medium { background: #F5A623; }
.legend-color.low { background: #E85D4E; }

.heatmap-container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.grade-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.grade-label {
  font-size: 12px;
  color: #6B7280;
  font-weight: 500;
}

.class-grid {
  display: flex;
  gap: 8px;
}

.class-cell {
  flex: 1;
  padding: 12px 8px;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: transform 0.2s;
}

.class-cell:hover {
  transform: scale(1.02);
}

.class-cell.high {
  background: #DCFCE7;
}

.class-cell.medium {
  background: #FEF3C7;
}

.class-cell.low {
  background: #FEE2E2;
  position: relative;
}

.class-cell.low::after {
  content: '⚠';
  position: absolute;
  top: 4px;
  right: 4px;
  font-size: 12px;
}

.class-name {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
}

.class-rate {
  display: block;
  font-size: 12px;
  margin-top: 4px;
}

.class-cell.high .class-rate { color: #166534; }
.class-cell.medium .class-rate { color: #92400E; }
.class-cell.low .class-rate { color: #991B1B; }

/* 图表样式 */
.chart {
  height: 240px;
}

/* 列表卡片 */
.list-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

.type-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.type-selection { background: #DCFCE7; color: #166534; }
.type-match { background: #DBEAFE; color: #1E40AF; }
.type-decision { background: #FEF3C7; color: #92400E; }
.type-survey { background: #F3E8FF; color: #6B21A8; }

.strategy-tag {
  padding: 2px 8px;
  background: #F7F8FA;
  border-radius: 4px;
  font-size: 12px;
  color: #6B7280;
}

.group-tag {
  padding: 2px 8px;
  background: #F0FDF4;
  border-radius: 4px;
  font-size: 12px;
  color: #1E5AA8;
}

.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-success { background: #DCFCE7; color: #166534; }
.status-info { background: #F7F8FA; color: #6B7280; }

/* 创建投票表单 */
.create-vote-form {
  max-height: 60vh;
  overflow-y: auto;
}

.form-section {
  margin-bottom: 24px;
}

.form-section h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}

.template-card {
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.2s;
}

.template-card:hover {
  background: #F0FDF4;
}

.template-card.selected {
  border-color: #1E5AA8;
  background: #F0FDF4;
}

.template-icon {
  font-size: 32px;
  margin-bottom: 8px;
}

.template-name {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: #1A1A2E;
}

.template-desc {
  display: block;
  font-size: 12px;
  color: #6B7280;
  margin-top: 4px;
}

.group-settings {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.media-upload {
  display: flex;
  gap: 8px;
}

.media-preview {
  margin-top: 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.media-item {
  padding: 6px 12px;
  background: #F7F8FA;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 分享弹窗 */
.share-content {
  display: flex;
  gap: 24px;
  align-items: center;
}

.share-qrcode {
  text-align: center;
}

.qrcode-placeholder {
  width: 160px;
  height: 160px;
  background: #FFFFFF;
  border: 1px solid #E8EAED;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qrcode-svg {
  width: 120px;
  height: 120px;
}

.qrcode-label {
  display: block;
  margin-top: 8px;
  font-size: 12px;
  color: #6B7280;
}

.share-links {
  flex: 1;
}

.link-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.link-item label {
  font-size: 12px;
  color: #6B7280;
}

.share-buttons {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

/* 投票详情样式 */
.poll-detail {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 8px 0;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #E8EAED;
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-row span:first-child {
  color: #6B7280;
  font-size: 14px;
}

.detail-row span:last-child {
  color: #1A1A2E;
  font-size: 14px;
  font-weight: 500;
}

/* 班级参与详情样式 */
.class-detail-panel {
  text-align: center;
  padding: 20px 0;
}

.rate-display {
  font-size: 48px;
  font-weight: 700;
  color: #1E5AA8;
  line-height: 1;
  margin-bottom: 8px;
}

.class-detail-panel p {
  color: #6B7280;
  font-size: 14px;
  margin: 0 0 24px 0;
}

.class-detail-panel :deep(.el-table) {
  margin-top: 16px;
}
</style>