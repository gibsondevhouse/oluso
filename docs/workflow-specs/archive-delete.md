# Archive & Delete Workflow Specification

## Purpose

Define the rules and user experience around archiving and deleting records.  Archiving removes a record from active lists while preserving it for reference, whereas deletion permanently removes it.  The workflow ensures that users understand the consequences and cannot accidentally remove important data.

## Archiving

* **Eligible Records:** Any active record in a register may be archived unless it has dependent active records (e.g. a location with active processes, a process with active findings).  See cross‑record rules in `validation-rules.md`.
* **Initiation:** Users click the Archive action on a detail page.  The button is visible for active records.
* **Confirmation:** A confirmation dialog appears: “Archive this [Record Type]?  Archived records are hidden but can be restored.”  The dialog includes Archive (danger) and Cancel buttons.
* **Processing:** On confirm, the persistence layer sets `archived_at` to the current timestamp and updates the record’s status if applicable.  Any child records remain untouched but may still appear in searches via filters.
* **Aftermath:** The record is removed from default lists and search results unless a filter for archived records is enabled.  On the detail page, a banner indicates that the record is archived and provides a “Restore” button.
* **Restoration:** Restoring an archived record clears `archived_at`.  Restoration is allowed only if parent records are active and no conflicts arise (e.g. duplicate codes).

## Deletion

* **Eligibility:** Deletion is restricted to administrative users.  Deleting a record may cascade to delete or archive dependent records.  Deletion is used sparingly (e.g. accidental creation, privacy requests).
* **Initiation:** Users with permission click “Delete” from the archived record view or an administrative panel.
* **Confirmation:** A stronger confirmation dialog appears with explicit warnings: “This will permanently delete the record and all related data.  This action cannot be undone.”  The user must type the record code or a confirmation phrase to proceed.
* **Processing:** On confirm, the persistence layer removes the record row(s) from the database.  Dependent records are handled as per domain rules: either cascade delete, set foreign keys to null, or prevent deletion if dependents exist.
* **Aftermath:** Deleted records are no longer recoverable.  A success message indicates completion.  Audit logs should record the deletion event.

## UI Considerations

* Archive buttons use neutral colours, while Delete buttons use a danger palette (e.g. red) to indicate risk.
* Archived records show a status chip (archived) and are excluded from default queries.  A filter toggle allows users to include archived records.
* Delete actions are hidden by default and appear only for users with the appropriate role.

## Acceptance Criteria

* Users can archive active records and restore archived records, subject to dependency rules.
* Archive operations require confirmation and display success messages.  Restored records reappear in active lists.
* Delete operations are restricted, require explicit confirmation and remove the record permanently along with dependents as defined.  Audit logs capture deletions.
* UI clearly distinguishes between archiving and deleting and communicates consequences.