# 09 — Routing

Project: OLUSO  
Status: Draft  
Last Updated: 2026-07-05  

---

## 1. Purpose

This document defines the routing contract for OLUSO.

Routing is the bridge between the product information architecture, sidebar navigation, domain model, user workflows, UI architecture, and implementation work.

This document answers:

> Which screens exist, where do they live, how are they reached, and which routes are stable contracts for future implementation?

Routing should not be treated as a cosmetic detail. In OLUSO, route structure expresses product structure. A bad route model will create confused page ownership, duplicated components, broken breadcrumbs, weak deep-linking, and unclear agent implementation tasks.

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

This document feeds:

- `10-ui-architecture.md`
- `11-state-management.md`
- component specifications
- implementation prompts
- test planning
- future ADRs

This document does not define:

- final component implementation
- database schema
- state-management library choice
- form layout details
- styling
- authorization behavior
- cloud sync
- mobile navigation

Those decisions belong in later implementation and architecture documents.

---

## 3. Routing Philosophy

OLUSO routing should be boring, stable, readable, and domain-aligned.

Routes should help the user and developer understand where work belongs.

Routing should support:

- persistent desktop navigation
- register-first workflows
- stable deep links
- detail views for durable records
- create and edit flows
- relationship traversal
- report/review surfaces
- future expansion without reorganizing the product

Routing should avoid:

- clever nested paths
- route names based on UI components
- deeply nested modals
- hidden pages without ownership
- duplicate routes for the same concept
- enterprise-style route sprawl before MVP

The core rule:

> Routes should reflect HSE workflow ownership, not database table names alone.

---

## 4. Route Ownership Rules

Every route must have an owner.

A route owner is the sidebar section, domain area, or system-level concern responsible for the page.

Route owners:

| Owner | Route Prefix | Purpose |
|---|---|---|
| Dashboard | `/` | Landing and current HSE posture |
| Operations | `/operations/*` | Physical and process context |
| Chemical Safety | `/chemicals/*` | Chemical inventory, SDS, exposure limits |
| Risk Management | `/risk/*` | Hazards, risk assessments, controls |
| Field Work | `/field/*` | Observations, inspections, audits, sampling |
| Incidents | `/incidents/*` | Near misses, incidents, investigations |
| Corrective Actions | `/actions/*` | Action tracking, verification, closure |
| Compliance | `/compliance/*` | Training, permits, calendar, documents |
| Reports | `/reports/*` | Review and export outputs |
| System | `/settings/*`, `/help/*` | App-level configuration and support |

A route should not exist unless its owner is clear.

---

## 5. Route Types

OLUSO uses the following route types.

| Type | Description | Sidebar Visible |
|---|---|---|
| Landing route | Main entry route for app or section | Sometimes |
| Register route | List/table view of durable records | Yes |
| Detail route | View one record | No |
| Create route | Create a new record | No |
| Edit route | Edit an existing record | No |
| Workflow route | Task-focused surface such as verification queue | Sometimes |
| Report route | Review/export surface | Sometimes |
| System route | Settings/help/status pages | Usually no in MVP |
| Error route | Not found, missing record, recovery | No |

Sidebar-visible routes are major destinations.

Detail, create, edit, and helper routes should not appear in the primary sidebar.

---

## 6. Global Route Rules

### 6.1 Root Route

```text
/
```

The root route is the Dashboard.

The dashboard should summarize current HSE posture, not own source records.

It may link to:

- open corrective actions
- overdue corrective actions
- missing SDS records
- high-priority hazards
- records needing review
- recent field work
- upcoming compliance items

### 6.2 Default Redirects

Parent sections are not required to have standalone pages in the MVP.

If a parent section route is visited directly, it should redirect to its default child route.

| Parent Route | Default Redirect |
|---|---|
| `/operations` | `/operations/locations` |
| `/chemicals` | `/chemicals/inventory` |
| `/risk` | `/risk/hazards` |
| `/field` | `/field/observations` |
| `/incidents` | `/incidents/log` |
| `/actions` | `/actions/open` |
| `/compliance` | `/compliance/calendar` |
| `/reports` | `/reports/overview` |

If future section overview pages are built, these redirects may be replaced by real overview routes.

### 6.3 Route Naming

Use plural nouns for register routes.

Good:

```text
/operations/locations
/risk/hazards
/actions/open
/compliance/permits
```

Avoid:

```text
/location
/hazard-table
/correctiveActionPage
/chemicalSafetyListView
```

