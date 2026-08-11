<template>
  <div class="management-efficiency">
 

    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num stat-danger">{{ stats.totalRequests }}</span>
        <span class="stat-label">待审批事项</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :class="getValueColorClass(stats.approvalRate, 90, 70)">{{ stats.approvalRate }}%</span>
        <span class="stat-label">按时审批率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :class="stats.avgResponseTime <= 24 ? 'stat-good' : stats.avgResponseTime <= 48 ? 'stat-warn' : 'stat-danger'">{{ stats.avgResponseTime }}小时</span>
        <span class="stat-label">平均响应时间</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :class="getValueColorClass(stats.maintenanceRate, 90, 70)">{{ stats.maintenanceRate }}%</span>
        <span class="stat-label">报修响应率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :class="getValueColorClass(stats.fieldUsage, 70, 50)">{{ stats.fieldUsage }}%</span>
        <span class="stat-label">场地使用率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :class="getValueColorClass(stats.equipmentRate, 95, 80)">{{ stats.equipmentRate }}%</span>
        <span class="stat-label">器材完好率</span>
      </div>
    </div>

    <div class="content-grid">
      <div class="card-large kpi-chart">
        <div class="card-header">
          <h3>管理效能KPI趋势</h3>
          <div class="legend">
            <span><span class="legend-color" style="background: #1E5AA8"></span> 按时审批率</span>
            <span><span class="legend-color" style="background: #3B82F6"></span> 报修响应率</span>
            <span><span class="legend-color" style="background: #F5A623"></span> 场地使用率</span>
          </div>
        </div>
        <div ref="kpiChart" class="chart"></div>
      </div>

      <div class="card-small status-chart">
        <div class="card-header">
          <h3>审批状态分布</h3>
        </div>
        <div ref="statusChart" class="chart"></div>
      </div>

      <div class="card-medium repair-card">
        <div class="card-header">
          <h3>报修工单处理</h3>
        </div>
        <ExamTable
          :data="repairOrders"
          :columns="repairColumns"
          :show-pagination="true"
          :default-page-size="8"
          :page-sizes="[8, 12, 16]"
        >
          <template #status="{ row }">
            <span :class="['status-tag', row.status.toLowerCase()]">{{ row.status }}</span>
          </template>
          <template #action="{ row }">
            <el-button type="text" @click="viewOrder(row)">详情</el-button>
          </template>
        </ExamTable>
      </div>

      <div class="card-medium approval-card">
        <div class="card-header">
          <h3>待办审批事项</h3>
        </div>
        <ExamTable
          :data="pendingRequests"
          :columns="requestColumns"
          :show-pagination="true"
          :default-page-size="8"
          :page-sizes="[8, 12, 16]"
        >
          <template #urgency="{ row }">
            <span :class="['urgency-tag', row.urgency.toLowerCase()]">{{ row.urgency }}</span>
          </template>
          <template #action="{ row }">
            <el-button type="primary" size="small" @click="approveRequest(row)">审批</el-button>
          </template>
        </ExamTable>
      </div>

      <div class="card-medium network-card">
        <div class="card-header">
          <h3>部门协作网络图谱</h3>
        </div>
        <div ref="networkChart" class="chart network-chart"></div>
      </div>

      <div class="card-medium equipment-card">
        <div class="card-header">
          <h3>器材使用统计</h3>
        </div>
        <div ref="equipmentChart" class="chart"></div>
      </div>

      <div class="card-small field-card">
        <div class="card-header">
          <h3>场地使用排行</h3>
        </div>
        <div class="field-ranking">
          <div v-for="(field, index) in fieldRanking" :key="field.name" class="field-item">
            <span class="field-rank">{{ index + 1 }}</span>
            <div class="field-info">
              <span class="field-name">{{ field.name }}</span>
              <div class="field-bar">
                <div class="field-fill" :style="{ width: field.usage + '%' }"></div>
              </div>
            </div>
            <span class="field-usage">{{ field.usage }}%</span>
          </div>
        </div>
      </div>
    </div>

    <el-dialog v-model="orderDialogVisible" title="报修工单详情" width="500px">
      <div v-if="selectedOrder" class="order-detail">
        <div class="detail-row">
          <span class="detail-label">工单编号</span>
          <span class="detail-value">{{ selectedOrder.id }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">报修类型</span>
          <span class="detail-value">{{ selectedOrder.type }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">位置</span>
          <span class="detail-value">{{ selectedOrder.location }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">状态</span>
          <span :class="['status-tag', selectedOrder.status.toLowerCase()]">{{ selectedOrder.status }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">提交时间</span>
          <span class="detail-value">{{ selectedOrder.time }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">问题描述</span>
          <span class="detail-value">{{ selectedOrder.description }}</span>
        </div>
      </div>
      <template #footer>
        <el-button @click="orderDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleOrder">处理工单</el-button>
      </template>
    </el-dialog>

    <!-- 审批弹窗 -->
    <el-dialog v-model="approvalDialogVisible" title="审批事项" width="500px">
      <div v-if="selectedRequest" class="approval-detail">
        <div class="detail-row">
          <span class="detail-label">事项名称</span>
          <span class="detail-value">{{ selectedRequest.title }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">申请人</span>
          <span class="detail-value">{{ selectedRequest.applicant }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">类型</span>
          <span class="detail-value">{{ selectedRequest.type }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">紧急程度</span>
          <span :class="['urgency-tag', selectedRequest.urgency.toLowerCase()]">{{ selectedRequest.urgency }}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">申请时间</span>
          <span class="detail-value">{{ selectedRequest.time }}</span>
        </div>
        <div class="detail-row full-width">
          <span class="detail-label">审批意见</span>
          <el-input type="textarea" placeholder="请输入审批意见" :rows="3" class="w-full" />
        </div>
      </div>
      <template #footer>
        <el-button @click="confirmApproval('transfer')">转审</el-button>
        <el-button @click="confirmApproval('reject')">拒绝</el-button>
        <el-button type="primary" @click="confirmApproval('approve')">批准</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import echarts from '@/utils/echarts'
import ExamTable from '@/components/table/ExamTable.vue'
import { usePersistedRef } from '@/composables/usePersistedRef'
import { getValueColorClass } from '@/utils/format'
import store from '@/store/global'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const statsDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  return isZirong
    ? { totalRequests: 16, approvalRate: 91, avgResponseTime: 3.2, maintenanceRate: 93, fieldUsage: 76, equipmentRate: 90 }
    : isLinhai
    ? { totalRequests: 20, approvalRate: 96, avgResponseTime: 2.1, maintenanceRate: 97, fieldUsage: 88, equipmentRate: 96 }
    : { totalRequests: 24, approvalRate: 94, avgResponseTime: 2.5, maintenanceRate: 96, fieldUsage: 82, equipmentRate: 95 }
})
const stats = usePersistedRef(computed(() => `smart_pe_management_stats_${schoolId.value}`), statsDefault.value)

const fieldRankingDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  return isZirong
    ? [
        { name: '排球场', usage: 92 },
        { name: '足球场', usage: 88 },
        { name: '田径场', usage: 80 },
        { name: '跳绳区', usage: 75 },
        { name: '篮球场', usage: 70 }
      ]
    : isLinhai
    ? [
        { name: '游泳馆', usage: 96 },
        { name: '体操房', usage: 90 },
        { name: '武术训练室', usage: 85 },
        { name: '田径场', usage: 82 },
        { name: '篮球场', usage: 74 }
      ]
    : [
        { name: '篮球场', usage: 95 },
        { name: '田径场', usage: 88 },
        { name: '足球场', usage: 82 },
        { name: '体育馆', usage: 78 },
        { name: '羽毛球场', usage: 72 }
      ]
})
const fieldRanking = usePersistedRef(computed(() => `smart_pe_management_field_ranking_${schoolId.value}`), fieldRankingDefault.value)

const repairOrdersDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  return isZirong
    ? [
        { id: 'WO-2026-001', type: '器材损坏', location: '排球场2号', status: '待处理', time: '2026-01-15 09:30', description: '排球网破损需更换' },
        { id: 'WO-2026-002', type: '场地维护', location: '足球训练区', status: '处理中', time: '2026-01-15 10:15', description: '草坪部分区域需修补' },
        { id: 'WO-2026-003', type: '设备故障', location: '跳绳训练区', status: '已完成', time: '2026-01-14 14:20', description: '计数器设备故障' },
        { id: 'WO-2026-004', type: '器材损坏', location: '篮球场', status: '待处理', time: '2026-01-15 11:00', description: '篮球架篮网损坏' }
      ]
    : isLinhai
    ? [
        { id: 'WO-2026-001', type: '设备故障', location: '游泳馆', status: '处理中', time: '2026-01-15 08:30', description: '泳池循环过滤系统需检修' },
        { id: 'WO-2026-002', type: '器材损坏', location: '体操房', status: '待处理', time: '2026-01-15 10:00', description: '平衡木表面防滑层磨损' },
        { id: 'WO-2026-003', type: '场地维护', location: '武术训练室', status: '已完成', time: '2026-01-14 15:20', description: '训练垫更换完成' },
        { id: 'WO-2026-004', type: '设备故障', location: '游泳馆', status: '待处理', time: '2026-01-15 11:30', description: '计时系统信号不稳定' }
      ]
    : [
        { id: 'WO-2026-001', type: '器材损坏', location: '篮球场3号', status: '待处理', time: '2026-01-15 09:30', description: '篮球架篮网损坏' },
        { id: 'WO-2026-002', type: '场地维护', location: '田径场跑道', status: '处理中', time: '2026-01-15 10:15', description: '跑道部分区域需要修补' },
        { id: 'WO-2026-003', type: '设备故障', location: '体育馆', status: '已完成', time: '2026-01-14 14:20', description: '音响设备故障' },
        { id: 'WO-2026-004', type: '器材损坏', location: '羽毛球场', status: '待处理', time: '2026-01-15 11:00', description: '羽毛球网破损' }
      ]
})
const repairOrders = usePersistedRef(computed(() => `smart_pe_management_repair_orders_${schoolId.value}`), repairOrdersDefault.value)

const pendingRequestsDefault = computed(() => {
  const isZirong = schoolId.value === 'hailin-zirong-primary'
  const isLinhai = schoolId.value === 'linhai-experimental-primary'
  return isZirong
    ? [
        { title: '关于申请购买新排球的请示', applicant: '马老师', type: '采购申请', urgency: '一般' },
        { title: '足球训练器材更新方案审批', applicant: '李老师', type: '采购申请', urgency: '紧急' },
        { title: '跳绳训练区场地使用申请', applicant: '张老师', type: '场地预约', urgency: '紧急' },
        { title: '体育教师培训计划审批', applicant: '赵老师', type: '培训申请', urgency: '一般' }
      ]
    : isLinhai
    ? [
        { title: '关于购买游泳馆耗材的请示', applicant: '杨老师', type: '采购申请', urgency: '紧急' },
        { title: '体操房器材更新方案审批', applicant: '朱老师', type: '采购申请', urgency: '一般' },
        { title: '武术训练室场地预约申请', applicant: '林老师', type: '场地预约', urgency: '紧急' },
        { title: '体育教师培训计划审批', applicant: '徐老师', type: '培训申请', urgency: '一般' }
      ]
    : [
        { title: '关于申请购买新篮球的请示', applicant: '王老师', type: '采购申请', urgency: '一般' },
        { title: '体育器材室改造方案审批', applicant: '李主任', type: '基建申请', urgency: '紧急' },
        { title: '学生运动会场地使用申请', applicant: '张老师', type: '场地预约', urgency: '紧急' },
        { title: '体育教师培训计划审批', applicant: '刘老师', type: '培训申请', urgency: '一般' }
      ]
})
const pendingRequests = usePersistedRef(computed(() => `smart_pe_management_pending_requests_${schoolId.value}`), pendingRequestsDefault.value)

const repairColumns = ref([
  { prop: 'id', label: '工单编号', minWidth: '100' },
  { prop: 'type', label: '报修类型', minWidth: '90' },
  { prop: 'location', label: '位置', minWidth: '100' },
  { slot: 'status', label: '状态', minWidth: '80' },
  { prop: 'time', label: '提交时间', minWidth: '120' },
  { slot: 'action', label: '操作', minWidth: '70' }
])

const requestColumns = ref([
  { prop: 'title', label: '事项名称', minWidth: '160' },
  { prop: 'applicant', label: '申请人', minWidth: '80' },
  { prop: 'type', label: '类型', minWidth: '80' },
  { slot: 'urgency', label: '紧急程度', minWidth: '80' },
  { slot: 'action', label: '操作', minWidth: '70' }
])

const orderDialogVisible = ref(false)
const selectedOrder = ref(null)

const kpiChart = ref(null)
const statusChart = ref(null)
const equipmentChart = ref(null)
const networkChart = ref(null)

let kpiChartInstance = null
let statusChartInstance = null
let equipmentChartInstance = null
let networkChartInstance = null

const viewOrder = (order) => {
  selectedOrder.value = order
  orderDialogVisible.value = true
}

const handleOrder = () => {
  if (selectedOrder.value) {
    const order = repairOrders.value.find(o => o.id === selectedOrder.value.id)
    if (order) {
      if (order.status === '待处理') {
        order.status = '处理中'
      } else {
        order.status = '已完成'
      }
    }
  }
  orderDialogVisible.value = false
  ElMessage.success('工单已处理')
}

const approvalDialogVisible = ref(false)
const selectedRequest = ref(null)

const approveRequest = (request) => {
  selectedRequest.value = request
  approvalDialogVisible.value = true
}

const confirmApproval = (result) => {
  const resultText = result === 'approve' ? '已批准' : result === 'reject' ? '已拒绝' : '已转审'
  if (selectedRequest.value && result === 'approve') {
    const idx = pendingRequests.value.findIndex(r => r.title === selectedRequest.value.title)
    if (idx !== -1) pendingRequests.value.splice(idx, 1)
  } else if (selectedRequest.value && result === 'reject') {
    const idx = pendingRequests.value.findIndex(r => r.title === selectedRequest.value.title)
    if (idx !== -1) pendingRequests.value.splice(idx, 1)
  }
  ElMessage.success(`${selectedRequest.value.title} ${resultText}`)
  approvalDialogVisible.value = false
}

const initKpiChart = () => {
  if (!kpiChart.value) return
  if (kpiChartInstance) kpiChartInstance.dispose()
  kpiChartInstance = echarts.init(kpiChart.value)
  kpiChartInstance.showLoading()

  // 从 stats 获取各指标基准率生成月度趋势
  const baseApproval = stats.value.approvalRate || 94
  const baseMaintenance = stats.value.maintenanceRate || 96
  const baseFieldUsage = stats.value.fieldUsage || 82

  const approvalData = Array.from({ length: 12 }, (_, i) => Math.round(baseApproval + Math.sin(i * 0.5) * 3 - Math.abs(i - 6) * 0.2))
  const responseData = Array.from({ length: 12 }, (_, i) => Math.round(baseMaintenance - 2 + Math.sin(i * 0.4) * 2 + i * 0.15))
  const fieldData = Array.from({ length: 12 }, (_, i) => Math.round(baseFieldUsage + Math.sin((i - 2) * Math.PI / 6) * 8))

  const option = {
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    tooltip: { trigger: 'axis' },
    legend: { data: ['按时审批率', '报修响应率', '场地使用率'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'] },
    yAxis: { type: 'value', min: 60, max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      {
        name: '按时审批率',
        type: 'line',
        data: approvalData,
        smooth: true,
        lineStyle: { color: '#1E5AA8', width: 3 },
        itemStyle: { color: '#1E5AA8' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(30, 90, 168, 0.2)' }, { offset: 1, color: 'rgba(30, 90, 168, 0.02)' }]) }
      },
      {
        name: '报修响应率',
        type: 'line',
        data: responseData,
        smooth: true,
        lineStyle: { color: '#3B82F6', width: 3 },
        itemStyle: { color: '#3B82F6' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(59, 130, 246, 0.2)' }, { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }]) }
      },
      {
        name: '场地使用率',
        type: 'line',
        data: fieldData,
        smooth: true,
        lineStyle: { color: '#F5A623', width: 3 },
        itemStyle: { color: '#F5A623' },
        areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: 'rgba(245, 166, 35, 0.2)' }, { offset: 1, color: 'rgba(245, 166, 35, 0.02)' }]) }
      }
    ]
  }

  kpiChartInstance.setOption(option)
  kpiChartInstance.hideLoading()
}

const initNetworkChart = () => {
  if (!networkChart.value) return
  
  const container = networkChart.value
  if (!container || container.offsetHeight === 0) {
    setTimeout(initNetworkChart, 100)
    return
  }
  
  networkChartInstance = echarts.init(container)
  networkChartInstance.showLoading()
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: (params) => {
        if (params.dataType === 'node') {
          return `<div style="font-weight:600;margin-bottom:4px">${params.name}</div><div style="color:#6B7280">协作次数: ${params.data.collaborations}</div>`
        } else {
          return `<div style="font-weight:600;margin-bottom:4px">${params.data.source} → ${params.data.target}</div><div style="color:#6B7280">协作次数: ${params.data.value}</div>`
        }
      }
    },
    series: [
      {
        type: 'graph',
        layout: 'force',
        data: [
          { name: '体育教研部', symbolSize: 60, itemStyle: { color: '#1E5AA8' }, collaborations: 156 },
          { name: '教务处', symbolSize: 45, itemStyle: { color: '#3B82F6' }, collaborations: 89 },
          { name: '年级组', symbolSize: 50, itemStyle: { color: '#F5A623' }, collaborations: 124 },
          { name: '后勤保障', symbolSize: 40, itemStyle: { color: '#8B5CF6' }, collaborations: 67 },
          { name: '学生处', symbolSize: 35, itemStyle: { color: '#06B6D4' }, collaborations: 45 },
          { name: '校领导', symbolSize: 55, itemStyle: { color: '#E85D4E' }, collaborations: 98 },
          { name: '班主任', symbolSize: 38, itemStyle: { color: '#10B981' }, collaborations: 76 },
          { name: '器材室', symbolSize: 32, itemStyle: { color: '#F97316' }, collaborations: 52 }
        ],
        links: [
          { source: '体育教研部', target: '教务处', value: 45 },
          { source: '体育教研部', target: '年级组', value: 38 },
          { source: '体育教研部', target: '后勤保障', value: 32 },
          { source: '体育教研部', target: '学生处', value: 25 },
          { source: '体育教研部', target: '班主任', value: 30 },
          { source: '教务处', target: '年级组', value: 28 },
          { source: '教务处', target: '校领导', value: 22 },
          { source: '年级组', target: '班主任', value: 42 },
          { source: '后勤保障', target: '器材室', value: 35 },
          { source: '年级组', target: '校领导', value: 18 },
          { source: '学生处', target: '班主任', value: 20 }
        ],
        roam: true,
        draggable: true,
        label: { 
          show: true, 
          fontSize: 12, 
          color: '#1A1A2E',
          position: 'bottom'
        },
        lineStyle: {
          color: '#E8EAED',
          width: 2,
          curveness: 0.2
        },
        emphasis: {
          lineStyle: {
            color: '#1E5AA8',
            width: 4
          },
          focus: 'adjacency'
        },
        force: {
          repulsion: 400,
          gravity: 0.15,
          edgeLength: [80, 200],
          layoutAnimation: true
        }
      }
    ]
  }
  
  networkChartInstance.setOption(option)
  networkChartInstance.hideLoading()
}

