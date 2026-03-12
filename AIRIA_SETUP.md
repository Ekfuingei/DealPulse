# Airia Agent Configuration for DealPulse

DealPulse uses the **Airia v2 API** and sends context as both `userInput` and **Input Variables** (prospectName, company, channel, research, previousMessages).

---

## API Format (v2)

DealPulse sends:

```json
{
  "userInput": "Prospect: whatsapp:+237...\nChannel: whatsapp\n\nResearch/context:\n...\n\nPrevious message(s)...",
  "prospectName": "whatsapp:+237655536083",
  "company": "",
  "channel": "whatsapp",
  "research": "Prospect identifier: whatsapp:+237... Phone: ... — likely Cameroon",
  "previousMessages": "Hey, interested in DealPulse for our team!",
  "asyncOutput": false
}
```

**Headers:** `X-API-KEY`, `Content-Type: application/json`

Your agent's **Input Variables** (prospectName, company, channel, research, previousMessages) are populated from this payload.

---

## Step 1: Agent Flow

Minimal flow:

```
[Start] → [AI Model] → [Output]
```

---

## Step 2: AI Model Step — Instructions

In the **Prompt Builder**, add:

```
You are a sales assistant for DealPulse. Draft a follow-up message for a prospect.

The user input below contains:
- Prospect (sender ID)
- Channel (whatsapp, messenger, or instagram)
- Research/context about the prospect
- Previous message(s) from the prospect

Rules:
- Use tone: formal for email, casual and culturally-aware for whatsapp/messenger/instagram.
- Output ONLY the message body. No subject line, no preamble, no "Here's a draft:".
- Keep it concise for WhatsApp (1-3 short paragraphs).
- Personalize using the research context when available.

Draft the reply. Output only the message text, nothing else.
```

---

## Step 3: Context Settings

In the AI Model step, ensure:

- **Always include user input** — **ON** (so the API's userInput is sent to the model)
- **Structured output** — **OFF**
- **Temperature** — 0.3

---

## Step 4: Get API URL & Key

1. Agent → **Settings** → **Interfaces** → **API**
2. Click **View API Info**
3. Copy **API URL** (e.g. `https://api.airia.ai/v2/PipelineExecution/xxx`)
4. Click **View API Keys** → create key if needed

Add to `.env.local` and Vercel:

```
AIRIA_API_KEY=ak-...
AIRIA_AGENT_URL=https://api.airia.ai/v2/PipelineExecution/2b1fdafd-c098-4414-80df-48415c73c111
```

---

## Step 5: Test in Airia

Use the Agent Studio test/playground with user input:

```
Prospect: whatsapp:+237655536083
Channel: whatsapp

Research/context:
Prospect from Cameroon. Interested in sales tools.

Previous message(s) from prospect:
Hey, interested in DealPulse for our team in Lagos. Can we chat?
```

The model should return a draft message only.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Agent returns empty | Ensure "Always include user input" is ON |
| Agent says "I need prospectName, research, etc." | DealPulse now sends Input Variables (prospectName, channel, research, previousMessages) in the API payload. Ensure your Airia agent has these variables created under Input Variables, and that variable names match exactly (e.g. `previousMessages`, not `previousMessagesGENERATION`). |
| 401/403 | Check AIRIA_API_KEY and X-API-KEY header |
| Fallback to Claude | Check Airia execution logs; verify API URL is v2 |
