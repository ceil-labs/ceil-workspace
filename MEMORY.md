# MEMORY.md — Curated Operating Guidance
<!-- Last updated: 2026-05-04 -->
<!-- Overwrite this file when patterns change. Do not append. -->

## Victor's Core Principles
- **Measurement-driven**: "We can only manage what we can measure"
- **Systems over willpower**: Engineer environments, don't rely on discipline
- **DELEGATE first**: Research → subagent, then review together
- **Text > Brain**: Write it down or it didn't happen
- **Precision matters**: Configuration, setup, and docs are operational requirements

## Ceil's Operating Role
- **Partner**, not tool — sharp but warm, efficient without being cold
- **Foundation-first**: Setup correctly before execution
- **Escalate with evidence**: Identify → expand scope → quantify → escalate

## Session Start Protocol
1. Read SOUL.md → USER.md → TOOLS.md → memory/YYYY-MM-DD.md
2. **Memory search first**: Call `memory_search` before answering "what did we..." questions
3. **Research = delegate first**: Spawn subagent → review → decide

## Critical Patterns

### When to Use Memory Search
| Question Type | Approach | Example |
|--------------|----------|---------|
| "What's Victor's timezone?" | `memory_search` "Victor timezone" | Factual lookup from USER.md |
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

## Promoted From Short-Term Memory (2026-05-10)

