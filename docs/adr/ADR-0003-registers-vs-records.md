# ADR-0003 — Registers vs Records

Project: OLUSO  
Status: Accepted  
Last Updated: 2026-07-06  
Decision Owner: Product / Architecture  
Related Documents: 02-information-architecture, 04-domain-model, 05-user-workflows, 08-scope-boundaries, 09-routing, 11-state-management, 12-future-roadmap

---

## 1. Purpose

This Architecture Decision Record defines the difference between registers and records in OLUSO.

The purpose of this document is to prevent OLUSO from becoming a spreadsheet wrapper, generic note system, document dump, or AI-generated summary tool with weak source-of-truth boundaries.

OLUSO must preserve durable, structured HSE records. Registers exist to organize and navigate those records. Reports, dashboards, evidence, files, and AI outputs may support the work, but they must not replace the underlying source records.

---

## 2. Decision Summary

OLUSO will distinguish between registers, records, reference data, evidence, reports, and workflow state.

Registers are navigable indexes of durable records.

Records are the source objects preserved by local persistence.

Reference data supports structured entry.

Evidence supports records but does not replace them.

Reports and dashboards are derived views.

Workflow state describes lifecycle, not record identity.

No feature may introduce a new data object without classifying it into one of these categories.

---

## 3. Context

OLUSO is a local-first desktop HSE application for structured operational, environmental, chemical safety, industrial hygiene, field-work, corrective action, and compliance-supporting information.

The application depends on clean source-of-truth boundaries. If those boundaries are weak, the app will drift into unclear tables, duplicated records, broken relationships, unreliable reports, and AI-generated text that users mistake for verified record data.

HSE work needs durable records that can be inspected, linked, corrected, exported, and defended later. A table view is not enough. A note is not enough. A PDF is not enough. A generated summary is not enough.

The system must know what each object is and what level of authority it carries.

---

## 4. Decision

OLUSO will model operational information using durable records exposed through registers.

A register is the primary navigational surface for a set of records.

A record is the durable source object.

A report is a derived view from one or more records.

Evidence is supporting material associated with a record.

Reference data is controlled supporting vocabulary, classification, or lookup data.

Workflow state describes where a record is in its lifecycle.

The application must not blur these categories.

---

## 5. Core Definitions

### 5.1 Register

A register is a structured list, table, or index of records within a domain.

A register helps the user find, sort, filter, review, create, and open records.

Examples include:

- Chemical Inventory Register.
- Process Register.
- Location Register.
- Hazard Register.
- SEG Register.
- Field Finding Register.
- Corrective Action Register.

A register is not the source object itself. It is a view over source records.

### 5.2 Record

A record is a durable source object stored in local persistence.

A record has identity, type, status, metadata, relationships, validation rules, and lifecycle behavior.

Examples include:

- One chemical.
- One process.
- One location.
- One hazard.
- One similar exposure group.
- One field finding.
- One corrective action.
- One exposure assessment.
- One inspection event.

A record is the object OLUSO exists to preserve.

### 5.3 Reference Data

Reference data is controlled supporting information used to structure records.

Examples include:

- Units of measure.
- PPE categories.
- Hazard classes.
- Physical states.
- Control types.
- Exposure routes.
- Status options.
- Regulatory citation labels.

Reference data supports record creation and classification. It should not automatically become a top-level page or register.

### 5.4 Evidence

Evidence is supporting material attached to, linked to, or associated with a record.

Examples include:

- SDS files.
- Photos.
- Inspection notes.
- Exposure sample results.
- PDFs.
- Field observations.
- Email exports.
- Corrective action proof photos.

Evidence supports a record. It does not replace the record.

### 5.5 Report

A report is a generated or assembled view based on one or more records.

Examples include:

- Open corrective actions report.
- Chemical inventory export.
- Hazard summary.
- SEG exposure overview.
- Audit packet.
- Location risk profile.
- Overdue action report.

Reports are derived views. They are not source truth unless the system explicitly stores them as immutable export artifacts with source record references and generation metadata.

### 5.6 Workflow State

Workflow state describes where a record is in its lifecycle.

Examples include:

- Draft.
- Active.
- Under review.
- Verified.
- Closed.
- Archived.
- Superseded.

