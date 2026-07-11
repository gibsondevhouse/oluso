# ADR‑0004: Persistence Stack

## Status

Proposed

## Context

OLUSO is a **local‑first desktop application**.  All core records must persist on the user’s device so that the app remains fully functional offline.  We need a concrete persistence stack that supports:

* **Reliable local storage** with ACID semantics for record creation, updates and archival.
* **Structured query capabilities** that map cleanly to our domain model without forcing the UI to invent data access patterns.
* **Simple migrations** so that future schema evolutions do not destroy user data.
* **Isolation of data access** behind a well‑defined boundary.  UI components must never talk directly to the database.

## Decision

1. **Use SQLite as the local database**.  SQLite is battle‑tested, cross‑platform, supports ACID transactions, and is widely available.  It can be bundled with our desktop runtime without external services.
2. **Wrap SQLite access in a domain‑oriented data access layer**.  We will create a persistence module that exposes domain queries (e.g. `getAllLocations()`, `saveProcess(process)`) rather than raw SQL.  This allows unit testing and prevents the UI from coupling to SQL syntax.
3. **Define the database schema in versioned migration files**.  Each schema change will be captured in a numbered migration script.  On application start, the persistence module will automatically apply any pending migrations to bring the user’s database up to date.
4. **Store the SQLite file in the user’s application data directory**.  The exact path will be determined by the desktop runtime (see ADR‑0005) but must support read/write by the app.  The file name will include the product slug (`oluso.db`).

## Consequences

* We gain reliable local storage without requiring a separate database server.  Users retain full ownership of their data.
* The data access layer becomes a critical contract.  All domain queries must be implemented here and tested thoroughly.  UI code cannot bypass this boundary.
* Migrations require discipline.  Each new data spec must include a corresponding migration script and update the schema version number.
* Long‑running queries must be executed asynchronously to avoid blocking the UI.  The persistence module should expose promise/async APIs or offload heavy work to a worker thread.

## Alternatives Considered

* **Embedded document stores** like Realm or NeDB were considered but lacked mature migration tooling and relational joins needed for our register pages.
* **Cloud‑first data storage** was rejected because OLUSO must remain fully offline capable (see ADR‑0001 Local‑First).  Cloud sync may be added later on top of this local stack.

## Related ADRs

* ADR‑0001: Local‑First — establishes the offline requirement.
* ADR‑0007: Record Identity & Lifecycle — defines how records are identified and archived within the persistence stack.