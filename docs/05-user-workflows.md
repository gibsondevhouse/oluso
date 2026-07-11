# 05 — User Workflows

Project: OLUSO  
Status: Draft  
Last Updated: 2026-07-05  

---

## 1. Purpose

This document defines the primary user workflows OLUSO must support.

The goal is to translate the product brief, product vision, information architecture, sidebar navigation, and domain model into practical user paths. This document defines how the primary user moves from field reality to structured, traceable HSE records.

This document answers:

- What work is the user trying to complete?
- Which registers or records are involved?
- What links must be preserved?
- What status changes matter?
- What verification gates prevent weak or misleading records?
- What should be included in the MVP workflow spine?

This document does **not** define:

- Final page layouts
- Final routes
- Database schema
- TypeScript interfaces
- UI component structure
- State-management implementation
- Authentication or authorization behavior
- Regulatory interpretation logic

Those decisions belong in later documents.

---

## 2. Alignment With Existing Documentation

This workflow model must remain consistent with the earlier OLUSO documentation.

### 2.1 Product Brief Alignment

OLUSO is a local-first desktop application for managing HSE and industrial hygiene information in a structured, field-usable way.

The workflows below must support:

- Chemical inventory
- Locations
- Processes
- Equipment
- SEGs
- Hazard register
- Controls
- Observations
- Inspections
- Audits
- Air sampling
- Incidents and near misses
- Corrective actions
- Compliance-supporting records
- Reports as review and export outputs

The initial workflow assumption is **single-user**. The primary user is an HSE professional maintaining the system.

### 2.2 Product Vision Alignment

The workflows must support OLUSO’s core promise:

> Turn real workplace conditions into structured, searchable, auditable safety intelligence.

The workflows must not turn OLUSO into:

- A full enterprise EHS platform
- A generic spreadsheet wrapper
- A document dump
- A training LMS
- A regulatory interpretation engine
- A dashboard-first vanity project
- A cloud-first SaaS product

Every workflow must help the user understand, control, document, or verify real HSE risk.

### 2.3 Information Architecture Alignment

The workflows must respect the primary application areas:

| Area | Workflow Ownership |
|---|---|
| Dashboard | Review posture, priorities, recent activity, and overdue work. |
| Operations | Maintain locations, processes, equipment, and SEGs. |
| Chemical Safety | Maintain chemical inventory, SDS records, and exposure limits. |
| Risk Management | Maintain hazards, risk assessments, and controls. |
| Field Work | Capture observations, inspections, audits, and air sampling. |
| Incidents | Capture near misses, incidents, and investigations. |
| Corrective Actions | Track ownership, due dates, verification, and closure. |
| Compliance | Track training, permits, calendar obligations, and documents. |
| Reports | Generate summaries and exports from source records. |

The workflows must preserve separate domains while allowing records to link across domains.

### 2.4 Sidebar Alignment

The workflows should map cleanly to the documented sidebar sections and child pages.

The sidebar defines the user’s major destinations. This workflow document defines the work that happens inside and across those destinations.

No workflow in this document should require adding a new sidebar section before the MVP.

### 2.5 Domain Model Alignment

The workflows must follow the domain model’s key rules:

- Registers track durable operational objects.
- Records capture events, findings, evidence, or changes.
- Core entities must be linkable.
- Corrective actions require source traceability.
- Closure requires verification when verification is required.
- Compliance is evidence-driven.
- Reports are projections over existing data until saved reports are justified.
- Audit-relevant records should favor archival over destructive deletion.

---

## 3. Primary User Assumption

The MVP assumes one primary user:

> A working HSE professional responsible for maintaining field-usable, audit-aware HSE information for a facility or site.

This user may act as:

- Observer
- Inspector
- Assessor
- Investigator
- Action creator
- Action owner
- Verifier
- Document owner
- Report generator

The system may eventually support multiple people, roles, assignments, and permissions. That is not required for the first workflow model.

### MVP Constraint

Do not design these workflows as if OLUSO is already a multi-user enterprise system.

The app may track owners, roles, inspectors, verifiers, or involved people as domain data, but complex identity management and permission behavior should remain out of scope until later.

---

## 4. Workflow Principles

### 4.1 Field Reality First

The user should be able to capture imperfect information and improve it later.

A workflow should allow:

- Draft records
- Unknown values
- Follow-up flags
- Under-review states
- Links added after initial capture
- Evidence added after the fact

The system should not require perfect data before useful work can begin.

### 4.2 Registers Before Transactions

Durable registers are the backbone of OLUSO.

Examples:

- Chemical Inventory
- Location Register
- Process Register
- Equipment Register
- SEG Register
- Hazard Register
- Control Register
- Permit Register
- Document Register

Workflows should use these registers as anchors instead of creating disconnected one-off records.

### 4.3 Records Capture What Happened

Time-bound activity should be captured as records.

Examples:

- Observation
- Inspection
- Audit
- Air Sampling Event
- Near Miss
- Incident
- Investigation
- Corrective Action
- Verification
- Closure Record
- Regulatory Calendar Item
- Permit renewal event

