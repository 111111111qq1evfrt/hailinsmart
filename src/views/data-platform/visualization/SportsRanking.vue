<template>
  <div class="sports-ranking" v-loading="pageLoading" element-loading-text="加载推送数据中..." element-loading-background="rgba(255, 255, 255, 0.9)">
    <!-- 顶部统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ stats.realtimeCount.toLocaleString() }}</span>
        <span class="stat-label">实时运动人次</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.todayClasses }}</span>
        <span class="stat-label">今日开课次数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.todayStudents.toLocaleString() }}</span>
        <span class="stat-label">今日开课人数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ stats.todayClassCount }}</span>
        <span class="stat-label">今日开课班级</span>
      </div>
    </div>

    <!-- 通知栏 -->
    <div class="notification-bar">
      <div class="notification-icon"><Bell /></div>
      <div class="notification-content">
        <span class="notification-title">今日通知</span>
        <span class="notification-text">{{ currentNotice }}</span>
      </div>
      <el-button text size="small" @click="showNoticeSettings = true">设置</el-button>
    </div>

    <!-- 学期切换 -->
    <div class="term-selector">
      <el-select v-model="currentTerm" placeholder="选择学期" style="width: 200px">
        <el-option v-for="opt in semesterOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
      </el-select>
    </div>

    <!-- 排行榜区域 -->
    <div class="charts-row" id="ranking-section">
      <!-- 周榜/月榜/学期榜切换 -->
      <div class="chart-card full-width">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Trophy /></el-icon> 校园运动风云榜</span>
          <div class="time-tabs">
            <el-button 
              v-for="tab in rankingTabs" 
              :key="tab.value"
              :class="['time-tab', { active: activeRankingTab === tab.value }]"
              @click="activeRankingTab = tab.value"
            >{{ tab.label }}</el-button>
          </div>
          <div class="filter-tabs">
            <el-select v-model="filterGrade" placeholder="年级筛选" style="width: 100px" @change="onGradeChange">
              <el-option label="全部" value="all" />
              <el-option label="一年级" value="一年级" />
              <el-option label="二年级" value="二年级" />
              <el-option label="三年级" value="三年级" />
              <el-option label="四年级" value="四年级" />
              <el-option label="五年级" value="五年级" />
              <el-option label="六年级" value="六年级" />
            </el-select>
            <el-select v-model="filterClass" placeholder="班级筛选" style="width: 120px">
              <el-option label="全部" value="" />
              <el-option v-for="cls in classFilterOptions" :key="cls" :label="cls" :value="cls" />
            </el-select>
            <el-select v-model="filterGender" placeholder="性别筛选" style="width: 100px">
              <el-option label="全部" value="" />
              <el-option label="男" value="男" />
              <el-option label="女" value="女" />
            </el-select>
            <el-select v-model="filterProject" placeholder="项目筛选" style="width: 120px">
              <el-option label="全部" value="" />
              <el-option v-for="proj in projectFilterOptions" :key="proj" :label="proj" :value="proj" />
            </el-select>
            <el-select v-model="auditStatusFilter" placeholder="审核状态" clearable style="width: 130px">
              <el-option label="全部" value="all" />
              <el-option label="待审核" value="pending" />
              <el-option label="已通过" value="approved" />
              <el-option label="已驳回" value="rejected" />
            </el-select>
          </div>
          <div class="action-buttons">
            <el-button type="primary" :icon="Download" size="small" @click="exportRanking">批量导出</el-button>
            <el-button :icon="Plus" size="small" @click="showAddMileage = true">批量增加里程</el-button>
            <el-button type="warning" size="small" @click="openBatchAudit">批量审核</el-button>
          </div>
        </div>

        <!-- 审核统计栏 -->
        <div class="audit-stats-bar">
          <span class="audit-stat-item">
            <span class="audit-stat-label">总记录</span>
            <span class="audit-stat-value total">{{ auditStats.total }}</span>
          </span>
          <span class="audit-stat-item">
            <span class="audit-stat-label">待审核</span>
            <span class="audit-stat-value pending">{{ auditStats.pending }}</span>
          </span>
          <span class="audit-stat-item">
            <span class="audit-stat-label">已通过</span>
            <span class="audit-stat-value approved">{{ auditStats.approved }}</span>
          </span>
          <span class="audit-stat-item">
            <span class="audit-stat-label">已驳回</span>
            <span class="audit-stat-value rejected">{{ auditStats.rejected }}</span>
          </span>
        </div>

        <!-- 筛选结果为空时显示 -->
        <div v-if="filteredRanking.length === 0" class="empty-state">
          <el-icon :size="48" color="#9CA3AF"><Search /></el-icon>
          <p>暂无符合条件的记录</p>
        </div>

        <!-- 前三名展示 -->
        <div v-else class="top-three">
          <div class="second-place">
            <div class="medal silver">🥈</div>
            <div class="avatar-wrap">
              <img :src="filteredRanking[1]?.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" :alt="filteredRanking[1]?.name" class="avatar" />
            </div>
            <span class="name">{{ filteredRanking[1]?.name || '-' }}</span>
            <span class="student-id">{{ filteredRanking[1]?.studentId || '-' }}</span>
            <span :class="['gender', filteredRanking[1]?.gender]">{{ filteredRanking[1]?.gender === '男' ? '男' : '女' }}</span>
            <span class="class">{{ filteredRanking[1]?.class || '-' }}</span>
            <span class="score">{{ filteredRanking[1]?.score || '-' }}</span>
            <span v-if="filteredRanking[1]" :class="['audit-status-tag', getAuditStatus(filteredRanking[1].studentId)]">
              {{ getAuditStatus(filteredRanking[1].studentId) === 'pending' ? '待审核' : getAuditStatus(filteredRanking[1].studentId) === 'approved' ? '已通过' : '已驳回' }}
            </span>
            <div v-if="filteredRanking[1] && getAuditStatus(filteredRanking[1].studentId) === 'pending'" class="audit-actions">
              <el-button size="small" type="success" @click="approveRecord(filteredRanking[1])">通过</el-button>
              <el-button size="small" type="danger" @click="rejectRecord(filteredRanking[1])">驳回</el-button>
            </div>
            <el-button v-if="filteredRanking[1]" text size="small" @click="viewDetail(filteredRanking[1])">查看详情</el-button>
          </div>
          <div class="first-place">
            <div class="medal gold">🥇</div>
            <div class="avatar-wrap">
              <img :src="filteredRanking[0]?.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" :alt="filteredRanking[0]?.name" class="avatar" />
            </div>
            <span class="name">{{ filteredRanking[0]?.name || '-' }}</span>
            <span class="student-id">{{ filteredRanking[0]?.studentId || '-' }}</span>
            <span :class="['gender', filteredRanking[0]?.gender]">{{ filteredRanking[0]?.gender === '男' ? '男' : '女' }}</span>
            <span class="class">{{ filteredRanking[0]?.class || '-' }}</span>
            <span class="score">{{ filteredRanking[0]?.score || '-' }}</span>
            <span v-if="filteredRanking[0]" :class="['audit-status-tag', getAuditStatus(filteredRanking[0].studentId)]">
              {{ getAuditStatus(filteredRanking[0].studentId) === 'pending' ? '待审核' : getAuditStatus(filteredRanking[0].studentId) === 'approved' ? '已通过' : '已驳回' }}
            </span>
            <div v-if="filteredRanking[0] && getAuditStatus(filteredRanking[0].studentId) === 'pending'" class="audit-actions">
              <el-button size="small" type="success" @click="approveRecord(filteredRanking[0])">通过</el-button>
              <el-button size="small" type="danger" @click="rejectRecord(filteredRanking[0])">驳回</el-button>
            </div>
            <el-button v-if="filteredRanking[0]" text size="small" @click="viewDetail(filteredRanking[0])">查看详情</el-button>
          </div>
          <div class="third-place">
            <div class="medal bronze">🥉</div>
            <div class="avatar-wrap">
              <img :src="filteredRanking[2]?.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" :alt="filteredRanking[2]?.name" class="avatar" />
            </div>
            <span class="name">{{ filteredRanking[2]?.name || '-' }}</span>
            <span class="student-id">{{ filteredRanking[2]?.studentId || '-' }}</span>
            <span :class="['gender', filteredRanking[2]?.gender]">{{ filteredRanking[2]?.gender === '男' ? '男' : '女' }}</span>
            <span class="class">{{ filteredRanking[2]?.class || '-' }}</span>
            <span class="score">{{ filteredRanking[2]?.score || '-' }}</span>
            <span v-if="filteredRanking[2]" :class="['audit-status-tag', getAuditStatus(filteredRanking[2].studentId)]">
              {{ getAuditStatus(filteredRanking[2].studentId) === 'pending' ? '待审核' : getAuditStatus(filteredRanking[2].studentId) === 'approved' ? '已通过' : '已驳回' }}
            </span>
            <div v-if="filteredRanking[2] && getAuditStatus(filteredRanking[2].studentId) === 'pending'" class="audit-actions">
              <el-button size="small" type="success" @click="approveRecord(filteredRanking[2])">通过</el-button>
              <el-button size="small" type="danger" @click="rejectRecord(filteredRanking[2])">驳回</el-button>
            </div>
            <el-button v-if="filteredRanking[2]" text size="small" @click="viewDetail(filteredRanking[2])">查看详情</el-button>
          </div>
        </div>

        <!-- 完整排行榜列表 -->
        <div v-if="filteredRanking.length > 3" class="ranking-list">
          <ExamTable
            :data="filteredRanking.slice(3)"
            :columns="rankingColumns"
            :showHeader="true"
            :searchable="false"
            :showRefresh="false"
            :showPagination="true"
            :defaultPageSize="8"
            :pageSizes="[8, 12, 16]"
            :actionWidth="160"
          >
            <template #rank="{ row, $index }">
              <span class="rank-badge">{{ $index + 4 }}</span>
            </template>
            <template #gender="{ row }">
              <span :class="['gender-tag', row.gender]">{{ row.gender === '男' ? '男' : '女' }}</span>
            </template>
            <template #level="{ row }">
              <span :class="['level-tag', row.level.toLowerCase()]">{{ row.level }}</span>
            </template>
            <template #auditStatus="{ row }">
              <span :class="['audit-status-tag', getAuditStatus(row.studentId)]">
                {{ getAuditStatus(row.studentId) === 'pending' ? '待审核' : getAuditStatus(row.studentId) === 'approved' ? '已通过' : '已驳回' }}
              </span>
            </template>
            <template #actions="{ row }">
              <el-button text size="small" @click="viewDetail(row)">查看</el-button>
              <el-button v-if="getAuditStatus(row.studentId) === 'pending'" size="small" type="success" text @click="approveRecord(row)">通过</el-button>
              <el-button v-if="getAuditStatus(row.studentId) === 'pending'" size="small" type="danger" text @click="rejectRecord(row)">驳回</el-button>
            </template>
          </ExamTable>
        </div>
      </div>
    </div>

    <!-- 学生详情弹窗 -->
    <el-dialog v-model="showDetail" title="学生成绩档案" width="800px">
      <div v-if="selectedStudent" class="student-detail">
        <!-- 基本信息 -->
        <div class="detail-header">
          <img :src="selectedStudent.avatar" :alt="selectedStudent.name" class="detail-avatar" />
          <div class="detail-info">
            <h3>{{ selectedStudent.name }}</h3>
            <p>{{ selectedStudent.class }} · {{ selectedStudent.gender === '男' ? '男' : '女' }}</p>
            <div class="badges">
              <span class="badge">{{ selectedStudent.level }}</span>
              <span class="badge">{{ selectedStudent.project }}</span>
            </div>
          </div>
        </div>

        <!-- 运动数据统计 -->
        <div class="stats-grid">
          <div class="stat-card">
            <el-icon :size="16" color="#1E5AA8"><Calendar /></el-icon>
            <span class="stat-value">{{ selectedStudent.stats.totalDays }}</span>
            <span class="stat-label">累计运动天数</span>
          </div>
          <div class="stat-card">
            <el-icon :size="16" color="#1E5AA8"><Timer /></el-icon>
            <span class="stat-value">{{ selectedStudent.stats.dailyAvg }}</span>
            <span class="stat-label">日均运动时长(分)</span>
          </div>
          <div class="stat-card">
            <el-icon :size="16" color="#1E5AA8"><Aim /></el-icon>
            <span class="stat-value">{{ selectedStudent.stats.todayMinutes }}</span>
            <span class="stat-label">今日运动时长(分)</span>
          </div>
          <div class="stat-card">
            <el-icon :size="16" color="#1E5AA8"><CircleCheck /></el-icon>
            <span class="stat-value">{{ selectedStudent.stats达标Rate }}%</span>
            <span class="stat-label">达标天数占比</span>
          </div>
        </div>

        <!-- 综合能力雷达图 -->
        <div class="chart-section">
          <h4>综合能力雷达图</h4>
          <div ref="radarChart" class="chart-small"></div>
        </div>

        <!-- 各项目成绩分析 -->
        <div class="chart-section">
          <h4>各项目成绩分析</h4>
          <div ref="projectChart" class="chart-small"></div>
        </div>

        <!-- 运动视频回放 -->
        <div class="video-section">
          <h4>运动视频回放</h4>
          <div class="video-player">
            <div class="video-placeholder">
              <el-icon :size="48" color="#9CA3AF"><VideoCamera /></el-icon>
              <p>{{ selectedStudent.name }}的{{ selectedStudent.project }}视频</p>
            </div>
            <div class="video-controls">
              <el-button size="small" @click="playVideo">播放</el-button>
              <el-button size="small" @click="viewKeyFrames">查看关键帧</el-button>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 面部识别区域 -->
    <div class="charts-row" id="face-section">
      <div class="chart-card" id="face-recognition-card">
        <div class="card-header">
          <span class="card-title">🔍 面部识别查询</span>
        </div>
        <div class="face-recognition">
          <div class="camera-box">
            <div class="camera-preview">
              <el-icon :size="64" color="#9CA3AF"><User /></el-icon>
              <p>请将面部对准摄像头</p>
            </div>
            <div class="scan-line"></div>
          </div>
          <div class="recognition-status">
            <span :class="['status-dot', recognitionStatus]"></span>
            <span>{{ recognitionStatusText }}</span>
          </div>
          <el-button type="primary" @click="startRecognition">开始识别</el-button>
        </div>
      </div>

      <!-- 时间区间趋势图 -->
      <div class="chart-card" id="trend-card">
        <div class="card-header">
          <span class="card-title">📈 运动趋势</span>
          <div class="date-range">
            <el-date-picker 
              v-model="dateRange" 
              type="daterange" 
              range-separator="至" 
              start-placeholder="开始日期" 
              end-placeholder="结束日期"
              style="width: 280px;"
              @change="onDateRangeChange"
            />
          </div>
        </div>
        <div ref="trendChart" class="chart-small"></div>
      </div>
    </div>

    <!-- 项目实时使用情况 -->
    <div class="charts-row" id="project-usage-section">
      <div class="chart-card full-width" id="project-usage-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Histogram /></el-icon> 各项目实时使用情况</span>
        </div>
        <div ref="projectUsageChart" class="chart"></div>
      </div>
    </div>

    <!-- 通知设置弹窗 -->
    <el-dialog v-model="showNoticeSettings" title="通知设置" width="500px">
      <el-form :model="noticeForm" label-width="100px">
        <el-form-item label="通知内容">
          <el-input v-model="noticeForm.content" type="textarea" :rows="3" placeholder="请输入通知内容" />
        </el-form-item>
        <el-form-item label="开始时间">
          <el-date-picker v-model="noticeForm.startTime" type="datetime" />
        </el-form-item>
        <el-form-item label="结束时间">
          <el-date-picker v-model="noticeForm.endTime" type="datetime" />
        </el-form-item>
        <el-form-item label="是否启用">
          <el-switch v-model="noticeForm.enabled" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showNoticeSettings = false">取消</el-button>
        <el-button type="primary" @click="saveNoticeSettings">保存设置</el-button>
      </template>
    </el-dialog>

    <!-- 批量增加里程弹窗 -->
    <el-dialog v-model="showAddMileage" title="批量增加里程" width="400px">
      <el-form :model="mileageForm" label-width="80px">
        <el-form-item label="选择班级">
          <el-select v-model="mileageForm.class" placeholder="请选择班级">
            <el-option v-for="cls in classFilterOptions" :key="cls" :label="cls" :value="cls" />
          </el-select>
        </el-form-item>
        <el-form-item label="增加里程(km)">
          <el-input-number v-model="mileageForm.mileage" :min="0.1" :max="100" :step="0.1" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showAddMileage = false">取消</el-button>
        <el-button type="primary" @click="addMileage">确认增加</el-button>
      </template>
    </el-dialog>

    <!-- 批量审核弹窗 -->
    <el-dialog v-model="showAuditDialog" title="批量成绩审核" width="600px">
      <div class="batch-audit-content">
        <div class="batch-audit-stats">
          <div class="batch-stat-card">
            <span class="batch-stat-num total">{{ auditStats.total }}</span>
            <span class="batch-stat-label">总记录数</span>
          </div>
          <div class="batch-stat-card">
            <span class="batch-stat-num pending">{{ auditStats.pending }}</span>
            <span class="batch-stat-label">待审核</span>
          </div>
          <div class="batch-stat-card">
            <span class="batch-stat-num approved">{{ auditStats.approved }}</span>
            <span class="batch-stat-label">已通过</span>
          </div>
          <div class="batch-stat-card">
            <span class="batch-stat-num rejected">{{ auditStats.rejected }}</span>
            <span class="batch-stat-label">已驳回</span>
          </div>
        </div>
        <p class="batch-audit-desc">将对当前筛选条件下的 <strong>{{ auditRecords.length }}</strong> 条记录进行批量审核操作</p>
        <div class="batch-audit-actions">
          <el-button type="success" size="large" @click="batchApprove">全部通过</el-button>
          <el-button type="danger" size="large" @click="batchReject">全部驳回</el-button>
        </div>
      </div>
      <template #footer>
        <el-button @click="showAuditDialog = false">取消</el-button>
      </template>
    </el-dialog>
    
    <!-- 数据加载蒙版 -->
    <LoadingOverlay 
      :visible="pushLoading" 
      text="正在加载排行榜数据..." 
      subText="首次加载可能需要几秒"
    />
  </div>
