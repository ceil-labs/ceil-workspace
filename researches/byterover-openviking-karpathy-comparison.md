# ByteRover vs OpenViking vs Karpathy's Memory Approach

**Date:** 2026-04-04  
**Context:** Victor is reconsidering memory systems after learning Hindsight is primarily semantic search with BM25+ requiring specific backends. He wants filesystem-based/hierarchical memory like Karpathy described.

---

## TL;DR — Direct Answers to Key Questions

1. **ByteRover context tree ↔ raw/ → wiki compilation:** ByteRover does NOT auto-compile a wiki from raw sources. It's the inverse — you manually (or via agent) curate knowledge into the context tree, and ByteRover auto-generates hierarchical `_index.md` summaries that propagate upward. No `raw/` → `wiki/` compilation pipeline exists.

2. **OpenViking L0/L1/L2 ↔ Karpathy's index/summary/detail:** YES, this maps almost exactly. L0 = enriched title/brief, L1 = overview/summary (README-level), L2 = full detail. The directory recursive retrieval replaces vector search. This is the closest architectural match to Karpathy's approach.

3. **Code handling:** OpenViking has `ov grep` for exact/regex matching within its virtual filesystem. ByteRover uses "Agentic Search" — the LLM navigates the codebase like a developer (via tools) rather than flat semantic similarity. Neither is a specialized code search engine (no AST-level indexing).

4. **Exact symbol search (function names, imports):** Both rely on regex/`grep` patterns, not AST-aware symbol search. For code-heavy work, you'd still want a dedicated code search layer (like Sourcegraph, or the agent using actual `grep`/`rg` on the codebase itself).

---

## Comparison Matrix

| Feature | ByteRover | OpenViking | Karpathy Approach |
|---|---|---|---|
| **Storage** | Filesystem `.brv/context-tree/` (Markdown) | Virtual filesystem `viking://` (backed by local workspace dir) | Filesystem `raw/` + `wiki/` directories |
| **Hierarchy** | Domain → Topic → Subtopic (3-level) | `viking://resources/`, `viking://user/`, `viking://agent/` roots + arbitrary subdirs | raw/ (source) → compiled wiki/ (LLM-generated summaries, backlinks) |
| **Wiki compilation** | ❌ No raw → wiki pipeline. Context tree IS the curated wiki. Auto-generates `_index.md` summaries on curation. | ❌ No raw → wiki pipeline. Resources go into `viking://resources/`, L0/L1/L2 are auto-generated on ingestion. | ✅ Core feature: LLM incrementally compiles raw sources into a structured wiki with summaries, backlinks, categorization. |
| **Code search** | Agentic Search: LLM navigates codebase via tools (grep, read, ls). NOT a specialized code index. | `ov grep` for regex search, `ov find` for semantic, `ov glob` for file patterns. All within `viking://` workspace. | LLM reads full context directly. No separate code search engine needed at 400K words scale. |
| **Exact symbol search** | Regex/grep via Agentic Search (LLM uses tools). No AST-level indexing. | `ov grep "symbol_name" --uri viking://...` for regex/exact. No AST-level indexing. | Not applicable — LLM reads full files directly. |
| **Auto-compile / self-evolving** | Auto-generates `_index.md` summaries on curation. Auto-organizes into domains/topics. NOT self-evolving from sessions. | ✅ Self-evolving: end-of-session extraction writes preferences to `viking://user/memories/` and lessons to `viking://agent/skills/`. | LLM auto-compiles and maintains the wiki. No session-based memory extraction. |
| **Scale** | Not specifically benchmarked for large corpora. Designed for project-level memory. | Claimed optimized for large scale. LoCoMo10 benchmarks show 80% token reduction vs flat RAG. | 400K words, ~100 articles. No RAG needed at this scale — LLM reads full context. |
| **Multi-agent** | ✅ Cloud sync with push/pull. Per-project sharing. Team workspaces. | ❌ No native multi-agent. Shared workspace via filesystem (same directory). No built-in sync/sharing. | Single user. |
| **Retrieval strategy** | Agentic Search (replaced vector DB): LLM uses tools to navigate codebase, then retrieves from context tree | Directory Recursive Retrieval: Intent analysis → directory positioning → recursive exploration (semantic + grep/glob) | LLM reads entire relevant files directly. No retrieval needed — full context in window. |
| **Observability** | Retrieval trajectory visible via `_manifest.json` and `_index.md` hierarchy | ✅ Full visualized retrieval trajectory — every directory hop logged | Implicit — LLM reports its reasoning. |
| **Integration** | MCP server, CLI, 22+ AI coding agents (Cursor, Claude Code, Windsurf, Cline, etc.) | HTTP API, Python client, LangChain, OpenClaw native (built by ByteDance + compatible with OpenClaw) | Obsidian as IDE frontend |
| **LLM providers** | 18+ providers: Anthropic, OpenAI, Google, Groq, Mistral, xAI, Cerebras, DeepInfra, OpenRouter, Perplexity, TogetherAI, Vercel, **Minimax, Moonshot/Kimi**, GLM, OpenAI-compatible | Volcengine (Doubao), OpenAI, **LiteLLM** (Anthropic, DeepSeek, Gemini, Qwen, vLLM, Ollama, etc.) | Any LLM via API |
| **Backend required** | ByteRover account + daemon (Node.js bundled) | OpenViking server (Python 3.10+, Go 1.22+, C++ compiler) + VLM + Embedding model | None — just files + LLM API calls |
| **Setup complexity** | Low — single `curl` install, interactive REPL on `brv` | Medium — requires Python, Go, C++ build tools, config file, separate server process | Very low — just directories and files |

