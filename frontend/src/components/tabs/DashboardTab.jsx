import { useState, useEffect, useRef } from 'react'
import { Send, Image, FileText, Trash2, ChevronDown, ChevronRight, Play } from 'lucide-react'
import { useBackendApi } from '../../hooks/useBackendApi'
import { useSocket } from '../../hooks/useSocket'
import { CodeBlock } from '../shared/CodeBlock'
import { Badge } from '../shared/Badge'
import { LoadingSpinner, ErrorBanner } from '../shared/Helpers'
import { formatRelative } from '../../lib/formatters'

const ENDPOINT_CARDS = [
  { method: 'POST', path: '/api/messages/send/text', label: 'Send Text', body: '{"to":"1234567890","body":"Hello!","source":"meta"}' },
  { method: 'POST', path: '/api/messages/send/template', label: 'Send Template', body: '{"to":"1234567890","templateName":"hello_world","languageCode":"en_US"}' },
  { method: 'POST', path: '/api/messages/send/media', label: 'Send Image', body: '{"to":"1234567890","type":"image","url":"https://example.com/img.jpg","caption":"Check this out"}' },
  { method: 'GET', path: '/api/messages/webhook-log', label: 'Webhook Log', body: '' },
  { method: 'GET', path: '/api/health', label: 'Health Check', body: '' },
  { method: 'GET', path: '/api/conversations', label: 'List Conversations', body: '' },
  { method: 'GET', path: '/api/contacts', label: 'List Contacts', body: '' },
  { method: 'POST', path: '/api/ai/chat', label: 'AI Chat', body: '{"provider":"anthropic","messages":[{"role":"user","content":"Hello!"}]}' },
]

function SendTextPanel({ onSuccess }) {
  const { call } = useBackendApi()
  const [to, setTo] = useState('')
  const [body, setBody] = useState('')
  const [source, setSource] = useState('meta')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const data = await call('POST', '/api/messages/send/text', { to, body, source })
      setResult({ ok: true, data })
      onSuccess?.()
    } catch (err) {
      setResult({ ok: false, data: err.response?.data || { error: err.message } })
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2"><Send size={14} /> Send Text</h3>
      <input value={to} onChange={e => setTo(e.target.value)} placeholder="Phone (e.g. 14155550001)" required
        className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500" />
      <textarea value={body} onChange={e => setBody(e.target.value)} placeholder="Message body" required rows={3}
        className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none" />
      <select value={source} onChange={e => setSource(e.target.value)}
        className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
        <option value="meta">Meta Cloud API</option>
        <option value="baileys">Baileys (unofficial)</option>
      </select>
      <button type="submit" disabled={loading}
        className="w-full py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <LoadingSpinner size="sm" /> : null} Send
      </button>
      {result && <CodeBlock code={result.data} maxHeight="120px" />}
    </form>
  )
}

function SendTemplatePanel() {
  const { call } = useBackendApi()
  const [to, setTo] = useState('')
  const [name, setName] = useState('')
  const [lang, setLang] = useState('en_US')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const data = await call('POST', '/api/messages/send/template', { to, templateName: name, languageCode: lang })
      setResult({ ok: true, data })
    } catch (err) {
      setResult({ ok: false, data: err.response?.data || { error: err.message } })
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2"><FileText size={14} /> Send Template</h3>
      <input value={to} onChange={e => setTo(e.target.value)} placeholder="Phone number" required
        className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500" />
      <input value={name} onChange={e => setName(e.target.value)} placeholder="Template name (e.g. hello_world)" required
        className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500" />
      <input value={lang} onChange={e => setLang(e.target.value)} placeholder="Language code"
        className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500" />
      <button type="submit" disabled={loading}
        className="w-full py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <LoadingSpinner size="sm" /> : null} Send Template
      </button>
      {result && <CodeBlock code={result.data} maxHeight="120px" />}
    </form>
  )
}

function SendMediaPanel() {
  const { call } = useBackendApi()
  const [to, setTo] = useState('')
  const [url, setUrl] = useState('')
  const [type, setType] = useState('image')
  const [caption, setCaption] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)

  async function submit(e) {
    e.preventDefault()
    setLoading(true)
    setResult(null)
    try {
      const data = await call('POST', '/api/messages/send/media', { to, url, type, caption })
      setResult({ ok: true, data })
    } catch (err) {
      setResult({ ok: false, data: err.response?.data || { error: err.message } })
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <h3 className="text-sm font-semibold flex items-center gap-2"><Image size={14} /> Send Media</h3>
      <input value={to} onChange={e => setTo(e.target.value)} placeholder="Phone number" required
        className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500" />
      <select value={type} onChange={e => setType(e.target.value)}
        className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
        {['image', 'video', 'audio', 'document'].map(t => <option key={t}>{t}</option>)}
      </select>
      <input value={url} onChange={e => setUrl(e.target.value)} placeholder="Media URL" required type="url"
        className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500" />
      <input value={caption} onChange={e => setCaption(e.target.value)} placeholder="Caption (optional)"
        className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500" />
      <button type="submit" disabled={loading}
        className="w-full py-1.5 text-sm rounded bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center gap-2">
        {loading ? <LoadingSpinner size="sm" /> : null} Send Media
      </button>
      {result && <CodeBlock code={result.data} maxHeight="120px" />}
    </form>
  )
}

