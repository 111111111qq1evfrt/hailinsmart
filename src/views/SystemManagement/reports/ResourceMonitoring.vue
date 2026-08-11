<template>
  <div class="monitor-center">


    <!-- 顶部状态栏 -->
    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num" :style="{ color: connectionStatus === 'connected' ? '#1E5AA8' : '#E85D4E' }">
          {{ connectionStatus === 'connected' ? '在线' : '离线' }}
        </span>
        <span class="stat-label">监控状态</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: getStatusColor(cpuData.usage) }">{{ cpuData.usage.toFixed(1) }}%</span>
        <span class="stat-label">CPU 负载</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: getStatusColor(memoryData.usage) }">{{ memoryData.usage.toFixed(1) }}%</span>
        <span class="stat-label">内存使用</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: getStorageStatusColor(storageData.usage) }">{{ (100 - storageData.usage).toFixed(1) }}%</span>
        <span class="stat-label">存储可用</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: securityData.threats > 0 ? '#E85D4E' : '#1E5AA8' }">{{ securityData.threats }}</span>
        <span class="stat-label">威胁检测</span>
      </div>
    </div>

    <!-- 核心指标卡片行 -->
    <div class="charts-row">
      <!-- CPU 负载 -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">CPU 实时负载</span>
          <div class="time-tabs">
            <el-button 
              v-for="tab in cpuTimeTabs" 
              :key="tab.value"
              :class="['time-tab', { active: cpuTimeRange === tab.value }]"
              @click="cpuTimeRange = tab.value"
            >{{ tab.label }}</el-button>
          </div>
        </div>
        <div ref="cpuChart" class="chart"></div>
      </div>

      <!-- 内存使用 -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">内存使用趋势</span>
          <div class="time-tabs">
            <el-button 
              v-for="tab in memoryTimeTabs" 
              :key="tab.value"
              :class="['time-tab', { active: memoryTimeRange === tab.value }]"
              @click="memoryTimeRange = tab.value"
            >{{ tab.label }}</el-button>
          </div>
        </div>
        <div ref="memoryChart" class="chart"></div>
      </div>
    </div>

    <!-- 存储与网络行 -->
    <div class="charts-row">
      <!-- 存储余量 -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">存储磁盘状态</span>
          <el-button type="text" class="view-all" @click="showStorageDetail = true">查看详情</el-button>
        </div>
        <div class="storage-list">
          <div v-for="disk in storageData.disks" :key="disk.name" class="storage-item">
            <div class="storage-info">
              <span class="storage-name">{{ disk.name }}</span>
              <span class="storage-size">{{ (disk.used / 1024).toFixed(1) }}GB / {{ (disk.total / 1024).toFixed(1) }}GB</span>
            </div>
            <div class="storage-bar-wrapper">
              <div class="storage-bar">
                <div class="storage-fill" :style="{ width: disk.usage + '%' }" :class="getDiskColor(disk.usage)"></div>
              </div>
              <span class="storage-percent" :style="{ color: getStatusColor(disk.usage) }">{{ disk.usage }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 网络安全态势 -->
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">网络安全态势</span>
          <el-tag :type="securityData.threats > 0 ? 'danger' : 'success'" size="small">
            {{ securityData.threats > 0 ? '存在威胁' : '安全' }}
          </el-tag>
        </div>
        <div class="security-content">
          <div class="security-stats">
            <div class="sec-stat">
              <div class="sec-num">{{ securityData.connections }}</div>
              <div class="sec-label">活跃连接</div>
            </div>
            <div class="sec-stat">
              <div class="sec-num" :style="{ color: '#E85D4E' }">{{ securityData.threats }}</div>
              <div class="sec-label">威胁检测</div>
            </div>
            <div class="sec-stat">
              <div class="sec-num" :style="{ color: '#F5A623' }">{{ securityData.blocked }}</div>
              <div class="sec-label">已拦截</div>
            </div>
          </div>
          <div class="security-events">
            <div v-for="(event, index) in securityData.events.slice(0, 4)" :key="index" class="event-item" :class="event.level">
              <div class="event-dot" :class="event.level"></div>
              <div class="event-time">{{ event.time }}</div>
              <div class="event-desc">{{ event.description }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据流动拓扑图 -->
    <div class="charts-row">
      <div class="chart-card full-width">
        <div class="card-header">
          <span class="card-title">数据流动拓扑图</span>
          <div class="section-actions">
            <el-radio-group v-model="topologyLayout" size="small">
              <el-radio-button label="force">力导向</el-radio-button>
              <el-radio-button label="hierarchical">层级</el-radio-button>
              <el-radio-button label="circular">环形</el-radio-button>
            </el-radio-group>

          </div>
        </div>
        <div class="topology-container" ref="topologyContainer">
          <svg class="topology-svg" :viewBox="`0 0 ${topologyWidth} ${topologyHeight}`">
            <defs>
              <marker id="arrowhead" markerWidth="4" markerHeight="3" refX="3.5" refY="1.5" orient="auto">
                <polygon points="0 0, 4 1.5, 0 3" fill="#4fc3f7" />
              </marker>
              <filter id="glow">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            <g class="links-layer">
              <path v-for="link in topologyLinks" :key="link.id"
                :d="getLinkPath(link)"
                class="topology-link"
                :class="[link.status, { active: link.active }]"
                :stroke-width="link.bandwidth / 10 + 0.5"
                marker-end="url(#arrowhead)">
                <animate v-if="link.active" attributeName="stroke-dashoffset"
                  from="100" to="0" dur="2s" repeatCount="indefinite"/>
              </path>
            </g>

            <g class="nodes-layer">
              <g v-for="node in topologyNodes" :key="node.id"
                :transform="`translate(${node.x}, ${node.y})`"
                class="topology-node"
                :class="[node.type, node.status]"
                @click="showNodeDetail(node)">
                <circle v-if="node.status === 'warning' || node.status === 'error'"
                  :r="node.size + 8" fill="none"
                  :stroke="node.status === 'error' ? '#ff5252' : '#ffab40'"
                  stroke-width="2" opacity="0.6">
                  <animate attributeName="r" :values="`${node.size + 8};${node.size + 12};${node.size + 8}`" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.6;0.2;0.6" dur="2s" repeatCount="indefinite"/>
                </circle>

                <circle :r="node.size" 
                  :fill="getNodeColor(node)"
                  :stroke="getNodeStroke(node)"
                  stroke-width="2"
                  filter="url(#glow)"/>

                <foreignObject :x="-node.size/2" :y="-node.size/2" 
                  :width="node.size" :height="node.size">
                  <div class="node-icon" v-html="getNodeIcon(node.type)"></div>
                </foreignObject>

                <text :y="-(node.size + 10)" text-anchor="middle" class="node-label">{{ node.name }}</text>
                <text :y="node.size + 18" text-anchor="middle" class="node-sublabel">{{ node.ip }}</text>

                <circle v-if="node.traffic > 0" :r="4" :cy="-(node.size + 4)" fill="#00e676">
                  <animate attributeName="r" values="4;6;4" dur="1s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="1;0.5;1" dur="1s" repeatCount="indefinite"/>
                </circle>
              </g>
            </g>
          </svg>

          <div class="topology-legend">
            <div class="legend-item">
              <span class="legend-dot" style="background:#4CAF50"></span>
              <span>应用服务器</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background:#2196F3"></span>
              <span>数据库</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background:#FF9800"></span>
              <span>网关/API</span>
            </div>
            <div class="legend-item">
              <span class="legend-dot" style="background:#9C27B0"></span>
              <span>缓存服务</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 智能扩容预测 -->
    <div class="charts-row">
      <div class="chart-card full-width">
        <div class="card-header">
          <span class="card-title">智能扩容预测</span>
          <div class="header-right">
            <el-tag type="info" size="small">基于历史数据趋势分析</el-tag>
            <el-button type="text" class="refresh-btn" @click="refreshPredictions">
              <RefreshRight /> 刷新预测
            </el-button>
          </div>
        </div>
        <div class="prediction-grid">
          <div v-for="pred in predictions" :key="pred.resource" 
            class="prediction-card cursor-pointer"
            :class="pred.recommendation === '扩容' ? 'warning' : 'normal'"
            @click="openPredictionDetail(pred)">
            <div class="pred-header">
              <el-icon class="pred-icon" :size="20">
                <component :is="pred.icon" />
              </el-icon>
              <span class="pred-title">{{ pred.name }}</span>
              <el-tag :type="pred.recommendation === '扩容' ? 'danger' : 'success'" size="small">
                {{ pred.recommendation }}
              </el-tag>
            </div>
            <div class="pred-chart-mini">
              <svg viewBox="0 0 200 60" preserveAspectRatio="none">
                <path :d="pred.trendPath" fill="none" stroke-width="2"
                  :stroke="pred.recommendation === '扩容' ? '#E85D4E' : '#1E5AA8'"/>
                <path :d="pred.trendPath + ' L 200 60 L 0 60 Z'" 
                  :fill="pred.recommendation === '扩容' ? 'rgba(232,93,78,0.1)' : 'rgba(45,125,70,0.1)'"/>
                <!-- 阈值线 -->
                <line x1="0" :y1="60 - (pred.threshold / 100 * 55)" x2="200" :y2="60 - (pred.threshold / 100 * 55)" 
                  stroke="#E85D4E" stroke-width="1" stroke-dasharray="4,2" opacity="0.6"/>
              </svg>
            </div>
            <div class="pred-stats-row">
              <div class="pred-stat">
                <div class="pred-label">当前使用率</div>
                <div class="pred-value">{{ pred.current }}{{ pred.unit }}</div>
              </div>
              <div class="pred-stat">
                <div class="pred-label">预测 (7天后)</div>
                <div class="pred-value" :style="{ color: pred.recommendation === '扩容' ? '#E85D4E' : '#1E5AA8' }">{{ pred.predicted }}{{ pred.unit }}</div>
              </div>
              <div class="pred-stat">
                <div class="pred-label">预计到达阈值</div>
                <div class="pred-value">{{ pred.timeToThreshold }}</div>
              </div>
            </div>
            <div class="pred-confidence">
              <div class="confidence-info">
                <span>预测置信度: {{ pred.confidence }}%</span>
                <span class="accuracy-info">历史准确率: {{ pred.historyAccuracy }}%</span>
              </div>
              <el-progress :percentage="pred.confidence" 
                :color="pred.confidence > 80 ? '#1E5AA8' : '#F5A623'" 
                :show-text="false" 
                :stroke-width="6"/>
            </div>
            <div class="pred-actions">
              <el-button type="text" size="small" class="detail-link">查看详情 <ArrowRight /></el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 存储磁盘详情弹窗 -->
    <el-dialog v-model="showStorageDetail" title="存储磁盘详情" width="700px" class="storage-detail-dialog">
      <div class="storage-detail-content">
        <div class="storage-overview">
          <div class="overview-item">
            <span class="overview-label">总容量</span>
            <span class="overview-value">{{ (storageData.disks.reduce((sum, d) => sum + d.total, 0) / 1024).toFixed(1) }} GB</span>
          </div>
          <div class="overview-item">
            <span class="overview-label">已使用</span>
            <span class="overview-value" style="color: #F5A623;">{{ (storageData.disks.reduce((sum, d) => sum + d.used, 0) / 1024).toFixed(1) }} GB</span>
          </div>
          <div class="overview-item">
            <span class="overview-label">可用空间</span>
            <span class="overview-value text-primary">{{ ((storageData.disks.reduce((sum, d) => sum + d.total, 0) - storageData.disks.reduce((sum, d) => sum + d.used, 0)) / 1024).toFixed(1) }} GB</span>
          </div>
          <div class="overview-item">
            <span class="overview-label">平均使用率</span>
            <span class="overview-value" :style="{ color: getStatusColor(storageData.usage) }">{{ storageData.usage.toFixed(1) }}%</span>
          </div>
        </div>
        <div class="storage-detail-list">
          <div v-for="disk in storageData.disks" :key="disk.name" class="storage-detail-item">
            <div class="detail-item-header">
              <div class="detail-item-info">
                <span class="detail-item-name">{{ disk.name }}</span>
                <span class="detail-item-type">NTFS</span>
              </div>
              <span class="detail-item-status" :class="getDiskColor(disk.usage)">{{ disk.usage > 80 ? '警告' : '正常' }}</span>
            </div>
            <div class="detail-item-bar">
              <div class="detail-item-fill" :style="{ width: disk.usage + '%' }" :class="getDiskColor(disk.usage)"></div>
            </div>
            <div class="detail-item-stats">
              <span class="detail-item-used">已用 {{ (disk.used / 1024).toFixed(1) }} GB</span>
              <span class="detail-item-total">总容量 {{ (disk.total / 1024).toFixed(1) }} GB</span>
              <span class="detail-item-percent" :style="{ color: getStatusColor(disk.usage) }">{{ disk.usage }}%</span>
            </div>
          </div>
        </div>
        <div class="storage-detail-chart">
          <div class="chart-title">磁盘使用趋势</div>
          <div ref="storageTrendChart" class="trend-chart"></div>
        </div>
      </div>
    </el-dialog>

    <!-- 节点详情弹窗 -->
    <el-dialog v-model="nodeDetailVisible" :title="selectedNode?.name + ' 详情'" width="600px">
      <div v-if="selectedNode" class="node-detail">
        <div class="detail-row">
          <span class="detail-label">节点类型</span>
          <el-tag>{{ selectedNode.type }}</el-tag>
        </div>
        <div class="detail-row">
          <span class="detail-label">IP地址</span>
          <span>{{ selectedNode.ip }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">运行状态</span>
          <el-tag :type="selectedNode.status === 'normal' ? 'success' : 'danger'">
            {{ selectedNode.status === 'normal' ? '正常运行' : '异常' }}
          </el-tag>
        </div>
        <div class="detail-row">
          <span class="detail-label">CPU使用率</span>
          <el-progress :percentage="selectedNode.metrics?.cpu || 0" :color="getProgressColor"/>
        </div>
        <div class="detail-row">
          <span class="detail-label">内存使用率</span>
          <el-progress :percentage="selectedNode.metrics?.memory || 0" :color="getProgressColor"/>
        </div>
        <div class="detail-row">
          <span class="detail-label">网络流量</span>
          <span>入: {{ selectedNode.metrics?.networkIn || 0 }}MB/s | 出: {{ selectedNode.metrics?.networkOut || 0 }}MB/s</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">运行时长</span>
          <span>{{ selectedNode.metrics?.uptime || '0天0小时' }}</span>
        </div>
      </div>
    </el-dialog>

    <!-- 智能预测详情弹窗 -->
    <el-dialog v-model="showPredictionDetail" :title="selectedPrediction?.name + ' - 详情'" width="800px" class="prediction-detail-dialog">
      <div v-if="selectedPrediction" class="prediction-detail">
        <!-- 概览卡片 -->
        <div class="detail-summary" :class="selectedPrediction.recommendation === '扩容' ? 'warning' : 'normal'">
          <div class="summary-header">
            <el-icon class="summary-icon" :size="32">
              <component :is="selectedPrediction.icon" />
            </el-icon>
            <div class="summary-info">
              <h3>{{ selectedPrediction.name }}</h3>
              <p>预测状态: <el-tag :type="selectedPrediction.recommendation === '扩容' ? 'danger' : 'success'">{{ selectedPrediction.recommendation }}</el-tag></p>
            </div>
          </div>
          <div class="summary-stats">
            <div class="summary-stat">
              <span class="stat-label">当前使用率</span>
              <span class="stat-value">{{ selectedPrediction.current }}{{ selectedPrediction.unit }}</span>
            </div>
            <div class="summary-stat">
              <span class="stat-label">阈值</span>
              <span class="stat-value" style="color: #E85D4E">{{ selectedPrediction.threshold }}{{ selectedPrediction.unit }}</span>
            </div>
            <div class="summary-stat">
              <span class="stat-label">预测值</span>
              <span class="stat-value" :style="{ color: selectedPrediction.recommendation === '扩容' ? '#E85D4E' : '#1E5AA8' }">{{ selectedPrediction.predicted }}{{ selectedPrediction.unit }}</span>
            </div>
            <div class="summary-stat">
              <span class="stat-label">预计到达阈值</span>
              <span class="stat-value">{{ selectedPrediction.timeToThreshold }}</span>
            </div>
          </div>
        </div>

        <!-- 预测趋势图表 -->
        <div class="detail-section">
          <h4 class="section-title">预测趋势分析</h4>
          <div ref="predictionTrendChart" class="prediction-chart"></div>
        </div>

        <!-- 算法信息 -->
        <div class="detail-section">
          <h4 class="section-title">预测算法信息</h4>
          <div class="algorithm-info">
            <div class="info-row">
              <span class="info-label">算法类型</span>
              <span class="info-value">{{ selectedPrediction.algorithm }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">预测置信度</span>
              <div class="confidence-row">
                <span class="info-value">{{ selectedPrediction.confidence }}%</span>
                <el-progress :percentage="selectedPrediction.confidence" :color="selectedPrediction.confidence > 80 ? '#1E5AA8' : '#F5A623'" :show-text="false" :stroke-width="8" style="width: 150px;"/>
              </div>
            </div>
            <div class="info-row">
              <span class="info-label">历史预测准确率</span>
              <span class="info-value">{{ selectedPrediction.historyAccuracy }}%</span>
            </div>
          </div>
        </div>

        <!-- 建议列表 -->
        <div class="detail-section">
          <h4 class="section-title">优化建议</h4>
          <div class="suggestions-list">
            <div v-for="(suggestion, index) in selectedPrediction.suggestions" :key="index" 
              class="suggestion-item" :class="suggestion.type">
              <el-icon v-if="suggestion.type === 'recommend'">
                <TrendCharts />
              </el-icon>
              <el-icon v-else-if="suggestion.type === 'warning'">
                <Warning />
              </el-icon>
              <el-icon v-else>
                <InfoFilled />
              </el-icon>
              <span>{{ suggestion.text }}</span>
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <el-button @click="showPredictionDetail = false">关闭</el-button>
        <el-button v-if="selectedPrediction?.recommendation === '扩容'" type="primary" @click="executeScale(selectedPrediction)">
          执行扩容
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { RefreshRight, Cpu, Memo, FolderOpened, Lock, TrendCharts, ArrowRight, Warning, InfoFilled } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import echarts from '@/utils/echarts'
import store from '@/store/global'
import { createSeededRandom } from '@/utils/seededRandom'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

// 不同学校的监控数据偏移量，确保数据不同
const schoolOffset = computed(() => {
  const map = { 'hailin-second-primary': 0, 'hailin-zirong-primary': 12, 'linhai-experimental-primary': -8 }
  return map[schoolId.value] || 0
})

// ========== 响应式数据 ==========
const connectionStatus = ref('connected')
const cpuTimeRange = ref('1h')
const memoryTimeRange = ref('1h')
const topologyLayout = ref('force')
const nodeDetailVisible = ref(false)
const selectedNode = ref(null)
const showStorageDetail = ref(false)

const cpuTimeTabs = [
  { label: '1小时', value: '1h' },
  { label: '6小时', value: '6h' },
  { label: '24小时', value: '24h' }
]

const memoryTimeTabs = [
  { label: '1小时', value: '1h' },
  { label: '6小时', value: '6h' },
  { label: '24小时', value: '24h' }
]

// CPU数据
const cpuData = reactive({
  usage: 45.2,
  cores: 8,
  frequency: 3.2,
  history: []
})

// 内存数据
const memoryData = reactive({
  usage: 62.5,
  used: 8192,
  total: 16384,
  history: []
})

// 存储数据
const storageData = reactive({
  usage: 68.3,
  disks: [
    { name: '系统盘 (C:)', used: 25600, total: 51200, usage: 50 },
    { name: '数据盘 (D:)', used: 38400, total: 51200, usage: 75 },
    { name: '日志盘 (E:)', used: 12800, total: 25600, usage: 50 }
  ]
})

// 网络安全数据
const securityData = reactive({
  level: 'success',
  levelText: '安全',
  connections: 1247,
  threats: 3,
  blocked: 12,
  events: [
    { time: '10:23:15', level: 'info', description: '系统正常扫描完成' },
    { time: '10:15:42', level: 'warning', description: '检测到异常登录尝试 (IP: 192.168.1.100)' },
    { time: '09:58:30', level: 'danger', description: '拦截SQL注入攻击 (已被自动阻断)' },
    { time: '09:45:12', level: 'warning', description: 'CPU使用率超过阈值 (85%)' }
  ]
})

// 拓扑图数据
const topologyWidth = ref(1200)
const topologyHeight = ref(500)

// 节点原始数据（不含坐标，坐标由布局计算）- 按学校不同
const topologyNodesRaw = computed(() => {
  const off = schoolOffset.value
  const clamp = (v) => Math.max(5, Math.min(99, v))
  return [
    { id: 'app1', name: '应用服务器-1', type: 'server', ip: '10.0.1.10', size: 30, status: 'normal', traffic: clamp(85 + off), metrics: { cpu: clamp(45 + off), memory: clamp(60 + off), networkIn: 12, networkOut: 8, uptime: '15天3小时' }},
    { id: 'app2', name: '应用服务器-2', type: 'server', ip: '10.0.1.11', size: 30, status: off > 5 ? 'warning' : 'normal', traffic: clamp(92 + off), metrics: { cpu: clamp(78 + off), memory: clamp(82 + off), networkIn: 18, networkOut: 15, uptime: '12天7小时' }},
    { id: 'db1', name: '主数据库', type: 'database', ip: '10.0.2.10', size: 35, status: 'normal', traffic: clamp(65 + off), metrics: { cpu: clamp(35 + off), memory: clamp(70 + off), networkIn: 25, networkOut: 20, uptime: '30天0小时' }},
    { id: 'db2', name: '从数据库', type: 'database', ip: '10.0.2.11', size: 30, status: 'normal', traffic: clamp(45 + off), metrics: { cpu: clamp(25 + off), memory: clamp(55 + off), networkIn: 15, networkOut: 12, uptime: '30天0小时' }},
    { id: 'gateway', name: 'API网关', type: 'gateway', ip: '10.0.0.1', size: 35, status: 'normal', traffic: clamp(100 + off), metrics: { cpu: clamp(55 + off), memory: clamp(45 + off), networkIn: 50, networkOut: 48, uptime: '20天12小时' }},
    { id: 'cache', name: 'Redis缓存', type: 'cache', ip: '10.0.3.10', size: 25, status: 'normal', traffic: clamp(75 + off), metrics: { cpu: clamp(15 + off), memory: clamp(85 + off), networkIn: 30, networkOut: 28, uptime: '25天6小时' }},
    { id: 'lb', name: '负载均衡', type: 'gateway', ip: '10.0.0.2', size: 30, status: 'normal', traffic: clamp(90 + off), metrics: { cpu: clamp(40 + off), memory: clamp(35 + off), networkIn: 45, networkOut: 42, uptime: '18天9小时' }}
  ]
})

// 布局计算函数
const calculateLayout = (layout) => {
  const width = topologyWidth.value
  const height = topologyHeight.value
  const centerX = width / 2
  const centerY = height / 2
  const nodesRaw = topologyNodesRaw.value

  if (layout === 'circular') {
    // 环形布局
    const radius = Math.min(width, height) * 0.35
    const angleStep = (2 * Math.PI) / nodesRaw.length
    return nodesRaw.map((node, i) => ({
      ...node,
      x: centerX + radius * Math.cos(i * angleStep - Math.PI / 2),
      y: centerY + radius * Math.sin(i * angleStep - Math.PI / 2)
    }))
  } else if (layout === 'hierarchical') {
    // 层级布局
    const levels = {
      gateway: 0,
      lb: 1,
      server: 2,
      database: 3,
      cache: 3
    }
    const levelGroups = {}
    nodesRaw.forEach(node => {
      const level = levels[node.type] || 2
      if (!levelGroups[level]) levelGroups[level] = []
      levelGroups[level].push(node)
    })

    const levelKeys = Object.keys(levelGroups).map(Number).sort((a, b) => a - b)
    const levelHeight = height / (levelKeys.length + 1)

    const result = []
    levelKeys.forEach((level, levelIdx) => {
      const nodes = levelGroups[level]
      const nodeWidth = width / (nodes.length + 1)
      nodes.forEach((node, nodeIdx) => {
        result.push({
          ...node,
          x: nodeWidth * (nodeIdx + 1),
          y: levelHeight * (levelIdx + 1)
        })
      })
    })
    return result
  } else {
    // 力导向布局（默认）
    return [
      { ...nodesRaw[0], x: 200, y: 150 },   // app1
      { ...nodesRaw[1], x: 200, y: 300 },   // app2
      { ...nodesRaw[2], x: 500, y: 150 },   // db1
      { ...nodesRaw[3], x: 500, y: 300 },   // db2
      { ...nodesRaw[4], x: 50, y: 225 },    // gateway
      { ...nodesRaw[5], x: 800, y: 225 },    // cache
      { ...nodesRaw[6], x: 350, y: 225 }     // lb
    ]
  }
}

const topologyNodes = ref(calculateLayout('force'))

const topologyLinks = ref([
  { id: 'l1', source: 'gateway', target: 'lb', status: 'normal', bandwidth: 100, active: true },
  { id: 'l2', source: 'lb', target: 'app1', status: 'normal', bandwidth: 80, active: true },
  { id: 'l3', source: 'lb', target: 'app2', status: 'warning', bandwidth: 85, active: true },
  { id: 'l4', source: 'app1', target: 'db1', status: 'normal', bandwidth: 60, active: true },
  { id: 'l5', source: 'app2', target: 'db1', status: 'normal', bandwidth: 55, active: true },
  { id: 'l6', source: 'db1', target: 'db2', status: 'normal', bandwidth: 40, active: true },
  { id: 'l7', source: 'app1', target: 'cache', status: 'normal', bandwidth: 70, active: true },
  { id: 'l8', source: 'app2', target: 'cache', status: 'normal', bandwidth: 65, active: true }
])

// 预测数据 - 按学校不同
const predictions = ref([])

// 根据学校偏移量生成预测数据
const generatePredictions = () => {
  const off = schoolOffset.value
  const r = (v) => +(v + off * 0.8).toFixed(1)
  return [
  {
    resource: 'cpu',
    name: 'CPU 扩容预测',
    icon: 'Cpu',
    current: r(45.2),
    predicted: r(78.5),
    timeToThreshold: `预计 ${(5.2 - off * 0.3).toFixed(1)} 天后`,
    recommendation: r(45.2) > 55 ? '扩容' : '正常',
    confidence: 87 - Math.abs(off),
    trendPath: 'M0,50 Q50,45 100,40 T200,15',
    threshold: 85,
    unit: '%',
    historyAccuracy: 92 - Math.abs(off),
    algorithm: 'LSTM时序预测 + ARIMA',
    trendData: [42, 45, 48, 43, 50, 46, 52, 48, 55, 51, 58, 54, 62, 59, 65, 61, 68, 64, 72, 76].map(v => v + off),
    suggestions: [
      { type: 'recommend', text: '建议在5天内增加2核CPU资源' },
      { type: 'recommend', text: '考虑开启自动弹性伸缩功能' },
      { type: 'warning', text: '体测高峰期即将到来，建议提前扩容' }
    ]
  },
  {
    resource: 'memory',
    name: '内存 扩容预测',
    icon: 'Memo',
    current: r(62.5),
    predicted: r(71.3),
    timeToThreshold: `预计 ${(12.8 - off * 0.5).toFixed(1)} 天后`,
    recommendation: r(62.5) > 70 ? '扩容' : '正常',
    confidence: 92 - Math.abs(off),
    trendPath: 'M0,35 Q50,33 100,30 T200,25',
    threshold: 80,
    unit: '%',
    historyAccuracy: 95 - Math.abs(off),
    algorithm: '线性回归 + 滑动窗口',
    trendData: [58, 60, 59, 61, 63, 62, 60, 64, 62, 65, 63, 61, 66, 64, 67, 65, 63, 66, 68, 70].map(v => v + off),
    suggestions: [
      { type: 'info', text: '当前内存使用处于正常范围' },
      { type: 'info', text: '建议持续监控，暂无需扩容' }
    ]
  },
  {
    resource: 'storage',
    name: '存储 扩容预测',
    icon: 'FolderOpened',
    current: r(68.3),
    predicted: r(82.1),
    timeToThreshold: `预计 ${(8.5 - off * 0.4).toFixed(1)} 天后`,
    recommendation: r(68.3) > 75 ? '扩容' : '正常',
    confidence: 85 - Math.abs(off),
    trendPath: 'M0,30 Q50,28 100,22 T200,18',
    threshold: 85,
    unit: '%',
    historyAccuracy: 88 - Math.abs(off),
    algorithm: '指数平滑 + 增长率分析',
    trendData: [62, 63, 64, 65, 64, 66, 65, 67, 66, 68, 67, 69, 68, 70, 69, 71, 70, 72, 71, 73].map(v => v + off),
    suggestions: [
      { type: 'recommend', text: '建议增加100GB存储容量' },
      { type: 'recommend', text: '考虑清理历史日志数据' },
      { type: 'warning', text: '数据增长速度加快，建议关注' }
    ]
  }
  ]
}

// 初始化预测数据
predictions.value = generatePredictions()

// 学校切换时重新生成预测数据
watch(schoolOffset, () => {
  predictions.value = generatePredictions()
})

// 预测详情弹窗
const showPredictionDetail = ref(false)
const selectedPrediction = ref(null)

// 打开预测详情
const openPredictionDetail = (pred) => {
  selectedPrediction.value = pred
  showPredictionDetail.value = true
}

// 执行扩容操作
const executeScale = (pred) => {
  ElMessage.info(`正在执行${pred.name}的扩容操作...`)
  setTimeout(() => {
    ElMessage.success(`${pred.name}扩容操作已提交，将在后台执行`)
    showPredictionDetail.value = false
  }, 1500)
}

// 刷新预测数据
const refreshPredictions = () => {
  ElMessage.info('正在重新计算预测...')
  const random = createSeededRandom(schoolId.value + '_refreshPredictions')
  setTimeout(() => {
    predictions.value = predictions.value.map(pred => ({
      ...pred,
      current: Math.min(90, Math.max(20, pred.current + (random() - 0.5) * 5)),
      predicted: Math.min(95, Math.max(40, pred.predicted + (random() - 0.5) * 5)),
      confidence: Math.min(99, Math.max(70, pred.confidence + (random() - 0.5) * 3))
    }))
    ElMessage.success('预测数据已更新')
  }, 1500)
}

// 预测趋势图表实例
const predictionTrendChart = ref(null)
let predictionChartInstance = null

// 初始化预测趋势图表
const initPredictionTrendChart = () => {
  if (!predictionTrendChart.value || !selectedPrediction.value) return
  if (predictionChartInstance) {
    predictionChartInstance.dispose()
    predictionChartInstance = null
  }
  
  predictionChartInstance = echarts.init(predictionTrendChart.value)
  const pred = selectedPrediction.value
  
  // 生成时间标签
  const labels = []
  for (let i = 0; i < pred.trendData.length; i++) {
    labels.push(`T-${pred.trendData.length - i}`)
  }
  labels.push('当前')
  labels.push('T+7')
  
  // 历史数据 + 当前值 + 预测值
  const data = [...pred.trendData, pred.current, pred.predicted]
  
  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params) => {
        const idx = params[0].dataIndex
        let label = labels[idx]
        if (idx === pred.trendData.length) label = '当前'
        if (idx === pred.trendData.length + 1) label = '7天后预测'
        return `${label}: ${params[0].value.toFixed(1)}%`
      }
    },
    grid: { left: '3%', right: '4%', bottom: '10%', top: '15%', containLabel: true },
    xAxis: {
      type: 'category',
      data: labels,
      axisLabel: { color: '#6B7280', fontSize: 11 }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { formatter: '{value}%', color: '#6B7280' },
      splitLine: { lineStyle: { color: '#F7F8FA' } }
    },
    series: [
      {
        name: '使用率',
        type: 'line',
        data: data.slice(0, -1),
        smooth: true,
        lineStyle: { color: '#1E5AA8', width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(30, 90, 168, 0.2)' },
            { offset: 1, color: 'rgba(30, 90, 168, 0.02)' }
          ])
        },
        itemStyle: { color: '#1E5AA8' }
      },
      {
        name: '预测值',
        type: 'line',
        data: [null, ...data.slice(-2)],
        smooth: true,
        lineStyle: { color: '#E85D4E', width: 2, type: 'dashed' },
        itemStyle: { color: '#E85D4E' }
      }
    ],
    markLine: {
      silent: true,
      symbol: 'none',
      lineStyle: { color: '#E85D4E', type: 'dashed', width: 1 },
      data: [{ yAxis: pred.threshold, label: { formatter: `阈值 ${pred.threshold}%`, color: '#E85D4E' } }]
    },
    markPoint: {
      data: [
        { name: '当前', value: pred.current.toFixed(1), xAxis: labels.length - 2, yAxis: pred.current, itemStyle: { color: '#1E5AA8' } },
        { name: '预测', value: pred.predicted.toFixed(1), xAxis: labels.length - 1, yAxis: pred.predicted, itemStyle: { color: '#E85D4E' } }
      ]
    }
  }
  
  predictionChartInstance.setOption(option)
}

