# ADAMA HSE — Campaigns 7–10 Authoring Prompt Pack

**Repository context file:** `sources/the-repo-for-this-project.txt`  
**Expected repository:** `gibsondevhouse/oluso`  
**Purpose:** Provide strict, self-contained prompts that can be given to a capable coding/repository agent to author Campaigns 7–10 in the same evidence-based campaign format as Campaign 6.  
**Mode:** Documentation authoring only; no product implementation, repository mutation, issue creation, branch creation, commit, push, or pull request.

---

# 1. How to Use This Pack

Use one campaign prompt at a time.

Each prompt requires the authoring agent to:

1. Read the local project context file.
2. Inspect the current GitHub repository through a read-only GitHub connector or API.
3. Resolve the current default-branch commit rather than assuming the baseline in this prompt pack remains current.
4. Read Campaign 6 if it is available in the repository or supplied as an artifact.
5. Follow the repository documentation authority order.
6. Separate verified facts, partial implementation, assumptions, governance conflicts, and decisions still required.
7. Produce exactly one comprehensive Markdown campaign file under `/mnt/data`.
8. Return only a concise completion note and the file link.

The prompts intentionally repeat the shared contract so each one is machine-usable without the rest of this pack.

---

# 2. Shared Campaign Format

Every authored campaign must use this structure, with campaign-specific additions allowed but no required section omitted:

```text
# ADAMA HSE — Campaign N: Title

Metadata

# 1. Authority, Naming, and Campaign Position
# 2. Executive Decision
# 3. Campaign Outcomes
# 4. User Jobs and Design Priorities
# 5. Inspected Baseline and Disposition
# 6. Scope
# 7. Dependencies and Entry Gates
# 8. Target Information Architecture and Route Contract
# 9. Cross-Cutting UX/Domain Standards
# 10. Data and Architecture Implications
# 11 onward. Numbered Stages
# Campaign Delivery Phases
# Documentation and Repository Path Plan
# Risks and Mitigations
# Testing Strategy
# Error Handling Requirements
# Performance and Quality Targets
# Campaign Acceptance Criteria
# Out of Scope
# Recommended Branch and Commits
# Definition of Done
```

Every numbered Stage must contain:

```text
## Objective
## Problem
## Primary Repository Paths
## Required Changes / Required Experience
## Delivery Phases
## UI/UX Requirements
## Data and Persistence Requirements
## Error Handling
## Tests
## Stage Acceptance Criteria
## Out of Scope
## Recommended Commit
```

If a subsection truly does not apply, include it and state why. Do not silently omit it.

---

# 3. Evidence and Language Rules

The authoring agent must use these labels consistently:

- `[VERIFIED]` — directly supported by the inspected repository at the recorded baseline commit.
- `[PARTIAL]` — implementation exists but does not satisfy the governing exit criteria.
- `[LEGACY]` — historical or migration-only behavior that is not the target contract.
- `[ASSUMPTION]` — necessary planning assumption not verified in the repository.
- `[DECISION REQUIRED]` — a product, HSE, legal, brand, or architecture decision needed before implementation.
- `[GOVERNANCE CONFLICT]` — requested campaign scope conflicts with a governing ADR, scope boundary, domain invariant, or build-plan gate.

Rules:

- Do not invent files, entities, routes, fields, services, tests, integrations, regulations, or completed capabilities.
- Suggested new paths must be labeled “proposed.”
- Do not call a generic CRUD page a complete safety-critical workflow.
- Do not weaken typed domain, revision, expected-revision, migration, archive/restore, exchange, or local-first requirements.
- Do not use “sync” for local saves or manual exchange.
- Do not imply compliance, safety, exposure determination, medical fitness, or legal conclusions unless a governed rule explicitly supports the claim.
- Use **ADAMA HSE** for the target product and **OLUSO** only for legacy repository/product references.
- Include exact repository paths in backticks.
- Acceptance criteria must be binary and testable. Replace vague words such as “modern,” “intuitive,” “robust,” or “user-friendly” with observable outcomes or measured gates.
- Keep professional judgment explicit and attributed.
- Preserve the repository freeze on new generic campaign-register expansion.

---

# 4. Prompt — Campaign 7: Operations Experience

Copy the complete prompt below.

