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

  // 根据 body 里的 school_id 匹配对应 check_string，兜底用默认值
  const schoolId = (req.body && (req.body.school_id || req.body.schoolId)) || ''
  const checkString = (schoolId && config.schoolCheckStrings[schoolId]) || config.checkString

  const expectedSign = crypto
    .createHash('md5')
    .update(checkString + timestamp)
    .digest('hex')
    .toLowerCase()

  if (sign !== expectedSign) {
    return res.status(200).json({ code: '-1', message: '签名验证失败' })
  }

  // 把解析到的 school_id 和 checkString 挂到 req 上，方便后续使用
  req.daiweiSchoolId = schoolId
  req.usedCheckString = checkString

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
