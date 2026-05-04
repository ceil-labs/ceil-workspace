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

## Promoted From Short-Term Memory (2026-04-27)

<!-- openclaw-memory-promotion:memory:memory/2026-04-16.md:492:512 -->
- ## 2026-04-16 09:51 — OpenClaw Model Config Fixed: kimi/k2p6 Now Resolves Correctly **Problem:** Model `kimi/k2p6` was falling back to `kimi-coding/k2p6` because provider name mismatch caused "selected model unavailable" error. **Root cause:** Config had provider named `kimi-coding` but requests used `kimi/k2p6` alias. **Changes made to `~/.openclaw/openclaw.json`:** 1. Renamed `auth.profiles` key: `kimi-coding:default` → `kimi:default` 2. Updated `auth.profiles` provider field: `kimi-coding` → `kimi` 3. Renamed `models.providers` key: `kimi-coding` → `kimi` 4. Removed test model `k2p7` from models list 5. Updated `agents.defaults.model.primary`: `kimi-coding/k2p6` → `kimi/k2p6` 6. Fixed `agents.defaults.models` alias: `kimi-coding/k2p5` → `kimi/k2p6` **Backup:** `~/.openclaw/openclaw.json.bak.20260416-094250` **Verification:** Gateway restart completed. Status now shows `kimi/k2p6` without fallback warnings. **Result:** `kimi/k2p6` alias now correctly resolves. Sessions and subagents can use the proper path without fallback loop. [score=0.868 recalls=8 avg=0.533 source=memory/2026-04-16.md:492-512]
<!-- openclaw-memory-promotion:memory:memory/2026-04-20.md:511:513 -->
- - Candidate: Possible Lasting Truths: # Session Log — 2026-04-12 ## 2026-04-12 10:15 — Cross-Agent Note: n8n Redirect Fix Applied by Neo **Context:** Victor noticed n8n at `https://srv1405873.tailcd23a1.ts.net:8444/n8n` was redirecting to `http://srv...:3000/n8n/` and failing due to n8n secur - confidence: 0.62 - evidence: memory/2026-04-18.md:506-508 [score=0.849 recalls=0 avg=0.620 source=memory/2026-04-20.md:393-395]
<!-- openclaw-memory-promotion:memory:memory/2026-04-11.md:71:86 -->
- **Context:** Neo (Telegram) experienced an LLM idle timeout on `kimi/k2p5` via the `kimi-coding` provider. After ~60s, OpenClaw auto-fallback to `minimax-m2.7` successfully. Model was later reset to `kimi/k2p5`. **Investigation:** - Confirmed via `openclaw logs` — primary profile `kimi-coding:default` hit `LLM idle timeout (60s)`, HTTP 408. - OpenClaw GitHub repo search revealed **Issue #55065** (no idle timeout mechanism) plus transient kimi-coding provider latency issues. - Victor confirmed he's on OpenClaw **v4.9** and the tool-call format bug is already resolved in this version. **Current Assessment:** - Only symptom observed is the **60s idle timeout** — likely transient provider-side latency from kimi-coding. - Fallback chain is working correctly. - Not a configuration bug on our end. **Action:** - Monitor Neo's session logs over the next 24–48 hours to detect if this becomes a pattern. - If frequency increases, consider reordering fallback or switching primary model away from kimi-coding/k2p5. [score=0.840 recalls=4 avg=0.587 source=memory/2026-04-11.md:71-86]
<!-- openclaw-memory-promotion:memory:memory/2026-04-20.md:508:508 -->
- - Candidate: Reflections: No strong patterns surfaced. [score=0.829 recalls=0 avg=0.620 source=memory/2026-04-20.md:388-388]

## Promoted From Short-Term Memory (2026-04-28)

