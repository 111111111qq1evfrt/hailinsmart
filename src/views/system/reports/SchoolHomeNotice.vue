<template>
  <div class="school-home-notice-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-filters">
        <el-input v-model="searchQuery" placeholder="搜索通知标题" clearable style="width: 240px" :prefix-icon="Search" />
        <el-select v-model="filterType" placeholder="通知类型" clearable style="width: 140px">
          <el-option label="作业通知" value="homework" />
          <el-option label="活动通知" value="activity" />
          <el-option label="安全提醒" value="safety" />
          <el-option label="成绩通知" value="score" />
        </el-select>
        <el-select v-model="filterPriority" placeholder="优先级" clearable style="width: 140px">
          <el-option label="紧急" value="urgent" />
          <el-option label="重要" value="important" />
          <el-option label="普通" value="normal" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="发送状态" clearable style="width: 140px">
          <el-option label="已发送" value="sent" />
          <el-option label="待发送" value="pending" />
          <el-option label="草稿" value="draft" />
        </el-select>
        <el-date-picker v-model="dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 240px" />
      </div>
      <div class="header-actions">
        <el-button :icon="Refresh" @click="refreshData">刷新</el-button>
        <el-button :icon="Download" @click="exportData">导出记录</el-button>
        <el-button type="primary" :icon="Edit" @click="createNotice">新建通知</el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item"><span class="stat-num">{{ stats.totalSent }}</span><span class="stat-label">已发送通知</span></div>
      <div class="stat-divider"></div>
      <div class="stat-item"><span class="stat-num text-primary">{{ stats.readRate }}%</span><span class="stat-label">阅读率</span></div>
      <div class="stat-divider"></div>
      <div class="stat-item"><span class="stat-num" style="color: #E85D4E">{{ stats.unconfirmed }}</span><span class="stat-label">未确认</span></div>
      <div class="stat-divider"></div>
      <div class="stat-item"><span class="stat-num" style="color: #3B82F6">{{ stats.replied }}</span><span class="stat-label">已回复</span></div>
      <div class="stat-divider"></div>
      <div class="stat-item"><span class="stat-num" style="color: #F5A623">{{ stats.todayCount }}</span><span class="stat-label">今日发送</span></div>
    </div>

    <!-- 图表区域 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header"><span class="card-title">通知类型分布</span></div>
        <div ref="typeChart" class="chart"></div>
      </div>
      <div class="chart-card">
        <div class="card-header"><span class="card-title">发送趋势</span></div>
        <div ref="trendChart" class="chart"></div>
      </div>
    </div>

    <!-- 列表区域 -->
    <div class="list-card">
      <div class="card-header">
        <span class="card-title">通知列表</span>
        <div class="header-actions">
          <el-input v-model="searchQuery" placeholder="搜索通知标题" clearable style="width: 200px" :prefix-icon="Search" size="small" />
          <el-button text :icon="Refresh" @click="refreshData">刷新</el-button>
        </div>
      </div>
      <el-table :data="paginatedNotices" stripe class="w-full" :height="500">
        <el-table-column prop="id" label="通知编号" width="140" />
        <el-table-column prop="title" label="通知标题" />
        <el-table-column prop="type" label="通知类型" width="120">
          <template #default="{ row }"><el-tag :type="getTypeColor(row.type)" size="small">{{ getTypeText(row.type) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="priority" label="优先级" width="100">
          <template #default="{ row }"><el-tag :type="getPriorityColor(row.priority)" size="small">{{ getPriorityText(row.priority) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="recipient" label="接收对象" width="140" />
        <el-table-column prop="confirmType" label="确认方式" width="120">
          <template #default="{ row }"><span class="confirm-type">{{ getConfirmTypeText(row.confirmType) }}</span></template>
        </el-table-column>
        <el-table-column prop="readCount" label="已读/总人数" width="140" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }"><el-tag :type="getStatusType(row.status)" size="small">{{ getStatusText(row.status) }}</el-tag></template>
        </el-table-column>
        <el-table-column prop="sendTime" label="发送时间" width="140" />
        <el-table-column label="操作" width="280">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="viewDetail(row)">查看详情</el-button>
            <el-button v-if="row.status === 'pending'" link type="primary" size="small" @click="viewUnconfirmed(row)">未读名单</el-button>
            <el-button link type="primary" size="small" @click="resendNotice(row)">编辑</el-button>
            <el-button link type="danger" size="small" @click="deleteNotice(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <div class="pagination-wrapper">
        <el-pagination v-model:current-page="currentPage" v-model:page-size="pageSize" :total="filteredNotices.length" :page-sizes="[8, 12, 16]" layout="total, sizes, prev, pager, next" small />
      </div>
    </div>

    <!-- 通知详情弹窗 -->
    <el-dialog v-model="showDetail" title="通知详情" width="700px">
      <div v-if="currentNotice" class="detail-content">
        <div class="detail-header">
          <div class="header-left">
            <h3>{{ currentNotice.title }}</h3>
            <div class="tags">
              <el-tag :type="getTypeColor(currentNotice.type)" size="small">{{ getTypeText(currentNotice.type) }}</el-tag>
              <el-tag :type="getPriorityColor(currentNotice.priority)" size="small">{{ getPriorityText(currentNotice.priority) }}</el-tag>
            </div>
          </div>
          <div class="header-right"><span class="send-time">{{ currentNotice.sendTime }}</span></div>
        </div>
        <div class="detail-body">
          <div class="rich-content" v-html="currentNotice.content"></div>
          <div v-if="currentNotice.attachments?.length" class="attachments-section">
            <h4 class="section-title">附件</h4>
            <div class="attachments-list">
              <div v-for="(file, index) in currentNotice.attachments" :key="index" class="attachment-item">
                <span class="file-icon"><el-icon :size="16" color="#1E5AA8"><component :is="getFileIcon(file.type)" /></el-icon></span>
                <div class="file-info"><span class="file-name">{{ file.name }}</span><span class="file-size">{{ file.size }}</span></div>
                <el-button link type="primary" size="small">下载</el-button>
              </div>
            </div>
          </div>
          <div v-if="currentNotice.images?.length" class="images-section">
            <h4 class="section-title">图片</h4>
            <div class="images-grid">
              <div v-for="(img, index) in currentNotice.images" :key="index" class="image-item">
                <div class="image-placeholder">📷</div><span class="image-name">{{ img.name }}</span>
              </div>
            </div>
          </div>
          <div v-if="currentNotice.video" class="video-section">
            <h4 class="section-title">视频</h4>
            <div class="video-player"><div class="video-placeholder"><span class="play-btn"><el-icon :size="24" color="#1E5AA8"><VideoPlay /></el-icon></span></div></div>
          </div>
          <div v-if="currentNotice.miniProgramLink" class="miniprogram-section">
            <h4 class="section-title">小程序</h4>
            <div class="miniprogram-box">
              <div class="miniprogram-icon"><el-icon :size="20" color="#1E5AA8"><Cellphone /></el-icon></div>
              <div class="miniprogram-info"><span class="miniprogram-name">{{ currentNotice.miniProgramLink.name }}</span><span class="miniprogram-desc">{{ currentNotice.miniProgramLink.desc }}</span></div>
              <el-button type="primary" size="small">打开</el-button>
            </div>
          </div>
        </div>
        <div class="detail-meta">
          <div class="meta-row"><span>接收对象：{{ currentNotice.recipient || '—' }}</span><span>确认方式：{{ getConfirmTypeText(currentNotice.confirmType) }}</span></div>
          <div class="meta-row"><span>阅读人数：{{ currentNotice.readCount || '0/0' }}</span><span>定时发送：{{ currentNotice.scheduledTime || '立即发送' }}</span></div>
          <div v-if="currentNotice.sendType === 'individual'" class="meta-row"><span>个人推送目标：{{ currentNotice.targetUsers || '—' }}</span></div>
          <div v-if="currentNotice.roles?.length" class="meta-row"><span>角色范围：{{ formatRoles(currentNotice.roles) }}</span></div>
          <div v-if="currentNotice.grades?.length" class="meta-row"><span>年级范围：{{ formatGrades(currentNotice.grades) }}</span></div>
          <div v-if="currentNotice.classes?.length" class="meta-row"><span>班级范围：{{ formatClasses(currentNotice.classes) }}</span></div>
        </div>
      </div>
      <template #footer><el-button @click="showDetail = false">关闭</el-button></template>
    </el-dialog>

    <!-- 新建通知弹窗 -->
    <el-dialog v-model="showCreateNotice" :title="editingId ? '编辑通知' : '新建通知'" width="800px" @closed="onDialogClosed">
      <el-form ref="formRef" :model="createNoticeForm" :rules="formRules" label-width="100px">
        <el-form-item label="通知标题" prop="title"><el-input v-model="createNoticeForm.title" placeholder="请输入通知标题" /></el-form-item>
        <el-form-item label="通知类型" prop="type">
          <el-select v-model="createNoticeForm.type" placeholder="请选择通知类型" class="w-full">
            <el-option label="作业通知" value="homework" /><el-option label="活动通知" value="activity" />
            <el-option label="安全提醒" value="safety" /><el-option label="成绩通知" value="score" />
          </el-select>
        </el-form-item>
        <el-form-item label="优先级">
          <el-radio-group v-model="createNoticeForm.priority"><el-radio label="urgent">紧急</el-radio><el-radio label="important">重要</el-radio><el-radio label="normal">普通</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="发送类型">
          <el-radio-group v-model="createNoticeForm.sendType" @change="onSendTypeChange"><el-radio label="group">群体推送</el-radio><el-radio label="individual">个人推送</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="角色筛选" v-if="createNoticeForm.sendType === 'group'">
          <el-checkbox-group v-model="createNoticeForm.roles"><el-checkbox label="学生" value="student" /><el-checkbox label="教师" value="teacher" /><el-checkbox label="家长" value="parent" /></el-checkbox-group>
        </el-form-item>
        <el-form-item label="年级筛选" v-if="createNoticeForm.sendType === 'group'">
          <el-select v-model="createNoticeForm.grades" multiple placeholder="请选择年级" class="w-full">
            <el-option label="一年级" value="grade1" /><el-option label="二年级" value="grade2" /><el-option label="三年级" value="grade3" />
            <el-option label="四年级" value="grade4" /><el-option label="五年级" value="grade5" /><el-option label="六年级" value="grade6" />
          </el-select>
        </el-form-item>
        <el-form-item label="班级筛选" v-if="createNoticeForm.sendType === 'group'">
          <el-select v-model="createNoticeForm.classes" multiple placeholder="请选择班级" class="w-full">
            <el-option label="一年级1班" value="class11" /><el-option label="一年级2班" value="class12" /><el-option label="一年级3班" value="class13" />
            <el-option label="二年级1班" value="class21" /><el-option label="二年级2班" value="class22" /><el-option label="二年级3班" value="class23" />
            <el-option label="三年级1班" value="class31" /><el-option label="三年级2班" value="class32" /><el-option label="三年级3班" value="class33" />
            <el-option label="四年级1班" value="class41" /><el-option label="四年级2班" value="class42" /><el-option label="四年级3班" value="class43" />
            <el-option label="五年级1班" value="class51" /><el-option label="五年级2班" value="class52" /><el-option label="五年级3班" value="class53" />
            <el-option label="六年级1班" value="class61" /><el-option label="六年级2班" value="class62" /><el-option label="六年级3班" value="class63" />
          </el-select>
        </el-form-item>
        <el-form-item label="个人推送" v-if="createNoticeForm.sendType === 'individual'">
          <el-input v-model="createNoticeForm.targetUsers" placeholder="请输入学工号或手机号，多个用逗号分隔" />
          <span class="tips">支持学工号、手机号批量输入，最多支持100人</span>
        </el-form-item>
        <el-form-item label="紧急通道" v-if="createNoticeForm.priority === 'urgent'">
          <el-switch v-model="createNoticeForm.urgentChannel" active-text="启用多通道推送" inactive-text="仅APP推送" />
          <div v-if="createNoticeForm.urgentChannel" class="urgent-channels">
            <el-checkbox-group v-model="createNoticeForm.channels"><el-checkbox label="短信" value="sms" /><el-checkbox label="APP推送" value="app" /><el-checkbox label="微信服务号" value="wechat" /></el-checkbox-group>
          </div>
        </el-form-item>
        <el-form-item label="确认方式">
          <el-radio-group v-model="createNoticeForm.confirmType"><el-radio label="click">一键阅读</el-radio><el-radio label="button">按钮确认</el-radio><el-radio label="signature">手写签字</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="通知内容" prop="content"><el-input v-model="createNoticeForm.content" type="textarea" :rows="6" placeholder="请输入通知内容" /></el-form-item>
        <el-form-item label="定时发送">
          <el-switch v-model="createNoticeForm.isScheduled" active-text="启用" inactive-text="关闭" />
          <el-date-picker v-if="createNoticeForm.isScheduled" v-model="createNoticeForm.scheduledTime" type="datetime" placeholder="选择发送时间" style="margin-left: 12px" />
        </el-form-item>
        <el-form-item label="附件上传">
          <el-upload drag multiple action="/upload" :auto-upload="false">
            <el-icon class="el-icon--upload"><upload-filled /></el-icon>
            <div class="el-upload__text">将文件拖到此处，或 <em>点击上传</em></div>
            <template #tip><div class="el-upload__tip">支持 PDF、Word、Excel 等格式，单个文件不超过 20MB</div></template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateNotice = false">取消</el-button>
        <el-button type="primary" @click="submitNotice">保存草稿</el-button>
        <el-button type="success" @click="sendNewNotice">{{ editingId ? '保存修改' : '立即发送' }}</el-button>
      </template>
    </el-dialog>

    <!-- 未读名单弹窗 -->
    <el-dialog v-model="showUnconfirmed" :title="`未读名单 - ${unconfirmedNotice?.title || ''}`" width="560px">
      <el-table :data="unconfirmedList" stripe size="small" max-height="360">
        <el-table-column prop="name" label="姓名" min-width="100" />
        <el-table-column prop="role" label="角色" min-width="80" />
        <el-table-column prop="className" label="班级" min-width="120" />
        <el-table-column prop="phone" label="联系方式" min-width="130" />
      </el-table>
      <template #footer>
        <el-button type="primary" @click="remindUnconfirmed">一键提醒</el-button>
        <el-button @click="showUnconfirmed = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount, isRef } from 'vue'
