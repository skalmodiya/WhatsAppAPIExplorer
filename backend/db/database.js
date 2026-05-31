const Database = require('better-sqlite3')
const path = require('path')
require('dotenv').config()

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/whatsapp.db')

let db

function init() {
  db = new Database(DB_PATH)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id           TEXT PRIMARY KEY,
      display_name TEXT NOT NULL DEFAULT '',
      profile_name TEXT NOT NULL DEFAULT '',
      phone_number TEXT NOT NULL DEFAULT '',
      last_seen    TEXT,
      source       TEXT NOT NULL DEFAULT 'meta',
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS conversations (
      id              TEXT PRIMARY KEY,
      contact_id      TEXT NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
      source          TEXT NOT NULL DEFAULT 'meta',
      last_message_at TEXT,
      unread_count    INTEGER NOT NULL DEFAULT 0,
      ai_summary      TEXT,
      summary_at      TEXT,
      created_at      TEXT NOT NULL,
      updated_at      TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_conversations_contact ON conversations(contact_id);
    CREATE INDEX IF NOT EXISTS idx_conversations_last_msg ON conversations(last_message_at DESC);

    CREATE TABLE IF NOT EXISTS messages (
      id              TEXT PRIMARY KEY,
      conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
      contact_id      TEXT NOT NULL,
      direction       TEXT NOT NULL,
      message_type    TEXT NOT NULL DEFAULT 'text',
      content         TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'sent',
      source          TEXT NOT NULL DEFAULT 'meta',
      raw_payload     TEXT,
      timestamp       TEXT NOT NULL,
      created_at      TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
    CREATE INDEX IF NOT EXISTS idx_messages_ts ON messages(timestamp DESC);

    CREATE TABLE IF NOT EXISTS webhook_events (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      event_type TEXT NOT NULL,
      source     TEXT NOT NULL DEFAULT 'meta',
      payload    TEXT NOT NULL,
      processed  INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at DESC);

    CREATE TABLE IF NOT EXISTS ai_replies (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id      TEXT NOT NULL,
      conversation_id TEXT NOT NULL,
      prompt          TEXT NOT NULL,
      response        TEXT NOT NULL,
      provider        TEXT NOT NULL DEFAULT 'anthropic',
      model           TEXT NOT NULL DEFAULT '',
      tokens_used     INTEGER,
      created_at      TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_ai_replies_conv ON ai_replies(conversation_id);
  `)

  console.log('SQLite database initialized at', DB_PATH)
}

function getDb() {
  if (!db) throw new Error('Database not initialized')
  return db
}

function query(sql, params = []) {
  return getDb().prepare(sql).all(params)
}

function get(sql, params = []) {
  return getDb().prepare(sql).get(params)
}

function run(sql, params = []) {
  return getDb().prepare(sql).run(params)
}

function getSetting(key, defaultValue = null) {
  const row = get('SELECT value FROM settings WHERE key = ?', [key])
  return row ? row.value : defaultValue
}

function setSetting(key, value) {
  const now = new Date().toISOString()
  run(
    'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
    [key, String(value), now]
  )
}

module.exports = { init, getDb, query, get, run, getSetting, setSetting }
