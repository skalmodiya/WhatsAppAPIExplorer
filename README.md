# WhatsApp API Explorer

An educational full-stack app for learning and exploring WhatsApp APIs — both the official **Meta Cloud API** and the unofficial **Baileys** library — with AI-powered features including an auto-reply chatbot, conversation summarization, and smart reply suggestions.

## Links

| | URL |
|---|---|
| **GitHub Repo** | https://github.com/skalmodiya/WhatsAppAPIExplorer |
| **Live Demo (GitHub Pages)** | https://skalmodiya.github.io/WhatsAppAPIExplorer/ |

> The live demo runs in **Demo Mode** — all 5 tabs are interactive with realistic mock data. Connect your local backend for live WhatsApp integration.

---

## Features

| Tab | What you can do |
|-----|----------------|
| **AI Chatbot** | Incoming WhatsApp messages appear in real-time. AI auto-replies via your local proxy. Test AI responses interactively. |
| **Dashboard** | Send text, template and media messages. Live webhook event log. Raw API tester with endpoint shortcuts. |
| **Contacts** | Browse conversation history, view full message threads, generate AI summaries, get AI-powered reply suggestions. |
| **API Compare** | Side-by-side Meta Cloud API vs Baileys. QR code scanner for Baileys. Latency comparison. Feature comparison table. |
| **Settings** | Configure all API keys (stored in localStorage + synced to backend). Provider and model dropdowns auto-populate from your proxy. |

---

## Prerequisites

- **Node.js 20+**
- A **Meta Developer account** (for Meta Cloud API)
- A **local AI proxy** running at `http://localhost:6655` (Anthropic / OpenAI / Gemini / LiteLLM)

---

## Step-by-Step Local Setup

### Step 1 — Clone the repo

```bash
git clone https://github.com/skalmodiya/WhatsAppAPIExplorer.git
cd WhatsAppAPIExplorer
```

### Step 2 — Install dependencies

```bash
# Frontend
cd frontend && npm install

# Backend
cd ../backend && npm install
```

### Step 3 — Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your values:

```env
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_TOKEN=your_meta_access_token
WEBHOOK_VERIFY_TOKEN=whatsapp_explorer_verify
AI_PROXY_URL=http://localhost:6655
AI_API_KEY=your_ai_proxy_key
```

### Step 4 — Start the backend

```bash
# In terminal 1
cd backend
npm run dev
# Backend starts on http://localhost:3001
```

You should see:
```
SQLite database initialized at ./data/whatsapp.db
WhatsApp API Explorer backend running on http://localhost:3001
```

### Step 5 — Start the frontend

```bash
# In terminal 2
cd frontend
npm run dev
# Opens at http://localhost:5173/WhatsAppAPIExplorer/
```

### Step 6 — Configure the app

Open the app in your browser → go to the **Settings tab**:

| Field | Value |
|-------|-------|
| Backend URL | `http://localhost:3001` |
| Phone Number ID | From Meta Developer Console |
| Access Token | From Meta Developer Console |
| AI Proxy URL | `http://localhost:6655` |
| API Key | Your proxy API key |
| Provider | Anthropic / OpenAI / Gemini / LiteLLM |
| Model | Auto-populated from your proxy after entering key |

Click **Test Connection** — the status dot should turn green.

---

## Getting Meta Cloud API Credentials

### 1. Create a Meta Developer App

1. Go to https://developers.facebook.com/apps
2. Click **Create App** → choose a use case with business messaging
3. Name your app (avoid trademarked terms like "WhatsApp") → e.g. `API Explorer`
4. Complete app creation

### 2. Add WhatsApp to your app

1. In your app dashboard → **Add a product** → find **WhatsApp** → **Set up**
2. Go to **WhatsApp → API Setup** in the left sidebar

### 3. Get your credentials

On the **API Setup** page:

```
Phone Number ID:  1234567890123456   ← copy this (under "From")
Access Token:     EAAxxxxxxxx...     ← copy this (temporary, 24hr)
```

For a **permanent token**:
1. Go to **Business Settings → System Users** → create a System User
2. Assign your app with `whatsapp_business_messaging` permission
3. Generate token — does not expire

### 4. Add your personal number as a test recipient

1. On **API Setup** page → **To** field → click **Add phone number**
2. Enter your personal WhatsApp number with country code (e.g. `+919962536605`)
3. Meta sends a verification code via WhatsApp — enter it to confirm
4. You can add up to **5 numbers** on the free sandbox tier

---

## Setting Up Webhooks (to receive messages)

Meta requires a public HTTPS URL to deliver incoming messages to your backend.

### Option A — ngrok (recommended)

```bash
# Install
winget install ngrok   # Windows
# or: brew install ngrok  (Mac)

# Authenticate once (get token from https://dashboard.ngrok.com)
ngrok config add-authtoken YOUR_NGROK_TOKEN

# Start tunnel (in a new terminal, while backend is running)
ngrok http 3001
# Output: https://xxxx.ngrok-free.app
```

### Option B — localtunnel

