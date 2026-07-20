# Activity feed specification

Status: Current Campaign 6 implementation
Last updated: 2026-07-20

## Purpose

Show meaningful record changes without creating a second audit system.

## Source rules

- Current typed activity comes from immutable `record_revisions`.
- Each row shows actor, timestamp, record type, source revision/event ID, package/source, scope where resolvable, and a stable destination.
- Retained legacy records may appear only as limited-history metadata rows.
- Recent navigation history is never mixed into activity.

## Interaction

- `/activity` provides search, source, record-type, and time filters.
- Home may show a short Recent Activity summary that links to `/activity`.
- Filtering changes visibility only; it does not remove storage/source failure notices.

## Acceptance

- No row fabricates field-level history from a single `updatedAt`.
- Every immutable row links to a governed revision source.
- Limited-history rows are visibly labeled.
