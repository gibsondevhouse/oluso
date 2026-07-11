# 10 — UI Architecture

Project: OLUSO  
Status: Draft  
Last Updated: 2026-07-06

---

## 1. Purpose

This document defines the UI architecture for OLUSO.

OLUSO uses a persistent desktop application shell with workflow-owned route layouts and a standardized register/record interaction model. The UI is organized around HSE operating areas, but each area reuses common page archetypes for registers, records, field workflows, evidence, status handling, and audit history. This prevents page-level improvisation, supports predictable routing, and keeps the application maintainable as additional HSE modules are added.

This document answers:

- How is the application visually and structurally assembled?
- Which layout regions are persistent across the app?
- Which page archetypes are allowed?
- How should registers, records, field workflows, evidence, and audit history be presented?
- Which UI states must be handled before a page is considered complete?
- Which component boundaries should coding agents respect?

This document does **not** define:

- Final styling tokens
- Final component implementation
- Final state-management library
- Final database schema
- Final form validation schema
- Final access-control behavior
- Cloud sync behavior
- Mobile navigation

Those belong in later implementation documents, component specifications, ADRs, or `11-state-management.md`.

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
- `docs/component-specs/sidepanel-specs.md`

This document feeds:

- `11-state-management.md`
- component specifications
- page implementation prompts
- route implementation prompts
- UI tests
- accessibility checks
- future ADRs

The routing document defines which screens exist and where they live. This UI architecture defines how those screens are assembled and what UI behavior is required before implementation is accepted.

---

## 3. Governing UI Model

OLUSO should be assembled around four repeating concepts:

```txt
Register → Record → Relationships → Evidence
```

Most OLUSO modules are structured operational records, not freeform pages.

A chemical, process, location, equipment item, SEG, hazard, inspection, incident, corrective action, training item, permit, or compliance record should follow a predictable interaction model:

1. Find or create the item in a register.
2. Open the item as a durable record.
3. Review its relationships to other operational entities.
4. Attach or review supporting evidence.
5. Track status, action, review, and history.

The UI must make this workflow obvious.

---

## 4. Primary Structural Assembly

OLUSO should use this high-level application structure:

```txt
AppShell
├── SidebarNavigation
│   ├── Dashboard
│   ├── Operations
│   ├── Chemical Safety
│   ├── Risk Management
│   ├── Field Work
│   ├── Incidents
│   ├── Corrective Actions
│   ├── Compliance
│   └── Reports
│
├── MainWorkspace
│   ├── WorkspaceHeader
│   │   ├── Breadcrumbs
│   │   ├── PageTitle
│   │   ├── ContextSummary
│   │   └── PrimaryActions
│   │
│   ├── WorkspaceBody
│   │   └── RouteOutlet
│   │
│   └── WorkspaceStatusStrip
│       ├── LocalSaveStatus
│       ├── LastUpdated
│       ├── RecordCount
│       └── FilterState
│
└── OptionalRightInspector
    ├── SelectedRecordSummary
    ├── LinkedRecords
    ├── OpenActions
    ├── Evidence
    └── AuditTrail
```

The shell should remain stable while the routed workspace changes.

The sidebar owns navigation. The workspace owns task execution. The optional inspector owns secondary context.

---

## 5. Persistent App Shell

### 5.1 Objective

The app shell should make OLUSO feel like a durable desktop operating system for HSE work, not a collection of web pages.

The shell must provide:

- Stable sidebar navigation
- Clear current location
- Consistent workspace header
- Predictable primary actions
- Persistent local status feedback
- Room for future badges, counts, sync state, and role-based visibility

### 5.2 Required Regions

```txt
AppShell
├── SidebarNavigation
├── WorkspaceHeader
├── WorkspaceBody
├── WorkspaceStatusStrip
└── OptionalRightInspector
```

### 5.3 SidebarNavigation

The sidebar is the primary navigation surface. It should not be treated as decoration.

The sidebar should support:

- Collapsible workflow sections
- Active route highlighting
- Keyboard navigation
- Future count badges
- Future role-based visibility
- Future pinned/favorite destinations

The sidebar should group destinations by HSE workflow area, not database tables.

