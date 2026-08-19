<template>
  <div class="screen-wrapper">
    <div class="visualization-screen" ref="screenRef">
      <div class="screen-bg">
        <span class="bg-orb orb-left"></span>
        <span class="bg-orb orb-right"></span>
        <span class="scan-line"></span>
        <span class="grid-mask"></span>
      </div>

      <header class="screen-header" ref="headerRef">
        <div class="header-side">
          <div class="header-meta">
            <span class="meta-label">数据来源</span>
            <span class="meta-value">校级训练、体测、课堂练习</span>
          </div>
          <div class="weather-box" v-if="weatherInfo">
            <div class="weather-icon">{{ weatherInfo.icon }}</div>
            <div class="weather-text">
              <span class="weather-temp">{{ weatherInfo.temp }}°C</span>
            </div>
          </div>
        </div>

        <div class="header-title">
          <div class="title-decor"></div>
          <h1>课外锻炼实时数据</h1>
          <!-- 标题下方流光 -->
          <div class="title-flow">
            <div class="flow-light"></div>
          </div>
          <p>SPORTS INTELLIGENCE DASHBOARD</p>
        </div>

        <div class="header-side header-side-right">
          <div class="live-badge">
            <span class="live-dot"></span>
            <span>实时更新中</span>
          </div>
          <div class="time-panel">
            <div class="time-main">{{ nowDisplay.time }}</div>
            <div class="time-sub">{{ nowDisplay.date }}</div>
          </div>
          <div class="exit-button" @click="goBack">
            <el-icon :size="18"><Close /></el-icon>
            <span>退出</span>
          </div>
        </div>
      </header>

      <section class="dashboard-grid">
        <div class="side-column">
          <article class="panel-card" ref="leftTrendPanelRef">
            <div class="panel-light"></div>
            <div class="panel-header">
              <div>
                <h3>近7天运动人次</h3>
              </div>
              <span class="panel-tag">趋势</span>
            </div>
            <div ref="trendChartRef" class="chart-box"></div>
          </article>

          <article class="panel-card panel-compact" ref="leftRankingPanelRef">
            <div class="panel-light"></div>
            <div class="panel-header">
              <div>
                <h3>运动成绩 TOP10</h3>
              </div>
              <span class="panel-tag">榜单</span>
            </div>
            <div class="ranking-list">
              <div v-for="item in topPerformers" :key="item.rank" class="ranking-item">
                <div class="ranking-main">
                  <span class="ranking-rank" :class="`rank-${Math.min(item.rank, 4)}`">{{ item.rank }}</span>
                  <div>
                    <div class="ranking-name">{{ item.name }}</div>
                    <div class="ranking-class">{{ item.class }}</div>
                  </div>
                </div>
                <div class="ranking-side">
                  <div class="ranking-score">{{ item.score }}</div>
                  <div class="ranking-project">{{ item.project }}</div>
                </div>
              </div>
            </div>
          </article>
        </div>

        <div class="center-column">
          <article class="panel-card hero-panel" ref="heroPanelRef">
            <div class="panel-light"></div>
            <div class="hero-panel__glow"></div>
            <div class="panel-header">
              <div>
                <h3>今日运动数据</h3>
              </div>
              <span class="panel-tag">今日</span>
            </div>
            <div class="hero-section">
              <div class="hero-metrics">
                <div class="hero-metric">
                  <span>今日参与人数</span>
                  <strong>{{ numberFormatter.format(liveStats.todayActive) }}</strong>
                </div>
                <div class="hero-metric">
                  <span>今日运动人次</span>
                  <strong>{{ numberFormatter.format(liveStats.todaySportsCount) }}</strong>
                </div>
                <div class="hero-metric">
                  <span>今日有效人次</span>
                  <strong>{{ numberFormatter.format(Math.round(liveStats.todaySportsCount * 0.68)) }}</strong>
                </div>
                <div class="hero-metric">
                  <span>今日运动公里</span>
                  <strong>{{ totalDistance.toFixed(2) }}</strong>
                </div>
              </div>
            </div>
            <div class="hero-section">
              <div class="hero-metrics">
                <div class="hero-metric">
                  <span>累计参与人数</span>
                  <strong>{{ heroStats.totalParticipants }}</strong>
                </div>
                <div class="hero-metric">
                  <span>累计运动公里</span>
                  <strong>{{ heroStats.totalDistance }}</strong>
                </div>
                <div class="hero-metric">
                  <span>累计人均次数</span>
                  <strong>{{ heroStats.avgExercise }}</strong>
                </div>
                <div class="hero-metric">
                  <span>累计人均公里</span>
                  <strong>{{ heroStats.avgDistance }}</strong>
                </div>
              </div>
            </div>
          </article>

          <article class="panel-card" ref="distributionPanelRef">
            <div class="panel-light"></div>
            <div class="panel-header">
              <div>
                <h3>学段参与分布</h3>
              </div>
              <span class="panel-tag">分布</span>
            </div>
            <div class="distribution-wrap">
              <div ref="distributionChartRef" class="chart-box chart-box--small"></div>
              <div class="summary-grid">
                <div v-for="item in summaryCards" :key="item.label" class="summary-card">
                  <span>{{ item.label }}</span>
                  <strong>{{ item.value }}</strong>
                  <em>{{ item.helper }}</em>
                </div>
              </div>
            </div>
          </article>

          <article class="panel-card" ref="centerTrendPanelRef">
            <div class="panel-light"></div>
            <div class="panel-header">
              <div>
                <h3>学期锻炼趋势</h3>
              </div>
              <span class="panel-tag">月度</span>
            </div>
            <div ref="monthlyChartRef" class="chart-box"></div>
          </article>
        </div>

        <div class="side-column">
          <article class="panel-card" ref="rightBarPanelRef">
            <div class="panel-light"></div>
            <div class="panel-header">
              <div>
                <h3>班级参与率 TOP10</h3>
              </div>
              <span class="panel-tag">排行</span>
            </div>
            <div class="progress-list">
              <div v-for="item in classRanking" :key="item.name" class="progress-item">
                <div class="progress-row">
                  <span>{{ item.name }}</span>
                  <strong>{{ item.value }}%</strong>
                </div>
                <div class="progress-track">
                  <div class="progress-bar" :style="{ width: `${item.value}%` }"></div>
                </div>
              </div>
            </div>
          </article>

          <article class="panel-card panel-compact" ref="feedPanelRef">
            <div class="panel-light"></div>
            <div class="panel-header">
              <div>
                <h3>实时运动数据</h3>
              </div>
              <span class="panel-tag">LIVE</span>
            </div>
            <div class="feed-list">
              <div v-for="item in liveFeed" :key="item.id" class="feed-item">
                <div class="feed-avatar">{{ item.name.slice(0, 1) }}</div>
                <div class="feed-content">
                  <div class="feed-top">
                    <span class="feed-name">{{ item.name }}</span>
                    <span class="feed-time">{{ item.time }}</span>
                  </div>
                  <div class="feed-text">
                    {{ item.project }} · {{ item.result }}
                  </div>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { Close } from '@element-plus/icons-vue'