import { Edit, Download, Search, Refresh, UploadFilled, VideoPlay, Cellphone, Document, Histogram, Link } from '@element-plus/icons-vue'
import echarts from '@/utils/echarts'
import { ElMessage, ElMessageBox } from 'element-plus'
import store from '@/store/global'
import { generateDeterministicId } from '@/utils/seededRandom'
import { sendBroadcastNotification } from '@/composables/useNotifications'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

// ==================== 通用持久化封装（直接写在这里）====================
function usePersistedRef(key, defaultValue) {
  const getKey = () => (isRef(key) ? key.value : key)

  const readFromStorage = () => {
    const k = getKey()
    const stored = sessionStorage.getItem(k)
    if (stored && stored !== 'undefined' && stored !== 'null') {
      try { return JSON.parse(stored) } catch (e) { /* fall through */ }
    }
    return undefined
  }

  const getDefault = () => (typeof defaultValue === 'function' ? defaultValue() : defaultValue)
  const initial = readFromStorage() !== undefined ? readFromStorage() : getDefault()
  const data = ref(initial)

  watch(data, (v) => {
    sessionStorage.setItem(getKey(), JSON.stringify(v))
  }, { deep: true })

  if (isRef(key)) {
    watch(key, () => {
      const stored = readFromStorage()
      data.value = stored !== undefined ? stored : getDefault()
    })
  }

  return data
}

