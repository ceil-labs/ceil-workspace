## Task: Clear Completed Queue + Progress Granularity

### Context
Memoria is a Node.js/Express API + React UI for document ingestion. We have a BullMQ ingest queue with Redis. The Queue page shows jobs with real-time progress via Socket.IO.

### Current Issues
1. No way to bulk clear completed/failed jobs from the queue UI
2. Progress jumps from 30% → 100% because LLM reformat is the bottleneck but only gets 20 percentage points in current milestone map
3. Step label is too subtle — user can't tell what the worker is doing during long operations

---

### Changes Required

#### 1. Backend: `DELETE /api/jobs` (bulk clear)
**File:** `src/routes/jobs.ts`
- Add `DELETE /api/jobs` endpoint that:
  - Deletes all jobs where `status IN ('completed', 'failed')`
  - Also removes any stale BullMQ keys from Redis for these jobs
  - Returns `{ deleted: N }`
  - Does NOT touch sources, chunks, or files

#### 2. Frontend: Clear Completed button
**File:** `ui/src/pages/JobsPage.tsx`
- Near the table header (left side), add a "Clear Completed" button
- Only visible when at least one `completed` or `failed` job exists
- On click: confirmation banner (yellow, like delete confirmation)
- Text: "Clear all completed and failed jobs? Sources and chunks will remain."
- Buttons: "Clear" (yellow) + "Cancel" + "Clear all" (also clears pending if user wants)
- Actually just one simple flow: click → `DELETE /api/jobs` → refresh list

#### 3. Progress Granularity
**File:** `src/workers/ingestWorker.ts`
- Redistribute `updateJobProgressByBullJobId()` calls with new percentages:

| Step | New Progress | Reason |
|------|-------------|--------|
| extract | 5% | Fast PDF parse, ~1s |
| reformat | 70% | LLM call, the bottleneck ~15s |
| store_raw | 75% | Instant file write |
| chunk | 78% | Instant text split |
| embed | 95% | Embedding API, ~3s |
| store | 98% | DB writes, ~200ms |
| complete | 100% | Done |

- Also make the worker emit the step name in Socket.IO events. The `QueueEvents` progress handler already sends `{ step, percent }` — verify this reaches the UI.

#### 4. Prominent Step Label in UI
**File:** `ui/src/pages/JobsPage.tsx`
- In the progress cell, show the step name prominently:
  - Currently: small gray text "— Extracting" next to title
  - New: below the progress bar, show "Reformatting..." in a slightly larger/bolder style when processing
  - For pending: show "Waiting in queue..."
  - For completed: show "Done"
  - For failed: show error message truncated

---

### Code References

**Current progress milestones in worker:**
```typescript
await updateJobProgressByBullJobId(jobId, "extract", 10);
await updateJobProgressByBullJobId(jobId, "reformat", 30);
await updateJobProgressByBullJobId(jobId, "store_raw", 40);
await updateJobProgressByBullJobId(jobId, "chunk", 60);
await updateJobProgressByBullJobId(jobId, "embed", 80);
await updateJobProgressByBullJobId(jobId, "store", 95);
await updateJobProgressByBullJobId(jobId, "complete", 100);
```

**Current JobsPage step label display:**
```tsx
{job.currentStep && job.status === "processing" && (
  <span className="..."> — {stepLabels[job.currentStep] ?? job.currentStep}</span>
)}
```

**Current `job:updated` Socket.IO handler:**
```tsx
socket.on("job:updated", (update) => {
  setJobs((prev) => prev.map((job) =>
    job.bullJobId === update.jobId ? { ...job, ...update } : job
  ));
});
```

### Testing
- Run `npm run build` to verify TypeScript compiles
- Run `npm test` to verify all 38 tests pass
- Do NOT run Docker build (Ceil will handle deployment)

### Files to Modify
- `src/routes/jobs.ts`
- `src/workers/ingestWorker.ts`
- `ui/src/pages/JobsPage.tsx`
