# ByteRover vs Honcho — Memory System Research

**Date:** March 25, 2026  
**Status:** In Progress — Decision Pending  
**Researcher:** Victor Paolo Reyes (with Ceil)  
**Location:** `/home/openclaw/.openclaw/workspace/researches/in-progress/`

---

## Executive Summary

ByteRover offers a **structured, stateful memory architecture** for OpenClaw agents with claimed 92.19% retrieval accuracy. It uses an **LLM-powered curation model** that actively organizes knowledge before storage, unlike Honcho's passive observation capture.

**Current Status:** Evaluating switch from Honcho to ByteRover. Google AI Studio (Gemini) identified as preferred LLM provider.

---

## 1. What is ByteRover?

ByteRover is a **local-first, structured memory system** for AI agents that adds a third memory layer to OpenClaw:

| Layer | Source | Purpose |
|-------|--------|---------|
| **Daily Memory** | `memory/YYYY-MM-DD.md` | Where work left off |
| **Workspace Memory** | `MEMORY.md` | How to behave |
| **Context Tree** (ByteRover) | `.brv/context-tree/` | What the agent knows |

### Key Differentiators
- **Stateful curation** — LLM actively classifies and structures knowledge before storage
- **Hierarchical organization** — Domain → Topic → Subtopic tree structure
- **92.19% retrieval accuracy** — Highest claimed benchmark on market
- **Full auditability** — Every curation decision includes reasoning trace
- **Version control** — Git-like history for memory changes
- **Cloud sync** — Optional push/pull for team/shared memory

---

## 2. ByteRover vs Honcho — Detailed Comparison

| Dimension | **ByteRover** | **Honcho (Current)** |
|-----------|---------------|----------------------|
| **Core Model** | Stateful, LLM-curated | Retrieval-only, passive observation |
| **Memory Structure** | Hierarchical context tree (structured) | Dialectic storage (observations/conclusions) |
| **Organization** | Domain → Topic → Subtopic | Flat semantic search |
| **Curation** | Active ADD/UPDATE/MERGE/DELETE with reasoning | Automatic capture |
| **Retrieval Method** | Cache → Full-text → LLM synthesis | Vector semantic search |
| **Retrieval Accuracy** | 92.19% (claimed) | Not benchmarked |
| **Auditability** | Very high (who/why/when per entry) | Medium |
| **Control** | 100% — edit markdown files directly | API-mediated |
| **Portability** | Local files + cloud sync | Cloud-only |
| **Cross-Channel** | Per-workspace | ✅ Yes — unified user profile across channels |
| **Interface** | CLI commands (`brv query`, `brv curate`) | Native tools (`honcho_search`, `honcho_recall`) |
| **Automation** | Context Engine plugin required for auto-query/curate | Always-on observation |

### When ByteRover Wins
- Long-running agents requiring structured knowledge
- Need for 100% control over memory organization
- High retrieval accuracy critical (>90%)
- Audit trail and reasoning transparency required
- Local-first, no cloud dependency
- Multi-agent systems sharing memory

### When Honcho Wins
- Cross-channel user memory (Telegram + Discord + future)
- Unified user profile across all sessions
- Zero-configuration deployment
- Passive "always watching" model preferred

---

## 3. How ByteRover Works

### Agent Usage Patterns

**A. Manual (Explicit Skill Invocation)**
```bash
# Before work — retrieve context
brv query "How is authentication implemented?"

# After learning — store knowledge
brv curate "JWT tokens expire in 24h, stored in httpOnly cookies" -f src/auth.ts
```

**B. Automatic (Context Engine Plugin)**
When the ByteRover plugin is installed:
- **`assemble`** (before each prompt): Auto-runs `brv query`, injects as `systemPromptAddition`
- **`afterTurn`** (after each run): Auto-runs `brv curate` to store conversation

### CLI Commands Reference

