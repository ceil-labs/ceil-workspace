# Research: HTML as a Knowledge Artifact in Memoria

**Source:** "Using Claude Code: The Unreasonable Effectiveness of HTML" by Thariq (@trq212)
https://x.com/trq212/status/2052809885763747935

---

## Core Argument

Markdown has become the default format for agent-human communication, but it is increasingly restrictive as agents become more powerful. HTML offers:
- Higher information density (tables, SVG, CSS, scripts, interactive elements)
- Visual clarity for long documents (>100 lines of markdown become unreadable)
- Easier sharing (upload to S3, open in browser)
- Two-way interaction (sliders, knobs, copy-to-prompt buttons)

---

## Searchability of HTML with Embeddings

**The Challenge:**
Embeddings operate on semantic text. HTML is saturated with markup — tags, attributes, CSS rules, JavaScript — that dilute semantic signal. If you naively embed raw HTML, the chunks become noisy and search relevance drops.

**Solution Path — Dual-Track Processing:**
1. **Rendering Track:** Store the original HTML file (or inline it as a note/wiki body). Serve it as-is for display.
2. **Search Track:** Extract clean semantic text from the HTML before chunking/embedding. Strip tags, inline CSS, and scripts. Keep the text hierarchy (headings, paragraphs, list items, table cell text).

