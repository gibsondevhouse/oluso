# 08 — Scope Boundaries

Project: OLUSO  
Status: Draft  
Last Updated: 2026-07-05  

---

## 1. Purpose

This document defines the scope boundaries for OLUSO.

The purpose of this document is to prevent OLUSO from drifting into a bloated enterprise EHS platform, generic note-taking system, spreadsheet wrapper, document dump, regulatory interpretation engine, or AI-first product.

OLUSO is a local-first desktop application for structured HSE, environmental, chemical safety, industrial hygiene, field-work, corrective action, and compliance-supporting information.

This document answers:

> What belongs in OLUSO now, what belongs later, and what does not belong in OLUSO at all?

Scope boundaries are not feature ideas. They are control limits.

They protect the product from building too much, building too early, or building features that weaken the core operating model.

---

## 2. Role in the Documentation Set

This document sits after the build plan and before routing, UI architecture, and state management.

Earlier documents define:

- What OLUSO is.
- Why OLUSO exists.
- Which domains it covers.
- Which entities it tracks.
- Which workflows it supports.
- Which design principles govern the interface.
- In what order the application should be built.

This document defines the fences around that work.

It should be used when deciding whether a feature, module, page, workflow, or technical capability belongs in:

- MVP scope.
- Post-MVP scope.
- Future roadmap.
- Explicit non-goals.
- Rejected scope.

If another document proposes a feature that violates these boundaries, this document should trigger revision before implementation.

---

## 3. Boundary Philosophy

OLUSO should start narrow, structured, and durable.

The first useful version is not the version with the most modules. It is the version that creates a reliable HSE backbone:

```text
Operational context
  → Chemical / process / SEG context
  → Hazard identification
  → Controls
  → Field findings
  → Corrective actions
  → Verification
  → Closure
  → Review / export
```

The product should grow by strengthening this backbone, not by accumulating disconnected tools.

### 3.1 Narrow Before Broad

A narrow system with strong traceability is more valuable than a broad system with weak records.

OLUSO should not attempt to cover all of HSE in the first version.

The MVP should prove that the user can:

- Create durable operational records.
- Maintain chemical and hazard context.
- Link records across domains.
- Capture field findings.
- Create corrective actions.
- Track action status.
- Verify closure.
- Export or review the resulting record set.

### 3.2 Registers Before Automation

Registers are the backbone.

Automation should not be added until the underlying register, relationship, and status models are stable.

If a workflow cannot be done manually in a clear and defensible way, automating it will only hide weak design.

### 3.3 Traceability Before Dashboards

Dashboards are only useful when source records are trustworthy.

The app should not prioritize charts, summaries, or management views before the underlying records can support them.

Reports and dashboards are projections over source data. They are not the primary system of record in the MVP.

### 3.4 Verification Before Closure

OLUSO must preserve the difference between:

- Created.
- Assigned.
- In progress.
- Completed.
- Verified.
- Closed.

Completion means someone claims the work was done.

Verification means the completed work was reviewed and found adequate.

Closure should not be treated as a simple checkbox when safety-critical follow-up is involved.

### 3.5 Compliance Support, Not Compliance Certification

OLUSO may support compliance readiness.

It must not claim, imply, or visually suggest that a record is legally compliant merely because it exists inside the application.

The product may organize obligations, evidence, due dates, owners, review status, permits, training records, and controlled documents.

It does not determine legal applicability, certify compliance, replace professional judgment, or replace legal/regulatory review.

---

## 4. MVP Scope

The MVP exists to prove the core operating model.

The MVP should be capable enough to support real HSE work, but narrow enough to avoid becoming an unmaintainable enterprise clone.

### 4.1 MVP Product Definition

The MVP is:

> A local-first desktop HSE workspace that allows a single user to create, maintain, link, review, and export core operational, chemical, hazard, field-work, and corrective-action records.

### 4.2 MVP User Assumption

The MVP assumes one primary user:

> A working HSE professional responsible for maintaining field-usable, audit-aware HSE information for a facility or site.

The user may act as:

- Record creator.
- Inspector.
- Observer.
- Assessor.
- Investigator.
- Action creator.
- Action owner.
- Verifier.
- Report generator.

The MVP may store owner, assignee, verifier, and involved-person fields as domain data.

