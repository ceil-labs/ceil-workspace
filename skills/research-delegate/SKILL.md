# Skill: research-delegate

**Purpose:** Conduct research using spawned sub-agents, summarize findings, and save to in-progress researches folder.

**Skill Name:** `research-delegate`

**Invocations:**
- `research <topic>` — Conduct research on a topic
- `research-delegate <topic>` — Same as above

---

## Overview

This skill implements a **DELEGATE-first** research workflow. When a user requests research on any topic, this skill:

1. Spawns a sub-agent to conduct deep research on the given topic
2. Waits for the sub-agent to complete its investigation
3. Summarizes the key findings
4. Saves the summary to the in-progress researches folder
5. Announces completion with the file path

---

## Design Philosophy

| Principle | Implementation |
|-----------|----------------|
| **DELEGATE First** | Always spawn sub-agent for research tasks |
| **Never Overwrite** | Append to existing files if they exist |
| **Clear Summaries** | Concise executive summary + detailed findings |
| **Error Handling** | Graceful failures with user notification |

---

## File Structure

```
skills/research-delegate/
├── SKILL.md              # This file
├── skill.yaml            # Skill specification
└── scripts/
    └── format-research.py # Helper for formatting research output
```

---

## Usage

### Basic Research Request

```
User: Can you research Gemini Embeddings 2 configuration?

Skill:
1. Spawns sub-agent with research task
2. Waits for findings
3. Creates: researches/in-progress/2026-03-17-gemini-embeddings-2.md
4. Announces: "Research saved to researches/in-progress/2026-03-17-gemini-embeddings-2.md"
```

### Multi-Part Research

```
User: Research the differences between SQLite and QMD memory backends

Skill:
- Spawns sub-agent to investigate both backends
- Compares features, performance, use cases
- Saves comprehensive comparison
```

---

## Output Format

Research files are saved with this structure:

```markdown
# <Topic> Research

**Date:** YYYY-MM-DD  
**Status:** In Progress  
**Researcher:** Ceil (via subagent delegation)

---

## Executive Summary

[Brief 2-3 sentence overview of key findings]

---

## 1. [Section 1]

[Detailed findings]

## 2. [Section 2]

[Detailed findings]

---

## Sources

- [Source 1](url)
- [Source 2](url)
```

---

## Technical Details

### Sub-agent Configuration

| Parameter | Value |
|-----------|-------|
| Model | MiniMax (`opencode-go/minimax-m2.5`) |
| Mode | Run (one-shot) |
| Context | Research task with workspace access |

### File Path Convention

```
/home/openclaw/.openclaw/workspace/researches/in-progress/YYYY-MM-DD-topic-slug.md
```

- Topic is slugified (lowercase, spaces → hyphens)
- Date uses current UTC date
- Filename sanitized to be filesystem-safe

### Error Handling

| Scenario | Response |
|----------|----------|
| Empty topic | Prompt user for research topic |
| Sub-agent fails | Announce failure, suggest retry |
| File write fails | Announce error with details |
| Researches dir missing | Create directory structure |

---

## Integration

This skill is invoked automatically when:
- User says "research <topic>"
- User says "look up <topic>"
- User says "find information about <topic>"

The skill registers itself with the agent's skill registry and responds to these natural language patterns.

---

## Examples

### Example 1: Quick Research

```
User: Research Claude API rates

Skill: [Spawns subagent] → [Researches Claude API] → [Saves to 2026-03-17-claude-api-rates.md] → [Announces]
```

### Example 2: Complex Research

```
User: Research the best approach for implementing RAG with SQLite

Skill: [Spawns subagent with detailed context] → [Deep research] → [Comprehensive report saved]
```

---

## Dependencies

- **Subagent spawning:** Uses `exec` to spawn subagent session
- **File operations:** Uses `write` for saving research
- **Workspace access:** Requires access to `researches/in-progress/` directory

---

## Maintenance

To update this skill:
1. Modify `SKILL.md` for documentation changes
2. Update `skill.yaml` for capability changes
3. Test with a sample research request
