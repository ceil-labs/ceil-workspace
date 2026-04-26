import { QdrantClient } from '@qdrant/js-client-rest';

const qdrant = new QdrantClient({
  url: process.env.QDRANT_URL ?? 'http://localhost:6333',
  apiKey: process.env.QDRANT_API_KEY,
});

const COLLECTION_NAME = 'karpathy_memory';

export async function initCollection(): Promise<void> {
  const collections = await qdrant.getCollections();
  const exists = collections.collections.some(c => c.name === COLLECTION_NAME);

  if (!exists) {
    await qdrant.createCollection(COLLECTION_NAME, {
      vectors: {
        size: 768,
        distance: 'Cosine',
      },
      // Optional: sparse vector for hybrid search
      // sparse_vectors: {
      //   sparse: {
      //     index: { on_disk: true },
      //   },
      // },
    });
    console.log(`Collection '${COLLECTION_NAME}' created.`);
  }
}

export async function upsertChunks(
  chunks: Array<{
    id: string;
    vector: number[];
    payload: Record<string, unknown>;
  }>
): Promise<void> {
  await qdrant.upsert(COLLECTION_NAME, {
    wait: true,
    points: chunks.map(chunk => ({
      id: chunk.id,
      vector: chunk.vector,
      payload: chunk.payload as Record<string, unknown>,
    })),
  });
}

export async function searchMemory(
  queryVector: number[],
  agentId: string,
  dayTag?: string,      // YYYY-MM-DD for date-scoped
  topK = 10
): Promise<Array<{ id: string; score: number; payload: Record<string, unknown> }>> {
  const filter: Record<string, unknown> = {
    must: [
      { key: 'agentId', match: { value: agentId } },
    ],
  };

  if (dayTag) {
    filter.must.push({ key: 'dayTag', match: { value: dayTag } });
  }

  const results = await qdrant.search(COLLECTION_NAME, {
    vector: queryVector,
    limit: topK,
    filter,
    with_payload: true,
    score_threshold: 0.7,  // Only return results with >0.7 cosine similarity
  });

  return results.map(r => ({
    id: r.id as string,
    score: r.score,
    payload: r.payload as Record<string, unknown>,
  }));
}

export async function deleteByAgentId(agentId: string): Promise<void> {
  await qdrant.delete(COLLECTION_NAME, {
    filter: { must: [{ key: 'agentId', match: { value: agentId } }] },
  });
}
```

### 6.3 Ingestion Pipeline

```typescript
// src/pipeline/ingest.ts
import { embedBatch } from '../services/embedding.js';
import { upsertChunks } from '../services/vectorstore.js';
import { parseDocument } from '../extractors/parser.js';
import { recursiveChunk } from '../extractors/chunker.js';
import { writeWikiPage } from '../services/wiki.js';
import { v4 as uuidv4 } from 'uuid';

export interface IngestOptions {
  agentId: string;
  source: string;
  sourceType: 'pdf' | 'markdown' | 'web' | 'transcript' | 'manual';
  chunkSizeTokens?: number;
  overlapTokens?: number;
  writeToWiki?: boolean;  // Whether to update L2 wiki during ingest
}

export async function ingestDocument(
  content: string | Buffer,
  options: IngestOptions
): Promise<{ chunksIndexed: number; wikiUpdated: boolean }> {
  const {
    agentId,
    source,
    sourceType,
    chunkSizeTokens = 400,
    overlapTokens = 60,
    writeToWiki = true,
  } = options;

  // 1. Parse document to plain text
  const text = typeof content === 'string'
    ? content
    : await parseDocument(content, sourceType);

  // 2. Chunk into semantic units
  const chunks = recursiveChunk(text, chunkSizeTokens, overlapTokens);

  // 3. Embed all chunks (batch)
  const embeddings = await embedBatch(chunks);

  // 4. Build Qdrant points
  const dayTag = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const sessionId = uuidv4();

  const points = chunks.map((chunkText, i) => ({
    id: `${source}_${i}_${uuidv4()}`.slice(0, 64),
    vector: embeddings[i].values,
    payload: {
      text: chunkText,
      source,
      sourceType,
      agentId,
      ingestedAt: new Date().toISOString(),
      chunkIndex: i,
      totalChunks: chunks.length,
      dayTag,
      sessionId,
    },
  }));

  // 5. Upsert to Qdrant L1
  await upsertChunks(points);

  // 6. Optionally: compile summary → L2 wiki
  let wikiUpdated = false;
  if (writeToWiki) {
    const summaryPrompt = `Read the following document chunks and produce a concise summary:\n\n${chunks.slice(0, 3).join('\n\n---\n\n')}`;
    // Call LLM with summaryPrompt → wiki page update
    // writeWikiPage({ title: source, content: summary, dayTag });
    wikiUpdated = true;
  }

  return { chunksIndexed: chunks.length, wikiUpdated };
}

