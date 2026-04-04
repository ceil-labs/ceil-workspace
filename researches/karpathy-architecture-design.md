# DIY Karpathy Memory Architecture — Design Document

> **Status:** Design v1.0  
> **Author:** Ceil (subagent)  
> **Date:** 2026-04-04  
> **Purpose:** Comprehensive architectural specification for implementing a DIY Karpathy-style memory system for an AI agent. This document is design-only; implementation follows separately.

---

## Table of Contents

1. [What Is the Karpathy Approach](#1-what-is-the-karpathy-approach)
2. [System Overview & Directory Structure](#2-system-overview--directory-structure)
3. [Knowledge Base vs. Session Memory](#3-knowledge-base-vs-session-memory)
4. [The Four Routines](#4-the-four-routines)
5. [Session vs. LLM Context: A Critical Distinction](#5-session-vs-llm-context-a-critical-distinction)
6. [Cache Layer for Token Optimization](#6-cache-layer-for-token-optimization)
7. [Backlinks and Linking Strategy](#7-backlinks-and-linking-strategy)
8. [Data Flow Diagrams](#8-data-flow-diagrams)
9. [Cache Decision Trees](#9-cache-decision-trees)
10. [Pure Karpathy vs. Pragmatic Cache Comparison](#10-pure-karpathy-vs-pragmatic-cache-comparison)
11. [Example Workflows](#11-example-workflows)
12. [Design Principles & Trade-offs](#12-design-principles--trade-offs)
13. [Glossary](#13-glossary)

---

## 1. What Is the Karpathy Approach

### 1.1 Origin

The approach originates from **Andrej Karpathy's** public tweet thread on building LLM-based Knowledge Bases. The core observation: modern LLMs with context windows of 200K–1M tokens can read enormous amounts of text in a single inference call.

### 1.2 Core Insight

> **At approximately 400,000 words (≈ 500K tokens), an LLM can read its entire knowledge base directly — no retrieval system, no vector database, no RAG pipeline needed.**

Traditional memory systems treat memory as a **database to query**: chunk documents, embed them, run similarity search, retrieve top-K chunks. This introduces latency, loses cross-document relationships, and adds operational complexity.

The Karpathy approach treats memory as a **wiki the LLM maintains**. The LLM reads the entire wiki in context, understands relationships, and produces coherent responses.

### 1.3 Philosophy

| Traditional RAG | Karpathy Approach |
|----------------|-------------------|
| Memory = database to query | Memory = wiki to read |
| Retrieval before reasoning | Reasoning across entire corpus |
| Chunked, loses context | Full documents, preserved relationships |
| Complexity: embeddings + vector DB | Complexity: file management + wiki structure |
| Scales with retrieval quality | Scales with context window |

### 1.4 Key Principles

1. **Raw sources are sacred.** Original documents are never modified.
2. **Wiki is compiled knowledge.** The LLM extracts, synthesizes, and organizes information from raw sources into readable articles.
3. **Full-context reading.** At query time, the LLM reads the relevant wiki sections — not retrieved chunks.
4. **LLM maintains the wiki.** Compilation, linting, and organization are themselves LLM-driven routines.

---

## 2. System Overview & Directory Structure

```
memory/
├── raw/                        # 📦 Source of truth — untouched originals
│   ├── papers/                 #   Research papers, PDFs
│   ├── codebases/              #   Code files, repos
│   ├── images/                 #   Image files with notes
│   └── bookmarks/              #   Saved URLs, web clips
│
├── wiki/                       # 🧠 LLM-compiled knowledge base
│   ├── _index.md              #   Master navigation + site map
│   ├── _backlinks.json        #   Bidirectional link index
│   ├── concepts/              #   Cross-cutting core ideas
│   │   ├── multi-agent-architecture.md
│   │   ├── memory-systems.md
│   │   └── ...
│   ├── projects/              #   Per-project knowledge
│   │   ├── ceil-workspace.md
│   │   ├── openclaw-setup.md
│   │   └── ...
│   └── people/                #   User preferences, profiles
│       ├── victor-preferences.md
│       └── team-members.md
│
├── sessions/                   # 💬 Ephemeral conversation memory
│   ├── 2026-04-04.md          #   Today's raw conversation log
│   ├── 2026-04-03.md          #   Yesterday's log
│   └── ...
│
└── cache/                      # ⚡ Token optimization layer
    ├── summaries/             #   L1: Per-article compressed summaries
    │   ├── concepts/*.summary.md
    │   └── projects/*.summary.md
    └── embeddings/            #   L2: Article embeddings (optional)
        └── articles.json      #   Local embedding vectors
```

---

## 3. Knowledge Base vs. Session Memory

These are two fundamentally different types of memory with different purposes, lifecycles, and update patterns.

### 3.1 Knowledge Base (`wiki/`)

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Persistent, curated, cross-session memory |
| **Content** | Concepts, project docs, user preferences, facts |
| **Source** | LLM-compiled from raw sources + session rollups |
| **Update trigger** | Compilation routine, session rollup, manual edit |
| **Lifecycle** | Long-term; evolves slowly; versioned conceptually |
| **LLM role** | Active maintainer (compiles, lints, organizes) |
| **Example** | `concepts/multi-agent-architecture.md` |

### 3.2 Session Memory (`sessions/`)

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Ephemeral, conversational, per-session working memory |
| **Content** | Today's chat, working notes, scratchpad, decisions |
| **Source** | Real-time append during active conversation |
| **Update trigger** | Every user/agent message exchange |
| **Lifecycle** | Short-term; typically rolled up after 7 days |
| **LLM role** | Passive recorder (append-only log) |
| **Example** | `sessions/2026-04-04.md` |

### 3.3 The Relationship

```
┌─────────────────────────────────────────────────────────────┐
│                        WIKI (Long-Term)                      │
│  • Compiled knowledge from raw sources                       │
│  • Rolled-up session learnings                              │
│  • User preferences & facts                                 │
│  • Cross-session continuity                                  │
└────────────────────────────▲────────────────────────────────┘
                             │  Session Rollup Routine
                             │  (extracts decisions, preferences,
                             │   knowledge gained from sessions)
┌────────────────────────────┴────────────────────────────────┐
│                      SESSIONS (Short-Term)                   │
│  • Raw conversation logs                                    │
│  • Working notes & scratchpad                               │
│  • Per-session context                                      │
│  • Can reference wiki via [[backlinks]]                     │
└─────────────────────────────────────────────────────────────┘
                             ▲
                             │
                    Real-time append
                    during conversation
```

**Cross-referencing:**
- Session → Wiki: `"Based on today's discussion, see [[multi-agent-architecture]]"`
- Wiki → Session: `"Preference noted in [[session:2026-04-04]]"` (provenance link)

---

## 4. The Four Routines

The entire system is driven by four LLM-executed routines. Each is a semi-autonomous process triggered by specific events.

### 4.1 Compilation Routine

**Purpose:** Transform new raw sources into wiki articles.

```
Trigger:  New files in raw/  OR  scheduled (daily/weekly)
Input:    raw/ directory (new/modified files only)
Output:   New or updated articles in wiki/
```

**Process:**

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Read raw    │───▶│  Extract     │───▶│  Update or   │───▶│  Generate    │
│  documents   │    │  concepts,   │    │  create wiki │    │  backlinks   │
│              │    │  facts,      │    │  articles    │    │  to related  │
│              │    │  relations   │    │              │    │  articles    │
└──────────────┘    └──────────────┘    └──────────────┘    └──────┬───────┘
                                                                    │
                                                                    ▼
                                                           ┌──────────────┐
                                                           │  Update      │
                                                           │  _index.md   │
                                                           │  navigation  │
                                                           └──────────────┘
```

**Detailed steps:**
1. **Scan** `raw/` for new or modified files since last run
2. **Read** each new file in full (LLM processes the content)
3. **Extract:** Key concepts, facts, entities, relationships, implications
4. **Match:** Does a related wiki article already exist? If yes, update it. If no, create new article.
5. **Link:** Generate `[[backlinks]]` to related existing articles
6. **Navigate:** Update `_index.md` to reflect new articles
7. **Log:** Record what was compiled and from which source

### 4.2 Linting Routine

**Purpose:** Keep the wiki healthy — find broken links, contradictions, orphaned articles.

```
Trigger:  Scheduled (weekly)  OR  manual invocation
Input:    wiki/ directory (full scan)
Output:   Lint report with suggested fixes
```

**Process:**

1. **Link check:** Verify all `[[backlinks]]` resolve to existing articles
2. **Fact consistency:** Cross-check facts mentioned across multiple articles
3. **Orphan detection:** Find articles with no incoming links (never referenced)
4. **Staleness check:** Flag articles not updated in > 30 days
5. **Output:** Structured lint report with severity (error/warning/suggestion)

**Example lint report:**

```markdown
## Lint Report — 2026-04-04

### 🔴 Errors (must fix)
- [[openclaw-setup]] links to non-existent article [[gateway-config]]

### 🟡 Warnings
- [[victor-preferences]] is orphaned (no incoming links)
- [[multi-agent-architecture]] hasn't been updated in 45 days

### 💡 Suggestions
- [[memory-systems]] and [[karpathy-approach]] may be mergeable (high overlap)
- Consider adding cross-link between [[agent-ceil]] and [[agent-neo]]
```

### 4.3 Organization Routine

**Purpose:** Reorganize the wiki as it grows — maintain navigability.

```
Trigger:  Article count exceeds threshold (e.g., 50 articles)
Input:    wiki/ structure + _index.md
Output:   Proposed restructuring, updated _index.md
```

**Process:**
1. **Analyze** article relationships (from backlink graph)
2. **Identify** categories that have grown too large or overlapping
3. **Propose** new category structure, article splits, merges
4. **Execute** _index.md updates and file moves
5. **Update** all affected backlinks

### 4.4 Session Rollup Routine

**Purpose:** Extract valuable information from old sessions and integrate into the wiki.

```
Trigger:  Session older than N days (default: 7 days)
Input:    sessions/YYYY-MM-DD.md
Output:   Updated wiki articles + provenance links
```

**Process:**

```
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│  Read session    │───▶│  Extract:        │───▶│  Update relevant │
│  log             │    │  • Decisions     │    │  wiki articles   │
│                  │    │  • Preferences   │    │  with new info   │
│                  │    │  • Knowledge     │    │                  │
│                  │    │    gained        │    │                  │
│                  │    │  • Open todos    │    │                  │
└──────────────────┘    └──────────────────┘    └────────┬─────────┘
                                                          │
                                                          ▼
                                               ┌──────────────────┐
                                               │  Add provenance  │
                                               │  backlink to     │
                                               │  session file    │
                                               │  e.g., "Updated  │
                                               │  by session:     │
                                               │  [[2026-03-28]]" │
                                               └──────────────────┘
```

**Rollup categories:**

| Category | What gets extracted |
|----------|-------------------|
| **Decisions** | "We decided to use X instead of Y because..." |
| **Preferences** | "Victor prefers A over B" |
| **Knowledge** | "New understanding of Z gained from this session" |
| **Todos** | "Open items identified but not completed" |
| **Lessons** | "Lesson learned: next time, do X first" |

---

## 5. Session vs. LLM Context: A Critical Distinction

This is the most important conceptual distinction in the entire architecture.

### 5.1 Definitions

**Session Memory (storage):**
- A **file** (`sessions/YYYY-MM-DD.md`) that persists across time
- Contains: full conversation history, user inputs, agent responses, working notes
- **Persists** beyond a single LLM API call
- **Accumulates** throughout the day

**LLM Context (usage):**
- The **actual text payload** sent to the LLM API in a single request
- Contains: system prompt + selected session history + relevant wiki articles
- **Ephemeral** — exists only during one API call
- **Bounded** by token window (128K, 200K, 1M tokens)

### 5.2 Why This Matters

```
┌─────────────────────────────────────────────────────────────────┐
│                     SESSION FILE (persistent)                     │
│   sessions/2026-04-04.md — lives on disk, grows all day         │
│   May contain 50,000 tokens by end of day                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ pulled into LLM context
                              ▼ per-request
┌─────────────────────────────────────────────────────────────────┐
│                     LLM CONTEXT (ephemeral)                      │
│   System prompt + last 20 messages + relevant wiki articles      │
│   ~30,000 tokens sent in THIS specific request                  │
│   Different content than what went into yesterday's requests    │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 Context Construction at Query Time

```
User asks question
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│  CONTEXT CONSTRUCTION (per-request)                            │
│                                                              │
│  1. System prompt (fixed)                                    │
│  2. Session history — last N messages from today             │
│     (NOT the entire session file, just what's relevant)      │
│  3. Wiki articles — fetched via cache lookup or full read   │
│     (based on query topic)                                   │
│                                                              │
│  Total must fit within token window                          │
└──────────────────────────────────────────────────────────────┘
        │
        ▼
   LLM generates response
        │
        ▼
┌──────────────────────────────────────────────────────────────┐
│  SESSION APPEND (post-response)                               │
│  sessions/2026-04-04.md += [user question, agent response]   │
└──────────────────────────────────────────────────────────────┘
        │
        ▼
   (Optionally trigger session rollup if conditions met)
```

### 5.4 The Key Insight

> **Session is storage. Context is usage. They are different things.**

- The session file **persists** and grows
- LLM context is **constructed fresh** each request from session + wiki
- The session file is NOT sent wholesale to the LLM — only relevant excerpts are selected

---

## 6. Cache Layer for Token Optimization

### 6.1 Two Types of Caching (Critical Distinction)

**Type 1: LLM Provider Prompt Caching** (Automatic)
- Provided by OpenCode-Go, Anthropic, OpenAI
- Caches static prompt prefixes across requests
- **No implementation needed** — just structure prompts correctly

**Type 2: Local Wiki Navigation** (Our Implementation)
- Book-like index navigation: Table of Contents → Chapters
- No embeddings, no vector search
- Uses `_index.md` for finding relevant articles

### 6.2 The Cache Strategy

Three-tier approach, each at different layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHE TIER OVERVIEW                       │
├─────────┬──────────────────┬────────────────────────────────┤
│  Tier   │  Name            │  Provider vs Local             │
├─────────┼──────────────────┼────────────────────────────────┤
│  L1     │  Prompt Caching  │  Provider-side (automatic)    │
│  L2     │  Index Navigation│  Local (wiki/_index.md)       │
│  L3     │  Session Compression│  Local (on-demand)         │
└─────────┴──────────────────┴────────────────────────────────┘
```

**NO EMBEDDINGS** — We use book-style index navigation instead.

### 6.3 L1 Cache: LLM Provider Prompt Caching (Automatic)

**What:** Provider-side caching of prompt prefixes (OpenCode-Go, Anthropic, OpenAI all support this).

**How it works:**

```
Request 1:  [System Prompt][Wiki Article A][Wiki Article B][User Query 1]
            ↑______________________________↑
                     Cached by provider
                             
Request 2:  [System Prompt][Wiki Article A][Wiki Article B][User Query 2]
            ↑______________________________↑ (cached, not re-billed)
                                          ↑ (only these tokens billed)
```

**How to leverage it:**
1. Put **static content first** in prompts (system prompt, wiki index, relevant articles)
2. Put **dynamic content last** (user query, recent session turns)
3. Provider automatically caches the prefix

**Benefit:** Repeated queries about same topic only pay for new user input, not the full wiki context.

**Example prompt structure:**
```
[System Prompt - static]          ← Cached
[Wiki _index.md - static]         ← Cached
[Wiki: agent-architecture]        ← Cached (if same topic)
[Recent 4 session turns]          ← Dynamic, small
[User: Current query]             ← Dynamic, billed
```

### 6.4 L2 Cache: Index Navigation (Book-Style)

**What:** Book-style table of contents navigation using `wiki/_index.md` and `_backlinks.json`.

**Where:** `wiki/_index.md` and `wiki/_backlinks.json`

**How it works (like a book):**

```
Query arrives
     │
     ▼
┌─────────────────────────────────────┐
│  Read wiki/_index.md               │  ← Table of Contents
│  (list of all articles)             │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  LLM decides which articles are    │
│  relevant based on titles/summaries │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Read selected full articles       │  ← Chapters
└─────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Check _backlinks.json for          │  ← Index: "See also..."
│  cross-references                   │
└─────────────────────────────────────┘

**Book analogy:**
- `_index.md` = **Table of Contents** → find the chapter
- `wiki/*.md` = **Chapters** → read full content (no chunks!)
- `_backlinks.json` = **Index** → "see also" cross-references
- `_summaries.md` (optional) = **Chapter summaries** → quick preview

**NO EMBEDDINGS** — Pure text navigation, just like flipping through a book.

**When to enable:** Always use this approach. It's the pure Karpathy method — no embeddings, just structured text navigation.

### 6.5 L3 Cache: Conversation Context Compression

**What:** Compressed versions of old session history for long conversations.

**Where:** `cache/summaries/sessions/` (or embedded in session file as frontmatter)

**How it works:**

```
Session history grows beyond threshold
(e.g., > 20 messages in a single session)
         │
         ▼
┌─────────────────────────────────────┐
│  Use cheap model to compress        │
│  first N messages into a summary:  │
│                                     │
│  "User asked about X. We decided Y. │
│   Victor prefers A over B..."       │
└─────────────────┬───────────────────┘
                  │
                  ▼
     Later queries see:
     ┌─────────────────────────────────────┐
     │  [Compressed summary of messages    │
     │   1-50] + [Messages 51-70 uncomp.]  │
     └─────────────────────────────────────┘
```

**Trigger:** On-demand when context window is pressured. Not automatic — only compress when needed.

---

## 7. Backlinks and Linking Strategy

### 7.1 Wiki Link Format

```markdown
# Standard link
See [[multi-agent-architecture]] for details.

# Link with display text
The agent design follows [[agent-architecture|Rimuru-style]] principles.
```

### 7.2 Backlink Index

Stored in `wiki/_backlinks.json`:

```json
{
  "multi-agent-architecture": [
    "agent-architecture",
    "ceil-workspace",
    "research-delegate-skill"
  ],
  "victor-preferences": [
    "user-profile",
    "session-rollup-2026-03-28"
  ]
}
```

**How it's built:**
- Compilation routine generates links as articles are created/updated
- Linting routine detects broken links and adds to lint report
- Periodically regenerated by scanning all articles

### 7.3 Session-to-Wiki Linking

Sessions can reference wiki articles using the same `[[]]` syntax:

```markdown
User: Let's discuss the agent architecture
Agent: I've reviewed [[multi-agent-architecture]] and found...

User: Remember our decision about [[victor-preferences]]
```

### 7.4 Wiki-to-Session Provenance Links

When session rollup updates a wiki article, the wiki article records the source:

```markdown
# victor-preferences.md

## Communication Preferences

Victor prefers scheduled check-ins over ad-hoc messages.
*Last updated from session rollup: [[session:2026-03-28]]*
```

---

## 8. Data Flow Diagrams

### 8.1 Full System Data Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                           EXTERNAL SOURCES                            │
│   Papers, Code, Bookmarks, URLs, Images                               │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ raw files added
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                          RAW LAYER (raw/)                             │
│   Untouched source documents — the single source of truth            │
└──────────────────────────────┬───────────────────────────────────────┘
                               │ Compilation Routine
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                      WIKI LAYER (wiki/)                              │
│   LLM-compiled articles with backlinks                               │
│   ┌─────────────┐ ┌─────────────┐ ┌─────────────┐                   │
│   │ concepts/   │ │ projects/   │ │ people/     │                   │
│   └─────────────┘ └─────────────┘ └─────────────┘                   │
│                           │                                           │
│                           │ Session Rollup Routine                   │
│                           ▼                                           │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │                   SESSION LAYER (sessions/)                   │  │
│   │   Daily conversation logs (2026-04-04.md, etc.)                │  │
│   └──────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               │ Query time: context construction
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       LLM CONTEXT (per-request)                        │
│   System prompt + session excerpts + wiki articles                    │
│   Optimized via cache layers (L1 → L2 → L3)                          │
└──────────────────────────────────────────────────────────────────────┘
```

### 8.2 Query-Time Context Construction

```
┌─────────────────────────────────────────────────────────────┐
│                    USER QUERY                                 │
│   "What is our current agent architecture?"                  │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Cache Check (L2 Embeddings — if enabled)           │
│  Query embedding → cosine similarity → top-K articles        │
│  If L2 disabled: skip to Step 2                              │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: L1 Summary Scan (always runs)                       │
│  Load all article summaries (~500 tokens)                    │
│  LLM reads summaries → selects relevant articles             │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Full Article Load                                  │
│  Load only the selected full articles                       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 4: Session History Load                               │
│  Load recent messages from today's session file             │
│  Apply L3 compression if session history > 20 messages      │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 5: Assemble LLM Context                                │
│  [System Prompt] + [Selected Wiki Articles] +               │
│  [Session History] + [User Query]                           │
│  (Total must fit within token window)                       │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  LLM GENERATES RESPONSE                                     │
└─────────────────────────────┬───────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  SESSION APPEND                                             │
│  sessions/2026-04-04.md += [user, agent, timestamp]         │
│                                                              │
│  (Later: Session Rollup triggers on age threshold)          │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Cache Decision Trees

### 9.1 Which Cache Tier to Use?

```
Is wiki > 50 articles?
    │
    ├── NO ──→ Use L1 only (summaries)
    │          Skip L2 (embeddings not worth setup cost)
    │
    └── YES ─→ Enable L2 (embeddings)
               Is session > 20 messages?
                   │
                   ├── YES ──→ Enable L3 (session compression)
                   │
                   └── NO ─── Skip L3
```

### 9.2 Context Construction Decision Tree

```
Query arrives
    │
    ├── L2 enabled?
    │   │
    │   ├── YES ──→ Generate query embedding → similarity search
    │   │           → top-K articles (e.g., K=5)
    │   │
    │   └── NO ───→ Skip L2
    │
    ▼
Load L1 summaries for ALL articles
    │
    ▼
LLM evaluates summaries → selects M articles (M ≤ K)
    │
    ▼
Load FULL content for selected M articles
    │
    ▼
Load session history
    │
    ├── Session > 20 messages?
    │   │
    │   ├── YES ──→ Apply L3 compression to older messages
    │   │
    │   └── NO ───→ Load as-is
    │
    ▼
Total tokens within window?
    │
    ├── YES ──→ Send to LLM
    │
    └── NO ───→ Reduce: fewer articles, more compression
               (Iterate until fit)
```

---

## 10. Pure Karpathy vs. Pragmatic Cache Comparison

### 10.1 Philosophy Comparison

| Dimension | Pure Karpathy | Pragmatic (with Caches) |
|-----------|--------------|------------------------|
| **Context at query** | Full wiki (all articles) | Only relevant articles |
| **Token cost** | Highest (full wiki always) | Optimized (only what's needed) |
| **Complexity** | Low (no caching logic) | Medium (cache management) |
| **Latency** | Higher (more tokens) | Lower (less tokens) |
| **Consistency** | Perfect (always sees everything) | Slight risk of missing context |
| **Scalability** | Limited by context window | Scales with cache layers |
| **Implementation** | Simple file reading | Cache generation + invalidation |

### 10.2 When to Use Each

**Use Pure Karpathy when:**
- Wiki is small (< 20 articles, < 100K tokens total)
- Context window is very large (1M tokens)
- Cost is not a primary concern
- Simplicity is valued over optimization

**Use Pragmatic Cache when:**
- Wiki is medium-to-large (20+ articles)
- Context window is limited (128K-200K)
- Cost optimization matters
- Need to scale without hitting window limits

### 10.3 Recommendation for This Implementation

> **Start with L1 (summaries) always.** It adds minimal complexity and meaningful token savings. Add L2 (embeddings) when the wiki grows beyond 50 articles. Add L3 (session compression) only when session history consistently pressures the context window.

The philosophy aligns with Karpathy's insight — the LLM still reads a curated set of articles in full. The cache layers just help it read the *right* articles, not all articles.

---

## 11. Example Workflows

### 11.1 User Query Workflow

**Scenario:** Victor asks about the multi-agent architecture during a Telegram chat.

```
Time: 2026-04-04, 14:30 (Victor is in Telegram chat with Ceil)

Victor: "Hey, what does our current agent architecture look like?"
        │
        ▼
[Ceil's context construction:]
  1. Load system prompt (fixed, ~2K tokens)
  2. Check L2: wiki has 25 articles → L2 not yet enabled (threshold: 50)
  3. Load L1 summaries: 25 articles × ~100 tokens = ~2.5K tokens
  4. LLM (internal): reads summaries → selects "multi-agent-architecture", "agent-architecture", "ceil-workspace"
  5. Load full articles: ~5K tokens
  6. Load session history (today, 8 messages so far): ~2K tokens
  7. Assemble context: ~13.5K tokens total
        │
        ▼
[Ceil generates response:]
  "Our multi-agent setup has Ceil as the primary agent handling
   Telegram, Discord, and research tasks. See [[agent-architecture]]
   for the full breakdown..."
        │
        ▼
[Session append:]
  sessions/2026-04-04.md += (14:30) Victor: "what does our current..."
                                Ceil: "Our multi-agent setup..."
        │
        ▼
[End of workflow]
```

### 11.2 Compilation Routine Workflow

**Scenario:** Victor saves a new paper PDF to `raw/papers/llama-architecture.pdf`.

```
Trigger: New file detected in raw/papers/

Ceil runs Compilation Routine:
  1. Read raw/papers/llama-architecture.pdf (full text via pdf tool)
  2. Extract:
     - Key concept: Transformer scaling laws
     - Key concept: Context length importance
     - Related to: existing article [[transformer-models]]
  3. Decision: Update existing [[transformer-models]] article
     with new insights from this paper
  4. Generate backlinks: [[transformer-models]] → links to this paper
  5. Update _index.md to include paper in papers section
  6. Log: "Compiled llama-architecture.pdf into transformer-models"
        │
        ▼
[Optional: Trigger L1 summary regeneration for updated article]
```

### 11.3 Session Rollup Workflow

**Scenario:** End of week — `sessions/2026-03-28.md` is now 7 days old.

```
Trigger: Session Rollup Routine (scheduled, weekly)

Ceil runs Session Rollup:
  1. Read sessions/2026-03-28.md (full log)
  2. LLM extracts:
     - Decision: "We decided to use DIY Karpathy over Honcho"
     - Preference: "Victor prefers morning sessions for deep work"
     - Knowledge: "Learned about ByteRover's agent handoff approach"
     - Open todo: "Need to document agent-architecture"
  3. Update wiki:
     - [[victor-preferences]] += "morning deep work preference"
     - [[memory-systems]] += note about ByteRover handoff
     - [[agent-architecture]] += TODO marker
  4. Add provenance link in wiki articles:
     "Decision noted in [[session:2026-03-28]]"
  5. Archive session (move to sessions/archive/) or mark as rolled-up
        │
        ▼
[Session marked as rolled up; original file preserved]
```

---

## 12. Design Principles & Trade-offs

### 12.1 Design Principles

1. **Raw sources are immutable.** Never modify originals. All knowledge extraction goes through compilation.

2. **Wiki is the mental model.** Structure the wiki like a well-maintained personal knowledge base, not a file dump.

3. **Session is a log, not memory.** Sessions record what happened. Wiki captures what was learned.

4. **Cache for efficiency, not correctness.** Cache layers optimize token usage. They must never change what the LLM sees — only which subset it sees.

5. **Routines are LLM-driven.** The system doesn't just manage files — the LLM actively maintains the knowledge base through the four routines.

6. **Prefer append-only.** Sessions are append-only logs. Wiki articles are updated, not versioned (version history optional).

7. **Brevity in context, depth in wiki.** LLM context should be concise. Wiki articles can be thorough — they're read selectively, not wholesale.

### 12.2 Trade-offs

| Decision | Trade-off |
|----------|-----------|
| **Pure Karpathy (no cache)** | Simpler code, higher token cost, limited scalability |
| **Embeddings (L2)** | Saves tokens, but requires embedding model + invalidation logic |
| **Bidirectional links** | Rich navigation, but requires backlink index maintenance |
| **Per-day session files** | Easy to find, but daily rollup needs date-based triggers |
| **LLM-compiled wiki** | High quality, but depends on LLM availability/cost |
| **Wiki-to-session provenance** | Full audit trail, but clutters articles with metadata |

### 12.3 What We're Optimizing For

1. **Correctness first.** The LLM should always have accurate, consistent information. Speed and cost are secondary.
2. **Transparency.** It should be clear where knowledge came from (provenance links). The user can inspect the wiki.
3. **Maintainability.** Someone reading the wiki should understand the system without needing to read this document.
4. **Graceful scaling.** The system should work well at 10 articles and not break at 200.

### 12.4 Known Limitations

- **LLM cost for routines:** Compilation, linting, and rollup consume LLM calls. These are not free.
- **Context window is still finite.** Even with caching, very large wikis will eventually outpace available context.
- **Backlink maintenance is manual (until linting).** The system relies on the LLM to generate correct links during compilation.
- **No real-time sync.** If raw files change on disk during compilation, there may be race conditions.

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **Backlink** | A link from one wiki article to another. Backlinks enable bidirectional navigation. |
| **Cache** | Token optimization layer. Stores pre-computed summaries, embeddings, or compressed content. |
| **Compilation Routine** | The routine that transforms raw sources into wiki articles. |
| **Context (LLM Context)** | The text payload sent to the LLM API in a single request. Includes system prompt, session history, and wiki content. |
| **Context Window** | The maximum number of tokens the LLM can process in a single request. |
| **Full-Context Reading** | The Karpathy approach: sending the entire knowledge base (or a large portion) to the LLM rather than retrieving a subset. |
| **Karpathy Approach** | Andrej Karpathy's memory philosophy: treat memory as a wiki, not a database. Leverage large context windows for full reading. |
| **L1 Cache** | Article summaries. Compressed 1-paragraph descriptions of each wiki article. |
| **L2 Cache** | Embedding pre-filter. Vector embeddings of wiki articles for similarity search. |
| **L3 Cache** | Session compression. Compressed history of old conversation messages. |
| **Lint Report** | Output of the linting routine. Lists broken links, orphaned articles, contradictions, and suggestions. |
| **Linting Routine** | The routine that checks wiki health: links, facts, orphaned articles, staleness. |
| **LLM Context** | See Context (LLM Context). |
| **Organization Routine** | The routine that reorganizes the wiki as it grows beyond thresholds. |
| **Provenance** | Tracking the source of knowledge — which raw file or session a wiki fact came from. |
| **RAG** | Retrieval-Augmented Generation. Traditional approach: chunk documents, embed, retrieve top-K chunks. |
| **Raw Sources** | Original, unmodified files in the `raw/` directory. The source of truth. |
| **Rollup** | The process of extracting knowledge from old sessions and integrating it into the wiki. |
| **Session Memory** | The conversation log stored in `sessions/YYYY-MM-DD.md`. Short-term, ephemeral. |
| **Session Rollup Routine** | The routine that processes old session files and integrates learnings into the wiki. |
| **Wiki** | The compiled knowledge base in `wiki/`. Long-term, curated, cross-session. |
| **Wiki Article** | A single