import gsap from 'gsap'
import echarts from '@/utils/echarts'
import store from '@/store/global'
import { getSchoolMockData } from '@/utils/mockDataLoader'
import { getSchoolProfile } from '@/mock/school-data/schoolProfiles'
import { calculateSchoolStats, calculateStudentRanking } from '@/utils/statistics'

const router = useRouter()

const schoolId = store.state.school.id || 'hailin-second-primary'
const schoolProfile = getSchoolProfile(schoolId)
const schoolName = store.state.school.name || schoolProfile?.name || '智慧体育评测教学系统'
const screenTitle = '课外锻炼实时数据'

const schoolData = getSchoolMockData(schoolId)
const students = ref(schoolData.students || [])
const testResults = ref(schoolData.nationalTestResults || [])
const examResults = ref(schoolData.examResults || [])
const practiceRecords = ref(schoolData.practiceRecords || [])

const baseStats = computed(() => calculateSchoolStats(
  students.value,
  testResults.value,
  examResults.value,
  schoolProfile
))

const baseRanking = computed(() => calculateStudentRanking(students.value, testResults.value))

const liveStats = ref({
  todayActive: 0,
  todaySportsCount: 0,
  passRate: 0,
  excellentRate: 0,
  monthTotal: 0,
  termTotal: 0,
  avgExerciseCount: 0
})

const livePulseScore = ref(92)
const now = ref(new Date())
const liveFeed = ref([])
const weatherInfo = ref(null)

const screenRef = ref(null)
const headerRef = ref(null)
const heroPanelRef = ref(null)
const distributionPanelRef = ref(null)
const leftTrendPanelRef = ref(null)
const leftRankingPanelRef = ref(null)
const centerTrendPanelRef = ref(null)
const rightBarPanelRef = ref(null)
const feedPanelRef = ref(null)
const statCardRefs = ref([])

const trendChartRef = ref(null)
const distributionChartRef = ref(null)
const monthlyChartRef = ref(null)

let trendChart = null
let distributionChart = null
let monthlyChart = null
let clockTimer = null
let refreshTimer = null
let resizeObserver = null
let weatherTimer = null

const numberFormatter = new Intl.NumberFormat('zh-CN')

