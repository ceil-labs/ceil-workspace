# Honcho Self-Hosting Integration Guide

**Source:** https://github.com/plastic-labs/honcho  
**Research Date:** 2026-03-27  
**Status:** Ready for integration

---

## What is Honcho?

Honcho is a **user memory/conclusions management system** for AI agents. It stores user interactions, derives conclusions automatically, and enables semantic search over past conversations.

**Key difference from session storage:** Cross-session persistence with automatic derivation and dialectic reasoning.

---

## Architecture

```
Workspace (tenant/app)
  └── Peer (user)
        ├── Sessions (conversations)
        │     └── Messages
        ├── Documents (conclusions/memories)
        └── Collections (peer relationships)
```

**Core primitives:**
- **Workspace** — Top-level container (maps to your Rails app)
- **Peer** — A user (has metadata, configuration)
- **Session** — Conversation thread
- **Message** — Individual messages (with vector embeddings)
- **Document** — Derived conclusions (explicit or AI-derived)
- **Collection** — Tracks who observes whom

---

## Self-Hosting Requirements

### Stack
- Python 3.13 (FastAPI)
- PostgreSQL 15+ with `pgvector` extension
- Redis (optional, for caching)

### Environment Variables
```bash
# Database
DB_CONNECTION_URI=postgresql+psycopg://honcho:honcho@postgres:5432/honcho

# LLM Providers (choose what you use)
LLM_ANTHROPIC_API_KEY=sk-...
LLM_OPENAI_API_KEY=sk-...
LLM_GOOGLE_API_KEY=...
LLM_VLLM_BASE_URL=http://your-llm-server:8000  # For self-hosted

# Embeddings
LLM_EMBEDDING_PROVIDER=openai  # or gemini

# Deriver (auto-generate conclusions from messages)
DERIVER_ENABLED=true
DERIVER_PROVIDER=google
DERIVER_MODEL=gemini-2.5-flash-lite

# Auth (optional)
AUTH_USE_AUTH=false
# AUTH_JWT_SECRET=your-secret
```

---

## Docker Compose Service

```yaml
services:
  honcho:
    image: ghcr.io/plastic-labs/honcho:latest
    # OR build from source
    # build:
    #   context: ./honcho
    #   dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - DB_CONNECTION_URI=postgresql+psycopg://honcho:honcho@postgres:5432/honcho
      - LLM_ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - LLM_OPENAI_API_KEY=${OPENAI_API_KEY}
      - LLM_EMBEDDING_PROVIDER=openai
      - DERIVER_ENABLED=true
      - AUTH_USE_AUTH=false
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/openapi.json')"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  # Use same PostgreSQL as Rails but separate database
  postgres:
    image: ankane/pgvector:latest  # Already using this for Rails
    # Honcho will use 'honcho' database, Rails uses 'app_development'
```

---

## Rails Integration (HTTP REST)

**No Ruby SDK** — use HTTP client:

```ruby
# config/initializers/honcho.rb
require 'faraday'

class HonchoClient
  BASE_URL = ENV['HONCHO_BASE_URL'] || 'http://localhost:8000'

  def initialize(api_key: nil)
    @conn = Faraday.new(url: BASE_URL) do |f|
      f.request :json
      f.response :json
      f.adapter Faraday.default_adapter
      f.headers['Authorization'] = "Bearer #{api_key}" if api_key
    end
  end

  def get_or_create_workspace(workspace_id:)
    @conn.post("/v1/workspaces", { id: workspace_id }).body
  end

  def create_peer(workspace_id:, peer_id:, name:, metadata: {})
    @conn.post("/v1/workspaces/#{workspace_id}/peers", {
      id: peer_id,
      name: name,
      metadata: metadata
    }).body
  end

  def store_conclusion(workspace_id:, peer_id:, content:, level: 'explicit')
    @conn.post("/v1/workspaces/#{workspace_id}/peers/#{peer_id}/conclusions", {
      content: content,
      level: level  # 'explicit', 'deductive', etc.
    }).body
  end

  def search_conclusions(workspace_id:, peer_id:, query:, limit: 5)
    @conn.post("/v1/workspaces/#{workspace_id}/peers/#{peer_id}/conclusions/search", {
      query: query,
      limit: limit
    }).body
  end

  def create_session(workspace_id:, session_name:)
    @conn.post("/v1/workspaces/#{workspace_id}/sessions", {
      name: session_name
    }).body
  end

  def add_message(workspace_id:, session_id:, peer_id:, content:)
    @conn.post("/v1/workspaces/#{workspace_id}/sessions/#{session_id}/messages", {
      peer_id: peer_id,
      content: content
    }).body
  end

  def get_peer_card(workspace_id:, peer_id:)
    @conn.get("/v1/workspaces/#{workspace_id}/peer-card", { peer_id: peer_id }).body
  end
end
```

