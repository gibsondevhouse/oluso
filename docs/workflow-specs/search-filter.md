# Search & Filter Workflow Specification

This document describes searching and filtering ADAMA HSE records. It complements the component specification (`component-specs/search-filter-specs.md`) and uses typed repository queries over canonical local records.

## Workflow

1. **Initial List Load**
   - When a register page loads, it requests the first page of records from the corresponding repository using default sorting (usually by `created_at` descending).  No filters or search terms are applied.

2. **User Enters Search Term**
   - User types into the search bar.  A debounce timer waits 300 ms after the last keystroke.
   - On timer completion, the UI sends a `search` request to the repository with `query` equal to the search string.  Filters remain unchanged.
   - The repository performs full‑text search on designated fields and returns paginated results.  UI updates the table and summary counts.

3. **User Opens Filter Drawer and Selects Filters**
   - User clicks “Filter” to open the drawer.  They select one or more filter values (e.g. hazard type = chemical, status = open).
   - Clicking “Apply Filters” triggers a `list` request with a `filters` dict containing the selected field/value pairs and resets the page to 1.  Search term persists.
   - Each applied filter appears as a chip in the header.  Users may remove chips individually; this triggers an update to the `filters` dict and a new `list` request.

4. **Pagination**
   - Navigating pages (next, previous or page number) calls `list` with the current search term and filters, but updates `page`.  Page size remains constant (configurable via user settings).

5. **Sort Order Change**
   - User clicks a table header to sort by that column.  The UI resets `page` to 1 and sends `list` with `sort_by` and `sort_direction` parameters in addition to the search term and filters.

6. **Error Handling**
   - If the repository returns an error (network failure, server error), the UI displays an error state over the table and a toast notification (“Unable to fetch data. Please try again.”).  Filters and search terms remain in state; retrying reuses them.

7. **Filter Reset**
   - Clicking “Reset” in the filter drawer clears all filters, resets chips, and triggers a `list` request with `filters=None` and the current search term (if any).

## State Management

The search term, filters, page, and sort parameters are stored in the page’s local state (or URL query parameters if deep linking is implemented).  They are not stored in the global store to avoid state leakage between pages.

On navigation away from the page, these parameters are cleared.  On returning via browser back/forward, restore parameters from URL if deep linking is enabled.

## Accessibility

Ensure that search and filter controls are fully operable via keyboard: tabbing cycles through the search bar, filter toggle button, filter controls, and chips.  Use ARIA roles and live regions to announce when results update (“25 records found”).

## Testing

- Verify that combining search terms with filters yields intersection sets (logical AND).
- Test removing chips and confirm results update accordingly.
- Test pagination boundaries (first, middle, last page) with filters and search applied.
- Simulate slow network and ensure loading state persists until completion.