// ==================== MOCK 数据（按学校区分）====================
const MOCK_DATA = {
  'hailin-second-primary': {
    notices: [
      {
        id: 'HL2-TZ20250115001',
        title: '关于开展2025年秋季运动会的通知',
        type: 'activity',
        priority: 'important',
        recipient: '全体家长',
        content: '<p>为丰富校园文化生活，增强学生体质，海林二小定于<strong class="text-primary">11月15日-17日</strong>举行秋季运动会。</p><p>请各位家长鼓励孩子积极参与，做好赛前准备。</p>',
        confirmType: 'button',
        attachments: [
          { name: '运动会报名表.xlsx', type: 'excel', size: '128KB' },
          { name: '运动会秩序册.pdf', type: 'pdf', size: '2.5MB' }
        ],
        images: [{ name: '运动会宣传海报.jpg' }],
        video: true,
        miniProgramLink: { name: '运动会报名', desc: '点击报名参加运动会' },
        readCount: '235/280',
        status: 'sent',
        sendTime: '2025-11-10 09:00',
        scheduledTime: '2025-11-10 09:00'
      },
      {
        id: 'HL2-TZ20250115002',
        title: '安全第一！上下学交通安全提醒',
        type: 'safety',
        priority: 'urgent',
        recipient: '全体家长',
        content: '<p>近期气温下降，天气多变，请家长提醒孩子注意上下学交通安全。</p>',
        confirmType: 'click',
        readCount: '278/280',
        status: 'sent',
        sendTime: '2025-11-09 16:30'
      },
      {
        id: 'HL2-TZ20250114001',
        title: '第11周数学作业布置',
        type: 'homework',
        priority: 'normal',
        recipient: '四年级全体家长',
        content: '<p>本周数学作业：</p><ul><li>课本第45-48页习题</li><li>同步练习册第3单元综合练习</li></ul>',
        confirmType: 'click',
        readCount: '76/90',
        status: 'sent',
        sendTime: '2025-11-08 15:00'
      },
      {
        id: 'HL2-TZ20250114002',
        title: '期中成绩查询通知',
        type: 'score',
        priority: 'important',
        recipient: '五、六年级全体家长',
        content: '<p>期中考试已结束，家长可通过学校公众号查询孩子成绩。</p>',
        confirmType: 'signature',
        readCount: '168/190',
        status: 'sent',
        sendTime: '2025-11-07 17:00'
      },
      {
        id: 'HL2-TZ20250113001',
        title: '家长会通知（待发送）',
        type: 'activity',
        priority: 'important',
        recipient: '全体家长',
        content: '拟定于11月20日召开家长会，讨论学生近期学习情况。',
        confirmType: 'button',
        readCount: '0/280',
        status: 'pending',
        sendTime: '—',
        scheduledTime: '2025-11-15 08:00'
      }
    ],
    stats: { totalSent: 256, readRate: 94, unconfirmed: 45, replied: 86, todayCount: 12 },
    typeStats: { homework: 86, activity: 68, safety: 52, score: 50 },
    weeklyTrend: [
      { day: '周一', value: 65 }, { day: '周二', value: 80 }, { day: '周三', value: 55 },
      { day: '周四', value: 70 }, { day: '周五', value: 90 }, { day: '周六', value: 40 }, { day: '周日', value: 35 }
    ],
    unconfirmed: [
      { name: '张宏森', role: '家长', className: '一年级4班', phone: '138****1234' },
      { name: '高芸熙', role: '家长', className: '一年级4班', phone: '139****5678' },
      { name: '张桐昕', role: '学生', className: '二年级4班', phone: '137****9012' },
      { name: '范晨熙', role: '家长', className: '二年级4班', phone: '136****3456' }
    ]
  },
  'hailin-zirong-primary': {
    notices: [
      {
        id: 'ZR-TZ20250115001',
        title: '子荣小学科技节活动通知',
        type: 'activity',
        priority: 'important',
        recipient: '全体学生及家长',
        content: '<p>子荣小学定于<strong class="text-primary">11月20日</strong>举办科技节活动，欢迎各位家长莅临参观。</p>',
        confirmType: 'button',
        attachments: [{ name: '科技节活动安排.pdf', type: 'pdf', size: '1.2MB' }],
        images: [{ name: '科技节宣传海报.jpg' }],
        readCount: '185/220',
        status: 'sent',
        sendTime: '2025-11-12 10:00',
        scheduledTime: '2025-11-12 10:00'
      },
      {
        id: 'ZR-TZ20250115002',
        title: '冬季流感预防温馨提示',
        type: 'safety',
        priority: 'urgent',
        recipient: '全体家长',
        content: '<p>冬季是流感高发期，请家长注意孩子保暖，勤洗手，多喝水。如有不适请及时就医。</p>',
        confirmType: 'click',
        readCount: '218/220',
        status: 'sent',
        sendTime: '2025-11-11 14:30'
      },
      {
        id: 'ZR-TZ20250114001',
        title: '语文背诵作业布置',
        type: 'homework',
        priority: 'normal',
        recipient: '三年级全体家长',
        content: '<p>本周语文作业：背诵古诗三首，完成练习册第25-28页。</p>',
        confirmType: 'click',
        readCount: '45/55',
        status: 'sent',
        sendTime: '2025-11-10 16:00'
      },
      {
        id: 'ZR-TZ20250114002',
        title: '体育测试成绩公示',
        type: 'score',
        priority: 'important',
        recipient: '四年级全体家长',
        content: '<p>四年级体育测试成绩已公示，请家长查看孩子成绩并督促加强锻炼。</p>',
        confirmType: 'signature',
        readCount: '48/55',
        status: 'sent',
        sendTime: '2025-11-09 17:30'
      },
      {
        id: 'ZR-TZ20250113001',
        title: '消防安全演练通知',
        type: 'activity',
        priority: 'urgent',
        recipient: '全体师生',
        content: '定于11月18日下午进行消防安全演练，请各班级做好准备。',
        confirmType: 'button',
        readCount: '0/220',
        status: 'pending',
        sendTime: '—',
        scheduledTime: '2025-11-18 14:00'
      }
    ],
    stats: { totalSent: 186, readRate: 92, unconfirmed: 32, replied: 68, todayCount: 8 },
    typeStats: { homework: 62, activity: 58, safety: 38, score: 28 },
    weeklyTrend: [
      { day: '周一', value: 45 }, { day: '周二', value: 60 }, { day: '周三', value: 40 },
      { day: '周四', value: 55 }, { day: '周五', value: 70 }, { day: '周六', value: 30 }, { day: '周日', value: 25 }
    ],
    unconfirmed: [
      { name: '赵子涵', role: '学生', className: '三年级2班', phone: '135****7890' },
      { name: '马建华', role: '教师', className: '三年级2班', phone: '138****1234' },
      { name: '赵雨萱', role: '家长', className: '四年级1班', phone: '139****5678' }
    ]
  },
  'linhai-experimental-primary': {
    notices: [
      {
        id: 'LH-TZ20250115001',
        title: '林海实验小学读书节活动',
        type: 'activity',
        priority: 'important',
        recipient: '全体学生及家长',
        content: '<p>林海实验小学首届读书节将于<strong class="text-primary">11月25日-30日</strong>举行，欢迎各位家长参与亲子阅读活动。</p>',
        confirmType: 'button',
        attachments: [{ name: '读书节活动方案.pdf', type: 'pdf', size: '856KB' }],
        images: [{ name: '读书节海报.jpg' }],
        readCount: '245/260',
        status: 'sent',
        sendTime: '2025-11-13 09:30',
        scheduledTime: '2025-11-13 09:30'
      },
      {
        id: 'LH-TZ20250115002',
        title: '预防校园欺凌专题教育',
        type: 'safety',
        priority: 'urgent',
        recipient: '全体学生及家长',
        content: '<p>学校将开展预防校园欺凌专题教育，请家长配合学校做好孩子的安全教育。</p>',
        confirmType: 'click',
        readCount: '258/260',
        status: 'sent',
        sendTime: '2025-11-12 15:00'
      },
      {
        id: 'LH-TZ20250114001',
        title: '英语单元测试作业',
        type: 'homework',
        priority: 'normal',
        recipient: '五年级全体家长',
        content: '<p>请督促孩子完成英语第三单元测试卷，并复习重点单词和句型。</p>',
        confirmType: 'click',
        readCount: '52/60',
        status: 'sent',
        sendTime: '2025-11-11 14:30'
      },
      {
        id: 'LH-TZ20250114002',
        title: '综合素质评价结果通知',
        type: 'score',
        priority: 'important',
        recipient: '六年级全体家长',
        content: '<p>六年级综合素质评价结果已发布，请家长登录平台查看详细报告。</p>',
        confirmType: 'signature',
        readCount: '55/60',
        status: 'sent',
        sendTime: '2025-11-10 16:00'
      },
      {
        id: 'LH-TZ20250113001',
        title: '元旦文艺汇演筹备通知',
        type: 'activity',
        priority: 'important',
        recipient: '全体师生',
        content: '元旦文艺汇演定于12月31日举行，请各班级积极准备节目。',
        confirmType: 'button',
        readCount: '0/260',
        status: 'pending',
        sendTime: '—',
        scheduledTime: '2025-11-20 10:00'
      }
    ],
    stats: { totalSent: 218, readRate: 95, unconfirmed: 28, replied: 75, todayCount: 10 },
    typeStats: { homework: 72, activity: 62, safety: 42, score: 42 },
    weeklyTrend: [
      { day: '周一', value: 55 }, { day: '周二', value: 70 }, { day: '周三', value: 45 },
      { day: '周四', value: 60 }, { day: '周五', value: 80 }, { day: '周六', value: 35 }, { day: '周日', value: 30 }
    ],
    unconfirmed: [
      { name: '王海燕', role: '教师', className: '五年级3班', phone: '136****1234' },
      { name: '黄子豪', role: '学生', className: '六年级1班', phone: '137****5678' },
      { name: '李雨桐', role: '家长', className: '六年级2班', phone: '138****9012' }
    ]
  }
}