### 6.4 Dynamic ID Naming

Use `:id` as the route placeholder in documentation.

Implementation may use framework-specific syntax such as `[id]`, `$id`, or `:id`.

Documented pattern:

```text
/operations/locations/:id
```

Possible file-system route equivalent:

```text
src/routes/operations/locations/[id]/+page.svelte
```

### 6.5 Create and Edit Routes

Use explicit action routes:

```text
/new
/:id/edit
```

Examples:

```text
/operations/locations/new
/operations/locations/:id/edit
/risk/hazards/new
/risk/hazards/:id/edit
```

Do not use ambiguous paths like:

```text
/create-location
/edit-hazard
/form
```

### 6.6 Query Parameters

Query parameters may be used for transient view state:

```text
?status=open
?severity=high
?location=:id
?chemical=:id
?q=solvent
```

Query parameters should not be used as the source of record identity for detail pages.

Good:

```text
/risk/hazards/:id
```

Avoid:

```text
/risk/hazards?id=:id
```

---

## 7. Dashboard Routes

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/` | Landing | Yes | Yes | Main dashboard and reorientation surface |

Dashboard route boundaries:

- It may summarize source records.
- It may link into registers and queues.
- It should not become the primary editing surface.
- It should not own source data.
- It should not be built as a vanity dashboard before register data exists.

---

## 8. Operations Routes

Operations defines the physical and process context where HSE work happens.

### 8.1 Locations

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/operations/locations` | Register | Yes | Yes | Location register |
| `/operations/locations/new` | Create | No | Yes | Create location |
| `/operations/locations/:id` | Detail | No | Yes | Location detail |
| `/operations/locations/:id/edit` | Edit | No | Yes | Edit location |

### 8.2 Processes

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/operations/processes` | Register | Yes | Yes | Process register |
| `/operations/processes/new` | Create | No | Yes | Create process |
| `/operations/processes/:id` | Detail | No | Yes | Process detail |
| `/operations/processes/:id/edit` | Edit | No | Yes | Edit process |

### 8.3 Equipment

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/operations/equipment` | Register | Yes | Yes | Equipment register |
| `/operations/equipment/new` | Create | No | Yes | Create equipment |
| `/operations/equipment/:id` | Detail | No | Yes | Equipment detail |
| `/operations/equipment/:id/edit` | Edit | No | Yes | Edit equipment |

### 8.4 SEGs

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/operations/segs` | Register | Yes | Yes | Similar Exposure Group register |
| `/operations/segs/new` | Create | No | Yes | Create SEG |
| `/operations/segs/:id` | Detail | No | Yes | SEG detail |
| `/operations/segs/:id/edit` | Edit | No | Yes | Edit SEG |

### 8.5 Operations Route Boundaries

Operations routes should not become:

- maintenance management
- work-order management
- GIS/floorplan management
- asset inventory beyond HSE-relevant equipment
- process-control monitoring

Operations routes exist to provide context for HSE records.

---

## 9. Chemical Safety Routes

Chemical Safety owns chemical inventory, SDS records, and exposure-limit references.

### 9.1 Chemical Inventory

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/chemicals/inventory` | Register | Yes | Yes | Chemical inventory |
| `/chemicals/inventory/new` | Create | No | Yes | Create chemical record |
| `/chemicals/inventory/:id` | Detail | No | Yes | Chemical detail |
| `/chemicals/inventory/:id/edit` | Edit | No | Yes | Edit chemical record |

### 9.2 SDS Library

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/chemicals/sds` | Register | Yes | Yes | SDS library and SDS status tracking |
| `/chemicals/sds/new` | Create | No | Yes | Add SDS reference |
| `/chemicals/sds/:id` | Detail | No | Yes | SDS detail |
| `/chemicals/sds/:id/edit` | Edit | No | Yes | Edit SDS metadata |

### 9.3 Exposure Limits

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/chemicals/exposure-limits` | Register | Yes | Yes | Exposure-limit reference register |
| `/chemicals/exposure-limits/new` | Create | No | Yes | Add exposure limit |
| `/chemicals/exposure-limits/:id` | Detail | No | Yes | Exposure-limit detail |
| `/chemicals/exposure-limits/:id/edit` | Edit | No | Yes | Edit exposure limit |

### 9.4 Chemical Safety Route Boundaries

Chemical Safety routes should not become:

- procurement
- purchasing
- quantity reconciliation
- waste manifest management
- automatic SDS parsing
- automatic regulatory reporting
- supplier management

