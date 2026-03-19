# TOOLS.md - Environment Cheat Sheet

This file is your quick reference for tools, environment specifics, and setup details unique to this workspace.

## Session Startup Checklist

Every session, after reading SOUL.md and USER.md, check this file for:
- Tool availability and configurations
- Environment-specific notes
- Recent changes to tools or setup

---

## Environment Notes

### Workspace
- **Location**: `~/.openclaw/workspace`
- **GitHub**: https://github.com/ceil-labs/ceil-workspace
- **Peer in Honcho**: `agent-main`

### Shared Resources
- **Skills**: `~/.openclaw/skills/` (shared with Neo)
- **Secrets**: `~/.openclaw/secrets.json`

### Subagent Defaults
- **Model**: MiniMax (`opencode-go/minimax-m2.7`)
- **Mode**: Run (one-shot) unless persistent needed

---

## File Locations Quick Reference

| File | Purpose |
|------|---------|
| `SOUL.md` | Who I am (loaded every session) |
| `USER.md` | Who Victor is |
| `AGENTS.md` | Operating rules and procedures |
| `TOOLS.md` | This file — environment, tools, and configuration |
| `MEMORY.md` | Long-term curated memory (main session only) |
| `memory/YYYY-MM-DD.md` | Daily logs |

---

## Memory Tools Reference

### Built-in SQLite Memory (Local)
| Tool | Purpose | Backend |
|------|---------|---------|
| `memory_search` | Semantic search over MEMORY.md and memory/*.md files | Local SQLite |
| `memory_get` | Read specific file sections with line ranges | Local SQLite |

**Use for:** Session-level technical details, documented decisions, local file-based memory.

### Honcho Cloud Memory (Cross-Channel)
| Tool | Purpose | Backend |
|------|---------|---------|
| `honcho_profile` | User's peer card (curated facts) | Honcho cloud |
| `honcho_search` | Semantic search over stored observations | Honcho cloud |
| `honcho_session` | Conversation history & summaries | Honcho cloud |
| `honcho_context` | Full Honcho representation | Honcho cloud |
| `honcho_recall` | Simple factual Q&A (minimal reasoning) | Honcho cloud |
| `honcho_analyze` | Complex synthesis Q&A (medium reasoning) | Honcho cloud |

### 🧠 Memory Tools — Active Use Recommended

Honcho tools are fully functional and should be used proactively to build deep user understanding. Don't wait for auto-injection — retrieve context explicitly when it would improve response quality.

**Session Start Protocol:**
1. Call `honcho_profile` — Get Victor's peer card (name, preferences, current priorities)
2. Call `honcho_context` — Load full representation if starting complex work
3. Reference findings naturally in responses (don't mention the tool calls)

**During Session:**
| Situation | Tool | Why |
|-----------|------|-----|
| Need a quick fact | `honcho_recall` | Fast lookup (name, timezone, config) |
| Cross-session pattern | `honcho_search` | Find related past work |
| Complex synthesis | `honcho_analyze` | Deep reasoning over multiple sessions |
| Victor asks about past | `honcho_session` | Specific conversation history |

**Principle:** Leverage that you know Victor well. Use Honcho to retrieve and apply that knowledge, not just rely on surface-level auto-injection.

---

## Browser Control

Remote browser control from VPS to Victor's MacBook Pro Chrome.

**Status:** ✅ Active — Node connected, isolated profile working  
**Details:** See `tools/browser-control.md`  
**Quick command (on laptop):** `openclaw node run --host srv1405873.tailcd23a1.ts.net --port 443 --tls`

---

_Add environment-specific notes here as needed: SSH hosts, API endpoints, preferences, etc._