// ========== 计算属性方法 ==========
const getStatusColor = (usage) => {
  if (usage >= 90) return '#E85D4E'
  if (usage >= 75) return '#F5A623'
  return '#1E5AA8'
}

const getStorageStatusColor = (usage) => {
  if (usage >= 85) return '#E85D4E'
  if (usage >= 70) return '#F5A623'
  return '#1E5AA8'
}

const getDiskColor = (usage) => {
  if (usage >= 85) return 'danger'
  if (usage >= 70) return 'warning'
  return 'normal'
}

const getNodeColor = (node) => {
  const colors = {
    server: '#4CAF50',
    database: '#2196F3',
    gateway: '#FF9800',
    cache: '#9C27B0'
  }
  return colors[node.type] || '#999'
}

const getNodeStroke = (node) => {
  if (node.status === 'error') return '#ff5252'
  if (node.status === 'warning') return '#ffab40'
  return '#fff'
}

const getNodeIcon = (type) => {
  const icons = {
    server: '<svg viewBox="0 0 24 24" fill="white"><path d="M20 2H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 6H4V4h16v4zM20 10H4c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2v-4c0-1.1-.9-2-2-2zm0 6H4v-4h16v4z"/></svg>',
    database: '<svg viewBox="0 0 24 24" fill="white"><path d="M12 2C6.48 2 2 4.24 2 7v10c0 2.76 4.48 5 10 5s10-2.24 10-5V7c0-2.76-4.48-5-10-5zm0 2c4.42 0 8 1.79 8 4s-3.58 4-8 4-8-1.79-8-4 3.58-4 8-4zm0 14c-4.42 0-8-1.79-8-4v-2.5c2.24 1.77 5.24 2.5 8 2.5s5.76-.73 8-2.5V14c0 2.21-3.58 4-8 4z"/></svg>',
    gateway: '<svg viewBox="0 0 24 24" fill="white"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>',
    cache: '<svg viewBox="0 0 24 24" fill="white"><path d="M12 2l-5.5 9h11z M12 22l5.5-9h-11z"/></svg>'
  }
  return icons[type] || icons.server
}

