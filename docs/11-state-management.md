# 11 — State Management

Project: OLUSO  
Status: Draft  
Last Updated: 2026-07-06

---

## 1. Purpose

This document defines the state-management contract for OLUSO.

OLUSO is a local-first desktop application for structured HSE, environmental, and industrial hygiene work. Its value depends on durable records, clear workflow state, defensible traceability, and predictable user interaction. State management is therefore not only a frontend concern. It determines where application truth lives, how records change, how unsaved work is protected, how failures are surfaced, and how derived views remain consistent with source records.

This document answers:

- What types of state exist in OLUSO?
- Which layer owns each type of state?
- Which state is durable and which state is temporary?
- Which state belongs in the URL?
- Which state belongs in local persistence?
- Which state may live in shared stores?
- How should registers, records, forms, relationships, evidence, dashboards, and reports handle state?
- Which loading, error, saving, dirty, empty, and recovery states are required?
- What state-management anti-patterns must coding agents avoid?

This document does not define final database schema, final TypeScript interfaces, final state-management library, final validation library, final sync engine, final authentication behavior, final cloud architecture, or final desktop packaging behavior. Those decisions belong in later implementation documents, ADRs, or storage architecture documents.

---

## 2. Role in the Documentation Set

This document depends on:

- `00-project-brief.md`
- `01-product-vision.md`
- `02-information-architecture.md`
- `03-sidebar-navigation.md`
- `04-domain-model.md`
- `05-user-workflows.md`
- `06-design-principles.md`
- `07-build-plan.md`
- `08-scope-boundaries.md`
- `09-routing.md`
- `10-ui-architecture.md`

This document feeds:

- local data architecture
- storage and migration ADRs
- component specifications
- route implementation prompts
- page implementation prompts
- form implementation prompts
- test planning
- error-boundary behavior
- future sync/conflict-resolution design
- future import/export behavior

The routing document defines which screens exist and how users reach them. The UI architecture defines how those screens are structurally assembled. This document defines how those screens acquire, change, protect, and display state.

---

## 3. State Management Philosophy

OLUSO should use boring, explicit, layered state management.

Core doctrine:

> Local persistence owns durable HSE records. Routes own navigation identity. Query parameters own shareable register view state. Forms own unsaved edits. Narrow shared stores own shell and system state. Derived selectors own dashboards, counts, and reports. No global store may become a second database.

State management should support:

- local-first confidence
- stable records
- register-first workflows
- deep-linkable detail pages
- explicit form lifecycle state
- visible save and failure behavior
- traceable relationships
- defensible corrective-action state
- evidence-driven compliance support
- predictable dashboard/report projections
- testable domain operations

State management should avoid:

- one global mega-store
- hidden domain rules inside UI components
- mock data treated as persistence
- unsaved changes that can disappear silently
- reports that own source data
- corrective actions modeled as simple booleans
- per-page improvisation of loading/error/empty states
- derived values persisted as independent truth without justification
- stateful UI behavior that cannot be reconstructed after navigation

---

## 4. State Ownership Model

Every meaningful piece of OLUSO state must have an owner.

| State Type | Owner | Persistence | Examples |
|---|---|---:|---|
| Route state | Router / URL | URL | Current page, route ID, create/edit route |
| Query/view state | URL query parameters when shareable | URL | Search text, status filter, severity filter, sort |
| Durable domain state | Local database / repository layer | Local DB | Chemicals, locations, processes, hazards, actions |
| Relationship state | Repository/domain service layer | Local DB | Chemical-process links, action-source links |
| Form state | Form controller / page-level state | Temporary until saved | Dirty fields, validation errors, draft values |
| UI shell state | App shell store | Local preference when useful | Sidebar collapse, inspector open/closed |
| Async operation state | Data/action layer | Ephemeral | Loading, saving, failed read, failed write |
| Derived state | Selectors / computed helpers | Not persisted by default | Dashboard counts, filtered rows, report summaries |
| System state | System/local-first service | Local metadata | DB health, backup status, last saved indicator |
| Future sync state | Reserved sync service | Deferred | Last sync, conflict status, remote status |

Before implementing state, coding agents must answer:

