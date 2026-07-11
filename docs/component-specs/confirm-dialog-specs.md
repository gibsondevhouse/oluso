# Confirm Dialog Component Specs

## Purpose

The confirm dialog is used to ask the user to confirm potentially destructive or irreversible actions, such as deleting or archiving a record or discarding unsaved changes.  A standard confirm dialog enforces consistency, prevents accidental data loss, and provides clear messaging about the consequences of the action.

## Props / Data Contract

* `title: string` — the heading of the dialog (e.g. “Delete record?”).
* `message: string` — a brief description of what will happen if the user confirms.
* `confirmLabel?: string` — label for the confirmation button (default: “Delete” or “Confirm”).
* `cancelLabel?: string` — label for the cancel button (default: “Cancel”).
* `onConfirm: () => void` — callback executed when the user confirms.
* `onCancel: () => void` — callback executed when the user cancels or closes the dialog.
* `danger?: boolean` — if true, styles the confirm button in the danger palette (e.g. red background) to emphasise risk.

## Behaviour

* The confirm dialog appears as a modal overlay, blocking interaction with the rest of the application until closed.  Focus is trapped within the dialog.
* Clicking the confirm button triggers `onConfirm`, closes the dialog and performs the action.  The button may display a loading state if the action is asynchronous.
* Clicking the cancel button or outside the dialog triggers `onCancel` and closes the dialog.  Pressing `Escape` has the same effect.
* If the action is not dangerous (e.g. simple discard), the confirm button uses the primary palette.  If `danger` is true (delete/archive), the confirm button uses the danger palette.

## Accessibility Rules

* The dialog uses `role="alertdialog"` and has `aria-modal="true"` to announce itself as a modal.
* The `title` prop maps to a heading inside the dialog and is referenced by `aria-labelledby`.  The `message` maps to `aria-describedby`.
* Focus is set to the cancel button when the dialog opens so that keyboard users do not accidentally trigger a dangerous action by default.
* Keyboard navigation is limited to elements inside the dialog; focus is returned to the triggering element when the dialog closes.

## Acceptance Criteria

* The dialog renders with a clear title, message, and two buttons.
* Danger actions are visually distinguished and require explicit confirmation.
* Focus is trapped inside the dialog and returned appropriately on close.
* The dialog is accessible via keyboard and announces itself to screen readers.