// Utility: recursive chunking with token-aware overlap
function recursiveChunk(text: string, chunkSizeTokens: number, overlapTokens: number): string[] {
  // Approximate: 1 token ≈ 4 chars
  const chunkSizeChars = chunkSizeTokens * 4;
  const overlapChars = overlapTokens * 4;

  // Split on paragraph boundaries first, then smaller
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = '';

  for (const para of paragraphs) {
    if ((current + para).length <= chunkSizeChars) {
      current += (current ? '\n\n' : '') + para;
    } else {
      if (current.trim()) chunks.push(current.trim());
      // Apply overlap
      current = current.slice(-overlapChars) + para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
```

---

## 7. Implementation Phases

### Phase 1: MVP (Week 1-2) — "Can it remember?"

| Component | Deliverable |
|---|---|
| **Setup** | `docker-compose.yml` with Qdrant + Node app |
| **Embedding** | Single-text + batch embedding via `@google/genai` |
| **Ingestion** | `POST /ingest` accepts raw text → chunk → embed → store |
| **Query** | `POST /query` accepts text → embed → ANN search → return top-5 chunks |
| **Vector DB** | Qdrant collection `karpathy_memory`, 768-dim, cosine distance |
| **Docker** | Multi-stage Dockerfile, `docker compose up` works on first try |

**Scope out:** L2 wiki, Redis queue, PDF parsing, multi-agent filtering. Just raw text in, semantically similar text out.

**Success criteria:** Ingest 10 paragraphs, query with a related question, get the right paragraph back.

---

### Phase 2: Production Ingestion (Week 3-4) — "Can it handle real documents?"

| Component | Deliverable |
|---|---|
| **Extractors** | PDF (`pdf-parse`), Markdown, Web (`cheerio`) |
| **Chunking** | Recursive character splitter with configurable size/overlap |
| **Metadata** | Full payload schema: source, agentId, dayTag, chunkIndex |
| **Filtering** | Query by agentId, dayTag, sourceType |
| **Batch API** | Accumulate 5 chunks per API call, rate-limit at 150 RPM |
| **Persistence** | Qdrant volume survives container restarts |

---

### Phase 3: Karpathy L2 Wiki (Week 5-6) — "Does it compound?"

| Component | Deliverable |
|---|---|
| **Wiki FS** | `wiki/` directory with `index.md`, `log.md`, `concepts/`, `entities/` |
| **Compilation** | After ingestion, LLM reads chunks → writes/updates wiki pages |
| **Index** | `index.md` auto-maintained: page titles + one-line summaries |
| **Query flow** | Embed query → L1 search → if miss or broad, consult `index.md` → load relevant wiki pages → compile into context |
| **Log** | `log.md` append-only record of every ingest, query, and wiki update |

**Key decision:** Wiki pages are LLM-generated markdown. The LLM is the "compiler" — it decides what to create, update, or merge.

---

### Phase 4: Tiered Memory + Compaction (Week 7-8) — "Does it self-maintain?"

| Component | Deliverable |
|---|---|
| **Redis queue** | Async background jobs for ingestion and compaction |
| **Compaction job** | Daily cron: summarize L1 chunks from same day → write to L2 wiki → evict old L1 vectors |
| **L1 retention** | Configurable (default 30 days), LRU eviction |
| **L2 indexing** | Wiki pages themselves get embedded into a separate Qdrant collection for semantic discovery |
| **Multi-agent** | `agentId` scoping throughout: per-agent collections or per-agent payload filters |

---

### Phase 5: Integration (Week 9+) — "Plugs into agent-platform"

| Component | Deliverable |
|---|---|
| **n8n node** | Custom n8n node for `ingestDocument` and `queryMemory` |
| **Rails service** | `MemoryService` class in agent-platform Rails app |
| **Webhook triggers** | Ingest endpoint callable from Rails/n8n workflows |
| **Observability** | Metrics: ingest throughput, query latency, L1 hit rate, L2 wiki size |

---

## 8. Cost Estimates

### Embedding API Costs (Google Gemini)

| Scale | Chunks/Month | Chars/Month | Cost |
|---|---|---|---|
| **Personal** | 30,000 | 60M | **$2.40** |
| **Small team** | 200,000 | 400M | **$16.00** |
| **Medium** | 1,000,000 | 2B | **$80.00** |
| **Large** | 10,000,000 | 20B | **$800.00** |

At $0.04 per 1M characters, this is negligible for personal use.

### Infrastructure Costs (VPS + Docker)

| Component | Spec | Monthly Cost |
|---|---|---|
| **VPS** (existing Hostinger) | KVM2, 4GB RAM | Already paid |
| **Qdrant** (same VPS) | Docker container | $0 extra |
| **Redis** (same VPS) | Docker container | $0 extra |
| **Storage** | 50GB SSD | Already paid |

**Total incremental cost: $0** — everything runs on the existing VPS.

### LLM Compilation Costs (L2 Wiki)

When the LLM reads chunks and writes wiki pages during ingestion:

| Operation | Tokens | Cost (MiniMax M2.5) |
|---|---|---|
| Compile 1 document (5 chunks → summary) | 5K input + 1K output | **$0.003** |
| Daily compaction (100 chunks → wiki update) | 20K input + 2K output | **$0.008** |

At Victor's current scale (maybe 50 docs/day), LLM compilation is **$5-15/month**.

### Summary

| Phase | Monthly Cost |
|---|---|
| **MVP (L1 only)** | $3-5 (embeddings) |
| **With L2 wiki** | $10-25 (embeddings + LLM compilation) |
| **Full production** | $20-50 (embeddings + LLM + Redis + monitoring) |

For comparison:
- Pinecone serverless: $0.10/GB stored + $0.001/query → $50-200/month at scale
- OpenAI embeddings (text-embedding-3): $0.02/1M tokens → 2× Gemini cost
- Weaviate Cloud: $25/month minimum

**Google Gemini embeddings are the cheapest production-grade option available.**

---

## 9. Key Decisions & Open Questions

### Decisions Made

| Decision | Choice | Rationale |
|---|---|---|
| Embedding model | `gemini-embedding-001` @ 768 dims | Best price/quality ratio; flexible dimensionality |
| Vector DB | Qdrant | Docker-native, fast, JSON filtering, Rust |
| Language | TypeScript/Node.js | Victor's stack preference; good SDK support |
| Chunking | Recursive character, 400 tokens | Preserves paragraph boundaries; configurable |
| L2 storage | Markdown files on disk | Zero overhead; human-readable; git-friendly |
| Dockerfile | Distroless multi-stage | Minimal CVE surface; production-ready |

### Open Questions (For Victor)

1. **L2 wiki storage:** Local disk (`./wiki` volume) or sync to GitHub/Obsidian vault?
2. **Multi-agent scope:** Per-agent Qdrant collections, or single collection with `agentId` filter?
3. **Real-time vs batch:** Should ingestion be synchronous (API call blocks) or queued (Redis + worker)?
4. **Compaction trigger:** Time-based (daily cron) or count-based (when L1 > N chunks)?
5. **LLM for compilation:** Use existing OpenClaw model configs, or direct API calls to MiniMax/GLM?

---

*Document saved to:* `~/.openclaw/workspace/research/google-embedding-karpathy-plan.md`
