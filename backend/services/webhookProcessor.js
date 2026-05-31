const { v4: uuidv4 } = require('uuid')
const db = require('../db/database')
const { getIo } = require('../socket/socketManager')
const { callAiProxy } = require('./aiProxy')
const MetaWhatsApp = require('./metaWhatsApp')

function now() {
  return new Date().toISOString()
}

function upsertContact(phoneNumber, profileName = '', source = 'meta') {
  const existing = db.get('SELECT id FROM contacts WHERE id = ?', [phoneNumber])
  if (!existing) {
    db.run(
      'INSERT INTO contacts (id, display_name, profile_name, phone_number, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [phoneNumber, profileName || phoneNumber, profileName, phoneNumber, source, now(), now()]
    )
  } else if (profileName) {
    db.run(
      'UPDATE contacts SET profile_name = ?, display_name = ?, updated_at = ? WHERE id = ?',
      [profileName, profileName, now(), phoneNumber]
    )
  }
  return phoneNumber
}

function upsertConversation(contactId, source = 'meta') {
  const existing = db.get('SELECT id FROM conversations WHERE contact_id = ? AND source = ?', [contactId, source])
  if (existing) return existing.id
  const id = uuidv4()
  db.run(
    'INSERT INTO conversations (id, contact_id, source, unread_count, created_at, updated_at) VALUES (?, ?, ?, 1, ?, ?)',
    [id, contactId, source, now(), now()]
  )
  return id
}

async function triggerChatbotReply(conversationId, contactId, inboundContent, source) {
  // Read chatbot config from DB settings (synced from frontend)
  const enabled = db.getSetting('wa_chatbot_enabled', 'false')
  if (enabled !== 'true') return

  const apiKey    = db.getSetting('wa_ai_api_key', process.env.AI_API_KEY || '')
  const proxyUrl  = db.getSetting('wa_ai_proxy_url', process.env.AI_PROXY_URL || 'http://localhost:6655')
  const provider  = db.getSetting('wa_ai_provider', process.env.AI_DEFAULT_PROVIDER || 'anthropic')
  const model     = db.getSetting('wa_ai_model', process.env.AI_DEFAULT_MODEL || '')
  const sysPrompt = db.getSetting('wa_chatbot_system_prompt', 'You are a helpful WhatsApp assistant. Be concise and friendly.')
  const waToken   = db.getSetting('wa_token', process.env.WHATSAPP_TOKEN || '')
  const phoneId   = db.getSetting('wa_phone_number_id', process.env.WHATSAPP_PHONE_NUMBER_ID || '')

  if (!apiKey || !waToken || !phoneId) {
    console.log('Chatbot: skipping — missing api key, wa token, or phone number id')
    return
  }

  // Build message history for context (last 10 messages)
  const history = db.query(
    'SELECT direction, content FROM messages WHERE conversation_id = ? AND message_type = ? ORDER BY timestamp DESC LIMIT 10',
    [conversationId, 'text']
  ).reverse()

  const messages = history.map(m => ({
    role: m.direction === 'inbound' ? 'user' : 'assistant',
    content: m.content
  }))

  // Ensure last message is the current inbound one
  if (!messages.length || messages[messages.length - 1].content !== inboundContent) {
    messages.push({ role: 'user', content: inboundContent })
  }

  try {
    const { text } = await callAiProxy({ provider, model, messages, systemPrompt: sysPrompt, apiKey, proxyUrl })
    if (!text) return

    // Send reply via Meta
    const meta = new MetaWhatsApp({ token: waToken, phoneNumberId: phoneId })
    const result = await meta.sendText(contactId, text)
    const msgId = result.messageId || uuidv4()
    const ts = now()

    // Save outbound message to DB
    db.run(
      'INSERT OR IGNORE INTO messages (id, conversation_id, contact_id, direction, message_type, content, status, source, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [msgId, conversationId, contactId, 'outbound', 'text', text, 'sent', source, ts, ts]
    )
    db.run('UPDATE conversations SET last_message_at = ?, updated_at = ? WHERE id = ?', [ts, ts, conversationId])

    // Save AI reply record
    db.run(
      'INSERT INTO ai_replies (message_id, conversation_id, prompt, response, provider, model, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [msgId, conversationId, inboundContent, text, provider, model, ts]
    )

    // Emit outbound to frontend
    const io = getIo()
    if (io) io.emit('wa:message', { id: msgId, conversationId, contactId, direction: 'outbound', type: 'text', content: text, timestamp: ts, source })

    console.log(`Chatbot replied to ${contactId}: "${text.slice(0, 60)}..."`)
  } catch (err) {
    console.error('Chatbot reply error:', err.response?.data || err.message)
  }
}

