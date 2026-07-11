# Actions — Corrective Actions Page Spec

## Purpose

Track corrective actions arising from field findings.  Corrective actions define tasks needed to address non‑conformities and assign responsibility and due dates.  Proper management ensures findings are resolved in a timely and verifiable manner.

## Route

`/actions/corrective-actions`

Child routes:

* `/actions/corrective-actions/new` — create a new corrective action.
* `/actions/corrective-actions/:actionId` — view a corrective action.
* `/actions/corrective-actions/:actionId/edit` — edit a corrective action.

## Sidebar Parent

“Actions” group → “Corrective Actions” item.

## Domain Owner

Actions Domain; closely linked to Field Findings Domain.

## Data Source

`corrective_actions` table.  Each record includes:

* `id` (UUID)
* `reference` (string) — unique action number (e.g. “CA‑2026‑001”).
* `finding_id` (UUID) — the field finding this action addresses.
* `title` (string)
* `description` (text)
* `responsible_party` (string) — person or role assigned.
* `due_date` (date)
* `status` (enum) — Open, In Progress, Closed, Verified.
* `created_at`, `updated_at`, `closed_at`, `verified_at`, `archived_at`.

## Primary User Tasks

* View all corrective actions and filter by status, responsible party, due date and related finding.
* Create a corrective action from a finding or directly via the page.
* Edit corrective actions to update status, description, responsible party or due date.
* Close and verify actions once completed.
* Navigate to the related finding.

## Page Regions

### Register Page

* **Page Header** — “Corrective Actions” with “New Action” button.
* **Filters** — search by reference or title; filter by status; filter by due date range; filter by responsible party; filter by related finding.
* **Register Table** — columns: Reference, Title, Status (status chip), Responsible Party, Due Date, Related Finding (link), Last Updated.
* **Empty/Loading/Error States** — per component specs.

### Create/Edit Page

* Form fields: Reference (auto‑generated), Title (required), Description (textarea), Finding (select from open findings), Responsible Party (text), Due Date (date picker), Status (select; defaults to Open).
* Validation: Title, Finding, Responsible Party and Due Date required.
* Save persists and navigates to detail; cancel discards with unsaved changes prompt.
* When editing, additional status transitions may be displayed: mark as Closed (requires comment), mark as Verified (requires verification comment and date).

### Detail Page

* Overview: Reference, Title, Status, Responsible Party, Due Date, Related Finding (link), Created/Updated.
* Details: Description, Comments/History timeline (status changes, verification notes).
* Relationship Panel: The related finding; other actions linked to the same finding; SEGs or hazards if relevant via the finding.
* Actions: Edit, Archive, Close (if open), Verify (if closed but not yet verified).

## States

Loading, empty, error, missing record as per other pages.

## Record Relationships

* Each corrective action belongs to one finding.  The detail page must link back to the finding detail page.
* Field findings may have multiple corrective actions; the finding detail page must list them.
* Corrective actions may indirectly link to hazards, chemicals, processes, locations and SEGs via the finding.

## Workflow Notes

The corrective action lifecycle is further defined in `workflow-specs/corrective-action-closure.md`.  This page spec must conform to that workflow — for example, a corrective action cannot be marked as Verified until it is Closed and a verification comment is provided.

## Accessibility Expectations

* Due date picker must be keyboard accessible and announce the selected date.
* Status change buttons must include accessible names describing the action (e.g. “Mark as Closed”).
* Comments and history timeline must be readable and navigable via screen reader.

## Acceptance Criteria

* Users can list, search and filter corrective actions by multiple criteria.
* Creating and editing actions enforces required fields, unsaved changes detection and proper status transitions.
* Detail pages show all action information and history, and provide appropriate status change actions.
* Closing and verifying actions follow the workflow rules defined elsewhere, including validation of required comments and dates.