const now = new Date().toISOString()
const yesterday = new Date(Date.now() - 86400000).toISOString()

export const MOCK_CONVERSATIONS = {
  conversations: [
    {
      id: 'mock-conv-1',
      contact_id: '14155550001',
      source: 'meta',
      last_message_at: now,
      unread_count: 2,
      display_name: 'Alice Johnson',
      phone_number: '14155550001',
      last_message: 'Sure, I can help with that!'
    },
    {
      id: 'mock-conv-2',
      contact_id: '14155550002',
      source: 'baileys',
      last_message_at: yesterday,
      unread_count: 0,
      display_name: 'Bob Smith',
      phone_number: '14155550002',
      last_message: 'Thanks for the update'
    },
    {
      id: 'mock-conv-3',
      contact_id: '14155550003',
      source: 'meta',
      last_message_at: yesterday,
      unread_count: 1,
      display_name: 'Carol Williams',
      phone_number: '14155550003',
      last_message: 'When will my order arrive?'
    }
  ],
  total: 3
}

export const MOCK_MESSAGES = {
  messages: [
    { id: 'msg-1', conversation_id: 'mock-conv-1', contact_id: '14155550001', direction: 'inbound', message_type: 'text', content: 'Hello! I need help with my account.', status: 'read', source: 'meta', timestamp: yesterday },
    { id: 'msg-2', conversation_id: 'mock-conv-1', contact_id: '14155550001', direction: 'outbound', message_type: 'text', content: 'Hi Alice! How can I help you today?', status: 'read', source: 'meta', timestamp: yesterday },
    { id: 'msg-3', conversation_id: 'mock-conv-1', contact_id: '14155550001', direction: 'inbound', message_type: 'text', content: 'Sure, I can help with that!', status: 'received', source: 'meta', timestamp: now },
  ],
  hasMore: false
}

export const MOCK_CONTACTS = {
  contacts: [
    { id: '14155550001', display_name: 'Alice Johnson', phone_number: '14155550001', source: 'meta' },
    { id: '14155550002', display_name: 'Bob Smith', phone_number: '14155550002', source: 'baileys' },
    { id: '14155550003', display_name: 'Carol Williams', phone_number: '14155550003', source: 'meta' },
  ],
  total: 3
}

export const MOCK_WEBHOOK_LOG = {
  events: [
    {
      id: 1, event_type: 'message', source: 'meta', processed: 1, created_at: now,
      payload: JSON.stringify({ from: '14155550001', type: 'text', text: { body: 'Hello' }, timestamp: Math.floor(Date.now() / 1000) })
    },
    {
      id: 2, event_type: 'raw', source: 'meta', processed: 0, created_at: yesterday,
      payload: JSON.stringify({ object: 'whatsapp_business_account', entry: [{ changes: [{ value: { messaging_product: 'whatsapp' } }] }] })
    }
  ],
  total: 2
}

export const MOCK_HEALTH = { ok: true, version: '1.0.0', db: 'ok', baileys: 'disconnected' }

export const MOCK_AI_MODELS = {
  anthropic: ['claude-opus-4-7', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'],
  openai: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'],
  gemini: ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'],
  litellm: ['gpt-4o', 'gpt-4o-mini', 'claude-haiku-4-5-20251001']
}

export function getMock(path) {
  if (path.includes('/api/conversations') && path.includes('/messages')) return MOCK_MESSAGES
  if (path.includes('/api/conversations')) return MOCK_CONVERSATIONS
  if (path.includes('/api/contacts')) return MOCK_CONTACTS
  if (path.includes('/api/messages/webhook-log')) return MOCK_WEBHOOK_LOG
  if (path.includes('/api/health')) return MOCK_HEALTH
  if (path.includes('/api/ai/models/anthropic')) return { models: MOCK_AI_MODELS.anthropic }
  if (path.includes('/api/ai/models/openai')) return { models: MOCK_AI_MODELS.openai }
  if (path.includes('/api/ai/models/gemini')) return { models: MOCK_AI_MODELS.gemini }
  if (path.includes('/api/ai/models/litellm')) return { models: MOCK_AI_MODELS.litellm }
  if (path.includes('/api/ai/summarize') || path.includes('/summarize')) return { summary: 'This is a demo conversation summary. Connect your backend to get real AI summaries.' }
  if (path.includes('/api/ai/suggest-replies')) return { suggestions: ['Sure, let me check that for you.', 'Thank you for reaching out!', 'I\'ll get back to you shortly.'] }
  if (path.includes('/api/comparison/send')) return {
    meta: { success: false, error: 'Demo mode — connect backend to test' },
    baileys: { success: false, error: 'Demo mode — connect backend to test' }
  }
  return { ok: true, demo: true }
}
