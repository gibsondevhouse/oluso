# Repository audit and ADAMA HSE architecture reset

Date: 2026-07-18
Repository: `gibsondevhouse/oluso`
Decision status: Accepted project direction
Target product: ADAMA HSE

## Executive decision

OLUSO is not a blank project. Its SvelteKit shell, shared register experience, repository boundary, local persistence knowledge, stable identity concepts, archive/restore behavior, exports, visual system, and test coverage are useful assets.

The repository became broad before the target domain and collaboration model were structurally correct. ADAMA HSE will therefore use a controlled architectural reset, not a ground-up rewrite and not continued campaign expansion.

The target is a local-only web application for an HSE professional and HSE manager, each working from a separate local browser database and exchanging reviewed JSON packages through a user-controlled OneDrive folder.

## Governing workflow

```text
Location
  → Process
  → Task
  → SEG
  → Exposure Scenario
  → Exposure Assessment
  → Determination
  → Monitoring
  → Controls
  → Actions
  → Reassessment
```

The dashboard and navigation must expose gaps in this chain rather than treating broad register counts as proof of readiness.

## What exists and should be salvaged

- Functional SvelteKit and Svelte 5 interface.
- Shared register list/detail/create/edit patterns.
- Application/repository separation.
- Browser and native persistence experience.
- Stable UUID and human-readable business-ID concepts.
- Archive and restore UX.
- Search, filters, reports, exports, backup controls, and failure states.
- A broad HSE entity inventory that can inform migration.
- Existing automated domain and component tests.
- Existing visual language and route registry as starting points.
- Metadata-driven infrastructure for low-risk reference registers.

## Critical findings

### Desktop architecture remains embedded

The README, package dependencies, scripts, static-adapter rationale, Rust code, persistence design, and product documents still describe a Tauri desktop application.

Decision: move to one web architecture. Tauri and Rust are migration sources and will be removed after the browser database and data conversion are verified. The product will not maintain parallel desktop and web persistence paths.

### Backup is being mistaken for collaboration

The current interface can create a full JSON snapshot, insert records that do not exist, or replace the entire database. Existing IDs are ignored by additive import, while restore destroys newer local work. Neither behavior safely supports two separately edited copies.

Decision: backup/restore and reviewed exchange are separate workflows. Exchange import must always validate and dry-run before applying changes.

### Exposure assessment is not the governing object

SEGs, hazards, controls, monitoring, assessments, determinations, and sampling campaigns exist as separate registers but do not enforce one occupational-health workflow. Current generic assessment records can omit the actual worker population, activity, condition, or exposure scenario.

Decision: introduce a first-class `ExposureScenario` and require each assessment to identify the scenario being assessed.

## High-severity findings and decisions

### Generic campaign records

The catch-all campaign record type and `Record<string, unknown>` operations are unsuitable for safety-critical entities.

Decision: retain metadata-driven registers only for low-risk reference data. Foundation, industrial-hygiene, assurance, and governance entities receive explicit types, schemas, services, repositories, invariants, and migration tests.

### Location hierarchy

Country and state are currently attributes, while root `Facility` logic conflicts with a Country → State/Region → Site hierarchy.

Decision: use explicit node types:

```text
Country
StateOrRegion
Site
Building
Unit
Zone
Subzone
Room
StorageArea
OutdoorArea
MobileArea
```

Every operational record must resolve to a Site. Circular ancestry is prohibited.

### Chemical normalization

The existing chemical record mixes substance identity, product, SDS, inventory, use, and exposure-limit concepts.

Decision: separate `ChemicalSubstance`, `ChemicalProduct`, `SDSRevision`, `SiteChemicalInventory`, `ChemicalUse`, `ExposureAgent`, and `ExposureLimit`.

### Monitoring interpretation

A string result compared directly with one limit cannot represent TWA, STEL, ceilings, duration, units, non-detects, uncertainty, mixtures, PPE context, or professional judgment.

Decision: separate `SamplingPlan`, `SamplingEvent`, `Sample`, `LaboratoryResult`, `ExposureLimitComparison`, `ProfessionalInterpretation`, and `ExposureDetermination`. Calculated comparisons support but never replace the attributed determination.

### Audit history

Archive metadata and `updatedAt` do not reconstruct previous values, actor, reason, imported source, or review state.

Decision: every accepted mutation writes an immutable `RecordRevision` in the same transaction as the current record.

### Duplicate persistence implementations

The browser and Rust implementations model migrations, normalization, queries, imports, and repositories independently and will drift.

Decision: define one repository contract, implement one browser adapter, verify contract and migration behavior, then remove Rust/Tauri and split the browser persistence monolith into bounded modules.

