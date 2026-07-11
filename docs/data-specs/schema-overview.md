# Schema Overview

## Purpose

Provide a high‑level description of the database schema used by OLUSO.  This overview helps developers and product owners understand the entities, their fields and relationships before diving into detailed migrations.

## Tables and Fields

### `locations`

| Field          | Type      | Notes                                  |
|---------------|----------|----------------------------------------|
| id            | UUID      | Primary key.                           |
| code          | TEXT      | Unique short code.                     |
| name          | TEXT      | Location name.                         |
| description   | TEXT      | Longer description.                    |
| address       | TEXT      | Physical address or region.            |
| manager       | TEXT      | Person responsible.                    |
| created_at    | DATETIME  | See ADR‑0007.                          |
| updated_at    | DATETIME  | Updated on modification.               |
| archived_at   | DATETIME  | Null when active.                      |

### `processes`

| Field          | Type      | Notes                                  |
|---------------|----------|----------------------------------------|
| id            | UUID      | Primary key.                           |
| code          | TEXT      | Unique code.                           |
| name          | TEXT      | Process name.                          |
| description   | TEXT      | Description of the process.            |
| location_id   | UUID      | Foreign key → locations(id).           |
| owner         | TEXT      | Responsible person.                    |
| procedure_doc | TEXT      | URL or path to procedure document.     |
| created_at    | DATETIME  | As above.                              |
| updated_at    | DATETIME  |                                      |
| archived_at   | DATETIME  |                                      |

### `chemicals`

| Field               | Type     | Notes                                        |
|---------------------|---------|----------------------------------------------|
| id                  | UUID     | Primary key.                                 |
| cas_number          | TEXT     | Unique CAS number.                           |
| name                | TEXT     | Common name.                                 |
| synonyms            | TEXT     | Comma‑separated synonyms.                    |
| hazard_class        | TEXT     | Classification (flammable, corrosive, etc.). |
| storage_requirements| TEXT     | Storage guidelines.                          |
| sds_link            | TEXT     | URL or path to Safety Data Sheet.           |
| created_at          | DATETIME |                                             |
| updated_at          | DATETIME |                                             |
| archived_at         | DATETIME |                                             |

### `hazards`

| Field                   | Type     | Notes                                        |
|-------------------------|---------|----------------------------------------------|
| id                      | UUID     | Primary key.                                 |
| code                    | TEXT     | Unique identifier (e.g. HZ‑xxx).             |
| title                   | TEXT     | Hazard name.                                 |
| description             | TEXT     | Detailed description.                        |
| hazard_type             | TEXT     | Category (chemical, physical, etc.).         |
| severity                | TEXT     | Severity enum.                               |
| likelihood             | TEXT     | Likelihood enum.                             |
| controls                | TEXT     | Recommended controls.                        |
| associated_entity_type  | TEXT     | One of: location, process, chemical, SEG.    |
| associated_entity_id    | UUID     | Foreign key to corresponding table.          |
| created_at              | DATETIME |                                             |
| updated_at              | DATETIME |                                             |
| archived_at             | DATETIME |                                             |

### `segs`

| Field                | Type     | Notes                                        |
|----------------------|---------|----------------------------------------------|
| id                   | UUID     | Primary key.                                 |
| code                 | TEXT     | Unique identifier (e.g. SEG‑xxx).           |
| name                 | TEXT     | Name.                                        |
| description          | TEXT     | Detailed description.                        |
| category             | TEXT     | Category (Environmental, Safety, etc.).      |
| risk_rating          | TEXT     | Risk rating enum.                            |
| controls             | TEXT     | Mitigation measures.                         |
| created_at           | DATETIME |                                             |
| updated_at           | DATETIME |                                             |
| archived_at          | DATETIME |                                             |

### `seg_hazards`

Many‑to‑many relationship between SEGs and hazards.

| Field     | Type | Notes                       |
|-----------|-----|------------------------------|
| seg_id    | UUID | Foreign key → segs(id).     |
| hazard_id | UUID | Foreign key → hazards(id).  |

### `findings`

| Field            | Type     | Notes                                             |
|------------------|---------|---------------------------------------------------|
| id               | UUID     | Primary key.                                      |
| reference        | TEXT     | Unique reference number.                          |
| title            | TEXT     | Summary.                                         |
| description      | TEXT     | Details.                                         |
| finding_type     | TEXT     | Enum: Positive, Minor, Major.                    |
| location_id      | UUID     | Location where observed.                          |
| process_id       | UUID     | Related process (optional).                       |
| chemical_id      | UUID     | Related chemical (optional).                      |
| hazard_id        | UUID     | Related hazard (optional).                        |
| reported_by      | TEXT     | Reporter name.                                   |
| reported_at      | DATETIME | Date/time reported.                              |
| status           | TEXT     | Enum: Open, In Progress, Closed, Verified.       |
| created_at       | DATETIME |                                                 |
| updated_at       | DATETIME |                                                 |
| archived_at      | DATETIME |                                                 |

### `corrective_actions`

| Field             | Type     | Notes                                                      |
|-------------------|---------|-----------------------------------------------------------|
| id                | UUID     | Primary key.                                               |
| reference         | TEXT     | Unique action number.                                      |
| finding_id        | UUID     | Foreign key → findings(id).                                |
| title             | TEXT     | Action title.                                              |
| description       | TEXT     | Action details.                                            |
| responsible_party | TEXT     | Assigned person or role.                                   |
| due_date          | DATE     | Due date.                                                  |
| status            | TEXT     | Enum: Open, In Progress, Closed, Verified.                |
| created_at        | DATETIME |                                                           |
| updated_at        | DATETIME |                                                           |
| closed_at         | DATETIME | When marked closed.                                        |
| verified_at       | DATETIME | When verified.                                             |
| archived_at       | DATETIME | When archived.                                             |

### `export_metadata`

| Field         | Type     | Notes                                        |
|--------------|---------|----------------------------------------------|
| id           | UUID     | Primary key.                                 |
| file_name    | TEXT     | Name of exported file.                       |
| type         | TEXT     | Register or report type.                    |
| filters      | TEXT     | JSON string of filters used.                |
| created_at   | DATETIME | When export was generated.                  |
| file_path    | TEXT     | Location on disk.                           |

## Relationships Summary

* Locations → Processes: one‑to‑many (`processes.location_id`).
* Hazards associate with one entity (location/process/chemical/SEG) via `associated_entity_type` and `associated_entity_id`.
* SEGs ↔ Hazards: many‑to‑many via `seg_hazards`.
* Findings ↔ Locations, Processes, Chemicals, Hazards: optional foreign keys linking the finding context.
* Findings ↔ Corrective Actions: one‑to‑many (`corrective_actions.finding_id`).

## Indexes & Constraints

* Unique indexes on `code` fields (`locations.code`, `processes.code`, `hazards.code`, `segs.code`), `cas_number` for chemicals, `reference` for findings and corrective actions.
* Foreign key constraints enforce referential integrity.  On delete, set foreign keys to `NULL` or restrict depending on business rules.

## Evolution

This overview provides the initial schema.  Future versions may add tables (e.g. attachments) or fields (e.g. audit trail) as the product evolves.  All changes must be captured in migrations and documented here.