import { useState, useEffect, useRef } from 'react'
import { Send, Bot, X, ChevronDown, RefreshCw } from 'lucide-react'
import axios from 'axios'
import { useWhatsApp } from '../../contexts/WhatsAppContext'
import { useSettings } from '../../contexts/SettingsContext'
import { useBackendApi } from '../../hooks/useBackendApi'
import { PROVIDERS } from '../../constants'
import { formatTime } from '../../lib/formatters'
import { EmptyState, LoadingSpinner } from '../shared/Helpers'

function MessageBubble({ msg }) {
  const isOut = msg.direction === 'outbound'
  return (
    <div className={`flex ${isOut ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-xs lg:max-w-md px-3 py-2 rounded-2xl text-sm shadow-sm ${
        isOut
          ? 'bg-green-500 text-white rounded-br-sm'
          : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-600'
      }`}>
        <p className="break-words">{msg.content}</p>
        <div className={`flex items-center justify-end gap-1 mt-1 text-xs ${isOut ? 'text-green-100' : 'text-gray-400'}`}>
          <span>{formatTime(msg.timestamp)}</span>
          {isOut && <span>{msg.status === 'read' ? '✓✓' : '✓'}</span>}
        </div>
      </div>
    </div>
  )
}

function BotConfigPanel({ onClose, provider, setProvider, model, setModel, systemPrompt, setSystemPrompt }) {
  const { backendUrl, aiApiKey, aiProxyUrl } = useSettings()
  const [models, setModels] = useState([])
  const [modelsLoading, setModelsLoading] = useState(false)

  async function loadModels(p) {
    if (!aiApiKey || !backendUrl) return
    setModelsLoading(true)
    setModels([])
    try {
      const res = await axios.get(`${backendUrl}/api/ai/models/${p}`, {
        headers: { 'X-AI-Key': aiApiKey, 'X-Proxy-Url': aiProxyUrl },
        timeout: 10000
      })
      const list = res.data.models || []
      setModels(list)
      if (list.length > 0 && !list.includes(model)) setModel(list[0])
    } catch {
      setModels([])
    } finally {
      setModelsLoading(false)
    }
  }

  // Load models on mount and when provider changes
  useEffect(() => { loadModels(provider) }, [provider]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleProviderChange(e) {
    setProvider(e.target.value)
    // useEffect will fire loadModels via provider dependency
  }

  return (
    <div className="absolute right-0 top-0 bottom-0 w-72 bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-xl z-10 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <span className="font-medium text-sm">Bot Configuration</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X size={16} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Provider</label>
          <select value={provider} onChange={handleProviderChange}
            className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
            {PROVIDERS.map(p => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Model</label>
            <button onClick={() => loadModels(provider)} disabled={modelsLoading || !aiApiKey}
              className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-40" title="Refresh models">
              <RefreshCw size={12} className={`text-gray-400 ${modelsLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          {models.length > 0 ? (
            <select value={model} onChange={e => setModel(e.target.value)}
              className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700">
              {models.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          ) : (
            <div className="space-y-1">
              <input value={model} onChange={e => setModel(e.target.value)}
                className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                placeholder={modelsLoading ? 'Loading...' : 'Enter model name'} />
              {!aiApiKey && <p className="text-xs text-gray-400">Set API key in Settings to load models</p>}
            </div>
          )}
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">System Prompt</label>
          <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={5}
            className="w-full px-2 py-1.5 text-sm rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 resize-none" />
        </div>
      </div>
    </div>
  )
}

export default function ChatbotTab() {
  const { messages } = useWhatsApp()
  const { aiProvider, setAiProvider, aiModel, setAiModel, chatbotSystemPrompt, setChatbotSystemPrompt } = useSettings()
  const { call, isDemo } = useBackendApi()
  const [showConfig, setShowConfig] = useState(false)
  const [testInput, setTestInput] = useState('')
  const [testing, setTesting] = useState(false)
  const [testReply, setTestReply] = useState('')
  const [events, setEvents] = useState([])
  const bottomRef = useRef(null)

  useEffect(() => {
    if (messages.length > 0) setEvents(prev => [messages[0], ...prev].slice(0, 100))
  }, [messages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function testAiReply() {
    if (!testInput.trim()) return
    setTesting(true)
    setTestReply('')
    try {
      const data = await call('POST', '/api/ai/chat', {
        provider: aiProvider,
        model: aiModel,
        messages: [{ role: 'user', content: testInput }],
        systemPrompt: chatbotSystemPrompt
      })
      setTestReply(data.response || data.error || 'No response')
    } catch (err) {
      const msg = err.response?.data?.error || err.response?.data?.message || err.message
      setTestReply(`Error: ${msg}`)
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="h-full flex">
      {/* Chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
          <div className="flex items-center gap-2">
            <Bot size={18} className="text-green-500" />
            <span className="text-sm font-medium">AI Chatbot via WhatsApp</span>
          </div>
          <button onClick={() => setShowConfig(s => !s)}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700">
            Configure <ChevronDown size={12} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900"
          style={{ backgroundImage: 'radial-gradient(circle, #e5e7eb 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
          {messages.length === 0 ? (
            <EmptyState icon={Bot} title="No messages yet" description="Send a WhatsApp message to your connected number to see it appear here" />
          ) : (
            <>
              {[...messages].reverse().map(m => <MessageBubble key={m.id || Math.random()} msg={m} />)}
              <div ref={bottomRef} />
            </>
          )}
        </div>

        {/* Test AI reply */}
        <div className="border-t border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">Test AI Reply (simulates what the bot would say)</div>
          {testReply && (
            <div className={`mb-2 p-2 rounded-lg text-sm border ${testReply.startsWith('Error:') ? 'bg-red-50 dark:bg-red-900/30 text-red-800 dark:text-red-200 border-red-200 dark:border-red-800' : 'bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-200 border-green-200 dark:border-green-800'}`}>
              <strong>{testReply.startsWith('Error:') ? '⚠' : 'AI'}:</strong> {testReply.replace(/^Error: /, '')}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={testInput}
              onChange={e => setTestInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && testAiReply()}
              placeholder="Type a test message..."
              className="flex-1 px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={testAiReply}
              disabled={testing || !testInput.trim()}
              className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 disabled:opacity-50"
            >
              {testing ? <LoadingSpinner size="sm" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>

      {/* Live event log */}
      <div className="w-72 flex flex-col border-l border-gray-200 dark:border-gray-700 hidden lg:flex">
        <div className="px-3 py-2 border-b border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-500 uppercase tracking-wider">
          Live Webhook Events
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {events.length === 0 ? (
            <p className="text-xs text-gray-400 text-center pt-4">Events appear here in real-time</p>
          ) : (
            events.map((e, i) => (
              <div key={i} className="text-xs rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="px-2 py-1 bg-gray-100 dark:bg-gray-700 font-mono text-gray-500 truncate">
                  {e.direction} · {e.type} · {e.source}
                </div>
                <pre className="p-2 overflow-x-auto text-gray-700 dark:text-gray-300 max-h-20">{e.content}</pre>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Bot config panel */}
      {showConfig && (
        <div className="relative">
          <BotConfigPanel
            onClose={() => setShowConfig(false)}
            provider={aiProvider} setProvider={setAiProvider}
            model={aiModel} setModel={setAiModel}
            systemPrompt={chatbotSystemPrompt} setSystemPrompt={setChatbotSystemPrompt}
          />
        </div>
      )}
    </div>
  )
}
