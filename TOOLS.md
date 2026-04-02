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
| `memory_search` | Semantic search over MEMORY.md and memory/*.md files | Local SQLite + Gemini embeddings |
| `memory_get` | Read specific file sections with line ranges | Local SQLite |

**Use for:** Session-level technical details, documented decisions, local file-based memory.

**Session Start Protocol:**
1. Read SOUL.md → USER.md → TOOLS.md → memory/YYYY-MM-DD.md
2. **Memory search first**: Call `memory_search` before answering "what did we..." questions
3. **Research = delegate first**: Spawn subagent → review → decide

**During Session:**
| Situation | Tool | Why |
|-----------|------|-----|
| Need a quick fact from docs | `memory_search` | Fast local lookup |
| Cross-session pattern | `memory_search` + `memory_get` | Find related past work |
| Complex synthesis | `memory_search` then delegate | Deep reasoning over documented decisions |
| Victor asks about past | `memory_search` | Specific conversation history in daily notes |

**Principle:** Leverage that you know Victor well. Use memory tools to retrieve and apply that knowledge, not just rely on surface-level auto-injection.

---

## 🔄 Coordination with Neo

To message Neo, first find their running session, then use `sessions_send`:

**Step 1: Find Neo's active session**
```
sessions_list(kinds=["agent"], limit=10)
```

Look for:
- Session with `key` containing `"agent:neo:"`
- Status: `"running"` (not `"done"`)
- Active channel: usually `telegram:direct:8154042516`

**Step 2: Send message**
```
sessions_send(sessionKey="agent:neo:telegram:direct:8154042516", message="...")
```

**⚠️ Known Issue:** `sessions_send` reports `status: "timeout"` even on successful delivery. Ignore the status field — if you need confirmation, ask Neo to reply.

**Current active session (as of last check):**
- `agent:neo:telegram:direct:8154042516` — Victor's direct Telegram chat with Neo
- Other `agent:neo:*` sessions — webchat/slash (usually done/inactive)

---

## Browser Control

Remote browser control from VPS to Victor's MacBook Pro Chrome.

**Status:** ✅ Active — Node connected, isolated profile working  
**Details:** See `tools/browser-control.md`  
**Quick command (on laptop):** `openclaw node run --host srv1405873.tailcd23a1.ts.net --port 443 --tls`

---

_Add environment-specific notes here as needed: SSH hosts, API endpoints, preferences, etc._