```text
You are authoring a governing campaign document for the ADAMA HSE project.

TASK

Inspect the current `gibsondevhouse/oluso` GitHub repository and the local project context file `sources/the-repo-for-this-project.txt`. Then author one comprehensive Markdown document:

Campaign 7 — Operations Experience

This is a documentation-authoring task only. Do not implement code. Do not modify the GitHub repository, local synced sources, issues, branches, commits, pull requests, or external systems.

OUTPUT

Save exactly one file:

`/mnt/data/ADAMA_HSE_Campaign_7_Operations_Experience.md`

Return only a concise completion statement and a download link to that file.

REPOSITORY INSPECTION REQUIREMENTS

1. Read `sources/the-repo-for-this-project.txt` without editing it.
2. Resolve the repository default branch and current head commit; record the exact SHA and inspection date in the document metadata.
3. Inspect the complete current versions of:
   - `docs/README.md`
   - `docs/00-project-brief.md`
   - `docs/02-information-architecture.md`
   - `docs/03-sidebar-navigation.md`
   - `docs/04-domain-model.md`
   - `docs/05-user-workflows.md`
   - `docs/06-design-principles.md`
   - `docs/07-build-plan.md`
   - `docs/08-scope-boundaries.md`
   - `docs/09-routing.md`
   - `docs/10-ui-architecture.md`
   - `docs/11-state-management.md`
   - `docs/12-future-roadmap.md`
   - `docs/repository-audit-2026-07-18.md`
   - `docs/feature-inventory.md`
   - `TODO.md`
   - the current Campaign 6 portal UX document if present
   - relevant page, workflow, component, data, and test specs for observations, inspections, findings, incidents, investigations, corrective actions, controls, closure, review, and baseline work
4. Inspect current code and tests for Operations, Field/Assurance, Incidents, Corrective Actions, Home/Review Queue, workspaces, revisions, repositories, services, route registry, and sidebar configuration.
5. Identify actual existing types, generic records, routes, services, stores, workspaces, tests, and gaps. Do not infer readiness from file names.
6. Follow the authority order in `docs/README.md`.

CAMPAIGN POSITION

Campaign 7 follows Campaign 6 — HSE Operations Portal UX. It must use the portal shell, Home, navigation, search, workspace, activity, context-panel, and visual standards delivered or specified by Campaign 6. It must not re-author Campaign 6.

Campaign 7 should align with the assurance and corrective-action parts of the governing build plan while using plain operational language for users. Explicitly distinguish this product campaign number from any same-numbered build-plan phase.

CAMPAIGN OBJECTIVE

Define the typed, end-to-end daily operations experience that connects observations and inspections to findings, incidents/near misses, investigations, corrective actions, completion, independent verification, closure, control verification, and reassessment—always preserving Site, Location, Function, Process, Task, Equipment, Chemical Use, SEG/Scenario, Hazard/Agent, Control, owner, due date, evidence, status, and revision context when known.

GOVERNING WORKFLOW

The document must test and refine this traceability chain against the repository:

`Site → Location → Function → Process → Task → Equipment/Chemical Use → Scenario/Hazard/Agent → Control → Observation/Inspection/Incident → Finding → Corrective Action → Completion → Verification → Closure → Reassessment`

Do not force every record to populate unknown context. Preserve explicit Missing, Unknown, Not Applicable, Draft, Under Review, Closed, and Archived semantics according to governing specs.

REQUIRED CAMPAIGN COVERAGE

At minimum address:

1. Operations Home/work queue and responsibility views.
2. Site/Unit/Location operational workspace integration.
3. Observation and inspection planning/capture.
4. Finding creation, triage, linkage, severity/priority governance, and ownership.
5. Incident and near-miss intake with operational/exposure context.
6. Investigation context and evidence references without inventing a full legal case-management system.
7. Corrective-action assignment, due dates, dependencies, blockers, escalation, and reassignment.
8. Strict separation of action completion, verification, and closure.
9. Control verification and reassessment triggers.
10. Review, activity/history, printable packets, offline behavior, and manager acceptance.

Use 8–12 numbered Stages. The suggested list above may be reorganized when repository dependencies justify it, but every subject must appear.

DOMAIN AND DATA RULES

- Safety-critical operations entities require explicit types, invariants, services, repositories, revisions, and migration tests.
- Do not expand the generic campaign register model for observations, incidents, investigations, findings, actions, verification, or closure.
- Preserve expected-revision concurrency and atomic mutation/revision behavior.
- Define explicit status transitions and eligibility rules. A status label alone is not a workflow.
- Completion evidence does not equal verification. Verification does not equal closure.
- Archiving does not erase historical relationships.
- Operational severity, priority, risk, and escalation terms require documented rules and must not imply legal/compliance conclusions.
- Evidence should be reference-based unless the governing scope is explicitly amended for attachments.
- Reassessment triggers must link to the changed control, incident, finding, action, or exposure context.
- If current generic records require migration, define mapping, unresolved-finding behavior, rollback, idempotency, and preservation of IDs/revisions/archive state.

UX REQUIREMENTS

- Reuse Campaign 6 portal patterns.
- Use verbs and operational questions rather than table names.
- Support low-frequency manager review and keyboard-efficient professional use.
- Preserve active Site/Location/Function context.
- Make overdue, blocked, unverified, and returned work visible without relying on color alone.
- Provide calm summary-first workspaces with progressive disclosure.
- Never hide failed local writes, stale revisions, missing/archived dependencies, or blocking evidence.
- Define offline, empty, partial, not-found, migration-only, and failure states.

REQUIRED CAMPAIGN FORMAT

Use exactly this top-level structure, adding campaign-specific subsections but omitting none:

# ADAMA HSE — Campaign 7: Operations Experience
Metadata
# 1. Authority, Naming, and Campaign Position
# 2. Executive Decision
# 3. Campaign Outcomes
# 4. User Jobs and Design Priorities
# 5. Inspected Baseline and Disposition
# 6. Scope
# 7. Dependencies and Entry Gates
# 8. Target Information Architecture and Route Contract
# 9. Cross-Cutting UX and Domain Standards
# 10. Data and Architecture Implications
# 11 onward. Numbered Stages
# Campaign Delivery Phases
# Documentation and Repository Path Plan
# Risks and Mitigations
# Testing Strategy
# Error Handling Requirements
# Performance and Quality Targets
# Campaign Acceptance Criteria
# Out of Scope
# Recommended Branch and Commits
# Definition of Done

Every Stage must include:

## Objective
## Problem
## Primary Repository Paths
## Required Changes / Required Experience
## Delivery Phases
## UI/UX Requirements
## Data and Persistence Requirements
## Error Handling
## Tests
## Stage Acceptance Criteria
## Out of Scope
## Recommended Commit

EVIDENCE LABELS

Use `[VERIFIED]`, `[PARTIAL]`, `[LEGACY]`, `[ASSUMPTION]`, `[DECISION REQUIRED]`, and `[GOVERNANCE CONFLICT]` consistently. Suggested new paths must be labeled proposed.

ACCEPTANCE QUALITY

- Acceptance criteria must be binary and testable.
- Include unit, service, repository-contract, migration, integration, route/component, end-to-end, accessibility, offline/PWA, performance, print, and realistic-data manager acceptance.
- Include exact error classes or semantic error categories verified in the repo, plus proposed errors clearly labeled.
- Include a risk register with consequence, detection, prevention/mitigation, owner/decision gate, and acceptance evidence.
- Include a campaign sequence, dependency graph in text, proposed repository paths, branch name, and conventional commits.
- State which later Campaign 8/9/10 capabilities are dependencies versus out of scope.

OUT OF SCOPE FOR CAMPAIGN 7

At minimum exclude:

- Automated legal/compliance conclusions.
- Clinical medical information.
- Real-time cloud collaboration or silent OneDrive monitoring.
- Emergency dispatch, live responder tracking, and public alerts reserved for Campaign 9 or a separately approved scope.
- Full industrial-hygiene assessment/sampling/determination implementation reserved for Campaign 8.
- Executive cross-site analytics reserved for Campaign 10.
- Training/LMS, broad MOC/PSSR, environmental/waste, and permit-suite reactivation unless governance is explicitly amended.

FINAL VERIFICATION

Before returning, confirm the output file exists, is valid UTF-8 Markdown, contains every required section, records the inspected baseline SHA, cites exact repository paths, contains no claim of unverified completion, and does not modify the repository.
```