const getMockData = (schoolId) => {
  return MOCK_DATA[schoolId] || MOCK_DATA['hailin-second-primary']
}

// ==================== 页面状态 ====================
const searchQuery = ref('')
const filterType = ref('')
const filterPriority = ref('')
const filterStatus = ref('')
const dateRange = ref([])
const showDetail = ref(false)
const showCreateNotice = ref(false)
const showUnconfirmed = ref(false)
const unconfirmedNotice = ref(null)
const currentNotice = ref(null)
const currentPage = ref(1)
const pageSize = ref(12)
const editingId = ref(null)
const formRef = ref(null)

const formRules = {
  title: [{ required: true, message: '请输入通知标题', trigger: 'blur' }],
  type: [{ required: true, message: '请选择通知类型', trigger: 'change' }],
  content: [{ required: true, message: '请输入通知内容', trigger: 'blur' }]
}

// ==================== 持久化数据（核心：用 usePersistedRef 包一层）====================
const schoolMockData = computed(() => getMockData(schoolId.value))

const notices = usePersistedRef(computed(() => `smart_pe_notices_${schoolId.value}`), () => [...(schoolMockData.value.notices || [])])
const stats = usePersistedRef(computed(() => `smart_pe_notice_stats_${schoolId.value}`), () => ({ ...schoolMockData.value.stats }))
const typeStats = usePersistedRef(computed(() => `smart_pe_type_stats_${schoolId.value}`), () => ({ ...schoolMockData.value.typeStats }))
const weeklyTrend = usePersistedRef(computed(() => `smart_pe_weekly_trend_${schoolId.value}`), () => [...schoolMockData.value.weeklyTrend])
const unconfirmedList = usePersistedRef(computed(() => `smart_pe_unconfirmed_${schoolId.value}`), () => [...schoolMockData.value.unconfirmed])

