# DIY Karpathy Memory Architecture — Design Document

> **Status:** Design v1.2  
> **Author:** Ceil (subagent)  
> **Date:** 2026-04-04  
> **Updated:** 2026-04-05 (added human-AI collaboration model, approval queue, interactive vs batch workflows)  
> **Purpose:** Architectural specification for a personal memory system that grows from what you save, what you ask, and what you explore.

---

## TL;DR — The Core Idea

**Traditional AI memory:** Store stuff, then retrieve it when asked. (Like a filing cabinet.)

**Karpathy's approach:** The AI reads its entire knowledge base like a book, understands everything together, then answers. (Like a human who has read widely and deeply about a topic.)

**Our addition:** Human maintains **editorial control** through an approval queue. The AI proposes, the human approves.

> *"Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase."* — Karpathy

---

## Table of Contents

1. [The Mental Model — IDE + Programmer + Codebase](#1-the-mental-model--ide--programmer--codebase)
2. [Three Layers of the System](#2-three-layers-of-the-system)
3. [Two Modes of Operation](#3-two-modes-of-operation)
4. [Bidirectional Growth — The Missing Piece](#4-bidirectional-growth--the-missing-piece)
5. [System Overview & Directory Structure](#5-system-overview--directory-structure)
6. [Knowledge Base vs. Session Memory vs. Log](#6-knowledge-base-vs-session-memory-vs-log)
7. [The Five Routines + Approval Queue](#7-the-five-routines--approval-queue)
8. [Query-Time: How the AI "Thinks"](#8-query-time-how-the-ai-thinks)
9. [Cache Layers — Token Optimization](#9-cache-layers--token-optimization)
10. [Backlinks and Navigation](#10-backlinks-and-navigation)
11. [Example Workflows](#11-example-workflows)
12. [Design Principles & Trade-offs](#12-design-principles--trade-offs)
13. [Glossary](#13-glossary)

---

## 1. The Mental Model — IDE + Programmer + Codebase

Karpathy's core metaphor:

> **Obsidian is the IDE; the LLM is the programmer; the wiki is the codebase.**

### What This Means

| Component | Role | Analogy |
|-----------|------|---------|
| **You (Human)** | Product owner, code reviewer | Project manager who approves PRs |
| **LLM** | Programmer, maintainer | Developer who writes and refactors code |
| **Wiki** | Codebase | Living system that evolves |
| **Obsidian/UI** | IDE | Where you browse, review, navigate |
| **Schema** | Coding standards | `CLAUDE.md` / `AGENTS.md` — rules for the LLM |

### The Human's Job vs. The LLM's Job

**Human (You):**
- Curate sources (papers, bookmarks, URLs)
- Ask questions, direct analysis
- **Approve or reject proposed changes** ← Key addition
- Think about what it all means

**LLM:**
- Read sources and extract knowledge
- Write and maintain wiki articles
- Cross-reference, link, lint
- Propose updates (but not apply without approval)

> *"The tedious part of maintaining a knowledge base is not the reading or the thinking — it's the bookkeeping. Humans abandon wikis because the maintenance burden grows faster than the value. LLMs don't get bored, don't forget to update a cross-reference, and can touch 15 files in one pass."* — Karpathy

### The Approval Queue Concept

Instead of the LLM editing the wiki directly, changes go through a **pending approval queue**:

```
┌─────────────────────────────────────────────────────────────┐
│                    APPROVAL QUEUE (Pending Changes)          │
├─────────────────────────────────────────────────────────────┤
│  □ Update [[multi-agent-architecture]]                      │
│    └─ Added: ByteRover handoff pattern                      │
│    └─ Source: session 2026-04-04                            │
│    [Preview] [Approve] [Edit] [Reject]                     │
├─────────────────────────────────────────────────────────────┤
│  □ Create [[raft-consensus]] (full article from stub)       │
│    └─ Query count: 5 → deserves comprehensive treatment     │
│    [Preview] [Approve] [Reject]                            │
├─────────────────────────────────────────────────────────────┤
│  □ Link [[agent-platform]] → [[n8n-setup]]                  │
│    └─ Cross-reference detected during linting               │
│    [Approve] [Reject]                                      │
└─────────────────────────────────────────────────────────────┘
```

**Benefits:**
- **Safe:** LLM can't accidentally mess up wiki
- **Transparent:** You see exactly what changed
- **Batched:** Review multiple changes at once
- **Teachable:** Your feedback improves LLM's future proposals

---

## 2. Three Layers of the System

Karpathy defines three distinct layers:

```
┌─────────────────────────────────────────────────────────────┐
│  LAYER 3: ANSWERS & EXPLORATIONS                             │
│  Synthesized responses, comparisons, analyses                │
│  Can be filed back into wiki as new pages                    │
│  "Your explorations compound too"                            │
└─────────────────────────────┬───────────────────────────────┘
                              │ Query / Explore
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 2: THE WIKI (The Codebase)                            │
│  LLM-generated markdown. Summaries, entities, concepts.      │
│  Cross-referenced, interlinked, maintained.                  │
│  LLM owns this layer entirely (with human approval).         │
└─────────────────────────────┬───────────────────────────────┘
                              │ Ingest / Compile
                              ▼
┌─────────────────────────────────────────────────────────────┐
│  LAYER 1: RAW SOURCES (Source of Truth)                      │
│  Papers, articles, bookmarks, images, URLs.                  │
│  Immutable. You curate this. LLM reads but never modifies.   │
└─────────────────────────────────────────────────────────────┘
```

### Layer 1: Raw Sources

**Your job:** Curate. Drop files here. Never modified by LLM.

```
raw/
├── papers/              # Research papers (PDF)
├── bookmarks/           # Web articles (markdown)
├── images/              # Images with annotations
└── assets/              # Downloaded images (local, not URLs)
```

**Key practice:** Download images locally, don't rely on URLs.
- In Obsidian: Settings → Files → "Attachment folder path" = `raw/assets/`
- Hotkey: "Download attachments for current file"
- LLM can view images directly (read text first, then view images separately)

### Layer 2: The Wiki

**LLM's job:** Write, maintain, cross-reference. **Your job:** Approve changes.

```
wiki/
├── _index.md           # Content catalog (TOC) — LLM reads this first
├── _backlinks.json     # Cross-reference index
├── _pending/           # 💡 PROPOSED CHANGES (approval queue)
│   ├── 001-update-multi-agent.md
│   ├── 002-create-raft-article.md
│   └── 003-link-n8n.md
├── concepts/           # General concepts & ideas
├── projects/           # Project-specific knowledge
├── people/             # User preferences, team info
└── explorations/       # 💡 Query answers that became wiki pages
```

### Layer 3: Answers & Explorations

**Key insight from Karpathy:** Good answers can be **filed back** into the wiki.

When you ask a deep question:
1. LLM synthesizes answer from wiki
2. Answer is valuable — don't let it disappear into chat history
3. **File it back** as a new wiki page in `explorations/`

**Example:**
```
You: "Compare our multi-agent approach vs. ByteRover's"

LLM: [synthesizes comparison from wiki]

→ Proposed change: Create wiki/explorations/
  multi-agent-vs-byterover-comparison.md

You: [approve] → Now part of permanent wiki
```

This way **your explorations compound** just like ingested sources.

---

## 3. Two Modes of Operation

The system supports both **batch** and **interactive** workflows:

### Mode A: Batch/Automated (Our Current Architecture)

```
Schedule → Routine runs → Proposes changes → Queue → Human reviews
```

**When to use:**
- Daily compilation of new sources
- Weekly session rollup
- Periodic linting

**Benefits:**
- Non-interruptive
- Batched for efficiency
- Human reviews at convenient time

### Mode B: Interactive/Real-Time (Karpathy's Style)

```
You + LLM collaborate in real-time
↓
LLM makes edits as you discuss
↓
You browse in Obsidian, see changes immediately
↓
Approve or refine on the spot
```

**When to use:**
- Deep research sessions
- Active sense-making
- Building understanding together

**Benefits:**
- Immediate feedback
- Tighter collaboration
- Better for exploration

### Hybrid Approach (Recommended)

```
┌─────────────────────────────────────────────────────────────┐
│                    INTERACTIVE MODE                          │
│  Real-time collaboration during active sessions             │
│  → Proposed changes go to _pending/ immediately             │
│  → You approve/reject as you go                             │
└─────────────────────────────────────────────────────────────┘
                              │
                    At session end / daily
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     BATCH MODE                               │
│  Automated routines run on schedule                         │
│  → New proposals added to _pending/                         │
│  → You review queue when convenient                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Bidirectional Growth — The Missing Piece

> **Memory grows from both sides: what you save AND what you ask.**

This is the key insight from Karpathy's tweet.

### Two Input Streams

```
┌─────────────────────────────────────────────────────────────┐
│                    MEMORY GROWS FROM                         │
├──────────────────────────┬──────────────────────────────────┤
│  EXPLICIT INPUT          │  IMPLICIT INPUT                   │
│  (What you SAVE)         │  (What you ASK)                  │
├──────────────────────────┼──────────────────────────────────┤
│  • Papers you save       │  • Questions you ask             │
│  • Bookmarks you add     │  • Topics you inquire about       │
│  • URLs you clip         │  • Problems you're solving        │
│  • Code you reference    │  • Decisions you discuss          │
│                          │  • Comparisons you request        │
│                          │                                   │
│  → Triggers:            │  → Triggers:                      │
│    Compilation           │    Query Reflection               │
│    Routine               │    Routine                        │
│                          │    + Explorations                 │
└──────────────────────────┴──────────────────────────────────┘
```

### Why "What You Ask" Matters

When you ask about something, you're revealing:
- What you care about
- What you're trying to understand
- What you need to remember

Your questions are **breadcrumbs** showing where knowledge needs to grow.

### Interest Stubs

Created by Query Reflection when you ask about something not in wiki:

```markdown
# RAFT Consensus

*Interest stub — first queried: 2026-04-04*  
*Query count: 5 (last queried: 2026-04-05)*  
*Status: Needs research — high priority (5 queries)*  
*Source: [[session:2026-04-04]], [[session:2026-04-05]]*

## What We Know
(Very brief — just enough to answer basic questions)

## What We Need
- Full article on RAFT algorithm
- Comparison with Paxos
- Use cases in distributed systems

## Related
- [[distributed-systems]] (parent topic)
- [[consensus-algorithms]] (sibling topic)
```

**Over time:** High query count signals "this needs a full article."

---

## 5. System Overview & Directory Structure

```
memory/
├── raw/                        # 📦 SOURCE OF TRUTH — your curation
│   ├── papers/                 #   Research papers (PDF)
│   ├── bookmarks/              #   Web articles (markdown)
│   ├── images/                 #   Images with annotations
│   └── assets/                 #   Downloaded images (local storage)
│
├── wiki/                       # 🧠 THE WIKI — LLM-maintained (you approve)
│   ├── _index.md              #   Content catalog (TOC) — navigation
│   ├── _backlinks.json        #   Cross-reference index
│   ├── _pending/              #   💡 PROPOSED CHANGES (approval queue)
│   │   └── YYYY-MM-DD-###-description.md
│   ├── _schema.md             #   💡 Rules for LLM (coding standards)
│   ├── concepts/              #   General concepts & ideas
│   ├── projects/              #   Project-specific knowledge
│   ├── people/                #   User preferences, profiles
│   ├── explorations/          #   💡 Answers that became wiki pages
│   └── interests/             #   💡 Interest stubs (query-driven)
│
├── sessions/                   # 💬 TODAY'S CONVERSATION LOG
│   ├── 2026-04-04.md         #   Today's raw conversation
│   └── archive/               #   Rolled-up old sessions
│
├── log.md                      # 📜 TIMELINE — chronological record
│                               #   Alternative to sessions/ (Karpathy style)
│                               #   Append-only: ingests, queries, lint passes
│
└── cache/                      # ⚡ TOKEN OPTIMIZATION
    ├── summaries/             #   L1: Article summaries (~100 tokens)
    └── embeddings/            #   L2: (optional) Article embeddings
```

### Special Files Explained

| File | Purpose | Karpathy's Approach | Our Approach |
|------|---------|---------------------|--------------|
| **`_index.md`** | Content catalog | ✅ Yes — LLM reads first to find relevant pages | Same |
| **`log.md`** | Chronological timeline | ✅ Yes — single append-only file | Alternative to `sessions/` |
| **`_schema.md`** | Rules for LLM | ✅ Yes — `CLAUDE.md` or `AGENTS.md` | Same concept |
| **`_pending/`** | Approval queue | ❌ Not mentioned | 💡 Our addition for safety |
| **`sessions/`** | Daily conversation logs | ❌ Not mentioned | Our approach (per-day files) |

### Sessions/ vs. Log.md — Two Approaches

**Karpathy's log.md:**
```markdown
## [2026-04-04] ingest | Transformer Architecture Paper
## [2026-04-04] query | Multi-agent comparison
## [2026-04-04] lint | Found 3 broken links
## [2026-04-05] ingest | RAFT Consensus Article
```
- Single file, append-only
- Parseable with `grep "^## \[" log.md | tail -5`
- Timeline view of wiki evolution

**Our sessions/ approach:**
- Per-day files: `sessions/2026-04-04.md`
- Full conversation content
- Easier to read as narrative
- Archive after rollup

**Can use both:** `sessions/` for detailed logs, `log.md` for timeline summary.

---

## 6. Knowledge Base vs. Session Memory vs. Log

| Component | Purpose | Content | Lifetime | Owner |
|-----------|---------|---------|----------|-------|
| **Wiki** | Persistent knowledge | Articles, concepts, synthesis | Long-term | LLM writes, you approve |
| **Sessions** | Today's conversation | Raw chat logs, scratchpad | Short-term (7 days) | Append-only |
| **Log** | Timeline summary | Ingests, queries, events | Permanent | Append-only |

### The Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    WIKI (Persistent)                         │
│  Compiled knowledge — articles, concepts, synthesis         │
│  Source: raw files + approved session learnings             │
└────────────────────────────▲────────────────────────────────┘
                             │  Approved changes from _pending/
                             │  (human review gate)
┌────────────────────────────┴────────────────────────────────┐
│                  _pending/ (Proposed Changes)                │
│  LLM proposes → You approve/reject → Applied to wiki        │
└────────────────────────────▲────────────────────────────────┘
                             │  Routine outputs
                             │
┌────────────────────────────┼────────────────────────────────┐
│                  SESSIONS / LOG (Ephemeral)                  │
│  Raw conversation → Routines extract → Proposals            │
└────────────────────────────▲────────────────────────────────┘
                             │  Real-time append
                             │
┌────────────────────────────┴────────────────────────────────┐
│                    RAW SOURCES (Immutable)                   │
│  You curate → Compilation routine → Wiki updates            │
└─────────────────────────────────────────────────────────────┘
```

---

## 7. The Five Routines + Approval Queue

### The Five Routines

| # | Routine | Trigger | Input | Output |
|---|---------|---------|-------|--------|
| 1 | **Compilation** | New raw file | `raw/` | Wiki update proposals |
| 2 | **Query Reflection** | User asks question | Query text | Interest stub proposals |
| 3 | **Exploration Filing** | Deep answer generated | Answer content | New wiki page proposals |
| 4 | **Linting** | Scheduled (weekly) | `wiki/` | Fix proposals |
| 5 | **Session Rollup** | Session 7+ days old | `sessions/` | Wiki update proposals |

### The Approval Queue `_pending/`

All routines output to `_pending/`, not directly to wiki:

```
_pending/
├── 2026-04-04-001-update-multi-agent.md
├── 2026-04-04-002-create-raft-stub.md
├── 2026-04-05-001-exploration-comparison.md
└── 2026-04-05-002-link-n8n.md
```

**Format of a pending change:**
```markdown
---
type: update
status: pending
created: 2026-04-04
source: compilation-routine
source_file: raw/papers/transformer-attention.pdf
---

# Proposed: Update [[multi-agent-architecture]]

## Changes
- Add section on ByteRover handoff pattern
- Update [[agent-ceil]] cross-reference
- Add link to new paper

## Preview
(Current article content with changes highlighted)

## Rationale
Source paper discusses handoff mechanisms that complement our architecture.

---

[Approve] [Edit] [Reject] [Defer]
```

### Human Review Interface

```
┌─────────────────────────────────────────────────────────────┐
│  Pending Wiki Changes (4)                                   │
│  Last updated: 2026-04-05 13:30                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  □ 001: Update [[multi-agent-architecture]]                │
│    Source: Compilation routine | transformer-paper.pdf      │
│    Type: Add ByteRover handoff section                      │
│    [Preview] [Approve] [Edit] [Reject]                     │
│                                                             │
│  □ 002: Create [[raft-consensus]] (from interest stub)      │
│    Source: Query reflection | 5 queries on this topic       │
│    Type: Full article from stub                             │
│    [Preview] [Approve] [Reject]                            │
│                                                             │
│  □ 003: File exploration [[multi-agent-vs-byterover]]       │
│    Source: Your query on 2026-04-05                         │
│    Type: New exploration page                               │
│    [Preview] [Approve] [Edit] [Reject]                     │
│                                                             │
│  □ 004: Fix broken link [[openclaw-setup]] → [[gateway]]    │
│    Source: Lint routine                                     │
│    Type: Fix broken backlink                                │
│    [Approve] [Reject]                                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. Query-Time: How the AI "Thinks"

```
┌─────────────────────────────────────────────────────────────┐
│  YOU ASK: "What's our current agent architecture?"         │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 1: Read _index.md (content catalog)                   │
│  → List of all articles with summaries                      │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 2: Select relevant articles                           │
│  → [[multi-agent-architecture]]                             │
│  → [[agent-ceil]]                                           │
│  → [[agent-platform]]                                       │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  STEP 3: Load full selected articles + session context      │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  LLM GENERATES RESPONSE                                     │
│  Synthesized from wiki (not raw sources)                    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  DEEP ANSWER? → Propose filing to explorations/             │
│  "This comparison is valuable — add to wiki?"               │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  SESSION APPEND                                             │
│  sessions/2026-04-04.md += [question, response]             │
│  log.md += "## [2026-04-04] query | agent architecture"    │
└─────────────────────────────────────────────────────────────┘
```

---

## 9. Cache Layers — Token Optimization

```
┌─────────────────────────────────────────────────────────────┐
│                    CACHE TIER OVERVIEW                       │
├─────────┬──────────────────┬──────────────────────────────┤
│  Tier   │  Name            │  What it does                 │
├─────────┼──────────────────┼──────────────────────────────┤
│  L1     │  Article         │  ~100 token summary of each  │
│         │  Summaries       │  article. "Chapter preview"  │
├─────────┼──────────────────┼──────────────────────────────┤
│  L2     │  Embeddings      │  Vector similarity search     │
│         │  (optional)      │  (only if wiki > 50 articles) │
├─────────┼──────────────────┼──────────────────────────────┤
│  L3     │  Session         │  Compress old conversation    │
│         │  Compression     │  history if > 20 messages    │
└─────────┴──────────────────┴──────────────────────────────┘
```

**Key insight:** At Karpathy's scale (~100 sources, ~hundreds of pages), the `_index.md` approach works without embeddings. Only add L2 when you outgrow the index.

---

## 10. Backlinks and Navigation

### Wiki Links

```markdown
# Standard link
See [[multi-agent-architecture]] for details.

# Link with display text
The design follows [[agent-architecture|Rimuru-style]] principles.
```

### Backlink Index `_backlinks.json`

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

### Graph View

Obsidian's graph view shows:
- What's connected to what
- Which pages are hubs (many connections)
- Which are orphans (no incoming links)

**Use for:** Understanding wiki structure at a glance.

---

## 11. Example Workflows

### 11.1 Interactive Ingestion (Karpathy Style)

```
You: "Process this paper on transformer attention"
      ↓
[LLM reads paper, discusses with you]
      ↓
LLM: "Key insight: attention patterns correlate with
      semantic importance. I'll propose updates to
      [[transformer-models]] and create a new concept
      page for [[attention-mechanisms]]."
      ↓
[Proposals added to _pending/]
      ↓
You review in approval queue:
  □ Approve update to [[transformer-models]]
  □ Approve new [[attention-mechanisms]] page
      ↓
[Changes applied to wiki]
      ↓
You browse in Obsidian: follow links, check graph view
```

### 11.2 Batch Mode (Our Architecture)

```
[Daily, scheduled]
      ↓
Compilation routine runs:
  - Scans raw/ for new files
  - Processes each
  - Generates proposals in _pending/
      ↓
[You review queue when convenient]
      ↓
Batch approve/reject pending changes
      ↓
[Approved changes applied to wiki]
```

### 11.3 Exploration That Compounds

```
You: "Compare our approach to ByteRover's handoffs"
      ↓
[LLM synthesizes from wiki]
      ↓
LLM generates deep comparison
      ↓
LLM: "This analysis is valuable — propose filing as
      wiki/explorations/multi-agent-vs-byterover.md?"
      ↓
You: [Approve]
      ↓
[New exploration page added to wiki]
      ↓
Future queries can reference this comparison
```

---

## 12. Design Principles & Trade-offs

### Core Principles

1. **Raw sources are sacred.** Immutable. You curate.
2. **Wiki is the mental model.** Structured, interlinked, maintained.
3. **Human maintains editorial control.** Approval queue, not direct edits.
4. **Explorations compound.** Good answers become wiki pages.
5. **LLM does bookkeeping.** Cross-references, links, consistency.

### Interactive vs. Batch Trade-offs

| Aspect | Interactive (Karpathy) | Batch (Ours) |
|--------|------------------------|--------------|
| **Speed** | Immediate | Delayed (scheduled) |
| **Control** | Real-time review | Batched review |
| **Interrupts** | High (during session) | Low (when convenient) |
| **Best for** | Deep research, exploration | Maintenance, routine updates |

**Recommendation:** Hybrid. Interactive for active sessions, batch for maintenance.

---

## 13. Glossary

| Term | Definition |
|------|------------|
| **Approval Queue** | `_pending/` directory where LLM-proposed changes wait for human review. |
| **Backlink** | Link from one wiki article to another. Enables bidirectional navigation. |
| **Bidirectional Growth** | Memory grows from: what you save + what you ask + what you explore. |
| **Compilation Routine** | Processes raw sources → proposes wiki updates. |
| **Exploration** | Deep answer synthesized from wiki, filed back as new wiki page. |
| **Interest Stub** | Wiki article created from user query. Marks topic needing research. |
| **Karpathy Approach** | Treat memory as wiki LLM maintains, not database to query. |
| **Linting Routine** | Health-checks wiki: broken links, orphans, contradictions. |
| **Log.md** | Append-only timeline of wiki evolution (ingests, queries, lint). |
| **Query Reflection** | Captures user questions → creates interest stubs. |
| **Schema** | Rules document (`_schema.md`) guiding LLM behavior. |
| **Session Rollup** | Extracts knowledge from old sessions → proposes wiki updates. |
| **Wiki** | LLM-maintained knowledge base. Human-approved changes only. |

---

## Appendix: Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Directory structure | ✅ Defined | In this doc |
| Raw sources layer | ✅ Concept | Ready to implement |
| Wiki layer | ✅ Concept | Ready to implement |
| Approval queue (`_pending/`) | 📋 New | Key addition for safety |
| `_index.md` navigation | 📋 To implement | Start simple |
| `log.md` timeline | 📋 Optional | Alternative to sessions |
| `_schema.md` | 📋 To implement | Rules for LLM |
| Compilation routine | 📋 To implement | Batch workflow |
| Query reflection | 📋 To implement | Captures "what you ask" |
| Exploration filing | 📋 To implement | Answers become pages |
| Interactive mode | 📋 Future | Real-time collaboration |
| Obsidian integration | ⏸ Optional | IDE for browsing |
| L1 summaries | 📋 To implement | Key for optimization |
| L2 embeddings | ⏸ Optional | Only if > 50 articles |
| L3 compression | ⏸ Optional | Only if > 20 messages |

---

## References

- **Karpathy's Gist:** https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f
- **Vannevar Bush's Memex (1945):** Associative trails between documents. This architecture realizes that vision with LLM maintenance.
- **Obsidian:** https://obsidian.md — Recommended IDE for wiki browsing
- **qmd:** https://github.com/tobi/qmd — Local search engine for markdown (optional)

---

*This document is intentionally abstract. The exact directory structure, schema conventions, page formats, and tooling depend on your domain and preferences. Share this with your LLM agent and work together to instantiate a version that fits your needs.*