**Technical Approach:**
- Use `turndown` (already in Memoria's backend deps) or `cheerio` (also in deps) to parse HTML and extract plain text with structure.
- Or use `cheerio` to walk the DOM and extract text nodes in reading order, preserving paragraph/section boundaries.
- For tables: extract as "Header: value" pairs or markdown table format so tabular data remains semantically searchable.
- For interactive elements (sliders, forms): extract labels, descriptions, and default values as searchable text.
- Chunk the extracted text (~400 tokens with overlap, same as current pipeline).
- Embed the text chunks. The original HTML is stored separately and referenced by the chunks.

**Search Query Flow:**
- User searches: "rate limiter token bucket"
- Memoria searches text embeddings → finds chunks from HTML artifact's extracted text
- Result shows: snippet from clean text + link to open the interactive HTML artifact

---

## Memoria Integration — Where Does HTML Fit?

### Current Memoria Layers

| Layer | Format | Searchable | Interactive | Shareable |
|-------|--------|-----------|-------------|-----------|
| Sources (PDF/MD) | Original + extracted text | ✅ | ❌ | ❌ |
| Wiki articles | Markdown + citations | ✅ | ❌ (static) | ✅ (published) |
| Notes | Markdown scratchpad | ✅ | ❌ | ❌ (owner-only) |
| Cross-references | Typed edges | — | — | — |

### HTML's Natural Fit

HTML is a **new dimension** that doesn't map cleanly to any existing layer. It requires both searchability AND interactivity.

**Option A: Extend Notes**
- Add `contentType: "html"` to notes alongside `contentType: "markdown"`.
- Notes are owner-only, which matches the "throwaway editor" use case from the article.
- But notes don't have citations (by design), and HTML artifacts often synthesize from sources.
- **Verdict:** Partial fit. Good for throwaway interactive editors, bad for curated knowledge.

**Option B: Extend Wiki Articles**
- Add HTML rendering mode to wiki articles. `kind: "artifact"` or `kind: "interactive"`.
- Wiki articles must cite ≥1 source chunk. HTML artifacts synthesized from code, Slack, git history would cite those sources.
- Published HTML artifacts could be shared via S3 or served from Memoria's asset endpoint.
- Cross-references (prerequisite, see-also) link between artifacts and other articles.
- **Verdict:** Strong fit for specs, reports, code explainers, research summaries.

**Option C: New "Artifact" Layer**
- Create a top-level layer alongside sources, wikis, and notes.
- Artifacts = owner-created, interactive HTML documents with dual-track search.
- They bridge the gap between "throwaway" (notes) and "curated" (wikis).
- Can be linked from wikis via `[[slug]]` and from notes via `[[wiki:slug]]`.
- **Verdict:** Most flexible, but adds architectural complexity.

**Recommended: Option B — Extend Wiki with new `kind`**

Introduce `kind: "artifact"` as a wiki article type. Artifacts are HTML-first, citation-required, and linkable in the knowledge graph. They reuse the existing wiki infrastructure (tree, links, citations, search) with an added rendering mode.

| `kind` | Use when |
|--------|----------|
| `synthesis` | Query produced an answer worth keeping |
| `entity` | Specific thing — person, place, org |
| `concept` | Idea, framework, pattern |
| `summary` | Recap of one source or tight cluster |
| `comparison` | A-vs-B analysis |
| `overview` | Top-level page aggregating many children |
| **`artifact`** | **Interactive HTML document — spec, report, prototype, explainer** |

---

## Knowledge Artifact That Best Leverages HTML

### The Winner: `kind: "artifact"` (Interactive Explainer)

**Why:**
1. **Interactivity is the differentiator.** Markdown can't do sliders, copy-to-prompt buttons, live previews, or drag-and-drop editors. HTML can.
2. **Synthesizes from multiple sources.** The article shows Claude Code ingesting code folders, git history, Slack, and browser context to build rich HTML reports. Memoria already ingests these sources — an artifact would synthesize them into an interactive view.
3. **Searchable via extracted text.** The dual-track approach keeps search working.
4. **Citable and linkable.** Artifacts sit in the wiki tree, reference source chunks, and link to related articles.
5. **Shareable.** Export as standalone HTML file (like `workspace/research/*.md` files but richer) or serve from `/api/assets`.

**Use Cases for Memoria:**

| Use Case | Artifact Content | Sources Cited |
|----------|-----------------|---------------|
| **Spec / Plan** | Interactive mockups, data flow diagrams, code snippets | Git history, codebase chunks, Linear tickets |
| **Code Review** | Diff view with annotations, severity colors, inline comments | PR diff, codebase chunks |
| **Research Report** | SVG diagrams, flowcharts, key findings in tabs | Web sources, ingested PDFs, wiki articles |
| **Custom Editor** | Drag-and-drop ticket prioritization, feature flag editor, prompt tuner | Linear API, config files, prompt history |
| **Incident Report** | Timeline visualization, log excerpts, impact diagram | Log sources, git commits, Slack transcripts |

**Example Workflow:**
1. Ingest codebase + git history + Slack discussions into Memoria sources
2. Search: "rate limiter token bucket implementation"
3. Synthesize into `kind: "artifact"` article: "Rate Limiter Explainer"
4. Article body = HTML with:
   - SVG token-bucket flow diagram
   - 3-4 annotated code snippets
   - "Gotchas" section with colored severity
   - "Copy as prompt" button to send back to Claude Code
5. Citations link to the actual code chunks
6. Search finds the artifact when querying "rate limiter" (via extracted text)
7. User opens artifact in browser to explore interactively

---

## Implementation Considerations

### Frontend (Memoria UI)
- Add `contentType` field to wiki/notes schema: `"markdown" | "html"`
- Default remains `"markdown"`. HTML is opt-in per article.
- Render `contentType: "html"` articles in an `<iframe>` or sanitize + render inline.
- For notes: `NoteEditPage.tsx` needs a mode toggle (markdown ↔ HTML).
- For wikis: `WikiArticle.tsx` renders HTML directly when `contentType === "html"`.

### Backend (Ingest/Search)
- Extend chunker to handle HTML: parse with `cheerio`, extract text hierarchy, chunk clean text.
- Store original HTML in a new column `rawContent` or `htmlBody` alongside `content` (clean text).
- Search operates on `content` (clean text). Display uses `htmlBody`.
- Reuse existing citation/link/cross-reference infrastructure.

### Storage
- HTML artifacts may include inline CSS/JS. Store in `wiki_articles` table with `htmlBody` TEXT column.
- For large artifacts with external assets (images, fonts), use the existing asset upload flow (`POST /api/assets`) and reference them via relative URLs.

### Security
- Sanitize HTML before rendering to prevent XSS. `DOMPurify` or similar.
- Allowlist: `<div>`, `<span>`, `<p>`, `<h1-6>`, `<table>`, `<ul/ol/li>`, `<a>`, `<img>`, `<svg>`, `<script>` (for interactive elements — risky but necessary for the use case).
- Alternative: Render in sandboxed `<iframe>` with `sandbox="allow-scripts"`.

---

## Open Questions

1. **Should artifacts be owner-editable only, or agent-generated?** The article emphasizes agent-generated HTML. Memoria's wiki layer is agent-written. So artifacts would be primarily agent-generated, with human review.

2. **Version control for HTML?** The article notes HTML diffs are noisy. Memoria's revision model snapshots full content. HTML revisions would be large. Consider storing diff-friendly extracted text for history, while keeping full HTML for the current version.

3. **Should artifacts be exportable as standalone `.html` files?** Yes — this is core to the article's sharing argument. A "Download as HTML" button that bundles all assets into a single file.

4. **Interaction with the graph?** Artifacts appear as nodes in the wiki graph. Their rich content makes them natural "hub" nodes that many articles link to.

---

## Next Steps (for iteration)

1. **Prototype:** Create a single `kind: "artifact"` wiki article in Memoria manually to test the rendering flow.
2. **Chunker test:** Run the existing text extraction pipeline on a sample HTML file and verify search quality.
3. **Skill draft:** Write a `html-artifact` skill for agents that:
   - Searches sources/wiki
   - Synthesizes findings into an interactive HTML artifact
   - Saves it to Memoria with proper citations
4. **Feedback:** Show the artifact rendering to users and collect feedback on readability vs. markdown.

---

**Status:** Idea captured. Ready for iteration and prototyping.
**Saved:** `workspace/research/html-knowledge-artifact-memoria.md`

---

## React Interactivity Options for Artifacts

Since Memoria's UI is built in React, there are three architectural approaches for rendering interactive artifacts:

### Option 1: Raw HTML in Sandboxed iframe (Thariq's approach)

Store the HTML string in `htmlBody` and render it in a sandboxed iframe:

```tsx
<iframe 
  srcDoc={article.htmlBody} 
  sandbox="allow-scripts allow-same-origin"
  style={{ width: '100%', height: '600px', border: 'none' }}
/>
```

**Pros:**
- Self-contained — CSS and JS inline
- Safe — `sandbox` prevents access to parent
- Matches Thariq's workflow exactly
- Fastest to implement (just add `htmlBody` column)

**Cons:**
- No access to React hooks, context, or Memoria's component library
- Each artifact is an island — can't compose with Memoria UI
- No shared state with parent app (unless `postMessage` bridge built)

**Best for:** One-off reports, code explainers, design mockups, throwaway editors.

---

### Option 2: React Component Registry with JSON Config

Instead of HTML strings, store a JSON description of a React component tree:

```json
{
  "type": "Artifact",
  "children": [
    { "type": "MarkdownSection", "props": { "content": "## Analysis" } },
    { "type": "Slider", "props": { "label": "Token bucket", "min": 0, "max": 1000 } },
    { "type": "Chart", "props": { "type": "line", "dataSource": "metrics" } },
    { "type": "CodeBlock", "props": { "language": "typescript", "source": "..." } }
  ]
}
```

Memoria UI maintains a component registry:

```tsx
const registry = {
  MarkdownSection, Slider, Chart, CodeBlock, DataTable, SvgDiagram
};

function ArtifactRenderer({ config }) {
  return renderTree(config, registry);
}
```

**Pros:**
- Full React hooks, context, state management
- Components can call Memoria APIs (search, update wiki, etc.)
- Uses Memoria's existing component library (lucide icons, tailwind)
- Type-safe with TypeScript definitions

**Cons:**
- Not arbitrary HTML/JS — limited to registered components
- Agent can't invent new component types on the fly
- More complex to implement than iframe

**Best for:** Dashboards, tuners, editors that need live Memoria data.

---

### Option 3: Preact Runtime in iframe (Self-Contained Shareables)

For external-facing artifacts (upload to S3, share via link), use Preact inside the iframe:

```html
<script type="module">
  import { h, render, useState } from 'https://esm.sh/preact@10';
  import htm from 'https://esm.sh/htm@3';
  const html = htm.bind(h);
  
  function App() {
    const [value, setValue] = useState(50);
    return html`<input type="range" value=${value} onInput=${e => setValue(e.target.value)} />`;
  }
  render(html`<${App} />`, document.body);
</script>
```

**Pros:**
- React-like hooks without bundling React (~10KB vs ~130KB)
- Self-contained for S3 upload / email attachment
- Can graduate from iframe to component registry later

**Cons:**
- Still sandboxed — no Memoria API access
- CDN dependency for Preact module

**Best for:** Exportable standalone files, shared reports.

---

### Recommendation: Start Hybrid

| Artifact Type | Storage | Rendering | Use Case |
|-------------|---------|-----------|----------|
| **Static artifact** | `htmlBody` string | DOMPurify + inline render | One-off reports, code explainers |
| **Interactive artifact** | JSON config | Component registry | Dashboards, tuners, editors |
| **Sandboxed app** | `htmlBody` string | iframe + Preact runtime | External shareables (S3 upload) |

**Start with Option 1 (iframe + htmlBody)** for first prototype:
1. Fastest to implement — just add `htmlBody` column to `wiki_articles`
2. Matches Thariq's workflow exactly
3. Secure by default (sandboxed)
4. Can always graduate to Option 2 later

**Graduate to Option 2 (component registry)** when artifacts need:
- Live Memoria API queries
- In-place wiki editing
- Shared component library

**Keep Option 3 (Preact iframe)** for:
- Standalone `.html` exports
- Agent-generated throwaway editors

---

## Status

**Idea captured. Ready for iteration and prototyping.**
**Saved:** `workspace/research/html-knowledge-artifact-memoria.md`
**Updated:** 2026-05-09
