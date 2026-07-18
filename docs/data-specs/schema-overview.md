# Target schema overview

Status: Conceptual; physical IndexedDB keys/indexes are finalized with implementation
Last updated: 2026-07-18

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
processes
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
- Site resolution and location parent/ancestry queries.
- Process/task/location relationships.
- Product, site, inventory, and chemical-use relationships.
- SEG membership by person/SEG/effective dates.
- Scenario by Site, SEG, process, task, agent, condition, and status.
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
