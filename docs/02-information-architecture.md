# 02 — Information architecture

Status: Governing
Last updated: 2026-07-18

## Organizing principle

ADAMA HSE is organized around the lifecycle of operational and occupational-health knowledge, not around every database table.

The primary mental model is:

```text
Establish context
  → Characterize exposure
  → Gather evidence
  → Make and review a determination
  → Act and verify
  → Reassess
```

Registers remain valuable as searchable indexes, but they are secondary to the governing workflow.

## Primary product areas

### Dashboard

Site/unit baseline completeness, overdue workflow steps, review packages requiring attention, conflicts, data-quality findings, control verification, and reassessment due.

### Baseline

Locations, processes, tasks, equipment, chemical uses, people/SEG context, controls, notes, and evidence captured through a unit-oriented workflow.

### Master data

Organizations, people, canonical locations, equipment, chemical substances/products, SDS revisions, exposure agents/limits, controls, and document references.

### Industrial hygiene

SEGs, memberships, exposure scenarios, assessments, monitoring priorities, sampling plans/events/samples/results, interpretations, determinations, program applicability, control verification, and reassessment.

### Assurance

Observations, inspections, findings, incidents, investigations, corrective actions, verification, and evidence linked back to the operational/exposure context.

### Review exchange

Package export, import dry-run, classification, conflict resolution, review notes, import history, rollback, and dataset/installation identity.

### Reports

Review packets and derived views. Reports never become the source of truth.

### Settings and diagnostics

User/installation identity, dataset identity, storage availability and quota, schema version, backup status, offline/PWA state, and browser compatibility.

### Future modules

Training, MOC/PSSR, environmental, waste, broad permit/compliance, and transition/migration campaign interfaces remain explicitly separated until reactivated.

## Context hierarchy

The operational hierarchy is:

```text
Country
  → State/Region
  → Site
  → Building / Unit / Zone / Storage Area / Outdoor Area / Mobile Area
  → Subzone / Room where applicable
```

Processes occur at operational locations. Tasks belong to processes but may have more specific locations and operating conditions. Equipment and chemical use connect to the process/task context.

## Occupational-health hierarchy

```text
Person ↔ effective-dated SEG membership
SEG + location + process + task + agent + condition
  → Exposure Scenario
  → Exposure Assessment
  → Exposure Determination
  → Monitoring and control follow-up
```

A SEG is a worker-group definition. It is not a generic hazard grouping and must not absorb scenario-specific conditions.

## Information-state conventions

The interface must distinguish:

- Missing — expected information has not been entered.
- Unknown — the user has considered the field but does not know the value.
- Not applicable — the field does not apply with a recorded reason where material.
- Draft — useful but not review-ready.
- Under review — submitted for review.
- Accepted/approved — explicitly reviewed under the domain rules.
- Superseded — historically valid but no longer current.
- Archived — inactive but historically retained.
- Conflicting — local and external revisions require resolution.

## Navigation rules

- The workflow owns top-level navigation; individual supporting tables do not automatically receive sidebar items.
- Durable records have stable detail routes and visible history.
- Context should carry forward through the baseline and assessment workflow.
- A user should be able to reach source records from any derived dashboard, report, or comparison.
- Archived dependencies remain resolvable and visibly inactive.
- Future modules do not contribute primary dashboard counts or navigation clutter.
