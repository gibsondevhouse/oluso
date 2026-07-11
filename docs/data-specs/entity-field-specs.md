# Entity Field Specifications

This document defines the data contract for each domain entity used in **Olùṣọ́**.  Each record extends a base model that provides audit metadata (`created_at`, `updated_at`, `archived_at`, `created_by`, `modified_by`) and a UUID primary key (`id`).  Soft deletion is achieved by populating `archived_at`; records must never be physically removed unless explicitly requested via the repository layer.

## Location

| Field         | Type      | Required | Description                                                                 |
|---------------|-----------|----------|-----------------------------------------------------------------------------|
| id            | uuid      | yes      | Primary key for the location.                                               |
| name          | string    | yes      | Human‑friendly name for the site, building or area.                         |
| description   | string    | no       | Detailed description of the location’s purpose.                             |
| parent_id     | uuid      | no       | Optional parent location identifier for nested hierarchies.                 |
| address       | string    | no       | Free‑form address or geographic coordinates.                               |
| created_at    | datetime  | yes      | Timestamp when the record was created.                                      |
| updated_at    | datetime  | yes      | Timestamp of the last update.                                               |
| archived_at   | datetime  | no       | Timestamp when the location was archived (soft delete).                    |
| created_by    | uuid      | yes      | User ID of the creator.                                                     |
| modified_by   | uuid      | yes      | User ID of the last modifier.                                               |

## Process

Represents a manufacturing or formulation process occurring at a location.

| Field         | Type      | Required | Description                                           |
|---------------|-----------|----------|-------------------------------------------------------|
| id            | uuid      | yes      | Primary key.                                          |
| name          | string    | yes      | Process title.                                        |
| description   | string    | no       | Summary of the process.                               |
| location_id   | uuid      | yes      | Foreign key referencing the parent location.          |
| hazard_ids    | uuid[]    | no       | List of associated hazard identifiers.                |
| created_at    | datetime  | yes      | Creation timestamp.                                   |
| updated_at    | datetime  | yes      | Last modification timestamp.                          |
| archived_at   | datetime  | no       | Soft deletion timestamp.                              |
| created_by    | uuid      | yes      | Creator ID.                                           |
| modified_by   | uuid      | yes      | Last modifier ID.                                     |

## Chemical

Inventory record for a chemical substance.

| Field          | Type      | Required | Description                                                         |
|----------------|-----------|----------|---------------------------------------------------------------------|
| id             | uuid      | yes      | Primary key.                                                        |
| name           | string    | yes      | Commercial or common name.                                          |
| cas_number     | string    | yes      | CAS registry number.                                                |
| category       | string    | no       | Class or category (e.g. pesticide, solvent).                        |
| quantity       | decimal   | yes      | Amount on hand.                                                     |
| unit           | string    | yes      | Measurement unit (kg, L, etc.).                                     |
| storage_id     | uuid      | no       | Reference to location or container where stored.                    |
| hazard_ids     | uuid[]    | no       | Hazards associated with this chemical.                              |
| created_at     | datetime  | yes      | Creation timestamp.                                                |
| updated_at     | datetime  | yes      | Last update timestamp.                                             |
| archived_at    | datetime  | no       | Soft deletion timestamp.                                            |
| created_by     | uuid      | yes      | Creator ID.                                                         |
| modified_by    | uuid      | yes      | Last modifier ID.                                                   |

## Hazard

Represents a specific hazard (chemical, physical, ergonomic, etc.).

| Field         | Type      | Required | Description                                                              |
|---------------|-----------|----------|--------------------------------------------------------------------------|
| id            | uuid      | yes      | Primary key.                                                             |
| name          | string    | yes      | Hazard name.                                                             |
| description   | string    | no       | Detailed description.                                                    |
| hazard_type   | string    | yes      | Classification (chemical, physical, biological, ergonomic, etc.).        |
| process_id    | uuid      | no       | Foreign key referencing the associated process.                         |
| chemical_ids  | uuid[]    | no       | Chemicals contributing to the hazard.                                   |
| control_ids   | uuid[]    | no       | Controls implemented to mitigate this hazard.                           |
| seg_ids       | uuid[]    | no       | Associated Similar Exposure Groups.                                      |
| risk_score    | float     | no       | Calculated risk rating for prioritization.                               |
| created_at    | datetime  | yes      | Creation timestamp.                                                     |
| updated_at    | datetime  | yes      | Last modification timestamp.                                            |
| archived_at   | datetime  | no       | Soft deletion timestamp.                                               |
| created_by    | uuid      | yes      | Creator ID.                                                            |
| modified_by   | uuid      | yes      | Last modifier ID.                                                      |

## Similar Exposure Group (SEG)

Groups of workers with similar tasks and exposure profiles.

| Field         | Type     | Required | Description                                         |
|---------------|----------|----------|-----------------------------------------------------|
| id            | uuid     | yes      | Primary key.                                        |
| name          | string   | yes      | Group name.                                         |
| description   | string   | no       | Group description.                                  |
| process_ids   | uuid[]   | no       | Associated process identifiers.                     |
| hazard_ids    | uuid[]   | no       | Associated hazards.                                 |
| notes         | string   | no       | Free‑form notes about the SEG.                      |
| created_at    | datetime | yes      | Creation timestamp.                                 |
| updated_at    | datetime | yes      | Last modification timestamp.                        |
| archived_at   | datetime | no       | Soft deletion timestamp.                            |
| created_by    | uuid     | yes      | Creator ID.                                         |
| modified_by   | uuid     | yes      | Last modifier ID.                                   |

## Exposure

Measurement of worker exposure to a hazard within a SEG.

