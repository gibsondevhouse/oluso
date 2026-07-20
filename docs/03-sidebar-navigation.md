# 03 — Sidebar navigation

Status: Governing target
Last updated: 2026-07-20

## Navigation objective

The sidebar should guide the user through current HSE operations work while preserving direct access to canonical registers and placing deferred campaign routes behind a Future Modules boundary.

## Target structure

```text
Home
  Home
  Search
  Activity

Operations
  Actions
  Inspections & Observations
  Incidents

The Plant
  Locations
  Functions, Processes & Tasks
  Equipment
  Chemicals & SDS
  People

Exposure
  Similar Exposure Groups (SEGs)
  Assessments
  Monitoring & Sampling
  Controls & Reassessment

Reports
  Review Packets & Exports

Administration
  Profile & Local Actor
  Installation
  Storage, Backups & Diagnostics

Future Modules
  Deferred campaign/register routes

```

## Rules

- `Home` is the canonical landing route and answers where the user is working, what needs attention, what can be resumed, and what local data state exists.
- `The Plant` contains reusable operational context records; it must not duplicate scenario-specific information.
- `Exposure` follows the assessment spine and uses explicit typed entities where those gates are available.
- `Administration` separates local actor, installation, storage, backups, and diagnostics from manual exchange workflows.
- `Future Modules` is collapsed by default and clearly labeled as deferred/legacy.
- Detail, create, edit, history, and conflict-resolution routes do not receive primary sidebar items.
- Counts indicate actionable gaps, conflicts, due work, or reviews—not decorative totals.
- Navigation must work in an installed PWA and a normal supported browser tab.

## Migration from current navigation

The current broad HSE/campaign route set is implementation inventory. Routes may remain reachable during migration, but sidebar promotion does not imply target support.

Remove or relocate navigation in this order:

1. Place deferred campaign families under Future Modules.
2. Promote Home, Operations, The Plant, Exposure, Reports, and Administration.
3. Reorganize chemical and location routes around normalized models.
4. Replace generic assessment, determination, and sampling pages with typed workflows.
5. Add Review Exchange once package dry-run and conflict handling are functional.

## Implemented Campaign 6A-6E portal state

The application currently implements the structure above with `/home`, `/search`, and `/activity` as the Home group. Existing stable list/detail/create/edit routes remain reachable even where sidebar promotion changed. Campaign register routes remain reachable under Future Modules and are visually labeled as future/deferred, not production-ready Campaign 6 workflows.

The shell also exposes a command palette from a visible Search button and `Ctrl+K`/`Cmd+K`. The palette uses one command-intent registry for primary navigation, recent local destinations, eligible create/start routes, and read-only retained-register search results. It does not perform hidden mutations.