### 5.4 WorkspaceHeader

Every routed page should render a workspace header unless the page has a justified exception.

The workspace header should include:

- Breadcrumbs
- Page title
- Short context summary
- Primary action button
- Secondary actions menu when needed
- Optional status/risk badges

Example:

```txt
Operations / Processes
Process Register
Operational processes and production activities that may create HSE exposure, risk, or compliance obligations.
[New Process]
```

### 5.5 WorkspaceBody

The workspace body contains the active route content.

It should not duplicate sidebar navigation. It should focus on the active task.

### 5.6 WorkspaceStatusStrip

The status strip should communicate local-first confidence.

It may show:

- Saved locally
- Unsaved changes
- Draft saved
- Last updated time
- Active filter count
- Visible record count
- Sync placeholder, if sync is later added

This must be quiet and persistent. It should not behave like a disruptive alert system.

### 5.7 OptionalRightInspector

The right inspector is allowed, but it is secondary.

It may be used for:

- Selected row preview
- Linked record summary
- Open actions
- Evidence preview
- Audit/history preview
- Contextual help

The inspector must **not** be the only place where critical record data exists. Canonical data belongs on the routed page or record detail page.

---

## 6. Workspace Layouts

OLUSO should use workflow-owned workspace layouts under the app shell.

```txt
/
└── AppShell

/operations/*
└── OperationsWorkspaceLayout

/chemicals/*
└── ChemicalSafetyWorkspaceLayout

/risk/*
└── RiskWorkspaceLayout

/field/*
└── FieldWorkWorkspaceLayout

/incidents/*
└── IncidentWorkspaceLayout

/actions/*
└── CorrectiveActionWorkspaceLayout

/compliance/*
└── ComplianceWorkspaceLayout

/reports/*
└── ReportsWorkspaceLayout
```

Each workspace layout may define local navigation, context summaries, or workspace-specific affordances, but it may not break the global shell contract.

---

## 7. Standard Page Archetypes

OLUSO pages should be built from a limited set of page archetypes.

Allowed archetypes:

1. Dashboard Page
2. Register Page
3. Record Detail Page
4. Create/Edit Form Page
5. Field Workflow Page
6. Report Page
7. Settings/Administration Page
8. Placeholder/Stub Page

New page archetypes require an ADR or explicit documentation update.

---

## 8. Dashboard Page

### 8.1 Purpose

The dashboard is a triage surface, not the center of the product.

It should help the user answer:

- What needs attention?
- What is overdue?
- What high-risk items exist?
- What actions are open?
- What field activity happened recently?

### 8.2 Structure

```txt
DashboardPage
├── DashboardHeader
├── AttentionSummary
│   ├── OpenActions
│   ├── OverdueReviews
│   ├── HighRiskHazards
│   └── UpcomingComplianceItems
├── RecentActivity
├── QuickLinks
└── EmptyState
```

### 8.3 Rule

Do not overbuild the dashboard before the registers work.

The dashboard should summarize real records. It should not become a polished mockup over empty data.

---

## 9. Register Page

### 9.1 Purpose

A register page is the canonical surface for finding, filtering, sorting, scanning, and opening structured records.

Registers are the backbone of OLUSO.

Examples:

- Chemical Inventory
- Location Register
- Process Register
- Equipment Register
- SEG Register
- Hazard Register
- Inspection Register
- Incident Log
- Corrective Action Register
- Compliance Register

### 9.2 Structure

```txt
RegisterPage
├── WorkspaceHeader
├── RegisterToolbar
│   ├── SearchInput
│   ├── FilterControls
│   ├── SortControls
│   ├── ViewToggle
│   └── CreateButton
├── RegisterContent
│   ├── RegisterTable
│   ├── RegisterList
│   └── EmptyState
├── RegisterPaginationOrVirtualization
├── WorkspaceStatusStrip
└── OptionalRightInspector
```

### 9.3 Required Behaviors

Every register page must support:

- Search or clear explanation why search is deferred
- Empty state
- Loading state
- Error state
- Create action when creation is in scope
- Stable row click behavior
- Deep-linkable detail route
- Visible record status when status applies
- Visible risk/priority indicator when risk/priority applies
- Record count or filter count when practical