// ==================== 表单 ====================
const createNoticeForm = ref({
  title: '', type: '', priority: 'normal', sendType: 'group', roles: [], grades: [], classes: [],
  targetUsers: '', urgentChannel: false, channels: ['app'], confirmType: 'click', content: '',
  isScheduled: false, scheduledTime: null, attachments: [], images: [], video: null, miniProgramLink: null
})

const onSendTypeChange = () => {
  if (createNoticeForm.value.sendType === 'group') {
    createNoticeForm.value.targetUsers = ''
  } else {
    createNoticeForm.value.roles = []
    createNoticeForm.value.grades = []
    createNoticeForm.value.classes = []
  }
}

// ==================== 图表 ====================
const typeChart = ref(null)
const trendChart = ref(null)
let typeChartInstance = null
let trendChartInstance = null

// ==================== 计算属性 ====================
const filteredNotices = computed(() => {
  return notices.value.filter(notice => {
    const matchSearch = !searchQuery.value || notice.title.includes(searchQuery.value)
    const matchType = !filterType.value || notice.type === filterType.value
    const matchPriority = !filterPriority.value || notice.priority === filterPriority.value
    const matchStatus = !filterStatus.value || notice.status === filterStatus.value
    let matchDate = true
    if (dateRange.value && dateRange.value.length === 2) {
      const noticeTime = notice.sendTime === '—' ? null : new Date(notice.sendTime).getTime()
      if (noticeTime) {
        const startTime = new Date(dateRange.value[0]).setHours(0, 0, 0, 0)
        const endTime = new Date(dateRange.value[1]).setHours(23, 59, 59, 999)
        matchDate = noticeTime >= startTime && noticeTime <= endTime
      }
    }
    return matchSearch && matchType && matchPriority && matchStatus && matchDate
  })
})

