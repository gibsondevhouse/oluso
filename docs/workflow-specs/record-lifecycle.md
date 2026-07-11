# Record Lifecycle Workflow Specification

## Purpose

Define the common lifecycle states that apply to records in OLUSO and describe how transitions between states occur.  This ensures consistent behaviour across registers and informs UI components about which actions are available.

## Lifecycle States

1. **Draft** — A record is being created but has not yet been saved.  Drafts exist only in memory.  Users can abandon a draft without persisting it.
2. **Active** — The default state after a record is saved.  The record is editable and participates in workflows.  `archived_at` is null.
3. **Closed** — The record is complete and no longer editable.  Applicable to workflows like findings and corrective actions.  Closed records may still be viewable and can transition to Verified.
4. **Verified** — A closed record has been reviewed and approved.  Applicable to corrective actions.  Verified records are read‑only and indicate completion.
5. **Archived** — The record is no longer active but retained for reference.  `archived_at` is set to the date of archiving.  Archived records are hidden from default lists but can be accessed via filters.
6. **Deleted** — The record has been permanently removed.  Deletion is rare and generally limited to administrative corrections.  Deleted records cannot be restored.

## Transition Rules

* **Draft → Active:** Occurs on saving a new record.  Assigns a UUID and relevant codes.  `created_at` and `updated_at` are set.
* **Active → Closed:** A user marks the record as closed (for applicable registers).  Must capture `closed_at` timestamp and, if required, a closure comment or reason.
* **Closed → Verified:** A separate user or authorised role verifies the closed record.  Sets `verified_at` timestamp and may capture a verification comment.  Only possible if the record is already closed.
* **Active/Closed/Verified → Archived:** A user archives the record via an Archive action.  Sets `archived_at`.  Cannot archive a record with active children (see cross‑record rules in validation spec).
* **Archived → Active:** Restoration.  Clears `archived_at` and returns the record to Active state.  Requires confirmation.
* **Any State → Deleted:** Permanently delete.  Only system administrators or elevated roles can perform deletion.  Forbid deletion if record has dependent records (unless those records are also deleted).

## UI Behaviour

* Display a status chip for the current state.  See `status-chip-specs.md`.
* Provide actions (buttons/menus) that reflect valid transitions.  For example, an Active record may show “Close” and “Archive”; a Closed record may show “Verify” and “Archive”; a Verified record may show only “Archive”.
* Before transitioning to Archived or Deleted, display a confirmation dialog (see `confirm-dialog-specs.md`).  For Verified and Closed transitions, require additional input as defined by the specific workflow (e.g. verification comment).
* Disable edit actions when the record is Closed, Verified or Archived.

## Audit Trail

For each transition, record a lifecycle event in an audit table or history log (future feature).  Include `record_id`, `previous_state`, `new_state`, `timestamp`, `user_id`, and `comment`.  This supports activity feeds and compliance requirements.

## Acceptance Criteria

* Lifecycle states and transitions are implemented consistently across registers.
* The UI only shows actions that correspond to valid transitions.
* Archiving or deleting respects cross‑record dependencies and confirms with the user.
* Closed and Verified records capture timestamps and comments where required.