# 07 — Build Plan

Project: OLUSO  
Status: Draft  
Last Updated: 2026-07-05  

---

## 1. Purpose

This document defines the build sequence for OLUSO.

OLUSO is a local-first desktop application for managing health, safety, environmental, and industrial hygiene information as structured, field-usable, audit-aware records. The build plan translates the product brief, product vision, information architecture, sidebar navigation, domain model, user workflows, and design principles into an implementation order.

This document answers:

- What should be built first?
- What should be deferred?
- What must exist before a module is considered complete?
- How should implementation work be divided for coding agents?
- What verification gates prevent a polished but non-functional shell?
- Where is the MVP cut line?

This document does **not** define:

- Final database schema
- Final TypeScript interfaces
- Final route file structure
- Final component implementation
- Final state-management library
- Final desktop packaging decision
- Final cloud, sync, or collaboration architecture

Those decisions belong in later documents and ADRs, especially:

- `09-routing.md`
- `10-ui-architecture.md`
- `11-state-management.md`
- `docs/adr/`
- Future data/storage architecture documentation

---

## 2. Alignment With Existing Documentation

The build plan must remain consistent with the rest of the OLUSO documentation set.

### 2.1 Product Brief Alignment

The product brief defines OLUSO as a local-first desktop application for structured HSE and industrial hygiene work. It is not a generic note-taking app, spreadsheet replacement, enterprise EHS suite, document dump, or AI-first product.

The build must therefore prioritize:

- Local persistence
- Durable registers
- Record traceability
- Field-usable workflows
- Corrective action follow-through
- Compliance-supporting evidence
- Simple reporting/export

### 2.2 Product Vision Alignment

The product vision states that OLUSO should turn real workplace conditions into structured, searchable, auditable safety intelligence.

The build must therefore avoid:

- Dashboard-first development
- Cosmetic shells without working records
- Disconnected pages
- Generic table grids with no domain behavior
- Compliance labels that imply legal certainty
- AI workflows before the core system exists

### 2.3 Sidebar Alignment

The sidebar defines the major product areas:

- Dashboard
- Operations
- Chemical Safety
- Risk Management
- Field Work
- Incidents
- Corrective Actions
- Compliance
- Reports

The build should respect this structure but should **not** build every sidebar page as an empty page first. Sidebar destinations may be stubbed early, but real development should proceed by vertical slices.

### 2.4 Domain Model Alignment

The domain model defines key implementation truths:

- Registers track durable operational objects.
- Records capture events, findings, evidence, or changes.
- Core entities must be linkable.
- Corrective actions require source traceability.
- Closure requires verification when verification is required.
- Compliance is evidence-driven.
- Reports are projections over existing data until saved reports are justified.

These rules are build constraints, not suggestions.

### 2.5 Workflow Alignment

The preferred workflow spine is:

```text
Operational Context
  → Chemical / Process / SEG Context
  → Hazard Identification
  → Risk Assessment
  → Control Identification
  → Field Finding / Incident / Audit Finding
  → Corrective Action
  → Verification
  → Closure
  → Report / Review Output
```

The build plan follows this spine. It builds the operational backbone before field activity, incidents, compliance automation, or reporting.

### 2.6 Design Principles Alignment

The interface must feel calm, dense, traceable, fast, local, and defensible.

The build must support:

- Register discipline
- Traceability at a glance
- Status over decoration
- Forms that tolerate imperfect field reality
- Desktop-first interaction patterns
- Exportable audit-ready records

A feature is not done because it looks finished. It is done when the user can create, review, link, filter, preserve, and verify the record it claims to support.

---

## 3. Build Strategy

OLUSO should be built using **vertical slices**, not page batches.

A page batch means:

```text
Build all sidebar pages first.
```

That approach is weak. It creates a visually complete app with no operational depth.

A vertical slice means:

```text
Build one domain workflow from route to UI to local persistence to validation to relationships to tests.
```

Each build slice should include:

- Route entry point
- Register/list view
- Create flow
- Detail view
- Edit flow
- Status model
- Validation rules
- Empty state
- Error state
- Search/filter behavior where applicable
- Local persistence
- Seed data
- Linked-record behavior where applicable
- Tests
- Acceptance criteria

The correct build sequence is:

1. Establish the app shell and local data foundation.
2. Build operational context.
3. Build chemical safety context.
4. Build hazard/control context.
5. Build corrective action traceability.
6. Build field records that generate evidence and actions.
7. Build incident records.
8. Build compliance-supporting records.
9. Build reports and exports from real data.
10. Harden, test, package, and document.

---

## 4. Non-Negotiable Build Rules

### 4.1 No Orphaned Domain Pages

A navigable page must eventually own a real register, record set, or report view. Do not create dead pages that exist only because the sidebar has a destination.

### 4.2 No Domain Entity Without Status

Every durable register entity must support a status model.

Examples:

- Draft
- Active
- Under Review
- Inactive
- Retired
- Archived

Event records may use a different status model, but they still need explicit state.

### 4.3 No Corrective Action Without Source

A corrective action must retain its source once the corrective action system exists.

Acceptable sources include:

- Hazard
- Risk assessment
- Observation
- Inspection
- Audit
- Air sampling event
- Incident
- Near miss
- Investigation
- Compliance calendar item
- Management review

Manual standalone actions may be allowed later, but the MVP should make source traceability the default behavior.

