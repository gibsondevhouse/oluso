# Record Form Component Spec

## Purpose

`RecordForm` is the shared create/edit foundation for register records. It standardizes field rendering, helper text, validation messages, save/cancel behavior, disabled saving state, and dirty-form protection.

## Data Contract

The component accepts:

* `title` and `ariaLabel` - visible and accessible form identity.
* `fields` - field definitions with `name`, `label`, `type`, optional `required`, `helperText`, `placeholder`, `options`, and `rows`.
* `initialValues` - string values used to initialize controlled fields.
* `validate(values)` - returns field-level error messages.
* `onSave(values)` - called only after validation passes.
* `onCancel()` - called after a clean cancel or confirmed discard.
* `context`, `submitLabel`, `cancelLabel`, and `validationSummary`.

Supported field types are `text`, `textarea`, and `select`.

## Behavior

* Fields are controlled by the form component.
* Validation runs on blur and submit.
* Field errors render next to the relevant input and are linked with `aria-describedby`.
* Required fields set `aria-required`.
* Save is disabled and displays `Saving...` while `onSave` is pending.
* If `onSave` throws or rejects, the message appears as a non-field form alert.
* Cancel on a dirty form opens a discard confirmation.
* Browser unload and in-page anchor navigation are guarded while dirty where supported.

## Accessibility

* Every input/select/textarea has a label and plain accessible name.
* Error text uses `role="alert"`.
* Save, cancel, discard, and keep-editing controls are keyboard reachable.

## Acceptance Criteria

* Locations and Findings use `RecordForm` for create/edit.
* Required and enum validation errors prevent save and display near fields.
* Dirty-state protection is covered by component tests.
