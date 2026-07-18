# Repository query patterns

Status: Governing target
Last updated: 2026-07-18

## Principles

- Queries run through typed repositories over IndexedDB.
- Entity stores hold current state; immutable history is queried separately.
- Filters and indexes use canonical IDs/controlled values, not denormalized free text where a relationship exists.
- Archived/superseded inclusion is explicit.
- Derived dashboard/report/search projections are rebuildable and never authoritative.

## Register queries

Repositories accept typed filters, search, deterministic multi-column sort, page size, cursor, and `includeArchived`. Default page size is bounded.

Use cursor/keyset pagination for large revision/sample stores. Offset pagination is acceptable only when its performance and stability are tested at realistic counts.

## Hierarchy queries

Location operations support immediate children, ancestors, descendants, and resolved Site. Cycle validation uses the same canonical ancestry rules as writes. A cached ancestry projection includes source revision metadata and is rebuilt on reparent.

## Effective-date queries

SEG membership and other effective records query using interval overlap:

```text
record.start <= requestedEnd
and (record.end is empty or record.end >= requestedStart)
```

Boundary inclusivity is consistent and tested.

## Exposure queries

Scenarios query by Site/Unit, SEG, process, task, agent, operating condition, status, review, and data quality.

Assessments/determinations query current and superseded records separately. Sampling queries preserve the Plan → Event → Sample → Result chain rather than returning a flattened mutable exposure row.

## History queries

Record history is ordered by revision, not timestamp alone. Package/import history supports package ID, source installation, imported record, import run, and resolution lookups.

## Completeness queries

Completeness is computed for a Site/Unit using a versioned rule set. The result includes evaluated source revisions, numerator/denominator, missing requirements, and remediation links.

## Search

Start with indexed exact/prefix/token queries appropriate to each domain. A browser-side search projection may be introduced for broader search, but it must be rebuildable from canonical records and respect archive/security rules.

## Performance tests

Query tests use realistic location depth, site/unit counts, scenario/sample volume, history depth, and package size. Index changes include migration and repository-contract coverage.
