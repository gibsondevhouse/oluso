# ADAMA HSE — Foundation Application Cutover Plan

**Repository:** `gibsondevhouse/oluso`  
**Current baseline commit:** `b66df70732edae5b01d69c95c0f1285fef09a07c`  
**Status:** IndexedDB persistence foundation implemented; application cutover not complete  
**Next objective:** Move the first complete operational workflow off the legacy adapter and onto the typed IndexedDB architecture.

---

## 1. Current State

The latest merged work established the web-first persistence foundation, including:

- IndexedDB database lifecycle management
- Versioned target schema
- Typed mutable repository contract
- Immutable record revisions
- Dataset, installation, and local-user identity
- Atomic mutation transactions
- Backup integrity hashing
- Exact backup and restore
- Exchange staging
- Browser-storage diagnostics
- PWA application shell
- Legacy browser and native-schema detection
- Representative legacy migration fixtures
- `npm run verify`

This is the correct foundation.

However, the current application routes still use the legacy synchronous application adapter. The new database exists, but the operating UI has not completed its runtime cutover.

The next commit must not add another generic register. It must prove the target architecture by moving one complete workflow slice onto typed repositories and services.

---

## 2. Immediate Verification Gate

Before beginning the next branch, verify the merged baseline from a clean `main` checkout.

```bash
git checkout main
git pull
npm ci
npm run verify
```

The current `verify` command runs:

- Svelte and TypeScript checks
- Full automated test suite
- Production build
- PWA artifact verification

There are currently no GitHub Actions checks protecting the merge, so local clean-environment verification remains mandatory.

---

## 3. Next Campaign: Foundation Application Cutover

### Objective

Move the following records from the legacy campaign adapter to the new typed IndexedDB architecture:

1. Organizations
2. People
3. Locations
4. Processes
5. Tasks

### Required architecture

```text
Typed domain contracts
    ↓
Typed repositories
    ↓
Domain services
    ↓
Application composition
    ↓
Route cutover
    ↓
Legacy-path prohibition
    ↓
Verification
```

### Non-negotiable constraint

Do not recreate the legacy generic campaign adapter over IndexedDB.

That would preserve the same modeling defect the architecture reset is intended to remove.

---

# Part 1 — Typed Foundation Domain

## 1. Objective

Create explicit, production-grade domain models and validation rules for:

- `Organization`
- `Person`
- `Location`
- `Process`
- `Task`

## 2. Problem

The new IndexedDB stores provide persistence capacity, but persistence alone does not establish domain correctness.

Without typed business rules, the application could still create:

- A Site with no State or Region
- A Task with no Process
- A Process that resolves to no Site
- A Person linked to a missing or archived Organization
- A circular location hierarchy
- An operational location that cannot resolve to a Site
- Duplicate business identifiers
- Records with stale revisions

## 3. Files

Create a bounded foundation domain area.

```text
src/lib/domain/foundation/
├── organization.ts
├── person.ts
├── location.ts
├── process.ts
├── task.ts
├── validation.ts
├── errors.ts
└── index.ts
```

Do not place these rules in:

- Svelte components
- Generic form configuration
- Route configuration
- Generic campaign metadata
- Persistence adapters

## 4. Required Domain Models

### Organization

Minimum fields:

```text
id
businessId
name
organizationType
status
description
primaryContactPersonId
createdAt
createdBy
updatedAt
updatedBy
revision
originInstallationId
lastExchangePackageId
lifecycleStatus
archivedAt
archivedReason
```

Suggested organization types:

```text
ADAMA Entity
Department
Contractor
Temporary Agency
Laboratory
Waste Vendor
Service Vendor
Regulator
Medical Provider
Other
```

### Person

Minimum fields:

```text
id
businessId
displayName
personType
organizationId
employeeIdentifier
jobTitle
department
supervisorPersonId
primarySiteId
email
phone
status
createdAt
createdBy
updatedAt
updatedBy
revision
originInstallationId
lastExchangePackageId
lifecycleStatus
archivedAt
archivedReason
```

### Location

Required node types:

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

Minimum fields:

```text
id
businessId
name
nodeType
parentId
resolvedSiteId
description
status
createdAt
createdBy
updatedAt
updatedBy
revision
originInstallationId
lastExchangePackageId
lifecycleStatus
archivedAt
archivedReason
```

### Process

Minimum fields:

```text
id
businessId
name
processType
primaryLocationId
resolvedSiteId
description
status
createdAt
createdBy
updatedAt
updatedBy
revision
originInstallationId
lastExchangePackageId
lifecycleStatus
archivedAt
archivedReason
```

