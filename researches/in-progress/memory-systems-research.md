# Memory Systems Research - OpenClaw

**Date:** 2026-03-17  
**Status:** In Progress  
**Researcher:** Ceil (via subagent delegation)

---

## Executive Summary

This research investigates the relationship between Honcho, built-in SQLite memory, and QMD backends in OpenClaw, with specific focus on:
1. Whether memorySearch configuration affects Honcho
2. Multimodal support without QMD
3. QMD viability on CPU-only systems

**Key Finding:** SQLite backend + Gemini Embeddings 2 supports multimodal WITHOUT requiring QMD.

---

## 1. Honcho vs. memorySearch — Relationship

### Finding: They Are Separate Systems

| Aspect | Honcho Plugin | memorySearch (SQLite/QMD) |
|--------|---------------|---------------------------|
| **Type** | Cloud/Dialectic memory | Local file vector search |
| **Storage** | Honcho cloud or self-hosted Postgres | `~/.openclaw/memory/<agentId>.sqlite` |
| **Embeddings** | Uses LLM for dialectic reasoning | Configurable: Gemini, OpenAI, local |
| **Tools** | `honcho_recall`, `honcho_search`, `honcho_profile` | `memory_search`, `memory_get` |
| **Scope** | Cross-channel (WhatsApp, Telegram, etc.) | Workspace files only |

### Interoperability
- Both systems can run **simultaneously** without interference
- Honcho plugin "automatically exposes OpenClaw's `memory_search` and `memory_get` tools when a memory backend is configured"
- Setting `memorySearch.provider` does NOT affect Honcho functionality

---

## 2. Multimodal Support WITHOUT QMD

### Finding: YES — SQLite + Gemini Supports Multimodal

**Critical discovery:** Multimodal memory (images/audio) works with SQLite backend when using Gemini Embeddings 2.

### Configuration

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "gemini",
        "model": "gemini-embedding-2-preview",
        "extraPaths": ["~/media/images", "~/media/audio"],
        "multimodal": {
          "enabled": true,
          "modalities": ["image", "audio"],
          "maxFileBytes": 10000000
        },
        "fallback": "none"
      }
    }
  }
}
```

### Constraints
1. **Provider must be Gemini**: `gemini-embedding-2-preview` only
2. **Files must be in `extraPaths`**: Not default `MEMORY.md` or `memory/` files
3. **Fallback must be `"none"`**: No fallback provider while multimodal enabled
4. **Cloud processing**: Image/audio bytes uploaded to Gemini API for embedding (not local)

### Supported File Types
- **Images**: `.jpg`, `.jpeg`, `.png`, `.webp`, `.gif`, `.heic`, `.heif`
- **Audio**: `.mp3`, `.wav`, `.ogg`, `.opus`, `.m4a`, `.aac`, `.flac`

**Note:** `memory_get` still reads Markdown only; binary files are searchable but not returned as raw content.

---

## 3. QMD on CPU-Only Systems — Not Viable

### Performance Reality

| Metric | Value |
|--------|-------|
| Query time (t3.medium EC2) | ~3m40s |
| Timeout frequency | 12-second timeouts common |
| Model size per query | 328MB GGUF loaded fresh |
| Total models | ~2GB (embedding + reranker + query expansion) |
| CPU usage | Saturates all cores |

### Root Cause
QMD spawns a **fresh subprocess per search**, meaning:
- Models must be reloaded every time (no persistent caching)
- Cold start penalty on every query
- No warm-cache mechanism on CPU-only systems

### Workarounds (Limited Effectiveness)

1. **Faster QMD modes** (`memory.qmd.searchMode`):
   - `"search"` — BM25 + vectors (faster than "query")
   - `"vsearch"` — vector-only (fastest)
   - `"query"` — full hybrid with reranking (default, very slow)

2. **Disable embeddings**: `memory.qmd.update.embedInterval: 0` (BM25-only)

3. **Increase timeouts**: Just delays the problem; latency remains enormous

### Official Recommendation
From OpenClaw maintainers: Use **built-in SQLite backend with remote embeddings** (Gemini/OpenAI) instead of QMD on CPU-only systems.

---

## 4. Three Memory Systems Comparison

| System | Storage | Embeddings | Best For | CPU-Only VPS? |
|--------|---------|------------|----------|---------------|
| **Honcho** | Cloud/Postgres | LLM dialectic | Cross-channel memory, user modeling | ✅ Yes |
| **SQLite + Gemini** | Local SQLite | Gemini API (cloud) | File search, multimodal | ✅ **Recommended** |
| **SQLite + OpenAI** | Local SQLite | OpenAI API (cloud) | File search | ✅ Yes |
| **QMD** | Local GGUF | Local (node-llama-cpp) | BM25 + reranking | ❌ Too slow |

---

## Recommendations for VPS Setup

### Primary Configuration (No GPU)

```json
{
  "agents": {
    "defaults": {
      "memorySearch": {
        "provider": "gemini",
        "model": "gemini-embedding-2-preview",
        "outputDimensionality": 1536,
        "extraPaths": ["~/media/images", "~/media/audio"],
        "multimodal": {
          "enabled": true,
          "modalities": ["image", "audio"]
        },
        "fallback": "none"
      }
    }
  },
  "plugins": {
    "entries": {
      "openclaw-honcho": {
        "enabled": true,
        "config": {
          "apiKey": "${HONCHO_API_KEY}",
          "workspaceId": "openclaw"
        }
      }
    }
  }
}
```

### Why This Setup?

1. **SQLite backend**: Works out of box, no GPU needed
2. **Gemini Embeddings 2**: Cloud-based, no local CPU load
3. **1536 dimensions**: Best quality-to-cost ratio (per Google benchmarks)
4. **Multimodal enabled**: Images/audio via Gemini API
5. **Honcho alongside**: Separate cloud memory for cross-channel context

---

## Context Note: Skill Visibility Issue

**Issue reported:** Skill exists in Neo's workspace but not showing in `openclaw skills`.

**Possible causes to investigate:**
- Skills folder path mismatch (workspace-neo/skills vs shared skills)
- Plugin/skill registration delay
- Skill manifest format issue
- Workspace isolation (Neo vs shared skills)

**Next step:** Test skill creation and verify visibility across agents.

---

## References

- OpenClaw Memory Docs: https://docs.openclaw.ai/concepts/memory
- Gemini Embeddings 2: https://docs.cloud.google.com/vertex-ai/generative-ai/docs/models/gemini/embedding-2
- QMD GitHub: https://github.com/tobi/qmd
- OpenClaw Honcho Plugin: https://github.com/plastic-labs/openclaw-honcho

---

**Research completed via subagent delegation.**  
**Status:** Ready for implementation decisions.