const initStatusChart = () => {
  if (!statusChart.value) return
  if (statusChartInstance) statusChartInstance.dispose()
  statusChartInstance = echarts.init(statusChart.value)
  statusChartInstance.showLoading()

  // 从 repairOrders 和 pendingRequests 动态统计各状态数量
  const allItems = [...(repairOrders.value || []), ...(pendingRequests.value || [])]
  const statusMap = { '待处理': 0, '处理中': 0, '已完成': 0, '待审批': 0, '紧急': 0, '一般': 0 }
  allItems.forEach(item => {
    const key = item.status || item.urgency || '其他'
    if (statusMap[key] !== undefined) statusMap[key]++
    else statusMap[key] = 1
  })

  // 映射到图表分类
  const pending = (repairOrders.value || []).filter(o => o.status === '待处理').length + (pendingRequests.value || []).length
  const processing = (repairOrders.value || []).filter(o => o.status === '处理中').length
  const completed = (repairOrders.value || []).filter(o => o.status === '已完成').length
  const rejected = Math.max(0, stats.value.totalRequests - pending - processing - completed)

  const option = {
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    tooltip: { trigger: 'item', formatter: '{b}: {c}项 ({d}%)' },
    series: [{
      type: 'pie',
      radius: '60%',
      center: ['50%', '50%'],
      data: [
        { value: pending || 24, name: '待审批', itemStyle: { color: '#F5A623' } },
        { value: processing || 18, name: '审批中', itemStyle: { color: '#3B82F6' } },
        { value: completed || 156, name: '已完成', itemStyle: { color: '#1E5AA8' } },
        { value: rejected || 8, name: '已驳回', itemStyle: { color: '#E8EAED' } }
      ],
      label: { fontSize: 11 },
      animationType: 'expansion',
      animationDurationUpdate: 500
    }]
  }

  statusChartInstance.setOption(option)
  statusChartInstance.hideLoading()
}

