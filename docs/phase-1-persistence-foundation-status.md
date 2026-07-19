# Phase 1 persistence foundation status

Status: foundation implemented; application cutover not complete  
Last updated: 2026-07-18  
Branch: `codex/adama-hse-migration`

## Outcome

The repository now contains the bounded web-persistence foundation needed for the ADAMA HSE reset. It does not yet mean the legacy register UI has completed its runtime cutover. Current routes still use the legacy application adapter while typed screens and services are moved onto the new database.

## Implemented

| Requirement | Evidence |
| --- | --- |
| Managed IndexedDB lifecycle | `src/lib/data/database/open-database.ts` and `indexeddb-adapter.ts` manage open, blocked/version-change behavior, identity initialization, close, and adapter access. |
| Ordered target schema migrations | `src/lib/data/migrations/target-schema.ts` defines one immutable migration step for every released target version. |
| Bounded schema | System, foundation, industrial-hygiene, assurance, and governance stores are declared in `src/lib/data/database/schema.ts` with domain indexes. |
| Typed mutable repository contract | `IndexedDbRecordRepository` supplies get/list/exists/count/create/update/archive/restore and expected-revision concurrency. |
| Atomic immutable revisions | `runMutationTransaction` writes current state, `RecordRevision`, and dataset revision in one transaction; multi-store failures roll back. |
| Dataset/installation/local-user identity | Stable identities are initialized and loaded through `identity.ts`. |
| Exact backup and restore | All target stores are snapshotted with a canonical SHA-256 integrity hash; invalid and partially failing restores do not mutate the prior database. |
| Backup prompts | Verified backup manifests feed a time-plus-dataset-revision status calculation. No background timer is used. |
| Exchange staging | Parsed/validated packages can be isolated in `exchange_staging` before durable changes. Conflict classification and apply remain Phase 4. |
| Logical corruption detection | Integrity inspection checks record envelopes, matching immutable revisions, and current/revision equivalence without modifying data. |
| Browser diagnostics | Settings exposes IndexedDB, service-worker, storage-quota, and durable-storage availability with visible failures. |
| PWA shell | The production build emits an install manifest, 192/512 icons, and a versioned offline application-shell service worker. |
| Legacy detection and migration | Browser schemas 1–14 and native schemas 1–10 are detected. Representative browser v14/native v10 fixtures migrate atomically with revisions, archive evidence, deferred raw rows, and data-quality findings. |
| Verification command | `npm run verify` currently runs type/Svelte checks, the full test suite, production build, and PWA artifact verification. |

## Migration behavior proved by tests

- Country and StateOrRegion nodes are created for legacy sites; operational children resolve to Site.
- The combined chemical row splits into substance, product, product-substance, SDS, inventory, and chemical-use records.
- Legacy monitoring splits into plan, event, sample, and laboratory result.
- No exposure-limit comparison, professional interpretation, exposure assessment, or exposure determination is invented where source context is insufficient.
- Deferred campaign and generic assessment records remain inside the immutable migration-run evidence and create explicit data-quality findings.
- A duplicate/retried migration rolls back all domain records, revisions, migration history, and dataset revision.
- Archived native records retain archive time and reason.

## Deliberately not complete

1. The current `olusoApplication` still delegates existing broad register screens to the legacy synchronous persistence adapter. The IndexedDB adapter becomes the sole production path only as typed foundation/IH routes replace those screens.
2. Browser schemas 1–14 and native schemas 1–10 have detection coverage, but the full version-by-version migration matrix with empty, invalid, orphaned, Unicode, and long-text cases is still open.
3. Target schema version 1 is the only released IndexedDB version; upgrade sequencing is established but multi-version upgrade evidence cannot exist until version 2 is defined.
4. Corruption is detected and reported, but guided recovery UI and user-accepted recovery exercises remain open.
5. The PWA artifact is build-verified; manual installed/offline tests in every supported corporate browser remain open.
6. Exchange staging exists, but manifest validation, dry-run classifications, side-by-side conflict resolution, tombstones, idempotent apply, and rollback packages remain Phase 4.
7. Tauri, Rust, and the localStorage reader remain intentionally present until the removal gate is met.

## Next implementation gate

Complete the application cutover by building typed foundation repositories/services and migrating the first workflow slice—Organization, Person, Location, Process, and Task—onto `AdamaIndexedDbAdapter`. Do not recreate the legacy generic campaign adapter over the new database; that would preserve the modeling defect the reset is intended to remove.
