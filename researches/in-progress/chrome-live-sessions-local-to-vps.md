# Chrome Live Sessions - Local Browser to VPS Access

**Date:** 2026-03-17  
**Status:** In Progress / Reference  
**Researcher:** Ceil

---

## Clarification: Reverse Direction

Initial understanding was backwards. The actual use case:

**Goal:** Expose browser running on **local machine** so **Ceil (on VPS)** can access it.

Not: VPS browser → local access  
But: **Local browser → VPS access**

---

## How It Works

### Architecture

```
Your Local Machine          Tailscale           VPS (Ceil)
┌─────────────────┐      ┌──────────┐      ┌─────────────────┐
│ Chrome          │◄────►│ 100.x.x  │◄────►│ OpenClaw Agent  │
│ (your logged-in │      │:9222      │      │ (browser tools) │
│  sessions)      │      └──────────┘      └─────────────────┘
└─────────────────┘
```

**Key insight:** Chrome DevTools Protocol (CDP) works both directions over Tailscale.

---

## Setup Steps

### 1. On Local Machine

Start Chrome with remote debugging:

```bash
google-chrome \
  --remote-debugging-port=9222 \
  --user-data-dir=/tmp/openclaw-chrome \
  --remote-allow-origins=*
```

Get Tailscale IP:
```bash
tailscale ip -4
# Returns: 100.x.x.x
```

### 2. On VPS (Ceil's openclaw.json)

```json
{
  "browser": {
    "enabled": true,
    "defaultProfile": "victor-local-chrome",
    "profiles": {
      "victor-local-chrome": {
        "cdpUrl": "http://100.x.x.x:9222",
        "color": "#FF4500"
      }
    }
  }
}
```

Replace `100.x.x.x` with your local machine's Tailscale IP.

---

## What Ceil Can Do

With access to your local Chrome, Ceil can:
- See your tabs and navigate them
- Access cookies, logins, sessions
- Execute JavaScript in your browser context
- Take screenshots
- Intercept network requests
- Fill forms, click buttons

**Essentially:** Full browser automation on your local machine from the VPS.

---

## Security Considerations

### Risks
- **Full browser access** — Ceil sees everything in your Chrome
- **Session hijacking potential** — cookies, logins exposed
- **Local machine exposure** — browser control from remote VPS

### Mitigations
- Ensure only **you** control the VPS
- Keep Tailscale network secure ( Tailscale ACLs)
- Use `--remote-allow-origins` to restrict to specific IPs:
  ```bash
  --remote-allow-origins=http://100.64.0.0/10
  ```
- Consider separate Chrome profile for agent access (not your main browser)

---

## Use Cases (Future)

Potential scenarios where this is useful:

1. **Web scraping with your logged-in sessions**
   - Access sites where you're already authenticated
   - No need to manage credentials in VPS

2. **UI automation for local-only apps**
   - Internal tools running on localhost
   - Dashboards behind VPN/corporate firewall

3. **Form filling with your data**
   - Use browser autofill from your profile
   - Access to saved passwords (if enabled)

4. **Testing local web apps**
   - Develop on local machine
   - Test from VPS agent perspective

5. **Screenshots of your local environment**
   - Visual verification of local state
   - Debugging local issues remotely

---

## Alternative: Isolated Browser on VPS

If you don't need your logged-in sessions, the default OpenClaw browser profile (isolated, no extension) may be sufficient:

```json
{
  "browser": {
    "enabled": true,
    "defaultProfile": "openclaw"
  }
}
```

This runs browser entirely on VPS — no local exposure.

---

## Current Status

**No immediate use case identified.** 

Documented for future reference when browser automation with local sessions becomes needed.

**Decision:** Keep as reference; implement only when specific use case arises.

---

## References

- OpenClaw Browser Docs: https://docs.openclaw.ai/tools/browser
- Chrome DevTools Protocol: https://chromedevtools.github.io/devtools-protocol/
- Tailscale Networking: https://tailscale.com/kb/
- Original X Post: https://x.com/openclaw/status/2032694261993427260
