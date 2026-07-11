# 03 — Sidebar Navigation

## Purpose

This document defines the primary sidebar navigation model for OLUSO.

The sidebar is the application’s main navigation surface. It establishes the top-level operating areas of the product, the child pages available under each area, and the route ownership for each navigable destination.

This document is the product/navigation contract. It defines **what belongs in the sidebar and why**.

It does not define detailed rendering behavior, styling, animation, keyboard mechanics, or component implementation. Those belong in:

```txt
docs/component-specs/sidepanel-specs.md
docs/09-routing.md
docs/10-ui-architecture.md
docs/11-state-management.md
```

---

## Navigation Objective

The sidebar should make OLUSO feel like a structured HSE operating system, not a loose collection of tools.

The navigation model must support:

* Fast access to core HSE registers
* Clear separation between operational data, risk data, field activity, incidents, actions, and compliance
* Predictable routing
* Future badge/count indicators
* Future role-based visibility
* Future expansion without reorganizing the entire app

The sidebar should help the user answer:

> “Where does this HSE work belong?”

---

## Navigation Principles

### 1. Workflow-first grouping

Sidebar sections are grouped by HSE workflow area, not by database table.

For example, “Chemical Safety” owns chemical inventory, SDS records, and exposure limits because those are used together in chemical hazard work.

### 2. Persistent operational map

The sidebar should remain stable across the app. Users should not lose orientation when moving between registers, records, reports, or field work.

### 3. Registers before transactions

OLUSO should prioritize durable HSE registers before advanced workflow automation.

Examples:

* Chemical Inventory
* Process Register
* SEG Register
* Hazard Register
* Incident Log
* Corrective Action Register
* Compliance Documents

### 4. Pages must justify sidebar placement

A page should appear in the sidebar only when it represents a major user destination.

Do not add sidebar items for small modals, detail panels, transient forms, or helper views.

### 5. Sidebar structure should remain boring

The sidebar is infrastructure. It should be predictable, conservative, and hard to break.

Avoid clever grouping, hidden menus, or excessive nesting.

---

## Top-Level Sidebar Structure

The primary sidebar sections are:

| Section            |                Type | Purpose                                                           |
| ------------------ | ------------------: | ----------------------------------------------------------------- |
| Dashboard          |        Direct route | Application overview and current HSE posture                      |
| Operations         | Collapsible section | Physical and process context for the site                         |
| Chemical Safety    | Collapsible section | Chemical inventory, SDS, and exposure-limit references            |
| Risk Management    | Collapsible section | Hazards, assessments, and control tracking                        |
| Field Work         | Collapsible section | Observations, inspections, audits, and sampling activity          |
| Incidents          | Collapsible section | Near misses, incidents, and investigations                        |
| Corrective Actions | Collapsible section | Action tracking, verification, and closure                        |
| Compliance         | Collapsible section | Training, permits, calendar obligations, and controlled documents |
| Reports            |        Direct route | Reporting and review output layer                                 |

---

## Sidebar Sections

## Dashboard

### Route

```txt
/
```

### Purpose

The Dashboard is the primary landing surface for OLUSO.

It should eventually summarize the current condition of the HSE system, including open risks, overdue actions, recent incidents, upcoming compliance obligations, and important field activity.

### Why it belongs in the sidebar

The dashboard is the default reorientation point for the user.

### Out of scope

The Dashboard should not become the main editing surface for registers. It may summarize records and link into them, but ownership stays with the relevant section.

---

## Operations

### Section route behavior

Operations is a collapsible parent section. It does not require its own route in the initial version.

### Purpose

Operations defines the physical and process context where HSE work happens.

This section answers:

> “Where is the work happening, what process is involved, what equipment is involved, and which worker group is exposed?”

### Child pages

| Page      | Route                   | Purpose                                                          |
| --------- | ----------------------- | ---------------------------------------------------------------- |
| Locations | `/operations/locations` | Site areas, buildings, rooms, zones, and maps                    |
| Processes | `/operations/processes` | Operational processes and production activities                  |
| Equipment | `/operations/equipment` | Equipment relevant to hazards, controls, and inspections         |
| SEGs      | `/operations/segs`      | Similar Exposure Groups used for industrial hygiene organization |