Records should answer:

> What happened, when did it happen, what did it affect, and what evidence exists?

### 4.4 Links Are Not Optional Decoration

The value of OLUSO is traceability.

A user should be able to start from a closed corrective action and trace backward to the source condition that created it.

Minimum link expectations:

- Hazards link to operational context.
- Chemicals link to SDS and exposure limits where available.
- Field work links to location, process, equipment, chemical, hazard, or control where applicable.
- Incidents link to operational context and follow-up.
- Corrective actions link to source records.
- Evidence links to the record it supports.

### 4.5 Completion and Verification Are Separate

Completion means someone claims the work was done.

Verification means the completed work was reviewed and found adequate.

Corrective action closure should not be treated as a simple checkbox. For verification-required actions, closure requires verification or documented justification that verification is not required.

### 4.6 Compliance Support Is Not Compliance Guarantee

OLUSO may support compliance readiness, but it must not imply that storing a record equals legal compliance.

Workflows should preserve:

- Requirement source
- Due date
- Owner
- Evidence
- Review status
- Related record links

The user remains responsible for professional judgment, legal interpretation, and site-specific applicability.

---

## 5. Workflow Spine

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

This spine does not mean every record must pass through every step.

It means OLUSO should preserve the path from condition to decision to action to evidence.

---

## 6. Workflow 1 — Build Operational Context

### Objective

Create the facility/site operating context so other HSE records can be tied to real locations, processes, equipment, and exposure groups.

### Primary Sidebar Area

Operations

### Primary Pages

- Locations
- Processes
- Equipment
- SEGs

### Register / Record Classification

| Item | Classification |
|---|---|
| Location | Register |
| Process | Register |
| Equipment | Register |
| SEG | Register |

### User Workflow

1. User creates or opens a Location.
2. User defines the location type and status.
3. User creates or links Processes that occur at the Location.
4. User creates or links Equipment used at the Location or Process.
5. User creates or links SEGs associated with the Location or Process.
6. User adds known notes, uncertainties, or review needs.
7. User marks records as Draft, Active, Under Review, Inactive, Retired, or Archived.

### Minimum Data Requirements

| Entity | Minimum Data |
|---|---|
| Location | Name, type, description, status |
| Process | Name, description, process type, location, status |
| Equipment | Name, equipment type, location, related process, status |
| SEG | Name, description, worker role/group, associated locations/processes, status |

### Verification Gates

- A Process should not be Active without at least one Location.
- Equipment should not be Active without a Location.
- A SEG should not be Active without a worker role/group description.
- Operational records missing critical context should remain Draft or Under Review.

### Failure Modes

| Severity | Failure Mode | Impact | Mitigation |
|---|---|---|---|
| High | Processes are created without locations. | Later field work and risk records lose context. | Require process-location linkage before Active status. |
| High | SEGs are vague labels only. | Exposure assessment becomes unreliable. | Require worker role/group and associated process/location. |
| Medium | Duplicate locations or processes are created. | Reporting and filtering become messy. | Use search-before-create and duplicate warnings later. |
| Medium | Equipment floats without process/location context. | Inspections and incidents cannot be traced. | Require location and allow optional process link. |

### MVP Acceptance Criteria

- User can create Locations, Processes, Equipment, and SEGs.
- User can link Processes to Locations.
- User can link Equipment to Locations and optionally Processes.
- User can link SEGs to Processes and/or Locations.
- User can assign domain-aligned statuses.
- Later workflows can reference these records.

---

## 7. Workflow 2 — Maintain Chemical Safety Context

### Objective

Capture chemical identity, SDS status, exposure limits, storage/use context, and related hazards.

### Primary Sidebar Area

Chemical Safety

### Primary Pages

- Chemical Inventory
- SDS Library
- Exposure Limits

### Register / Record Classification

| Item | Classification |
|---|---|
| Chemical Inventory | Register |
| SDS Library | Register / Document Set |
| Exposure Limits | Register |
| Chemical Use | Relationship / Supporting record |
| Storage Location | Relationship or specialized Location |

### User Workflow

1. User creates or opens a Chemical record.
2. User enters chemical identity and basic hazard context.
3. User records SDS status and SDS reference.
4. User records exposure limit references where available.
5. User links the Chemical to storage Locations.
6. User links the Chemical to use Processes.
7. User links the Chemical to affected SEGs where known.
8. User links or creates related Hazards.
9. User records Chemical Use context where process-specific risk matters.
10. User marks the Chemical as Draft, Active, Under Review, Inactive, Retired, Archived, or Prohibited.

### Minimum Data Requirements

| Entity | Minimum Data |
|---|---|
| Chemical | Name, manufacturer/supplier, chemical type, physical state, primary hazards, SDS status, status |
| SDS | Chemical, SDS title, manufacturer/supplier, revision date, file/document reference, review status |
| Exposure Limit | Chemical/contaminant, limit type, value, units, averaging period, source |
| Chemical Use | Chemical, process, location, use description, exposure potential |
| Storage Location | Location, chemical(s), storage type, containment notes, status |

### Verification Gates

