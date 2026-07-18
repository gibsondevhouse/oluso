# ADR-0009 — Browser persistence

Status: Accepted
Date: 2026-07-18

## Context

The repository has large, independent browser/`localStorage` and Rust/SQLite persistence implementations. The web target needs structured, transactional, versioned local storage without a native host.

## Decision

Use IndexedDB as the primary local database behind one typed repository contract and one browser adapter.

- UI components never access IndexedDB directly.
- Database open/upgrade, migrations, repositories, revisions, backup, and exchange staging are bounded modules.
- Multi-record domain changes and their immutable revisions share a transaction.
- Schema version is stored and upgraded through ordered, tested migrations.
- `localStorage` is limited to non-authoritative lightweight preferences where appropriate; it is not a record database.
- Legacy `localStorage` and native SQLite data are read only through explicit migration adapters.
- A specific IndexedDB helper library may be selected during implementation, but it cannot alter this contract and requires normal dependency review.

## Operational requirements

- Detect unavailable/blocked database opens and failed/aborted writes.
- Detect and communicate storage quota pressure.
- Preserve the pre-migration database on failed migration.
- Support exact versioned JSON backup/restore with manifest and integrity validation.
- Support offline use and browser/PWA restart durability.
- Avoid claims of guaranteed scheduled background backup; prompt based on time and dataset revision while the app is active.

## Consequences

- Repository-contract tests run against the real browser adapter.
- Migration tests cover every supported legacy schema and target schema.
- Current Rust and browser monoliths are decomposed rather than ported line-for-line.
- Browser/profile clearing remains a data-loss risk mitigated through explicit backup diagnostics and operational guidance.

## Alternatives rejected

- `localStorage`: lacks transactions, structured indexing, and suitable capacity/error behavior.
- Native SQLite/Tauri: conflicts with the web-only decision.
- File System Access/OPFS as the sole database contract: browser/policy portability is insufficient for the initial supported-browser target.
- Remote database: violates local-only intended use.