The MVP does not require authentication, permissions, role-based access control, or multi-user identity management.

### 4.3 MVP Technical Assumption

The MVP is:

- Desktop-first.
- Local-first.
- Single-user.
- Register-driven.
- Offline-capable.
- Built around local persistence.
- Designed for later export, backup, and sync, but not dependent on them.

### 4.4 MVP Functional Scope

| Area | MVP Scope |
|---|---|
| App Shell | Stable desktop layout, sidebar, primary routes, empty states, error states, basic navigation |
| Operations | Locations, processes, equipment, and SEGs |
| Chemical Safety | Chemical inventory, SDS references/status, exposure-limit references |
| Risk Management | Hazard register, controls, basic risk assessment fields |
| Field Work | Observations, inspections, audits, and air sampling records at basic register level |
| Incidents | Basic near-miss and incident log only if the core records are stable |
| Corrective Actions | Open, in-progress, completed, verification-needed, verified, and closed action tracking |
| Compliance | Basic permits, training, regulatory calendar, and document placeholders or simple registers |
| Reports | Basic register exports and review summaries |
| Storage | Local persistence with predictable data durability |
| Verification | Status transitions that preserve completion versus verification |

### 4.5 MVP Success Standard

The MVP succeeds when the user can:

- Open the app and understand where HSE work belongs.
- Create operational context records.
- Create chemical and hazard records.
- Link chemicals, locations, processes, SEGs, hazards, controls, and actions.
- Capture a field observation or inspection finding.
- Generate a corrective action from a source condition.
- Track that action through completion, verification, and closure.
- Retrieve and export basic supporting records.
- Trust that local data persists reliably.

The MVP fails if it looks complete but cannot support traceability, verification, local persistence, or field-usable records.

---

## 5. Explicit Non-Goals

The following are not in scope for the MVP.

### 5.1 Enterprise EHS Platform

OLUSO is not an enterprise EHS suite in the first version.

Out of scope:

- Multi-site enterprise governance.
- Complex approval workflows.
- Corporate dashboards.
- Enterprise role hierarchies.
- Multi-department permission structures.
- Enterprise audit management.
- Configurable enterprise workflow builders.
- Vendor-style module marketplace.

Rationale:

OLUSO must first prove the HSE backbone for one user and one working environment.

### 5.2 Multi-Tenant SaaS

OLUSO is not a multi-tenant SaaS platform in the MVP.

Out of scope:

- Tenant provisioning.
- Cloud account management.
- Subscription billing.
- Hosted database infrastructure.
- SaaS admin panels.
- Organization-level workspace management.
- Cloud-only usage.

Rationale:

The product is local-first. Cloud infrastructure would distort early architecture and increase maintenance burden before the domain model is stable.

### 5.3 Full Mobile Inspection App

OLUSO is not mobile-first in the MVP.

Out of scope:

- Native iOS app.
- Native Android app.
- One-handed inspection UX.
- Offline mobile sync.
- Mobile photo capture workflows.
- QR-code equipment scanning.
- Push notifications.
- Mobile-first route design.

Rationale:

The initial product is desktop-first. Field usability means practical HSE workflows, not necessarily phone-first capture.

### 5.4 Regulatory Interpretation Engine

OLUSO is not a legal or regulatory interpretation system.

Out of scope:

- Determining legal applicability.
- Certifying OSHA/EPA compliance.
- Automatically deciding regulatory status.
- Providing legal advice.
- Replacing professional judgment.
- Generating binding compliance conclusions.
- Claiming that record existence equals compliance.

Rationale:

The product may support compliance readiness, but the user remains responsible for applicability, interpretation, and professional judgment.

### 5.5 Full Learning Management System

OLUSO is not an LMS in the MVP.

Out of scope:

- Course authoring.
- SCORM/xAPI support.
- Online quizzes.
- Training video hosting.
- Training certificates as a full workflow.
- Employee learning portals.
- Instructor management.

In scope:

- Training requirement register.
- Training status fields.
- Due dates.
- Evidence references.
- Review status.
- Related compliance links.

Rationale:

Training records may support compliance, but course delivery is a separate product class.

### 5.6 Full Document Management System

OLUSO is not a document dump.

Out of scope:

- Unlimited file library.
- Versioned enterprise document control.
- Full-text document indexing across large archives.
- Complex retention automation.
- Folder replacement.
- Enterprise document routing.
- Large attachment storage as a primary feature.