const getLinkPath = (link) => {
  const source = topologyNodes.value.find(n => n.id === link.source)
  const target = topologyNodes.value.find(n => n.id === link.target)
  if (!source || !target) return ''

  return `M${source.x},${source.y} Q${(source.x + target.x) / 2},${(source.y + target.y) / 2 - 50} ${target.x},${target.y}`
}

const getProgressColor = (percentage) => {
  if (percentage < 70) return '#1E5AA8'
  if (percentage < 90) return '#F5A623'
  return '#E85D4E'
}

// ========== 图表实例 ==========
const cpuChart = ref(null)
const memoryChart = ref(null)
const storageTrendChart = ref(null)
let cpuChartInstance = null
let memoryChartInstance = null
let storageTrendChartInstance = null
let refreshTimer = null

// ========== 方法 ==========
const generateHistoryData = (range, type) => {
  const random = createSeededRandom(schoolId.value + '_generateHistoryData_' + type)
  const now = new Date('2026-07-16T08:00:00')
  const times = []
  const values = []
  let points = 20
  let interval = 3600000

  switch(range) {
    case '1h': points = 12; interval = 300000; break
    case '6h': points = 24; interval = 900000; break
    case '24h': points = 24; interval = 3600000; break
  }

  for (let i = points - 1; i >= 0; i--) {
    const time = new Date(now - i * interval)
    times.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
    values.push(type === 'cpu' 
      ? 30 + random() * 40 
      : 40 + random() * 30)
  }

  return { times, values }
}