Workflow state does not define what the object is. It defines the condition or lifecycle position of the object.

---

## 6. Register Rules

Every register must have:

- A domain owner.
- A stable route.
- A clear title.
- A defined record type.
- A create action, if creation is in scope.
- A detail route for opening individual records.
- Search or filter behavior appropriate to the domain.
- Status visibility when status matters.
- Empty state.
- Loading state.
- Error state.
- Archived or inactive record behavior.

A register must not exist merely because a table would be convenient.

If a register cannot identify the durable record type it exposes, it should not be created.

---

## 7. Record Rules

Every durable record type must define:

- Record ID.
- Record type.
- Name or title field.
- Required fields.
- Optional fields.
- Status model.
- Created timestamp.
- Updated timestamp.
- Archive behavior.
- Delete behavior, if deletion is allowed.
- Validation rules.
- Domain owner.
- Relationship rules.
- Evidence or attachment policy, if applicable.
- Export role, if applicable.

Records must be persisted through the local data layer.

A route, UI component, cache, generated report, imported file, or AI context window must not be treated as the durable source of truth.

---

## 8. Relationship Rules

OLUSO records may link to other records where the relationship has operational meaning.

Examples:

- A chemical may link to a process.
- A process may link to a location.
- A hazard may link to a process or location.
- A SEG may link to a process, location, task, or exposure agent.
- A field finding may create or link to a corrective action.
- A corrective action may link back to its source finding.

Relationships must be explicit.

The app should not rely on hidden text references, loose tags, or AI inference as the primary relationship model.

---

## 9. Source-of-Truth Rules

The following are source truth only when stored as durable records in local persistence:

- Chemical records.
- Location records.
- Process records.
- Hazard records.
- SEG records.
- Field findings.
- Corrective actions.
- Exposure assessment records.
- Inspection records.

The following are not source truth by default:

- Register rows.
- Dashboard cards.
- Reports.
- Exports.
- Imported PDFs.
- SDS attachments.
- Photos.
- AI summaries.
- Chat output.
- Temporary form state.
- Cached views.
- Search results.

A user may rely on a report operationally, but the report must be traceable back to source records.

---

## 10. Evidence Rules

Evidence must be attached to or associated with a durable record.

Evidence should not float loose in the application without ownership.

Before attachment-heavy workflows are built, the implementation must define whether evidence files are:

- Copied into an app-controlled local storage area.
- Referenced by file path.
- Both copied and referenced.
- Stored as metadata only.

Broken evidence links must be visible to the user.

Evidence should include enough metadata to support later review where practical:

- Evidence type.
- Related record ID.
- File name or source label.
- Added date.
- Description or note.
- Origin, if known.

---

## 11. Report Rules

Reports and dashboards are projections from source records.

A report may summarize, filter, group, export, or package record data.

Reports must not become editable source objects unless a later ADR explicitly defines a report-as-record pattern.

Generated exports should include:

- Export title.
- Export date.
- Source record scope.
- Applied filters, if applicable.
- Version or generation context, if available.

If the underlying record changes, the generated report should be treated as a snapshot or regenerated projection, not as a competing truth source.

---

## 12. Workflow State Rules

Workflow states must be deliberate and domain-appropriate.

The app must not reuse one generic status model across all record types unless the meaning is truly shared.

For example:

- A chemical status may describe inventory or use status.
- A corrective action status may describe completion and verification.
- A field finding status may describe review and disposition.
- A location status may describe active, inactive, archived, or superseded state.

Status labels must not imply legal or compliance conclusions unless the product explicitly supports that meaning.

---

## 13. AI Boundary

AI may assist later with drafting, summarizing, classifying, suggesting relationships, or preparing exports.

AI must not silently create, modify, close, verify, archive, or delete records.

AI output is not source truth.

If AI-generated content is used, the user must explicitly review and commit it into a durable record through a controlled workflow.

AI-assisted fields should preserve enough context to distinguish user-entered information from generated assistance where practical.

---

## 14. Sidebar and Routing Implications

Registers may justify sidebar placement when they represent important top-level domains.

Individual records should be reached through register, detail, create, and edit routes.

