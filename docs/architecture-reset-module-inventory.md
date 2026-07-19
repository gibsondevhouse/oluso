# Architecture-reset module inventory

Status: Phase 0 controlled inventory  
Generated: 2026-07-18  
Scope: every tracked or currently untracked repository file except generated build, dependency, and Rust target output

The authoritative file-by-file record is [architecture-reset-file-inventory.csv](./architecture-reset-file-inventory.csv). This summary establishes the interpretation rules used by that inventory.

## Dispositions

| Disposition | Count | Meaning |
| --- | ---: | --- |
| RETAIN | 150 | Keep as part of the target or as current, authoritative project evidence. |
| REFACTOR | 115 | Preserve useful behavior or structure but change its model, runtime, or contract. |
| DEFER | 18 | Preserve without near-term product investment; Future Modules and historical references live here. |
| REMOVE_AFTER_MIGRATION | 37 | Remove only after IndexedDB migration, representative fixtures, backup recovery, and browser acceptance pass. |
| **Total** | **320** | One explicit disposition for every inventoried file. |

## Module boundaries

| Module | Disposition | Direction |
| --- | --- | --- |
| SvelteKit/Svelte 5 application shell, shared list/detail/edit UI, search/filter, lifecycle UX | Retain / refactor | Continue as the web-first shell and reuse mature interaction states. |
| src/lib/data | Retain | Becomes the bounded IndexedDB, transactional revision, backup, exchange-staging, diagnostics, and legacy-migration foundation. |
| src/lib/persistence | Refactor then retire as primary | Remains a supported localStorage migration source while runtime reads/writes move to IndexedDB. |
| src-tauri | Remove after migration | Keep temporarily as native schema evidence and a source fixture oracle; do not expand or run as a parallel product architecture. |
| Typed foundation and IH operational records | Refactor / build | Replace generic campaign records with explicit types, validation, services, repository contracts, and cross-record invariants. |
| Generic campaign framework | Defer | Freeze expansion; use only for low-risk reference data or Future Modules. |
| Training, MOC/PSSR, environmental, broad compliance, contractor modules | Defer | Park behind a Future Modules boundary until the baseline and IH spine are accepted. |
| Historical delivery system and superseded ADRs | Defer as history | Keep for traceability but do not treat as current implementation authority. |

## Removal gate

No REMOVE_AFTER_MIGRATION file is authorized for deletion until all of the following are evidenced:

1. Browser versions 1–14 and native versions 1–10 are detected and mapped.
2. Representative browser and native migrations preserve identity, relationships, lifecycle, and migration evidence.
3. Exact backup/restore, atomic failure, immutable revisions, and rollback tests pass.
4. The installed PWA passes offline, browser-restart, and realistic data acceptance checks.
5. The current user and HSE manager accept the migrated Tifton/Ocilla dataset.

