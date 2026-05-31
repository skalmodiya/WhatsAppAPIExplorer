import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, ChevronDown, ChevronRight, MessageCircle } from 'lucide-react'
import { useBackendApi } from '../../hooks/useBackendApi'
import { useSocket } from '../../hooks/useSocket'
import { formatTime, formatDate, formatRelative } from '../../lib/formatters'
import { Badge } from '../shared/Badge'
import { LoadingSpinner, EmptyState } from '../shared/Helpers'

function Avatar({ name }) {
  const initials = (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const colors = ['bg-green-500', 'bg-blue-500', 'bg-purple-500', 'bg-yellow-500', 'bg-red-500']
  const color = colors[name?.charCodeAt(0) % colors.length] || 'bg-gray-500'
  return (
    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${color}`}>
      {initials}
    </div>
  )
}

function ConversationItem({ conv, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors border-b border-gray-100 dark:border-gray-800 ${selected ? 'bg-green-50 dark:bg-green-900/20' : ''}`}
    >
      <Avatar name={conv.display_name || conv.phone_number} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium truncate">{conv.display_name || conv.phone_number}</span>
          <span className="text-xs text-gray-400 shrink-0 ml-2">{formatRelative(conv.last_message_at)}</span>
        </div>
        <div className="flex items-center justify-between mt-0.5">
          <span className="text-xs text-gray-500 truncate">{conv.last_message || 'No messages'}</span>
          {conv.unread_count > 0 && (
            <span className="ml-2 w-5 h-5 rounded-full bg-green-500 text-white text-xs flex items-center justify-center shrink-0">
              {conv.unread_count}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

function MessageThread({ conv, messages, onSend }) {
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const [summary, setSummary] = useState(null)
  const [summaryLoading, setSummaryLoading] = useState(false)
  const [suggestions, setSuggestions] = useState([])
  const [suggestLoading, setSuggestLoading] = useState(false)
  const { call } = useBackendApi()
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function sendReply() {
    if (!reply.trim()) return
    setSending(true)
    try {
      await call('POST', `/api/conversations/${conv.id}/reply`, { body: reply })
      setReply('')
      onSend?.()
    } catch (err) {
      console.error(err)
    } finally { setSending(false) }
  }

  async function getSummary() {
    setSummaryLoading(true)
    try {
      const data = await call('POST', `/api/conversations/${conv.id}/summarize`, {})
      setSummary(data.summary)
    } catch {} finally { setSummaryLoading(false) }
  }

  async function getSuggestions() {
    setSuggestLoading(true)
    try {
      const data = await call('POST', '/api/ai/suggest-replies', { conversationId: conv.id })
      setSuggestions(data.suggestions || [])
    } catch {} finally { setSuggestLoading(false) }
  }

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        <Avatar name={conv.display_name} />
        <div>
          <div className="font-medium text-sm">{conv.display_name || conv.phone_number}</div>
          <div className="text-xs text-gray-400">{conv.phone_number} · {conv.source}</div>
        </div>
        <div className="ml-auto flex gap-2">
          <button onClick={getSummary} disabled={summaryLoading}
            className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700 disabled:opacity-50">
            {summaryLoading ? <LoadingSpinner size="sm" /> : <Sparkles size={12} />} Summarize
          </button>
        </div>
      </div>

      {/* Summary */}
      {summary && (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-200">
          <strong>AI Summary:</strong> {summary}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-gray-50 dark:bg-gray-900">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs lg:max-w-sm px-3 py-2 rounded-2xl text-sm shadow-sm ${
              msg.direction === 'outbound'
                ? 'bg-green-500 text-white rounded-br-sm'
                : 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-200 dark:border-gray-600'
            }`}>
              <p className="break-words">{msg.content}</p>
              <div className={`text-xs mt-1 ${msg.direction === 'outbound' ? 'text-green-100 text-right' : 'text-gray-400'}`}>
                {formatTime(msg.timestamp)}
              </div>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* AI suggestions */}
      {suggestions.length > 0 && (
        <div className="px-4 py-2 flex gap-2 flex-wrap border-t border-gray-100 dark:border-gray-800">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => setReply(s)}
              className="text-xs px-2 py-1 rounded-full border border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30">
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Reply bar */}
      <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <button onClick={getSuggestions} disabled={suggestLoading}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-green-500">
          {suggestLoading ? <LoadingSpinner size="sm" /> : <Sparkles size={16} />}
        </button>
        <input
          value={reply}
          onChange={e => setReply(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendReply()}
          placeholder="Type a reply..."
          className="flex-1 px-3 py-2 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
        <button onClick={sendReply} disabled={sending || !reply.trim()}
          className="p-2 rounded-full bg-green-500 text-white hover:bg-green-600 disabled:opacity-50">
          {sending ? <LoadingSpinner size="sm" /> : <Send size={16} />}
        </button>
      </div>
    </div>
  )
}

export default function ContactsTab() {
  const { call } = useBackendApi()
  const [conversations, setConversations] = useState([])
  const [selectedId, setSelectedId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useSocket('wa:message', (msg) => {
    if (msg.conversationId === selectedId) {
      setMessages(prev => [...prev, msg])
    }
    setConversations(prev => prev.map(c =>
      c.id === msg.conversationId ? { ...c, last_message: msg.content, last_message_at: msg.timestamp } : c
    ))
  })

  useEffect(() => {
    call('GET', '/api/conversations?limit=30').then(data => {
      setConversations(data.conversations || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [call])

  const selectedConv = conversations.find(c => c.id === selectedId)

  async function selectConversation(id) {
    setSelectedId(id)
    const data = await call('GET', `/api/conversations/${id}/messages?limit=50`).catch(() => ({ messages: [] }))
    setMessages(data.messages || [])
  }

  const filtered = conversations.filter(c =>
    !search || (c.display_name || c.phone_number || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="h-full flex">
      {/* Left panel */}
      <div className="w-72 flex flex-col border-r border-gray-200 dark:border-gray-700 shrink-0">
        <div className="p-3 border-b border-gray-200 dark:border-gray-700">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contacts..."
            className="w-full px-3 py-1.5 text-sm rounded-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-1 focus:ring-green-500" />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex justify-center pt-8"><LoadingSpinner /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={MessageCircle} title="No conversations" description="Messages from WhatsApp appear here" />
          ) : (
            filtered.map(conv => (
              <ConversationItem
                key={conv.id}
                conv={conv}
                selected={conv.id === selectedId}
                onClick={() => selectConversation(conv.id)}
              />
            ))
          )}
        </div>
      </div>

      {/* Right panel */}
      {selectedConv ? (
        <MessageThread conv={selectedConv} messages={messages} onSend={() => selectConversation(selectedId)} />
      ) : (
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <EmptyState icon={MessageCircle} title="Select a conversation" description="Choose a conversation from the left panel" />
        </div>
      )}
    </div>
  )
}
