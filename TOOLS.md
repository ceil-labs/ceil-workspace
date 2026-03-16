# TOOLS.md - Environment Cheat Sheet

This file is your quick reference for tools, environment specifics, and setup details unique to this workspace.

## Session Startup Checklist

Every session, after reading SOUL.md and USER.md, check this file for:
- Tool availability and configurations
- Environment-specific notes
- Recent changes to tools or setup

---

## 🧠 Honcho Memory Tools

Honcho provides AI-native memory with dialectic reasoning. Use these to recall context about Victor and past conversations.

### Data Retrieval (Fast, No LLM)

| Tool | Use When |
|------|----------|
| `honcho_session` | Get conversation history from current session |
| `honcho_profile` | Get Victor's peer card — important facts about him |
| `honcho_search` | Semantic search over all stored memories |
| `honcho_context` | Broad view of observations about Victor |

### Q&A (LLM-Powered)

| Tool | Use When |
|------|----------|
| `honcho_recall` | Simple factual questions ("What's Victor's timezone?") |
| `honcho_analyze` | Complex synthesis ("Describe Victor's communication style") |

### How It Works
- Conversations auto-persist to Honcho cloud after each turn
- Both user (owner) and agent (main/neo) peers maintained separately
- Memory improves over time as Honcho builds models
- Use tools mid-conversation to retrieve relevant context

### Peer Mapping
- `owner` → Victor (user facts, preferences)
- `agent-main` → Ceil (my personality, learned behaviors)
- `agent-neo` → Neo (separate agent memory)

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
- **Model**: MiniMax (`opencode-go/minimax-m2.5`)
- **Mode**: Run (one-shot) unless persistent needed

---

## File Locations Quick Reference

| File | Purpose |
|------|---------|
| `SOUL.md` | Who I am (loaded every session) |
| `USER.md` | Who Victor is |
| `AGENTS.md` | Operating rules and procedures |
| `TOOLS.md` | This file — environment and tool notes |
| `MEMORY.md` | Long-term curated memory (main session only) |
| `memory/YYYY-MM-DD.md` | Daily logs |

---

_Add environment-specific notes here as needed: SSH hosts, API endpoints, preferences, etc._
