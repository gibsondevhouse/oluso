# 04 — Domain Model

Project: OLUSO
Status: Draft
Last Updated: 2026-07-05

---

## 1. Purpose

This document defines the conceptual domain model for OLUSO.

The domain model identifies the real-world objects OLUSO manages, how those objects relate to each other, and which rules must remain stable across the application.

This document exists to prevent the application from becoming a set of disconnected pages. OLUSO must operate as a traceable HSE system where chemicals, processes, hazards, controls, inspections, incidents, corrective actions, and compliance evidence can be connected.

The central modeling question is:

> What does OLUSO track, how are those things related, and what must always remain true?

---

## 2. Scope

This document defines:

* Core domain areas
* Primary entities
* Supporting entities
* Entity relationships
* Register versus record distinctions
* Common status models
* Traceability rules
* Domain assumptions
* Open modeling questions

This document does not define:

* Database schema
* Final TypeScript interfaces
* API contracts
* UI component structure
* Route structure
* Form layouts
* Storage implementation
* Sync behavior
* Authentication or authorization model

Implementation-specific decisions belong in later documents, especially:

* `09-routing.md`
* `10-ui-architecture.md`
* `11-state-management.md`
* Future data/storage architecture documentation
* ADRs where a modeling decision requires justification

---

## 3. Domain Objectives

OLUSO must support the following domain objectives.

### 3.1 Operational Visibility

The system must make it clear where work happens, what processes exist, what equipment is involved, and which groups of workers may be exposed to hazards.

### 3.2 Chemical Safety Control

The system must track chemicals, SDS information, exposure limits, storage/use locations, and chemical relationships to processes, hazards, controls, and exposure assessments.

### 3.3 Risk Traceability

The system must connect hazards to risk assessments, controls, field findings, corrective actions, and verification evidence.

### 3.4 Field Execution

The system must support inspections, observations, audits, sampling events, and other field records without forcing the user to write formal reports for every small finding.

### 3.5 Corrective Action Accountability

The system must track corrective actions from source through assignment, due date, completion, verification, and closure.

### 3.6 Audit Readiness

The system must preserve enough context to show why an action was created, who owned it, what changed, how closure was verified, and what evidence supports the decision.

---

## 4. Core Domain Areas

OLUSO is organized around the following domain areas.

| Domain Area        | Purpose                                                                        |
| ------------------ | ------------------------------------------------------------------------------ |
| Operations         | Tracks the physical and process structure of the workplace.                    |
| Chemical Safety    | Tracks chemicals, SDS records, exposure limits, and chemical-use context.      |
| Risk Management    | Tracks hazards, risk assessments, and controls.                                |
| Field Work         | Tracks observations, inspections, audits, and air sampling events.             |
| Incidents          | Tracks near misses, incidents, and investigations.                             |
| Corrective Actions | Tracks assigned actions, verification, and closure.                            |
| Compliance         | Tracks permits, training, regulatory calendar items, and controlled documents. |
| Reports            | Presents views, summaries, exports, and management-level outputs.              |

---

## 5. Modeling Principles

### 5.1 Registers Track Durable Operational Objects

A register is a managed list of durable objects that remain relevant over time.

Examples:

* Chemical Inventory
* Process Register
* Equipment Register
* SEG Register
* Hazard Register
* Permit Register
* Document Register

Registers answer:

> What exists in the operation?

### 5.2 Records Capture Events, Findings, Evidence, or Changes

A record is a time-bound item created because something happened, was observed, was reviewed, was sampled, was inspected, or was changed.

Examples:

* Inspection record
* Observation record
* Audit finding
* Air sampling event
* Incident record
* Investigation note
* Corrective action update
* Verification record
* SDS revision record
* Permit renewal event

Records answer:

> What happened, when did it happen, and what evidence exists?

### 5.3 Entities Must Be Linkable

Core entities must not be isolated. A chemical may link to a process. A process may link to hazards. A hazard may link to controls. A field inspection may create a corrective action. A corrective action must retain its source.

OLUSO should prioritize traceability over visual simplicity.

### 5.4 Corrective Actions Require Source Traceability

A corrective action should not exist as an orphaned task.

Every corrective action should have a source, such as:

* Hazard
* Risk assessment
* Inspection
* Audit
* Observation
* Air sampling event
* Incident
* Near miss
* Investigation
* Compliance calendar item
* Management review

### 5.5 Closure Requires Verification

Corrective action closure is not the same as action completion.

Completion means the assignee claims the work was done.

Verification means a competent reviewer confirms that the action was effective enough to close.

### 5.6 Compliance Is Evidence-Driven

Compliance features should not become a vague document folder. Compliance records must connect to permits, training, calendar obligations, documents, findings, actions, or evidence.

### 5.7 Reports Are Projections

Reports are not primary domain objects in the first version.

Reports should mostly be generated from registers and records. A report may eventually become a saved object, but the initial domain model should treat reports as views over existing data.

---

## 6. Core Entity Catalog

## 6.1 Operations Domain

### 6.1.1 Location

A Location represents a physical site, building, area, room, yard, warehouse, production unit, storage area, or field location where work occurs.

Examples:

* Main production building
* Tank farm
* Bulk storage area
* Warehouse
* Lab
* Waste accumulation area
* Rail spur
* Mixing room
* Packaging line

Primary purpose:

> Establish where work, hazards, equipment, chemicals, inspections, incidents, and compliance obligations exist.

Key relationships:

* Location contains Equipment.
* Location contains or hosts Processes.
* Location may store Chemicals.
* Location may have Hazards.
* Location may have Permits.
* Location may be referenced by Inspections, Observations, Audits, Incidents, and Air Sampling Events.

Minimum conceptual fields:

* Name
* Type
* Description
* Parent location
* Status
* Notes

Status examples:

* Active
* Inactive
* Decommissioned
* Planned

---

### 6.1.2 Process

A Process represents a recurring operational activity or production workflow.

Examples:

* Bulk chemical transfer
* Powder blending
* Milling
* Granulation
* Packaging
* Tank cleaning
* Rail unloading
* Waste handling
* Lab testing
* Maintenance work

