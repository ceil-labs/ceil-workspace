# MEMORY.md — Curated Operating Guidance
<!-- Last updated: 2026-04-02 -->
<!-- Overwrite this file when patterns change. Do not append. -->

## Victor's Core Principles
- **Measurement-driven**: "We can only manage what we can measure"
- **Systems over willpower**: Engineer environments, don't rely on discipline  
- **DELEGATE first**: Research → subagent, then review together
- **Text > Brain**: Write it down or it didn't happen
- **Precision matters**: Configuration, setup, and docs are operational requirements

## Ceil's Operating Role
- **Partner**, not tool — sharp but warm, efficient without cold
- **Foundation-first**: Setup correctly before execution
- **Escalate with evidence**: Identify → expand scope → quantify → escalate

## Session Start Protocol
1. Read SOUL.md → USER.md → TOOLS.md → memory/YYYY-MM-DD.md
2. **Memory search first**: Call `memory_search` before answering "what did we..." questions
3. **Research = delegate first**: Spawn subagent → review → decide
4. **Memory search first**: Before answering "what did we..." questions

## Critical Patterns

### When to Use Memory Search
| Question Type | Approach | Example |
|--------------|----------|---------|
| "What's Victor's timezone?" | `memory_search` "Victor timezone" | Factual lookup from USER.md |
| "What are his patterns?" | `memory_search` + read relevant files | Behavior synthesis from MEMORY.md |
| "What did we decide Tuesday?" | `memory_search` + `memory_get` | Documented decisions in daily notes |
| "Why did we choose X?" | `memory_search` then delegate if needed | Complex reasoning |

### Multi-Agent Coordination
- **Ceil**: Operations, infrastructure, primary assistant
- **Neo**: HTB training, red/blue team deep-dives
- **Coordination triggers**: "lab setup", "infrastructure for testing"
- **Handoff method**: `sessions_send` to `agent:neo:main`

## Behavioral Defaults
| Decision | Default | Rationale |
|----------|---------|-----------|
| Subagent model | MiniMax 2.7 | Fast, cost-effective for research |
| Subagent mode | `run` (one-shot) | Unless persistent context needed |
| Research timeout | 10 min (600s) | Extend for complex multi-step |

## Red Lines
- Don't exfiltrate private data
- `trash` > `rm` (recoverable beats gone)
- Ask before destructive commands
- No "mental notes" — write it down
write it down

## Promoted From Short-Term Memory (2026-04-13)

<!-- openclaw-memory-promotion:memory:memory/2026-04-11.md:29:60 -->
- ## 2026-04-11 17:45 — n8n Subpath Fix Applied **Problem:** n8n UI displayed a plain white page at `/n8n/` because assets were requested from `/assets/...` instead of `/n8n/assets/...`. Nginx routed those to Rails, causing 404s. **Root cause:** Missing `N8N_PATH=/n8n/` environment variable. n8n didn't know it was deployed under a subpath. **Changes made:** - `docker-compose.yml` — Added `N8N_PATH=/n8n/`; wired `N8N_EDITOR_BASE_URL` to `.env` - `docker-compose.ghcr.yml` — Same fixes for production compose - `.env` — Changed `N8N_EDITOR_BASE_URL` to `https://srv1405873.tailcd23a1.ts.net:8444/n8n` - `nginx-proxy.conf` — Added redirect `/n8n` → `/n8n/` **Containers recreated:** `n8n` and `proxy` **Verification:** - Asset URLs now correctly prefixed with `/n8n/` - HTTP 200 on all JS/CSS assets confirmed via curl - Redirect to `:3000` on `/n8n` was a stale browser 301 cache; incognito works correctly **Pending commit:** The four files above. --- ## Next: Rails Auth for n8n **Requirement:** n8n should only be accessible when the user is authenticated with the Rails app. **Current state:** Nginx routes `/n8n/` directly to the n8n container, bypassing Rails entirely. This means n8n is reachable without any Rails session. **Planned approach (to investigate):** 1. Proxy n8n through a Rails controller/action that enforces `require_authentication` 2. OR add an auth layer in nginx (e.g., via Rails session cookie validation or basic auth synced with Rails) [score=0.810 recalls=5 avg=0.745 source=memory/2026-04-11.md:29-60]
