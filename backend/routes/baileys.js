const express = require('express')
const router = express.Router()
const baileysService = require('../services/baileysService')
require('dotenv').config()

router.get('/api/baileys/status', (req, res) => {
  const sock = baileysService.getSock()
  res.json({
    status: baileysService.getState(),
    phoneNumber: sock?.user?.id?.split(':')[0] || null
  })
})

router.post('/api/baileys/connect', async (req, res) => {
  const sessionDir = process.env.BAILEYS_SESSION_DIR || './sessions'
  try {
    baileysService.connect(sessionDir).catch(err => console.error('Baileys bg error:', err))
    res.json({ ok: true, message: 'Connecting... watch for QR event on socket' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/api/baileys/disconnect', async (req, res) => {
  try {
    await baileysService.disconnect()
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/api/baileys/send', async (req, res) => {
  const { to, text } = req.body
  if (!to || !text) return res.status(400).json({ error: 'to and text required' })
  try {
    const result = await baileysService.sendText(to, text)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
