# Route Tests Specification

## Purpose

Define route tests for the ADAMA HSE target contract, including active navigation, breadcrumbs, legacy redirects, Future Module boundaries, and not-found/error behavior.

## Test Cases

1. **Home Route and Dashboard Alias**
   * Navigating to `/` redirects to `/home`.
   * Navigating to `/dashboard` redirects to `/home`.
   * The side panel highlights the “Home” item for `/home` and the legacy `/dashboard` path during redirect.
   * The page title displays “HSE Operations Portal”.

2. **Operations Locations Routes**
   * `/operations/locations` displays the Locations register list with the “Locations” side panel item active.
   * `/operations/locations/new` shows the new location form.  Breadcrumbs show “Operations / Locations / New”.
   * `/operations/locations/:id` loads the location detail page for an existing ID and shows a record not found page for a non‑existent ID.  The side panel remains on “Locations” and breadcrumbs show “Operations / Locations / [Code]”.
   * `/operations/locations/:id/edit` loads the edit form for the location and updates breadcrumbs accordingly.

3. **Activity Route**
   * `/activity` displays the traceable activity feed.
   * Immutable revision rows include actor, timestamp, source revision/event ID, package/source state, and a stable destination link.
   * Limited legacy metadata rows are labeled as limited history and never described as field-level audit history.

4. **Context Panel Query State**
   * Opening a related-record inspection panel adds `?context=[recordId]` without leaving the underlying record page.
   * Browser back/close removes the context panel before the user leaves the underlying page.
   * Every panel provides an “Open full workspace” route and contains no edit or destructive controls.

5. **Other Registers**
   * Repeat analogous tests for Processes, Chemicals, Hazards, SEGs, Findings and Corrective Actions.  Ensure that each route loads the correct page, side panel highlights the corresponding item, and breadcrumbs reflect the hierarchy.

6. **Administration Settings Route**
   * `/system/settings` displays the settings page and highlights “Storage, Backups & Diagnostics” in the “Administration” group.

7. **Reports & Exports Route**
   * `/reports/exports` loads the exports page and highlights “Review Packets & Exports” under the “Reports” group.

8. **Not Found Route**
   * Navigating to an unknown path (e.g. `/unknown/page`) redirects to `/not-found`.  The not‑found page displays the correct message and does not alter side panel state.

9. **Record Not Found**
   * Navigating to detail routes with invalid IDs (e.g. `/operations/locations/nonexistent`) shows the record not found page with the correct type and ID displayed.

10. **Error Route**
   * When the application throws an uncaught error during routing, the error boundary captures it and displays `/error` with a friendly message.

## Testing Approach

* Use E2E tests (Playwright or Cypress) to simulate navigating to each route and assert page content, side panel state and breadcrumbs.
* Use unit tests for the router configuration to ensure that each path maps to the correct component and that nested routes are defined correctly.

## Acceptance Criteria

* All defined routes load the correct pages without errors.
* Side panel active state updates according to the route.
* Breadcrumbs show the correct hierarchy on detail and edit pages.
* Not‑found and error pages display when expected and provide navigation back to Home.
