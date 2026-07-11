# 02 — Information Architecture

## Purpose

This document defines the information architecture for **OLUSO**: how the application’s information is grouped, how users move through it, and how major safety, operations, compliance, and field-work concepts relate to one another.

The goal is to establish a stable structure before designing routes, UI components, state management, database schema, or controller/service patterns.

This document answers:

* What information does OLUSO manage?
* How should that information be grouped?
* What are the primary application areas?
* What belongs together?
* What should remain separate?
* How should users mentally navigate the system?
* Which records connect across domains?

This document does **not** define implementation architecture, database schema, controller patterns, stores, services, or component-level behavior. Those are handled in later documents.

---

## Product Context

OLUSO is a local-first HSE operations application for organizing field-usable safety, chemical, process, risk, compliance, and incident information.

The application is designed for a working HSE coordinator who needs to manage practical safety information across operations, chemical hazards, exposure groups, inspections, audits, incidents, corrective actions, and compliance documentation.

The application should feel like a structured operational workspace, not a generic note-taking app and not a bloated enterprise EHS platform.

---

## Information Architecture Principles

### 1. Registers First

OLUSO should be organized around durable registers.

A register is a structured collection of safety-critical records that must be searchable, maintainable, reviewable, and auditable.

Core registers include:

* Chemical Inventory
* Process Register
* Location Register
* Equipment Register
* Similar Exposure Groups
* Hazard Register
* Control Register
* Incident Log
* Corrective Action Register
* Training Register
* Permit Register
* Document Register

Registers are the backbone of the system.

---

### 2. Records Should Be Operationally Useful

A record should not exist simply because the system can store it.

Each record should help answer a real HSE question, such as:

* What chemicals are present?
* Where are they used?
* Which process creates the exposure?
* Which workers may be exposed?
* What controls are in place?
* What inspections have been completed?
* What hazards remain open?
* What incidents occurred?
* What actions are overdue?
* What compliance obligations are coming due?

If a record does not support field execution, audit readiness, exposure assessment, hazard tracking, or regulatory compliance, it should not be promoted to a first-class object.

---

### 3. Separate Domains, Link Records

Major areas should remain separate in the navigation, but records should link across domains.

For example:

* A chemical may be linked to a process.
* A process may be linked to a location.
* A process may be linked to one or more SEGs.
* A hazard may be linked to a process, location, chemical, equipment item, or field observation.
* A control may be linked to one or more hazards.
* An incident may generate corrective actions.
* A corrective action may require verification.
* A compliance obligation may require records, training, inspections, or reports.

The application should avoid dumping everything into one large generic “safety record” model.

---

### 4. Navigation Should Match the User’s Mental Model

The primary navigation should reflect how an HSE coordinator thinks during work:

* “Where is this happening?”
* “What process is involved?”
* “What chemicals are present?”
* “Who may be exposed?”
* “What hazards exist?”
* “What controls are in place?”
* “What field work needs to be documented?”
* “What incident or near miss occurred?”
* “What corrective action is open?”
* “What compliance record proves this was handled?”

The information architecture should support this workflow without requiring the user to remember where everything is hidden.

---

### 5. Local-First Information Should Be Durable

Because OLUSO is local-first, the IA must assume that records are owned locally and should remain useful without cloud dependency.

The structure should support:

* Persistent local records
* Offline reference
* Exportable reports
* Audit-ready documentation
* Manual review
* Future sync, if added later

The IA should not depend on SaaS assumptions such as cloud-only collaboration, remote dashboards, or organization-wide enterprise permissions during the MVP stage.

---

## Primary Application Areas

OLUSO is organized into the following primary areas.

| Area               | Purpose                                                                                          |
| ------------------ | ------------------------------------------------------------------------------------------------ |
| Dashboard          | High-level operational summary, open risks, overdue actions, recent activity, and priority items |
| Operations         | Locations, processes, equipment, and SEGs                                                        |
| Chemical Safety    | Chemical inventory, SDS records, and exposure limits                                             |
| Risk Management    | Hazards, risk assessments, and controls                                                          |
| Field Work         | Observations, inspections, audits, and air sampling                                              |
| Incidents          | Near misses, incidents, and investigations                                                       |
| Corrective Actions | Open actions, verification, and closed actions                                                   |
| Compliance         | Training, permits, regulatory calendar, and documents                                            |
| Reports            | Exportable summaries, audit packages, and management reports                                     |