const paginatedNotices = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredNotices.value.slice(start, end)
})

// ==================== 工具函数 ====================
const getTypeText = (type) => ({ homework: '作业通知', activity: '活动通知', safety: '安全提醒', score: '成绩通知' }[type] || type)
const getTypeColor = (type) => ({ homework: 'success', activity: 'primary', safety: 'warning', score: 'info' }[type] || 'info')
const getPriorityText = (priority) => ({ urgent: '紧急', important: '重要', normal: '普通' }[priority] || '普通')
const getPriorityColor = (priority) => ({ urgent: 'danger', important: 'warning', normal: 'info' }[priority] || 'info')
const getConfirmTypeText = (type) => ({ click: '一键阅读', button: '按钮确认', signature: '手写签字' }[type] || '一键阅读')
const getFileIcon = (type) => ({ pdf: Document, word: Edit, excel: Histogram, ppt: Document }[type] || Link)
const getStatusType = (status) => ({ sent: 'success', pending: 'warning' }[status] || 'info')
const getStatusText = (status) => ({ sent: '已发送', pending: '待发送', draft: '草稿' }[status] || '草稿')
const formatRoles = (roles) => roles.map(r => ({ student: '学生', teacher: '教师', parent: '家长' }[r] || r)).join('、')
const formatGrades = (grades) => grades.map(g => ({ grade1: '一年级', grade2: '二年级', grade3: '三年级', grade4: '四年级', grade5: '五年级', grade6: '六年级' }[g] || g)).join('、')
const formatClasses = (classes) => {
  const gradeNames = ['一', '二', '三', '四', '五', '六']
  return classes.map(c => {
    const m = /^class(\d)(\d)$/.exec(c)
    if (m) return `${gradeNames[parseInt(m[1]) - 1]}年级${m[2]}班`
    return c
  }).join('、')
}

// ==================== 图表初始化 ====================
const initTypeChart = () => {
  if (!typeChart.value) return
  if (typeChartInstance) { typeChartInstance.dispose(); typeChartInstance = null }
  typeChartInstance = echarts.init(typeChart.value)
  typeChartInstance.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
    legend: { bottom: 0, textStyle: { color: '#6B7280' } },
    series: [{
      type: 'pie', radius: ['40%', '65%'], center: ['50%', '45%'],
      itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
      label: { show: true, formatter: '{b}\n{d}%' },
      data: [
        { value: typeStats.value.homework, name: '作业通知', itemStyle: { color: '#1E5AA8' } },
        { value: typeStats.value.activity, name: '活动通知', itemStyle: { color: '#3B82F6' } },
        { value: typeStats.value.safety, name: '安全提醒', itemStyle: { color: '#F5A623' } },
        { value: typeStats.value.score, name: '成绩通知', itemStyle: { color: '#E85D4E' } }
      ]
    }]
  })
}

const initTrendChart = () => {
  if (!trendChart.value) return
  if (trendChartInstance) { trendChartInstance.dispose(); trendChartInstance = null }
  trendChartInstance = echarts.init(trendChart.value)
  trendChartInstance.setOption({
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { type: 'category', data: weeklyTrend.value.map(i => i.day), axisLine: { lineStyle: { color: '#E8EAED' } }, axisLabel: { color: '#6B7280' } },
    yAxis: { type: 'value', axisLine: { show: false }, splitLine: { lineStyle: { color: '#F7F8FA' } }, axisLabel: { color: '#6B7280' } },
    series: [{ type: 'bar', barWidth: '50%', itemStyle: { color: '#1E5AA8', borderRadius: [4, 4, 0, 0] }, data: weeklyTrend.value.map(i => i.value) }]
  })
}

onMounted(() => { nextTick(() => { setTimeout(() => { initTypeChart(); initTrendChart() }, 200) }) })
onBeforeUnmount(() => { if (typeChartInstance) typeChartInstance.dispose(); if (trendChartInstance) trendChartInstance.dispose() })

// ==================== 增删改查 ====================
const getRecipientCount = (recipient) => {
  if (!recipient) return 0
  // 更具体的条件优先判断
  if (recipient.includes('全体师生')) return 350
  if (recipient.includes('全体学生')) return 300
  if (recipient.includes('全体家长')) return 280
  if (recipient.includes('全体')) return 280
  if (recipient.includes('五、六年级')) return 100
  if (recipient.includes('一年级')) return 50
  if (recipient.includes('二年级')) return 50
  if (recipient.includes('三年级')) return 50
  if (recipient.includes('四年级')) return 50
  if (recipient.includes('五年级')) return 50
  if (recipient.includes('六年级')) return 50
  if (recipient.includes('群体推送')) return 150
  if (recipient.includes('个人推送')) return 1
  if (recipient.includes('草稿')) return 0
  return 100
}

