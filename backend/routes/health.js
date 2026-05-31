const express = require('express')
const router = express.Router()
const db = require('../db/database')
const baileysService = require('../services/baileysService')

router.get('/api/health', (req, res) => {
  let dbStatus = 'ok'
  try { db.get('SELECT 1') } catch { dbStatus = 'error' }
  res.json({ ok: true, version: '1.0.0', db: dbStatus, baileys: baileysService.getState() })
})

module.exports = router
