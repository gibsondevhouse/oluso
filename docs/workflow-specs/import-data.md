# Bulk baseline import workflow

Status: Deferred until canonical master-data schemas exist
Last updated: 2026-07-18

## Purpose

Bulk import supports initial migration/cleansing of external baseline tables such as locations, people, equipment, inventory, or chemical use. It is not the two-installation review exchange workflow.

Review exchange is defined in [exchange-review.md](exchange-review.md).

## Workflow

1. Choose the specific target entity/template.
2. Select CSV/XLSX/JSON supported for that template.
3. Parse with file-size, row-count, depth, and field-length limits.
4. Preview rows and map columns to explicit typed fields.
5. Validate field values and canonical dependencies.
6. Classify rows as valid new, possible duplicate, invalid, missing dependency, or requires human mapping.
7. Show a dry-run with no mutation and downloadable error/mapping report.
8. Require an import reason and actor.
9. Apply an accepted batch transactionally or in explicitly documented atomic chunks.
10. Write normal record revisions with source `migration`/`bulk-import` and preserve the import run.

## Safety rules

- No generic “overwrite existing” checkbox.
- Existing target records are updated only through an explicit natural-key/ID match, expected-revision check, field diff, and user confirmation.
- Invalid rows never create partially valid safety-critical records.
- Import cannot create a professional determination, exposure comparison, or clinical record.
- Ambiguous legacy chemical/location/SEG records create mapping tasks or data-quality findings.
- A bulk import file is never accepted by the exchange handler merely because both use JSON.

## Acceptance criteria

- Dry-run and apply classifications match.
- Failed atomic batches leave target state unchanged.
- Every applied row is attributable and revisioned.
- Duplicate, missing-dependency, and ambiguous mappings are reviewable.
- Importing the same file does not silently duplicate records.