const addNotice = (noticeData) => {
  const totalCount = getRecipientCount(noticeData.recipient)
  const newNotice = { id: generateDeterministicId('TZ', (noticeData.title || '') + '-' + (noticeData.type || '')), ...noticeData, sendTime: new Date().toLocaleString(), readCount: `0/${totalCount}`, status: noticeData.status || 'sent' }
  notices.value.unshift(newNotice)
  // 只有已发送通知才增加统计
  if (newNotice.status === 'sent') {
    stats.value.totalSent++
    stats.value.todayCount++
    typeStats.value[noticeData.type] = (typeStats.value[noticeData.type] || 0) + 1
  }
}

const deleteNotice = async (row) => {
  const displayTitle = row.title || row.id || '未知通知'
  try {
    await ElMessageBox.confirm(
      `确定要删除通知「${displayTitle}」吗？删除后不可恢复。`,
      '删除确认',
      { confirmButtonText: '确定删除', cancelButtonText: '取消', type: 'warning', confirmButtonType: 'danger' }
    )
  } catch {
    return
  }
  if (row.status === 'sent') {
    stats.value.totalSent--
    typeStats.value[row.type] = Math.max(0, (typeStats.value[row.type] || 0) - 1)
  }
  notices.value = notices.value.filter(n => n.id !== row.id)
  ElMessage.success('通知已删除')
}

// ==================== 原有方法 ====================
const viewDetail = (row) => { currentNotice.value = row; showDetail.value = true }
const viewUnconfirmed = (row) => { unconfirmedNotice.value = row; showUnconfirmed.value = true }
const remindUnconfirmed = () => { ElMessage.success(`已向 ${unconfirmedList.value.length} 位未读用户发送提醒`) }
const refreshData = () => {
  currentPage.value = 1
  searchQuery.value = ''
  filterType.value = ''
  filterPriority.value = ''
  filterStatus.value = ''
  dateRange.value = []
  const storedNotices = sessionStorage.getItem(`smart_pe_notices_${schoolId.value}`)
  if (storedNotices) {
    try { 
      const parsed = JSON.parse(storedNotices)
      if (Array.isArray(parsed)) {
        notices.value = parsed
      } else {
        notices.value = [...(schoolMockData.value.notices || [])]
        sessionStorage.removeItem(`smart_pe_notices_${schoolId.value}`)
      }
    } catch (e) { 
      notices.value = [...(schoolMockData.value.notices || [])]
      sessionStorage.removeItem(`smart_pe_notices_${schoolId.value}`)
    }
  } else {
    notices.value = [...(schoolMockData.value.notices || [])]
  }
  ElMessage.success('数据已刷新')
}

const exportData = () => {
  const headers = ['标题', '类型', '优先级', '接收人', '状态', '发送时间']
  const rows = filteredNotices.value.map(n => [n.title, getTypeText(n.type), getPriorityText(n.priority), n.recipient, getStatusText(n.status), n.sendTime])
  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = `通知记录_${new Date().toLocaleDateString()}.csv`
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url)
  ElMessage.success('通知记录已导出')
}

const createNotice = () => {
  createNoticeForm.value = {
    title: '', type: '', priority: 'normal', sendType: 'group', roles: [], grades: [], classes: [],
    targetUsers: '', urgentChannel: false, channels: ['app'], confirmType: 'click', content: '',
    isScheduled: false, scheduledTime: null, attachments: [], images: [], video: null, miniProgramLink: null
  }
  editingId.value = null
  showCreateNotice.value = true
}

const onDialogClosed = () => {
  if (formRef.value) formRef.value.clearValidate()
  createNoticeForm.value = {
    title: '', type: '', priority: 'normal', sendType: 'group', roles: [], grades: [], classes: [],
    targetUsers: '', urgentChannel: false, channels: ['app'], confirmType: 'click', content: '',
    isScheduled: false, scheduledTime: null, attachments: [], images: [], video: null, miniProgramLink: null
  }
  editingId.value = null
}

const submitNotice = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  const noticeData = {
    title: createNoticeForm.value.title, type: createNoticeForm.value.type, priority: createNoticeForm.value.priority,
    recipient: '草稿', content: createNoticeForm.value.content, confirmType: createNoticeForm.value.confirmType, status: 'draft'
  }
  addNotice(noticeData)
  // 草稿也推送到铃铛（管理员可见所有通知）
  pushToBell(noticeData)
  ElMessage.success('草稿已保存')
  showCreateNotice.value = false
}

const buildRecipientText = (form) => {
  if (form.sendType === 'individual') {
    return form.targetUsers || '个人推送'
  }
  // 群体推送：根据选择的角色/年级/班级生成接收对象描述
  const parts = []
  if (form.roles && form.roles.length > 0) {
    parts.push(form.roles.map(r => ({ student: '学生', teacher: '教师', parent: '家长' }[r] || r)).join('、'))
  }
  if (form.grades && form.grades.length > 0) {
    const gradeMap = { grade1: '一年级', grade2: '二年级', grade3: '三年级', grade4: '四年级', grade5: '五年级', grade6: '六年级' }
    parts.push(form.grades.map(g => gradeMap[g] || g).join('、'))
  }
  if (form.classes && form.classes.length > 0) {
    const gradeNames = ['一', '二', '三', '四', '五', '六']
    const classMap = {}
    for (let g = 1; g <= 6; g++) {
      for (let c = 1; c <= 3; c++) {
        classMap[`class${g}${c}`] = `${gradeNames[g - 1]}年级${c}班`
      }
    }
    parts.push(form.classes.map(c => classMap[c] || c).join('、'))
  }
  return parts.length > 0 ? parts.join(' - ') : '全体家长'
}