const nowDisplay = computed(() => {
  const current = now.value
  const yyyy = current.getFullYear()
  const mm = String(current.getMonth() + 1).padStart(2, '0')
  const dd = String(current.getDate()).padStart(2, '0')
  const hh = String(current.getHours()).padStart(2, '0')
  const mi = String(current.getMinutes()).padStart(2, '0')
  const ss = String(current.getSeconds()).padStart(2, '0')
  const week = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'][current.getDay()]
  return {
    time: `${hh}:${mi}:${ss}`,
    date: `${yyyy}-${mm}-${dd} ${week}`
  }
})

const gradeSegments = computed(() => {
  const gradeStats = baseStats.value.gradeStats || {}
  const palette = ['#2F7BFF', '#3FD0FF', '#53D7A7', '#FFB547', '#FF7E62', '#8E7BFF']
  return Object.entries(gradeStats)
    .filter(([, item]) => item.count > 0)
    .map(([name, item], index) => ({
      name,
      value: item.count,
      itemStyle: { color: palette[index % palette.length] }
    }))
})

const classRanking = computed(() => {
  const studentsList = students.value || []
  const classMap = {}
  studentsList.forEach(s => {
    const grade = s.grade || ''
    const cls = s.class || s.className || ''
    const fullName = `${grade}${cls}`.trim() || '未知班级'
    if (!classMap[fullName]) {
      classMap[fullName] = 0
    }
    classMap[fullName]++
  })

  return Object.entries(classMap)
    .map(([name, count]) => ({
      name,
      value: Math.min(98, Math.max(55, Math.round(58 + count * 1.8)))
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10)
})

const topPerformers = computed(() => {
  return baseRanking.value.slice(0, 10)
})

const totalDistance = computed(() => {
  return practiceRecords.value.reduce((sum, item) => {
    if (typeof item.score === 'string' && item.score.endsWith('m')) {
      return sum + Number.parseFloat(item.score)
    }
    if (typeof item.score === 'string' && item.score.endsWith('秒')) {
      return sum + 0.08
    }
    if (typeof item.score === 'string' && item.score.endsWith('个')) {
      return sum + Number.parseFloat(item.score) * 0.008
    }
    return sum + (item.duration || 0) * 0.02
  }, 0)
})

const heroStats = computed(() => {
  const participantCount = Math.round(baseStats.value.totalStudents * 0.92)
  const distance = totalDistance.value + liveStats.value.todaySportsCount * 0.12
  return {
    totalParticipants: numberFormatter.format(participantCount),
    totalDistance: distance.toFixed(2),
    avgExercise: `${liveStats.value.avgExerciseCount.toFixed(1)}次`,
    avgDistance: `${(distance / Math.max(participantCount, 1)).toFixed(2)}km`
  }
})

const summaryCards = computed(() => {
  const completed = practiceRecords.value.filter(item => item.status === '已完成').length
  const inProgress = practiceRecords.value.filter(item => item.status === '进行中').length
  return [
    {
      label: '有效运动人数',
      value: numberFormatter.format(Math.round(liveStats.value.todayActive * 0.81)),
      helper: '达到统计阈值'
    },
    {
      label: '日均有效时长',
      value: `${Math.round(liveStats.value.avgExerciseCount * 8)}min`,
      helper: '结合训练记录估算'
    },
    {
      label: '练习完成数',
      value: numberFormatter.format(completed),
      helper: '已完成状态记录'
    },
    {
      label: '实时上报中',
      value: numberFormatter.format(inProgress),
      helper: '正在采集数据'
    }
  ]
})

const monthlySeries = computed(() => {
  const base = liveStats.value.todaySportsCount
  return ['01月', '02月', '03月', '04月', '05月', '06月', '07月'].map((label, index) => {
    const factor = [0.52, 0.61, 0.78, 0.92, 1.06, 1.18, 0.83][index]
    return {
      label,
      total: Math.round(base * 31 * factor),
      effective: Math.round(base * 22 * (factor - 0.08))
    }
  })
})

const trendSeries = computed(() => {
  const base = liveStats.value.todayActive
  return [
    { day: '07-01', value: Math.round(base * 0.42) },
    { day: '07-02', value: Math.round(base * 0.48) },
    { day: '07-03', value: Math.round(base * 0.73) },
    { day: '07-04', value: Math.round(base * 1.05) },
    { day: '07-05', value: Math.round(base * 0.84) },
    { day: '07-06', value: Math.round(base * 0.69) },
    { day: '07-07', value: Math.round(base * 0.38) }
  ]
})

const buildLiveFeed = () => {
  const records = practiceRecords.value.slice(0, 9).map((item, index) => ({
    id: `${item.id}-${index}`,
    name: item.studentName || item.name || `学生${index + 1}`,
    project: item.event || '自由练习',
    result: item.score || `${item.duration || 20}分钟`,
    time: `${index + 1}分钟前`
  }))
  liveFeed.value = records
}

const syncLiveStats = () => {
  liveStats.value = {
    todayActive: baseStats.value.todayActive || 0,
    todaySportsCount: baseStats.value.todaySportsCount || 0,
    passRate: baseStats.value.passRate || 0,
    excellentRate: baseStats.value.excellentRate || 0,
    monthTotal: baseStats.value.monthTotal || 0,
    termTotal: baseStats.value.termTotal || 0,
    avgExerciseCount: baseStats.value.avgExerciseCount || 0
  }
}

const simulateRealtimeUpdate = () => {
  const activeDelta = Math.round((Math.random() - 0.25) * 18)
  const sportsDelta = Math.round(10 + Math.random() * 28)
  liveStats.value = {
    ...liveStats.value,
    todayActive: Math.max(0, liveStats.value.todayActive + activeDelta),
    todaySportsCount: Math.max(0, liveStats.value.todaySportsCount + sportsDelta),
    monthTotal: liveStats.value.monthTotal + sportsDelta * 5,
    termTotal: liveStats.value.termTotal + sportsDelta * 11,
    passRate: Number((liveStats.value.passRate + (Math.random() - 0.45) * 0.4).toFixed(1)),
    excellentRate: Number((liveStats.value.excellentRate + (Math.random() - 0.48) * 0.35).toFixed(1)),
    avgExerciseCount: Number((liveStats.value.avgExerciseCount + (Math.random() - 0.45) * 0.08).toFixed(1))
  }

  livePulseScore.value = Math.max(86, Math.min(99, Math.round(livePulseScore.value + (Math.random() - 0.5) * 5)))

  const randomRecord = practiceRecords.value[Math.floor(Math.random() * practiceRecords.value.length)]
  if (randomRecord) {
    liveFeed.value = [
      {
        id: `${randomRecord.id}-${Date.now()}`,
        name: randomRecord.studentName || '匿名学生',
        project: randomRecord.event || '自由练习',
        result: randomRecord.score || `${randomRecord.duration || 20}分钟`,
        time: '刚刚'
      },
      ...liveFeed.value.slice(0, 8).map((item, index) => ({
        ...item,
        time: index === 0 ? '1分钟前' : item.time
      }))
    ]
  }

  renderCharts()
}

const fetchWeather = async () => {
  try {
    const lat = 30.64
    const lon = 104.05
    const res = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
    )
    const data = await res.json()
    const w = data.current_weather
    const codeMap = {
      0: { icon: '晴' },
      1: { icon: '多云' },
      2: { icon: '多云' },
      3: { icon: '阴' },
      45: { icon: '雾' },
      48: { icon: '雾凇' },
      51: { icon: '小雨' },
      53: { icon: '中雨' },
      55: { icon: '大雨' },
      56: { icon: '冻雨' },
      57: { icon: '冻雨' },
      61: { icon: '小雨' },
      63: { icon: '中雨' },
      65: { icon: '大雨' },
      66: { icon: '冻雨' },
      67: { icon: '冻雨' },
      71: { icon: '小雪' },
      73: { icon: '中雪' },
      75: { icon: '大雪' },
      77: { icon: '雪粒' },
      80: { icon: '阵雨' },
      81: { icon: '阵雨' },
      82: { icon: '暴雨' },
      85: { icon: '阵雪' },
      86: { icon: '阵雪' },
      95: { icon: '雷雨' },
      96: { icon: '雷雹' },
      99: { icon: '雷雹' },
    }
    const map = codeMap[w.weathercode] || { desc: '晴', icon: '晴' }
    weatherInfo.value = {
      temp: Math.round(w.temperature),
      icon: map.icon
    }
  } catch (e) {
    console.error('天气获取失败', e)
  }
}

const setStatCardRef = (el, index) => {
  if (el) {
    statCardRefs.value[index] = el
  }
}

/* ========== 大屏等比缩放核心逻辑 ========== */
const DESIGN_WIDTH = 1920
const DESIGN_HEIGHT = 1080

const setScale = () => {
  if (!screenRef.value) return
  const scaleX = window.innerWidth / DESIGN_WIDTH
  const scaleY = window.innerHeight / DESIGN_HEIGHT
  const scale = Math.min(scaleX, scaleY)
  screenRef.value.style.transform = `scale(${scale})`
}

const initTrendChart = () => {
  if (!trendChartRef.value) return
  if (!trendChart) {
    trendChart = echarts.init(trendChartRef.value, null, { devicePixelRatio: 2 })
  }
  trendChart.setOption({
    animationDuration: 800,
    tooltip: { trigger: 'axis' },
    grid: { left: '3%', right: '3%', top: '10%', bottom: '4%', containLabel: true },
    xAxis: {
      type: 'category',
      data: trendSeries.value.map(item => item.day),
      axisLine: { lineStyle: { color: 'rgba(30, 90, 168, 0.35)' } },
      axisLabel: { color: '#9FC7FF' },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(30, 90, 168, 0.16)' } },
      axisLabel: { color: '#7FA8DD' }
    },
    series: [{
      name: '运动人数',
      type: 'line',
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      data: trendSeries.value.map(item => item.value),
      lineStyle: { width: 3, color: '#3B82F6' },
      itemStyle: { color: '#60A5FA', borderColor: '#DBEAFE', borderWidth: 2 },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: 'rgba(59, 130, 246, 0.42)' },
          { offset: 1, color: 'rgba(59, 130, 246, 0.02)' }
        ])
      }
    }]
  })
}