### Task

Minimum fields:

```text
id
businessId
name
taskType
processId
locationId
resolvedSiteId
description
routineStatus
operatingCondition
status
createdAt
createdBy
updatedAt
updatedBy
revision
originInstallationId
lastExchangePackageId
lifecycleStatus
archivedAt
archivedReason
```

Suggested task types:

```text
Routine Operation
Startup
Shutdown
Cleaning
Maintenance
Troubleshooting
Material Transfer
Sampling
Packaging
Contractor Work
Emergency Response
Other
```

Suggested operating conditions:

```text
Routine
Non-Routine
Startup
Shutdown
Maintenance
Upset
Emergency
Post-Release Cleanup
```

## 5. Required Validation Rules

### Location hierarchy

```text
Country              → no parent
StateOrRegion        → Country
Site                 → StateOrRegion
Building             → Site or Building
Unit                 → Site or Building
Zone                 → Site, Building, or Unit
Subzone              → Zone
Room                 → Building, Unit, or Zone
StorageArea          → Site, Building, Unit, or Zone
OutdoorArea          → Site
MobileArea           → Site
```

Enforce:

- No circular parent relationships
- No self-parent relationship
- Every operational node resolves to exactly one Site
- Parent record must exist
- Parent record must be active unless the operation explicitly supports historical restoration
- Moving a node must recalculate `resolvedSiteId` for all descendants
- A node cannot be moved beneath one of its descendants

### Organization

Enforce:

- Name required
- Organization type required
- Business ID unique
- Referenced primary contact must exist
- Archived organizations cannot receive new active people without deliberate restoration or override

### Person

Enforce:

- Display name required
- Person type required
- Organization reference must exist when supplied
- Supervisor reference cannot point to the same person
- Primary Site must be a valid active Site
- Archived people cannot receive new active assignments

### Process

Enforce:

- Name required
- Primary location required
- Primary location must resolve to a Site
- `resolvedSiteId` must match the location hierarchy
- Business ID unique
- Archived locations cannot receive new active processes

### Task

Enforce:

- Name required
- Process required
- Process must exist and be active
- Task location must resolve to the same Site as the Process unless an explicit cross-site rule is added later
- Operating condition required
- Business ID unique
- Archived Processes cannot receive new active Tasks

## 6. UI/UX Requirements

No major visual redesign is required during this part.

Validation behavior must be:

- Field-specific
- Human-readable
- Visible before persistence
- Preserved after failed saves
- Focused on the first invalid field
- Available to screen readers
- Consistent between create and edit flows

Required states:

```text
Clean
Dirty
Validating
Saving
Saved
Validation Failed
Save Failed
Stale Revision
Missing Dependency
Archived Dependency
```

## 7. Data Requirements

Use the existing IndexedDB stores:

```text
organizations
people
locations
processes
tasks
```

Every mutation must:

- Increment record revision
- Increment dataset revision
- Create an immutable `RecordRevision`
- Use expected-revision concurrency
- Preserve installation identity
- Preserve local-user identity
- Preserve origin installation
- Preserve exchange-package attribution
- Roll back the entire transaction if any write fails

## 8. Error Handling

Handle explicitly:

```text
DuplicateBusinessIdError
MissingRelationshipError
ArchivedRelationshipError
InvalidParentTypeError
CircularHierarchyError
CrossSiteRelationshipError
ValidationError
StaleRevisionError
DatabaseUnavailableError
TransactionFailedError
RecordNotFoundError
RecordArchivedError
```

No failed write may partially mutate:

- Current record state
- Revision history
- Dataset revision
- Relationship indexes
- Migration or import evidence

## 9. Tests

Add unit and integration tests for:

### Location

- Valid Country creation
- Valid State or Region creation
- Valid Site creation
- Valid operational-child creation
- Invalid parent type rejection
- Self-parent rejection
- Circular hierarchy rejection
- Descendant-move rejection
- Site resolution
- Descendant site-resolution update after move
- Archived parent rejection

### Organization and Person

- Valid Organization creation
- Duplicate business ID rejection
- Valid Person creation
- Missing Organization rejection
- Archived Organization behavior
- Self-supervisor rejection
- Invalid primary Site rejection

### Process and Task

- Valid Process creation
- Process with unresolved location rejection
- Valid Task creation
- Task without Process rejection
- Task linked to archived Process rejection
- Cross-site Task rejection
- Operating-condition validation