These areas define the top-level information structure of the application.

---

## Information Hierarchy

The general information hierarchy is:

```text
Facility / Site
└── Location
    ├── Process
    │   ├── Equipment
    │   ├── Chemicals
    │   ├── SEGs
    │   ├── Hazards
    │   ├── Controls
    │   └── Field Work Records
    ├── Incidents
    ├── Corrective Actions
    └── Compliance Records
```

This hierarchy is conceptual, not a database schema.

The purpose is to define how information should be understood by the user.

---

## Core Information Objects

### Location

A location represents a physical place where work occurs.

Examples:

* Facility
* Building
* Production area
* Storage area
* Lab
* Warehouse
* Tank farm
* Packaging area
* Maintenance area
* Outdoor work area

Locations help users understand where hazards, processes, chemicals, inspections, incidents, and controls apply.

A location may be linked to:

* Processes
* Equipment
* Chemicals
* Hazards
* Inspections
* Incidents
* Corrective actions
* Compliance documents

---

### Process

A process represents a repeatable operational activity or production workflow.

Examples:

* Wettable powder blending
* WDG granulation
* Liquid formulation
* Bulk solvent transfer
* Tank cleaning
* Packaging
* Rail unloading
* Maintenance task
* Waste handling

Processes are central to OLUSO because many HSE records depend on understanding what work is being performed.

A process may be linked to:

* Locations
* Equipment
* Chemicals
* SEGs
* Hazards
* Controls
* Air sampling records
* Inspections
* Risk assessments
* SOPs
* Training requirements

---

### Equipment

Equipment represents machinery, vessels, tools, or systems used in operations.

Examples:

* Mixers
* Mills
* Granulators
* Storage tanks
* Pumps
* Transfer lines
* Forklifts
* Ventilation systems
* Dust collectors
* Nitrogen blanketing systems
* Packaging equipment

Equipment may be linked to:

* Locations
* Processes
* Hazards
* Controls
* Inspections
* Maintenance-related observations
* Incidents
* Corrective actions

---

### Similar Exposure Group

A Similar Exposure Group, or SEG, represents a group of workers expected to have similar exposure profiles because they perform similar tasks, work in similar locations, or interact with similar processes.

Examples:

* Formulation operators
* Packaging operators
* Maintenance technicians
* Warehouse personnel
* Lab technicians
* Bulk unloading personnel
* Supervisors with intermittent exposure

SEGs may be linked to:

* Processes
* Locations
* Chemicals
* Exposure assessments
* Air sampling records
* PPE requirements
* Training requirements
* Health hazard evaluations

SEGs are not just labels. They are exposure assessment anchors.

---

### Chemical

A chemical represents a substance, product, formulation component, solvent, active ingredient, cleaning agent, additive, or other hazardous material tracked by the application.

A chemical may be linked to:

* SDS records
* Exposure limits
* Inventory records
* Storage locations
* Processes
* Hazards
* PPE requirements
* Spill response requirements
* Waste handling requirements
* Air sampling methods
* Compliance obligations

Chemical records should support both practical inventory management and HSE hazard evaluation.

---

### SDS Record

An SDS record represents a safety data sheet associated with a chemical or product.

An SDS record may include or link to:

* Manufacturer
* Product name
* Revision date
* Hazard classification
* Physical hazards
* Health hazards
* PPE guidance
* Spill response information
* Firefighting information
* Storage requirements
* Exposure control information

SDS records support reference and compliance, but they should not replace structured chemical records.

The Chemical Inventory should remain the primary operational register.

---

### Exposure Limit

An exposure limit represents a regulatory or recommended occupational exposure value.

Examples:

* OSHA PEL
* ACGIH TLV
* NIOSH REL
* Manufacturer guidance
* Internal occupational exposure limit

Exposure limits may be linked to:

* Chemicals
* SEGs
* Air sampling records
* Exposure assessments
* Risk assessments
* Control decisions

Exposure limits should be treated as reference values, not standalone operational records.

---

