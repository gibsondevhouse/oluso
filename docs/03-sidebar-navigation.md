# 03 — Sidebar navigation

Status: Governing target
Last updated: 2026-07-18

## Navigation objective

The sidebar should guide the user through baseline and occupational-health work while preserving direct access to canonical registers.

## Target structure

```text
Dashboard

Baseline
  Unit Baselines
  Data Gaps

Master Data
  Organizations & People
  Locations
  Processes & Tasks
  Equipment
  Chemicals & SDS
  Exposure Agents & Limits
  Controls

Industrial Hygiene
  SEGs & Memberships
  Exposure Scenarios
  Assessments
  Monitoring & Sampling
  Determinations
  Control Verification
  Reassessment

Assurance
  Observations & Inspections
  Findings & Incidents
  Corrective Actions

Review Exchange
  Import Package
  Export Package
  Conflicts
  Import History

Reports

Future Modules

Settings
```

## Rules

- `Baseline` is a guided workflow and the preferred entry point for plant characterization.
- `Master Data` contains reusable canonical records; it must not duplicate scenario-specific information.
- `Industrial Hygiene` follows the assessment spine and uses explicit typed entities.
- `Review Exchange` is separate from backup/restore and bulk baseline import.
- `Future Modules` is collapsed by default and clearly labeled as deferred/legacy.
- Detail, create, edit, history, and conflict-resolution routes do not receive primary sidebar items.
- Counts indicate actionable gaps, conflicts, due work, or reviews—not decorative totals.
- Navigation must work in an installed PWA and a normal supported browser tab.

## Migration from current navigation

The current broad HSE/campaign route set is implementation inventory. Routes may remain reachable during migration, but sidebar promotion does not imply target support.

Remove or relocate navigation in this order:

1. Place deferred campaign families under Future Modules.
2. Promote Baseline and Exposure Scenarios.
3. Reorganize chemical and location routes around normalized models.
4. Replace generic assessment, determination, and sampling pages with typed workflows.
5. Add Review Exchange once package dry-run and conflict handling are functional.
