import schoolAStudents from './hailin-second-primary/students'
import schoolATeachers from './hailin-second-primary/teachers'
import schoolAClasses from './hailin-second-primary/classes'
import schoolASystemStats from './hailin-second-primary/systemStats'

import schoolBStudents from './hailin-zirong-primary/students'
import schoolBTeachers from './hailin-zirong-primary/teachers'
import schoolBClasses from './hailin-zirong-primary/classes'
import schoolBSystemStats from './hailin-zirong-primary/systemStats'

import schoolCStudents from './linhai-experimental-primary/students'
import schoolCTeachers from './linhai-experimental-primary/teachers'
import schoolCClasses from './linhai-experimental-primary/classes'
import schoolCSystemStats from './linhai-experimental-primary/systemStats'

export const mockDB = {
  'hailin-second-primary': {
    schoolInfo: {
      id: 'hailin-second-primary',
      name: '海林市第二小学',
      logo: '🏫',
      primaryColor: '#1E5AA8',
      secondaryColor: '#F5A623'
    },
    students: schoolAStudents,
    teachers: schoolATeachers,
    classes: schoolAClasses,
    systemStats: schoolASystemStats
  },
  'hailin-zirong-primary': {
    schoolInfo: {
      id: 'hailin-zirong-primary',
      name: '海林市子荣小学',
      logo: '🏢',
      primaryColor: '#2563EB',
      secondaryColor: '#F97316'
    },
    students: schoolBStudents,
    teachers: schoolBTeachers,
    classes: schoolBClasses,
    systemStats: schoolBSystemStats
  },
  'linhai-experimental-primary': {
    schoolInfo: {
      id: 'linhai-experimental-primary',
      name: '林海实验小学',
      logo: '🏛️',
      primaryColor: '#059669',
      secondaryColor: '#EAB308'
    },
    students: schoolCStudents,
    teachers: schoolCTeachers,
    classes: schoolCClasses,
    systemStats: schoolCSystemStats
  }
}

export const getSchoolData = (schoolId) => {
  return mockDB[schoolId] || mockDB['hailin-second-primary']
}

export const getSchoolList = () => {
  return Object.keys(mockDB).map(key => ({
    id: key,
    name: mockDB[key].schoolInfo.name,
    logo: mockDB[key].schoolInfo.logo,
    primaryColor: mockDB[key].schoolInfo.primaryColor,
    secondaryColor: mockDB[key].schoolInfo.secondaryColor
  }))
}