1. Is this state durable or temporary?
2. Is this state part of navigation?
3. Should the user be able to reload and recover it?
4. Is this state source data or derived data?
5. Which layer validates changes?
6. What happens if the read or write fails?
7. What test proves the state behaves correctly?

If these questions cannot be answered, the implementation is under-scoped.

---

## 5. State Categories

### 5.1 Route State

Route state identifies where the user is and which durable record is being viewed or edited.

Examples:

```text
/operations/locations
/operations/locations/:id
/operations/locations/:id/edit
/chemicals/inventory/:id
/risk/hazards/:id
/actions/open/:id
```

Route state is the canonical source for current record identity. Detail pages must load records by route ID. Create routes should not pretend to have persisted IDs until the record is saved. Edit routes must handle missing, deleted, archived, or invalid records. Modal-only detail views are not acceptable for core records in the MVP.

### 5.2 Query and View State

Query and view state describes how a register, report, or list is currently being viewed.

Examples:

```text
?status=open
?severity=high
?location=:id
?chemical=:id
?q=solvent
?sort=lastUpdated.desc
?view=table
```

Use query parameters when state is useful after refresh, useful when copied as a link, useful for returning to a filtered register, meaningful to the user’s workflow, and not private or overly large.

Do not place full form drafts, sensitive notes, evidence metadata, large filter objects, local database connection state, unsaved record contents, or authorization decisions in query parameters.

### 5.3 Durable Domain State

Durable domain state is the source data OLUSO exists to preserve.

Examples include locations, processes, equipment, SEGs, chemicals, SDS records, exposure limits, hazards, risk assessments, controls, observations, inspections, audits, air sampling events, incidents, investigations, corrective actions, verification records, training records, permits, compliance calendar items, controlled documents, and evidence references.

Durable domain state belongs in local persistence, accessed through a data access layer or repository pattern. UI components must not be the source of truth for durable domain records.

Rules:

- Durable records must have stable IDs.
- Durable register entities must have status.
- Durable records should have created/updated metadata once persistence exists.
- Records that support audit readiness should eventually support history or change metadata.
- Archive/deactivate behavior should be preferred over destructive deletion for operational records.
- Domain records should be loaded through a consistent data layer, not scattered component logic.

### 5.4 Relationship State

Relationship state defines how records connect.

Examples:

```text
Chemical → Process
Chemical → Location
Process → Hazard
Process → SEG
Hazard → Control
Inspection → Finding
Finding → Corrective Action
Incident → Investigation
Corrective Action → Verification Record
Permit → Compliance Calendar Item
Document → Evidence Reference
```

Relationship state is durable when it supports traceability. Relationships should not exist only as labels, badges, or display text. They must be structured enough for navigation, filtering, reporting, and audit review.

A corrective action should retain its source once the corrective action system exists. Acceptable sources include hazard, risk assessment, observation, inspection, audit, air sampling event, incident, near miss, investigation, compliance calendar item, and management review.

### 5.5 Form State

Form state is temporary state created while the user is creating or editing a record.

Form state includes current field values, initial field values, dirty fields, touched fields, field-level validation errors, form-level validation summary, save attempt count, save status, draft status, cancel/discard state, and unsaved-change warning state.

Required form states:

```text
clean
modified
validating
invalid
saving
save_failed
saved
discarding
draft_saved
```

Draft behavior is strongly recommended for field observations, inspections, audits, incident intake, air sampling events, corrective action updates, chemical records with incomplete SDS context, and hazard records created from field findings. Draft does not mean valid, approved, verified, or compliant.

### 5.6 UI Shell State

UI shell state is application-chrome behavior that improves usability but is not domain source data.

Examples include sidebar collapsed/expanded state, expanded sidebar sections, inspector open/closed state, selected inspector tab, selected density preference if implemented, dismissed non-critical local notices, and last opened workspace section when useful.

UI shell state may live in narrow shared stores. It must not contain durable domain records, become a second navigation system, block access to critical record data, or make the inspector the only place where critical data exists.

### 5.7 Async Operation State

Async operation state describes a pending or completed read/write operation.

Examples include loading register rows, loading record detail, saving a form, archiving a record, linking two records, attaching evidence, exporting a report, running a migration, and backing up local data.

Required async states:

