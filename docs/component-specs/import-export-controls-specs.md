# Import & Export Controls Specification

This document describes the standardized import and export controls used on register pages in **Olùṣọ́**.  These controls enable bulk data interchange while ensuring user awareness of potential side effects.

## Overview

Import and export actions appear in the page header as a pair of buttons.  They open modals that guide the user through the process, validate files, and provide feedback.  The controls are consistent across registers (chemicals, hazards, processes, etc.).

## Export

- **Button Label**: “Export”.  Use an appropriate icon (e.g. arrow pointing out of a box).
- **Modal**: Clicking opens a modal with export options:
  - Format selection (`CSV`, `JSON`, `XLSX`).  CSV is the default.
  - Scope selection (`Current Page`, `All Records`, `Filtered Results`).  The current filters and search terms determine the filtered result set.
  - Confirmation summary (estimated record count and file size).
- **Action**: “Generate Export” triggers the repository to stream the file.  Show progress indicator; on completion, download begins automatically.
- **Notifications**: Success toast (“Export complete”) after the file downloads.  Errors produce an error toast with details.
- **Accessibility**: Modal trap focus; pressing `Esc` cancels.  Provide keyboard shortcuts for generating export (`Enter`) and cancelling (`Esc`).

## Import

- **Button Label**: “Import”.  Use an appropriate icon (e.g. arrow entering a box).
- **Modal**: Clicking opens a modal with:
  - File picker: Accept `.csv`, `.json`, `.xlsx`.  Show selected file name.  Validate extension before enabling “Next”.
  - Field mapping step: After upload, parse headers and allow users to map columns to entity fields.  Provide default mappings when column names match field names exactly.
  - Validation step: Show summary of parsed records, highlighting rows with errors.  Provide inline messages (e.g. “Invalid date format in row 5”).  Allow users to download a detailed error report.
  - Confirmation step: Show number of records to be imported, number of errors (if non‑blocking), and ask for final confirmation.
- **Action**: “Import Records” sends the validated data to the repository.  Display a progress bar.  Partial success is allowed; skipped rows must be reported.
- **Notifications**: Success toast with record counts (“Imported 47 records, 3 skipped”).  Errors show a toast with retry option and link to error report.
- **Safety**: Warn users if the import will update existing records (e.g. same UUID or natural key).  Allow a dry‑run preview without committing changes.
- **Accessibility**: All steps in the wizard must be navigable via keyboard and screen reader.  Provide clear instructions and error descriptions.

## Empty or Unsupported

If a register does not support import/export (e.g. real‑time telemetry feed), hide these controls entirely rather than disabling them.

## Edge Cases

- **Large Exports**: If the estimated file size exceeds a configured threshold (e.g., 50 MB), inform the user that export will be delivered via email or separate download link.
- **Concurrent Imports**: Prevent starting a new import while another is in progress.  Show a disabled state with tooltip (“Import in progress…”).
- **Versioning**: When schema changes occur, require import files to include a `schema_version` header.  Reject incompatible versions with an error message.

## Testing

- Verify file type restrictions and error messages.
- Test mapping UI with missing or extra columns.
- Test validation step with invalid data types, missing required fields, and duplicate IDs.
- Simulate interrupted network during export/import and ensure resumable or clear failure states.