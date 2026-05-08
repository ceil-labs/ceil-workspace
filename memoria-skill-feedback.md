# Memoria Skill Feedback — Cross-Reference & Link Type Gaps

## Issue 1: Tree vs. Cross-Reference Redundancy

### The Problem
When I created an `Enumeration` overview article with two children (`Linux Enumeration Tools`, `Windows Enumeration Tools`) via `parentSlug`, I also added `see-also` cross-references from the parent to each child. The graph view rendered **duplicate edges** — the tree hierarchy already draws a line, and the `see-also` link draws a second line on top.

### What the skill says
The `manage-wiki` skill states: *"Cross-references are evidence-from-other-articles — typed pointers between wiki articles that capture relationships the parent/child tree can't express on its own."*

### What's missing
The skill never clarifies that **the tree itself renders as edges in the graph**. A parent-child relationship is ALREADY visible. Adding a cross-reference between parent and child creates visual redundancy.

### Suggested fix
Add to agents manifesto §4b or manage-wiki skill:
> **Tree vs. Cross-references in the graph:** The wiki tree (`parentSlug`) already renders as hierarchical edges in the graph view. Cross-references (`links: []`) should be reserved for non-hierarchical relationships — lateral connections between siblings, prerequisites across branches, or links to articles outside the tree. Adding `see-also` or `prerequisite` links between a parent and its direct child creates redundant visual edges.

---

## Issue 2: Multi-linkType per Entry — Not Allowed, Not Documented

### The Problem
I assumed I could attach multiple `linkType` values to a single cross-reference entry (e.g., a link that is both `prerequisite` AND `see-also`). This is **not allowed** — the schema defines `linkType` as a single string per entry.

### What I discovered
To achieve multiple relationship types between the same two articles, you must create **separate entries**:
```json
[
  { "targetSlug": "enumeration", "linkType": "prerequisite" },
  { "targetSlug": "enumeration", "linkType": "see-also" }
]
```

### What's missing
The skill docs don't explicitly state this constraint. The `linkType` enum is listed, but there's no mention that each entry can only carry one type.

### Suggested fix
Add to agents manifesto §4b:
> Each cross-reference entry has exactly one `linkType`. To express multiple relationship types between the same two articles, create multiple entries with the same `targetSlug` and different `linkType` values.

---

## Issue 3: Expected Use of Each linkType Is Under-Specified

### The Problem
The skill lists four `linkType` values but gives minimal guidance on when to use each. I used `prerequisite` on child→parent links thinking "you should read Enumeration first," but the expected semantic may differ.

### Current skill definitions
| `linkType` | Skill says |
|-----------|-----------|
| `prerequisite` | "Must learn first" |
| `supersedes` | "Replaces older" |
| `see-also` | "Related" |
| `references` | Catch-all default from `[[slug]]` |

### What's missing
- **Directionality**: Is `prerequisite` parent→child ("read me first"), child→parent ("I require this"), or bidirectional? The skill says "Must learn first" but doesn't clarify which direction that points.
- **Scope**: Should `prerequisite` only be used for learning paths (article A must be read before article B), or also for conceptual dependencies (e.g., "TCP/IP Primer" is a prerequisite for "Nmap Advanced")?
- **Siblings vs. Parent/Child**: Should `see-also` ONLY connect sibling articles under the same parent, or can it connect distant articles? The skill says "tangentially related, not on the parent path" — but "parent path" isn't clearly defined.

### Suggested fix
Expand the link type table in manage-wiki with:

| `linkType` | Direction | Use when | Don't use when |
|-----------|-----------|----------|----------------|
| `prerequisite` | Target must be read BEFORE this article | Hard dependency — understanding target is required to understand this article | Soft recommendation; tree parent-child already implies reading order |
| `supersedes` | This article replaces the target | Newer, more complete version exists | Minor updates or corrections |
| `see-also` | Lateral connection | Related topic but NOT a hard dependency; different parent or no shared parent | Target is already a direct parent or child in the tree |
| `references` | Auto-generated from `[[slug]]` | Casual mention in prose | Explicit typed relationship is more appropriate |

---

## Summary for Dev Team

1. **Document that tree edges render in the graph** — agents shouldn't add cross-references for relationships already expressed via `parentSlug`.
2. **Document the single-linkType-per-entry constraint** — each entry carries exactly one type; multiple types require multiple entries.
3. **Expand linkType guidance** — clarify directionality, scope, and when each type is appropriate vs. redundant.

---
*Feedback from: Ceil (agent) + Victor (operator)*
*Date: 2026-05-07*
