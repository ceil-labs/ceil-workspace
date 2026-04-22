# OpenClaw 4.12 → 4.20 Upgrade Analysis
**Date:** 2026-04-22
**Current Version:** 2026.4.12 (1c0672b)
**Target Versions:** 2026.4.14, 2026.4.15, 2026.4.20
**Your Custom Setup:** Kimi K2.6 (k2p6) via `api.kimi.com/coding/` using `anthropic-messages` API

---

## Executive Summary

| Risk Level | Count | Categories |
|------------|-------|------------|
| 🔴 **Breaking** | 3 | Context engine strict-match (4.14), dreaming storage mode (4.15), dotenv security (4.20) |
| 🟡 **Kimi-Relevant** | 5 | Bundled defaults, thinking modes, cost tracking, web-search SecretRefs, provider normalization |
| 🟢 **Beneficial** | 8 | Exec YOLO fix, session reset cleanup, cron state split, TUI watchdog, memory excerpt capping |
| ⚪ **Neutral/Internal** | 40+ | Channel-specific fixes, security hardening, UI improvements |

**Verdict:** Safe to upgrade, but review 3 breaking changes and decide on Kimi convergence strategy.

---

## 🔴 Breaking Changes (Action Required)

### 1. Context Engine Strict-Match (4.14) + Reversion (4.20)
- **4.14 added:** Context engines must have `info.id` matching their registered slot id. This broke `lossless-claw` and other third-party context engines.
- **4.20 fixed:** Reverted the strict-match requirement. Third-party context engines work again.
- **Your Risk:** LOW — You don't use custom context engines. But if any skill/plugin uses one, 4.14 would break it; 4.20 fixes it.
- **Action:** None, but don't stop at 4.14 — go straight to 4.20 if upgrading.

### 2. Dreaming Storage Mode Default Changed (4.15)
- **Changed from:** `inline` (dream blocks in `memory/YYYY-MM-DD.md`)
- **Changed to:** `separate` (dream blocks in `memory/dreaming/{phase}/YYYY-MM-DD.md`)
- **Impact:** Daily memory files no longer get dominated by dream output. The daily ingestion scanner already strips dream blocks.
- **Your Risk:** LOW — You have dreaming enabled. If you prefer inline, you must explicitly set:
  ```json
  "plugins.entries.memory-core.config.dreaming.storage.mode": "inline"
  ```
- **Action:** Decide which mode you want. Default (separate) is probably better.

### 3. Security: Block OPENCLAW_* Keys from Workspace .env (4.20)
- **Change:** Workspace `.env` files can no longer inject `OPENCLAW_*` environment variables.
- **Your Risk:** LOW — Your `.env` at `~/.openclaw/.env` only has 144 bytes. Check if it contains `OPENCLAW_*` keys.
- **Action:** Verify your `.env` doesn't rely on `OPENCLAW_*` overrides.

---

## 🟡 Kimi-Relevant Changes (Your Custom Setup)

### Your Current Kimi Config (Working in 4.12)
```json
{
  "auth.profiles": {
    "kimi:default": { "provider": "kimi", "mode": "api_key" }
  },
  "models.providers": {
    "kimi": {
      "baseUrl": "https://api.kimi.com/coding/",
      "api": "anthropic-messages",
      "models": [
        {
          "id": "k2p6",
          "name": "Kimi for Coding",
          "reasoning": true,
          "contextWindow": 262144,
          "maxTokens": 32768,
          "api": "anthropic-messages"
        }
      ]
    }
  },
  "agents.defaults.model.primary": "kimi/k2p6"
}
```

### 4.20 Kimi Changes That Affect You

| Change | Bundled or Custom? | Impact on Your Setup |
|--------|-------------------|----------------------|
| **Default bundled Moonshot to kimi-k2.6** | Bundled | ⚠️ Potential naming collision. The bundled `moonshot`/`kimi` plugin may now register `kimi-k2.6` as a default model. Your custom `k2p6` ID is different, so no direct conflict. |
| **Bundled thinking defaults to OFF** | Bundled | ✅ Your config has `"reasoning": true` — you control this. The bundled default change doesn't override custom provider configs. |
| **thinking.keep = "all" support** | Bundled + API | 🆕 If you want to preserve thinking tokens across turns, `thinking.keep: "all"` now works for kimi-k2.6. Your `anthropic-messages` API path supports this. |
| **Tiered model pricing / cost estimates** | Bundled | ℹ️ OpenClaw now ships bundled cost estimates for `kimi-k2.6`/`k2.5`. Your config has `cost: {input: 0, output: 0}` which overrides any bundled pricing. You won't see cost estimates unless you remove the zero-cost override. |
| **Web-search SecretRef resolution** | Bundled + Shared | ℹ️ If you use web-search with Kimi provider keys, 4.20 now resolves plugin-scoped SecretRefs properly. Not relevant unless you use Kimi for web search. |
| **Anthropic-messages transport fixes** | Transport layer | ✅ Several 4.14-4.20 fixes improve `anthropic-messages` API compatibility (replay recovery, tool-call ID sanitization, orphan reasoning blocks). Your setup benefits from these. |

### Key Question: Should You Converge with Bundled Kimi?

**Option A: Keep Custom (Current)**
- Pros: Full control over baseUrl, model IDs, context window, maxTokens
- Cons: Don't get automatic cost estimates, new features may need manual config updates
- Status: ✅ Works fine, no forced changes needed

