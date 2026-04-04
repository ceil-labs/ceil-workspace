# Hindsight + OpenCode-Go Setup Guide

A complete guide to running Hindsight as your memory system using OpenCode-Go as the LLM provider, optimized for VPS deployment without GPU.

---

## Overview

**Hindsight** is a memory engine that stores and retrieves structured facts extracted from your content via LLM. **OpenCode-Go** is a $5/month (first month) / $10/month subscription service providing access to open coding models via OpenAI-compatible API.

**Goal:** Replace ByteRover with Hindsight as Victor's single memory tool, using OpenCode-Go for LLM operations.

---

## Critical Questions Answered

### 1. EXACT env var for custom base URL in Hindsight
```
HINDSIGHT_API_LLM_BASE_URL
```
Use this when `HINDSIGHT_API_LLM_PROVIDER=openai` to point to any OpenAI-compatible endpoint.

### 2. Does Hindsight use the LLM for embeddings?
**No.** Hindsight generates embeddings internally via:
- **Local** (default): Uses `sentence-transformers` locally — CPU-only, no GPU needed
- Also supports: OpenAI, Cohere, TEI, LiteLLM

For your VPS without GPU, use the **local** provider (default). It runs a small embedding model (default: `BAAI/bge-small-en-v1.5`) on CPU.

### 3. PostgreSQL image with pgvector
```yaml
image: pgvector/pgvector:pg16  # Recommended - includes pgvector
# OR for TimescaleDB (includes pgvector):
# image: timescale/timescaledb:latest-pg16
```

### 4. RAM requirements for full stack (VPS without GPU)
| Component | RAM |
|-----------|-----|
| PostgreSQL + pgvector | 1-2 GB |
| Hindsight API | 512 MB - 1 GB |
| Hindsight Worker | 512 MB - 1 GB |
| **Total** | **2-4 GB** |

✅ Your VPS (Hostinger KVM2) should handle this comfortably.

### 5. OpenCode-Go API compatibility gotchas
- Uses **OpenAI-compatible endpoint**: `https://opencode.ai/zen/go/v1/chat/completions`
- **MiniMax models** use Anthropic-compatible endpoint: `https://opencode.ai/zen/go/v1/messages`
- Model IDs in config: `opencode-go/glm-5`, `opencode-go/kimi-k2.5`, etc.
- API key format: Bearer token from OpenCode Zen dashboard

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         VPS (no GPU)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Hindsight  │  │  Hindsight  │  │     PostgreSQL      │ │
│  │    API      │  │   Worker    │  │  + pgvector (pg16)  │ │
│  │  :8080      │  │  (async)    │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
         │                                        │
         │ REST API (retain/recall)               │ Data
         ▼                                        ▼
┌─────────────────┐                    ┌──────────────────────┐
│  Your App /    │                    │   Vector Storage     │
│  n8n / Rails   │                    │   + Knowledge Graph │
└─────────────────┘                    └──────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│                    OpenCode-Go Cloud                        │
│              LLM: GLM-5, Kimi K2.5, MiniMax...             │
│         Endpoint: opencode.ai/zen/go/v1/chat/completions    │
└─────────────────────────────────────────────────────────────┘
```

---

## 1. Working docker-compose.yml

```yaml
version: '3.8'