Primary purpose:

> Describe what work is performed and connect that work to chemicals, equipment, hazards, controls, SEGs, and exposure concerns.

Key relationships:

* Process occurs at one or more Locations.
* Process may use Equipment.
* Process may use Chemicals.
* Process may expose one or more SEGs.
* Process may have Hazards.
* Process may have Controls.
* Process may be inspected or audited.
* Process may be involved in an Incident or Near Miss.

Minimum conceptual fields:

* Name
* Description
* Process type
* Location(s)
* Associated equipment
* Associated chemicals
* Associated SEGs
* Status
* Notes

Status examples:

* Active
* Inactive
* Seasonal
* Planned
* Retired

---

### 6.1.3 Equipment

Equipment represents physical assets used in operations.

Examples:

* Tank
* Pump
* Mixer
* Mill
* Conveyor
* Fill station
* Forklift
* Ventilation unit
* Dust collector
* Air compressor
* Nitrogen system
* Emergency shower
* Eyewash station

Primary purpose:

> Track assets that may create hazards, require inspections, support controls, or become involved in incidents.

Key relationships:

* Equipment belongs to or is located at a Location.
* Equipment may support one or more Processes.
* Equipment may have Hazards.
* Equipment may have Controls.
* Equipment may be referenced in Inspections, Observations, Incidents, and Corrective Actions.

Minimum conceptual fields:

* Name
* Equipment type
* Location
* Related process
* Description
* Status
* Notes

Status examples:

* Active
* Out of service
* Maintenance required
* Decommissioned
* Planned

---

### 6.1.4 SEG

SEG means Similar Exposure Group.

A SEG represents a group of workers or roles expected to have similar exposure potential because they perform similar tasks, work in similar areas, or interact with similar hazards.

Examples:

* Formulation operators
* Packaging operators
* Maintenance technicians
* Lab personnel
* Warehouse operators
* Bulk unloading personnel
* Supervisors with routine floor presence

Primary purpose:

> Connect workers and job functions to exposure potential, sampling strategy, controls, and process hazards.

Key relationships:

* SEG may be associated with one or more Processes.
* SEG may be associated with one or more Locations.
* SEG may be associated with Chemicals.
* SEG may be associated with Hazards.
* SEG may have Air Sampling Events.
* SEG may have Exposure Profiles.

Minimum conceptual fields:

* Name
* Description
* Worker role or group
* Associated locations
* Associated processes
* Associated chemicals
* Exposure concerns
* Status
* Notes

Status examples:

* Active
* Under review
* Retired

---

## 6.2 Chemical Safety Domain

### 6.2.1 Chemical

A Chemical represents a substance, product, formulation ingredient, raw material, intermediate, waste stream, or finished material tracked for safety purposes.

Examples:

* Solvent
* Pesticide active ingredient
* Surfactant
* Caustic
* Acid
* Dust-generating powder
* Finished formulated product
* Waste solvent
* Cleaning chemical

Primary purpose:

> Track chemical identity, hazard context, SDS linkage, exposure limits, storage/use locations, and process relationships.

Key relationships:

* Chemical may have one or more SDS records.
* Chemical may have one or more Exposure Limits.
* Chemical may be used in one or more Processes.
* Chemical may be stored at one or more Locations.
* Chemical may be associated with Hazards.
* Chemical may be associated with Controls.
* Chemical may be involved in an Incident or Near Miss.
* Chemical may be sampled during an Air Sampling Event.

Minimum conceptual fields:

* Name
* Synonyms
* CAS number, if applicable
* Manufacturer or supplier
* Chemical type
* Physical state
* Primary hazards
* SDS reference
* Exposure limit reference
* Storage locations
* Use locations
* Status
* Notes

Status examples:

* Active
* Inactive
* Under review
* Retired
* Prohibited

---

### 6.2.2 SDS

An SDS represents a Safety Data Sheet associated with a Chemical.

Primary purpose:

> Preserve safety documentation and revision context for chemicals used or stored in the operation.

Key relationships:

* SDS belongs to a Chemical.
* SDS may support hazard classification.
* SDS may support PPE selection.
* SDS may support emergency response planning.
* SDS may be used as compliance evidence.

Minimum conceptual fields:

* Chemical
* SDS title
* Manufacturer or supplier
* Revision date
* File or document reference
* Review status
* Notes

Status examples:

* Current
* Needs review
* Superseded
* Missing
* Archived

---

### 6.2.3 Exposure Limit

An Exposure Limit represents an occupational exposure benchmark for a Chemical or contaminant.

Examples:

* OSHA PEL
* ACGIH TLV
* NIOSH REL
* Internal occupational exposure limit
* Short-term exposure limit
* Ceiling limit

Primary purpose:

> Support exposure assessment, sampling interpretation, and risk evaluation.

Key relationships:

* Exposure Limit belongs to a Chemical or contaminant.
* Exposure Limit may be referenced during Air Sampling interpretation.
* Exposure Limit may support Risk Assessments.
* Exposure Limit may support SEG Exposure Profiles.

Minimum conceptual fields:

* Chemical or contaminant
* Limit type
* Limit value
* Units
* Averaging period
* Source
* Notes

Status examples:

* Active
* Superseded
* Internal only
* Under review

---

### 6.2.4 Chemical Use

Chemical Use represents the relationship between a Chemical and the operational context where it is used.

Primary purpose:

> Avoid treating chemical inventory as just a static list. Chemical risk depends on where and how the material is used.

Key relationships:

* Chemical Use links Chemical to Process.
* Chemical Use may link Chemical to Location.
* Chemical Use may link Chemical to SEG.
* Chemical Use may link Chemical to Hazard and Controls.

Minimum conceptual fields:

* Chemical
* Process
* Location
* Use description
* Approximate quantity or scale
* Frequency
* Exposure potential
* Notes

Status examples:

* Active
* Inactive
* Under review

---

### 6.2.5 Storage Location

Storage Location represents where chemicals are stored.

