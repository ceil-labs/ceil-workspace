## Task: Smooth Progress + Status Sync Fix

### Context
Memoria is a Node.js/Express API + React UI with BullMQ ingest queue + Redis. The Queue page shows real-time job progress via Socket.IO.

### Critical Issues from Screenshot

**1. Pending job shows 70% progress (Jerry.pdf)**
- Status badge says "pending" but progress bar shows 70%
- This is inconsistent — pending should be 0%

**Root cause:** The worker calls `updateJobProgressByBullJobId()` which only updates `progress` + `currentStep` columns. It does NOT update `status` from `pending` to `processing`. So the DB has `status=pending, progress=70` — stale state.

**Fix:** `updateJobProgressByBullJobId()` should also set `status = 'processing'` when progress > 0. This keeps DB and UI consistent even before Socket.IO events arrive.

**2. Progress jumps from 70% → 100% instantly**
- LLM reformat takes ~15s but emits only ONE progress event at 70%
- Everything after (store_raw, chunk, embed, store) happens in ~3s total
- UI gets 5 rapid updates in 3 seconds — feels like an instant jump

**Fix:** Add timer-based intermediate progress during long operations:

**For LLM Reformat (~15s):**
```typescript
// Before: one update at 70%
await updateJobProgressByBullJobId(jobId, "reformat", 70);

// After: gradual updates 30→35→40→45→50→55→60→65→70
const reformatTimer = setInterval(async () => {
  reformatProgress += 5;
  if (reformatProgress >= 70) clearInterval(reformatTimer);
  await updateJobProgressByBullJobId(jobId, "reformat", reformatProgress);
}, 2000); // every 2 seconds
const processedText = await reformatToMarkdown(extracted.text);
clearInterval(reformatTimer);
```

**For Embedding (~3-5s):**
```typescript
// Before: one update at 95%
await updateJobProgressByBullJobId(jobId, "embed", 95);

// After: gradual 78→83→88→93→95
const embedTimer = setInterval(async () => {
  embedProgress += 5;
  if (embedProgress >= 95) clearInterval(embedTimer);
  await updateJobProgressByBullJobId(jobId, "embed", embedProgress);
}, 1000); // every 1 second
const rawEmbeddings = await embedBatch(...);
clearInterval(embedTimer);
```

**3. UI display override for stale data**
Even with the DB fix, the UI should never show inconsistent state:
- `status === 'pending'` → force show 0% + "Waiting in queue..."
- `status === 'processing'` → show actual progress
- `status === 'completed'` → force show 100% + "Done"
- `status === 'failed'` → force show 0% + error

### Files to Modify

**`src/services/store.ts`:**
- Update `updateJobProgressByBullJobId()` to also set `status = 'processing'`:
```typescript
export async function updateJobProgressByBullJobId(...) {
  await db
    .update(jobs)
    .set({ currentStep, progress, status: "processing", updatedAt: new Date() })
    .where(eq(jobs.bullJobId, bullJobId));
}
```

**`src/workers/ingestWorker.ts`:**
- Add timer-based progress during `reformatToMarkdown()` call
- Add timer-based progress during `embedBatch()` call
- Use `job.updateProgress()` for BullMQ native progress tracking (in addition to DB updates)
- Note: The worker receives a `job` object from BullMQ. Use `job.updateProgress({ step, percent })`.
- Keep existing `updateJobProgressByBullJobId()` calls for DB persistence.

The worker function signature is:
```typescript
export async function processIngestJob(
  jobId: string,  // This is the bullJobId
  jobData: IngestJobData,
  job?: Job  // Optional BullMQ job object for updateProgress
): Promise<...>
```

**`ui/src/pages/JobsPage.tsx`:**
- Force display logic based on `status`, not just `progress` value:
```typescript
// In the progress cell:
{job.status === "pending" && (
  <span className="text-xs text-gray-500">Waiting in queue... 0%</span>
)}
{job.status === "processing" && (
  <div className="flex items-center gap-2">
    <ProgressBar percent={job.progress ?? 0} />
    <span className="text-xs text-gray-500 w-8">{job.progress ?? 0}%</span>
  </div>
)}
{job.status === "completed" && (
  <span className="text-xs text-green-600">Done 100%</span>
)}
{job.status === "failed" && (
  <span className="text-xs text-red-600">Failed</span>
)}
```

### Current Progress Milestones (for reference)
```typescript
await updateJobProgressByBullJobId(jobId, "extract", 5);
// ... LLM reformat (~15s) ...
await updateJobProgressByBullJobId(jobId, "reformat", 70);  // ONLY ONE UPDATE
// ... store_raw, chunk (~100ms) ...
await updateJobProgressByBullJobId(jobId, "store_raw", 75);
await updateJobProgressByBullJobId(jobId, "chunk", 78);
// ... embed (~3s) ...
await updateJobProgressByBullJobId(jobId, "embed", 95);  // ONLY ONE UPDATE
// ... store (~200ms) ...
await updateJobProgressByBullJobId(jobId, "store", 98);
await updateJobProgressByBullJobId(jobId, "complete", 100);
```

### Testing
- Run `npm run build` to verify TypeScript compiles
- Run `npm test` to verify all 38 tests pass
- Do NOT run Docker build (Ceil will handle deployment)
