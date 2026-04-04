# AI Agent Memory Tools — Comprehensive Research Report

**Research Date:** April 3, 2026  
**Context:** Agent-platform project evaluation — self-hosted preference, n8n integration, multi-agent shared memory  
**Prepared for:** Victor / Ceil agent team

---

## Executive Summary

Choosing the right memory layer is foundational to your multi-agent architecture. The core requirements — self-hosted, n8n-compatible, multi-agent shared memory, open-source — narrow the field significantly. Most popular tools (Honcho, Mem0) are cloud-first or cloud-required; the self-hosted options that exist vary widely in maturity, maintenance activity, and genuine multi-agent support.

### Top 3 Recommendations

| Rank | Tool | Why | Best For |
|------|------|-----|----------|
| 🥇 **1** | **Redis Agent Memory Server** | Mature Docker deployment, true multi-agent routing (shared + personal scopes), native OpenClaw plugin, MIT license, actively maintained by Redis. Redis is already a known quantity in your stack. | Teams already using Redis; want zero-friction OpenClaw integration with production-grade multi-agent memory |
| 🥈 **2** | **Mem0 (Self-Hosted)** | ~48K GitHub stars, largest ecosystem, clean Python SDK, Docker Compose for self-hosted (PostgreSQL + pgvector + Neo4j). Full feature parity with cloud on Pro tier. Strong n8n integration via HTTP Request node. | Teams wanting the most battle-tested option with maximum community support |
| 🥉 **3** | **Hindsight** | MIT-licensed, multi-strategy retrieval (semantic + BM25 + graph + temporal), all features on all tiers including self-hosted, benchmark-leading at 91.4% on LongMemEval vs Mem0's 49.0%. Python + TypeScript + Go SDKs. | Teams prioritizing retrieval quality and open-source completeness over ecosystem size |

### Key Finding
**Honcho** is primarily a cloud service (uploads workspace data to external API on setup). The community self-hosted fork (`elkimek/honcho-self-hosted`) exists but requires PostgreSQL + Redis + Deriver/Dialectic/Dream workers — significantly more complex than alternatives. MemOS is the better cloud option if you want something Honcho-like but with a working OpenClaw plugin.

---

## Comparison Matrix

| Tool | Deployment | Multi-Agent | n8n Integration | Storage | License | GitHub Stars | Setup | Pricing |
|------|-----------|-------------|-----------------|---------|---------|-------------|-------|---------|
| **Honcho** | Cloud-only (core) | Via cloud (peer cards) | HTTP webhook | Cloud hosted | Apache 2.0 | ~5.3K | Cloud only (self-hosted fork exists) | Free tier / paid |
| **OpenViking** | Self-hosted ⭐ | Via session scoping | HTTP API | Filesystem + optional DB | Apache 2.0 | ~2K (volcengine) | Docker | Free |
| **Mem0** | Cloud + Self-hosted | Yes (scoped retrieval) | HTTP Request node | PostgreSQL + pgvector + Neo4j | Apache 2.0 | ~48K | Docker Compose | Free / $19+ / $249 |
| **Hindsight** | Cloud + Self-hosted | Yes (multi-agent) | HTTP Request node | Qdrant / Chroma / pgvector / Redis | MIT | ~4K | Docker | Free / $19+ |
| **Holographic** | Local only | Limited | Direct SQLite | SQLite FTS5 | ? | ? | None (single binary) | Free |
| **RetainDB** | Cloud | Yes | HTTP API | Cloud managed | ? | ? | API key | Paid |
| **ByteRover** | Local + Cloud | Per-project | CLI-based | Markdown files (.brv) | ? | ? | npm global | Free / paid cloud |
| **Letta** | Self-hosted | Yes (agent blocks) | REST API | PostgreSQL | Apache 2.0 | ~21K | Docker | Free / managed |
| **MemOS** | Cloud + Local | Yes (multiAgentMode) | OpenClaw plugin | SQLite (local) / Cloud | ? | ? | OpenClaw plugin | Free / paid |
| **Redis Agent Memory** | Self-hosted | Yes (scopes) | OpenClaw plugin | Redis + vector | MIT | ? | Docker one-liner | Free (Redis) |

