const sportDataService = require('../services/sportDataService')

const sportDataController = {
  async push(req, res) {
    try {
      const data = req.body

      if (!data || !data.school_id || !data.sport_type || !data.mode || !Array.isArray(data.sport_result)) {
        return res.json({ code: '10001', message: '参数错误：缺少必填字段', data: null })
      }

      if (!data.sport_result.length) {
        return res.json({ code: '10001', message: '参数错误：sport_result不能为空数组', data: null })
      }

      for (const item of data.sport_result) {
        if (!item.person_id && item.person_id !== '') {
          return res.json({ code: '10001', message: '参数错误：person_id必填', data: null })
        }
      }

      const result = await sportDataService.createSportResult(data)
      res.json({ code: '0', message: 'success', data: { id: result.id } })
    } catch (err) {
      console.error('[CONTROLLER] sportData.push error:', err.message)
      res.json({ code: '50001', message: '服务器内部错误', data: null })
    }
  },

  async list(req, res) {
    try {
      const { school_id, sport_type, mode, product_type } = req.query
      if (!school_id) {
        return res.json({ code: '10001', message: '参数错误：school_id必填', data: null })
      }

      const list = await sportDataService.getSportResults(school_id, { sport_type, mode, product_type })
      res.json({ code: '0', message: 'success', data: { list, total: list.length } })
    } catch (err) {
      console.error('[CONTROLLER] sportData.list error:', err.message)
      res.json({ code: '50001', message: '服务器内部错误', data: null })
    }
  },

  async todayStats(req, res) {
    try {
      const { school_id } = req.query
      if (!school_id) {
        return res.json({ code: '10001', message: '参数错误：school_id必填', data: null })
      }

      const stats = await sportDataService.getTodayStats(school_id)
      res.json({ code: '0', message: 'success', data: stats })
    } catch (err) {
      console.error('[CONTROLLER] sportData.todayStats error:', err.message)
      res.json({ code: '50001', message: '服务器内部错误', data: null })
    }
  },

  async ranking(req, res) {
    try {
      const { school_id, sport_type, limit } = req.query

      if (!school_id) {
        return res.json({ code: '10001', message: '参数错误：school_id必填', data: null })
      }
      if (!sport_type) {
        return res.json({ code: '10001', message: '参数错误：运动类型必填', data: null })
      }

      const rankingList = await sportDataService.getRanking(school_id, Number(sport_type), Number(limit) || 500)
      res.json({ code: '0', message: 'success', data: { list: rankingList, total: rankingList.length } })
    } catch (err) {
      console.error('[CONTROLLER] sportData.ranking error:', err.message)
      res.json({ code: '50001', message: '服务器内部错误', data: null })
    }
  },

  async statistics(req, res) {
    try {
      const { school_id } = req.query
      if (!school_id) {
        return res.json({ code: '10001', message: '参数错误：school_id必填', data: null })
      }

      const stats = await sportDataService.getStatistics(school_id)
      res.json({ code: '0', message: 'success', data: stats })
    } catch (err) {
      console.error('[CONTROLLER] sportData.statistics error:', err.message)
      res.json({ code: '50001', message: '服务器内部错误', data: null })
    }
  }
}

module.exports = sportDataController