const initDistributionChart = () => {
  if (!distributionChartRef.value) return
  if (!distributionChart) {
    distributionChart = echarts.init(distributionChartRef.value, null, { devicePixelRatio: 2 })
  }
  distributionChart.setOption({
    animationDuration: 700,
    tooltip: { trigger: 'item', formatter: '{b}<br/>{c}人 ({d}%)' },
    legend: {
      bottom: 0,
      textStyle: { color: '#A7C8F7', fontSize: 11 },
      itemWidth: 10,
      itemHeight: 10
    },
    color: ['#1E5AA8', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'],
    series: [{
      type: 'pie',
      radius: ['52%', '72%'],
      center: ['50%', '42%'],
      label: { color: '#E6F4FF', formatter: '{d}%' },
      labelLine: { lineStyle: { color: 'rgba(59, 130, 246, 0.5)' } },
      itemStyle: {
        borderColor: 'rgba(4, 22, 58, 0.95)',
        borderWidth: 2
      },
      data: gradeSegments.value
    }]
  })
}

const initMonthlyChart = () => {
  if (!monthlyChartRef.value) return
  if (!monthlyChart) {
    monthlyChart = echarts.init(monthlyChartRef.value, null, { devicePixelRatio: 2 })
  }
  monthlyChart.setOption({
    animationDuration: 900,
    tooltip: { trigger: 'axis' },
    legend: {
      top: 0,
      right: 0,
      textStyle: { color: '#A7C8F7' }
    },
    grid: { left: '3%', right: '3%', top: '18%', bottom: '4%', containLabel: true },
    xAxis: {
      type: 'category',
      data: monthlySeries.value.map(item => item.label),
      axisLine: { lineStyle: { color: 'rgba(30, 90, 168, 0.35)' } },
      axisLabel: { color: '#9FC7FF' },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(30, 90, 168, 0.16)' } },
      axisLabel: { color: '#7FA8DD' }
    },
    series: [
      {
        name: '总趋势步数',
        type: 'line',
        smooth: true,
        data: monthlySeries.value.map(item => item.total),
        lineStyle: { width: 3, color: '#1E5AA8' },
        itemStyle: { color: '#3B82F6' },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: 'rgba(30, 90, 168, 0.35)' },
            { offset: 1, color: 'rgba(30, 90, 168, 0.04)' }
          ])
        }
      },
      {
        name: '有效次数',
        type: 'line',
        smooth: true,
        data: monthlySeries.value.map(item => item.effective),
        lineStyle: { width: 2, color: '#F5A623', type: 'dashed' },
        itemStyle: { color: '#F5A623' }
      }
    ]
  })
}

