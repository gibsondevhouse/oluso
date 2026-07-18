# ADR-0007 — Record identity, revision, and lifecycle

Status: Accepted, amended
Amended: 2026-07-18

## Decision

Every exchangeable durable record uses:

```text
id
businessId
revision
createdAt
createdBy
updatedAt
updatedBy
originInstallationId
lastExchangePackageId
lifecycleStatus
archivedAt / archivedBy / archiveReason
```

- `id` is a stable UUID generated locally and never reused.
- `businessId` is human-readable and unique within a defined scope.
- `revision` starts at 1 and increments for every accepted mutation, including archive/restore and imported changes.
- Actor fields reference an explicit local user/person identity.
- `originInstallationId` never changes.
- `lastExchangePackageId` identifies the package responsible for the current local revision when applicable.

## Immutable history

The same transaction that changes current state appends an immutable `RecordRevision` with operation, actor, source, reason, before/after, and exchange-package attribution.

## Lifecycle

Domain status, review status, completion, verification, closure, archive, supersession, and deletion are separate concepts.

- Archive hides inactive records from default lists but preserves relationships/history.
- Restore creates a new revision.
- Supersession preserves prior determinations, limits, SDS revisions, and other versioned conclusions/documents.
- Deletion is exceptional. Exchangeable deletion is represented by a tombstone and reviewed before application.
- Identifiers and revision numbers are never recycled.

## Consequences

- Optimistic concurrency compares `expectedRevision`, not timestamps alone.
- Imports can classify local/external/base divergence.
- Historical records remain attributable even when their dependencies are archived.
- Generic campaign records that cannot satisfy this envelope and history contract are not valid target entities.
