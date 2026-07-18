# ADR-0003 — Registers, records, and typed workflows

Status: Accepted, amended
Amended: 2026-07-18

## Decision retained

- Registers are searchable/navigation projections over durable records.
- Durable records are the local source of truth.
- Reference data supports controlled entry.
- Evidence supports records but does not replace them.
- Reports, dashboards, search indexes, and exports are derived.

## Amendment

Metadata-driven generic records are limited to low-risk reference/lookup entities. Operationally significant entities use explicit types, validation schemas, domain services, repository contracts, cross-record invariants, immutable revisions, and migration/exchange tests.

Generic records are prohibited for exposure scenarios/assessments/determinations/monitoring, SEG membership, normalized chemical models, actions/verification, and governance/exchange entities.

## Consequences

- A working generic CRUD page does not establish domain completeness.
- Guided baseline/assessment workspaces may compose many records but cannot persist one catch-all workflow blob.
- Existing generic campaign records are migration sources requiring mapping and data-quality review.
- Source identity/revision remains visible in derived views.

Detailed boundary: [04-domain-model.md](../04-domain-model.md).
