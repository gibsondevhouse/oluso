# ADR-0002 — Navigation Structure

Project: OLUSO  
Status: Accepted  
Last Updated: 2026-07-06  
Decision Owner: Product / Architecture  
Related Documents: 02-information-architecture, 03-sidebar-navigation, 04-domain-model, 08-scope-boundaries, 09-routing, ADR-0001-local-first, ADR-0003-registers-vs-records

---

## 1. Purpose

This Architecture Decision Record defines OLUSO’s navigation structure decision.

The purpose of this document is to lock the application’s primary navigation model before implementation begins. Navigation must reflect the product structure, not decorative preference. OLUSO must remain a focused, local-first desktop HSE workspace with stable domain navigation, register-first workflows, and clear movement between registers, records, reports, and system surfaces.

This ADR prevents navigation drift, sidebar bloat, route sprawl, duplicate pages, unclear ownership, and agent-generated UI fragments.

---

## 2. Decision Summary

OLUSO will use a persistent left sidebar as the primary desktop navigation surface.

Navigation will be domain-aligned, register-first, stable, and conservative.

Top-level sidebar items must represent major product areas, not every route, object, reference list, report, or tool.

Registers may appear in the sidebar when they represent important domain entry points. Detail, create, edit, system, and recovery routes should not appear as primary sidebar items.

The sidebar must help the user answer:

- Where am I?
- What domain owns this page?
- What register or record am I working with?
- How do I return to the parent register?
- What is available in the MVP versus deferred?

---

## 3. Context

OLUSO is being designed as a local-first desktop application for structured HSE, environmental, chemical safety, industrial hygiene, field-work, corrective action, and compliance-supporting information.

The application already depends on durable registers, linked records, stable routing, and controlled scope boundaries. Navigation is the visible expression of those decisions.

A weak navigation model would create confused page ownership, duplicate routes, sidebar clutter, weak deep-linking, hidden record identity, poor active-state behavior, broken breadcrumbs, unclear implementation tasks, and pressure to add pages before the data model is ready.

Navigation must be boring, stable, readable, and domain-aligned.

---

## 4. Decision

OLUSO will use a persistent desktop sidebar with grouped navigation sections.

The primary navigation model will be:

1. Dashboard / Home.
2. Operations.
3. HSE Registers.
4. Field Work.
5. Actions.
6. Reports / Exports.
7. System / Settings.

This structure may be refined by implementation specs, but the model must remain narrow and register-first.

Sidebar placement requires justification. A feature does not receive sidebar placement merely because it exists.

---

## 5. Navigation Principles

### 5.1 Navigation must express product structure

Routes and sidebar items must map to actual product domains.

Navigation must not be a dumping ground for miscellaneous tools, settings, reports, imports, reference lists, or AI surfaces.

### 5.2 Register-first workflows

Core domain navigation should take users to registers first.

Users should generally move from:

Register → Record Detail → Edit/Create → Return to Register

Modal-only navigation is not acceptable for core records in the MVP.

### 5.3 Stable routes over clever routes

Route names should be boring, predictable, and durable.

Do not use decorative, brand-heavy, abbreviated, or clever route names for core HSE areas.

### 5.4 Sidebar discipline

The sidebar should remain compact enough that users can understand the product at a glance.

Reference lists, one-off reports, settings panels, and detail pages should not become primary sidebar items by default.

### 5.5 Visible ownership

The user should always know which domain owns the current page or record.

A record detail page should make clear whether it belongs to chemicals, operations, hazards, SEGs, findings, actions, or another defined domain.

### 5.6 No fake availability

Navigation must not imply a feature is ready when it is not implemented.

Deferred items may appear only if the UI clearly marks them as unavailable, coming later, or intentionally disabled. For MVP, avoid showing deferred features unless there is a strong product reason.

---

## 6. Primary Sidebar Structure

The recommended MVP sidebar structure is:

```text
OLUSO
├── Dashboard
├── Operations
│   ├── Locations
│   └── Processes
├── HSE Registers
│   ├── Chemicals
│   ├── Hazards
│   └── SEGs
├── Field Work
│   └── Findings
├── Actions
│   └── Corrective Actions
├── Reports
│   └── Exports
└── System
    └── Settings
```

This structure should be treated as the baseline. It may be adjusted only through page specs or later ADRs.

---

## 7. Sidebar Section Rules