---

## Architecture Deep Dive

### ByteRover: Context Tree

**Storage:** `.brv/context-tree/` as Markdown files on local filesystem.

**Hierarchy:**
```
.brv/context-tree/
├── _manifest.json          # token-budgeted registry
├── _index.md              # auto-generated root summary
├── authentication/
│   ├── _index.md         # auto-generated domain summary
│   ├── context.md         # domain overview (auto-generated)
│   ├── jwt-implementation/
│   │   ├── _index.md
│   │   ├── context.md
│   │   └── jwt_token_generation.md
```

**How it works:**
1. You run `brv curate "JWT uses RS256, 24h expiry"` — ByteRover auto-organizes into the right domain/topic
2. On each curate, `_index.md` summaries are regenerated at every level of the tree
3. `_manifest.json` tracks all files for token-budgeted retrieval
4. Query: Agentic Search — LLM navigates the codebase using built-in tools, retrieves exact context pieces from context tree

**Key insight:** ByteRover is a **curated knowledge organizer**, not a wiki compiler. You feed it knowledge snippets; it organizes them hierarchically and auto-summarizes. There's no concept of raw source documents being compiled into a wiki.

**Retrieval:** Replaced vector DB with "Agentic Search" — the LLM acts as an agent that uses grep, read, ls tools to navigate the codebase, then queries the context tree for relevant memory. Sharp, precise, less noise than flat similarity search.

**Multi-agent:** Cloud sync (push/pull). Teams share via ByteRover cloud. Per-project workspaces.

---

### OpenViking: Virtual Filesystem + Tiered Loading

**Storage:** Virtual `viking://` filesystem backed by local workspace directory (`~/.openviking/workspace`).

**Hierarchy:**
```
viking://resources/   → raw data: PDFs, codebases, images, specs
viking://user/       → user preferences, interaction history, personal context
viking://agent/      → agent's own skills and operational experience
```

**How it works:**
1. `ov add-resource https://github.com/org/repo` — OpenViking fetches, processes, stores
2. On ingestion, auto-generates L0/L1/L2 tiers for every piece of content
3. L0: one-sentence summary (<100 tokens)
4. L1: structured overview with essential info (<2,000 tokens)
5. L2: full content, loaded on demand via URI
6. Directory Recursive Retrieval: find right directory via semantic search → recursive exploration with grep/glob

**Key insight:** OpenViking is a **tiered context database** with a filesystem paradigm. It auto-tiers content on ingestion and supports recursive directory traversal for retrieval. Self-evolving: session-end extraction writes back to `viking://user/` and `viking://agent/`.

**Retrieval:** Directory Recursive Retrieval — three steps:
1. Intent analysis (what are you looking for?)
2. Initial positioning (vector search finds the right directory, not the right fragment)
3. Recursive exploration (navigate directory tree, combining semantic search + grep/glob)

**Multi-agent:** No native multi-agent support. Shared workspace = same filesystem directory. No built-in sync or team sharing.

---

### Karpathy: raw/ + compiled wiki

