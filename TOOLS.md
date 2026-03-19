# Browser Control Setup

Remote browser control from VPS to local laptop Chrome via OpenClaw node.

## Status
✅ **Active** — Node connected, browser control working via isolated profile

## Quick Reference

| Component | Location | Status |
|-----------|----------|--------|
| Node Host | Victor's MacBook Pro | ✅ Connected via Tailscale |
| Browser Profile | Isolated (openclaw) | ✅ Working |
| Personal Profile | Requires SSH tunnel | ⬜ Not configured |

## What I Can Do
- Open URLs, navigate websites
- Search, click, type, interact
- Take screenshots (full page or element)
- Extract page content (snapshots)

## What You Need to Do (On Your Laptop)

**To maintain connection:**
1. Keep OpenClaw node running: `openclaw node run --host srv1405873.tailcd23a1.ts.net --port 443 --tls`
2. Token is in `~/.openclaw/secrets.json` (gateway.authToken)

**For personal Chrome profile (optional):**
- See `tools/browser-control.md` for detailed setup
- Requires: Chrome with `--remote-debugging-port=9222` + SSH tunnel

## Detailed Docs
See `tools/browser-control.md` for:
- Full setup instructions
- SSH tunnel configuration
- Personal profile access
- Troubleshooting

---
_Last updated: 2026-03-19_