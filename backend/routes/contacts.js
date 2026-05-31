const express = require('express')
const router = express.Router()
const db = require('../db/database')

router.get('/api/contacts', (req, res) => {
  const q = req.query.q || ''
  const limit = parseInt(req.query.limit) || 20
  const offset = parseInt(req.query.offset) || 0

  let sql = 'SELECT * FROM contacts'
  const params = []
  if (q) {
    sql += ' WHERE display_name LIKE ? OR phone_number LIKE ?'
    params.push(`%${q}%`, `%${q}%`)
  }
  sql += ' ORDER BY updated_at DESC LIMIT ? OFFSET ?'
  params.push(limit, offset)

  const contacts = db.query(sql, params)
  const { count } = db.get(
    q ? 'SELECT COUNT(*) as count FROM contacts WHERE display_name LIKE ? OR phone_number LIKE ?' : 'SELECT COUNT(*) as count FROM contacts',
    q ? [`%${q}%`, `%${q}%`] : []
  ) || { count: 0 }
  res.json({ contacts, total: count })
})

router.get('/api/contacts/:id', (req, res) => {
  const contact = db.get('SELECT * FROM contacts WHERE id = ?', [req.params.id])
  if (!contact) return res.status(404).json({ error: 'Not found' })
  const conversation = db.get('SELECT id FROM conversations WHERE contact_id = ? ORDER BY last_message_at DESC LIMIT 1', [req.params.id])
  res.json({ contact, conversationId: conversation?.id })
})

router.post('/api/contacts', (req, res) => {
  const { phoneNumber, displayName = '' } = req.body
  if (!phoneNumber) return res.status(400).json({ error: 'phoneNumber required' })
  const now = new Date().toISOString()
  db.run(
    'INSERT OR IGNORE INTO contacts (id, display_name, profile_name, phone_number, source, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [phoneNumber, displayName || phoneNumber, '', phoneNumber, 'manual', now, now]
  )
  const contact = db.get('SELECT * FROM contacts WHERE id = ?', [phoneNumber])
  res.json({ contact })
})

module.exports = router
