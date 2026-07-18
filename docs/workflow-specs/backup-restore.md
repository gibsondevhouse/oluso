# Backup and restore workflow

Status: Governing disaster-recovery workflow
Last updated: 2026-07-18

## Backup

1. Open Settings → Backups.
2. Review dataset ID/revision, schema version, last verified backup, change count, and storage diagnostics.
3. Choose `Create full backup` and an optional description.
4. The application reads a consistent snapshot, serializes all required stores/history, generates a manifest/hash, and validates the result.
5. The browser downloads the artifact. The user saves it to an approved location, optionally a OneDrive folder.
6. Record backup metadata and show the limitation that the application cannot verify later file retention after browser download.

Browser limitations mean automatic scheduled file creation is not promised. The app provides reminders while running.

## Restore

1. Choose a backup file explicitly.
2. Parse as untrusted input and validate artifact type, integrity, dataset, schema support, record counts, and domain invariants.
3. Show a preview with creation time/user/installation, dataset revision, schema, counts, and compatibility/migration plan.
4. Generate a verified backup of current local state.
5. Restore into staged/new database state and run required migrations.
6. Verify postconditions.
7. Require final confirmation before activation/replacement.
8. Activate atomically and reload repositories.
9. Show the new dataset state and recovery location/reference.

## Boundaries

- Restore never serves as collaboration merge.
- Exchange packages and reports are rejected by the restore handler.
- A failed restore does not partially replace the active database.
- A restore of another dataset requires an explicit replacement warning; it cannot masquerade as an exchange.
- Clinical medical data is prohibited in snapshots.

## Acceptance criteria

- Exact backup round-trip, including revisions and import history.
- Current-state safety backup before replacement.
- Invalid/truncated/hash-invalid/unsupported artifacts cannot mutate data.
- Migration failure leaves prior state usable.
- UI clearly distinguishes backup, exchange, and report export.
