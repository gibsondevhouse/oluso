# 12 — Future Roadmap

Project: OLUSO  
Status: Draft  
Last Updated: 2026-07-06

---

## 1. Purpose

This document defines the future roadmap for OLUSO.

The purpose of this roadmap is not to list every attractive feature the application could eventually support. The purpose is to control product growth so OLUSO remains a focused, local-first desktop HSE workspace instead of drifting into an enterprise EHS suite, generic note system, spreadsheet wrapper, document dump, regulatory interpretation engine, automation platform, or AI-first product.

This document answers:

> What should OLUSO build, when should it be built, and what must remain deferred or rejected so the app stays practical, maintainable, and field-usable?

The roadmap must protect the core product identity:

> OLUSO is a local-first desktop HSE backbone for structured registers, linked records, field findings, corrective actions, verification, and basic export.

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
- `11-state-management.md`

This document feeds:

- implementation sequencing
- GitHub issue planning
- agent prompts
- feature triage
- release planning
- future ADRs
- post-MVP scope decisions

This document does not define:

- final UI layouts
- component-level specifications
- database schema
- migration implementation
- legal interpretations
- regulatory applicability determinations
- vendor integration contracts
- AI model behavior

Those belong in later implementation documents or ADRs only after the core application proves stable.

---

## 3. Roadmap Principle

Every future OLUSO feature must strengthen at least one of the following:

1. local HSE record durability
2. linked-record traceability
3. field-work capture
4. hazard/control visibility
5. corrective-action closure
6. verification evidence
7. review readiness
8. exportable records
9. maintainable implementation

If a feature does not improve one of those areas, it is suspect.

OLUSO should grow by making the HSE backbone deeper and more defensible, not by becoming broader, flashier, or more enterprise-like.

---

## 4. Product Growth Rules

### 4.1 Earned Scope

Future scope must be earned by stable core workflows.

A feature is not allowed into the roadmap just because it is common in EHS software, useful in theory, technically interesting, or easy for an agent to scaffold.

A future feature must have:

- a clear user problem
- a known record owner
- a durable data model
- a route owner
- loading, empty, error, saving, dirty, and recovery states where applicable
- export or evidence implications where applicable
- verification criteria
- a reason it cannot be handled by existing records

### 4.2 Local-First Bias

OLUSO must remain local-first unless a later strategy document explicitly changes that direction.

The application may eventually support backup, export, and controlled file exchange. It must not fake cloud sync, collaboration, or multi-device behavior before the data model, conflict model, and user expectations are formally designed.

### 4.3 Registers Before Automation

OLUSO should prefer explicit registers over hidden automation.

The user should be able to see the source record, understand the status, inspect the relationship, export the evidence, and verify closure. Automation may assist later, but it must not obscure record ownership or accountability.

### 4.4 Reports Are Projections

Reports must remain projections over source records.

A report should not become a second database. If a report reveals missing information, the user should be routed back to the owning source record.

### 4.5 AI Is Optional and Non-Authoritative

AI may become a later utility layer, but it must never become the source of truth.

AI may assist with summarization, drafting, missing-field review, relationship suggestions, and plain-language explanations. AI must not make compliance determinations, certify regulatory status, invent legal obligations, or mutate durable HSE records without user review.

---

## 5. Roadmap Horizon Summary

| Horizon | Name | Product Goal | Build Posture |
|---|---|---|---|
| Phase 0 | Foundation | Create the durable app shell, route map, persistence strategy, and state contracts | Required before modules expand |
| Phase 1 | Core HSE Backbone | Build the minimum useful linked HSE workflow | MVP |
| Phase 2 | Evidence and Review Readiness | Add attachments, review cycles, better exports, and defensibility | Post-MVP 1 |
| Phase 3 | Incident and Compliance Support | Add basic incident, near-miss, compliance calendar, permit, training, and document support | Post-MVP 2 |
| Phase 4 | Optional Intelligence Layer | Add restrained assistive intelligence after the records are stable | Later only |
| Phase 5 | Controlled Expansion | Consider backup, import/export improvements, and limited integrations | Later only, ADR-gated |

