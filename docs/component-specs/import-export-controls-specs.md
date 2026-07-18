# Backup, exchange, import, and export controls

Status: Governing interaction contract
Last updated: 2026-07-18

## Do not use a generic Import/Export pair

The application exposes distinct controls because their risk and semantics differ:

- `Create backup` / `Restore backup`.
- `Export review package` / `Review imported package`.
- `Import baseline data`.
- `Export report` / `Export CSV`.

Each control accepts only its versioned artifact type.

## Exchange controls

- Package metadata appears before record content.
- File selection leads to `Validate package`, never directly to apply.
- Validation displays dataset, source installation, exporter, schema, base revision, counts, and integrity outcome.
- Dry-run summary displays every classification.
- Record detail displays base/local/external differences.
- Apply is disabled until blocking conflicts, dependencies, schema errors, and deletion decisions are resolved.
- Final confirmation identifies rollback artifact and resulting dataset revision.

## Backup controls

- Show last verified backup and changes since it.
- Explain browser download/destination limitations.
- Restore requires validated preview and current-state safety backup.

## Bulk baseline import controls

- Require an explicit target typed template.
- Provide mapping, validation, duplicate/dependency classification, dry-run, and error report.
- Do not provide an unqualified overwrite checkbox.

## Report export controls

- Select scope/filters/format.
- State that the artifact is non-importable and derived.
- Include source revision metadata for review packets.

## Accessibility

- Wizards expose current step and validation summary semantically.
- File errors and classification counts are announced.
- Conflict comparison is keyboard navigable and does not rely on color alone.
- Final destructive/replacement actions require explicit labeled confirmation.

## Testing

- Cross-artifact rejection.
- Keyboard/screen-reader operation.
- Cancel/retry at every stage.
- Invalid, oversized, stale, and dependency-failing inputs.
- No mutation before confirmed apply/restore.
