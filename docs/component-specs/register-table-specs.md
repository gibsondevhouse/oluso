# Register Table Component Spec

## Purpose

`RegisterTable` is the shared list foundation for register pages. It replaces bespoke register tables with one component that owns client-side search, status filtering, column sorting, pagination, empty/loading/error states, and row actions.

## Data Contract

The component accepts:

* `records` - array of records with stable `id` values.
* `columns` - column definitions with `key`, `label`, `accessor`, optional `descriptionAccessor`, `sortAccessor`, `toneAccessor`, `cellKind`, `primary`, `searchable`, `sortable`, and `width`.
* `recordLabel` and `pluralRecordLabel` - used for counts such as `2 locations`.
* `actions` - per-row buttons such as `Edit`.
* `searchPlaceholder` - placeholder for the text search control.
* `statusFilterOptions` and `statusAccessor` - enable status filtering.
* `initialSortKey`, `initialSortDirection`, `initialPageSize`, and `pageSizeOptions` - table defaults.
* `loading`, `loadingMessage`, `error`, and `onRetry` - state handling.
* `emptyMessage`, `emptyActionLabel`, and `onEmptyAction` - empty-state CTA.

## Behavior

* Search is case-insensitive and matches searchable column accessors plus optional descriptions.
* Status filtering narrows the searched result set using `statusAccessor`.
* Sorting applies to one sortable column at a time. Clicking the same header toggles ascending/descending.
* Pagination clamps page numbers and resets to page 1 after search, filter, sort, or page-size changes.
* Counts show either the total (`3 locations`) or filtered count (`1 of 3 locations`).
* Empty registers and no-match filter results both show `No records found`; no-match states offer `Clear filters`.

## Accessibility

* Render semantic table markup with `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th scope="col">`, and `<td>`.
* Sortable headers use buttons, accessible sort labels, and `aria-sort`.
* Search, filter, and page-size controls must have labels.
* Status cells use `StatusPill` so color is not the only state cue.

## Acceptance Criteria

* Locations and Findings use this component for register rows.
* Sorting, search, filtering, pagination, loading, error, empty, and no-match states are covered by tests.
