# Form Validation Tests Specification

## Purpose

Verify shared `RecordForm` behavior and the validation contracts for Locations and Findings.

## Shared Form Tests

Cover `RecordForm`:

* Required fields prevent submission.
* Field-level messages render with `role="alert"`.
* Invalid fields set `aria-invalid`.
* Valid values call `onSave` with current form values.
* Dirty cancel opens a discard confirmation.
* `Keep editing` preserves the form.
* `Discard changes` calls `onCancel`.

## Data Validation Tests

Locations:

* Blank Name is rejected.
* Blank Type is rejected.
* Invalid Location Type is rejected.
* Invalid Location Status is rejected.

Findings:

* Blank Title is rejected.
* Blank Location is rejected.
* Invalid Severity is rejected.
* Invalid Status is rejected.

## Page Integration Tests

* Submitting invalid Location form data shows field errors.
* Submitting invalid Finding form data shows field errors.
* Successful create/edit flows update persistence and table rows.

## Acceptance Criteria

* Form errors prevent save and appear next to fields.
* Enum values are enforced by the persistence layer.
* Dirty-state protection is covered by component tests.