---

## Example Workflows

### 1. Store User Conclusion After Conversation
```ruby
honcho = HonchoClient.new

# Setup (one-time)
honcho.get_or_create_workspace(workspace_id: 'my-app')
honcho.create_peer(workspace_id: 'my-app', peer_id: 'user-123', name: 'Victor')

# Store conclusion
honcho.store_conclusion(
  workspace_id: 'my-app',
  peer_id: 'user-123',
  content: 'Victor prefers deep technical explanations over quick answers',
  level: 'deductive'
)
```

### 2. Query Relevant Past Conclusions
```ruby
# Before responding, search relevant memories
results = honcho.search_conclusions(
  workspace_id: 'my-app',
  peer_id: 'user-123',
  query: 'learning style communication preferences',
  limit: 3
)

# results['documents'] contains matched conclusions with relevance scores
```

### 3. Full Conversation Flow
```ruby
# Create session
session = honcho.create_session(workspace_id: 'my-app', session_name: 'chat-001')

# Store user message
honcho.add_message(
  workspace_id: 'my-app',
  session_id: session['id'],
  peer_id: 'user-123',
  content: 'How does this work?'
)

# Retrieve relevant memories
memories = honcho.search_conclusions(
  workspace_id: 'my-app',
  peer_id: 'user-123',
  query: 'how does this work'
)

# Generate response using memories as context...

# Store assistant response
honcho.add_message(
  workspace_id: 'my-app',
  session_id: session['id'],
  peer_id: 'assistant',
  content: response_text
)
```

---

## Database Considerations

**Can share PostgreSQL with Rails:**
- Rails uses database: `app_development` / `app_production`
- Honcho uses database: `honcho`
- Same PostgreSQL instance, different databases
- Both need `pgvector` extension (already included in `ankane/pgvector`)

**Separate instance alternative:**
- More isolation
- Independent backup/restore
- Slightly more resource usage

**Recommendation:** Same PostgreSQL instance, separate databases.

---

## LLM Configuration

### External APIs (for now)
```bash
LLM_ANTHROPIC_API_KEY=sk-...
LLM_OPENAI_API_KEY=sk-...
LLM_GOOGLE_API_KEY=...
```

### Self-Hosted vLLM (future)
```bash
LLM_VLLM_BASE_URL=http://your-gpu-server:8000
LLM_VLLM_API_KEY=optional
```

**Embeddings:**
- Default: OpenAI `text-embedding-3-small` (1536 dimensions)
- Alternative: Gemini, OpenRouter

**Deriver (auto-generate conclusions):**
- Enabled by default
- Processes message batches → extracts observations → creates documents
- Can disable if you prefer manual conclusion storage

---

## Integration Notes

### With Rails Agent System
1. **Initialize on app boot:** Create workspace, register agent as peer
2. **Per session:** Create Honcho session, store messages
3. **Before LLM call:** Search relevant conclusions, inject into prompt
4. **After response:** Store any new conclusions derived from conversation

### With n8n
- n8n can call Honcho API via HTTP Request node
- Store workflow results as conclusions
- Trigger workflows based on new conclusions

---

## Blockers/Considerations

| Item | Status | Notes |
|------|--------|-------|
| Ruby SDK | ❌ None | Use HTTP REST (simple) |
| Self-hosted LLM | ✅ Supported | vLLM compatible |
| Vector dimensions | ⚠️ Fixed | 1536 default (OpenAI), customizable |
| Database sharing | ✅ Supported | Separate DB on same Postgres |
| Scaling | ✅ Horizontal | Stateless API, Postgres handles persistence |

---

## Next Steps

1. [ ] Add Honcho service to Docker Compose
2. [ ] Create `HonchoClient` wrapper in Rails
3. [ ] Integrate into Agent session flow
4. [ ] Test conclusion storage and retrieval
5. [ ] Configure deriver settings