- A Chemical should have SDS status.
- A Chemical with no SDS should be clearly marked as Missing SDS.
- Exposure limits must include units, averaging period, and source.
- Chemical use should be modeled separately from chemical identity.
- A Chemical may exist in inventory without active use, but that status must be explicit.

### Failure Modes

| Severity | Failure Mode | Impact | Mitigation |
|---|---|---|---|
| Critical | Chemical is active with unknown SDS status. | Emergency response and audit-readiness gap. | Require SDS status before Active status. |
| High | Chemical use is not separated from identity. | Same chemical may be misrepresented across processes. | Model Chemical Use as process/location context. |
| High | Exposure limit has no source or units. | Sampling interpretation becomes invalid. | Require source, units, and averaging period. |
| Medium | Chemical inventory becomes a static list. | Risk context disappears. | Require links to storage/use context where known. |

### MVP Acceptance Criteria

- User can create Chemical records.
- User can track SDS status.
- User can create or reference SDS records.
- User can create or reference Exposure Limits.
- User can link Chemicals to Locations, Processes, SEGs, Hazards, and Controls where applicable.
- User can distinguish chemical identity from chemical use context.

---

## 8. Workflow 3 — Identify and Maintain Hazards

### Objective

Maintain a structured Hazard Register connected to operational context, controls, risk assessments, field findings, incidents, and corrective actions.

### Primary Sidebar Area

Risk Management

### Primary Pages

- Hazard Register
- Risk Assessments
- Controls

### Register / Record Classification

| Item | Classification |
|---|---|
| Hazard Register | Register |
| Risk Assessment | Record / Assessment |
| Control | Register |

### User Workflow

1. User creates or opens a Hazard.
2. User describes the hazard and category.
3. User links the Hazard to Location, Process, Equipment, Chemical, or SEG where possible.
4. User links existing Controls or creates new Controls.
5. User creates or links a Risk Assessment if evaluation is needed.
6. User identifies control gaps or review needs.
7. User creates Corrective Actions where gaps require follow-up.
8. User marks Hazard status as Draft, Active, Under Review, Controlled, Retired, or Archived as appropriate.

### Minimum Data Requirements

| Entity | Minimum Data |
|---|---|
| Hazard | Name, description, category, at least one context link where possible, status |
| Risk Assessment | Hazard, assessment context, severity, likelihood, exposure potential, controls, residual risk, review date, status |
| Control | Name, description, control type, hazard(s), responsible owner, verification method, status |

### Verification Gates

- A Hazard without Location, Process, Equipment, Chemical, or SEG context should be treated as incomplete.
- A Hazard should not be marked Controlled without at least one linked Control.
- A Control marked Active should have a verification method where practical.
- Retiring a Hazard should not delete related historical records.
- Risk should be assessed in context, not inferred from severity alone.

### Failure Modes

| Severity | Failure Mode | Impact | Mitigation |
|---|---|---|---|
| Critical | High-consequence hazard has no control record. | False risk posture. | Require control gap visibility. |
| High | Hazard has no operational context. | Poor field usability and weak traceability. | Treat as incomplete until context is added. |
| High | Control exists only as text without verification method. | Weak audit and field assurance. | Require verification method for Active controls where practical. |
| Medium | Risk assessment becomes isolated paperwork. | No connection to action or control status. | Link Risk Assessment to Hazard and Controls. |

### MVP Acceptance Criteria

- User can create Hazards.
- User can link Hazards to operational and chemical context.
- User can create and link Controls.
- User can create Risk Assessments tied to Hazards.
- User can create Corrective Actions from Hazards or Risk Assessments.
- User can identify hazards that are incomplete, under review, controlled, retired, or archived.

---

## 9. Workflow 4 — Capture Field Observation

### Objective

Capture lightweight field intelligence without forcing every issue into a formal inspection, audit, or incident workflow.

### Primary Sidebar Area

Field Work

### Primary Page

Observations

### Register / Record Classification

| Item | Classification |
|---|---|
| Observation | Record |
| Evidence | Supporting concept |
| Corrective Action | Record / Work Item |

### User Workflow

1. User creates an Observation.
2. User enters date/time, title, and description.
3. User selects Location.
4. User links Process, Equipment, Chemical, Hazard, or Control where applicable.
5. User assigns severity or priority.
6. User attaches or references photos, notes, measurements, or other evidence if available.
7. User marks whether follow-up is required.
8. User creates a Corrective Action if follow-up is required.
9. User sets status as Open, Reviewed, Action Required, Closed, or Archived.

### Minimum Data Requirements

| Entity | Minimum Data |
|---|---|
| Observation | Title, description, date/time, location, observer, severity/priority, follow-up required, status |
| Evidence | Source record, evidence type, description or file/reference |
| Corrective Action | Source type, source reference, owner, due date, priority, status |

### Verification Gates

- Observation must preserve date/time, observer, location, and finding context.
- Photos and notes must remain linked to the Observation that created them.
- Observation marked Action Required should create or link a Corrective Action.
- A serious Observation should not close without review or documented rationale.

### Failure Modes

