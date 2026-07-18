# 08 — Scope boundaries

Status: Governing freeze
Last updated: 2026-07-18

## Current product boundary

ADAMA HSE is a local-only SvelteKit SPA/PWA for plant baseline knowledge, occupational-exposure assessment, structured manager review, and linked corrective-action follow-up.

It serves two collaborating users through explicit file exchange, not concurrent access to one database.

## In scope now

- Web-only local-first runtime and offline-capable application shell.
- One versioned IndexedDB persistence adapter.
- Migration from current `localStorage` and native SQLite data.
- Canonical foundation entities in the domain model.
- Location hierarchy and Site resolution.
- Normalized chemical/SDS/inventory/use/agent/limit models.
- SEG and effective-dated membership.
- Exposure scenarios, assessments, monitoring, interpretations, determinations, controls, and reassessment.
- Immutable revisions and review history.
- Versioned backup and two-installation exchange packages.
- Unit baseline workflow and completeness dashboard.
- Assurance/actions only where linked to the operational/exposure spine.
- Reference-based evidence and printable review packets.

## Retained infrastructure

- SvelteKit/Svelte 5.
- Shared register and record layouts.
- Search, filter, archive/restore, dirty/error/not-found states.
- Application/repository boundary.
- Existing visual design and reusable components.
- Generic metadata-driven registers for low-risk lookup tables.
- Existing tests that remain meaningful after migration.

## Deferred behind Future Modules

- Training courses, requirements, LMS behavior, and broad competency administration.
- Complex management of change and PSSR workflows.
- Waste streams/shipments and broad environmental-event management.
- Permit suites and broad compliance calendars.
- Contractor-management suites.
- Migration bundles as an end-user module.
- Advanced analytics unrelated to baseline completeness or actionable exposure work.
- Mobile-first field-inspection experiences.
- Binary attachment/document-management platform behavior.

Deferred code may remain reachable during migration but does not receive target-status claims or drive architecture.

## Explicitly out of scope

- Automatic cloud sync or silent OneDrive folder monitoring.
- Real-time coauthoring.
- SaaS hosting, remote source-of-truth databases, multi-tenancy, billing, or customer administration.
- Enterprise SSO/permissions until a future intended-use decision requires them.
- Clinical medical data, diagnoses, test results, or medical notes.
- Automated professional determinations, legal interpretations, or compliance certification.
- Keeping Tauri/native and web persistence as parallel production paths.
- `localStorage` as the primary database.
- Hard deletion as a normal lifecycle operation.

## Reactivation gates

A deferred module may return only when:

1. Phases 1–5 meet their exit criteria.
2. It reuses canonical master data, record metadata, revisions, exchange protocol, evidence, and action models.
3. It has explicit typed entities and invariants where operationally significant.
4. Its migrations, repository contracts, exchange behavior, and end-to-end workflow are tested.
5. It does not store prohibited information or imply unsupported compliance conclusions.
6. The scope/roadmap is amended before implementation.

## Change control

Any proposal for cloud sync, accounts, clinical data, a second persistence architecture, or automated professional judgment requires a new ADR and an updated intended-use statement. It cannot be introduced as an implementation detail.