### 9.4 Register Table Guidance

Register tables should favor operational scanning over visual decoration.

Common columns may include:

- Name/title
- Type/category
- Status
- Risk or priority
- Related location/process/chemical/SEG
- Owner/responsible person
- Last updated
- Next review
- Open actions

Not every register needs every column. Column selection should reflect workflow needs.

### 9.5 Register Anti-Pattern

Do not create visually unique register layouts for every module.

Chemical Inventory, Hazard Register, Process Register, Equipment Register, and Incident Log should share a common register architecture. They may differ in fields, filters, badges, and actions, but not in structural behavior.

---

## 10. Record Detail Page

### 10.1 Purpose

A record detail page is the canonical surface for understanding, editing, linking, and defending a single record.

Examples:

- One chemical
- One process
- One location
- One piece of equipment
- One SEG
- One hazard
- One inspection
- One incident
- One corrective action
- One compliance requirement

### 10.2 Structure

```txt
RecordDetailPage
├── RecordHeader
│   ├── Breadcrumbs
│   ├── RecordTitle
│   ├── RecordType
│   ├── StatusBadge
│   ├── RiskBadge / PriorityBadge
│   ├── LastReviewed
│   └── ActionsMenu
├── RecordTabs
│   ├── Overview
│   ├── Details
│   ├── Relationships
│   ├── Controls / Actions
│   ├── Evidence
│   └── History
├── RecordBody
└── WorkspaceStatusStrip
```

### 10.3 Standard Tabs

#### Overview

A compact summary of what the record is, why it matters, current status, and most important relationships.

#### Details

Structured fields for the record.

#### Relationships

Linked records such as:

- Chemicals
- Processes
- Locations
- Equipment
- SEGs
- Hazards
- Controls
- Inspections
- Incidents
- Corrective actions
- Compliance requirements
- Documents or evidence

#### Controls / Actions

Controls, safeguards, corrective actions, follow-up items, or verification tasks associated with the record.

#### Evidence

Attached SDS, photos, forms, notes, reports, training records, permits, sampling data, or other supporting materials.

#### History

Creation, edits, status changes, review history, closure notes, and future audit trail.

### 10.4 Rule

The record page must make relationships visible.

OLUSO’s value is not isolated data entry. Its value is linking operational reality:

```txt
Chemical → Process → Location → SEG → Hazard → Control → Observation → Action → Evidence
```

If the UI hides those links, the product becomes a prettier spreadsheet.

---

## 11. Create/Edit Form Page

### 11.1 Purpose

Create/edit pages provide controlled data entry for durable records.

### 11.2 Structure

```txt
CreateEditPage
├── FormHeader
│   ├── Breadcrumbs
│   ├── Title
│   ├── DraftStatus
│   └── SaveActions
├── FormBody
│   ├── RequiredFieldsSection
│   ├── CoreDetailsSection
│   ├── RelationshipSection
│   ├── EvidenceSection
│   └── NotesSection
├── ValidationSummary
└── WorkspaceStatusStrip
```

### 11.3 Required Behaviors

Forms must support:

- Required field visibility
- Field-level validation
- Form-level validation summary
- Dirty state
- Unsaved change warning
- Save success feedback
- Save failure feedback
- Cancel behavior
- Draft behavior when applicable

### 11.4 Modal Rule

Modals may be used for:

- Quick create
- Quick edit
- Status update
- Assign action
- Attach evidence
- Confirm destructive action

Modals must not replace canonical create/edit/detail routes for serious HSE records.

---

## 12. Field Workflow Page

### 12.1 Purpose

Field workflow pages support fast capture of observations, inspections, audits, sampling events, findings, and follow-up actions.

They should be optimized for execution under imperfect field conditions.

### 12.2 Structure

```txt
FieldWorkflowPage
├── TaskHeader
│   ├── ActivityType
│   ├── TargetContext
│   ├── Status
│   └── SaveDraft
├── QuickEntryForm
├── RequiredFieldGroup
├── EvidenceCapture
├── FindingCapture
├── FollowUpActionCapture
├── CompletionChecklist
└── SubmitOrCloseAction
```

