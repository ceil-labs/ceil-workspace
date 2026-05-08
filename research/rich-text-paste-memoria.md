# Rich Text Paste Detection — Research Summary

## The Problem

In the Memoria web UI, pasting formatted text (e.g., from Slack, VS Code, a browser) into a `<textarea>` loses all formatting. Slack, Notion, and other apps detect rich clipboard content and convert it to their native format (Markdown for Memoria).

## How It Works (Clipboard API)

When a user copies rich text, the OS clipboard often contains **multiple formats**:
1. `text/plain` — raw text, no formatting
2. `text/html` — HTML with formatting (bold, italic, code, links, etc.)
3. `text/rtf` — RTF format (less common on web)

Browsers expose this via `ClipboardEvent.clipboardData.getData(mimeType)`.

### Slack's Approach (and others)

```javascript
// On paste event:
const html = e.clipboardData.getData('text/html');
const plain = e.clipboardData.getData('text/plain');

if (html && html !== plain) {
  // Rich content detected — convert to Markdown
  const markdown = htmlToMarkdown(html);
  e.preventDefault();
  insertMarkdown(markdown);
}
```

## Memoria's Current Handler

File: `~/.openclaw/projects/memoria/ui/src/pages/notes/NoteEditPage.tsx`

```tsx
const onContentPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === "file" && it.type.startsWith("image/")) {
        const f = it.getAsFile();
        if (f) imageFiles.push(f);
      }
    }
    if (imageFiles.length === 0) return; // ← LETS DEFAULT TEXT PASTE HAPPEN
    e.preventDefault();
    for (const f of imageFiles) void uploadImageAndInsert(f);
  };
```

**The gap:** When no images are in the clipboard, Memoria lets the browser's default paste happen. The browser only pastes `text/plain`, so formatting is lost.

## Solution Path

### 1. Detect Rich Text on Paste

```tsx
const onContentPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
  // Existing image paste handling...
  const items = e.clipboardData?.items;
  const imageFiles: File[] = [];
  if (items) {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === "file" && it.type.startsWith("image/")) {
        const f = it.getAsFile();
        if (f) imageFiles.push(f);
      }
    }
  }
  if (imageFiles.length > 0) {
    e.preventDefault();
    for (const f of imageFiles) void uploadImageAndInsert(f);
    return;
  }

  // NEW: Rich text paste detection
  const html = e.clipboardData?.getData('text/html');
  const plain = e.clipboardData?.getData('text/plain');
  
  if (html && html.trim().length > 0 && html !== plain) {
    // Rich HTML detected — convert to Markdown
    const markdown = convertHtmlToMarkdown(html);
    if (markdown && markdown !== plain) {
      e.preventDefault();
      insertAtCursor(markdown);
      return;
    }
  }
  // Fallback: let default text paste happen
};
```

### 2. HTML → Markdown Conversion

**Option A: Turndown.js** (already in Memoria backend deps)
- Library: `turndown` — converts HTML to Markdown
- Pros: Battle-tested, handles tables, code blocks, links
- Cons: Need to add to UI package.json

**Option B: Custom lightweight converter**
- Handle the most common cases: `<b>`, `<i>`, `<code>`, `<pre>`, `<a>`, `<ul>`, `<ol>`, `<li>`, `<h1>`-`<h6>`, `<p>`, `<br>`
- Pros: No dependency, full control
- Cons: More code to maintain

### 3. Mapping HTML → Markdown

| HTML Element | Markdown |
|-------------|----------|
| `<b>`, `<strong>` | `**text**` |
| `<i>`, `<em>` | `*text*` |
| `<code>` (inline) | `` `text` `` |
| `<pre><code>` | `\`\`\`lang\n...\n\`\`\`` |
| `<a href="...">` | `[text](url)` |
| `<h1>` - `<h6>` | `#` - `######` |
| `<ul><li>` | `- item` |
| `<ol><li>` | `1. item` |
| `<p>` | paragraph + blank line |
| `<br>` | newline |
| `<blockquote>` | `> text` |

### 4. Edge Cases

