# DealPulse — Universal Sales Intelligence Agent

> **"Close more deals — wherever your conversations happen."**

DealPulse is an AI-powered sales agent built for both Western and emerging markets. It connects HubSpot, WhatsApp, Facebook Messenger, and Instagram, automatically builds your pipeline from real conversations, detects stalled deals, researches prospects, and drafts culturally-aware follow-ups with human-in-the-loop approval.

---

## Features

- **Multi-channel pipeline** — Sync deals from HubSpot, auto-create deals from WhatsApp/Messenger/Instagram conversations
- **Stalled & cold deal detection** — Surface deals with no activity for 7+ days (stalled) or 14+ days (cold)
- **AI-powered drafting** — Claude drafts formal emails or casual, culturally-aware WhatsApp messages
- **Airia orchestration** — Hackathon-ready integration with Airia for AI agent workflows
- **Prospect research** — Context-aware research before drafting
- **HITL approval** — Review and edit drafts before sending via the dashboard
- **Source of truth** — Log agent activity back to HubSpot when deals originate there
- **WhatsApp templates** — Send business-initiated template messages via Twilio

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14 (App Router), React, Tailwind CSS |
| Backend | Next.js API Routes |
| Database | Supabase (PostgreSQL) |
| AI | Claude (Anthropic), Airia |
| WhatsApp | Twilio |
| CRM | HubSpot |
| Deployment | Vercel |

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/Ekfuingei/DealPulse.git
cd DealPulse
npm install --legacy-peer-deps
```

### 2. Environment variables

Copy the example and fill in your credentials:

```bash
cp .env.local.example .env.local
```

Required variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `ANTHROPIC_API_KEY` | Claude API key |
| `TWILIO_ACCOUNT_SID` | Twilio account SID |
| `TWILIO_AUTH_TOKEN` | Twilio auth token |
| `TWILIO_WHATSAPP_NUMBER` | Your Twilio WhatsApp number (e.g. `whatsapp:+14155238886`) |
| `HUBSPOT_ACCESS_TOKEN` | HubSpot private app token |
| `AIRIA_API_KEY` | Airia API key (for hackathon) |
| `AIRIA_AGENT_URL` | Airia agent execution URL |
| `NEXT_PUBLIC_APP_URL` | Your app URL (e.g. `http://localhost:3000` or ngrok URL) |

### 3. Database setup

Run the migration in Supabase:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → SQL Editor
2. Paste contents of `supabase/migrations/001_init.sql`
3. Run

### 4. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## WhatsApp Setup (Twilio)

### Sandbox (development)

1. Join the [Twilio WhatsApp Sandbox](https://console.twilio.com/us1/develop/sms/try-it-out/whatsapp-learn) — send `join <code>` to the sandbox number
2. Set webhook URL: `https://YOUR_NGROK_URL/api/whatsapp/webhook` (POST)
3. For local dev, use [ngrok](https://ngrok.com): `ngrok http 3000`
4. Set `NEXT_PUBLIC_APP_URL` to your ngrok URL

### Production

Point the Twilio webhook to your deployed app:

```
https://your-app.vercel.app/api/whatsapp/webhook
```

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/deals` | GET | List all deals |
| `/api/deals` | POST | Create a deal |
| `/api/deals/stalled` | GET | Get stalled & cold deals |
| `/api/hubspot/sync` | POST | Sync deals from HubSpot |
| `/api/whatsapp/webhook` | GET/POST | Twilio webhook (incoming messages) |
| `/api/whatsapp/send-template` | POST | Send business-initiated template |
| `/api/agent-activities` | GET | List agent activities |
| `/api/agent-activities/[id]/approve` | POST | Approve & send pending draft |

### Send template message

```bash
curl -X POST http://localhost:3000/api/whatsapp/send-template \
  -H "Content-Type: application/json" \
  -d '{
    "to": "whatsapp:+237655536083",
    "contentSid": "HX_YOUR_TEMPLATE_SID",
    "variables": { "1": "12/1", "2": "3pm" }
  }'
```

---

## Project Structure

```
DealPulse/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Dashboard
│   │   ├── pipeline/page.tsx     # Pipeline view
│   │   └── api/
│   │       ├── whatsapp/         # webhook, send-template
│   │       ├── hubspot/          # sync
│   │       ├── agent/            # run
│   │       ├── agent-activities/ # list, approve
│   │       ├── deals/            # CRUD, stalled
│   │       ├── messenger/        # webhook
│   │       └── instagram/        # webhook
│   ├── components/
│   │   ├── Pipeline.tsx
│   │   ├── DealCard.tsx
│   │   ├── AgentActivity.tsx
│   │   └── ApprovalModal.tsx
│   └── lib/
│       ├── supabase.ts
│       ├── anthropic.ts
│       ├── airia.ts
│       ├── whatsapp.ts
│       ├── hubspot.ts
│       └── research.ts
├── supabase/migrations/
└── .env.local.example
```

---

## Deployment (Vercel)

DealPulse deploys as a single app — **frontend and API routes run together** on Vercel.

### Option A: Deploy via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project**
3. Import `Ekfuingei/DealPulse` from GitHub
4. **Environment Variables** — Add each from `.env.local.example`:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`
   - `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_NUMBER`
   - `HUBSPOT_ACCESS_TOKEN`
   - `AIRIA_API_KEY`, `AIRIA_AGENT_URL`, `AIRIA_PIPELINE_ID`
   - `WHATSAPP_VERIFY_TOKEN`, `MESSENGER_VERIFY_TOKEN`, `INSTAGRAM_VERIFY_TOKEN`
   - `AGENT_SEND_DIRECTLY` (optional, default: `false`)
5. **Deploy** — Vercel will build and deploy
6. After deploy, set `NEXT_PUBLIC_APP_URL` to your Vercel URL (e.g. `https://dealpulse.vercel.app`)
7. Update Twilio webhook to `https://your-app.vercel.app/api/whatsapp/webhook`

### Option B: Deploy via CLI

```bash
npm i -g vercel
vercel
```

Follow the prompts, then add environment variables in the Vercel dashboard.

---

## License

MIT
