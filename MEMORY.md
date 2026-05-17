# MEMORY.md — Curated Operating Guidance
<!-- Last updated: 2026-05-04 -->
<!-- Overwrite this file when patterns change. Do not append. -->

## Victor's Core Principles
- **Measurement-driven**: "We can only manage what we can measure"
- **Systems over willpower**: Engineer environments, don't rely on discipline
- **DELEGATE first**: Research → subagent, then review together
- **Text > Brain**: Write it down or it didn't happen
- **Precision matters**: Configuration, setup, and docs are operational requirements

## Ceil's Operating Role
- **Partner**, not tool — sharp but warm, efficient without being cold
- **Foundation-first**: Setup correctly before execution
- **Escalate with evidence**: Identify → expand scope → quantify → escalate

## Session Start Protocol
1. Read SOUL.md → USER.md → TOOLS.md → memory/YYYY-MM-DD.md
2. **Memory search first**: Call `memory_search` before answering "what did we..." questions
3. **Research = delegate first**: Spawn subagent → review → decide

## Critical Patterns

### When to Use Memory Search
| Question Type | Approach | Example |
|--------------|----------|---------|
| "What's Victor's timezone?" | `memory_search` "Victor timezone" | Factual lookup from USER.md |
| "What did we decide Tuesday?" | `memory_search` + `memory_get` | Documented decisions in daily notes |
| "Why did we choose X?" | `memory_search` then delegate if needed | Complex reasoning |

### Multi-Agent Coordination
- **Ceil**: Operations, infrastructure, primary assistant
- **Neo**: HTB training, red/blue team deep-dives
- **Coordination triggers**: "lab setup", "infrastructure for testing"
- **Handoff method**: `sessions_send` to `agent:neo:main`

## Behavioral Defaults
| Decision | Default | Rationale |
|----------|---------|-----------|
| Subagent model | MiniMax 2.7 | Fast, cost-effective for research |
| Subagent mode | `run` (one-shot) | Unless persistent context needed |
| Research timeout | 10 min (600s) | Extend for complex multi-step |

## Red Lines
- Don't exfiltrate private data
- `trash` > `rm` (recoverable beats gone)
- Ask before destructive commands
- No "mental notes" — write it down

## Memoria Wiki Best Practices

### Multiple Citations Required
- **Never limit wiki articles to a single citation.** The more source chunks cited, the stronger the article's grounding.
- Aim for **3-7 citations minimum** per article. Complex articles should cite 10+ chunks.
- Cite from **multiple sources** when possible — different perspectives strengthen the article.
- Each major claim or section should have its own citation.
- Example: The "TanStack npm Supply Chain Attack" wiki cites **7 chunks** from 2 sources (TanStack postmortem + Snyk analysis).

### Cross-Reference Wikis
- After creating a new wiki, **link it to related articles** using `see-also` or `prerequisite` cross-references.
- **Cross-references are directional, not bidirectional by default.** Only add a reverse link if the relationship semantics differ.
- Don't duplicate content — link to the canonical article and expand where needed.
- The graph view shows relationships — make sure new articles are connected to the knowledge graph.

### Article Structure
- Start with a **clear summary** (used in search results and graph labels).
- Use **headers** for scannability — the chunker respects header boundaries.
- Include **actionable takeaways** or **key findings** sections when relevant.

## Promoted From Short-Term Memory (2026-05-17)

