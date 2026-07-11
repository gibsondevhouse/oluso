# Reports & Exports Page Spec

## Purpose

Allow users to generate, download and manage exports of OLUSO data (e.g. CSV, PDF) and access pre‑defined reports.  Reports summarise data across registers and support compliance, auditing and business insights.  Exports provide a way to back up or share data outside the application.

## Route

`/reports/exports`

Child routes may include specific report pages (e.g. `/reports/exports/:reportId`) if separate report detail views are required.  For MVP, a single page suffices.

## Sidebar Parent

“Reports” group → “Exports” item.

## Domain Owner

Reporting Domain; spans multiple registers.

## Data Source

Exports are generated on demand from the local persistence layer.  Reports may use derived queries that aggregate data across tables.  No additional tables are needed for MVP, but an `export_metadata` table may record past exports (file name, type, generated_at, range).

## Primary User Tasks

* Generate a new export for a chosen register or report type.
* Select date ranges or filters for exports (e.g. only active findings from last quarter).
* Download generated files to the local file system.
* View a history of previous exports with metadata and re‑download if available.

## Page Regions

1. **Page Header** — “Reports & Exports” with description.
2. **Export Form** — section where the user chooses what to export:
   * **Export Type** — dropdown (e.g. Locations, Processes, Chemicals, Hazards, SEGs, Findings, Corrective Actions, Composite Reports).
   * **Date Range** — start and end dates (optional).  For some exports this might limit by `created_at` or `updated_at`.
   * **Filters** — additional filters relevant to the chosen type (e.g. status, location).
   * **Format** — file format (e.g. CSV, JSON).  For reports, format may be fixed (e.g. PDF).
   * **Generate Button** — triggers export generation.
3. **Export History Table** — lists past exports with columns: File Name, Type, Date Generated, Filters Used, Size, Actions (Download, Delete).
4. **Loading/Error States** — while generating or retrieving exports.

## Behaviour

* When the user clicks **Generate**, validate the form and start the export process.  Display a loading indicator until the file is ready.  Once complete, prompt the user to save the file via a native file save dialog.
* Save a metadata entry for each export in `export_metadata` so the history table persists across sessions.
* Clicking **Download** on a past export retrieves the file from disk and triggers a file save dialog.
* Clicking **Delete** removes the metadata and optionally the file from the export directory (with confirmation).

## States

* **Idle** — no export is being generated.  The form is enabled.
* **Generating** — export generation is in progress.  Disable the form and show a spinner.  Provide a cancel option if possible.
* **Error** — if generation fails (e.g. disk full), show an error banner with details and allow retry.
* **Empty History** — if no exports exist yet, display an empty state encouraging the user to generate the first export.

## Record Relationships

Not applicable; this page interacts with multiple registers but does not display relationships.

## Accessibility Expectations

* Forms must be fully keyboard navigable; date pickers must be accessible.
* Buttons for generate/download/delete have clear labels and announce progress to screen readers.
* The export history table uses semantic markup and indicates when an export is selected for download.

## Acceptance Criteria

* Users can generate exports for each register with optional date ranges and filters.  Files are saved to the user’s chosen location.
* Export history persists across sessions and allows downloading or deleting past exports.
* Errors during export generation or download are communicated clearly with retry options.
* The page meets accessibility requirements and supports keyboard navigation.