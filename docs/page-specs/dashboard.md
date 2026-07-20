# Home page specification

Status: Current Campaign 6 target; filename retained during dashboard-to-Home migration
Route: `/home`
Legacy alias: `/dashboard` redirects to `/home`
Last updated: 2026-07-20

## Purpose

Open ADAMA HSE into a calm operations portal that answers:

- Where am I working?
- What needs attention?
- What was I doing?
- What can I start now?
- What changed?

Home does not make legal compliance, exposure acceptability, approval, or professional determination claims.

## Primary regions

1. Welcome and working Site/Location context.
2. Continue Working.
3. Needs Attention.
4. Today at the Plant.
5. Quick Actions.
6. Recent Activity.
7. My Responsibilities.
8. Local data/storage notice only when action is required.

## Implemented source model

Home is built through `src/lib/application/portal/home-query-service.ts`.

- Continue Working uses explicit draft, in-progress, or needs-review workflow states.
- Needs Attention uses explicit record statuses, due dates, priority, SDS status, and review status.
- Today at the Plant uses plain-language rows, not decorative charts.
- Recent Activity is labeled as limited when it comes from created/updated metadata instead of governed revision events and links to `/activity` for the traceable feed.
- Responsibility summaries group explicit owner, assigned-to, and reported-by fields only.
- Deferred/Future Module records do not contribute readiness or attention counts.
- The shell command palette can navigate to Home, Search, primary destinations, eligible create/start routes, and retained-register record results without hidden mutation.

## States

- First use: no active local records; prompt to create a Location and open Search.
- No Site/Location context: explain that a Location establishes local working context.
- Partial data: render available sections and avoid false zero-count conclusions.
- Storage failure: show a prominent local data notice linking to diagnostics.
- Offline: normal local operation after first load; do not use cloud or sync wording.
- Unsupported/legacy data: link to migration/data-quality resolution where identity mapping is not governed.

## Acceptance criteria

- `/home` is canonical and `/dashboard` redirects to `/home`.
- Every attention item links to a source or remediation route.
- Home does not claim a workflow is complete when its typed rule is unavailable.
- Counts state their source population and derivation rule in code.
- Keyboard navigation reaches Home sections and links in logical order.
- Home never stores independent business conclusions.
