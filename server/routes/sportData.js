const express = require('express')
const { verifyPushSign } = require('../middleware/auth')
const sportDataController = require('../controllers/sportDataController')

const router = express.Router()

router.post('/push', verifyPushSign, sportDataController.push)
router.get('/list', sportDataController.list)
router.get('/stats/today', sportDataController.todayStats)
router.get('/ranking', sportDataController.ranking)
router.get('/statistics', sportDataController.statistics)

module.exports = router