### 12.3 Design Rules

Field pages should:

- Minimize unnecessary navigation
- Support draft saves
- Make required fields obvious
- Allow evidence attachment
- Allow creation of follow-up actions
- Show completion state
- Avoid dense enterprise-style forms in the MVP

### 12.4 Field Capture Priority

Field capture should prioritize:

1. What was observed?
2. Where did it occur?
3. Who or what is affected?
4. What hazard or compliance concern is involved?
5. What evidence supports the record?
6. What action is required?
7. Who owns the follow-up?
8. What verifies closure?

---

## 13. Report Page

### 13.1 Purpose

Reports are projections over existing data until saved reports are justified.

A report page should summarize records, filters, and exported views. It should not become a separate source of truth.

### 13.2 Structure

```txt
ReportPage
├── ReportHeader
├── ReportFilters
├── ReportPreview
├── ExportActions
└── GeneratedMetadata
```

### 13.3 Rule

Reports should not create parallel data structures. They should read from the same records, relationships, statuses, and evidence used elsewhere in OLUSO.

---

## 14. Placeholder/Stub Page

### 14.1 Purpose

A placeholder page may be used when a route exists but the feature is intentionally deferred.

### 14.2 Required Content

A placeholder must show:

- Page name
- Intended purpose
- MVP status
- Why it is deferred
- Related records or dependencies
- Link back to relevant working areas

### 14.3 Rule

A placeholder is acceptable. A fake working screen is not.

Do not build polished dead screens that imply functionality exists when it does not.

---

## 15. Component Ownership Boundaries

### 15.1 Recommended Source Structure

```txt
src/
├── app/
│   ├── AppShell
│   ├── AppProviders
│   └── AppRoutes
│
├── layouts/
│   ├── WorkspaceLayout
│   ├── RegisterLayout
│   ├── RecordLayout
│   ├── FieldWorkflowLayout
│   └── ReportLayout
│
├── navigation/
│   ├── Sidebar
│   ├── SidebarSection
│   ├── SidebarItem
│   └── Breadcrumbs
│
├── pages/
│   ├── dashboard/
│   ├── operations/
│   ├── chemicals/
│   ├── risk/
│   ├── field/
│   ├── incidents/
│   ├── actions/
│   ├── compliance/
│   └── reports/
│
├── components/
│   ├── registers/
│   ├── records/
│   ├── forms/
│   ├── status/
│   ├── evidence/
│   ├── relationships/
│   └── audit/
│
└── domain/
    ├── chemicals/
    ├── hazards/
    ├── locations/
    ├── processes/
    ├── equipment/
    ├── segs/
    ├── field/
    ├── incidents/
    ├── actions/
    └── compliance/
```

### 15.2 Boundary Rules

#### `app/`

Owns application-level composition.

Should contain:

- App shell
- Providers
- Router assembly
- Global error boundaries

Should not contain domain-specific forms or tables.

#### `layouts/`

Owns reusable page structure.

Should contain:

- Workspace layout
- Register layout
- Record layout
- Field workflow layout
- Report layout

Should not contain chemical-specific, hazard-specific, or incident-specific business logic.

#### `navigation/`

Owns navigation surfaces.

Should contain:

- Sidebar components
- Breadcrumbs
- Navigation item rendering
- Active route logic

Should not own record CRUD logic.

#### `pages/`

Owns route-level composition.

Pages wire together layouts, domain components, data queries, and actions.

Pages should be thin enough to remain readable but explicit enough for route ownership.

#### `components/`

Owns reusable UI components shared across modules.

Examples:

- Register table
- Empty state
- Status badge
- Risk badge
- Evidence list
- Relationship list
- Form section
- Validation summary
- Audit timeline

#### `domain/`

Owns domain-specific components, types, adapters, and behavior.

Examples:

- Chemical fields
- Hazard severity display
- Process relationship cards
- SEG exposure summary
- Incident investigation fields
- Corrective action closure verification

---

## 16. Relationship UI

### 16.1 Purpose

Relationship UI is central to OLUSO.

