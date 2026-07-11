# Record Identity Specification

## Purpose

Define the conventions for uniquely identifying records across OLUSO, including ID generation, metadata fields and naming patterns.  This spec operationalises the decisions in ADR‑0007.

## Identifier Strategy

* **Primary Key:** Each table uses a primary key column of type UUID (`id`).  UUIDs are generated on the client when new records are created, enabling offline usage without collisions.
* **Human‑Friendly Codes:** Many registers also have a short, unique `code` or `reference` field (e.g. “LOC‑001”, “F‑2026‑001”).  Codes make it easier for users to refer to records verbally or in reports.  Code generation strategies:
  * Locations: prefix “LOC‑” followed by a sequential number padded to three digits.
  * Processes: “PR‑”.
  * Hazards: “HZ‑”.
  * SEGs: “SEG‑”.
  * Findings: “F‑YYYY‑nnn” where `YYYY` is the year and `nnn` is a counter.
  * Corrective Actions: “CA‑YYYY‑nnn”.
  * Codes are generated within the persistence layer to avoid collisions and stored in the `code` or `reference` field.  Users may manually override codes but must maintain uniqueness.

## Metadata Fields

All tables (except pure join tables) include the following metadata columns:

* `created_at`: DATETIME — timestamp when the record was created.  Set once at creation.
* `updated_at`: DATETIME — timestamp when the record was last modified.  Updated automatically.
* `archived_at`: DATETIME (nullable) — set when the record is archived.  Null indicates the record is active.
* Optional `closed_at` and `verified_at` fields for tables that support closure/verification (e.g. corrective actions).

## Lifecycle Flags

* **Active vs Archived:** A record is considered active when `archived_at` is null.  Archived records remain in the database but are hidden from default views.  Users can restore an archived record by clearing `archived_at`.
* **Closed:** Applies to findings and corrective actions; indicated by `status` and optionally `closed_at`.  Closed records are read‑only but still visible.
* **Verified:** A sub‑state of closed, indicated by `status = 'Verified'` and `verified_at` timestamp.
* **Deleted:** Permanent deletion sets `deleted_at` (not currently implemented).  Deletion is rare and requires a separate confirmation workflow.

## Naming & Display

* UIs should display the human‑friendly code or reference in conjunction with the record name/title in page headers, tables and breadcrumbs (e.g. “Hazard HZ‑010: Flammable Liquid”).
* When codes are not available (e.g. draft records), display “New [Record Type]” until a code is assigned upon save.

## Synchronisation & Conflicts

Because OLUSO is local‑first, record IDs may be generated offline.  When sync features are introduced, conflict resolution must detect collisions (unlikely with UUIDs) and merge or reject duplicates.  Code generation must ensure uniqueness across sync boundaries.

## Acceptance Criteria

* Every persisted record has a stable UUID and metadata fields.
* Code generation functions ensure uniqueness and follow naming patterns.
* UIs display codes prominently and update them after saving new records.
* Archiving a record sets `archived_at` and hides it by default.