### 4.4 Completion and Verification Must Stay Separate

A completed action is not automatically verified.

The build must preserve the difference between:

```text
Created → Assigned → In Progress → Completed → Verified → Closed
```

If verification is not required, that should be recorded as a deliberate justification, not silently skipped.

### 4.5 Reports Do Not Own Source Data

Reports are projections. Registers and records own source data.

Do not build reports as separate manual data-entry areas in the MVP.

### 4.6 Local-First Means Real Persistence

Local-first cannot mean mock data forever.

By the time Phase 2 begins, OLUSO needs durable local storage, migrations or schema versioning, backup/export thinking, and recovery behavior for failed reads/writes.

### 4.7 Compliance Support Is Not Legal Determination

Compliance features may track requirements, due dates, evidence, review status, and document links. They must not imply that a record is legally compliant merely because it exists.

### 4.8 MVP Means Field-Usable, Not Feature-Complete

The MVP must support real HSE work at a basic level. It does not need advanced analytics, AI, sync, mobile capture, multi-user permissions, or enterprise workflow automation.

---

## 5. Phase Overview

| Phase | Name | Objective | MVP Required |
|---|---|---|---|
| 0 | Project Foundation | Establish repo structure, tooling, quality gates, and execution standards. | Yes |
| 1 | App Shell + Navigation | Build the desktop-first shell, sidebar, routing stubs, and base layout. | Yes |
| 2 | Local Data Foundation | Build local persistence, domain primitives, seed data, and shared data access patterns. | Yes |
| 3 | Operations Core | Build Locations, Processes, Equipment, and SEGs as linked operational registers. | Yes |
| 4 | Chemical Safety Core | Build Chemical Inventory, SDS references, exposure limits, and chemical-use context. | Yes |
| 5 | Risk Management Core | Build Hazard Register, Controls, and basic risk assessments. | Yes |
| 6 | Corrective Action Loop | Build action creation, assignment, due dates, completion, verification, and closure. | Yes |
| 7 | Field Work Core | Build observations, inspections, audits, and air sampling event records. | Partial |
| 8 | Incident Core | Build near miss, incident, and investigation records. | Partial |
| 9 | Compliance Support | Build training, permits, calendar items, and controlled documents at register level. | Partial |
| 10 | Reports + Export | Build generated summaries and exportable register/report views. | Yes, basic |
| 11 | Hardening + Packaging | Test, polish, package, back up, recover, and prepare for daily use. | Yes |

---

## 6. Phase 0 — Project Foundation

### Objective

Establish the engineering foundation before domain features are built.

### Scope

- Repository structure
- App framework baseline
- Desktop packaging baseline, if applicable
- Linting
- Formatting
- Type checking
- Test runner
- Basic CI or local verification script
- Environment configuration
- Documentation conventions
- Agent execution conventions
- ADR folder and first architecture decision records

### Required ADRs Before Completion

At minimum, Phase 0 should produce ADRs for:

- App framework
- Desktop wrapper or packaging approach
- Local storage approach
- Test strategy
- Data migration/versioning approach

### Acceptance Criteria

- App can be installed or run locally in development mode.
- The project has a repeatable command for checking quality.
- The project has a repeatable command for running tests.
- The codebase has clear folder boundaries.
- New features have an obvious place to live.
- Architecture decisions are documented before major irreversible implementation choices.

### Dependencies

- Product brief
- Product vision
- Existing documentation tree

### Risks

| Severity | Risk | Mitigation |
|---|---|---|
| Critical | Stack decisions are made implicitly by the first code commit. | Require ADRs for framework, storage, and packaging. |
| High | Project structure becomes agent-hostile. | Keep folder boundaries explicit and document execution rules. |
| Medium | Tests are deferred until after the MVP. | Add test runner and smoke test before feature work. |
| Medium | Formatting and linting become inconsistent. | Add automated commands from the start. |

### Verification

Run the foundation verification command and confirm:

- App starts.
- Type checks pass.
- Lint passes.
- Smoke test passes.
- Documentation references are present.

---

## 7. Phase 1 — App Shell + Navigation

### Objective

Build the stable desktop-first shell and primary navigation structure.

### Scope

- App frame
- Primary sidebar
- Route structure based on documented sidebar destinations
- Dashboard placeholder
- Section/page placeholders for documented destinations
- Active route indication
- Collapsible sidebar groups
- Empty states for unimplemented pages
- Base layout primitives
- Error boundary or fallback view
- Global app chrome

### Included Sidebar Areas

- Dashboard
- Operations
- Chemical Safety
- Risk Management
- Field Work
- Incidents
- Corrective Actions
- Compliance
- Reports

### Acceptance Criteria

- User can navigate to every documented sidebar destination.
- Current route is visually clear.
- Sidebar groups expand and collapse predictably.
- Placeholder pages clearly state that the module is not yet implemented.
- No placeholder page pretends to be functional.
- Shell supports a desktop-first layout.
- Basic error fallback exists.

### Dependencies

- `03-sidebar-navigation.md`
- Future `09-routing.md` should refine this phase before implementation begins.

### Risks

| Severity | Risk | Mitigation |
|---|---|---|
| High | The app becomes a polished shell with no domain depth. | Treat this phase as infrastructure only; do not overbuild dashboard visuals. |
| Medium | Routes diverge from sidebar documentation. | Use sidebar documentation as the route contract until `09-routing.md` supersedes it. |
| Medium | Layout choices become hard to change. | Keep layout primitives simple and avoid premature abstraction. |