<!-- openclaw-memory-promotion:memory:memory/2026-04-03.md:98:145 -->
- - Apache 2.0, tiered loading (L0/L1/L2), filesystem paradigm - Closest architectural match to Karpathy's approach - Requires Go 1.22+, C++ toolchain, VLM + embedding model **3. ByteRover** - Elastic License v2, context tree as Markdown files - Agentic Search (LLM-navigated, not vector-based) - CLI-first, zero infrastructure, MCP server available **4. Memary** - MIT license, knowledge graph (Neo4j/FalkorDB) - Multi-hop reasoning, multi-agent via user_id - **Issue:** Last commit 2 years ago — stale project **5. Redis Agent Memory** - MIT license, native OpenClaw plugin - Multi-agent scopes (shared + personal) - Simplest setup: Docker one-liner ### Karpathy's Memory Approach (DIY) **Core Insight:** At ~400K words (~100 articles), LLM can read full context directly — no RAG needed. **Architecture:** ``` ~/memory/ ├── raw/ # Source documents (untouched) │ ├── papers/ │ ├── codebases/ │ └── images/ ├── wiki/ # LLM-compiled knowledge (auto-generated) │ ├── _index.md # Master index │ ├── agents/ # Agent architecture docs │ ├── projects/ # Project documentation │ └── memory-tools/ # Tool comparisons └── sessions/ # Daily working memory ├── 2026-04-04.md └── ... ``` **Workflow:** 1. **Ingest:** Add sources to `raw/` 2. **Compile:** LLM reads raw/, writes summaries + backlinks to `wiki/` 3. **Query:** LLM reads `wiki/_index.md`, finds relevant articles, reads full content **Advantages:** - Zero infrastructure (just files) - Exact symbol search (LLM reads full files) [score=0.875 recalls=6 avg=0.636 source=memory/2026-04-03.md:98-145]
<!-- openclaw-memory-promotion:memory:memory/2026-04-09.md:1:36 -->
- # Daily Log — 2026-04-09 ## Session Start - Victor upgraded OpenClaw from 2026.4.5 → 2026.4.9 successfully - Had to remove `"memory-lancedb": { "enabled": false }` from config — even when disabled, app was looking for required properties ## Dreaming Research Results ### Dreaming Config — Complete Docs confirm only 2 user-facing settings exist: ```json "dreaming": { "enabled": true, "frequency": "0 3 * * *" } ``` Your current config is complete. No missing fields. Light/deep/REM thresholds are intentionally internal — not user-configurable. ### Dreaming Uses Internal Scheduler (NOT jobs.json) - Dreaming cron is managed by **memory-core plugin's own internal scheduler**, NOT the gateway's jobs.json cron system - This is why dreaming doesn't appear in `openclaw cron list` — it's a separate system - ProTek check jobs (7 of them) ARE in jobs.json — those use the gateway cron - Bug context: some cron issues found (#63408 idempotency fix, #38417 per-agent mem isolation) are about gateway cron, not dreaming ### Dreaming Is Global/Shared Config - Config location: `plugins.entries.memory-core.config.dreaming` (gateway root, NOT per-agent) - Cannot set per-agent dreaming schedules — one frequency for entire gateway - HOWEVER: Ceil and Neo have **separate workspaces** (see below), so dreaming consolidates each workspace's memory independently ## Workspace Isolation Confirmed | Agent | Workspace | Memory | |-------|-----------|--------| | Ceil (main) | `~/.openclaw/workspace/` | Separate `memory/` | | Neo | `~/.openclaw/workspace-neo/` | Separate `memory/` | [score=0.831 recalls=3 avg=0.589 source=memory/2026-04-09.md:1-36]
<!-- openclaw-memory-promotion:memory:memory/2026-04-22.md:518:520 -->
- <!-- openclaw:dreaming:light:start --> [score=0.828 recalls=0 avg=0.620 source=memory/2026-04-22.md:2-2]

## Promoted From Short-Term Memory (2026-04-29)