// 发送通知到铃铛（广播给所有用户）
const pushToBell = (noticeData) => {
  sendBroadcastNotification({
    title: `新通知：${noticeData.title}`,
    content: noticeData.content.replace(/<[^>]+>/g, '').slice(0, 100),
    type: 'general',
    relatedStudents: []
  })
}

const sendNewNotice = async () => {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch {
    return
  }
  const recipient = buildRecipientText(createNoticeForm.value)
  const noticeData = {
    title: createNoticeForm.value.title, type: createNoticeForm.value.type, priority: createNoticeForm.value.priority,
    recipient, content: createNoticeForm.value.content, confirmType: createNoticeForm.value.confirmType,
    // 保存表单结构化数据用于编辑回显
    sendType: createNoticeForm.value.sendType,
    roles: [...(createNoticeForm.value.roles || [])],
    grades: [...(createNoticeForm.value.grades || [])],
    classes: [...(createNoticeForm.value.classes || [])],
    targetUsers: createNoticeForm.value.targetUsers || '',
    urgentChannel: createNoticeForm.value.urgentChannel || false,
    channels: [...(createNoticeForm.value.channels || ['app'])],
    isScheduled: createNoticeForm.value.isScheduled || false,
    scheduledTime: createNoticeForm.value.scheduledTime || null,
    attachments: [], images: [], video: null, miniProgramLink: null
  }
  if (editingId.value) {
    // 编辑模式：更新已有通知
    const idx = notices.value.findIndex(n => n.id === editingId.value)
    if (idx !== -1) {
      notices.value[idx] = { ...notices.value[idx], ...noticeData }
      ElMessage.success('通知已更新')
    }
    editingId.value = null
  } else {
    addNotice(noticeData)
    // 推送到铃铛
    pushToBell(noticeData)
    ElMessage.success('通知已发送')
  }
  showCreateNotice.value = false
}

const resendNotice = (row) => {
  createNoticeForm.value = {
    title: row.title || '',
    type: row.type || '',
    priority: row.priority || 'normal',
    sendType: row.sendType || 'group',
    roles: [...(row.roles || [])],
    grades: [...(row.grades || [])],
    classes: [...(row.classes || [])],
    targetUsers: row.targetUsers || '',
    urgentChannel: row.urgentChannel || false,
    channels: [...(row.channels || ['app'])],
    confirmType: row.confirmType || 'click',
    content: row.content || '',
    isScheduled: row.isScheduled || false,
    scheduledTime: row.scheduledTime || null,
    attachments: [...(row.attachments || [])],
    images: [...(row.images || [])],
    video: row.video || null,
    miniProgramLink: row.miniProgramLink || null
  }
  editingId.value = row.id
  showCreateNotice.value = true
}
</script>

<style scoped>
.school-home-notice-page { display: flex; flex-direction: column; gap: 24px; }
.header-filters { display: flex; gap: 12px; flex-wrap: wrap; }
.header-actions { display: flex; gap: 8px; }
.charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
.list-card { background: #FFFFFF; border-radius: 12px; padding: 20px; box-shadow: 0 1px 3px rgba(0,0,0,0.04); }
.chart { height: 260px; width: 100%; }
.pagination-wrapper { display: flex; justify-content: flex-end; margin-top: 16px; padding-top: 12px; border-top: 1px solid #E8EAED; }
.detail-content { padding: 16px; }
.detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px; }
.detail-header .header-left { flex: 1; }
.detail-header h3 { margin: 0 0 8px 0; font-size: 18px; color: #1A1A2E; }
.detail-header .tags { display: flex; gap: 8px; }
.detail-header .send-time { font-size: 13px; color: #9CA3AF; }
.detail-body { margin-bottom: 16px; }
.rich-content { margin-bottom: 16px; line-height: 1.8; color: #1A1A2E; }
.attachments-section, .images-section, .video-section, .miniprogram-section { margin-bottom: 16px; }
.section-title { font-size: 14px; font-weight: 600; color: #1A1A2E; margin-bottom: 12px; }
.attachments-list { display: flex; flex-direction: column; gap: 8px; }
.attachment-item { display: flex; align-items: center; gap: 12px; padding: 12px; background: #F7F8FA; border-radius: 8px; }
.attachment-item .file-icon { font-size: 24px; }
.attachment-item .file-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.attachment-item .file-name { font-size: 14px; color: #1A1A2E; }
.attachment-item .file-size { font-size: 12px; color: #9CA3AF; }
.images-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 12px; }
.image-item { display: flex; flex-direction: column; gap: 8px; }
.image-item .image-placeholder { height: 120px; background: #F7F8FA; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 32px; }
.image-item .image-name { font-size: 12px; color: #6B7280; text-align: center; }
.video-player { height: 240px; background: #F7F8FA; border-radius: 8px; display: flex; align-items: center; justify-content: center; }
.video-placeholder { display: flex; flex-direction: column; align-items: center; gap: 8px; }
.video-placeholder .play-btn { font-size: 48px; cursor: pointer; }
.miniprogram-box { display: flex; align-items: center; gap: 16px; padding: 16px; background: #F7F8FA; border-radius: 8px; }
.miniprogram-box .miniprogram-icon { font-size: 40px; }
.miniprogram-box .miniprogram-info { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.miniprogram-box .miniprogram-name { font-size: 14px; font-weight: 600; color: #1A1A2E; }
.miniprogram-box .miniprogram-desc { font-size: 12px; color: #9CA3AF; }
.detail-meta { display: flex; flex-wrap: wrap; gap: 16px; font-size: 13px; color: #9CA3AF; }
.meta-row { display: flex; align-items: center; gap: 24px; }
.confirm-type { color: #6B7280; font-size: 13px; }
</style>