services:
  # PostgreSQL with pgvector extension
  postgres:
    image: pgvector/pgvector:pg16
    container_name: hindsight-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: hindsight
      POSTGRES_PASSWORD: ${HINDSIGHT_DB_PASSWORD:-change-me-in-production}
      POSTGRES_DB: hindsight
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hindsight -d hindsight"]
      interval: 10s
      timeout: 5s
      retries: 5
    deploy:
      resources:
        limits:
          memory: 2G

  # Hindsight API Service
  hindsight-api:
    image: ghcr.io/roc手中/hindsight:latest
    container_name: hindsight-api
    restart: unless-stopped
    command: api
    ports:
      - "8080:8080"
    environment:
      # Database
      HINDSIGHT_API_DATABASE_URL: postgresql://hindsight:${HINDSIGHT_DB_PASSWORD:-change-me-in-production}@postgres:5432/hindsight
      HINDSIGHT_API_DATABASE_SCHEMA: public
      
      # LLM Configuration - OpenCode-Go (OpenAI-compatible)
      HINDSIGHT_API_LLM_PROVIDER: openai
      HINDSIGHT_API_LLM_API_KEY: ${OPENCODE_API_KEY}
      HINDSIGHT_API_LLM_BASE_URL: https://opencode.ai/zen/go/v1
      HINDSIGHT_API_LLM_MODEL: opencode-go/glm-5
      
      # Embeddings - Local (CPU, no GPU needed)
      HINDSIGHT_API_EMBEDDINGS_PROVIDER: local
      HINDSIGHT_API_EMBEDDINGS_LOCAL_MODEL: BAAI/bge-small-en-v1.5
      
      # Optional: Per-operation model optimization
      # HINDSIGHT_API_RETAIN_LLM_MODEL: opencode-go/glm-5
      # HINDSIGHT_API_REFLECT_LLM_MODEL: opencode-go/minimax-m2.5
      
      # Vector extension
      HINDSIGHT_API_VECTOR_EXTENSION: pgvector
      
      # Run migrations on startup
      HINDSIGHT_API_RUN_MIGRATIONS_ON_STARTUP: "true"
    depends_on:
      postgres:
        condition: service_healthy
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 1G

  # Hindsight Worker (async operations, file processing)
  hindsight-worker:
    image: ghcr.io/roc手中/hindsight:latest
    container_name: hindsight-worker
    restart: unless-stopped
    command: worker
    environment:
      # Database
      HINDSIGHT_API_DATABASE_URL: postgresql://hindsight:${HINDSIGHT_DB_PASSWORD:-change-me-in-production}@postgres:5432/hindsight
      HINDSIGHT_API_DATABASE_SCHEMA: public
      
      # LLM Configuration - OpenCode-Go
      HINDSIGHT_API_LLM_PROVIDER: openai
      HINDSIGHT_API_LLM_API_KEY: ${OPENCODE_API_KEY}
      HINDSIGHT_API_LLM_BASE_URL: https://opencode.ai/zen/go/v1
      HINDSIGHT_API_LLM_MODEL: opencode-go/glm-5
      
      # Embeddings - Local
      HINDSIGHT_API_EMBEDDINGS_PROVIDER: local
      HINDSIGHT_API_EMBEDDINGS_LOCAL_MODEL: BAAI/bge-small-en-v1.5
      
      HINDSIGHT_API_VECTOR_EXTENSION: pgvector
    depends_on:
      postgres:
        condition: service_healthy
    deploy:
      resources:
        limits:
          memory: 1G

volumes:
  postgres_data:
```

---

## 2. Environment Variables Template (.env.example)

```bash
# ============================================
# HINDSIGHT + OPENCODE-GO CONFIGURATION
# ============================================

# --- Database ---
HINDSIGHT_DB_PASSWORD=your-secure-db-password-here

# --- OpenCode-Go LLM ---
# Get your API key from: https://opencode.ai/auth
OPENCODE_API_KEY=ocg_your_api_key_here

# Model selection (choose one or use per-operation config):
# GLM-5         - Most capable, ~1,150 requests/5hrs
# Kimi K2.5     - Balanced, ~1,850 requests/5hrs
# MiMo-V2-Pro   - Good for coding, ~1,290 requests/5hrs
# MiMo-V2-Omni  - Multimodal, ~2,150 requests/5hrs
# MiniMax M2.7  - Fast, ~14,000 requests/5hrs
# MiniMax M2.5  - Cheapest, ~20,000 requests/5hrs
HINDSIGHT_LLM_MODEL=opencode-go/glm-5