In scope:

- Document references.
- SDS references.
- Permit/document metadata.
- Evidence links.
- Controlled-document register fields.
- Exportable summaries.

Rationale:

Documents support records. They are not the primary operating model.

### 5.7 AI-First Product

OLUSO is not an AI-first application.

Out of scope for MVP:

- Chat as primary interface.
- AI-controlled workflows.
- AI-generated compliance conclusions.
- AI-generated closure verification.
- Autonomous action creation without user review.
- AI replacing record ownership.
- AI interpreting regulations as authoritative.

Future possible scope:

- Missing-field detection.
- Draft summaries.
- Relationship suggestions.
- Report draft assistance.
- Duplicate detection.
- Record review support.

Rationale:

AI must supplement structured HSE work. It must not replace traceability, user control, or verification.

### 5.8 Real-Time Monitoring System

OLUSO is not a real-time monitoring platform.

Out of scope:

- Sensor ingestion.
- Live industrial telemetry.
- Real-time alarms.
- SCADA integration.
- Direct monitoring instrument feeds.
- Real-time exposure monitoring dashboards.
- Process control integration.

In scope:

- Manual air sampling records.
- Sampling event records.
- Result entry.
- Exposure-limit references.
- Follow-up actions based on entered results.

Rationale:

Manual recordkeeping and exposure assessment support come before live monitoring.

### 5.9 Complex Workflow Automation

OLUSO is not an automation engine in the MVP.

Out of scope:

- Configurable workflow builders.
- Conditional routing.
- Automated escalation trees.
- Multi-step approvals.
- Rule-driven notifications.
- Enterprise task orchestration.

In scope:

- Status transitions.
- Due dates.
- Owner fields.
- Verification-required flags.
- Basic overdue indicators.
- Manual action updates.

Rationale:

Automation should not be added until the manual workflow is stable and field-valid.

---

## 6. Domain Scope Boundaries

### 6.1 Operations

In scope:

- Locations.
- Processes.
- Equipment.
- SEGs.
- Basic record status.
- Parent/child location relationships.
- Links between operations records and other HSE domains.

Out of scope for MVP:

- Full GIS mapping.
- CAD/floorplan management.
- Asset maintenance management.
- Preventive maintenance scheduling.
- Spare parts inventory.
- Work-order management.
- Real-time equipment status.

Boundary rule:

> Operations exists to provide context for HSE records, not to become an operations management or maintenance system.

### 6.2 Chemical Safety

In scope:

- Chemical inventory.
- SDS status.
- SDS metadata/reference.
- Exposure-limit references.
- Storage/use location links.
- Process-use links.
- Chemical hazard context.
- Chemical-related controls and hazards.

Out of scope for MVP:

- Full SDS parsing.
- Automatic GHS classification.
- Automatic regulatory reporting calculations.
- Inventory quantity reconciliation.
- Purchasing/procurement workflow.
- Barcode inventory scanning.
- Waste manifest management.
- Supplier management.

Boundary rule:

> Chemical Safety tracks chemical identity, context, hazards, SDS status, and exposure references. It does not become a procurement, inventory-control, or regulatory reporting engine in MVP.

### 6.3 Risk Management

In scope:

- Hazard register.
- Control register.
- Basic risk assessment fields.
- Severity/likelihood or risk ranking.
- Links to chemicals, processes, equipment, locations, SEGs, incidents, field work, and actions.
- Control verification status.

Out of scope for MVP:

- Advanced bowtie analysis.
- Full HAZOP module.
- LOPA.
- Quantitative risk analysis.
- Enterprise risk matrices with configuration engines.
- Automated risk scoring logic beyond simple user-entered fields.

Boundary rule:

> Risk Management should support practical hazard/control traceability before advanced risk methodologies.

### 6.4 Field Work

In scope:

- Observations.
- Inspections.
- Audits.
- Air sampling records.
- Findings.
- Evidence references.
- Links to operational and risk context.
- Corrective-action generation.

Out of scope for MVP:

- Mobile inspection app.
- Complex checklist builder.
- Full audit program management.
- Sampling chain-of-custody automation.
- Lab integration.
- Photo-heavy field media library.
- Offline mobile capture and sync.

Boundary rule:

> Field Work captures what happened and preserves links to the HSE backbone. It should not replace the hazard register, incident log, or corrective-action register.

### 6.5 Incidents

In scope for early version only after core registers are stable:

- Near-miss log.
- Incident log.
- Basic event details.
- Basic injury/release/property-damage classification.
- Links to location, process, equipment, chemical, hazard, and corrective actions.
- Investigation placeholder fields.

Out of scope for MVP or early build:

- Full OSHA recordkeeping automation.
- Workers' compensation management.
- Claims management.
- Medical case management.
- Complex root-cause analysis tooling.
- Incident notification workflows.
- Enterprise investigation approvals.

Boundary rule:

> Incidents should start as structured event records. They should not become a full claims, legal, medical, or enterprise investigation system.

### 6.6 Corrective Actions

In scope:

- Corrective action register.
- Source record linkage.
- Owner/assignee.
- Due date.
- Status.
- Completion notes.
- Verification status.
- Closure notes.
- Evidence references.
- Overdue indicators.

Out of scope for MVP:

- Multi-level approval workflows.
- Email notification engine.
- Automated escalation.
- Team-based task boards.
- Enterprise CAPA routing.
- External assignee portals.

Boundary rule:

> Corrective Actions own follow-through. They do not own the full source record and should not become a generic task manager.

### 6.7 Compliance

In scope:

- Training requirement/status tracking.
- Permit register.
- Regulatory calendar items.
- Controlled document register.
- Due dates.
- Owners.
- Evidence references.
- Requirement source fields.
- Review status.

Out of scope for MVP:

- Legal interpretation.
- Automatic applicability determinations.
- Permit application generation.
- Regulatory submission automation.
- LMS functionality.
- Enterprise document control.
- Compliance certification.

Boundary rule:

> Compliance features support audit readiness and obligation tracking. They do not determine or certify compliance.

### 6.8 Reports

In scope:

- Basic register exports.
- Corrective-action summaries.
- Chemical inventory export.
- Hazard/control summary.
- Open/overdue action report.
- Records missing evidence/review.
- Simple printable or downloadable review outputs.

Out of scope for MVP:

- Advanced analytics.
- Executive dashboards.
- Custom report builder.
- BI integration.
- Complex charts.
- Predictive risk analytics.
- Scheduled report delivery.

Boundary rule:

> Reports are projections over source records. They are not primary records in the MVP.

---

## 7. Data Boundaries

### 7.1 Local-First Storage

In scope:

- Local persistence.
- Structured records.
- Stable identifiers.
- Basic migrations.
- Seed/test data.
- Export path.
- Data durability checks.

Out of scope for MVP:

- Cloud database.
- Multi-device sync.
- Real-time collaboration.
- Conflict resolution.
- Team workspaces.
- Remote database hosting.
- Enterprise backup service.

Boundary rule:

> Local persistence must be reliable before sync or collaboration is considered.

### 7.2 Record Identity

Each durable record should have a stable identifier.

In scope:

- Human-readable names.
- Internal IDs.
- Created/updated timestamps.
- Status fields.
- Link references.
- Archive status instead of destructive deletion for audit-relevant records.

Out of scope for MVP:

- Complex global identifier systems.
- Cross-tenant ID schemes.
- External system IDs except simple reference fields.

Boundary rule:

> Records must be stable enough to link, export, and audit.

### 7.3 Deletion and Archiving

In scope:

- Archive status for audit-relevant records.
- Soft-delete or inactive status where appropriate.
- Clear distinction between inactive, retired, archived, and deleted.

Out of scope for MVP:

- Complex retention automation.
- Legal hold workflows.
- Enterprise deletion approval.
- Permanent deletion workflows for audit-relevant records without guardrails.

Boundary rule:

> Audit-relevant records should favor archiving over destructive deletion.

### 7.4 Attachments and Evidence

In scope:

- Evidence metadata.
- File references.
- Links to supporting documents.
- Small/local attachment support only if technically simple.
- Evidence-required status indicators.

Out of scope for MVP:

- Unlimited attachment storage.
- Full document repository.
- OCR.
- Large media management.
- Cloud file storage.
- Enterprise retention and document routing.

Boundary rule:

> Evidence should support traceability. It should not turn OLUSO into a file-management product.

---

## 8. Workflow Boundaries