### Verification

- Navigate through every route manually.
- Confirm active route state.
- Confirm placeholder language is honest.
- Confirm the shell remains usable at expected desktop window sizes.

---

## 8. Phase 2 — Local Data Foundation

### Objective

Build the local persistence and domain primitives required before real registers are implemented.

### Scope

- Local database or storage layer
- Schema/migration approach
- Repository or service layer
- Domain ID strategy
- Timestamps
- Status fields
- Created/updated metadata
- Soft delete or archival approach
- Seed data
- Basic search helpers
- Basic validation helpers
- Error handling for failed reads/writes
- Export/backup placeholder strategy

### Domain Primitives

Create shared primitives for:

- Record ID
- Status
- Owner/person label
- Source reference
- Linked record reference
- Evidence reference
- Review state
- Date/due date
- Notes
- Tags, if justified

### Acceptance Criteria

- Data persists after app restart.
- Seed data can be loaded safely.
- Records support created/updated timestamps.
- Records can be archived or status-changed without destructive deletion.
- Read/write failures produce visible, recoverable errors.
- The data layer can support linked records.
- Data access is not scattered directly through UI components.

### Dependencies

- Phase 0
- Phase 1
- Storage ADR

### Risks

| Severity | Risk | Mitigation |
|---|---|---|
| Critical | Data model is hardcoded into UI components. | Use a repository/service boundary. |
| Critical | No migration/versioning plan exists. | Add schema versioning before domain records grow. |
| High | Links are treated as display-only text. | Model linked-record references explicitly. |
| High | Destructive deletion loses audit-relevant records. | Use archive/status by default. |
| Medium | Seed data contaminates production data. | Keep seed loading explicit and reversible. |

### Verification

- Create a seed record.
- Restart the app.
- Confirm the record persists.
- Archive the record.
- Confirm archived records are not treated as active.
- Simulate a read/write error and confirm the UI does not silently fail.

---

## 9. Phase 3 — Operations Core

### Objective

Build the operational backbone of OLUSO: Locations, Processes, Equipment, and SEGs.

### Scope

- Location Register
- Process Register
- Equipment Register
- SEG Register
- Create/edit/detail flows for each register
- Status handling
- Search and filtering
- Location-to-process links
- Equipment-to-location links
- Equipment-to-process links
- SEG-to-location links
- SEG-to-process links
- Draft/active/under-review states
- Relationship panels
- Seed data for a realistic industrial site

### Minimum Fields

#### Location

- Name
- Type
- Description
- Parent location
- Status
- Notes

#### Process

- Name
- Description
- Process type
- Location(s)
- Associated equipment
- Associated SEGs
- Status
- Notes

#### Equipment

- Name
- Equipment type
- Location
- Related process
- Description
- Status
- Notes

#### SEG

- Name
- Description
- Worker role/group
- Associated locations
- Associated processes
- Exposure concerns
- Status
- Notes

### Acceptance Criteria

- User can create, edit, view, filter, and archive Locations.
- User can create, edit, view, filter, and archive Processes.
- User can create, edit, view, filter, and archive Equipment.
- User can create, edit, view, filter, and archive SEGs.
- Processes can link to Locations.
- Equipment can link to Locations and optionally Processes.
- SEGs can link to Locations and/or Processes.
- Detail views show related records.
- Later modules can reference Operations records.

### Dependencies

- Phase 2
- Domain model Operations section
- User Workflow 1 — Build Operational Context

### Risks

| Severity | Risk | Mitigation |
|---|---|---|
| Critical | Later hazards, chemicals, inspections, and incidents have nowhere to anchor. | Complete Operations before downstream HSE records. |
| High | SEGs become vague labels. | Require worker role/group and associated process/location for Active status. |
| High | Processes are created without location context. | Require location linkage before Active status. |
| Medium | Duplicate locations/processes create messy reporting. | Add search-before-create and later duplicate warnings. |
| Medium | Equipment becomes asset management bloat. | Track only equipment relevant to hazards, controls, inspections, or incidents. |

### Verification

- Create a location.
- Create a process linked to that location.
- Create equipment linked to the location and process.
- Create an SEG linked to the process.
- Confirm each detail view shows backlinks.
- Confirm the records are available to later modules as selectable references.

---

## 10. Phase 4 — Chemical Safety Core

### Objective

Build the chemical safety context: chemical inventory, SDS references, exposure limits, and chemical-use relationships.

### Scope

- Chemical Inventory
- SDS Library / SDS reference records
- Exposure Limits
- Chemical Use context
- Chemical storage/use locations
- Chemical-to-process links
- Chemical-to-SEG links where known
- Chemical-to-hazard links where known
- Missing SDS state
- Under-review chemical state
- Search/filter by chemical name, manufacturer, state, hazard, location, process, SDS status

### Minimum Fields

#### Chemical

- Name
- Synonyms
- CAS number, if applicable
- Manufacturer/supplier
- Chemical type
- Physical state
- Primary hazards
- SDS status
- Storage locations
- Use locations/processes
- Status
- Notes

#### SDS

- Chemical
- SDS title
- Manufacturer/supplier
- Revision date
- File/document reference
- Review status
- Notes

