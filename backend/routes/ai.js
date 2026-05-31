const express = require('express')
const router = express.Router()
const db = require('../db/database')
const { callAiProxy, streamAiProxy, getModels } = require('../services/aiProxy')

function getConfig(req) {
  return {
    provider: req.body.provider || 'anthropic',
    model: req.body.model || '',
    apiKey: req.headers['x-ai-key'] || process.env.AI_API_KEY || '',
    proxyUrl: req.headers['x-proxy-url'] || process.env.AI_PROXY_URL || 'http://localhost:6655'
  }
}

function upstreamError(err) {
  const status = err.response?.status || 500
  const data = err.response?.data
  // Extract the most useful message from the proxy's error shape
  const message = data?.error?.errorMessage || data?.error?.message || data?.message || err.message
  return { status, message, detail: data }
}

router.post('/api/ai/chat', async (req, res) => {
  const { messages, systemPrompt, stream: doStream } = req.body
  const cfg = getConfig(req)

  if (!messages?.length) return res.status(400).json({ error: 'messages required' })

  try {
    if (doStream) {
      await streamAiProxy({ ...cfg, messages, systemPrompt }, res)
    } else {
      const { text, raw } = await callAiProxy({ ...cfg, messages, systemPrompt })
      res.json({ response: text, raw })
    }
  } catch (err) {
    if (!res.headersSent) {
      const { status, message, detail } = upstreamError(err)
      res.status(status).json({ error: message, detail })
    }
  }
})

router.post('/api/ai/summarize', async (req, res) => {
  const { conversationId } = req.body
  const cfg = getConfig(req)

  const messages = db.query('SELECT direction, content FROM messages WHERE conversation_id = ? ORDER BY timestamp ASC LIMIT 100', [conversationId])
  if (!messages.length) return res.json({ summary: 'No messages to summarize.' })

  const convo = messages.map(m => `${m.direction === 'inbound' ? 'Customer' : 'Agent'}: ${m.content}`).join('\n')
  const prompt = `Summarize this WhatsApp conversation in 2-3 sentences:\n\n${convo}`

  try {
    const { text } = await callAiProxy({ ...cfg, messages: [{ role: 'user', content: prompt }] })
    res.json({ summary: text })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/api/ai/suggest-replies', async (req, res) => {
  const { conversationId, count = 3 } = req.body
  const cfg = getConfig(req)

  const msgs = db.query('SELECT direction, content FROM messages WHERE conversation_id = ? ORDER BY timestamp DESC LIMIT 10', [conversationId]).reverse()
  if (!msgs.length) return res.json({ suggestions: [] })

  const convo = msgs.map(m => `${m.direction === 'inbound' ? 'Customer' : 'Agent'}: ${m.content}`).join('\n')
  const prompt = `Based on this WhatsApp conversation, suggest ${count} short reply options for the agent. Return only a JSON array of strings.\n\n${convo}`

  try {
    const { text } = await callAiProxy({ ...cfg, messages: [{ role: 'user', content: prompt }] })
    let suggestions = []
    try { suggestions = JSON.parse(text.match(/\[[\s\S]*\]/)?.[0] || '[]') } catch { suggestions = [text] }
    res.json({ suggestions })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.get('/api/ai/models/:provider', async (req, res) => {
  const apiKey = req.headers['x-ai-key'] || process.env.AI_API_KEY || ''
  const proxyUrl = req.headers['x-proxy-url'] || process.env.AI_PROXY_URL || 'http://localhost:6655'
  const models = await getModels(req.params.provider, apiKey, proxyUrl)
  res.json({ models })
})

module.exports = router
