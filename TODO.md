# ADAMA HSE architecture-reset backlog

Last updated: 2026-07-18

This backlog replaces the campaign-era checklist that treated broad register delivery as MVP completion. Completed legacy capabilities remain useful implementation inventory; they do not satisfy the new exit criteria by themselves.

## P0 — Freeze and decide

- [x] Record the repository audit and new project direction.
- [x] Replace the Tauri-template README with an ADAMA HSE project README.
- [x] Rewrite the governing product, domain, workflow, scope, and build-plan documents.
- [x] Freeze new campaign-register expansion in documentation.
- [x] Decide web-only local-first runtime.
- [x] Decide IndexedDB as the primary browser database behind repository contracts.
- [x] Define the reviewed exchange/conflict model.
- [ ] Create the implementation migration branch.
- [ ] Inventory every implemented feature as retain, refactor, defer, or remove at code/module level.
- [ ] Map every supported legacy schema to the target schema.
- [ ] Define representative migration fixtures from browser and native persistence.

## P0 — Core correctness

- [ ] Implement the versioned IndexedDB adapter and repository-contract suite.
- [ ] Add transactional record revision history.
- [ ] Introduce typed `ExposureScenario`.
- [ ] Replace generic exposure-assessment, determination, and sampling campaign records.
- [ ] Add dataset, installation, and local-user identities.
- [ ] Implement exchange package validation, dry-run, classification, conflict resolution, and rollback.
- [ ] Ensure invalid or failed imports cannot partially mutate the database.

## P1 — Master data

- [ ] Correct the Country → State/Region → Site → operational location hierarchy.
- [ ] Enforce Site resolution and circular-parent prevention.
- [ ] Separate chemical substances, products, SDS revisions, site inventory, and chemical use.
- [ ] Separate exposure agents from versioned exposure limits.
- [ ] Implement effective-dated SEG membership.
- [ ] Refactor persistence monoliths into bounded modules.
- [ ] Migrate and verify all supported legacy data.
- [ ] Remove Tauri/Rust only after migration and rollback gates pass.
- [ ] Remove `localStorage` as primary persistence only after migration gates pass.

## P1 — Industrial hygiene

- [ ] Build structured qualitative assessments with uncertainty, confidence, and data gaps.
- [ ] Build sampling plans, events, samples, laboratory results, comparisons, and interpretations.
- [ ] Store numeric results, qualifiers, LOD/LOQ, units, and duration correctly.
- [ ] Add unit/dimension/duration compatibility rules.
- [ ] Keep calculated comparisons separate from professional determinations.
- [ ] Connect control verification, program/surveillance applicability, actions, and reassessment.

## P2 — Field and review experience

- [ ] Add the unit baseline workspace/wizard.
- [ ] Add baseline-completeness rules and dashboard.
- [ ] Add review-ready unit packets.
- [ ] Add record history and package-attribution views.
- [ ] Add manager review/sign-off and durable review notes.
- [ ] Connect observations/incidents/actions to the exposure spine.

## P2 — Verification and deployment

- [ ] Add `npm run verify`.
- [ ] Add formatting and lint checks.
- [ ] Add browser repository-contract tests.
- [ ] Add migration tests from every supported schema.
- [ ] Add exchange round-trip, conflict, stale-revision, malicious-package, and rollback tests.
- [ ] Add browser-storage quota/failure/corruption recovery tests.
- [ ] Add PWA/offline and supported-browser tests.
- [ ] Add critical end-to-end and accessibility tests.
- [ ] Exercise backup recovery with realistic data.
- [ ] Complete user acceptance with Tifton data and manager review.

## P3 — Reactivate only after gates

- [ ] Reassess training/competency scope.
- [ ] Reassess MOC/PSSR scope.
- [ ] Reassess environmental/waste/permit scope.
- [ ] Reassess broader compliance/calendar scope.

## Removal checklist

These are intentionally unchecked until migration evidence exists:

- [ ] Remove Tauri npm dependencies and script.
- [ ] Remove `src-tauri/` and Rust build/test requirements.
- [ ] Remove desktop-only configuration and packaging documentation.
- [ ] Remove duplicate/superseded desktop persistence specifications after historical retention review.
- [ ] Remove `localStorage` as the primary database implementation.

## Governing sequence

```text
Web platform reset
  → canonical master data
  → exposure-scenario model
  → DOEHRS-inspired assessment workflow
  → safe two-person exchange
  → baseline field workflow
  → corrective-action closure
  → production hardening
```