### Persistence and revisions

- Record revision creation
- Dataset revision increment
- Expected-revision success
- Stale-revision rejection
- Multi-store rollback
- Current record and revision equivalence
- Restore behavior
- Archive behavior

## 10. Acceptance Criteria

Part 1 is complete when:

- All five entities have explicit TypeScript types.
- Validation is independent of the UI.
- Cross-record rules are implemented outside components.
- No foundation domain service accepts `Record<string, unknown>`.
- No foundation entity depends on generic campaign field definitions.
- All tests pass through `npm run verify`.

## 11. Out of Scope

Do not include:

- Chemical model cutover
- SDS cutover
- Site inventory
- Chemical use
- SEG redesign
- Exposure scenarios
- Exposure assessments
- Sampling
- Exchange conflict resolution
- Tauri removal
- Dashboard redesign
- Training
- Environmental modules
- Management of Change
- PSSR

## 12. Branch and Commit

Recommended branch:

```text
codex/foundation-domain-contracts
```

Recommended commit:

```text
feat(domain): add typed foundation entities and validation
```

---

# Part 2 — Typed Repositories and Services

## 1. Objective

Create dedicated typed repositories and application services for the foundation entities.

## 2. Files

```text
src/lib/data/repositories/foundation/
├── organization-repository.ts
├── person-repository.ts
├── location-repository.ts
├── process-repository.ts
├── task-repository.ts
└── index.ts
```

```text
src/lib/application/foundation/
├── organization-service.ts
├── person-service.ts
├── location-service.ts
├── process-service.ts
├── task-service.ts
└── index.ts
```

## 3. Repository Responsibilities

Repositories handle:

- Storage access
- Querying
- Expected-revision checks
- Atomic mutations
- Archive and restore
- Indexed lookup
- Repository-contract compliance

Repositories must not own:

- UI labels
- Route behavior
- Form state
- Domain-policy decisions
- Presentation formatting

## 4. Service Responsibilities

Services handle:

- Domain validation
- Relationship validation
- Hierarchy rules
- Site resolution
- Business-ID generation
- Domain-specific create and update commands
- Cross-record invariants
- Archive eligibility
- Restore eligibility

Suggested API:

```typescript
organizationService.create(...)
organizationService.update(...)
organizationService.archive(...)
organizationService.restore(...)

personService.create(...)
personService.assignOrganization(...)
personService.assignSupervisor(...)
personService.assignPrimarySite(...)

locationService.createCountry(...)
locationService.createStateOrRegion(...)
locationService.createSite(...)
locationService.createOperationalNode(...)
locationService.moveNode(...)
locationService.resolveSite(...)
locationService.listChildren(...)
locationService.listDescendants(...)

processService.create(...)
processService.moveToLocation(...)
processService.archive(...)

taskService.create(...)
taskService.changeOperatingCondition(...)
taskService.moveToProcess(...)
taskService.archive(...)
```

Do not expose raw IndexedDB store names throughout the UI.

## 5. Tests

Add service-level tests for:

- Domain validation invocation
- Repository transaction invocation
- Relationship lookup
- Archived dependency rejection
- Location move propagation
- Business-ID uniqueness
- Expected-revision handling
- Domain-error translation

## 6. Acceptance Criteria

- Each foundation entity has a typed repository.
- Each foundation entity has a typed service.
- UI code does not perform domain validation.
- UI code does not issue raw IndexedDB transactions.
- Repository-contract tests run against IndexedDB.
- `npm run verify` passes.

## 7. Commit

```text
feat(application): add typed foundation repositories and services
```

---

# Part 3 — Foundation Route Cutover

## 1. Objective

Move the following routes onto the new typed application services:

```text
/people/organizations
/people/workers
/operations/locations
/operations/processes
/operations/tasks
```

## 2. Required Screens

Each entity must support:

```text
List
Create
Detail
Edit
Archive
Restore
Search
Filter
Relationship context
Revision context
Error recovery
```

## 3. Required Application States

```text
Initializing database
Loading records
Empty dataset
Saving
Save succeeded
Save failed
Stale revision
Missing relationship
Archived relationship
Not found
Offline-ready
Database unavailable
```

## 4. Location UX

The Location workflow must support:

- Hierarchy tree
- Breadcrumb path
- Parent selection filtered by valid parent types
- Site-resolution display
- Child count
- Descendant count
- Move-node workflow
- Circular-move prevention
- Archived-node visibility
- Site-scoped filtering

