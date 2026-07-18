# Testing strategy

Status: Governing target
Last updated: 2026-07-18

## Quality gate

```text
npm run verify
  ├─ formatting check
  ├─ lint
  ├─ Svelte/TypeScript check
  ├─ unit/component tests
  ├─ repository-contract tests
  ├─ migration matrix
  ├─ backup/exchange round-trip and security tests
  ├─ production build
  └─ end-to-end/accessibility tests
```

Until implemented, change reports list exact commands and unavailable checks. A component-test count is not a readiness claim.

## Test layers

### Domain unit tests

Location ancestry, chemical normalization, SEG membership, scenario promotion, assessment/determination relationships, unit/duration compatibility, comparison math, lifecycle, completeness rules, and exchange classification.

### Repository-contract tests

Run against the production IndexedDB adapter. Cover current state plus immutable revision writes, expected revision, transaction rollback, archived dependencies, indexed queries, idempotency, and semantic errors.

### Migration tests

Every supported browser/native source schema plus every target IndexedDB schema upgrade. Verify field mappings, counts, relationships, history, findings, rollback, retry, and representative real-data fixtures.

### Backup/exchange tests

Exact snapshot round-trip; two-installation divergent edits; same/different field conflicts; tombstones; dependencies; stale/out-of-order packages; duplicate import; review notes; atomic failure; rollback; dataset/schema mismatch; truncated/oversized/deep/duplicate-ID/hash-invalid inputs.

### End-to-end tests

- First load, offline reload, and PWA update compatibility.
- Unit baseline through scenario/assessment.
- Sampling result through interpretation/determination.
- Manager export/import/review/conflict/apply.
- Action completion/verification/reassessment.
- Backup/restore and failed-write recovery.

### Accessibility and print

Automated and manual keyboard/screen-reader checks for forms, hierarchy tree, data tables, diff/conflict resolution, status semantics, and review packets.

### Performance/reliability

Use realistic Site/Unit, record, sample, revision, and package counts. Test IndexedDB open/upgrade, query latency, large history, quota pressure, multiple-tab version changes, and interrupted update/import behavior.

## Highest-risk release gates

- No silent data loss or false save success.
- No unverified/partial migration.
- No package apply without preview/resolution.
- No partial exchange apply.
- Revision reconstruction works.
- Required relationships are not orphaned.
- Incompatible OEL comparison is never treated as valid.
- Professional determination is not generated from a numeric threshold alone.
- Backup recreates exact state.
- Supported browsers work offline after first load.
