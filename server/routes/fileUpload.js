const express = require('express')
const multer = require('multer')
const fileController = require('../controllers/fileController')
const { verifyPushSign } = require('../middleware/auth')
const config = require('../config')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxFileSize } })

// multer 先解析 form-data（这样 req.body 里才有 school_id），再校验签名
router.post('/push', upload.single('file'), verifyPushSign, fileController.upload)

module.exports = router
