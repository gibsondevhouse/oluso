# 04 — ADAMA HSE domain model

Status: Governing conceptual model
Last updated: 2026-07-19

## Purpose

This document defines the durable entities, relationships, and invariants for the ADAMA HSE reset. Explicit TypeScript types, validation schemas, repository contracts, and database migrations must implement this model without collapsing safety-critical entities into generic campaign records.

## Governing traceability chain

```text
Organization + global geography + physical Location + Operational Function
  → Process
  → Task
  → SEG
  → Exposure Scenario
  → Exposure Assessment
  → Exposure Determination
  → Monitoring
  → Controls and Actions
  → Verification
  → Reassessment
```

The exposure scenario is the required context for occupational-exposure assessment. A SEG, hazard, sample, or chemical record alone is insufficient.

## Common record envelope

Every exchangeable durable record carries:

| Field | Rule |
| --- | --- |
| `id` | Stable UUID; never reused. |
| `businessId` | Human-readable identifier; unique within its defined dataset/entity scope. |
| `revision` | Positive integer incremented for every accepted mutation. |
| `createdAt` / `createdBy` | Immutable creation attribution. |
| `updatedAt` / `updatedBy` | Attribution for the current revision. |
| `originInstallationId` | Installation where the record was first created. |
| `lastExchangePackageId` | Last package that changed the local record, if any. |
| `lifecycleStatus` | Domain-appropriate status; archive is distinct from completion or approval. |
| `archivedAt` / `archivedBy` / `archiveReason` | Present when archived. |

The current record is a projection of its accepted revisions. It is not the full audit history.

## Foundation layer

### Organization and Person

`Organization` represents ADAMA corporate, regional, legal, country, business, Site, Department, employer, contractor, laboratory, manufacturer, provider, vendor, or regulatory parties. It is never a geographic or physical Location.

`Person` represents a worker, manager, reviewer, assessor, sampler, or responsible party. Authentication is not required to preserve actor identity; local user profiles provide explicit attribution.

Rules:

- Internal Organizations form an explicit, cycle-free hierarchy. External Organizations may remain outside it.
- Organization–Location assignments express Owns, Leases, Operates, Manages, Occupies, Supports, jurisdiction, or another controlled relationship without treating geography as an owned asset.
- Organization–Function responsibilities express accountable, responsible, supporting, oversight, operator, provider, or authority roles at an optional Location scope.
- Clinical medical data is never stored on `Person`.
- A deactivated person remains available to historical records.
- Person and organization identifiers must not be inferred from free text when a canonical relationship exists.
- Person Location and Function assignment contracts are reserved for workers with several effective-dated work contexts.

### Location

`Location` is a node in a governed hierarchy.

Allowed node types:

```text
Country
StateOrProvince
CountyOrDistrict
CityOrMunicipality
Site
Facility
Building
Floor
Unit
Zone
Subzone
Room
StorageArea
OutdoorArea
MobileArea
```

Rules:

- Country has no parent.
- StateOrProvince has a Country parent; CountyOrDistrict has a StateOrProvince parent.
- CityOrMunicipality has a StateOrProvince or CountyOrDistrict parent.
- Site has a CityOrMunicipality parent, or CountyOrDistrict when no municipality applies.
- Facility and lower physical nodes follow the controlled parent matrix and resolve to exactly one Site through ancestry.
- A node cannot be its own ancestor or descendant.
- Every operational record must resolve to exactly one Site, even when its immediate location is more specific.
- Archived locations remain resolvable from historical records and cannot silently detach children.
- Resolved Country, State/Province, County/District, City/Municipality, and Site fields are recalculated with dependent records in one atomic move transaction.
- Operational purpose is never encoded as a Location node type. A Building named “Warehouse” is still a Building.

### Operational Function and assignments

`OperationalFunction` is a reusable controlled enterprise capability such as Manufacturing, Tolling, Packaging, Warehousing, Laboratory, Maintenance, Utilities, HSE, or Administration.

`LocationFunctionAssignment` is the effective-dated many-to-many relationship between a physical Location and an Operational Function. One physical Location may support several Functions, and one Function may occur at several Locations. Primary is non-exclusive, assignment history is retained, and an assignment does not create Processes, SEGs, Chemical Uses, or Exposure Scenarios automatically.

Functions are globally reusable identities; they are not duplicated per Site and are not inferred from Location names.

### Process, Task, and Equipment

`Process` describes a repeatable operational workflow under one primary Operational Function and one Site-resolved primary Location.

`Task` describes a discrete activity within a process. Routine operation, maintenance, line breaking, duct clearing, cleanup, sampling, and upset response are separate tasks where exposure conditions differ.

`Equipment` represents exposure- or control-relevant assets connected to a location, process, or task.

Rules:

- A task belongs to a process.
- Process creation requires an active Function explicitly assigned to its primary Location.
- `ProcessLocationAssignment` retains one active Primary relationship plus effective-dated Source, Destination, Transfer Path, Supporting, Storage, Staging, Waste, Emergency, or other same-Site Locations.
- A task may specify a more precise location than the process but must resolve to a compatible Site.
- A reusable Task carries descriptive routine classification; scenario-specific operating condition does not belong on the Process, Function, Location, or Task definition.
- Equipment history remains visible after retirement or archive.

### Chemical model

`ChemicalSubstance` stores canonical chemical identity: canonical name, CAS number where applicable, synonyms, and intrinsic identity/classifications.

`ChemicalProduct` stores commercial identity: product/trade name, manufacturer, formulation, related substances, and product status.

`SDSRevision` stores a dated revision for one product: manufacturer, revision/effective dates, evidence reference, and current/superseded state.

`SiteChemicalInventory` stores the presence and amount of a product at a site/storage location.

`ChemicalUse` stores product use within Site/process/task/location context, including the Process-derived Operational Function, frequency, duration, and scenario-specific operating condition.

Rules:

- A product may be used at many sites without duplicating substance or product identity.
- Multiple SDS revisions are retained; exactly one may be designated current for a product/manufacturer context at a time.
- Inventory quantity and storage are not properties of the product.
- Chemical use is distinct from inventory.
- Chemical Use requires Site, Location, Process, optional Task, and Function compatibility; its Location must have the active Process Function assignment.
- Exposure limits never belong to product inventory records.

### ExposureAgent and ExposureLimit

`ExposureAgent` represents the substance, noise, physical agent, biological agent, or other occupational-exposure agent assessed and monitored.

`ExposureLimit` is a versioned comparison basis associated with an agent and includes:

- Issuing organization and citation.
- Limit type such as TWA, STEL, ceiling, excursion, or internal action level.
- Value and canonical unit.
- Averaging period or duration basis.
- Effective/superseded dates.
- Notations and qualifiers.
- Applicability and jurisdiction context.

Rules:

- Multiple limits may coexist for one agent.
- Superseded limits remain historically available but cannot be selected as the current basis without an explicit justified override.
- Comparisons require compatible dimensions, units, duration basis, and applicable conditions.

### Control and DocumentReference

`Control` is a reusable engineering, administrative, work-practice, substitution, elimination, or PPE control.

Scenario/control relationships store applicability, expected performance, reliability, verification status, and limitations. Free-text controls may supplement but cannot replace structured relationships.

`DocumentReference` stores metadata and a user-controlled reference to an external document. ADAMA HSE does not become the authoritative document-management system.

## Industrial-hygiene layer

### SEG and SEGMembership

`SEG` defines a group of workers expected to have sufficiently similar exposure potential for a stated scope. It includes the group rationale, roles/work patterns, inclusion/exclusion criteria, and status.

`SEGMembership` links a Person to a SEG with effective start/end dates, membership basis, and review state.

Rules:

- A SEG is not a generic hazard grouping or an exposure assessment.
- Membership is effective-dated and historically retained.
- Active overlapping memberships are allowed only when different scopes or an explicit justification makes them meaningful.
- A membership cannot end before it starts.

### ExposureScenario

`ExposureScenario` is the first-class description of a potential exposure under one coherent set of conditions.

Required context:

- SEG.
- Site-resolvable location.
- Operational Function.
- Process.
- Task.
- Exposure agent.
- Operating condition: routine, non-routine, maintenance, startup/shutdown, upset, release, cleanup, emergency, or another controlled value.

Structured characterization:

- Exposure routes.
- Frequency and duration.
- Variability and affected population.
- Existing controls and PPE.
- Control reliability.
- Acute and chronic concerns.
- Evidence references.
- Data-quality status and known gaps.

Rules:

- Routine production, upset blockage clearing, and post-release cleanup are separate scenarios.
- Process, task, and location must be mutually compatible.
- A scenario may exist in draft with gaps, but it cannot be promoted to assessment-ready without its required context.

### ExposureAssessment

`ExposureAssessment` is a structured professional evaluation of one exposure scenario at a point in time.

It includes assessment date, assessor, method/purpose, evidence, qualitative exposure potential, frequency/duration/variability, acute/chronic considerations, control evaluation, uncertainty, confidence, representativeness, data quality, gaps, monitoring priority/rationale, review state, and next review date.

Rules:

- An assessment must reference exactly one exposure scenario.
- The assessment snapshots material scenario context or references immutable revisions.
- Unknown and missing information cannot be represented as false certainty.
- Domain validation governs promotion and review.

### ExposureDetermination

`ExposureDetermination` is the explicit professional conclusion based on an assessment and available evidence.

It records the assessment, category/rationale, determiner/date, evidence/comparisons, confidence/limitations/applicability, required monitoring/controls/programs/surveillance/actions/reassessment, and review state.

