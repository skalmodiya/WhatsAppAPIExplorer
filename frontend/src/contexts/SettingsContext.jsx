import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { LS_KEYS, DEFAULT_BACKEND_URL, PROVIDERS } from '../constants'
import * as storage from '../lib/storage'

const SettingsContext = createContext(null)

// Keys that the backend chatbot needs to function
const BACKEND_SYNC_KEYS = [
  LS_KEYS.WA_TOKEN,
  LS_KEYS.WA_PHONE_NUMBER_ID,
  LS_KEYS.AI_API_KEY,
  LS_KEYS.AI_PROXY_URL,
  LS_KEYS.AI_PROVIDER,
  LS_KEYS.AI_MODEL,
  LS_KEYS.CHATBOT_SYSTEM_PROMPT,
  LS_KEYS.CHATBOT_ENABLED,
]

async function syncToBackend(backendUrl, key, value) {
  if (!backendUrl) return
  try {
    await fetch(`${backendUrl}/api/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value: String(value) }),
      signal: AbortSignal.timeout(3000)
    })
  } catch {
    // non-blocking — backend may be offline
  }
}

export function SettingsProvider({ children }) {
  const [backendUrl, setBackendUrlState] = useState(() => storage.get(LS_KEYS.BACKEND_URL, DEFAULT_BACKEND_URL))
  const [waToken, setWaTokenState] = useState(() => storage.get(LS_KEYS.WA_TOKEN, ''))
  const [waPhoneNumberId, setWaPhoneNumberIdState] = useState(() => storage.get(LS_KEYS.WA_PHONE_NUMBER_ID, ''))
  const [aiProxyUrl, setAiProxyUrlState] = useState(() => storage.get(LS_KEYS.AI_PROXY_URL, 'http://localhost:6655'))
  const [aiApiKey, setAiApiKeyState] = useState(() => storage.get(LS_KEYS.AI_API_KEY, ''))
  const [aiProvider, setAiProviderState] = useState(() => storage.get(LS_KEYS.AI_PROVIDER, 'anthropic'))
  const [aiModel, setAiModelState] = useState(() => storage.get(LS_KEYS.AI_MODEL, PROVIDERS[0].defaultModel))
  const [chatbotSystemPrompt, setChatbotSystemPromptState] = useState(() => storage.get(LS_KEYS.CHATBOT_SYSTEM_PROMPT, 'You are a helpful WhatsApp assistant. Be concise and friendly.'))
  const [chatbotEnabled, setChatbotEnabledState] = useState(() => storage.get(LS_KEYS.CHATBOT_ENABLED, 'false') === 'true')

  // On mount: push all current localStorage settings to backend so chatbot has them
  useEffect(() => {
    if (!backendUrl) return
    BACKEND_SYNC_KEYS.forEach(key => {
      const value = storage.get(key, '')
      if (value) syncToBackend(backendUrl, key, value)
    })
  }, [backendUrl])

  function setter(lsKey, stateSetter) {
    return (value) => {
      storage.set(lsKey, String(value))
      stateSetter(value)
      if (BACKEND_SYNC_KEYS.includes(lsKey)) {
        syncToBackend(backendUrl, lsKey, value)
      }
    }
  }

  const clearAll = useCallback(() => {
    storage.clearAll()
    setBackendUrlState(DEFAULT_BACKEND_URL)
    setWaTokenState('')
    setWaPhoneNumberIdState('')
    setAiProxyUrlState('http://localhost:6655')
    setAiApiKeyState('')
    setAiProviderState('anthropic')
    setAiModelState(PROVIDERS[0].defaultModel)
    setChatbotSystemPromptState('You are a helpful WhatsApp assistant. Be concise and friendly.')
    setChatbotEnabledState(false)
  }, [])

  return (
    <SettingsContext.Provider value={{
      backendUrl, setBackendUrl: setter(LS_KEYS.BACKEND_URL, setBackendUrlState),
      waToken, setWaToken: setter(LS_KEYS.WA_TOKEN, setWaTokenState),
      waPhoneNumberId, setWaPhoneNumberId: setter(LS_KEYS.WA_PHONE_NUMBER_ID, setWaPhoneNumberIdState),
      aiProxyUrl, setAiProxyUrl: setter(LS_KEYS.AI_PROXY_URL, setAiProxyUrlState),
      aiApiKey, setAiApiKey: setter(LS_KEYS.AI_API_KEY, setAiApiKeyState),
      aiProvider, setAiProvider: setter(LS_KEYS.AI_PROVIDER, setAiProviderState),
      aiModel, setAiModel: setter(LS_KEYS.AI_MODEL, setAiModelState),
      chatbotSystemPrompt, setChatbotSystemPrompt: setter(LS_KEYS.CHATBOT_SYSTEM_PROMPT, setChatbotSystemPromptState),
      chatbotEnabled, setChatbotEnabled: (v) => {
        storage.set(LS_KEYS.CHATBOT_ENABLED, String(v))
        setChatbotEnabledState(v)
        syncToBackend(backendUrl, LS_KEYS.CHATBOT_ENABLED, String(v))
      },
      clearAll
    }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings() {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used within SettingsProvider')
  return ctx
}
