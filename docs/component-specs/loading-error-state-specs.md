# Loading & Error State Component Specs

## Purpose

Almost every page and component needs to handle asynchronous data fetching and potential failures.  The loading/error state components provide standardised UI surfaces for these situations.  By reusing them across the app, we maintain a consistent user experience and reduce duplicate code.

## Components

1. **Loading Indicator** — shows that content is being fetched.  May be a spinner, skeleton placeholders, or both.
2. **Error Banner** — displays a prominent message when data fetching fails.  Includes a brief description and a retry action.
3. **Unavailable State** — used when a required resource cannot be accessed (e.g. missing record).  Explains what happened and how to proceed.

## Loading Indicator

### Props

* `type: 'spinner' | 'skeleton' | 'inline'` — selects the visual style.  A spinner is centred; skeleton renders placeholder shapes; inline displays a small spinner inline with text.
* `message?: string` — optional message displayed below the spinner (e.g. “Loading chemicals…”).
* `rows?: number` — when using skeletons, the number of placeholder rows.

### Behaviour

* The loading indicator must be visible whenever content is not yet available.  It should occupy the same space the content will eventually take to prevent layout shifts.
* Do not show a spinner for instantaneous operations (< 200 ms) to avoid flicker; delay its appearance slightly.  Skeletons may appear immediately.

## Error Banner

### Props

* `message: string` — a concise explanation of the error (e.g. “Failed to load hazards”).
* `details?: string` — optional additional information or technical error (hidden by default with a “Show details” toggle).
* `onRetry: () => void` — callback invoked when the user clicks “Retry”.

### Behaviour

* The error banner appears inline where content would normally be displayed.  It includes an error icon, the message, and a primary “Retry” button.  If `details` is provided, a secondary “Show details” link toggles the additional text.
* The banner persists until the user retries.  On retry, the parent component should attempt to reload data.

## Unavailable State

### Props

* `title: string` — e.g. “Record not found” or “Access denied”.
* `message: string` — explains why the resource is unavailable.
* `actionLabel?: string` — label for an optional action (e.g. “Go back”).
* `onAction?: () => void` — callback for the action button.

### Behaviour

* The unavailable state appears when a route cannot be fulfilled because of a missing record, invalid route, archived/incompatible dependency, unavailable database, or failed migration. It explains the cause and guides the user to a safe recovery path.
* If `onAction` is provided, a button appears.  Otherwise, only the message is displayed.

## Accessibility Rules

* Loading indicators must be announced to screen readers via `aria-busy="true"` on the parent container.
* Error banners use `role="alert"` so screen readers notify users immediately.  Buttons must have descriptive labels.
* Unavailable states use headings and explanatory text.  Buttons are focusable and have accessible names.

## Acceptance Criteria

* All asynchronous pages display a loading indicator until data is available.
* Error banners appear when data fetching fails and offer a retry action.
* Unavailable states clearly communicate missing or inaccessible resources and provide navigation assistance.
* Components meet accessibility guidelines and do not cause layout shifts when transitioning between states.