**Option B: Migrate to Bundled Moonshot/Kimi Provider**
- Pros: Get automatic cost tracking, web-search integration, media understanding, thinking controls out-of-box
- Cons: May lose your exact `k2p6` model ID mapping; bundled defaults may not match your exact API endpoint
- Status: Possible in 4.20, but not required

**Recommendation:** Stay custom for now. Your `api.kimi.com/coding/` endpoint with `anthropic-messages` is working. Monitor bundled Moonshot provider docs; you can always migrate later.

---

## 🟢 Beneficial Changes (Free Wins)

### Session / Reset Cleanup (4.20)
- **Change:** `/new` and `/reset` now clear auto-sourced model/provider/auth overrides while preserving explicit user selections.
- **Benefit:** Channel sessions stop staying pinned to runtime fallback choices. Your `kimi/k2p6` explicit choice is preserved; auto-failover junk is cleared.

### Exec YOLO Fix (4.20)
- **Change:** `security=full` + `ask=off` no longer rejects gateway-host exec via Python/Node preflight hardening.
- **Benefit:** Direct interpreter stdin and heredoc forms work again. This was a 4.12 regression.

### Cron State Split (4.20)
- **Change:** Runtime execution state moved to `jobs-state.json`, keeping `jobs.json` stable for git tracking.
- **Benefit:** Your cron definitions don't get polluted with runtime state.

### Memory Excerpt Capping (4.15)
- **Change:** `memory_get` excerpts are now capped by default with explicit continuation metadata.
- **Benefit:** Long sessions pull less context by default without losing deterministic follow-up reads.

### TUI Streaming Watchdog (4.15)
- **Change:** 30s client-side watchdog resets stuck streaming indicators.
- **Benefit:** Less TUI confusion on WS reconnects or gateway restarts.

### Agent Tool-Loop Guard (4.15)
- **Change:** Unknown-tool stream guard enabled by default (threshold 10).
- **Benefit:** Prevents "Tool X not found" infinite loops when skills are disabled but model keeps calling them.

---

## ⚠️ Security Hardening (Awareness Needed)

| Change | Version | Your Risk |
|--------|---------|-----------|
| Gateway tool config mutation guard extended | 4.20 | LOW — Prevents model from rewriting security settings |
| WebSocket broadcasts require `operator.read` | 4.20 | LOW — Paired devices no longer snoop on chat content |
| Block `OPENCLAW_*` from workspace `.env` | 4.20 | LOW — Check your `.env` file |
| Device pairing scope restrictions | 4.20 | LOW — Non-admin paired devices restricted to own pairing list |
| SSRF policy on browser snapshot/screenshot | 4.14 | LOW — Already active on your setup |
| Redact secrets in exec approval prompts | 4.15 | LOW — Prevents credential leaks in approval UI |

---

## 📋 Upgrade Checklist (For Manual Use)

### Pre-Upgrade
- [x] Backup `~/.openclaw/openclaw.json`
- [x] Backup `~/.openclaw/secrets.json`
- [ ] Check `~/.openclaw/.env` for `OPENCLAW_*` keys
- [ ] Verify no third-party context engine plugins in use
- [ ] Note any custom `dreaming.storage.mode` preference

### Upgrade Path
**Recommended:** 4.12 → 4.20 directly (skip 4.14/4.15 intermediates to avoid the context-engine regression)

```bash
# Check current version
openclaw --version

# Update (your preferred method)
npm update -g openclaw
# OR
openclaw update

# Verify
openclaw --version  # Should show 2026.4.20
```

### Post-Upgrade Verification
- [ ] Gateway starts without errors
- [ ] `openclaw status` shows correct version
- [ ] Kimi sessions still route to `kimi/k2p6`
- [ ] Subagent spawns work (test one)
- [ ] Memory search works
- [ ] Cron jobs still scheduled correctly
- [ ] Check `dreaming.storage.mode` behavior if you care about dream output location

---

## 🔍 Specific to Your Kimi K2.6 Setup

### What 4.20 Official Support Means vs. Your Custom Setup

**4.20 "Official Kimi K2.6 Support":**
- The bundled `moonshot` provider plugin now defaults to `kimi-k2.6` model
- Cost estimates are pre-configured for `kimi-k2.6` and `kimi-k2.5`
- Web search and media understanding default to `kimi-k2.6` when using bundled Moonshot
- Thinking controls (keep=all, default off) are managed for bundled provider

**Your Setup (Custom Provider):**
- You use provider name `kimi` (not `moonshot`)
- You use model ID `k2p6` (not `kimi-k2.6`)
- You set `api: anthropic-messages` explicitly
- You set `baseUrl: https://api.kimi.com/coding/` explicitly
- You have `reasoning: true` explicitly

**There is no forced migration.** Your custom provider remains fully functional. The bundled support is additive — it helps new users, doesn't break existing custom configs.

### One Thing to Consider: Model ID Normalization

4.20 has fixes for "stale native transport metadata" and "model not allowed" errors. Your `k2p6` ID is non-standard (Moonshot's official ID is likely `kimi-k2.6` or `k2.6`). If you ever see "model not allowed" errors after upgrade, it means the upstream API (`api.kimi.com/coding/`) has started validating model IDs strictly. This would be a **Moonshot API change**, not an OpenClaw change.

---

## Files Backed Up

| File | Backup Path |
|------|-------------|
| `~/.openclaw/openclaw.json` | `~/.openclaw/openclaw.json.backup-pre-4.20-20260422-100944` |
| `~/.openclaw/secrets.json` | `~/.openclaw/secrets.json.backup-pre-4.20-20260422-100944` |

---

*Analysis complete. Awaiting your decision to proceed with manual upgrade.*
