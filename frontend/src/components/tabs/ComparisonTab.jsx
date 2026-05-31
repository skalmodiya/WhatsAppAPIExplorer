import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Zap, Wifi, WifiOff, CheckCircle, XCircle, Clock } from 'lucide-react'
import { useWhatsApp } from '../../contexts/WhatsAppContext'
import { useBackendApi } from '../../hooks/useBackendApi'
import { CodeBlock } from '../shared/CodeBlock'
import { Badge } from '../shared/Badge'
import { LoadingSpinner, EmptyState } from '../shared/Helpers'

function MetaApiPanel({ onResult, loading, result }) {
  const { call } = useBackendApi()
  const [to, setTo] = useState('')
  const [text, setText] = useState('Hello from Meta Cloud API!')

  async function sendMeta(e) {
    e.preventDefault()
    const start = Date.now()
    try {
      const data = await call('POST', '/api/messages/send/text', { to, body: text, source: 'meta' })
      onResult('meta', { success: true, ...data, latencyMs: Date.now() - start })
    } catch (err) {
      onResult('meta', { success: false, error: err.response?.data || err.message, latencyMs: Date.now() - start })
    }
  }

  return (
    <div className="flex-1 p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="blue">Official</Badge>
        <span className="font-semibold text-sm">Meta Cloud API</span>
      </div>
      <div className="text-xs text-gray-500 mb-3 space-y-1">
        <div><strong>Base URL:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">https://graph.facebook.com/v18.0</code></div>
        <div><strong>Auth:</strong> Bearer token (Phone Number ID required)</div>
        <div><strong>Delivery:</strong> Guaranteed, Meta infrastructure</div>
        <div><strong>Use case:</strong> Production, business messaging</div>
      </div>
      <form onSubmit={sendMeta} className="space-y-2">
        <input value={to} onChange={e => setTo(e.target.value)} placeholder="Phone (with country code, e.g. 14155550001)" required
          className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-blue-500" />
        <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
          className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500" />
        <button type="submit" disabled={loading}
          className="w-full py-1.5 text-sm rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
          {loading ? <LoadingSpinner size="sm" /> : null} Send via Meta API
        </button>
      </form>
      {result && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-1">
            {result.success ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
            <Badge variant={result.success ? 'green' : 'red'}>{result.success ? 'Success' : 'Failed'}</Badge>
            {result.latencyMs && <Badge variant="gray"><Clock size={10} className="inline mr-0.5" />{result.latencyMs}ms</Badge>}
          </div>
          <CodeBlock code={result} maxHeight="150px" />
        </div>
      )}
    </div>
  )
}