const initCpuChart = () => {
  if (!cpuChart.value) return
  if (cpuChartInstance) { cpuChartInstance.dispose(); cpuChartInstance = null }
  cpuChartInstance = echarts.init(cpuChart.value)

  const data = generateHistoryData(cpuTimeRange.value, 'cpu')

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: data.times,
      axisLine: { lineStyle: { color: '#ccc' } },
      axisLabel: { color: '#6B7280' }
    },
    yAxis: { 
      type: 'value', 
      min: 0, 
      max: 100, 
      axisLabel: { formatter: '{value}%', color: '#6B7280' },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    series: [{
      name: 'CPU使用率',
      type: 'line',
      data: data.values,
      smooth: true,
      lineStyle: { color: '#1E5AA8', width: 3 },
      areaStyle: { 
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(45, 125, 70, 0.3)' }, 
          { offset: 1, color: 'rgba(45, 125, 70, 0.05)' }
        ]) 
      },
      itemStyle: { color: '#1E5AA8' }
    }]
  }

  cpuChartInstance.setOption(option)
}

const initMemoryChart = () => {
  if (!memoryChart.value) return
  if (memoryChartInstance) { memoryChartInstance.dispose(); memoryChartInstance = null }
  memoryChartInstance = echarts.init(memoryChart.value)

  const data = generateHistoryData(memoryTimeRange.value, 'memory')

  const option = {
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
    xAxis: { 
      type: 'category', 
      data: data.times,
      axisLine: { lineStyle: { color: '#ccc' } },
      axisLabel: { color: '#6B7280' }
    },
    yAxis: { 
      type: 'value', 
      min: 0, 
      max: 100, 
      axisLabel: { formatter: '{value}%', color: '#6B7280' },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    series: [{
      name: '内存使用率',
      type: 'line',
      data: data.values,
      smooth: true,
      lineStyle: { color: '#3B82F6', width: 3 },
      areaStyle: { 
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59, 130, 246, 0.3)' }, 
          { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
        ]) 
      },
      itemStyle: { color: '#3B82F6' }
    }]
  }

  memoryChartInstance.setOption(option)
}