```text
idle
loading
success
empty
error
retrying
saving
save_failed
saved
```

A failed read must explain what failed, whether the failure affects one record or the whole page, what the user can try next, and whether local data may still be intact.

A failed write must not show saved state. It must preserve unsaved input when practical and support retry, clear error messaging, and no false audit confidence.

### 5.8 Derived State

Derived state is calculated from durable source records.

Examples include filtered register rows, visible row counts, dashboard counts, overdue action counts, high-risk hazard counts, missing SDS counts, compliance calendar summaries, generated report tables, export previews, and status summaries.

Source records own truth. Derived state must be reproducible and should not be persisted as independent truth unless there is a documented caching reason.

### 5.9 System and Local-First State

System state communicates local-first confidence and application health.

Examples include local database available/unavailable, migration required/failed, last successful write, last backup time, backup needed, export in progress, export failed, storage path unavailable, and missing attachment path.

Do not show saved unless local persistence confirms the write. Do not alarm the user merely because the app is local-only. Surface storage failures clearly and preserve recovery paths for read/write failure.

### 5.10 Future Sync State

Cloud sync, collaboration, and multi-device state are deferred unless later scope documents bring them into scope. The MVP must not fake sync.

Future sync state may eventually include last synced time, sync pending, sync failed, conflict detected, local-only change, remote update available, merge required, and user-resolved conflict.

---

## 6. Source-of-Truth Rules

| State | Source of Truth |
|---|---|
| Current route | Router / URL |
| Current record ID | Route param |
| Register filters | URL query params when shareable |
| Durable records | Local database |
| Record relationships | Local database/domain layer |
| Unsaved edits | Form controller/page state |
| Validation result | Validation layer/form controller |
| Sidebar collapse | Shell store/local preference |
| Dashboard counts | Derived selectors |
| Reports | Derived from source records |
| Local save status | Persistence/write operation result |
| Evidence file metadata | Local database/evidence repository |

A global store must not become a second database. Shared stores may hold shell state, system state, narrow cached query results when justified, active preference state, and notification state. Shared stores must not become the canonical owner of chemicals, processes, locations, equipment, SEGs, hazards, risk assessments, controls, incidents, corrective actions, compliance records, or evidence records.

---

## 7. Register State Pattern

A register is the canonical surface for finding, filtering, sorting, scanning, opening, and creating structured records.

Register state must support data loading, empty state, error state, filter state, search state, sort state, visible record count, create action state, selected row state when an inspector is used, row navigation state, and deferred feature state when a register is stubbed.

Conceptual pattern:

```ts
RegisterState<TRecord> = {
  records: TRecord[];
  query: string;
  filters: RegisterFilters;
  sort: RegisterSort;
  viewMode: 'table' | 'list';
  selectedRecordId?: string;
  loadState: 'idle' | 'loading' | 'success' | 'empty' | 'error';
  error?: RegisterError;
  visibleCount: number;
  totalCount: number;
};
```

Rules:

- Registers must load from the data layer.
- Register filters should be URL-backed when they represent meaningful workflow context.
- Empty state must distinguish “no records exist” from “no records match filters.”
- Error state must distinguish failed load from empty data.
- Selecting a row for inspector preview must not replace detail-page navigation.
- Row click behavior must be stable and deep-linkable.
- Register state must not mutate records directly without going through the domain/data layer.

A register page is not complete unless it handles default, loading, empty/no-records, empty/no-filter-results, error, filtered, sorted, row selected, record opened, and create requested states.

---

## 8. Record Detail State Pattern

A record detail page is the canonical surface for understanding one durable record.

Record detail state must support route ID extraction, record loading, missing-record state, archived/deactivated record state, record status display, relationship loading, evidence loading, open action summary, history/audit summary when available, edit navigation, and safe delete/archive behavior when in scope.

Conceptual pattern:

```ts
RecordDetailState<TRecord> = {
  id: string;
  record?: TRecord;
  loadState: 'idle' | 'loading' | 'success' | 'missing' | 'error';
  relationshipsState: AsyncState;
  evidenceState: AsyncState;
  historyState?: AsyncState;
  error?: RecordError;
};
```

Rules:

- Detail pages must load by route ID.
- Missing records must render a recovery state, not a broken component.
- Archived/inactive records must remain viewable where audit value exists.
- Detail pages should not depend on register memory to render.
- Refreshing a detail route must still load the record.
- Record tabs should not each invent independent source-of-truth behavior.

---

## 9. Create and Edit Form State Pattern

A create route starts with no durable record ID unless draft persistence is intentionally created. It must support initial empty values, defaults, validation, dirty state, save attempt, successful creation, failed creation, post-save navigation, and cancel/discard.

An edit route starts by loading an existing durable record. It must support loading original record, missing-record state, initial values from persisted record, dirty comparison, validation, save attempt, failed update, successful update, cancel/discard, and later concurrent-change behavior.

Conceptual pattern:

```ts
FormState<TValues> = {
  initialValues: TValues;
  currentValues: TValues;
  dirtyFields: string[];
  touchedFields: string[];
  validationState: 'idle' | 'validating' | 'valid' | 'invalid';
  errors: FieldErrors;
  formError?: string;
  saveState: 'idle' | 'saving' | 'saved' | 'failed';
  draftState?: 'none' | 'draft' | 'draft_saved' | 'draft_failed';
};
```

On save, the form must validate current values, show field-level errors if invalid, show form-level summary if needed, attempt write through the data/domain layer, show saving state during write, show saved state only after confirmed local persistence, preserve user input if write fails, and navigate only when the post-save route is clear.

Cancel behavior must be explicit. If the form is dirty, warn the user, allow continued editing, allow discard, and do not silently lose changes.

---

## 10. Relationship State Pattern

Relationship interactions include viewing linked records, adding a relationship, removing a relationship, changing relationship type, navigating to a related record, detecting missing related records, and displaying status/risk indicators for related records.

Conceptual pattern:

```ts
RelationshipState = {
  sourceId: string;
  sourceType: EntityType;
  relationships: Relationship[];
  loadState: AsyncState;
  linkState: 'idle' | 'linking' | 'linked' | 'failed';
  unlinkState: 'idle' | 'unlinking' | 'unlinked' | 'failed';
};
```

Rules:

- Relationship type must be explicit when meaning matters.
- Relationship deletion/removal must be safe and intentional.
- Relationship views must handle missing or archived related records.
- Relationship state must be testable without rendering the full page.
- Relationship traversal should use routes, not hidden component state.

---

## 11. Corrective Action Workflow State

Corrective actions require workflow state, not a boolean.

Corrective action state must preserve the difference between:

```text
Created → Assigned → In Progress → Completed → Verified → Closed
```

Completion means the assignee claims the work was done. Verification means a competent reviewer confirms the action was effective enough to close. Closure means the action is administratively closed with sufficient evidence or documented justification.

Recommended conceptual statuses:

```text
draft
created
assigned
in_progress
blocked
completed
verification_required
verified
closed
reopened
cancelled
```

Rules:

- Corrective actions should have a source.
- Source traceability must be preserved after creation.
- Completion must not automatically equal closure.
- Verification must be explicit when required.
- If verification is not required, the reason should be recorded.
- Reopened actions must preserve prior completion/verification history.
- Cancelled actions must preserve cancellation reason.
- Overdue state should be derived from due date and current status.

Do not model corrective actions as `completed: boolean` or `closed: boolean`.

---

## 12. Evidence and Attachment State

Evidence state represents files, photos, notes, references, or documents that support a record.

Evidence may support hazard identification, SDS review, inspection findings, audit findings, incident investigation, corrective action completion, corrective action verification, compliance requirement tracking, permit documentation, and training records.

Rules:

- Evidence metadata should be durable.
- Evidence must link to the record it supports.
- Evidence should have a type or category.
- Evidence should preserve enough context to be useful during review.
- Missing evidence files must produce a clear recovery state.
- Evidence upload/import must not display success until metadata and file reference are safely stored.
- Evidence should support later export/report workflows.

Conceptual pattern:

```ts
EvidenceState = {
  evidence: EvidenceReference[];
  loadState: AsyncState;
  attachState: 'idle' | 'attaching' | 'attached' | 'failed';
  removeState: 'idle' | 'removing' | 'removed' | 'failed';
  missingFiles: EvidenceReference[];
};
```

---

