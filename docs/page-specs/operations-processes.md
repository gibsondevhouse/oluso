# Operations — Processes Page Spec

## Purpose

Manage operational processes and procedures.  Users can list processes, create new ones, edit existing ones and view detailed information.  Processes may be linked to locations and contribute to hazard assessments.

## Route

`/operations/processes`

Child routes:

* `/operations/processes/new` — create a new process.
* `/operations/processes/:processId` — view details of a process.
* `/operations/processes/:processId/edit` — edit an existing process.

## Sidebar Parent

“Operations” group → “Processes” item.

## Domain Owner

Operations Domain.

## Data Source

`processes` table.  Each process record includes:

* `id` (UUID)
* `code` (string) — unique short identifier.
* `name` (string)
* `description` (text)
* `location_id` (UUID) — foreign key linking to a location.
* `created_at`, `updated_at`, `archived_at`
* Additional fields: owner, procedure document link.

## Primary User Tasks

* View all processes; filter by location or status.
* Create a new process and assign it to a location.
* Edit process details and archive processes that are obsolete.
* Navigate to related location, hazards, SEGs and findings.

## Page Regions

### Register Page

* **Page Header** — “Processes” with “New Process” action.
* **Filters** — search by name/code; filter by location; filter by status (active/archived).
* **Register Table** — columns: Code, Name, Location (display location name), Status, Last Updated.
* **Empty/Loading/Error States** — per specs.

### Create & Edit Pages

* Use `record-form-specs.md` with fields: Code, Name, Description (textarea), Location (select from existing locations), Owner (text), Procedure Document (optional link).
* Validation: code and name required; code unique; location required.
* On save, persist and navigate to detail.  Cancel returns to register or detail.

### Detail Page

* Use `record-detail-layout-specs.md`.
* Overview: Code, Name, Location (linked), Owner, Created/Updated.
* Details: Description, Procedure Document link.
* Relationships: Hazards (identified as part of this process), SEGs, Field Findings, Corrective Actions.
* Actions: Edit, Archive.

## States

Same as the Locations page: loading, empty, error, missing record.

## Record Relationships

* A process belongs to one location (`location_id`).  The process detail page must link to the location detail.
* A process may have multiple hazards and SEGs associated with it.  The relationship panel should display hazards found in this process and SEGs resulting from process analysis.
* Field findings recorded for a process (via inspections) should be linked.  These can then link to corrective actions.

## Accessibility Expectations

* Forms must provide labels for all fields and assistive error messages.
* The location select input must be searchable and accessible via keyboard.
* Relationships panel links describe the relationship (e.g. “Hazard HZ‑010 in Process PR‑001”).

## Acceptance Criteria

* Users can list, search and filter processes, including by location.
* Users can create and edit processes, with validation and unsaved changes prompts.
* Details pages show all process information and related records.
* Archived processes are hidden from default view but accessible via filters.