# Persistence Tests Specification

## Purpose

Ensure the persistence layer correctly saves, loads, migrates and recovers data.  Persistence tests verify that the data access functions work as expected, handle errors gracefully and maintain data integrity across application sessions.

## Test Areas

1. **CRUD Operations**
   * **Create:** Verify that each register can create a new record via the persistence functions.  The saved record should include generated IDs/codes and metadata timestamps.
   * **Read:** Fetch records by ID and verify that the returned data matches what was saved.  Test both active and archived records.
   * **Update:** Modify existing records and ensure `updated_at` is updated.  Validate that unique constraints prevent duplicate codes.
   * **Archive/Restore:** Archive a record and verify that `archived_at` is set.  Restore it and verify that `archived_at` is cleared.
   * **Delete:** For registers where deletion is supported, delete a record and confirm it is removed along with dependent data as specified.

2. **Migrations**
   * Start with an empty database, run migrations and assert that the schema matches the expected version.
   * Apply migrations on a database with existing data and verify that data is preserved and updated correctly.
   * Test rollback (optional) to ensure down migrations work during development.

3. **Validation Enforcement**
   * Attempt to save invalid data (missing required fields, invalid foreign keys, duplicate codes) and assert that the persistence functions return errors.
   * Ensure that cross‑record validation (e.g. preventing archiving of a parent with active children) is enforced.

4. **Concurrency & Transactions**
   * Simulate concurrent writes to ensure that the persistence layer serialises writes and prevents data races.  Use multi‑threaded tests or simulated concurrency.
   * For multi‑step operations, verify that transactions roll back completely on failure.

5. **Backup & Restore**
   * Create a backup of the database file, modify data, then restore the backup and verify that original data is intact.
   * Test backup creation when the database is busy to ensure it does not corrupt the file.

## Testing Tools

* Use an in‑memory SQLite database for fast tests or temporary files for backup tests.
* Leverage Rust unit tests for Tauri commands and TypeScript tests for the high‑level API.
* Use test fixtures to seed minimal data for each test case.

## Acceptance Criteria

* All CRUD operations behave as expected, returning correct data and enforcing constraints.
* Migrations apply successfully to new and existing databases without data loss.
* Validation rules defined in `validation-rules.md` are enforced by the persistence layer.
* Transactions prevent partial data writes and concurrency issues.
* Backup and restore functionality works reliably and does not corrupt the database.