# Record identity and revision specification

Status: Governing
Last updated: 2026-07-18
Decision: [ADR-0007](../adr/ADR-0007-record-identity-and-lifecycle.md)

## Durable record metadata

```typescript
interface RecordEnvelope {
  id: string;
  businessId: string;
  revision: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  originInstallationId: string;
  lastExchangePackageId?: string;
  lifecycleStatus: string;
  archivedAt?: string;
  archivedBy?: string;
  archiveReason?: string;
}
```

All timestamps are ISO 8601 UTC instants. Display conversion is a UI concern.

## Identifier rules

- `id` is a locally generated UUID and is immutable.
- `businessId` is human-readable, stable after publication, and unique within a documented entity/dataset scope.
- ID collisions block import and create a data-quality finding; they are never resolved by overwrite.
- IDs and business IDs are not recycled after archive, supersession, or tombstone.
- Legacy IDs are preserved when valid; mappings are recorded when conversion is unavoidable.

## Revision rules

- Creation produces revision 1.
- Every accepted update, archive, restore, supersession, imported change, or approved resolution increments by exactly one.
- Rejected validation, cancelled edits, identical package records, and failed transactions do not increment revision.
- Save requires `expectedRevision`; a mismatch returns a stale-revision error.
- Dataset revision is distinct from record revision and advances according to transaction/package rules.

## Actor and installation identity

- `createdBy` and `updatedBy` reference an explicit local user/person profile.
- `originInstallationId` identifies the creating installation and never changes.
- An imported mutation sets `updatedBy` to the source actor represented in the package and records the importing actor in `ImportRun`/`RecordRevision` source context.
- `lastExchangePackageId` is set only when a package caused the current local revision.

## RecordRevision

```typescript
interface RecordRevision<T = unknown> {
  id: string;
  recordType: string;
  recordId: string;
  revision: number;
  operation: "create" | "update" | "archive" | "restore" | "supersede" | "import" | "resolve" | "tombstone";
  changedAt: string;
  changedBy: string;
  source: "local" | "migration" | "exchange" | "rollback";
  changeReason?: string;
  before?: T;
  after?: T;
  exchangePackageId?: string;
}
```

Revisions are immutable and unique by `recordType + recordId + revision`.

## Lifecycle rules

- Archive preserves records and relationships.
- Restore creates a new revision; it does not erase the archive event.
- Superseded records remain readable and cannot be selected as current by default.
- Tombstones represent reviewed external deletion/retirement intent.
- Hard deletion is exceptional administrative recovery and must not remove audit evidence required to reconstruct accepted history.

## Acceptance criteria

- Every target entity conforms to the envelope or documents why it is non-exchangeable/transient.
- Full current state can be reconstructed from accepted revisions for the supported audit window.
- Same-ID divergent changes are detected through revisions/base fingerprints.
- History identifies local, migration, exchange, resolution, and rollback sources.
