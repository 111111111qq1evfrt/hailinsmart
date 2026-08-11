import { mockDB } from '../index'

const toUsername = (name) => {
  const map = {
    白燕: 'baiyan',
    卜琳娜: 'bulina',
    曹琳琳: 'caolinlin',
    卢伟珍: 'luweizhen',
    高霞: 'gaoxia',
    乔晶: 'qiaojing',
    宋丽君: 'songlijun',
    于化龙: 'yuhualong',
    宫秋楠: 'gongqiunan',
    马建华: 'majiahua',
    陈秀英: 'chenxiuying',
    王海燕: 'wanghaiyan',
    张志远: 'zhangzhiyuan'
  }
  return map[name] || `user_${name}`
}

const buildTeacherUsers = (schoolId, schoolName, teachers, options = {}) => {
  const { classAssignments = [], disabledNames = [] } = options
  return teachers.map((teacher, index) => ({
    id: `${schoolId}-T${String(index + 1).padStart(3, '0')}`,
    username: toUsername(teacher.name),
    name: teacher.name,
    role: 'teacher',
    school: schoolName,
    className: classAssignments[index] || `${teacher.grade || '全校'}体育组`,
    email: `${toUsername(teacher.name)}@school.com`,
    phone: teacher.phone || '',
    status: disabledNames.includes(teacher.name) ? 'disabled' : 'active',
    createTime: `2024-09-${String(Math.min(index + 1, 28)).padStart(2, '0')} 09:00`
  }))
}