</template>

<script setup>import { ref, computed, watch, onMounted, nextTick, onBeforeUnmount } from 'vue';
import { ElMessage } from 'element-plus';
import { ArrowRight, VideoCamera, User, Search, Download, Plus, Bell, Trophy, Calendar, Timer, Aim, CircleCheck, Histogram } from '@element-plus/icons-vue';
import echarts from '@/utils/echarts';
import ExamTable from '@/components/table/ExamTable.vue';
import store from '@/store/global'
import { getSchoolMockData } from '@/utils/mockDataLoader'
import { getSchoolProfile } from '@/mock/school-data/schoolProfiles'
import { isInterestClass, getMatchingStudents } from '@/utils/interestClassFilter'
import { usePersistedRef } from '../../../composables/usePersistedRef'
import { createSeededRandom } from '@/utils/seededRandom'
import { useSportsData } from '@/composables/useSportsData'
import sportsApi, { transformPushList } from '@/utils/daiweiPushApi'
import LoadingOverlay from '@/components/common/LoadingOverlay.vue'
import { getRealStudents, normalizeStudents } from '@/utils/realDataLoader'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

// 运动推送数据
const sportsData = useSportsData()
const pushData = ref([])
const pushLoading = ref(true)
const pushDataLoaded = ref(false)
const pageLoading = ref(true)

