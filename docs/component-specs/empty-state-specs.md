# Empty State Component Specs

## Purpose

Empty states provide constructive feedback when a view has no data to display.  They explain why the view is empty and offer a clear call to action to create or import data.  A well‑designed empty state reassures users that nothing is wrong and guides them toward productive next steps.

## Types of Empty States

1. **Register Empty** — shown on register pages when there are no records.  Suggests creating a new record and optionally links to documentation about the entity.
2. **Relationship Empty** — shown in relationship panels when a record has no related items.  Provides a concise explanation and a button to link/create related records if allowed.
3. **Search/Filter Empty** — when a search or filter yields no results.  Suggests adjusting the search term or clearing filters.  Provides a reset button.
4. **Section Empty** — used in detail pages when an optional section (e.g. attachments) is empty.  Explains that there is no content yet.

## Props / Data Contract

* `type: 'register' | 'relationship' | 'search' | 'section'` — determines which variant to render.
* `title: string` — succinct heading explaining the situation (e.g. “No chemicals found”).
* `message: string` — secondary text offering guidance (e.g. “Create a chemical record to get started.”).
* `actionLabel?: string` — label for the primary action button.
* `onAction?: () => void` — callback invoked when the user clicks the action button.  If omitted, the button is not shown.
* `illustration?: ReactComponent` — optional icon or illustration representing the state.  If omitted, a default icon is used based on `type`.

## Visual Design

* Empty states are centred within their container both vertically and horizontally.
* The illustration appears above the title with generous whitespace.
* The title uses a medium font weight; the message uses normal weight and smaller size.
* The action button uses the primary colour palette and appears below the message.  If there is no action, the button area is omitted.

## Interaction Rules

* The action button triggers `onAction`.  When performing an async operation, the parent component should handle loading state; the empty state itself does not manage asynchronous behaviour.
* If `onAction` is not provided, the button is not rendered.  Do not render a disabled button.
* Search/Filter empty states include an inline “Clear filters” or “Reset search” button separate from the primary action.  This secondary action is passed via `onClearFilters` prop (if implemented by the parent).

## Accessibility Rules

* Use semantic headings for the title (`h2` or `h3` depending on context).
* The illustration must have an `alt` attribute set to an empty string if purely decorative, or a descriptive alt text if it conveys meaning.
* The action button must have an accessible name matching `actionLabel` and be keyboard focusable.

## Acceptance Criteria

* The component renders the appropriate variant based on `type` and displays title, message, illustration and action accordingly.
* Text truncates or wraps gracefully on narrow screens.
* Buttons invoke their callbacks and are hidden when not applicable.
* Illustrations have appropriate alt attributes and do not interfere with screen reader flow.