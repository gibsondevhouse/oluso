# 06 — Design principles

Status: Governing
Last updated: 2026-07-20

## Product character

ADAMA HSE should feel like a calm professional operations console: structured, dense but readable, traceable, and explicit about uncertainty.

## Principles

### Workflow before register breadth

Guide users through baseline and exposure work. Registers remain available for search and maintenance, but the user should not assemble the workflow mentally from many pages.

### Home before schema

The opening route is `/home`. It presents working context, continue-work items, attention, plant status, quick actions, limited recent activity, responsibility summaries, and local data health before exposing register structure.

### Context persistence

Carry Site, Unit, Process, Task, SEG, Scenario, and review context between relevant screens. Show active context in headers and breadcrumbs.

### Progressive completeness

Allow drafts and distinguish missing, unknown, not applicable, stale, and conflicting values. Enforce stronger rules when promoting, reviewing, determining, verifying, or closing.

### Traceability at a glance

Material record views expose:

- Business ID and revision.
- Status and review state.
- Creator/updater attribution.
- Scenario or operational context.
- Evidence and data-quality state.
- Related actions and reassessment.
- History and exchange-package source.

### Professional judgment remains visible

Display calculations, assumptions, and limit bases separately from professional interpretation and determination. Never label a numeric comparison as a professional or legal conclusion.

### Review is deliberate

Import and review interfaces show what will change before applying it. Conflicts use side-by-side base/local/external comparison with a required resolution and rationale.

### Local-first trust

Communicate last successful local write, storage/quota risk, schema/migration status, last verified backup, offline/PWA readiness, and pending/failed package operations.

Do not use sync language for local writes or manual exchange. The absence of a network must not block normal record work after first load.

### Laptop-first, browser-capable layout

Optimize for managed corporate laptop displays, keyboard navigation, tables, split views, and printable packets. Maintain functional responsive behavior for narrower browser windows without turning the core workflow into a phone-first inspection app.

### Semantic visual tokens

Campaign-owned surfaces use shared semantic tokens for surface, border, state, focus, radius, spacing, elevation, and motion. Do not introduce one-off colors when an app token exists. Print, forced-colors, and reduced-motion behavior are part of the token contract.

### Actionable Home and derived views

Prioritize missing workflow links, data gaps, reviews, conflicts, overdue actions, failed controls, and reassessment due. Avoid decorative counts and charts that do not lead to corrective work.

### Evidence without document sprawl

Use typed evidence references, revision metadata, and clear missing-evidence states. Do not imply that ADAMA HSE owns or controls an external document unless it actually does.

### Archive, do not erase history

Normal lifecycle removal is archive or supersession. Destructive operations are exceptional, explicit, and history-preserving through tombstones/revisions.

## Required UI states

Every record workflow defines loading, empty, no matches, draft/incomplete, dirty, saving/saved, failed write/recovery, missing/archived dependency, stale revision, validation, not-found, history, and source-package states.

Exchange workflows additionally define file parsing, validation, dry-run, conflict, apply, rollback, partial-read failure, and idempotent re-import states.

## Accessibility and print

- All workflows are keyboard operable.
- Status is never communicated by color alone.
- Tables have meaningful headers and accessible sorting/filtering controls.
- Form errors identify the field and corrective action.
- Conflict diffs remain understandable to screen readers.
- Review packets print without interactive controls or hidden color meaning.
- Read-first context panels provide focus entry, Escape close, and a stable route to the full record.

## Anti-patterns

- Generic forms for safety-critical entities.
- Home or dashboard vanity metrics.
- Silent save/import failure.
- A single `result > limit` exposure status.
- Free-text relationships where canonical records exist.
- Hiding archived dependencies from historical records.
- Calling manual exchange or local persistence “sync.”
- Treating OneDrive as the database.
- Maintaining separate desktop and browser product behavior.
- Reactivating deferred campaign modules before exit gates are met.