A flat generic register table is not sufficient as the only Location interface.

## 5. Process and Task UX

Process detail should show:

- Site
- Location
- Tasks
- Equipment count
- Chemical-use count
- SEG count
- Exposure-scenario count
- Open findings
- Open actions

Task detail should show:

- Parent Process
- Location
- Operating condition
- Related equipment
- Chemical uses
- SEGs
- Exposure scenarios
- Hazards
- Controls

Some relationships may remain empty until later phases, but the relationship slots should be intentional and typed.

## 6. Critical Acceptance Criterion

After route cutover, creating or editing any of these five entity types must not touch:

- `localStorage`
- Legacy campaign persistence
- Rust or Tauri persistence
- `Record<string, unknown>` campaign operations
- Generic campaign-register definitions

## 7. Tests

Add route and component integration tests for:

- IndexedDB initialization
- List loading
- Empty states
- Create success
- Create validation failure
- Edit success
- Stale-revision conflict
- Archive and restore
- Missing dependency
- Archived dependency
- Location tree rendering
- Location move rejection
- Offline reload

## 8. Commit

```text
feat(ui): cut foundation workflows over to IndexedDB
```

---

# Part 4 — Enforce the Cutover

## 1. Objective

Prevent migrated foundation workflows from silently regressing to legacy persistence.

## 2. Changes

- Remove migrated collections from generic campaign creation.
- Mark migrated routes as typed routes.
- Add architecture tests prohibiting legacy imports.
- Add tests that fail if migrated screens call the legacy adapter.
- Add migration tests that load representative legacy foundation records into typed screens.
- Update the Phase 1 persistence status document.
- Update the reset backlog.
- Document remaining legacy modules.

## 3. Architecture Test

Add a test or static rule that rejects imports from legacy persistence within:

```text
src/lib/domain/foundation/**
src/lib/application/foundation/**
src/lib/data/repositories/foundation/**
src/routes/people/**
src/routes/operations/locations/**
src/routes/operations/processes/**
src/routes/operations/tasks/**
```

Prohibited imports should include:

```text
$lib/persistence/local-persistence
$lib/persistence/campaign-register.types
legacy campaign application adapters
Tauri persistence commands
```

## 4. Removal Gate

Do not remove Tauri, Rust, or the legacy reader until:

- Foundation routes are fully migrated.
- Representative legacy migration succeeds.
- Typed routes no longer depend on legacy storage.
- Backups are verified.
- Recovery behavior is tested.
- No required unmigrated data would become inaccessible.

## 5. Acceptance Criteria

- Migrated routes have no legacy dependencies.
- Architecture tests enforce the boundary.
- Representative migration fixtures render correctly in typed screens.
- Documentation accurately reports what remains.
- `npm run verify` passes.

## 6. Commit

```text
refactor: prohibit legacy persistence in foundation workflows
```

---

# 4. Definition of Done for the Campaign

The Foundation Application Cutover is complete only when:

- Organizations use typed domain models, repositories, and services.
- People use typed domain models, repositories, and services.
- Locations support the required hierarchy and site resolution.
- Processes resolve to valid Sites.
- Tasks belong to valid Processes.
- All five workflows operate exclusively on IndexedDB.
- All mutations create immutable revisions.
- Expected-revision concurrency is enforced.
- Archived relationships are handled deliberately.
- Legacy campaign operations cannot be called from migrated routes.
- Clean migration fixtures load into the new screens.
- `npm run verify` passes from a clean checkout.

A visually complete screen is not sufficient.

The campaign must prove:

```text
Correct domain model
+ correct persistence
+ correct relationships
+ correct failure behavior
+ correct migration behavior
+ enforceable architecture boundary
```

---

# 5. Work That Follows

After the foundation cutover, proceed in this order:

```text
Foundation cutover
    ↓
Canonical chemical, SDS, inventory, and chemical-use model
    ↓
SEG and effective-dated membership
    ↓
Exposure Scenario
    ↓
Exposure Assessment
    ↓
Exposure Determination
    ↓
Sampling workflow
    ↓
Reviewed two-device exchange
    ↓
Baseline field workflow
    ↓
Assurance and corrective-action loop
    ↓
Production hardening
```

Do not jump directly to broad exchange work, dashboard polish, training, or environmental modules before the typed foundation workflow is operating.

---

# 6. Immediate Next Commit

Start with:

```text
feat(domain): add typed foundation entities and validation
```

This is the next controlled implementation step.