The product must make it easy to see how records connect across operational areas.

### 16.2 Relationship Display Patterns

Allowed patterns:

```txt
RelationshipCard
RelationshipList
RelationshipTable
LinkedRecordBadge
RelationshipGraphPlaceholder
RightInspectorRelationshipPreview
```

### 16.3 Required Behaviors

Relationship UI should support:

- Link to related record
- Relationship type label
- Status/risk indicator when relevant
- Empty state
- Add relationship action when in scope
- Remove relationship action when safe and authorized

### 16.4 Relationship Examples

| Source Record | Related Records |
|---|---|
| Chemical | SDS, locations, processes, hazards, SEGs, controls, exposure limits |
| Process | locations, equipment, chemicals, hazards, SEGs, inspections |
| Location | processes, equipment, chemicals, inspections, incidents, hazards |
| SEG | workers/roles, processes, chemicals, hazards, sampling records |
| Hazard | source records, controls, inspections, incidents, actions |
| Incident | location, process, equipment, hazard, evidence, corrective actions |
| Corrective Action | source record, owner, due date, verification evidence |

---

## 17. Evidence UI

### 17.1 Purpose

Evidence supports audit-readiness and defensible HSE decisions.

Evidence may include:

- SDS files
- Photos
- Inspection forms
- Sampling data
- Training records
- Permits
- Procedures
- Notes
- Reports
- Closure verification

### 17.2 Structure

```txt
EvidencePanel
├── EvidenceSummary
├── EvidenceList
├── EvidenceTypeFilter
├── AttachEvidenceAction
├── EvidencePreview
└── EvidenceMetadata
```

### 17.3 Required Metadata

Evidence records should eventually support:

- Title
- Evidence type
- Source record
- Date added
- Added by
- File or note reference
- Description
- Related action or finding
- Review/verification status when applicable

### 17.4 Rule

Evidence should be attached to records, not buried in comments or uncontrolled notes.

---

## 18. Audit and History UI

### 18.1 Purpose

Audit/history UI should help explain what changed, when it changed, and why it changed.

### 18.2 Structure

```txt
AuditTimeline
├── CreatedEvent
├── UpdatedEvent
├── StatusChangedEvent
├── RelationshipChangedEvent
├── EvidenceAttachedEvent
├── ActionClosedEvent
└── ReviewCompletedEvent
```

### 18.3 MVP Position

Full immutable audit logging may be deferred, but the UI architecture should reserve space for it.

At minimum, record pages should have a `History` tab or section placeholder.

---

## 19. Required UX States

Every page must explicitly handle UX states.

### 19.1 Global States

| State | Requirement |
|---|---|
| Loading | Show useful skeleton or loading region, not full-page confusion |
| Empty | Explain what is missing and what action can create it |
| Error | Explain what failed and what the user can do next |
| Saving | Show non-disruptive save feedback |
| Saved | Show local save confirmation where relevant |
| Unsaved | Show dirty state and prevent silent data loss |
| Offline/local-only | Communicate local-first confidence without alarming the user |
| Validation failure | Show field-level and form-level errors |
| Permission/locked | Reserve pattern for future role-based access |
| Deferred feature | Use honest placeholder, not fake controls |

### 19.2 Page Completion Rule

A page is not complete if it only renders the happy path.

Minimum accepted states:

```txt
Default
Loading
Empty
Error
Saving
Validation failure
Unsaved changes
```

Pages without these states are implementation stubs, not finished UI.

---

## 20. Primary Actions

Every page should define one primary action.

Examples:

| Page | Primary Action |
|---|---|
| Chemical Inventory | New Chemical |
| Chemical Detail | Edit Chemical |
| Process Register | New Process |
| Hazard Register | New Hazard |
| Field Observations | New Observation |
| Incident Log | New Incident |
| Corrective Actions | New Action |
| Compliance Requirements | New Requirement |
| Reports | Generate Report |

Secondary actions should be grouped in an actions menu or contextual toolbar.

Avoid multiple competing primary buttons.

---

## 21. Navigation and Breadcrumbs

### 21.1 Rule

Every detail, create, and edit page must be reachable by route and understandable from breadcrumbs.

