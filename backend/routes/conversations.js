const express = require('express')
const router = express.Router()
const { v4: uuidv4 } = require('uuid')
const db = require('../db/database')
const { callAiProxy } = require('../services/aiProxy')
const MetaWhatsApp = require('../services/metaWhatsApp')
const baileysService = require('../services/baileysService')
const { upsertContact } = require('../services/webhookProcessor')
const { getIo } = require('../socket/socketManager')

router.get('/api/conversations', (req, res) => {
  const source = req.query.source
  const limit = parseInt(req.query.limit) || 20
  const offset = parseInt(req.query.offset) || 0

  let sql = `
    SELECT c.*, ct.display_name, ct.profile_name, ct.phone_number,
           (SELECT content FROM messages WHERE conversation_id = c.id ORDER BY timestamp DESC LIMIT 1) as last_message
    FROM conversations c
    LEFT JOIN contacts ct ON ct.id = c.contact_id
  `
  const params = []
  if (source) { sql += ' WHERE c.source = ?'; params.push(source) }
  sql += ' ORDER BY c.last_message_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const conversations = db.query(sql, params)
  const { count } = db.get(source ? 'SELECT COUNT(*) as count FROM conversations WHERE source = ?' : 'SELECT COUNT(*) as count FROM conversations', source ? [source] : []) || { count: 0 }
  res.json({ conversations, total: count })
})

router.get('/api/conversations/:id', (req, res) => {
  const conv = db.get(`
    SELECT c.*, ct.display_name, ct.profile_name, ct.phone_number
    FROM conversations c LEFT JOIN contacts ct ON ct.id = c.contact_id
    WHERE c.id = ?
  `, [req.params.id])
  if (!conv) return res.status(404).json({ error: 'Not found' })

  const messages = db.query('SELECT * FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC LIMIT 50', [req.params.id])
  res.json({ conversation: conv, messages })
})

router.get('/api/conversations/:id/messages', (req, res) => {
  const limit = parseInt(req.query.limit) || 50
  const before = req.query.before

  let sql = 'SELECT * FROM messages WHERE conversation_id = ?'
  const params = [req.params.id]
  if (before) { sql += ' AND timestamp < ?'; params.push(before) }
  sql += ' ORDER BY timestamp DESC LIMIT ?'
  params.push(limit)

  const messages = db.query(sql, params).reverse()
  const { count } = db.get('SELECT COUNT(*) as count FROM messages WHERE conversation_id = ?', [req.params.id]) || { count: 0 }
  res.json({ messages, hasMore: count > limit })
})

router.post('/api/conversations/:id/summarize', async (req, res) => {
  const { provider = 'anthropic', model } = req.body
  const apiKey = req.headers['x-ai-key'] || process.env.AI_API_KEY
  const proxyUrl = req.headers['x-proxy-url'] || process.env.AI_PROXY_URL || 'http://localhost:6655'

  const messages = db.query('SELECT direction, content FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC LIMIT 100', [req.params.id])
  if (!messages.length) return res.json({ summary: 'No messages to summarize.' })

  const convo = messages.map(m => `${m.direction === 'inbound' ? 'Customer' : 'Agent'}: ${m.content}`).join('\n')
  const prompt = `Summarize this WhatsApp conversation in 2-3 sentences:\n\n${convo}`

  try {
    const { text } = await callAiProxy({ provider, model, messages: [{ role: 'user', content: prompt }], apiKey, proxyUrl })
    const now = new Date().toISOString()
    db.run('UPDATE conversations SET ai_summary = ?, summary_at = ? WHERE id = ?', [text, now, req.params.id])
    res.json({ summary: text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/api/conversations/:id/reply', async (req, res) => {
  const { body, source = 'meta' } = req.body
  const conv = db.get('SELECT * FROM conversations WHERE id = ?', [req.params.id])
  if (!conv) return res.status(404).json({ error: 'Conversation not found' })

  const contact = db.get('SELECT * FROM contacts WHERE id = ?', [conv.contact_id])
  if (!contact) return res.status(404).json({ error: 'Contact not found' })

  try {
    let result
    if (source === 'baileys') {
      result = await baileysService.sendText(contact.phone_number, body)
    } else {
      const token = req.headers['x-wa-token'] || process.env.WHATSAPP_TOKEN
      const phoneNumberId = req.headers['x-phone-number-id'] || process.env.WHATSAPP_PHONE_NUMBER_ID
      const meta = new MetaWhatsApp({ token, phoneNumberId })
      result = await meta.sendText(contact.phone_number, body)
    }

    const now = new Date().toISOString()
    const msgId = result.messageId || uuidv4()
    db.run(
      'INSERT OR IGNORE INTO messages (id, conversation_id, contact_id, direction, message_type, content, status, source, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [msgId, req.params.id, conv.contact_id, 'outbound', 'text', body, 'sent', source, now, now]
    )
    db.run('UPDATE conversations SET last_message_at = ?, updated_at = ? WHERE id = ?', [now, now, req.params.id])
    const io = getIo()
    if (io) io.emit('wa:message', { id: msgId, conversationId: req.params.id, contactId: conv.contact_id, direction: 'outbound', type: 'text', content: body, timestamp: now, source })
    res.json({ messageId: msgId })
  } catch (err) {
    res.status(500).json({ error: err.response?.data || err.message })
  }
})

module.exports = router
