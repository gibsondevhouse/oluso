# Target schema overview

Status: Implemented target schema (IndexedDB version 3)
Last updated: 2026-07-19

## System stores

| Store | Purpose |
| --- | --- |
| `dataset_metadata` | Dataset identity, schema version, dataset revision, created/update metadata. |
| `installation_metadata` | Stable installation identity and compatibility state. |
| `local_users` | Explicit local actor/reviewer profiles. |
| `migration_runs` | Source/target versions, results, findings, timestamps, and rollback state. |
| `settings` | Non-domain local preferences and diagnostics metadata. |

## Foundation stores

```text
organizations
people
locations
operational_functions
location_function_assignments
organization_location_assignments
organization_function_responsibilities
processes
process_location_assignments
tasks
equipment
chemical_substances
chemical_products
chemical_product_substances
sds_revisions
site_chemical_inventory
chemical_uses
exposure_agents
exposure_limits
controls
scenario_controls
document_references
evidence_references
```

## Industrial-hygiene stores

```text
segs
seg_memberships
exposure_scenarios
exposure_assessments
exposure_determinations
sampling_plans
sampling_events
samples
laboratory_results
exposure_limit_comparisons
professional_interpretations
control_verifications
program_applicability
medical_surveillance_requirements
```

## Assurance stores

```text
observations
inspections
findings
incidents
investigations
corrective_actions
verifications
```

## Governance stores

```text
record_revisions
reviews
approvals
exchange_packages
import_runs
conflict_resolutions
tombstones
review_notes
data_quality_findings
backup_manifests
```

## Required indexing concepts

Physical index design must support:

- Entity ID and business ID.
- Active/archive/superseded status.
- Global geography resolution and Location parent/ancestry queries.
- Organization hierarchy by parent, type, and country.
- Operational Function catalog and effective Location assignment queries.
- Organization–Location and Organization–Function relationship queries.
- Process/task/location relationships.
- Product, site, inventory, and chemical-use relationships.
- SEG membership by person/SEG/effective dates.
- Scenario by resolved Site, Operational Function, SEG, process, task, agent, condition, and status.
- Assessment/determination current and superseded states.
- Sampling by plan/event/scenario/worker/date/agent.
- Actions by source, responsible party, due date, and status.
- Revisions by record type/ID/revision and exchange package.
- Import runs/packages by identity and applied status.

## Relationship requirements

IndexedDB does not enforce foreign keys. Domain services and repository transactions therefore enforce and test:

- Required dependency existence.
- Site resolution and hierarchy rules.
- No circular location parents.
- No circular Organization parents and valid Organization parent types.
- Physical-only Location Function assignments with effective-dated history.
- Explicit Organization–Location and Organization–Function relationships.
- Process Function and multi-Location compatibility, with exactly one active Primary assignment.
- Process/task/location compatibility.
- Assessment → Scenario.
- Determination → Assessment.
- Plan/Event/Sample/Result chain.
- Result/comparison agent, dimension, unit, and duration compatibility.
- Review/revision target existence.
- Archive/supersession behavior.

## Current-state and history separation

Entity stores contain the latest accepted state for efficient reads. `record_revisions` contains immutable changes. A transaction that updates current state must update both consistently.

## Derived data

Dashboard completeness, counts, search projections, and reports are derived. If cached, the cache includes source revision/rule-set metadata and can be discarded/rebuilt.

## Legacy mapping

Legacy `chemicals`, `segs`, generic campaign records, exposure monitoring records, and broad location types do not map one-to-one. Migration creates canonical entities where the mapping is unambiguous and `DataQualityFinding` records where human resolution is required. Migration never invents professional conclusions.
