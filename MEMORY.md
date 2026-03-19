

---

## Lessons Learned

### 2026-03-18: Bundled Skills Awareness
**Mistake:** When Victor asked to use `skill-creator`, I incorrectly looked for a physical directory at `~/.openclaw/skills/skill-creator/` and concluded it didn't exist.

**Reality:** `skill-creator` is a **bundled skill** pre-loaded in the system prompt. Bundled skills have no filesystem presence — they're defined in session context.

**Fix:** Updated `AGENTS.md` with a "Skills Discovery" section documenting:
1. System-prompt bundled skills (check context first)
2. User-installed skills (check filesystem)
3. Quick check protocol for skill invocation

**Applies to:** Both Ceil and Neo — ensure Neo's bootstrap docs include this guidance.