| Severity | Failure Mode | Impact | Mitigation |
|---|---|---|---|
| High | Observation captures issue but no follow-up. | Field issue disappears. | Require follow-up flag and action link when needed. |
| Medium | Observation form is too heavy. | User avoids field capture. | Keep initial capture lightweight. |
| Medium | Evidence floats without source context. | Weak audit trail. | Evidence must attach to source record. |
| Medium | Positive observations are not supported. | System becomes punitive only. | Allow safe behavior/control-working-as-intended types. |

### MVP Acceptance Criteria

- User can create Observations quickly.
- User can link Observations to operational context.
- User can attach or reference evidence.
- User can create Corrective Actions from Observations.
- User can filter Observations by location, status, severity/priority, and follow-up need.

---

## 10. Workflow 5 — Perform Inspection

### Objective

Create structured field inspection records, identify findings, verify controls, and generate corrective actions where needed.

### Primary Sidebar Area

Field Work

### Primary Page

Inspections

### Register / Record Classification

| Item | Classification |
|---|---|
| Inspection | Record |
| Finding | Supporting concept |
| Corrective Action | Record / Work Item |
| Verification | Record |

### User Workflow

1. User creates an Inspection.
2. User defines inspection type, scope, and criteria.
3. User selects Location and optionally Process, Equipment, Chemical, Control, or Compliance requirement.
4. User records findings.
5. User marks findings as no action required or action required.
6. User creates Corrective Actions from findings where required.
7. User uses inspection evidence to verify Controls where applicable.
8. User marks status as Planned, In Progress, Complete, Requires Action, Closed, or Archived.

### Minimum Data Requirements

| Entity | Minimum Data |
|---|---|
| Inspection | Title, type, date/time, location, scope, criteria, inspector, findings, evidence, status |
| Finding | Source, description, severity/priority, outcome |
| Corrective Action | Source type, source reference, owner, due date, priority, status |

### Verification Gates

- Inspection cannot be complete without scope, date/time, inspector, and location.
- Findings requiring action should create or link Corrective Actions.
- Control verification should reference evidence or method.
- Inspection should not close while required Corrective Actions remain unresolved unless formally justified.

### Failure Modes

| Severity | Failure Mode | Impact | Mitigation |
|---|---|---|---|
| High | Findings remain buried in notes. | Deficiencies are not tracked. | Findings can create Corrective Actions. |
| High | Inspection closes while action is still open. | Weak follow-through. | Closure should show linked action status. |
| Medium | Inspection has no defined scope or criteria. | Record is hard to defend. | Require scope and criteria. |
| Medium | Inspection duplicates observation workflow. | Domain confusion. | Use Inspection for structured checks; Observation for lightweight field intelligence. |

### MVP Acceptance Criteria

- User can create Inspection records.
- User can record findings.
- User can create Corrective Actions from findings.
- User can link Inspection to Location, Equipment, Process, Chemical, Control, or Compliance requirement.
- User can distinguish Complete from Closed.

---

## 11. Workflow 6 — Conduct Audit

### Objective

Track formal audit activity against a standard, regulation, internal requirement, permit, or management-system expectation.

### Primary Sidebar Area

Field Work

### Primary Page

Audits

### Register / Record Classification

| Item | Classification |
|---|---|
| Audit | Record |
| Finding | Supporting concept |
| Corrective Action | Record / Work Item |
| Document | Register |

### User Workflow

1. User creates an Audit.
2. User defines audit type, scope, criteria, and date.
3. User links applicable Compliance requirements, Documents, Locations, Processes, Equipment, Chemicals, Hazards, or Controls.
4. User records findings and evidence.
5. User identifies whether findings require Corrective Actions.
6. User creates Corrective Actions where required.
7. User marks status as Planned, In Progress, Complete, Findings Issued, Closed, or Archived.

### Minimum Data Requirements

| Entity | Minimum Data |
|---|---|
| Audit | Title, type, scope, criteria, date, auditor, findings, evidence, status |
| Finding | Source audit, description, criterion, outcome, severity/priority |
| Corrective Action | Source type, source reference, owner, due date, priority, status |

### Verification Gates

- Audit should not be Closed while unresolved findings require Corrective Actions.
- Waived findings require justification.
- Audit evidence should link to the audit or finding it supports.
- Audit findings should not replace source records such as Hazards, Controls, or Documents.

### Failure Modes

| Severity | Failure Mode | Impact | Mitigation |
|---|---|---|---|
| High | Audit produces findings but no action trail. | Audit-readiness failure. | Findings generate Corrective Actions. |
| High | Audit scope is vague. | Audit cannot be defended later. | Require scope and criteria. |
| Medium | Audit becomes a document dump. | Source records remain stale. | Link audit to source entities and actions. |
| Medium | Audit finding overwrites source hazard/control context. | Historical traceability weakens. | Keep audit findings as records linked to source entities. |

### MVP Acceptance Criteria

- User can create Audit records.
- User can define scope and criteria.
- User can record findings and evidence.
- User can create Corrective Actions from findings.
- User can link Audit records to Compliance, Documents, Hazards, Controls, and operational context.

