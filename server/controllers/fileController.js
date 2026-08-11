const fileService = require('../services/fileService')

const fileController = {
  async upload(req, res) {
    try {
      const { school_id, file_type } = req.body
      if (!school_id) {
        return res.json({ code: '10001', message: '参数错误', data: null })
      }

      const result = await fileService.handleFileUpload(req.file, school_id, file_type)
      res.json({ code: '0', message: 'success', data: result })
    } catch (err) {
      console.error('[CONTROLLER] file.upload error:', err.message)
      const msg = err.message === '不支持的文件类型' || err.message === '文件不能为空'
        ? err.message
        : '服务器内部错误'
      res.json({ code: msg === '服务器内部错误' ? '50001' : '10001', message: msg, data: null })
    }
  }
}

module.exports = fileController
