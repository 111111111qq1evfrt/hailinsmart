const express = require('express')
const multer = require('multer')
const fileController = require('../controllers/fileController')
const config = require('../config')

const router = express.Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: config.maxFileSize } })

router.post('/upload', upload.single('file'), fileController.upload)

module.exports = router