This may be modeled as a specialized Location or as a relationship between Chemical and Location.

Primary purpose:

> Track where chemicals are kept, especially where storage affects emergency response, inspections, compatibility, spill planning, or regulatory applicability.

Key relationships:

* Storage Location belongs to a Location.
* Storage Location may store one or more Chemicals.
* Storage Location may have Hazards.
* Storage Location may have Controls.
* Storage Location may have Permits or compliance obligations.
* Storage Location may be inspected.

Minimum conceptual fields:

* Location
* Chemical(s)
* Storage type
* Approximate capacity
* Containment notes
* Compatibility notes
* Emergency response notes
* Status

Status examples:

* Active
* Inactive
* Under review
* Decommissioned

---

## 6.3 Risk Management Domain

### 6.3.1 Hazard

A Hazard represents a source of potential harm.

Examples:

* Chemical inhalation hazard
* Skin contact hazard
* Flammable liquid hazard
* Combustible dust hazard
* Oxygen-deficient atmosphere
* Noise exposure
* Heat stress
* Forklift traffic
* Stored energy
* Fall hazard
* Confined space hazard
* Ergonomic strain

Primary purpose:

> Track recognized hazards and connect them to risk assessments, controls, field findings, incidents, and corrective actions.

Key relationships:

* Hazard may belong to a Location.
* Hazard may belong to a Process.
* Hazard may belong to Equipment.
* Hazard may belong to a Chemical.
* Hazard may affect one or more SEGs.
* Hazard may have one or more Controls.
* Hazard may have one or more Risk Assessments.
* Hazard may generate Corrective Actions.
* Hazard may be referenced by Field Work or Incidents.

Minimum conceptual fields:

* Name
* Description
* Hazard category
* Associated location
* Associated process
* Associated equipment
* Associated chemical
* Affected SEG(s)
* Existing controls
* Risk assessment reference
* Status
* Notes

Status examples:

* Active
* Controlled
* Under review
* Retired

---

### 6.3.2 Risk Assessment

A Risk Assessment evaluates a Hazard in context.

Primary purpose:

> Document severity, likelihood, exposure potential, existing controls, residual risk, and whether additional action is required.

Key relationships:

* Risk Assessment belongs to a Hazard.
* Risk Assessment may reference Process, Location, Equipment, Chemical, or SEG.
* Risk Assessment may identify Controls.
* Risk Assessment may create Corrective Actions.
* Risk Assessment may be reviewed after Incidents, changes, inspections, or sampling results.

Minimum conceptual fields:

* Hazard
* Assessment context
* Severity
* Likelihood
* Exposure potential
* Existing controls
* Residual risk
* Recommended actions
* Assessor
* Assessment date
* Review date
* Status
* Notes

Status examples:

* Draft
* Active
* Needs review
* Superseded
* Archived

---

### 6.3.3 Control

A Control represents a measure used to eliminate, reduce, isolate, warn against, or manage a Hazard.

Examples:

* Elimination
* Substitution
* Engineering control
* Administrative control
* PPE
* Training
* Inspection
* Permit
* Procedure
* Alarm
* Ventilation
* Secondary containment
* Lockout/tagout procedure

Primary purpose:

> Track what prevents harm and how hazards are managed.

Key relationships:

* Control belongs to one or more Hazards.
* Control may apply to a Location, Process, Equipment, Chemical, or SEG.
* Control may be verified through Field Work.
* Control may be revised through Corrective Actions.
* Control may be referenced in Incidents or Investigations.

Minimum conceptual fields:

* Name
* Description
* Control type
* Hazard(s)
* Applied location/process/equipment/chemical
* Responsible owner
* Verification method
* Status
* Notes

Status examples:

* Planned
* Active
* Needs verification
* Ineffective
* Retired

---

## 6.4 Field Work Domain

### 6.4.1 Observation

An Observation is a field note documenting something seen, heard, measured, or reported.

Examples:

* Unsafe condition
* Safe behavior
* Housekeeping concern
* PPE concern
* Minor leak
* Blocked access
* Control working as intended
* Informal worker feedback

Primary purpose:

> Capture lightweight field intelligence without requiring a formal inspection or incident record.

Key relationships:

* Observation may reference Location.
* Observation may reference Process.
* Observation may reference Equipment.
* Observation may reference Chemical.
* Observation may reference Hazard.
* Observation may create Corrective Actions.

Minimum conceptual fields:

* Observation title
* Description
* Date/time
* Location
* Related process/equipment/chemical/hazard
* Severity or priority
* Photos or evidence
* Observer
* Follow-up required
* Status
* Notes

Status examples:

* Open
* Reviewed
* Action required
* Closed
* Archived

---

### 6.4.2 Inspection

An Inspection is a structured field review against defined criteria.

Examples:

* Chemical storage inspection
* Eyewash inspection
* Forklift area inspection
* Housekeeping inspection
* PPE inspection
* Waste accumulation inspection
* Fire extinguisher inspection

Primary purpose:

> Produce repeatable field records and identify findings requiring follow-up.

Key relationships:

* Inspection belongs to Location, Process, Equipment, Chemical, or Compliance requirement.
* Inspection may identify Findings.
* Inspection may create Corrective Actions.
* Inspection may verify Controls.

Minimum conceptual fields:

* Inspection title
* Inspection type
* Date/time
* Location
* Scope
* Checklist or criteria
* Findings
* Inspector
* Evidence
* Status
* Notes

Status examples:

* Planned
* In progress
* Complete
* Requires action
* Archived

---

### 6.4.3 Audit

An Audit is a formal review against a standard, regulation, internal requirement, permit, or management system expectation.

Primary purpose:

> Track formal findings, evidence, conformance status, and corrective actions.

Key relationships:

* Audit may reference Compliance requirements.
* Audit may reference Locations, Processes, Equipment, Chemicals, Hazards, Controls, or Documents.
* Audit may generate Findings.
* Audit may generate Corrective Actions.

Minimum conceptual fields:

* Audit title
* Audit type
* Scope
* Criteria
* Date
* Auditor
* Findings
* Evidence
* Status
* Notes