### 8.1 Allowed MVP Workflow Spine

The MVP workflow spine is:

```text
Create operational context
  → Add chemical / hazard / control context
  → Capture field condition or finding
  → Create corrective action
  → Complete action
  → Verify action
  → Close action
  → Export or review summary
```

Workflows outside this spine should be deferred unless they are required to make the spine work.

### 8.2 Field Capture Boundary

In scope:

- Save draft records.
- Accept incomplete field information.
- Mark unknown / not applicable / under review.
- Add links later.
- Add evidence later.
- Promote record status after minimum requirements are met.

Out of scope:

- Forced perfection at creation.
- Large mandatory forms.
- Complex modal chains.
- Mobile-first field wizard.
- AI-driven field capture.

Boundary rule:

> The user should be able to capture imperfect field reality without corrupting the system of record.

### 8.3 Corrective Action Boundary

In scope:

- Actions created from source records.
- Manual status updates.
- Required source link where possible.
- Due dates.
- Verification-required flag.
- Closure evidence/reference.

Out of scope:

- Orphan task lists.
- Generic project management boards.
- Complex automation.
- Closure without traceability for safety-critical items.

Boundary rule:

> A corrective action should not become an orphaned to-do item.

### 8.4 Compliance Workflow Boundary

In scope:

- Requirement source.
- Due date.
- Owner.
- Evidence.
- Review status.
- Related record links.

Out of scope:

- Legal conclusion.
- Automated applicability.
- Regulatory certification.
- Complex submission workflow.

Boundary rule:

> Compliance workflow should preserve evidence and accountability, not pretend to produce legal certainty.

---

## 9. UI and Design Boundaries

### 9.1 Desktop-First

In scope:

- Persistent sidebar.
- Dense but readable tables.
- Detail panels.
- Keyboard/mouse workflow.
- Split-pane layouts where appropriate.
- Search and filter patterns.
- Clear empty/error/loading states.

Out of scope:

- Mobile-first layouts.
- Gesture-driven interactions.
- Consumer-style card-only interfaces.
- Overly airy productivity-app layouts.
- Hidden controls behind hover-only actions.

Boundary rule:

> OLUSO should feel like a disciplined desktop operations console.

### 9.2 Dashboard Boundary

In scope:

- Basic summary cards.
- Open action counts.
- Overdue action counts.
- Missing SDS/evidence/review indicators.
- Recent field activity.
- Links into source records.

Out of scope for MVP:

- Large decorative charts.
- Executive analytics.
- Vanity graphs.
- Dashboard as primary editing surface.
- Complex KPI builder.

Boundary rule:

> The dashboard summarizes source records. It does not replace registers.

### 9.3 Forms Boundary

In scope:

- Progressive completeness.
- Draft saves.
- Required fields for status promotion.
- Inline validation.
- Status-aware form behavior.
- Unknown / not applicable / under review options.

Out of scope:

- Massive mandatory forms.
- Wizard-only workflows.
- Blocking save until every value is known.
- Compliance-form mimicry without workflow value.

Boundary rule:

> Forms should help the user capture and mature records, not punish incomplete field knowledge.

### 9.4 Design Anti-Patterns

Rejected patterns:

- Notion clone.
- Spreadsheet wrapper.
- Legacy compliance portal.
- Mobile inspection clone.
- AI-first app.
- Vanity dashboard.
- Generic task manager.
- File dump.
- Overbuilt enterprise admin console.

Boundary rule:

> Every interface pattern must support structured records, traceability, status clarity, and verification.

---

## 10. AI and Automation Boundaries

### 10.1 AI MVP Boundary

AI is out of scope for MVP.

No MVP workflow should depend on AI to function.

### 10.2 Allowed Future AI Assistance

Future AI may assist with:

- Draft summaries.
- Missing-field detection.
- Duplicate record suggestions.
- Relationship suggestions.
- Draft report generation.
- Plain-language review of records.
- Checklist suggestions.
- Evidence gap detection.

### 10.3 Prohibited AI Behavior

AI must not:

- Certify compliance.
- Determine legal applicability.
- Close corrective actions.
- Verify safety-critical controls without user review.
- Override user-entered records.
- Hide uncertainty.
- Create authoritative conclusions without source review.
- Replace professional judgment.

### 10.4 Automation Boundary