The roadmap should be treated as a sequence of constraints, not a list of promises.

---

## 6. Phase 0 — Foundation

### 6.1 Objective

Establish the application foundation before building feature depth.

The goal is to make OLUSO boring, stable, navigable, and technically legible. A weak foundation will create route sprawl, duplicated state, inconsistent forms, broken record relationships, and agent-generated feature fragments.

### 6.2 Features

- desktop app shell
- sidebar navigation
- stable route structure
- dashboard shell
- register page pattern
- detail page pattern
- create/edit page pattern
- empty states
- loading states
- error states
- unsaved-change protection
- local persistence decision
- migration/versioning strategy
- core domain entity definitions
- basic design tokens
- reusable form primitives
- reusable table/list primitives
- local settings storage

### 6.3 Integrations

No external integrations should be introduced in this phase.

Allowed:

- local development tooling
- local database or local file persistence
- test fixtures

Rejected:

- cloud sync
- vendor APIs
- AI providers
- email or calendar integration
- mobile companion app
- authentication providers

### 6.4 Exit Criteria

Phase 0 is complete only when:

- primary routes are defined
- primary sidebar sections are stable
- route ownership is clear
- durable state ownership is clear
- core records have a persistence strategy
- forms have dirty-state handling
- empty, loading, error, and recovery states are implemented or explicitly specified
- agents can implement screens without inventing navigation behavior

### 6.5 Risks

| Risk | Severity | Control |
|---|---:|---|
| Building modules before persistence is settled | High | Require persistence ADR before durable records expand |
| Sidebar grows into fake enterprise navigation | High | Route registry must mark MVP, maybe, later, or rejected |
| Global store becomes second database | High | Durable records must stay in persistence layer |
| Empty shells are mistaken for progress | Medium | Feature is not accepted until create/read/update/export behavior exists where required |

---

## 7. Phase 1 — Core HSE Backbone

### 7.1 Objective

Build the smallest complete OLUSO workflow:

> Context record → hazard or chemical concern → field finding → corrective action → verification → export.

This is the real MVP. It should be narrow, durable, and complete.

### 7.2 Features

#### Operations Context

- locations
- processes
- equipment
- SEGs

Operations exists to provide context for HSE records. It must not become a maintenance-management system, production-planning tool, asset-management platform, or facility operations suite.

#### Chemical Safety

- chemical inventory register
- chemical detail records
- SDS reference/status fields
- exposure-limit reference fields
- chemical hazard notes
- links to locations, processes, equipment, SEGs, hazards, field work, and corrective actions

Chemical Safety must not become procurement, purchasing, inventory control, vendor management, label generation, or regulatory reporting in the MVP.

#### Risk Management

- hazard register
- control register or embedded controls
- basic risk assessment fields
- severity/likelihood or equivalent risk ranking
- control verification status
- links to chemicals, locations, processes, equipment, SEGs, field work, incidents, and corrective actions

Risk Management must stay practical. The MVP does not need complex bow-tie analysis, LOPA, PHA facilitation, or enterprise risk scoring.

#### Field Work

- observations
- inspections
- audits at basic register level
- air sampling events at basic register level
- finding records
- links back to operational, chemical, risk, incident, and corrective-action context

Field Work captures what happened. It should not replace the hazard register, incident log, compliance calendar, or corrective-action system.

#### Corrective Actions

- corrective-action register
- source record reference
- owner/responsible party field
- due date
- status
- priority
- closure notes
- verification status
- verification date
- linked evidence references where available

Corrective actions are core. If OLUSO cannot move a finding to a verified closure record, the MVP is not complete.

#### Basic Reports and Export

- hazard/control summary
- corrective-action report
- field-work summary
- compliance-supporting summary
- CSV or markdown export where practical

Reports must be generated from source records. The user must be able to trace a report item back to the record that owns it.

### 7.3 Integrations

Allowed:

- local export
- local import only if used for seed data
- local file references if implemented safely

Deferred:

- PDF generation if it slows the MVP
- SDS lookup APIs
- cloud file storage
- AI drafting
- email reminders

### 7.4 Exit Criteria

Phase 1 is complete when the user can:

