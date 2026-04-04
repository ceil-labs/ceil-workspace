# Memory Tools Deployment Guide: Hindsight vs OpenViking vs ByteRover

**Target:** Victor Paolo Reyes — Rails app + n8n + memory tool in Docker network  
**LLM Stack:** kimi-coding (Kimi K2.5 via Moonshot AI, OpenAI-compatible API) + opencode-go  
**Constraints:** Self-hosted, manageable complexity, ByteRover OK despite Elastic License

---

## TL;DR — Recommendation

| Tool | LLM Compatibility | Setup Difficulty | Best For |
|------|-------------------|-----------------|----------|
| **Hindsight** | ✅ OpenAI-compatible + Kimi via custom base URL | ⭐⭐ (Moderate) | Persistent memory banks, structured recall |
| **OpenViking** | ⚠️ LiteLLM (custom URL needs testing) | ⭐⭐⭐ (Medium-High) | Multi-session agents, token cost optimization |
| **ByteRover** | ✅ OpenAI-compatible with custom URL | ⭐ (Easy) | Local CLI-first, zero-infrastructure memory |

**Winner for your stack: ByteRover** — trivially easy, works locally, OpenAI-compatible LLM provider with custom URL support. **Hindsight** is a close second if you want structured memory banks with recall/reflect tools.

> **Key insight:** Kimi's API (`https://api.moonshot.ai/v1`) is OpenAI-compatible. All three tools can work with it if they support custom base URLs for OpenAI-compatible providers.

---

## 1. Hindsight (vectorize-io/hindsight)

### Overview
- **License:** MIT (fully open source)
- **What it does:** Persistent memory banks with `retain` (store), `recall` (search), and `reflect` (synthesize) operations
- **Best for:** Agents that need structured, queryable long-term memory with tags, mental models, and documents
- **MCP Server:** ✅ Yes — local MCP mode available (`hindsight-local-mcp`)

### Deployment Modes

#### Option A: Local MCP Mode (Simplest — No Infrastructure)

Runs entirely on localhost with embedded PostgreSQL. No external database needed.

```bash
# Install and run in one command
HINDSIGHT_API_LLM_API_KEY=sk-... \
HINDSIGHT_API_LLM_PROVIDER=openai \
HINDSIGHT_API_LLM_MODEL=kimi-k2.5 \
HINDSIGHT_API_LLM_OPENAI_BASE_URL=https://api.moonshot.ai/v1 \
uvx --from hindsight-api hindsight-local-mcp
```

Or with Ollama (no API key needed):
```bash
HINDSIGHT_API_LLM_PROVIDER=ollama \
HINDSIGHT_API_LLM_MODEL=llama3.2 \
uvx --from hindsight-api hindsight-local-mcp
```

Then connect your MCP client:
```bash
claude mcp add --transport http hindsight http://localhost:8888/mcp/
```

**Resources:** ~2-4GB RAM, single container, embedded PostgreSQL persists to `~/.pg0/hindsight-mcp/`

#### Option B: Docker Compose with External PostgreSQL (Production)

Recommended for your Docker network setup.

```yaml
# docker-compose.yml
services:
  hindsight:
    image: vectorizeio/hindsight:latest
    container_name: hindsight
    ports:
      - "8888:8888"   # API
      - "8889:8889"   # MCP
    environment:
      HINDSIGHT_API_LLM_PROVIDER: openai
      HINDSIGHT_API_LLM_MODEL: kimi-k2.5
      HINDSIGHT_API_LLM_API_KEY: ${KIMI_API_KEY}
      HINDSIGHT_API_LLM_OPENAI_BASE_URL: https://api.moonshot.ai/v1
      HINDSIGHT_API_DATABASE_URL: postgres://hindsight:password@postgres:5432/hindsight
      HINDSIGHT_API_LOG_LEVEL: info
    depends_on:
      postgres:
        condition: service_healthy
    restart: unless-stopped

  postgres:
    image: pgvector/pgvector:pg16
    container_name: hindsight-postgres
    environment:
      POSTGRES_DB: hindsight
      POSTGRES_USER: hindsight
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hindsight"]
      interval: 5s
      timeout: 5s
      retries: 5
    restart: unless-stopped

volumes:
  postgres_data:
```

