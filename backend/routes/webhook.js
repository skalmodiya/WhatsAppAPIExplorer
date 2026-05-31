const express = require('express')
const router = express.Router()
const { processInboundMessage, saveWebhookEvent } = require('../services/webhookProcessor')
require('dotenv').config()

router.get('/webhook', (req, res) => {
  const mode = req.query['hub.mode']
  const token = req.query['hub.verify_token']
  const challenge = req.query['hub.challenge']
  const verifyToken = process.env.WEBHOOK_VERIFY_TOKEN || 'whatsapp_explorer_verify'

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Meta webhook verified')
    return res.status(200).send(challenge)
  }
  res.status(403).send('Forbidden')
})

router.post('/webhook', (req, res) => {
  res.status(200).send('OK')
  const body = req.body
  if (body.object !== 'whatsapp_business_account') return
  saveWebhookEvent(body)
  for (const entry of body.entry || []) {
    processInboundMessage(entry, 'meta')
  }
})

module.exports = router
