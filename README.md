# WhatsApp API Explorer

An educational full-stack app for learning and exploring WhatsApp APIs — both the official Meta Cloud API and the unofficial Baileys library — with AI-powered features.

## Live Demo

**GitHub Pages:** https://skalmodiya.github.io/WhatsAppAPIExplorer/

> Demo mode is active on GitHub Pages — all UI features work with realistic mock data. Connect a local backend for live WhatsApp integration.

---

## Features

### 5 Tabs

| Tab | Description |
|-----|-------------|
| **AI Chatbot** | WhatsApp as a chat interface — incoming messages trigger AI replies via your local proxy |
| **Dashboard** | Send text, templates, media; live webhook event log; raw API tester |
| **Contacts** | View conversation history, AI-powered summaries, smart reply suggestions |
| **API Compare** | Side-by-side Meta Cloud API vs Baileys — QR code scanner + latency comparison |
| **Settings** | Configure API keys (stored in localStorage), backend URL, AI provider/model |

### AI Integration
- Supports **Anthropic**, **OpenAI**, **Gemini**, and **LiteLLM** via your local proxy
- API key entered in the app — never committed to git
- AI chatbot auto-reply, conversation summarization, smart reply suggestions

### WhatsApp APIs
- **Meta Cloud API** (official): production-grade, bearer token auth, webhook support
- **Baileys** (unofficial): QR code session, event-based, no business account required

---

## Local Setup

### Prerequisites
- Node.js 20+
- A Meta Developer account (for official API) or any WhatsApp account (for Baileys)
- Local AI proxy running at `http://localhost:6655` (optional — app works without it)

### 1. Clone and Install

```bash
git clone https://github.com/skalmodiya/WhatsAppAPIExplorer.git
cd WhatsAppAPIExplorer

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

### 2. Configure Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your values
```

Key `.env` variables:
```env
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_TOKEN=your_meta_access_token
WEBHOOK_VERIFY_TOKEN=whatsapp_explorer_verify
AI_PROXY_URL=http://localhost:6655
AI_API_KEY=your_ai_proxy_key
```

### 3. Start the App

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# Backend starts on http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# Frontend starts on http://localhost:5173/WhatsAppAPIExplorer/
```

### 4. Configure in the App

Open the **Settings** tab and enter:
- Backend URL: `http://localhost:3001`
- WhatsApp Phone Number ID (from Meta Developer Console)
- WhatsApp Access Token
- AI Proxy URL + API Key
- Select your AI provider and model

Click **Test Connection** to verify the backend is reachable.

---

## Webhook Setup (Meta Cloud API)

Meta requires a publicly accessible HTTPS webhook URL. Use a tunnel during development:

```bash
# Option 1: ngrok
ngrok http 3001
# Copy the HTTPS URL, e.g. https://abc123.ngrok.io

# Option 2: localtunnel
npx localtunnel --port 3001
```

Then in the [Meta Developer Console](https://developers.facebook.com/):
1. Go to your App → WhatsApp → Configuration
2. Set Webhook URL: `https://your-tunnel.ngrok.io/webhook`
3. Set Verify Token: `whatsapp_explorer_verify` (or your custom value from `.env`)
4. Subscribe to `messages` and `message_statuses`

---

## Baileys (Unofficial API)

1. Go to the **API Compare** tab
2. Click **Connect via QR Code**
3. Scan the QR code with your WhatsApp mobile app
4. Session is saved in `backend/sessions/` — no need to re-scan on restart

> ⚠️ **Warning:** Using Baileys in production violates WhatsApp's Terms of Service. It's intended for educational/personal use only.

---

## Architecture

```
WhatsAppAPIExplorer/
├── frontend/          React 19 + Vite + Tailwind CSS v4 (→ GitHub Pages)
├── backend/           Node.js + Express 5 + SQLite (→ localhost:3001)
│   ├── services/
│   │   ├── metaWhatsApp.js    Meta Cloud API client
│   │   ├── baileysService.js  Baileys WebSocket client
│   │   ├── aiProxy.js         Routes to local AI proxy
│   │   └── webhookProcessor.js Parses Meta webhooks, saves to DB
│   └── db/
│       └── database.js        SQLite with WAL mode
└── .github/workflows/ GitHub Actions → auto-deploy frontend to Pages
```

**Real-time:** Socket.io connects frontend to backend for live webhook events and Baileys QR codes.

**Demo mode:** When the backend is unreachable, the frontend automatically serves realistic mock data — the full UI is interactive on GitHub Pages without any backend.

---

## AI Proxy Endpoints

| Provider | Base URL |
|----------|----------|
| Anthropic | `http://localhost:6655/anthropic/v1` |
| OpenAI | `http://localhost:6655/openai/v1` |
| Gemini | `http://localhost:6655/gemini` |
| LiteLLM | `http://localhost:6655/litellm/v1` |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS v4, lucide-react, Socket.io-client |
| Backend | Node.js, Express 5, better-sqlite3, Socket.io |
| WhatsApp | Meta Cloud API v18.0, @whiskeysockets/baileys |
| AI | Anthropic/OpenAI/Gemini/LiteLLM via local proxy |
| Deploy | GitHub Actions → GitHub Pages |

---

## Contributing

This is an educational project. PRs welcome for new WhatsApp API features, improved AI integrations, or UI improvements.

## License

MIT
