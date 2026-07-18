# ADR-0010 — Reviewed exchange protocol

Status: Accepted
Date: 2026-07-18

## Context

The HSE professional and manager edit separate local datasets. Add-only import ignores legitimate updates, while full restore destroys unrelated local work. Collaboration requires revision-aware comparison and deliberate human review.

## Decision

Use immutable, versioned JSON exchange packages with validation, dry-run classification, conflict resolution, attribution, and atomic application.

The manifest contains:

```text
packageId
datasetId
schemaVersion
exportedAt
exportedBy
sourceInstallationId
baseDatasetRevision
records
tombstones
reviewNotes
integrityHash
```

Records include their identity/revision metadata plus enough base revision/fingerprint information to classify changes against the receiving installation.

## Validation and dry-run

Before mutation, the receiver validates bounded file size/shape, manifest, schema compatibility, dataset identity, package identity, referential dependencies, record schemas, and integrity hash.

Each candidate is classified as:

- New.
- Identical.
- Updated only locally.
- Updated only externally.
- Conflicting.
- Deleted externally.
- Missing dependency.
- Invalid schema.
- Stale revision.

The user sees package summary and record/field differences before apply. Conflicts and external deletions require explicit resolution and rationale.

## Application

- Create a verified pre-apply rollback package.
- Apply the accepted set and all `RecordRevision`, `ImportRun`, review-note, resolution, tombstone, and dataset-revision updates in one transaction.
- On any failure, roll back the entire apply.
- Re-import of an already applied package is idempotent and does not create revisions.
- Preserve rejected/unresolved items in import history without mutating their local records.

## Integrity limitation

The integrity hash detects corruption or payload/manifest mismatch. By itself it does not prove the human author or protect against a malicious party that can rewrite both payload and hash. Package signing/encryption may be added only through a later security decision if required by corporate review.

## Consequences

- Backup/restore remains a separate disaster-recovery workflow.
- Bulk baseline import remains a separate mapping/cleansing workflow.
- OneDrive is only a user-selected transport channel.
- Every imported change can be traced to its package, source installation, exporter, importer, resolution, and resulting record revision.

## Alternatives rejected

- Add-only import: silently discards external edits to known IDs.
- Last-write-wins: loses changes and ignores base history.
- Full restore for collaboration: destroys unrelated local work.
- Automatic OneDrive sync: hides conflicts and introduces an uncontrolled synchronization engine.
