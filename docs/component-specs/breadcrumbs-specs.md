# Breadcrumbs Component Specs

## Purpose

Breadcrumbs provide contextual navigation for hierarchical routes, such as `Register → Record → Subsection`.  They allow users to orient themselves within the application and quickly navigate back to parent pages.  The breadcrumbs component is used inside the page header but can be reused elsewhere if needed.

## Props / Data Contract

* `items: BreadcrumbItem[]` — an ordered list of breadcrumb items.  Each item has:
  * `label: string` — the text to display.
  * `route?: string` — the path to navigate to when clicked.  The final item should omit `route` or set it to `undefined` to indicate the current page.

## Visual States

* **Standard** — displays the items in a horizontal row separated by chevron icons (`>`).  All items except the last are rendered as links.
* **Overflow** — if the number of items exceeds a configured maximum (e.g. 4), intermediate items collapse into an ellipsis button.  When clicked, the ellipsis expands to reveal hidden items in a pop‑over list.
* **Truncated Labels** — long labels truncate with an ellipsis but expose the full label in a tooltip on hover/focus.

## Interaction Rules

* Clicking a breadcrumb with a `route` navigates to that route using the router.  The click must not reload the page.
* When the breadcrumb trail is collapsed, clicking the ellipsis opens a pop‑over containing the hidden breadcrumb items.  Each item in this pop‑over behaves like a normal breadcrumb link.
* Keyboard users can navigate the breadcrumbs using `Tab` and activate a link with `Enter` or `Space`.  The ellipsis pop‑over is navigable via arrow keys and closes on `Escape` or outside click.

## Accessibility Rules

* The breadcrumbs container uses `<nav aria-label="Breadcrumb">` and contains an ordered list (`<ol>`).  Each item uses `<li>` with a link (`<a>`) when it has a route.
* The final item uses `aria-current="page"` and is not clickable.
* The ellipsis button has an appropriate `aria-haspopup="true"` and `aria-expanded` state reflecting whether the pop‑over is open.
* Tooltip text for truncated labels is provided via the native `title` attribute or a custom tooltip component.

## Error & Empty States

* If `items` is empty or undefined, the component renders nothing.  Consumers should not pass an empty breadcrumb list.
* If a breadcrumb’s `route` is invalid or missing, clicking it should have no effect and should log a warning in development.

## Acceptance Criteria

* The component renders all breadcrumb items in order with chevron separators.
* Breadcrumbs behave as links except the current page.
* The ellipsis mechanism collapses long breadcrumb chains and is accessible via keyboard.
* Truncated labels show full text on hover/focus.
* ARIA roles and properties are used correctly to expose the breadcrumb structure to assistive technologies.