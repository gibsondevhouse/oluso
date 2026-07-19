# Locations page specification

Status: Governing target
Active canonical route: `/operations/locations`
Last updated: 2026-07-18

## Purpose

Create and maintain the governed geographic/operational hierarchy used by every Site-scoped record.

## Node types

```text
Country
StateOrRegion
Site
Building
Unit
Zone
Subzone
Room
StorageArea
OutdoorArea
MobileArea
```

## Interface

- Hierarchy tree with search and active/archive indicators.
- Selected-node detail with ancestors and resolved Site.
- Add child action limited to valid child types.
- Reparent preview showing descendant/reference impact.
- Related processes, tasks, equipment, inventory, scenarios, assurance records, and gaps.
- Record history and package attribution.

## Form fields

- Business ID/code.
- Name.
- Node type.
- Parent.
- Description and optional address/coordinates/reference fields appropriate to type.
- Status and review metadata.

Country/state are nodes, not duplicated free-text fields on every operational location.

## Validation

- Country has no parent.
- StateOrRegion parent is Country.
- Site parent is StateOrRegion.
- Other operational types follow configured compatible-parent rules and resolve to Site.
- Cycles/self-parenting are prohibited.
- Reparent cannot move a node into its descendant.
- Archive/reparent shows impacted active descendants and references before confirmation.

## Acceptance criteria

- Tifton and Ocilla can be represented without root-Facility workarounds.
- Every operational node resolves to one Site.
- Invalid hierarchies are rejected in domain services and repository tests.
- Archived nodes remain visible from historical records.
- The active route uses typed IndexedDB services and is statically prohibited from importing legacy persistence.