const initStorageTrendChart = () => {
  if (!storageTrendChart.value) return
  if (storageTrendChartInstance) { storageTrendChartInstance.dispose(); storageTrendChartInstance = null }
  storageTrendChartInstance = echarts.init(storageTrendChart.value)

  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
  const diskColors = ['#1E5AA8', '#F5A623', '#3B82F6']
  const random = createSeededRandom(schoolId.value + '_storageTrend')

  // 从 storageData.disks 的当前 usage 生成周趋势数据
  const series = storageData.disks.map((disk, idx) => {
    const baseUsage = disk.usage || 50
    const weekData = Array.from({ length: 7 }, (_, i) =>
      Math.round(baseUsage + Math.sin(i * 0.6 + idx) * 3 + (random() - 0.5) * 2)
    )
    return {
      name: disk.name,
      type: 'line',
      data: weekData,
      smooth: true,
      lineStyle: { color: diskColors[idx % diskColors.length], width: 2 },
      itemStyle: { color: diskColors[idx % diskColors.length] }
    }
  })

  const option = {
    tooltip: { trigger: 'axis' },
    legend: {
      data: storageData.disks.map(d => d.name),
      bottom: 0,
      textStyle: { color: '#6B7280' }
    },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
    xAxis: {
      type: 'category',
      data: days,
      axisLine: { lineStyle: { color: '#ccc' } },
      axisLabel: { color: '#6B7280' }
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      axisLabel: { formatter: '{value}%', color: '#6B7280' },
      splitLine: { lineStyle: { color: '#f0f0f0' } }
    },
    series
  }

  storageTrendChartInstance.setOption(option)
}