Rules:

- A determination belongs to an assessment.
- Calculated limit comparisons never create or silently update the determination.
- Superseding a determination preserves the prior determination and reason.

### Monitoring model

`SamplingPlan` defines why, whom, what, when, and how to sample, including scenario, strategy, methods, analytes, target duration, quality controls, and responsibilities.

`SamplingEvent` records an execution of a plan under actual conditions.

`Sample` records one collected measurement/specimen with worker/area context, start/stop times, duration, flow/volume where applicable, method, device/media, conditions, and chain-of-custody references.

`LaboratoryResult` records analyte result, value, unit, detection/quantitation limits, qualifiers, non-detect representation, method, laboratory, and report reference.

`ExposureLimitComparison` records a reproducible calculation against one versioned limit, including conversions, duration handling, assumptions, and outcome.

`ProfessionalInterpretation` records the qualified interpretation of results, representativeness, uncertainty, PPE context, routine/abnormal conditions, and implications for sampled and unsampled workers.

Rules:

- Numeric results are stored as numeric values plus explicit qualifiers, never numeric strings.
- Non-detect and below-quantitation results are modeled, not coerced to zero.
- Comparisons fail closed when unit, dimension, duration, or basis is incompatible.
- Partial-shift, STEL, ceiling, mixture, and unusual-condition logic must be explicit.
- A comparison status identifies its calculation basis and is not labeled a compliance determination.

### Follow-up entities

`ControlVerification` evaluates whether a control is present, functioning, used, maintained, and effective for a scenario.

`ProgramApplicability` records whether an HSE program applies, with basis and review date.

`MedicalSurveillanceRequirement` records administrative applicability and review status. It excludes diagnoses, test results, clinical notes, and other protected clinical content.

## Assurance layer

`Observation`, `Inspection`, `Finding`, `Incident`, and `Investigation` capture assurance events and their operational/exposure context.

`CorrectiveAction` links to a source record, responsible party, due date, completion evidence, and verification requirement.

`Verification` records independent confirmation that completion addressed the intended condition.

`EvidenceReference` connects records to controlled external evidence or a supported local reference without making a report or file the source record.

Rules:

- Completion, verification, and closure are distinct.
- Actions must have a source record or a documented manual-source justification.
- A failed control or material incident may trigger reassessment.

## Governance layer

### RecordRevision

Every accepted mutation appends an immutable revision containing:

```text
recordType
recordId
revision
operation
changedAt
changedBy
source
changeReason
before
after
exchangePackageId
```

The revision is written transactionally with the current record. Revision payloads are immutable application data, not console logs.

### Review and Approval

`Review` records reviewer, status, notes, requested changes, reviewed record/revision, and timestamps.

`Approval` is used only where the workflow explicitly requires it. Approval is not implied by save, import, or absence of comments.

### ExchangePackage, ImportRun, and ConflictResolution

An `ExchangePackage` manifest includes:

```text
packageId
datasetId
schemaVersion
exportedAt
exportedBy
sourceInstallationId
baseDatasetRevision
records
tombstones
reviewNotes
integrityHash
```

`ImportRun` preserves file identity, validation outcome, dry-run classifications, user choices, applied revisions, rejected items, timestamps, and rollback package reference.

`ConflictResolution` records local/external/base values, selected resolution, resolver, rationale, and resulting revision.

Rules:

- Package identity is immutable.
- Dataset mismatch, invalid schema, and failed integrity validation block apply.
- Applying a package is atomic unless a future ADR explicitly defines safe partitioned commits.
- Re-importing the same applied package is idempotent.
- Tombstones are reviewable deletions, not instructions for blind hard delete.

### DataQualityFinding

`DataQualityFinding` identifies missing, stale, contradictory, orphaned, or low-confidence information, its affected record, severity, disposition, owner, and resolution evidence.

## Cross-record invariants

- Operational records resolve to a Site.
- Required relationships cannot point to missing records.
- Archived dependencies remain historically resolvable and visibly inactive.
- Circular location relationships are prohibited.
- A determination belongs to an assessment; an assessment belongs to a scenario.
- A sample belongs to a sampling event and, through its plan or explicit link, to the assessed scenario.
- An active exposure-limit comparison uses a valid, versioned basis with compatible units and duration.
- Medical-surveillance administration excludes clinical content.
- Every accepted current-state mutation has a reconstructable immutable revision.

## Generic register boundary

Metadata-driven generic records are permitted for controlled lookup/reference tables with no material cross-record or lifecycle invariants.

They are prohibited for exposure scenarios/assessments/determinations/monitoring, SEG membership, chemical identity/SDS/inventory/use, reviews/revisions/exchanges/conflicts/approvals, corrective actions/verification, and any entity whose invalid state could misrepresent worker risk, professional judgment, or audit history.