### 21.2 Examples

```txt
Operations / Locations / Tank Farm
Chemical Safety / Inventory / Atrazine
Risk Management / Hazards / Combustible Dust
Field Work / Inspections / Monthly Forklift Inspection
Incidents / Incident Log / Spill Event 2026-07-06
Corrective Actions / Action CA-2026-014
Compliance / Requirements / Hazard Communication
```

### 21.3 Back Behavior

Back behavior should respect route history when possible, but pages should also provide stable breadcrumb navigation.

Do not rely only on browser/window back behavior.

---

## 22. Desktop-First Layout Rules

OLUSO is desktop-first.

### 22.1 Default Assumption

Primary usage occurs on a laptop or desktop screen, likely during planning, review, documentation, or after field activity.

### 22.2 Layout Density

Use moderate density:

- Denser than consumer apps
- Less cramped than legacy EHS software
- More structured than freeform notes
- More readable than spreadsheet-heavy systems

### 22.3 Tables

Tables are acceptable and expected for registers.

They should support scanning, sorting, filtering, status visibility, and record opening.

### 22.4 Cards

Cards should be used for summaries, relationship previews, status summaries, and dashboard elements.

Do not turn dense registers into card grids unless the record type benefits from visual scanning.

---

## 23. Accessibility and Keyboard Expectations

OLUSO should be usable without mouse-only interaction.

Minimum expectations:

- Keyboard navigable sidebar
- Visible focus states
- Accessible buttons and controls
- Semantic headings
- Form labels
- Error messages associated with fields
- Sufficient contrast
- No critical information conveyed by color alone
- Escape/cancel behavior for dialogs
- Confirm destructive actions

Accessibility is not polish. It is part of operational readiness.

---

## 24. Local-First UI Expectations

Because OLUSO is local-first, the UI should build trust in local operation.

### 24.1 Required Concepts

The UI should eventually support:

- Local save status
- Draft status
- Last updated timestamp
- Import/export status
- Backup status
- Sync placeholder, if sync is later introduced

### 24.2 Avoid

Avoid UI patterns that imply cloud dependency unless cloud behavior exists.

Examples to avoid in the MVP:

- Fake sync indicators
- Account/team controls without functionality
- Cloud collaboration controls
- Remote permission controls
- Loading behavior that feels like SaaS latency when data is local

---

## 25. HSE-Specific UI Rules

### 25.1 Compliance Language

The UI should distinguish between:

- Regulatory requirement
- Company requirement
- Best practice
- Recommendation
- Unknown/not assessed

Do not visually imply legal compliance unless the underlying record supports that conclusion.

### 25.2 Risk Language

Risk indicators should be clear and conservative.

Avoid decorative risk colors without definitions.

A severity badge must map to a defined severity model.

### 25.3 Corrective Action Closure

Corrective action UI should reserve space for:

- Source record
- Assigned owner
- Due date
- Status
- Closure note
- Verification requirement
- Verification evidence

Closure without verification should not be visually treated the same as verified closure when verification is required.

### 25.4 Evidence Discipline

Evidence should be first-class. It should not be an afterthought.

Any record that supports compliance, incident response, exposure assessment, corrective action, or audit defense should have an evidence path.

---

## 26. Anti-Patterns

The following patterns are rejected for OLUSO:

### 26.1 Page-Level Improvisation

Do not let every module invent its own layout.

This creates inconsistent UX, duplicated components, harder testing, and brittle agent implementation tasks.

### 26.2 Dashboard-First Development

Do not build a polished dashboard before the underlying records work.

The dashboard must summarize real data, not compensate for missing workflows.

### 26.3 Modal-Only Records

Do not manage serious HSE records exclusively through modals.

Core records need durable routes.

### 26.4 Hidden Relationships

Do not bury record relationships in notes, comments, or unstructured text.

Relationships are product structure.

### 26.5 Fake Compliance

Do not imply compliance status without supporting record logic, evidence, and definitions.

### 26.6 Spreadsheet Clone

Do not turn OLUSO into a spreadsheet with a sidebar.

Registers are important, but record detail, relationships, evidence, and action tracking are what make the system defensible.