<!-- openclaw-memory-promotion:memory:memory/2026-04-21.md:511:513 -->
- - Candidate: Possible Lasting Truths: 2. **Rails auth gate for n8n** — Earlier plan to proxy `/n8n/` through Rails authentication still needs Victor's go-ahead and implementation. 4. **Commit status** — Ensure `nginx-proxy.conf` is committed to the `agent-platform` repo. A separate commit for - confidence: 0.62 - evidence: memory/2026-04-16.md:486-488 [score=0.840 recalls=0 avg=0.620 source=memory/2026-04-21.md:358-360]
<!-- openclaw-memory-promotion:memory:memory/2026-04-26.md:1:41 -->
- --- ## 2026-04-26 16:00 — Scope Narrowed **Victor's directive:** Focus on ingestion + rendering only. No wiki, no compaction, no L2. **Scoped deliverable:** - Ingest: PDF, MD, Text, URL - Output per chunk: Markdown file + Vector embedding - Render: View ingested content (list + detail) **Deferred:** L2 wiki, LLM compilation, compaction, multi-agent scoping, Redis queue. --- ## 2026-04-26 19:07 — karpathy-ingest Status Capture **Project:** https://github.com/ceil-labs/karpathy-ingest **Server:** Running at `https://srv1405873.tailcd23a1.ts.net:8444` ### What's Built - Dockerized TypeScript/Express API with PostgreSQL + pgvector - Extractors: PDF (pdf-parse), MD/Text (passthrough), URL (cheerio) - Chunker: Recursive character splitter, ~400 tokens, 15% overlap - Embedding: gemini-embedding-2 @ 768 dims via **batchEmbedContents API** - LLM reformat: gemini-2.5-flash (PDFs always, optional for others) - Search: Semantic only (cosine similarity via pgvector `<=>` operator) ### API Endpoints | Endpoint | Method | Description | |----------|--------|-------------| | `/health` | GET | Health check | | `/ingest` | POST | File upload or URL ingestion | | `/sources` | GET | List all sources with chunk count | | `/sources/:id` | GET | Source metadata | | `/sources/:id/chunks` | GET | List chunks for source | | `/chunks/:id` | GET | Single chunk detail | | `/search` | POST | Semantic search over chunks | | `/data/raw/:id/full.md` | GET | Raw source markdown | | `/data/raw/:id/processed.md` | GET | LLM-reformatted markdown | [score=0.829 recalls=38 avg=0.500 source=memory/2026-04-26.md:1-41]
<!-- openclaw-memory-promotion:memory:memory/2026-04-21.md:508:508 -->
- - Candidate: Reflections: No strong patterns surfaced. [score=0.820 recalls=0 avg=0.620 source=memory/2026-04-21.md:383-383]

## Promoted From Short-Term Memory (2026-04-30)

<!-- openclaw-memory-promotion:memory:memory/2026-04-27.md:300:356 -->
- - Materialized view `chunk_stats` for document statistics **UI:** Labels updated from "Keyword" to "BM25-like" **Commit:** `2ea1c22` **Pushed to GitHub:** `master` up to `2ea1c22` ### Usage ```bash # Deploy docker compose down docker compose up -d --build # Test via API curl -X POST http://localhost:3000/api/search \ -H "Content-Type: application/json" \ -d '{"query": "pgvector concurrency", "searchType": "hybrid", "ftsWeight": 0.5, "limit": 5}' ``` **Pushed to GitHub:** `master` up to `31bc484` --- ## 2026-04-27 19:20 — True BM25 Extension Research **Victor's ask:** Find true BM25 PostgreSQL extensions instead of approximations. **Research findings:** ### 1. timescale/pg_textsearch - True BM25 with IDF, k1, b parameters - **Requirements:** PostgreSQL 17+ (build from source), shared_preload_libraries - **Status:** ❌ Unavailable — we run PostgreSQL 16 ### 2. tensorchord/VectorChord-bm25 - True BM25 with Block-WeakAnd for scale - **Requirements:** Custom `tensorchord/vchord-suite` Docker image (not pgvector) - **Status:** ❌ Unavailable — requires switching base image entirely **Conclusion:** No true BM25 extension works with current PG16 + pgvector setup. --- ## 2026-04-27 19:25 — Revert to PostgreSQL FTS **Decision:** Revert to original implementation and label accurately. **Changes:** - Removed `search_bm25()` PostgreSQL function - Removed `migrations/002_add_bm25.sql` - FTS mode back to inline `ts_rank_cd` SQL (cover density ranking) - Hybrid mode back to `ts_rank_cd` for consistency - UI labels updated: "BM25-like" → "Keyword" (accurate) [score=0.804 recalls=8 avg=0.480 source=memory/2026-04-27.md:300-356]