### 7.1 Dashboard

Dashboard is the entry surface.

It should summarize current work without becoming a cluttered command center.

Dashboard may show recent records, open corrective actions, draft records, high-priority findings, and basic system status.

Dashboard should not become the primary source of truth.

### 7.2 Operations

Operations contains physical and process context.

MVP entries:

- Locations.
- Processes.

Operations should come before HSE registers because many HSE records attach to place, process, task, or operational context.

### 7.3 HSE Registers

HSE Registers contains structured HSE domain registers.

MVP entries:

- Chemicals.
- Hazards.
- SEGs.

This section is the core HSE backbone.

### 7.4 Field Work

Field Work contains field-originated observations and findings.

MVP entry:

- Findings.

Field Work should not become a generic notes area.

### 7.5 Actions

Actions contains tracked corrective or follow-up work.

MVP entry:

- Corrective Actions.

Corrective actions are core because findings must be able to move toward verified closure.

### 7.6 Reports

Reports contains derived outputs, exports, summaries, and audit-supporting views.

MVP entry:

- Exports.

Reports must remain derived from records. Reports should not replace registers.

### 7.7 System

System contains application-level configuration and maintenance surfaces.

MVP entry:

- Settings.

Future entries may include backup, restore, data recovery, import/export settings, and diagnostics, but those should not be promoted prematurely.

---

## 8. Route Type Rules

OLUSO will recognize the following route types:

| Route Type | Purpose | Sidebar Visible |
|---|---|---:|
| Landing | Entry point for app or section | Sometimes |
| Register | List/table view of durable records | Yes, when domain-important |
| Detail | View one durable record | No |
| Create | Create a new durable record | No |
| Edit | Edit one durable record | No |
| Report | Derived view or export surface | Sometimes |
| System | Settings, recovery, diagnostics | Sometimes |
| Error | Not-found or failure handling | No |
| Recovery | Local data recovery or repair surface | No, unless mature |

A route may exist without sidebar placement.

Sidebar visibility must be explicitly decided.

---

## 9. Baseline Route Map

The recommended MVP route map is:

```text
/
/dashboard

/operations/locations
/operations/locations/new
/operations/locations/:locationId
/operations/locations/:locationId/edit

/operations/processes
/operations/processes/new
/operations/processes/:processId
/operations/processes/:processId/edit

/hse/chemicals
/hse/chemicals/new
/hse/chemicals/:chemicalId
/hse/chemicals/:chemicalId/edit

/hse/hazards
/hse/hazards/new
/hse/hazards/:hazardId
/hse/hazards/:hazardId/edit

/hse/segs
/hse/segs/new
/hse/segs/:segId
/hse/segs/:segId/edit

/field/findings
/field/findings/new
/field/findings/:findingId
/field/findings/:findingId/edit

/actions/corrective-actions
/actions/corrective-actions/new
/actions/corrective-actions/:actionId
/actions/corrective-actions/:actionId/edit

/reports/exports

/system/settings
/system/data-recovery

/not-found
/record-not-found
/error
```

This map is not a database schema. It is a navigation and route contract.

---

## 10. Active State Rules

Sidebar active state must be derived from the current route.

When viewing a detail, create, or edit route, the parent register item should remain active.

Examples:

- `/hse/chemicals/:chemicalId` activates `Chemicals`.
- `/hse/chemicals/:chemicalId/edit` activates `Chemicals`.
- `/operations/locations/new` activates `Locations`.
- `/actions/corrective-actions/:actionId` activates `Corrective Actions`.

The active state must not depend on page-local component state.

---

## 11. Breadcrumb Rules

Record detail, create, and edit pages should provide breadcrumb or equivalent parent navigation.

Example:

```text
HSE Registers / Chemicals / Acetone
```

Breadcrumbs should help the user return to the parent register and understand domain ownership.

Breadcrumbs should not become an alternate global navigation system.

---

## 12. Create and Edit Route Rules

Create and edit routes must be distinct from detail routes.

Create routes must not pretend to have a persisted record ID before save.

Edit routes must handle:

- Missing records.
- Archived records.
- Deleted records.
- Invalid record IDs.
- Validation failures.
- Save failures.
- Unsaved changes.

Navigation away from dirty forms must trigger protection against accidental loss.

---

## 13. Detail Route Rules

Detail routes must load records by route ID.

Detail pages must handle:

- Loading state.
- Missing record state.
- Archived or inactive record state.
- Relationship loading.
- Evidence loading, if applicable.
- Open action summary, if applicable.
- Error state.
- Safe archive/delete behavior when in scope.

Detail routes should not be modal-only for core MVP records.

---

## 14. Relationship Navigation

OLUSO must support movement between related records.

Examples:

- Chemical to linked process.
- Process to linked location.
- Hazard to linked process or location.
- SEG to related process, task, or exposure agent.
- Finding to corrective action.
- Corrective action to source finding.

Relationship navigation should be explicit and visible. It should not rely on hidden text links, inferred references, or AI-only suggestions.

---

## 15. Deferred Navigation

The following should not be primary MVP navigation unless a later decision changes scope:

- AI assistant.
- Regulatory library.
- Compliance calendar.
- Training system.
- Incident management suite.
- Contractor management.
- Permit management.
- Enterprise admin.
- User accounts.
- Cloud sync.
- Mobile views.
- Audit portal.
- Document library as a primary section.

These areas may be useful later, but they would distort the MVP navigation before the core record backbone is proven.

---

## 16. Non-Goals

This ADR does not define final visual styling.

This ADR does not define icons.

This ADR does not define component-level sidebar implementation.

This ADR does not define database schema.

This ADR does not authorize every listed future route for MVP implementation.

This ADR does not replace page specs.

This ADR does not replace `sidepanel-specs.md`.

This ADR does not make navigation dynamic, role-based, user-personalized, or cloud-configured for MVP.

---

## 17. Implementation Requirements

Every new route must define:

1. Route path.
2. Route type.
3. Domain owner.
4. Sidebar visibility.
5. Parent sidebar item.
6. Record type, if applicable.
7. Required route parameters.
8. Loading behavior.
9. Empty state, if applicable.
10. Error state.
11. Missing-record behavior, if applicable.
12. Unsaved-change behavior, if applicable.
13. Breadcrumb behavior.
14. Test or verification criteria.

If these cannot be defined, the route is not ready for implementation.

---

## 18. Severity-Rated Risks

| Risk | Severity | Mitigation |
|---|---:|---|
| Sidebar becomes a dumping ground | High | Require sidebar justification for every item |
| Detail pages appear as primary nav | High | Keep detail, create, and edit routes out of sidebar |
| Reports replace registers | High | Keep reports derived and route them separately |
| Reference data clutters navigation | Medium | Keep reference data behind forms or settings unless justified |
| Deferred features appear available | Medium | Do not expose unavailable routes without clear disabled state |
| Active state breaks on nested routes | Medium | Derive active state from route hierarchy |
| Navigation becomes brand-clever instead of operational | Low | Use boring domain labels |

---

## 19. Verification Checklist

Before sidebar or component implementation proceeds, verify:

- [ ] Primary sidebar sections are defined.
- [ ] MVP sidebar items are defined.
- [ ] Deferred sidebar items are excluded or clearly disabled.
- [ ] Route map is documented.
- [ ] Every sidebar item maps to a route.
- [ ] Every detail route maps back to a parent register.
- [ ] Active state behavior is defined for nested routes.
- [ ] Breadcrumb behavior is defined for record pages.
- [ ] Create routes avoid fake persisted IDs.
- [ ] Edit routes handle unsaved changes.
- [ ] Missing-record and not-found routes exist.
- [ ] Reports remain derived views.
- [ ] Reference data does not become sidebar clutter.

---

## 20. Acceptance Criteria

This ADR is accepted when:

1. OLUSO uses a persistent left sidebar for primary desktop navigation.
2. Sidebar navigation is grouped by domain and workflow purpose.
3. Core navigation is register-first.
4. Detail, create, and edit routes do not appear as primary sidebar items.
5. Active state maps nested routes back to their parent register.
6. Breadcrumb or parent navigation exists for record pages.
7. Deferred features are not presented as ready MVP surfaces.
8. Future routes must define ownership, route type, sidebar visibility, and error behavior before implementation.

---

## 21. Final Decision Statement

OLUSO will use boring, stable, domain-aligned desktop navigation.

The primary sidebar will expose major registers and workflow areas, not every route or object. Core work will flow from registers to records and back again. Navigation must reinforce OLUSO’s local-first, register-first, source-of-truth architecture and prevent the MVP from expanding into a cluttered enterprise platform.

