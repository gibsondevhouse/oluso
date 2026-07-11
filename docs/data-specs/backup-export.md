# Backup & Export Specification

## Purpose

Define how users can back up their data and export it for use outside OLUSO.  Reliable backups protect against data loss, and exports support compliance reporting and portability.

## Backup Strategy

* **Automatic Local Backups:** Provide an option to enable periodic automatic backups of the SQLite database.  By default, create a backup once per day when the application is closed or on a schedule.  Store backups in a `backups/` directory within the application data folder.
* **Manual Backup:** Offer a “Back Up Now” action in the system settings.  When invoked, copy the current database file (`oluso.db`) to a user‑selected location.  Use SQLite’s online backup API to avoid file corruption while the database is in use.
* **Retention Policy:** Keep a configurable number of automatic backups (e.g. last 7).  Older backups are pruned automatically.  Manual backups are not pruned.
* **Restoration:** Provide documentation and tooling to restore a backup by replacing `oluso.db` with a chosen backup file.  For safety, create a backup of the current database before restoring.

## Export Functionality

Exports allow users to extract data for reporting or migration.  The Reports & Exports page (see `page-specs/reports-exports.md`) implements user‑facing export generation.  The persistence layer provides support for:

* **Register Exports:** Output all records from a given table, optionally filtered by date range or status, in formats such as CSV or JSON.  Each export includes column headers and values in a consistent order.
* **Composite Reports:** Create pre‑defined views that combine data from multiple registers (e.g. list of open findings and their corrective actions).  These are implemented via SQL queries and output to PDF or other report formats.
* **Metadata Tracking:** Record metadata about each export (see `export_metadata` in `schema-overview.md`), including filters and generation time, so users can re‑download later.

## Export Storage

* Exports are written to a user‑selected directory.  The system settings page allows configuring a default export directory.
* Files are named with a prefix indicating the register or report and a timestamp (e.g. `locations_2026-07-06.csv`).
* The persistence layer ensures that writing the export does not block the UI and reports progress to the user.

## Security & Privacy

* Data exports may contain sensitive information.  Warn users that exported files are not encrypted and should be stored securely.
* Do not automatically email or upload exports; user‑initiated sharing must be manual.

## Acceptance Criteria

* Automatic backups run according to schedule and prune old backups.  Manual backups can be created via UI.
* Users can restore from a backup using documented steps.
* Exports for each register and composite report can be generated with filters and saved to disk.
* Export metadata is recorded and can be used to re‑download files.
* Backup and export operations handle errors gracefully (e.g. insufficient disk space, permission denied).