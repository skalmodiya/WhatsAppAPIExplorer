import { useState } from 'react'
import { Bot, LayoutDashboard, Users, GitCompare, Settings, MessageSquare } from 'lucide-react'
import { useConnection } from '../contexts/ConnectionContext'
import { useWhatsApp } from '../contexts/WhatsAppContext'
import { DEMO_MODE } from '../constants'
import ChatbotTab from './tabs/ChatbotTab'
import DashboardTab from './tabs/DashboardTab'
import ContactsTab from './tabs/ContactsTab'
import ComparisonTab from './tabs/ComparisonTab'
import SettingsTab from './tabs/SettingsTab'

const TABS = [
  { id: 0, label: 'AI Chatbot', Icon: Bot },
  { id: 1, label: 'Dashboard', Icon: LayoutDashboard },
  { id: 2, label: 'Contacts', Icon: Users },
  { id: 3, label: 'API Compare', Icon: GitCompare },
  { id: 4, label: 'Settings', Icon: Settings },
]

function StatusBar({ activeTab, setActiveTab }) {
  const { backendOnline, socketConnected } = useConnection()
  const { baileysConnected } = useWhatsApp()
  const isDemo = DEMO_MODE || !backendOnline

  return (
    <div className="flex items-center gap-3 px-4 py-1.5 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 text-xs">
      {isDemo && (
        <span className="flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-2 py-0.5 rounded">
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
          Demo Mode — Connect backend for live data
        </span>
      )}
      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
        <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-green-500' : 'bg-red-400'}`} />
        Backend {backendOnline ? 'online' : 'offline'}
      </span>
      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
        <span className={`w-2 h-2 rounded-full ${baileysConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
        Baileys {baileysConnected ? 'connected' : 'disconnected'}
      </span>
    </div>
  )
}

export default function Layout() {
  const [activeTab, setActiveTab] = useState(4) // Start on Settings

  const tabs = [
    <ChatbotTab key="chatbot" />,
    <DashboardTab key="dashboard" />,
    <ContactsTab key="contacts" />,
    <ComparisonTab key="comparison" />,
    <SettingsTab key="settings" />,
  ]

  return (
    <div className="flex flex-col h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 bg-green-600 text-white shadow-md">
        <MessageSquare size={22} />
        <h1 className="font-bold text-lg tracking-tight">WhatsApp API Explorer</h1>
        <span className="ml-1 text-green-200 text-sm hidden sm:inline">Learn WhatsApp APIs with AI</span>
      </header>

      {/* Status bar */}
      <StatusBar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Tab bar */}
      <nav className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-x-auto">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === id
                ? 'border-green-500 text-green-600 dark:text-green-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </nav>

      {/* Tab content */}
      <main className="flex-1 overflow-hidden">
        {tabs[activeTab]}
      </main>
    </div>
  )
}
