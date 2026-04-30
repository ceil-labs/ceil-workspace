## Research: BullMQ Progress Reporting for Real-Time UI

### Context
We have a Memoria app (Node.js/Express + React + BullMQ + Redis + PostgreSQL) that ingests documents. The ingest queue uses BullMQ. We need a progress bar that updates smoothly in real-time.

### Current Architecture
- **Queue:** `ingest` queue with BullMQ
- **Worker:** `new Worker<IngestJobData>("ingest", async (job) => { return processIngestJob(job.id!.toString(), job.data); })`
- **Progress tracking:** Inside `processIngestJob()`, we call `updateJobProgressByBullJobId(bullJobId, step, percent)` which updates the PostgreSQL `jobs` table
- **Real-time:** Socket.IO listens to BullMQ `QueueEvents` ("progress", "completed", "failed")

### Current Broken Implementation
The worker calls `updateJobProgressByBullJobId()` which updates the DB. But it NEVER calls `job.updateProgress()` (the BullMQ native method). This means:
- `QueueEvents.on("progress")` NEVER fires (BullMQ only emits progress events when `job.updateProgress()` is called)
- The UI only sees progress updates on page refresh (from DB), not in real-time
- The `setInterval` timer approach in the worker updates the DB, but Socket.IO never hears about it

### What We Tried (and why it failed)
1. **Milestone updates** (10%, 30%, 70%, 100%) — Jumped too fast because intermediate steps happen quickly
2. **Timer-based `setInterval`** inside `processIngestJob` — Updates DB, but `QueueEvents` doesn't fire because no `job.updateProgress()` calls
3. **Redistributed percentages** (5%, 70%, 95%, 100%) — Still jumps because the real-time mechanism is broken

### The Real Fix
The worker handler MUST call `job.updateProgress({ step, percent })` alongside DB updates. This triggers BullMQ's native progress events, which `QueueEvents` listens to and forwards via Socket.IO.

### Research Questions

1. **BullMQ `job.updateProgress()` API**
   - What types can be passed? (number? object?)
   - How does it interact with `QueueEvents`?
   - Does it work with the `Worker` callback signature?

2. **Worker callback signature**
   - Current: `new Worker("ingest", async (job) => { ... })`
   - The `job` object has `updateProgress()` method
   - Can we pass `job` into `processIngestJob`?

3. **Best practice for multi-step progress**
   - For LLM reformat (~15s): How to report progress continuously?
   - Options:
     a. `setInterval` inside worker that calls `job.updateProgress()` + DB update
     b. Report at sub-step boundaries (e.g., "chunk 5/20")
     c. Use a custom event emitter
   - Which is most reliable with BullMQ?

4. **Socket.IO event design**
   - Current events: `job:created`, `job:updated`, `job:progress`, `job:completed`, `job:failed`
   - Should we simplify to just `job:updated` with full state?
   - Or keep separate events for different update types?

5. **Progress estimation without actual sub-steps**
   - LLM reformat is a black box (single API call)
   - We don't know how much of the work is done internally
   - Options:
     a. Fake progress (timer-based increments)
     b. Show indeterminate spinner + step label
     c. Show sub-task progress ("Reformatting paragraph 3/5...")
   - What's the best UX pattern?

6. **Multi-file upload consideration**
   - Future: multiple files/URLs in one batch
   - Each file = one job
   - Or one job with multiple sub-tasks?
   - How should progress work for batch jobs?

### Expected Output
A clear, actionable plan with:
- The exact code changes needed in `ingestWorker.ts`, `queueEvents.ts`, and `JobsPage.tsx`
- A recommendation on timer-based vs. milestone-based vs. indeterminate progress
- A forward-compatible design for multi-file batch uploads

### Files to Reference
- `src/workers/ingestWorker.ts` — Worker function and BullMQ Worker setup
- `src/lib/queueEvents.ts` — Socket.IO event forwarding from BullMQ
- `ui/src/pages/JobsPage.tsx` — Queue page UI
- `src/services/store.ts` — DB update functions
- `src/routes/jobs.ts` — Jobs API

### Testing Requirements
- Must work with `npm test` (38 tests, test mode bypasses BullMQ)
- Must not break existing functionality
- Must compile with `npm run build`