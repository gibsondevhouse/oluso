# 07 — ADAMA HSE build plan

Status: Governing execution sequence
Last updated: 2026-07-18

## Delivery rule

New campaign-register expansion is frozen. Work proceeds through the following phases in order unless a documented dependency requires overlap. A phase is not complete because pages exist; its exit criteria must be demonstrated with tests and realistic data.

## Phase 0 — Freeze and reset the architecture

Objective: stop domain expansion and make the web target authoritative.

Work:

- Freeze new campaign registers.
- Record the repository audit and feature inventory.
- Accept ADRs for web-only local-first runtime, browser persistence, and exchange/conflict handling.
- Update README, product brief, domain model, scope, roadmap, workflows, and specifications.
- Mark desktop/native decisions as superseded.
- Define migration sources, target schema mapping, verification, rollback, and removal gates.
- Establish the migration branch when implementation work begins.

Exit criteria:

- Governing documentation no longer calls the target product desktop-first or single-user.
- Browser, offline, corporate-laptop, OneDrive-transfer, and two-installation assumptions are explicit.
- Tauri/native and `localStorage` removal gates are documented.
- Existing features are classified as retain, refactor, defer, or remove.
- Existing data has a documented migration path before destructive cleanup.

## Phase 1 — Web persistence foundation

Objective: make the product dependable in supported browsers without Tauri.

Work:

- Implement one repository contract and one IndexedDB adapter.
- Break persistence into bounded modules for database lifecycle, repositories, migrations, revisions, backups, and exchange staging.
- Add versioned schema migrations and transactional multi-record writes.
- Add write-failure visibility, corruption/blocked-open handling, recovery, storage quota/availability diagnostics, and compatibility checks.
- Add service worker, installable PWA metadata, and offline application-shell behavior.
- Add backup prompts based on time and dataset revision, not unreliable background timers.
- Migrate and verify legacy browser/native data.

Exit criteria:

- The app works after first load without network access.
- Data survives browser and laptop restarts on supported corporate browsers.
- Failed/blocked writes are visible and do not produce false success.
- A backup recreates the exact database state and passes integrity validation.
- Every supported migration source/version is tested.
- Repository-contract tests pass against IndexedDB.
- Tauri is not required for normal application behavior.

Removal gate: do not remove Tauri/Rust or legacy data readers until migration, rollback, and equivalence tests pass using representative user data.

## Phase 2 — Canonical master data

Objective: establish the durable operational backbone.

Build order:

1. Organizations.
2. People and local user profiles.
3. Location hierarchy.
4. Processes.
5. Tasks.
6. Equipment.
7. Chemical substances and products.
8. SDS revisions.
9. Site inventory and chemical use.
10. Exposure agents and limits.
11. Controls and document references.

Exit criteria:

- Tifton and Ocilla are represented without hierarchy workarounds.
- Country → State/Region → Site → operational descendants validates correctly.
- Every operational record resolves to a Site and circular locations are rejected.
- One product supports multiple sites, inventories, uses, and SDS revisions without duplicating identity.
- Several versioned limits can exist for one exposure agent.
- Tasks are distinct from processes.
- Archived/superseded dependencies remain historically visible.
- Legacy chemical and location data migration is verified.

## Phase 3 — DOEHRS-inspired industrial-hygiene spine

Objective: make occupational-exposure management the central capability.

Work:

- Rebuild SEG as a worker-group definition.
- Add effective-dated SEG membership.
- Add typed exposure scenarios.
- Add structured qualitative assessments, uncertainty, data quality, confidence, and gaps.
- Add monitoring priorities and sampling plans.
- Separate sampling events, samples, laboratory results, comparisons, professional interpretations, and determinations.
- Link controls, control verification, program/surveillance applicability, actions, and reassessment.

Exit criteria:

- For any worker or SEG, the system can answer what work they perform, where, which agents may expose them, under which conditions, which controls apply, what evidence supports the conclusion, and what happens next.
- Routine, upset/blockage, and cleanup scenarios remain distinct.
- An assessment cannot be review-ready without a valid scenario.
- A determination cannot exist without an assessment.
- Incompatible units/durations block comparisons.
- Calculations remain distinct from professional interpretation and determination.
- Every mutation creates an immutable record revision.

## Phase 4 — Review exchange protocol

Objective: support the real two-laptop OneDrive review workflow.

Work:

- Add dataset, installation, and local-user identity.
- Add record revisions and tombstones.
- Generate versioned exchange manifests and integrity hashes.
- Validate and stage packages before import.
- Classify new, identical, local-only, external-only, conflicting, externally deleted, missing-dependency, invalid-schema, and stale-revision records.
- Add side-by-side conflict resolution and review notes.
- Preserve import history, package attribution, idempotency, and rollback packages.

Exit criteria:

- Separate installations can edit from a shared base without silently losing either person’s records.
- Conflicts and external deletions are visible before application.
- Every imported change is attributable to a package, user, installation, and resulting revision.
- Invalid/malicious packages do not mutate local data.
- Failed applies roll back atomically.
- A completed import can be restored using its rollback package.
- Review notes survive later exchanges.

## Phase 5 — Baseline field workflow

Objective: support immediate plant characterization.

Interfaces:

- Unit baseline wizard/workspace.
- Location hierarchy navigator.
- Process/task, equipment, and chemical-use capture.
- Worker/SEG capture.
- Exposure-scenario builder.
- Control inventory.
- Data-gap register.
- Notes and evidence references.
- Review-ready unit packet.
- Baseline-completeness dashboard.

Exit criteria:

- A Unit 7 walkthrough can be captured without jumping among disconnected registers.
- Drafts resume in context after restart.
- Completeness rules explain each missing requirement and link to remediation.
- A review packet presents source revisions and gaps.

## Phase 6 — Assurance and corrective-action loop

Objective: connect findings and incidents to the operational/exposure model.

Work:

- Observation and inspection capture.
- Findings, incidents, near misses, and investigation context.
- Source-linked corrective actions.
- Distinct completion, verification, and closure.
- Control verification and reassessment triggers.
- Overdue and blocked-work views.

Exit criteria:

A plume release can be traced through:

```text
Site → Unit → Process → Task → Equipment
  → Exposure Scenario → Hazard/Agent → Failed Control
  → Incident → Actions → Verification → Reassessment
```

## Phase 7 — Harden and deploy

Objective: make the application safe for daily operational use.

Verification:

- Migration matrix for every supported source version.
- Exchange conflict, stale revision, idempotency, malicious-file, and rollback tests.
- Backup and witnessed recovery exercises.
- Relationship-integrity and revision-reconstruction tests.
- Browser compatibility, quota/failure, PWA installation, and offline tests.
- Performance with realistic record/revision counts.
- Accessibility checks.
- Printable review-packet verification.
- User acceptance with real Tifton data.
- Manager review acceptance.

Exit criteria:

- `npm run verify` runs the complete required quality gate.
- Supported browsers and deployment assumptions are documented.
- Recovery procedures have been exercised, not merely described.
- HSE professional and manager accept the baseline, review exchange, and determination workflows.

## Unified verification target

```text
npm run verify
  ├─ formatting check
  ├─ lint
  ├─ Svelte/TypeScript check
  ├─ unit and component tests
  ├─ repository-contract tests
  ├─ migration matrix
  ├─ backup and exchange round-trip tests
  ├─ production build
  └─ end-to-end and accessibility tests
```

Until this command exists, verification evidence must list the exact commands that were run and any unavailable checks.