### Notes

Operations should be treated as the foundation layer. Many other records should eventually link back to Operations.

Examples:

* A hazard should link to a location, process, equipment item, or SEG when applicable.
* A sampling record should link to an SEG, process, location, or task.
* An inspection should link to a location or equipment item.
* A chemical use record should link to a process or location.

---

## Chemical Safety

### Section route behavior

Chemical Safety is a collapsible parent section. It does not require its own route in the initial version.

### Purpose

Chemical Safety owns the records and references needed to manage chemical hazards.

This section answers:

> “What chemicals are present, what hazards do they have, and what limits or documents govern their safe use?”

### Child pages

| Page               | Route                        | Purpose                                                    |
| ------------------ | ---------------------------- | ---------------------------------------------------------- |
| Chemical Inventory | `/chemicals/inventory`       | Master inventory of chemicals used or stored               |
| SDS Library        | `/chemicals/sds`             | Safety Data Sheets and controlled chemical documents       |
| Exposure Limits    | `/chemicals/exposure-limits` | OEL, PEL, TLV, REL, and internal exposure-limit references |

### Notes

Chemical Safety should support both field usability and audit readiness.

The Chemical Inventory should eventually connect to:

* SDS records
* Storage locations
* Process usage
* Hazard classifications
* PPE requirements
* Exposure limits
* Spill response information
* Regulatory reporting flags

### Out of scope

Chemical Safety is not the same as Risk Management.

Chemical Safety identifies and describes chemical hazards. Risk Management evaluates and controls broader risk scenarios.

---

## Risk Management

### Section route behavior

Risk Management is a collapsible parent section. It does not require its own route in the initial version.

### Purpose

Risk Management owns the structured risk system.

This section answers:

> “What can go wrong, how severe is it, how likely is it, and what controls reduce the risk?”

### Child pages

| Page             | Route               | Purpose                                                                  |
| ---------------- | ------------------- | ------------------------------------------------------------------------ |
| Hazard Register  | `/risk/hazards`     | Master register of recognized hazards                                    |
| Risk Assessments | `/risk/assessments` | Structured assessments tied to tasks, processes, chemicals, or locations |
| Controls         | `/risk/controls`    | Engineering, administrative, PPE, and procedural controls                |

### Notes

The Hazard Register should be one of the central records in OLUSO.

Hazards may connect to:

* Locations
* Processes
* Equipment
* SEGs
* Chemicals
* Incidents
* Inspections
* Corrective actions
* Controls

### Out of scope

Risk Management should not become a generic notes area. Every risk record should be structured enough to support review, filtering, and future reporting.

---

## Field Work

### Section route behavior

Field Work is a collapsible parent section. It does not require its own route in the initial version.

### Purpose

Field Work owns HSE activity performed in the field.

This section answers:

> “What did we observe, inspect, audit, or sample?”

### Child pages

| Page         | Route                 | Purpose                                        |
| ------------ | --------------------- | ---------------------------------------------- |
| Observations | `/field/observations` | Informal or structured field observations      |
| Inspections  | `/field/inspections`  | Planned inspection records                     |
| Audits       | `/field/audits`       | Formal audit activity and findings             |
| Air Sampling | `/field/air-sampling` | Industrial hygiene sampling events and results |

### Notes

Field Work records should generally produce evidence.

Examples:

* Observation notes
* Inspection findings
* Audit findings
* Sampling results
* Photos
* Attachments
* Corrective actions
* Verification records

### Out of scope

Field Work should not replace the Hazard Register or Corrective Action Register. It may generate hazards or actions, but those records should live in their own sections once created.

---

## Incidents

### Section route behavior

Incidents is a collapsible parent section. It does not require its own route in the initial version.

### Purpose

Incidents owns event-based safety records.

This section answers:

> “What happened, what almost happened, what caused it, and what was done afterward?”

### Child pages

| Page           | Route                       | Purpose                                                                                         |
| -------------- | --------------------------- | ----------------------------------------------------------------------------------------------- |
| Near Misses    | `/incidents/near-misses`    | Events that could have caused harm, damage, or release                                          |
| Incidents      | `/incidents/log`            | Recordable and non-recordable incidents, releases, injuries, property damage, or process events |
| Investigations | `/incidents/investigations` | Investigation records, root-cause analysis, and corrective findings                             |

### Notes

Incident records should eventually connect to:

* People or roles involved
* Locations
* Processes
* Equipment
* Chemicals
* Immediate causes
* Root causes
* Corrective actions
* Evidence
* Regulatory reporting status

### Out of scope

The Incidents section should not be used as a general issue tracker. Issues that are not incident events should belong to Corrective Actions, Field Work, or Risk Management depending on the workflow.

---

## Corrective Actions

### Section route behavior

Corrective Actions is a collapsible parent section. It does not require its own route in the initial version.

### Purpose

Corrective Actions owns follow-through.

This section answers:

> “What needs to be fixed, who owns it, when is it due, and has the fix been verified?”

### Child pages

| Page           | Route                   | Purpose                                         |
| -------------- | ----------------------- | ----------------------------------------------- |
| Open Actions   | `/actions/open`         | Active corrective and preventive actions        |
| Verification   | `/actions/verification` | Completed actions awaiting effectiveness review |
| Closed Actions | `/actions/closed`       | Completed and verified actions                  |

### Notes

Corrective actions may originate from:

* Inspections
* Audits
* Incidents
* Near misses
* Risk assessments
* Observations
* Management review
* Compliance obligations

Corrective action closure should require more than “marked done” when the action is safety-critical.

For safety-critical actions, OLUSO should eventually distinguish:

```txt
Created → Assigned → In Progress → Completed → Verified → Closed
```

### Out of scope

Corrective Actions should not own the full source record. For example, an audit finding should remain tied to the audit record, even if it creates a corrective action.

---

## Compliance

### Section route behavior

Compliance is a collapsible parent section. It does not require its own route in the initial version.

### Purpose

Compliance owns obligation tracking and audit-supporting records.

This section answers:

> “What must be done, documented, renewed, submitted, or retained?”

### Child pages

| Page                | Route                   | Purpose                                                              |
| ------------------- | ----------------------- | -------------------------------------------------------------------- |
| Training            | `/compliance/training`  | Training requirements, completion status, and evidence               |
| Permits             | `/compliance/permits`   | Environmental, operating, and safety-related permits                 |
| Regulatory Calendar | `/compliance/calendar`  | Recurring inspections, submissions, renewals, reviews, and deadlines |
| Documents           | `/compliance/documents` | Controlled documents, procedures, plans, and compliance files        |

### Notes

Compliance records should be managed with audit-readiness in mind.

Important compliance concerns include:

* Due dates
* Owners
* Evidence
* Revision history
* Retention
* Review status
* Applicable regulation or internal requirement
* Completion verification

### Out of scope

Compliance should not become a dumping ground for every document. Documents should be linked to the workflow they support whenever possible.

---

## Reports

### Route

```txt
/reports
```

### Purpose

Reports is the output layer for analysis, summaries, reviews, exports, and leadership/audit-facing information.

This section answers:

> “What can we produce from the system?”

### Why it belongs in the sidebar

Reports are a primary destination, but they should not own the underlying records.

Reports may eventually include:

* Open corrective action report
* Overdue action report
* Incident summary
* Risk register export
* Chemical inventory export
* Training status report
* Inspection summary
* Audit readiness package
* Regulatory calendar lookahead
* Air sampling summary

### Out of scope

Reports should not become a separate data-entry area. Reports should read from existing records.

---

## Route Contract

The sidebar owns the following initial route contract:

| Route                        | Owner Section      | Page                |
| ---------------------------- | ------------------ | ------------------- |
| `/`                          | Dashboard          | Dashboard           |
| `/operations/locations`      | Operations         | Locations           |
| `/operations/processes`      | Operations         | Processes           |
| `/operations/equipment`      | Operations         | Equipment           |
| `/operations/segs`           | Operations         | SEGs                |
| `/chemicals/inventory`       | Chemical Safety    | Chemical Inventory  |
| `/chemicals/sds`             | Chemical Safety    | SDS Library         |
| `/chemicals/exposure-limits` | Chemical Safety    | Exposure Limits     |
| `/risk/hazards`              | Risk Management    | Hazard Register     |
| `/risk/assessments`          | Risk Management    | Risk Assessments    |
| `/risk/controls`             | Risk Management    | Controls            |
| `/field/observations`        | Field Work         | Observations        |
| `/field/inspections`         | Field Work         | Inspections         |
| `/field/audits`              | Field Work         | Audits              |
| `/field/air-sampling`        | Field Work         | Air Sampling        |
| `/incidents/near-misses`     | Incidents          | Near Misses         |
| `/incidents/log`             | Incidents          | Incidents           |
| `/incidents/investigations`  | Incidents          | Investigations      |
| `/actions/open`              | Corrective Actions | Open Actions        |
| `/actions/verification`      | Corrective Actions | Verification        |
| `/actions/closed`            | Corrective Actions | Closed Actions      |
| `/compliance/training`       | Compliance         | Training            |
| `/compliance/permits`        | Compliance         | Permits             |
| `/compliance/calendar`       | Compliance         | Regulatory Calendar |
| `/compliance/documents`      | Compliance         | Documents           |
| `/reports`                   | Reports            | Reports             |

---

## Sidebar Behavior Requirements

Detailed component behavior belongs in the sidepanel component specification, but the navigation model requires the sidebar to support the following product behaviors:

### Active route awareness

The sidebar must clearly show the current page.

When a child route is active, its parent section should also be visually identifiable as the active navigation group.

### Collapsible sections

Major grouped sections should be collapsible.

Initial default behavior:

| Section            | Collapsible | Default State   |
| ------------------ | ----------: | --------------- |
| Dashboard          |          No | Expanded/direct |
| Operations         |         Yes | Expanded        |
| Chemical Safety    |         Yes | Collapsed       |
| Risk Management    |         Yes | Collapsed       |
| Field Work         |         Yes | Collapsed       |
| Incidents          |         Yes | Collapsed       |
| Corrective Actions |         Yes | Collapsed       |
| Compliance         |         Yes | Collapsed       |
| Reports            |          No | Expanded/direct |

### Badge/count support

The navigation model should allow future badges without requiring route restructuring.

Likely future badge examples:

| Section/Page        | Badge Meaning                                    |
| ------------------- | ------------------------------------------------ |
| Open Actions        | Number of open actions                           |
| Verification        | Number of actions awaiting verification          |
| Incidents           | Number of recent unresolved incidents            |
| Regulatory Calendar | Number of upcoming or overdue obligations        |
| Training            | Number of overdue training items                 |
| Audits              | Number of open audit findings                    |
| Chemical Inventory  | Number of chemicals missing SDS or review status |

Badges should be treated as status indicators, not decorative elements.

### Keyboard navigation

The sidebar should support keyboard navigation as a baseline accessibility requirement.

Expected behavior should be defined in the sidepanel component spec.

### Future role-based visibility

The sidebar structure should eventually allow pages or sections to be hidden, disabled, or read-only based on user role.

Initial implementation may assume a single-user local-first model, but the navigation contract should not block future permissions.

---

## Rules for Adding New Sidebar Items

A new sidebar item may be added only when it passes all of the following checks:

### 1. It represents a major destination

The page must be something a user intentionally navigates to, not a temporary view or helper screen.

### 2. It has a durable route

The page must have a stable URL that can be documented and tested.

### 3. It belongs to a clear workflow area

The page must belong under an existing section unless there is a strong reason to create a new top-level section.

