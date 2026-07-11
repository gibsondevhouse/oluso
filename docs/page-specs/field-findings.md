# Field Findings Page Spec

## Purpose

Record and track field observations, inspection findings, audit issues, and HSE follow-up items.

## Route

`/field/findings`

## MVP Data Source

The local persistence layer stores Finding records with:

* `id`
* `title`
* `description`
* `locationId`
* `severity`
* `status`
* `reportedBy`
* `createdAt`
* `updatedAt`

`severity` and `status` must use the enums in `src/lib/persistence/finding.types.ts`.

## Register Page

The page uses:

* `RegisterPageHeader` for title, summary, persistence status, and `New Finding`.
* `RecordForm` for create/edit.
* `RegisterTable` for list rendering.
* `StatusPill` for severity and status display.

## Register Table Requirements

Columns:

* Severity - status chip, sortable by severity rank.
* Title - primary column, searchable, sortable, includes description.
* Location - searchable and sortable by resolved location name.
* Status - status chip, searchable, sortable, filterable.
* Updated - sortable, not searchable.
* Actions - row-level `Edit`.

Controls:

* Text search placeholder: `Search findings`.
* Status filter label: `Finding status`.
* Count examples: `2 findings`, `1 of 2 findings`.
* Empty CTA: `Add new Finding`.
* Empty/no-match heading: `No records found`.

## Form Requirements

Fields:

* Title - required text.
* Location - required select.
* Severity - required select: Low, Medium, High, Critical.
* Status - required select: Open, In Progress, Closed.
* Reported by - optional text.
* Description - optional textarea.

The form must show helper text, field-level errors, a save button, a cancel button, saving disabled state, and dirty-discard confirmation.

## Error Handling

* Persistence initialization errors show the page error state with retry.
* Create/update errors show as form-level alerts.
* Validation errors show next to fields and block save.
* Missing locations or missing edited findings surface clear errors.

## Acceptance Criteria

* The page uses shared table/form components exclusively for list and form UI.
* Users can create, edit, search, sort, filter, and paginate Findings.
* Finding Title, Location, Severity, and Status are required.
* Invalid enum values are rejected by validation.
* Loading, empty, no-match, and error states are visible and tested.
