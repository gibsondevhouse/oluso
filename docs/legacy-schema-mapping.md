# Legacy-to-target schema mapping

Status: Phase 0 migration contract
Last updated: 2026-07-18

## Supported source families

### Browser `localStorage`

The current parser in `src/lib/persistence/local-persistence.ts` explicitly accepts versions 1 through 14.

| Version | Authoritative source shape | Migration interpretation |
| --- | --- | --- |
| 1 | `locations` plus database timestamps | Location migration only. |
| 2 | v1 plus `findings` | Location and assurance finding migration. |
| 3 | Core snapshot family: locations, findings, processes, equipment, chemicals, hazards, controls, risk assessments, SEGs, corrective actions | Map each present collection; absent fields/collections remain absent and produce findings where target requirements cannot be met. |
| 4 | Same tolerant core family | Field presence, not a guessed historical default, controls mapping. |
| 5 | Same tolerant core family | Field presence controls mapping. |
| 6 | Same tolerant core family | Field presence controls mapping. |
| 7 | Same tolerant core family | Field presence controls mapping. |
| 8 | Same tolerant core family | Field presence controls mapping. |
| 9 | Same tolerant core family | Field presence controls mapping. |
| 10 | Last core snapshot before later register additions | Same mapping rules as v3–v9. |
| 11 | Adds exposure-monitoring collection in the v10–v13 family | Split legacy monitoring rows into plan/event/sample/result staging; no automatic professional determination. |
| 12 | Adds incidents | Map to typed Incident, preserving operational links where valid. |
| 13 | Adds compliance items and later gained location parent/geography fields without a version bump | Inspect `parentLocationId`, `country`, and `stateProvince` by field presence. Compliance/training/permit content is deferred unless it maps to a current target entity. |
| 14 | Adds all metadata-driven campaign collections | Map canonical current-scope collections; preserve deferred/unmappable rows in the migration run and create data-quality findings. |

Because v13 existed both before and after the location-geography change, version number alone is insufficient. The migration fingerprint includes collection names and material field presence.

### Native Tauri SQLite

Native schema versions are defined by immutable files in `src-tauri/migrations` and exported as the same collection-oriented JSON snapshot used by the application.

| Version | Native change | Migration effect |
| --- | --- | --- |
| 1 | Core tables: locations, processes, chemicals, hazards, SEGs, findings, corrective actions | Map core records using field-level rules below. |
| 2 | Corrective-action source/completion/verification fields | Preserve distinct completion/verification/closure data. |
| 3 | Corrective-action evidence reference | Map to evidence reference. |
| 4 | Equipment table | Map equipment and valid location/process links. |
| 5 | Chemical SDS and exposure-limit fields | Split into product/SDS/inventory/use/agent/limit; do not retain OEL on inventory. |
| 6 | Controls and risk assessments | Map controls; risk assessments require target review because they are not exposure assessments. |
| 7 | Finding extensions plus exposure monitoring, incidents, compliance items | Map assurance; split monitoring; defer unsupported compliance scope. |
| 8 | Location parent | Use hierarchy relationship when valid. |
| 9 | Generic `campaign_records` table | Dispatch by campaign collection and mapping disposition. |
| 10 | Location country/state fields | Create Country and StateOrRegion nodes and attach Site roots. |

Native versions 1–10 remain supported until representative migration and rollback evidence permits native removal.

## Common metadata mapping

| Legacy | Target | Rule |
| --- | --- | --- |
| `id` | `id` | Preserve when one target record is the direct successor. Derived split records use deterministic IDs tied to the source ID. |
| Generated/available code | `businessId` | Preserve campaign `businessId`; otherwise generate deterministic migration business ID and record the mapping. |
| `createdAt` | `createdAt` | Preserve valid ISO instant; otherwise use migration time and create a finding. |
| `updatedAt` | `updatedAt` | Preserve valid ISO instant; otherwise use creation/migration time. |
| none | `revision` | Start at 1 with source `migration`; never infer edit history that was not retained. |
| none | `createdBy` / `updatedBy` | Use the explicit migration actor while retaining source values inside migration evidence where available. |
| none | `originInstallationId` | Use the source installation/migration identity, not the receiving installation silently. |
| `lifecycleStatus`, `archivedAt`, `archivedReason` | lifecycle/archive fields | Preserve; `archivedBy` is the migration actor when legacy data lacks actor history. |

## Collection mapping