Automation may later support:

- Reminder prompts.
- Status review prompts.
- Overdue indicators.
- Missing-evidence flags.
- Suggested links.
- Export generation.

Automation should not own:

- Legal conclusions.
- Risk acceptance.
- Action closure.
- Compliance certification.
- Field verification.

Boundary rule:

> AI and automation may assist, but the user remains the accountable decision-maker.

---

## 11. Reporting and Export Boundaries

### 11.1 MVP Reports

In scope:

- Chemical inventory export.
- Hazard register export.
- Corrective action register export.
- Open/overdue action summary.
- Records missing evidence summary.
- Basic field-work summary.
- Simple compliance calendar export.

### 11.2 Post-MVP Reports

Possible later scope:

- Exposure assessment summary.
- Audit package export.
- Incident trend summary.
- Permit status package.
- Management review packet.
- Custom saved reports.
- Filtered PDF/CSV exports.

### 11.3 Out-of-Scope Reports

Out of scope for MVP:

- BI dashboards.
- Predictive analytics.
- Regulatory submission generation.
- Executive KPI suite.
- Automated scheduled reporting.
- Complex report designer.

Boundary rule:

> Reports must be generated from real source records. Do not build reporting before the data model is stable.

---

## 12. Import and Export Boundaries

### 12.1 Import Scope

In scope for MVP only if simple:

- Seed data.
- Manual entry.
- Basic CSV import for controlled registers if low-risk.
- Simple reference imports for exposure limits or chemicals only if validation is manageable.

Out of scope for MVP:

- Complex spreadsheet mapping.
- Enterprise EHS imports.
- SDS auto-ingestion.
- OCR extraction.
- Bulk document classification.
- External API integrations.
- Automated chemical database synchronization.

Boundary rule:

> Import should not be built until the receiving data model is stable.

### 12.2 Export Scope

In scope:

- CSV export.
- Markdown/text export.
- Basic printable summaries.
- Register-level export.
- Corrective-action export.

Out of scope for MVP:

- Branded report templates.
- Regulator-specific submissions.
- Automated PDF packet generation with attachments.
- Scheduled exports.
- Cloud sharing.

Boundary rule:

> Export should support audit readiness without becoming a report-design product.

---

## 13. Future-Scope Triggers

A deferred feature may move into scope only when its trigger condition is met.

| Deferred Feature | Trigger Condition |
|---|---|
| Mobile capture | Desktop field-work workflow is stable and users need same workflow away from laptop |
| Multi-user support | Single-user records, statuses, and ownership fields are stable |
| Cloud sync | Local persistence, export, and backup model are reliable |
| AI assistance | Registers, links, statuses, and verification logic are stable |
| Advanced reports | Source records produce reliable data |
| Compliance automation | Requirement source, owner, due date, evidence, and review fields are stable |
| Document management | Evidence/reference needs exceed simple links and metadata |
| Incident investigation depth | Basic incident log and corrective-action traceability are stable |
| Exposure assessment depth | SEGs, chemicals, processes, exposure limits, and sampling events are stable |
| Custom workflows | Manual workflows have repeated enough to justify automation |

Boundary rule:

> Future scope must be earned by stable core workflows, not added because it sounds useful.

---

## 14. Scope Creep Watchlist

The following requests should trigger review before acceptance.

| Request | Risk | Default Response |
|---|---|---|
| “Can we add AI chat?” | AI-first drift | Defer until structured records are stable |
| “Can we make it mobile?” | Platform drift | Defer until desktop workflow is proven |
| “Can it certify compliance?” | Legal/compliance overclaim | Reject |
| “Can it manage all training?” | LMS drift | Limit to tracking requirements/status/evidence |
| “Can it replace our shared drive?” | Document-management drift | Reject for MVP |
| “Can we build a dashboard first?” | Vanity-dashboard drift | Build source registers first |
| “Can it sync between users?” | Multi-user/cloud drift | Defer until local persistence is stable |
| “Can it import every spreadsheet?” | Data-quality risk | Defer or restrict to validated import |
| “Can it auto-close actions?” | Verification risk | Reject for safety-critical actions |
| “Can it determine regulatory applicability?” | Legal risk | Reject |

---

## 15. Decision Filter

A feature may enter MVP only if it passes all of the following questions.