const initEquipmentChart = () => {
  if (!equipmentChart.value) return
  if (equipmentChartInstance) equipmentChartInstance.dispose()
  equipmentChartInstance = echarts.init(equipmentChart.value)
  equipmentChartInstance.showLoading()

  // 从 stats 获取基准率生成各器材类别数据
  const baseEquipRate = stats.value.equipmentRate || 95
  const baseMaintRate = stats.value.maintenanceRate || 96
  const categories = ['球类', '田径', '体操', '武术', '其他']
  const intactData = categories.map((_, i) => Math.round(baseEquipRate + Math.sin(i * 1.2) * 4))
  const usageData = categories.map((_, i) => Math.round(baseMaintRate - 10 + Math.sin(i * 0.8) * 8))

  const option = {
    animation: true,
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
    legend: { data: ['完好率', '使用率'], bottom: 0 },
    grid: { left: '3%', right: '4%', bottom: '15%', top: '5%', containLabel: true },
    xAxis: { type: 'category', data: categories },
    yAxis: { type: 'value', min: 0, max: 100, axisLabel: { formatter: '{value}%' } },
    series: [
      {
        name: '完好率',
        type: 'bar',
        data: intactData,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        color: '#1E5AA8',
        animationDelay: (idx) => idx * 100
      },
      {
        name: '使用率',
        type: 'bar',
        data: usageData,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        color: '#3B82F6',
        animationDelay: (idx) => idx * 100 + 50
      }
    ]
  }

  equipmentChartInstance.setOption(option)
  equipmentChartInstance.hideLoading()
}

