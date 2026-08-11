const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const config = require('../config')

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true })
  }
}

function getDateStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function saveSportResult(data) {
  const schoolId = data.school_id || 'default'
  const dirPath = path.join(config.dataDir, schoolId)
  ensureDir(dirPath)

  const filePath = path.join(dirPath, `${getDateStr()}.json`)

  let existingData = []
  if (fs.existsSync(filePath)) {
    try {
      existingData = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
    } catch (e) {
      existingData = []
    }
  }

  const record = {
    id: crypto.randomUUID(),
    version: data.version,
    school_id: data.school_id,
    product_type: data.product_type,
    sport_type: data.sport_type,
    mode: data.mode,
    sport_result: data.sport_result,
    received_at: Date.now()
  }

  existingData.push(record)
  fs.writeFileSync(filePath, JSON.stringify(existingData, null, 2), 'utf-8')
  return record
}

function querySportResults(schoolId, filters = {}) {
  const dirPath = path.join(config.dataDir, schoolId || '')
  if (!fs.existsSync(dirPath)) return []

  const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.json')).sort().reverse()
  let allResults = []

  for (const file of files) {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf-8'))
      allResults = allResults.concat(data)
    } catch (e) {}
  }

  if (filters.sport_type) {
    allResults = allResults.filter(r => r.sport_type === Number(filters.sport_type))
  }
  if (filters.mode) {
    allResults = allResults.filter(r => r.mode === Number(filters.mode))
  }
  if (filters.product_type) {
    allResults = allResults.filter(r => r.product_type === Number(filters.product_type))
  }

  return allResults.sort((a, b) => b.received_at - a.received_at)
}

module.exports = { saveSportResult, querySportResults }
