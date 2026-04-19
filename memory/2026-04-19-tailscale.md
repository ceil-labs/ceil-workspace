## 2026-04-19 08:51 — Tailscale Funnel Configuration for n8n Webhooks

**Context:** Setting up Telegram webhook triggers in n8n requires a publicly accessible webhook URL. Evaluating Tailscale Funnel as the solution.

### Tailscale Funnel Port Restrictions
From Tailscale docs, Funnel can only listen publicly on:
- **443** (standard HTTPS)
- **8443** (alternate HTTPS)  
- **10000** (arbitrary high port)

### Selected Approach
**Port:** 10000 (arbitrary, avoids conflicts with standard ports)

**Command:**
```bash
sudo tailscale funnel --bg --https=10000 3000
```

**What it exposes:**
- `https://srv1405873.tailcd23a1.ts.net:10000/` → Rails app
- `https://srv1405873.tailcd23a1.ts.net:10000/n8n/` → n8n editor
- `https://srv1405873.tailcd23a1.ts.net:10000/n8n/webhook/` → n8n webhooks

**Flags:**
- `--bg` — Run in background (detached)
- `--https=10000` — Public HTTPS port on Tailscale edge
- `3000` — Local port (nginx proxy)

### n8n Webhook URL Update
After enabling funnel, webhook URL should change from:
```
http://localhost:3000/n8n/webhook/...
```
To:
```
https://srv1405873.tailcd23a1.ts.net:10000/n8n/webhook/...
```

### Security Note
Rails auth gate protects all exposed endpoints, but entire application stack becomes internet-accessible via Tailscale's edge relay.

### Next Steps (Pending Test)
1. Enable funnel with command above
2. Update `.env` with new `N8N_WEBHOOK_URL`
3. Restart docker compose
4. Verify Telegram "On message" trigger works with webhook
5. Document final working configuration

