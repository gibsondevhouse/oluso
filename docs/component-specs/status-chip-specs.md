# Status Chip Component Spec

## Purpose

`StatusPill` provides a compact, non-interactive status indicator for page headers and register tables.

## Data Contract

The component accepts:

* `label` - visible status text.
* `tone` - visual tone class such as `active`, `inactive`, `open`, `progress`, `closed`, `low`, `medium`, `high`, `critical`, `ready`, `loading`, or `error`.
* `state` - optional state string used for class normalization when different from `tone`.
* `context` - optional accessible context such as `Status` or `location`.
* `compact` - dense table variant.

## Behavior

* Chips are non-interactive and do not receive focus.
* Unknown tones fall back to the global neutral pill treatment.
* State class names normalize spaces to hyphens.
* Text is always visible; color is never the only cue.

## Accessibility

* Render with `role="status"`.
* Accessible name is `label` plus optional `context`.
* Compact mode must preserve readable text and contrast.

## Acceptance Criteria

* Active/inactive Location statuses and Finding severity/status values render consistently in shared tables.
* Component tests cover accessible labels and class normalization.
