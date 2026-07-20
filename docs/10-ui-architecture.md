# 10 — UI architecture

Status: Governing target
Last updated: 2026-07-20

## Shell

ADAMA HSE uses a SvelteKit SPA/PWA shell with:

- Persistent primary navigation on laptop-sized screens.
- Context header and breadcrumbs.
- Main workflow content.
- Optional context/history panel.
- Global storage, backup, offline, conflict, and failed-write indicators.

The shell runs in a normal supported browser and an installed PWA. It does not depend on Tauri APIs.

## Page archetypes

### Home operations portal

Shows current working context, continue-work items, attention queues, plain-language plant status, quick actions, limited recent activity, responsibility summaries, and local data health. Every attention item links to a source record or a migration/remediation route. Counts are allowed only when their population and rule are explicit. The Recent Activity summary links to `/activity` for full source attribution.

### Completeness dashboard

Shows baseline/workflow status by Site/Unit and actionable queues for reviews, conflicts, data gaps, control verification, actions, and reassessment. Every indicator links to source records or missing steps.

### Guided baseline workspace

Maintains a selected Site/Unit context and composes hierarchy, process/task, equipment, chemical use, SEG, scenario, control, evidence, and gap capture. It saves canonical records through typed services.

### Register

Provides search, filters, sort, archive state, and stable navigation for a durable entity. Generic register configuration is allowed only when the domain model permits it.

### Record detail

Shows identity/revision, status, operational/scenario context, relationships, evidence, review, actions, history, and source exchange package.

### Typed editor/builder

Uses domain-specific steps and validation for hierarchies, chemical models, SEG membership, scenarios, assessments, sampling, determinations, and corrective action. Safety-critical entities must not use catch-all field maps.

### History view

Shows immutable revisions with actor, time, source, reason, package attribution, and field-level before/after differences.

### Activity feed

Shows a cross-record projection of immutable `record_revisions` with actor, timestamp, record type, source revision/event ID, package attribution, scope where resolvable, and stable destination. Retained legacy register rows may appear only as limited-history metadata rows and must state that they are not field-level audit history.

### Context panel

Shows read-first inspection for a related record without leaving the current workspace. It provides identity, relationship summary, missing/archived state, and an “Open full workspace” route. Version 1 panels do not contain edit forms or destructive actions.

### Exchange preview and conflict resolver

Shows package metadata/integrity, classification summary, dependency/schema failures, and base/local/external values. Applying remains disabled until blocking issues are resolved.

### Review packet

Presents a stable printable projection with source record IDs/revisions, gaps, conclusions, required actions, and review attribution.

## Component boundaries

Reusable components may own presentation and interaction for:

- Page headers, breadcrumbs, status chips, and context banners.
- Search/filter controls and tables.
- Relationship/evidence/history panels.
- Dirty-state and confirmation dialogs.
- Storage/offline/backup diagnostics.
- Completeness summaries.
- Portal query/read models.
- Command palette intents for navigation, search, and eligible create/start routes.
- Activity feed and read-first context panel presentation.
- Diff fields and conflict-resolution controls.

Domain services own validation and mutation. Components never write directly to IndexedDB, generate revisions independently, or apply package records.

## Command palette

The command palette is a shell-level accelerator. It opens from a visible Search button, `Ctrl+K`/`Cmd+K`, or `/` when focus is not inside an editable field. Commands are generated from `src/lib/navigation/command-intents.ts`; deferred Future Module routes are excluded from primary command results. Record results are read-only and link to existing stable detail routes.

Recent command entries are non-authoritative local UI preferences. They are not audit activity and are not mixed into `/activity`.

## Record-header standard

A material record header includes:

- Business ID and title.
- Revision and lifecycle status.
- Review state.
- Site/Unit or scenario context.
- Last update and actor.
- Data-quality/conflict indicators.
- History and action access.

## Exposure UI safeguards

- Scenarios display operating condition prominently.
- Assessments display uncertainty, confidence, gaps, and evidence next to qualitative conclusions.
- Result values display qualifier, unit, sampling duration, and basis.
- Comparisons display the exact versioned limit and conversion assumptions.
- Professional interpretations and determinations use distinct visual sections and attribution.
- Superseded limits/determinations are visibly historical.

## Exchange UI safeguards

- Never present “Import” as a one-click apply.
- Show dataset/source installation/base revision before record details.
- Distinguish safe automatic classifications from decisions requiring human judgment.
- Require a rationale for manual field merge or deletion acceptance.
- Show the rollback artifact before final apply.
- Report atomic failure clearly; never claim partial success for the governed exchange workflow.

## Deferred module presentation

Legacy campaign pages that remain accessible are labeled Future Module/legacy and do not claim production readiness. They must not reuse current product-status badges in a way that suggests the new domain invariants are enforced.
