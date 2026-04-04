# DIY Karpathy Memory Architecture — Design Document

> **Status:** Design v1.1  
> **Author:** Ceil (subagent)  
> **Date:** 2026-04-04  
> **Updated:** 2026-04-04 (added bidirectional growth concept)  
> **Purpose:** Architectural specification for a personal memory system that grows from both what you SAVE and what you ASK.

---

## TL;DR — The Core Idea

**Traditional AI memory:** Store stuff, then retrieve it when asked. (Like a filing cabinet.)

**Karpathy's approach:** The AI reads its entire knowledge base like a book, understands everything together, then answers. (Like a human who has read widely and deeply about a topic.)

**Key insight:** Memory grows from **two directions**:
1. **What you save** — articles, papers, bookmarks (explicit inputs)
2. **What you ask** — your questions reveal what you care about (implicit inputs)

---

## Table of Contents

1. [The Mental Model — Think of It Like...](#1-the-mental-model--think-of-it-like)
2. [Bidirectional Growth — The Missing Piece](#2-bidirectional-growth--the-missing-piece)
3. [System Overview & Directory Structure](#3-system-overview--directory-structure)
4. [Knowledge Base vs. Session Memory](#4-knowledge-base-vs-session-memory)
5. [The Four Routines — How the System Maintains Itself](#5-the-four-routines--how-the-system-maintains-itself)
6. [Query-Time: How the AI "Thinks"](#6-query-time-how-the-ai-thinks)
7. [Cache Layers — Token Optimization](#7-cache-layers--token-optimization)
8. [Backlinks and Navigation](#8-backlinks-and-navigation)
9. [Example Workflows](#9-example-workflows)
10. [Design Principles & Trade-offs](#10-design-principles--trade-offs)
11. [Glossary](#11-glossary)

---

## 1. The Mental Model — Think of It Like...

### Your Memory System is a Personal Wikipedia

Imagine you're building a **personal Wikipedia** that only you can edit and read. The Wikipedia:

- Has articles you've written about topics you care about
- Gets updated when you read new papers or save interesting things
- Gets updated when you have important discussions
- **Grows from both what you read AND what you ask about**

### The Two Types of Memory

| Type | File | Purpose | Lifetime |
|------|------|---------|----------|
| **Knowledge Base** | `wiki/` | Your compiled understanding of topics | Long-term |
| **Session Log** | `sessions/` | What happened in conversations today | Short-term |

### The Four Routines — Maintenance Workers

Your Wikipedia has four automated workers that keep it tidy:

1. **Compiler** — Reads new papers/saved articles → writes wiki articles
2. **Curator** — Finds broken links, orphaned pages, suggests improvements
3. **Organizer** — Reorganizes when the wiki gets too big
4. **Synthesizer** — Takes old conversation notes → extracts useful knowledge → updates wiki

---

## 2. Bidirectional Growth — The Missing Piece

> **Memory grows from both sides: what you save AND what you ask.**

This is the key insight from the Karpathy tweet that our original architecture missed.

### Why This Matters

When you ask about something, you're revealing:
- What you care about
- What you're trying to understand
- What you need to remember

This is just as valuable as what you explicitly save. Your questions are breadcrumbs that show where your knowledge needs to grow.

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
│                          │                                   │
│  → Triggers:            │  → Triggers:                      │
│    Compilation Routine   │    Query Reflection (NEW)         │
└──────────────────────────┴──────────────────────────────────┘
```

### The Fifth Routine: Query Reflection

**Purpose:** Capture what you ask about as signals of interest and knowledge gaps.

```
Trigger:  After each user query
Input:    Current session + user question
Output:   Wiki article stubs OR interest markers
```

**What it does:**

```
User asks: "How does RAFConsensus work again?"
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│  Query Reflection:                                          │
│                                                             │
│  1. Extract topic: "RAFConsensus"                          │
│  2. Check: Does wiki have article on RAFConsensus?         │
│     │                                                        │
│     ├── YES ──→ Add "queried" tag + increment query count  │
│     │           This shows topic is important to user       │
│     │                                                        │
│     └── NO ───→ Create "interest stub" in wiki:            │
│                 # RAFConsensus (INTEREST STUB)             │
│                 *Queried by Victor on 2026-04-04*          │
│                 *Status: Needs research*                    │
│                 *Source: [[session:2026-04-04]]*           │
└─────────────────────────────────────────────────────────────┘
```

### Why Interest Stubs Matter

Over time, your stubs reveal patterns:

```
# Topics Victor Asks About (Queried 3+ times)
- [[RAFConsensus]] — queried 5 times, most recent: 2026-04-04
- [[distributed-systems]] — queried 3 times, most recent: 2026-04-02
- [[agent-handoffs]] — queried 4 times, most recent: 2026-04-04
```

This tells you:
1. **What matters to the user** (high query count)
2. **What needs documentation** (stub exists but no full article)
3. **What to prioritize** (frequently asked topics)

### Updated System Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         TWO INPUT STREAMS                            │
├───────────────────────────┬─────────────────────────────────────────┤
│  EXPLICIT                 │  IMPLICIT                                │
│  (What you save)          │  (What you ask)                          │
├───────────────────────────┼─────────────────────────────────────────┤
│                           │                                          │
│  ┌─────────────────────┐  │  ┌──────────────────────────────────┐   │
│  │  raw/               │  │  │  sessions/ (today's logs)        │   │
│  │  ├── papers/        │  │  │  └── User questions extracted     │   │
│  │  ├── bookmarks/     │  │  └──────────────┬───────────────────┘   │
│  │  └── urls/          │  │                 │                        │
│  └──────────┬──────────┘  │                 │ Query Reflection       │
│              │             │                 ▼                        │
│              │ Compilation │  ┌──────────────────────────────────┐   │
│              │ Routine     │  │  wiki/                            │   │
│              ▼             │  │  ├── Interest stubs created       │   │
│  ┌─────────────────────┐  │  │  ├── Query counts updated         │   │
│  │  wiki/              │◄─┼──┤  └── Topics flagged for research  │   │
│  │  └── (articles)     │  │  └──────────────────────────────────┘   │
│  └─────────────────────┘  │                                          │
│              ▲            │                 ▲                        │
│              │ Session    │                 │                        │
│              │ Rollup     │                 │                        │
│  ┌──────────┴──────────┐  │                 │                        │
│  │  sessions/ (older)  │──┴─────────────────┘                        │
│  │  └── Rolled-up      │                                            │
│  └─────────────────────┘                                            │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. System Overview & Directory Structure

```
memory/
├── raw/                        # 📦 SOURCE OF TRUTH — untouched originals
│   ├── papers/                 #   Research papers (PDF)
│   ├── codebases/              #   Code files you've saved
│   ├── images/                 #   Images with annotations
│   └── bookmarks/              #   Saved URLs, web clips
│
├── wiki/                       # 🧠 THE WIKI — compiled knowledge
│   ├── _index.md              #   Master navigation (table of contents)
│   ├── _backlinks.json        #   Cross-reference index ("see also")
│   ├── concepts/              #   General concepts & ideas
│   │   ├── multi-agent-architecture.md
│   │   ├── memory-systems.md
│   │   └── ...
│   ├── projects/              #   Project-specific knowledge
│   │   ├── ceil-workspace.md
│   │   ├── agent-platform.md
│   │   └── ...
│   ├── people/                #   User preferences, team info
│   │   ├── victor-preferences.md
│   │   └── ...
│   └── interests/             #   💡 INTEREST STUBS (NEW)
│       ├── rafconsensus.md    #   "Needs research" stub
│       └── distributed-systems.md
│
├── sessions/                   # 💬 TODAY'S CONVERSATION LOG
│   ├── 2026-04-04.md         #   Today's raw conversation
│   ├── 2026-04-03.md         #   Yesterday's
│   └── archive/               #   Rolled-up sessions
│
└── cache/                      # ⚡ TOKEN OPTIMIZATION
    ├── summaries/             #   L1: Article summaries (~100 tokens each)
    └── embeddings/            #   L2: (optional) Article embeddings
```

### Why This Structure?

- **`raw/`** = You trust this. It's the original source.
- **`wiki/`** = The AI has processed and understood this. It's the AI's "brain."
- **`sessions/`** = Ephemeral scratchpad. Today's notes, tomorrow's rolled-up insights.
- **`cache/`** = Speed optimization. Like a book's index and chapter summaries.

---

## 4. Knowledge Base vs. Session Memory

These are fundamentally different tools with different jobs.

### 4.1 Knowledge Base (`wiki/`)

**Think of it as:** Your compiled understanding of the world.

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Persistent, curated, cross-session understanding |
| **Content** | Concepts, project facts, user preferences, decisions |
| **Source** | LLM compiles from raw files + session rollups + interest stubs |
| **Update trigger** | Compilation routine, session rollup, query reflection |
| **Lifecycle** | Long-term. Gets richer over time. |
| **Example** | `concepts/multi-agent-architecture.md` |

### 4.2 Session Memory (`sessions/`)

**Think of it as:** A notepad for today's work.

| Attribute | Description |
|-----------|-------------|
| **Purpose** | Ephemeral, working context for current conversation |
| **Content** | Chat history, scratchpad notes, decisions made today |
| **Source** | Real-time append during conversation |
| **Update trigger** | Every message exchange |
| **Lifecycle** | Short-term. Rolled up after 7 days, then archived. |
| **Example** | `sessions/2026-04-04.md` |

### 4.3 The Relationship

```
┌─────────────────────────────────────────────────────────────┐
│                    WIKI (Long-Term Memory)                   │
│                                                             │
│  "I know about multi-agent architecture..."               │
│  "Victor prefers morning sessions..."                      │
│  "We decided to use Redis over Solid..."                   │
│                                                             │
│  Compiled from: raw files + old sessions + interest stubs  │
└────────────────────────────▲────────────────────────────────┘
                             │
                    Session Rollup
                    (extracts decisions,
                     preferences, knowledge)
                             │
┌────────────────────────────┴────────────────────────────────┐
│                   SESSIONS (Today's Work)                    │
│                                                             │
│  "User asked about RAFConsensus..."                        │
│  "Agent provided explanation..."                           │
│  "Interest stub created..."                                │
│                                                             │
│  Today's scratchpad — will be rolled up eventually         │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. The Four Routines — How the System Maintains Itself

The system isn't just storage — it has automated maintenance routines.

### 5.1 Compilation Routine

**Job:** Read new papers/documents → Write wiki articles.

```
Trigger:  New file in raw/ OR scheduled (daily)
Input:    raw/ directory
Output:   New or updated wiki articles
```

**Example:** You save `paper-llm-attention.pdf` to `raw/papers/`.

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  Read the    │───▶│  Extract     │───▶│  Write or    │
│  paper       │    │  key concepts│    │  update wiki │
│              │    │  & facts     │    │  article     │
└──────────────┘    └──────────────┘    └──────┬───────┘
                                                 │
                                                 ▼
                                        ┌──────────────┐
                                        │  Link to     │
                                        │  related     │
                                        │  articles    │
                                        └──────────────┘
```

### 5.2 Query Reflection Routine

**Job:** Capture what you ask → Signal what needs documentation.

```
Trigger:  After each user query
Input:    User's question
Output:   Interest stubs OR query count updates
```

**Example:** You ask about "RAFT consensus"

```
User asks: "How does RAFT consensus work?"
           │
           ▼
┌─────────────────────────────────────────────────────────────┐
│  Does wiki have RAFT article?                               │
│     │                                                        │
│     ├── YES ──→ Increment query count, add "queried" tag   │
│     │           "This topic was queried 3 times"          │
│     │                                                        │
│     └── NO ───→ Create interest stub:                     │
│                 # RAFT Consensus                             │
│                 *Status: Needs research*                    │
│                 *First queried: 2026-04-04*                 │
│                 *Source: [[session:2026-04-04]]*            │
└─────────────────────────────────────────────────────────────┘
```

### 5.3 Linting Routine

**Job:** Keep the wiki healthy. Find problems.

```
Trigger:  Scheduled (weekly) OR manual
Input:    wiki/ directory (full scan)
Output:   Report: broken links, orphaned pages, suggestions
```

**What it checks:**
- Do all `[[links]]` point to existing articles?
- Are there articles no one links to? (orphaned)
- Any facts contradicting across articles?
- Articles not updated in 30+ days?

### 5.4 Session Rollup Routine

**Job:** Extract valuable learnings from old sessions → Add to wiki.

```
Trigger:  Session is 7+ days old
Input:    sessions/YYYY-MM-DD.md
Output:   Wiki updates with provenance links
```

**What it extracts:**
| Category | Example |
|----------|---------|
| **Decisions** | "We decided to use X instead of Y because..." |
| **Preferences** | "Victor prefers A over B" |
| **Knowledge** | "New understanding gained from this session" |
| **Todos** | "Open items identified but not completed" |

---

## 6. Query-Time: How the AI "Thinks"

When you ask a question, here's what happens:

```
┌─────────────────────────────────────────────────────────────┐
│  YOU ASK: "What's our current agent architecture?"         │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  CONTEXT CONSTRUCTION (per request)                         │
│                                                             │
│  1. [System prompt] — Who I am, rules                      │
│  2. [Wiki _index.md] — List of all articles (TOC)         │
│  3. [Wiki articles] — Selected articles based on query    │
│  4. [Session history] — Recent conversation               │
│  5. [Your question]                                        │
│                                                             │
│  Total: ~10-30K tokens (fits in context window)           │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  THE AI "READS" THIS CONTEXT LIKE A BOOK                   │
│                                                             │
│  - Sees the full article on agent architecture            │
│  - Understands relationships between concepts               │
│  - Knows about Victor's preferences from wiki             │
│  - Has today's conversation context from session           │
│                                                             │
│  → Generates coherent, context-aware response             │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  RESPONSE SENT TO YOU                                       │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│  SESSION APPEND                                             │
│  sessions/2026-04-04.md += [your question, my response]   │
└─────────────────────────────────────────────────────────────┘
```

**Why this is better than traditional RAG:**

| Traditional RAG | Karpathy Approach |
|----------------|------------------|
| Find 3-5 chunks | Read full article |
| Lose cross-references | Understands relationships |
| May miss context | Has full picture |
| "Tell me about X" | "I understand X in context of Y and Z" |

---

## 7. Cache Layers — Token Optimization

The context window is finite (e.g., 128K tokens). We optimize what we send.

### Three Cache Tiers

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

### L1: Article Summaries (Always On)

Each wiki article has a ~100 token summary. Like a book's chapter preview.

```
Query arrives
     │
     ▼
┌─────────────────────────────────────┐
│  Read ALL article summaries         │
│  (25 articles × 100 tokens = 2.5K)  │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  AI reads summaries → selects       │
│  which articles are relevant        │
└─────────────────┬───────────────────┘
                  │
                  ▼
┌─────────────────────────────────────┐
│  Read FULL content of selected      │
│  articles only                      │
└─────────────────────────────────────┘
```

### L2: Embeddings (Optional)

**Only enable when wiki has 50+ articles.**

Uses vector similarity instead of summaries to find relevant articles.

### L3: Session Compression (Optional)

**Only enable when session has 20+ messages.**

```
Session has 50 messages? Compress first 30 into summary:
"Victor asked about X. We discussed Y. Decided to Z."

Result: Only 20 recent messages + 1 summary sent to AI
```

---

## 8. Backlinks and Navigation

### Wiki Links

```markdown
# Simple link
See [[multi-agent-architecture]] for details.

# Link with custom text
The design follows [[agent-architecture|Rimuru-style]] principles.
```

### Backlink Index

Stored in `_backlinks.json`:

```json
{
  "multi-agent-architecture": [
    "agent-architecture",
    "ceil-workspace",
    "research-delegate-skill"
  ]
}
```

### Session Provenance Links

When session rollup adds knowledge to wiki, it links back:

```markdown
# victor-preferences.md

Victor prefers scheduled check-ins over ad-hoc messages.
*Last updated from session rollup: [[session:2026-03-28]]*
```

### Interest Stub Provenance

```markdown
# rafconsensus.md

*Interest stub — first queried: 2026-04-04*
*Query count: 5 (last queried: 2026-04-04)*
*Status: Needs research*
*Source: [[session:2026-04-04]], [[session:2026-04-02]]*
```

---

## 9. Example Workflows

### 9.1 You Ask About Something New

**Scenario:** You ask about RAFConsensus (从未问过)

```
Victor: "How does RAFConsensus work?"
        │
        ▼
[Context construction:]
  1. Load wiki _index.md (all article titles)
  2. Load article summaries — RAFConsensus has interest stub
  3. AI sees: "This is an interest stub, needs research"
  4. AI responds: "I don't have full docs yet, but I can explain what I know..."
        │
        ▼
[Query Reflection runs:]
  1. Check: Does RAFConsensus article exist?
     → YES (interest stub exists)
  2. Increment query count: 1 → 2
  3. Update stub with "last queried: today"
        │
        ▼
[Session append:]
  sessions/2026-04-04.md += [question, response]
```

### 9.2 You Save a Paper

**Scenario:** You save `transformer-paper.pdf` to `raw/papers/`

```
Trigger: New file in raw/

[Compilation Routine runs:]
  1. Read transformer-paper.pdf (full text)
  2. Extract: key concepts, facts, relationships
  3. Check: Does wiki have related article?
     → YES: [[neural-networks]] exists
  4. Update [[neural-networks]] with new insights
  5. Generate backlinks
  6. Update _index.md
        │
        ▼
[Result:]
  - [[neural-networks]] is now richer
  - Links to transformer-paper.pdf
  - Provenance recorded
```

### 9.3 Weekly Session Rollup

**Scenario:** End of week — `sessions/2026-03-28.md` is 7 days old

```
Trigger: Session age = 7 days

[Session Rollup runs:]
  1. Read sessions/2026-03-28.md
  2. LLM extracts:
     - Decision: "Use DIY Karpathy over Honcho"
     - Preference: "Victor likes morning deep work"
     - Knowledge: "Learned about ByteRover handoffs"
  3. Update wiki articles with extracted info
  4. Add provenance links
  5. Mark session as "rolled up"
        │
        ▼
[Result:]
  - Decisions captured in wiki
  - Preferences documented
  - Original session preserved in archive/
```

---

## 10. Design Principles & Trade-offs

### Core Principles

1. **Raw sources are sacred.** Never modify originals. All knowledge goes through compilation.

2. **Wiki is your mental model.** Structure it like a well-organized brain, not a file dump.

3. **Sessions are logs, not memory.** They record what happened. Wiki captures what was learned.

4. **Questions are valuable.** Your queries reveal what matters. Capture them.

5. **Cache for efficiency, not correctness.** Optimization layers must never change what the AI sees — only which subset.

### Trade-offs

| Decision | Trade-off |
|----------|-----------|
| **No embeddings initially** | Simpler, but less precise article selection. Use summaries instead. |
| **Interest stubs** | Extra maintenance, but reveals user priorities. |
| **Per-day session files** | Easy to find, but needs date-based rollup triggers. |
| **LLM-driven maintenance** | High quality, but not free (API costs). |

### Known Limitations

- **LLM cost for routines:** Compilation, linting, rollup, and reflection all use API calls.
- **Context window finite:** Even with caching, very large wikis may exceed available context.
- **Real-time sync gaps:** If raw files change during compilation, may have race conditions.

---

## 11. Glossary

| Term | Definition |
|------|------------|
| **Backlink** | A link from one wiki article to another. Enables bidirectional navigation. |
| **Bidirectional Growth** | Memory grows from two streams: what you save (explicit) + what you ask (implicit). |
| **Compilation Routine** | Automated worker that reads raw files and writes wiki articles. |
| **Interest Stub** | A wiki article created from a user query. Marks a topic that needs research. |
| **Karpathy Approach** | Treating memory as a wiki the AI reads, not a database it queries. |
| **L1 Cache** | Article summaries (~100 tokens each). Always enabled. |
| **L2 Cache** | Embedding-based similarity search. Only for wikis > 50 articles. |
| **L3 Cache** | Session compression. Only for sessions > 20 messages. |
| **Lint Report** | Output of the linting routine. Lists broken links, orphaned pages, suggestions. |
| **Linting Routine** | Automated worker that checks wiki health weekly. |
| **Provenance** | Tracking where wiki knowledge came from (which raw file or session). |
| **Query Reflection** | The routine that captures what you ask and creates interest stubs. |
| **RAG** | Retrieval-Augmented Generation. Traditional: chunk, embed, retrieve top-K. |
| **Raw Sources** | Original unmodified files in `raw/`. The source of truth. |
| **Rollup** | Extracting knowledge from old sessions into the wiki. |
| **Session Memory** | Today's conversation log (`sessions/YYYY-MM-DD.md`). Short-term. |
| **Session Rollup** | The routine that processes old sessions and integrates learnings. |
| **Wiki** | The compiled knowledge base (`wiki/`). Long-term memory. |

---

## Appendix: Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| Directory structure | ✅ Defined | In this doc |
| Session logging | ✅ Implemented | `sessions/` with daily files |
| Wiki articles | 🔄 In progress | Core structure exists |
| Compilation routine | 🔄 In progress | Basic workflow defined |
| Query reflection | 📋 To implement | New, documented here |
| Linting routine | 📋 To implement | Can start simple |
| Session rollup | 📋 To implement | After sessions have content |
| L1 summaries | 📋 To implement | Key for optimization |
| L2 embeddings | ⏸ Optional | Only if > 50 articles |
| L3 compression | ⏸ Optional | Only if > 20 messages |
