# Corrective Action Closure Workflow Specification

## Purpose

Define the end‑to‑end workflow for closing and verifying corrective actions that arise from field findings.  A structured closure process ensures that actions are completed satisfactorily and verified by responsible parties.

## States & Transitions

Corrective actions follow the lifecycle defined in `record-lifecycle.md` with additional closure rules:

* **Open:** Action is created and pending work.  Status = Open.
* **In Progress:** Work has started.  Status = In Progress.
* **Closed:** All required work is completed.  Status = Closed.  Requires `closed_at` timestamp and a **closure comment** describing what was done.
* **Verified:** Closure has been reviewed and accepted by a verifier (not the same person who completed the work).  Status = Verified.  Requires `verified_at` timestamp and a **verification comment**.
* **Archived:** Same as other registers; indicates the action is no longer relevant but kept for reference.

## Closure Workflow

1. **Preparation:** The responsible party completes the tasks outlined in the corrective action.
2. **Request Closure:** On the action detail page or edit form, the responsible party selects “Close Action”.  A modal appears prompting them to enter a closure comment.
3. **Validation:** The closure comment is required; the system also validates that all related findings have been addressed (e.g. no remaining open non‑conformities).
4. **Persist:** Upon confirmation, the action’s status changes to Closed.  The `closed_at` timestamp is set to the current date/time, and the comment is stored in the action’s history/log.
5. **Verification:** A separate user with appropriate permissions reviews the closure.  On the action detail page, they select “Verify Action”.  A modal prompts for a verification comment.
6. **Validation:** Verification requires that the action is Closed and that the verifier is not the original responsible party.  The verification comment is required.
7. **Persist:** On confirmation, the action’s status changes to Verified and `verified_at` is set.  The comment is stored.
8. **Post‑Verification:** The related finding may automatically transition to Verified or Closed if all its actions are verified (see workflow rules in `field-findings.md`).

## UI Considerations

* Closure and verification actions are displayed conditionally based on the user’s role and the current status.  They appear as primary actions on the action detail page.
* Closure and verification modals use the confirm dialog component with form inputs for comments.
* After closing or verifying, the UI shows a success toast and updates the status chip.

## Error Handling

* Attempting to close an action without a comment results in form validation errors.
* Attempting to verify an action when not closed or when the user is the responsible party results in a disabled action with explanatory tooltip.
* Persistence errors during closure or verification display an error banner and keep the action in its previous state.

## Acceptance Criteria

* Users can close corrective actions only when all required fields are filled and no open non‑conformities remain.
* Verification requires closure first and cannot be performed by the same user who closed the action.
* Closure and verification comments are required and stored in the action history.
* Status transitions update timestamps and are reflected in the UI and data models.