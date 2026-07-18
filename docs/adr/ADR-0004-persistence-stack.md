# ADR-0004 — Native SQLite persistence stack

Status: Superseded by [ADR-0009](ADR-0009-browser-persistence.md)
Superseded: 2026-07-18

## Historical decision

OLUSO selected SQLite behind TypeScript/Rust data-access layers, with migrations and a database file in the Tauri application-data directory.

## Reason for supersession

The target product is now a web-only local application. Maintaining native SQLite/Rust and browser persistence in parallel creates unacceptable duplication and drift.

## Migration consequence

Existing native SQLite data is a supported migration source until representative conversion, rollback, and equivalence tests pass. The native adapter and migrations must not be removed before that gate.

The current decision is one versioned IndexedDB adapter behind repository contracts. See ADR-0009 and the [persistence specification](../data-specs/persistence-stack.md).
