# Create/Edit/Save Workflow Specification

## Purpose

Standardise how records are created and edited across ADAMA HSE, including save, revision checks, validation, error handling, and dirty-state behavior.

## Workflow Overview

1. **Initiate:** User clicks “New [Record]” or “Edit” on a detail page.
2. **Form Display:** The record form appears (embedded in the page or in a modal).  For create, the form starts with default values.  For edit, it is pre‑populated with existing values.
3. **User Input:** User fills in fields.  Form performs client‑side validation on blur and on submission.
4. **Dirty State:** The form tracks whether any field value differs from `initialValues`.  If dirty, unsaved changes detection is activated.
5. **Save:** User clicks Save.  The form runs validation again.  If valid, it calls `onSave(values)` and awaits completion.
6. **Persist:** The domain service validates again, enforces cross-record invariants and `expectedRevision`, then transactionally writes current state and immutable history through the repository. On success it returns the saved record with identity, revision, and attribution metadata.
7. **Success:** On save, navigate to the record’s detail page (for create) or remain on the detail page (for edit).  Display a success toast/notification.
8. **Cancel:** User clicks Cancel or navigates away.  If the form is dirty, show a confirmation dialog asking to discard changes.  If confirmed, discard; otherwise keep editing.
9. **Error Handling:** If validation, stale-revision, database, quota, or migration state prevents the write, display an actionable form/banner error. Do not navigate away or show saved state; preserve recoverable input.

## Validation

* Forms implement `validation-rules.md` for feedback, but domain/application services validate again and remain authoritative.
* Display field‑level errors below the input.  Display non‑field errors (e.g. unique constraint violations) in a banner at the top.
* While validation errors exist, disable the Save button.

## Dirty State & Unsaved Changes

* A form is dirty if any value has changed from `initialValues`.  The component compares each field’s value to its initial value.
* When dirty and the user tries to close the form (e.g. via Cancel, clicking outside a modal, navigating away), display a confirmation dialog: “You have unsaved changes.  Discard them?”
* If the user chooses to stay, remain in the form.  If they discard, close the form and revert unsaved changes.
* Do not show the unsaved changes dialog if no changes were made.

## Async Save

* While `onSave` is pending, disable all inputs and buttons except a spinner on the Save button.  Prevent multiple submissions.
* If `onSave` resolves successfully, navigate accordingly.  If it rejects, display an error banner and re-enable inputs.

## Cancel & Navigation

* Clicking Cancel triggers `onCancel`.  If the form is dirty, prompt as described above.  Otherwise, navigate back to the previous page.
* Navigating away via browser history or sidebar triggers the same unsaved changes check.

## Acceptance Criteria

* Create and edit forms implement the full workflow described above.
* Validation errors are caught both client‑side and server‑side and displayed to the user.
* Users are prevented from accidentally discarding unsaved changes without confirmation.
* Save operations handle success and failure gracefully, providing feedback and preventing duplicate submissions.