const schoolUserDefaults = {
  'hailin-second-primary': [
    {
      id: 'staff-7459465505103941632',
      username: '+8618746322233',
      name: '白燕',
      role: 'school',
      school: '海林市第二小学',
      className: '',
      email: 'baiyan@school.com',
      phone: '+8618746322233',
      status: 'active',
      createTime: '2026-07-23 07:32'
    },
    {
      id: 'staff-7459465502448947200',
      username: '+8613303634456',
      name: '卜琳娜',
      role: 'school',
      school: '海林市第二小学',
      className: '',
      email: 'bulina@school.com',
      phone: '+8613303634456',
      status: 'active',
      createTime: '2026-07-23 07:32'
    },
    {
      id: 'staff-7459465506626473984',
      username: '+8613614636556',
      name: '曹琳琳',
      role: 'school',
      school: '海林市第二小学',
      className: '',
      email: 'caolinlin@school.com',
      phone: '+8613614636556',
      status: 'active',
      createTime: '2026-07-23 07:32'
    }
  ],
  'hailin-zirong-primary': [
    {
      id: 'zr-D001',
      username: 'zr-district',
      name: '刘区长',
      role: 'district',
      school: '海林市子荣小学',
      className: '',
      email: 'liu-district@zirong.com',
      phone: '13900139000',
      status: 'active',
      createTime: '2026-09-01 08:00'
    },
    {
      id: 'zr-U001',
      username: 'zr-admin',
      name: '赵校长',
      role: 'school',
      school: '海林市子荣小学',
      className: '',
      email: 'zhao@zirong.com',
      phone: '13900139001',
      status: 'active',
      createTime: '2026-09-01 09:00'
    },
    {
      id: 'zr-CA001',
      username: 'zr-campus',
      name: '周代理',
      role: 'campus',
      school: '海林市子荣小学',
      className: '',
      email: 'zhou-campus@zirong.com',
      phone: '13900139002',
      status: 'active',
      createTime: '2026-09-01 09:15'
    },
    {
      id: 'zr-AT001',
      username: 'zr-admin-teacher',
      name: '吴老师',
      role: 'admin_teacher',
      school: '海林市子荣小学',
      className: '教务处',
      email: 'wu-admin@zirong.com',
      phone: '13900139003',
      status: 'active',
      createTime: '2026-09-01 09:30'
    },
    {
      id: 'zr-C001',
      username: 'chenxiuying',
      name: '陈秀英',
      role: 'class',
      school: '海林市子荣小学',
      className: '全校体育统筹',
      email: 'chenxiuying@zirong.com',
      phone: '13900139004',
      status: 'active',
      createTime: '2026-09-01 10:00'
    },
    ...buildTeacherUsers(
      'zr',
      '海林市子荣小学',
      [
        { name: '马建华', phone: '13900139002', grade: '体育组' },
        { name: '陈秀英', phone: '13900139003', grade: '体育组' },
        { name: '孙老师', phone: '13900139004', grade: '一年级' },
        { name: '李老师', phone: '13900139005', grade: '二年级' },
        { name: '周老师', phone: '13900139006', grade: '三年级' },
        { name: '吴老师', phone: '13900139007', grade: '四年级' },
        { name: '郑老师', phone: '13900139008', grade: '五年级' },
        { name: '黄老师', phone: '13900139009', grade: '六年级' }
      ],
      {
        classAssignments: [
          '全校体育统筹',
          '全校体育统筹',
          '一年级(1-2班)',
          '二年级(1-2班)',
          '三年级(1-2班)',
          '四年级(1-2班)',
          '五年级(1-2班)',
          '六年级(1-2班)'
        ]
      }
    )
  ],
  'linhai-experimental-primary': [
    {
      id: 'lh-D001',
      username: 'lh-district',
      name: '刘区长',
      role: 'district',
      school: '林海实验小学',
      className: '',
      email: 'liu-district@linhai.com',
      phone: '13800138010',
      status: 'active',
      createTime: '2026-09-01 08:00'
    },
    {
      id: 'lh-U001',
      username: 'lh-admin',
      name: '林校长',
      role: 'school',
      school: '林海实验小学',
      className: '',
      email: 'lin@linhai.com',
      phone: '13800138011',
      status: 'active',
      createTime: '2026-09-01 09:00'
    },
    {
      id: 'lh-CA001',
      username: 'lh-campus',
      name: '郑代理',
      role: 'campus',
      school: '林海实验小学',
      className: '',
      email: 'zheng-campus@linhai.com',
      phone: '13800138012',
      status: 'active',
      createTime: '2026-09-01 09:15'
    },
    {
      id: 'lh-AT001',
      username: 'lh-admin-teacher',
      name: '王老师',
      role: 'admin_teacher',
      school: '林海实验小学',
      className: '教务处',
      email: 'wang-admin@linhai.com',
      phone: '13800138013',
      status: 'active',
      createTime: '2026-09-01 09:30'
    },
    {
      id: 'lh-C001',
      username: 'zhangzhiyuan',
      name: '张志远',
      role: 'class',
      school: '林海实验小学',
      className: '全校体育统筹',
      email: 'zhangzhiyuan@linhai.com',
      phone: '13800138014',
      status: 'active',
      createTime: '2026-09-01 10:00'
    },
    ...buildTeacherUsers(
      'lh',
      '林海实验小学',
      [
        { name: '王海燕', phone: '13800138012', grade: '体育组' },
        { name: '张志远', phone: '13800138013', grade: '体育组' },
        { name: '刘老师', phone: '13800138014', grade: '一年级' },
        { name: '陈老师', phone: '13800138015', grade: '二年级' },
        { name: '杨老师', phone: '13800138016', grade: '三年级' },
        { name: '郭老师', phone: '13800138017', grade: '四年级' },
        { name: '周老师', phone: '13800138018', grade: '五年级' },
        { name: '许老师', phone: '13800138019', grade: '六年级' }
      ],
      {
        classAssignments: [
          '全校体育统筹',
          '全校体育统筹',
          '一年级(1-2班)',
          '二年级(1-2班)',
          '三年级(1-2班)',
          '四年级(1-3班)',
          '五年级(1-3班)',
          '六年级(1-2班)'
        ]
      }
    )
  ]
}

export const getDefaultUsersForSchool = (schoolId) => {
  const defaults = schoolUserDefaults[schoolId]
  if (defaults) {
    return defaults.map(user => ({ ...user }))
  }
  const schoolName = mockDB[schoolId]?.schoolInfo?.name || '海林市第二小学'
  return schoolUserDefaults['hailin-second-primary'].map(user => ({
    ...user,
    school: schoolName
  }))
}

export const getSchoolNameById = (schoolId) => {
  return mockDB[schoolId]?.schoolInfo?.name || '海林市第二小学'
}