Status examples:

* Planned
* In progress
* Complete
* Findings issued
* Closed
* Archived

---

### 6.4.4 Air Sampling Event

An Air Sampling Event represents a sampling activity performed to evaluate airborne exposure.

Primary purpose:

> Connect exposure monitoring to SEGs, chemicals/contaminants, processes, locations, controls, and exposure limits.

Key relationships:

* Air Sampling Event belongs to a SEG.
* Air Sampling Event may reference Chemical or contaminant.
* Air Sampling Event may reference Process.
* Air Sampling Event may reference Location.
* Air Sampling Event may reference Exposure Limit.
* Air Sampling Event may inform Risk Assessments.
* Air Sampling Event may create Corrective Actions.

Minimum conceptual fields:

* Sampling event title
* Date
* SEG
* Worker role or sampled person reference
* Chemical or contaminant
* Location
* Process/task
* Sampling method
* Sample duration
* Result
* Units
* Exposure limit comparison
* Interpretation
* Follow-up required
* Status
* Notes

Status examples:

* Planned
* Collected
* Awaiting lab results
* Interpreted
* Follow-up required
* Closed
* Archived

---

## 6.5 Incidents Domain

### 6.5.1 Near Miss

A Near Miss is an event that could have resulted in injury, illness, environmental release, equipment damage, or regulatory consequence but did not.

Primary purpose:

> Capture learning opportunities before harm occurs.

Key relationships:

* Near Miss occurs at a Location.
* Near Miss may involve Process, Equipment, Chemical, Hazard, Control, or SEG.
* Near Miss may create an Investigation.
* Near Miss may create Corrective Actions.

Minimum conceptual fields:

* Title
* Description
* Date/time
* Location
* Related process/equipment/chemical/hazard
* Potential severity
* Immediate response
* Reported by
* Investigation required
* Status
* Notes

Status examples:

* Reported
* Under review
* Investigation required
* Action required
* Closed
* Archived

---

### 6.5.2 Incident

An Incident is an event that resulted in actual harm, loss, release, damage, exposure, or operational disruption.

Examples:

* Injury
* Illness
* Chemical exposure
* Spill or release
* Fire
* Equipment damage
* Environmental exceedance
* Permit deviation
* Security or emergency response event

Primary purpose:

> Preserve event details, response actions, investigation findings, corrective actions, and closure evidence.

Key relationships:

* Incident occurs at a Location.
* Incident may involve Process, Equipment, Chemical, Hazard, Control, or SEG.
* Incident may require Investigation.
* Incident may generate Corrective Actions.
* Incident may create Compliance records or notifications.

Minimum conceptual fields:

* Title
* Description
* Date/time
* Location
* Incident type
* Actual severity
* Potential severity
* People involved
* Related process/equipment/chemical/hazard
* Immediate response
* Notifications
* Investigation reference
* Corrective action references
* Status
* Notes

Status examples:

* Reported
* Under response
* Under investigation
* Action required
* Closed
* Archived

---

### 6.5.3 Investigation

An Investigation is a structured review of an Incident or Near Miss.

Primary purpose:

> Determine contributing factors, root causes, failed or missing controls, and required corrective actions.

Key relationships:

* Investigation belongs to Incident or Near Miss.
* Investigation may reference Hazards and Controls.
* Investigation may create Corrective Actions.
* Investigation may update Risk Assessments.
* Investigation may create compliance evidence.

Minimum conceptual fields:

* Investigation title
* Source event
* Investigator
* Investigation date
* Description of event
* Timeline
* Contributing factors
* Root cause analysis
* Failed controls
* Recommendations
* Corrective actions
* Status
* Notes

Status examples:

* Not started
* In progress
* Draft complete
* Under review
* Complete
* Archived

---

## 6.6 Corrective Actions Domain

### 6.6.1 Corrective Action

A Corrective Action is an assigned action intended to correct a finding, reduce risk, improve control effectiveness, or prevent recurrence.

Primary purpose:

> Track accountability from issue identification through verified closure.

Key relationships:

* Corrective Action must have a source.
* Corrective Action has an owner.
* Corrective Action may reference Location, Process, Equipment, Chemical, Hazard, Control, Incident, Audit, Inspection, Observation, Air Sampling Event, or Compliance item.
* Corrective Action may require Verification before closure.

Minimum conceptual fields:

* Title
* Description
* Source type
* Source reference
* Owner
* Due date
* Priority
* Related location/process/equipment/chemical/hazard/control
* Completion notes
* Verification requirement
* Verification record
* Status
* Notes

Status examples:

* Open
* Assigned
* In progress
* Blocked
* Complete pending verification
* Verified
* Closed
* Cancelled
* Archived

Domain rule:

> A corrective action cannot move to Closed unless verification is either completed or explicitly marked as not required with justification.

---

### 6.6.2 Verification

Verification is the review step that confirms whether a completed action was adequate.

Primary purpose:

> Separate claimed completion from confirmed effectiveness.

Key relationships:

* Verification belongs to a Corrective Action.
* Verification may reference photos, inspection results, sampling data, audit evidence, or reviewer notes.
* Verification may reopen a Corrective Action if ineffective.

Minimum conceptual fields:

* Corrective action
* Verifier
* Verification date
* Verification method
* Evidence
* Result
* Comments
* Status

Status examples:

* Not required
* Required
* Pending
* Passed
* Failed
* Reopened

---

### 6.6.3 Closure Record

A Closure Record documents the final closure of a Corrective Action.

Primary purpose:

> Preserve evidence that the issue was resolved, verified, and closed appropriately.

Key relationships:

* Closure Record belongs to Corrective Action.
* Closure Record references Verification when required.
* Closure Record may be used as audit evidence.

Minimum conceptual fields:

* Corrective action
* Closed by
* Closure date
* Closure rationale
* Verification reference
* Evidence
* Notes

Status examples:

* Closed
* Reopened
* Archived

---

## 6.7 Compliance Domain

### 6.7.1 Training

Training represents a required or completed learning obligation.