| Command | Purpose |
|---------|---------|
| `brv query "question"` | Retrieve knowledge from context tree |
| `brv curate "context" [-f file]` | Store knowledge with optional file refs (max 5) |
| `brv curate view` | View curation history |
| `brv push` / `brv pull` | Sync with cloud |
| `brv status` | Check setup and provider status |
| `brv providers connect <id>` | Connect LLM provider |
| `brv model switch <model>` | Switch active model |

---

## 4. LLM Provider Options

### Free Tier (Limited Credits)
- **ByteRover built-in** — No API key needed, but limited free credits

### Recommended: Google AI Studio (Gemini)
✅ **Selected as preferred provider**  
- Free tier available
- ByteRover native support: `google` provider
- Default model: `gemini-2.5-flash`
- Recommended models: `gemini-2.5-pro`, `gemini-3.1-pro`, `gemini-3.1-flash`

### Alternative: OpenCode Go (Partial Support)
| Model | Via OpenCode Go | Works with ByteRover? |
|-------|-----------------|----------------------|
| **MiniMax M2.7** | Anthropic Messages API | ❌ No — ByteRover's `openai-compatible` needs OpenAI format |
| GLM-5 | OpenAI-compatible endpoint | ✅ Maybe — try `openai-compatible` provider |
| Kimi K2.5 | OpenAI-compatible endpoint | ✅ Maybe — try `openai-compatible` provider |

**Note:** OpenCode Go not directly supported. Use native providers instead.

### Other Supported Providers (18 total)
| Provider | ID | API Key Source |
|----------|-----|----------------|
| Anthropic | `anthropic` | `ANTHROPIC_API_KEY` |
| OpenAI | `openai` | `OPENAI_API_KEY` |
| **Google** | `google` | `GOOGLE_API_KEY` or `GEMINI_API_KEY` |
| xAI (Grok) | `xai` | `XAI_API_KEY` |
| Groq | `groq` | `GROQ_API_KEY` |
| Mistral | `mistral` | `MISTRAL_API_KEY` |
| DeepInfra | `deepinfra` | `DEEPINFRA_API_KEY` |
| Cohere | `cohere` | `COHERE_API_KEY` |
| Together AI | `togetherai` | `TOGETHER_API_KEY` |
| Perplexity | `perplexity` | `PERPLEXITY_API_KEY` |
| Cerebras | `cerebras` | `CEREBRAS_API_KEY` |
| Vercel | `vercel` | `VERCEL_API_KEY` |
| MiniMax | `minimax` | `MINIMAX_API_KEY` |
| GLM (Z.AI) | `glm` | `ZHIPU_API_KEY` |
| Moonshot AI | `moonshot` | `MOONSHOT_API_KEY` |
| OpenAI Compatible | `openai-compatible` | `OPENAI_COMPATIBLE_API_KEY` |

---

## 5. Setup Requirements

### Prerequisites
- Node.js installed
- OpenClaw CLI (`openclaw`)
- Clawhub (`clawhub`)
- ByteRover CLI (`brv`)

### Installation Commands
```bash
# Install ByteRover CLI
curl -fsSL https://www.byterover.dev/install.sh | sh

# Run OpenClaw integration setup
curl -fsSL https://byterover.dev/openclaw-setup.sh | sh
```

### Configure Google AI Studio (Preferred)
```bash
# Set environment variable (already in secrets.json)
export GOOGLE_API_KEY="your-key-here"

# Connect provider
brv providers connect google

# Switch to preferred model
brv model switch gemini-2.5-pro
```

---

## 6. OpenClaw Configuration Changes

When running the setup script, the following config changes are made to `~/.openclaw/openclaw.json`:

### 1. Context Engine Plugin
```json
{
  "plugins": {
    "entries": {
      "byterover": {
        "enabled": true,
        "config": {
          "brvPath": "/custom/path/to/brv"
        }
      }
    },
    "allow": ["byterover"],
    "slots": {
      "contextEngine": "byterover"
    }
  }
}
```