const renderCharts = () => {
  initTrendChart()
  initDistributionChart()
  initMonthlyChart()
}

const handleResize = () => {
  trendChart?.resize()
  distributionChart?.resize()
  monthlyChart?.resize()
}

/* ========== 对冲入场动画 ========== */
const animateEntrance = () => {
  // Header 从顶部淡入
  gsap.fromTo(headerRef.value,
    { opacity: 0, y: -40 },
    { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }
  )

  // 左侧列：从左边对冲滑入
  const leftPanels = [leftTrendPanelRef.value, leftRankingPanelRef.value].filter(Boolean)
  gsap.fromTo(leftPanels,
    { opacity: 0, x: -80 },
    { opacity: 1, x: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out', delay: 0.3 }
  )

  // 右侧列：从右边对冲滑入
  const rightPanels = [rightBarPanelRef.value, feedPanelRef.value].filter(Boolean)
  gsap.fromTo(rightPanels,
    { opacity: 0, x: 80 },
    { opacity: 1, x: 0, duration: 0.9, stagger: 0.15, ease: 'power3.out', delay: 0.3 }
  )

  // 中间列：从下方升起
  const centerPanels = [heroPanelRef.value, distributionPanelRef.value, centerTrendPanelRef.value].filter(Boolean)
  gsap.fromTo(centerPanels,
    { opacity: 0, y: 60 },
    { opacity: 1, y: 0, duration: 0.9, stagger: 0.12, ease: 'power3.out', delay: 0.5 }
  )

  // 背景扫描线
  gsap.to('.scan-line', {
    yPercent: 260,
    duration: 5,
    repeat: -1,
    ease: 'none'
  })
}

const goBack = () => {
  router.push('/data/overview')
}

onMounted(() => {
  fetchWeather()
  weatherTimer = window.setInterval(fetchWeather, 30 * 60 * 1000)
  syncLiveStats()
  buildLiveFeed()
  nextTick(() => {
    setScale()
    renderCharts()
    animateEntrance()
    resizeObserver = new ResizeObserver(() => {
      handleResize()
    })
    ;[trendChartRef.value, distributionChartRef.value, monthlyChartRef.value].forEach(el => {
      if (el) resizeObserver.observe(el)
    })
  })
  clockTimer = window.setInterval(() => {
    now.value = new Date()
  }, 1000)
  refreshTimer = window.setInterval(() => {
    simulateRealtimeUpdate()
  }, 4000)
  window.addEventListener('resize', handleResize)
  window.addEventListener('resize', setScale)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', handleResize)
  window.removeEventListener('resize', setScale)
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
  if (clockTimer) window.clearInterval(clockTimer)
  if (refreshTimer) window.clearInterval(refreshTimer)
  if (weatherTimer) window.clearInterval(weatherTimer)
  trendChart?.dispose()
  distributionChart?.dispose()
  monthlyChart?.dispose()
})
</script>

<style scoped>
/* 外层容器：占满视口，居中，截断溢出 */
.screen-wrapper {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background: #040b15;
  display: flex;
  align-items: center;
  justify-content: center;
}

.visualization-screen {
  position: relative;
  width: 1920px;
  height: 1080px;
  flex-shrink: 0;
  padding: 14px 20px 16px;
  overflow: hidden;
  background:
    radial-gradient(circle at top left, rgba(30, 90, 168, 0.18), transparent 28%),
    radial-gradient(circle at top right, rgba(59, 130, 246, 0.14), transparent 26%),
    linear-gradient(180deg, #081425 0%, #06101d 42%, #040b15 100%);
  color: #eaf4ff;
  display: flex;
  flex-direction: column;
  transform-origin: center center;
}

.screen-bg,
.grid-mask,
.scan-line {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.grid-mask {
  background-image:
    linear-gradient(rgba(30, 90, 168, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(30, 90, 168, 0.06) 1px, transparent 1px);
  background-size: 36px 36px;
  mask-image: linear-gradient(180deg, rgba(0, 0, 0, 0.8), transparent 95%);
}

.bg-orb {
  position: absolute;
  width: 320px;
  height: 320px;
  border-radius: 50%;
  filter: blur(80px);
  opacity: 0.55;
}

.orb-left {
  top: -100px;
  left: -60px;
  background: rgba(30, 90, 168, 0.32);
}

.orb-right {
  right: -120px;
  bottom: 40px;
  background: rgba(59, 130, 246, 0.2);
}

.scan-line {
  top: -40%;
  height: 40%;
  background: linear-gradient(180deg, transparent, rgba(59, 130, 246, 0.12), transparent);
}

.screen-header,
.dashboard-grid {
  position: relative;
  z-index: 1;
}

.screen-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 18px;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.header-side {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 0;
}

.header-side-right {
  justify-content: flex-end;
}

.brand-chip,
.live-badge,
.exit-button,
.panel-tag {
  border: 1px solid rgba(114, 177, 255, 0.24);
  background: rgba(8, 24, 48, 0.68);
  backdrop-filter: blur(10px);
}

.brand-chip {
  padding: 8px 14px;
  border-radius: 999px;
  color: #60A5FA;
  font-size: 13px;
  letter-spacing: 1px;
}

.header-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.meta-label {
  font-size: 12px;
  color: #79a9de;
}

.meta-value {
  font-size: 13px;
  color: #d7ebff;
}

.weather-box {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(114, 177, 255, 0.24);
  background: rgba(8, 24, 48, 0.68);
  backdrop-filter: blur(10px);
}

.weather-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(30, 90, 168, 0.4));
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.weather-text {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
}

.weather-temp {
  font-size: 15px;
  font-weight: 700;
  color: #f1f8ff;
}

.weather-desc {
  font-size: 11px;
  color: #88afe0;
}

/* ========== 标题区 + 流光下划线 ========== */
.header-title {
  text-align: center;
  position: relative;
}

.title-decor {
  width: 120px;
  height: 8px;
  margin: 0 auto 10px;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, #3B82F6, transparent);
}

.header-title h1 {
  margin: 0;
  font-size: clamp(28px, 2.2vw, 40px);
  letter-spacing: 3px;
  font-weight: 800;
}

/* 标题下方流光扫描线 */
.title-flow {
  position: relative;
  width: 70%;
  height: 2px;
  margin: 10px auto 0;
  background: rgba(96, 165, 250, 0.15);
  border-radius: 2px;
  overflow: hidden;
}

.flow-light {
  position: absolute;
  top: 0;
  left: -40%;
  width: 40%;
  height: 100%;
  background: linear-gradient(90deg, transparent, #60A5FA, #3B82F6, transparent);
  filter: blur(0.5px);
  box-shadow: 0 0 10px #60A5FA, 0 0 20px rgba(59, 130, 246, 0.4);
  animation: titleFlow 2.8s linear infinite;
}

@keyframes titleFlow {
  0%   { left: -40%; }
  100% { left: 100%; }
}

.header-title p {
  margin: 10px 0 0;
  color: #8fb8ea;
  font-size: 14px;
  letter-spacing: 1px;
}

.live-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 14px;
  border-radius: 999px;
  color: #60A5FA;
  font-size: 13px;
}

.live-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3B82F6;
  box-shadow: 0 0 10px #3B82F6;
  animation: pulse 1.6s infinite;
}

.time-panel {
  text-align: right;
}

.time-main {
  font-size: 24px;
  font-weight: 700;
  color: #f1f8ff;
}

.time-sub {
  font-size: 12px;
  color: #88afe0;
}

.exit-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  border-radius: 10px;
  cursor: pointer;
  transition: 0.25s ease;
  color: #dcebff;
}

.exit-button:hover {
  transform: translateY(-1px);
  border-color: rgba(59, 130, 246, 0.45);
}

.stat-card {
  padding: 12px 14px;
  border-radius: 14px;
}

.stat-card__label {
  color: #86b4e9;
  font-size: 11px;
}

.stat-card__value {
  margin-top: 8px;
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.stat-card__value span {
  font-size: clamp(20px, 1.6vw, 28px);
  font-weight: 800;
  color: #ffffff;
}

.stat-card__value em {
  font-style: normal;
  color: #60A5FA;
  font-size: 12px;
}

.stat-card__footer {
  margin-top: 8px;
  display: flex;
  justify-content: space-between;
  gap: 8px;
  font-size: 11px;
  color: #7ca7d7;
}

.stat-card__footer strong {
  font-size: 12px;
}

.positive {
  color: #3B82F6;
}

.negative {
  color: #E85D4E;
}

/* ========== 面板卡片 + 上下流光边框 ========== */
.stat-card,
.panel-card,
.hero-panel {
  position: relative;
  overflow: hidden;
  border: 1px solid rgba(114, 177, 255, 0.12);
  background: linear-gradient(180deg, rgba(9, 24, 48, 0.82), rgba(5, 15, 30, 0.92));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.05), 0 10px 30px rgba(0, 0, 0, 0.24);
}

.stat-card::after,
.panel-card::after,
.hero-panel::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.08), transparent 35%, transparent 70%, rgba(30, 90, 168, 0.08));
  pointer-events: none;
}