watch([stats, repairOrders, pendingRequests], () => {
  nextTick(() => {
    initKpiChart()
    initStatusChart()
    initEquipmentChart()
  })
}, { deep: true })

onMounted(() => {
  setTimeout(() => {
    initKpiChart()
    initStatusChart()
    initEquipmentChart()
    initNetworkChart()
  }, 300)
  
  const handleResize = () => {
    kpiChartInstance?.resize()
    statusChartInstance?.resize()
    equipmentChartInstance?.resize()
    networkChartInstance?.resize()
  }
  window.addEventListener('resize', handleResize)

  onBeforeUnmount(() => {
    window.removeEventListener('resize', handleResize)
  })
})
</script>

<style scoped>
.management-efficiency {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}



@media (max-width: 1200px) {
  .stats-row {
    gap: 12px;
    padding: 16px 20px;
  }
  .stat-divider {
    height: 32px;
  }
}

@media (max-width: 768px) {
  .stat-divider {
    display: none;
  }
}

.content-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(300px, 1fr));
  grid-template-areas:
    "kpi kpi"
    "repair approval"
    "network equipment"
    "status field";
  gap: 16px;
  width: 100%;
}

.card-large.kpi-chart {
  grid-area: kpi;
}

.card-small.status-chart {
  grid-area: status;
}

