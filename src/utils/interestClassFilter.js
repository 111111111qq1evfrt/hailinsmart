/**
 * 分项班/兴趣班过滤工具
 * 用于判断班级选项是否为分项班，以及根据分项班名称匹配学生
 */

/**
 * 判断一个班级名是否为分项班/兴趣班（排除分隔符）
 */
export function isInterestClass(className) {
  if (!className || className.startsWith('---')) return false
  return (
    className.endsWith('分项班') ||
    className.endsWith('兴趣班') ||
    className === '艺术体操班' ||
    className === '科学实验班'
  )
}

/**
 * 从分项班名称中提取关键词
 * 例：'田径分项班' → '田径'，'足球兴趣班' → '足球'，'科学实验班' → '科学实验'
 */
function extractKeyword(className) {
  return className
    .replace(/分项班$|兴趣班$|班$/, '')
    .trim()
}

/**
 * 根据分项班名称，从学生列表中找出匹配的学生
 * 匹配逻辑：
 *   1. 先尝试精确匹配 sportsInterest === keyword
 *   2. 无结果时尝试双向包含匹配（处理 '科学实验' ↔ '科学实验班' 等情况）
 */
export function getMatchingStudents(interestClassName, students) {
  if (!isInterestClass(interestClassName)) return []

  const keyword = extractKeyword(interestClassName)

  // 先尝试精确匹配
  let matches = students.filter(s => s.sportsInterest === keyword)

  // 精确匹配无结果时，尝试双向包含匹配
  if (matches.length === 0) {
    matches = students.filter(s =>
      s.sportsInterest && (
        s.sportsInterest.includes(keyword) ||
        keyword.includes(s.sportsInterest)
      )
    )
  }

  return matches
}

/**
 * 根据分项班名称，返回匹配学生的 ID 集合（Set）
 * 方便在记录过滤时快速查找
 */
export function getMatchingStudentIds(interestClassName, students) {
  const matching = getMatchingStudents(interestClassName, students)
  return new Set(matching.map(s => s.id))
}

/**
 * 根据分项班名称，返回匹配学生所属的行政班 className 集合
 * 用于 StudentData 等按班级聚合的页面
 */
export function getMatchingClassNames(interestClassName, students) {
  const matching = getMatchingStudents(interestClassName, students)
  return new Set(matching.map(s => `${s.grade || ''}${s.class || ''}`))
}