### Hazard

A hazard represents a source of potential harm.

Examples:

* Inhalation exposure
* Skin exposure
* Flammable liquid
* Combustible dust
* Oxygen deficiency
* Chemical splash
* Heat stress
* Noise
* Confined space
* Mechanical hazard
* Forklift traffic
* Ergonomic stressor
* Environmental release potential

Hazards may be linked to:

* Locations
* Processes
* Equipment
* Chemicals
* SEGs
* Observations
* Incidents
* Risk assessments
* Controls
* Corrective actions

The Hazard Register is one of the central risk-management tools in OLUSO.

---

### Risk Assessment

A risk assessment evaluates one or more hazards using defined criteria.

A risk assessment may include:

* Hazard description
* Affected workers or SEGs
* Existing controls
* Severity
* Likelihood
* Initial risk rating
* Additional recommended controls
* Residual risk rating
* Review date
* Responsible person

Risk assessments should be linked to the Hazard Register instead of existing as isolated documents.

---

### Control

A control represents a measure used to eliminate, reduce, isolate, or manage risk.

Examples:

* Engineering control
* Ventilation
* Interlock
* Containment
* Substitution
* Administrative procedure
* SOP
* Training
* PPE
* Inspection
* Permit
* Alarm
* Emergency response measure

Controls may be linked to:

* Hazards
* Processes
* Equipment
* Chemicals
* SEGs
* Inspections
* Corrective actions
* Verification records

Controls should be reviewable and verifiable. A control that cannot be verified is weak from an audit and field-execution standpoint.

---

### Observation

An observation is a field record documenting something seen during work.

Examples:

* Unsafe condition
* Unsafe behavior
* Good catch
* Housekeeping issue
* PPE issue
* Process deviation
* Storage issue
* Labeling issue
* Environmental concern
* Positive safety behavior

Observations may be linked to:

* Locations
* Processes
* Equipment
* Chemicals
* Hazards
* Corrective actions
* Inspections
* Audits

Observations are lightweight field inputs. They should not require the same burden as a full incident or risk assessment.

---

### Inspection

An inspection is a structured field check against known criteria.

Examples:

* Fire extinguisher inspection
* Chemical storage inspection
* Eyewash inspection
* Forklift area inspection
* Housekeeping inspection
* PPE inspection
* Spill kit inspection
* Process area inspection
* Contractor worksite inspection

Inspections may generate:

* Findings
* Hazards
* Corrective actions
* Verification tasks
* Reports

Inspections should be repeatable and template-driven in later versions.

---

### Audit

An audit is a formal review against a requirement, standard, policy, or program.

Examples:

* Internal HSE audit
* Regulatory readiness audit
* Program compliance audit
* Contractor safety audit
* Environmental compliance audit
* Training record audit

Audits may generate:

* Findings
* Corrective actions
* Evidence requests
* Reports
* Compliance updates

Audits are more formal than inspections and should support evidence tracking.

---

### Air Sampling Record

An air sampling record documents occupational exposure sampling activity.

An air sampling record may include:

* Sample type
* Sampling method
* Chemical or analyte
* Worker or SEG
* Location
* Process
* Task
* Sample duration
* Result
* Exposure limit comparison
* Lab information
* Notes
* Attachments

Air sampling records may be linked to:

* Chemicals
* SEGs
* Processes
* Exposure limits
* Risk assessments
* Controls
* Reports

Air sampling should sit under Field Work because it is performed as a field activity, but its results should connect back to Chemical Safety and SEGs.

---

### Near Miss

A near miss is an event that could have caused injury, illness, property damage, environmental release, or regulatory impact, but did not.

Near misses may be linked to:

* Locations
* Processes
* Equipment
* Chemicals
* Hazards
* Controls
* Corrective actions
* Investigations

Near misses should be easier to log than full incidents but still support trend analysis.

---

### Incident

An incident is an event that resulted in actual injury, illness, property damage, environmental release, process disruption, or other loss.

Incidents may be linked to:

* Locations
* Processes
* Equipment
* Chemicals
* Workers or affected groups
* Hazards
* Failed controls
* Investigations
* Corrective actions
* Reports

Incidents should support structured documentation, investigation, and action tracking.

