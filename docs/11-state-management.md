# 11 — State management

Status: Governing target
Last updated: 2026-07-18

## Doctrine

IndexedDB owns durable local records. Repository/domain services own mutations and invariants. Routes own navigation identity. Query parameters own shareable view state. Forms own unsaved input. Narrow Svelte stores own shell/diagnostic state. Derived selectors own dashboards and reports.

No UI store, cache, generated report, backup file, OneDrive folder, or imported package is the source of truth until a validated transaction writes accepted records and revisions to the local database.

## State categories

| Category | Owner | Durable |
| --- | --- | --- |
| Domain records and relationships | IndexedDB repositories | Yes |
| Record revisions, reviews, import runs, resolutions | IndexedDB governance repositories | Yes |
| Dataset, installation, local user, schema metadata | IndexedDB/system repository | Yes |
| Selected route/record | SvelteKit URL | No |
| Search/filter/sort/page | Query parameters | No |
| Unsaved editor input | Form component/store | No, unless explicit draft save |
| Shell state and diagnostics | Narrow app stores | Usually no; preferences may persist |
| Completeness, counts, reports | Derived queries | Recomputable |
| Parsed package staging | Isolated staging store/database area | Temporary until import history is written |

## Mutation contract

Every material write follows:

1. Validate input shape.
2. Load current records and dependencies.
3. Enforce cross-record invariants and expected revision.
4. Begin one browser-database transaction.
5. Write the new current-state revision.
6. Append immutable `RecordRevision` and related governance records.
7. Advance dataset revision where required.
8. Commit.
9. Publish success to UI and refresh derived queries.

On failure, the transaction rolls back and the UI preserves recoverable unsaved input. A false saved state is a critical defect.

## Optimistic concurrency

- Editors load a record revision.
- Save provides `expectedRevision`.
- If the current revision differs, the service rejects with a stale-revision error and offers reload/compare/copy-draft behavior.
- Imported external revisions use the exchange conflict algorithm, not ordinary overwrite.

## Package staging

Selected package files are untrusted and remain outside the durable domain until validated.

Staging flow:

1. Read with size/depth/count limits.
2. Parse without executable interpretation.
3. Validate manifest and schema.
4. Verify integrity hash.
5. Check dataset/package identities and schema compatibility.
6. Resolve references and classify against base/local/external revisions.
7. Store only bounded staging data needed for preview.
8. Apply accepted resolutions in one transaction.
9. Clear staging after success/cancel while retaining the immutable `ImportRun` result.

## Offline and PWA state

The application distinguishes:

- Application shell cached and ready offline.
- Local database available/blocked/failed.
- Browser storage quota healthy/at risk.
- New application version available.
- Database migration pending/running/failed.
- Backup current/overdue/failed.

Network offline is informational for manual transfer and update checks; it does not imply the local database is unavailable.

## Backup state

Browsers cannot guarantee scheduled background exports. Backup reminders are calculated from last successful verified backup time and dataset revision when the app runs. The user explicitly chooses the download/save destination.

Backup state never doubles as exchange state.

## Derived completeness state

Completeness is computed from versioned rule definitions and canonical records. A stored cache may improve performance but must be invalidated by relevant mutations and must not become authoritative.

Each completeness result includes:

- Rule-set version.
- Evaluated scope and source revisions.
- Numerator/denominator where a percentage is used.
- Missing requirements.
- Links to source/remediation.

## Failure and recovery rules

- Blocked database open identifies likely another-tab/version conditions and offers safe retry guidance.
- Migration failure keeps the prior database intact and provides backup/recovery instructions.
- Quota errors do not clear data or retry indefinitely.
- Corruption/invalid-state detection exports diagnostic metadata without exposing sensitive record content by default.
- A failed exchange apply leaves the pre-import dataset unchanged.
- Recovery/restore validates identity, schema, and integrity before replacement.

## Prohibited patterns

- Direct component access to IndexedDB.
- Durable records mirrored and mutated independently in a global store.
- `localStorage` as the primary record database.
- Last-write-wins import.
- Treating timestamps alone as conflict detection.
- Editing immutable revisions or import history.
- Computing a professional determination as derived UI state.
- Showing local save as “synced.”