### 4. It owns a distinct user job

The page must not duplicate the purpose of an existing page.

### 5. It supports records, decisions, review, or reporting

The page should contribute to the HSE operating system.

Weak sidebar candidates should instead become:

* Detail panels
* Tabs inside an existing page
* Filters
* Reports
* Dialogs
* Components
* Future backlog items

---

## Rules for Creating New Top-Level Sections

New top-level sections should be rare.

A new top-level section may be justified when:

* It represents a major HSE domain
* It contains multiple durable child pages
* It cannot reasonably fit under an existing section
* It would be used frequently enough to justify persistent navigation
* It improves clarity rather than adding noise

Avoid creating top-level sections for:

* Single pages
* Temporary workflows
* Administrative preferences
* Experimental features
* Reports that can live under Reports
* Detail views that belong under a parent record

---

## Relationship to Other Documents

### 02 — Information Architecture

The Information Architecture document defines the conceptual structure of the app.

The Sidebar Navigation document turns part of that structure into navigable product areas.

### 04 — Domain Model

The Domain Model defines entities and relationships.

The Sidebar Navigation document does not define the database model, but it should align with the domain model.

### 09 — Routing

The Routing document should use this document as the source for initial routes.

Routing may define additional detail routes that do not appear directly in the sidebar.

Examples:

```txt
/chemicals/inventory/:chemicalId
/risk/hazards/:hazardId
/incidents/log/:incidentId
/actions/open/:actionId
```

### 10 — UI Architecture

The UI Architecture document should define layout structure, page shells, panels, tables, forms, and shared UI patterns.

### 11 — State Management

The State Management document should define how navigation state, expanded sections, selected records, filters, and page data are managed.

### Component Specs

Component specs define how reusable UI pieces behave.

The sidebar component spec should implement the navigation contract defined here.

---

## Initial Navigation Map

```txt
Dashboard
└── /

Operations
├── Locations
│   └── /operations/locations
├── Processes
│   └── /operations/processes
├── Equipment
│   └── /operations/equipment
└── SEGs
    └── /operations/segs

Chemical Safety
├── Chemical Inventory
│   └── /chemicals/inventory
├── SDS Library
│   └── /chemicals/sds
└── Exposure Limits
    └── /chemicals/exposure-limits

Risk Management
├── Hazard Register
│   └── /risk/hazards
├── Risk Assessments
│   └── /risk/assessments
└── Controls
    └── /risk/controls

Field Work
├── Observations
│   └── /field/observations
├── Inspections
│   └── /field/inspections
├── Audits
│   └── /field/audits
└── Air Sampling
    └── /field/air-sampling

Incidents
├── Near Misses
│   └── /incidents/near-misses
├── Incidents
│   └── /incidents/log
└── Investigations
    └── /incidents/investigations

Corrective Actions
├── Open Actions
│   └── /actions/open
├── Verification
│   └── /actions/verification
└── Closed Actions
    └── /actions/closed

Compliance
├── Training
│   └── /compliance/training
├── Permits
│   └── /compliance/permits
├── Regulatory Calendar
│   └── /compliance/calendar
└── Documents
    └── /compliance/documents

Reports
└── /reports
```

---

## Acceptance Criteria

This document is complete when:

* Every top-level sidebar section has a defined purpose.
* Every sidebar child page has a defined route.
* Every route has a clear owner section.
* The difference between navigation intent and component implementation is explicit.
* The sidebar model supports future badges/counts.
* The sidebar model supports future role-based visibility.
* The sidebar model avoids unnecessary top-level sections.
* The routing document can be authored from this document without inventing new primary routes.
* The sidepanel component spec can implement this document without redefining product intent.

---

## Current Decision

OLUSO will use a left sidebar as the primary navigation model.

The initial sidebar will contain:

```txt
Dashboard
Operations
Chemical Safety
Risk Management
Field Work
Incidents
Corrective Actions
Compliance
Reports
```

This structure is approved as the initial navigation contract for the application.