.card-medium.repair-card {
  grid-area: repair;
}

.card-medium.approval-card {
  grid-area: approval;
}

.card-medium.network-card {
  grid-area: network;
}

.card-medium.equipment-card {
  grid-area: equipment;
}

.card-small.field-card {
  grid-area: field;
}

@media (max-width: 1200px) {
  .content-grid {
    grid-template-columns: 1fr;
    grid-template-areas:
      "kpi"
      "repair"
      "approval"
      "network"
      "equipment"
      "status"
      "field";
    gap: 12px;
  }
}

@media (max-width: 600px) {
  .content-grid {
    gap: 10px;
  }
}

.card-large,
.card-medium,
.card-small {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
}

@media (max-width: 1200px) {
  .card-large,
  .card-medium,
  .card-small {
    padding: 16px;
  }
}

@media (max-width: 768px) {
  .card-large,
  .card-medium,
  .card-small {
    padding: 12px;
  }
}

.card-medium {
  overflow-x: auto;
}

.card-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1A1A2E;
}

@media (max-width: 768px) {
  .card-header h3 {
    font-size: 14px;
  }
  .legend {
    gap: 10px;
    font-size: 11px;
  }
}

.legend {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: #6B7280;
}

.legend-color {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 4px;
  margin-right: 4px;
}

