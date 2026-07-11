# Not Found Page Spec

## Purpose

Provide a friendly 404 experience when the user navigates to an unknown route.  Instead of a blank screen, the not‑found page explains that the requested page does not exist and offers navigation options back to safety.

## Route

`/not-found`

This page also handles any unmatched routes via the router’s catch‑all configuration.

## Sidebar Parent

None.  The not‑found page is not listed in the navigation and should not alter the side panel’s active state.

## Domain Owner

Global.  Applies to all routes.

## Data Source

None.  No data is loaded for this page.

## Primary User Tasks

* Understand that the page they attempted to access does not exist.
* Navigate back to the dashboard or previous page.

## Page Regions

1. **Illustration/Icon** — large icon or illustration indicating a missing page.
2. **Title** — “Page Not Found” or similar.
3. **Message** — explanatory text suggesting possible reasons (typo, moved page).
4. **Actions** — buttons: “Go to Dashboard” (navigates to `/dashboard`) and “Go Back” (navigates to previous page).

## States

This page does not have loading or error states.  It is static.

## Accessibility Expectations

* The page must announce itself as an error with an appropriate heading (`h1`).
* Icons or illustrations must include `alt` text if they convey meaning; otherwise they are decorative.
* Buttons are focusable and describe their destination.

## Acceptance Criteria

* The page displays a friendly message and offers clear navigation options.
* Navigating to `/not-found` or an unknown route shows this page and does not break the app shell.
* The page is keyboard accessible and screen reader friendly.