const updateMetrics = () => {
  const random = createSeededRandom(schoolId.value + '_updateMetrics')
  cpuData.usage = Math.min(100, Math.max(0, cpuData.usage + (random() - 0.5) * 10))
  cpuData.history.push({ time: '08:00:00', value: cpuData.usage })
  if (cpuData.history.length > 60) cpuData.history.shift()

  memoryData.usage = Math.min(100, Math.max(0, memoryData.usage + (random() - 0.5) * 5))
  memoryData.used = (memoryData.total * memoryData.usage / 100)

  if (cpuChartInstance) {
    const data = generateHistoryData(cpuTimeRange.value, 'cpu')
    cpuChartInstance.setOption({
      xAxis: { data: data.times },
      series: [{ data: data.values }]
    })
  }
  if (memoryChartInstance) {
    const data = generateHistoryData(memoryTimeRange.value, 'memory')
    memoryChartInstance.setOption({
      xAxis: { data: data.times },
      series: [{ data: data.values }]
    })
  }
}

const showNodeDetail = (node) => {
  selectedNode.value = node
  nodeDetailVisible.value = true
}

const refreshTopology = () => {
  const random = createSeededRandom(schoolId.value + '_refreshTopology')
  topologyNodes.value.forEach(node => {
    node.traffic = Math.floor(random() * 100)
  })
}

