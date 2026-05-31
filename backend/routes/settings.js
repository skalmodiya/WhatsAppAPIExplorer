const express = require('express')
const router = express.Router()
const db = require('../db/database')

router.get('/api/settings', (req, res) => {
  const rows = db.query('SELECT key, value FROM settings')
  const result = {}
  for (const row of rows) result[row.key] = row.value
  res.json(result)
})

router.put('/api/settings', (req, res) => {
  const { key, value } = req.body
  if (!key) return res.status(400).json({ error: 'key required' })
  db.setSetting(key, value ?? '')
  res.json({ ok: true })
})

module.exports = router
