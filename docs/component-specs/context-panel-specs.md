# Context panel specification

Status: Current Campaign 6 implementation
Last updated: 2026-07-20

## Purpose

Allow read-first inspection of a related record without leaving the current workspace.

## Behavior

- Opening a panel adds `?context=[recordId]` as secondary view state.
- The full record URL remains canonical and is always available through “Open full workspace.”
- Closing the panel removes the query state and returns focus to the invoking control when possible.
- Escape closes the panel.
- Missing and archived related records render explicit states.

## Safety rules

- Version 1 panels do not contain edit forms.
- Archive, restore, delete, and other destructive actions remain on the full workspace.
- Opening or closing a panel does not mutate records and does not discard underlying form or page state.

## Responsive and accessibility

- The panel is a named complementary region on wider screens.
- On narrow screens it becomes a full-width sheet while keeping the full-record route available.
- Controls are keyboard reachable and have visible focus.
