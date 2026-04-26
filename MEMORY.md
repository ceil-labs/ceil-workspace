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

## Promoted From Short-Term Memory (2026-04-17)

<!-- openclaw-memory-promotion:memory:memory/2026-04-13.md:1:19 -->
- --- **[2026-04-13 10:11 PM +08]** GHCR production deployment preparation — stopped dev stack, ready for next-session testing. - **Progress:** Development docker compose stack (`agent-platform-app-1`, `agent-platform-proxy-1`, etc.) has been stopped to free port 3000 for GHCR production testing. - **Context reviewed:** `docker-compose.ghcr.yml`, `.env.production`, `Dockerfile`, `nginx-proxy.conf`, GHCR workflow, and deployment docs are all up-to-date on `master` with n8n integration and Rails auth gating. - **Port 3000 collision resolved:** Dev stack down; Tailscale serve (`https://srv1405873.tailcd23a1.ts.net:8444`) already points to `localhost:3000`, so GHCR prod can start with zero Tailscale changes. ### Next Steps (for next session) 1. **SSH/switch to the other VPS user** and navigate to their agent-platform checkout. 2. **Ensure their working tree is on latest `master`** (especially `nginx-proxy.conf`, `docker-compose.ghcr.yml`, `postgres-init-scripts/`, `.env.production`). 3. **Regenerate and update `.env.production`:** - `SECRET_KEY_BASE` → `openssl rand -hex 64` (current file has dummy dev value) - `PROD_POSTGRES_PASSWORD` → strong password - `N8N_PASSWORD` → strong password - `N8N_EDITOR_BASE_URL` → `https://srv1405873.tailcd23a1.ts.net:8444/n8n` 4. **Verify `RAILS_MASTER_KEY` is present** in `.env.production` (add if missing to avoid `credentials.yml.enc` boot failure). 5. **Optionally patch `docker-compose.ghcr.yml`** to pass `RAILS_MASTER_KEY` into the `app` service if not already present. 6. **Start the GHCR stack:** ```bash [score=0.860 recalls=6 avg=0.694 source=memory/2026-04-13.md:1-19]

## Promoted From Short-Term Memory (2026-04-23)

<!-- openclaw-memory-promotion:memory:memory/2026-04-06.md:1:60 -->
- # 2026-04-06 — OpenClaw 2026.4.5 Upgrade + Dreaming Enabled ## Summary Upgraded OpenClaw from 2026.4.1 to 2026.4.5. Configured and tested experimental dreaming feature for automatic memory consolidation. ## OpenClaw Upgrade ### Version - **From:** 2026.4.1 - **To:** 2026.4.5 ### Upgrade Steps 1. `npm update -g openclaw` 2. `openclaw doctor --fix` (migrated config, backup created) 3. `openclaw gateway restart` ### Config Migration - Doctor automatically fixed config - Backup saved: `~/.openclaw/openclaw.json.bak` - No deprecated settings found (clean upgrade) ## Dreaming Configuration (Experimental) ### What is Dreaming? Background memory consolidation system that moves strong short-term signals into durable long-term memory. Runs automatically via scheduled sweeps. ### Config Location ```json plugins.entries.memory-core.config.dreaming ``` ### Settings Applied ```json { "dreaming": { "enabled": true, "frequency": "0 3 * * *" } } ``` | Setting | Value | Description | |---------|-------|-------------| | `enabled` | `true` | Dreaming active | | `frequency` | `0 3 * * *` | Runs at 3:00 AM daily | ### Promotion Policy - **Score threshold:** >= 0.8 - **Recall count:** >= 3 - **Unique queries:** >= 3 ### Three Phases | Phase | Purpose | Writes to MEMORY.md? | |-------|---------|---------------------| | Light | Sort/stage recent signals | No | | REM | Extract patterns/themes | No | | Deep | Promote durable memories | Yes | ### Output Files - `memory/.dreams/` — Machine state (recall store, signals, locks) [score=0.880 recalls=8 avg=0.522 source=memory/2026-04-06.md:1-60]
<!-- openclaw-memory-promotion:memory:memory/2026-04-10.md:1:27 -->
- ## Light Sleep <!-- openclaw:dreaming:light:start --> - Candidate: Session Start: Victor upgraded OpenClaw from 2026.4.5 → 2026.4.9 successfully; Had to remove `"memory-lancedb": { "enabled": false }` from config — even when disabled, app was looking for required properties - confidence: 0.00 - evidence: memory/2026-04-09.md:4-5 - recalls: 0 - status: staged - Candidate: Dreaming Config — Complete: Docs confirm only 2 user-facing settings exist: - confidence: 0.00 - evidence: memory/2026-04-09.md:10-10 - recalls: 0 - status: staged - Candidate: Dreaming Config — Complete: "dreaming": { "enabled": true, "frequency": "0 3 * * *" - confidence: 0.00 - evidence: memory/2026-04-09.md:12-14 - recalls: 0 - status: staged - Candidate: Dreaming Config — Complete: Your current config is complete. No missing fields. Light/deep/REM thresholds are intentionally internal — not user-configurable. - confidence: 0.00 - evidence: memory/2026-04-09.md:17-17 - recalls: 0 - status: staged - Candidate: Dreaming Uses Internal Scheduler (NOT jobs.json): Dreaming cron is managed by **memory-core plugin's own internal scheduler**, NOT the gateway's jobs.json cron system; This is why dreaming doesn't appear in `openclaw cron list` — it's a separate system; ProTek check jobs (7 of th - confidence: 0.00 - evidence: memory/2026-04-09.md:20-23 - recalls: 0 - status: staged [score=0.854 recalls=7 avg=0.564 source=memory/2026-04-10.md:1-27]

