/**
 * StudentManagement 页面常量/字典
 * 从组件中抽离的静态数据
 */

// 年级选项
export const GRADE_OPTIONS = [
  { label: '全部年级', value: 'all' },
  { label: '一年级', value: '一年级' },
  { label: '二年级', value: '二年级' },
  { label: '三年级', value: '三年级' },
  { label: '四年级', value: '四年级' },
  { label: '五年级', value: '五年级' },
  { label: '六年级', value: '六年级' }
]

// 班级类型选项
export const CLASS_TYPE_OPTIONS = [
  { label: '行政班', value: '行政班' },
  { label: '分项班', value: '分项班' }
]

// 默认列设置
export const DEFAULT_COLUMN_SETTINGS = [
  'selection', 'id', 'studentInfo', 'gender', 'grade', 'class',
  'age', 'faceRegistered', 'testStatus', 'sportsInterest', 'itemClass', 'actions'
]

// 默认新建学生表单
export const DEFAULT_STUDENT_FORM = {
  id: '',
  name: '',
  gender: '男',
  grade: '',
  class: '',
  age: 8,
  classType: '行政班'
}

// 默认新建班级表单
export const DEFAULT_CLASS_FORM = {
  name: '',
  type: '行政班',
  grade: '',
  classNum: '',
  teacher: ''
}

// 性别映射（前端 → API）
export const GENDER_MAP = { '男': 1, '女': 2, '未知': 0 }

// 年级映射（中文 → 数字）
export const GRADE_MAP = {
  '一年级': 1, '二年级': 2, '三年级': 3,
  '四年级': 4, '五年级': 5, '六年级': 6
}

// 体育兴趣选项
export const SPORTS_INTERESTS = [
  '篮球', '足球', '田径', '跳绳', '游泳', '羽毛球', '乒乓球', '体操'
]

// 可编辑的表格列
export const EDITABLE_PROPS = ['id', 'grade', 'class', 'age', 'sportsInterest']

// 导入模板数据
export const IMPORT_TEMPLATE_DATA = [
  ['学号', '姓名', '性别', '年级', '班级', '年龄', '体育兴趣'],
  ['stu-001', '张三', '男', '一年级', '1班', '8', '篮球'],
  ['stu-002', '李四', '女', '一年级', '1班', '8', '跳绳'],
  ['stu-003', '王五', '男', '二年级', '2班', '9', '足球']
]

// 批量导出表头
export const EXPORT_HEADERS = ['学号', '姓名', '性别', '年级', '班级', '年龄', '体育兴趣', '面部信息']

// 生成外部学生数据用的姓名库
export const NAME_POOL = {
  lastNames: ['张', '李', '王', '刘', '陈', '杨', '赵', '黄', '周', '吴', '徐', '孙', '马', '朱', '胡'],
  firstNames: ['伟', '强', '敏', '静', '磊', '芳', '洋', '军', '勇', '艳', '杰', '涛', '明', '超', '秀', '敏', '娜', '丽', '平', '刚']
}

// 年级列表（纯数据）
export const GRADES = ['一年级', '二年级', '三年级', '四年级', '五年级', '六年级']

// 班级号列表
export const CLASS_NUMS = ['1班', '2班', '3班', '4班', '5班', '6班']
