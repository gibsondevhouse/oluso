# Feature inventory for the architecture reset

Status: Phase 0 inventory baseline
Last updated: 2026-07-18

This inventory classifies the current implementation for migration planning. It does not claim that retained code already satisfies the target contracts.

## Retain and evolve

| Capability | Representative paths | Direction |
| --- | --- | --- |
| SvelteKit/Svelte 5 shell | `src/routes`, `src/components/layout` | Keep; convert runtime assumptions to web/PWA. |
| Shared register UI | `src/lib/pages/RegisterCrudPage.svelte`, `src/lib/components/register` | Keep for canonical registers/reference data; do not use as a substitute for typed workflows. |
| Search/filter/table behavior | `src/lib/search`, register components | Keep; rebuild query source over canonical repositories. |
| Navigation registry | `src/lib/navigation` | Keep mechanism; replace route/domain configuration. |
| Dirty/error/empty/not-found states | pages/components/tests | Keep and extend for stale revision, storage, migration, and exchange states. |
| Archive/restore interaction | register/system components | Keep UX concepts; add revision/impact/tombstone behavior. |
| Application/repository boundary | `src/application`, `src/domain/contracts`, `src/repositories` | Keep and strengthen with typed transactions and semantic errors. |
| Export/report components | `src/lib/export`, reports page | Keep derived-report concepts; separate from exchange packages. |
| Automated tests | `src/**/*.test.ts`, `src/tests` | Keep meaningful coverage; add target contract/migration/e2e suites. |
| Visual design | `src/app.css`, shared components | Keep and adapt to baseline/comparison/review workflows. |

## Refactor heavily

| Capability | Representative paths | Required reset |
| --- | --- | --- |
| Persistence | `src/lib/persistence/local-persistence.ts` | Replace primary `localStorage` database with bounded IndexedDB modules; retain a migration reader temporarily. |
| Backup/import/restore | `src/lib/data/backup.ts`, `BackupRestoreControls.svelte` | Separate exact backup, reviewed exchange, bulk import, and report export. |
| Domain services | `src/domain/services` | Replace generic/shared CRUD behavior for safety-critical entities with explicit services/invariants/revision context. |
| Repository adapter | `src/repositories/register-repository-adapter.ts` | Implement typed repositories and transaction context over IndexedDB. |
| Locations | location types/service/config | Replace broad flat types with governed hierarchy and Site resolution. |
| Chemicals | chemical types/service/config | Split substance/product/SDS/inventory/use/agent/limit. |
| SEGs | SEG types/service/config | Correct to Similar Exposure Group plus effective-dated membership. |
| Exposure monitoring | monitoring types/service/config | Split plan/event/sample/result/comparison/interpretation/determination. |
| Dashboard | dashboard page/components | Replace generic counts with baseline/workflow completeness and actionable queues. |
| Route/sidebar configuration | route registry/sidebar config | Reorganize around Baseline, Master Data, IH, Assurance, Exchange, Future Modules. |

## Defer behind Future Modules

Current metadata-driven campaign families for training, complex MOC/PSSR, environmental/waste, permits, contractor/compliance expansion, and migration bundles are not next-cycle product scope.

Their definitions may remain for history/migration, but they:

- Are not target-ready merely because CRUD routes exist.
- Do not receive new fields/pages/polish.
- Do not influence dashboard readiness.
- Must reuse canonical master/governance models if later reactivated.

## Remove after verified migration

| Capability | Representative paths | Gate |
| --- | --- | --- |
| Tauri dependencies/script | `package.json` | Browser/PWA feature parity and migration acceptance. |
| Native runtime/persistence | `src-tauri/` | Native source migration/rollback/equivalence matrix passes. |
| Tauri-specific Svelte rationale | `svelte.config.js` comments/config rationale | Web/PWA build/deployment verified. |
| `localStorage` primary record persistence | `src/lib/persistence/local-persistence.ts` target behavior | Browser source migration and IndexedDB contract tests pass. |
| Duplicate desktop/native documentation | superseded ADR/spec text | Historical retention review and link cleanup. |

## New capabilities required

- Dataset, installation, and local-user identity.
- Immutable `RecordRevision` and record history UI.
- Typed Exposure Scenario and assessment/determination workflow.
- Effective-dated SEG membership.
- Versioned exposure-limit comparison model.
- Reviewed exchange manifest, staging, classifications, conflicts, import history, and rollback.
- Unit baseline workspace and completeness rule engine.
- IndexedDB lifecycle, diagnostics, migrations, and PWA/offline support.

## Inventory maintenance

During implementation, add exact module-to-target mappings and migration dispositions. Do not change an item from refactor/defer/remove to complete without the applicable phase exit criteria and test evidence.
