# Reports and exports page specification

Status: Governing target
Route: `/reports`
Last updated: 2026-07-18

## Purpose

Generate derived, review-ready artifacts from canonical records. This page does not create backups or collaboration packages; those belong to Settings/Review Exchange.

## Report families

- Site/Unit baseline completeness packet.
- Exposure scenario/assessment/determination packet.
- Monitoring plan/event/result/interpretation packet.
- Controls/actions/verification/reassessment status.
- Data-quality/gap report.
- Flat register CSV/JSON export for approved analysis.

## Controls

- Site/Unit/scenario/date/status/archive/superseded filters as appropriate.
- Format: printable HTML/PDF-ready, CSV, or report-schema JSON.
- Preview source count, data sensitivity, gaps, and source revisions.

## Rules

- Reports identify dataset/revision, generation time, scope/filters, and source record IDs/revisions.
- Reports are derived and do not change approval/determination state.
- Report JSON is explicitly non-importable by backup/exchange handlers.
- Archived/superseded inclusion is explicit.
- Generated files are downloaded to a user-selected/approved location; no automatic upload/email.

## Acceptance criteria

- Unit packet answers what is complete, missing, and next.
- Scenario packet distinguishes calculated comparisons from professional interpretation/determination.
- Outputs are accessible, printable, and reproducible from identified source revisions.
