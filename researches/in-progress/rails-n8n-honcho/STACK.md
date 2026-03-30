# Rails 8 + n8n + Honcho Stack Research

**Project:** Custom Agent System with Self-Hosted Infrastructure
**Date:** 2026-03-27
**Status:** In Progress

---

## Target Stack

### Core Infrastructure (Self-Hosted)

| Component | Technology | Purpose |
|-----------|------------|---------|
| **App Framework** | Rails 8 | API server, agent orchestration |
| **Database** | PostgreSQL 16 + pgvector | Data persistence, vector embeddings, FTS |
| **Cache/Queue** | Redis | Sessions, pub/sub, job queue |
| **Workflows** | n8n | Automation, external integrations |
| **User Memory** | Honcho (self-hosted) | Cross-session user memory, conclusions |
| **Auth** | Rails 8 built-in (Devise/Token) | User authentication |

### External Services (For Now)

| Service | Purpose | Future Path |
|---------|---------|-------------|
| **LLM API** | OpenAI / Anthropic / etc. | Replace with self-hosted (Ollama/vLLM) |

---

## Architecture Goals

1. **Full Self-Hosting** - All core components in Docker containers
2. **Data Sovereignty** - User data never leaves your infrastructure
3. **Modular LLM** - Swappable LLM providers (cloud now, self-hosted later)
4. **Long Persistence** - Very long-term data retention
5. **Honcho Integration** - User memory layer for agent personalization

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENTS                               │
│         (Browser / Telegram / Discord / API)                │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                     RAILS 8 APP                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │   Action     │  │   Custom     │  │   n8n Webhook    │  │
│  │   Cable      │  │   Agent      │  │   Controller     │  │
│  │  (Realtime)  │  │   Core       │  │                  │  │
│  └──────────────┘  └──────────────┘  └──────────────────┘  │
│         │                  │                    │            │
│  ┌──────▼──────┐   ┌──────▼──────┐      ┌──────▼──────┐    │
│  │   Tool      │   │  Session    │      │  Workflow   │    │
│  │  Harness   │   │  Manager    │      │  Trigger    │    │
│  └─────────────┘   └─────────────┘      └─────────────┘    │
└────────┬──────────────────┬───────────────────┬─────────────┘
         │                  │                   │
   ┌─────▼─────┐    ┌───────▼───────┐    ┌──────▼──────────┐
   │PostgreSQL │    │    Redis      │    │      n8n         │
   │+ pgvector │    │  (Sessions +  │    │  (Workflow       │
   │           │    │   Agent Queue)│    │   Automation)    │
   └─────┬─────┘    └───────────────┘    └──────────────────┘
         │
   ┌─────▼────────────────────────────────────────────┐
   │              HONCHO (Self-Hosted)                 │
   │  ┌─────────────┐  ┌─────────────┐  ┌──────────┐ │
   │  │  Conclusions│  │  Sessions   │  │  Users   │ │
   │  │  Vector DB  │  │  Memory     │  │  Profiles│ │
   │  └─────────────┘  └─────────────┘  └──────────┘ │
   └───────────────────────────────────────────────────┘
                           │
                    ┌──────▼──────┐
                    │ External LLM │
                    │  (OpenAI/    │
                    │  Anthropic)  │
                    └─────────────┘
```

---

## Component Details

### Rails 8
- **Docker:** Built-in `dockerize` command
- **Auth:** Built-in Rails authentication (Devise or API tokens)
- **Deployment:** Kamal (default in Rails 8)

### PostgreSQL + pgvector
- **Image:** `ankane/pgvector:latest`
- **Features:** Full-text search (FTS), vector embeddings (pgvector)
- **Persistence:** Docker volume for long-term storage

### n8n
- **Image:** `n8nio/n8n:latest`
- **Database:** Uses same PostgreSQL instance
- **Queue:** Redis for workflow execution

### Honcho (Research Pending)
- **Repo:** https://github.com/plastic-labs/honcho
- **Status:** Self-hostable, open source
- **Integration:** Will connect to Rails for user memory
- **LLM:** Will use same external LLM or future self-hosted

---

## Research Tasks

- [x] Rails 8 Docker setup
- [x] PostgreSQL + pgvector configuration
- [x] n8n integration patterns
- [ ] **Honcho self-hosting research** (in progress)
- [ ] Docker Compose final configuration
- [ ] Rails initialization plan

---

## Notes

**Key Decisions:**
1. No Supabase - using plain PostgreSQL for full control
2. Self-hosted everything except LLM (for now)
3. Rails 8 built-in auth instead of external auth service
4. Honcho for user memory layer (not replacing but augmenting Rails sessions)

**Next Steps:**
1. Complete Honcho research
2. Initialize Rails 8 app with dockerize
3. Create Docker Compose configuration
4. Begin development