1. create a location, process, equipment item, or SEG
2. create a chemical record and attach or reference SDS status
3. create a hazard and associate controls
4. document a field observation, inspection, audit, or sampling event
5. create a corrective action from a finding
6. verify the corrective action
7. export a basic summary
8. navigate from report item to source record

### 7.5 Risks

| Risk | Severity | Control |
|---|---:|---|
| Building every sidebar section equally | Critical | Prioritize operations → chemical/risk → field work → corrective action → verification |
| Turning chemicals into inventory-control software | High | Track safety context, not procurement quantities or purchasing workflows |
| Treating corrective actions as notes | High | Require status, source, owner, due date, closure, and verification fields |
| Premature reports | Medium | Reports cannot precede reliable source records |

---

## 8. Phase 2 — Evidence and Review Readiness

### 8.1 Objective

Make records more defensible.

Once the core workflow exists, OLUSO should improve evidence handling, review status, stale-record visibility, and export quality. This phase supports audit readiness without claiming compliance certification.

### 8.2 Features

- local evidence attachments
- evidence references
- photo/file/PDF reference support
- SDS file attachment or path reference
- review states
- stale record flags
- last-reviewed date
- next-review date
- reviewer notes
- dashboard counts
- overdue corrective-action count
- high-risk hazard count
- missing SDS count
- records needing review
- recent field activity
- upcoming compliance-supporting items
- improved export formatting

### 8.3 Integrations

Allowed:

- local file picker
- local attachment storage strategy
- local backup bundle
- export to CSV, markdown, and possibly PDF

Deferred:

- live sync to Google Drive, iCloud, Dropbox, or OneDrive
- multi-user editing
- cloud-hosted evidence storage
- automated email reminders

### 8.4 Exit Criteria

Phase 2 is complete when the user can:

- attach or reference evidence from a record
- identify records missing required support
- see which records need review
- export a defensible package or summary
- recover gracefully from missing local files or broken evidence references

### 8.5 Risks

| Risk | Severity | Control |
|---|---:|---|
| File references break silently | High | Broken evidence references must surface clear warnings |
| Evidence storage becomes document dumping | Medium | Evidence must attach to source records, not float freely |
| Review flags become noise | Medium | Review states must have clear criteria and filters |
| Backup is confused with sync | High | Backup must be one-way and explicit unless sync is formally designed |

---

## 9. Phase 3 — Incident and Compliance Support

### 9.1 Objective

Add adjacent HSE support areas without turning OLUSO into enterprise EHS software.

This phase should only begin after the core record backbone, corrective-action workflow, and evidence handling are stable.

### 9.2 Features

#### Incidents and Near Misses

- basic incident log
- near-miss log
- injury/release/property-damage classification
- basic investigation placeholder fields
- links to location, process, equipment, chemical, hazard, field work, and corrective actions

This is not a full incident-management platform in early scope.

#### Compliance Calendar

- compliance-supporting calendar items
- obligation/context notes
- due date
- status
- evidence link
- corrective-action link where applicable

This is not a legal interpretation engine. The app may track obligations the user identifies; it must not decide which obligations legally apply.

#### Training Register

- worker/person placeholder or non-sensitive participant field
- training topic
- completion date
- expiration/retraining date
- evidence reference
- related hazard/process/chemical link

This is not an LMS.

#### Permit Register

- permit type
- permit status
- expiration date
- location/process/equipment link
- evidence reference
- review notes

This is not a permitting authority system.

#### Controlled Documents Register

- document title
- document type
- owner
- effective date
- review date
- status
- file reference
- linked process, hazard, chemical, or compliance item

This is not a document-management suite.

### 9.3 Integrations

Allowed:

- local calendar-style view if useful
- export of compliance-supporting summaries
- local attachment references

Deferred:

- Google Calendar integration
- Outlook integration
- automatic reminder emails
- regulatory databases
- OSHA or EPA submission workflows

### 9.4 Exit Criteria

Phase 3 is complete when:

- incidents link back into the existing HSE backbone
- compliance calendar items are manually controlled by the user
- training, permit, and document records remain simple registers
- corrective actions can be created from incident or compliance items
- exports remain traceable to source records

