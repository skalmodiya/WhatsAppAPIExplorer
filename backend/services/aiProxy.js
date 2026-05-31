const axios = require('axios')
const db = require('../db/database')

const PROVIDER_PATHS = {
  anthropic: '/anthropic/v1/messages',
  openai: '/openai/v1/chat/completions',
  litellm: '/litellm/v1/chat/completions',
  gemini: '/gemini/v1beta/models/{model}:generateContent'
}

function buildRequest(provider, model, messages, systemPrompt) {
  if (provider === 'anthropic') {
    const body = {
      model: model || 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      messages: messages.map(m => ({ role: m.role, content: m.content }))
    }
    if (systemPrompt) body.system = systemPrompt
    return body
  }

  if (provider === 'gemini') {
    return {
      contents: messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }))
    }
  }

  // openai / litellm compatible
  const msgs = []
  if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt })
  msgs.push(...messages.map(m => ({ role: m.role, content: m.content })))
  return { model: model || 'gpt-4o-mini', messages: msgs, max_tokens: 1024 }
}

function extractText(provider, data) {
  if (provider === 'anthropic') return data.content?.[0]?.text || ''
  if (provider === 'gemini') return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  return data.choices?.[0]?.message?.content || ''
}

async function callAiProxy({ provider = 'anthropic', model, messages, systemPrompt, apiKey, proxyUrl = 'http://localhost:6655' }) {
  let path = PROVIDER_PATHS[provider] || PROVIDER_PATHS.openai
  if (provider === 'gemini') path = path.replace('{model}', model || 'gemini-pro')

  const url = proxyUrl + path
  const body = buildRequest(provider, model, messages, systemPrompt)
  const headers = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
  if (provider === 'anthropic') headers['anthropic-version'] = '2023-06-01'

  const res = await axios.post(url, body, { headers, timeout: 30000 })
  return { text: extractText(provider, res.data), raw: res.data }
}

async function streamAiProxy({ provider = 'anthropic', model, messages, systemPrompt, apiKey, proxyUrl = 'http://localhost:6655' }, res) {
  let path = PROVIDER_PATHS[provider] || PROVIDER_PATHS.openai
  if (provider === 'gemini') path = path.replace('{model}', model || 'gemini-pro')

  const url = proxyUrl + path
  const body = { ...buildRequest(provider, model, messages, systemPrompt), stream: true }
  const headers = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
  if (provider === 'anthropic') headers['anthropic-version'] = '2023-06-01'

  const upstream = await axios.post(url, body, { headers, responseType: 'stream', timeout: 60000 })
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  upstream.data.pipe(res)
}

async function getModels(provider, apiKey, proxyUrl = 'http://localhost:6655') {
  try {
    const paths = {
      anthropic: '/anthropic/v1/models',
      openai: '/openai/v1/models',
      litellm: '/litellm/v1/models',
      gemini: '/gemini/v1beta/models'
    }
    const url = proxyUrl + (paths[provider] || paths.openai)
    const headers = {}
    if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`
    if (provider === 'anthropic') headers['anthropic-version'] = '2023-06-01'
    const res = await axios.get(url, { headers, timeout: 10000 })
    if (provider === 'gemini') return (res.data.models || []).map(m => m.name.replace('models/', ''))
    return (res.data.data || []).map(m => m.id)
  } catch {
    return []
  }
}

module.exports = { callAiProxy, streamAiProxy, getModels }