#### Exposure Limit

- Chemical or contaminant
- Limit type
- Value
- Units
- Averaging period
- Source
- Notes

#### Chemical Use

- Chemical
- Process
- Location
- Use description
- Exposure potential
- Related SEG(s)
- Notes

### Acceptance Criteria

- User can create and manage Chemical records.
- User can mark SDS status explicitly.
- User can create or link SDS references.
- User can create exposure limits with units, averaging period, and source.
- User can link chemicals to storage locations.
- User can link chemicals to use processes.
- User can distinguish chemical identity from chemical use context.
- User can filter chemicals by SDS status and active/inactive state.
- Missing SDS is visible as a status/flag, not buried in notes.

### Dependencies

- Phase 3
- Domain model Chemical Safety section
- User Workflow 2 — Maintain Chemical Safety Context

### Risks

| Severity | Risk | Mitigation |
|---|---|---|
| Critical | Active chemicals have unknown SDS status. | Require SDS status before Active status. |
| High | Chemical use is not separated from chemical identity. | Model chemical use as process/location context. |
| High | Exposure limits lack source or units. | Require source, units, and averaging period. |
| Medium | SDS Library becomes an unmanaged file dump. | SDS records must link to chemicals and revision/review status. |
| Medium | Chemical hazard data becomes overcomplicated too early. | Capture primary hazards first; defer full classification engines. |

### Verification

- Create an active chemical with known SDS status.
- Create another chemical with missing SDS.
- Link a chemical to a storage location.
- Link a chemical to a process.
- Add an exposure limit with units, averaging period, and source.
- Confirm chemical detail view shows SDS, exposure limits, locations, processes, and related hazards.

---

## 11. Phase 5 — Risk Management Core

### Objective

Build the hazard/control backbone: Hazard Register, Controls, and basic Risk Assessments.

### Scope

- Hazard Register
- Control Register
- Basic Risk Assessment records
- Hazard-to-location links
- Hazard-to-process links
- Hazard-to-equipment links
- Hazard-to-SEG links
- Hazard-to-chemical links
- Hazard-to-control links
- Risk severity/likelihood fields
- Review status
- Risk owner field
- Verification requirement flag for controls/actions

### Minimum Fields

#### Hazard

- Name
- Hazard type
- Description
- Severity
- Likelihood or exposure potential
- Associated location(s)
- Associated process(es)
- Associated equipment
- Associated chemical(s)
- Associated SEG(s)
- Existing controls
- Status
- Review state
- Notes

#### Control

- Name
- Control type
- Description
- Controlled hazard(s)
- Related location/process/equipment/chemical, where applicable
- Verification method
- Verification frequency, if applicable
- Status
- Notes

#### Risk Assessment

- Assessment title
- Scope
- Related hazard(s)
- Related process/location/task
- Initial risk
- Existing controls
- Residual risk
- Review status
- Notes

### Acceptance Criteria

- User can create, edit, view, filter, and archive hazards.
- User can link hazards to operational and chemical context.
- User can create and manage controls.
- User can link controls to hazards.
- User can create basic risk assessments.
- Risk assessments can reference hazards, controls, and operational context.
- Hazard detail views show linked controls, actions, incidents, and field records when available.
- Records distinguish Draft, Active, Under Review, Retired, and Archived states.

### Dependencies

- Phase 3
- Phase 4
- Domain model Risk Management section
- User Workflow 3 — Identify and Manage Hazards
- User Workflow 4 — Assess Risk and Controls

### Risks

| Severity | Risk | Mitigation |
|---|---|---|
| Critical | Hazards are entered as freeform notes. | Require structured fields and linked context. |
| High | Controls exist without verification expectations. | Add verification method/frequency fields where applicable. |
| High | Risk ratings become decorative. | Tie risk fields to review and filtering behavior. |
| Medium | Risk assessment becomes overbuilt before MVP. | Keep risk assessment basic and traceable. |
| Medium | Hazard categories become too rigid. | Use controlled options but allow notes/unknown states. |

### Verification

- Create a hazard linked to a process and SEG.
- Link the hazard to a chemical.
- Create a control for the hazard.
- Create a basic risk assessment using the hazard and control.
- Confirm the hazard detail view shows all linked records.
- Confirm the hazard can later generate a corrective action.

---

## 12. Phase 6 — Corrective Action Loop

### Objective

Build the accountability loop that turns findings, hazards, incidents, and compliance items into assigned, tracked, verified work.

### Scope

- Corrective Action Register
- Open Actions view
- Verification view
- Closed Actions view
- Source reference model
- Assignment/owner field
- Due date
- Priority or severity
- Status workflow
- Completion record
- Verification record
- Closure record
- Evidence reference
- Overdue state
- Filters by status, owner, source, due date, severity, verification state

### Corrective Action Status Model

```text
Created → Assigned → In Progress → Completed → Verified → Closed
```

Additional allowed states:

- Canceled
- Deferred
- Reopened
- Blocked

### Minimum Fields

#### Corrective Action

- Title
- Description
- Source record
- Source type
- Owner/assignee
- Due date
- Priority/severity
- Status
- Completion summary
- Verification required
- Verification method
- Verification result
- Closure summary
- Evidence references
- Notes

### Acceptance Criteria

