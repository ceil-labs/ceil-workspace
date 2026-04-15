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

## Promoted From Short-Term Memory (2026-04-13)

<!-- openclaw-memory-promotion:memory:memory/2026-04-09.md:64:105 -->
- "vaultName": "Ceil Wiki", "openAfterWrites": false }, "bridge": { "enabled": true, "readMemoryArtifacts": true, "indexDreamReports": true, "indexDailyNotes": true, "indexMemoryRoot": true, "followMemoryEvents": true }, "ingest": { "autoCompile": true, "maxConcurrentJobs": 1 }, "search": { "backend": "shared", "corpus": "all" }, "render": { "preserveHumanBlocks": true, "createBacklinks": true, "createDashboards": true } } } ``` ### Open Questions - Per-agent vault paths: feature gap — Victor asked to research if `{agentId}` templating works or file feature request - Neo's vault: pending Victor's decision after Ceil setup is validated ## Research Subagents Spawned 1. `dreaming-per-agent-research` — completed, returned early but captured full results via sessions_history 2. `memory-wiki-research` — completed successfully ## Next Steps (Pending Victor) 1. Decide: try `{agentId}` templating workaround OR file feature request for per-agent vault paths 2. Enable memory-wiki for Ceil once vault setup is resolved 3. After Ceil is stable, add Neo to separate vault ## Test Entry [score=0.860 recalls=4 avg=0.804 source=memory/2026-04-09.md:64-105]

## Promoted From Short-Term Memory (2026-04-15)

<!-- openclaw-memory-promotion:memory:memory/2026-04-03.md:67:107 -->
- - ✅ Dependabot (weekly gem and Actions updates) ### Next Steps (When Victor Returns) 1. **Wait for first GHCR image build** — Check Actions tab (~5 min build time) 2. **Create test user on VPS** — Set up separate Linux user for production deployment testing 3. **Test end-to-end deployment** — Clone repo, configure .env, run `docker-compose.ghcr.yml` 4. **Verify default login flow** — admin@localhost / changeme123 → forced password change ### Notes - Production Dockerfile uses COPY (not volume mounts) for immutable builds - GHCR images are public (repo is public) — no auth needed to pull - First-time deployment requires `db:create db:migrate db:seed` - All sensitive config via environment variables (DATABASE_URL, SECRET_KEY_BASE) --- ## Agent Memory Tools Research ### Context Victor is evaluating memory tools for the agent-platform project. Requirements: self-hosted, n8n integration, multi-agent shared memory, open-source preference. ### Tools Researched **1. Hindsight** - MIT license, multi-strategy retrieval (semantic + BM25 + graph + temporal) - Requires PostgreSQL + pgvector - **Finding:** Primarily semantic search; BM25+ requires specific backends **2. OpenViking** - Apache 2.0, tiered loading (L0/L1/L2), filesystem paradigm - Closest architectural match to Karpathy's approach - Requires Go 1.22+, C++ toolchain, VLM + embedding model **3. ByteRover** - Elastic License v2, context tree as Markdown files - Agentic Search (LLM-navigated, not vector-based) - CLI-first, zero infrastructure, MCP server available **4. Memary** [score=0.858 recalls=3 avg=0.827 source=memory/2026-04-03.md:67-107]

## Promoted From Short-Term Memory (2026-04-16)

<!-- openclaw-memory-promotion:memory:memory/2026-04-04.md:88:110 -->
- **Status**: Documented in `karpathy-architecture-design.md`. Implementation pending. ## Commands Reference **Production Deploy:** ```bash cd ~/agent-platform git pull origin master docker compose -f docker-compose.ghcr.yml pull docker compose -f docker-compose.ghcr.yml up -d ``` **Local Dev:** ```bash cd ~/.openclaw/projects/agent-platform docker compose up -d ``` **Check Build Status:** ```bash gh run list --limit 3 ``` [score=0.802 recalls=4 avg=0.710 source=memory/2026-04-04.md:88-110]
