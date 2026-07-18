# Report and register export workflow

Status: Governing
Last updated: 2026-07-18

## Purpose

Generate human-review and analysis artifacts without confusing them with backups or exchange packages.

## Workflow

1. Select report/register type and Site/Unit/scenario scope.
2. Select filters, archived/superseded inclusion, and format.
3. Show estimated record count and data-sensitivity warning.
4. Generate from a consistent repository read.
5. Include export time, filters/scope, dataset ID/revision, and source record IDs/revisions.
6. Validate the artifact and trigger browser download.

## Formats

- CSV for flat analysis exports.
- JSON with an explicit non-importable report schema.
- Printable HTML/PDF-ready views for baseline/scenario/review packets.

## Rules

- Reports are derived and never become source records.
- Export does not change review/approval state.
- JSON report export is rejected by backup and exchange import handlers.
- Large exports use streamed/chunked generation where supported or fail with an actionable message; no Tauri events or email delivery assumptions.
- Generated packets identify gaps and limitations, not just conclusions.

## Acceptance criteria

- Export content matches selected scope and source revisions.
- Archived/superseded inclusion is explicit.
- Offline generation works for supported formats.
- Printable packets remain accessible and readable without interactive UI.
