# Browser Control — Detailed Setup

Remote browser control from VPS (Ceil/Neo) to Victor's local laptop Chrome.

## Architecture

```
┌─────────────────────┐         ┌─────────────────────┐
│   VPS (Ceil/Neo)    │◄───────►│  Victor's Laptop    │
│                     │ Tailnet │                     │
│  OpenClaw Gateway   │◄────────│  OpenClaw Node Host │
│  Browser Tool       │         │  Chrome Browser     │
└─────────────────────┘         └─────────────────────┘
```

## Current Setup (Isolated Profile)

### What's Working
- ✅ Node host connected via Tailscale
- ✅ Isolated Chrome profile (orange theme)
- ✅ Can browse, search, click, screenshot
- ✅ No personal logins/cookies

### What You Need to Do (Your Laptop)

**1. Start Node Host**
```bash
export OPENCLAW_GATEWAY_TOKEN=$(cat ~/.openclaw/secrets.json | python3 -c "import json,sys; print(json.load(sys.stdin)['gateway']['authToken'])")

openclaw node run \
  --host srv1405873.tailcd23a1.ts.net \
  --port 443 \
  --tls \
  --node-id laptop-node
```

When prompted, approve the pairing in terminal.

**2. Verify Connection**
On VPS, run: `openclaw status` — should show node connected.

### Usage from VPS

```bash
# Open a URL
openclaw browser --target node open https://example.com

# Take screenshot
openclaw browser --target node screenshot --full-page

# Get page snapshot
openclaw browser --target node snapshot

# Click element (use ref from snapshot)
openclaw browser --target node click e12

# Type and submit
openclaw browser --target node type e35 "search query" --submit
```

---

## Personal Chrome Profile (Optional)

For access to your actual Chrome (with logins, cookies, extensions):

### Prerequisites
- Chrome must be started with remote debugging flag
- SSH tunnel from VPS to laptop

### Setup Steps

**1. On Your Laptop — Start Chrome with Remote Debugging**

```bash
# Kill existing Chrome
pkill -f "Google Chrome"

# Start with remote debugging on localhost (secure)
/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome \
  --remote-debugging-port=9222
```

**2. On Your Laptop — Create SSH Tunnel**

```bash
# Forward VPS port 9222 to laptop port 9222
ssh -fN -L 9222:localhost:9222 openclaw@100.108.21.107
```

**3. On VPS — Update Config**

Add to `~/.openclaw/openclaw.json`:
```json
"browser": {
  "profiles": {
    "victor-chrome": {
      "cdpUrl": "http://127.0.0.1:9222"
    }
  }
}
```

**4. Use Profile**
```bash
openclaw browser --profile victor-chrome open https://gmail.com
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "pairing required" | Set `OPENCLAW_GATEWAY_TOKEN` env var |
| "connection refused" | Check Tailscale status on both ends |
| "profile only supports local host" | Use SSH tunnel for personal profile |
| Chrome not responding | Restart Chrome with `--remote-debugging-port=9222` |
| 401 Unauthorized | Token may have rotated — check secrets.json |

---

## Security Notes

- **Isolated profile**: Safe, no personal data, runs in `~/.openclaw/browser/`
- **Personal profile**: Requires explicit Chrome restart with debugging flag
- **SSH tunnel**: Encrypted, only works while tunnel is active
- **MCP approval**: Chrome shows "controlled by automated test software" banner

---

## References

- OpenClaw Browser Docs: https://docs.openclaw.ai/tools/browser
- Chrome DevTools MCP: https://developer.chrome.com/blog/chrome-devtools-mcp-debug-your-browser-session
- X Post: https://x.com/openclaw/status/2032694261993427260

---
_Last updated: 2026-03-19_