export const daiweiConfig = {
  // 开发环境: 使用绝对路径（Vite proxy 会处理）
  // 生产环境: 使用相对路径（nginx 反向代理会处理）
  baseUrl: import.meta.env.DEV
    ? (import.meta.env.VITE_DAIWEI_API_BASE_URL || 'https://daweiai.net/organization_management_cloud')
    : '/organization_management_cloud',
  accessKeyId: import.meta.env.VITE_DAIWEI_ACCESS_KEY_ID || '02d35720-e06c-11f0-a221-4156b3d8eb4d',
  accessKeySecret: import.meta.env.VITE_DAIWEI_ACCESS_KEY_SECRET || 's2xbjWfNkZmZiCRiMNPsf8BGMe7AwbeJ',
  enabled: import.meta.env.VITE_DAIWEI_ENABLED === 'false' ? false : true
}

export const schoolMapping = {
  'hailin-second-primary': {
    daiweiSchoolId: '9e3bfcd0-4b7e-11f1-866e-1deb8b635fb2',
    enabled: true
  },
  'hailin-zirong-primary': {
    daiweiSchoolId: null,
    enabled: false
  },
  'linhai-experimental-primary': {
    daiweiSchoolId: null,
    enabled: false
  }
}

export const getSchoolConfig = (localSchoolId) => {
  const mapping = schoolMapping[localSchoolId]
  if (!mapping || !mapping.enabled || !mapping.daiweiSchoolId) {
    return null
  }
  return {
    ...daiweiConfig,
    schoolId: mapping.daiweiSchoolId
  }
}