---

### Investigation

An investigation is the structured review of an incident or significant near miss.

An investigation may include:

* Event summary
* Timeline
* Immediate causes
* Root causes
* Failed controls
* Contributing factors
* Corrective actions
* Verification requirements
* Lessons learned

Investigations should not be standalone records. They should attach to incidents or high-value near misses.

---

### Corrective Action

A corrective action is a tracked commitment to fix, reduce, verify, or prevent a problem.

A corrective action may be created from:

* Observation
* Inspection finding
* Audit finding
* Hazard
* Risk assessment
* Incident
* Investigation
* Compliance gap

Corrective actions may include:

* Description
* Source
* Owner
* Priority
* Due date
* Status
* Related hazard or finding
* Completion evidence
* Verification requirement
* Closure notes

The corrective action system must separate completion from verification.

---

### Verification

Verification confirms that a corrective action or control is actually effective.

Examples:

* Field check
* Photo evidence
* Follow-up inspection
* Air sampling result
* Training record review
* Document review
* Supervisor confirmation
* Repeat observation

Verification should answer:

* Was the action completed?
* Is the control present?
* Is the control working?
* Did the risk actually decrease?
* Is additional action required?

Verification is critical for audit readiness and should not be treated as optional decoration.

---

### Training Record

A training record documents worker completion of a required safety or compliance topic.

Training records may be linked to:

* Workers or roles
* SEGs
* Processes
* Chemicals
* PPE requirements
* Permits
* Compliance obligations
* SOPs

Training belongs under Compliance because it proves readiness and regulatory alignment, but it may connect to operational areas.

---

### Permit

A permit represents a controlled work authorization or regulatory permit.

Examples:

* Hot work permit
* Confined space permit
* Line breaking permit
* Environmental permit
* Waste-related permit
* Air permit
* Wastewater permit
* Stormwater permit

Permits may be operational, regulatory, or both.

Permits may be linked to:

* Locations
* Processes
* Equipment
* Compliance obligations
* Field work
* Inspections
* Corrective actions

---

### Regulatory Calendar Item

A regulatory calendar item represents a time-based compliance obligation.

Examples:

* Report due date
* Inspection due date
* Training renewal
* Permit renewal
* Sampling deadline
* Audit schedule
* Waste shipment documentation review
* Annual report deadline

Calendar items should connect compliance obligations to actual work.

---

### Document

A document is a controlled or reference file used to support HSE work.

Examples:

* SOP
* Policy
* Program document
* Permit
* Inspection checklist
* Audit evidence
* Training material
* SDS
* Report
* Regulatory correspondence

Documents should be linked to the records they support instead of becoming a dumping ground.

---

### Report

A report is an output generated from one or more records.

Examples:

* Chemical inventory summary
* Open hazards report
* Corrective action report
* Incident summary
* Inspection summary
* Audit package
* Compliance calendar report
* Exposure assessment summary

Reports are outputs, not primary data sources.

OLUSO should avoid making users manually maintain reports when the same information can be generated from structured records.

---

## Primary Navigation Model

The primary navigation should be organized as follows:

```text
Dashboard

Operations
├── Locations
├── Processes
├── Equipment
└── SEGs

Chemical Safety
├── Chemical Inventory
├── SDS Library
└── Exposure Limits

Risk Management
├── Hazard Register
├── Risk Assessments
└── Controls

Field Work
├── Observations
├── Inspections
├── Audits
└── Air Sampling

Incidents
├── Near Misses
├── Incidents
└── Investigations

Corrective Actions
├── Open Actions
├── Verification
└── Closed Actions

Compliance
├── Training
├── Permits
├── Regulatory Calendar
└── Documents

Reports
```

This navigation model is intentionally register-centered.

It should remain stable unless the application’s core operating model changes.

---

## Content Ownership Boundaries

### Operations Owns Work Context

Operations owns the physical and process context of the facility.

Operations includes:

* Locations
* Processes
* Equipment
* SEGs

Operations does not own chemical hazard data, incident records, corrective action closure, or compliance documentation, but it links to them.

---

### Chemical Safety Owns Chemical Reference and Inventory

Chemical Safety owns the structured chemical inventory, SDS references, and exposure limit references.