### 2. Memory Flush (Optional)
```json
{
  "agents": {
    "defaults": {
      "compaction": {
        "reserveTokensFloor": 50000,
        "memoryFlush": {
          "enabled": true,
          "softThresholdTokens": 4000,
          "prompt": "Review session for architectural decisions, bug fixes, or new patterns. If found, run 'brv curate \"<summary>\"'..."
        }
      }
    }
  }
}
```

### 3. Daily Knowledge Mining (Optional)
Schedules cron job at 9:00 AM daily to extract patterns from session notes.

---

## 7. Migration Path (If Switching)

### Phase 1: Install & Configure
1. Install ByteRover CLI
2. Run OpenClaw setup script
3. Connect Google AI Studio provider
4. Test `brv query` and `brv curate` commands

### Phase 2: Migrate Existing Memory
```bash
cd ~/.openclaw/workspace
brv curate "curate the data in the folder ~/.openclaw/workspace/memory by reviewing each file one by one."
```

### Phase 3: Parallel Operation (Optional)
- Use **ByteRover** for structured agent knowledge
- Keep **Honcho** for cross-channel user profile

### Phase 4: Full Switch (Optional)
- Disable `openclaw-honcho` plugin
- Rely entirely on ByteRover context tree

---

## 8. Open Questions & Considerations

1. **Cross-Channel Memory** — Will we lose seamless Telegram/Discord unified profile if we drop Honcho?
2. **Usage Limits** — How quickly will Google AI Studio free tier be exhausted with ByteRover curation?
3. **Migration Effort** — How much existing Honcho memory is worth migrating vs starting fresh?
4. **Hybrid Approach** — Can we effectively use both systems for different purposes?

---

## 9. Multi-Agent Memory Sync Architecture

### How Subagent Memory Works

| Scenario | Curate Called? | Context Tree Location |
|----------|----------------|----------------------|
| **Main agent (Ceil)** | ✅ Yes | `~/.openclaw/workspace/.brv/context-tree/` |
| **Subagent with inherited config** | ✅ Yes | Uses same workspace |
| **Subagent with isolated workspace** | ✅ Yes | `~/.openclaw/workspace-/.brv/context-tree/` (separate) |
| **Subagent `mode: run`** (one-shot) | ✅ At completion | Own context tree |
| **Subagent `mode: session`** (persistent) | ✅ After each turn | Own context tree |

**Critical Issue:** Each workspace has its **own isolated** `.brv/context-tree/`. Subagent knowledge does NOT automatically sync to parent agent.

### Cloud-Based Shared Memory Solution

ByteRover provides **team/space** architecture for multi-agent memory sharing:

```
Team (e.g., "ceil-labs")
├── Space: "main-agent"        # Ceil's workspace
├── Space: "subagent-pool"     # Shared subagent memory
└── Space: "production"        # Production deployment memory
```

### Cloud Sync Commands

| Command | Purpose |
|---------|---------|
| `brv push` | Upload local context tree to cloud |
| `brv push --branch feature-x` | Push to named branch |
| `brv pull` | Download cloud context tree to local |
| `brv pull --branch feature-x` | Pull from named branch |
| `brv space list` | List available teams and spaces |
| `brv space switch --team <team> --name <space>` | Switch to shared space |

### Multi-Agent Sync Workflows

**Option A: Shared Cloud Space (Recommended)**
```bash
# All agents connect to same space
brv login --api-key brv_your_key
brv space switch --team ceil-labs --name shared-memory

# Agent 1 curates
brv curate "New pattern discovered..."
brv push

# Agent 2 pulls before work
brv pull
brv query "What patterns exist for...?"
```

**Option B: Explicit Handoff (Manual)**
```bash
# Subagent pushes final summary
brv curate "Final research summary: ..."
brv push

# Parent pulls
brv pull
# Or parent explicitly curates subagent output
brv curate "Subagent findings: $(cat subagent-output.md)"
```

**Option C: CI/CD Style (Detached)**
```bash
# Fire-and-forget curation
brv curate "Build passed: commit abc1234" --detach --format json
```

### Authentication & Setup for Teams