---

## Individual Tool Deep-Dives

---

### 1. Honcho (honcho-ai)

**Overview:** Honcho is a cloud-based memory service from Plastic Labs. It provides dialectic user modeling (conversational profiling), peer cards (agent profiles), and profile scoping. It has an OpenClaw integration via the Honcho plugin for OpenClaw.

**Deployment:** Cloud-primary. The core service is hosted at `api.honcho.dev`. There is a community self-hosted fork (`elkimek/honcho-self-hosted`) that wires Honcho-compatible API to PostgreSQL + pgvector + Redis, but this requires running Deriver/Dialectic/Dream workers — significant complexity.

**Multi-Agent Support:** Yes — via "peer cards" and shared user profiles. Multiple agents can share context through scoped user modeling.

**Storage:** Cloud-hosted (not self-controlled). Self-hosted fork uses PostgreSQL + pgvector + Redis.

**n8n Integration:** Limited. No native n8n node. HTTP webhook support exists but requires custom work.

**SDKs:** Python, JavaScript/TypeScript.

**Pricing:** Free tier available; paid tiers for higher limits.

**Pros:**
- Sophisticated user modeling (dialectic approach)
- Clean OpenClaw plugin already available
- Peer cards enable agent-to-agent memory sharing
- Apache 2.0 license on core

**Cons:**
- ⚠️ **Privacy concern:** `honcho setup` uploads workspace files (USER.md, MEMORY.md, memory/, canvas/, SOUL.md, AGENTS.md, BOOTSTRAP.md, TOOLS.md) to `api.honcho.dev` — explicitly not self-hosted
- Self-hosted fork is complex (PostgreSQL + Redis + multiple workers)
- Cloud dependency for core product
- No native n8n node

**Verdict:** Not suitable if self-hosted is a hard requirement. The cloud-upload requirement is a red flag for privacy-sensitive deployments.

---

### 2. OpenViking (volcengine / Open-Viking)

**Overview:** OpenViking is ByteDance's open-source context database for AI agents, organized around a filesystem paradigm. It unifies memory, resources, and skills through hierarchical L0/L1/L2 tiered loading, significantly reducing token consumption by loading context on demand.

**Deployment:** Fully self-hosted ⭐. Apache 2.0 license. Docker available.

**Multi-Agent Support:** Session-based scoping. Each session gets its own filesystem hierarchy. Multi-agent would require shared namespace configuration.