## Promoted From Short-Term Memory (2026-04-24)

<!-- openclaw-memory-promotion:memory:memory/2026-04-17.md:498:498 -->
- **Implementation finished and documented.** [score=0.845 recalls=0 avg=0.620 source=memory/2026-04-17.md:498-498]
<!-- openclaw-memory-promotion:memory:memory/2026-04-16.md:494:494 -->
- **Problem:** Model `kimi/k2p6` was falling back to `kimi-coding/k2p6` because provider name mismatch caused "selected model unavailable" error. [score=0.840 recalls=0 avg=0.620 source=memory/2026-04-16.md:494-494]
<!-- openclaw-memory-promotion:memory:memory/2026-04-16.md:496:496 -->
- **Root cause:** Config had provider named `kimi-coding` but requests used `kimi/k2p6` alias. [score=0.840 recalls=0 avg=0.620 source=memory/2026-04-16.md:496-496]
<!-- openclaw-memory-promotion:memory:memory/2026-04-16.md:498:498 -->
- **Changes made to `~/.openclaw/openclaw.json`:** [score=0.840 recalls=0 avg=0.620 source=memory/2026-04-16.md:498-498]

## Promoted From Short-Term Memory (2026-04-26)

<!-- openclaw-memory-promotion:memory:memory/2026-04-19.md:506:508 -->
- - Candidate: Possible Lasting Truths: # Session Log — 2026-04-12 ## 2026-04-12 10:15 — Cross-Agent Note: n8n Redirect Fix Applied by Neo **Context:** Victor noticed n8n at `https://srv1405873.tailcd23a1.ts.net:8444/n8n` was redirecting to `http://srv...:3000/n8n/` and failing due to n8n secur - confidence: 0.62 - evidence: memory/2026-04-18.md:506-508 [score=0.857 recalls=0 avg=0.620 source=memory/2026-04-19.md:58-60]
<!-- openclaw-memory-promotion:memory:memory/2026-04-19.md:503:503 -->
- - Candidate: Reflections: No strong patterns surfaced. [score=0.837 recalls=0 avg=0.620 source=memory/2026-04-19.md:458-458]
<!-- openclaw-memory-promotion:memory:memory/2026-04-16.md:483:483 -->
- - Candidate: Reflections: No strong patterns surfaced. [score=0.808 recalls=0 avg=0.620 source=memory/2026-04-16.md:298-298]
