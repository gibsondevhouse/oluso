# Data Import Workflow Specification

This specification details the workflow for importing bulk data into **Olùṣọ́** registers.  The import workflow supports one‑time migrations and regular updates from external systems while enforcing data integrity and validation.

## Scope

Imports apply to individual registers (e.g., chemicals, hazards, processes) and must be initiated from the corresponding page’s header.  Each register defines a mapping between column names and entity fields.  The workflow accommodates CSV, JSON, and XLSX formats.

## Steps

1. **File Selection**
   - User clicks the “Import” button.  A modal appears with a file picker.  Accept `.csv`, `.json`, and `.xlsx` formats.
   - Validate file extension immediately.  If invalid, disable the “Next” button and show an inline error.
   - After selecting a file, display its name and size.  Automatically detect delimiter for CSV (comma, semicolon, tab).

2. **Preview & Mapping**
   - Parse the first row to infer column headers.  Display a preview table showing the first five rows.
   - For each column, provide a dropdown to map it to an entity field.  Required fields are indicated with a red asterisk.  Offer automatic matching when header names match field names exactly.
   - Allow the user to set default values for missing optional fields.
   - If a column is unmapped and not optional, highlight the issue and prevent proceeding.

3. **Validation**
   - After mapping, validate each row against field data types and constraints (e.g., numeric values, date formats, required fields).  Validate foreign keys by checking existence in the database.
   - Show a summary: total rows, valid rows, rows with errors.  Provide a detailed error log with row numbers and error messages.  Allow downloading the error log as a CSV.
   - Users can choose to proceed with valid rows only or abort and correct the file.

4. **Confirmation**
   - Present a confirmation step summarizing the number of rows to import, number of rows skipped, and the affected register.  Provide an optional import description (e.g., “Q3 chemical inventory update”).
   - Show a checkbox to overwrite existing records when a unique identifier matches.  Default is off (skip duplicates).
   - Display a warning that imported data cannot be undone except via a restore operation.

5. **Execution**
   - On confirmation, send the validated data to the repository.  Show a progress bar with processed/total row count and estimated time remaining.
   - Do not block the UI; allow the user to navigate away.  Provide a link to a status page if the import may take more than 30 seconds.
   - On completion, show a toast summarizing inserted and updated records and any rows skipped.

## Constraints

- Maximum rows per import: 10,000.  Larger datasets must be split or imported via a direct database script.
- Date and time values must be ISO 8601 or localized formats recognized by the parser.  Reject ambiguous formats (e.g., `01/02/03`).
- Numeric values use a dot (`.`) as the decimal separator.  Commas are not allowed as decimal separators in CSV.
- User must have `import` permission for the target register.  Deny access otherwise.

## Error Handling

- **Invalid File**: Show an inline error if the file is corrupt or cannot be parsed.
- **Missing Required Fields**: Highlight missing mappings and prevent progress.
- **Foreign Key Violations**: Report missing references (e.g. unknown hazard ID) in the validation step; allow skipping rows or aborting.
- **Duplicate Entries**: If overwrite is disabled, skip duplicates and report them.  If enabled, update existing records.

## Testing

- Test imports for each register with valid data; verify that records are created correctly.
- Test mapping UI with mismatched headers and confirm that manual mapping works.
- Test validation with various data errors: missing required fields, invalid formats, foreign key errors.
- Test overwrite functionality by importing a file containing existing IDs and verifying that records are updated when the option is checked.