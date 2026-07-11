# Backup & Restore Workflow Specification

This document defines the backup and restore workflow for **Olùṣọ́**.  System operators use this workflow to create complete snapshots of the database and restore from previous backups when necessary.

## Purpose

Backups protect against data loss due to corruption, user error, or system failure.  Restores allow the system to be rolled back to a known good state.  The workflow ensures that backups are easy to initiate, labelled clearly, and stored in a secure location (e.g., Google Drive).

## Backup Process

1. **Initiation**
   - Accessible from the system settings page under “Data Management”.
   - Button labelled “Create Backup”.  Clicking opens a confirmation dialog.

2. **Confirmation Dialog**
   - Explain that a full backup includes all registers, user preferences, and audit logs.
   - Offer option to include media files (images, attachments) or exclude them for a smaller backup.
   - Confirm destination (default Drive folder `oluso/backups`).
   - Provide an optional description field (e.g., “Pre‑upgrade backup”).
   - “Confirm” triggers the backup; “Cancel” aborts.

3. **Execution**
   - System packages all SQLite tables and uploads them as a compressed archive (`oluso-backup-YYYYMMDD-HHMMSS.zip`) to the designated Drive folder.
   - Display progress with a determinate progress bar.  Keep UI responsive; allow cancellation with warning that backup will be incomplete.
   - On completion, show success toast with link to the file.  Record the backup in the system log.
   - On failure, show error toast with details and a retry option.

4. **Retention**
   - Maintain a configurable retention policy (e.g., keep last 10 backups).  When limit is exceeded, ask the user whether to delete the oldest backup or cancel the new backup.

## Restore Process

1. **Initiation**
   - Accessible from “Data Management” under “Restore from Backup”.
   - Presents a list of available backup files in the designated Drive folder.  Include file names, creation dates, sizes, and user‑supplied descriptions.

2. **Selection & Warning**
   - User selects a backup file.  Show warning that restoring will overwrite the current database.  Provide a checkbox “I have created a backup of the current data”.  Do not allow proceeding unless checked.

3. **Restore Execution**
   - Disable other system operations.  Download the selected backup, decompress it, and replace the SQLite database.  Ensure file permissions and migration scripts are applied.
   - Display a progress bar.  Provide estimated time to completion.
   - On success, automatically reload the application.  Show success toast (“Restore complete.  Data has been rolled back to [timestamp]”).
   - On failure, show error toast.  Do not partially overwrite data; keep original database intact.

## Permissions

Only administrators with the `data_admin` role may perform backups and restores.  Attempting to access the workflow without this role must redirect to an error page (“Access denied”).  Audit all backup and restore actions with timestamps and user IDs.

## Testing

- Create backups with and without media files; verify that the resulting ZIP contains expected content.
- Restore from a backup; verify that all tables and records match the backup state.
- Test cancellation during backup; ensure partial files are cleaned up.
- Test retention policy by creating more than the configured number of backups.