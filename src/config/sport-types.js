export const SPORT_TYPES = {
  1: { key: 'rope_skipping', name: '跳绳', unit: '个', scoreType: 'count', hasTime: true, hasSubCount: true },
  2: { key: 'long_jump', name: '跳远', unit: 'cm', scoreType: 'distance', hasJumpMetrics: true },
  3: { key: 'touch_high', name: '摸高', unit: 'cm', scoreType: 'height' },
  4: { key: 'pull_up', name: '引体向上', unit: '个', scoreType: 'count' },
  5: { key: 'jumping_jack', name: '开合跳', unit: '个', scoreType: 'count', hasTime: true, hasSubCount: true },
  6: { key: 'sit_up', name: '仰卧起坐', unit: '个', scoreType: 'count', hasTime: true, hasSubCount: true },
  7: { key: 'high_knee', name: '高抬腿', unit: '个', scoreType: 'count' },
  8: { key: 'sit_and_reach', name: '坐位体前屈', unit: 'cm', scoreType: 'flexibility' },
  9: { key: 'vital_capacity', name: '肺活量', unit: 'ml', scoreType: 'volume' },
  10: { key: 'bmi', name: 'BMI', unit: '指数', scoreType: 'index', hasBodyMetrics: true },
  11: { key: 'fifty_m', name: '50米跑', unit: '秒', scoreType: 'time', hasReaction: true },
  12: { key: 'hundred_m', name: '100米跑', unit: '秒', scoreType: 'time', hasReaction: true },
  13: { key: 'fifty_m_x8', name: '50米×8', unit: '秒', scoreType: 'time', hasReaction: true },
  14: { key: 'eight_hundred_m', name: '800米跑', unit: '秒', scoreType: 'time', hasReaction: true },
  15: { key: 'thousand_m', name: '1000米跑', unit: '秒', scoreType: 'time', hasReaction: true },
  16: { key: 'volleyball', name: '排球', unit: '个', scoreType: 'count' },
  17: { key: 'squat', name: '深蹲', unit: '个', scoreType: 'count' },
  18: { key: 'quadrant_jump', name: '象限跳', unit: '个', scoreType: 'count' },
  19: { key: 'sunshine_run', name: '阳光跑', unit: '米', scoreType: 'distance', hasTime: true },
  20: { key: 'football', name: '足球', unit: '秒', scoreType: 'time' },
  21: { key: 'basketball', name: '篮球', unit: '秒', scoreType: 'time' },
  22: { key: 'medicine_ball', name: '实心球', unit: '米', scoreType: 'distance' },
  23: { key: 'left_right_jump', name: '左右跳', unit: '个', scoreType: 'count' }
}

export const PRODUCT_TYPES = {
  1: { key: 'ai_sports_bar', name: 'AI运动吧' },
  2: { key: 'ai_fitness_bar', name: 'AI体测吧' },
  3: { key: 'ai_playground', name: 'AI操场吧' }
}

export const SPORT_MODES = {
  1: { key: 'practice', name: '练习模式' },
  2: { key: 'exam', name: '测试模式' }
}

export function getSportTypeName(type) {
  return SPORT_TYPES[type]?.name || '未知'
}

export function getSportTypeUnit(type) {
  return SPORT_TYPES[type]?.unit || ''
}

export function getProductTypeName(type) {
  return PRODUCT_TYPES[type]?.name || '未知'
}

export function getModeName(mode) {
  return SPORT_MODES[mode]?.name || '未知'
}