| Field         | Type     | Required | Description                                                            |
|---------------|----------|----------|------------------------------------------------------------------------|
| id            | uuid     | yes      | Primary key.                                                           |
| seg_id        | uuid     | yes      | Foreign key to the SEG being monitored.                               |
| hazard_id     | uuid     | yes      | Foreign key to the hazard measured.                                   |
| measurement   | float    | yes      | Numeric result of the exposure sample.                                |
| unit          | string   | yes      | Unit of measure (e.g. mg/m³, ppm).                                     |
| sampled_at    | datetime | yes      | Timestamp when sample was collected.                                   |
| comment       | string   | no       | Additional context or observations.                                    |
| created_at    | datetime | yes      | Creation timestamp.                                                   |
| updated_at    | datetime | yes      | Last modification timestamp.                                          |
| archived_at   | datetime | no       | Soft deletion timestamp.                                             |
| created_by    | uuid     | yes      | Creator ID.                                                           |
| modified_by   | uuid     | yes      | Last modifier ID.                                                     |

## Control

Controls used to mitigate hazards.  Each control is linked to a hazard and classified by type.

| Field        | Type     | Required | Description                                                        |
|--------------|----------|----------|--------------------------------------------------------------------|
| id           | uuid     | yes      | Primary key.                                                       |
| hazard_id    | uuid     | yes      | Associated hazard.                                                |
| control_type | string   | yes      | Type of control (`engineering`, `administrative`, `PPE`, `other`). |
| description  | string   | no       | Detailed description of the control.                              |
| effectiveness| string   | no       | Qualitative assessment (high, medium, low) or numeric rating.      |
| created_at   | datetime | yes      | Creation timestamp.                                               |
| updated_at   | datetime | yes      | Last modification timestamp.                                      |
| archived_at  | datetime | no       | Soft deletion timestamp.                                           |
| created_by   | uuid     | yes      | Creator ID.                                                       |
| modified_by  | uuid     | yes      | Last modifier ID.                                                 |

## Field Finding

Observations noted during inspections or site visits.

| Field        | Type      | Required | Description                                                     |
|--------------|-----------|----------|-----------------------------------------------------------------|
| id           | uuid      | yes      | Primary key.                                                    |
| location_id  | uuid      | yes      | Location where the finding was observed.                        |
| hazard_id    | uuid      | no       | Hazard associated with the finding, if applicable.              |
| description  | string    | yes      | Description of the observation or deficiency.                   |
| date         | datetime  | yes      | Date of the inspection or observation.                          |
| severity     | string    | yes      | Severity rating (`low`, `medium`, `high`, `critical`).           |
| action_reqd  | boolean   | yes      | Flag indicating if corrective action is required.               |
| created_at   | datetime  | yes      | Creation timestamp.                                            |
| updated_at   | datetime  | yes      | Last modification timestamp.                                   |
| archived_at  | datetime  | no       | Soft deletion timestamp.                                        |
| created_by   | uuid      | yes      | Creator ID.                                                    |
| modified_by  | uuid      | yes      | Last modifier ID.                                              |

## Corrective Action

Tasks created to address field findings or deficiencies.

| Field        | Type      | Required | Description                                                         |
|--------------|-----------|----------|---------------------------------------------------------------------|
| id           | uuid      | yes      | Primary key.                                                        |
| finding_id   | uuid      | yes      | Associated field finding.                                           |
| description  | string    | yes      | Action to be completed.                                            |
| assigned_to  | uuid      | yes      | User responsible for completion.                                    |
| due_date     | datetime  | no       | Target completion date.                                            |
| status       | string    | yes      | Workflow status (`open`, `in_progress`, `closed`, `cancelled`).     |
| closed_at    | datetime  | no       | Timestamp when action was closed.                                  |
| created_at   | datetime  | yes      | Creation timestamp.                                                |
| updated_at   | datetime  | yes      | Last modification timestamp.                                      |
| archived_at  | datetime  | no       | Soft deletion timestamp.                                           |
| created_by   | uuid      | yes      | Creator ID.                                                       |
| modified_by  | uuid      | yes      | Last modifier ID.                                                 |

## Report

Generated or authored reports summarizing data from registers.

| Field        | Type      | Required | Description                                                           |
|--------------|-----------|----------|-----------------------------------------------------------------------|
| id           | uuid      | yes      | Primary key.                                                          |
| name         | string    | yes      | Report title.                                                         |
| report_type  | string    | yes      | Enumeration of report types (`register_summary`, `exposure`, etc.).   |
| generated_at | datetime  | yes      | Timestamp when report was generated.                                 |
| created_by   | uuid      | yes      | User who triggered or authored the report.                           |
| record_ids   | uuid[]    | no       | Optional list of referenced records within the report.                |
| file_link    | string    | no       | Drive URL or path to exported report file.                           |
| created_at   | datetime  | yes      | Record creation timestamp.                                           |
| updated_at   | datetime  | yes      | Last modification timestamp.                                         |
| archived_at  | datetime  | no       | Soft deletion timestamp.                                             |
| modified_by  | uuid      | yes      | Last modifier ID.                                                   |

## Implementation Notes

- **UUIDs**: Use RFC 4122 version 4 random UUIDs for all primary keys.  Never reuse deleted IDs.
- **Timestamps**: All timestamps are stored in ISO 8601 format with UTC offsets.  Clients must convert to local time as necessary.
- **Foreign Keys**: Repositories must enforce referential integrity.  For example, a `process.location_id` must refer to an existing location.
- **Validation**: Field lengths, numeric ranges, and required fields are validated by the domain service layer before repository insertion.
- **Soft Deletes**: Setting `archived_at` marks a record inactive.  Subsequent queries must exclude archived records by default and include them only when explicitly requested.