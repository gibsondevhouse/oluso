# Migrations Specification

## Purpose

Define the strategy for evolving the database schema over time without losing user data.  Migrations allow us to introduce new tables, columns or constraints and ensure that existing installations update gracefully.

## Versioning Scheme

* Migrations are stored as SQL files in `src-tauri/migrations/`.
* Each file name starts with a three‑digit zero‑padded number followed by a descriptive name and `.sql` extension, e.g. `001_initial.sql`, `002_add_hazards.sql`.
* The migration runner reads the `schema_version` table to determine the current version and applies pending migrations in ascending order.
* Schema version numbers increment by one per migration; they must not be reused or reordered.

## Migration File Structure

Each migration file contains two SQL statements separated by a delimiter comment `-- down`: the first part applies the migration (up), and the second part reverts it (down).  Example:

```sql
-- 002_add_hazards.sql
-- up
CREATE TABLE hazards (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  ...
);

-- down
DROP TABLE hazards;
```

Down migrations allow developers to roll back during development but are not normally used in production.

## Applying Migrations

* On app startup, the persistence layer queries `schema_version` to determine the current version.
* It scans the migrations directory for files with numbers greater than the current version.
* Each migration’s `up` section is executed within a transaction.  If any statement fails, the transaction is rolled back and the app aborts startup with an error.
* After successfully applying a migration, the version in `schema_version` is updated.

## Writing Migrations

* Every change to the database schema must be captured in a new migration file, even if the change is small.
* Avoid destructive operations (dropping columns/tables) in migrations unless absolutely necessary.  Use new columns and data transforms instead.
* When adding columns with `NOT NULL` constraints, provide a default value or backfill existing rows within the migration.
* Test migrations against sample data to ensure that they can be applied to existing user databases without data loss.

## Handling Data Transforms

If a migration requires modifying existing data (e.g. splitting a field into two), include SQL or code in the migration to perform the transformation.  Always perform transformations in a transaction and back up data if the operation is complex.

## Seeding Data

Seeding of development data is handled separately (see `seed-data.md`) and should not be part of migrations.  Migrations focus on schema, not content.

## Acceptance Criteria

* The migration runner applies pending migrations on startup without user intervention.
* Migrations never leave the database in a partially updated state.
* Adding a new feature that requires schema changes always includes a corresponding migration file.