# --- Optional: Per-Operation Models ---
# Use cheaper/faster models for reflect operations
# HINDSIGHT_RETAIN_LLM_MODEL=opencode-go/glm-5
# HINDSIGHT_REFLECT_LLM_MODEL=opencode-go/minimax-m2.5

# --- MCP Server (optional) ---
# HINDSIGHT_API_MCP_SERVER_ENABLED=true
# HINDSIGHT_API_MCP_SERVER_PORT=8081

# --- Control Plane (Web UI - optional) ---
# HINDSIGHT_CP_ENABLED=false
# HINDSIGHT_CP_DATABASE_URL=postgresql://hindsight:${HINDSIGHT_DB_PASSWORD}@postgres:5432/hindsight
```

---

## 3. Step-by-Step Setup Instructions

### Prerequisites
- VPS with Docker and Docker Compose installed
- OpenCode-Go subscription ($5 first month) from https://opencode.ai/auth
- Domain/subdomain pointed to VPS (optional, for remote access)

### Step 1: Prepare Directory Structure

```bash
# Create project directory
mkdir -p ~/hindsight && cd ~/hindsight

# Create environment file
cat > .env << 'EOF'
HINDSIGHT_DB_PASSWORD=generate-a-secure-password-here
OPENCODE_API_KEY=your_opencode_go_api_key
HINDSIGHT_LLM_MODEL=opencode-go/glm-5
EOF
```

### Step 2: Create docker-compose.yml

Save the docker-compose.yml from Section 1 above to `~/hindsight/docker-compose.yml`

### Step 3: Start Services

```bash
cd ~/hindsight

# Start PostgreSQL first, wait for it to be healthy
docker compose up -d postgres

# Check PostgreSQL is ready
docker compose ps postgres
# Wait until status shows "healthy"

# Start Hindsight API and Worker
docker compose up -d hindsight-api hindsight-worker

# Check all services
docker compose ps
```

### Step 4: Verify Services are Running

```bash
# Check API health
curl http://localhost:8080/health

# Check logs
docker compose logs -f hindsight-api
docker compose logs -f hindsight-worker
```

### Step 5: Test Memory Operations

```bash
# Set your bank ID and API base
BANK_ID="victor-memory"
API_BASE="http://localhost:8080/v1/default"

# Store a memory (retain)
curl -X POST "${API_BASE}/banks/${BANK_ID}/retain" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${OPENCODE_API_KEY}" \
  -d '{
    "content": "Victor works as a software engineer at a tech company in Manila. He enjoys building automation tools and multi-agent systems."
  }'

# Recall memories
curl -X POST "${API_BASE}/banks/${BANK_ID}/recall" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${OPENCODE_API_KEY}" \
  -d '{
    "query": "What does Victor do for work?"
  }'
```

---

## 4. Rails Integration Example

### Ruby HTTP Client for Hindsight API

```ruby
# config/initializers/hindsight.rb
require 'net/http'
require 'json'
require 'uri'

class HindsightClient
  BASE_URL = ENV.fetch('HINDSIGHT_API_URL', 'http://localhost:8080/v1/default')
  API_KEY = ENV.fetch('HINDSIGHT_API_KEY')

  def initialize(bank_id)
    @bank_id = bank_id
    @uri = URI(BASE_URL)
    @uri.http = Net::HTTP.new(@uri.host, @uri.port)
  end

  # Store content in memory (retain)
  def retain(content, context: nil, metadata: {}, tags: [])
    payload = {
      content: content,
      context: context,
      metadata: metadata,
      tags: tags
    }.compact

    response = http_post(
      "/banks/#{@bank_id}/retain",
      payload
    )

    JSON.parse(response.body)
  end

  # Retrieve memories (recall)
  def recall(query, types: nil, max_tokens: 4096, tags: nil)
    payload = {
      query: query,
      max_tokens: max_tokens,
      types: types,
      tags: tags
    }.compact

    response = http_post(
      "/banks/#{@bank_id}/recall",
      payload
    )

    JSON.parse(response.body)
  end

  # Batch retain multiple items
  def retain_batch(items)
    response = http_post(
      "/banks/#{@bank_id}/retain",
      { items: items }
    )

    JSON.parse(response.body)
  end

  private

  def http_post(path, payload)
    uri = URI("#{BASE_URL}#{path}")
    request = Net::HTTP::Post.new(uri)
    request['Content-Type'] = 'application/json'
    request['Authorization'] = "Bearer #{API_KEY}"
    request.body = payload.to_json

    Net::HTTP.start(uri.hostname, uri.port) do |http|
      http.request(request)
    end
  end