// ========== 生命周期 ==========
const handleResize = () => {
  cpuChartInstance?.resize()
  memoryChartInstance?.resize()
}

onMounted(() => {
  nextTick(() => {
    initCpuChart()
    initMemoryChart()
  })

  refreshTimer = setInterval(() => {
    updateMetrics()
    refreshTopology()
  }, 5000)

  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  if (refreshTimer) clearInterval(refreshTimer)
  window.removeEventListener('resize', handleResize)
  cpuChartInstance?.dispose()
  memoryChartInstance?.dispose()
  storageTrendChartInstance?.dispose()
  predictionChartInstance?.dispose()
})

watch(cpuTimeRange, () => {
  initCpuChart()
})

watch(memoryTimeRange, () => {
  initMemoryChart()
})

// 监听存储详情弹窗显示状态
watch(showStorageDetail, (newVal) => {
  if (newVal) {
    nextTick(() => {
      setTimeout(() => {
        initStorageTrendChart()
      }, 100)
    })
  }
})

// 监听预测详情弹窗显示状态
watch(showPredictionDetail, (newVal) => {
  if (newVal) {
    nextTick(() => {
      setTimeout(() => {
        initPredictionTrendChart()
      }, 100)
    })
  } else {
    if (predictionChartInstance) {
      predictionChartInstance.dispose()
      predictionChartInstance = null
    }
  }
})

// 监听拓扑布局变化，重新计算节点位置
watch(topologyLayout, (newLayout) => {
  topologyNodes.value = calculateLayout(newLayout)
})
</script>

<style scoped>
.monitor-center {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
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

.view-all {
  color: #1E5AA8;
  font-size: 13px;
}

.chart {
  height: 260px;
}

/* 存储列表 */
.storage-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.storage-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.storage-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.storage-name {
  font-size: 14px;
  font-weight: 500;
  color: #1A1A2E;
}

.storage-size {
  font-size: 12px;
  color: #6B7280;
}

.storage-bar-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.storage-bar {
  flex: 1;
  height: 8px;
  background: #F3F4F6;
  border-radius: 4px;
  overflow: hidden;
}

.storage-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.5s;
}