---

## 12. Workflow 7 — Air Sampling Event

### Objective

Document exposure monitoring activity and connect results to SEGs, chemicals/contaminants, processes, locations, controls, exposure limits, risk assessments, and follow-up.

### Primary Sidebar Area

Field Work

### Primary Page

Air Sampling

### Register / Record Classification

| Item | Classification |
|---|---|
| Air Sampling Event | Record |
| Exposure Limit | Register |
| SEG | Register |
| Chemical / Contaminant | Register |
| Corrective Action | Record / Work Item |

### User Workflow

1. User creates an Air Sampling Event.
2. User selects SEG.
3. User selects Chemical or contaminant.
4. User selects Location and Process/task.
5. User records sampling method and sample duration.
6. User records result and units when available.
7. User selects or references the Exposure Limit used for comparison.
8. User enters interpretation.
9. User marks follow-up required when results exceed limits, indicate concern, or require review.
10. User creates Corrective Actions where required.
11. User marks status as Planned, Collected, Awaiting Lab Results, Interpreted, Follow-Up Required, Closed, or Archived.

### Minimum Data Requirements

| Entity | Minimum Data |
|---|---|
| Air Sampling Event | Title, date, SEG, chemical/contaminant, location, process/task, method, duration, result status, status |
| Result | Result value, units, exposure limit comparison, interpretation |
| Corrective Action | Source type, source reference, owner, due date, priority, status |

### Verification Gates

- Air Sampling Event should belong to a SEG.
- Result must include units before comparison.
- Exposure limit comparison must identify limit source, units, and averaging period.
- Awaiting lab results must remain visible as an open state.
- Follow-up required should create Corrective Action or documented rationale.
- Sampling interpretation may inform Risk Assessments but should not silently overwrite them.

### Failure Modes

| Severity | Failure Mode | Impact | Mitigation |
|---|---|---|---|
| Critical | Result is interpreted without units or exposure-limit source. | Invalid exposure conclusion. | Require units, source, and averaging period. |
| High | Sampling not tied to SEG. | Exposure assessment value is weakened. | Require SEG for event. |
| High | Exceedance has no follow-up. | Serious risk-management failure. | Trigger Corrective Action or rationale. |
| Medium | Sampling result updates risk posture without review. | Bad domain drift. | Use result to inform Risk Assessment review. |

### MVP Acceptance Criteria

- User can create Air Sampling Events.
- User can link event to SEG, Chemical/contaminant, Location, Process/task, and Exposure Limit.
- User can enter result, units, and interpretation.
- User can mark follow-up required.
- User can create Corrective Actions from sampling concerns.

---

## 13. Workflow 8 — Near Miss, Incident, and Investigation

### Objective

Capture event-based safety records, preserve original report details, support investigations, and drive corrective actions.

### Primary Sidebar Area

Incidents

### Primary Pages

- Near Misses
- Incidents
- Investigations

### Register / Record Classification

| Item | Classification |
|---|---|
| Near Miss | Record |
| Incident | Record |
| Investigation | Record |
| Corrective Action | Record / Work Item |
| Evidence | Supporting concept |

### User Workflow — Near Miss

1. User creates a Near Miss.
2. User records title, description, date/time, and Location.
3. User links Process, Equipment, Chemical, Hazard, Control, or SEG where applicable.
4. User records potential severity and immediate response.
5. User marks whether investigation is required.
6. User creates Investigation or Corrective Actions if required.
7. User marks status as Reported, Under Review, Investigation Required, Action Required, Closed, or Archived.

### User Workflow — Incident

1. User creates an Incident.
2. User records title, description, date/time, Location, incident type, actual severity, and potential severity.
3. User records involved people only as needed for HSE accountability and evidence.
4. User links Process, Equipment, Chemical, Hazard, Control, or SEG where applicable.
5. User records immediate response and notifications.
6. User creates or links Investigation if required.
7. User creates Corrective Actions if required.
8. User marks status as Reported, Under Response, Under Investigation, Action Required, Closed, or Archived.

### User Workflow — Investigation

1. User creates an Investigation from an Incident or Near Miss.
2. User records investigator, date, event description, and timeline.
3. User identifies contributing factors, root causes, and failed or missing controls.
4. User links Hazards and Controls.
5. User creates Corrective Actions.
6. User updates Risk Assessments where needed.
7. User marks status as Not Started, In Progress, Draft Complete, Under Review, Complete, or Archived.

### Verification Gates

- Incident report details should be preserved even if investigation changes interpretation.
- Investigation findings should not overwrite the original incident report.
- Incident or Near Miss should not close while required Investigation or Corrective Actions remain unresolved.
- Corrective Actions from incidents should remain linked to the incident and investigation.
- Serious events should require documented review before closure.

### Failure Modes

| Severity | Failure Mode | Impact | Mitigation |
|---|---|---|---|
| Critical | Incident closes with unresolved action. | Recurrence and compliance risk. | Closure checks linked action status. |
| High | Investigation overwrites original event report. | Historical record is distorted. | Preserve report and investigation separately. |
| High | Immediate response is confused with corrective action. | Root cause remains unresolved. | Separate immediate response from corrective action. |
| Medium | Near misses are treated as low-value notes. | Learning opportunity lost. | Allow near miss to create Investigation and Actions. |