end
```

### Usage Example in Rails

```ruby
# app/services/memory_service.rb
class MemoryService
  def initialize
    @client = HindsightClient.new('victor-memory')
  end

  # Store a conversation in memory
  def remember_conversation(user_id, messages, channel:)
    content = messages.map { |m| "#{m[:sender]} (#{m[:timestamp]}): #{m[:text]}" }.join("\n")
    
    @client.retain(
      content,
      context: channel,
      metadata: { user_id: user_id, channel: channel },
      tags: ["user:#{user_id}", "channel:#{channel}"]
    )
  end

  # Ask about past interactions
  def query_memory(question, user_id: nil)
    tags = user_id ? ["user:#{user_id}"] : nil
    
    results = @client.recall(
      question,
      types: ['world', 'experience'],
      tags: tags
    )

    results['results']&.map { |r| r['text'] } || []
  end
end
```

---

## 5. n8n Integration Example

### HTTP Request Node Configuration

#### Store Memory (Retain) - POST Request

```
Node: HTTP Request
Method: POST
URL: = {{ $env.HINDSIGHT_API_URL }}/v1/default/banks/{{ $vars.MEMORY_BANK_ID }}/retain

Authentication: Predefined Credential Type
  - Header Auth

Headers:
  Content-Type: application/json
  Authorization: Bearer {{ $env.HINDSIGHT_API_KEY }}

Body (JSON / Expression):
{
  "content": "{{ JSON.stringify($json.message) }}",
  "context": "telegram-chat",
  "metadata": {
    "message_id": "{{ $json.message_id }}",
    "chat_id": "{{ $json.chat.id }}",
    "sender": "{{ $json.chat.username }}"
  },
  "tags": ["telegram", "chat"]
}
```

#### Retrieve Memory (Recall) - POST Request

```
Node: HTTP Request
Method: POST
URL: = {{ $env.HINDSIGHT_API_URL }}/v1/default/banks/{{ $vars.MEMORY_BANK_ID }}/recall

Authentication: Predefined Credential Type
  - Header Auth

Headers:
  Content-Type: application/json
  Authorization: Bearer {{ $env.HINDSIGHT_API_KEY }}

Body (JSON / Expression):
{
  "query": "{{ $json.query }}",
  "max_tokens": 2000,
  "types": ["world", "experience"],
  "tags": ["telegram"]
}
```

#### n8n Workflow Variables (Set Node)

```javascript
// Set these in your workflow or global variables
{
  "HINDSIGHT_API_URL": "http://your-vps-ip:8080",
  "HINDSIGHT_API_KEY": "your-opencode-api-key",
  "MEMORY_BANK_ID": "victor-memory"
}
```

---

## 6. Verification Checklist

### Pre-flight Checks

- [ ] Docker and Docker Compose installed
- [ ] OpenCode-Go subscription active (https://opencode.ai/auth)
- [ ] API key generated and copied
- [ ] .env file created with all variables
- [ ] Ports 8080 and 5432 available

### Service Health Checks

```bash
# 1. PostgreSQL
docker compose ps postgres
# Expected: Status "healthy"

# 2. Hindsight API
curl http://localhost:8080/health
# Expected: {"status":"ok"} or similar

# 3. Check API version/info
curl http://localhost:8080/
# Expected: API info response