/* 面板上下流光边线（不围成圈） */
.panel-light {
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 3;
  border-radius: inherit;
  overflow: hidden;
}

.panel-light::before {
  content: '';
  position: absolute;
  top: 0;
  left: -40%;
  width: 40%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #60A5FA, transparent);
  box-shadow: 0 0 8px #60A5FA;
  animation: panelLightMove 3.5s linear infinite;
}

.panel-light::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: -40%;
  width: 40%;
  height: 1px;
  background: linear-gradient(90deg, transparent, #3B82F6, transparent);
  box-shadow: 0 0 8px #3B82F6;
  animation: panelLightMoveReverse 3.5s linear infinite;
}

@keyframes panelLightMove {
  0%   { left: -40%; }
  100% { left: 100%; }
}

@keyframes panelLightMoveReverse {
  0%   { right: -40%; }
  100% { right: 100%; }
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.05fr 1.4fr 1.05fr;
  gap: 10px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.side-column,
.center-column {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-width: 0;
  min-height: 0;
  height: 100%;
  overflow: hidden;
}

.side-column:first-child > .panel-card:first-child {
  flex: 0.8;
}

.side-column:last-child > .panel-card:nth-child(1) {
  flex: 1;
}

.side-column:last-child > .panel-card:nth-child(2) {
  flex: 1;
}

.panel-card,
.hero-panel {
  border-radius: 18px;
  padding: 12px;
}

.panel-card {
  display: flex;
  flex-direction: column;
  min-height: 0;
  flex: 1;
  overflow: hidden;
}

.hero-panel {
  flex: 0 0 auto;
}

.panel-compact {
  flex: 1;
}

.panel-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.panel-header h3 {
  font-size: 15px;
  font-weight: 700;
  color: #f3f8ff;
}

.panel-header p {
  margin: 4px 0 0;
  font-size: 11px;
  color: #7ea7d8;
}

.panel-tag {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 11px;
  color: #60A5FA;
}

.chart-box {
  width: 100%;
  flex: 1;
  min-height: 120px;
}

.chart-box--small {
  flex: 1;
  min-height: 100px;
}

.hero-panel {
  min-height: auto;
}

.hero-section {
  margin-bottom: 6px;
}

.hero-section-title {
  margin-bottom: 6px;
  color: #86b4e9;
  font-size: 12px;
  font-weight: 600;
}

.hero-section:last-child {
  margin-bottom: 0;
}

.hero-panel__glow {
  position: absolute;
  inset: auto 10% -60px 10%;
  height: 120px;
  background: radial-gradient(circle, rgba(30, 90, 168, 0.25), transparent 70%);
  filter: blur(40px);
  pointer-events: none;
}

.hero-metrics {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 8px;
  margin-top: 0;
}

.hero-metric,
.summary-card {
  border-radius: 12px;
  border: 1px solid rgba(96, 151, 240, 0.16);
  background: rgba(8, 20, 40, 0.58);
}

.hero-metric {
  padding: 8px 10px;
}

.hero-metric span {
  display: block;
  color: #7ea7d8;
  font-size: 11px;
}

.hero-metric strong {
  display: block;
  margin-top: 4px;
  color: #ffffff;
  font-size: 20px;
}

.distribution-wrap {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  min-width: 0;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
  align-content: start;
}

.summary-card {
  padding: 12px;
}

.summary-card strong {
  display: block;
  margin-top: 6px;
  color: #ffffff;
  font-size: 18px;
}

.summary-card em {
  display: block;
  margin-top: 8px;
  color: #60A5FA;
  font-size: 12px;
  font-style: normal;
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 1px;
  flex: auto;
  min-height: 0;
  overflow: visible;
}

.feed-list,
.progress-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.ranking-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 2px 6px;
  border-radius: 8px;
  border: 1px solid rgba(95, 145, 230, 0.14);
  background: rgba(7, 19, 36, 0.6);
  flex-shrink: 0;
}