## Medium-severity findings and decisions

### Excessive breadth

Training, MOC/PSSR, environmental, waste, migration, and other campaign families create more surface than can be validated at once.

Decision: place nonessential domains behind a Future Modules boundary. The next build cycle focuses on baseline master data, exposure scenarios, assessment, monitoring, exchange review, and linked corrective action.

### Test counts do not prove operational readiness

The existing unit/component count is useful but does not cover the most dangerous failure modes.

Decision: create a unified verification command covering formatting, lint, types, unit tests, repository contracts, all supported migrations, exchange round-trips and conflicts, production build, end-to-end workflows, offline behavior, and recovery.

## Target architecture

```text
SvelteKit SPA/PWA
  → application and domain services
  → repository contracts
  → one IndexedDB browser adapter
  → versioned local database
  → backup snapshots and exchange packages
  → manual OneDrive transfer
```

The application must work offline after first load. OneDrive is never read or written silently and never becomes the authoritative database.

## Canonical domain layers

### Foundation

```text
Organization
Person
Location
Process
Task
Equipment
ChemicalSubstance
ChemicalProduct
SDSRevision
SiteChemicalInventory
ChemicalUse
ExposureAgent
ExposureLimit
Control
DocumentReference
```

### Industrial hygiene

```text
SEG
SEGMembership
ExposureScenario
ExposureAssessment
ExposureDetermination
SamplingPlan
SamplingEvent
Sample
LaboratoryResult
ExposureLimitComparison
ProfessionalInterpretation
ControlVerification
ProgramApplicability
MedicalSurveillanceRequirement
```

### Assurance

```text
Observation
Inspection
Finding
Incident
Investigation
CorrectiveAction
Verification
EvidenceReference
```

### Governance

```text
RecordRevision
Review
Approval
ExchangePackage
ImportRun
ConflictResolution
DataQualityFinding
```

## Exposure scenario requirement

An `ExposureScenario` combines, at minimum:

```text
SEG
location
process
task
exposure agent
operating condition
exposure routes
frequency
duration
variability
existing controls
PPE
control reliability
acute concerns
chronic concerns
data-quality status
```

Routine operation, upset/blockage work, and post-release cleanup are separate scenarios even when they involve the same SEG or unit.

## Record and exchange metadata

Every exchangeable record includes:

```text
id
businessId
revision
createdAt
createdBy
updatedAt
updatedBy
originInstallationId
lastExchangePackageId
```

An exchange package includes:

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

The import dry-run classifies each candidate as:

- New
- Identical
- Updated only locally
- Updated only externally
- Conflicting
- Deleted externally
- Missing dependency
- Invalid schema
- Stale revision

No package changes local records before the user reviews the preview and resolves blocking conflicts.

## Retain, refactor, defer, remove

### Retain

- SvelteKit/Svelte 5 and the existing visual system.
- Application/repository boundary.
- Shared register shell, search/filtering, lifecycle states, and error/dirty/not-found UI.
- Stable identifiers, exports, tests, and generic lookup infrastructure.

### Refactor heavily

- Location, chemical, SEG, exposure assessment, sampling, monitoring, import/export, audit history, generic campaign entities, persistence, navigation, and dashboard behavior.

### Defer

- Training/LMS behavior.
- Complex MOC and PSSR workflows.
- Waste and broad environmental modules.
- Broad compliance calendars and migration bundles.
- Clinical medical records.
- Automatic cloud sync and real-time coauthoring.

### Remove after verified migration

- Tauri dependencies, commands, packaging, and documentation.
- Rust persistence and native migrations.
- Desktop-only configuration.
- Duplicate desktop-first ADRs.
- `localStorage` as the primary database.

## Delivery phases

1. Freeze expansion and document the reset.
2. Establish browser persistence, migrations, recovery, and offline behavior.
3. Rebuild canonical master data.
4. Build the DOEHRS-inspired industrial-hygiene spine.
5. Implement versioned exchange, dry-run, conflict resolution, attribution, and rollback.
6. Build the unit baseline and walkthrough experience.
7. Connect assurance, corrective actions, verification, and reassessment.
8. Harden migrations, recovery, accessibility, performance, and deployment.

Each phase and its exit gates are defined in [the build plan](07-build-plan.md).

## Immediate priority

The repository must stop treating breadth as completion. Until the baseline and occupational-health spine meet their exit criteria, new campaign registers are frozen.

The immediate sequence is:

```text
Web platform reset
  → canonical master data
  → exposure-scenario model
  → DOEHRS-inspired assessment workflow
  → safe two-person exchange
  → baseline field workflow
  → corrective-action closure
  → production hardening
```