- User can create a corrective action from a source record.
- User can create a manual corrective action only if manual source/judgment is explicitly recorded.
- User can assign an owner label.
- User can set due date and priority/severity.
- User can move an action through the status model.
- Completed actions do not automatically become verified.
- Verified actions can be closed.
- Overdue actions are visibly flagged.
- Closed actions retain source traceability.
- Reopened actions preserve previous closure/verification history.

### Dependencies

- Phase 5
- Domain model Corrective Actions section
- User Workflow 7 — Create and Track Corrective Actions

### Risks

| Severity | Risk | Mitigation |
|---|---|---|
| Critical | Corrective actions become orphaned to-do items. | Require source references or explicit manual source justification. |
| Critical | Closure becomes a checkbox. | Separate Completed, Verified, and Closed. |
| High | Evidence is optional when verification is required. | Add missing evidence state and verification notes. |
| High | Overdue work is not visible. | Add due-date filtering and overdue indicators. |
| Medium | Owner field implies multi-user auth too early. | Treat owner as domain data, not identity/permissions. |

### Verification

- Create a corrective action from a hazard.
- Assign an owner and due date.
- Mark it In Progress.
- Mark it Completed.
- Confirm it appears in Verification, not Closed.
- Add verification result and evidence.
- Close the action.
- Trace the closed action back to the originating hazard.

---

## 13. Phase 7 — Field Work Core

### Objective

Build field activity records that capture observations, inspections, audits, and air sampling events.

### Scope

- Observations
- Inspections
- Audits
- Air Sampling Events
- Field finding records
- Links to locations, processes, equipment, chemicals, hazards, controls, and SEGs
- Evidence references
- Draft records
- Follow-up flags
- Corrective action creation from findings
- Review status

### MVP Cut

For MVP, build:

- Observations
- Basic Inspections
- Basic Audit/Finding record
- Basic Air Sampling Event shell

Defer advanced sampling calculations, chain-of-custody workflows, lab result imports, calibration management, and full audit program management.

### Minimum Fields

#### Observation

- Title
- Observation date
- Location
- Process/equipment, if applicable
- Description
- Related hazard/control, if known
- Severity or concern level
- Follow-up required
- Evidence references
- Status

#### Inspection

- Inspection title
- Date
- Location/process/equipment scope
- Inspector label
- Findings
- Related hazards/controls
- Corrective actions
- Status

#### Audit

- Audit title
- Scope
- Date
- Criteria/source
- Findings
- Related records
- Corrective actions
- Status

#### Air Sampling Event

- Sampling date
- SEG/person/task context
- Chemical/contaminant
- Location/process
- Sampling type
- Result placeholder
- Exposure limit reference
- Notes
- Status

### Acceptance Criteria

- User can create an observation with imperfect information.
- User can link field records to operational context.
- User can link field records to hazards or controls when known.
- User can create corrective actions from field findings.
- Field records preserve evidence references.
- Field records can remain Draft or Under Review.
- Air sampling event exists as a structured record even if advanced calculations are deferred.

### Dependencies

- Phase 3
- Phase 4
- Phase 5
- Phase 6
- User Workflow 5 — Capture Field Work
- User Workflow 6 — Create Findings From Field Work

### Risks

| Severity | Risk | Mitigation |
|---|---|---|
| High | Field Work becomes a dumping ground for notes. | Require structured record types and links where applicable. |
| High | Field findings do not generate follow-up. | Add corrective action creation from findings. |
| Medium | Air sampling is overbuilt too early. | Start with event records and defer calculations/imports. |
| Medium | Evidence attachments become unmanaged files. | Use evidence references first; defer complex document management. |

### Verification

- Create an observation linked to a location.
- Link it to a hazard.
- Add evidence reference.
- Create a corrective action from the observation.
- Confirm the action links back to the observation.
- Create a basic air sampling event linked to an SEG and chemical.

---

## 14. Phase 8 — Incident Core

### Objective

Build basic incident and near-miss records that preserve event context, investigation notes, causes, evidence, and corrective actions.

### Scope

- Near Miss Log
- Incident Log
- Investigation records
- Event classification
- Operational context links
- Chemical/equipment/process links
- Cause notes
- Evidence references
- Corrective action creation
- Regulatory reporting status placeholder

### MVP Cut

For MVP, build basic records only.

Defer:

- OSHA log automation
- Environmental release calculations
- Formal root-cause tools beyond simple cause fields
- Automatic regulatory reportability decisions
- Claims/workers’ compensation workflows
- Multi-person investigation workflows

### Minimum Fields

#### Near Miss

- Title
- Date/time
- Location
- Process/equipment/chemical, if applicable
- Description
- Potential outcome
- Related hazards/controls
- Corrective actions
- Status

#### Incident

- Title
- Date/time
- Location
- Event type
- Actual outcome
- Description
- Related process/equipment/chemical
- Related hazards/controls
- Immediate actions taken
- Corrective actions
- Reporting status
- Status

#### Investigation

- Related incident/near miss
- Investigation date
- Summary
- Immediate cause(s)
- Root/contributing cause(s)
- Evidence references
- Corrective actions
- Review status

### Acceptance Criteria

- User can create near miss and incident records.
- User can link incidents to location, process, equipment, chemical, hazard, and controls where applicable.
- User can create an investigation record from an incident.
- User can create corrective actions from an incident or investigation.
- Regulatory reporting status exists as a field, but the app does not make legal determinations.
- Incident records preserve source-to-action traceability.

