# Architecture decision records

Last updated: 2026-07-18

## Current decisions

| ADR | Status | Decision |
| --- | --- | --- |
| [ADR-0001](ADR-0001-local-first.md) | Accepted, amended | Local-first and offline remain governing; desktop/single-user assumptions are superseded. |
| [ADR-0002](ADR-0002-navigation-structure.md) | Accepted, amended | Stable domain/workflow navigation remains; current target is defined by the new navigation/routing docs. |
| [ADR-0003](ADR-0003-registers-vs-records.md) | Accepted, amended | Registers index durable records; safety-critical operational records require typed models. |
| [ADR-0004](ADR-0004-persistence-stack.md) | Superseded | Native SQLite/Tauri persistence is replaced by ADR-0009. |
| [ADR-0005](ADR-0005-desktop-runtime.md) | Superseded | Tauri desktop runtime is replaced by ADR-0008. |
| [ADR-0007](ADR-0007-record-identity-and-lifecycle.md) | Accepted, amended | Record identity now includes revision and exchange attribution. |
| [ADR-0008](ADR-0008-web-only-local-first-runtime.md) | Accepted | SvelteKit SPA/PWA in a supported browser is the only target runtime. |
| [ADR-0009](ADR-0009-browser-persistence.md) | Accepted | IndexedDB behind one repository adapter is the primary database. |
| [ADR-0010](ADR-0010-reviewed-exchange-protocol.md) | Accepted | Two installations collaborate through versioned, dry-run, conflict-aware packages. |

## Interpretation rule

Newer accepted ADRs supersede conflicting portions of older ADRs. Historical ADRs are retained to explain the current implementation and migration obligations; they are not deleted or silently rewritten as if the earlier decision never existed.