### MVP Acceptance Criteria

- User can create Near Miss and Incident records.
- User can link events to operational and hazard context.
- User can create Investigations where needed.
- User can create Corrective Actions from Near Misses, Incidents, and Investigations.
- User can prevent or visibly flag closure when required follow-up remains open.

---

## 14. Workflow 9 — Corrective Action Lifecycle

### Objective

Provide a consistent action lifecycle regardless of source.

### Primary Sidebar Area

Corrective Actions

### Primary Pages

- Open Actions
- Verification
- Closed Actions

### Register / Record Classification

| Item | Classification |
|---|---|
| Corrective Action | Record / Work Item |
| Verification | Record |
| Closure Record | Record |
| Open Actions | View |
| Closed Actions | Historical View |

### Valid Source Types

Corrective Actions may originate from:

```text
Hazard
Risk Assessment
Control
Observation
Inspection
Audit
Air Sampling Event
Near Miss
Incident
Investigation
Permit
Regulatory Calendar Item
Document Review
Management Review
Manual Entry
```

Manual Entry should be allowed, but it should require justification. It should not become the default source type.

### Corrective Action Status Model

```text
Open
Assigned
In Progress
Blocked
Complete Pending Verification
Verified
Closed
Cancelled
Archived
```

### User Workflow

1. User creates Corrective Action from a source record or with justified Manual Entry.
2. User enters title, description, source type, and source reference.
3. User assigns owner.
4. User assigns due date.
5. User assigns priority.
6. User links related Location, Process, Equipment, Chemical, Hazard, or Control where applicable.
7. User moves action to Assigned once owner and due date exist.
8. User updates action to In Progress or Blocked as work changes.
9. User enters completion notes and evidence.
10. User moves action to Complete Pending Verification if verification is required.
11. User creates Verification record.
12. User marks Verification as Passed, Failed, Reopened, or Not Required.
13. If verification passes, user marks action Verified and then Closed.
14. If verification fails, action returns to active work state.
15. If cancelled, user records justification.

### Minimum Data Requirements

| Entity | Minimum Data |
|---|---|
| Corrective Action | Title, description, source type, source reference, owner, due date, priority, status |
| Verification | Corrective action, verifier, date, method, evidence, result, comments |
| Closure Record | Corrective action, closed by, closure date, rationale, verification reference if required |

### Verification Gates

- Corrective Action should not close without source traceability.
- Corrective Action should not close without completion notes.
- Verification-required action cannot close until verification passes.
- Failed verification should reopen or return action to active state.
- Cancelled action requires justification.
- Manual Entry requires justification.

### Failure Modes

| Severity | Failure Mode | Impact | Mitigation |
|---|---|---|---|
| Critical | Corrective Action closes without verification when required. | False closure and audit weakness. | Require verification pass or justified not-required state. |
| High | Action has no source. | Cannot trace why work exists. | Require source type/reference except justified Manual Entry. |
| High | Action has no owner or due date. | No accountability. | Owner and due date required for Assigned status. |
| Medium | Closed action loses link to original hazard/finding. | Weak traceability. | Preserve source reference and related links. |
| Medium | Blocked actions disappear from visibility. | Risk remains unmanaged. | Keep Blocked visible in Open Actions. |

### MVP Acceptance Criteria

- User can create Corrective Actions from valid source records.
- User can create justified Manual Entry actions.
- User can assign owner, due date, priority, and status.
- User can record completion notes and evidence.
- User can verify closure separately from completion.
- User can view Open, Blocked, Complete Pending Verification, Verified, Closed, Cancelled, and Archived actions.

---

## 15. Workflow 10 — Compliance Tracking

### Objective

Track compliance-supporting obligations and documents without overbuilding a full enterprise compliance-management system.

### Primary Sidebar Area

Compliance

### Primary Pages

- Training
- Permits
- Regulatory Calendar
- Documents

### Register / Record Classification

| Item | Classification |
|---|---|
| Training | Register + Records |
| Permit | Register |
| Regulatory Calendar Item | Record / Obligation |
| Document | Register |
| Corrective Action | Record / Work Item |

### User Workflow — Training

1. User creates or opens a Training requirement.
2. User identifies who or what it applies to, such as Role, SEG, Process, Hazard, Chemical, Equipment, or Compliance requirement.
3. User records frequency, requirement source, completion status, expiration/refresher date, and evidence.
4. User creates follow-up action if training is overdue, missing, or requires review.

### User Workflow — Permit

1. User creates or opens a Permit.
2. User records permit type, authority/issuing body, applicable location/process/equipment, effective date, expiration date, renewal date, and key obligations.
3. User links supporting Document reference.
4. User creates Regulatory Calendar Items for renewal or recurring obligations.
5. User creates Corrective Actions for gaps or missed obligations.

### User Workflow — Regulatory Calendar Item