.feed-item {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 10px;
  padding: 6px 10px;
  border-radius: 10px;
  border: 1px solid rgba(95, 145, 230, 0.14);
  background: rgba(7, 19, 36, 0.6);
}

.ranking-main {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.ranking-rank {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-size: 11px;
  font-weight: 700;
  background: rgba(125, 158, 214, 0.22);
  color: #ffffff;
}

.rank-1 {
  background: linear-gradient(135deg, #ffd978, #ff9f43);
  color: #4f2c00;
}

.rank-2 {
  background: linear-gradient(135deg, #dce9ff, #8eb8ff);
  color: #102a56;
}

.rank-3 {
  background: linear-gradient(135deg, #ffbf8a, #ff7e62);
  color: #4f1600;
}

.rank-4 {
  background: rgba(125, 158, 214, 0.22);
  color: #ffffff;
}

.ranking-name,
.feed-name {
  color: #f6fbff;
  font-weight: 600;
  font-size: 12px;
  line-height: 1.3;
}

.ranking-class,
.ranking-project,
.feed-time,
.feed-text {
  color: #7ea7d8;
  font-size: 11px;
  line-height: 1.3;
}

.ranking-side {
  text-align: right;
}

.ranking-score {
  color: #60A5FA;
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
}

.progress-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.progress-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 12px;
  color: #d8ebff;
}

.progress-row strong {
  color: #60A5FA;
}

.progress-track {
  height: 8px;
  border-radius: 999px;
  overflow: hidden;
  background: rgba(30, 90, 168, 0.16);
}

.progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, #1E5AA8, #3B82F6 60%, #F5A623);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.3);
}

.feed-avatar {
  width: 28px;
  height: 28px;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.25), rgba(30, 90, 168, 0.35));
  color: #ffffff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12px;
  flex-shrink: 0;
}

.feed-content {
  flex: 1;
  min-width: 0;
}

.feed-top {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.feed-text {
  margin-top: 2px;
  font-size: 11px;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.35);
    opacity: 0.7;
  }
}
</style>