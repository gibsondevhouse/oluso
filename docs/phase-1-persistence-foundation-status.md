# Phase 1 persistence foundation status

Status: foundation application cutover complete; canonical Chemical slice cut over; remaining legacy slices not complete
Last updated: 2026-07-19
Branch: `codex/global-enterprise-location-functions`

## Outcome

The repository contains the bounded web-persistence foundation and the first typed application slices. Organization, Person, Location, Process, Task, canonical Chemical Substance, Product, composition, SDS, Site inventory, Document Reference, and Chemical Use workflows now operate through typed domain contracts, dedicated repositories, application services, and IndexedDB. Other broad and deferred modules remain on the legacy adapter until their own controlled cutovers.

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
| Typed foundation and enterprise domain | Hierarchical Organization, Person, global geographic/physical Location, reusable Operational Function, effective assignment entities, Process, Process Location Assignment, and Task have explicit contracts and cross-record invariants outside UI components. |
| Enterprise repositories and services | Dedicated enterprise, Location, and operations modules enforce business-ID uniqueness, hierarchy legality, many-to-many Function assignment, active dependencies, exactly one Process Primary Location, same-Site support, expected revisions, archive/restore, and atomic subtree moves. |
| Foundation route cutover | `/people/organizations`, `/people/workers`, `/operations/locations`, `/operations/processes`, and `/operations/tasks` use the typed IndexedDB application. Their list/create/detail/edit/archive/restore flows no longer initialize or call legacy record persistence. |
| Cutover enforcement | Static architecture tests prohibit legacy persistence, campaign adapters, and Tauri imports from typed foundation code. Migrated entities are absent from generic campaign definitions. |
| Verification command | `npm run verify` currently runs type/Svelte checks, the full test suite, production build, and PWA artifact verification. |
| Local actor hardening | New installations create dataset/installation identity without inventing a production actor; a named local profile is required before typed mutations and revisions preserve actor plus installation attribution. |
| Canonical Chemical cutover | `/master/substances`, `/master/products`, `/master/inventory`, and `/master/chemical-uses` use typed IndexedDB-only workflows; `/hse/chemicals` redirects to Products. |
| Chemical migration review | Legacy combined rows split into reviewable canonical targets, retain source evidence, and create data-quality findings without promoting supplier text or legacy OEL text into Product/inventory/use. |

## Migration behavior proved by tests

- Country and StateOrProvince nodes are created for legacy Sites; explicit County/City values create nodes, unknown City creates a finding, and physical children resolve to Site.
- The combined chemical row splits into substance, product, product-substance, SDS, inventory, and chemical-use records.
- Legacy monitoring splits into plan, event, sample, and laboratory result.
- No exposure-limit comparison, professional interpretation, exposure assessment, or exposure determination is invented where source context is insufficient.
- Deferred campaign and generic assessment records remain inside the immutable migration-run evidence and create explicit data-quality findings.
- A duplicate/retried migration rolls back all domain records, revisions, migration history, and dataset revision.
- Archived native records retain archive time and reason.
- Legacy Organization, Person, Location, Process, and Task records are normalized into typed field shapes and render in typed screens.
- Location moves reject cycles and invalid dependents, then atomically recalculate global geography/Site context for descendants, Processes, Tasks, assignments, chemical context, IH records, sampling, and assurance/action records.

## Deliberately not complete

1. Equipment, exposure monitoring, compliance, hazards, controls, risk assessments, SEGs, findings, incidents, corrective actions, dashboard aggregation, reports, and deferred campaign modules still use the legacy synchronous adapter. Canonical enterprise records now participate in Global Search; remaining legacy registers retain their existing projection during controlled cutover.
2. Browser schemas 1–14 and native schemas 1–10 have detection coverage, but the full version-by-version migration matrix with empty, invalid, orphaned, Unicode, and long-text cases is still open.
3. Target schema version 3 adds global enterprise, Operational Function, and assignment stores/indexes plus an atomic v2 data upgrade. The ordered upgrade registry, representative long-lived data, rollback, and idempotent reopen are tested; broader real-user migration exercises remain open.
4. Corruption is detected and reported, but guided recovery UI and user-accepted recovery exercises remain open.
5. The PWA artifact is build-verified; manual installed/offline tests in every supported corporate browser remain open.
6. Exchange staging exists, but manifest validation, dry-run classifications, side-by-side conflict resolution, tombstones, idempotent apply, and rollback packages remain Phase 4.
7. Tauri, Rust, and the localStorage reader remain intentionally present until the removal gate is met.

## Next implementation gate

Proceed to Exposure Agents and versioned Exposure Limits. Preserve the completed foundation and canonical Chemical boundaries, and do not route these records back through generic campaign operations.
