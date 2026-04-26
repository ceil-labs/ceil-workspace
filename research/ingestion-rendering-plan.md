# Ingestion + Rendering Plan — Karpathy Memory System (Scoped)

**Document:** `workspace/research/ingestion-rendering-plan.md`  
**Date:** 2026-04-26  
**Scope:** Ingestion + Rendering only. No wiki, no compaction, no L2.

---

## Executive Summary

Build a Dockerized TypeScript app that ingests documents (PDF, Markdown, Text, URL) and stores them as:
1. **Raw source markdown** — human-readable, full document
2. **Chunks + vector embeddings** — for semantic search

Data lives in PostgreSQL (pgvector) with clear source→chunk linkages for future updates.

---

## Tech Stack

| Layer | Choice | Why |
|-------|--------|-----|
| **Embedding** | `gemini-embedding-2` @ 768 dims | Multimodal, 8K context, cheapest production option |
| **Vector DB** | PostgreSQL + pgvector | One DB (existing), FTS + vector + hybrid in one query |
| **Language** | TypeScript / Node.js 20 | Victor's preference |
| **Framework** | Express.js | Lightweight, proven |
| **ORM** | Drizzle ORM | Type-safe, Postgres-native |
| **Docker** | `pgvector/pgvector:pg16` + Node app | Single compose |
| **Auth** | `GOOGLE_API_KEY` from `secrets.json` | Same key for embed + generate |

---

## Architecture

```
┌─────────────────────────────────────────────┐
│  INPUT                                      │
│  PDF / Markdown / Text / URL               │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  EXTRACT                                    │
│  pdf-parse / cheerio / fs.readFile         │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  OPTIONAL: LLM REFORMAT                     │
│  (Gemini 3.1 Flash — same API key)         │
│  Raw text → proper markdown                │
│  Applies to: PDF (always), Web (optional)  │
│  Skipped for: Markdown, Text                 │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  STORE RAW SOURCE                           │
│  raw/{source-id}/full.md                     │
│  raw/{source-id}/processed.md (if LLM used)  │
│  Record in `sources` table                   │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  CHUNK                                      │
│  Recursive splitter, ~400 tokens, 15% overlap│
│  Source: processed.md (if exists) else full.md│
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  EMBED                                      │
│  gemini-embedding-2, 768 dims, batch of 5  │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  STORE CHUNKS                               │
│  Postgres: content + embedding               │
│  Disk: chunks/{source-id}/{n}.md            │
│  Record in `chunks` table (FK → sources)    │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│  RENDER                                     │
│  GET /sources — list all                    │
│  GET /sources/:id — view full markdown      │
│  GET /sources/:id/chunks — list chunks      │
│  GET /chunks/:id — view single chunk        │
│  POST /search — semantic search             │
└─────────────────────────────────────────────┘
```

---

## Data Model

### `sources` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Source identifier |
| `source_type` | TEXT | `pdf` \| `md` \| `text` \| `web` |
| `source_url` | TEXT | Filename or URL |
| `raw_path` | TEXT | Path to `raw/{id}/full.md` |
| `processed_path` | TEXT \| NULL | Path to `raw/{id}/processed.md` (if LLM reformatted) |
| `title` | TEXT | Document title (extracted or generated) |
| `created_at` | TIMESTAMPTZ | First ingest |
| `updated_at` | TIMESTAMPTZ | Last update (re-ingest) |

### `chunks` table

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID PK | Chunk identifier |
| `source_id` | UUID FK → sources.id | Parent source |
| `chunk_index` | INT | Position in source (0, 1, 2, ...) |
| `total_chunks` | INT | Total chunks for this source |
| `chunk_path` | TEXT | Path to `chunks/{source-id}/{n}.md` |
| `content` | TEXT | The chunk text |
| `embedding` | VECTOR(768) | 768-dim float32 vector |
| `ingested_at` | TIMESTAMPTZ | When chunk was created |

### File System Layout

```
data/
├── raw/
│   └── {source-id}/
│       ├── full.md              # Raw extracted text
│       └── processed.md         # LLM-reformatted markdown (optional)
│
└── chunks/
    └── {source-id}/
        ├── 001.md
        ├── 002.md
        └── ...
```

### Chunk Markdown Header

```markdown
---
source_id: 550e8400-e29b-41d4-a716-446655440000
source_type: pdf
source_url: annual-report-2025.pdf
chunk_index: 2
total_chunks: 8
chunk_of: processed   # or "raw"
---

[chunk content here]
```

---

## Source Type Handling

| Source | Extractor | LLM Reformat | Chunk Source |
|--------|-----------|-------------|--------------|
| **PDF** | `pdf-parse` | **Yes** (always) | `processed.md` |
| **Markdown** | `fs.readFile` + strip frontmatter | **No** | `full.md` (original) |
| **Text** | `fs.readFile` | **No** | `full.md` (original) |
| **URL/Web** | `fetch` + `cheerio` (main content) | Optional (configurable) | `processed.md` if reformatted, else `full.md` |

---

## Update Behavior (Future-Proofed)

When a source is re-ingested or updated:

```typescript
async function updateSource(sourceId: string, newContent: string): Promise<void> {
  // 1. Update source record
  await db.update('sources', sourceId, {
    raw_path: newRawPath,
    processed_path: newProcessedPath || null,
    updated_at: new Date(),
  });
  
  // 2. Delete all old chunks (cascade delete via FK)
  await db.delete('chunks', { source_id: sourceId });
  await fs.rm(`chunks/${sourceId}/`, { recursive: true });
  
  // 3. Re-chunk from latest source content
  const source = await db.get('sources', sourceId);
  const sourceText = source.processed_path 
    ? await fs.readFile(source.processed_path, 'utf8')
    : await fs.readFile(source.raw_path, 'utf8');
  
  const chunks = chunker.split(sourceText);
  const embeddings = await embedBatch(chunks);
  
  // 4. Store new chunks
  await storeChunks(sourceId, chunks, embeddings);
}
```

**Key invariant:** Chunks are always derived from the latest source content. On any update, old chunks are wiped and regenerated atomically via `source_id` linkage.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/ingest` | Ingest a document (multipart form: file or URL) |
| `GET` | `/sources` | List all sources (id, title, type, url, chunk_count) |
| `GET` | `/sources/:id` | View full source markdown (processed if exists, else raw) |
| `GET` | `/sources/:id/chunks` | List all chunks for a source (paginated) |
| `GET` | `/chunks/:id` | View single chunk (content + metadata) |
| `POST` | `/search` | Semantic search (text query → embed → ANN) |

---

## Docker Compose

```yaml
version: "3.8"
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_USER: memory
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: karpathy_memory
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"

  app:
    build:
      context: .
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgres://memory:${POSTGRES_PASSWORD}@postgres:5432/karpathy_memory
      GOOGLE_API_KEY: ${GOOGLE_API_KEY}
      DATA_DIR: /app/data
    volumes:
      - ./data:/app/data
    ports:
      - "3000:3000"
    depends_on:
      - postgres

volumes:
  pgdata:
```

---

## File Structure

```
karpathy-ingest/
├── docker-compose.yml
├── Dockerfile
├── init.sql                     # Postgres schema
├── .env.example                 # Template for env vars
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts                 # Express server setup
│   ├── db/
│   │   ├── schema.ts            # Drizzle schema definitions
│   │   └── client.ts            # Drizzle client setup
│   ├── routes/
│   │   ├── ingest.ts            # POST /ingest
│   │   ├── sources.ts           # GET /sources, GET /sources/:id
│   │   ├── chunks.ts            # GET /sources/:id/chunks, GET /chunks/:id
│   │   └── search.ts            # POST /search
│   ├── services/
│   │   ├── embedding.ts         # Gemini embed client
│   │   ├── generate.ts          # Gemini generate client (LLM reformat)
│   │   ├── extractor.ts         # PDF/MD/Text/URL extractors
│   │   ├── chunker.ts           # Recursive text splitter
│   │   └── store.ts             # File system + DB operations
│   └── types.ts
└── data/                        # Runtime data (gitignored)
    ├── raw/
    └── chunks/
```

---

## Cost Estimates

| Component | Monthly Cost |
|-----------|-------------|
| Gemini embeddings | $3-15 (personal scale) |
| Gemini generation (LLM reformat) | $10-20 (100 PDFs/day) |
| Infrastructure | $0 (existing VPS) |
| **Total** | **$13-35** |

---

## Implementation Order

1. **Setup:** Docker compose, Drizzle schema, DB client
2. **Extractors:** PDF, MD, Text, URL
3. **Chunker:** Recursive splitter
4. **Embedding service:** Gemini client, batch API
5. **Ingest route:** File upload → extract → optional LLM reformat → chunk → embed → store
6. **Source routes:** List, view full markdown
7. **Chunk routes:** List for source, view single
8. **Search route:** Embed query → ANN search → return chunks
9. **Tests:** End-to-end ingest + render + search

---

## Deferred to Later Phases

- ❌ L2 wiki compilation
- ❌ LLM summarization during ingest
- ❌ Daily compaction / eviction
- ❌ FTS / hybrid search
- ❌ Multi-agent scoping
- ❌ Redis queue for async processing
- ❌ Web UI (just API for now)

---

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-04-26 | Scope: ingestion + rendering only | Victor directive |
| 2026-04-26 | DB: PostgreSQL + pgvector (not Qdrant) | One DB, existing infrastructure, FTS + vector in one query |
| 2026-04-26 | Embedding: gemini-embedding-2 @ 768 dims | Latest model, multimodal, cheapest, 97-99% quality vs 3072 |
| 2026-04-26 | Two outputs per ingest: raw source + chunks | Raw for reading, chunks for search |
| 2026-04-26 | LLM reformat: yes for PDF, no for MD/Text, optional for Web | MD already structured; PDF always needs it |
| 2026-04-26 | LLM model for reformat: gemini-3.1-flash | Fast, cheap, same API key |
| 2026-04-26 | Chunking: recursive, 400 tokens, 15% overlap | Standard, configurable |
| 2026-04-26 | ORM: Drizzle | Type-safe, modern, Postgres-native |

---

*Plan captured. Ready to scaffold.*