Chemical Safety routes track chemical identity, hazard context, SDS status, exposure references, and use/storage context.

---

## 10. Risk Management Routes

Risk Management owns hazards, risk assessments, and controls.

### 10.1 Hazard Register

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/risk/hazards` | Register | Yes | Yes | Hazard register |
| `/risk/hazards/new` | Create | No | Yes | Create hazard |
| `/risk/hazards/:id` | Detail | No | Yes | Hazard detail |
| `/risk/hazards/:id/edit` | Edit | No | Yes | Edit hazard |

### 10.2 Risk Assessments

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/risk/assessments` | Register | Yes | Yes | Risk assessment register |
| `/risk/assessments/new` | Create | No | Yes | Create risk assessment |
| `/risk/assessments/:id` | Detail | No | Yes | Risk assessment detail |
| `/risk/assessments/:id/edit` | Edit | No | Yes | Edit risk assessment |

### 10.3 Controls

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/risk/controls` | Register | Yes | Yes | Control register |
| `/risk/controls/new` | Create | No | Yes | Create control |
| `/risk/controls/:id` | Detail | No | Yes | Control detail |
| `/risk/controls/:id/edit` | Edit | No | Yes | Edit control |

### 10.4 Risk Route Boundaries

Risk routes should not become:

- full HAZOP module
- LOPA system
- quantitative risk-analysis tool
- configurable enterprise risk engine
- generic note space

Risk routes must preserve hazard/control traceability.

---

## 11. Field Work Routes

Field Work owns time-bound HSE activity performed in the field.

### 11.1 Observations

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/field/observations` | Register | Yes | Yes | Observation register |
| `/field/observations/new` | Create | No | Yes | Create observation |
| `/field/observations/:id` | Detail | No | Yes | Observation detail |
| `/field/observations/:id/edit` | Edit | No | Yes | Edit observation |

### 11.2 Inspections

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/field/inspections` | Register | Yes | Yes | Inspection register |
| `/field/inspections/new` | Create | No | Yes | Create inspection |
| `/field/inspections/:id` | Detail | No | Yes | Inspection detail |
| `/field/inspections/:id/edit` | Edit | No | Yes | Edit inspection |

### 11.3 Audits

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/field/audits` | Register | Yes | Yes | Audit register |
| `/field/audits/new` | Create | No | Yes | Create audit |
| `/field/audits/:id` | Detail | No | Yes | Audit detail |
| `/field/audits/:id/edit` | Edit | No | Yes | Edit audit |

### 11.4 Air Sampling

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/field/air-sampling` | Register | Yes | Yes | Air sampling event register |
| `/field/air-sampling/new` | Create | No | Yes | Create sampling event |
| `/field/air-sampling/:id` | Detail | No | Yes | Sampling event detail |
| `/field/air-sampling/:id/edit` | Edit | No | Yes | Edit sampling event |

### 11.5 Field Work Route Boundaries

Field Work routes should not become:

- mobile inspection app
- checklist-builder platform
- lab integration system
- chain-of-custody automation
- media library

Field Work routes capture what happened and link the record back to operational, chemical, risk, incident, or corrective-action context.

---

## 12. Incident Routes

Incidents owns near misses, incidents, and investigations.

Incident routes are MVP-adjacent. They may be skeletal or deferred until core operations, chemical, risk, field-work, and corrective-action routes are stable.

### 12.1 Near Misses

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/incidents/near-misses` | Register | Yes | Maybe | Near-miss register |
| `/incidents/near-misses/new` | Create | No | Maybe | Create near miss |
| `/incidents/near-misses/:id` | Detail | No | Maybe | Near-miss detail |
| `/incidents/near-misses/:id/edit` | Edit | No | Maybe | Edit near miss |

### 12.2 Incident Log

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/incidents/log` | Register | Yes | Maybe | Incident log |
| `/incidents/log/new` | Create | No | Maybe | Create incident |
| `/incidents/log/:id` | Detail | No | Maybe | Incident detail |
| `/incidents/log/:id/edit` | Edit | No | Maybe | Edit incident |

### 12.3 Investigations

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/incidents/investigations` | Register | Yes | Later | Investigation register |
| `/incidents/investigations/new` | Create | No | Later | Create investigation |
| `/incidents/investigations/:id` | Detail | No | Later | Investigation detail |
| `/incidents/investigations/:id/edit` | Edit | No | Later | Edit investigation |

