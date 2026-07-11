# Page Header Component Specs

## Purpose

The page header provides a consistent top section for every routed page.  It conveys the page title, an optional subtitle/description, context‑specific actions (e.g. “New Record”, “Edit”), status indicators, and breadcrumbs.  Standardising the page header prevents each page from inventing its own layout and ensures that accessibility and responsiveness are handled centrally.

## Props / Data Contract

* `title: string` — the primary heading displayed prominently.
* `description?: string` — a concise explanation of the page’s purpose or current record.  Optional.
* `actions?: ActionButton[]` — a list of action definitions.  Each action has `label`, `icon`, `onClick`, and optional `disabled` and `tooltip` properties.
* `breadcrumbs?: BreadcrumbItem[]` — an ordered list of breadcrumb items.  Each item has `label` and `route`; all but the last are links.
* `status?: StatusChipProps` — optional status chip indicating record state (e.g. draft, archived).

## Layout

The page header is divided into two horizontal rows:

1. **Title Row** — contains the breadcrumbs (if provided) and the title.  The title uses a large font size and truncates gracefully on narrow widths.  The breadcrumbs appear on the left above the title; if there is insufficient space, they wrap to their own line.
2. **Actions Row** — contains the description on the left and the actions on the right.  If a status chip is provided, it is displayed next to the description.  The actions align to the right edge and wrap to multiple lines if necessary.

On very narrow widths, the actions collapse into an overflow menu (e.g. a kebab icon) to prevent crowding.  The description may wrap onto a new line.

## Interaction Rules

* Clicking a breadcrumb navigates to its `route` and updates the router.  The current page’s breadcrumb is not clickable.
* Action buttons trigger their associated callbacks.  If a button is disabled, it is removed from the tab order and visually dimmed.
* If the actions overflow, an overflow menu appears containing the remaining actions.  The overflow menu is keyboard navigable and closes on outside click or `Escape`.

## Accessibility Rules

* The page title uses an `h1` element.  Breadcrumbs use a `nav` with `aria-label="Breadcrumb"` and an ordered list inside.
* Buttons use semantic `<button>` elements and include visible labels or accessible names via `aria-label` when only an icon is shown.
* The overflow menu uses menu roles (`role="menu"`, `role="menuitem"`) and supports keyboard navigation.

## Empty & Error States

* If no `actions` are provided, the actions region is omitted.  The header remains aligned.
* If the `breadcrumbs` array is empty or undefined, no breadcrumb navigation is displayed.  The title aligns to the left of the header.
* If an action callback throws, the error must be caught and surfaced via page‑level error handling; the page header itself should not handle business logic errors.

## Acceptance Criteria

* The component renders titles, descriptions, breadcrumbs, status chips, and actions according to the provided props.
* Long titles and descriptions truncate or wrap gracefully without overlapping other elements.
* Breadcrumb navigation works with keyboard and assistive technologies and updates the router correctly.
* Action buttons are accessible, reflect disabled states, and overflow into a menu on small widths.