**Required env vars:**
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `HINDSIGHT_API_LLM_PROVIDER` | Yes | — | `openai`, `anthropic`, `gemini`, `groq`, `ollama`, `lmstudio` |
| `HINDSIGHT_API_LLM_API_KEY` | Yes* | — | API key for LLM provider (*not needed for Ollama) |
| `HINDSIGHT_API_LLM_OPENAI_BASE_URL` | For Kimi | — | `https://api.moonshot.ai/v1` |
| `HINDSIGHT_API_DATABASE_URL` | No | pg0 (embedded) | PostgreSQL connection string |
| `HINDSIGHT_API_PORT` | No | 8888 | API server port |

**⚠️ Known limitation:** Hindsight's OpenAI provider uses `baseURL` for completions. For Kimi (Moonshot), you need to set `HINDSIGHT_API_LLM_OPENAI_BASE_URL`. Verify this env var is supported in your Hindsight version — check the [config reference](https://deepwiki.com/vectorize-io/hindsight/7.3-configuration-reference).

### LLM Integration

| Provider | Support | Notes |
|----------|---------|-------|
| OpenAI | ✅ | Standard |
| Anthropic | ✅ | Standard |
| Gemini | ✅ | Standard |
| Ollama | ✅ | Local, no API key |
| LM Studio | ✅ | Local, no API key |
| **Kimi/Moonshot** | ⚠️ | Via OpenAI-compatible + custom `baseURL` — **requires verification** |
| **MiniMax** | ✅ | Built-in provider (related to Kimi) |

### Resource Requirements
- **RAM:** 2-4GB (embedded PG) to 4-8GB (with external PostgreSQL)
- **CPU:** 2+ cores
- **Disk:** 5-20GB depending on memory storage volume
- **GPU:** Not required (LLM is called externally via API)

### n8n Integration

**HTTP Request Node:**
```
URL: http://hindsight:8888/api/v1/recall
Method: POST
Headers:
  Content-Type: application/json
  Authorization: Bearer ${HINDSIGHT_API_KEY}
Body:
{
  "query": "Victor preferences for notifications",
  "bank_id": "victor-default",
  "budget": 1000
}
```

**REST API Endpoints:**
- `POST /api/v1/retain` — Store memory
- `POST /api/v1/recall` — Search memories
- `POST /api/v1/reflect` — Synthesize answer
- `GET /api/v1/banks` — List memory banks
- `GET /api/v1/memories` — Browse memories

### Rails Integration

**Ruby HTTP client example:**
```ruby
require 'net/http'
require 'json'

class HindsightClient
  BASE_URL = ENV['HINDSIGHT_API_URL'] # e.g., http://hindsight:8888

  def self.retain(content:, bank_id: 'default', tags: [])
    http_post('/api/v1/retain', {
      content: content,
      bank_id: bank_id,
      tags: tags
    })
  end

  def self.recall(query:, bank_id: 'default', budget: 1000)
    http_post('/api/v1/recall', {
      query: query,
      bank_id: bank_id,
      budget: budget
    })
  end

  private

  def self.http_post(path, body)
    uri = URI("#{BASE_URL}#{path}")
    Net::HTTP.post(uri, body.to_json, {
      'Content-Type' => 'application/json',
      'Authorization' => "Bearer #{ENV['HINDSIGHT_API_KEY']}"
    })
  end
end
```

**SDK:** Official Python SDK (`pip install hindsight`) and Node.js SDK available.

### Setup Difficulty: ⭐⭐ (2/5)

- ✅ Single Docker Compose file for production
- ✅ Local MCP mode is one-command
- ⚠️ PostgreSQL knowledge helpful but not required
- ⚠️ LLM provider configuration may need adjustment for Kimi custom URL

---

## 2. OpenViking (volcengine/Open-Viking)

### Overview
- **License:** Apache 2.0 (fully open source)
- **What it does:** Context database with filesystem paradigm (`viking://` URI scheme), tiered context loading (L0/L1/L2), directory recursive retrieval
- **Best for:** Multi-session AI agents that need hierarchical, cost-efficient context management
- **Note:** Designed for OpenClaw natively; created by ByteDance's Volcano Engine team

### Deployment

#### Docker Compose (Recommended)