### 12.4 Incident Route Boundaries

Incident routes should not become:

- workers' compensation management
- legal claims management
- medical case management
- OSHA recordkeeping automation
- enterprise root-cause workflow engine

Incidents should start as structured event records that can link to corrective actions and evidence.

---

## 13. Corrective Action Routes

Corrective Actions owns follow-through.

### 13.1 Action Queues

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/actions/open` | Workflow/Register | Yes | Yes | Open and active actions |
| `/actions/verification` | Workflow/Register | Yes | Yes | Completed actions awaiting verification |
| `/actions/closed` | Register | Yes | Yes | Verified and closed actions |

### 13.2 Action Create/Detail/Edit

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/actions/new` | Create | No | Yes | Create corrective action |
| `/actions/:id` | Detail | No | Yes | Corrective action detail |
| `/actions/:id/edit` | Edit | No | Yes | Edit corrective action |

### 13.3 Corrective Action Route Boundaries

Corrective Action routes should not become:

- generic task manager
- Kanban project management board
- enterprise CAPA workflow engine
- email notification platform
- automated closure system

Corrective actions must preserve source context where possible and must not collapse completion, verification, and closure into one state.

---

## 14. Compliance Routes

Compliance owns obligation tracking and audit-supporting records.

### 14.1 Training

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/compliance/training` | Register | Yes | Yes | Training requirement/status register |
| `/compliance/training/new` | Create | No | Yes | Create training requirement/status record |
| `/compliance/training/:id` | Detail | No | Yes | Training record detail |
| `/compliance/training/:id/edit` | Edit | No | Yes | Edit training record |

### 14.2 Permits

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/compliance/permits` | Register | Yes | Yes | Permit register |
| `/compliance/permits/new` | Create | No | Yes | Create permit record |
| `/compliance/permits/:id` | Detail | No | Yes | Permit detail |
| `/compliance/permits/:id/edit` | Edit | No | Yes | Edit permit record |

### 14.3 Regulatory Calendar

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/compliance/calendar` | Register/Calendar | Yes | Yes | Regulatory calendar and obligation tracking |
| `/compliance/calendar/new` | Create | No | Yes | Create calendar item |
| `/compliance/calendar/:id` | Detail | No | Yes | Calendar item detail |
| `/compliance/calendar/:id/edit` | Edit | No | Yes | Edit calendar item |

### 14.4 Documents

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/compliance/documents` | Register | Yes | Yes | Controlled document/reference register |
| `/compliance/documents/new` | Create | No | Yes | Create document reference |
| `/compliance/documents/:id` | Detail | No | Yes | Document reference detail |
| `/compliance/documents/:id/edit` | Edit | No | Yes | Edit document reference |

### 14.5 Compliance Route Boundaries

Compliance routes should not become:

- legal interpretation engine
- regulatory certification tool
- full LMS
- full document management system
- permit-submission automation

Compliance routes support readiness, evidence, due dates, owners, review, and source tracking.

---

## 15. Report Routes

Reports are projections over source records.

### 15.1 Report Overview

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/reports/overview` | Landing | Yes | Yes | Reports overview and available exports |

### 15.2 MVP Report Routes

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/reports/chemicals` | Report | No | Yes | Chemical inventory export/review |
| `/reports/hazards` | Report | No | Yes | Hazard/control summary |
| `/reports/actions` | Report | No | Yes | Corrective action report |
| `/reports/field-work` | Report | No | Yes | Field-work summary |
| `/reports/compliance` | Report | No | Yes | Compliance-supporting summary |

### 15.3 Report Route Boundaries

Report routes should not become:

- BI dashboard
- custom report builder
- predictive analytics platform
- scheduled-reporting system
- regulatory submission engine

Reports should not exist before source records can support them.

---

## 16. System Routes

System routes are not core MVP routes unless needed for app operation.

| Route | Type | Sidebar | MVP | Purpose |
|---|---|---:|---:|---|
| `/settings` | System | No | Later | App settings |
| `/settings/data` | System | No | Later | Backup/export/import settings |
| `/settings/appearance` | System | No | Later | Appearance preferences |
| `/help` | System | No | Later | Help/reference page |
| `/about` | System | No | Later | App metadata |

System routes should not be prioritized before MVP workflow routes.

---

## 17. Error and Recovery Routes