## 13. Dashboard and Report State

Dashboards and reports are projections over source records. They should not own primary source data in the MVP.

Dashboard state may include open corrective action count, overdue corrective action count, high-risk hazard count, missing SDS count, records needing review, recent field activity, and upcoming compliance items.

Report state may include selected report type, selected date range, selected filters, preview rows, export status, export error, and last generated time.

Rules:

- Do not build vanity dashboards over mock data.
- Do not persist report numbers as source truth unless caching is documented.
- Report filters should be explicit.
- Export state must distinguish generated, generating, failed, and stale output.
- Dashboard cards should link to the underlying records or filtered registers.

---

## 14. Loading, Empty, Error, and Recovery States

Every page must explicitly handle UX state.

Minimum accepted states:

```text
default
loading
empty
error
saving
saved
validation failure
unsaved changes
```

Pages without these states are implementation stubs, not finished UI.

Loading state should be scoped to the loading region, preserve app shell stability, avoid implying data loss, and avoid blocking unrelated navigation unnecessarily.

Empty state should explain what is missing, whether no records exist or filters returned no results, what action creates or reveals data, and whether the feature is intentionally deferred.

Error state should explain what failed, what data may be affected, what action the user can take, whether retry is possible, and whether unsaved work was preserved.

Recovery state should exist for missing record, deleted/archived record, failed read, failed write, missing attachment, failed export, migration failure, and local database unavailable.

---

## 15. Dirty State and Unsaved Change Protection

Unsaved work protection is non-negotiable.

Dirty state should be implemented for every meaningful create/edit form.

Rules:

- Dirty state must compare current values to initial or persisted values.
- Dirty state must survive ordinary field editing and validation cycles.
- Dirty state must trigger navigation protection when data loss is possible.
- Dirty state must clear only after save confirmation or deliberate discard.
- Dirty state must not clear merely because a save was attempted.
- Dirty state must not clear after failed save.

Navigation protection should apply when the user changes route, clicks breadcrumb navigation, uses sidebar navigation, closes an edit panel if one exists, or attempts cancel/discard.

---

## 16. Persistence Boundaries

Local persistence is the durable source of truth for OLUSO records.

The data layer should own loading records, creating records, updating records, archiving/deleting records, linking records, unlinking records, loading relationships, saving evidence metadata, running migrations, reporting write failures, and exposing typed errors.

The UI layer should own presenting data, collecting user input, showing validation errors, showing loading states, showing save states, showing recovery options, and triggering domain/data actions.

The domain/service layer should own business rules, status transitions, relationship rules, source-traceability rules, closure/verification rules, derived status helpers, and validation orchestration when domain-aware validation is needed.

---

## 17. Caching and Invalidation Rules

Caching may be useful, but it must not obscure the source of truth.

Potentially cacheable state includes register query results, dashboard summaries, report previews, lookup/reference data, recent records, and UI preferences.

Do not cache as independent truth active form values, corrective action status transitions, evidence linkage, verification records, compliance evidence status, or local save confirmation.

Cache or derived state should update when a source record is created, updated, archived, or deleted; when a relationship is added or removed; when evidence is attached or removed; when a corrective action status changes; or when a compliance date/status changes.

---

## 18. Anti-Patterns

| Severity | Anti-Pattern | Why It Is Unsafe or Brittle |
|---|---|---|
| Critical | Global mega-store owns all domain records | Creates hidden coupling, stale state, and a second database |
| Critical | Mock data treated as local-first persistence | Produces a polished but unusable shell |
| Critical | False saved state after failed write | Destroys trust and audit defensibility |
| Critical | Corrective actions modeled as simple booleans | Breaks completion, verification, closure, and reopening logic |
| High | Reports own source data | Creates conflicting truth between reports and records |
| High | Forms lack dirty/error/validation state | Causes silent data loss and bad records |
| High | Relationship links exist only as labels | Breaks traceability, navigation, and reporting |
| High | Components contain domain transition rules | Makes behavior hard to test and easy to duplicate incorrectly |
| Medium | Filters live only in component memory | User loses workflow context on refresh/navigation |
| Medium | Every page invents its own loading/error model | Creates inconsistent UX and agent drift |
| Medium | Dashboard built before real registers | Produces vanity UI over empty or fake data |
| Medium | Destructive deletes are easy and unrecoverable | Damages audit history and operational continuity |
| Low | Sidebar preference state is over-engineered | Adds complexity without improving core HSE workflow |