**Storage:** Plain filesystem directories.

**Hierarchy:**
```
raw/                    → original source documents (articles, papers, code, notes)
wiki/                   → LLM-compiled output: summaries, visualizations, backlinks
  ├── authentication/
  │   ├── overview.md   # LLM-generated summary
  │   ├── jwt.md
  │   └── backlinks.json
```

**How it works:**
1. Drop raw sources into `raw/`
2. LLM (via Obsidian or direct API) "compiles" the raw material into structured wiki entries
3. Wiki entries contain summaries, cross-links, categorization
4. Obsidian serves as the IDE — you navigate and query the wiki
5. LLM auto-maintains and updates the wiki over time

**Key insight:** This is the most manual approach but the most transparent. No automatic tiering or curation — the LLM IS the compilation engine. At 400K words scale, you just put everything in context; no retrieval needed.

---

## Code Search Capabilities

### ByteRover
- **Approach:** Agentic Search — the LLM acts as a coding agent using tools (grep, read, ls, glob) to find code
- **Exact symbol search:** Via regex/grep patterns. The LLM can be directed to find specific function names, imports, etc.
- **Specialized code indexing:** ❌ No AST-level or symbol-index-based search (no tree-sitter, LSP-style indexing)
- **Strength:** The LLM can reason about code structure and navigate accordingly
- **Weakness:** Not a fast index — latency scales with codebase size for large codebases