```bash
# 1. Get API key from app.byterover.dev/settings/keys
brv login --api-key brv_your_api_key

# 2. List available teams/spaces
brv space list

# Example output:
# 1. human-resources-team (team)
#    - a-department (space)
#    - b-department (space)
# 2. ceil-labs (team)
#    - main (space)
#    - subagents (space)

# 3. Switch to shared space
brv space switch --team ceil-labs --name main

# 4. Configure in CI/CD (non-interactive)
brv login --api-key $BYTEROVER_API_KEY --format json
brv space switch --team ceil-labs --name production --format json
```

### Branching Strategy (Like Git)

ByteRover supports **branching** for context trees:

```bash
# Push to feature branch
brv push --branch feature-auth-refactor

# Pull specific branch
brv pull --branch feature-auth-refactor

# Main branch (default)
brv push  # same as --branch main
brv pull  # same as --branch main
```

**Use case:**
- `main` — Production memory
- `feature-x` — Experimental agent behavior
- `research` — Long-running research projects

### Comparison: ByteRover Cloud vs Honcho Cross-Channel

| Feature | ByteRover Cloud | Honcho |
|---------|-----------------|--------|
| **Sync model** | Explicit push/pull | Automatic, always-on |
| **Scope** | Team/space based | User-based (cross-channel) |
| **Conflict resolution** | Last-write-wins (like Git) | N/A (single source) |
| **Offline support** | ✅ Yes — work local, sync later | ❌ No — requires API |
| **Multi-agent** | ✅ Designed for it | ✅ Transparent |
| **Version control** | ✅ Yes — branch/rollback | ❌ No |
| **Setup complexity** | Medium (login + space switch) | Low (plugin auto-config) |

### Recommendation for Multi-Agent Setup

**Hybrid Architecture:**

| Component | Memory System | Rationale |
|-----------|---------------|-----------|
| **Ceil (main)** | ByteRover + Honcho | Structured knowledge + user profile |
| **Neo** | ByteRover (same space) | Shared context with Ceil |
| **Subagents** | ByteRover (push/pull) | Curate to shared space on completion |
| **User profile** | Honcho | Cross-channel continuity |

**Sync Workflow:**
1. Subagent spawns with isolated workspace
2. Subagent completes task, curates findings
3. Subagent pushes to shared space
4. Parent agent pulls before next interaction
5. OR parent explicitly queries shared space

---

## 10. Recommendation

**Short-term:** Keep Honcho active. Set up ByteRover in parallel using Google AI Studio for evaluation.

**Multi-agent strategy:** Use ByteRover's team/space feature with explicit push/pull sync. Consider:
- One shared space for Ceil + Neo
- Subagents push to shared space on completion
- Keep Honcho for user profile (cross-channel)

**Decision criteria for full switch:**
- [ ] ByteRover retrieval accuracy noticeably better in practice
- [ ] Structured curation provides measurable value over passive capture
- [ ] Google AI Studio limits acceptable or budget for upgrade available
- [ ] Multi-agent sync workflow tested and reliable
- [ ] Cross-channel profile loss acceptable or mitigated

---

## References

- [ByteRover OpenClaw Integration Docs](https://docs.byterover.dev/autonomous-agents/openclaw)
- [ByteRover Blog: Curated Stateful Memory](https://www.byterover.dev/blog/curated-stateful-local-memory-for-openclaw)
- [ByteRover CLI Reference](https://docs.byterover.dev/reference/cli-reference)
- [ByteRover External LLM Providers](https://docs.byterover.dev/external-llm-providers/overview)
- [OpenCode Go Docs](https://opencode.ai/docs/go)
- [OpenClaw PR #43920 — ByteRover Context Engine](https://github.com/openclaw/openclaw/pull/43920)
- [FunBlocks ByteRover Review](https://www.funblocks.net/aitools/reviews/byterover-memory-system-for-openclaw)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-03-25 | Initial research complete; Google AI Studio selected as preferred provider |
| 2026-03-25 | Multi-agent memory sync architecture documented (team/space, push/pull, branching) |