### 26.7 Enterprise EHS Bloat

Do not copy enterprise EHS complexity into the MVP.

Prioritize field-usable workflows, local-first reliability, and structured operational memory.

---

## 27. Implementation Verification Gate

Before a UI page is accepted, it must satisfy this checklist.

### 27.1 Page Identity

- [ ] Page title is clear.
- [ ] Breadcrumbs show where the page lives.
- [ ] Route matches the routing contract.
- [ ] Sidebar active state is correct.

### 27.2 User Task

- [ ] Primary user task is obvious.
- [ ] Primary action is visible.
- [ ] Secondary actions are not competing with the primary action.
- [ ] The page answers what the user can do next.

### 27.3 State Handling

- [ ] Default state exists.
- [ ] Loading state exists.
- [ ] Empty state exists.
- [ ] Error state exists.
- [ ] Saving state exists when data changes.
- [ ] Unsaved/dirty state exists when editing is possible.
- [ ] Validation failure state exists when forms are present.

### 27.4 Record Behavior

- [ ] Register rows link to detail routes.
- [ ] Detail routes are deep-linkable.
- [ ] Create/edit flows have canonical routes when in scope.
- [ ] Record status is visible when applicable.
- [ ] Risk/priority is visible when applicable.

### 27.5 Relationship Behavior

- [ ] Related records are visible when applicable.
- [ ] Empty relationship states are handled.
- [ ] Related records link to their canonical routes.
- [ ] Relationship actions are explicit and safe.

### 27.6 Evidence and Audit

- [ ] Evidence section or placeholder exists where needed.
- [ ] Audit/history section or placeholder exists where needed.
- [ ] The page does not imply unsupported compliance conclusions.

### 27.7 Accessibility

- [ ] Keyboard navigation works for core controls.
- [ ] Focus states are visible.
- [ ] Form controls have labels.
- [ ] Errors are readable and associated with fields.
- [ ] Color is not the only source of meaning.

---

## 28. MVP UI Priorities

The MVP should prioritize:

1. Persistent app shell
2. Sidebar navigation
3. Workspace header and breadcrumbs
4. Register page pattern
5. Record detail page pattern
6. Create/edit form pattern
7. Required UX states
8. Relationship display pattern
9. Evidence placeholder/pattern
10. Audit/history placeholder/pattern

The MVP should not prioritize:

- Advanced dashboards
- Complex report builders
- Drag-and-drop customization
- Graph visualization
- Role-based UI beyond placeholders
- Cloud collaboration controls
- Mobile-specific navigation

---

## 29. Recommended First Vertical Slice

The first implementation slice should prove the UI architecture with one operational domain.

Recommended slice:

```txt
Operations → Locations
```

Minimum route set:

```txt
/operations/locations
/operations/locations/new
/operations/locations/:id
/operations/locations/:id/edit
```

Required UI proof:

- App shell
- Sidebar active state
- Register page
- Create page
- Detail page
- Edit page
- Breadcrumbs
- Empty/loading/error states
- Form validation
- Unsaved changes behavior
- Relationship placeholder
- Evidence placeholder
- History placeholder

Once this works, the pattern can be reused for processes, equipment, SEGs, chemicals, and hazards.

---

## 30. Architecture Decision

OLUSO will use:

```txt
Persistent App Shell
+ Workflow-Owned Workspace Layouts
+ Standardized Register/Record Page Archetypes
+ Explicit UX State Handling
+ Relationship/Evidence/Audit Patterns
```

This is the accepted UI architecture unless superseded by a future ADR.

---

## 31. Summary

OLUSO should feel like a structured HSE operating system.

The UI should be calm, durable, predictable, and audit-aware. The application should not chase novelty. It should help the user find records, understand relationships, document field conditions, attach evidence, track actions, and defend decisions.

The structural assembly must therefore stay strict:

```txt
Sidebar-owned workflows
Workspace-owned execution
Register-owned discovery
Record-owned truth
Relationship-owned context
Evidence-owned defensibility
History-owned accountability
```

Any UI implementation that violates that structure should be rejected or revised before additional modules are built on top of it.
