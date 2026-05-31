const { v4: uuidv4 } = require('uuid')
const { getIo } = require('../socket/socketManager')
const db = require('../db/database')
const { upsertContact, upsertConversation } = require('./webhookProcessor')

let sock = null
let state = 'disconnected'
let makeWASocket, useMultiFileAuthState, DisconnectReason

async function loadBaileys() {
  if (!makeWASocket) {
    const baileys = require('@whiskeysockets/baileys')
    makeWASocket = baileys.default || baileys.makeWASocket
    useMultiFileAuthState = baileys.useMultiFileAuthState
    DisconnectReason = baileys.DisconnectReason
  }
}

function getState() { return state }
function getSock() { return sock }

async function connect(sessionDir = './sessions') {
  await loadBaileys()
  const io = getIo()
  state = 'connecting'

  try {
    const { state: authState, saveCreds } = await useMultiFileAuthState(sessionDir)

    sock = makeWASocket({
      auth: authState,
      printQRInTerminal: false,
      browser: ['WhatsApp API Explorer', 'Chrome', '1.0.0']
    })

    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', ({ connection, lastDisconnect, qr }) => {
      if (qr) {
        if (io) io.emit('baileys:qr', qr)
        console.log('Baileys QR emitted')
      }
      if (connection === 'open') {
        state = 'connected'
        console.log('Baileys connected as', sock.user?.id)
        if (io) io.emit('baileys:connected', { phoneNumber: sock.user?.id?.split(':')[0] || '' })
      }
      if (connection === 'close') {
        const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason?.loggedOut
        state = shouldReconnect ? 'connecting' : 'disconnected'
        if (io) io.emit('baileys:disconnected', { reason: lastDisconnect?.error?.message })
        if (shouldReconnect) {
          console.log('Baileys reconnecting...')
          setTimeout(() => connect(sessionDir), 3000)
        } else {
          sock = null
          state = 'disconnected'
        }
      }
    })

    sock.ev.on('messages.upsert', ({ messages, type }) => {
      if (type !== 'notify') return
      for (const msg of messages) {
        if (msg.key.fromMe) continue
        const from = msg.key.remoteJid?.replace('@s.whatsapp.net', '') || ''
        const content = msg.message?.conversation || msg.message?.extendedTextMessage?.text || JSON.stringify(msg.message)
        const timestamp = new Date(msg.messageTimestamp * 1000).toISOString()

        const contactId = upsertContact(from, msg.pushName || from, 'baileys')
        const conversationId = upsertConversation(contactId, 'baileys')

        const msgId = msg.key.id || uuidv4()
        db.run(
          'INSERT OR IGNORE INTO messages (id, conversation_id, contact_id, direction, message_type, content, status, source, raw_payload, timestamp, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [msgId, conversationId, contactId, 'inbound', 'text', content, 'received', 'baileys', JSON.stringify(msg), timestamp, new Date().toISOString()]
        )
        db.run('UPDATE conversations SET last_message_at = ?, unread_count = unread_count + 1, updated_at = ? WHERE id = ?',
          [timestamp, new Date().toISOString(), conversationId])

        if (io) io.emit('wa:message', { id: msgId, conversationId, contactId, direction: 'inbound', type: 'text', content, timestamp, source: 'baileys', phoneNumber: from })
      }
    })
  } catch (err) {
    console.error('Baileys connect error:', err)
    state = 'disconnected'
    throw err
  }
}

async function disconnect() {
  if (sock) {
    await sock.logout().catch(() => {})
    sock = null
  }
  state = 'disconnected'
  const io = getIo()
  if (io) io.emit('baileys:disconnected', { reason: 'manual' })
}

async function sendText(jid, text) {
  if (!sock || state !== 'connected') throw new Error('Baileys not connected')
  const fullJid = jid.includes('@') ? jid : jid + '@s.whatsapp.net'
  const res = await sock.sendMessage(fullJid, { text })
  return { messageId: res?.key?.id, timestamp: Date.now() }
}

module.exports = { connect, disconnect, sendText, getState, getSock }