---

# 5. Prompt — Campaign 8: Industrial Hygiene Experience

Copy the complete prompt below.

```text
You are authoring a governing campaign document for the ADAMA HSE project.

TASK

Inspect the current `gibsondevhouse/oluso` GitHub repository and the local project context file `sources/the-repo-for-this-project.txt`. Then author one comprehensive Markdown document:

Campaign 8 — Industrial Hygiene Experience

This is a documentation-authoring task only. Do not implement code. Do not modify the GitHub repository, local synced sources, issues, branches, commits, pull requests, or external systems.

OUTPUT

Save exactly one file:

`/mnt/data/ADAMA_HSE_Campaign_8_Industrial_Hygiene_Experience.md`

Return only a concise completion statement and a download link to that file.

REPOSITORY INSPECTION REQUIREMENTS

1. Read `sources/the-repo-for-this-project.txt` without editing it.
2. Resolve and record the current default-branch head SHA and inspection date.
3. Inspect the complete governing set listed in `docs/README.md`, especially:
   - `docs/00-project-brief.md`
   - `docs/02-information-architecture.md`
   - `docs/04-domain-model.md`
   - `docs/05-user-workflows.md`
   - `docs/06-design-principles.md`
   - `docs/07-build-plan.md`
   - `docs/08-scope-boundaries.md`
   - `docs/09-routing.md`
   - `docs/10-ui-architecture.md`
   - `docs/11-state-management.md`
   - `docs/repository-audit-2026-07-18.md`
   - `docs/legacy-schema-mapping.md`
   - `docs/data-specs/**`
   - relevant IH page/workflow/component/test specs
   - `TODO.md`
   - Campaign 6 and Campaign 7 documents if available
4. Inspect current code and tests for SEGs, memberships, Exposure Scenarios, assessments, exposure agents/limits, monitoring/sampling, controls, interpretations, determinations, surveillance/program applicability, reassessment, evidence, review, revisions, repositories, services, migrations, and exchange attribution.
5. Determine which objects are typed/current, generic/legacy, partially cut over, absent, or contradicted by governing docs.
6. Follow the authority order in `docs/README.md`.

CAMPAIGN POSITION

Campaign 8 follows Campaign 6 portal infrastructure and Campaign 7 operations/assurance context. It must reuse their Home, navigation, search, workspace, activity, context-panel, action, review, evidence, and visual contracts where applicable.

Campaign 8 is the primary safety-critical occupational-exposure campaign. It must align with the DOEHRS-inspired industrial-hygiene spine in the governing build plan and explicitly distinguish its product campaign number from build-plan phase numbering.

CAMPAIGN OBJECTIVE

Define the end-to-end industrial-hygiene experience that can answer, for any worker or SEG:

- What work do they perform?
- Where do they perform it?
- Which agents may expose them?
- Under which operating conditions, routes, durations, and frequencies?
- Which controls apply and how are they verified?
- What evidence, uncertainty, confidence, and gaps support the assessment?
- What monitoring plan and results exist?
- Which versioned limit and compatible basis were used for any calculation?
- What did the qualified professional interpret and determine?
- What actions, surveillance/program applicability, and reassessment follow?

GOVERNING WORKFLOW

The campaign must define and preserve this separation:

`Person ↔ effective-dated SEG membership → Exposure Scenario → Exposure Assessment → Monitoring Priority → Sampling Plan → Sampling Event → Sample → Laboratory Result → Exposure Limit Comparison → Professional Interpretation → Exposure Determination → Controls/Verification → Program or Surveillance Applicability → Actions → Reassessment`

Calculations, interpretation, and determination are distinct objects or explicit typed concepts. A numeric comparison must never masquerade as professional judgment.

REQUIRED CAMPAIGN COVERAGE

At minimum address:

1. IH Home/work queue and scenario-centered navigation.
2. SEG definitions and effective-dated membership.
3. Exposure Agent and versioned Exposure Limit master data.
4. Exposure Scenario builder with Site, Location, Function, Process, Task, SEG/person, agent, operating condition, route, duration, frequency, controls, and evidence.
5. Structured qualitative assessment with uncertainty, confidence, data quality, assumptions, gaps, and review readiness.
6. Monitoring priority and Sampling Plan.
7. Sampling Event, Sample, Laboratory Result, qualifiers, LOD/LOQ, units, duration, methods, and chain/reference context appropriate to scope.
8. Exposure Limit Comparison with unit, dimension, duration, basis, and version compatibility.
9. Attributed Professional Interpretation and Exposure Determination.
10. Control verification, program/surveillance applicability, actions, reassessment, review packet, and manager review.

Use 9–12 numbered Stages. The list may be reorganized only when repository dependencies justify it.

NON-NEGOTIABLE DOMAIN RULES

- A SEG is a worker-group definition, not a hazard bucket or scenario substitute.
- SEG memberships are effective-dated and historically resolvable.
- An assessment cannot be review-ready without a valid Exposure Scenario.
- A determination cannot exist without the governed assessment/context required by the domain model.
- Routine, startup, shutdown, maintenance, upset, emergency, and post-release cleanup conditions remain distinct where supported.
- Operating condition does not become a fixed reusable Task property.
- Numeric results are not stored as unparsed display strings.
- Preserve result qualifier, value, unit, method, sampling duration, basis, LOD/LOQ where applicable, and source evidence.
- Incompatible unit, dimension, duration, or basis blocks comparison.
- Every comparison identifies the exact versioned exposure limit and conversion assumptions.
- Calculation is separate from attributed professional interpretation and determination.
- Superseded limits, assessments, interpretations, and determinations remain historically visible.
- Professional determinations cannot be automated by this campaign.
- Clinical medical data, diagnoses, and medical notes are prohibited.
- Safety-critical entities must not use generic campaign records or `Record<string, unknown>` mutation services.
- Every accepted mutation creates an immutable revision with expected-revision concurrency.
- Migration must preserve IDs, business IDs, revisions, archive/supersession state, evidence, and unresolved data-quality findings.

UX REQUIREMENTS

- Scenario detail is the primary IH context hub.
- Use Campaign 6 workspace and progressive-disclosure standards.
- Display operating condition prominently.
- Show uncertainty, confidence, evidence, and gaps next to assessment conclusions.
- Display numeric result, qualifier, unit, duration, and method together.
- Display comparison basis and limit version next to calculated comparison.
- Render Professional Interpretation and Determination as distinct attributed sections.
- Make superseded/historical status unmistakable without color alone.
- Support keyboard, screen reader, print/review packet, offline, local-write, stale-revision, missing-dependency, and migration-only states.
- Do not use traffic-light colors as a substitute for professional interpretation.

REQUIRED CAMPAIGN FORMAT

Use exactly this top-level structure, adding campaign-specific subsections but omitting none:

# ADAMA HSE — Campaign 8: Industrial Hygiene Experience
Metadata
# 1. Authority, Naming, and Campaign Position
# 2. Executive Decision
# 3. Campaign Outcomes
# 4. User Jobs and Design Priorities
# 5. Inspected Baseline and Disposition
# 6. Scope
# 7. Dependencies and Entry Gates
# 8. Target Information Architecture and Route Contract
# 9. Cross-Cutting UX and Domain Standards
# 10. Data and Architecture Implications
# 11 onward. Numbered Stages
# Campaign Delivery Phases
# Documentation and Repository Path Plan
# Risks and Mitigations
# Testing Strategy
# Error Handling Requirements
# Performance and Quality Targets
# Campaign Acceptance Criteria
# Out of Scope
# Recommended Branch and Commits
# Definition of Done

Every Stage must include:

## Objective
## Problem
## Primary Repository Paths
## Required Changes / Required Experience
## Delivery Phases
## UI/UX Requirements
## Data and Persistence Requirements
## Error Handling
## Tests
## Stage Acceptance Criteria
## Out of Scope
## Recommended Commit

EVIDENCE LABELS

Use `[VERIFIED]`, `[PARTIAL]`, `[LEGACY]`, `[ASSUMPTION]`, `[DECISION REQUIRED]`, and `[GOVERNANCE CONFLICT]`. Suggested paths and error types must be labeled proposed unless verified.

TESTING REQUIREMENTS

Include explicit test matrices for:

- SEG membership overlap, effective dates, archive, and history.
- Scenario completeness and operating-condition separation.
- Assessment review-readiness, uncertainty, confidence, evidence, and gaps.
- Result parsing/validation, qualifiers, units, dimensions, durations, basis, non-detects, and LOD/LOQ.
- Limit versioning, supersession, and compatibility blocking.
- Calculation reproducibility and separation from interpretation/determination.
- Determination attribution, revision, supersession, and review.
- Control verification and reassessment triggers.
- Repository transactions, stale revisions, rollback, migrations, and exchange attribution.
- End-to-end IH journeys with realistic but non-sensitive data.
- Accessibility, offline/PWA, print packet, performance, and HSE professional/manager acceptance.

OUT OF SCOPE FOR CAMPAIGN 8

At minimum exclude:

- Automated professional exposure determinations.
- Medical diagnoses, medical test results, clinical notes, or medical fitness decisions.
- A laboratory information-management system unless explicitly approved by scope/ADR.
- Real-time instrument integrations unless explicitly approved.
- Cloud synchronization and concurrent coauthoring.
- Emergency dispatch/live response reserved for Campaign 9.
- Executive cross-site analytics reserved for Campaign 10.
- Training/LMS, broad environmental/waste/permit suites, and generic campaign expansion.

FINAL VERIFICATION

Before returning, confirm the file exists, is valid UTF-8 Markdown, contains every required section and stage subsection, records the current baseline SHA, distinguishes verified/partial/legacy behavior, contains binary acceptance criteria, preserves professional judgment boundaries, and does not modify the repository.
```

---

# 6. Prompt — Campaign 9: Emergency Response

Copy the complete prompt below.

```text
You are authoring a governing campaign document for the ADAMA HSE project.

TASK

Inspect the current `gibsondevhouse/oluso` GitHub repository and the local project context file `sources/the-repo-for-this-project.txt`. Then author one comprehensive Markdown document:

Campaign 9 — Emergency Response

This is a documentation-authoring task only. Do not implement code. Do not modify the GitHub repository, local synced sources, issues, branches, commits, pull requests, calendars, email, messaging, or external systems.

OUTPUT

Save exactly one file:

`/mnt/data/ADAMA_HSE_Campaign_9_Emergency_Response.md`

Return only a concise completion statement and a download link to that file.

REPOSITORY INSPECTION REQUIREMENTS

1. Read `sources/the-repo-for-this-project.txt` without editing it.
2. Resolve and record the current default-branch head SHA and inspection date.
3. Inspect the complete governing documentation set and accepted ADRs, especially intended use, scope boundaries, domain model, user workflows, design principles, build plan, routing, UI architecture, state management, roadmap, repository audit, feature inventory, and TODO.
4. Inspect all relevant current code/specs/tests for incidents, near misses, investigations, emergency operating condition, chemicals/SDS/inventory/use, exposure scenarios, locations, equipment, people/organizations, controls, actions, documents/evidence, offline/PWA, reports/exports, revisions, review, and exchange.
5. Inspect Campaign 6, Campaign 7, and Campaign 8 documents if available.
6. Identify whether Emergency Response is currently in scope, deferred, absent, generic, or partially represented. Do not hide a scope conflict.
7. Follow the authority order in `docs/README.md`.

MANDATORY GOVERNANCE CHECK

Emergency Response may exceed the current narrow reset scope. The campaign document must include an explicit governance analysis before proposing implementation:

- Identify each requested capability that is already authorized by the current project brief/scope.
- Identify each capability that requires a scope amendment, intended-use change, ADR, legal/HSE review, privacy review, security review, or validation plan.
- Label conflicts `[GOVERNANCE CONFLICT]` and unresolved approvals `[DECISION REQUIRED]`.
- Define a documentation/decision Phase 9A that must exit before any implementation phase.

CAMPAIGN POSITION

Campaign 9 follows Campaign 6 portal infrastructure, Campaign 7 operations/assurance workflows, and Campaign 8 industrial-hygiene context. It must reuse canonical Locations, Organizations/People, Functions, Processes, Tasks, Equipment, Chemicals/SDS/Inventory/Use, Exposure Scenarios, Controls, Incidents, Actions, Evidence, Revisions, Review, Exchange, Search, Workspaces, Activity, Context Panels, and offline behavior.

It must not duplicate those records in an emergency-only database.

CAMPAIGN OBJECTIVE

Define an offline-resilient emergency-preparedness and response-support experience that helps authorized HSE users prepare, access, record, coordinate, and review plant emergency information while preserving clear boundaries between operational support software and emergency dispatch, life-safety command systems, medical records, legal determinations, or public warning systems.

REQUIRED CAMPAIGN COVERAGE

At minimum address:

1. Governance, intended use, authority, disclaimers, validation class, and failure-mode boundaries.
2. Emergency preparedness workspace by Site/Location and scenario.
3. Emergency plans/procedures as controlled references with owner, version, effective date, review date, and offline availability.
4. Roles, responsibilities, call trees/contact references, alternates, and acknowledgment boundaries without silently sending messages.
5. Hazard, chemical/SDS/inventory, equipment, utility/isolation, muster/egress, and vulnerable-area context using canonical records.
6. Emergency scenario/playbook context for release, fire, spill, severe weather, medical event boundary, and other approved categories.
7. Response log/event timeline, decisions, actions, resources, and evidence with actor/time attribution.
8. Accountability/muster support only if authorized, with privacy, freshness, manual verification, and failure-mode requirements.
9. Drills/exercises, findings, corrective actions, verification, and plan revision.
10. After-action review, incident linkage, exposure/reassessment triggers, printable/offline packets, and recovery testing.

Use 9–12 numbered Stages. Reorganize only when governance or repository dependencies justify it.

NON-NEGOTIABLE SAFETY BOUNDARIES

- ADAMA HSE must not be described as a replacement for 911, fire alarm, mass-notification, radio, plant control, SCADA, access-control, or certified emergency command systems unless a future formally approved intended-use program says otherwise.
- Do not design automatic emergency dispatch, public alerts, automated evacuation orders, autonomous incident command, real-time responder tracking, or safety PLC/control actions in this campaign.
- Do not store clinical medical data, diagnoses, treatment notes, or protected medical details.
- Contact/person data must follow minimization, access, export, backup, and retention decisions explicitly approved for the local-only model.
- Offline availability must include freshness/last-verified indicators. Cached stale plans or contact data must not appear current without warning.
- Emergency information must preserve source, version, owner, effective date, review state, and supersession history.
- A response timeline requires attributable immutable events or revisions; do not reconstruct it from `updatedAt` alone.
- Manual acknowledgment, accountability, or check-in must clearly state who/what has not been verified.
- No “all clear,” “safe,” “contained,” or equivalent conclusion may be automated from incomplete records.
- New safety-critical entities require explicit types, services, repositories, invariants, migrations, and tests; no generic campaign register expansion.

UX REQUIREMENTS

- Emergency surfaces must be calm, high-contrast, scannable, keyboard-operable, printable, and offline-capable.
- Urgent information uses text, icon, hierarchy, and color; never color alone.
- Separate Preparedness, Active Event Support, and After Action states.
- Active-event screens minimize nonessential navigation but retain explicit exit/return and source access.
- Show current Site, event status, plan version, last verified time, local write health, and offline state.
- Avoid animations and visual noise.
- Provide failure states for stale plan, missing contact, unavailable database, failed write, incomplete accountability, missing SDS, and unresolved operational context.
- Preserve Campaign 6 workspace/activity/context-panel conventions where they do not conflict with emergency-mode usability.

DATA AND ARCHITECTURE REQUIREMENTS

- Reuse canonical master data rather than duplicating people, locations, chemicals, equipment, controls, incidents, findings, or actions.
- Define proposed emergency-specific entities only after the governance gate. For each, specify identity, lifecycle, status transition, owner, versioning, revision, relationships, archive/supersession, export/exchange, and migration behavior.
- Separate a controlled plan/reference from an event instance and from an after-action review.
- Define local-only multi-installation exchange implications; do not assume real-time shared state.
- Define exactly what active-event data can be trusted on two separate laptops and how divergent event logs are reconciled, or declare multi-device active event coordination out of scope.
- Define retention and sensitive-data boundaries.
- Define print/export integrity and version markings.

REQUIRED CAMPAIGN FORMAT

Use exactly this top-level structure, adding campaign-specific subsections but omitting none:

# ADAMA HSE — Campaign 9: Emergency Response
Metadata
# 1. Authority, Naming, and Campaign Position
# 2. Executive Decision
# 3. Governance and Intended-Use Gate
# 4. Campaign Outcomes
# 5. User Jobs and Design Priorities
# 6. Inspected Baseline and Disposition
# 7. Scope
# 8. Dependencies and Entry Gates
# 9. Target Information Architecture and Route Contract
# 10. Cross-Cutting UX and Safety Standards
# 11. Data and Architecture Implications
# 12 onward. Numbered Stages
# Campaign Delivery Phases
# Documentation and Repository Path Plan
# Risks, Hazards, and Mitigations
# Testing and Validation Strategy
# Error Handling and Degraded-Mode Requirements
# Performance, Offline, and Quality Targets
# Campaign Acceptance Criteria
# Out of Scope
# Recommended Branch and Commits
# Definition of Done

Every Stage must include:

## Objective
## Problem
## Primary Repository Paths
## Required Changes / Required Experience
## Delivery Phases
## UI/UX Requirements
## Data and Persistence Requirements
## Error and Degraded-Mode Handling
## Tests / Validation Evidence
## Stage Acceptance Criteria
## Out of Scope
## Recommended Commit

EVIDENCE LABELS

Use `[VERIFIED]`, `[PARTIAL]`, `[LEGACY]`, `[ASSUMPTION]`, `[DECISION REQUIRED]`, and `[GOVERNANCE CONFLICT]`. Proposed paths, entities, routes, error types, and integrations must be labeled proposed.

TESTING AND VALIDATION REQUIREMENTS

Include:

- Governance/intended-use approval evidence.
- Domain and status-transition tests.
- Offline-first-load-after-install and offline-reload tests.
- Stale-plan/contact/SDS/inventory detection.
- Database unavailable, failed write, quota, corruption/recovery, and device-loss exercises.
- Print packet version/source checks.
- Event-log attribution and immutable history.
- Two-installation limitations and exchange/conflict tests where in scope.
- Accessibility at 200% zoom, keyboard, screen reader, reduced motion, forced colors, and print.
- Performance with representative Site plans and records.
- Tabletop exercise with HSE, operations, emergency leadership, IT/security, legal/privacy, and actual intended users as applicable.
- Explicit failure-mode and misuse-case review.

OUT OF SCOPE FOR CAMPAIGN 9

At minimum exclude unless a separate governance program explicitly authorizes them:

- 911/dispatch replacement.
- Mass-notification sending.
- Public warning or regulatory reporting submission.
- SCADA, PLC, alarm, access-control, or physical-control integration.
- Autonomous incident command or response recommendations.
- Real-time responder geolocation.
- Clinical medical records.
- Guaranteed concurrent multi-user state in the local-only architecture.
- Executive analytics reserved for Campaign 10.
- Broad environmental, training/LMS, or permit suites.

FINAL VERIFICATION

Before returning, confirm the output file exists, is valid UTF-8 Markdown, records the current baseline SHA, includes the governance/intended-use gate, labels every conflict and decision, contains every required section/stage subsection, uses binary acceptance criteria, defines degraded/offline behavior, and does not modify the repository or contact external parties.
```

---

# 7. Prompt — Campaign 10: Executive Reporting

Copy the complete prompt below.

```text
You are authoring a governing campaign document for the ADAMA HSE project.

TASK

Inspect the current `gibsondevhouse/oluso` GitHub repository and the local project context file `sources/the-repo-for-this-project.txt`. Then author one comprehensive Markdown document:

Campaign 10 — Executive Reporting

This is a documentation-authoring task only. Do not implement code. Do not modify the GitHub repository, local synced sources, issues, branches, commits, pull requests, files in connected drives, or external systems.

OUTPUT

Save exactly one file:

`/mnt/data/ADAMA_HSE_Campaign_10_Executive_Reporting.md`

Return only a concise completion statement and a download link to that file.

REPOSITORY INSPECTION REQUIREMENTS

1. Read `sources/the-repo-for-this-project.txt` without editing it.
2. Resolve and record the current default-branch head SHA and inspection date.
3. Inspect the complete governing documentation set and accepted ADRs, especially product definition, success criteria, design principles, scope boundaries, build plan, domain model, state management, reports/exports specs, review packets, dashboard/Home specs, test specs, repository audit, feature inventory, and TODO.
4. Inspect current code/tests for Home, Reports/Exports, search, review queue, data-quality findings, corrective actions, incidents, exposure workflows, revisions, source/package attribution, print/export, backup versus report boundaries, and cross-Site scope.
5. Inspect Campaigns 6–9 if available and record which measures/entities are delivered, partial, absent, or still governed by later gates.
6. Identify current report output types, derivations, filters, exports, limitations, and any generic/legacy data sources.
7. Follow the authority order in `docs/README.md`.

CAMPAIGN POSITION

Campaign 10 follows the portal, operations, industrial-hygiene, and emergency-response campaigns. It consumes their governed records and event/revision histories but must never become a separate source of truth.

Campaign 10 must not hide incomplete upstream workflows behind polished charts. Every reported measure requires a defined source population, numerator, denominator, time basis, scope, rule/version, freshness timestamp, owner, and drill-through path.

CAMPAIGN OBJECTIVE

Define a traceable executive reporting experience that helps authorized leaders understand HSE work, exposure program health, assurance/action status, data quality, and decision-relevant trends across the permitted organizational/Site scope—without presenting vanity metrics, automated professional conclusions, or unsupported compliance claims.

REQUIRED CAMPAIGN COVERAGE

At minimum address:

1. Reporting governance, audience, decisions supported, measure ownership, and approval/versioning process.
2. Executive Home/briefing experience distinct from the operational Home but using the same portal system.
3. Site/organization/time scope and cross-Site comparison rules.
4. Measure catalog with definitions, numerator, denominator, exclusions, status, target/threshold authority, freshness, and source drill-through.
5. Operations and assurance reporting: observations/inspections, findings, incidents/near misses, actions, completion, verification, closure, overdue/blocked work, and reassessment.
6. Industrial-hygiene reporting: scenario/assessment coverage, monitoring priorities, sampling status, control verification, determinations due/superseded, uncertainty/data gaps, and reassessment—without reducing professional judgment to a traffic-light score.
7. Emergency preparedness/after-action reporting only for capabilities authorized and delivered by Campaign 9.
8. Data quality, coverage, missingness, legacy/current source, and confidence/freshness presentation.
9. Drill-through, narrative context, annotations, review snapshots, printable briefing packets, and exports.
10. Historical snapshots/trends, reproducibility, access/privacy boundaries, performance, and executive acceptance.

Use 8–12 numbered Stages. Reorganize only when repository dependencies justify it.

MEASURE GOVERNANCE RULES

Every reported measure must define:

`measure ID; title; user question; decision supported; owner; source entities; source statuses; scope; time basis; numerator; denominator; exclusions; missing-data treatment; target/threshold authority; calculation rule/version; freshness; revision/snapshot behavior; drill-through route; print/export representation; known limitations`

Additional rules:

- Reports and dashboards are derived projections, never sources of truth.
- A report must not create or overwrite a professional determination, incident classification, verification, closure, or compliance state.
- Distinguish zero from missing, unknown, not applicable, not yet migrated, stale, and unavailable.
- Do not rank Sites or people without an approved decision purpose, data-quality threshold, and fairness/context review.
- Avoid league tables and composite scores unless explicitly approved and fully decomposable.
- A target, threshold, red/amber/green band, or trend interpretation requires an authoritative owner and version.
- Every aggregate drills to the included source set and explains exclusions.
- Historical reports require reproducible snapshots or versioned derivations; current-state recalculation must not be mislabeled historical.
- Protect personal, incident, and exposure information through minimization and approved audience/scope rules.
- Exports include generation time, dataset identity/revision, filters, rule versions, and limitations.

UX REQUIREMENTS

- Lead with executive questions and required decisions, not a grid of charts.
- Use the smallest useful visualization; prefer a short list or table when it communicates the result more clearly.
- Every chart has title, scope, time period, units, accessible data equivalent, source/freshness, and drill-through.
- Never rely on color alone.
- Provide narrative context and material-data-quality warnings adjacent to the measure.
- Support a concise briefing view and a deeper analysis view.
- Preserve Campaign 6 navigation, search, workspace, context-panel, activity, accessibility, and visual standards.
- Support keyboard, screen reader, 200% zoom, print, offline access to deliberately cached/snapshotted reports, and explicit stale-data behavior.
- Do not show an empty chart where a specific empty state or unavailable dependency is more accurate.

DATA AND ARCHITECTURE REQUIREMENTS

- Define a versioned reporting query/projection boundary over canonical repositories.
- Do not duplicate governed status in report-specific mutable tables.
- If snapshots are required, define identity, scope, dataset revision, source revisions, measure-rule versions, created time/actor, lifecycle, retention, and reproducibility.
- Separate operational reports, review packets, exchange packages, backups, and raw exports.
- Define cross-store query consistency and dataset-revision capture.
- Define performance indexes/projections without weakening correctness.
- Define legacy/current source labeling and migration exclusions.
- Define offline/stale snapshot behavior.
- Proposed data marts, caches, or snapshot stores require explicit architecture and migration/retention review; do not assume a cloud warehouse.

REQUIRED CAMPAIGN FORMAT

Use exactly this top-level structure, adding campaign-specific subsections but omitting none:

# ADAMA HSE — Campaign 10: Executive Reporting
Metadata
# 1. Authority, Naming, and Campaign Position
# 2. Executive Decision
# 3. Campaign Outcomes
# 4. Executive Audiences, Decisions, and Design Priorities
# 5. Inspected Baseline and Disposition
# 6. Scope
# 7. Dependencies and Entry Gates
# 8. Target Information Architecture and Route Contract
# 9. Reporting and Visualization Standards
# 10. Measure Governance Contract
# 11. Data and Architecture Implications
# 12 onward. Numbered Stages
# Campaign Delivery Phases
# Documentation and Repository Path Plan
# Risks and Mitigations
# Testing and Reconciliation Strategy
# Error, Missingness, and Staleness Requirements
# Performance and Quality Targets
# Campaign Acceptance Criteria
# Out of Scope
# Recommended Branch and Commits
# Definition of Done

Every Stage must include:

## Objective
## Problem / Executive Decision Supported
## Primary Repository Paths
## Required Changes / Required Experience
## Delivery Phases
## UI/UX and Visualization Requirements
## Data, Measure, and Persistence Requirements
## Error, Missingness, and Staleness Handling
## Tests / Reconciliation
## Stage Acceptance Criteria
## Out of Scope
## Recommended Commit

EVIDENCE LABELS

Use `[VERIFIED]`, `[PARTIAL]`, `[LEGACY]`, `[ASSUMPTION]`, `[DECISION REQUIRED]`, and `[GOVERNANCE CONFLICT]`. Proposed paths, measures, thresholds, snapshots, routes, and error types must be labeled proposed.

TESTING AND RECONCILIATION REQUIREMENTS

Include:

- Calculation unit tests for every approved measure.
- Golden-fixture expected totals and edge cases.
- Numerator/denominator, exclusion, missingness, scope, and time-zone/date-boundary tests.
- Dataset-revision and snapshot reproducibility tests.
- Drill-through reconciliation from aggregate to source records.
- Legacy/current and archived/superseded handling.
- Cross-Site scope and duplicate-identity tests.
- Export/print metadata and accessibility checks.
- Offline/stale snapshot and repository-failure behavior.
- Performance with representative record/revision counts.
- Security/privacy/access review appropriate to the local-only architecture.
- End-to-end executive briefing and manager/HSE professional reconciliation acceptance.
- Independent manual reconciliation of a representative briefing packet to source records.

OUT OF SCOPE FOR CAMPAIGN 10

At minimum exclude:

- Creating a cloud data warehouse, SaaS analytics backend, or real-time telemetry platform without a new ADR/scope change.
- Automated compliance, legal, safety, or professional exposure conclusions.
- Predictive risk scoring or worker/Site ranking without explicit separate governance.
- Clinical medical reporting.
- Data entry in charts that bypasses canonical records.
- Untraceable spreadsheets or exported reports becoming the system of record.
- Broad ESG/environmental/training metrics from deferred modules.
- Real-time emergency command/dispatch analytics.
- Decorative dashboards and unsupported corporate benchmark claims.

FINAL VERIFICATION

Before returning, confirm the output file exists, is valid UTF-8 Markdown, records the current baseline SHA, contains every required section/stage subsection, defines the full measure contract, uses binary acceptance criteria, includes reconciliation and missingness rules, distinguishes verified/partial/legacy upstream capabilities, and does not modify the repository.
```

---

# 8. Prompt-Pack Quality Checklist

Before using an authored Campaign 7–10 document for implementation planning, verify that it:

- Records the exact inspected baseline commit.
- Names the repository paths actually inspected.
- Follows the documentation authority order.
- Distinguishes product campaign numbering from build-plan phase numbering.
- Treats Campaign 6 portal patterns as shared infrastructure rather than re-authoring them.
- Classifies existing capabilities as verified, partial, legacy, absent, or conflicting.
- Uses typed workflows for safety-critical records.
- Defines migrations and unresolved-data behavior where generic/legacy records exist.
- Contains stage-level data, error, test, acceptance, and out-of-scope sections.
- Includes realistic-data HSE professional and manager acceptance.
- Preserves local-first, offline, revision, attribution, and exchange boundaries.
- Avoids unsupported compliance, medical, legal, emergency-command, or professional-judgment claims.
- Contains a usable sequence of branches/commits without authorizing implementation.
- Ends with a Definition of Done that requires evidence, not visual completion.
