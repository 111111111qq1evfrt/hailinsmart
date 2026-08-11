const crypto = require('crypto')
const config = require('../config')

const activeTokens = new Map()

function verifyPushSign(req, res, next) {
  const timestamp = req.headers['timestamp']
  const sign = req.headers['sign']

  if (!timestamp || !sign) {
    return res.status(200).json({ code: '-1', message: '缺少签名参数' })
  }

  const now = Date.now()
  const diff = Math.abs(now - Number(timestamp))
  if (diff > config.timestampTolerance) {
    return res.status(200).json({ code: '-1', message: '时间戳过期' })
  }

  const expectedSign = crypto
    .createHash('md5')
    .update(config.checkString + timestamp)
    .digest('hex')
    .toLowerCase()

  if (sign !== expectedSign) {
    return res.status(200).json({ code: '-1', message: '签名验证失败' })
  }

  next()
}

function apiAuth(req, res, next) {
  const token = req.headers['authorization']
  if (!token) {
    return res.status(200).json({ code: '-1', message: '未认证' })
  }
  next()
}

module.exports = { verifyPushSign, apiAuth }
