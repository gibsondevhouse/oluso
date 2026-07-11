# Persistence Stack Specification

## Purpose

Define the concrete technologies and patterns used to persist OLUSO data on the user’s device.  This spec expands on ADR‑0004 by providing implementation‑level details and guidance for developers writing the persistence module.

## Technology Choice

* **Database Engine:** SQLite 3, bundled with the application.  Supports ACID transactions, foreign keys and indexing.
* **Access Layer:** A thin data access library written in TypeScript (for the UI) and Rust (for Tauri commands).  The TypeScript layer defines high‑level functions for each domain; the Rust layer executes SQL queries via `sqlx` or similar.
* **Storage Location:** The SQLite file (`oluso.db`) is stored in the user’s application data directory provided by Tauri (`appLocalDataDir()`).  Attachments and exported files are stored in separate directories under the same root.

## Database Initialisation

* On application launch, the persistence module checks for the existence of `oluso.db`.  If absent, it creates the file and applies all migrations up to the latest version.
* A `schema_version` table stores the current version number.  Migration scripts are numbered sequentially (e.g. `001_initial.sql`, `002_add_hazards.sql`).
* Migration files reside in the `src-tauri/migrations/` directory and are applied in order.

## Data Access Patterns

* **Domain Modules:** Each register has its own TypeScript module exposing functions such as `listLocations(filters)`, `getLocationById(id)`, `createLocation(data)`, `updateLocation(id, data)`, `archiveLocation(id)`.  These functions call Tauri commands implemented in Rust.
* **Transactions:** Complex operations (e.g. creating a SEG and linking hazards) should be wrapped in a transaction to ensure atomicity.
* **Async Behaviour:** All data access functions return Promises.  UI components await these functions and display loading states accordingly.

## Error Handling

* SQL errors and IO errors are caught in the Rust layer and returned to the UI with meaningful error codes and messages.
* The UI translates technical errors into user‑friendly messages (e.g. “Unable to save data.  Please check disk space.”).
* In case of database corruption, the persistence module attempts to back up the corrupted file and reinitialize a new database.  The user is notified and provided with recovery options.

## Concurrency

SQLite allows concurrent reads but serialises writes.  The persistence module must queue write operations and avoid long‑running transactions that block the UI.  For heavy read queries (e.g. analytics), consider spawning them in a worker thread.

## Backup & Export

While backups are covered in `backup-export.md`, note that the persistence stack must support file locking and safe copying while the database is in use.  Use SQLite’s online backup API via Tauri commands.

## Security Considerations

* **Encryption:** The MVP does not include database encryption.  Sensitive data should not be stored in plain text.  Future ADRs may introduce encryption at rest.
* **Permissions:** Ensure that only the current user account can access the application data directory.  On multi‑user systems, data should be isolated per user.