```yaml
# docker-compose.yml
services:
  openviking:
    image: ghcr.io/volcengine/openviking:latest
    container_name: openviking
    ports:
      - "1933:1933"   # API server
      - "8020:8020"   # Console UI
    volumes:
      - ~/.openviking/ov.conf:/app/ov.conf
      - openviking_data:/app/data
    restart: unless-stopped

volumes:
  openviking_data:
```

**Startup:**
```bash
# Create config at ~/.openviking/ov.conf
# Run the server
docker compose up -d
```

#### Configuration File (`ov.conf`)

```ini
[server]
host = 0.0.0.0
port = 1933
workspace = /app/data/workspace

[llm]
provider = litellm                    # Use LiteLLM for broad compatibility
model = openai/kimi-k2.5            # Or your preferred model
api_key = ${OPENAI_API_KEY}         # Moonshot API key
base_url = https://api.moonshot.ai/v1  # Moonshot's OpenAI-compatible endpoint

[embedding]
provider = openai
model = text-embedding-3-large

[vlm]
provider = openai                   # For image understanding
model = gpt-4o
api_key = ${OPENAI_API_KEY}
```

**⚠️ Important:** OpenViking's `ov.conf` supports `provider`, `api_key`, and `base_url` for LLM configuration. Verify the exact config key names for LiteLLM base URL in the [official docs](https://github.com/volcengine/OpenViking/blob/main/docs/en/guides/02-configuration.md).

### Tiered Context Loading (L0/L1/L2)

This is OpenViking's killer feature for cost efficiency:

| Tier | Name | Token Size | Load Time | When Used |
|------|------|-----------|-----------|-----------|
| **L0** | Abstract | <100 tokens | <100ms | Quick "should I look at this?" checks |
| **L1** | Overview | ~500 tokens | <200ms | Planning, mid-level decisions |
| **L2** | Detail | 5,000+ tokens | On-demand | Deep dive, task execution |

**How it works in practice:**
1. Agent asks a question → OpenViking loads L0 summaries first
2. Agent decides relevant → loads L1 overviews
3. Agent needs details → loads specific L2 content

**Result:** ~95% token reduction vs loading everything upfront. On the LoCoMo10 dataset: 24.6M tokens → 4.3M tokens (80% reduction).

### LLM Integration

| Provider | Support | Notes |
|----------|---------|-------|
| Volcengine (Doubao) | ✅ | Native |
| OpenAI | ✅ | Standard |
| LiteLLM | ✅ | Wrapper for 50+ providers |
| Ollama | ✅ | Via LiteLLM |
| **Kimi/Moonshot** | ⚠️ | Via LiteLLM with custom `base_url` |
| Claude | ✅ | Via LiteLLM |

**LiteLLM configuration is the key** for Kimi support:
```ini
[llm]
provider = litellm
model = kimi/kimi-k2.5
api_key = ${KIMI_API_KEY}
base_url = https://api.moonshot.ai/v1
```

### Storage

- **Type:** Filesystem-based (not a database)
- **Location:** `/app/data/workspace/` (inside container) or configurable
- **Structure:** Virtual filesystem with `viking://` URIs
  - `viking://resources/` — raw data (PDFs, code, images)
  - `viking://user/` — user preferences, session memories
  - `viking://agent/` — agent skills, learned behaviors
- **Persistence:** Docker volume maps to host filesystem

### Multi-Agent Setup

OpenViking supports multiple agents sharing the same namespace via workspace configuration:

```ini
[server]
workspace = /app/data/shared-workspace

[multi-agent]
enabled = true
namespace = default
```

Agents access the same `viking://` filesystem, enabling shared context across sessions.

### Resource Requirements
- **RAM:** 4-8GB (embedding model + VLM loading)
- **CPU:** 4+ cores recommended
- **Disk:** 10-50GB depending on stored context
- **GPU:** Not required (models called externally)

**⚠️ Heavy dependencies:** OpenViking requires embedding models + VLM for full functionality. This adds setup complexity and memory usage.

### n8n Integration

OpenViking exposes a REST API on port 1933:

```javascript
// n8n HTTP Request Node
{
  "url": "http://openviking:1933/viking/search",
  "method": "POST",
  "body": {
    "query": "What are Victor's project preferences?",
    "tier": "L1",  // or "L0", "L2"
    "namespace": "default"
  }
}
```

