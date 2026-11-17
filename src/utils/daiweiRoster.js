import { getClassList, getStudentListV4 } from '@/utils/daiweiApi'

// 大沩学生花名册：推送成绩里的 person_id 就是大沩 student_id，用它反查姓名和班级
const cache = new Map()
const TTL = 10 * 60 * 1000
const PAGE_SIZE = 500

function flattenClasses(nodes, map, ctx = { grade: '' }) {
  for (const node of nodes || []) {
    const deptId = node.dept_id || node.deptId
    if (!deptId) continue
    const grade = node.type === 3 ? (node.name || '') : ctx.grade
    map[deptId] = {
      type: node.type,
      name: node.name || '',
      grade
    }
    flattenClasses(node.children, map, { grade })
  }
}

async function fetchAllStudents(localSchoolId) {
  const all = []
  let page = 1
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await getStudentListV4({ page, size: PAGE_SIZE }, localSchoolId)
    const list = res?.list || []
    all.push(...list)
    if (!list.length || all.length >= (res.total || 0) || list.length < PAGE_SIZE) break
    page++
  }
  return all
}

export async function loadSchoolRoster(localSchoolId, { force = false } = {}) {
  const cached = cache.get(localSchoolId)
  if (!force && cached && Date.now() - cached.time < TTL) {
    return cached.map
  }

  const [classRes, students] = await Promise.all([
    getClassList({ dept_id: '-1', recursion: 1 }, localSchoolId),
    fetchAllStudents(localSchoolId)
  ])

  const classMap = {}
  flattenClasses(classRes?.data || [], classMap, [])

  const map = new Map()
  for (const s of students) {
    const studentId = s.student_id || s.studentId
    if (!studentId) continue
    const cls = classMap[s.class_id] || {}
    map.set(studentId, {
      id: studentId,
      name: s.name || '',
      gender: s.gender,
      classId: s.class_id || '',
      grade: cls.grade || '',
      class: cls.name && cls.type === 4 ? cls.name : '',
      faceUrl: s.cimg_url || ''
    })
  }

  cache.set(localSchoolId, { time: Date.now(), map })
  return map
}
