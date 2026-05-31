import { useState } from 'react'
import { Eye, EyeOff, CheckCircle, XCircle, Trash2, RefreshCw } from 'lucide-react'
import { useSettings } from '../../contexts/SettingsContext'
import { useConnection } from '../../contexts/ConnectionContext'
import { PROVIDERS } from '../../constants'
import { ErrorBanner } from '../shared/Helpers'

function InputRow({ label, description, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-2 py-3 border-b border-gray-100 dark:border-gray-800">
      <div className="sm:w-48 shrink-0">
        <div className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</div>
        {description && <div className="text-xs text-gray-400 mt-0.5">{description}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  )
}

function SecretInput({ value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="flex gap-2">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
      />
      <button onClick={() => setShow(s => !s)} className="p-1.5 rounded text-gray-400 hover:text-gray-600">
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text' }) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
    />
  )
}

export default function SettingsTab() {
  const {
    backendUrl, setBackendUrl,
    waToken, setWaToken,
    waPhoneNumberId, setWaPhoneNumberId,
    aiProxyUrl, setAiProxyUrl,
    aiApiKey, setAiApiKey,
    aiProvider, setAiProvider,
    aiModel, setAiModel,
    chatbotSystemPrompt, setChatbotSystemPrompt,
    chatbotEnabled, setChatbotEnabled,
    clearAll,
  } = useSettings()
  const { backendOnline, checkHealth } = useConnection()

  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  async function testConnection() {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await fetch(`${backendUrl}/api/health`, { signal: AbortSignal.timeout(4000) })
      if (res.ok) {
        const data = await res.json()
        setTestResult({ ok: true, msg: `Connected! DB: ${data.db}, Baileys: ${data.baileys}` })
      } else {
        setTestResult({ ok: false, msg: `HTTP ${res.status}` })
      }
    } catch (err) {
      setTestResult({ ok: false, msg: err.message })
    } finally {
      setTesting(false)
      checkHealth()
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4 max-w-2xl mx-auto">
      <h2 className="text-lg font-semibold mb-4">Settings</h2>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        All settings are stored in your browser's localStorage. Nothing is sent to any server except your configured backend.
      </p>

      {/* Backend */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Backend</h3>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 px-4">
          <InputRow label="Backend URL" description="Your local Node.js server">
            <div className="flex gap-2">
              <TextInput value={backendUrl} onChange={setBackendUrl} placeholder="http://localhost:3001" type="url" />
              <button
                onClick={testConnection}
                disabled={testing}
                className="flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 whitespace-nowrap"
              >
                {testing ? <RefreshCw size={14} className="animate-spin" /> : null}
                Test
              </button>
            </div>
            {testResult && (
              <div className={`mt-2 flex items-center gap-1 text-xs ${testResult.ok ? 'text-green-600' : 'text-red-600'}`}>
                {testResult.ok ? <CheckCircle size={13} /> : <XCircle size={13} />}
                {testResult.msg}
              </div>
            )}
          </InputRow>
        </div>
      </section>

      {/* WhatsApp */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">WhatsApp (Meta Cloud API)</h3>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 px-4">
          <InputRow label="Phone Number ID" description="From Meta Developer Console">
            <TextInput value={waPhoneNumberId} onChange={setWaPhoneNumberId} placeholder="123456789012345" />
          </InputRow>
          <InputRow label="Access Token" description="Permanent or temporary token">
            <SecretInput value={waToken} onChange={setWaToken} placeholder="EAAxxxx..." />
          </InputRow>
        </div>
      </section>

      {/* AI Proxy */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">AI Proxy</h3>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 px-4">
          <InputRow label="Proxy URL" description="Your local AI proxy server">
            <TextInput value={aiProxyUrl} onChange={setAiProxyUrl} placeholder="http://localhost:6655" type="url" />
          </InputRow>
          <InputRow label="API Key" description="Forwarded as Bearer token">
            <SecretInput value={aiApiKey} onChange={setAiApiKey} placeholder="sk-..." />
          </InputRow>
          <InputRow label="Provider">
            <select
              value={aiProvider}
              onChange={e => setAiProvider(e.target.value)}
              className="w-full px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </InputRow>
          <InputRow label="Model">
            <TextInput value={aiModel} onChange={setAiModel} placeholder={PROVIDERS.find(p => p.id === aiProvider)?.defaultModel} />
          </InputRow>
        </div>
      </section>

      {/* Chatbot */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">AI Chatbot</h3>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 px-4">
          <InputRow label="Auto Reply" description="Automatically reply to incoming WhatsApp messages">
            <label className="flex items-center gap-2 cursor-pointer">
              <div
                onClick={() => setChatbotEnabled(!chatbotEnabled)}
                className={`relative w-10 h-5 rounded-full transition-colors ${chatbotEnabled ? 'bg-green-500' : 'bg-gray-300'}`}
              >
                <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${chatbotEnabled ? 'translate-x-5' : ''}`} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400">{chatbotEnabled ? 'Enabled' : 'Disabled'}</span>
            </label>
          </InputRow>
          <InputRow label="System Prompt" description="Instructions for the AI">
            <textarea
              value={chatbotSystemPrompt}
              onChange={e => setChatbotSystemPrompt(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </InputRow>
        </div>
      </section>

      {/* Danger zone */}
      <section className="mb-6">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-red-400 mb-2">Danger Zone</h3>
        <div className="rounded-xl border border-red-200 dark:border-red-900 px-4 py-3">
          {confirmClear ? (
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-600 dark:text-gray-400">Are you sure? All settings will be reset.</span>
              <button onClick={() => { clearAll(); setConfirmClear(false) }} className="px-3 py-1 text-sm rounded bg-red-600 text-white hover:bg-red-700">Yes, clear</button>
              <button onClick={() => setConfirmClear(false)} className="px-3 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">Cancel</button>
            </div>
          ) : (
            <button onClick={() => setConfirmClear(true)} className="flex items-center gap-2 text-sm text-red-600 hover:text-red-700">
              <Trash2 size={14} /> Clear all settings
            </button>
          )}
        </div>
      </section>
    </div>
  )
}