**Python client (async):**
```python
from openviking import AsyncOpenViking

client = AsyncOpenViking(
    base_url="http://openviking:1933",
    api_key=os.environ.get("OPENViking_API_KEY")
)

# Write memory
await client.write("viking://user/victor/preferences/", "Prefers Python over Java")

# Search with tiered loading
result = await client.find("project preferences", tier="L1")

# Read specific content
content = await client.read("viking://user/victor/sessions/2026-04-01/")
```

### Rails Integration

```ruby
require 'net/http'
require 'json'

class OpenVikingClient
  BASE_URL = ENV['OPENViking_API_URL'] # e.g., http://openviking:1933

  def self.write(path, content)
    uri = URI("#{BASE_URL}/viking/write")
    Net::HTTP.post(uri, {
      path: path,
      content: content
    }.to_json, {
      'Content-Type' => 'application/json',
      'Authorization' => "Bearer #{ENV['OPENViking_API_KEY']}"
    })
  end

  def self.find(query:, tier: 'L1')
    uri = URI("#{BASE_URL}/viking/find")
    Net::HTTP.post(uri, {
      query: query,
      tier: tier
    }.to_json, {
      'Content-Type' => 'application/json',
      'Authorization' => "Bearer #{ENV['OPENViking_API_KEY']}"
    })
  end
end
```

### Setup Difficulty: ⭐⭐⭐ (3/5)

- ✅ Docker Compose available
- ⚠️ Requires Go 1.22+ for building CLI tools
- ⚠️ Embedding model + VLM setup adds complexity
- ⚠️ Configuration file (`ov.conf`) is less intuitive than env vars
- ⚠️ LiteLLM base URL support needs verification for Kimi

---

## 3. ByteRover (campfirein/byterover-cli)

