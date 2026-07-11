# Relationship Panel Component Specs

## Purpose

Many records in OLUSO have relationships with other records (e.g. a field finding has corrective actions; a chemical belongs to a SEG).  The relationship panel displays these linked records and provides navigation between them.  It enables users to see context and traverse related data without losing their place.

## Props / Data Contract

* `relationships: RelationshipDef[]` — an array of relationship definitions.  Each definition includes:
  * `title: string` — heading for the relationship (e.g. “Corrective Actions”).
  * `records: RelatedRecord[]` — list of related records.  Each item defines `id`, `label`, `status`, and `route`.
  * `emptyMessage?: string` — message shown when no records exist.
  * `onCreate?: () => void` — callback to create/link a new related record.
* `orientation?: 'sidebar' | 'footer'` — where to render the panel.  In `sidebar` mode, it appears to the right of the main content; in `footer` mode, it appears below the main content.

## Visual Design

* Each relationship group is separated by a heading.  Below the heading, a list of cards or list items represents each related record.
* Each related record shows its label and a small status chip indicating its lifecycle state.  Optionally, additional metadata like due date or type may be displayed.
* If there are no related records, the `emptyMessage` is shown instead of an empty list.  If `onCreate` is provided, a button labelled “Add [title]” appears.

## Interaction Rules

* Clicking a related record navigates to its detail page via the provided `route`.  This must update the router without reloading the application.
* The “Add” button triggers `onCreate` which should open the record form pre‑linked to the current record.
* Relationship groups may be collapsible to save vertical space.  Collapsed state persists during navigation within a session.
* When displayed as a sidebar, the relationship panel scrolls independently of the main content if there are many related items.

## Accessibility Rules

* The panel uses `aside` with `aria-labelledby` referencing the group heading.  Each relationship group uses a nested `section` element.
* Lists of related records use semantic `<ul>`/`<li>` markup.  Each item is a link (`<a>`) with a clear label.
* Collapsible groups indicate their state via `aria-expanded` and can be toggled with keyboard controls.

## Error & Empty States

* If `records` is undefined (still loading), the parent page should display a loading indicator in place of the relationship panel.
* When an error occurs while fetching related records, a small error banner appears within the panel with a retry action.

## Acceptance Criteria

* The component displays one or more relationship groups with headings and lists of related records.
* Clicking a related record navigates to the correct route and updates the breadcrumb.
* Empty groups show an explanatory message and an optional action to create related records.
* The panel is accessible, uses proper semantics, and can be navigated via keyboard.