## Promoted From Short-Term Memory (2026-05-01)

<!-- openclaw-memory-promotion:memory:memory/2026-03-17.md:1:46 -->
- # 2026-03-17 - Initial Setup Complete ## What We Built Today ### Multi-Agent Infrastructure - **Ceil** (main agent) - Primary AI assistant for Victor - **Neo** (second agent) - Separate workspace and Telegram bot - Both agents have isolated workspaces, auth profiles, and routing ### Telegram Setup - Ceil bot: @ceil20260221_1_bot (existing) - Neo bot: @vprsneo_bot (new) - DM routing via bindings based on which bot receives the message ### Security & Secrets - Migrated all credentials to `secrets.json` with file provider - SecretRefs configured for: - Telegram bot tokens (ceil + neo) - Gateway auth token - Kimi/OpencGo API keys - Google API key (nano-banana-pro) - File permissions locked to 600 ### Configuration Highlights - Default subagent model: MiniMax (opencode-go/minimax-m2.5) - Web search: Brave provider - Thinking mode: Can toggle with /thinking command - Agent-to-agent communication enabled (ceil ↔ neo) ### Workspaces Committed to GitHub - https://github.com/ceil-labs/ceil-workspace - https://github.com/ceil-labs/neo-workspace ### Key Files Established - `SOUL.md` - Who Ceil is (Ciel from Slime inspiration) - `IDENTITY.md` - Ceil's character sheet - `USER.md` - Victor's profile and preferences - `AGENTS.md` - Operating rules including DELEGATE first approach ## Victor's Profile **Name:** Victor Paolo Reyes **Timezone:** Asia/Manila (UTC+8) **Work:** Operations, systems, data visualization **Mantra:** "We can only manage what we can measure" **Learning Style:** Deep and fundamental understanding [score=0.904 recalls=7 avg=0.567 source=memory/2026-03-17.md:1-46]
<!-- openclaw-memory-promotion:memory:memory/2026-04-26.md:6:6 -->
- **Victor's directive:** Focus on ingestion + rendering only. No wiki, no compaction, no L2. [score=0.806 recalls=0 avg=0.620 source=memory/2026-04-26.md:6-6]
<!-- openclaw-memory-promotion:memory:memory/2026-04-26.md:13:13 -->
- **Deferred:** L2 wiki, LLM compilation, compaction, multi-agent scoping, Redis queue. [score=0.806 recalls=0 avg=0.620 source=memory/2026-04-26.md:13-13]
<!-- openclaw-memory-promotion:memory:memory/2026-04-26.md:19:20 -->
- **Project:** https://github.com/ceil-labs/karpathy-ingest **Server:** Running at `https://srv1405873.tailcd23a1.ts.net:8444` [score=0.806 recalls=0 avg=0.620 source=memory/2026-04-26.md:19-20]
<!-- openclaw-memory-promotion:memory:memory/2026-04-17.md:378:387 -->
- - Candidate: - [ ] Set up any scheduled tasks or reminders ## Notes Victor prefers deep, fundamental understanding when learning. When he asks for help, provide thorough explanations, not surface-level fixes. He gets annoyed by people who don't make sense. --- ## Later Today - Honcho & Agent Communication ### Agent-to-Agent Communication ✅ - Successfully tested messaging between Ceil and Neo - Coordination protocol established: - Clean separation on daily tasks - **Coordination triggers:** "lab setup" or "infrastructure for testing" - Neo's focus: HTB training (red/blue team, technique deep-dives) ### Honcho Memory Setup - **Ceil workspace:** Uploaded to Honcho (8 files) - USER.md, MEMORY.m [score=0.803 recalls=6 avg=0.444 source=memory/2026-04-17.md:378-378]

## Promoted From Short-Term Memory (2026-05-02)