// Mock 数据兜底
const mockRankingData = computed(() => {
  const mockData = getSchoolMockData(schoolId.value)
  const students = mockData.students || []
  const results = []
  for (let i = 0; i < Math.min(50, students.length); i++) {
    const s = students[i]
    results.push({
      id: `mock_rank_${i}`,
      personId: s.id,
      score: Math.floor(Math.random() * 100 + 60),
      duration: Math.floor(Math.random() * 180 + 30),
      sportType: [1, 2, 6, 7][Math.floor(Math.random() * 4)],
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
      pushData.value = mockRankingData.value
      pushDataLoaded.value = false
    }
  } catch (e) {
    console.warn('推送服务不可用，使用本地Mock数据')
    pushData.value = mockRankingData.value
    pushDataLoaded.value = false
  } finally {
    pushLoading.value = false
    pageLoading.value = false
  }
}

// 动态生成学期选项（基于当前日期）
const semesterOptions = computed(() => {
  const now = new Date('2026-07-16T08:00:00')
  const year = now.getFullYear()
  const month = now.getMonth() + 1
  const startYear = month >= 9 ? year : year - 1
  const options = []
  for (let i = 0; i < 2; i++) {
    const sy = startYear - i
    options.push({ label: `${sy}-${sy + 1} 第一学期`, value: `${sy}-1` })
    options.push({ label: `${sy}-${sy + 1} 第二学期`, value: `${sy}-2` })
  }
  return options
})

// 统计数据 - 从筛选后的数据计算
const stats = computed(() => {
  const data = filteredRanking.value.length > 0 ? filteredRanking.value : rankingData.value
  const todayStudents = data.length
  const todayClassCount = [...new Set(data.map(item => item.class))].length
  const realtimeCount = Math.floor(todayStudents * 0.12)
  const todayClasses = todayClassCount * 1.5
  return {
    realtimeCount,
    todayClasses: Math.round(todayClasses),
    todayStudents,
    todayClassCount
  }
});
// 通知相关
const customNotice = usePersistedRef(computed(() => `smart_pe_sports_ranking_notice_${schoolId.value}`), '');
const currentNotice = computed(() => {
  if (customNotice.value) return customNotice.value;
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  return isZirong
    ? '本周六将举行子荣小学趣味运动会，请各位同学积极参与！'
    : isLinhai
      ? '本周六将举行林海实验校园体育节，请各位同学踊跃报名！'
      : '本周六将举行校园运动会，请各位同学积极参与！'
});
const showNoticeSettings = ref(false);
const noticeForm = ref({
 content: '',
 startTime: '',
 endTime: '',
 enabled: true
});
// 学期切换（使用第一个学期选项作为默认值）
const currentTerm = ref('');
watch(semesterOptions, (options) => {
 if (!currentTerm.value && options.length > 0) {
 currentTerm.value = options[0].value;
 }
}, { immediate: true });

// 排行榜标签
const rankingTabs = [
 { label: '周榜', value: 'week' },
 { label: '月榜', value: 'month' },
 { label: '学期榜', value: 'term' }
];
const activeRankingTab = ref('week');
// 筛选条件（使用 usePersistedRef 实现数据持久化，按学校隔离）
const filterClass = usePersistedRef(`smart_pe_sports_ranking_filter_class_${schoolId.value}`, '');
const filterGrade = usePersistedRef(`smart_pe_sports_ranking_filter_grade_${schoolId.value}`, 'all');
const filterGender = usePersistedRef(`smart_pe_sports_ranking_filter_gender_${schoolId.value}`, '');
const filterProject = usePersistedRef(`smart_pe_sports_ranking_filter_project_${schoolId.value}`, '');

// 成绩审核相关 — 持久化到 sessionStorage，按学校隔离
const auditStatusMap = ref({}) // { studentId: 'pending' | 'approved' | 'rejected' }
const initAuditStatusMap = () => {
  const sid = schoolId.value
  try {
    const raw = sessionStorage.getItem(`audit_status_map_${sid}`)
    auditStatusMap.value = raw ? JSON.parse(raw) : {}
  } catch { auditStatusMap.value = {} }
}
const saveAuditStatusMap = () => {
  const sid = schoolId.value
  sessionStorage.setItem(`audit_status_map_${sid}`, JSON.stringify(auditStatusMap.value))
}
watch(auditStatusMap, () => { saveAuditStatusMap() }, { deep: true })
watch(schoolId, () => { initAuditStatusMap() })
const auditStatusFilter = ref('all') // all, pending, approved, rejected
const showAuditDialog = ref(false)
const auditRecords = ref([]) // selected records for batch audit

const getAuditStatus = (studentId) => {
  return auditStatusMap.value[studentId] || 'approved'
}

// 动态班级筛选选项（根据年级过滤，包含分项班/兴趣班）
const classFilterOptions = computed(() => {
  let data = rankingData.value
  if (filterGrade.value && filterGrade.value !== 'all') {
    data = data.filter(item => item.class?.includes(filterGrade.value))
  }
  const classes = [...new Set(data.map(item => item.class))]
  // 追加分项班/兴趣班
  const schoolData = getSchoolMockData(schoolId.value)
  const interestClasses = (schoolData?.classes || []).filter(c => c.type === '分项班').map(c => c.name)
  interestClasses.forEach(name => {
    if (!classes.includes(name)) classes.push(name)
  })
  return classes.sort()
})

const onGradeChange = () => {
  filterClass.value = ''
}

// 动态项目筛选选项（从排行榜数据中提取）
const projectFilterOptions = computed(() => {
  const projects = [...new Set(rankingData.value.map(item => item.project))]
  return projects
})

// 排行榜表格列配置
const rankingColumns = [
  { prop: 'rank', label: '排名', slot: 'rank', width: 60, align: 'center' },
  { prop: 'name', label: '姓名', minWidth: 80 },
  { prop: 'studentId', label: '学号', width: 100 },
  { prop: 'gender', label: '性别', slot: 'gender', width: 60, align: 'center' },
  { prop: 'class', label: '班级', minWidth: 100 },
  { prop: 'project', label: '项目', minWidth: 100 },
  { prop: 'totalMileage', label: '累计里程', width: 100 },
  { prop: 'avgPace', label: '平均配速', width: 100 },
  { prop: 'score', label: '成绩', width: 80, align: 'center' },
  { prop: 'level', label: '等级', slot: 'level', width: 70, align: 'center' },
  { prop: 'auditStatus', label: '审核状态', slot: 'auditStatus', width: 90, align: 'center' }
];
// 批量增加里程弹窗
const showAddMileage = ref(false);
const mileageForm = ref({
  class: '',
  mileage: 0
});
// 当前学校学生数据（供多个computed共用）
const students = computed(() => {
  // 优先使用真实学生数据，回退到 mock 数据
  const realStudents = getRealStudents(schoolId.value)
  if (realStudents.length > 0) {
    return normalizeStudents(realStudents)
  }
  const schoolData = getSchoolMockData(schoolId.value)
  return schoolData.students || []
})

// 将推送数据转换为排行榜格式
const transformPushDataToRanking = () => {
  const studentsArr = students.value
  const result = []
  let idx = 0
  
  // 遍历推送数据中的每个运动记录
  for (const record of pushData.value) {
    // 遍历每个记录中的运动结果
    for (const item of (record.items || [])) {
      const student = studentsArr.find(s => s.id === item.personId) || studentsArr[idx % Math.max(1, studentsArr.length)]
      const scoreVal = item.score || Math.floor(Math.random() * 30 + 60)
      const level = scoreVal >= 85 ? '优秀' : scoreVal >= 70 ? '良好' : scoreVal >= 60 ? '及格' : '不及格'
      
      result.push({
        id: idx + 1,
        rank: idx + 1,
        studentId: student?.id || item.personId || `2026${String(idx + 1).padStart(3, '0')}`,
        name: student?.name || `学生${idx + 1}`,
        class: student?.class || '未知班级',
        gender: student?.gender || '男',
        sportsInterest: student?.sportsInterest || '',
        project: record.sportTypeName || '未分类',
        score: `${scoreVal}${record.sportTypeUnit || ''}`,
        level,
        totalMileage: `${((item.duration || 0) / 1000).toFixed(1)}km`,
        avgPace: `${Math.floor(Math.random() * 8 + 4)}'${String(Math.floor(Math.random() * 60)).padStart(2, '0')}"`,
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        auditStatus: 'approved',
        stats: {
          totalDays: 30 + Math.floor(Math.random() * 30),
          dailyAvg: 30 + Math.floor(Math.random() * 30),
          todayMinutes: Math.floor(item.duration || 30),
          达标Rate: scoreVal
        },
        receivedAt: record.receivedAt
      })
      idx++
    }
  }
  
  // 如果推送数据不足，使用mock数据补充
  if (result.length < 10) {
    const isZirong = schoolId.value === 'hailin-zirong-primary'
    const isLinhai = schoolId.value === 'linhai-experimental-primary'
    const totalFill = isZirong ? 24 : isLinhai ? 36 : 42
    const fillCount = totalFill - result.length
    
    for (let i = 0; i < fillCount; i++) {
      const student = studentsArr[(idx + i) % Math.max(1, studentsArr.length)]
      result.push({
        id: idx + i + 1,
        rank: idx + i + 1,
        studentId: student?.id || `2026${String(idx + i + 1).padStart(3, '0')}`,
        name: student?.name || `学生${idx + i + 1}`,
        class: student?.class || '未知班级',
        gender: student?.gender || (i % 2 === 0 ? '男' : '女'),
        sportsInterest: student?.sportsInterest || '',
        project: '综合运动',
        score: `${Math.floor(Math.random() * 40 + 60)}分`,
        level: Math.random() > 0.3 ? '及格' : '良好',
        totalMileage: `${(Math.random() * 50 + 20).toFixed(1)}km`,
        avgPace: `${Math.floor(Math.random() * 8 + 4)}'${String(Math.floor(Math.random() * 60)).padStart(2, '0')}"`,
        avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
        auditStatus: 'approved',
        stats: {
          totalDays: 30 + Math.floor(Math.random() * 30),
          dailyAvg: 30 + Math.floor(Math.random() * 30),
          todayMinutes: Math.floor(Math.random() * 60 + 20),
          达标Rate: Math.floor(Math.random() * 40 + 60)
        }
      })
    }
  }
  
  return result
}

// 排行榜数据 — 按学校差异化，增加数据量
const rankingData = computed(() => {
  // 优先使用推送数据
  if (pushDataLoaded.value && pushData.value.length > 0) {
    return transformPushDataToRanking()
  }
  
  const studentsArr = students.value
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  const random = createSeededRandom(schoolId.value + '_rankingData')
  
  const gradeNames = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']
  const classCounts = isZirong ? [2, 2, 2, 2, 2, 2] : isLinhai ? [4, 4, 4, 3, 3, 4] : [6, 5, 5, 5, 5, 5]
  
  const projectsA = [
    { name: '立定跳远', scoreFn: (v) => `${(1.4 + v * 0.08).toFixed(2)}m` },
    { name: '跳绳', scoreFn: (v) => `${Math.round(90 + v * 10)}个/分钟` },
    { name: '50米跑', scoreFn: (v) => `${(10.5 - v * 0.25).toFixed(1)}秒` },
    { name: '仰卧起坐', scoreFn: (v) => `${Math.round(30 + v * 3)}个` },
    { name: '坐位体前屈', scoreFn: (v) => `${(8 + v * 1.5).toFixed(1)}cm` },
    { name: '引体向上', scoreFn: (v) => `${Math.round(2 + v * 4)}个` }
  ]
  const projectsB = [
    { name: '排球垫球', scoreFn: (v) => `${Math.round(20 + v * 5)}个` },
    { name: '足球运球', scoreFn: (v) => `${(18 - v * 0.8).toFixed(1)}秒` },
    { name: '跳绳', scoreFn: (v) => `${Math.round(80 + v * 8)}个/分钟` },
    { name: '50米跑', scoreFn: (v) => `${(11 - v * 0.3).toFixed(1)}秒` },
    { name: '仰卧起坐', scoreFn: (v) => `${Math.round(25 + v * 3)}个` },
    { name: '引体向上', scoreFn: (v) => `${Math.round(1 + v * 3)}个` }
  ]
  const projectsC = [
    { name: '游泳50米', scoreFn: (v) => `${(55 - v * 2.5).toFixed(1)}秒` },
    { name: '体操', scoreFn: (v) => `${(70 + v * 3).toFixed(1)}分` },
    { name: '武术套路', scoreFn: (v) => `${(72 + v * 2.8).toFixed(1)}分` },
    { name: '跳绳', scoreFn: (v) => `${Math.round(85 + v * 9)}个/分钟` },
    { name: '立定跳远', scoreFn: (v) => `${(1.3 + v * 0.07).toFixed(2)}m` },
    { name: '引体向上', scoreFn: (v) => `${Math.round(3 + v * 5)}个` }
  ]
  const projects = isZirong ? projectsB : isLinhai ? projectsC : projectsA
  const baseMileage = isZirong ? 30 : isLinhai ? 50 : 40
  const basePaceMin = isZirong ? 6 : isLinhai ? 4 : 5
  
  const totalStudents = isZirong ? 24 : isLinhai ? 36 : 42
  const result = []
  
  for (let idx = 0; idx < totalStudents; idx++) {
    const gradeIdx = idx % 6
    const grade = gradeNames[gradeIdx]
    const classCount = classCounts[gradeIdx]
    const classNum = Math.floor(idx / 6) % classCount + 1
    const className = `${grade}${classNum}班`
    
    const project = projects[idx % projects.length]
    const scoreVal = Math.max(1, 12 - (idx % 12))
    const total = totalStudents
    const excellentCount = Math.ceil(total * 0.25)
    const goodCount = Math.ceil(total * 0.4)
    let level = '及格'
    if (idx < excellentCount) {
      level = '优秀'
    } else if (idx < excellentCount + goodCount) {
      level = '良好'
    }
    
    const classBonus = mileageBonuses.value[className] || 0
    const mileage = parseFloat((baseMileage + (totalStudents - idx) * 5 + random() * 10 + classBonus).toFixed(1))
    const paceMin = basePaceMin + Math.floor(idx / 8)
    const paceSec = (idx * 11 + 15) % 60
    
    const student = studentsArr[idx % studentsArr.length]
    
    result.push({
      id: idx + 1,
      rank: idx + 1,
      studentId: student?.id || `2026${String(idx + 1).padStart(3, '0')}`,
      name: student?.name || `学生${idx + 1}`,
      class: className,
      gender: student?.gender || (idx % 2 === 0 ? '男' : '女'),
      sportsInterest: student?.sportsInterest || '',
      project: project.name,
      score: project.scoreFn(scoreVal),
      level,
      totalMileage: `${mileage}km`,
      avgPace: `${paceMin}'${paceSec.toString().padStart(2, '0')}"`,
      avatar: 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png',
      auditStatus: auditStatusMap.value[student?.id || `2026${String(idx + 1).padStart(3, '0')}`] || 'approved',
      stats: {
        totalDays: 156 - idx * 4,
        dailyAvg: 52 - idx * 2,
        todayMinutes: 72 - idx * 2,
        达标Rate: Math.max(60, 95 - idx * 0.8)
      }
    })
  }
  
  return result
});
// 根据学期和时间范围调整成绩
const adjustScoreByTerm = (item) => {
  if (!currentTerm.value) return item
  
  const termParts = currentTerm.value.split('-')
  const year = parseInt(termParts[0])
  const semester = parseInt(termParts[1])
  
  const yearOffset = (2026 - year) * 2
  const semesterBonus = semester === 2 ? 5 : 0
  const random = createSeededRandom(schoolId.value + '_adjustScore')
  
  let timeRangeFactor = 0
  if (activeRankingTab.value === 'week') {
    timeRangeFactor = Math.floor(random() * 2) - 1
  } else if (activeRankingTab.value === 'month') {
    timeRangeFactor = Math.floor(random() * 4) - 2
  } else {
    timeRangeFactor = Math.floor(random() * 6) - 3
  }
  
  const scoreOffset = yearOffset - semesterBonus + timeRangeFactor
  const originalRank = item.rank
  const adjustedRank = Math.max(1, Math.min(rankingData.value.length, originalRank + scoreOffset))
  
  const total = rankingData.value.length
  const excellentCount = Math.ceil(total * 0.25)
  const goodCount = Math.ceil(total * 0.4)
  let level = '及格'
  if (adjustedRank <= excellentCount) {
    level = '优秀'
  } else if (adjustedRank <= excellentCount + goodCount) {
    level = '良好'
  }
  
  return {
    ...item,
    rank: adjustedRank,
    level
  }
}

// 审核统计
const auditStats = computed(() => {
  const data = filteredRanking.value
  return {
    total: data.length,
    pending: data.filter(r => getAuditStatus(r.studentId) === 'pending').length,
    approved: data.filter(r => getAuditStatus(r.studentId) === 'approved').length,
    rejected: data.filter(r => getAuditStatus(r.studentId) === 'rejected').length
  }
})

// 筛选后的排行榜
const filteredRanking = computed(() => {
 let result = [...rankingData.value];
 if (filterClass.value) {
   if (isInterestClass(filterClass.value)) {
     const matchingIds = new Set(getMatchingStudents(filterClass.value, students.value).map(s => s.id))
     result = result.filter(item => matchingIds.has(item.studentId))
   } else {
     result = result.filter(item => item.class === filterClass.value);
   }
 }
 if (filterGrade.value && filterGrade.value !== 'all') {
 result = result.filter(item => item.class.includes(filterGrade.value));
 }
 if (filterGender.value) {
 result = result.filter(item => item.gender === filterGender.value);
 }
 if (filterProject.value) {
 result = result.filter(item => item.project === filterProject.value);
 }
 if (auditStatusFilter.value && auditStatusFilter.value !== 'all') {
 result = result.filter(item => getAuditStatus(item.studentId) === auditStatusFilter.value);
 }
 if (currentTerm.value) {
 result = result.map(item => adjustScoreByTerm(item)).sort((a, b) => a.rank - b.rank)
 }
 return result;
});
// 导出排行榜数据
const exportRanking = () => {
 const headers = ['排名', '学号', '姓名', '性别', '班级', '项目', '成绩', '等级', '累计里程', '平均配速'];
 const rows = filteredRanking.value.map(item => [
 item.rank,
 item.studentId,
 item.name,
 item.gender === '男' ? '男' : '女',
 item.class,
 item.project,
 item.score,
 item.level,
 item.totalMileage,
 item.avgPace
 ]);
 const csvContent = [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
 const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
 const url = URL.createObjectURL(blob);
 const a = document.createElement('a');
 a.href = url;
 a.download = `运动风云榜_${new Date().toLocaleDateString()}.csv`;
 document.body.appendChild(a);
 a.click();
 document.body.removeChild(a);
 URL.revokeObjectURL(url);
 ElMessage.success('排行榜数据已导出');
};
// 批量增加里程
const mileageBonuses = ref({}); // { className: totalBonus }
const addMileage = () => {
 if (!mileageForm.value.class || mileageForm.value.mileage <= 0) {
 ElMessage.warning('请选择班级并输入有效里程数');
 return;
 }
 const cls = mileageForm.value.class;
 const prev = mileageBonuses.value[cls] || 0;
 mileageBonuses.value = { ...mileageBonuses.value, [cls]: prev + mileageForm.value.mileage };
 ElMessage.success(`已为${cls}批量增加${mileageForm.value.mileage}公里里程`);
 showAddMileage.value = false;
 mileageForm.value = { class: '', mileage: 0 };
};
// 成绩审核操作
const approveRecord = (row) => {
 auditStatusMap.value = { ...auditStatusMap.value, [row.studentId]: 'approved' }
 ElMessage.success(`已通过 ${row.name} 的成绩`)
}
const rejectRecord = (row) => {
 auditStatusMap.value = { ...auditStatusMap.value, [row.studentId]: 'rejected' }
 ElMessage.warning(`已驳回 ${row.name} 的成绩`)
}
const openBatchAudit = () => {
 auditRecords.value = [...filteredRanking.value]
 showAuditDialog.value = true
}
const batchApprove = () => {
 const newMap = { ...auditStatusMap.value }
 auditRecords.value.forEach(r => { newMap[r.studentId] = 'approved' })
 auditStatusMap.value = newMap
 ElMessage.success(`已批量通过 ${auditRecords.value.length} 条记录`)
 showAuditDialog.value = false
 auditRecords.value = []
}
const batchReject = () => {
 const newMap = { ...auditStatusMap.value }
 auditRecords.value.forEach(r => { newMap[r.studentId] = 'rejected' })
 auditStatusMap.value = newMap
 ElMessage.warning(`已批量驳回 ${auditRecords.value.length} 条记录`)
 showAuditDialog.value = false
 auditRecords.value = []
}
// 学生详情
const showDetail = ref(false);
const selectedStudent = ref(null);
// 面部识别
const recognitionStatus = ref('idle');
const recognitionStatusText = ref('等待识别');
// 日期范围
const dateRange = ref([]);
// 图表实例
const radarChart = ref(null);
const projectChart = ref(null);
let radarChartInstance = null;
let projectChartInstance = null;
let trendChartInstance = null;
let projectUsageChartInstance = null;
const viewDetail = (student) => {
 radarChartInstance?.showLoading();
 projectChartInstance?.showLoading();
 selectedStudent.value = student;
 showDetail.value = true;
 nextTick(() => {
 initRadarChart();
 initProjectChart();
 });
};
const playVideo = () => {
 ElMessage.info('正在播放视频...');
};
const viewKeyFrames = () => {
 ElMessage.info('查看动作关键帧...');
};
const startRecognition = () => {
 recognitionStatus.value = 'scanning';
 recognitionStatusText.value = '正在识别...';
 const random = createSeededRandom(schoolId.value + '_startRecognition')
 setTimeout(() => {
 recognitionStatus.value = 'success';
 recognitionStatusText.value = '识别成功';
 // 随机选择一个学生展示
 const randomStudent = rankingData.value[Math.floor(random() * rankingData.value.length)];
 viewDetail(randomStudent);
 setTimeout(() => {
 recognitionStatus.value = 'idle';
 recognitionStatusText.value = '等待识别';
 }, 2000);
 }, 2000);
};
const saveNoticeSettings = () => {
 currentNotice; // access computed to ensure it's tracked
 customNotice.value = noticeForm.value.content || '';
 showNoticeSettings.value = false;
 ElMessage.success('通知设置已保存');
};
const onDateRangeChange = () => {
 trendChartInstance?.showLoading();
 nextTick(() => {
 initTrendChart();
 });
};
const initRadarChart = () => {
 if (!selectedStudent.value)
 return;
 const el = radarChart.value;
 if (!el)
 return;
 if (radarChartInstance)
 radarChartInstance.dispose();
 radarChartInstance = echarts.init(el);
 radarChartInstance.showLoading();
 const rankIdx = rankingData.value.findIndex(s => s.name === selectedStudent.value.name) || 0
 const isZirong = schoolId.value === 'hailin-zirong-primary'
 const isLinhai = schoolId.value === 'linhai-experimental-primary'
 const baseRadar = isZirong ? [70, 65, 60, 75, 72] : isLinhai ? [82, 78, 85, 80, 88] : [85, 78, 72, 88, 90]
 const radarValues = baseRadar.map(v => Math.max(40, Math.min(100, v - rankIdx * 2)))
 const option = {
 radar: {
 indicator: [
 { name: '爆发力', max: 100 },
 { name: '耐力', max: 100 },
 { name: '柔韧性', max: 100 },
 { name: '协调性', max: 100 },
 { name: '速度', max: 100 }
 ],
 radius: '60%'
 },
 series: [{
 type: 'radar',
 data: [{
 value: radarValues,
 name: selectedStudent.value.name,
 areaStyle: { color: 'rgba(45, 125, 70, 0.2)' },
 lineStyle: { color: '#1E5AA8', width: 2 },
 itemStyle: { color: '#1E5AA8' }
 }]
 }]
 };
 radarChartInstance.setOption(option);
 radarChartInstance.hideLoading();
};
const initProjectChart = () => {
 if (!selectedStudent.value)
 return;
 const el = projectChart.value;
 if (!el)
 return;
 if (projectChartInstance)
 projectChartInstance.dispose();
 projectChartInstance = echarts.init(el);
 projectChartInstance.showLoading();
 const isZirongP = schoolId.value === 'hailin-zirong-primary'
 const isLinhaiP = schoolId.value === 'linhai-experimental-primary'
 const xLabels = isZirongP
   ? ['排球垫球', '足球运球', '跳绳', '50米跑', '仰卧起坐', '400米跑', '50*8往返跑', '坐位体前屈', '引体向上']
   : isLinhaiP
     ? ['游泳50米', '体操', '武术套路', '跳绳', '立定跳远', '400米跑', '50*8往返跑', '仰卧起坐', '引体向上']
     : ['立定跳远', '跳绳', '50米跑', '仰卧起坐', '坐位体前屈', '1000米跑', '50*8往返跑', '引体向上']
 const rankIdxP = rankingData.value.findIndex(s => s.name === selectedStudent.value.name) || 0
 const baseProj = isZirongP ? [72, 68, 80, 65, 70, 60, 66, 58, 55] : isLinhaiP ? [88, 85, 82, 78, 80, 72, 74, 70, 65] : [85, 78, 90, 72, 82, 68, 74, 65]
 const projData = baseProj.map(v => Math.max(40, Math.min(100, v - rankIdxP * 2)))
 const option = {
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    xAxis: { type: 'category', data: xLabels, axisLabel: { fontSize: 11 } },
    yAxis: { type: 'value', max: 100 },
    series: [{
    type: 'bar',
    barWidth: '45%',
    data: projData,
    itemStyle: {
    color: ['#1E5AA8', '#3B82F6', '#F5A623', '#E85D4E', '#8B5CF6', '#06B6D4', '#EC4899', '#84CC16'],
    borderRadius: [4, 4, 0, 0]
    },
    animationDelay: function(idx) {
    return idx * 100
    }
    }]
    };
    projectChartInstance.setOption(option);
    projectChartInstance.hideLoading();
};
const initTrendChart = () => {
 const el = document.getElementById('trend-card')?.querySelector('.chart-small');
 if (!el)
 return;
 if (trendChartInstance)
 trendChartInstance.dispose();
 trendChartInstance = echarts.init(el);
 trendChartInstance.showLoading();
 
 const data = filteredRanking.value.length > 0 ? filteredRanking.value : rankingData.value
 const baseValue = data.length * 5
 
 const option = {
 animation: true,
 animationDuration: 1000,
 animationEasing: 'cubicOut',
 tooltip: { trigger: 'axis' },
 grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
 xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
 yAxis: { type: 'value', axisLabel: { formatter: '{value}分钟' } },
 series: [{
 type: 'line',
 data: [baseValue * 0.9, baseValue * 1.04, baseValue * 0.76, baseValue * 1.2, baseValue * 0.96, baseValue * 1.44, baseValue * 1.16],
 smooth: true,
 lineStyle: { color: '#1E5AA8', width: 2.5 },
 areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(45, 125, 70, 0.2)' }, { offset: 1, color: 'rgba(45, 125, 70, 0)' }]) },
 animationDuration: 1500
 }]
 };
 trendChartInstance.setOption(option);
 trendChartInstance.hideLoading();
};
const initProjectUsageChart = () => {
 const el = document.getElementById('project-usage-card')?.querySelector('.chart');
 if (!el)
 return;
 if (projectUsageChartInstance)
 projectUsageChartInstance.dispose();
 projectUsageChartInstance = echarts.init(el);
 projectUsageChartInstance.showLoading();
 
 const data = filteredRanking.value.length > 0 ? filteredRanking.value : rankingData.value
 const isZirongU = schoolId.value === 'hailin-zirong-primary'
 const isLinhaiU = schoolId.value === 'linhai-experimental-primary'
 const projects = isZirongU
   ? ['排球垫球', '足球运球', '跳绳', '50米跑', '仰卧起坐', '引体向上']
   : isLinhaiU
     ? ['游泳50米', '体操', '武术套路', '跳绳', '立定跳远', '引体向上']
     : ['立定跳远', '跳绳', '50米跑', '仰卧起坐', '坐位体前屈', '引体向上']
 const usageCounts = projects.map(p => {
 const count = data.filter(item => item.project === p).length
 return count * 15
 })
 const participantCounts = projects.map(p => {
 const count = data.filter(item => item.project === p).length
 return count * 25
 })
 
 const option = {
 animation: true,
 animationDuration: 1000,
 animationEasing: 'cubicOut',
 tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
 legend: { data: ['使用次数', '参与人数'], top: 0 },
 grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
 xAxis: { type: 'category', data: projects, axisLabel: { fontSize: 11 } },
 yAxis: [{ type: 'value', name: '使用次数' }, { type: 'value', name: '参与人数' }],
 series: [
 { name: '使用次数', type: 'bar', barWidth: '45%', data: usageCounts, itemStyle: { color: '#1E5AA8', borderRadius: [4, 4, 0, 0] }, animationDelay: function(idx) { return idx * 100 } },
 { name: '参与人数', type: 'line', yAxisIndex: 1, data: participantCounts, lineStyle: { color: '#3B82F6', width: 2 }, itemStyle: { color: '#3B82F6' } }
 ]
 };
 projectUsageChartInstance.setOption(option);
 projectUsageChartInstance.hideLoading();
};
watch([filterClass, filterGrade, filterGender, filterProject], () => {
  nextTick(() => {
    initTrendChart()
    initProjectUsageChart()
  })
})

onMounted(async () => {
 initAuditStatusMap();
 
 // 加载推送数据
 await loadPushData();
 
 radarChartInstance?.showLoading();
 projectChartInstance?.showLoading();
 trendChartInstance?.showLoading();
 projectUsageChartInstance?.showLoading();
 nextTick(() => {
 setTimeout(() => {
 initTrendChart();
 initProjectUsageChart();
 }, 200);
 });
});
// 监听学校切换，重新加载数据
watch(schoolId, async () => {
  pageLoading.value = true
  pushDataLoaded.value = false
  pushData.value = []
  await loadPushData()
  nextTick(() => {
    initTrendChart()
    initProjectUsageChart()
  })
})

onBeforeUnmount(() => {
 radarChartInstance?.dispose();
 projectChartInstance?.dispose();
 trendChartInstance?.dispose();
 projectUsageChartInstance?.dispose();
});
</script>

<style scoped>
.sports-ranking {
  padding: 24px;
}

/* 通知栏 */
.notification-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%);
  border-radius: 8px;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.notification-icon {
  font-size: 20px;
}

.notification-icon svg {
  width: 24px;
  height: 24px;
}

.notification-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 8px;
}

.notification-title {
  font-weight: 600;
  color: #92400E;
}

.notification-text {
  color: #78350F;
}

/* 学期选择器 */
.term-selector {
  margin-bottom: 16px;
}

/* 图表行 */
.charts-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-bottom: 16px;
}

