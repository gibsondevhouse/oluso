# Error Page Spec

## Purpose

Provide a central page to display when a non‑recoverable application error occurs.  Rather than crashing or showing a blank screen, the error page explains that something went wrong and gives the user options to recover or report the issue.

## Route

`/error`

This page is shown when the app encounters an uncaught exception or fails to load a critical resource.  It may also be used by the router’s error boundary.

## Sidebar Parent

None.  This page does not appear in navigation.

## Domain Owner

Global.

## Data Source

Error details may be passed to this page via navigation state or a global error handler.  Details include error message, stack trace (for development) and timestamp.

## Primary User Tasks

* Understand that an unexpected error occurred.
* Attempt to recover the application or report the issue.

## Page Regions

1. **Title** — “Something Went Wrong”.
2. **Message** — a friendly explanation that the application encountered an error.  In development builds, show technical details; in production, hide sensitive information.
3. **Actions** — buttons: “Reload App” (refreshes the page), “Go to Dashboard” (navigates to `/dashboard`), and optionally “Report Issue” (opens feedback mechanism).
4. **Error Details** — in development mode only, display the error message and stack trace in a collapsible section.

## States

Static.  The error page may display a loading spinner if it attempts to reload automatically after a delay.

## Accessibility Expectations

* The page uses a clear heading and descriptive text.  Buttons have clear labels.
* Error details section is collapsible and uses `aria-expanded` to indicate state.

## Acceptance Criteria

* The error page appears when the app cannot recover from an exception.  It does not break the overall layout.
* The page allows users to reload the app or return to the dashboard.
* Technical error details are shown only in development builds.
* The page is accessible via keyboard and screen reader.