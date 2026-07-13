# OLUSO MVP Evolution Plan

Last updated: 2026-07-12

This document is the execution-oriented companion to the scope and roadmap docs. It tracks what exists now, what must be hardened for MVP credibility, and how OLUSO should be elevated after the core backbone is stable.

The plan is intentionally conservative. It follows the documented product shape:

- Local-first
- Desktop-first
- Single-user
- Register-driven
- Traceable
- Audit-aware
- Exportable

The current implementation already covers the MVP backbone in broad strokes. The remaining work is not to make the app bigger first, but to make it more durable, more legible, and more defensible.

## 1. Current Baseline

The worktree currently has a functional SvelteKit/Tauri shell with local persistence and shared CRUD/detail/edit/archive flows for the main MVP registers:

- Locations
- Processes
- Equipment
- Chemicals
- Hazards
- Controls
- Risk Assessments
- SEGs
- Exposure Monitoring
- Findings
- Incidents and Near Misses
- Compliance Support
- Corrective Actions

The main implementation backbone is the shared register route pattern in `src/lib/pages/RegisterCrudPage.svelte` and `src/lib/components/register/register-config.ts`.

## 2. MVP Evolution Strategy

OLUSO should evolve in three steps:

1. Stabilize the core record model.
2. Elevate the record relationships and review behavior.
3. Add evidence-heavy workflows only after the backbone remains stable.

The rule of thumb is simple: if a feature does not improve durable records, linked context, verification, or exportability, it is probably not MVP work.

## 3. P0 - MVP Stability and Backbone Hardening

These items keep the current app from feeling like a demo shell.

- [x] Shared CRUD route for registered MVP registers.
- [x] Local persistence with SQLite and localStorage fallback.
- [x] Archive and restore flows for register records.
- [x] Basic exports for register data.
- [x] Corrective-action state model that separates completion, verification, and closure.
- [x] Corrective-action source traceability with explicit source records or justified manual sources.
- [x] Equipment register included as an HSE-relevant operational context record.
- [x] SDS and exposure-limit support for Chemical Safety.
- [x] Controls and basic Risk Assessment records.
- [x] Exposure monitoring register and workflow.
- [x] Field-work expansion beyond generic findings.
- [x] Incident and near-miss support at the scoped level.
- [x] Compliance-supporting records at the scoped level.
- [x] Import, backup, and restore controls.
- [x] Relationship validation across registers.

### Remaining P0 checks

- [x] Verify every MVP register has consistent create, read, edit, archive, restore, and export behavior.
- [x] Confirm empty, loading, error, and not-found states are consistent across all shared routes.
- [x] Ensure archived records stay visible enough for audit review without becoming active workflow noise.
- [x] Confirm the current data model matches the scope docs and registered route set.
- [x] Keep global state behind the application/repository boundary so it does not become a second database.

## 4. P1 - MVP Elevation

These items do not expand the domain footprint much, but they make the MVP substantially better to use.

### 4.1 Traceability Elevation

- [x] Add richer record headers that show source, status, owner, last updated, and linked context at a glance.
- [x] Surface backlink context consistently across shared detail pages.
- [x] Add lightweight activity traces for create, update, and archive lifecycle changes.
- [x] Make required relationships obvious when they are missing, stale, or archived.

### 4.2 Workflow Elevation

- [x] Add unsaved-change protection everywhere a user can lose work.
- [x] Standardize save, dirty, and recovery states across create/edit flows.
- [x] Make completion, verification, and closure transitions visually explicit.
- [x] Tighten the corrective-action handoff from source record to action detail.

### 4.3 Review Elevation

- [x] Make review-ready summaries easier to generate from core registers.
- [x] Add record-level evidence/reference fields wherever traceability matters.
- [x] Preserve the distinction between source data and report projections.
- [x] Expand export presets so a user can retrieve useful support data quickly.

### 4.4 Search and Retrieval Elevation

- [x] Global search across registers.
- [x] Add better filtering and faceting on the most-used registers.
- [x] Make search results clearly distinguish active, archived, and linked records.
- [x] Add direct jump paths from search results into the relevant detail view.

## 5. P2 - Post-MVP Readiness

These features are valuable, but they should be treated as post-MVP elevation unless the product already needs them to support real work.

- [x] Reference-first evidence handling across evidence-heavy records; unmanaged binary attachment storage remains deferred by scope.
- [x] Explicit review cycles and review/sign-off states for risk and compliance support records.
- [x] Printable, PDF-ready review packets alongside CSV and JSON exports.
- [x] Cross-register review/audit support packages with source-data manifests and gap counts.
- [x] Compliance review support with due dates, owners, evidence tracking, and gap/overdue presets.
- [x] Incident and near-miss investigation context with linked hazards, controls, evidence, and corrective actions.
- [x] Controlled-document and evidence-reference metadata without expanding OLUSO into a document-management system.

### Execution evidence (2026-07-12)

- Shared record detail pages now expose source, owner, status, last update, linked-context health, evidence state, and lifecycle activity.
- Shared forms expose clean, dirty, saving, validation-recovery, and discard-protection states.
- Global search identifies active versus archived records, reports linked-reference counts, and retains direct detail links.
- Reports provide full, review-ready, evidence-gap, and overdue presets plus printable HTML/PDF-ready and structured JSON review packages.
- Automated verification covers 145 frontend/domain tests and 7 native persistence tests; static checks and production builds pass.
- Live browser verification covered the report package flow, record traceability view, and dirty-state feedback with no console errors.

## 6. Explicit Deferred Scope

Do not pull these into the MVP unless the scope docs change first.

- Cloud sync, SaaS hosting, accounts, and multi-user permissions.
- AI-first workflows or automated compliance decisions.
- Enterprise governance, role hierarchies, or workflow builders.
- Full LMS, procurement, inventory control, or document-management systems.
- Native mobile-first inspection UX.
- Advanced industrial hygiene calculations, lab imports, calibration management, and chain-of-custody workflows.
- Legal, regulatory, or compliance certification claims.

## 7. Exit Criteria for a Strong MVP

The MVP is strong enough when a user can:

- Open the app and understand where HSE work belongs.
- Create operational, chemical, hazard, field-work, and corrective-action records.
- Link records across the core backbone without fighting the UI.
- Capture traceable field findings and source-linked corrective actions.
- Move actions through completion, verification, and closure with no ambiguity.
- Export useful record sets for review or evidence support.
- Trust that local data survives ordinary app restarts and restore flows.

## 8. Elevation Goal

The long-term objective is not to make OLUSO broader first. It is to make it more reliable, more inspectable, and more audit-useful while keeping the same core HSE backbone.

If a future idea does not improve durability, traceability, review readiness, or exportability, it does not belong ahead of these items.