### Dependencies

- Phase 3
- Phase 4
- Phase 5
- Phase 6
- User Workflow 8 — Capture Incident or Near Miss

### Risks

| Severity | Risk | Mitigation |
|---|---|---|
| Critical | App implies legal reportability decisions. | Use reporting status fields, not automated legal conclusions. |
| High | Incident records become narrative-only. | Require structured links and corrective actions. |
| High | Investigation findings do not connect to actions. | Support action creation from investigation findings. |
| Medium | Root-cause tooling is overbuilt. | Start with simple cause fields; defer advanced methods. |

### Verification

- Create a near miss linked to a location and process.
- Create an incident linked to equipment and chemical context.
- Create an investigation from the incident.
- Create a corrective action from the investigation.
- Confirm traceability from corrective action back to investigation and incident.

---

## 15. Phase 9 — Compliance Support

### Objective

Build basic compliance-supporting registers without pretending OLUSO guarantees compliance.

### Scope

- Training Register
- Permit Register
- Regulatory Calendar
- Controlled Documents
- Requirement source field
- Due dates
- Owners
- Review status
- Evidence references
- Related actions
- Related records

### MVP Cut

For MVP, compliance support should be register-based and manually maintained.

Defer:

- Regulatory interpretation engine
- Automatic OSHA/EPA applicability decisions
- Full LMS behavior
- Full document control workflow
- Electronic signatures
- Retention automation
- Agency submission automation

### Minimum Fields

#### Training

- Training title
- Requirement source
- Audience/role/SEG
- Due date or recurrence
- Completion status
- Evidence reference
- Review status

#### Permit

- Permit title
- Permit type
- Requirement/source
- Location/process/equipment, if applicable
- Issue date
- Expiration date
- Owner
- Status
- Evidence/document reference

#### Regulatory Calendar Item

- Title
- Requirement/source
- Due date
- Recurrence, if applicable
- Owner
- Status
- Evidence required
- Related records/actions

#### Controlled Document

- Title
- Document type
- Owner
- Revision/date
- Review date
- Status
- File/reference
- Related requirements/records

### Acceptance Criteria

- User can create compliance-supporting records.
- Records require source/context fields where applicable.
- Due dates and review states are visible.
- Evidence references can be attached or linked.
- Compliance items can create corrective actions or follow-up tasks.
- The UI does not claim that a record is legally compliant by default.

### Dependencies

- Phase 2
- Phase 3
- Phase 6
- User Workflow 9 — Track Compliance-Supporting Records

### Risks

| Severity | Risk | Mitigation |
|---|---|---|
| Critical | App overclaims legal compliance. | Use requirement/evidence/review language instead of compliance guarantees. |
| High | Compliance becomes a vague document folder. | Require structured records and source fields. |
| High | Calendar tasks do not preserve evidence. | Add evidence required/status fields. |
| Medium | Training becomes LMS scope creep. | Track records only; defer LMS behavior. |

### Verification

- Create a permit record with expiration date and source.
- Create a regulatory calendar item with due date and owner.
- Add evidence reference.
- Create a follow-up action from a calendar item.
- Confirm reports can show upcoming/overdue compliance-supporting items.

---

## 16. Phase 10 — Reports + Export

### Objective

Build basic reporting and export views from source records.

### Scope

- Dashboard summary cards from real records
- Open actions report
- Overdue actions report
- Missing SDS report
- Hazard register export
- Chemical inventory export
- Corrective action log export
- Compliance due/overdue report
- Basic CSV or printable export
- Report filters

### Report Principle

Reports should not become primary data-entry areas.

A report should answer:

- What is open?
- What is overdue?
- What is missing evidence?
- What needs review?
- What high-risk items exist?
- What records support audit preparation?

### MVP Report Set

MVP should include:

- Open Corrective Actions
- Overdue Corrective Actions
- Missing SDS / SDS Under Review
- Active Hazard Register
- Chemical Inventory
- Upcoming Compliance Items
- Records Missing Evidence

### Acceptance Criteria

- Reports are generated from source records.
- User can filter reports by status, date, owner, area, and severity where applicable.
- User can export core registers or reports.
- Exported records include enough context for review.
- Dashboard only summarizes; it does not replace registers.

### Dependencies

- Phases 3–9, depending on report type
- Design principles for audit readiness and export

### Risks

| Severity | Risk | Mitigation |
|---|---|---|
| High | Dashboard becomes vanity-first. | Use dashboard only for actionable summaries. |
| High | Reports duplicate source data. | Generate reports from registers and records. |
| Medium | Exports omit traceability fields. | Include IDs, statuses, dates, owners, source links, and evidence references. |
| Medium | Report scope grows endlessly. | Limit MVP reports to action, hazard, chemical, compliance, and evidence gaps. |

### Verification

- Create records across Operations, Chemical Safety, Risk, Actions, and Compliance.
- Generate MVP report views.
- Export at least one register.
- Confirm exported fields preserve status, owner, due date, source, and evidence references where applicable.

---

## 17. Phase 11 — Hardening + Packaging

### Objective

Make OLUSO reliable enough for daily local use.

### Scope

- End-to-end workflow tests
- Data persistence tests
- Migration tests
- Error-state tests
- Empty-state review
- Accessibility pass
- Keyboard navigation pass
- Performance pass for large registers
- Backup/export review
- Desktop packaging
- Basic release notes
- User-facing limitations
- Known issues list

