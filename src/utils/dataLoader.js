/**
 * 数据加载工具
 * 用于从public文件夹加载Excel数据并转换为应用所需格式
 */

// 模拟从Excel加载的家校通讯录数据
// 实际项目中应该使用xlsx库读取Excel文件
export const loadContactData = async () => {
  // 这里模拟从Excel读取的数据结构
  // 实际使用时，可以通过fetch或xlsx库读取public文件夹中的Excel文件
  return {
    students: [],
    parents: [],
    teachers: []
  }
}

// 模拟从Excel加载的教师统计数据
export const loadTeacherStats = async () => {
  return {
    teachers: [],
    statistics: {}
  }
}

// 扩展现有mock数据，添加Excel中的真实数据
export const mergeWithMockData = (excelData, mockData) => {
  // 保留mock数据中的完整字段
  // 用Excel数据中的姓名和手机号替换mock数据中的对应字段
  return mockData.map((item, index) => {
    if (excelData[index]) {
      return {
        ...item,
        name: excelData[index].name || item.name,
        phone: excelData[index].phone || item.phone,
        // 保留其他所有字段
      }
    }
    return item
  })
}
