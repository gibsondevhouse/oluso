# HSE — Hazards Page Spec

## Purpose

Record and manage hazards associated with chemicals, processes, locations and other operational elements.  Hazards describe potential risks (e.g. flammability, toxic fumes) and link to mitigation measures.  Accurate hazard tracking supports risk assessments and compliance.

## Route

`/hse/hazards`

Child routes:

* `/hse/hazards/new` — create a new hazard.
* `/hse/hazards/:hazardId` — view hazard details.
* `/hse/hazards/:hazardId/edit` — edit an existing hazard.

## Sidebar Parent

“HSE” group → “Hazards” item.

## Domain Owner

HSE Domain.

## Data Source

`hazards` table.  Each record includes:

* `id` (UUID)
* `code` (string) — short identifier (e.g. “HZ‑001”).
* `title` (string) — name of the hazard.
* `description` (text) — detailed description of the risk.
* `hazard_type` (string) — category (chemical, physical, biological, ergonomic, etc.).
* `severity` (enum) — e.g. Low, Medium, High.
* `likelihood` (enum) — e.g. Rare, Possible, Likely.
* `controls` (text) — recommended mitigation measures.
* `associated_entity_type` (string) — entity type this hazard relates to (chemical, process, location, SEG).
* `associated_entity_id` (UUID) — foreign key.
* `created_at`, `updated_at`, `archived_at`.

## Primary User Tasks

* View and search hazards; filter by type, severity, likelihood, associated entity.
* Create new hazards with all required fields.
* Edit existing hazards, updating severity or controls as needed.
* Archive hazards that are no longer relevant.
* Navigate to associated chemicals, processes, locations or SEGs.

## Page Regions

### Register Page

* **Page Header** — “Hazards” with “New Hazard” action.
* **Filters** — hazard type select, severity select, likelihood select, associated entity filter.
* **Register Table** — columns: Code, Title, Type, Severity, Likelihood, Associated Entity, Status.
* **Empty/Loading/Error States** — as per component specs.

### Create/Edit Page

* Form fields: Code (auto‑generated or manual), Title (required), Description, Hazard Type (select), Severity (select), Likelihood (select), Controls (textarea), Associated Entity Type (select), Associated Entity (select based on type).
* Validation: Title required; Hazard Type required; Associated Entity required when type is selected; Severity and Likelihood required.
* Save persists and navigates to detail; cancel discards (with dirty check).

### Detail Page

* Overview: Code, Title, Type, Severity, Likelihood, Associated Entity (as link), Status.
* Details: Description and Controls with proper formatting.
* Relationship Panel: Chemicals (if hazard relates to a chemical), Processes, Locations, SEGs, Field Findings, Corrective Actions.
* Actions: Edit, Archive.

## States

Loading, empty, error, missing record — same patterns as other registers.

## Record Relationships

* Each hazard is associated with exactly one entity (chemical, process, location or SEG).  The detail page must provide a link back to that entity.
* Hazards may be linked to multiple SEGs if the hazard contributes to a significant environmental aspect.  This linking is represented in the relationship panel.
* Field findings that involve the hazard should be listed, along with any corrective actions.

## Accessibility Expectations

* Use descriptive labels for severity/likelihood selects and ensure they are accessible via keyboard.
* In the details page, ensure long descriptions are readable and can be expanded/collapsed if very long.
* The associated entity select must update accessible descriptions when the entity type changes.

## Acceptance Criteria

* Users can list, search and filter hazards across all categories.
* Creating and editing hazards enforces required fields, correctly associates entities and prevents data loss on navigation.
* Detail pages show all hazard information and provide navigation to associated records.
* Archived hazards are hidden by default but accessible via filter.