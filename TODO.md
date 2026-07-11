# OLUSO Todo List

Last updated: 2026-07-11

This list reflects the current worktree, not only the docs. The app currently has a functional SvelteKit/Tauri shell, local persistence, and CRUD/detail/edit/archive flows for the ten registered MVP registers:

- Locations
- Processes
- Equipment
- Chemicals
- Hazards
- Controls
- Risk Assessments
- SEGs
- Findings
- Corrective Actions

The main active route implementation is `src/lib/pages/RegisterCrudPage.svelte` plus `src/lib/components/register/register-config.ts`. Older per-register page components still exist and should not be treated as the primary routing path unless they are explicitly reconnected.

## P0 - Finish the MVP Backbone

- [x] Replace `/reports/exports` placeholder with a real basic export page.
  - Export active and archived register data.
  - Support at least CSV or JSON output for core registers.
  - Keep reports as projections over source records, not separate manual data-entry records.
  - Implemented with generated CSV/JSON downloads from the current local register data.

- [x] Expand corrective-action workflow to preserve completion, verification, and closure as separate states.
  - Current status model is `Open`, `In Progress`, `Closed`.
  - Target minimum model: `Created`, `Assigned`, `In Progress`, `Completed`, `Verified`, `Closed`.
  - Add verification required, verification method/result, completion summary, closure summary, and evidence/reference fields.
  - Prevent completed actions from silently becoming closed.
  - Implemented with explicit workflow states, transition timestamps, completion/verification/closure validation, evidence/reference capture, CSV/JSON export fields, and SQLite/localStorage migration support.

- [x] Strengthen corrective-action source traceability.
  - Current actions are linked only to findings through `findingId`.
  - Add an explicit source reference model that can support findings, hazards, incidents, compliance items, and justified manual actions.
  - Require a source record or a manual-source justification.
  - Implemented with source type, source record ID, manual/external source notes, finding/hazard relationship validation, and source relationship panels.

- [x] Decide and implement or explicitly defer the Equipment register.
  - `docs/07-build-plan.md` includes Equipment in Phase 3 Operations Core.
  - Current route registry and sidebar only include Locations and Processes under Operations.
  - If included in MVP, add persistence, domain service, route, sidebar item, relationships, and tests.
  - Implemented as an HSE-relevant Equipment register, not a broad asset-management module, with localStorage/SQLite persistence, domain validation, Operations routing/sidebar, dashboard metrics, relationship panels, exports, seed data, and tests.

- [x] Build SDS and exposure-limit support for Chemical Safety.
  - Current chemical records cover identity, classification, storage location, quantity, supplier, status, notes, and process links.
  - Missing: SDS status/reference records, SDS revision/review metadata, exposure limits, source/units/averaging period, and missing-SDS visibility.
  - Implemented with structured SDS status/reference/revision/review fields, exposure-limit value/unit/source/averaging fields, dashboard missing-SDS visibility, Chemical register table/detail/form fields, CSV/JSON export fields, localStorage/SQLite migrations, seed data, and tests.

- [x] Build Controls and basic Risk Assessment records.
  - Current hazards have severity, likelihood, linked locations/processes/chemicals, and free-text controls.
  - Missing: control records, control-to-hazard links, verification expectations, and basic risk assessment records with residual risk/review state.
  - Implemented with Controls and Risk Assessments registers, hazard/control relationships, verification metadata, residual risk/review fields, dashboard visibility, exports, localStorage/SQLite persistence, seed data, route/sidebar integration, and tests.

## P1 - Fill Major Product Gaps

- [ ] Add exposure monitoring route and workflow.
  - `docs/page-specs/exposure-monitoring.md` exists, but `/hse/exposure-monitoring` is not registered.
  - Keep the first slice basic: SEG/person/task context, contaminant, location/process, sampling date, result/status fields, and links back to chemicals/SEGs/hazards.

- [ ] Expand Field Work beyond the generic Findings register.
  - Current findings support type, location, optional process/hazard links, severity, status, reporter, and description.
  - Add basic observation, inspection, audit/finding, and air-sampling record fields or split them into dedicated registers if the docs still require it.
  - Add evidence/reference fields and direct corrective-action creation from a finding detail view.

- [ ] Add incident and near-miss support at the scoped level.
  - Current findings include `Near Miss` as a finding type, but there is no incident log, incident route, or investigation record.
  - Start with a simple incident/near-miss register only after the core action loop is reliable.

- [ ] Add compliance support at the scoped level.
  - Current route registry has no compliance routes.
  - Build basic obligation/calendar tracking only as compliance-supporting records, not legal determinations.
  - Keep permits, training status, controlled documents, due dates, owners, review status, and evidence links simple.

- [ ] Add import, backup, and restore controls.
  - Specs exist under `docs/workflow-specs/`.
  - Current persistence has local SQLite plus localStorage fallback, but no user-facing backup/import/export controls.
  - Use Tauri file dialogs for desktop file selection once wired.

- [ ] Harden relationship linking across registers.
  - Relationship panels and backlinks exist for current registers.
  - Add stronger validation for missing, archived, or incompatible related records.
  - Ensure detail views show enough linked context for traceability and audit review.

## P2 - Quality, Usability, and Cleanup

- [ ] Add global search across registers.
  - Current search/filter behavior is per-register.
  - Add a global search surface only after the underlying relationship model is stable.

- [ ] Align tests with the generic CRUD route.
  - Some tests still target older page components such as `LocationsPage.svelte` and `FindingsPage.svelte`.
  - Add coverage for `RegisterCrudPage.svelte`, relationship panels, detail/edit/new routes, archive/restore, and not-found record states.

- [ ] Remove or archive unused legacy per-register page components after replacement coverage exists.
  - Candidate files include older standalone pages such as `ChemicalsPage.svelte`, `HazardsPage.svelte`, `ProcessesPage.svelte`, `SegsPage.svelte`, and `CorrectiveActionsPage.svelte`.
  - Do not delete them until tests confirm the generic CRUD route covers their required behavior.

- [ ] Improve settings from diagnostics-only to operational controls.
  - Current Settings page is minimal.
  - Add data path visibility, migration status, backup/export entry points, and safe clear/reset controls if still in scope.

- [ ] Add desktop packaging and manual acceptance verification.
  - Run Svelte checks, Vitest, Tauri build checks, and manual route smoke tests.
  - Verify local persistence after restart and archive/restore behavior against SQLite, not only localStorage fallback.

## Explicitly Deferred or Out of Scope for MVP

- Cloud sync, accounts, SaaS hosting, multi-user roles, and permissions.
- AI-dependent workflows.
- Advanced analytics dashboards and management KPI suites.
- Full LMS, document-management, procurement, inventory-control, or regulatory-certification features.
- Advanced industrial hygiene calculations, lab imports, calibration management, and chain-of-custody workflows until the basic exposure records exist.
