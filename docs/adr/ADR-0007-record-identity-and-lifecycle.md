# ADR‑0007: Record Identity and Lifecycle

## Status

Proposed

## Context

OLUSO manages a variety of records: locations, processes, chemicals, hazards, SEGs, findings, corrective actions and others.  To support a consistent user experience and reliable data management we need to define how records are identified, timestamped, archived and deleted.  Without a standard convention, different modules may invent incompatible schemes which will undermine the persistence layer and user workflows.

## Decision

1. **Use UUID v4 for primary record identifiers.**  Each record will have a 128‑bit randomly generated identifier (`id`) that is globally unique.  This avoids collisions across registers and simplifies offline creation since IDs do not depend on a central generator.
2. **Store metadata fields on every record:**
   * `created_at` (ISO‑8601) — when the record was first persisted.
   * `updated_at` (ISO‑8601) — automatically updated whenever the record is modified.
   * `archived_at` (nullable ISO‑8601) — set when the record is archived.  A non‑null value indicates the record is no longer active but remains in the database.
   * `deleted_at` (nullable ISO‑8601) — rarely used; set when the record is permanently deleted (e.g. user explicitly requests deletion).  Most workflows should use archiving instead of deletion.
3. **Define lifecycle states.**  Each record can be in one of the following states:
   * `draft` — being created but not yet committed.  Only persisted in memory/local cache; not visible to other parts of the app.
   * `active` — the default state after creation.  The record is editable and participates in workflows.
   * `closed` — the record is complete and no longer editable (e.g. a corrective action that has been verified).  Closing should set `closed_at` and still keep the record active for reference.
   * `archived` — the record is hidden from normal lists but retained for reference.  Archiving sets `archived_at` and switches `state` to `archived`.  Archived records cannot be edited without restoring.
   * `deleted` — permanently removed.  Only allowed in exceptional cases (e.g. erroneous data entry).  Deletion sets `deleted_at` and removes the record from all queries except low‑level backups.
4. **Expose explicit API methods for lifecycle transitions.**  The persistence module will provide functions such as `archiveRecord(id)`, `restoreRecord(id)`, `deleteRecord(id)`, and `closeRecord(id)` that update the appropriate fields.  UI components must call these functions instead of manipulating raw timestamps.
5. **Do not recycle identifiers.**  Once a record ID is created it will never be reused, even if the record is deleted.  This ensures that relationships remain stable and avoids confusing historical references.

## Consequences

* Having uniform metadata fields across all tables simplifies querying and UI behavior.  Filters for “archived” vs “active” are consistent across modules.
* UUIDs enable offline creation without coordination.  However they are less human‑readable than incremental IDs.  UI components should display user‑friendly codes or names instead of IDs.
* Archiving vs deletion becomes a first‑class concept.  Most user actions should archive records rather than delete them to preserve history.
* Lifecycle transitions should trigger UI updates (e.g. status chips, available actions) and possibly business rules (e.g. a closed record cannot be edited).

## Related ADRs

* ADR‑0004: Persistence Stack — these metadata fields must be persisted.
* Workflow spec: `record‑lifecycle.md` — defines how lifecycle states affect user workflows.