1. User creates Calendar Item.
2. User records title, description, requirement source, due date, recurrence, owner, and related permit/document/process/location.
3. User records completion evidence when done.
4. User marks status as Upcoming, Due Soon, Overdue, Complete, Cancelled, or Archived.
5. User creates Corrective Action if missed or incomplete.

### User Workflow — Document

1. User creates or opens Document record.
2. User records title, document type, owner, revision, effective date, review date, file reference, related entities, and status.
3. User links Document to Compliance, Training, Permits, Chemicals, Hazards, Controls, Processes, or Audits where applicable.
4. User creates Calendar Item for review if needed.
5. User creates Corrective Action if document is missing, stale, or requires update.

### Verification Gates

- Permit should preserve expiration and renewal context.
- Regulatory Calendar Item should have owner and due date.
- Document should preserve revision context.
- Compliance evidence should link to the obligation it supports.
- Missed or incomplete compliance obligation should create Corrective Action or documented rationale.
- Compliance records must not imply legal compliance by existence alone.

### Failure Modes

| Severity | Failure Mode | Impact | Mitigation |
|---|---|---|---|
| High | Compliance date exists only inside a document. | Deadline missed. | Create Regulatory Calendar Item. |
| High | Permit lacks renewal/expiration context. | Permit lapse risk. | Require expiration/renewal dates when applicable. |
| Medium | Document has no owner or review date. | Stale program document. | Require owner and review metadata where applicable. |
| Medium | Training requirement is disconnected from role/SEG/hazard. | Weak audit and worker protection. | Link Training to applicable entity. |
| Medium | Compliance module becomes a document dump. | No operational value. | Link records to obligations, evidence, and actions. |

### MVP Acceptance Criteria

- User can create Training, Permit, Regulatory Calendar Item, and Document records.
- User can track due dates, review dates, expiration dates, and evidence.
- User can link compliance records to operational and risk context.
- User can create Corrective Actions from compliance gaps.
- User can see upcoming, due soon, overdue, complete, cancelled, and archived obligations.

---

## 16. Workflow 11 — Dashboard Review

### Objective

Provide a reorientation surface that helps the user understand current HSE posture without making the Dashboard the main editing surface.

### Primary Sidebar Area

Dashboard

### Primary Route

`/`

### User Workflow

1. User opens OLUSO.
2. Dashboard summarizes current system posture.
3. User reviews open risks, overdue actions, recent activity, upcoming compliance items, and records needing review.
4. User clicks into the owning module to act on the source record.
5. User returns to Dashboard for reorientation.

### Dashboard Should Surface

- Open Corrective Actions
- Overdue Corrective Actions
- Complete Pending Verification actions
- High-priority Hazards
- Records Under Review
- Missing SDS status
- Upcoming Regulatory Calendar Items
- Overdue Compliance Items
- Recent Observations
- Recent Incidents or Near Misses
- Recent Air Sampling Events awaiting lab results or interpretation

### Verification Gates

- Dashboard should not become the owner of source data.
- Dashboard cards should link back to source records.
- Draft records should be visually distinguishable from active records.
- Counts should not hide incomplete or stale records.

### Failure Modes

| Severity | Failure Mode | Impact | Mitigation |
|---|---|---|---|
| High | Dashboard looks complete but source records are weak. | False confidence. | Dashboard must link to source records and flag incomplete data. |
| Medium | Dashboard becomes main editing surface. | Ownership confusion. | Editing remains in owning sections. |
| Medium | Metrics hide verification state. | Closure quality is obscured. | Separate complete, pending verification, verified, and closed counts. |

### MVP Acceptance Criteria

- Dashboard can summarize open actions, overdue work, records needing review, and recent activity.
- Dashboard items link to source records.
- Dashboard does not replace register ownership.

---

## 17. Workflow 12 — Reports and Review Outputs

### Objective

Generate review and export outputs from existing registers and records.

### Primary Sidebar Area

Reports

### Register / Record Classification

| Item | Classification |
|---|---|
| Report | Projection |
| Saved Report | Deferred future record, if justified |

### User Workflow

1. User opens Reports.
2. User selects report type.
3. User selects filters such as location, process, date range, status, owner, severity, priority, or record type.
4. System generates output from source records.
5. User reviews source links.
6. User exports or saves output only if supported by the implementation phase.

### Initial Report Types

| Report | Purpose |
|---|---|
| Open Corrective Actions | Show open, blocked, overdue, and pending-verification actions. |
| Hazard Register Summary | Show hazards, context links, controls, and review status. |
| Chemical Inventory Summary | Show chemicals, SDS status, locations, process use, and exposure-limit references. |
| Field Work Summary | Show observations, inspections, audits, and sampling records. |
| Incident Summary | Show near misses, incidents, investigations, and action status. |
| Compliance Calendar | Show upcoming, due soon, overdue, and completed obligations. |
| Air Sampling Summary | Show sampling events, SEGs, target agents, results, interpretation, and follow-up. |

### Verification Gates

