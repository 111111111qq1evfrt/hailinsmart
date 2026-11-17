/**
 * 统一评分标准与等级换算
 *
 * 数据来源：大沩只推送原始成绩（score），不提供等级和百分制分数。
 * 本项目统一按「自定义评分标准」（ScoreConfig.vue 的默认规则）换算：
 *   原始成绩 → 所在等级区间的百分制分数 → 等级
 */

// 默认评分标准（与 ScoreConfig.vue 的默认值保持一致）
export const DEFAULT_SCORE_STANDARDS = [
  {
    id: 1,
    name: '立定跳远',
    category: '跳跃类',
    unit: '米',
    genderFilter: 'all',
    rules: [
      { level: '优秀', scoreMin: 90, scoreMax: 100, minValue: 2.3, maxValue: 3.0 },
      { level: '良好', scoreMin: 80, scoreMax: 89, minValue: 2.0, maxValue: 2.29 },
      { level: '及格', scoreMin: 60, scoreMax: 79, minValue: 1.5, maxValue: 1.99 },
      { level: '不及格', scoreMin: 0, scoreMax: 59, minValue: 0, maxValue: 1.49 }
    ]
  },
  {
    id: 2,
    name: '50米跑',
    category: '速度类',
    unit: '秒',
    genderFilter: 'all',
    lowerIsBetter: true,
    rules: [
      { level: '优秀', scoreMin: 90, scoreMax: 100, minValue: 6.5, maxValue: 7.5 },
      { level: '良好', scoreMin: 80, scoreMax: 89, minValue: 7.6, maxValue: 8.5 },
      { level: '及格', scoreMin: 60, scoreMax: 79, minValue: 8.6, maxValue: 10.0 },
      { level: '不及格', scoreMin: 0, scoreMax: 59, minValue: 10.1, maxValue: 15.0 }
    ]
  },
  {
    id: 3,
    name: '仰卧起坐',
    category: '力量类',
    unit: '次/分钟',
    genderFilter: '女',
    rules: [
      { level: '优秀', scoreMin: 90, scoreMax: 100, minValue: 45, maxValue: 60 },
      { level: '良好', scoreMin: 80, scoreMax: 89, minValue: 38, maxValue: 44 },
      { level: '及格', scoreMin: 60, scoreMax: 79, minValue: 20, maxValue: 37 },
      { level: '不及格', scoreMin: 0, scoreMax: 59, minValue: 0, maxValue: 19 }
    ]
  },
  {
    id: 4,
    name: '引体向上',
    category: '力量类',
    unit: '次',
    genderFilter: '男',
    rules: [
      { level: '优秀', scoreMin: 90, scoreMax: 100, minValue: 15, maxValue: 25 },
      { level: '良好', scoreMin: 80, scoreMax: 89, minValue: 10, maxValue: 14 },
      { level: '及格', scoreMin: 60, scoreMax: 79, minValue: 6, maxValue: 9 },
      { level: '不及格', scoreMin: 0, scoreMax: 59, minValue: 0, maxValue: 5 }
    ]
  },
  {
    id: 5,
    name: '坐位体前屈',
    category: '柔韧性',
    unit: '厘米',
    genderFilter: 'all',
    rules: [
      { level: '优秀', scoreMin: 90, scoreMax: 100, minValue: 20, maxValue: 35 },
      { level: '良好', scoreMin: 80, scoreMax: 89, minValue: 15, maxValue: 19.9 },
      { level: '及格', scoreMin: 60, scoreMax: 79, minValue: 8, maxValue: 14.9 },
      { level: '不及格', scoreMin: 0, scoreMax: 59, minValue: 0, maxValue: 7.9 }
    ]
  },
  {
    id: 6,
    name: '跳绳',
    category: '耐力类',
    unit: '次/分钟',
    genderFilter: 'all',
    rules: [
      { level: '优秀', scoreMin: 90, scoreMax: 100, minValue: 150, maxValue: 200 },
      { level: '良好', scoreMin: 80, scoreMax: 89, minValue: 120, maxValue: 149 },
      { level: '及格', scoreMin: 60, scoreMax: 79, minValue: 80, maxValue: 119 },
      { level: '不及格', scoreMin: 0, scoreMax: 59, minValue: 0, maxValue: 79 }
    ]
  }
]