---

## 19. Testing Requirements

State management must be testable.

Tests should cover:

- route param loads correct record
- missing record renders recovery state
- register filters produce expected visible records
- query params hydrate register view state
- empty register differs from no filter results
- form dirty state turns on after edit
- dirty state does not clear after failed save
- save success only after confirmed write
- validation errors appear at field and form level
- corrective action status transitions are valid
- corrective action cannot close incorrectly when verification is required
- relationship creation preserves source and target IDs
- evidence attachment failure does not show success
- dashboard counts derive from source records
- report exports derive from selected source records and filters

Test levels:

| Test Type | Purpose |
|---|---|
| Unit tests | Validate selectors, helpers, and status transitions |
| Component tests | Validate UI behavior for states and interactions |
| Integration tests | Validate route to data layer to UI behavior |
| Persistence tests | Validate local reads/writes, failures, and migrations |
| Workflow tests | Validate full flows such as create hazard to create action to verify closure |

A page or workflow is not complete until its state transitions are tested or manually verified with documented acceptance criteria.

---

## 20. Implementation Guidance for Coding Agents

Coding agents must not improvise state architecture.

Before implementing a page, the prompt should identify:

1. Objective
2. Route ownership
3. Durable data required
4. Form state required
5. Query/view state required
6. Async states required
7. Error/recovery states required
8. Relationship state required
9. Persistence boundary
10. Tests and acceptance criteria

Coding agents must use the documented route contract, load durable records through the data layer, keep form state local to the form/page unless shared state is justified, use URL query params for meaningful register filters, avoid global stores for durable domain data, implement loading/empty/error/saving/saved/validation/dirty states, preserve user input on failed save when practical, make deferred features honest, and write or update tests for state transitions.

Coding agents must not hardcode mock records as persistence, create hidden page-level source-of-truth objects, bypass validation, mark data saved before persistence confirms it, invent status models outside the domain rules, create untraceable corrective actions, or make dashboard/report data manually entered source truth.

---

## 21. Recommended ADRs

This document intentionally does not select final tooling.

Recommended ADRs:

1. App framework state model
2. Local storage/database selection
3. Repository/data access pattern
4. Migration/versioning strategy
5. Form validation strategy
6. Status transition strategy
7. Evidence file storage/reference strategy
8. Backup/export strategy
9. Error handling and recovery strategy
10. Future sync readiness boundary

---

## 22. Acceptance Criteria

`11-state-management.md` is accepted when it provides enough direction for implementation agents to build pages without inventing state behavior.

Acceptance criteria:

- State categories are defined.
- State ownership is explicit.
- Durable records are assigned to local persistence.
- Route and query state boundaries are defined.
- Register state pattern is defined.
- Record detail state pattern is defined.
- Create/edit form state pattern is defined.
- Dirty state and unsaved-change behavior are defined.
- Relationship state rules are defined.
- Corrective action workflow state is defined.
- Evidence state rules are defined.
- Dashboard and report state boundaries are defined.
- Loading, empty, error, saving, saved, and recovery states are required.
- Anti-patterns are explicit.
- Testing requirements are defined.
- Tool/library selection is deferred to ADRs.

---

## 23. Open Questions

These questions should be resolved through ADRs or implementation planning:

1. What local database will OLUSO use?
2. Will persistence run in the frontend process, desktop backend, or a dedicated local service?
3. What migration/versioning strategy will be used?
4. What validation library or schema pattern will be used?
5. How will local backups be created, stored, restored, and verified?
6. How will evidence files be stored and referenced?
7. Will archived records remain visible in normal registers or require an archive filter?
8. How much record history is required in the MVP?
9. Should drafts be persisted for all forms or only field-heavy workflows?
10. How should future sync readiness influence ID generation and change metadata?

---

## 24. Final Rule

OLUSO state management must protect the integrity of HSE work.

A page is not finished because it renders data. A page is finished when it can load, create, edit, validate, save, fail safely, recover, preserve traceability, and prove where its truth lives.