- Reports should be generated from structured source data.
- Reports should preserve links back to source records.
- Reports should distinguish Draft, Active, Under Review, Closed, Archived, and incomplete records.
- Reports should not replace source records.
- Saved reports should be deferred until the application needs saved report records.

### Failure Modes

| Severity | Failure Mode | Impact | Mitigation |
|---|---|---|---|
| High | Report becomes manual document disconnected from source records. | Data drift. | Treat reports as projections. |
| Medium | Report hides incomplete data. | False audit readiness. | Flag drafts, missing links, and under-review records. |
| Medium | Report builder is overbuilt too early. | MVP scope creep. | Start with fixed reports and filters. |

### MVP Acceptance Criteria

- User can generate basic summaries from source records.
- Reports preserve source links.
- Reports show incomplete, overdue, and pending-verification states.
- Reports remain projections unless saved report records are explicitly added later.

---

## 18. Cross-Workflow Status Models

### 18.1 General Register Item Status

Used for durable objects such as Chemicals, Locations, Processes, Equipment, SEGs, Hazards, Controls, Permits, and Documents.

```text
Draft
Active
Under Review
Inactive
Retired
Archived
```

### 18.2 Field Record Status

Used for Observations, Inspections, Audits, and Sampling Events.

```text
Planned
In Progress
Complete
Requires Action
Closed
Archived
```

Some field records may use specialized status labels, such as:

```text
Awaiting Lab Results
Interpreted
Findings Issued
```

### 18.3 Incident Status

Used for Near Misses and Incidents.

```text
Reported
Under Review
Under Investigation
Action Required
Closed
Archived
```

### 18.4 Corrective Action Status

Used for Corrective Actions.

```text
Open
Assigned
In Progress
Blocked
Complete Pending Verification
Verified
Closed
Cancelled
Archived
```

### 18.5 Verification Status

Used for Verification records.

```text
Not Required
Required
Pending
Passed
Failed
Reopened
```

---

## 19. Cross-Workflow Data Rules

### 19.1 Evidence Rule

Evidence should always attach to a source record.

Evidence should not float independently without context.

Acceptable evidence examples:

- Photo
- File reference
- Note
- Measurement
- Lab result
- Checklist response
- Document reference
- Report excerpt
- Completion comment
- Verification comment

### 19.2 Source Traceability Rule

Corrective Actions and Verifications must preserve source context.

At minimum:

- Source type
- Source reference
- Related entity links where applicable
- Status
- Completion or verification notes

### 19.3 Archive Rule

Audit-relevant records should prefer archival over destructive deletion.

This applies especially to:

- Chemical records
- SDS records
- Exposure limits
- Hazards
- Risk assessments
- Field records
- Incidents
- Corrective actions
- Verifications
- Compliance records
- Documents

### 19.4 Manual Entry Rule

Manual Entry should exist as a fallback, not a default workflow.

A manually created Corrective Action should require justification because source traceability is weaker.

### 19.5 Incomplete Data Rule

Incomplete records are allowed, but they must be visible as incomplete.

Do not let the UI imply that missing data is equivalent to “not applicable,” “safe,” “complete,” or “compliant.”

---

## 20. MVP Workflow Priority

### Must Have

The first build should prioritize:

- Operational Context workflow
- Chemical Safety Context workflow
- Hazard Register workflow
- Observation workflow
- Inspection workflow
- Corrective Action lifecycle
- Verification workflow
- Basic Dashboard review
- Basic Reports projections

### Should Have

The first version should also prepare for:

- Air Sampling Event workflow
- Incident / Near Miss workflow
- Document record workflow
- Regulatory Calendar Item workflow
- Basic Compliance tracking

### Defer Until Later

The following should remain conceptually defined but not treated as required for the first implementation pass:

- Full permit management
- Full regulatory calendar
- Full training management
- Full report builder
- Advanced sampling analytics
- Document revision workflows
- Multi-user permissions
- Advanced audit module
- Map/geospatial features
- External integrations
- Cloud sync
- Mobile-first inspection mode
- Advanced workflow automation

---

## 21. Implementation Implications

Later technical documents should account for these workflow requirements.

### 21.1 Routing

Routes should reflect sidebar ownership. Detail pages and forms should belong to the owning domain even when records link across domains.

### 21.2 UI Architecture

The UI should support:

- Register list views
- Record detail views
- Create/edit forms
- Linked-record panels
- Status badges
- Evidence sections
- Corrective action panels
- Verification sections
- Source traceability breadcrumbs

### 21.3 State Management

State should preserve:

- Draft form data
- Active filters
- Selected record context
- Linked record relationships
- Pending verification state
- Dirty/unsaved changes
- Local persistence errors

### 21.4 Reports

Reports should be generated views over source records.

The system should avoid creating saved report objects until the need is proven.

---

## 22. Completion Criteria for This Document

This document is complete when it provides enough workflow clarity to support:

- Routing design
- UI architecture
- State-management planning
- Register and record design
- Corrective action behavior
- Verification behavior
- MVP build sequencing
- Field usability decisions
- Scope-boundary decisions

The next document should define the visual and interaction principles OLUSO should follow while supporting these workflows.
