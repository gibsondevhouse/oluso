# Query Patterns Specification

## Purpose

Define standard SQL query patterns used across OLUSO registers, detail views and dashboards.  By documenting these patterns, developers can implement data access functions consistently and optimise queries for performance.

## Register Queries

Register pages need to list records with optional filters, sorting and pagination.  The typical pattern is:

```sql
SELECT *
FROM {{table}}
WHERE archived_at IS NULL
  AND {{filter conditions}}
ORDER BY {{sort column}} {{ASC|DESC}}
LIMIT :limit OFFSET :offset;
```

* **Filters** are applied dynamically based on the user’s selections (e.g. `name LIKE :searchTerm`, `status = :status`).
* **Sorting** defaults to a logical column (e.g. `updated_at DESC`).  Only one column is sorted at a time; additional sorts may be added later.
* **Pagination** uses `LIMIT` and `OFFSET`.  For large tables, consider cursor‑based pagination or keyset pagination.

## Detail Queries

Detail pages fetch a single record by ID along with its related entities.  Pattern:

```sql
SELECT *
FROM {{table}}
WHERE id = :id AND archived_at IS NULL;
```

Relationship queries:

* **One‑to‑many** — e.g. list processes for a location:

  ```sql
  SELECT *
  FROM processes
  WHERE location_id = :locationId AND archived_at IS NULL;
  ```

* **Many‑to‑many** — e.g. hazards for a SEG:

  ```sql
  SELECT h.*
  FROM hazards h
  JOIN seg_hazards sh ON h.id = sh.hazard_id
  WHERE sh.seg_id = :segId AND h.archived_at IS NULL;
  ```

## Dashboard Queries

Dashboard summary cards require aggregated counts.  Use `COUNT(*)` with appropriate filters:

```sql
SELECT COUNT(*) AS active_count
FROM findings
WHERE status != 'Archived';

SELECT COUNT(*) AS overdue_actions
FROM corrective_actions
WHERE status IN ('Open','In Progress')
  AND due_date < DATE('now');
```

Recent activity feeds may join multiple tables:

```sql
SELECT 'finding' AS type, id, title, updated_at AS timestamp
FROM findings
WHERE archived_at IS NULL

UNION ALL

SELECT 'action' AS type, id, title, updated_at AS timestamp
FROM corrective_actions
WHERE archived_at IS NULL

ORDER BY timestamp DESC
LIMIT 20;
```

## Search Patterns

Search across multiple columns using `LIKE` with wildcard `%`:

```sql
SELECT *
FROM locations
WHERE archived_at IS NULL
  AND (code LIKE '%' || :searchTerm || '%' OR name LIKE '%' || :searchTerm || '%' OR address LIKE '%' || :searchTerm || '%');
```

For more advanced search (e.g. fuzzy matching), consider using SQLite full‑text search (FTS5) in a future iteration.

## Derived Queries

Derived views or reports may require joining multiple tables and aggregating results.  Example: number of hazards per location:

```sql
SELECT l.id, l.name, COUNT(h.id) AS hazard_count
FROM locations l
LEFT JOIN hazards h ON h.associated_entity_type = 'location' AND h.associated_entity_id = l.id AND h.archived_at IS NULL
WHERE l.archived_at IS NULL
GROUP BY l.id, l.name
ORDER BY hazard_count DESC;
```

## Query Performance

* Create indexes on commonly filtered columns (e.g. `locations.code`, `processes.location_id`, `hazards.associated_entity_id`, `findings.status`, `corrective_actions.due_date`).
* Use `EXPLAIN QUERY PLAN` during development to identify slow queries.
* Avoid `SELECT *` in production code; specify columns explicitly once the UI requirements are stable.

## Acceptance Criteria

* Data access functions implement queries following these patterns.
* Queries include filters for `archived_at IS NULL` by default to exclude archived records.
* Aggregations and joins are performant for expected dataset sizes (hundreds to thousands of records).