.time-tabs {
  display: flex;
  gap: 8px;
}

.time-tab {
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 16px;
  border: 1px solid #E8EAED;
  background: #FFFFFF;
  color: #6B7280;
}

.time-tab.active {
  background: #1E5AA8;
  color: #FFFFFF;
  border-color: #1E5AA8;
}

.filter-tabs {
  display: flex;
  gap: 12px;
}

.action-buttons {
  display: flex;
  gap: 8px;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px;
  color: #9CA3AF;
}

.empty-state p {
  margin-top: 8px;
}

/* 前三名展示 */
.top-three {
  display: flex;
  justify-content: center;
  align-items: flex-end;
  gap: 24px;
  padding: 24px 0;
  border-bottom: 1px solid #E8EAED;
}

.first-place, .second-place, .third-place {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.first-place {
  order: 2;
}

.second-place {
  order: 1;
}

.third-place {
  order: 3;
}

.medal {
  font-size: 32px;
}

.avatar-wrap {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #F0FDF4;
  border: 3px solid #1E5AA8;
  display: flex;
  align-items: center;
  justify-content: center;
}

.second-place .avatar-wrap {
  border-color: #9CA3AF;
  background: #F9FAFB;
}

.third-place .avatar-wrap {
  border-color: #F5A623;
  background: #FFFBEB;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
}

.top-three .name {
  font-weight: 600;
  font-size: 14px;
  color: #1A1A2E;
}

.top-three .class {
  font-size: 12px;
  color: #6B7280;
}

.top-three .student-id {
  font-size: 11px;
  color: #9CA3AF;
  font-family: monospace;
}

.top-three .gender {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.top-three .gender.男 {
  background: #DBEAFE;
  color: #1E40AF;
}

.top-three .gender.女 {
  background: #FCE7F3;
  color: #BE185D;
}

.top-three .score {
  font-weight: 700;
  font-size: 16px;
  color: #1E5AA8;
}

/* 排行榜列表 */
.ranking-list {
  padding-top: 16px;
  width: 100%;
}

/* 排名徽章 */
.rank-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #F3F4F6;
  font-size: 12px;
  font-weight: 600;
  color: #6B7280;
}

/* 性别标签 */
.gender-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.gender-tag.男 {
  background: #DBEAFE;
  color: #1E40AF;
}

.gender-tag.女 {
  background: #FCE7F3;
  color: #BE185D;
}

/* 等级标签 */
.level-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}

