# Locations page specification

Status: Governing target
Active canonical route: `/operations/locations`
Last updated: 2026-07-19

## Purpose

Create and maintain the governed geographic/operational hierarchy used by every Site-scoped record.

## Node types

```text
Country
StateOrProvince
CountyOrDistrict
CityOrMunicipality
Site
Facility
Building
Floor
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
- Resolved Country, State/Province, County/District, City/Municipality, and Site context.
- Effective multi-select Operational Function assignment panel with retained history.
- Explicit owning, operating, managing, support, and Function-responsibility relationships.
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
- StateOrProvince parent is Country; CountyOrDistrict parent is StateOrProvince.
- CityOrMunicipality parent is StateOrProvince or CountyOrDistrict.
- Site parent is CityOrMunicipality, or CountyOrDistrict where no municipality applies.
- Facility and lower physical types follow the controlled parent matrix and resolve to Site.
- Operational purpose is represented by many-to-many Function assignments, never by Location node type.
- Cycles/self-parenting are prohibited.
- Reparent cannot move a node into its descendant.
- Archive/reparent shows impacted active descendants and references before confirmation.

## Acceptance criteria

- Tifton and Ocilla can be represented without root-Facility workarounds.
- Every operational node resolves to one Site.
- One physical Location can hold several Functions, and one Function can occur at several Locations.
- Invalid hierarchies are rejected in domain services and repository tests.
- Archived nodes remain visible from historical records.
- The active route uses typed IndexedDB services and is statically prohibited from importing legacy persistence.