// 大沩 sport_type → 评分标准项目名
export const SPORT_TYPE_EVENT_MAP = {
  1: '跳绳',
  2: '立定跳远',
  4: '引体向上',
  6: '仰卧起坐',
  8: '坐位体前屈',
  11: '50米跑'
}

const EVENT_ALIASES = {
  一分钟跳绳: '跳绳'
}

const storageKeyOf = (schoolId) => `smart_pe_score_standards_${schoolId}`

/** 读取某学校的评分标准（有自定义配置则优先使用） */
export const getScoreStandards = (schoolId) => {
  if (!schoolId) return DEFAULT_SCORE_STANDARDS
  try {
    const raw = localStorage.getItem(storageKeyOf(schoolId))
    if (raw) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) && parsed.length) return parsed
    }
  } catch (e) {
    // 忽略解析失败，回退默认标准
  }
  return DEFAULT_SCORE_STANDARDS
}

/** 按项目名查找评分标准 */
export const findStandardByEvent = (event, standards = DEFAULT_SCORE_STANDARDS) => {
  if (!event) return null
  const name = EVENT_ALIASES[event] || event
  return standards.find(s => s.name === name) || null
}

/** 按大沩 sport_type 查找评分标准 */
export const findStandardBySportType = (sportType, standards = DEFAULT_SCORE_STANDARDS) => {
  const event = SPORT_TYPE_EVENT_MAP[Number(sportType)]
  return event ? findStandardByEvent(event, standards) : null
}

const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/**
 * 原始成绩 → 百分制分数 + 等级
 * @param {string|number} eventOrSportType 项目名（如“跳绳”）或大沩 sport_type 数字
 * @param {number|string} rawValue 大沩推送的原始成绩
 * @param {Array} standards 评分标准
 * @returns {{ level, score, rawValue, unit, standard }|null}
 */
export const evaluateScore = (eventOrSportType, rawValue, standards = DEFAULT_SCORE_STANDARDS) => {
  let standard = null
  if (typeof eventOrSportType === 'number' || /^\d+$/.test(String(eventOrSportType))) {
    standard = findStandardBySportType(eventOrSportType, standards)
  } else {
    standard = findStandardByEvent(String(eventOrSportType), standards)
  }
  if (!standard) return null

  let value = Number(rawValue)
  if (!isFinite(value)) return null

  // 大沩立定跳远以厘米推送，评分标准以米
  if (standard.unit === '米' && value > 10) {
    value = value / 100
  }

  const rules = standard.rules || []
  if (!rules.length) return null

  let rule = rules.find(r => value >= r.minValue && value <= r.maxValue)
  if (!rule) {
    const sorted = [...rules].sort((a, b) => a.minValue - b.minValue)
    const best = standard.lowerIsBetter ? sorted[0] : sorted[sorted.length - 1]
    const worst = standard.lowerIsBetter ? sorted[sorted.length - 1] : sorted[0]
    if (standard.lowerIsBetter) {
      rule = value < best.minValue ? best : worst
    } else {
      rule = value > best.maxValue ? best : worst
    }
  }

  const span = rule.maxValue - rule.minValue
  let ratio = span > 0 ? (value - rule.minValue) / span : 1
  ratio = clamp(ratio, 0, 1)
  if (standard.lowerIsBetter) ratio = 1 - ratio

  const score = Math.round(rule.scoreMin + ratio * (rule.scoreMax - rule.scoreMin))

  return {
    level: rule.level,
    score,
    rawValue: value,
    unit: standard.unit,
    standard
  }
}

/** 统一时间格式：YYYY-MM-DD HH:mm（与大沩 start_time 对齐） */
export const formatExamDate = (timestamp) => {
  const d = timestamp ? new Date(Number(timestamp)) : new Date()
  if (isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default {
  DEFAULT_SCORE_STANDARDS,
  SPORT_TYPE_EVENT_MAP,
  getScoreStandards,
  findStandardByEvent,
  findStandardBySportType,
  evaluateScore,
  formatExamDate
}