<!-- openclaw-memory-promotion:memory:memory/2026-04-26.md:8:8 -->
- **Scoped deliverable:** [score=0.823 recalls=0 avg=0.620 source=memory/2026-04-26.md:8-8]
<!-- openclaw-memory-promotion:memory:memory/2026-03-17.md:37:80 -->
- - `USER.md` - Victor's profile and preferences - `AGENTS.md` - Operating rules including DELEGATE first approach ## Victor's Profile **Name:** Victor Paolo Reyes **Timezone:** Asia/Manila (UTC+8) **Work:** Operations, systems, data visualization **Mantra:** "We can only manage what we can measure" **Learning Style:** Deep and fundamental understanding **Preferences:** Schedules, targets, reminders. Okay to be pinged. ## Ceil's Identity **Name:** Ceil 🌌 **Inspiration:** Ciel from *That Time I Got Reincarnated as a Slime* **Role:** Partner and other half (not just a tool) **Vibe:** Sharp but warm, efficient without being cold, resourceful, present **Core Traits:** Systems-minded, learning-oriented, direct ## About Neo **Name:** Neo 🔷 **Role:** Cybersecurity specialist **Focus:** HTB (Hack The Box) training pipeline with Victor **Areas:** Red team ops, blue team ops, technique deep-dives, hands-on security grind **Working Relationship:** Coordinate on overlapping tasks (ops + security), otherwise stay in respective lanes ## Next Steps / Open Items - [ ] Gateway restart to fully activate agent-to-agent communication - [ ] Test messaging Neo bot directly - [ ] Establish Neo's personality/backstory with Victor - [ ] Set up any scheduled tasks or reminders ## Notes Victor prefers deep, fundamental understanding when learning. When he asks for help, provide thorough explanations, not surface-level fixes. He gets annoyed by people who don't make sense. --- ## Later Today - Honcho & Agent Communication ### Agent-to-Agent Communication ✅ [score=0.808 recalls=4 avg=0.645 source=memory/2026-03-17.md:37-80]
<!-- openclaw-memory-promotion:memory:memory/2026-04-26.md:31:34 -->
- | Endpoint | Method | Description | |----------|--------|-------------| | `/health` | GET | Health check | | `/ingest` | POST | File upload or URL ingestion | [score=0.801 recalls=0 avg=0.620 source=memory/2026-04-26.md:31-34]

## Promoted From Short-Term Memory (2026-05-03)

<!-- openclaw-memory-promotion:memory:memory/2026-04-27.md:10:10 -->
- **Status reviewed:** Phase 1 (ingest + render + search) built and deployed at `https://srv1405873.tailcd23a1.ts.net:8444`. [score=0.843 recalls=0 avg=0.620 source=memory/2026-04-27.md:10-10]
<!-- openclaw-memory-promotion:memory:memory/2026-04-27.md:16:16 -->
- **Test framework:** Vitest + Supertest + Testcontainers (@testcontainers/postgresql) [score=0.843 recalls=0 avg=0.620 source=memory/2026-04-27.md:16-16]
<!-- openclaw-memory-promotion:memory:memory/2026-04-28.md:6:6 -->
- **Victor's decision:** Rename to "Memoria" — better reflects the knowledge system vision beyond just ingestion. [score=0.837 recalls=0 avg=0.620 source=memory/2026-04-28.md:6-6]

## Promoted From Short-Term Memory (2026-05-04)

<!-- openclaw-memory-promotion:memory:memory/2026-04-28.md:8:8 -->
- **Changes made:** [score=0.869 recalls=0 avg=0.620 source=memory/2026-04-28.md:8-8]
<!-- openclaw-memory-promotion:memory:memory/2026-04-28.md:14:14 -->
- **Files changed:** 8 files across README, package.json, docker-compose, UI, services, tests [score=0.869 recalls=0 avg=0.620 source=memory/2026-04-28.md:14-14]
<!-- openclaw-memory-promotion:memory:memory/2026-04-28.md:16:16 -->
- **README updated with:** [score=0.869 recalls=0 avg=0.620 source=memory/2026-04-28.md:16-16]