### OpenViking
- **Approach:** `ov grep` for regex/exact, `ov find` for semantic, `ov glob` for file enumeration
- **Exact symbol search:** `ov grep "verify_token" --uri viking://resources/project/` works for exact/regex patterns
- **Specialized code indexing:** ❌ No AST-level indexing
- **Strength:** Combines semantic AND keyword/regex search in a tiered way; retrieval trajectory is observable
- **Weakness:** Still regex-based, not symbol-aware (can't distinguish definition vs reference)

### Karpathy Approach
- **Approach:** LLM reads the full relevant files directly
- **Exact symbol search:** Not needed at his scale — LLM just reads the file containing the symbol
- **Strength:** No retrieval degradation — the LLM sees the actual code
- **Weakness:** Doesn't scale beyond ~400K-500K words in context window without additional strategies

**For code-heavy workflows:** All three are essentially LLM-mediated. None offer Sourcegraph-level code search (AST indexing, symbol cross-references, cross-repo navigation). ByteRover's Agentic Search is the most developer-navigator-like, but at the cost of more LLM tool-calling steps.

---

## Setup Complexity for VPS

### ByteRover
```
curl -fsSL https://byterover.dev/install.sh | sh
# OR
npm install -g byterover-cli
brv                    # interactive REPL, auto-configures on first run
```
- **Requirements:** Node.js >= 20 (bundled binary available)
- **Daemon:** Runs as a background daemon
- **Account:** Requires ByteRover account for cloud sync features
- **VPS-friendly:** ✅ Yes — simple binary install, no complex build chain
- **Privacy:** Data stays local; cloud sync is opt-in

### OpenViking
```
pip install openviking
# OR
cargo install --git https://github.com/volcengine/OpenViking ov_cli

# Server
openviking-server

# CLI client
ov status
ov add-resource ...
```
- **Requirements:** Python 3.10+, Go 1.22+, C++ compiler (GCC 9+ or Clang 11+)
- **Daemon:** Separate server process (`openviking-server`)
- **Config:** Manual `~/.openviking/ov.conf` file with API keys for VLM + embedding models
- **VPS-friendly:** ⚠️ More complex — needs build toolchain + model API access
- **Privacy:** All data local in workspace dir

### Karpathy Approach
```
# Just directories and files. No install.
mkdir -p raw wiki
# Use Obsidian or any LLM API client
```
- **Requirements:** None beyond file system + LLM API access
- **VPS-friendly:** ✅ Simplest possible — just files and API calls
- **Privacy:** Everything local

---

## Where Each Falls Short for Victor's Use Case

### ByteRover weaknesses for Victor:
1. **No raw → wiki pipeline** — ByteRover is a curated memory organizer, not a wiki compiler. Victor wants to ingest raw sources and get back a structured wiki with summaries.
2. **Agentic Search is LLM-mediated** — requires the LLM to use tools to search code, which adds latency and token cost. Not a fast index.
3. **Cloud dependency for team features** — push/pull sync requires ByteRover account/cloud.
4. **No self-evolving memory** — doesn't extract lessons from sessions automatically.

### OpenViking weaknesses for Victor:
1. **No raw → wiki pipeline** — similar to ByteRover, it ingests resources and auto-tiers them, but doesn't compile raw sources into a structured wiki with summaries and backlinks.
2. **Build complexity** — Go 1.22+ and C++ compiler required on VPS. Not a simple install.
3. **No multi-agent sharing** — no built-in sync mechanism. Shared workspace = manual file sharing.
4. **Still relies on embedding models** — needs both VLM and embedding provider configured. Not just filesystem + LLM.

### Karpathy approach weaknesses:
1. **No auto-tiering** — you manage the compilation process yourself. More manual work.
2. **Scales to ~400K-500K words** before needing additional strategies (pagination, selective loading).
3. **Single-user** — no built-in multi-agent or team sharing.
4. **No observable retrieval** — you can't easily debug why the LLM retrieved or missed something.

---

## Recommendation for Victor

**Victor needs:** Code-heavy, hierarchical memory, filesystem-based, no RAG at small scale, preferably no vector DB dependency.

### Best Fit: **OpenViking** (with caveats)

OpenViking is the closest architectural match to Karpathy's filesystem paradigm because:
- **Tiered loading (L0/L1/L2)** maps directly to Karpathy's "overview → summary → detail" hierarchy
- **Directory Recursive Retrieval** replaces vector search — no embedding DB required
- **Virtual filesystem paradigm** is the right mental model (Karpathy-style)
- **Self-evolving** — learns from sessions, which ByteRover doesn't do
- **ByteDance backing** — active development, legitimate engineering team
- **Native OpenClaw support** — already integrated into the workflow

**Caveats to address:**
1. Install complexity (Go + C++ build tools) — but manageable on VPS
2. Still needs embedding model — but LiteLLM support means can use any OpenAI-compatible endpoint (including local Ollama/vLLM)
3. No multi-agent sync built-in — would need manual workspace sharing

### Alternative: **Karpathy-style DIY** (simplest, most aligned)

Given Victor's specific need for "filesystem-based/hierarchical memory like Karpathy described," the most direct implementation would be:

1. **`raw/` directory** — store original source documents (articles, code snippets, notes)
2. **`wiki/` directory** — LLM-compiled summaries, organized by topic/domain
3. **LLM auto-compiles** on demand or on schedule
4. **Obsidian** as frontend (or just VS Code + Markdown)
5. **Agent reads full context** from wiki — no retrieval at small scale

This is what Karpathy actually does. It's the simplest, most transparent, and most aligned with the stated goal. It requires zero additional tooling beyond file system + LLM API access.

### If ByteRover is chosen instead:

The only compelling reason would be **Agentic Search** for navigating large codebases where the LLM-as-developer approach gives better results than flat vector search. But this comes at the cost of no wiki compilation workflow and no self-evolving memory.

---

## Summary Table

| Criterion | ByteRover | OpenViking | DIY Karpathy |
|---|---|---|---|
| Filesystem paradigm | ✅ | ✅ | ✅ |
| Hierarchical organization | ✅ Domain/Topic/Subtopic | ✅ viking:// roots + subdirs | ✅ Manual directory structure |
| Tiered loading (L0/L1/L2) | ❌ (uses Agentic Search instead) | ✅ Core feature | ❌ (LLM reads full context) |
| No vector DB / RAG at small scale | ⚠️ Agentic Search still LLM-mediated | ✅ Directory Recursive Retrieval replaces vector search | ✅ Full context in window |
| Wiki auto-compilation from raw | ❌ | ❌ | ✅ |
| Self-evolving memory | ❌ | ✅ | ❌ |
| Code search (symbol-level) | ⚠️ LLM tool use | ⚠️ ov grep regex | ⚠️ LLM reads files directly |
| Multi-agent / team sharing | ✅ Cloud sync push/pull | ❌ Manual file sharing | ❌ |
| VPS setup complexity | Low (binary) | Medium (Go + C++ toolchain) | Very low (files only) |
| Open-source | ✅ (Elastic License 2.0) | ✅ (Apache 2.0?) | N/A |
| Active development | ✅ | ✅ (ByteDance/Volcengine) | N/A |
