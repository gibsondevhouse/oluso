# Browser persistence tests

Status: Governing target
Last updated: 2026-07-18

## Adapter contract

- Create/read/update/archive/restore for each typed repository.
- Current record and immutable revision written in one transaction.
- `expectedRevision` stale-write rejection.
- Required relationship and archived-dependency behavior.
- Indexed filters, pagination/cursors, and deterministic sorting.
- Semantic error translation.

## Transaction failure

- Abort midway through multi-record mutation.
- Abort revision write.
- Abort dataset-revision write.
- Abort exchange apply.
- Confirm no partial current/history/governance state.

## Database lifecycle

- Fresh create and normal reopen/restart.
- Blocked open/version change with another tab.
- Unsupported/private-mode/unavailable IndexedDB.
- Quota exceeded/storage pressure.
- Upgrade success/failure and recovery.

## Migration

- Every supported target version to current.
- Every supported legacy browser/native source.
- Ambiguous mapping produces `DataQualityFinding`.
- Invalid source fails without target mutation.
- Retry/idempotency and source/rollback preservation.

## Backup/restore

- Exact all-store/history round-trip.
- Manifest/count/hash validation.
- Wrong artifact type/dataset/schema.
- Truncated/tampered/oversized content.
- Restore migration and failure rollback.

## Exchange

Cover staging isolation, package idempotency, record/package attribution, resolution records, tombstones, review notes, atomic apply, and rollback linkage.

Rust/SQLite tests remain relevant only to the legacy migration reader until native removal gates pass.
