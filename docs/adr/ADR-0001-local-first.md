# ADR-0001 — Local-first architecture

Status: Accepted, amended
Original decision: 2026-07-06
Amended: 2026-07-18
Superseding details: ADR-0008, ADR-0009, ADR-0010

## Decision retained

ADAMA HSE uses local, durable, user-controlled storage as its source of truth and remains usable offline after first load. Core record work does not depend on a remote database, SaaS service, cloud account, or network connection.

## Amendments

The following original assumptions are superseded:

- The target is no longer a Tauri desktop application.
- SQLite/native application storage is no longer the target persistence stack.
- The product is no longer modeled as an isolated single-user workflow.
- Multi-installation review/exchange is no longer deferred.
- Web deployment is not out of scope; a local-capable SvelteKit SPA/PWA is the chosen runtime.

The current operating model is two explicit local installations with separate browser databases and attributed users. They exchange reviewed packages manually through OneDrive. There is no automatic cloud sync or remote source of truth.

## Consequences

- The browser database must support migrations, transactional writes, structured queries, recovery, and exact backup/restore.
- Every accepted mutation must be attributable and reconstructable through immutable record revisions.
- Backup, bulk import, and collaboration exchange are distinct workflows.
- OneDrive is transport only.
- Tauri/Rust and `localStorage` readers remain temporarily for verified migration, then are removed.

## Rejected alternatives

- Cloud/SaaS source of truth: outside intended use and operational constraints.
- Maintaining web and Tauri production stacks: duplicates persistence, migration, validation, packaging, and testing.
- File-only JSON as the active database: insufficient transaction/query/integrity behavior.
