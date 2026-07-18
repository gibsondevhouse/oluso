# Browser persistence stack

Status: Governing target
Last updated: 2026-07-18
Decision: [ADR-0009](../adr/ADR-0009-browser-persistence.md)

## Stack

- Database: browser IndexedDB.
- Access: one typed TypeScript adapter behind repository contracts.
- Application runtime: SvelteKit SPA/PWA.
- Schema: ordered, versioned code migrations.
- Backup/exchange: explicit versioned JSON packages.
- Legacy sources: browser `localStorage` and native SQLite through migration-only readers.

## Module boundaries

```text
src/lib/data/
  database/       open, close, version, health, transactions
  migrations/     ordered target-schema upgrades
  repositories/   entity and query implementations
  revisions/      immutable history writes and reconstruction
  backup/         complete snapshot export/restore validation
  exchange/       manifest, staging, classification, apply, rollback
  legacy/         temporary localStorage/native migration readers
  diagnostics/    quota, blocked open, compatibility, recovery
```

Exact paths may change, but these responsibilities must not remain in one persistence monolith.

## Database lifecycle

On startup:

1. Check required browser capabilities.
2. Open the database with blocked/version-change handling.
3. Read dataset/schema metadata.
4. Apply target-schema migrations transactionally.
5. Verify required stores/indexes and invariant metadata.
6. Initialize repositories.
7. Report storage, migration, and backup status to the shell.

The UI does not report the application ready for writes until this sequence succeeds.

## Transaction rules

- Every domain mutation includes current-state changes and immutable revisions in one transaction.
- Multi-entity operations include all required relationships, governance records, and dataset revision changes in one transaction.
- Exchange apply is atomic.
- A transaction error is propagated as a semantic error and never swallowed.
- Repository methods return immutable domain values, not live database objects.

## Durability and diagnostics

The application must detect and explain:

- IndexedDB unavailable by browser/policy/private mode.
- Database open blocked by another tab/version.
- Version change requiring reload.
- Aborted or failed transaction.
- Quota exceeded or storage pressure.
- Migration failure.
- Invalid/corrupt logical state.
- Backup overdue or failed.

Where supported, request persistent browser storage through a user-understandable action. The app must not claim that a request guarantees persistence.

## Offline behavior

The service worker caches the application shell and required static assets. Domain data remains in IndexedDB. Network loss must not block normal CRUD, assessment, monitoring, reporting, backup generation, or package generation.

Application updates and schema migrations are coordinated so a new shell cannot write with an incompatible database contract.

## Security and privacy

- No remote scripts or operational-data transmission is required for normal use.
- Imported JSON is untrusted and parsed with bounded size/depth/count constraints.
- Do not store clinical medical information.
- Browser/profile access and downloaded packages inherit corporate endpoint/file protections; product documentation must state this limitation.
- The integrity hash detects corruption but is not an author signature.

## Legacy removal gate

Remove Rust/Tauri and `localStorage` record persistence only after:

- All supported source schemas have migration fixtures.
- Migration preserves identity, relationships, archive state, and material fields.
- Unmappable data produces reviewable findings rather than silent loss.
- Rollback/retry is demonstrated.
- Representative migrated datasets pass repository and domain checks.
