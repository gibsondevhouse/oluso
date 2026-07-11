# Operations - Locations Page Spec

## Purpose

Manage operational locations used by HSE workflows.

## Route

`/operations/locations`

## MVP Data Source

The local persistence layer stores Location records with:

* `id`
* `name`
* `type`
* `description`
* `status`
* `createdAt`
* `updatedAt`

`type` must be one of the Location type enum values in `src/lib/persistence/location.types.ts`.

## Register Page

The page uses:

* `RegisterPageHeader` for title, summary, persistence status, and `Add location`.
* `RecordForm` for create/edit.
* `RegisterTable` for list rendering.
* `StatusPill` for active/inactive status display.

## Register Table Requirements

Columns:

* Name - primary column, searchable, sortable, includes description.
* Type - searchable and sortable.
* Status - status chip, searchable, sortable, filterable.
* Updated - sortable, not searchable.
* Actions - row-level `Edit`.

Controls:

* Text search placeholder: `Search locations`.
* Status filter label: `Location status`.
* Count examples: `3 locations`, `1 of 3 locations`.
* Empty CTA: `Add new Location`.
* Empty/no-match heading: `No records found`.

## Form Requirements

Fields:

* Name - required text.
* Type - required select backed by the Location type enum.
* Status - required select: active or inactive.
* Description - optional textarea.

The form must show helper text, field-level errors, a save button, a cancel button, saving disabled state, and dirty-discard confirmation.

## Error Handling

* Persistence initialization errors show the page error state with retry.
* Create/update errors show as form-level alerts.
* Validation errors show next to fields and block save.
* Missing edited records surface the persistence error instead of silently failing.

## Acceptance Criteria

* The page uses shared table/form components exclusively for list and form UI.
* Users can create, edit, search, sort, filter, and paginate Locations.
* Location Name and Type are required.
* Invalid Location type or status values are rejected by validation.
* Loading, empty, no-match, and error states are visible and tested.
