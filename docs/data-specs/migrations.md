# Migration specification

Status: Governing target
Last updated: 2026-07-19

## Migration classes

### Target-schema migration

Upgrades one IndexedDB schema version to the next through ordered TypeScript migration functions.

Released sequence:

- Version 1 creates the local-first target stores.
- Version 2 adds typed Foundation and Chemical relationship indexes.
- Version 3 adds hierarchical Organizations, global geography, reusable Operational Functions, and the five assignment stores. The version-3 transaction preserves current entity IDs, business IDs, revisions, archive state, and operating-condition evidence; it never invents a County or municipality.

### Legacy-source migration

Imports supported pre-reset browser `localStorage` or native SQLite snapshots into the target schema. This is an explicit user/developer-controlled conversion, not an automatic destructive upgrade.

### Exchange schema adaptation

Adapts a supported older exchange schema into the current staging model before dry-run. It never bypasses package validation or domain rules.

These classes are tested separately.

## Target-schema rules

- Versions are positive monotonically increasing integers.
- Every version has an immutable migration definition after release.
- Each migration declares source/target versions, affected stores/indexes, data transform, preconditions, postconditions, and failure behavior.
- Upgrades are transactional where IndexedDB permits; designs avoid long asynchronous work inside upgrade transactions.
- Destructive removal uses add/backfill/verify/remove sequencing across releases when needed.
- A failed migration does not expose a partially upgraded database as ready.

## Legacy migration rules

1. Create and validate a source snapshot before conversion.
2. Identify source implementation and schema version.
3. Reject unsupported/corrupt sources without target mutation.
4. Convert into a new/staged target database.
5. Preserve stable IDs, business IDs, timestamps, archive state, and relationships where valid.
6. Record every mapping and unmappable/ambiguous field.
7. Create data-quality findings for human decisions; do not invent missing scenario context, OEL basis, or professional determinations.
8. Run target invariants and counts.
9. Produce a migration report and rollback instructions.
10. Activate the target database only after verification.

## Required source matrix

The matrix includes every supported browser schema and native SQLite schema present in released/piloted data. For each source version, fixtures cover:

- Empty database.
- Representative active and archived records.
- Relationships and orphaned/invalid legacy relationships.
- Generic campaign records.
- Combined chemical records.
- Broad location types.
- Existing assessment/determination/sampling records.
- Unicode, long text, dates, numeric strings, and missing optional fields.

## Acceptance criteria

- Every supported version migrates to the same current invariants.
- Record counts and relationship mappings are explained, not merely compared.
- A failed migration leaves the source and prior active database recoverable.
- Re-running an already completed migration is safe/idempotent.
- Migration writes attributed `RecordRevision`/migration history without pretending migrated data was newly authored.
- Tauri/Rust and legacy browser readers are removed only after this matrix passes with representative user data.
