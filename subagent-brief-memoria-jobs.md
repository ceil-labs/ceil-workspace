# Memoria Background Jobs — Subagent Implementation Brief

## Your Task
Implement background job ingestion for the Memoria project using **BullMQ + Redis + Socket.IO**.

## Project Location
`/home/openclaw/.openclaw/projects/memoria/`

## Detailed Plan
The complete architecture plan is attached as `memoria-background-jobs-plan.md`. Read it carefully before starting.

## Key Requirements

### Must Implement
1. **Redis infrastructure** — Add to docker-compose.yml with AOF persistence
2. **BullMQ queue + worker** — `ingest` queue, `process-ingestion` job, sequential concurrency
3. **Socket.IO** — Real-time progress: `job:progress`, `job:completed`, `job:failed`
4. **Multer diskStorage** — Replace memoryStorage, temp file cleanup in worker
5. **Database** — Add `jobs` table + `sources.status` column
6. **API** — `POST /api/ingest` returns 202 + jobId; `GET /api/jobs`, `GET /api/jobs/:id`
7. **UI** — Jobs page (`/jobs`), Job detail (`/jobs/:id`), nav link, ingest page update
8. **Tests** — Update existing tests, add new tests for queue/worker flow
9. **Graceful shutdown** — Worker + queue + Socket.IO close on SIGTERM

### Constraints
- **Keep existing API contracts** for `/api/sources`, `/api/search`, `/api/chunks`, `/api/settings`
- **Use existing service layer** (`extract`, `splitIntoChunks`, `embedBatch`, `reformatToMarkdown`, `writeRawSource`, etc.) — don't rewrite them
- **Type everything** — strict TypeScript interfaces
- **Don't break existing tests** — update `ingest.test.ts` for new 202 response
- **Mock BullMQ in unit tests**, use RedisContainer for integration tests

### Testing Requirements
- Update `tests/setup.ts` to include RedisContainer alongside PostgreSQL
- Add `tests/jobs.test.ts` — API integration
- Add `tests/ingest-queue.test.ts` — Ingest → queue flow
- Add `tests/worker.test.ts` — Worker logic (mock services)
- Update `tests/ingest.test.ts` for async behavior
- All tests must pass: `npm test`

## Implementation Order
1. Infrastructure (Redis docker-compose)
2. Dependencies (bullmq, socket.io, socket.io-client)
3. Database schema + migrations
4. Queue + Worker modules
5. Socket.IO server + queue events bridge
6. Update ingest route (diskStorage, 202 response)
7. Add jobs routes
8. Update index.ts (HTTP server, graceful shutdown)
9. UI: hooks, pages, nav, App.tsx updates
10. Tests
11. Verify docker-compose up works end-to-end

## Deliverables
- All files committed to git with clear commit messages
- `npm test` passes
- `docker-compose up --build` works
- Manual test: upload file → watch progress → view source works

## Notes
- Pre-create source DB record with `status='pending'` before enqueueing job
- Worker updates source status through processing lifecycle
- Temp files always cleaned up (success and failure)
- Progress steps: extract(10%) → reformat(30%) → store_raw(40%) → chunk(60%) → embed(80%) → store(95%) → complete(100%)
- Job record stores bullJobId for correlation between our DB and BullMQ

## Start Here
```bash
cd /home/openclaw/.openclaw/projects/memoria
git status
```

Check current state, then begin implementation following the plan above.