.level-tag.优秀 { background: #DCFCE7; color: #166534; }
.level-tag.良好 { background: #DBEAFE; color: #1E40AF; }
.level-tag.及格 { background: #FEF3C7; color: #92400E; }
.level-tag.不及格 { background: #FEE2E2; color: #991B1B; }

/* 学生详情弹窗 */
.student-detail {
  padding: 16px 0;
}

.detail-header {
  display: flex;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #E8EAED;
  margin-bottom: 16px;
}

.detail-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
}

.detail-info {
  flex: 1;
}

.detail-info h3 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 4px;
}

.detail-info p {
  color: #6B7280;
  margin-bottom: 8px;
}

.badges {
  display: flex;
  gap: 8px;
}

.badge {
  padding: 4px 12px;
  background: #F0FDF4;
  color: #1E5AA8;
  border-radius: 16px;
  font-size: 12px;
}

/* 统计网格 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 16px;
}

.stat-card {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-icon {
  font-size: 18px;
}

.stat-card .stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #1E5AA8;
}

.stat-card .stat-label {
  font-size: 11px;
  color: #6B7280;
}

/* 图表区域 */
.chart-section {
  margin-bottom: 16px;
}

.chart-section h4 {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
}

.chart-small {
  height: 200px;
}

.chart {
  height: 260px;
}

/* 视频区域 */
.video-section {
  margin-top: 16px;
}

.video-section h4 {
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
}

.video-player {
  background: #1A1A2E;
  border-radius: 8px;
  padding: 24px;
}

.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 160px;
  color: #9CA3AF;
}

.video-controls {
  display: flex;
  gap: 12px;
  margin-top: 12px;
  justify-content: center;
}

/* 面部识别 */
.face-recognition {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.camera-box {
  position: relative;
  width: 240px;
  height: 300px;
  border: 2px dashed #1E5AA8;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
}

.camera-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #9CA3AF;
}

.scan-line {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: #1E5AA8;
  animation: scan 2s linear infinite;
}

@keyframes scan {
  0% { top: 0; }
  100% { top: 100%; }
}

.recognition-status {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #9CA3AF;
}

.status-dot.idle { background: #9CA3AF; }
.status-dot.scanning { background: #F5A623; animation: pulse 1s infinite; }
.status-dot.success { background: #1E5AA8; }

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

/* 日期范围 */
.date-range {
  width: auto;
}

/* 运动排行榜响应式布局 */
@media screen and (max-width: 992px) {
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
  
  .charts-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .chart-card.full-width {
    grid-column: span 1;
  }
  
  .card-header {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .time-tabs,
  .filter-tabs {
    flex-wrap: wrap;
    gap: 4px;
  }
}

@media screen and (max-width: 768px) {
  .sports-ranking {
    padding: 12px;
    gap: 12px;
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
  
  .notification-bar {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
  }
  
  .term-selector {
    text-align: center;
  }
  
  .term-selector :deep(.el-select) {
    width: 100% !important;
  }
  
  .charts-row {
    grid-template-columns: 1fr;
    gap: 12px;
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
  
  .ranking-list {
    overflow-x: auto;
  }
  
  .ranking-item {
    min-width: 500px;
  }
  
  .camera-upload-area {
    width: 100%;
    height: 200px;
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
  
  .filter-tabs {
    flex-direction: column;
    width: 100%;
  }
  
  .filter-tabs :deep(.el-select) {
    width: 100% !important;
  }
  
  .chart {
    height: 160px;
  }
  
  .ranking-item {
    min-width: 400px;
  }
  
  .ranking-position {
    width: 36px;
    height: 36px;
    font-size: 14px;
  }
}

/* 审核状态标签 */
.audit-status-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-align: center;
}

.audit-status-tag.pending {
  background: #FEF3C7;
  color: #92400E;
}

.audit-status-tag.approved {
  background: #DCFCE7;
  color: #166534;
}

.audit-status-tag.rejected {
  background: #FEE2E2;
  color: #991B1B;
}

/* 审核操作按钮 */
.audit-actions {
  display: flex;
  gap: 4px;
}

/* 审核统计栏 */
.audit-stats-bar {
  display: flex;
  gap: 24px;
  padding: 10px 16px;
  background: #F9FAFB;
  border-radius: 8px;
  margin-bottom: 12px;
}

.audit-stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

.audit-stat-label {
  font-size: 12px;
  color: #6B7280;
}

.audit-stat-value {
  font-size: 14px;
  font-weight: 700;
}

.audit-stat-value.total {
  color: #1A1A2E;
}

.audit-stat-value.pending {
  color: #92400E;
}

.audit-stat-value.approved {
  color: #166534;
}

.audit-stat-value.rejected {
  color: #991B1B;
}

/* 批量审核弹窗 */
.batch-audit-content {
  padding: 8px 0;
}

.batch-audit-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
  margin-bottom: 20px;
}

.batch-stat-card {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 16px 12px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.batch-stat-num {
  font-size: 24px;
  font-weight: 700;
}

.batch-stat-num.total {
  color: #1A1A2E;
}

.batch-stat-num.pending {
  color: #92400E;
}

.batch-stat-num.approved {
  color: #166534;
}

.batch-stat-num.rejected {
  color: #991B1B;
}

.batch-stat-label {
  font-size: 12px;
  color: #6B7280;
}

.batch-audit-desc {
  text-align: center;
  color: #6B7280;
  margin-bottom: 20px;
}

.batch-audit-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
}
</style>
