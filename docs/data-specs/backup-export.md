# Backup, exchange, and report export specification

Status: Governing
Last updated: 2026-07-18

## Three distinct artifacts

| Artifact | Purpose | Apply behavior |
| --- | --- | --- |
| Backup snapshot | Exact disaster recovery of one local dataset state. | Validated full restore/replacement. |
| Exchange package | Reviewed changes between installations. | Dry-run, conflict resolution, atomic merge. |
| Report/register export | Human review or external analysis. | Never importable by default and never source of truth. |

The UI and filenames must make these distinctions obvious.

## Backup snapshot

A backup contains:

- Artifact type/version.
- Dataset ID and dataset revision.
- Schema version.
- Created at/by and installation ID.
- All target stores required to recreate exact state, including revisions/governance history.
- Record/store counts.
- Integrity hash.

Backup creation:

1. Read a transactionally consistent snapshot.
2. Serialize with deterministic/canonical rules used by integrity validation.
3. Generate manifest/counts/hash.
4. Validate the generated artifact before offering download.
5. Record successful backup metadata only after validation/download initiation is confirmed as far as browser APIs permit.

Restore:

1. Parse as untrusted input with limits.
2. Validate artifact type, manifest, dataset, schema support, counts, records, and integrity.
3. Show a non-mutating preview.
4. Generate a verified current-state backup.
5. Restore into staged/new database state.
6. Run migrations/invariants and activate atomically.
7. Preserve a recovery path to the prior state.

Restore is not collaboration.

## Backup reminders

The browser cannot guarantee periodic background file creation. The application calculates backup status while running using last verified backup time and dataset revision. Users receive prompts and explicitly choose where to save downloaded artifacts, including an approved OneDrive folder if desired.

## Exchange package

Exchange behavior is governed by [ADR-0010](../adr/ADR-0010-reviewed-exchange-protocol.md) and [exchange-review.md](../workflow-specs/exchange-review.md). Exchange packages include scoped records/tombstones/notes and base information, not necessarily a complete snapshot.

## Report and register exports

- CSV is allowed for flat human/analysis exports.
- JSON reports use a report-specific schema and are not accepted by exchange import.
- Printable review packets identify source IDs/revisions, generation time, filters/scope, and known gaps.
- Exporting a report does not create or approve domain conclusions.

## Privacy and integrity

- Artifacts may contain sensitive operational/worker information and must be saved only to approved locations.
- Downloads are not assumed encrypted.
- No automatic email/upload occurs.
- Integrity hashes detect corruption, not author authenticity.
- Clinical medical data is prohibited and therefore must not appear in artifacts.

## Acceptance criteria

- A backup round-trip recreates exact current state and governance history.
- An invalid/truncated/tampered snapshot cannot mutate local data.
- Exchange and backup files cannot be confused by import handlers.
- Reports cannot be imported as authoritative records.
- Backup prompts are honest about browser limitations.