| Criterion | Question |
|---|---|
| Objective | What HSE problem does this solve? |
| Worker Need | Does this help the user perform real field or recordkeeping work? |
| Failure Mode | What breaks if the feature is missing, wrong, or ignored? |
| Maintainability | Can this be built without creating major system debt? |
| Safety | Does this improve hazard recognition, control, follow-up, or verification? |
| Compliance | Does this preserve evidence, obligation context, or defensible records without overclaiming? |
| Verification | Can the user prove whether the work was completed and verified? |
| Scope | Does this belong in MVP, post-MVP, future roadmap, or explicit non-goal? |

If a feature fails this filter, it should not enter the build plan.

---

## 16. MVP Boundary Statement

The MVP boundary is:

> OLUSO MVP is a local-first desktop HSE backbone for structured registers, linked records, field findings, corrective actions, verification, and basic export.

The MVP is not:

- Enterprise EHS.
- SaaS.
- Mobile-first.
- AI-first.
- A document dump.
- A spreadsheet wrapper.
- A regulatory interpretation engine.
- A full LMS.
- A real-time monitoring system.
- A workflow automation platform.

---

## 17. Severity-Rated Scope Risks

| Severity | Risk | Impact | Boundary Control |
|---|---|---|---|
| Critical | Building all HSE modules at once | Produces a broad but shallow system | Build the HSE backbone first |
| Critical | Claiming compliance | Creates legal and professional risk | Use compliance-support language only |
| Critical | Weak corrective-action verification | Allows unsafe closure | Preserve completion versus verification |
| High | AI-first workflow | Undermines structured records and user accountability | Keep AI out of MVP |
| High | Document dump drift | Turns OLUSO into a file folder | Keep registers primary |
| High | Dashboard-first development | Creates a demo shell with weak source data | Build records before summaries |
| High | Multi-user too early | Adds identity, sync, and permission debt | Single-user first |
| Medium | Mobile too early | Splits UI and workflow effort | Desktop-first first |
| Medium | Import too early | Pollutes unstable data model | Delay imports until schema stabilizes |
| Medium | Advanced incident features too early | Pulls product toward enterprise EHS | Start with basic event log |
| Low | Excessive visual polish | Consumes effort before workflow proof | Use clean but restrained design |

---

## 18. Boundary Enforcement Rules

1. Every new feature must identify its domain owner.
2. Every new page must justify sidebar placement.
3. Every new record type must define whether it is a register, record, reference, evidence item, or report projection.
4. Every corrective action must preserve source traceability where possible.
5. Every compliance feature must avoid legal/compliance overclaiming.
6. Every report must identify its source records.
7. Every automation must preserve user review.
8. Every AI feature must be optional and non-authoritative.
9. Every MVP feature must improve the HSE backbone.
10. Every future-scope item must have a trigger condition.

---

## 19. Out-of-Scope Language for Agents

When coding agents are used, they should receive explicit scope limits.

Use language like:

```text
Do not add authentication, cloud sync, mobile-specific UI, AI features, dashboard analytics, document-management systems, regulatory interpretation, automated compliance conclusions, or enterprise workflow automation unless explicitly requested in this task.
```

For MVP implementation prompts, include:

```text
Implement only the scoped vertical slice. Preserve local-first behavior, structured records, stable identifiers, status handling, empty states, error states, and test coverage. Do not create placeholder pages or unrelated modules.
```

For HSE-sensitive workflows, include:

```text
Do not label records as compliant unless the criteria are explicitly defined. Use compliance-supporting language. Preserve requirement source, owner, due date, evidence, status, and review fields.
```

For corrective actions, include:

```text
Do not collapse completion, verification, and closure into one status. Preserve separate transitions and prevent orphan corrective actions where source context exists.
```

---

## 20. Final Scope Standard

OLUSO should remain narrow enough to be maintainable and serious enough to be field-usable.

The product should not win by having the most modules.

It should win by helping an HSE professional:

- Understand the operation.
- Identify hazards.
- Link risk to real context.
- Track controls.
- Capture field reality.
- Follow up on broken conditions.
- Verify closure.
- Preserve defensible records.
- Export useful evidence.

The final boundary is:

> If a feature does not strengthen structured HSE records, traceability, field execution, corrective-action follow-through, compliance support, or verification, it does not belong in the MVP.