.storage-fill.normal { background: #1E5AA8; }
.storage-fill.warning { background: #F5A623; }
.storage-fill.danger { background: #E85D4E; }

.storage-percent {
  font-size: 12px;
  font-weight: 600;
  min-width: 36px;
  text-align: right;
}

/* 安全态势 */
.security-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.security-stats {
  display: flex;
  gap: 24px;
}

.sec-stat {
  text-align: center;
  flex: 1;
}

.sec-num {
  font-size: 28px;
  font-weight: 700;
  color: #1E5AA8;
}

.sec-label {
  font-size: 12px;
  color: #6B7280;
  margin-top: 4px;
}

.security-events {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.event-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  background: #F9FAFB;
  font-size: 12px;
}

.event-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.event-dot.info { background: #6B7280; }
.event-dot.warning { background: #F5A623; }
.event-dot.danger { background: #E85D4E; }

.event-time {
  color: #9CA3AF;
  font-size: 11px;
  white-space: nowrap;
  min-width: 60px;
}

.event-desc {
  color: #4B5563;
  flex: 1;
}

/* 拓扑图 */
.topology-container {
  position: relative;
  background: linear-gradient(135deg, #0a1929 0%, #132f4c 100%);
  border-radius: 8px;
  overflow: hidden;
  min-height: 400px;
}

.topology-svg {
  width: 100%;
  height: 400px;
}

.topology-link {
  fill: none;
  stroke: #4fc3f7;
  opacity: 0.25;
  stroke-width: 1;
  transition: all 0.3s;
}

.topology-link.active {
  opacity: 0.9;
  stroke: #00e676;
  stroke-width: 1.5;
  filter: drop-shadow(0 0 2px #00e676);
}

.topology-link.warning {
  stroke: #ffab40;
  opacity: 0.7;
}

.topology-node {
  cursor: pointer;
  transition: all 0.3s;
  transform-box: fill-box;
  transform-origin: center;
}

.topology-node:hover {
  transform: scale(1.15);
}

.node-icon {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-icon svg {
  width: 60%;
  height: 60%;
}

.node-label {
  fill: white;
  font-size: 12px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0,0,0,0.5);
}

.node-sublabel {
  fill: #90a4ae;
  font-size: 10px;
}

.topology-legend {
  position: absolute;
  bottom: 15px;
  left: 15px;
  display: flex;
  gap: 15px;
  background: rgba(0,0,0,0.5);
  padding: 10px 15px;
  border-radius: 6px;
  backdrop-filter: blur(4px);
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: white;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

/* 预测区域 */
.prediction-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.prediction-card {
  border-radius: 8px;
  padding: 20px;
  border: 1px solid #E8EAED;
  transition: all 0.3s;
}

.prediction-card.warning {
  border-color: #E85D4E;
  background: linear-gradient(135deg, #FEF2F2 0%, #ffffff 100%);
}

.prediction-card.normal {
  border-color: #1E5AA8;
  background: linear-gradient(135deg, #EEF6FF 0%, #ffffff 100%);
}

.pred-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 15px;
}

.pred-icon {
  font-size: 20px;
  color: #409EFF;
}

.pred-title {
  flex: 1;
  font-weight: 600;
  font-size: 14px;
}

.pred-chart-mini {
  height: 60px;
  margin-bottom: 15px;
}

.pred-chart-mini svg {
  width: 100%;
  height: 100%;
}

.pred-stats-row {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  margin-bottom: 15px;
}

.pred-stat {
  text-align: center;
}

.pred-label {
  font-size: 11px;
  color: #6B7280;
  margin-bottom: 4px;
}

.pred-value {
  font-size: 18px;
  font-weight: 700;
  color: #1A1A2E;
}

.pred-confidence {
  font-size: 12px;
  color: #6B7280;
}

/* 节点详情 */
.node-detail {
  padding: 10px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #E8EAED;
}

.detail-label {
  color: #6B7280;
  font-weight: 500;
}

/* 响应式 */
@media (max-width: 1200px) {
  .charts-row {
    grid-template-columns: 1fr;
  }
  .chart-card.full-width {
    grid-column: span 1;
  }
  .prediction-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .stats-row {
    flex-wrap: wrap;
    gap: 12px;
  }
  .stat-divider {
    display: none;
  }
}

/* 存储磁盘详情弹窗样式 */
.storage-detail-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid #E8EAED;
  padding: 20px 24px;
  margin-right: 0;
}

.storage-detail-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A2E;
}

.storage-detail-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.storage-detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.storage-overview {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  padding: 20px;
  background: #F7F8FA;
  border-radius: 12px;
}

.overview-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.overview-label {
  font-size: 12px;
  color: #6B7280;
  font-weight: 500;
}

.overview-value {
  font-size: 20px;
  font-weight: 700;
  color: #1A1A2E;
}

.storage-detail-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.storage-detail-item {
  padding: 20px;
  background: #FFFFFF;
  border: 1px solid #E8EAED;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.detail-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.detail-item-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.detail-item-name {
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

.detail-item-type {
  font-size: 12px;
  color: #9CA3AF;
  padding: 2px 8px;
  background: #F7F8FA;
  border-radius: 4px;
}

.detail-item-status {
  font-size: 12px;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 4px;
}

.detail-item-status.normal {
  color: #166534;
  background: #DCFCE7;
}

.detail-item-status.warning {
  color: #92400E;
  background: #FEF3C7;
}

.detail-item-status.danger {
  color: #991B1B;
  background: #FEE2E2;
}

.detail-item-bar {
  width: 100%;
  height: 8px;
  background: #E8EAED;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.detail-item-fill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.detail-item-fill.normal {
  background: linear-gradient(90deg, #1E5AA8, #3B82F6);
}

.detail-item-fill.warning {
  background: linear-gradient(90deg, #F5A623, #F59E0B);
}

.detail-item-fill.danger {
  background: linear-gradient(90deg, #E85D4E, #EF4444);
}

.detail-item-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-item-used {
  font-size: 13px;
  color: #6B7280;
}

.detail-item-total {
  font-size: 13px;
  color: #6B7280;
}

.detail-item-percent {
  font-size: 14px;
  font-weight: 600;
}

.storage-detail-chart {
  padding: 20px;
  background: #F7F8FA;
  border-radius: 12px;
}

.chart-title {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  margin-bottom: 16px;
}

.trend-chart {
  width: 100%;
  height: 200px;
}

@media (max-width: 768px) {
  .storage-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .detail-item-stats {
    flex-direction: column;
    gap: 8px;
    align-items: flex-start;
  }
}

/* 预测卡片新增样式 */
.cursor-pointer {
  cursor: pointer;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.refresh-btn {
  color: #1E5AA8;
  font-size: 13px;
}

.confidence-info {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.accuracy-info {
  font-size: 11px;
  color: #9CA3AF;
}

.pred-actions {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #E8EAED;
}

.detail-link {
  color: #1E5AA8;
  font-size: 12px;
}

/* 预测详情弹窗样式 */
.prediction-detail-dialog :deep(.el-dialog__header) {
  border-bottom: 1px solid #E8EAED;
  padding: 20px 24px;
}

.prediction-detail-dialog :deep(.el-dialog__title) {
  font-size: 18px;
  font-weight: 600;
  color: #1A1A2E;
}

.prediction-detail-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

.prediction-detail {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.detail-summary {
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 8px;
}

.detail-summary.warning {
  background: linear-gradient(135deg, #FEF2F2 0%, #FFFFFF 100%);
  border: 1px solid #FECACA;
}

.detail-summary.normal {
  background: linear-gradient(135deg, #EEF6FF 0%, #FFFFFF 100%);
  border: 1px solid #BFDBFE;
}

.summary-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.summary-icon {
  color: #1E5AA8;
}

.summary-info h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
  color: #1A1A2E;
}

.summary-info p {
  margin: 0;
  font-size: 13px;
  color: #6B7280;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
}

.summary-stat {
  text-align: center;
  padding: 12px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 8px;
}

.summary-stat .stat-label {
  display: block;
  font-size: 12px;
  color: #6B7280;
  margin-bottom: 4px;
}

.summary-stat .stat-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #1A1A2E;
}

.detail-section {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid #E8EAED;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0 0 16px 0;
  padding-bottom: 12px;
  border-bottom: 1px solid #E8EAED;
}

.prediction-chart {
  height: 250px;
}

.algorithm-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 14px;
  background: #F7F8FA;
  border-radius: 8px;
}

.info-label {
  font-size: 13px;
  color: #6B7280;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: #1A1A2E;
}

.confidence-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.suggestions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.suggestion-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 8px;
  font-size: 13px;
}

.suggestion-item svg {
  width: 18px;
  height: 18px;
}

.suggestion-item.recommend {
  background: #DCFCE7;
  color: #166534;
}

.suggestion-item.warning {
  background: #FEF3C7;
  color: #92400E;
}

.suggestion-item.info {
  background: #DBEAFE;
  color: #1E40AF;
}

@media (max-width: 768px) {
  .summary-stats {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .info-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>