### Acceptance Criteria

- App can be installed or launched consistently.
- Core workflows pass end-to-end tests.
- Data survives restart.
- Data migrations do not destroy existing records.
- Large register views remain usable.
- Error states are visible and recoverable.
- Empty states explain what to do next.
- User can export critical records.
- Known limitations are documented.

### Dependencies

- All MVP-required phases

### Risks

| Severity | Risk | Mitigation |
|---|---|---|
| Critical | Data loss during local use. | Test persistence, migration, backup, and recovery. |
| High | App feels finished but fails under real records. | Test with realistic seed data and larger register counts. |
| High | No export path exists. | Require export before MVP release. |
| Medium | Keyboard/mouse desktop interactions are weak. | Run desktop usability pass. |
| Medium | Known limitations are hidden. | Document limitations directly in release notes. |

### Verification

Run an MVP verification script/checklist that covers:

- App start
- Navigation
- Create/edit/archive records
- Link records
- Generate corrective action from source
- Complete/verify/close corrective action
- Generate/export report
- Restart app and confirm persistence
- Simulate common error states

---

## 18. MVP Cut Line

### MVP Includes

The MVP should include:

- Local-first app shell
- Sidebar navigation
- Local persistence
- Seed data
- Locations
- Processes
- Equipment
- SEGs
- Chemical Inventory
- SDS references
- Exposure Limits
- Chemical Use context
- Hazard Register
- Controls
- Basic Risk Assessments
- Corrective Actions
- Verification and closure states
- Observations
- Basic Inspections
- Basic Audit/Finding records
- Basic Air Sampling Event shell
- Basic Incidents/Near Misses
- Basic Compliance registers
- Basic Reports/Exports

### MVP Excludes

The MVP should exclude:

- Multi-user authentication/authorization
- Cloud sync
- Mobile app
- AI-first workflows
- Regulatory interpretation engine
- Automatic legal compliance determinations
- Full LMS behavior
- Full document management system
- Agency submission automation
- Advanced dashboards
- Advanced analytics
- Full exposure assessment calculations
- Lab result ingestion
- Chain-of-custody workflows
- Electronic signatures
- Enterprise approval workflows

### MVP Success Definition

The MVP succeeds if the user can:

- Build the basic operational context of a site.
- Maintain core HSE registers.
- Link hazards to chemicals, processes, locations, equipment, SEGs, controls, and actions.
- Capture field findings.
- Create corrective actions from source records.
- Track actions through completion, verification, and closure.
- Identify missing SDS, overdue actions, unverified work, and records needing review.
- Export useful register/report views.
- Trust that local data persists.

The MVP fails if:

- It only looks like an HSE system.
- Core records are not persistent.
- Relationships are not modeled.
- Corrective actions are orphaned tasks.
- Completion and verification are collapsed into one checkbox.
- Reports require duplicate manual data entry.
- The system cannot support real field follow-up.

---

## 19. Verification Gates

### Gate 1 — Foundation Gate

Before domain features begin:

- App runs locally.
- Quality commands exist.
- Test runner exists.
- Storage ADR exists.
- Routing strategy is documented or provisional.
- Data access boundary is defined.

### Gate 2 — Persistence Gate

Before Operations begins:

- Local records persist after restart.
- Schema versioning or migration strategy exists.
- Errors are surfaced.
- Seed data works.
- Archive/status behavior exists.

### Gate 3 — Operations Gate

Before Chemical Safety, Risk, Field Work, or Incidents depend on context:

- Locations, Processes, Equipment, and SEGs are usable.
- Core links work.
- Records can be selected by downstream modules.

### Gate 4 — Chemical Safety Gate

Before chemical hazards and chemical reports depend on inventory:

- Chemicals have SDS status.
- SDS references exist.
- Exposure limits include source, unit, and averaging period.
- Chemical use is separate from chemical identity.

### Gate 5 — Risk Gate

Before field findings and incidents generate actions:

- Hazards are structured.
- Controls are structured.
- Hazards can link to operational and chemical context.
- Risk assessments can reference hazards and controls.

### Gate 6 — Corrective Action Gate

Before Field Work, Incidents, and Compliance generate actions:

- Actions can be created from source records.
- Actions have owner, due date, status, and verification requirement.
- Completed does not equal Verified.
- Closed actions retain source traceability.

### Gate 7 — Field/Incident Gate

Before reporting claims useful coverage:

- Field and incident records can create corrective actions.
- Evidence references are preserved.
- Linked records are visible.

### Gate 8 — Report Gate

Before MVP release:

- Reports are generated from source records.
- Export exists.
- Dashboard shows real counts, not static mock values.
- Reports include traceability fields.

### Gate 9 — Release Gate

Before daily use:

- Data survives restart.
- Core workflows are tested.
- Exports work.
- Known limitations are documented.
- Packaging works.

---

## 20. Build Risks