**Storage:** Filesystem-native (paradigm: Viking:// protocol). Optional database backend for production.

**n8n Integration:** HTTP API available. No native n8n node, but can be integrated via HTTP Request node.

**SDKs:** Python (primary), JavaScript.

**Pricing:** 100% free and open-source (Apache 2.0).

**Pros:**
- ✅ True self-hosted, Apache 2.0
- Tiered loading (L0/L1/L2) genuinely reduces token costs
- Filesystem paradigm is intuitive and git-friendly
- Actively developed by ByteDance/Volcengine
- Self-iteration enables continuous memory improvement

**Cons:**
- Newer project (~2K stars) — smaller community
- No native OpenClaw plugin yet
- Multi-agent support is session-based, not explicitly shared-memory
- n8n integration requires HTTP work

**Verdict:** Strong choice for pure self-hosted. ByteDance backing suggests long-term maintenance. Best if you prioritize filesystem organization and tiered token reduction.

---

### 3. Mem0 (mem0ai)

**Overview:** Mem0 is the most popular open-source agent memory layer (~48K GitHub stars, YC-backed $24M Series A October 2025). It provides personalization memory with server-side LLM extraction and a circuit breaker pattern for resilience.

**Deployment:** Cloud + Self-hosted ⭐. Self-hosted via Docker Compose (PostgreSQL + pgvector + Neo4j). Full feature parity between cloud and self-hosted for Pro tier.

**Multi-Agent Support:** Yes — scoped retrieval per agent/user/session. Multiple agents can share memory when configured with the same user_id.

**Storage:** Self-hosted: PostgreSQL + pgvector + Neo4j. Cloud: managed infrastructure.

**n8n Integration:** ✅ Excellent. HTTP Request node works seamlessly. Mem0's REST API is well-documented. No native n8n node but trivially reachable via webhooks/HTTP.

**SDKs:** Python, JavaScript.

**Pricing:** Free (self-hosted + limited cloud), Standard $19/month, Pro $249/month. Graph features (entity relationships, multi-hop) require Pro — this is the main criticism.

**Pros:**
- ✅ Largest community, most tutorials and examples
- ✅ Self-hosted Docker Compose available
- ✅ Clean SDKs (Python, JS) — easiest to integrate
- ✅ Well-funded (YC + $24M Series A = long-term viability)
- ✅ Good n8n integration via HTTP

**Cons:**
- Graph features locked behind $249/month Pro tier
- Benchmark performance: 49.0% on LongMemEval vs Hindsight's 91.4%
- Requires Neo4j + PostgreSQL + pgvector — heavier than Redis-only options
- Server-side LLM extraction means dependency on LLM API for memory operations

**Verdict:** The safest bet for ecosystem and community. Self-hosted Docker Compose is solid. The Pro paywall for graph features is a legitimate concern for institutional knowledge use cases.

---

### 4. Hindsight (hindsight-client / vectorize-io)

**Overview:** Hindsight is an MIT-licensed agent memory system built by Vectorize.io. It runs four parallel retrieval strategies on every query: semantic search, BM25 keyword matching, graph traversal, and temporal reasoning. A cross-encoder reranker merges results. MIT licensed with all features at every tier.

**Deployment:** Cloud + Self-hosted ⭐. Docker-based deployment.

**Multi-Agent Support:** Yes — multi-agent architectures supported. Shared memory across agents.

**Storage:** Qdrant, Chroma, pgvector, or Redis (configurable vector backend).

**n8n Integration:** HTTP Request node — well-documented REST API.

**SDKs:** Python, TypeScript, Go (three SDKs — notably Go support which Mem0 lacks).

**Pricing:** Free self-hosted, Standard $19/month, Pro $39/month (significantly cheaper than Mem0 Pro).

**Pros:**
- ✅ MIT license — all features at every tier including self-hosted
- ✅ Benchmark-leading: 91.4% on LongMemEval vs Mem0's 49.0%
- ✅ Multi-strategy retrieval (semantic + BM25 + graph + temporal) — no paywall
- ✅ Three SDKs including Go
- ✅ MCP-first for MCP-compatible agents
- ✅ Pro tier at $39/month vs Mem0's $249/month

**Cons:**
- Newer project (~4K stars) — smaller ecosystem than Mem0
- Less community tooling and examples
- No native OpenClaw plugin

**Verdict:** Best value-for-feature in the space. If retrieval quality and complete MIT-licensed features matter, Hindsight wins. Best positioned as the "serious" Mem0 alternative.

---

### 5. Holographic (Local SQLite)

**Overview:** Holographic is a minimal, local-only memory system. Based on search results referencing FTS5 + trust scoring + HRR (Hyperbolic Discounting/Rank) algebra, it appears to be a research-oriented approach. Details are sparse — likely a smaller or newer project.

**Deployment:** Local only. No dependencies (standalone binary).

**Multi-Agent Support:** Limited. Local SQLite means single-machine use; multi-agent would need careful file locking or separate DB files.

**Storage:** SQLite with FTS5 full-text search.

**n8n Integration:** Direct SQLite — no network API, so n8n integration would require a wrapper service.

**SDKs:** Likely minimal (research project).

**Pricing:** Free.

**Pros:**
- Zero infrastructure — single binary, no dependencies
- FTS5 + trust scoring is an interesting approach to memory relevance

**Cons:**
- Local-only — no networked access
- Very limited multi-agent support
- Unclear GitHub presence or maintenance status
- Research-grade, not production-grade

**Verdict:** Interesting approach but too unproven for production use. If you want SQLite-based memory, Engram (below) or MemOS Local are better choices.

---

### 6. RetainDB

**Overview:** Cloud-only memory service with hybrid search (Vector + BM25 + Reranking). 5 tools available. No self-hosted option.

**Deployment:** Cloud-only.

**Multi-Agent Support:** Yes.

**Storage:** Cloud managed.

**n8n Integration:** HTTP API.

**Pricing:** Paid only.

**Pros:**
- Hybrid search (Vector + BM25 + Reranking) is the correct architecture for high-quality retrieval

**Cons:**
- Cloud-only — eliminates it from your requirements
- No open-source component
- No free tier mentioned
- Unclear GitHub presence

**Verdict:** Skip — cloud-only and paid, no self-hosted option.

---

### 7. ByteRover (byterover-cli / brv)

**Overview:** ByteRover is a CLI tool for coding agents. It provides structured memory as a context tree, syncs to cloud, and enables sharing across tools and teammates. Now has an OpenClaw skill available.

**Deployment:** Local-first (`.brv/context-tree/` directory), with optional cloud sync.

**Multi-Agent Support:** Per-project sharing via the context tree. Multiple agents can read from the same `.brv` directory.

**Storage:** Markdown files in `.brv/context-tree/` — human-readable, git-friendly, hierarchically organized.

**n8n Integration:** CLI-based — not directly n8n-compatible without a wrapper.

**SDKs:** CLI only (`npm install -g byterover-cli`).

**Pricing:** Free local; cloud sync is paid.

**Pros:**
- Human-readable memory storage (markdown files)
- Context tree is intuitive for project knowledge
- OpenClaw skill already exists
- Git-friendly — version-controllable memory

**Cons:**
- Primarily a coding agent memory tool
- Not a general-purpose agent memory system
- n8n integration requires CLI wrapper
- No sophisticated retrieval (no vector search, no hybrid)

**Verdict:** Good for coding agents specifically. Not a general-purpose multi-agent memory layer. If your agents are primarily doing code tasks, it's worth considering; otherwise, look elsewhere.

---

### 8. Letta (letta-ai)

**Overview:** Letta is a platform for building stateful agents (~21K GitHub stars). It uses an OS-inspired tiered memory architecture — similar in concept to virtual memory paging for agents. Core memory, archived memory, and retrieval all managed tiered.

**Deployment:** Self-hosted ⭐ via Docker. Connects to PostgreSQL (including Amazon Aurora). Managed cloud also available.

**Multi-Agent Support:** Yes — agents have memory blocks (human/persona) that persist across sessions. Multiple agents can exist on the same Letta server with isolated or shared memory.

**Storage:** PostgreSQL. Can use Amazon Aurora for production scale.

**n8n Integration:** REST API — can be called from n8n HTTP Request node.

**SDKs:** Python (primary), REST API.

**Pricing:** Free self-hosted; managed cloud available.

**Pros:**
- ✅ Solid self-hosted Docker deployment
- ✅ OS-inspired tiered memory is conceptually elegant
- ✅ ~21K stars, active development
- ✅ PostgreSQL backend (familiar, production-grade)
- ✅ Aurora support for scaling

**Cons:**
- Memory architecture is agent-managed (not automatic extraction)
- No native OpenClaw plugin
- No multi-strategy retrieval (vector-only for archival)
- No BM25 or graph retrieval

**Verdict:** Strong self-hosted option with good PostgreSQL integration. Best for teams that want a clean memory architecture with agent-controlled memory management.

---

### 9. MemOS (MemTensor)

**Overview:** MemOS is an AI memory OS for LLM and Agent systems, with specific OpenClaw integration. It has both a Cloud plugin (72% token reduction, multi-agent sharing) and a Local plugin (100% on-device SQLite + FTS5 + vector). Active development — v2.0 "Stardust" released December 2025.

**Deployment:** Cloud + Local ⭐. Local is SQLite-based; Cloud requires API key from memos.memtensor.cn.

**Multi-Agent Support:** ✅ Yes — `multiAgentMode: true` enables shared memory across agents. Dynamic context captures `ctx.agentId` per OpenClaw lifecycle hook. Multiple agents read/write the same memory pool via unified `user_id`.

**Storage:** Local: SQLite with FTS5 + vector. Cloud: managed.

**n8n Integration:** OpenClaw plugin only — not directly n8n-native. HTTP API for cloud version.

**SDKs:** OpenClaw plugin (main integration path).

**Pricing:** Free local; cloud pricing TBD (API key from openmem.net).

**Pros:**
- ✅ Native OpenClaw plugin with multi-agent mode
- ✅ 72% token reduction claim for cloud version
- ✅ Local version is 100% offline, SQLite-based
- ✅ Hybrid search (FTS5 + vector) on local
- ✅ Active development (v2.0 recent)

**Cons:**
- Cloud plugin requires external API (privacy consideration similar to Honcho)
- Local plugin is new (v1.0.0) — less battle-tested
- No native n8n integration (OpenClaw plugin is the primary path)
- Smaller project than Mem0/Hindsight

**Verdict:** Strong if you're committed to OpenClaw and want local-first SQLite. Best OpenClaw plugin experience among all options. If n8n is the primary orchestrator rather than OpenClaw, MemOS's value drops significantly.

---

### 10. Redis Agent Memory Server (redis-developer / openclaw-redis-agent-memory)

**Overview:** A Redis-developed long-term memory plugin for OpenClaw using Redis vector search. Docker one-liner setup, MIT license, multi-agent routing via named scopes (shared vs personal memory), auto-recall and auto-capture.

**Deployment:** Fully self-hosted ⭐. Docker standalone image (includes Redis) or connect to existing Redis. Actively maintained by Redis developer relations.

**Multi-Agent Support:** ✅ Excellent. Multi-tenancy with namespace + userId isolation. Multi-agent routing via named scopes: configure `scopes.shared` (team memory) and `scopes.personal` (agent-specific memory). Multiple OpenClaw agents can route to different memory boundaries.

**Storage:** Redis (including Redis Stack for vector search). WAL mode for concurrent reads, thread-safe write queue.

**n8n Integration:** Via OpenClaw plugin (n8n → OpenClaw → Redis). Direct HTTP API available on port 8000.

**SDKs:** OpenClaw plugin (primary), REST API.

**Pricing:** 100% free (MIT license). Only requirement is Redis — which you likely already have or can spin up.

**Pros:**
- ✅ MIT license — no vendor lock-in
- ✅ Docker one-liner — fastest setup of any option
- ✅ Native OpenClaw plugin (official, not community)
- ✅ Multi-agent routing via scopes (shared + personal)
- ✅ Auto-recall + auto-capture lifecycle hooks
- ✅ Redis is already a known infrastructure component
- ✅ Multi-tenancy with namespace isolation
- ✅ Actively maintained by Redis team

**Cons:**
- Redis is the storage engine — no graph/temporal retrieval unless you add RedisGraph
- No native n8n node (goes through OpenClaw)
- Memory extraction relies on OpenAI API key for the agent-memory-server

**Verdict:** The most practical self-hosted choice for your OpenClaw setup. One Docker command, MIT license, multi-agent scoped routing, and maintained by a company with a vested interest in Redis's agent-memory use case.

---

## Bonus: Additional Tools Found

### Engram (Gentleman-Programming/engram)

**Overview:** Agent-agnostic Go binary with SQLite + FTS5, MCP server, HTTP API, CLI, and TUI. MIT licensed.

**Pros:** Zero-dependency Go binary, MCP server built-in, SQLite + FTS5, HTTP API, cross-platform (Windows/macOS/Linux), agent-agnostic (works with Claude Code, OpenCode, Gemini CLI, Codex).

**Cons:** New project, smaller community, no multi-agent shared memory described.

**Verdict:** Watch this one — Go binary with MCP + SQLite is a compelling stack for lightweight self-hosted.

---

## n8n Integration Analysis

### How n8n Typically Integrates with Memory Tools

n8n integrates with external memory systems through three primary mechanisms:

1. **Native Vector Store Nodes:** n8n has built-in nodes for Pinecone, Qdrant, Chroma, Milvus, and in-memory vector stores. If a memory tool supports one of these backends, native integration is possible.

2. **HTTP Request Node:** The universal integration path. All REST API-based memory tools (Mem0, Hindsight, OpenViking, Letta, Redis Agent Memory Server) can be called via the HTTP Request node.

3. **Code Node:** For custom SDK usage (Python/JS), the Code node can import libraries and make direct API calls.

### n8n Compatibility Summary

| Tool | n8n Integration Path | Ease |
|------|---------------------|------|
| Honcho | HTTP Webhook | Medium |
| OpenViking | HTTP Request node | Easy |
| Mem0 | HTTP Request node | Easy |
| Hindsight | HTTP Request node | Easy |
| Holographic | N/A (local SQLite) | Hard |
| RetainDB | HTTP Request node | Easy |
| ByteRover | CLI wrapper needed | Hard |
| Letta | REST API via HTTP | Easy |
| MemOS | OpenClaw plugin | Medium |
| Redis Agent Memory | OpenClaw → n8n or HTTP | Easy |
| Engram | HTTP API | Easy |

### n8n Workflow Pattern for Agent Memory

A typical n8n workflow for agent memory:

```
[Webhook Trigger] 
    → [HTTP Request: Search Memory Tool] 
    → [AI Agent Node (with retrieved context)] 
    → [HTTP Request: Store Interaction to Memory Tool]
```

This pattern works for: Mem0, Hindsight, OpenViking, Letta, Redis Agent Memory Server, Engram.

---

## OpenClaw Plugin Landscape

### Native OpenClaw Plugins for Memory

| Plugin | Tool | Multi-Agent Mode | License |
|--------|------|-----------------|---------|
| `openclaw-redis-agent-memory` | Redis Agent Memory Server | ✅ Named scopes (shared/personal) | MIT |
| `memos-cloud-openclaw-plugin` | MemOS Cloud | ✅ `multiAgentMode: true` | ? |
| Honcho plugin | Honcho | Via peer cards | Apache 2.0 |
| `byterover` skill | ByteRover | Per-project | ? |
| Local MemOS plugin | MemOS Local | ✅ Via user_id | ? |

**Key insight:** If OpenClaw is your agent framework, Redis Agent Memory Server and MemOS have the best native plugin experiences. MemOS local is SQLite-first (100% offline), Redis Agent Memory is Redis-first (production-grade).

---

## Decision Framework

### Step 1: Is OpenClaw your primary agent framework?

**Yes, OpenClaw is primary:**
→ **Use Redis Agent Memory Server** (MIT, Docker one-liner, multi-agent scopes, maintained by Redis)  
→ **Alternative:** MemOS Local (SQLite-based, 100% offline, OpenClaw plugin)

**No, n8n is primary orchestrator:**
→ **Use Mem0 Self-Hosted** (largest ecosystem, Docker Compose, HTTP integration)  
→ **Alternative:** Hindsight (MIT-licensed, multi-strategy, cheaper)

### Step 2: Is multi-agent shared memory critical?

**Yes — shared memory across agents:**
→ **Redis Agent Memory Server** (scopes: shared + personal)  
→ **MemOS** (`multiAgentMode: true`)  
→ **Hindsight** (multi-agent support at all tiers)

**No — per-agent memory sufficient:**
→ Any option works; prioritize retrieval quality (Hindsight) or ecosystem (Mem0)

### Step 3: What's your privacy posture?

**Need complete data isolation:**
→ **Self-hosted only** (Mem0, Hindsight, OpenViking, Letta, Redis Agent Memory, Engram)  
→ **Avoid:** Honcho cloud, MemOS cloud plugin

**Can use cloud with controls:**
→ MemOS cloud (has local alternative)  
→ Honcho (with caveats about data upload)

### Step 4: What's your budget?

**$0 — pure open-source:**
→ Hindsight (MIT, all features), OpenViking (Apache 2.0), Redis Agent Memory (MIT), Letta (Apache 2.0), Engram (MIT)

**Can pay for managed cloud:**
→ Mem0 Cloud, MemOS Cloud, Honcho

---

## Final Recommendation

### Primary Choice: Redis Agent Memory Server

**Rationale:**
1. **Fastest time-to-production:** `docker run` one-liner with standalone image
2. **Genuine multi-agent:** Named scopes (shared + personal) — exactly your requirement
3. **MIT license:** No vendor lock-in, no subscription needed
4. **OpenClaw native plugin:** Official Redis-maintained plugin, not a community fork
5. **Infrastructure alignment:** If you're already using Redis (common in agent stacks), zero new infrastructure
6. **Multi-tenancy:** Namespace + userId isolation means you can have team-shared memory AND personal memory in the same deployment

**The architecture you'd build:**
```bash
# One command
docker run -d --name agent-memory -env-file .env -p 8000:8000 redislabs/agent-memory-server:0.14.0-standalone

# OpenClaw config
openclaw plugins install openclaw-redis-agent-memory
# Then configure scopes in openclaw.json
```

### Secondary Choice: Hindsight (Self-Hosted)

**Rationale:**
- MIT license with all features at all tiers (including self-hosted)
- Multi-strategy retrieval (semantic + BM25 + graph + temporal) — best retrieval quality
- Pro tier at $39/month vs Mem0 Pro at $249/month
- Python + TypeScript + Go SDKs

**Use this if:** You prioritize retrieval quality, open-source completeness, and don't need native OpenClaw integration.

### If n8n is Primary: Mem0 Self-Hosted

**Rationale:**
- Largest ecosystem, most tutorials
- Well-documented REST API integrates trivially with n8n HTTP Request node
- Docker Compose deployment is solid
- Well-funded = long-term viability

**Use this if:** n8n is the main orchestrator and you want maximum community resources.

---

## Appendix: GitHub Star Summary

| Tool | Stars | Last Updated |
|------|-------|-------------|
| Mem0 | ~48K | Active (Apr 2026) |
| Letta | ~21K | Active (Jan 2026) |
| Zep/Graphiti | ~24K | Active |
| Cognee | ~12K | Active |
| Honcho | ~5.3K | Active |
| Hindsight | ~4K | Growing fast |
| MemOS | ? | Very active (v2.0 Dec 2025) |
| OpenViking | ~2K (volcengine) + separate | Active |
| Engram | ? | Very new |
| Redis Agent Memory | ? | Active (Apr 2026) |

---

## Appendix: Memory Architecture Patterns

### Tiered Loading (OS-Inspired)
*Used by: OpenViking, Letta*
Like virtual memory: hot (L0), warm (L1), cold (L2) tiers loaded on demand. Reduces token consumption significantly.

### Multi-Strategy Hybrid Retrieval
*Used by: Hindsight, RetainDB*
Parallel retrieval across semantic + keyword + graph + temporal. Reranker merges results. Best retrieval quality.

### Event Sourcing + Entity Resolution
*Used by: Mem0, Hindsight*
Raw interactions stored as atomic events. Entities resolved across memories ("Alice", "alice@company.com" → same node). Reflection synthesizes across events.

### Vector + Graph (Dual Store)
*Used by: Mem0 (Pro), Zep/Graphiti*
Vector store for semantic similarity. Graph for entity relationships and temporal reasoning.

### SQLite + FTS5 (Lightweight)
*Used by: MemOS Local, Engram, Holographic*
Single-file, zero-dependency. FTS5 for full-text search. Best for local-first or resource-constrained deployments.

---

*Research compiled: April 3, 2026. Tool landscape is rapidly evolving — verify current states before architectural decisions.*
