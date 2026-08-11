const fs = require('fs')
const path = require('path')
const config = require('../config')

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function saveFile(file, schoolId = 'default') {
  const dirPath = path.join(config.fileDir, schoolId)
  ensureDir(dirPath)

  const ext = path.extname(file.originalname)
  const filename = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`
  const filePath = path.join(dirPath, filename)

  fs.writeFileSync(filePath, file.buffer)

  return {
    url: `/uploads/${schoolId}/${filename}`,
    filename,
    size: file.size
  }
}

function validateFileType(fileType) {
  return config.allowedFileTypes.includes(Number(fileType))
}

module.exports = { saveFile, validateFileType }