function processInboundMessage(entry, source = 'meta') {
  try {
    const value = entry?.changes?.[0]?.value
    if (!value) return

    const metadata = value.metadata || {}
    const contacts = value.contacts || []
    const messages = value.messages || []
    const statuses = value.statuses || []

    // Handle status updates
    for (const status of statuses) {
      db.run(
        'UPDATE messages SET status = ?, updated_at = ? WHERE id = ?',
        [status.status, now(), status.id]
      )
      const io = getIo()
      if (io) io.emit('wa:status', { messageId: status.id, status: status.status, recipientId: status.recipient_id })
    }

    // Handle inbound messages
    for (const msg of messages) {
      const profileName = contacts.find(c => c.wa_id === msg.from)?.profile?.name || ''
      const contactId = upsertContact(msg.from, profileName, source)
      const conversationId = upsertConversation(contactId, source)

      let content = ''
      if (msg.type === 'text') content = msg.text?.body || ''
      else if (msg.type === 'image') content = JSON.stringify(msg.image)
      else if (msg.type === 'audio') content = JSON.stringify(msg.audio)
      else if (msg.type === 'video') content = JSON.stringify(msg.video)
      else if (msg.type === 'document') content = JSON.stringify(msg.document)
      else content = JSON.stringify(msg)

      const msgTimestamp = msg.timestamp ? new Date(parseInt(msg.timestamp) * 1000).toISOString() : now()

      db.run(
        'INSERT OR IGNORE INTO messages (id, conversation_id, contact_id, direction, message_type, content, status, source, raw_payload, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [msg.id, conversationId, contactId, 'inbound', msg.type || 'text', content, 'received', source, JSON.stringify(msg), msgTimestamp, now()]
      )
      db.run(
        'UPDATE conversations SET last_message_at = ?, unread_count = unread_count + 1, updated_at = ? WHERE id = ?',
        [msgTimestamp, now(), conversationId]
      )

      const io = getIo()
      if (io) {
        io.emit('wa:message', {
          id: msg.id, conversationId, contactId, direction: 'inbound',
          type: msg.type, content, timestamp: msgTimestamp,
          profileName, phoneNumber: msg.from, source,
          displayPhoneNumber: metadata.display_phone_number
        })
      }

      db.run(
        'INSERT INTO webhook_events (event_type, source, payload, processed, created_at) VALUES (?, ?, ?, 1, ?)',
        ['message', source, JSON.stringify(msg), now()]
      )

      // Trigger AI chatbot reply (async, non-blocking)
      if (msg.type === 'text') {
        triggerChatbotReply(conversationId, contactId, content, source).catch(err =>
          console.error('triggerChatbotReply unhandled:', err.message)
        )
      }
    }
  } catch (err) {
    console.error('webhookProcessor error:', err)
  }
}

function saveWebhookEvent(payload, source = 'meta') {
  db.run(
    'INSERT INTO webhook_events (event_type, source, payload, processed, created_at) VALUES (?, ?, ?, 0, ?)',
    ['raw', source, JSON.stringify(payload), now()]
  )
}

module.exports = { processInboundMessage, saveWebhookEvent, upsertContact, upsertConversation }