- **Source attribution:** When pasting from Slack, the clipboard HTML often includes Slack-specific wrapper markup. Need to strip or ignore.
- **Google Docs/Word:** These produce messy HTML with inline styles. Turndown handles this better than a custom converter.
- **Plain text preference:** Some users may want to paste without conversion. Consider a modifier key (Ctrl+Shift+V already does plain paste in most OSes, but browsers may not expose it).
- **Code blocks from VS Code / IDEs:** These typically paste as `<pre><code>` or just `<pre>` with CSS classes. Need to detect language from class names (e.g., `class="language-javascript"`).

## Reference Implementations

- **Slack's paste handler:** Not open source, but the behavior is well-documented in community analyses
- **Notion:** Uses a sophisticated HTML parser with custom block-type detection
- **Turndown.js:** https://github.com/mixmark-io/turndown — `new TurndownService().turndown(html)`
- **Simple online demos:** Many CodePen examples show basic `text/html` → markdown conversion

## Recommendation for Implementation

1. **Add Turndown.js to UI dependencies** (it's already in the main project)
2. **Create a shared `useRichPaste` hook** or utility function that can be reused across:
   - `NoteEditPage.tsx`
   - `WikiArticle.tsx` (or wherever wiki editing happens)
3. **Configure Turndown rules** for Memoria-specific needs:
   - Code block language detection from CSS classes
   - Strip unnecessary wrapper divs from Slack/browser sources
4. **Add a toggle/preference** if users want to disable rich paste (future enhancement)

---

## Agent Prompt — Implementation

Use this prompt with a coding subagent to implement rich text paste in Memoria:

```
# Task: Add Rich Text Paste Detection to Memoria UI

## Context
Memoria is a knowledge base web app with a React frontend (in `projects/memoria/ui/`). 
It uses plain `<textarea>` elements for markdown editing. Currently, pasting formatted text 
from Slack, VS Code, or browsers loses all formatting (bold, italic, code, links, etc.).

## Current Code
The paste handler is in `src/pages/notes/NoteEditPage.tsx` (around line 350):

```tsx
const onContentPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === "file" && it.type.startsWith("image/")) {
        const f = it.getAsFile();
        if (f) imageFiles.push(f);
      }
    }
    if (imageFiles.length === 0) return; // let default text paste happen
    e.preventDefault();
    for (const f of imageFiles) void uploadImageAndInsert(f);
  };
```

The `insertAtCursor` helper already exists in the same file.

## Requirements

1. **Detect rich text paste:** When `e.clipboardData.getData('text/html')` contains 
   meaningful HTML (not just plain text wrapped in a div), intercept it before the 
   browser's default paste.

2. **Convert HTML to Markdown:** Use `turndown` library to convert the HTML to GitHub-Flavored 
   Markdown. Turndown is already a dependency in the main project (`projects/memoria/package.json`).
   Add it to `projects/memoria/ui/package.json` as well.

3. **Smart code block handling:** When pasting from VS Code or Slack code blocks, detect 
   the programming language from CSS classes (e.g., `class="language-javascript"` or 
   `class="hljs javascript"`) and include it in the markdown fence: ` ```javascript `.

4. **Strip source cruft:** Remove wrapper divs from common sources (Slack adds 
   `<div class="ql-container">` wrappers, browsers may add `<meta charset="utf-8">` tags).

5. **Preserve existing behavior:** Image paste, plain text paste, and the `[[...]]` 
   autocomplete must all continue working exactly as before.

6. **Reusable:** Create the paste handler as a reusable hook or utility so it can be 
   applied to both `NoteEditPage.tsx` and any wiki article editor (`WikiArticle.tsx` 
   or similar — check which files have textareas).

## Files to Modify
- `projects/memoria/ui/package.json` — add `turndown` dependency
- `projects/memoria/ui/src/pages/notes/NoteEditPage.tsx` — integrate rich paste
- Find and update wiki article editor textarea(s) as well

## Acceptance Criteria
- [ ] Pasting bold text from Slack → `**bold**` in textarea
- [ ] Pasting italic text from a browser → `*italic*` in textarea  
- [ ] Pasting inline code from Slack → `` `code` `` in textarea
- [ ] Pasting a code block from VS Code → ` ```lang\ncode\n``` ` in textarea
- [ ] Pasting a link from a browser → `[text](url)` in textarea
- [ ] Pasting plain text still works (no change)
- [ ] Pasting images still works (no change)
- [ ] `[[...]]` autocomplete still works (no change)

Run `npm install` in `projects/memoria/ui/` after adding the dependency.
```
