const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const MetaWhatsApp = require('../services/metaWhatsApp')
const baileysService = require('../services/baileysService')
const db = require('../db/database')
const { upsertContact, upsertConversation } = require('../services/webhookProcessor')
const { getIo } = require('../socket/socketManager')

function getMeta(req) {
  const token = req.headers['x-wa-token'] || process.env.WHATSAPP_TOKEN
  const phoneNumberId = req.headers['x-phone-number-id'] || process.env.WHATSAPP_PHONE_NUMBER_ID
  return new MetaWhatsApp({ token, phoneNumberId })
}

function saveOutbound(conversationId, contactId, type, content, source, msgId) {
  const now = new Date().toISOString()
  db.run(
    'INSERT OR IGNORE INTO messages (id, conversation_id, contact_id, direction, message_type, content, status, source, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [msgId || uuidv4(), conversationId, contactId, 'outbound', type, content, 'sent', source, now, now]
  )
  db.run('UPDATE conversations SET last_message_at = ?, updated_at = ? WHERE id = ?', [now, now, conversationId])
  const io = getIo()
  if (io) io.emit('wa:message', { id: msgId, conversationId, contactId, direction: 'outbound', type, content, timestamp: now, source })
}

router.post('/api/messages/send/text', async (req, res) => {
  const { to, body, source = 'meta' } = req.body
  if (!to || !body) return res.status(400).json({ error: 'to and body required' })

  try {
    let result
    if (source === 'baileys') {
      result = await baileysService.sendText(to, body)
    } else {
      result = await getMeta(req).sendText(to, body)
    }
    const contactId = upsertContact(to, '', source)
    const conversationId = upsertConversation(contactId, source)
    saveOutbound(conversationId, contactId, 'text', body, source, result.messageId)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message })
  }
})

router.post('/api/messages/send/template', async (req, res) => {
  const { to, templateName, languageCode = 'en_US', components = [] } = req.body
  if (!to || !templateName) return res.status(400).json({ error: 'to and templateName required' })
  try {
    const result = await getMeta(req).sendTemplate(to, templateName, languageCode, components)
    const contactId = upsertContact(to, '', 'meta')
    const conversationId = upsertConversation(contactId, 'meta')
    saveOutbound(conversationId, contactId, 'template', templateName, 'meta', result.messageId)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message })
  }
})

router.post('/api/messages/send/media', async (req, res) => {
  const { to, type = 'image', url, caption = '', source = 'meta' } = req.body
  if (!to || !url) return res.status(400).json({ error: 'to and url required' })
  try {
    const result = await getMeta(req).sendMedia(to, type, url, caption)
    const contactId = upsertContact(to, '', source)
    const conversationId = upsertConversation(contactId, source)
    saveOutbound(conversationId, contactId, type, JSON.stringify({ url, caption }), source, result.messageId)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message })
  }
})

router.post('/api/messages/send/reaction', async (req, res) => {
  const { to, messageId, emoji } = req.body
  if (!to || !messageId || !emoji) return res.status(400).json({ error: 'to, messageId, emoji required' })
  try {
    const result = await getMeta(req).sendReaction(to, messageId, emoji)
    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message })
  }
})

router.get('/api/messages/webhook-log', (req, res) => {
  const limit = parseInt(req.query.limit) || 50
  const offset = parseInt(req.query.offset) || 0
  const events = db.query('SELECT * FROM webhook_events ORDER BY created_at DESC LIMIT ? OFFSET ?', [limit, offset])
  const { count } = db.get('SELECT COUNT(*) as count FROM webhook_events') || { count: 0 }
  res.json({ events, total: count })
})

router.delete('/api/messages/webhook-log', (req, res) => {
  const { changes } = db.run('DELETE FROM webhook_events')
  res.json({ ok: true, deleted: changes })
})

module.exports = router