Chemical Safety includes:

* Chemical Inventory
* SDS Library
* Exposure Limits

Chemical Safety does not own all hazards. A chemical can create a hazard, but the hazard itself belongs in Risk Management.

---

### Risk Management Owns Hazards, Assessments, and Controls

Risk Management owns the system’s formal understanding of risk.

Risk Management includes:

* Hazard Register
* Risk Assessments
* Controls

Risk Management does not own every field note, every incident, or every compliance document. It links to those records when they affect risk.

---

### Field Work Owns Field-Generated Records

Field Work owns records created from active field activity.

Field Work includes:

* Observations
* Inspections
* Audits
* Air Sampling

Field Work records often generate hazards, findings, corrective actions, or reports, but they should remain identifiable as field activity records.

---

### Incidents Owns Event Documentation

Incidents owns near misses, incidents, and investigations.

Incidents includes:

* Near Misses
* Incidents
* Investigations

Incidents may generate corrective actions and update hazard records, but incident records should not be hidden inside the corrective action system.

---

### Corrective Actions Owns Commitments and Closure

Corrective Actions owns the tracking of assigned fixes and their verification.

Corrective Actions includes:

* Open Actions
* Verification
* Closed Actions

Corrective Actions should track what must be done, who owns it, when it is due, whether it was completed, and whether completion was verified.

---

### Compliance Owns Proof and Deadlines

Compliance owns records that prove the organization is meeting defined obligations.

Compliance includes:

* Training
* Permits
* Regulatory Calendar
* Documents

Compliance should not become a general file cabinet. Documents should be connected to obligations, records, programs, or evidence requirements.

---

### Reports Owns Outputs

Reports owns generated summaries and exportable views.

Reports should pull from structured data rather than becoming a separate manual recordkeeping area.

---

## Cross-Domain Relationships

The following relationships should be supported conceptually.

| Source Record     | Can Link To       | Reason                                                              |
| ----------------- | ----------------- | ------------------------------------------------------------------- |
| Location          | Process           | Work occurs in a physical area                                      |
| Location          | Chemical          | Chemicals are stored or used in places                              |
| Location          | Hazard            | Hazards exist in places                                             |
| Location          | Inspection        | Inspections are performed in places                                 |
| Process           | Chemical          | Chemicals are used in processes                                     |
| Process           | SEG               | Worker groups are exposed through processes                         |
| Process           | Equipment         | Equipment supports processes                                        |
| Process           | Hazard            | Processes create hazards                                            |
| Process           | Control           | Controls manage process risks                                       |
| Equipment         | Hazard            | Equipment may create mechanical, energy, chemical, or process risks |
| Equipment         | Inspection        | Equipment may require field checks                                  |
| Chemical          | SDS               | SDS supports chemical reference                                     |
| Chemical          | Exposure Limit    | Exposure limits support exposure evaluation                         |
| Chemical          | Hazard            | Chemicals create health, physical, and environmental hazards        |
| Chemical          | Air Sampling      | Sampling may evaluate chemical exposure                             |
| SEG               | Process           | SEGs are defined by similar work                                    |
| SEG               | Chemical          | SEGs may have chemical exposure potential                           |
| SEG               | Air Sampling      | Sampling often applies to worker groups                             |
| Hazard            | Risk Assessment   | Hazards are evaluated through assessments                           |
| Hazard            | Control           | Controls reduce or manage hazards                                   |
| Hazard            | Corrective Action | Open hazards may require action                                     |
| Observation       | Hazard            | Field observations may reveal hazards                               |
| Observation       | Corrective Action | Observations may generate fixes                                     |
| Inspection        | Finding           | Inspections generate findings                                       |
| Inspection        | Corrective Action | Failed inspection items may require action                          |
| Audit             | Finding           | Audits identify program gaps                                        |
| Audit             | Corrective Action | Audit findings require tracked closure                              |
| Near Miss         | Hazard            | Near misses reveal uncontrolled hazards                             |
| Incident          | Investigation     | Significant events require investigation                            |
| Incident          | Corrective Action | Incidents often require preventive action                           |
| Investigation     | Corrective Action | Root causes should drive corrective actions                         |
| Corrective Action | Verification      | Closure requires evidence                                           |
| Compliance Item   | Document          | Documents provide proof                                             |
| Compliance Item   | Calendar Item     | Obligations may be time-based                                       |
| Report            | Multiple Records  | Reports summarize structured data                                   |

