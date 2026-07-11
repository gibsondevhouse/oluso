# HSE — Chemicals Page Spec

## Purpose

Manage the catalogue of chemicals used within the organisation.  Track their properties, hazards, storage requirements and regulatory classifications.  Provide a central list for compliance and risk assessments.

## Route

`/hse/chemicals`

Child routes:

* `/hse/chemicals/new` — create a new chemical entry.
* `/hse/chemicals/:chemicalId` — view chemical details.
* `/hse/chemicals/:chemicalId/edit` — edit a chemical entry.

## Sidebar Parent

“HSE” group → “Chemicals” item.

## Domain Owner

Health, Safety & Environment (HSE) Domain.

## Data Source

`chemicals` table.  Each record includes:

* `id` (UUID)
* `cas_number` (string) — Chemical Abstracts Service number.
* `name` (string) — common name.
* `synonyms` (string) — other names separated by commas.
* `hazard_class` (string) — classification (e.g. flammable, corrosive).
* `storage_requirements` (text)
* `created_at`, `updated_at`, `archived_at`
* Additional fields: regulatory references, SDS link.

## Primary User Tasks

* View a searchable list of chemicals, filter by hazard class.
* Add a new chemical with CAS number and hazard information.
* Edit chemical details when classifications change.
* Archive chemicals no longer used.
* Link chemicals to SEGs and Hazards registers for risk assessments.

## Page Regions

### Register Page

* **Page Header** — “Chemicals” with “New Chemical” action.
* **Search & Filters** — search by name or CAS number; filter by hazard class; filter by status.
* **Register Table** — columns: CAS Number, Name, Hazard Class, Status, Last Updated.
* **Empty/Loading/Error States** — per component specs.

### Create/Edit Page

* Form fields: CAS Number (text, required, unique), Name (text, required), Synonyms (tags input), Hazard Class (select from standard list), Storage Requirements (textarea), SDS Link (url), Additional Notes.
* Validation: CAS number must be valid format; name required; hazard class required.
* Save persists and navigates to detail; cancel discards with prompt if dirty.

### Detail Page

* Overview: CAS Number, Name, Hazard Class, Status, Created/Updated.
* Details: Synonyms list, Storage Requirements text, Links to SDS or regulatory documents.
* Relationship Panel: Hazards (hazards associated with this chemical), SEGs, Field Findings (observations involving the chemical), Corrective Actions.
* Actions: Edit, Archive.

## States

As above: loading, empty, error, missing record.

## Record Relationships

* Chemicals may be associated with hazard entries (hazards describe specific risks when used).  The relationship panel lists hazards referencing this chemical.
* Chemicals may be linked to SEGs (Significant Environmental/GHS aspects) to support segmentation and reporting.
* Field findings referencing this chemical must appear under findings.
* Corrective actions addressing findings with this chemical may appear.

## Accessibility Expectations

* Forms must label inputs clearly and provide guidance on format (e.g. CAS number pattern).  Use ARIA live regions for validation feedback.
* Table and filters are keyboard accessible.
* External links (SDS, regulatory docs) open in a new tab or viewer and include `aria-label` to indicate they are external.

## Acceptance Criteria

* Users can search and filter chemicals by name, CAS number, hazard class and status.
* Creating and editing chemicals enforces required fields and unique CAS numbers.
* Detail pages display all information and relationships to hazards, SEGs and findings.
* Archived chemicals are hidden by default but accessible via filters.