const config = require('../config')
const sportFileDao = require('../dao/sportFileDao')

function generateFileId() {
  return 'file_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
}

const fileService = {
  async handleFileUpload(file, schoolId, fileType) {
    if (!file) {
      throw new Error('文件不能为空')
    }
    
    if (fileType !== 1 && fileType !== 2) {
      throw new Error('不支持的文件类型')
    }
    
    const fileId = generateFileId()
    
    const fileData = {
      file_id: fileId,
      school_id: schoolId,
      file_type: fileType,
      file_name: file.originalname,
      file_size: file.size,
      file_path: file.path,
      mime_type: file.mimetype
    }
    
    const id = await sportFileDao.insert(fileData)
    
    return {
      id,
      file_id: fileId,
      file_name: file.originalname,
      file_size: file.size,
      file_path: file.path,
      upload_url: `/uploads/${schoolId}/${fileId}`
    }
  },
  
  async getFileByFileId(fileId) {
    return sportFileDao.findByFileId(fileId)
  },
  
  async listFilesBySchool(schoolId, options = {}) {
    return sportFileDao.listBySchool(schoolId, options)
  }
}

module.exports = fileService
