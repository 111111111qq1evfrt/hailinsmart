<template>
  <div class="maintenance-analysis">
    <div class="page-header">
      <div class="header-filters">
        <el-select v-model="filterTimeRange" placeholder="时间范围" style="width: 140px">
          <el-option label="本周" value="week" />
          <el-option label="本月" value="month" />
          <el-option label="上月" value="lastMonth" />
          <el-option label="本季度" value="quarter" />
          <el-option label="全部" value="all" />
        </el-select>
        <el-select v-model="filterType" placeholder="设备类型" clearable style="width: 140px">
          <el-option label="球类器材" value="balls" />
          <el-option label="田径器材" value="athletics" />
          <el-option label="场地设施" value="field" />
          <el-option label="其他" value="other" />
        </el-select>
        <el-select v-model="filterPriority" placeholder="优先级" clearable style="width: 120px">
          <el-option label="紧急" value="high" />
          <el-option label="一般" value="normal" />
          <el-option label="低" value="low" />
        </el-select>
        <el-select v-model="filterStatus" placeholder="报修状态" clearable style="width: 120px">
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="待验收" value="awaiting_acceptance" />
          <el-option label="已完成" value="completed" />
        </el-select>
        <el-select v-model="filterLocation" placeholder="区域位置" clearable style="width: 140px">
          <el-option label="田径场" value="田径场" />
          <el-option label="体育馆" value="体育馆" />
          <el-option label="室外运动区" value="室外" />
          <el-option label="球类场地" value="球类" />
          <el-option label="器材室" value="器材室" />
        </el-select>
      </div>
    </div>

    <div class="stats-row">
      <div class="stat-item">
        <span class="stat-num" :style="{ color: '#1E5AA8' }">{{ stats.totalRepaired }}</span>
        <span class="stat-label">本月报修总数</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: stats.responseTime <= 30 ? '#1E5AA8' : '#E85D4E' }">{{ stats.responseTime }}</span>
        <span class="stat-label">平均响应时长(分钟)</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: stats.completionRate >= 95 ? '#1E5AA8' : '#F5A623' }">{{ stats.completionRate }}%</span>
        <span class="stat-label">完工率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: '#F5A623' }">{{ stats.damageRate }}%</span>
        <span class="stat-label">设施损坏率</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: '#1E5AA8' }">{{ stats.totalCost }}</span>
        <span class="stat-label">耗材费用(元)</span>
      </div>
      <div class="stat-divider"></div>
      <div class="stat-item">
        <span class="stat-num" :style="{ color: '#E85D4E' }">{{ stats.alerts }}</span>
        <span class="stat-label">预测性维护预警</span>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><TrendCharts /></el-icon> 近6个月报修趋势</span>
        </div>
        <div ref="trendChart" class="chart"></div>
      </div>

      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">🚨 紧急程度分布</span>
        </div>
        <div ref="urgencyChart" class="chart"></div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Timer /></el-icon> 响应时长分布</span>
        </div>
        <div ref="responseChart" class="chart"></div>
      </div>

      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Tools /></el-icon> 故障类型分布</span>
        </div>
        <div ref="typeChart" class="chart"></div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">🔥 高频故障设备TOP5</span>
        </div>
        <div class="top5-list">
          <div v-for="(item, idx) in top5Equipment" :key="item.name" class="top5-item">
            <span class="rank" :class="idx < 3 ? 'top' : ''">{{ idx + 1 }}</span>
            <div class="top5-info">
              <span class="top5-name">{{ item.name }}</span>
              <span class="top5-location">{{ item.location }}</span>
            </div>
            <div class="top5-bar-wrap">
              <div class="top5-bar">
                <div class="top5-fill" :style="{ width: (item.count / (top5Equipment[0]?.count || 1)) * 100 + '%' }"></div>
              </div>
            </div>
            <span class="top5-count">{{ item.count }}次</span>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="card-header">
          <span class="card-title">💰 月度耗材费用趋势</span>
        </div>
        <div ref="costTrendChart" class="chart"></div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><MapLocation /></el-icon> 区域故障热力图</span>
        </div>
        <div class="heatmap-matrix">
          <div class="matrix-header-row">
            <span class="matrix-area-label">区域</span>
            <span v-for="m in heatmapMonths" :key="m" class="matrix-day-label">{{ m }}</span>
          </div>
          <div v-for="row in heatmapMatrix" :key="row.areaName" class="matrix-row">
            <span class="matrix-area-name">{{ row.areaName }}</span>
            <div
              v-for="(cell, idx) in row.cells"
              :key="idx"
              class="matrix-cell"
              :class="getHeatClass(cell)"
              :title="row.areaName + ' ' + heatmapMonths[idx] + ': ' + cell + '次故障'"
            >
              <span v-if="cell > 0" class="cell-num">{{ cell }}</span>
            </div>
          </div>
          <div class="heatmap-legend">
            <span>少</span>
            <div class="legend-item level-0"></div>
            <div class="legend-item level-1"></div>
            <div class="legend-item level-2"></div>
            <div class="legend-item level-3"></div>
            <div class="legend-item level-4"></div>
            <span>多</span>
          </div>
        </div>
      </div>

      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Box /></el-icon> 耗材消耗TOP10</span>
        </div>
        <div class="consumable-list">
          <div v-for="(item, idx) in consumablesTop10" :key="item.name" class="consumable-item">
            <span class="rank" :class="idx < 3 ? 'top' : ''">{{ idx + 1 }}</span>
            <div class="consumable-info">
              <span class="consumable-name">{{ item.name }}</span>
              <span class="consumable-count">{{ item.count }}件</span>
            </div>
            <div class="consumable-bar">
              <div class="consumable-fill" :style="{ width: (item.count / (consumablesTop10[0]?.count || 1)) * 100 + '%' }"></div>
            </div>
            <span class="consumable-cost">¥{{ item.cost }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="charts-row">
      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><OfficeBuilding /></el-icon> 班级设施损坏率排名</span>
        </div>
        <el-table :data="classDamageRanking" stripe class="w-full" :height="280">
          <el-table-column type="index" label="排名" width="60" />
          <el-table-column prop="className" label="班级" width="140" />
          <el-table-column prop="damageCount" label="损坏次数" width="100" />
          <el-table-column prop="damageRate" label="损坏率" width="100">
            <template #default="{ row }">
              <span :style="{ color: row.damageRate >= 10 ? '#E85D4E' : row.damageRate >= 5 ? '#F5A623' : '#1E5AA8' }">{{ row.damageRate }}%</span>
            </template>
          </el-table-column>
          <el-table-column prop="mainType" label="主要损坏类型" />
          <el-table-column prop="trend" label="趋势" width="80">
            <template #default="{ row }">
              <span :style="{ color: row.trend > 0 ? '#E85D4E' : '#3B82F6' }">{{ row.trend > 0 ? '↑' + row.trend + '%' : '↓' + Math.abs(row.trend) + '%' }}</span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <div class="chart-card">
        <div class="card-header">
          <span class="card-title"><el-icon :size="18" color="#1E5AA8"><User /></el-icon> 维修工绩效</span>
        </div>
        <el-table :data="workerPerformance" stripe class="w-full" :height="280">
          <el-table-column prop="name" label="维修工" width="120" />
          <el-table-column prop="completed" label="完成工单" width="100" />
          <el-table-column prop="avgTime" label="平均时长(分)" width="120" />
          <el-table-column prop="satisfaction" label="满意度" width="100">
            <template #default="{ row }">
              <el-progress :percentage="row.satisfaction" :stroke-width="8" :color="row.satisfaction >= 90 ? '#1E5AA8' : '#F5A623'" />
            </template>
          </el-table-column>
          <el-table-column prop="rating" label="评级" width="80">
            <template #default="{ row }">
              <el-tag :type="getRatingType(row.rating)" size="small">{{ row.rating }}</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <div class="prediction-card">
      <div class="card-header">
        <span class="card-title"><el-icon :size="18" color="#1E5AA8"><Warning /></el-icon> 预测性维护预警</span>
      </div>
      <div class="prediction-list">
        <div v-for="item in predictionAlerts" :key="item.id" class="prediction-item">
          <div class="prediction-icon" :class="item.level === 'high' ? 'high' : 'medium'">
            <WarnTriangleFilled v-if="item.level === 'high'" />
            <WarningFilled v-else />
          </div>
          <div class="prediction-info">
            <span class="prediction-name">{{ item.equipmentName }}</span>
            <span class="prediction-desc">{{ item.reason }}</span>
          </div>
          <div class="prediction-meta">
            <span class="prediction-location">{{ item.location }}</span>
            <span class="prediction-level" :class="item.level">{{ item.level === 'high' ? '高风险' : '中风险' }}</span>
          </div>
          <el-button type="primary" size="small" @click="createTask(item)">生成巡检任务</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { WarningFilled, WarnTriangleFilled, Timer, Tools, MapLocation, Box, TrendCharts, User, Warning, OfficeBuilding } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import store from '@/store/global'
import { usePersistedRef } from '@/composables/usePersistedRef'
import { mockDB } from '@/mock'

const schoolId = computed(() => store.state.school.id || 'hailin-second-primary')

const filterTimeRange = ref('month')
const filterType = ref('')
const filterPriority = ref('')
const filterStatus = ref('')
const filterLocation = ref('')

const responseChart = ref(null)
const typeChart = ref(null)
const trendChart = ref(null)
const urgencyChart = ref(null)
const costTrendChart = ref(null)
let responseChartInstance = null
let typeChartInstance = null
let trendChartInstance = null
let urgencyChartInstance = null
let costTrendChartInstance = null

const getRatingType = (rating) => ({ A: 'success', B: 'primary', C: 'warning', D: 'danger' }[rating] || 'info')

// Seeded random — deterministic data per school
const seededRng = (seed) => {
  let s = seed
  return () => {
    s = (s * 16807) % 2147483647
    return (s - 1) / 2147483646
  }
}

// Generate repair records spanning Feb-Jul 2026
const generateDefaultRepairs = () => {
  const sid = schoolId.value
  const seedMap = { 'hailin-second-primary': 9001, 'hailin-zirong-primary': 9002, 'linhai-experimental-primary': 9003 }
  const rng = seededRng(seedMap[sid] || 9001)
  const totalMap = { 'hailin-second-primary': 85, 'hailin-zirong-primary': 55, 'linhai-experimental-primary': 120 }
  const total = totalMap[sid] || 85

  const equipmentConfig = {
    'hailin-second-primary': [
      { name: '篮球架A区1号', location: '球类场地', type: 'balls' },
      { name: '篮球架B区2号', location: '球类场地', type: 'balls' },
      { name: '足球门1号', location: '田径场', type: 'balls' },
      { name: '足球门2号', location: '田径场', type: 'balls' },
      { name: '跑步机01号', location: '体育馆', type: 'athletics' },
      { name: '跑步机02号', location: '体育馆', type: 'athletics' },
      { name: '跑步机03号', location: '体育馆', type: 'athletics' },
      { name: '仰卧起坐计数器(DEV006)', location: '体育馆', type: 'athletics' },
      { name: '50米跑计时器1号(DEV001)', location: '田径场', type: 'athletics' },
      { name: '立定跳远测试仪2号(DEV004)', location: '体育馆', type: 'athletics' },
      { name: '引体向上测试仪(DEV005)', location: '室外', type: 'athletics' },
      { name: '跳绳计数器(DEV008)', location: '体育馆', type: 'athletics' },
      { name: '铅球投掷架', location: '田径场', type: 'athletics' },
      { name: '单杠2号', location: '室外', type: 'athletics' },
      { name: '跑道照明灯A', location: '田径场', type: 'field' },
      { name: '看台座椅A排', location: '田径场', type: 'field' },
      { name: '广播系统主机', location: '器材室', type: 'other' },
      { name: '器材室储物架', location: '器材室', type: 'other' }
    ],
    'hailin-zirong-primary': [
      { name: '排球网A区', location: '球类场地', type: 'balls' },
      { name: '足球门1号', location: '田径场', type: 'balls' },
      { name: '篮球5号球', location: '球类场地', type: 'balls' },
      { name: '羽毛球拍套装', location: '球类场地', type: 'balls' },
      { name: '乒乓球发球机', location: '体育馆', type: 'balls' },
      { name: '引体向上测试仪(ZR-DEV005)', location: '室外', type: 'athletics' },
      { name: '50米跑计时器(ZR-DEV001)', location: '田径场', type: 'athletics' },
      { name: '立定跳远测试仪(ZR-DEV003)', location: '体育馆', type: 'athletics' },
      { name: '仰卧起坐计数器(ZR-DEV004)', location: '体育馆', type: 'athletics' },
      { name: '跳绳计数器(ZR-DEV006)', location: '室外', type: 'athletics' },
      { name: '跑道照明灯', location: '田径场', type: 'field' },
      { name: '看台座椅', location: '田径场', type: 'field' },
      { name: '广播系统', location: '器材室', type: 'other' }
    ],
    'linhai-experimental-primary': [
      { name: '体育馆空调', location: '体育馆', type: 'field' },
      { name: '跑道照明灯', location: '田径场', type: 'field' },
      { name: '看台座椅', location: '田径场', type: 'field' },
      { name: '广播系统', location: '田径场', type: 'field' },
      { name: '泳池过滤系统', location: '体育馆', type: 'field' },
      { name: '引体向上测试仪(LH-DEV007)', location: '室外', type: 'athletics' },
      { name: '50米跑计时器1号(LH-DEV001)', location: '田径场', type: 'athletics' },
      { name: '肺活量测试仪(LH-DEV009)', location: '体育馆', type: 'athletics' },
      { name: '立定跳远测试仪(LH-DEV003)', location: '体育馆', type: 'athletics' },
      { name: '坐位体前屈测试仪(LH-DEV004)', location: '体育馆', type: 'athletics' },
      { name: '排球网', location: '球类场地', type: 'balls' },
      { name: '足球门', location: '球类场地', type: 'balls' },
      { name: '篮球架', location: '球类场地', type: 'balls' },
      { name: '羽毛球网', location: '球类场地', type: 'balls' },
      { name: '器材室门锁', location: '器材室', type: 'other' },
      { name: '更衣柜', location: '体育馆', type: 'other' }
    ]
  }

  const locations = {
    'hailin-second-primary': ['田径场A区', '田径场B区', '体育馆1号馆', '体育馆2号馆', '体育馆3号馆', '室外单杠区', '球类场地', '器材室'],
    'hailin-zirong-primary': ['操场东侧', '操场西侧', '体育馆', '球类场地', '器材室'],
    'linhai-experimental-primary': ['田径场', '综合馆', '室外运动区', '球类场地', '器材室']
  }

  const monthWeights = [0.08, 0.10, 0.15, 0.18, 0.22, 0.27]
  const priorityRoll = () => { const r = rng(); return r < 0.20 ? 'high' : r < 0.75 ? 'normal' : 'low' }
  const statusRoll = () => { const r = rng(); return r < 0.40 ? 'completed' : r < 0.65 ? 'processing' : r < 0.85 ? 'pending' : 'awaiting_acceptance' }
  const reporters = ['张老师', '李老师', '王老师', '赵老师', '陈老师']
  const handlers = ['王师傅', '李师傅', '张师傅', '赵师傅', '刘师傅']
  const consumableList = ['传感器电池', '数据线', '螺丝配件', '橡胶垫片', '显示屏保护膜', '连接线', '电源适配器', '固定支架', '润滑油', '绝缘胶带']

  const equipment = equipmentConfig[sid] || equipmentConfig['hailin-second-primary']
  const locList = locations[sid] || locations['hailin-second-primary']
  const records = []

  for (let i = 0; i < total; i++) {
    const monthRoll = rng()
    let monthIdx = 0, cum = 0
    for (let m = 0; m < monthWeights.length; m++) {
      cum += monthWeights[m]
      if (monthRoll < cum) { monthIdx = m; break }
    }
    const month = monthIdx + 2
    const day = Math.floor(rng() * 28) + 1
    const hour = Math.floor(rng() * 10) + 7
    const minute = Math.floor(rng() * 60)

    const eq = equipment[Math.floor(rng() * equipment.length)]
    const priority = priorityRoll()
    const status = statusRoll()
    const reporter = reporters[Math.floor(rng() * reporters.length)]

    const record = {
      id: `WX-${sid.substring(0, 2).toUpperCase()}-${String(i + 1).padStart(3, '0')}`,
      equipmentName: eq.name,
      location: locList[Math.floor(rng() * locList.length)],
      type: eq.type,
      priority,
      description: `${eq.name}故障报修`,
      status,
      reporter,
      submitTime: `2026-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')} ${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`,
      responseTime: Math.floor(rng() * 55) + 5
    }

    if (status === 'completed' || status === 'awaiting_acceptance') {
      const handler = handlers[Math.floor(rng() * handlers.length)]
      const completeDays = Math.floor(rng() * 3)
      const completeHour = Math.floor(rng() * 8) + 8
      record.handler = handler
      record.completeTime = `2026-${String(month).padStart(2, '0')}-${String(Math.min(day + completeDays, 28)).padStart(2, '0')} ${String(completeHour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`
    }

    record.cost = priority === 'high' ? Math.floor(rng() * 300) + 200 : priority === 'normal' ? Math.floor(rng() * 200) + 50 : Math.floor(rng() * 100) + 20
    record.consumables = [{ name: consumableList[Math.floor(rng() * consumableList.length)], count: Math.floor(rng() * 5) + 1 }]

    records.push(record)
  }

  return records
}

const repairs = usePersistedRef(
  computed(() => `repairs_${schoolId.value}`),
  generateDefaultRepairs()
)

// Migration: regenerate if old data has too few records
watch(schoolId, () => {
  if (!repairs.value || repairs.value.length < 15) {
    repairs.value = generateDefaultRepairs()
  }
}, { immediate: true })

const filteredRepairs = computed(() => {
  return repairs.value.filter(repair => {
    let matchTime = true
    if (filterTimeRange.value === 'month') {
      const repairMonth = parseInt(repair.submitTime.split(' ')[0].split('-')[1])
      matchTime = repairMonth === 7
    } else if (filterTimeRange.value === 'week') {
      const repairDate = repair.submitTime.split(' ')[0]
      matchTime = repairDate >= '2026-07-13' && repairDate <= '2026-07-17'
    } else if (filterTimeRange.value === 'lastMonth') {
      const repairMonth = parseInt(repair.submitTime.split(' ')[0].split('-')[1])
      matchTime = repairMonth === 6
    } else if (filterTimeRange.value === 'quarter') {
      const repairMonth = parseInt(repair.submitTime.split(' ')[0].split('-')[1])
      matchTime = repairMonth >= 5 && repairMonth <= 7
    }

    const matchType = !filterType.value || repair.type === filterType.value
    const matchPriority = !filterPriority.value || repair.priority === filterPriority.value
    const matchStatus = !filterStatus.value || repair.status === filterStatus.value
    const matchLocation = !filterLocation.value || repair.location.includes(filterLocation.value)

    return matchTime && matchType && matchPriority && matchStatus && matchLocation
  })
})

const stats = computed(() => {
  const list = filteredRepairs.value || []
  const total = list.length
  const completed = list.filter(r => r.status === 'completed').length
  const completedRepairs = list.filter(r => r.status === 'completed' && r.responseTime)
  const avgResponseTime = completedRepairs.length > 0
    ? Math.round(completedRepairs.reduce((sum, r) => sum + r.responseTime, 0) / completedRepairs.length)
    : 0
  const highPriority = list.filter(r => r.priority === 'high').length
  const damageRate = total > 0 ? +((highPriority / total) * 100).toFixed(1) : 0
  const totalCost = list.reduce((sum, r) => sum + (r.cost || 0), 0)
  const alerts = list.filter(r => r.priority === 'high' && r.status !== 'completed').length
  const completionRate = total > 0 ? +((completed / total) * 100).toFixed(1) : 0

  return { totalRepaired: total, responseTime: avgResponseTime, completionRate, damageRate, totalCost, alerts }
})

const consumablesTop10 = computed(() => {
  const list = filteredRepairs.value || []
  const consumableMap = {}
  list.forEach(r => {
    if (r.consumables) {
      r.consumables.forEach(c => {
        if (!consumableMap[c.name]) consumableMap[c.name] = { count: 0, cost: 0 }
        consumableMap[c.name].count += c.count
        consumableMap[c.name].cost += c.count * 50
      })
    }
  })
  return Object.entries(consumableMap)
    .map(([name, data]) => ({ name, count: data.count, cost: data.cost }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)
})

const workerPerformance = computed(() => {
  const list = filteredRepairs.value || []
  const workerConfig = {
    'hailin-second-primary': ['王师傅', '李师傅', '张师傅', '赵师傅', '刘师傅'],
    'hailin-zirong-primary': ['孙师傅', '周师傅'],
    'linhai-experimental-primary': ['吴师傅', '郑师傅', '陈师傅', '黄师傅']
  }
  const workers = workerConfig[schoolId.value] || workerConfig['hailin-second-primary']
  return workers.map(name => {
    const completed = list.filter(r => r.handler === name && r.status === 'completed')
    const count = completed.length
    const avgTime = count > 0
      ? Math.round(completed.reduce((sum, r) => sum + (r.responseTime || 30), 0) / count)
      : 0
    const satisfaction = avgTime > 0 ? Math.min(99, Math.max(70, 100 - Math.round(avgTime / 2))) : 85
    const rating = satisfaction >= 93 ? 'A' : satisfaction >= 85 ? 'B' : satisfaction >= 75 ? 'C' : 'D'
    return { name, completed: count, avgTime, satisfaction, rating }
  }).sort((a, b) => b.completed - a.completed)
})

const predictionAlerts = computed(() => {
  const allRepairs = repairs.value || []
  const frequentEquipment = {}
  allRepairs.forEach(r => {
    if (!frequentEquipment[r.equipmentName]) {
      frequentEquipment[r.equipmentName] = { count: 0, location: r.location }
    }
    frequentEquipment[r.equipmentName].count++
  })
  return Object.entries(frequentEquipment)
    .filter(([, data]) => data.count >= 2)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5)
    .map(([name, data], idx) => ({
      id: `P${String(idx + 1).padStart(3, '0')}`,
      equipmentName: name,
      location: data.location,
      reason: data.count >= 3 ? '连续故障多次，建议全面检修' : '报修频繁，建议预防性维护',
      level: data.count >= 3 ? 'high' : 'medium'
    }))
})

const top5Equipment = computed(() => {
  const list = filteredRepairs.value || []
  const equipmentCounts = {}
  list.forEach(r => {
    equipmentCounts[r.equipmentName] = (equipmentCounts[r.equipmentName] || 0) + 1
  })
  return Object.entries(equipmentCounts)
    .map(([name, count]) => ({
      name,
      location: list.find(r => r.equipmentName === name)?.location || '',
      count
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
})

const classDamageRanking = computed(() => {
  const classLists = {
    'hailin-second-primary': ['三年级(1)班', '四年级(2)班', '五年级(1)班', '二年级(3)班', '一年级(2)班', '三年级(2)班', '四年级(1)班'],
    'hailin-zirong-primary': ['三年级(2)班', '四年级(1)班', '三年级(1)班', '四年级(2)班', '二年级(1)班'],
    'linhai-experimental-primary': ['二年级(1)班', '三年级(3)班', '四年级(1)班', '一年级(1)班', '五年级(3)班', '三年级(1)班', '六年级(2)班', '二年级(2)班']
  }
  const list = filteredRepairs.value || []
  const total = list.length
  const locationCounts = {}
  list.forEach(r => { locationCounts[r.location] = (locationCounts[r.location] || 0) + 1 })

  const classes = classLists[schoolId.value] || classLists['hailin-second-primary']
  const damageTypes = ['传感器碰撞', '显示屏磕碰', '连接线拉扯', '器材跌落', '误操作']
  const rng = seededRng({ 'hailin-second-primary': 11001, 'hailin-zirong-primary': 11002, 'linhai-experimental-primary': 11003 }[schoolId.value] || 11001)

  const damageEntries = Object.entries(locationCounts)
    .map(([loc, count], i) => ({
      className: classes[i] || `区域${i + 1}`,
      damageCount: count,
      damageRate: total > 0 ? +((count / total) * 100).toFixed(1) : 0,
      mainType: damageTypes[i % damageTypes.length],
      trend: +((i % 2 === 0 ? -1 : 1) * (rng() * 5).toFixed(1))
    }))
    .sort((a, b) => b.damageCount - a.damageCount)

  const result = damageEntries.slice(0, 7)
  while (result.length < 7 && result.length < classes.length) {
    const idx = result.length
    result.push({
      className: classes[idx] || `区域${idx + 1}`,
      damageCount: 0, damageRate: 0,
      mainType: damageTypes[idx % damageTypes.length], trend: 0
    })
  }

  return result.map(item => ({
    ...item,
    trend: item.damageCount > 0 ? +((rng() * 6 - 3).toFixed(1)) : 0
  }))
})

const urgencyDistribution = computed(() => {
  const list = filteredRepairs.value || []
  const counts = { high: 0, normal: 0, low: 0 }
  list.forEach(r => { counts[r.priority] = (counts[r.priority] || 0) + 1 })
  return [
    { name: '紧急', value: counts.high, color: '#E85D4E' },
    { name: '一般', value: counts.normal, color: '#F5A623' },
    { name: '低', value: counts.low, color: '#3B82F6' }
  ]
})

const costTrend = computed(() => {
  const allRepairs = repairs.value || []
  const months = ['2月', '3月', '4月', '5月', '6月', '7月']
  return months.map((month, idx) => {
    const monthNum = idx + 2
    const monthRepairs = allRepairs.filter(r => parseInt(r.submitTime.split('-')[1]) === monthNum)
    const cost = monthRepairs.reduce((sum, r) => sum + (r.cost || 0), 0)
    return { month, cost }
  })
})

// Heatmap: areas × months (Feb-Jul)
const heatmapMonths = ['2月', '3月', '4月', '5月', '6月', '7月']

const heatmapMatrix = computed(() => {
  const allRepairs = repairs.value || []
  const areaConfig = {
    'hailin-second-primary': ['田径场A区', '田径场B区', '体育馆1号馆', '体育馆2号馆', '体育馆3号馆', '室外单杠区', '球类场地', '器材室'],
    'hailin-zirong-primary': ['操场东侧', '操场西侧', '体育馆', '球类场地', '器材室'],
    'linhai-experimental-primary': ['田径场', '综合馆', '室外运动区', '球类场地', '器材室']
  }
  const areas = areaConfig[schoolId.value] || areaConfig['hailin-second-primary']

  return areas.map(areaName => {
    const cells = heatmapMonths.map((_, monthIdx) => {
      const monthNum = monthIdx + 2
      return allRepairs.filter(r => {
        const m = parseInt(r.submitTime.split('-')[1])
        return m === monthNum && (r.location.includes(areaName.substring(0, 2)) || areaName.includes(r.location.substring(0, 2)))
      }).length
    })
    return { areaName, cells }
  })
})

const getHeatClass = (value) => {
  if (value === 0) return 'level-0'
  if (value <= 2) return 'level-1'
  if (value <= 4) return 'level-2'
  if (value <= 6) return 'level-3'
  return 'level-4'
}

// Derived chart data
const responseDistribution = computed(() => {
  const list = (filteredRepairs.value || []).filter(r => r.status === 'completed' && r.responseTime)
  const buckets = [0, 0, 0, 0, 0]
  list.forEach(r => {
    const t = r.responseTime
    if (t <= 15) buckets[0]++
    else if (t <= 30) buckets[1]++
    else if (t <= 45) buckets[2]++
    else if (t <= 60) buckets[3]++
    else buckets[4]++
  })
  return buckets
})

const faultTypeDistribution = computed(() => {
  const list = filteredRepairs.value || []
  const typeNames = { balls: '球类损坏', athletics: '田径器材故障', field: '场地设施损耗', other: '其他故障' }
  const subTypes = {
    balls: ['球体破损', '网架松动', '充气阀漏气'],
    athletics: ['传感器异常', '显示屏故障', '计时误差'],
    field: ['地面磨损', '灯具损坏', '座椅松动'],
    other: ['电源问题', '连接线损坏', '软件异常']
  }
  const counts = {}
  list.forEach(r => {
    const id = parseInt(r.id.split('-').pop()) || 0
    const subs = subTypes[r.type] || ['其他']
    const sub = subs[id % subs.length]
    const key = `${typeNames[r.type] || '其他'}-${sub}`
    counts[key] = (counts[key] || 0) + 1
  })
  const colors = ['#E85D4E', '#F5A623', '#3B82F6', '#1E5AA8', '#9CA3AF', '#10B981', '#8B5CF6']
  return Object.entries(counts)
    .map(([name, value], i) => ({ name, value, color: colors[i % colors.length] }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6)
})

const trendChartData = computed(() => {
  const allRepairs = repairs.value || []
  const months = ['2月', '3月', '4月', '5月', '6月', '7月']
  const repairCounts = months.map((_, idx) => {
    const monthNum = idx + 2
    return allRepairs.filter(r => parseInt(r.submitTime.split('-')[1]) === monthNum).length
  })
  const avgTimes = months.map((_, idx) => {
    const monthNum = idx + 2
    const monthRepairs = allRepairs.filter(r => parseInt(r.submitTime.split('-')[1]) === monthNum && r.responseTime)
    return monthRepairs.length > 0 ? Math.round(monthRepairs.reduce((s, r) => s + r.responseTime, 0) / monthRepairs.length) : 0
  })
  return { months, repairCounts, avgTimes }
})

const initCharts = () => {
  if (responseChart.value) {
    responseChartInstance = echarts.init(responseChart.value)
    responseChartInstance.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: ['0-15分', '15-30分', '30-45分', '45-60分', '>60分'] },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        data: responseDistribution.value,
        itemStyle: { borderRadius: [4, 4, 0, 0] },
        color: ['#1E5AA8', '#3B82F6', '#F5A623', '#E85D4E', '#9CA3AF']
      }]
    })
  }

  if (typeChart.value) {
    typeChartInstance = echarts.init(typeChart.value)
    const faultData = faultTypeDistribution.value
    typeChartInstance.setOption({
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', right: '5%', top: 'center' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        data: faultData.map(d => ({ value: d.value, name: d.name, itemStyle: { color: d.color } }))
      }]
    })
  }

  if (trendChart.value) {
    trendChartInstance = echarts.init(trendChart.value)
    const td = trendChartData.value
    trendChartInstance.setOption({
      tooltip: { trigger: 'axis' },
      legend: { data: ['报修数量', '平均处理时长'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: td.months },
      yAxis: [
        { type: 'value', name: '报修数', position: 'left' },
        { type: 'value', name: '分钟', position: 'right' }
      ],
      series: [
        { name: '报修数量', type: 'bar', data: td.repairCounts, barWidth: '40%', itemStyle: { color: '#1E5AA8', borderRadius: [4, 4, 0, 0] } },
        { name: '平均处理时长', type: 'line', yAxisIndex: 1, data: td.avgTimes, smooth: true, lineStyle: { color: '#E85D4E', width: 2.5 }, itemStyle: { color: '#E85D4E' } }
      ]
    })
  }

  if (urgencyChart.value) {
    urgencyChartInstance = echarts.init(urgencyChart.value)
    const urgData = urgencyDistribution.value
    urgencyChartInstance.setOption({
      tooltip: { trigger: 'item' },
      legend: { orient: 'vertical', right: '5%', top: 'center' },
      series: [{
        type: 'pie',
        radius: ['45%', '70%'],
        center: ['40%', '50%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
        label: { show: true, formatter: '{b}: {d}%' },
        data: urgData.map(d => ({ value: d.value, name: d.name, itemStyle: { color: d.color } }))
      }]
    })
  }

  if (costTrendChart.value) {
    costTrendChartInstance = echarts.init(costTrendChart.value)
    const ctData = costTrend.value
    costTrendChartInstance.setOption({
      tooltip: { trigger: 'axis', formatter: '{b}<br/>{a}: ¥{c}' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: ctData.map(c => c.month) },
      yAxis: { type: 'value', name: '元', axisLabel: { formatter: '¥{value}' } },
      series: [{
        name: '耗材费用',
        type: 'line',
        data: ctData.map(c => c.cost),
        smooth: true,
        areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(30,90,168,0.3)' }, { offset: 1, color: 'rgba(30,90,168,0.02)' }] } },
        lineStyle: { color: '#1E5AA8', width: 2.5 },
        itemStyle: { color: '#1E5AA8' }
      }]
    })
  }
}

const createTask = (item) => {
  ElMessage.success(`已为 ${item.equipmentName} 生成巡检任务`)
}

const handleResize = () => {
  responseChartInstance && responseChartInstance.resize()
  typeChartInstance && typeChartInstance.resize()
  trendChartInstance && trendChartInstance.resize()
  urgencyChartInstance && urgencyChartInstance.resize()
  costTrendChartInstance && costTrendChartInstance.resize()
}

onMounted(() => {
  initCharts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  responseChartInstance && responseChartInstance.dispose()
  typeChartInstance && typeChartInstance.dispose()
  trendChartInstance && trendChartInstance.dispose()
  urgencyChartInstance && urgencyChartInstance.dispose()
  costTrendChartInstance && costTrendChartInstance.dispose()
})

watch([filterTimeRange, filterType, filterPriority, filterStatus, filterLocation], () => {
  initCharts()
})

watch(schoolId, () => {
  nextTick(() => initCharts())
})
</script>

<style scoped>
.maintenance-analysis {
  min-height: calc(100vh - 140px);
  background: #F5F7FA;
  padding: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.page-title {
  font-size: 20px;
  font-weight: 600;
  color: #1A1A2E;
  margin: 0;
}

.header-filters {
  display: flex;
  gap: 12px;
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

.stat-divider {
  width: 1px;
  height: 48px;
  background: #E8EAED;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
}

.stat-label {
  font-size: 12px;
  color: #6B7280;
}

.charts-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 20px;
}

.chart-card {
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

.chart {
  height: 280px;
}

.heatmap-matrix {
  padding: 12px;
  overflow-x: auto;
}

.matrix-header-row {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 4px;
  padding-bottom: 8px;
  border-bottom: 1px solid #E8EAED;
}

.matrix-area-label {
  width: 80px;
  min-width: 80px;
  font-size: 12px;
  color: #6B7280;
  font-weight: 600;
}

.matrix-day-label {
  width: 40px;
  min-width: 40px;
  text-align: center;
  font-size: 11px;
  color: #6B7280;
}

.matrix-row {
  display: flex;
  align-items: center;
  gap: 0;
  margin-bottom: 2px;
}

.matrix-area-name {
  width: 80px;
  min-width: 80px;
  font-size: 12px;
  color: #1A1A2E;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.matrix-cell {
  width: 40px;
  min-width: 40px;
  height: 32px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 1px 2px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.matrix-cell:hover {
  opacity: 0.8;
}

.cell-num {
  color: #6B7280;
  font-size: 11px;
}

.matrix-cell.level-3 .cell-num,
.matrix-cell.level-4 .cell-num {
  color: #FFFFFF;
  text-shadow: 0 1px 2px rgba(0,0,0,0.3);
}

.matrix-cell.level-0 {
  background: #F0F0F0;
}

.matrix-cell.level-1 {
  background: #EEF6FF;
}

.matrix-cell.level-2 {
  background: #93C5FD;
}

.matrix-cell.level-3 {
  background: #3B82F6;
}

.matrix-cell.level-4 {
  background: #1E5AA8;
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
  margin-top: 12px;
  font-size: 12px;
  color: #6B7280;
}

.legend-item {
  width: 20px;
  height: 12px;
  border-radius: 2px;
}

.legend-item.level-0 {
  background: #F0F0F0;
}

.legend-item.level-1 {
  background: #EEF6FF;
}

.legend-item.level-2 {
  background: #93C5FD;
}

.legend-item.level-3 {
  background: #3B82F6;
}

.legend-item.level-4 {
  background: #1E5AA8;
}

.consumable-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 8px;
}

.consumable-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rank {
  width: 24px;
  height: 24px;
  background: #F0F0F0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: #6B7280;
}

.rank.top {
  background: #1E5AA8;
  color: #FFFFFF;
}

.consumable-info {
  width: 120px;
}

.consumable-name {
  font-size: 14px;
  color: #1A1A2E;
  display: block;
}

.consumable-count {
  font-size: 12px;
  color: #6B7280;
}

.consumable-bar {
  flex: 1;
  height: 8px;
  background: #E8EAED;
  border-radius: 4px;
  overflow: hidden;
}

.consumable-fill {
  height: 100%;
  background: #1E5AA8;
  border-radius: 4px;
}

.consumable-cost {
  width: 70px;
  text-align: right;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}

.prediction-card {
  background: #FFFFFF;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.04);
}

.prediction-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.prediction-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: #F7F8FA;
  border-radius: 8px;
}

.prediction-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.prediction-icon.high {
  background: #FEE2E2;
  color: #E85D4E;
}

.prediction-icon.medium {
  background: #FEF3C7;
  color: #F5A623;
}

.prediction-info {
  flex: 1;
}

.prediction-name {
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
  display: block;
}

.prediction-desc {
  font-size: 12px;
  color: #6B7280;
}

.prediction-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.prediction-location {
  font-size: 12px;
  color: #6B7280;
}

.prediction-level {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
}

.prediction-level.high {
  background: #FEE2E2;
  color: #E85D4E;
}

.prediction-level.medium {
  background: #FEF3C7;
  color: #F5A623;
}

.top5-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8px;
}

.top5-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.top5-info {
  width: 200px;
  min-width: 160px;
}

.top5-name {
  font-size: 14px;
  color: #1A1A2E;
  display: block;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top5-location {
  font-size: 12px;
  color: #6B7280;
}

.top5-bar-wrap {
  flex: 1;
}

.top5-bar {
  height: 8px;
  background: #E8EAED;
  border-radius: 4px;
  overflow: hidden;
}

.top5-fill {
  height: 100%;
  background: #E85D4E;
  border-radius: 4px;
  transition: width 0.3s;
}

.top5-count {
  width: 40px;
  text-align: right;
  font-size: 14px;
  font-weight: 600;
  color: #1A1A2E;
}
</style>