Reference lists should not automatically become sidebar items.

Reports should not replace registers.

Evidence libraries should not become the main navigation model unless a later ADR changes the product direction.

A user should always know:

- What register they are in.
- What record they are viewing.
- What domain owns the record.
- What status the record has.
- How the record relates to other records.
- How to return to the parent register.

---

## 15. Explicit Non-Goals

This ADR does not define the full database schema.

This ADR does not define every table, column, index, or migration.

This ADR does not define the final UI for every register.

This ADR does not create a generic block/page model.

This ADR does not authorize a Notion-style object system.

This ADR does not authorize spreadsheet-like loose rows without record identity.

This ADR does not make reports editable source truth.

This ADR does not make AI output authoritative.

This ADR does not make documents or attachments the primary operating model.

---

## 16. Consequences

### 16.1 Benefits

This decision gives OLUSO:

- Clear source-of-truth boundaries.
- Cleaner routing.
- More predictable persistence.
- Better auditability.
- Better export traceability.
- Better page-spec discipline.
- Lower risk of feature bloat.
- Stronger distinction between operational records and supporting materials.

### 16.2 Tradeoffs

This decision also creates obligations:

- New data types require classification.
- New pages require stronger justification.
- Status models must be defined per domain.
- Relationships must be modeled explicitly.
- Reports must trace back to records.
- Attachments require ownership and metadata.
- AI features need commit boundaries.

### 16.3 Risks

| Risk | Severity | Mitigation |
|---|---:|---|
| Register and record concepts blur during implementation | High | Require every page spec to classify its data object |
| Reports become competing source truth | High | Treat reports as projections or immutable snapshots with source metadata |
| Attachments replace structured records | High | Require evidence ownership by a durable record |
| Reference data bloats sidebar navigation | Medium | Keep reference data behind picklists/configuration unless justified |
| Generic statuses create false meaning | Medium | Define lifecycle states per record type |
| AI-generated text is mistaken for verified data | Medium | Require explicit user review and commit |
| Schema design gets over-specified too early | Low | Keep schema details in implementation specs, not this ADR |

---

## 17. Implementation Requirements

Future page specs, component specs, and data-model work must answer the following questions for every new object:

1. Is this a register, record, reference item, evidence item, report, or workflow state?
2. What domain owns it?
3. Is it durable or temporary?
4. Does it need a register route?
5. Does it need a detail route?
6. Does it need create/edit routes?
7. What fields are required?
8. What status model applies?
9. Can it be archived?
10. Can it be deleted?
11. What other records can it link to?
12. Can evidence attach to it?
13. Can it appear in reports?
14. Can it be exported?
15. Can AI assist with it, and if so, where is the user commit boundary?

If those questions cannot be answered, the object is not ready for implementation.

---

## 18. Verification Checklist

Before implementation of a new domain area proceeds, verify:

- [ ] The primary register is identified.
- [ ] The durable record type is identified.
- [ ] The record owner/domain is identified.
- [ ] Required fields are known.
- [ ] Status model is defined or intentionally deferred.
- [ ] Archive behavior is defined.
- [ ] Delete behavior is defined or explicitly blocked.
- [ ] Relationship rules are defined.
- [ ] Evidence policy is defined if attachments are involved.
- [ ] Reports are treated as derived views.
- [ ] AI cannot silently mutate the record.
- [ ] The route model matches the register/record distinction.

---

## 19. Acceptance Criteria

This ADR is accepted when:

1. OLUSO treats registers as navigational indexes of records.
2. OLUSO treats records as durable source objects.
3. Reports, dashboards, exports, and summaries are treated as derived views unless explicitly modeled otherwise.
4. Evidence supports records but does not replace them.
5. Reference data does not automatically become sidebar navigation.
6. Workflow state is defined per domain where needed.
7. Future features must classify their data object before implementation.
8. AI output cannot become authoritative without explicit user commit.

---

## 20. Final Decision Statement

OLUSO will use registers to expose and navigate durable records.

Records are the source truth. Registers, reports, dashboards, exports, evidence, and AI outputs support those records but do not replace them.

Every future data object must be classified before implementation so OLUSO remains structured, defensible, maintainable, and field-usable.