Primary purpose:

> Track whether people, roles, or SEGs have required training related to hazards, processes, chemicals, emergency response, or compliance obligations.

Key relationships:

* Training may apply to SEG, Role, Process, Hazard, Chemical, Equipment, or Compliance requirement.
* Training may be linked to Documents or Procedures.
* Training may produce completion records.

Minimum conceptual fields:

* Training title
* Training type
* Applies to
* Frequency
* Requirement source
* Completion status
* Expiration or refresher date
* Evidence
* Notes

Status examples:

* Required
* Complete
* Overdue
* Expiring soon
* Archived

---

### 6.7.2 Permit

A Permit represents a regulatory, environmental, operational, or internal authorization requirement.

Examples:

* Environmental permit
* Waste permit
* Air permit
* Stormwater permit
* Hot work permit
* Confined space permit
* Internal operating authorization

Primary purpose:

> Track permits, obligations, renewal dates, evidence, and related compliance activity.

Key relationships:

* Permit may apply to Location, Process, Equipment, Chemical, or Compliance area.
* Permit may create Regulatory Calendar Items.
* Permit may be referenced by Audits or Inspections.
* Permit may require Documents or Records.

Minimum conceptual fields:

* Permit title
* Permit type
* Authority or issuing body
* Applicable location/process/equipment
* Effective date
* Expiration date
* Renewal date
* Key obligations
* Document reference
* Status
* Notes

Status examples:

* Active
* Expiring soon
* Expired
* Under renewal
* Superseded
* Archived

---

### 6.7.3 Regulatory Calendar Item

A Regulatory Calendar Item represents a deadline, recurring compliance task, inspection requirement, submittal, review, or renewal obligation.

Primary purpose:

> Track compliance deadlines and required recurring actions.

Key relationships:

* Calendar Item may belong to Permit, Training, Document, Audit, Inspection, or Compliance requirement.
* Calendar Item may create Corrective Actions or Tasks if missed or incomplete.

Minimum conceptual fields:

* Title
* Description
* Requirement source
* Due date
* Recurrence
* Owner
* Related permit/document/process/location
* Completion evidence
* Status
* Notes

Status examples:

* Upcoming
* Due soon
* Overdue
* Complete
* Cancelled
* Archived

---

### 6.7.4 Document

A Document represents a controlled or reference document.

Examples:

* SOP
* Policy
* Program document
* Permit
* SDS
* Training material
* Inspection checklist
* Emergency plan
* Exposure assessment report
* Audit report

Primary purpose:

> Track important HSE documents, revision status, ownership, and relationships to domain entities.

Key relationships:

* Document may support Compliance, Training, Permits, Chemicals, Hazards, Controls, Processes, or Audits.
* Document may have revision records.
* Document may be used as evidence.

Minimum conceptual fields:

* Title
* Document type
* Owner
* Revision
* Effective date
* Review date
* File reference
* Related entities
* Status
* Notes

Status examples:

* Draft
* Active
* Under review
* Superseded
* Archived
* Missing

---

## 6.8 Reports Domain

### 6.8.1 Report

A Report is a view or export created from existing domain data.

Primary purpose:

> Summarize the state of the HSE system for review, communication, management, or audit use.

Examples:

* Open corrective actions report
* Chemical inventory report
* Hazard register report
* Incident summary
* Audit findings report
* Training compliance report
* Permit calendar report
* Air sampling summary

Key relationships:

* Report may aggregate data from any register or record.
* Report may eventually become saved output, but reports should not replace source records.

Minimum conceptual fields, if saved reports are later supported:

* Report title
* Report type
* Date generated
* Filters
* Data sources
* Generated by
* Export file reference
* Notes

Status examples:

* Generated
* Exported
* Archived

Initial rule:

> Reports should be treated as projections until the application needs saved report records.

---

## 7. Supporting Entity Concepts

The following supporting concepts may be needed across multiple domains.

## 7.1 Person

A Person represents an individual associated with an action, finding, observation, inspection, incident, training record, or ownership responsibility.

This does not require OLUSO to become an HR system.

Possible uses:

* Action owner
* Inspector
* Auditor
* Observer
* Verifier
* Investigator
* Trainer
* Trainee
* Reported by
* Involved person

Minimum conceptual fields:

* Name
* Role or title
* Department or group
* Contact information, if needed
* Status

Domain rule:

> Person records should exist only as needed for HSE accountability and evidence. OLUSO should not attempt to replace HR, payroll, or identity management systems.

---

## 7.2 Role

A Role represents a job function or responsibility grouping.

Examples:

* Operator
* Maintenance Technician
* Supervisor
* HSE Coordinator
* Lab Technician
* Warehouse Operator
* Contractor
* Visitor

Uses:

* Training requirements
* SEG definitions
* Inspection assignments
* Corrective action ownership
* Permissions in future versions

---

## 7.3 Evidence

Evidence represents supporting proof attached to a record.

Examples:

* Photo
* File
* Note
* Measurement
* Signature
* Document reference
* Lab result
* Checklist response
* Email export
* Report excerpt

Evidence may support:

* Observation
* Inspection
* Audit
* Incident
* Investigation
* Corrective Action
* Verification
* Closure
* Compliance item

Domain rule:

> Evidence should always be attached to a source record. Evidence should not float independently without context.

---

## 7.4 Finding

A Finding is a formal or semi-formal issue identified during field work, audit, inspection, investigation, or review.

Possible sources:

* Observation
* Inspection
* Audit
* Incident investigation
* Air sampling interpretation
* Compliance review

Possible outcomes:

* No action required
* Corrective action required
* Risk assessment update required
* Control update required
* Document update required
* Training update required

Domain rule:

> A Finding may create one or more Corrective Actions, but not every Finding requires a Corrective Action.

---

## 8. Primary Relationship Model

The following relationship spine should guide OLUSO’s modeling.

