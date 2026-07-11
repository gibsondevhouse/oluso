# Record Not Found Page Spec

## Purpose

Display a helpful message when a specific record cannot be found (e.g. the user navigated to `/operations/locations/123` but no location with ID `123` exists).  This page prevents confusion and guides the user back to a valid context.

## Route

`/record-not-found`

This page is reused by detail routes when a record lookup fails.

## Sidebar Parent

None.  This page is contextual and does not appear in the navigation.

## Domain Owner

Shared across domains.

## Data Source

None.  The page receives the missing record type and maybe ID as query parameters for display only.

## Primary User Tasks

* Understand that the requested record no longer exists or is inaccessible.
* Navigate back to the relevant register page.

## Page Regions

1. **Title** — “Record Not Found”.
2. **Message** — explains that the specific record could not be located.  Displays the record type and optional ID if provided, e.g. “The Location with ID `123` could not be found.  It may have been archived or deleted.”
3. **Actions** — button(s): “Go to [Register]” (navigates to the parent register) and optionally “Go Back”.

## States

Static page.  No loading or error states.

## Accessibility Expectations

* Announce the missing record clearly with an `h1` heading.
* Buttons have clear labels and lead back to valid pages.
* If the record ID is displayed, present it as code (`<code>` element) so screen readers pronounce it accurately.

## Acceptance Criteria

* When a record ID does not exist, the application navigates to this page and passes the record type and ID via query parameters or state.
* The page displays a descriptive message and offers navigation to the parent register.
* The page is keyboard accessible and does not change the side panel’s active state.