---

## Page Types

OLUSO should use a small number of repeatable page types.

### 1. Dashboard Page

A dashboard page summarizes current status.

The Dashboard should eventually surface:

* Open high-risk hazards
* Overdue corrective actions
* Upcoming compliance dates
* Recent incidents or near misses
* Recent inspections
* Recently modified records
* Priority field work

The dashboard should not become the primary workspace. It is an overview and triage surface.

---

### 2. Register Page

A register page lists structured records.

Register pages should support:

* Search
* Filtering
* Sorting
* Status indicators
* Basic summary counts
* Record creation
* Record opening
* Export in later versions

Examples:

* Chemical Inventory
* Hazard Register
* Open Actions
* Incident Log
* Training Register

Register pages are the primary working surfaces of OLUSO.

---

### 3. Record Detail Page

A record detail page displays and edits a single record.

Record detail pages should support:

* Core record fields
* Status
* Linked records
* Notes
* Attachments in later versions
* Activity history in later versions
* Review metadata in later versions

Examples:

* Chemical detail
* Process detail
* Hazard detail
* Incident detail
* Corrective action detail

---

### 4. Field Entry Page

A field entry page supports quick creation of field-generated records.

Field entry pages should prioritize:

* Fast input
* Low friction
* Clear required fields
* Location/process selection
* Photo or attachment support in later versions
* Ability to generate follow-up actions

Examples:

* New observation
* New inspection
* New near miss
* New air sampling record

---

### 5. Assessment Page

An assessment page supports structured evaluation.

Assessment pages should support:

* Hazard selection
* Affected workers or SEGs
* Existing controls
* Severity and likelihood scoring
* Recommended controls
* Residual risk
* Review dates
* Approval or review status in later versions

Examples:

* Risk assessment
* Exposure assessment
* Control review

---

### 6. Verification Page

A verification page supports closure evidence.

Verification pages should support:

* Assigned action
* Completion evidence
* Verification method
* Verification date
* Verified by
* Pass/fail or adequate/inadequate result
* Follow-up required status

Verification should be distinct from simple action completion.

---

### 7. Report Page

A report page presents structured output from existing records.

Reports should support:

* Filtering
* Date ranges
* Export in later versions
* Print-friendly layout in later versions
* Audit-package generation in later versions

Reports should not be manually maintained as independent source records.

---

## Register vs. Record Distinction

OLUSO should distinguish between registers and records.

A **register** is a collection.

A **record** is an item inside that collection.

Examples:

| Register                   | Record                |
| -------------------------- | --------------------- |
| Chemical Inventory         | One chemical/product  |
| Process Register           | One process           |
| Hazard Register            | One hazard            |
| Corrective Action Register | One corrective action |
| Incident Log               | One incident          |
| Training Register          | One training record   |
| Permit Register            | One permit            |

This distinction matters because registers define how information is searched, filtered, reviewed, and reported.

Records define what information is actually stored.

---

## MVP Information Architecture

The MVP should focus on a stable, useful subset of the full IA.

### MVP Areas

The first build should prioritize:

1. Dashboard
2. Operations
3. Chemical Safety
4. Risk Management
5. Corrective Actions

Field Work, Incidents, Compliance, and Reports may exist in navigation early, but they should not receive deep feature investment until the core registers are stable.

---

### MVP Registers

The MVP should include placeholder or initial versions of:

* Locations
* Processes
* Equipment
* SEGs
* Chemical Inventory
* SDS Library
* Exposure Limits
* Hazard Register
* Controls
* Open Actions
* Verification
* Closed Actions

These registers establish the backbone of the system.

---

### MVP Record Relationships

The MVP should support at least the following conceptual relationships:

```text
Location → Process
Process → Equipment
Process → Chemical
Process → SEG
Chemical → SDS
Chemical → Exposure Limit
Process → Hazard
Chemical → Hazard
Hazard → Control
Hazard → Corrective Action
Corrective Action → Verification
```

