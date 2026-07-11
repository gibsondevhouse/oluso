# Record Detail Layout Component Specs

## Purpose

Record detail pages display the full information about a single record, including its metadata, related data, and actionable controls.  The record detail layout component defines a standard arrangement of sections so that each register page can provide a consistent user experience while still customising its content.

## Layout Regions

The component divides the page into the following vertical sections:

1. **Header Area** — uses the shared page header component (`page-header-specs.md`) to display the record’s title, status, breadcrumbs, and actions (e.g. Edit, Archive).  The title usually combines a descriptive name and a code (e.g. “ACME Chemical — CH‑001”).
2. **Overview Section** — summarises key fields and metadata.  Often laid out in two columns with labels on the left and values on the right.  Fields include description, category, created/updated timestamps, owner, etc.
3. **Details Section** — displays richer information such as long text fields, attachments (when supported), maps, or charts.  Content is structured into subsections with headings.
4. **Relationships Panel** — shows links to related records (e.g. corrective actions related to a finding) in a sidebar or at the bottom.  See `relationship-panel-specs.md`.
5. **Activity & History Section (optional)** — lists timeline events such as creation, updates, state changes, and comments.  May be collapsed by default.

## Props / Data Contract

* `record: any` — the record object.  The component is agnostic about its shape; the consuming page maps fields to the appropriate regions.
* `status: StatusChipProps` — passed to the header to reflect lifecycle state.
* `breadcrumbs: BreadcrumbItem[]` — passed to the header.
* `onEdit: () => void` — callback invoked when the user clicks the Edit action.
* `onArchive: () => void` — callback invoked when the user clicks the Archive action.
* `overviewFields: FieldDef[]` — configuration describing which fields to display in the overview section and how to render them.  Each field defines `label`, `value`, optional `component` for custom rendering and `column` (left/right).
* `detailsSections: SectionDef[]` — array of sections for the details area.  Each section has `title` and `content` (React nodes).  The component renders sections sequentially.
* `relationships?: RelationshipDef[]` — list of relationships to display in the relationships panel.

## Interaction Rules

* The Edit and Archive actions appear in the header and invoke the provided callbacks.  If the record is archived, the Edit action is disabled.
* Collapsible sections may be used for the activity/history area or long detail subsections.  When collapsed, the section header remains visible and can be expanded via click or keyboard activation.
* Relationship cards or lists are interactive: clicking a related record navigates to its detail page.  See `relationship-panel-specs.md` for further rules.

## Accessibility Rules

* Headings use semantic `<h2>` or `<h3>` elements in descending order following the page title (`h1` in the header).
* The overview fields use definition lists (`<dl>` with `<dt>`/`<dd>`) or tables for improved screen reader comprehension.
* Collapsible sections indicate their state via `aria-expanded` and provide keyboard activation using `Enter`/`Space`.

## Empty & Error States

* If `record` is undefined (e.g. still loading), the parent page should render a loading state before mounting this component.
* If certain optional sections have no content (e.g. no relationships), the component hides the section or displays a “None” message instead of empty containers.

## Acceptance Criteria

* The component lays out record content in the prescribed regions and adapts to different amounts of information.
* Actions invoke the correct callbacks and respect lifecycle state (e.g. disabled for archived records).
* Headings and fields are semantic and accessible; tab order follows document structure.
* Relationship links navigate to the correct routes and update the router.