.chart {
  height: clamp(180px, 20vw, 220px);
  min-height: 150px;
}

.network-chart {
  height: clamp(250px, 25vw, 350px);
  min-height: 200px;
}

@media (max-width: 768px) {
  .chart {
    height: clamp(150px, 25vw, 180px);
  }
  .network-chart {
    height: clamp(200px, 30vw, 280px);
  }
}

.field-ranking {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.field-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.field-rank {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #F3F4F6;
  border-radius: 50%;
  font-size: 11px;
  font-weight: 600;
  color: #6B7280;
}

.field-info {
  flex: 1;
}

.field-name {
  display: block;
  font-size: 13px;
  color: #1A1A2E;
  margin-bottom: 4px;
}

.field-bar {
  height: 6px;
  background: #F3F4F6;
  border-radius: 3px;
  overflow: hidden;
}

.field-fill {
  height: 100%;
  background: #1E5AA8;
  border-radius: 3px;
  transition: width 0.3s;
}

.field-usage {
  font-size: 13px;
  font-weight: 600;
  color: #1E5AA8;
}

.order-table,
.request-table {
  width: 100%;
  font-size: 13px;

}

.card-medium :deep(table) {
  min-width: 500px;
}

@media (max-width: 768px) {
  .order-table,
  .request-table {
    font-size: 12px;
    min-width: 400px;
  }
}

.status-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.status-tag.待处理 {
  background: #FEF3C7;
  color: #92400E;
}

.status-tag.处理中 {
  background: #DBEAFE;
  color: #1E40AF;
}

.status-tag.已完成 {
  background: #DCFCE7;
  color: #166534;
}

.urgency-tag {
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
}

.urgency-tag.一般 {
  background: #F3F4F6;
  color: #4B5563;
}

.urgency-tag.紧急 {
  background: #FEE2E2;
  color: #991B1B;
}

.order-detail {
  padding: 16px;
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
  font-size: 14px;
  color: #6B7280;
}

.detail-value {
  font-size: 14px;
  color: #1A1A2E;
  font-weight: 500;
}
</style>