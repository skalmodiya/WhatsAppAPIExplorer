const { v4: uuidv4 } = require('uuid')
const db = require('../db/database')
const { getIo } = require('../socket/socketManager')

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
        "UPDATE messages SET status = ?, updated_at = ? WHERE id = ? OR id LIKE ?",
        [status.status, now(), status.id, `%${status.id}%`]
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
        const fullMsg = {
          id: msg.id, conversationId, contactId, direction: 'inbound',
          type: msg.type, content, timestamp: msgTimestamp,
          profileName, phoneNumber: msg.from, source,
          displayPhoneNumber: metadata.display_phone_number
        }
        io.emit('wa:message', fullMsg)
      }

      // Store raw event
      db.run(
        'INSERT INTO webhook_events (event_type, source, payload, processed, created_at) VALUES (?, ?, ?, 1, ?)',
        ['message', source, JSON.stringify(msg), now()]
      )
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