### 9.5 Risks

| Risk | Severity | Control |
|---|---:|---|
| Compliance calendar becomes legal advice | Critical | User-owned obligation records only; no applicability determinations |
| Incident module becomes enterprise incident management | High | Keep investigation fields minimal until justified |
| Training register becomes LMS | High | Track evidence and dates only |
| Controlled documents become a full DMS | Medium | Records reference files; they do not replace file storage |

---

## 10. Phase 4 — Optional Intelligence Layer

### 10.1 Objective

Add restrained assistive intelligence only after the source records are stable.

AI is a convenience layer. It is not the product foundation.

### 10.2 Allowed AI Capabilities

Future AI may assist with:

- summarizing a record
- drafting report language from selected records
- identifying missing fields
- suggesting related records
- generating a corrective-action draft from a finding
- turning notes into structured draft fields
- explaining what a field means in plain language
- generating export narratives

### 10.3 Prohibited AI Capabilities

AI must not:

- determine legal compliance
- certify regulatory status
- decide OSHA/EPA applicability
- silently modify durable records
- invent source records
- create hidden links
- override user-entered evidence
- replace field judgment
- produce final reports without user review

### 10.4 Integration Posture

Allowed later:

- local model integration if technically feasible
- BYOK remote model integration if explicitly enabled by the user
- per-request AI actions
- no background AI mutation

Deferred or rejected:

- always-on AI agent
- autonomous compliance monitoring
- automatic regulatory interpretation
- vendor-hosted record analysis by default
- cloud AI requirement for core app use

### 10.5 Exit Criteria

AI features are allowed only when:

- the same workflow works without AI
- generated content is clearly marked as draft
- user review is required before durable save
- source records remain authoritative
- errors are visible
- no sensitive records are sent externally without explicit user action

### 10.6 Risks

| Risk | Severity | Control |
|---|---:|---|
| AI becomes product center | Critical | AI cannot be required for core workflow |
| AI creates false compliance confidence | Critical | No compliance certification or applicability decisions |
| AI mutates records silently | Critical | Draft-only output until user accepts changes |
| Remote AI leaks sensitive data | High | Explicit BYOK and disclosure before external transmission |

---

## 11. Phase 5 — Controlled Expansion

### 11.1 Objective

Consider limited expansion only after the desktop app is stable, useful, and maintainable.

This phase is not guaranteed. Each item requires a future ADR or implementation plan.

### 11.2 Candidate Capabilities

- local backup and restore
- backup bundle export
- backup bundle import
- advanced CSV import with validation
- PDF report generation
- saved report templates
- stronger dashboard filtering
- record history/audit trail
- user-defined fields where safe
- limited external folder backup

### 11.3 Candidate Integrations

Possible later:

- save backup to user-selected cloud folder
- import SDS file metadata from local files
- optional SDS lookup source
- optional calendar export file
- optional report package export

Not approved without future decision:

- live cloud sync
- multi-user collaboration
- role-based access control
- mobile app
- vendor EHS integrations
- ERP/procurement integrations
- automated regulatory feeds
- email/Slack/Teams workflow automation

### 11.4 Exit Criteria

Controlled expansion is allowed only when:

- the feature has a documented trigger condition
- it does not compromise local-first behavior
- it does not require enterprise identity management
- it does not turn a register into a platform
- it has clear failure states
- it can be tested locally
- it has export/recovery behavior where applicable

---

## 12. Feature Roadmap Matrix