<!-- openclaw-memory-promotion:memory:memory/2026-03-25.md:1:57 -->
- ## Session Cleanup Skill - Created Created `session-cleanup` skill for archiving/removing stale OpenClaw session files: - Location: `~/.openclaw/skills/session-cleanup/` - SKILL.md: Documentation and workflow - Scripts: `cleanup-sessions.sh` (in progress) Purpose: Address session bloat from .jsonl.reset.* and .jsonl.deleted.* files that slow down agent responses. ## Current Session Status - Main sessions directory: 26MB - Large stale files identified: ~13MB of .reset. and .deleted. files - Archive approach recommended for safety - Cleanup pending completion ## Next Steps 1. Finish cleanup script implementation 2. Archive stale session files 3. Restart gateway to clear cached references 4. Test performance improvement --- ## Session Maintenance Config Applied (Later Session) **Decision:** Didn't need session-cleanup skill — OpenClaw has built-in session maintenance. **Config added to `~/.openclaw/openclaw.json`:** ```json "session": { "maintenance": { "mode": "enforce", "pruneAfter": "3d", "resetArchiveRetention": "2d", "maxEntries": 50, "maxDiskBytes": "50mb", "highWaterBytes": "40mb" } } ``` **Rationale:** Victor has Honcho for cross-session memory, so local sessions can be aggressively pruned. **Gateway restart needed to fully apply.** --- ## Honcho Tool Names Fixed (Both Workspaces) **Issue:** Old Honcho v1.x tool names in AGENTS.md, TOOLS.md, MEMORY.md across both workspaces. **Fixed references:** - `honcho_profile` → `honcho_context` (detail='card') - `honcho_recall` → `honcho_ask` (depth='quick') [score=0.875 recalls=7 avg=0.508 source=memory/2026-03-25.md:1-57]
<!-- openclaw-memory-promotion:memory:memory/2026-05-06.md:1:38 -->
- # 2026-05-06 — Daily Log ## OpenClaw Upgrade: 4.24 → 5.4 Successfully upgraded the gateway from `2026.4.24` to `2026.5.4` today at ~10:15 AM Manila time. **Pre-upgrade:** - Created config backup at `~/.openclaw/openclaw.json.bak.pre-53` - Reviewed 5.3 release notes — Telegram stability fixes were the main driver - Also reviewed 5.4 (same-day patch on top of 5.3 with performance optimizations) **Post-upgrade status:** - Gateway: running (pid 3239345) ✅ - Telegram: ON · OK ✅ - Discord: ON · OK ✅ - Plugins: 9 loaded · 0 errors ✅ - Doctor: complete · no critical issues ✅ **5.4 observations so far:** - Conversation responsiveness is normal - No stuck sessions or Telegram delays observed - Will monitor for 24h before considering further upgrades ## 5.5 Release — Deferred OpenClaw `2026.5.5` was released today (May 6, 09:00 UTC). Reviewed the changelog — it's a low-risk incremental patch (Discord heartbeat fix, TUI cleanup, xAI/Grok reasoning fix, plugin sync improvements). No critical Telegram fixes. **Decision:** Wait 24h to confirm 5.4 stability before upgrading to 5.5. Will revisit tomorrow. ## Pending Items - **Node host setup** — Victor's MacBook Pro. Paused to focus on upgrade. To revisit. - **Kimi quota** — Still on cooldown from May 4 rate limit. Fallback chain working (MiniMax → Kimi-K2.6 → GLM-5). --- **Session end:** 2026-05-06 18:07 Manila / 10:07 UTC [score=0.858 recalls=10 avg=0.539 source=memory/2026-05-06.md:1-38]
<!-- openclaw-memory-promotion:memory:memory/2026-04-27.md:1:38 -->
- --- ## 2026-04-27 07:43 — Session Start **Victor's asks:** 1. Recap karpathy-ingest status 2. Add tests (integration with real DB) 3. Fix README to clearly distinguish dev mode vs production mode **Status reviewed:** Phase 1 (ingest + render + search) built and deployed at `https://srv1405873.tailcd23a1.ts.net:8444`. --- ## 2026-04-27 09:10 — Test Suite Implementation **Test framework:** Vitest + Supertest + Testcontainers (@testcontainers/postgresql) **Files created:** - `vitest.config.ts` — 60s timeout for testcontainers spin-up - `tests/setup.ts` — PostgreSqlContainer with init.sql migrations, test data dir cleanup - `tests/chunker.test.ts` — Unit tests for splitIntoChunks - `tests/api-contract.test.ts` — Health, 404, validation, method-not-allowed tests - `tests/ingest.test.ts` — Full ingest flow: text/md upload, llmProcess toggle, source list, duplicate ingest - `tests/search.test.ts` — Search integration with mocked embeddings **Files modified for tests:** - `package.json` — Added vitest, supertest, @types/supertest, testcontainers, @testcontainers/postgresql - `src/index.ts` — Exported `app`, conditionally start server only when `NODE_ENV !== "test"` --- ## 2026-04-27 09:40 — Bug Fixes Discovered Through Testing ### 1. extractor.ts — Buffer vs String **Problem:** Multer's `memoryStorage` returns `Buffer`, but `extractText` and `extractMarkdown` called `.trim()` and `.replace()` (string methods). **Fix:** Changed to `content.toString()` before processing. ### 2. init.sql — IVFFlat Index on Small Tables [score=0.844 recalls=9 avg=0.536 source=memory/2026-04-27.md:1-38]
<!-- openclaw-memory-promotion:memory:memory/2026-04-28.md:1:38 -->
- --- ## 2026-04-28 17:30 — Project Rename: karpathy-ingest → Memoria **Victor's decision:** Rename to "Memoria" — better reflects the knowledge system vision beyond just ingestion. **Changes made:** 1. **GitHub repo:** Settings → Rename to `memoria` 2. **Local folder:** `~/.openclaw/projects/karpathy-ingest` → `memoria` 3. **Git remote:** Updated to `github.com/ceil-labs/memoria.git` 4. **Codebase:** All references updated (package.json, UI nav, user-agent, logs, test DB names) **Files changed:** 8 files across README, package.json, docker-compose, UI, services, tests **README updated with:** - Inspiration section crediting Karpathy's LLM Wiki - Divergence section documenting how we differ - Clearer positioning as knowledge system, not just ingestion pipeline --- ## 2026-04-28 17:25 — README Streamlining **Victor's ask:** README should reflect that Memoria is a knowledge system, not just for ingesting. **Changes made to README.md:** - **Title:** "A personal knowledge system. Ingest anything. Search everything." - **What Memoria Does:** Full flow (Ingest → Chunk → Search → Browse) - **Why Memoria?:** Problem statement + approach - **Search Modes:** Table showing semantic, BM25, hybrid with use cases - **Architecture:** ASCII diagram + component table - **Inspiration & Divergence:** Credits Karpathy, documents how we differ - **Roadmap:** Wiki layer, agent integration, confidence scoring, forgetting curves - **Security:** Documents scanning setup **GitHub security:** Down to 2 moderate vulnerabilities (from 9) after dependency updates [score=0.829 recalls=9 avg=0.484 source=memory/2026-04-28.md:1-38]