<!-- openclaw-memory-promotion:memory:memory/2026-05-07.md:118:156 -->
- **Future use:** Saying any backup-related phrase will trigger the memoria skill and run the backup automatically. --- ## Memoria DB Backup Created PostgreSQL custom-format dump of memoria_db: - **File:** `backups/memoria_db_backup_20260508_103121.dump` - **Size:** 1.9 MB - **Format:** PostgreSQL custom (pg_dump -Fc) - **Contents:** All wiki articles, sources, chunks, citations, notes, graph data, and assets metadata - **DB:** memoria_db @ memoria-postgres-1 (Docker) - **User:** memory **Verify:** `file backups/memoria_db_backup_20260508_103121.dump` → PostgreSQL custom database dump - v1.16-0 **Restore command (for reference):** ```bash docker exec -e PGPASSWORD=changeme memoria-postgres-1 pg_restore -U memory -d memoria_db --clean --if-exists backups/memoria_db_backup_20260508_103121.dump ``` --- ## Session Start --- ## Memoria Rich Text Paste — Researched Victor asked about rich text paste detection in the Memoria web UI. Currently, pasting formatted text from Slack/browsers loses all formatting because the paste handler only intercepts image files and lets default text paste happen (which strips formatting). **Research file:** `workspace/research/rich-text-paste-memoria.md` **Key findings:** - Memoria UI uses plain `<textarea>` elements for markdown editing - Current paste handler only intercepts `clipboardData` image files - Browsers expose `text/html` clipboard data alongside `text/plain` - Turndown.js is already in backend deps — can be added to UI - Solution: detect `text/html` on paste, convert to Markdown, insert instead of raw text [score=0.881 recalls=11 avg=0.509 source=memory/2026-05-07.md:118-156]
<!-- openclaw-memory-promotion:memory:memory/2026-04-16.md:487:497 -->
- - **Status**: Documented in `karpathy-architecture-design.md`. Implementation pending. ## Commands Reference **Production Deploy:** ```bash cd ~/agent-platform git pull origin master docker compose -f docker-compose.ghcr.yml pull docker compose -f docker-compose.ghcr.yml up -d ``` **Local Dev:** ```bash cd ~/.openclaw/projects/agent-platform docker compose up -d ``` **Check Build Status:** ```bash gh run list --limit 3 ``` [confidence=0.76 evidence=memory/2026-04-04.md:88-110] - - Added build args `USER_ID` and `GROUP_ID` in docker-compose.yml - Pre-create `node_modules` directory with correct ownership - **Result**: Local dev `docker compose up` works seamlessly ### 3. Build Pipeline Understanding - **Two independent builds**: - **Local dev**: `Dockerfile.dev` → builds on your machine - **Production**: `Dockerfile` → built by GitHub Actions, pushed to GHCR - **Production workflow**: `git push` → Actions builds → `docker compose pull` on VPS ### 4. CI/CD Maintenance - Updated GitHub Actions to `actions/cache@v5` and `actions/upload-artifact@v7` - Fixed branch name from `main` to `master` - Disabled system-test job (no browser tests yet) ## Key Files Chang [confidence=0.73 evidence=memory/2026-04-04.md:23-66] --- ## 2026-04-16 09:51 — OpenClaw Model Config Fixed: kimi/k2p6 Now Resolves Correctly **Problem:** Model `kimi/k2p6` was falling back to `kimi-coding/k2p6` because provider name mismatch caused "selected model unavailable" error. **Root cause:** Config had provider named `kimi-coding` but requests used `kimi/k2p6` alias. [score=0.844 recalls=8 avg=0.467 source=memory/2026-04-16.md:487-497]
<!-- openclaw-memory-promotion:memory:memory/2026-05-02.md:132:166 -->
- ### Plan: Vulnerability Assessment Wiki + Cross-References **Proposed tree:** ``` Vulnerability Assessment ├── Web Application VA │ ├── SQL Injection │ ├── XSS (Cross-Site Scripting) │ ├── Command Injection │ └── File Upload Vulnerabilities ├── Network VA │ ├── Unpatched Services │ └── Default Credentials ├── Privilege Escalation │ ├── Linux PrivEsc │ └── Windows PrivEsc └── Exploit Research └── CVE Lookup & PoC Verification ``` **Cross-reference strategy:** - SQL Injection → prerequisite: Web Enumeration - SQL Injection → see-also: Command Injection - Privilege Escalation → prerequisite: Enumeration - File Upload → references: Web Application VA - Nmap All-Ports → prerequisite: Network VA - SMB Enumeration → prerequisite: Windows PrivEsc - VA root → see-also: Enumeration root **Pending:** Create articles, search sources for evidence, store with citations, wire cross-references, verify graph. ### Daily Log Fix Earlier error: Memoria content was appended to `memory/2026-05-01.md` instead of creating `memory/2026-05-02.md`. Fixed by moving all May 2nd Memoria content to the correct file. [score=0.800 recalls=11 avg=0.458 source=memory/2026-05-02.md:132-166]