| Legacy collection/table | Target | Disposition and required review |
| --- | --- | --- |
| `locations` | `locations` | Create Country → StateOrRegion → Site hierarchy. Root Facility becomes Site; other legacy types use the node mapping below. Invalid/orphan/cyclic relationships block the affected record and create a finding. |
| `processes` | `processes` | Preserve ID; derive resolved Site through mapped location. |
| campaign `tasks` | `tasks` | Preserve ID and process/location links; missing process or Site is blocking. |
| `equipment` | `equipment` | Preserve ID and valid location/process links; task link remains empty unless explicit. |
| `chemicals` | `chemical_substances`, `chemical_products`, `sds_revisions`, `site_chemical_inventory`, `chemical_uses`, `exposure_agents`, `exposure_limits` | Split one row. Product retains legacy ID; derived IDs are deterministic. Ambiguous product/substance/manufacturer/formulation facts create findings. |
| `hazards` | `hazards` | Preserve as typed hazard; chemical-exposure agents are separately canonicalized. |
| `controls` | `controls` | Preserve reusable control; free-text verification history does not become a `ControlVerification` event without date/evidence. |
| `riskAssessments` | migration evidence + `data_quality_findings` | Do not reinterpret generic risk assessment as occupational exposure assessment. |
| `segs` | `segs` | Preserve worker-group identity; remove scenario/assessment fields from SEG and create findings for legacy exposure/control/frequency content requiring scenario mapping. |
| `findings` | `findings` | Preserve and map valid context/evidence. |
| `incidents` | `incidents` | Preserve and map valid context/evidence. |
| `correctiveActions` | `corrective_actions` | Preserve completion/verification/closure distinction and source links. |
| `exposureMonitoring` | `sampling_plans`, `sampling_events`, `samples`, `laboratory_results`; migration findings | Preserve numeric result when valid. Missing duration/method/agent basis blocks comparison. Never create interpretation or determination automatically. |
| `complianceItems` | migration evidence; selected document/action targets only after review | Training/permit broad scope remains deferred. |
| campaign `organizations` | `organizations` | Preserve ID/business ID. |
| campaign `people` | `people` and optional local-user candidate | Preserve ID/business ID; no clinical fields. |
| campaign `segMemberships` | `seg_memberships` | Preserve effective dates and basis; validate overlap and dependencies. |
| campaign `inspections` | `inspections` | Preserve assurance context. |
| campaign `exposureAgents` | `exposure_agents` | Preserve and deduplicate against agents derived from chemicals/monitoring. |
| campaign `exposureLimits` | `exposure_limits` | Preserve version/source/type/unit/basis only when explicit; superseded status retained. |
| campaign `exposureAssessments` | `exposure_assessments` only after scenario resolution | Missing scenario is blocking; preserve raw row in migration run and create finding. |
| campaign `exposureDeterminations` | `exposure_determinations` only after valid assessment resolution | Never infer assessment or professional judgment. |
| campaign `samplingCampaigns` | `sampling_plans` candidate | Execution/sample/result detail is not invented. |
| campaign `controlVerifications` | `control_verifications` | Requires valid control/scenario and actual verification date/evidence. |
| campaign `programApplicabilities` | `program_applicability` | Preserve administrative basis/review. |
| campaign `medicalSurveillance` | `medical_surveillance_requirements` | Administrative applicability only; reject/quarantine clinical content. |
| campaign `documentReferences` | `document_references` | Preserve external reference metadata. |
| campaign `dataQualityFindings` | `data_quality_findings` | Preserve status/severity/affected record where valid. |
| contractor, training, MOC/PSSR, regulatory/permit, waste/environmental, HSE-program, migration mapping/bundle collections | migration-run evidence | Deferred. No target operational record is invented. |

## Location type mapping

| Legacy type | Target candidate | Rule |
| --- | --- | --- |
| Root `Facility` | `Site` | Must receive Country and StateOrRegion parent. |
| Child `Facility` | `Building` | Flag if the source semantics suggest another Site. |
| `Production Area` | `Unit` | Flag for Zone review when ambiguous. |
| `Storage` | `StorageArea` | Preserve parent and Site resolution. |
| `Lab` | `Room` | Requires compatible operational parent; otherwise flag. |
| `Office` | `Room` | Requires compatible operational parent; otherwise flag. |
| `Utility Area` | `Zone` | Flag for Unit/Building review where needed. |
| `Outdoor Area` | `OutdoorArea` | Preserve parent and Site resolution. |

## Verification requirements

- Run detection tests for browser versions 1–14 and native versions 1–10.
- Run representative v14-browser and v10-native fixtures through the same adapter.
- Assert identity, record counts, deterministic split mappings, valid dependencies, archived state, immutable revisions, and dataset revision.
- Assert deferred/unmappable records are retained in migration evidence and produce explicit findings.
- Assert no assessment, comparison, interpretation, or determination is invented.
- Failed migration must leave the active target database unchanged.