These relationships are sufficient to create a useful HSE operations model without overbuilding the first version.

---

## Deferred Information Areas

The following areas should be designed but not overbuilt during the first implementation pass.

### Field Work

Field Work is important, but observations, inspections, audits, and air sampling can expand quickly.

Initial versions may use simple placeholder registers until the core data model is stable.

---

### Incidents

Incident workflows can become legally and operationally sensitive.

Incident records, investigations, root cause analysis, and reporting should be designed carefully after the core hazard and corrective action model is stable.

---

### Compliance

Compliance can become broad and regulation-specific.

The MVP should avoid trying to model every possible OSHA, EPA, DOT, FIFRA, RCRA, EPCRA, or site-specific requirement immediately.

The first version should establish structure for training, permits, calendar items, and documents without pretending to be a complete compliance engine.

---

### Reports

Reports should come after structured data exists.

The application should avoid building report screens before the underlying records are clean, searchable, and linked.

---

## Information Architecture Non-Goals

This document does not define:

* Database tables
* Field-level schemas
* Route files
* Controller patterns
* Service layers
* State stores
* Validation logic
* Component APIs
* Permission models
* Sync behavior
* Import/export formats
* Authentication
* Cloud collaboration
* Mobile-specific IA

Those decisions belong in later architecture, routing, state management, build, or roadmap documents.

---

## Key IA Decisions

### Decision 1: OLUSO Is Register-Centered

OLUSO should be built around structured HSE registers, not loose notes or generic pages.

---

### Decision 2: Operations Is the Context Layer

Locations, processes, equipment, and SEGs provide the operational context for most other records.

---

### Decision 3: Chemicals and Hazards Are Related but Separate

Chemical Safety owns chemical records, SDS records, and exposure limits.

Risk Management owns hazards, risk assessments, and controls.

A chemical may create a hazard, but the chemical record and hazard record should remain distinct.

---

### Decision 4: Corrective Actions Require Verification

Action completion and action verification should be separate concepts.

A completed action is not automatically a verified action.

---

### Decision 5: Reports Are Outputs, Not Primary Records

Reports should be generated from structured records wherever possible.

Manual reports should not become the primary source of truth.

---

### Decision 6: Compliance Should Be Structured but Not Overbuilt Early

Compliance needs its own area, but the MVP should avoid attempting to encode every regulatory program too soon.

The first version should create places for training, permits, calendar items, and documents.

---

## Open Questions

The following questions should be resolved in later documents:

1. Should OLUSO support multiple facilities or only one facility in the MVP?
2. Should locations support a map or only structured location records at first?
3. Should SEGs be required before air sampling records can be created?
4. Should chemical inventory quantities be tracked in detail during MVP?
5. Should SDS files be uploaded locally or referenced by path/link first?
6. Should exposure limits be manually entered, imported, or maintained as a reference library?
7. Should risk scoring use a 3x3, 4x4, or 5x5 matrix?
8. Should corrective actions support owners as free text first or structured people records?
9. Should compliance obligations be generic at first or tied to specific regulatory programs?
10. Should reports be export-only, screen-only, or both in the first release?

---

## Acceptance Criteria

This information architecture is acceptable when:

* The major application areas are clearly defined.
* Each area has a clear ownership boundary.
* Registers and records are distinguished.
* Core HSE objects are identified.
* Cross-domain relationships are described.
* Navigation structure matches the intended sidebar.
* MVP information scope is clear.
* Deferred areas are identified.
* Implementation-specific decisions are excluded.
* The structure supports future routing, domain modeling, UI architecture, and state management documents.

---

## Summary

OLUSO’s information architecture is built around structured HSE registers connected by operational context.

The core model is:

```text
Locations define where work happens.
Processes define what work occurs.
Equipment supports the work.
SEGs define who may be exposed.
Chemicals define material hazards.
Hazards define sources of harm.
Controls define how risk is managed.
Field work documents what is observed.
Incidents document what went wrong.
Corrective actions define what must be fixed.
Verification proves whether fixes worked.
Compliance organizes proof and deadlines.
Reports summarize structured records.
```

This structure should guide routing, domain modeling, UI design, and state management without prematurely deciding implementation patterns.
