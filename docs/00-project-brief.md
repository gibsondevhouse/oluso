# 00 — ADAMA HSE product brief

Status: Governing
Last updated: 2026-07-18
Legacy repository/product name: OLUSO

## Product definition

ADAMA HSE is a local-only, web-first HSE and occupational-health application. It is designed for an HSE professional and an HSE manager who work on separate corporate laptops, retain separate local datasets, and exchange review packages manually through OneDrive.

The application is not a shared cloud database. It must remain useful without network access after its first load.

## Core problem

The immediate operational problem is incomplete and fragmented knowledge about:

- Where work occurs.
- Which processes and tasks occur there.
- Which equipment and chemical products are involved.
- Which workers form similar exposure groups.
- Which exposure scenarios exist under routine, non-routine, upset, and cleanup conditions.
- Which controls apply and how reliable they are.
- Which evidence supports a professional exposure determination.
- Which monitoring, actions, verification, and reassessment remain due.

ADAMA HSE turns that knowledge into one traceable workflow:

```text
Location → Process → Task → SEG → Exposure Scenario
  → Exposure Assessment → Determination → Monitoring
  → Controls → Actions → Reassessment
```

## Intended users and collaboration model

The initial operating group is:

- The HSE professional who captures baseline and occupational-health data.
- The HSE manager who reviews, comments on, and revises records.

Each installation has an explicit installation identity and each user action has an explicit user identity. Collaboration occurs through versioned exchange packages with dry-run previews, attribution, conflict resolution, and import history.

OneDrive is only a manual file-transfer channel. The product does not silently monitor, synchronize, or merge a OneDrive folder.

## Product thesis

The governing domain object is the exposure scenario, not a generic hazard, SEG, sample, or register row.

An assessment must state who is exposed, where and during what work, to which agent, under which operating condition, through which routes, for how long and how often, with which controls, and with what evidence and uncertainty.

Professional determinations remain explicit and reviewable. Calculated comparisons may support them but must not masquerade as professional judgment.

## Target architecture

```text
SvelteKit SPA/PWA
  → typed application/domain services
  → repository contracts
  → versioned IndexedDB database
  → JSON backups and exchange packages
  → user-controlled OneDrive transfer
```

The target has one persistence implementation. Tauri/Rust and browser `localStorage` are migration sources, not parallel production architectures.

## Initial product scope

### Foundation

- Organizations and people.
- Hierarchical locations from Country through Site and operational areas.
- Processes, tasks, and equipment.
- Chemical substances, products, SDS revisions, site inventory, and chemical use.
- Exposure agents, exposure limits, controls, and document references.

### Industrial hygiene

- SEGs and effective-dated memberships.
- Exposure scenarios.
- Qualitative assessments, uncertainty, confidence, and data gaps.
- Monitoring priorities and sampling plans.
- Sampling events, samples, laboratory results, limit comparisons, interpretations, and determinations.
- Control verification, program applicability, surveillance requirements, and reassessment.

### Governance and collaboration

- Immutable record revisions.
- Reviews, approvals, notes, data-quality findings, and evidence references.
- Versioned exchange packages, tombstones, import dry-runs, conflict resolution, attribution, and rollback.

### Assurance

- Observations, inspections, findings, incidents, investigations, corrective actions, and verification when linked to the operational/exposure model.

## Immediate field experience

The application must support a unit walkthrough without forcing the user to navigate across many disconnected registers. A baseline workflow should capture location, process, task, equipment, chemical use, worker/SEG, exposure scenarios, controls, evidence, and data gaps in context.

The dashboard should show baseline completeness by site or unit, including missing exposure scenarios, controls, monitoring history, and reassessment schedules.

## Explicit non-goals for the reset

- Real-time collaboration or automatic cloud sync.
- A SaaS backend, multi-tenant platform, or enterprise identity system.
- Full training/LMS behavior.
- Complex MOC/PSSR, environmental, waste, permit, or compliance-calendar suites.
- Clinical medical information or medical diagnosis.
- Automated legal conclusions or automated professional determinations.
- Unmanaged document storage or a full document-management system.
- Maintaining Tauri and web production architectures in parallel.

Deferred modules may remain in the repository behind a Future Modules boundary, but they must not drive architecture or receive polish before the core workflow is complete.

## Success criteria

ADAMA HSE is ready for operational use when:

- Tifton and Ocilla can be represented through a valid Country → State/Region → Site hierarchy without workarounds.
- A chemical product can be used at multiple sites without duplicating its identity, and multiple SDS and exposure-limit revisions remain historically visible.
- An HSE professional can complete the governing workflow from site baseline through reassessment.
- The manager can review a package, add notes, return changes, and exchange subsequent packages without silent data loss.
- Every applied change is attributable to a user, installation, revision, and exchange package where applicable.
- Conflicts and invalid packages are visible before any local mutation.
- The browser database survives restarts, supports verified migrations and backups, and reports failed writes visibly.
- The app works offline after first load on supported corporate browsers.
- A review packet can explain what work occurs, who may be exposed, what supports the determination, and what must happen next.

## Product risks

- Treating implemented pages as proof of domain completeness.
- Retaining generic records for safety-critical workflows.
- Conflating backup, bulk import, and collaborative exchange.
- Applying monitoring comparisons without compatible basis, duration, and units.
- Losing changes during separate-laptop review.
- Removing legacy persistence before data conversion and rollback are proven.
- Re-expanding deferred modules before the industrial-hygiene spine is accepted.

This brief supersedes desktop-first and single-user statements in earlier OLUSO documents.