function BaileysPanel({ onResult, loading, result }) {
  const { call } = useBackendApi()
  const { baileysQr, baileysConnected, baileysPhoneNumber } = useWhatsApp()
  const [connecting, setConnecting] = useState(false)
  const [to, setTo] = useState('')
  const [text, setText] = useState('Hello from Baileys!')

  async function connect() {
    setConnecting(true)
    try { await call('POST', '/api/baileys/connect') } catch {} finally { setConnecting(false) }
  }

  async function disconnect() {
    await call('POST', '/api/baileys/disconnect').catch(() => {})
  }

  async function sendBaileys(e) {
    e.preventDefault()
    const start = Date.now()
    try {
      const data = await call('POST', '/api/baileys/send', { to, text })
      onResult('baileys', { success: true, ...data, latencyMs: Date.now() - start })
    } catch (err) {
      onResult('baileys', { success: false, error: err.response?.data || err.message, latencyMs: Date.now() - start })
    }
  }

  return (
    <div className="flex-1 p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
      <div className="flex items-center gap-2 mb-3">
        <Badge variant="yellow">Unofficial</Badge>
        <span className="font-semibold text-sm">Baileys (whatsapp-web.js)</span>
      </div>
      <div className="text-xs text-gray-500 mb-3 space-y-1">
        <div><strong>Library:</strong> <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">@whiskeysockets/baileys</code></div>
        <div><strong>Auth:</strong> QR code scan (no API key)</div>
        <div><strong>Delivery:</strong> Direct via WhatsApp Web protocol</div>
        <div><strong>⚠️ Note:</strong> Against WhatsApp ToS in production</div>
      </div>

      {/* Connection status */}
      {!baileysConnected ? (
        <div className="mb-3">
          {baileysQr ? (
            <div className="flex flex-col items-center gap-2 p-3 bg-white rounded-lg border">
              <p className="text-xs text-gray-500 text-center">Scan with WhatsApp on your phone</p>
              <QRCodeSVG value={baileysQr} size={160} />
            </div>
          ) : (
            <button onClick={connect} disabled={connecting}
              className="w-full py-2 text-sm rounded bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center gap-2">
              {connecting ? <LoadingSpinner size="sm" /> : <Wifi size={14} />}
              Connect via QR Code
            </button>
          )}
        </div>
      ) : (
        <div className="mb-3 flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
            <CheckCircle size={14} />
            Connected as {baileysPhoneNumber || 'Unknown'}
          </div>
          <button onClick={disconnect} className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1">
            <WifiOff size={12} /> Logout
          </button>
        </div>
      )}

      {baileysConnected && (
        <form onSubmit={sendBaileys} className="space-y-2">
          <input value={to} onChange={e => setTo(e.target.value)} placeholder="Phone (e.g. 14155550001)" required
            className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-yellow-500" />
          <textarea value={text} onChange={e => setText(e.target.value)} rows={3}
            className="w-full px-3 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 resize-none focus:outline-none focus:ring-1 focus:ring-yellow-500" />
          <button type="submit" disabled={loading}
            className="w-full py-1.5 text-sm rounded bg-yellow-500 text-white hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <LoadingSpinner size="sm" /> : null} Send via Baileys
          </button>
        </form>
      )}
      {result && (
        <div className="mt-3">
          <div className="flex items-center gap-2 mb-1">
            {result.success ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
            <Badge variant={result.success ? 'green' : 'red'}>{result.success ? 'Success' : 'Failed'}</Badge>
            {result.latencyMs && <Badge variant="gray"><Clock size={10} className="inline mr-0.5" />{result.latencyMs}ms</Badge>}
          </div>
          <CodeBlock code={result} maxHeight="150px" />
        </div>
      )}
    </div>
  )
}

export default function ComparisonTab() {
  const [metaResult, setMetaResult] = useState(null)
  const [baileysResult, setBaileysResult] = useState(null)
  const [metaLoading, setMetaLoading] = useState(false)
  const [baileysLoading, setBaileysLoading] = useState(false)

  function handleResult(api, result) {
    if (api === 'meta') { setMetaResult(result); setMetaLoading(false) }
    else { setBaileysResult(result); setBaileysLoading(false) }
  }

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-lg font-semibold mb-1">API Comparison</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Compare Meta's official Cloud API with Baileys (unofficial). Send the same message through both to see the differences.
        </p>

        {/* Comparison table */}
        <div className="mb-6 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase">Feature</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-blue-500 uppercase">Meta Cloud API</th>
                <th className="px-4 py-2 text-left text-xs font-semibold text-yellow-500 uppercase">Baileys (Unofficial)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {[
                ['Auth', 'Bearer Token + Phone Number ID', 'QR Code scan'],
                ['Business Account', 'Required', 'Personal account OK'],
                ['Approved Templates', 'Required for first message', 'Not required'],
                ['ToS Compliance', '✅ Official', '⚠️ Against WhatsApp ToS'],
                ['Rate Limits', '1000 msgs/day (free tier)', 'Depends on account'],
                ['Webhooks', 'Built-in via Meta console', 'Via event listeners'],
                ['Media Support', 'URLs + Media IDs', 'Direct upload'],
                ['Setup Complexity', 'Meta Developer Console', 'Just scan a QR code'],
              ].map(([feature, meta, baileys]) => (
                <tr key={feature} className="bg-white dark:bg-gray-900">
                  <td className="px-4 py-2 text-gray-600 dark:text-gray-400 font-medium">{feature}</td>
                  <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{meta}</td>
                  <td className="px-4 py-2 text-gray-800 dark:text-gray-200">{baileys}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Side-by-side send panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <MetaApiPanel onResult={handleResult} loading={metaLoading} result={metaResult} />
          <BaileysPanel onResult={handleResult} loading={baileysLoading} result={baileysResult} />
        </div>

        {/* Result diff */}
        {(metaResult || baileysResult) && (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-xs font-semibold text-blue-500 uppercase mb-2">Meta Response</h3>
              <CodeBlock code={metaResult || { status: 'not sent yet' }} maxHeight="200px" />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-yellow-500 uppercase mb-2">Baileys Response</h3>
              <CodeBlock code={baileysResult || { status: 'not sent yet' }} maxHeight="200px" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