```text
Location
  ├── contains Equipment
  ├── stores Chemicals
  ├── hosts Processes
  ├── has Hazards
  ├── has Inspections
  ├── has Incidents
  └── has Compliance Obligations

Process
  ├── occurs at Location
  ├── uses Equipment
  ├── uses Chemicals
  ├── exposes SEGs
  ├── has Hazards
  ├── has Controls
  └── has Field Work Records

Chemical
  ├── has SDS
  ├── has Exposure Limits
  ├── is used by Processes
  ├── is stored at Locations
  ├── creates or contributes to Hazards
  └── may be involved in Incidents

SEG
  ├── works in Locations
  ├── performs Processes
  ├── may be exposed to Chemicals
  ├── has Exposure Profiles
  └── has Air Sampling Events

Hazard
  ├── belongs to Location / Process / Equipment / Chemical / SEG
  ├── has Risk Assessments
  ├── has Controls
  ├── may be observed in Field Work
  ├── may contribute to Incidents
  └── may generate Corrective Actions

Control
  ├── manages Hazards
  ├── applies to Location / Process / Equipment / Chemical / SEG
  ├── may be verified through Inspections / Audits / Sampling
  └── may be improved through Corrective Actions

Incident / Near Miss
  ├── occurs at Location
  ├── involves Process / Equipment / Chemical / Hazard / Control / SEG
  ├── may require Investigation
  └── may generate Corrective Actions

Corrective Action
  ├── must have Source
  ├── has Owner
  ├── has Due Date
  ├── may require Verification
  └── may produce Closure Record
```

---

## 9. Traceability Spine

The preferred traceability model is:

```text
Hazard
  → Risk Assessment
  → Control
  → Field Finding / Incident / Audit Finding
  → Corrective Action
  → Verification
  → Closure
```

This model supports:

* Audit readiness
* Management review
* Follow-up tracking
* Recurrence prevention
* Exposure assessment history
* Control effectiveness review
* Compliance evidence

Domain rule:

> OLUSO should preserve upstream and downstream links wherever possible. A user should be able to start from a closed corrective action and trace backward to the source condition that created it.

---

## 10. Register vs Record Classification

| Item                |            Classification | Reason                                                    |
| ------------------- | ------------------------: | --------------------------------------------------------- |
| Chemical Inventory  |                  Register | Durable list of chemicals.                                |
| SDS Library         |   Register / Document Set | Durable controlled reference set.                         |
| Exposure Limits     |                  Register | Durable reference values.                                 |
| Locations           |                  Register | Durable physical structure.                               |
| Processes           |                  Register | Durable operational structure.                            |
| Equipment           |                  Register | Durable assets.                                           |
| SEGs                |                  Register | Durable exposure groups.                                  |
| Hazard Register     |                  Register | Durable recognized hazards.                               |
| Risk Assessments    |     Records / Assessments | Time-bound evaluations of hazards.                        |
| Controls            |                  Register | Durable control measures.                                 |
| Observations        |                   Records | Time-bound field notes.                                   |
| Inspections         |                   Records | Time-bound structured checks.                             |
| Audits              |                   Records | Time-bound formal reviews.                                |
| Air Sampling        |                   Records | Time-bound exposure monitoring events.                    |
| Near Misses         |                   Records | Time-bound event reports.                                 |
| Incidents           |                   Records | Time-bound event reports.                                 |
| Investigations      |                   Records | Time-bound formal reviews of events.                      |
| Open Actions        |      Records / Work Items | Time-bound assigned work.                                 |
| Verification        |                   Records | Time-bound closure evidence.                              |
| Closed Actions      | Records / Historical View | Completed action history.                                 |
| Training            |        Register + Records | Course requirements are durable; completions are records. |
| Permits             |                  Register | Durable compliance authorizations.                        |
| Regulatory Calendar |     Records / Obligations | Time-bound deadlines and recurring tasks.                 |
| Documents           |                  Register | Durable controlled reference set.                         |
| Reports             |               Projections | Generated views over source data.                         |

---

## 11. Common Lifecycle States

## 11.1 General Register Item Status

Used for durable objects such as Chemicals, Locations, Processes, Equipment, SEGs, Hazards, Controls, Permits, and Documents.

```text
Draft
Active
Under Review
Inactive
Retired
Archived
```

Recommended meaning:

| Status       | Meaning                                    |
| ------------ | ------------------------------------------ |
| Draft        | Created but not ready for operational use. |
| Active       | Current and usable.                        |
| Under Review | Needs review, update, or confirmation.     |
| Inactive     | Not currently used but may return.         |
| Retired      | No longer used operationally.              |
| Archived     | Preserved for history only.                |

---

## 11.2 Field Record Status

Used for Observations, Inspections, Audits, and Sampling Events.

```text
Planned
In Progress
Complete
Requires Action
Closed
Archived
```

Recommended meaning:

| Status          | Meaning                                     |
| --------------- | ------------------------------------------- |
| Planned         | Scheduled or intended but not started.      |
| In Progress     | Work has started but is not complete.       |
| Complete        | Field activity is complete.                 |
| Requires Action | Follow-up or corrective action is required. |
| Closed          | Review and follow-up are complete.          |
| Archived        | Preserved for history only.                 |

---

## 11.3 Incident Status

Used for Near Misses and Incidents.

```text
Reported
Under Review
Under Investigation
Action Required
Closed
Archived
```

Recommended meaning:

| Status              | Meaning                                                        |
| ------------------- | -------------------------------------------------------------- |
| Reported            | Initial record created.                                        |
| Under Review        | Being evaluated for severity, response, or investigation need. |
| Under Investigation | Investigation is active.                                       |
| Action Required     | Corrective actions or follow-up required.                      |
| Closed              | Response, investigation, and follow-up are complete.           |
| Archived            | Preserved for history only.                                    |

---

## 11.4 Corrective Action Status

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

Recommended meaning:

| Status                        | Meaning                                                |
| ----------------------------- | ------------------------------------------------------ |
| Open                          | Created but not fully assigned or planned.             |
| Assigned                      | Owner and due date exist.                              |
| In Progress                   | Work is underway.                                      |
| Blocked                       | Work cannot proceed due to dependency or constraint.   |
| Complete Pending Verification | Assignee claims completion; verification not complete. |
| Verified                      | Verification passed.                                   |
| Closed                        | Action is formally closed.                             |
| Cancelled                     | No longer needed, with justification.                  |
| Archived                      | Preserved for history only.                            |