# 4. Check Worker logs
docker compose logs hindsight-worker | tail -20
# Expected: No errors, worker connected
```

### Functional Tests

```bash
# Set variables
export API_KEY="your-opencode-api-key"
export BANK_ID="test-memory"
export API_BASE="http://localhost:8080/v1/default"

# 1. Create a test memory
echo "Testing retain..."
curl -X POST "${API_BASE}/banks/${BANK_ID}/retain" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_KEY}" \
  -d '{"content": "Test: Victor has a cat named Whisker. He feeds the cat every morning at 7am."}' \
  | jq .

# 2. Wait 2-3 seconds for async processing
sleep 3

# 3. Query the memory
echo "Testing recall..."
curl -X POST "${API_BASE}/banks/${BANK_ID}/recall" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_KEY}" \
  -d '{"query": "What is Victor cat name?"}' \
  | jq '.results[] | {text: .text, type: .type}'

# 4. Check observation consolidation (may take a few minutes)
echo "Checking observations..."
curl -X POST "${API_BASE}/banks/${BANK_ID}/recall" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ${API_KEY}" \
  -d '{"query": "Tell me about the cat feeding routine", "types": ["observation"]}' \
  | jq .
```

### Expected Results

1. **Retain** returns: `{"success": true, "bank_id": "test-memory", "items_count": 1}`
2. **Recall** returns facts like: `{"text": "Victor has a cat named Whisker", "type": "world"}`
3. **Observation** recall may take 5-10 minutes (background consolidation)

### Troubleshooting

```bash
# View all logs
docker compose logs -f

# Restart a specific service
docker compose restart hindsight-api

# Check database connection
docker compose exec postgres psql -U hindsight -d hindsight -c "SELECT 1;"

# Rebuild from scratch
docker compose down -v  # WARNING: Deletes all data!
docker compose up -d
```

---

## OpenCode-Go Model Reference

| Model | Model ID | Endpoint Type | Requests/5hr | Best For |
|-------|----------|---------------|--------------|----------|
| GLM-5 | `glm-5` | OpenAI /chat/completions | ~1,150 | Complex reasoning |
| Kimi K2.5 | `kimi-k2.5` | OpenAI /chat/completions | ~1,850 | Balanced |
| MiMo-V2-Pro | `mimo-v2-pro` | OpenAI /chat/completions | ~1,290 | Coding |
| MiMo-V2-Omni | `mimo-v2-omni` | OpenAI /chat/completions | ~2,150 | Multimodal |
| MiniMax M2.7 | `minimax-m2.7` | Anthropic /messages | ~14,000 | High volume |
| MiniMax M2.5 | `minimax-m2.5` | Anthropic /messages | ~20,000 | Max volume |

**Note:** For Hindsight, GLM-5 is recommended as the default because it has strong structured output capabilities needed for fact extraction. Use MiniMax M2.5 for reflect operations to save costs.

---

## Key Environment Variables Summary

| Variable | Purpose | Example |
|----------|---------|---------|
| `HINDSIGHT_API_LLM_PROVIDER` | LLM provider type | `openai` |
| `HINDSIGHT_API_LLM_BASE_URL` | Custom endpoint (OpenAI-compatible) | `https://opencode.ai/zen/go/v1` |
| `HINDSIGHT_API_LLM_API_KEY` | OpenCode-Go API key | `ocg_xxx` |
| `HINDSIGHT_API_LLM_MODEL` | Model ID with prefix | `opencode-go/glm-5` |
| `HINDSIGHT_API_EMBEDDINGS_PROVIDER` | Embedding generation | `local` (default, no GPU) |
| `HINDSIGHT_API_DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@host:5432/db` |

---

## Production Considerations

1. **Security**: Change default DB password, use strong API keys
2. **Backups**: Set up PostgreSQL backup strategy
3. **Monitoring**: Add healthchecks to docker-compose or use a monitoring tool
4. **Scaling**: For higher load, increase DB pool size and worker instances
5. **Domain**: Point a subdomain to your VPS for remote access via HTTPS

---

*Last updated: 2026-04-04*
