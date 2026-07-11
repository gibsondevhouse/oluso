# Export Generation Workflow Specification

## Purpose

Define the workflow for generating data exports and reports.  Exports allow users to extract data from OLUSO for backup, analysis, compliance or sharing with external systems.

## High‑Level Flow

1. **Initiate Export:** User navigates to the Reports & Exports page and selects the type of export or report to generate, along with filters (e.g. date range) and format.
2. **Form Validation:** The system validates that required parameters (e.g. date range for certain reports) are provided and that the export directory is configured.
3. **Queue Export:** The export request is passed to the persistence layer.  The UI displays a progress indicator and disables the form while the export is running.
4. **Generate Data:** The persistence layer runs the appropriate queries to retrieve data, applies filters and formats it (CSV, JSON, PDF).  The generation happens in a worker thread to avoid blocking the UI.
5. **Write File:** Once data is generated, the persistence layer writes the file to the chosen directory.  If the directory is not accessible, the operation fails with an error.
6. **Record Metadata:** An entry is added to `export_metadata` with file name, type, filters used, and timestamp.  This allows users to review and re‑download exports later.
7. **Completion:** The UI notifies the user that the export is ready and offers a button to open the save location or directly download the file.
8. **Error Handling:** If the export fails at any step, the UI shows an error message and allows the user to retry.

## Report Types

* **Register Exports:** Export all records of a register with optional filters.  Columns correspond to table fields, formatted as CSV or JSON.
* **Composite Reports:** Predefined reports that combine data across registers (e.g. “Open Findings and Corrective Actions”).  These are formatted for human readability (e.g. PDF with tables and charts).  Implementation may use a reporting library.
* **Custom Queries:** (Future) Allow users to define their own exports via a query builder.  Out of scope for MVP.

## Filters

* **Date Range:** Applies to `created_at`, `updated_at` or domain‑specific dates (e.g. `reported_at`).
* **Status:** Include or exclude archived, closed, verified records.
* **Entity Filters:** Filter by location, process, hazard, SEG, etc.  The persistence layer must construct WHERE clauses accordingly.

## File Formats

* **CSV:** Comma‑separated values with UTF‑8 encoding.  Include a header row.  Escape commas and newlines in values.
* **JSON:** Array of objects.  Useful for import into other systems.
* **PDF:** For composite reports; generated via a PDF library.  Layout must follow the design guidelines (e.g. include report title, date, table formatting).

## Progress Reporting

* The persistence layer returns progress updates via Tauri events.  The UI listens and updates a progress bar or spinner.
* For long exports (> few seconds), show the percentage complete.  For short exports, show a simple “Generating…” message.

## Acceptance Criteria

* Users can generate exports selecting type, filters and format.  The system validates inputs.
* Export generation runs asynchronously without freezing the UI and reports progress.
* Generated files are written to the selected directory and recorded in metadata.  Users can re‑download from the history list.
* Errors (e.g. invalid directory, disk full) are surfaced with clear messages and allow retrying.