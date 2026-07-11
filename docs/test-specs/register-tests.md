# Register Tests Specification

## Purpose

Verify shared register table behavior and the Locations/Findings integrations that depend on it.

## Shared Table Tests

Cover `RegisterTable` and `register-table.utils`:

* Sort ascending and descending.
* Search case-insensitively across searchable columns.
* Filter by status.
* Combine search, status filter, and sort.
* Clamp pagination boundaries.
* Render count labels.
* Render empty, no-match, loading, and error states.
* Expose sort buttons and `aria-sort`.
* Call row actions.

## Page Integration Tests

Locations:

* Create and edit a Location.
* Search for a Location.
* Filter by Location status.
* Sort by Name.
* Render empty CTA and persistence error state.

Findings:

* Create and edit a Finding.
* Search for a Finding.
* Filter by Finding status.
* Sort by Severity.
* Render empty CTA and persistence error state.

## Accessibility Checks

* Search and filter controls have labels.
* Sort controls are buttons.
* Status values render with accessible status names.
* Tables use semantic rows, column headers, and cells.

## Acceptance Criteria

* Shared utility tests pass.
* Shared component tests pass.
* Locations and Findings page tests pass against the shared component behavior.
