<template>
  <div class="vote-security">
    <!-- 统计卡片 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num">{{ securityStats.blockRate }}%</span>
        <span class="stat-label">刷票拦截率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ securityStats.blockedVotes }}</span>
        <span class="stat-label">拦截攻击次数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ securityStats.validVotes }}</span>
        <span class="stat-label">有效投票数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ securityStats.ipBlocks }}</span>
        <span class="stat-label">IP拦截</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ securityStats.deviceBlocks }}</span>
        <span class="stat-label">设备拦截</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num">{{ securityStats.contentBlocks }}</span>
        <span class="stat-label">违规内容拦截</span>
      </div>
    </div>

    <!-- 安全机制卡片 -->
    <div class="charts-row">
      <!-- 微信授权绑定 -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">📱 微信ID绑定</span>
          <el-tag size="small" type="success">高防护</el-tag>
        </div>
        <div class="security-content">
          <p>强制微信授权登录，一人一票机制，拦截99%机器刷票</p>
          <div class="feature-list">
            <div class="feature-item">
              <el-icon :size="16" color="#1E5AA8"><Check /></el-icon>
              <span>OAuth2.0安全授权</span>
            </div>
            <div class="feature-item">
              <el-icon :size="16" color="#1E5AA8"><Check /></el-icon>
              <span>OpenID唯一性验证</span>
            </div>
            <div class="feature-item">
              <el-icon :size="16" color="#1E5AA8"><Check /></el-icon>
              <span>一人一票严格控制</span>
            </div>
          </div>
        </div>
      </div>

      <!-- IP+设备指纹 -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">🔍 IP+设备指纹</span>
          <el-tag size="small" type="warning">中高防护</el-tag>
        </div>
        <div class="security-content">
          <p>同一设备/IP限投1次，防止家庭多账号刷票</p>
          <div class="feature-list">
            <div class="feature-item">
              <el-icon :size="16" color="#1E5AA8"><Check /></el-icon>
              <span>IP地址追踪记录</span>
            </div>
            <div class="feature-item">
              <el-icon :size="16" color="#1E5AA8"><Check /></el-icon>
              <span>设备指纹识别</span>
            </div>
            <div class="feature-item">
              <el-icon :size="16" color="#1E5AA8"><Check /></el-icon>
              <span>Cookie追踪防护</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="charts-row">
      <!-- 验证码+行为分析 -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">🔐 验证码+行为分析</span>
          <el-tag size="small" type="success">高防护</el-tag>
        </div>
        <div class="security-content">
          <p>高频投票触发滑块验证，阻断脚本攻击</p>
          <div class="feature-list">
            <div class="feature-item">
              <el-icon :size="16" color="#1E5AA8"><Check /></el-icon>
              <span>智能滑块验证</span>
            </div>
            <div class="feature-item">
              <el-icon :size="16" color="#1E5AA8"><Check /></el-icon>
              <span>行为模式分析</span>
            </div>
            <div class="feature-item">
              <el-icon :size="16" color="#1E5AA8"><Check /></el-icon>
              <span>频率限制触发</span>
            </div>
          </div>
        </div>
      </div>

      <!-- AI内容审核 -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">🤖 AI内容审核</span>
          <el-tag size="small" type="success">高防护</el-tag>
        </div>
        <div class="security-content">
          <p>自动扫描违规内容，人工二次审核机制</p>
          <div class="feature-list">
            <div class="feature-item">
              <el-icon :size="16" color="#1E5AA8"><Check /></el-icon>
              <span>涉政内容识别</span>
            </div>
            <div class="feature-item">
              <el-icon :size="16" color="#1E5AA8"><Check /></el-icon>
              <span>暴恐图片检测</span>
            </div>
            <div class="feature-item">
              <el-icon :size="16" color="#1E5AA8"><Check /></el-icon>
              <span>人工复核机制</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 防护流程图 -->
    <div class="charts-row">
      <div class="chart-card full-width">
        <div class="card-header">
          <span class="card-title">🔄 投票安全流程</span>
        </div>
        <div class="flow-container">
          <div class="flow-step">
            <div class="step-icon">1</div>
            <span class="step-label">用户访问投票页面</span>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">
            <div class="step-icon">2</div>
            <span class="step-label">微信授权登录</span>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">
            <div class="step-icon">3</div>
            <span class="step-label">设备/IP验证</span>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">
            <div class="step-icon">4</div>
            <span class="step-label">频率检测</span>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step">
            <div class="step-icon">5</div>
            <span class="step-label">验证码验证</span>
          </div>
          <div class="flow-arrow">→</div>
          <div class="flow-step success">
            <div class="step-icon">✓</div>
            <span class="step-label">投票成功</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 实时监控面板 -->
    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Histogram /></el-icon> 实时安全监控</span>
          <el-tag size="small" type="success">系统正常</el-tag>
        </div>
        <div class="monitor-grid">
          <div class="monitor-item">
            <div class="monitor-label">今日投票次数</div>
            <div class="monitor-value">{{ monitorStats.todayVotes }}</div>
            <div class="monitor-trend up">+12% 较昨日</div>
          </div>
          <div class="monitor-item">
            <div class="monitor-label">拦截异常请求</div>
            <div class="monitor-value">{{ monitorStats.abnormalBlocks }}</div>
            <div class="monitor-trend down">-5% 较昨日</div>
          </div>
          <div class="monitor-item">
            <div class="monitor-label">验证码触发</div>
            <div class="monitor-value">{{ monitorStats.captchaTriggers }}</div>
            <div class="monitor-trend up">+8% 较昨日</div>
          </div>
          <div class="monitor-item">
            <div class="monitor-label">违规内容拦截</div>
            <div class="monitor-value">{{ monitorStats.contentBlocks }}</div>
            <div class="monitor-trend down">-40% 较昨日</div>
          </div>
        </div>
      </div>

      <!-- 安全状态概览 -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Lock /></el-icon> 安全状态概览</span>
        </div>
        <div class="security-status">
          <div class="status-item">
            <div class="status-circle safe"></div>
            <div class="status-info">
              <span class="status-value">安全</span>
              <span class="status-desc">当前系统状态</span>
            </div>
          </div>
          <div class="status-item">
            <div class="status-circle active"></div>
            <div class="status-info">
              <span class="status-value">运行中</span>
              <span class="status-desc">防护引擎</span>
            </div>
          </div>
          <div class="status-item">
            <div class="status-circle updated"></div>
            <div class="status-info">
              <span class="status-value">已更新</span>
              <span class="status-desc">病毒库版本</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 安全日志表格 -->
    <div class="charts-row">
      <div class="chart-card full-width">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Document /></el-icon> 安全拦截日志</span>
          <div class="header-actions">
            <el-select v-model="filterType" placeholder="筛选类型" style="width: 140px">
              <el-option label="全部" value="" />
              <el-option label="微信授权拦截" value="wechat" />
              <el-option label="IP拦截" value="ip" />
              <el-option label="设备拦截" value="device" />
              <el-option label="验证码拦截" value="captcha" />
              <el-option label="内容违规" value="content" />
              <el-option label="频率异常" value="frequency" />
            </el-select>
            <el-button type="primary" size="small" :icon="Refresh" @click="refreshData">刷新数据</el-button>
            <el-button type="success" size="small" :icon="User" @click="testVoteVisible = true">投票测试</el-button>
          </div>
        </div>
        <el-table :data="paginatedLogs" border class="data-table">
          <el-table-column prop="time" label="时间" width="200" />
          <el-table-column prop="type" label="拦截类型" width="140">
            <template #default="scope">
              <el-tag :type="getLogTagType(scope.row.type)">
                {{ getLogTypeName(scope.row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="ip" label="IP地址" width="160" />
          <el-table-column prop="device" label="设备信息" width="200" />
          <el-table-column prop="reason" label="拦截原因" />
          <el-table-column prop="action" label="操作" width="100">
            <template #default="scope">
              <el-button text size="small" :icon="InfoFilled" @click="viewLogDetail(scope.row)">详情</el-button>
            </template>
          </el-table-column>
        </el-table>
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :total="filteredLogs.length"
            :page-sizes="[10, 20, 30]"
            layout="total, sizes, prev, pager, next"
            small
          />
        </div>
      </div>
    </div>

    <!-- 完整安全日志弹窗 -->
    <el-dialog v-model="fullLogVisible" title="完整安全日志" width="800px">
      <el-table :data="securityLogs" stripe size="small" max-height="420" border>
        <el-table-column prop="time" label="时间" width="160" />
        <el-table-column prop="type" label="拦截类型" width="120">
          <template #default="scope">
            <el-tag :type="getLogTagType(scope.row.type)" size="small">{{ getLogTypeName(scope.row.type) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="ip" label="IP地址" width="140" />
        <el-table-column prop="device" label="设备信息" width="160" />
        <el-table-column prop="reason" label="拦截原因" />
      </el-table>
      <template #footer>
        <el-button @click="fullLogVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 日志详情弹窗 -->
    <el-dialog v-model="logDetailVisible" title="拦截详情" width="480px">
      <div v-if="selectedLog" class="log-detail">
        <div class="log-detail-row"><span>时间</span><span>{{ selectedLog.time }}</span></div>
        <div class="log-detail-row"><span>类型</span><el-tag :type="getLogTagType(selectedLog.type)" size="small">{{ getLogTypeName(selectedLog.type) }}</el-tag></div>
        <div class="log-detail-row"><span>IP地址</span><span>{{ selectedLog.ip }}</span></div>
        <div class="log-detail-row"><span>设备</span><span>{{ selectedLog.device }}</span></div>
        <div class="log-detail-row"><span>原因</span><span>{{ selectedLog.reason }}</span></div>
        <div class="log-detail-row"><span>投票标题</span><span>{{ selectedLog.pollTitle || '-' }}</span></div>
        <div class="log-detail-row"><span>处理结果</span><span>已拦截并记录</span></div>
      </div>
      <template #footer>
        <el-button type="primary" @click="logDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 模拟投票测试弹窗 -->
    <el-dialog v-model="testVoteVisible" title="模拟投票测试" width="480px">
      <div class="test-vote-form">
        <p class="form-hint">填写测试数据，系统将执行防刷票检测逻辑</p>
        <el-form :model="testVoteForm" label-width="100px">
          <el-form-item label="学生姓名" required>
            <el-input v-model="testVoteForm.studentName" placeholder="请输入学生姓名" />
          </el-form-item>
          <el-form-item label="IP地址" required>
            <el-input v-model="testVoteForm.ipAddress" placeholder="如 192.168.1.100" />
          </el-form-item>
          <el-form-item label="设备信息" required>
            <el-input v-model="testVoteForm.deviceInfo" placeholder="如 Chrome, iPhone 14" />
          </el-form-item>
          <el-form-item label="投票次数">
            <el-input-number v-model="testVoteForm.voteCount" :min="1" :max="10" />
          </el-form-item>
        </el-form>
        <div class="test-rules">
          <p class="rules-title">防刷票规则：</p>
          <ul>
            <li>IP地址1小时内投票超过10次 → 拦截</li>
            <li>设备1小时内投票超过5次 → 拦截</li>
            <li>设备当日投票超过5次 → 拦截</li>
            <li>单次请求投票超过1次 → 拦截</li>
            <li>随机触发验证码验证</li>
          </ul>
        </div>
      </div>
      <template #footer>
        <el-button @click="testVoteVisible = false">取消</el-button>
        <el-button type="primary" @click="submitTestVote">提交投票</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { ElMessage } from 'element-plus'
import { SetUp, Check, InfoFilled, Refresh, User, Lock, Histogram, Document } from '@element-plus/icons-vue'
import store from '@/store/global'
import { createSeededRandom, generateDeterministicId } from '@/utils/seededRandom'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const filterType = ref('')
const currentPage = ref(1)
const pageSize = ref(10)
const fullLogVisible = ref(false)
const logDetailVisible = ref(false)
const selectedLog = ref(null)
const testVoteVisible = ref(false)
const testVoteForm = ref({
  studentName: '',
  ipAddress: '',
  deviceInfo: '',
  voteCount: 1
})

const securityLogsKey = computed(() => `smart_pe_security_logs_${schoolId.value}`)
const voteRecordsKey = computed(() => `smart_pe_vote_records_${schoolId.value}`)

const generateInitialLogs = (sid) => {
  const baseLogs = {
    'hailin-second-primary': [
      { id: 1, time: '2026-07-14 14:32:18', type: 'ip', ip: '192.168.1.101', device: 'Mozilla/5.0 Windows', reason: '同一IP短时间内多次投票', pollId: 1, pollTitle: '优秀学生评选' },
      { id: 2, time: '2026-07-14 14:30:45', type: 'wechat', ip: '10.0.0.55', device: '微信小程序', reason: '未授权用户尝试投票', pollId: 1, pollTitle: '优秀学生评选' },
      { id: 3, time: '2026-07-14 14:28:33', type: 'device', ip: '172.16.0.88', device: 'iPhone 14', reason: '同一设备已投过票', pollId: 2, pollTitle: '运动会吉祥物投票' },
      { id: 4, time: '2026-07-14 14:25:12', type: 'captcha', ip: '192.168.1.102', device: 'Chrome', reason: '验证码验证失败', pollId: 1, pollTitle: '优秀学生评选' },
      { id: 5, time: '2026-07-14 14:22:08', type: 'content', ip: '10.0.0.66', device: 'Android', reason: '检测到违规图片内容', pollId: 3, pollTitle: '课程满意度调查' },
      { id: 6, time: '2026-07-14 13:45:33', type: 'ip', ip: '192.168.1.101', device: 'Mozilla/5.0 Windows', reason: 'IP投票频率异常', pollId: 2, pollTitle: '运动会吉祥物投票' },
      { id: 7, time: '2026-07-14 13:30:10', type: 'device', ip: '172.16.0.99', device: 'iPad Air', reason: '设备指纹重复', pollId: 1, pollTitle: '优秀学生评选' },
      { id: 8, time: '2026-07-14 12:15:22', type: 'captcha', ip: '192.168.1.105', device: 'Safari', reason: '连续5次验证失败', pollId: 4, pollTitle: '校园活动方案投票' }
    ],
    'hailin-zirong-primary': [
      { id: 1, time: '2026-07-14 09:15:22', type: 'ip', ip: '192.168.5.22', device: 'Firefox', reason: 'IP投票频率异常', pollId: 1, pollTitle: '体育之星评选' },
      { id: 2, time: '2026-07-14 09:12:10', type: 'device', ip: '172.16.2.44', device: 'iPad Mini', reason: '设备指纹重复', pollId: 1, pollTitle: '体育之星评选' },
      { id: 3, time: '2026-07-14 09:08:45', type: 'wechat', ip: '10.0.3.77', device: '微信H5', reason: '未绑定微信用户', pollId: 2, pollTitle: '文化节主题投票' },
      { id: 4, time: '2026-07-14 09:05:33', type: 'captcha', ip: '192.168.5.23', device: 'Safari', reason: '连续5次验证失败', pollId: 1, pollTitle: '体育之星评选' },
      { id: 5, time: '2026-07-14 09:02:18', type: 'content', ip: '10.0.3.88', device: '微信小程序', reason: '检测到敏感文字', pollId: 3, pollTitle: '课间活动方案投票' },
      { id: 6, time: '2026-07-14 08:58:42', type: 'ip', ip: '192.168.6.25', device: 'Chrome', reason: '同一IP短时间内多次投票', pollId: 4, pollTitle: '体育课程满意度调查' }
    ],
    'linhai-experimental-primary': [
      { id: 1, time: '2026-07-14 16:45:33', type: 'device', ip: '172.16.5.33', device: 'Huawei Pad', reason: '同一设备已投过票', pollId: 1, pollTitle: '体育标兵评选' },
      { id: 2, time: '2026-07-14 16:42:18', type: 'captcha', ip: '192.168.10.44', device: 'Edge', reason: '验证码验证失败', pollId: 1, pollTitle: '体育标兵评选' },
      { id: 3, time: '2026-07-14 16:38:55', type: 'wechat', ip: '10.0.8.55', device: '微信小程序', reason: '未授权用户尝试投票', pollId: 2, pollTitle: '会徽设计投票' },
      { id: 4, time: '2026-07-14 16:35:22', type: 'ip', ip: '192.168.10.45', device: 'Mozilla/5.0', reason: 'IP投票频率异常', pollId: 3, pollTitle: '拓展项目投票' },
      { id: 5, time: '2026-07-14 16:30:10', type: 'content', ip: '10.0.8.66', device: 'Android', reason: '检测到违规图片内容', pollId: 4, pollTitle: '游泳课程调查' },
      { id: 6, time: '2026-07-14 16:25:48', type: 'device', ip: '172.16.5.34', device: 'iPhone 15', reason: '设备指纹重复', pollId: 1, pollTitle: '体育标兵评选' },
      { id: 7, time: '2026-07-14 16:20:33', type: 'captcha', ip: '192.168.11.77', device: 'Chrome', reason: '连续3次验证失败', pollId: 5, pollTitle: '年度最佳体育班级评选' }
    ]
  }
  return baseLogs[sid] || baseLogs['hailin-second-primary']
}

const generateInitialVoteRecords = (sid) => {
  const random = createSeededRandom(sid + '_voteRecords')
  const now = new Date('2026-07-16T08:00:00')
  const formatTime = (d) => {
    const pad = (n) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
  
  const records = []
  const students = ['张宏森', '高芸熙', '庄艾琳', '隋成泽', '王铭赫', '张桐昕', '范晨熙', '孙艺菲']
  const polls = ['优秀学生评选', '运动会吉祥物投票', '课程满意度调查']
  const ips = ['192.168.1.101', '192.168.1.102', '192.168.1.103', '172.16.0.55', '172.16.0.56']
  const devices = ['Chrome', '微信小程序', 'iPhone 14', 'Android', 'iPad']
  
  for (let i = 0; i < 20; i++) {
    const d = new Date(now.getTime() - random() * 86400000)
    records.push({
      id: generateDeterministicId('vote', students[i % students.length] + '_' + i),
      time: formatTime(d),
      studentName: students[i % students.length],
      studentId: `stu-${1001 + i}`,
      pollId: (i % 3) + 1,
      pollTitle: polls[i % polls.length],
      ip: ips[i % ips.length],
      device: devices[i % devices.length],
      valid: random() > 0.15,
      violationType: random() > 0.85 ? ['ip', 'device', 'captcha'][Math.floor(random() * 3)] : null
    })
  }
  
  return records.sort((a, b) => new Date(b.time) - new Date(a.time))
}

const securityLogs = ref([])
const voteRecords = ref([])

watch(securityLogsKey, (newKey) => {
  const stored = sessionStorage.getItem(newKey)
  if (stored) {
    securityLogs.value = JSON.parse(stored)
  } else {
    securityLogs.value = generateInitialLogs(schoolId.value)
    sessionStorage.setItem(newKey, JSON.stringify(securityLogs.value))
  }
}, { immediate: true })

watch(securityLogs, (newVal) => {
  sessionStorage.setItem(securityLogsKey.value, JSON.stringify(newVal))
}, { deep: true })

watch(voteRecordsKey, (newKey) => {
  const stored = sessionStorage.getItem(newKey)
  if (stored) {
    voteRecords.value = JSON.parse(stored)
  } else {
    voteRecords.value = generateInitialVoteRecords(schoolId.value)
    sessionStorage.setItem(newKey, JSON.stringify(voteRecords.value))
  }
}, { immediate: true })

watch(voteRecords, (newVal) => {
  sessionStorage.setItem(voteRecordsKey.value, JSON.stringify(newVal))
}, { deep: true })

const ipVoteCounts = computed(() => {
  const counts = {}
  voteRecords.value.forEach(r => {
    counts[r.ip] = (counts[r.ip] || 0) + 1
  })
  return counts
})

const deviceVoteCounts = computed(() => {
  const counts = {}
  voteRecords.value.forEach(r => {
    counts[r.device] = (counts[r.device] || 0) + 1
  })
  return counts
})

const securityStats = computed(() => {
  const totalVotes = voteRecords.value.length
  const validVotes = voteRecords.value.filter(r => r.valid).length
  const blockedVotes = securityLogs.value.length
  const blockRate = totalVotes + blockedVotes > 0 
    ? ((blockedVotes / (totalVotes + blockedVotes)) * 100).toFixed(1)
    : 0
  
  const ipBlocks = securityLogs.value.filter(l => l.type === 'ip').length
  const deviceBlocks = securityLogs.value.filter(l => l.type === 'device').length
  const captchaBlocks = securityLogs.value.filter(l => l.type === 'captcha').length
  const contentBlocks = securityLogs.value.filter(l => l.type === 'content').length
  const wechatBlocks = securityLogs.value.filter(l => l.type === 'wechat').length
  
  return {
    blockRate,
    blockedVotes,
    validVotes,
    totalVotes,
    ipBlocks,
    deviceBlocks,
    captchaBlocks,
    contentBlocks,
    wechatBlocks
  }
})

const monitorStats = computed(() => {
  const todayVotes = voteRecords.value.filter(r => r.time.startsWith(new Date().toISOString().split('T')[0])).length
  const abnormalBlocks = securityLogs.value.filter(l => l.time.startsWith(new Date().toISOString().split('T')[0])).length
  const captchaTriggers = securityLogs.value.filter(l => l.type === 'captcha').length
  const contentBlocks = securityLogs.value.filter(l => l.type === 'content').length
  
  return {
    todayVotes,
    abnormalBlocks,
    captchaTriggers,
    contentBlocks
  }
})

const filteredLogs = computed(() => {
  let logs = securityLogs.value
  if (filterType.value) {
    logs = logs.filter(log => log.type === filterType.value)
  }
  return logs
})

const paginatedLogs = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  return filteredLogs.value.slice(start, end)
})

const getLogTagType = (type) => {
  const map = {
    wechat: 'warning',
    ip: 'danger',
    device: 'info',
    captcha: 'warning',
    content: 'danger',
    frequency: 'warning'
  }
  return map[type] || 'info'
}

const getLogTypeName = (type) => {
  const map = {
    wechat: '微信授权',
    ip: 'IP拦截',
    device: '设备拦截',
    captcha: '验证码',
    content: '内容违规',
    frequency: '频率异常'
  }
  return map[type] || type
}


const viewLogDetail = (row) => {
  selectedLog.value = row
  logDetailVisible.value = true
}

const checkVoteSecurity = (studentName, ip, device, voteCount) => {
  const violations = []
  const now = new Date()
  const formatTime = (d) => {
    const pad = (n) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  }
  
  const recentIpVotes = voteRecords.value.filter(r => 
    r.ip === ip && new Date(now) - new Date(r.time) < 3600000
  ).length
  
  const recentDeviceVotes = voteRecords.value.filter(r => 
    r.device === device && new Date(now) - new Date(r.time) < 3600000
  ).length
  
  const dailyLimit = 5
  const sameDeviceVotes = voteRecords.value.filter(r => r.device === device).length
  
  if (voteCount > 1) {
    violations.push({ type: 'frequency', reason: `单次请求投票${voteCount}次，超过限制` })
  }
  
  if (recentIpVotes >= 10) {
    violations.push({ type: 'ip', reason: `IP ${ip} 1小时内投票${recentIpVotes}次，超过频率限制` })
  }
  
  if (recentDeviceVotes >= 5) {
    violations.push({ type: 'device', reason: `设备 ${device} 1小时内投票${recentDeviceVotes}次，超过频率限制` })
  }
  
  if (sameDeviceVotes >= dailyLimit) {
    violations.push({ type: 'device', reason: `设备 ${device} 今日已投票${sameDeviceVotes}次，超过每日限制${dailyLimit}次` })
  }
  
  if (violations.length === 0) {
    const ipRiskLevel = recentIpVotes >= 5 ? 'high' : recentIpVotes >= 3 ? 'medium' : 'low'
    const deviceRiskLevel = recentDeviceVotes >= 3 ? 'high' : recentDeviceVotes >= 2 ? 'medium' : 'low'
    
    if (ipRiskLevel === 'high' || deviceRiskLevel === 'high') {
      violations.push({ type: 'captcha', reason: '检测到高频投票行为，需要验证码验证' })
    } else if (ipRiskLevel === 'medium' && deviceRiskLevel === 'medium') {
      violations.push({ type: 'captcha', reason: '检测到异常投票模式，需要验证码验证' })
    }
  }
  
  if (violations.length > 0) {
    violations.forEach(v => {
      securityLogs.value.unshift({
        id: generateDeterministicId('seclog', ip + '_' + v.type),
        time: formatTime(now),
        type: v.type,
        ip: ip,
        device: device,
        reason: v.reason,
        pollId: 1,
        pollTitle: '测试投票'
      })
    })
    return { success: false, violations }
  }
  
  for (let i = 0; i < voteCount; i++) {
    voteRecords.value.unshift({
      id: generateDeterministicId('vrec', studentName + '_' + i),
      time: formatTime(now),
      studentName: studentName,
      studentId: generateDeterministicId('stu-test', studentName),
      pollId: 1,
      pollTitle: '测试投票',
      ip: ip,
      device: device,
      valid: true,
      violationType: null
    })
  }
  
  return { success: true, violations: [] }
}

const submitTestVote = () => {
  if (!testVoteForm.value.studentName || !testVoteForm.value.ipAddress || !testVoteForm.value.deviceInfo) {
    ElMessage.warning('请填写完整的测试信息')
    return
  }
  
  const result = checkVoteSecurity(
    testVoteForm.value.studentName,
    testVoteForm.value.ipAddress,
    testVoteForm.value.deviceInfo,
    testVoteForm.value.voteCount
  )
  
  if (result.success) {
    ElMessage.success(`投票成功！已记录${testVoteForm.value.voteCount}票`)
    testVoteVisible.value = false
    testVoteForm.value = { studentName: '', ipAddress: '', deviceInfo: '', voteCount: 1 }
  } else {
    const messages = result.violations.map(v => `${getLogTypeName(v.type)}: ${v.reason}`).join('\n')
    ElMessage.warning(`投票被拦截！\n${messages}`)
  }
}

const refreshData = () => {
  ElMessage.success('数据已刷新')
}
</script>

<style scoped>
.vote-security {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 图表行 */
.charts-row {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.charts-row .full-width {
  grid-column: span 2;
}

@media (max-width: 1200px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
  .charts-row .full-width {
    grid-column: span 1;
  }
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

/* 安全内容 */
.security-content {
  p {
    font-size: 13px;
    color: #6B7280;
    margin-bottom: 12px;
  }
}

.feature-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #1A1A2E;
}

/* 流程图 */
.flow-container {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
  padding: 16px 0;
}

.flow-step {
  display: flex;
  align-items: center;
  gap: 8px;
}

.step-icon {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #F3F4F6;
  color: #6B7280;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.flow-step.success .step-icon {
  background: #DCFCE7;
  color: #166534;
}

.step-label {
  font-size: 13px;
  color: #1A1A2E;
}

.flow-arrow {
  color: #9CA3AF;
  font-size: 18px;
}

/* 监控面板 */
.monitor-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.monitor-item {
  background: #F7F8FA;
  border-radius: 8px;
  padding: 12px;
}

.monitor-label {
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 4px;
}

.monitor-value {
  font-size: 24px;
  font-weight: 700;
  color: #1A1A2E;
  margin-bottom: 4px;
}

.monitor-trend {
  font-size: 11px;
}

.monitor-trend.up {
  color: #1E5AA8;
}

.monitor-trend.down {
  color: #E85D4E;
}

/* 安全状态 */
.security-status {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-circle {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.status-circle.safe {
  background: #1E5AA8;
  box-shadow: 0 0 8px rgba(45, 125, 70, 0.5);
}

.status-circle.active {
  background: #3B82F6;
  box-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
}

.status-circle.updated {
  background: #F5A623;
  box-shadow: 0 0 8px rgba(245, 166, 35, 0.5);
}

.status-info {
  display: flex;
  flex-direction: column;
}

.status-value {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.status-desc {
  font-size: 12px;
  color: #6B7280;
}

/* 数据表格 */
.data-table {
  width: 100%;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.log-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #F9FAFB;
  border-radius: 8px;
  font-size: 14px;
}

.log-detail-row span:first-child {
  color: #6B7280;
}
</style>