| Feature / Capability | MVP | Post-MVP 1 | Post-MVP 2 | Later | Reject / Avoid |
|---|---:|---:|---:|---:|---:|
| Desktop app shell | Yes |  |  |  |  |
| Sidebar navigation | Yes |  |  |  |  |
| Stable routing | Yes |  |  |  |  |
| Local persistence | Yes |  |  |  |  |
| Locations | Yes |  |  |  |  |
| Processes | Yes |  |  |  |  |
| Equipment | Yes |  |  |  |  |
| SEGs | Yes |  |  |  |  |
| Chemical inventory | Yes |  |  |  |  |
| SDS reference/status | Yes |  |  |  |  |
| Exposure-limit references | Yes |  |  |  |  |
| Hazard register | Yes |  |  |  |  |
| Controls | Yes |  |  |  |  |
| Basic risk ranking | Yes |  |  |  |  |
| Observations | Yes |  |  |  |  |
| Inspections | Yes |  |  |  |  |
| Basic audits | Yes |  |  |  |  |
| Basic air sampling events | Yes |  |  |  |  |
| Corrective actions | Yes |  |  |  |  |
| Verification records | Yes |  |  |  |  |
| Basic exports | Yes |  |  |  |  |
| Evidence attachments/references |  | Yes |  |  |  |
| Review cycles |  | Yes |  |  |  |
| Stale-record flags |  | Yes |  |  |  |
| Better dashboards |  | Yes |  |  |  |
| Incident log |  |  | Yes |  |  |
| Near-miss log |  |  | Yes |  |  |
| Compliance calendar |  |  | Yes |  |  |
| Training register |  |  | Yes |  |  |
| Permit register |  |  | Yes |  |  |
| Controlled document register |  |  | Yes |  |  |
| AI record summaries |  |  |  | Maybe |  |
| AI report drafting |  |  |  | Maybe |  |
| Missing-field detection |  |  |  | Maybe |  |
| Local backup/restore |  | Yes |  |  |  |
| Live cloud sync |  |  |  | Maybe | Avoid until ADR |
| Multi-user collaboration |  |  |  | Maybe | Avoid until ADR |
| Role-based access control |  |  |  | Maybe | Avoid until multi-user justified |
| Mobile app |  |  |  | Maybe | Avoid before desktop proves value |
| Procurement/inventory control |  |  |  |  | Reject |
| LMS |  |  |  |  | Reject |
| Regulatory interpretation engine |  |  |  |  | Reject |
| Automated OSHA/EPA submission |  |  |  |  | Reject |
| Generic notes/wiki workspace |  |  |  |  | Reject |

---

## 13. Integration Roadmap

### 13.1 MVP Integrations

MVP integrations should be minimal.

Allowed:

- local database
- local file system where required
- CSV or markdown export
- dev/test fixtures

Not allowed:

- cloud sync
- remote AI
- vendor APIs
- email/calendar automation
- authentication services
- mobile sync

### 13.2 Post-MVP Integrations

Allowed after the core workflow is stable:

- local attachment management
- local backup bundle
- CSV import with validation
- PDF export if practical
- user-selected backup folder

### 13.3 Later Integrations

Possible but not committed:

- optional SDS lookup
- calendar file export
- optional BYOK AI provider
- local LLM assistant
- controlled external folder backup

### 13.4 Integration Rejection List

Avoid unless a future strategy document explicitly overrides this roadmap:

- ERP integration
- procurement integration
- vendor chemical inventory feeds
- live regulatory feeds
- automatic legal applicability engines
- enterprise SSO
- Slack/Teams workflow bots
- email task automation
- multi-tenant SaaS backend

---

## 14. Capability Boundaries

### 14.1 What OLUSO Should Become

OLUSO may become:

- a reliable desktop HSE workspace
- a linked-record system for HSE context
- a field-work capture tool
- a corrective-action closure tool
- a review-readiness workspace
- an exportable evidence support tool
- a lightweight compliance-supporting register system

### 14.2 What OLUSO Should Not Become

OLUSO should not become:

- Enablon-lite
- VelocityEHS-lite
- Intelex-lite
- Notion with hazard fields
- a spreadsheet wrapper
- an SDS database clone
- an LMS
- an ERP module
- a procurement tool
- a mobile-first field app
- an AI compliance agent
- a legal advice system
- a document dump

### 14.3 The Practical Line

The product line is crossed when OLUSO starts managing business operations instead of supporting HSE recordkeeping.

Examples:

- Tracking a chemical’s HSE context is in scope.
- Managing purchasing, reorder points, vendor contracts, and stock levels is out of scope.
- Tracking training completion evidence is in scope.
- Delivering courses, quizzes, SCORM packages, and learning paths is out of scope.
- Tracking a compliance-supporting due date is in scope.
- Determining whether the law applies is out of scope.
- Linking a field finding to a corrective action is in scope.
- Running an autonomous workflow engine is out of scope.

