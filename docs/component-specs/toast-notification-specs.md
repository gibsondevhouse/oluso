# Toast Notification Specification

This document defines the toast notification component used across **ADAMA HSE** to deliver transient feedback. Toasts provide non-blocking messages for successes, warnings, errors, and informational events.

## Purpose

Workers perform many actions (creating records, importing data, submitting inspections).  Immediate feedback is essential for confidence and productivity.  Toasts convey the outcome without interrupting the workflow or requiring a modal dialog.

## Design

- **Placement**: Top right corner of the viewport, stacking downward.  On small screens, shift to bottom center to avoid overlapping with the header.
- **Duration**: Default display time is 5 seconds for success and information toasts, 8 seconds for warnings, and 10 seconds for errors.  Users can manually dismiss a toast at any time.
- **Types**: Four semantic variants:
  - **Success** (green): Action completed successfully (e.g., “Chemical added”).
  - **Info** (blue): Non‑critical information or status update (e.g., “Export in progress…”).
  - **Warning** (orange): A recoverable issue or caution (e.g., “Partial import: 3 records skipped”).
  - **Error** (red): An action failed or data could not be saved.
- **Iconography**: Use a checkmark for success, info icon for information, exclamation triangle for warning, and error icon for errors.
- **Actions**: Optionally include a button (“View Details”, “Retry”, etc.) on error or warning toasts.  Action text must be concise; clicking triggers the relevant handler.
- **Accessibility**: Toasts are announced via aria‑live region with `assertive` politeness for errors/warnings and `polite` for success/info.  Provide high contrast text and role attributes.
- **Queueing**: New toasts push older ones down.  Limit concurrent visible toasts to five; additional toasts queue and show after others dismiss.
- **Responsiveness**: Toast width adapts to viewport; maximum width 350 px; content wraps.  Do not allow horizontal scrolling.

## API

The global notification service exposes:

```ts
interface ToastService {
  show(message: string, options?: {
    type?: 'success' | 'info' | 'warning' | 'error',
    duration?: number,
    action?: {
      label: string,
      callback: () => void
    }
  }): void;
  clearAll(): void;
}
```

Components dispatch toast events through this service rather than directly manipulating UI elements.  Unit tests must verify that actions call the service with correct parameters.

## States

| State      | Description                                                    |
|------------|----------------------------------------------------------------|
| Hidden     | No toasts visible.                                              |
| Visible    | One or more toasts are on screen; timers active.                |
| Hovered    | User hovers over a toast; auto‑dismiss timer pauses.            |
| Focused    | Action button inside toast receives focus; timer pauses.       |

## Failure Modes

- **Overflow**: If more than five toasts are triggered in rapid succession, queue them.  Do not discard messages silently.
- **Storage and Package Errors**: Database, quota, migration, backup, or exchange failures must produce actionable feedback and a safe retry/recovery path where appropriate. Network status is informational for application updates/manual transfer and must not imply local records are unavailable.
- **Validation Errors**: Summarize the first error inline (e.g., “Name is required”) and optionally link to a detailed view.

## Testing

- Verify that each toast type displays correct colors, icons and durations.
- Simulate user interactions (hover, focus, click action) to ensure timers pause and actions fire.
- Test queueing by triggering more than five toasts.
- Ensure screen reader announcements occur in the correct order and with proper politeness.
