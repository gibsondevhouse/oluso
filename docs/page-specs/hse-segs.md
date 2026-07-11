# HSE — SEGs Page Spec

## Purpose

Manage **Significant Environmental and Safety Aspects (SEGs)** — aggregated assessments of hazards across operations that warrant special attention.  SEGs help prioritise risk mitigation by grouping related hazards and their controls.

## Route

`/hse/segs`

Child routes:

* `/hse/segs/new` — create a new SEG.
* `/hse/segs/:segId` — view SEG details.
* `/hse/segs/:segId/edit` — edit a SEG.

## Sidebar Parent

“HSE” group → “SEGs” item.

## Domain Owner

HSE Domain.

## Data Source

`segs` table.  Each record includes:

* `id` (UUID)
* `code` (string) — unique identifier (e.g. “SEG‑002”).
* `name` (string) — descriptive name.
* `description` (text)
* `category` (string) — category of the aspect (e.g. Environmental, Safety, Health).
* `associated_hazard_ids` (array of UUID) — hazards contributing to this SEG.
* `risk_rating` (enum) — e.g. Low, Medium, High.
* `controls` (text) — overarching mitigation measures.
* `created_at`, `updated_at`, `archived_at`.

## Primary User Tasks

* View and search SEGs; filter by category, risk rating and status.
* Create new SEGs by grouping hazards and assigning a risk rating.
* Edit SEGs to add or remove hazards as risk assessments evolve.
* Archive SEGs that are no longer significant.
* Navigate to contributing hazards and related processes, chemicals and locations.

## Page Regions

### Register Page

* **Page Header** — “SEGs” with “New SEG” action.
* **Filters** — category select, risk rating select, search by code or name, status filter.
* **Register Table** — columns: Code, Name, Category, Risk Rating, Hazard Count, Status.
* **Empty/Loading/Error States** — as per component specs.

### Create/Edit Page

* Form fields: Code (auto‑generated or manual), Name (required), Category (select), Description (textarea), Risk Rating (select), Associated Hazards (multi‑select), Controls (textarea).
* Hazard multi‑select allows searching existing hazards and adding them to the SEG.  The number of selected hazards influences risk rating recommendations.
* Validation: Name and Category required; at least one hazard must be selected; Risk Rating required.
* Save persists and navigates to detail; cancel discards with unsaved changes check.

### Detail Page

* Overview: Code, Name, Category, Risk Rating, Hazard Count, Status, Created/Updated.
* Details: Description, Controls, list of contributing hazards with links to their detail pages.
* Relationship Panel: Locations, Processes and Chemicals affected by this SEG (derived via hazards and processes).  Field findings and corrective actions associated with this SEG also appear.
* Actions: Edit, Archive.

## States

Loading, empty, error, missing record — same patterns as other registers.

## Record Relationships

* SEGs group multiple hazards.  The relationship panel must list hazards and allow navigation to them.
* Through hazards, SEGs indirectly relate to chemicals, processes and locations.  These derived relationships may be displayed to help users see impact.
* Field findings referencing any hazard in the SEG should appear, along with corrective actions.

## Accessibility Expectations

* Multi‑select input for hazards must be searchable and keyboard accessible.  Each selected item can be removed via keyboard.
* Tables, forms and relationship lists follow general accessibility rules described in component specs.

## Acceptance Criteria

* Users can list, search and filter SEGs by category, risk rating and status.
* Creating and editing SEGs ensures required fields and hazard selections; risk rating influences may be suggested but not enforced.
* Detail pages display SEG information and list contributing hazards with links to details.
* Archived SEGs are hidden by default but accessible via filters.