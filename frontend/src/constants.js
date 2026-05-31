export const LS_KEYS = {
  BACKEND_URL: 'wa_backend_url',
  WA_TOKEN: 'wa_token',
  WA_PHONE_NUMBER_ID: 'wa_phone_number_id',
  AI_PROXY_URL: 'wa_ai_proxy_url',
  AI_API_KEY: 'wa_ai_api_key',
  AI_PROVIDER: 'wa_ai_provider',
  AI_MODEL: 'wa_ai_model',
  THEME: 'wa_theme',
  CHATBOT_SYSTEM_PROMPT: 'wa_chatbot_system_prompt',
  CHATBOT_ENABLED: 'wa_chatbot_enabled',
  WEBHOOK_VERIFY_TOKEN: 'wa_webhook_verify_token',
}

export const APP_BASE = import.meta.env.VITE_APP_BASE || '/WhatsAppAPIExplorer/'
export const DEFAULT_BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'
export const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

export const PROVIDERS = [
  { id: 'anthropic', label: 'Anthropic', defaultModel: 'claude-haiku-4-5-20251001' },
  { id: 'openai', label: 'OpenAI', defaultModel: 'gpt-4o-mini' },
  { id: 'gemini', label: 'Gemini', defaultModel: 'gemini-pro' },
  { id: 'litellm', label: 'LiteLLM', defaultModel: 'gpt-4o-mini' },
]

export const TABS = [
  { id: 'chatbot', label: 'AI Chatbot', icon: 'Bot' },
  { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard' },
  { id: 'contacts', label: 'Contacts', icon: 'Users' },
  { id: 'comparison', label: 'API Compare', icon: 'GitCompare' },
  { id: 'settings', label: 'Settings', icon: 'Settings' },
]