| Route | Type | Purpose |
|---|---|---|
| `/not-found` | Error | Generic not-found route |
| `/record-not-found` | Error | Missing or deleted record recovery |
| `/error` | Error | Unexpected app error |
| `/data-recovery` | Recovery | Future local-data recovery surface |

### 17.1 Not Found Behavior

Invalid routes should show:

- clear title
- route not found explanation
- link to dashboard
- link to last known valid area if available
- no technical stack trace in normal UI

### 17.2 Missing Record Behavior

If a user navigates to a missing detail route such as:

```text
/risk/hazards/:id
```

and the record does not exist, the app should show a missing-record state, not a blank page.

Missing-record state should include:

- record type
- attempted ID
- possible reasons
- link back to the owning register
- optional restore/archive notice if supported later

### 17.3 Deleted or Archived Record Behavior

Audit-relevant records should prefer archive over destructive deletion.

If archived records are accessible, routes should still resolve to detail views with clear archived status.

---

## 18. Relationship Navigation

OLUSO must support movement between related records.

Examples:

- Chemical detail → linked SDS
- Chemical detail → linked hazards
- Hazard detail → linked controls
- Hazard detail → linked corrective actions
- Inspection detail → generated corrective actions
- Corrective action detail → source observation/audit/incident/hazard
- SEG detail → linked processes, chemicals, sampling events
- Location detail → linked equipment, processes, inspections, incidents

Relationship navigation should use normal routes, not hidden modal-only views.

A related record link should route to the canonical detail route for that record.

Example:

```text
/actions/:id
```

not:

```text
/risk/hazards/:hazardId/actions/:actionId
```

Avoid deep nested ownership unless the child record cannot exist independently.

Corrective actions can originate from many sources, so they should have canonical routes under `/actions`.

---

## 19. Breadcrumb Rules

Breadcrumbs should reflect route ownership and current record context.

Examples:

```text
Operations / Locations / Tank Farm
Risk Management / Hazards / Combustible Dust
Corrective Actions / Open Actions / Replace damaged guardrail
Compliance / Permits / Air Permit
```

Breadcrumbs should not expose technical route names.

Bad:

```text
risk / hazards / 01JABC932
```

Good:

```text
Risk Management / Hazards / Combustible Dust
```

When a record name is unknown or loading, breadcrumbs may show:

```text
Risk Management / Hazards / Loading…
```

---

## 20. Route Guards and Validation

MVP does not require authentication guards.

MVP does require data guards.

### 20.1 Data Guards

Detail routes must validate that the requested record exists.

Edit routes must validate that:

- the record exists
- the record is not locked from editing
- archived records show appropriate warnings
- status transitions remain valid

### 20.2 Status Guards

Routes do not need to block users from viewing incomplete records.

However, status promotion should enforce minimum data requirements at the form/action level.

Example:

A chemical may be saved as Draft without SDS status, but it should not be promoted to Active without SDS status.

### 20.3 Future Auth Guards

Authentication and authorization are future-scope.

If added later, guard behavior should be documented in a future ADR.

---

## 21. Route Metadata

Each route should eventually define metadata.

Minimum metadata:

| Field | Purpose |
|---|---|
| `title` | Page title |
| `section` | Sidebar/domain owner |
| `routeType` | Register, detail, create, edit, report, system |
| `mvp` | MVP, maybe, later |
| `sidebarVisible` | Whether primary sidebar displays it |
| `requiresRecord` | Whether route needs record ID |
| `allowedStatuses` | Optional status constraints |
| `breadcrumb` | Breadcrumb label source |
| `emptyState` | Empty-state behavior |
| `errorState` | Error-state behavior |

Example:

```ts
{
  title: 'Hazard Register',
  section: 'risk',
  routeType: 'register',
  mvp: true,
  sidebarVisible: true,
  requiresRecord: false
}
```

This document does not require implementing route metadata immediately, but agents should not hardcode route behavior in scattered components.

---

## 22. MVP Route Set

The minimum MVP route set is:

```text
/

/operations/locations
/operations/locations/new
/operations/locations/:id
/operations/locations/:id/edit

/operations/processes
/operations/processes/new
/operations/processes/:id
/operations/processes/:id/edit

/operations/equipment
/operations/equipment/new
/operations/equipment/:id
/operations/equipment/:id/edit

/operations/segs
/operations/segs/new
/operations/segs/:id
/operations/segs/:id/edit

/chemicals/inventory
/chemicals/inventory/new
/chemicals/inventory/:id
/chemicals/inventory/:id/edit

/chemicals/sds
/chemicals/sds/new
/chemicals/sds/:id
/chemicals/sds/:id/edit

/chemicals/exposure-limits
/chemicals/exposure-limits/new
/chemicals/exposure-limits/:id
/chemicals/exposure-limits/:id/edit

/risk/hazards
/risk/hazards/new
/risk/hazards/:id
/risk/hazards/:id/edit

/risk/controls
/risk/controls/new
/risk/controls/:id
/risk/controls/:id/edit

/risk/assessments
/risk/assessments/new
/risk/assessments/:id
/risk/assessments/:id/edit

/field/observations
/field/observations/new
/field/observations/:id
/field/observations/:id/edit

/field/inspections
/field/inspections/new
/field/inspections/:id
/field/inspections/:id/edit

/actions/open
/actions/verification
/actions/closed
/actions/new
/actions/:id
/actions/:id/edit

/compliance/calendar
/compliance/calendar/new
/compliance/calendar/:id
/compliance/calendar/:id/edit

/reports/overview
/reports/actions
/reports/chemicals
/reports/hazards
```

Incident, audit, air-sampling, permit, training, and document routes may exist in MVP as stubs or early simple registers depending on build capacity, but they should not delay the core operations → risk → field finding → corrective action → verification workflow.

---

## 23. Future Route Set

Future route candidates include:

```text
/incidents/near-misses
/incidents/log
/incidents/investigations

/field/audits
/field/air-sampling

/compliance/training
/compliance/permits
/compliance/documents

/reports/field-work
/reports/compliance

/settings
/settings/data
/settings/appearance
/help
/about
```

Future routes should not be implemented as empty shell pages unless they are needed for navigation continuity.

A route with no usable behavior should remain deferred or display a clearly marked future-scope placeholder.

---

## 24. Routing Anti-Patterns

Avoid the following:

### 24.1 Deep Nesting

Avoid routes like:

```text
/operations/locations/:locationId/processes/:processId/hazards/:hazardId/actions/:actionId
```

Use canonical record routes and relationship links instead.

### 24.2 UI-Component Routes

Avoid routes named after components:

```text
/hazard-table
/action-card-view
/location-form
```

Routes are product contracts, not component names.

### 24.3 Duplicate Canonical Routes

Do not create multiple detail routes for the same record.

Bad:

```text
/actions/:id
/risk/hazards/:hazardId/actions/:id
/field/observations/:observationId/actions/:id
```

Good:

```text
/actions/:id
```

Then show source relationship inside the action detail page.

### 24.4 Dashboard-Owned Source Data

The dashboard should not own records.

If a dashboard card opens a record, it should route to the record's canonical owner.

### 24.5 Modal-Only Detail Views

Do not make core record details accessible only through modals.

Detail routes should be deep-linkable.

Modals may be used for quick create or quick edit only when the canonical route still exists.

---

## 25. Agent Implementation Rules

Coding agents must follow these routing rules.

### 25.1 Required Prompt Instruction

Every route implementation prompt should include:

```text
Implement only the scoped route or route group. Do not add unrelated routes, navigation sections, authentication, cloud sync, AI features, mobile-specific layouts, or enterprise workflow behavior.
```

### 25.2 Route File Requirements

When implementing a route group, the agent should identify:

1. route path
2. route owner
3. page type
4. data dependency
5. loading state
6. empty state
7. error state
8. missing-record behavior
9. navigation entry, if sidebar-visible
10. tests or verification steps

### 25.3 No Silent Route Creation

Agents must not create new routes without documenting:

- why the route exists
- who owns it
- whether it appears in sidebar
- whether it is MVP or future
- what source document supports it

### 25.4 Route Tests

Route work should verify:

- route renders
- sidebar active state works
- parent redirect works where applicable
- create route opens expected form
- detail route handles missing IDs
- edit route handles missing IDs
- invalid route shows recovery state
- breadcrumbs are correct
- canonical links use the expected route

---

## 26. Final Routing Standard

The routing model is successful when:

- every sidebar destination has a stable route
- every durable record has a canonical detail route
- every create/edit flow has a predictable route
- parent routes redirect or resolve consistently
- invalid routes recover cleanly
- missing records do not create blank screens
- reports remain projections over source records
- dashboard links route into source owners
- future scope does not pollute MVP route structure
- agents can implement routes without inventing navigation behavior

The final standard is:

> A user should always know where they are, what domain owns the page, what record they are viewing, and how to return to the relevant register.