---

## 15. Future-Scope Triggers

A feature may move from future scope to active planning only when at least one trigger is met.

| Trigger | Meaning |
|---|---|
| Repeated user friction | The same limitation blocks real use more than once |
| Record integrity need | The feature protects durability, traceability, or evidence quality |
| Workflow closure need | The feature completes an existing workflow instead of starting a new platform |
| Export/readiness need | The feature helps produce a defensible summary or evidence package |
| Maintenance reduction | The feature reduces duplicate data entry or brittle manual work |
| Safety value | The feature helps identify, control, verify, or review hazards more reliably |

Features must not advance because they are trendy, agent-friendly, visually impressive, or common in enterprise products.

---

## 16. Roadmap Decision Gate

Before adding any roadmap item, answer these questions:

| Gate | Question |
|---|---|
| Objective | What concrete user problem does this solve? |
| Worker Need | Does this help the HSE user perform field, register, review, or closure work? |
| Failure Mode | What can go wrong if this feature is incomplete, stale, wrong, or unavailable? |
| Maintainability | Who owns the records, routes, state, and tests? |
| Safety | Does this improve hazard recognition, control, verification, or review? |
| Compliance | Does this support evidence or obligation tracking without overclaiming? |
| Verification | How will the user prove the work was completed and verified? |
| Scope | Is this MVP, post-MVP, later, or rejected? |

If these questions cannot be answered, the feature is not ready.

---

## 17. Roadmap Anti-Patterns

Coding agents and future planning work must avoid:

1. building every sidebar item as a full module
2. adding routes before domain ownership is clear
3. creating dashboards before source records exist
4. treating reports as independent data stores
5. adding AI before non-AI workflows are complete
6. confusing backup with sync
7. adding cloud behavior without conflict handling
8. adding collaboration before single-user workflows are stable
9. turning chemical safety into procurement
10. turning training records into an LMS
11. turning compliance support into legal interpretation
12. turning evidence attachments into a document dump
13. creating hidden state outside the persistence layer
14. accepting feature shells without create/read/update/error/export behavior
15. expanding because enterprise EHS platforms have the feature

---

## 18. Agent Implementation Guidance

When implementing roadmap work, coding agents must treat this document as a constraint source.

Every implementation prompt should specify:

1. roadmap phase
2. owning domain section
3. owning route
4. owning data model record
5. allowed relationships
6. required UI states
7. required error states
8. persistence behavior
9. test criteria
10. export or evidence behavior if applicable
11. out-of-scope items

Agents must not infer that a future feature is approved for implementation merely because it appears in this roadmap.

A roadmap item becomes implementation-ready only when a build-plan issue, component specification, or ADR explicitly pulls it into scope.

---

## 19. Recommended Build Order

The recommended build order is:

1. app shell
2. sidebar
3. routing registry
4. local persistence decision
5. base record patterns
6. operations records
7. chemical records
8. hazard/control records
9. field-work records
10. corrective-action records
11. verification records
12. basic exports
13. dashboard projections
14. evidence references
15. review cycles
16. incident/near-miss log
17. compliance calendar
18. training/permit/document registers
19. optional AI assistance
20. controlled expansion

The app should not skip ahead to intelligence, dashboards, calendar views, or external integrations before the core record workflow is complete.

---

## 20. Acceptance Criteria for This Roadmap

This roadmap is acceptable when:

- MVP scope remains narrow and buildable
- future features have clear timing boundaries
- integrations are deferred until justified
- AI is optional and non-authoritative
- reports remain projections over source records
- cloud sync and collaboration are not implied
- incident, compliance, training, permit, and document areas remain supporting registers
- rejected scope is explicit
- agents have enough constraints to avoid route and feature sprawl
- every future item must pass a decision gate before implementation

---

## 21. Summary Position

OLUSO should grow slowly.

The first successful version is not the version with the most HSE categories. It is the version that lets one HSE user reliably create structured records, link them together, capture findings, close corrective actions, verify work, and export defensible summaries.

The product can expand later, but only by strengthening that backbone.