### Overview
- **License:** Elastic License v2 (commercial use restriction — but OK since you're not selling)
- **What it does:** Portable memory layer for autonomous coding agents; context tree stored as Markdown files
- **Best for:** CLI-first workflows, zero-infrastructure memory, agents that need simple persistent context
- **MCP Server:** ✅ Yes — `brv mcp` command

### Deployment Modes

ByteRover has two modes:

1. **Local-only mode** — Everything stored locally, no cloud sync
2. **Cloud sync mode** — Optional `brv push/pull` to ByteRover cloud

**Local-only is fully functional without any cloud features.** You can use `brv query`, `brv curate`, and the MCP server without ever running `brv login`.

### Installation

```bash
# Install via npm (no Docker needed for the CLI itself)
npm install -g byterover-cli

# Verify
brv --version
```

### Local-Only Mode Setup

```bash
# No login required for local operations
brv query "What files did Victor work on yesterday?"
brv curate --fix "Update memory about project X"

# MCP server for agent integration
brv mcp > mcp_config.json
# Or run directly with Claude Code:
# claude mcp add --transport http byterover http://localhost:8080/mcp/
```

### Context Tree Storage

Knowledge is stored in `.brv/context-tree/` as **human-readable Markdown files**:

```
.brv/
└── context-tree/
    ├── user/
    │   └── memories/
    │       └── preferences.md
    ├── project/
    │   └── myapp/
    │       ├── files.md
    │       └── context.md
    └── sessions/
        └── 2026-04-04/
            └── conversation.md
```

**No database needed.** Just filesystem. Git-versionable. Human-readable.

### MCP Server Setup

```bash
# Generate MCP server config
brv mcp > ~/.claude/mcp-configs/byterover.json

# Or for OpenClaw, add to mcpServers in openclaw.json:
{
  "mcpServers": {
    "byterover": {
      "command": "brv",
      "args": ["mcp"]
    }
  }
}
```

### LLM Provider Configuration

ByteRover uses the `brv providers` command to manage LLM connections:

```bash
# List available providers
brv providers list

# Connect Kimi (via OpenAI-compatible)
brv providers connect openai-compatible \
  --name "Kimi" \
  --base-url https://api.moonshot.ai/v1 \
  --api-key ${KIMI_API_KEY} \
  --model kimi-k2.5

# Or connect via OpenAI provider (if using custom endpoint)
brv providers connect openai \
  --name "Kimi Moonshot" \
  --api-key ${KIMI_API_KEY}

# Switch active provider
brv providers switch Kimi

# Disconnect (stop using cloud features)
brv providers disconnect
```

**Supported providers:**
- OpenAI ✅
- Anthropic ✅
- Google ✅
- Mistral ✅
- Ollama ✅
- DeepSeek ✅
- Azure OpenAI ✅
- OpenAI-Compatible (custom URL) ✅ ← **Use this for Kimi**
- ByteRover (their cloud, optional) ✅

### Docker Compose for MCP Server (Optional)

If you want the MCP server in your Docker network:

```yaml
# docker-compose.yml
services:
  byterover-mcp:
    image: node:20-alpine
    container_name: byterover-mcp
    command: sh -c "npm install -g byterover-cli && byterover mcp"
    environment:
      BRV_API_KEY: ${BRV_API_KEY}  # Optional, for cloud features
      BRV_LLM_BASE_URL: https://api.moonshot.ai/v1
      BRV_LLM_API_KEY: ${KIMI_API_KEY}
      BRV_LLM_MODEL: kimi-k2.5
    volumes:
      - ./byterover-data:/home/node/.brv
    restart: unless-stopped

  # Or run directly on host (recommended for CLI tools)
  # byterover:
  #   image: node:20-alpine
  #   volumes:
  #     - ~/.brv:/home/node/.brv
```

### Resource Requirements
- **RAM:** <500MB (it's just a CLI + file storage)
- **CPU:** Minimal
- **Disk:** Depends on context tree size (Markdown files compress well)
- **GPU:** Not required
- **No embedding model needed.** No VLM needed. No database needed.

### n8n Integration

ByteRover has **no native REST API for n8n** — integration is via MCP or the CLI:

**Option A: Execute brv CLI via n8n's Run a Command Node**
```bash
# n8n "Execute Command" node
brv query "What is Victor's current task?"
```

**Option B: MCP via HTTP (if using ByteRover Cloud MCP bridge)**
```
URL: https://api.byterover.dev/mcp/
Method: POST
Headers:
  Authorization: Bearer ${BRV_API_KEY}
Body:
{
  "jsonrpc": "2.0",
  "method": "tools/call",
  "params": {
    "name": "query",
    "arguments": {"text": "Victor preferences"}
  }
}
```

**Option C: Direct file access**
Since context tree is just Markdown files in `.brv/context-tree/`, you can read/write directly:
```bash
cat ~/.brv/context-tree/user/memories/preferences.md
echo "New memory content" >> ~/.brv/context-tree/user/memories/preferences.md
```

### Rails Integration

```ruby
require 'open3'

class ByteRoverClient
  def self.query(prompt)
    stdout, stderr, status = Open3.capture3(
      "brv", "query", "--text", prompt
    )
    raise "ByteRover error: #{stderr}" unless status.success?
    stdout.strip
  end

  def self.curate(instruction)
    stdout, stderr, status = Open3.capture3(
      "brv", "curate", "--fix", instruction
    )
    raise "ByteRover error: #{stderr}" unless status.success?
    stdout.strip
  end

  def self.read_memory(path)
    # Direct file access
    file_path = File.expand_path(".brv/context-tree/#{path}", Dir.home)
    File.read(file_path) if File.exist?(file_path)
  end

  def self.write_memory(path, content)
    file_path = File.expand_path(".brv/context-tree/#{path}", Dir.home)
    File.write(file_path, content)
  end
end
```

### Setup Difficulty: ⭐ (1/5)

- ✅ `npm install -g byterover-cli` — done
- ✅ No database, no server, no Docker required for CLI
- ✅ Works offline, local-only by default
- ⚠️ MCP server setup requires some config
- ⚠️ Cloud sync is optional (ignore `brv push/pull` if not needed)

---

## Comparison Matrix

| Criterion | Hindsight | OpenViking | ByteRover |
|-----------|-----------|------------|-----------|
| **License** | MIT ✅ | Apache 2.0 ✅ | Elastic License v2 ⚠️ |
| **Setup Difficulty** | ⭐⭐ (2/5) | ⭐⭐⭐ (3/5) | ⭐ (1/5) |
| **Infrastructure** | PostgreSQL + app | Go server + storage | None (CLI) |
| **Containers needed** | 2 (app + postgres) | 1-2 | 0-1 |
| **LLM: Kimi/Moonshot** | ⚠️ Via OpenAI-compatible URL | ⚠️ Via LiteLLM | ✅ Via OpenAI-compatible |
| **LLM: OpenAI** | ✅ | ✅ | ✅ |
| **LLM: Ollama** | ✅ | ✅ | ✅ |
| **LLM: MiniMax** | ✅ (built-in) | ⚠️ Via LiteLLM | ⚠️ Via OpenAI-compatible |
| **Memory model** | Vector (pgvector) | Tiered (L0/L1/L2) | Flat (Markdown) |
| **MCP server** | ✅ | ❌ | ✅ |
| **REST API** | ✅ | ✅ | ❌ (CLI only) |
| **Storage** | PostgreSQL | Filesystem | Filesystem |
| **RAM needs** | 2-4GB | 4-8GB | <500MB |
| **Embedding model** | Bundled | Required | Not needed |
| **n8n integration** | Easy (HTTP) | Easy (HTTP) | Medium (CLI/file) |
| **Rails integration** | Easy (HTTP) | Easy (HTTP) | Easy (CLI/file) |
| **Multi-agent shared memory** | Via banks | Via workspace | Via shared files |
| **Self-evolution** | No | ✅ | No |

---

## Docker Network Integration (Your Setup)

For your Rails + n8n + memory tool in Docker network:

### Network Configuration

```yaml
# docker-compose.yml (excerpt)
services:
  rails:
    networks:
      - app-network

  n8n:
    networks:
      - app-network

  hindsight:
    networks:
      - app-network
    # OR for OpenViking:
    # openviking:
    #   networks:
    #     - app-network

networks:
  app-network:
    driver: bridge
```

### Internal DNS Resolution

Container names become hostnames:
- `http://hindsight:8888` (Hindsight)
- `http://openviking:1933` (OpenViking)
- `http://rails:3000` (your Rails app)
- `http://n8n:5678` (n8n)

---

## Final Recommendation

### If you want the easiest path: **ByteRover**

```bash
npm install -g byterover-cli
brv providers connect openai-compatible \
  --name "Kimi" \
  --base-url https://api.moonshot.ai/v1 \
  --api-key ${KIMI_API_KEY} \
  --model kimi-k2.5
brv mcp  # Start MCP server
```

- Zero infrastructure
- Works locally without cloud
- OpenAI-compatible LLM provider with custom URL for Kimi
- MCP server for OpenClaw integration
- Context tree is just Markdown files you can read/write directly

**Caveat:** Elastic License v2 — OK since you're not selling a product that competes with ByteRover.

### If you want structured memory with recall/reflect: **Hindsight**

```yaml
# docker-compose.yml
services:
  hindsight:
    image: vectorizeio/hindsight:latest
    environment:
      HINDSIGHT_API_LLM_PROVIDER: openai
      HINDSIGHT_API_LLM_MODEL: kimi-k2.5
      HINDSIGHT_API_LLM_API_KEY: ${KIMI_API_KEY}
      HINDSIGHT_API_LLM_OPENAI_BASE_URL: https://api.moonshot.ai/v1
      HINDSIGHT_API_DATABASE_URL: postgres://hindsight:password@postgres:5432/hindsight

  postgres:
    image: pgvector/pgvector:pg16
```

- Rich memory operations (`retain`, `recall`, `reflect`)
- MCP server built-in
- MIT license (no commercial restrictions)
- Requires PostgreSQL

### If you want token cost optimization and multi-session learning: **OpenViking**

```yaml
# docker-compose.yml
services:
  openviking:
    image: ghcr.io/volcengine/openviking:latest
    volumes:
      - ~/.openviking/ov.conf:/app/ov.conf
```

- L0/L1/L2 tiered loading = ~80% token cost reduction
- Self-evolving memory (learns from sessions)
- Apache 2.0 license
- ⚠️ Higher complexity, embedding model setup needed

---

## Action Items

1. **For ByteRover:** Run `npm install -g byterover-cli && brv providers connect openai-compatible ...` to test Kimi integration
2. **For Hindsight:** Verify `HINDSIGHT_API_LLM_OPENAI_BASE_URL` env var support, then deploy Docker Compose
3. **For OpenViking:** Test LiteLLM with custom base URL for Kimi before committing

---

*Generated: 2026-04-04*  
*Research scope: Self-hosted deployment, LLM compatibility, Docker network integration, n8n + Rails integration*
