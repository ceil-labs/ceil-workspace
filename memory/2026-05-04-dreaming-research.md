Here is the summary of how dreaming works relative to short-term memory, and what we can actually do about it.

## How Dreaming Relates to Short-Term Memory

Dreaming is a **3-phase consolidation pipeline** that reads from short-term sources and writes to long-term memory:

| Phase | Reads From | Writes To | Purpose |
|-------|-----------|-----------|---------|
| **Light** | Daily notes (`memory/YYYY-MM-DD.md`), recall traces, redacted session transcripts | `memory/.dreams/phase-signals.json`, `DREAMS.md` (Light Sleep block) | Stages and dedupes recent signals |
| **REM** | Same short-term corpus + light-phase signals | `DREAMS.md` (REM Sleep block) | Extracts themes and patterns |
| **Deep** | Scored candidates from Light + REM | **`MEMORY.md`** (appends promoted entries) | Promotes durable memories |

**Short-term memory** = your daily notes + search recall traces + session transcripts. Dreaming sweeps these every night at 3 AM, scores candidates using 6 weighted signals (Relevance 30%, Frequency 24%, Query diversity 15%, Recency 15%, Consolidation 10%, Conceptual richness 6%), and promotes the strong ones to `MEMORY.md`.

**The catch:** Deep phase **appends** promoted entries to `MEMORY.md`. The file header says *"Overwrite this file when patterns change. Do not append"* — but the plugin ignores that and appends raw machine-formatted blocks anyway. That's why your MEMORY.md bloated.

---

## What I Found in Your State

- **Phase signals:** Some chunks have **44+ light hits** — the same content from April 9 is being reinforced repeatedly by the light phase
- **Recall store:** **2,625 entries**, many with `null` scores/queries — mostly staged noise, not quality recall traces
- **Promotion threshold (hardcoded):** `score >= 0.8`, `recalls >= 3`, `uniqueQueries >= 3` — these are **not user-configurable**
- **Sweep scope:** Global — covers both Ceil and Neo workspaces together (deduped by path). No per-agent dreaming config exists.

There's also a **feedback loop risk:** promoted content in `MEMORY.md` gets indexed by memory search → gets recalled during sessions → builds more recall trace signal → gets reinforced by light phase → scores higher → gets promoted again.

---

## What You Can Configure (Very Little)

User-facing dreaming config is **only 4 knobs** under `plugins.entries.memory-core.config.dreaming`:

| Setting | Yours | Options |
|---------|-------|---------|
| `enabled` | `true` | `true` / `false` |
| `frequency` | `0 3 * * *` | Any cron string |
| `timezone` | default | e.g. `Asia/Manila` |
| `model` | default | Optional Dream Diary model override |

**Phase thresholds, scoring weights, and output targets are internal — not exposed.**

---

## Recommendations

### Option 1: Disable Auto-Dreaming → Manual Curation (Best for Control)
```bash
# Turn off auto sweep
openclaw memory dreaming off

# When you want to promote, preview first
openclaw memory promote
openclaw memory promote --limit 5

# Then apply only the good ones
openclaw memory promote --apply
```
This gives you full control over what enters MEMORY.md. You'd curate manually (or via my review) instead of getting machine-formatted dumps.

### Option 2: Reduce Frequency (Compromise)
Change from **daily** to **weekly** to slow the bloat:
```json
"dreaming": {
  "enabled": true,
  "frequency": "0 3 * * 0"
}
```
Then clean MEMORY.md monthly instead of weekly.

### Option 3: Keep Auto + Periodic Clean (Status Quo)
What we just did — streamlining MEMORY.md every so often. Dreaming will re-append over time; you accept the maintenance.

### Option 4: Cleaner Daily Notes (Upstream Fix)
The light phase ingests everything in daily notes. If daily notes are noisy/transient, light phase has more junk to stage. Writing leaner daily notes (facts/decisions only, not full session dumps) improves signal quality.

---

## For Both Agents (Ceil + Neo)

Since dreaming is **global** (one cron, both workspaces), you cannot tune it differently per agent. If you want **Ceil** to have tightly curated MEMORY.md and **Neo** to have auto-promotions (or vice versa), the only way is:
- **Disable dreaming globally**
- **Manually curate each agent's MEMORY.md** via `memory promote --apply` or direct edits

**My recommendation:** Switch to **manual promotion** for both. The auto-promoted blocks are noisy, repetitive, and overwrite your curated guidance. Manual curation preserves the intent of MEMORY.md as *curated operating guidance*, not a dump of everything that ever happened.

Want me to disable auto-dreaming now, or test the weekly frequency first?