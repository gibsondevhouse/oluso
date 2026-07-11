# Validation Rules Specification

## Purpose

Define field-level and enum validation enforced by the UI and local persistence layer. UI validation should mirror persistence validation; persistence remains authoritative.

## Shared Rules

* Records use `id`, `createdAt`, and `updatedAt` as defined by the record identity ADR.
* Required string fields must contain non-whitespace text.
* Enum fields must match the exported enum arrays in the relevant schema file.
* Create/update operations must reject invalid input before writing to persistence.
* Field-level messages should be shown near the relevant form control.

## Locations

Required fields:

* `name`
* `type`
* `status`

Allowed `type` values:

* Facility
* Storage
* Workshop
* Office
* Outdoor Area

Allowed `status` values:

* active
* inactive

Validation messages:

* Blank name: `Name is required.`
* Blank type: `Type is required.`
* Invalid type: `Type must be one of: Facility, Storage, Workshop, Office, Outdoor Area.`
* Invalid status: `Status must be active or inactive.`

## Findings

Required fields:

* `title`
* `locationId`
* `severity`
* `status`

Allowed `severity` values:

* Low
* Medium
* High
* Critical

Allowed `status` values:

* Open
* In Progress
* Closed

Validation messages:

* Blank title: `Title is required.`
* Blank location: `Location is required.`
* Invalid severity: `Severity is required.`
* Invalid status: `Status is required.`

## Acceptance Criteria

* UI form validation and persistence validation reject missing required fields.
* Invalid enum values are rejected even if they are injected outside the normal select controls.
* Tests cover Location type validation and Finding severity validation.