---

## 12. Source Types

Several records require a source type and source reference.

The following source types should be considered valid:

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

Domain rule:

> Manual Entry should be allowed, but it should require justification. It should not become the default source type.

---

## 13. Priority and Severity Concepts

OLUSO should distinguish between severity, priority, and risk.

### 13.1 Severity

Severity describes the possible or actual consequence.

Examples:

* Low
* Moderate
* Serious
* Major
* Critical

### 13.2 Priority

Priority describes how urgently the item should be handled.

Examples:

* Low
* Medium
* High
* Urgent

### 13.3 Risk

Risk combines severity, likelihood, exposure potential, and controls.

Risk should be assessed in context, not assumed from severity alone.

Domain rule:

> A low-severity issue may still be high priority if it is overdue, recurring, regulatory, easy to fix, or blocks other work. A high-severity hazard may have lower immediate priority if strong controls are verified and no degradation is present.

---

## 14. Minimum Traceability Requirements

The following minimum relationships should be preserved.

### 14.1 Corrective Action

A Corrective Action should include:

* Source type
* Source reference
* Owner
* Due date
* Priority
* Status
* Completion notes
* Verification requirement
* Closure state

### 14.2 Hazard

A Hazard should include at least one context link where possible:

* Location
* Process
* Equipment
* Chemical
* SEG

A Hazard should also support:

* Controls
* Risk Assessments
* Related field records
* Related incidents
* Related corrective actions

### 14.3 Chemical

A Chemical should support links to:

* SDS
* Exposure Limits
* Storage Location
* Use Process
* Hazard
* Control
* SEG
* Air Sampling Event
* Incident

### 14.4 Field Record

A Field Record should support links to:

* Location
* Process
* Equipment
* Chemical
* Hazard
* Control
* Evidence
* Corrective Action

---

## 15. Domain Rules

### 15.1 Corrective Action Rules

* A corrective action should not be closed without source traceability.
* A corrective action should not be closed without completion notes.
* A corrective action requiring verification should not be closed until verification passes.
* A failed verification should reopen or return the corrective action to an active state.
* Cancelled corrective actions should require justification.

### 15.2 Hazard Rules

* A hazard should be linked to operational context whenever possible.
* A hazard without a location, process, equipment, chemical, or SEG should be treated as incomplete.
* A hazard may have multiple controls.
* A hazard may have multiple risk assessments over time.
* Retiring a hazard should not delete historical records.

### 15.3 Chemical Rules

* A chemical should have an SDS status.
* A chemical with no SDS should be clearly marked as missing SDS.
* Chemical use should be modeled separately from chemical identity.
* A chemical may exist in inventory but have no active use.
* A chemical may have multiple exposure limits from different sources.

### 15.4 Field Work Rules

* A field record should preserve date/time, observer/inspector, location, and finding context.
* A field finding should be able to create a corrective action.
* Photos and notes should remain linked to the field record that created them.
* Field work should be lightweight enough for real use.

### 15.5 Incident Rules

* An incident should preserve initial report details even if later investigation changes interpretation.
* An incident may involve multiple chemicals, equipment items, hazards, or people.
* Investigation findings should not overwrite the original incident report.
* Corrective actions from incidents should remain linked to the incident and investigation.

### 15.6 Compliance Rules

* A permit should preserve expiration and renewal context.
* A regulatory calendar item should have an owner and due date.
* A document should preserve revision context.
* Compliance evidence should link to the obligation it supports.

---

## 16. Initial MVP Domain Boundary

The first version should prioritize the domain spine.

### 16.1 MVP Entities

The MVP should include:

* Location
* Process
* Equipment
* SEG
* Chemical
* SDS
* Exposure Limit
* Hazard
* Control
* Risk Assessment
* Observation
* Inspection
* Incident
* Corrective Action
* Verification
* Document

### 16.2 MVP Relationships

The MVP should support:

* Location → Process
* Location → Equipment
* Process → Chemical
* Process → SEG
* Chemical → SDS
* Chemical → Exposure Limit
* Chemical → Hazard
* Hazard → Control
* Hazard → Risk Assessment
* Observation → Corrective Action
* Inspection → Corrective Action
* Incident → Corrective Action
* Corrective Action → Verification
* Corrective Action → Closure

### 16.3 Defer Until Later

The following can be defined conceptually now but implemented later:

* Full permit management
* Full regulatory calendar
* Full training management
* Full report builder
* Advanced sampling analytics
* Document revision workflows
* Multi-user permissions
* Advanced audit module
* Map/geospatial features
* External system integrations

---

## 17. Data Ownership Assumptions

OLUSO is assumed to be a local-first HSE management system.

Initial assumptions:

* The user owns the operational data.
* The system should work without requiring a remote server.
* Records should preserve local history.
* Deletion should be conservative for audit-relevant entities.
* Archiving is preferred over destructive deletion.
* Export should be possible for important registers and records.

Domain rule:

> For audit-relevant records, OLUSO should prefer status changes and archival over hard deletion.

---

## 18. Identity and Access Assumptions

Initial versions may not require complex identity management.

However, the domain model should still distinguish:

* Created by
* Assigned to
* Reviewed by
* Verified by
* Closed by
* Reported by
* Investigated by

These fields may initially be plain text or local contact references. They can later evolve into structured user/person records.

Domain rule:

> The domain should preserve accountability fields even before full authentication exists.

---

## 19. Deletion and History Rules

The following records should generally not be hard deleted once used:

* Incident
* Near Miss
* Investigation
* Corrective Action
* Verification
* Closure Record
* Audit
* Inspection
* Air Sampling Event
* Risk Assessment
* Permit
* Training completion
* Document revision

Preferred alternatives:

* Archive
* Retire
* Supersede
* Cancel with justification
* Mark inactive

Domain rule:

> Hard deletion should be reserved for drafts, duplicates, or erroneous records that have not become part of an audit trail.

---

## 20. Open Questions

The following decisions remain open.

### 20.1 Should Chemical Storage be its own entity?

Options:

1. Model Chemical Storage as a specialized Location.
2. Model Chemical Storage as a relationship between Chemical and Location.
3. Model Chemical Storage as a separate entity.

Initial recommendation:

> Use Location plus a Chemical Storage relationship. Do not create a separate first-class entity until storage-specific workflows require it.

---

### 20.2 Should Findings be first-class entities?

Options:

1. Findings exist only inside Observations, Inspections, Audits, and Investigations.
2. Findings become their own shared entity.
3. Findings are deferred until the field work model matures.

Initial recommendation:

> Do not make Findings first-class in the MVP. Use source records plus corrective actions first. Promote Findings later if duplication appears.

---

### 20.3 Should Reports be saved entities?

Options:

1. Reports are generated views only.
2. Reports can be saved snapshots.
3. Reports can be exported but not stored.

Initial recommendation:

> Treat reports as generated views in the MVP. Add saved report snapshots later if audit or management review workflows require them.

---

### 20.4 Should People be structured entities?

Options:

1. Use plain text names initially.
2. Use local Person records.
3. Integrate with an external identity/contact source later.

Initial recommendation:

> Support simple Person records eventually, but avoid building a full HR/personnel system.

---

### 20.5 Should Regulatory Requirements be first-class entities?

Options:

1. Track only permits, calendar items, and documents.
2. Add a Regulatory Requirement entity.
3. Defer regulatory requirement modeling until the compliance module matures.

Initial recommendation:

> Defer a full Regulatory Requirement entity. Start with permits, calendar items, documents, and audit evidence.

---

## 21. Relationship Summary

| Entity             | Links To                                                                         |
| ------------------ | -------------------------------------------------------------------------------- |
| Location           | Process, Equipment, Chemical, Hazard, Inspection, Incident, Permit               |
| Process            | Location, Equipment, Chemical, SEG, Hazard, Control                              |
| Equipment          | Location, Process, Hazard, Control, Inspection, Incident                         |
| SEG                | Process, Location, Chemical, Hazard, Air Sampling Event                          |
| Chemical           | SDS, Exposure Limit, Process, Location, Hazard, Control                          |
| SDS                | Chemical, Document                                                               |
| Exposure Limit     | Chemical, Air Sampling Event, Risk Assessment                                    |
| Hazard             | Location, Process, Equipment, Chemical, SEG, Control, Risk Assessment            |
| Risk Assessment    | Hazard, Control, Corrective Action                                               |
| Control            | Hazard, Location, Process, Equipment, Chemical, SEG                              |
| Observation        | Location, Process, Equipment, Chemical, Hazard, Corrective Action                |
| Inspection         | Location, Process, Equipment, Chemical, Finding, Corrective Action               |
| Audit              | Compliance Requirement, Finding, Corrective Action, Evidence                     |
| Air Sampling Event | SEG, Chemical, Process, Location, Exposure Limit, Corrective Action              |
| Near Miss          | Location, Process, Equipment, Chemical, Hazard, Investigation, Corrective Action |
| Incident           | Location, Process, Equipment, Chemical, Hazard, Investigation, Corrective Action |
| Investigation      | Incident, Near Miss, Hazard, Control, Corrective Action                          |
| Corrective Action  | Source Record, Owner, Verification, Closure Record                               |
| Verification       | Corrective Action, Evidence                                                      |
| Permit             | Location, Process, Equipment, Regulatory Calendar Item, Document                 |
| Training           | Role, SEG, Process, Hazard, Chemical, Document                                   |
| Document           | Chemical, Permit, Training, Compliance, Process, Hazard, Control                 |
| Report             | Registers, Records, Filters, Export                                              |

---

## 22. Design Implications

The domain model implies the following future design requirements.

### 22.1 Detail Pages Need Relationship Panels

Entity detail pages should show related items.

Examples:

* A Chemical detail page should show SDS, exposure limits, uses, hazards, controls, incidents, and sampling events.
* A Hazard detail page should show controls, risk assessments, field findings, incidents, and corrective actions.
* A Process detail page should show locations, chemicals, equipment, SEGs, hazards, and field records.

### 22.2 Tables Need Status and Relationship Awareness

Register tables should not only show names. They should show status, relationship counts, overdue items, missing documentation, and unresolved actions.

### 22.3 Corrective Actions Need Source Context

Corrective action views should show where each action came from.

Examples:

* Source: Inspection
* Source: Incident
* Source: Audit
* Source: Hazard
* Source: Air Sampling Event

### 22.4 Dashboards Should Surface Exceptions

Dashboards should prioritize:

* Open corrective actions
* Overdue corrective actions
* Failed verifications
* Missing SDS records
* High-risk hazards
* Open incident investigations
* Upcoming compliance deadlines
* Expired permits or documents
* Sampling results requiring follow-up

---

## 23. Out of Scope

This domain model does not decide:

* Exact database tables
* Exact local storage mechanism
* Sync strategy
* User authentication
* Permission levels
* Final UI layout
* Final navigation labels
* Form field order
* Validation implementation
* Import/export file formats
* Report templates
* Mobile behavior
* Notification strategy

---

## 24. Summary

OLUSO’s domain model is built around traceable HSE operations.

The application should model durable registers such as Locations, Processes, Equipment, SEGs, Chemicals, Hazards, Controls, Permits, and Documents.

It should also model time-bound records such as Observations, Inspections, Audits, Sampling Events, Incidents, Investigations, Corrective Actions, Verifications, and Closure Records.

The most important traceability chain is:

```text
Hazard
  → Risk Assessment
  → Control
  → Finding / Event
  → Corrective Action
  → Verification
  → Closure
```

This chain should guide future workflow, UI, state, storage, and reporting decisions.

If this model is preserved, OLUSO can become more than a checklist app. It can become a local-first HSE operating system with defensible traceability, field usability, and audit-ready records.