| Severity | Risk | Impact | Control |
|---|---|---|---|
| Critical | Building pages before data relationships | App becomes a disconnected shell. | Build vertical slices. |
| Critical | Weak local persistence | User cannot trust the app. | Prioritize data foundation and persistence tests. |
| Critical | Orphaned corrective actions | Safety follow-up loses traceability. | Require source references. |
| Critical | Completion equals closure | False sense of control effectiveness. | Separate Completed, Verified, and Closed. |
| High | Chemical inventory lacks SDS state | Emergency response and audit readiness gap. | Require SDS status before Active. |
| High | Hazards lack operational context | Risk register becomes generic and weak. | Require links where applicable. |
| High | Compliance features overclaim | Legal/compliance risk. | Use evidence/review language, not compliance guarantees. |
| High | Reports duplicate source data | Conflicting records. | Reports are generated projections. |
| Medium | Overbuilt air sampling workflow | MVP slows down. | Start with event records; defer calculations/imports. |
| Medium | Document management scope creep | Product becomes file storage. | Use evidence references first. |
| Medium | Dashboard-first work | Polished but shallow app. | Dashboard summarizes only after records exist. |
| Low | Styling polish precedes functionality | Schedule drag. | Apply design system incrementally. |

---

## 21. Agent Execution Rules

Every implementation task given to a coding agent should use the following format.

```md
1. Objective
   - State the exact build outcome.

2. Problem
   - Explain the user/workflow problem being solved.
   - Name the failure mode this task prevents.

3. Files
   - List files to inspect.
   - List files expected to change.
   - State whether new files are allowed.

4. Changes
   - Describe required implementation changes.
   - Include domain rules and status behavior.

5. UI/UX
   - Define visible user behavior.
   - Include empty states, loading states, error states, and desktop layout expectations.

6. Data
   - Define entities, fields, relationships, persistence behavior, and migration needs.
   - State whether seed data is required.

7. Errors
   - Define validation failures, read/write failures, missing linked records, and recovery behavior.

8. Tests
   - Define unit, integration, and/or end-to-end tests.
   - Include persistence and relationship tests when applicable.

9. Acceptance Criteria
   - Define objective pass/fail conditions.
   - Include manual verification steps.

10. Out-of-Scope
   - Explicitly state what the agent must not build.

11. Format
   - Require a concise summary of changed files, tests run, risks, and follow-up items.
```

### Agent Task Standard

A task is not agent-ready unless it includes:

- Clear objective
- Known files or search targets
- Specific data behavior
- Error handling expectations
- Test requirements
- Acceptance criteria
- Out-of-scope boundaries

### Agent Anti-Patterns

Do not send an agent a task that says:

- “Build the chemical page.”
- “Make the dashboard look good.”
- “Add the risk module.”
- “Create all the forms.”
- “Implement the app.”

Those prompts are too vague. They will produce shallow code, brittle abstractions, and inconsistent state behavior.

---

## 22. Recommended First Coding Campaigns

### Campaign 001 — Foundation and Shell

Objective:

- Establish app shell, sidebar, routing, and placeholder pages.

Includes:

- Phase 0
- Phase 1

Excludes:

- Domain persistence beyond smoke-test seed data
- Real dashboard metrics
- Full UI polish

### Campaign 002 — Local Data Foundation

Objective:

- Establish local storage, schema/migration approach, data access boundary, seed data, and persistence tests.

Includes:

- Phase 2

Excludes:

- Full domain modules
- Cloud sync
- Multi-user identity

### Campaign 003 — Operations Backbone

Objective:

- Build Locations, Processes, Equipment, and SEGs as the operational context layer.

Includes:

- Phase 3

Excludes:

- Chemical inventory
- Hazard assessments
- Incidents
- Compliance workflows

### Campaign 004 — Chemical Safety Backbone

Objective:

- Build Chemical Inventory, SDS references, exposure limits, and chemical-use context.

Includes:

- Phase 4

Excludes:

- Regulatory reporting automation
- Full SDS parsing
- Exposure assessment calculations

### Campaign 005 — Risk and Controls Backbone

Objective:

- Build Hazard Register, Controls, and basic Risk Assessments.

Includes:

- Phase 5

Excludes:

- Advanced risk matrices
- Automated risk scoring engines
- Legal compliance interpretations

### Campaign 006 — Corrective Action Closure Loop

Objective:

- Build the corrective action lifecycle from source to closure.

Includes:

- Phase 6

Excludes:

- Multi-user approvals
- Notifications
- Email integration

### Campaign 007 — Field and Incident Records

Objective:

- Build field records and incident records that can generate corrective actions.

Includes:

- Phase 7
- Phase 8

Excludes:

- Advanced air sampling workflows
- Formal incident regulatory automation
- Lab imports

### Campaign 008 — Compliance and Reports

Objective:

- Build compliance-supporting registers and generated report/export views.

Includes:

- Phase 9
- Phase 10

Excludes:

- LMS behavior
- Full document control
- Agency submissions

### Campaign 009 — Hardening and Release

Objective:

- Stabilize the MVP for daily local use.

Includes:

- Phase 11

Excludes:

- New feature expansion
- AI
- Sync
- Mobile

---

## 23. Final Build Standard

OLUSO should not be judged by how many pages exist.

It should be judged by whether the user can:

- Enter real operational context.
- Track chemicals, hazards, controls, and worker exposure context.
- Capture field findings.
- Generate corrective actions from source records.
- Verify closure.
- Retrieve evidence.
- Export defensible records.
- Continue working locally.

The final standard is:

> A working HSE professional can use OLUSO to understand the site’s safety picture, document what matters, follow up on what is broken, and defend the work later.