```bash
npx localtunnel --port 3001
# Output: https://orange-squids-mate.loca.lt
# Note: visit the URL in browser first and enter your public IP to unlock it
```

### Register the webhook in Meta Console

1. Go to your app → **WhatsApp → Configuration**
2. Under **Webhook** → click **Edit**
3. Set:
   - **Callback URL:** `https://your-tunnel-url.ngrok-free.app/webhook`
   - **Verify token:** `whatsapp_explorer_verify`
4. Click **Verify and Save** ✓
5. Under **Webhook fields** → find **`messages`** → click **Subscribe**

> The backend must be running when you click Verify and Save.

---

## AI Chatbot Auto-Reply

The chatbot automatically replies to incoming WhatsApp messages using your AI proxy.

### Enable it:

1. Go to **Settings tab → AI Chatbot section**
2. Toggle **Auto Reply** to **Enabled**
3. Customize the **System Prompt** (e.g. "You are a helpful customer support agent...")
4. Make sure Provider, Model, API Key, and WhatsApp credentials are all configured

### How it works:

```
Mobile WhatsApp → Meta webhook → your backend → AI proxy → Meta API → reply sent back
```

The full conversation history (last 10 messages) is sent to the AI for context on each reply.

---

## AI Proxy Endpoints

The app calls your local proxy server-side (no CORS issues) via the backend.

| Provider | Base URL | Models endpoint |
|----------|----------|----------------|
| Anthropic | `http://localhost:6655/anthropic/v1` | `/models` |
| OpenAI | `http://localhost:6655/openai/v1` | `/models` |
| Gemini | `http://localhost:6655/gemini` | `/v1beta/models` |
| LiteLLM | `http://localhost:6655/litellm/v1` | `/models` |

Models are fetched automatically when you enter your API key in Settings.

---

## Baileys (Unofficial API)

1. Go to the **API Compare tab**
2. Click **Connect via QR Code**
3. Open WhatsApp on your phone → **Settings → Linked Devices → Link a Device**
4. Scan the QR code shown in the app
5. Session is saved in `backend/sessions/` — no need to re-scan on restart

> ⚠️ **Warning:** Baileys reverse-engineers the WhatsApp Web protocol. Using it in production violates WhatsApp's Terms of Service. This is for educational/personal use only.

---

## Architecture

```
WhatsAppAPIExplorer/
├── frontend/                    React 19 + Vite + Tailwind CSS v4
│   └── src/
│       ├── contexts/            SettingsContext (localStorage + backend sync)
│       │                        ConnectionContext (health poll + Socket.io)
│       │                        WhatsAppContext (live socket events)
│       ├── hooks/               useBackendApi (demo mode fallback)
│       ├── lib/                 mockData (GitHub Pages demo)
│       └── components/tabs/     5 feature tabs
│
├── backend/                     Node.js + Express 5 + SQLite + Socket.io
│   ├── services/
│   │   ├── metaWhatsApp.js      Meta Cloud API v18.0 client
│   │   ├── baileysService.js    Baileys WebSocket client + QR emission
│   │   ├── aiProxy.js           Routes to local AI proxy (all 4 providers)
│   │   └── webhookProcessor.js  Parses webhooks → DB → socket → AI reply
│   └── db/database.js           SQLite WAL mode, settings sync from frontend
│
└── .github/workflows/deploy.yml Auto-deploy frontend to GitHub Pages on push
```

**Real-time flow:**
- Socket.io pushes live events to the frontend (incoming messages, status updates, Baileys QR)
- Settings changed in the UI are synced to backend SQLite so the chatbot has the latest config

**Demo mode:**
- When backend is offline, `useBackendApi` returns mock data transparently
- A yellow banner in the status bar indicates demo mode
- Full UI is explorable on GitHub Pages without any backend

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, Tailwind CSS v4, lucide-react, Socket.io-client, qrcode.react |
| Backend | Node.js, Express 5, better-sqlite3, Socket.io 4, axios |
| WhatsApp Official | Meta Cloud API v18.0 |
| WhatsApp Unofficial | @whiskeysockets/baileys |
| AI | Anthropic / OpenAI / Gemini / LiteLLM via local proxy |
| Deploy | GitHub Actions → GitHub Pages |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `EADDRINUSE :::3001` | Run `Get-NetTCPConnection -LocalPort 3001 \| Where-Object { $_.OwningProcess -gt 4 } \| ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }` then `rs` |
| Webhook verification fails | Make sure backend is running AND tunnel is active before clicking Verify |
| localtunnel blocked | Visit the tunnel URL in browser first, enter your public IP from whatismyip.com |
| ngrok interstitial | Already handled — backend sends `ngrok-skip-browser-warning` header |
| Messages not appearing | Check webhook `messages` field is **subscribed** in Meta Console |
| Chatbot not replying | Ensure Auto Reply is **Enabled** in Settings, and all credentials are filled |
| CORS error on models | Models are fetched via backend — make sure backend is running |
| 500 on AI chat | Check API key is valid and AI proxy is running on port 6655 |

---

## License

MIT