function WebhookLogPanel() {
  const { call } = useBackendApi()
  const [events, setEvents] = useState([])
  const [total, setTotal] = useState(0)
  const [expanded, setExpanded] = useState({})

  useSocket('wa:message', (msg) => {
    setEvents(prev => [{ id: Date.now(), event_type: 'live', source: msg.source, payload: JSON.stringify(msg), created_at: new Date().toISOString(), live: true }, ...prev].slice(0, 200))
    setTotal(t => t + 1)
  })

  useEffect(() => {
    call('GET', '/api/messages/webhook-log?limit=50').then(data => {
      setEvents(data.events || [])
      setTotal(data.total || 0)
    }).catch(() => {})
  }, [call])

  async function clearLog() {
    await call('DELETE', '/api/messages/webhook-log').catch(() => {})
    setEvents([])
    setTotal(0)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold">Webhook Events ({total})</h3>
        <button onClick={clearLog} className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
          <Trash2 size={12} /> Clear
        </button>
      </div>
      <div className="space-y-1 max-h-64 overflow-y-auto">
        {events.length === 0 && <p className="text-xs text-gray-400 py-4 text-center">No events yet. Send a WhatsApp message to see events.</p>}
        {events.map((e, i) => (
          <div key={e.id || i} className="rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
            <button
              onClick={() => setExpanded(prev => ({ ...prev, [i]: !prev[i] }))}
              className="w-full flex items-center justify-between px-3 py-1.5 bg-gray-50 dark:bg-gray-800 text-left"
            >
              <div className="flex items-center gap-2 text-xs">
                {e.live && <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />}
                <Badge variant={e.event_type === 'message' || e.live ? 'green' : 'gray'}>{e.event_type}</Badge>
                <span className="text-gray-500">{e.source}</span>
                <span className="text-gray-400">{formatRelative(e.created_at)}</span>
              </div>
              {expanded[i] ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            </button>
            {expanded[i] && (
              <div className="p-2 bg-white dark:bg-gray-900">
                <CodeBlock code={(() => { try { return JSON.parse(e.payload) } catch { return e.payload } })()} maxHeight="150px" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function ApiTesterPanel() {
  const { backendUrl } = useBackendApi().call ? { backendUrl: '' } : {}
  const { call } = useBackendApi()
  const [method, setMethod] = useState('GET')
  const [path, setPath] = useState('/api/health')
  const [bodyText, setBodyText] = useState('')
  const [loading, setLoading] = useState(false)
  const [response, setResponse] = useState(null)
  const [latency, setLatency] = useState(null)

  async function runRequest(e) {
    e?.preventDefault()
    setLoading(true)
    setResponse(null)
    const t0 = Date.now()
    try {
      let body = null
      if (bodyText.trim()) { try { body = JSON.parse(bodyText) } catch {} }
      const data = await call(method, path, body)
      setResponse(data)
    } catch (err) {
      setResponse(err.response?.data || { error: err.message })
    } finally {
      setLatency(Date.now() - t0)
      setLoading(false)
    }
  }

  function prefill(card) {
    setMethod(card.method)
    setPath(card.path)
    setBodyText(card.body)
  }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Play size={14} /> API Tester</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 mb-3">
        {ENDPOINT_CARDS.map(card => (
          <button key={card.path} onClick={() => prefill(card)}
            className="text-left px-2 py-1.5 rounded border border-gray-200 dark:border-gray-700 hover:border-green-500 text-xs truncate">
            <span className={`font-mono text-xs mr-1 ${card.method === 'GET' ? 'text-blue-500' : 'text-orange-500'}`}>{card.method}</span>
            {card.label}
          </button>
        ))}
      </div>
      <form onSubmit={runRequest} className="space-y-2">
        <div className="flex gap-2">
          <select value={method} onChange={e => setMethod(e.target.value)}
            className="px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-mono">
            {['GET', 'POST', 'PUT', 'DELETE', 'PATCH'].map(m => <option key={m}>{m}</option>)}
          </select>
          <input value={path} onChange={e => setPath(e.target.value)} placeholder="/api/..." required
            className="flex-1 px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 font-mono focus:outline-none focus:ring-1 focus:ring-green-500" />
          <button type="submit" disabled={loading}
            className="px-3 py-1.5 text-sm rounded bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 flex items-center gap-1">
            {loading ? <LoadingSpinner size="sm" /> : <Play size={14} />} Run
          </button>
        </div>
        {method !== 'GET' && (
          <textarea value={bodyText} onChange={e => setBodyText(e.target.value)} placeholder='{"key": "value"}' rows={3}
            className="w-full px-3 py-1.5 text-sm font-mono rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500 resize-none" />
        )}
      </form>
      {response && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-1 text-xs text-gray-500">
            <span>Response</span>
            {latency != null && <Badge variant="gray">{latency}ms</Badge>}
          </div>
          <CodeBlock code={response} maxHeight="200px" />
        </div>
      )}
    </div>
  )
}

export default function DashboardTab() {
  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700"><SendTextPanel /></div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700"><SendTemplatePanel /></div>
          <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700"><SendMediaPanel /></div>
        </div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700"><WebhookLogPanel /></div>
        <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700"><ApiTesterPanel /></div>
      </div>
    </div>
  )
}
