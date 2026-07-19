# Validation rules

Status: Governing baseline
Last updated: 2026-07-19

## Validation layers

1. Shape/schema validation at input boundaries.
2. Field semantics and controlled values.
3. Cross-record relationship/invariant validation.
4. Lifecycle/promotion/review rules.
5. Exchange/migration integrity validation.

UI validation improves feedback but never replaces domain-service enforcement.

## Common rules

- UUIDs and ISO 8601 UTC timestamps are valid.
- Business IDs are unique in documented scope.
- Expected revision matches current revision.
- Required dependencies exist.
- Archived/superseded dependencies are accepted only where the workflow explicitly permits historical use.
- Unknown, missing, and not applicable are distinct.
- Archive/restore requires attribution; archive requires reason.

## Location rules

- Country has no parent.
- StateOrProvince parent is Country.
- CountyOrDistrict parent is StateOrProvince.
- CityOrMunicipality parent is StateOrProvince or CountyOrDistrict.
- Site parent is CityOrMunicipality, or CountyOrDistrict where no municipality applies.
- Facility and lower physical node types follow the controlled parent matrix and resolve to exactly one Site.
- Parent links cannot create cycles.
- Reparent operations identify all affected descendants and dependent records before apply, then commit all recalculated geography/Site fields atomically or roll back.
- Location node type describes geography or physical structure, never Packaging, Laboratory, Tolling, Manufacturing, Warehousing, or another operational purpose.

## Organization and Operational Function rules

- Internal Organization types follow the controlled parent matrix; self-parenting and descendant cycles are prohibited.
- Archived ancestors remain historically resolvable, but cannot receive new active relationships.
- Operational Function identity is reusable globally and is not duplicated per Site.
- A physical Location may have several effective Operational Function assignments, and one Function may be assigned to several Locations.
- Overlapping active Location–Function assignments with the same scope are prohibited; meaningful scope or period history is retained.
- Geographic Locations cannot receive Operational Functions, and Owns/Leases Organization relationships cannot target geography.
- A Process requires one active Operational Function, a compatible primary Location Function assignment, one active Primary Process Location assignment, and only same-Site supporting Locations.
- A reusable Task stores descriptive routine classification and never stores a fixed scenario operating condition.

## Chemical rules

- Substance identity is distinct from product identity.
- SDS belongs to a product/manufacturer context and retains revision/effective dates.
- Inventory requires product, Site, storage location, quantity, and compatible unit.
- Chemical use requires product, Site, Location, Process, optional Task, derived Process Function, frequency/duration/condition, and an active compatible Location Function assignment.
- Exposure limit belongs to an agent, not inventory or product.
- Current/superseded limit and SDS designations are internally consistent.

## SEG/scenario/assessment rules

- SEG membership dates are ordered and overlap is checked by scope.
- Scenario promotion requires SEG, Site-resolvable location, process, task, agent, and operating condition.
- Scenario process/task/location relationships are compatible.
- Assessment references exactly one scenario and records uncertainty/data quality.
- Determination references one assessment and includes determiner, date, rationale, limitations, and follow-up.

## Monitoring rules

- Sample stop is after start and duration is consistent or explicitly justified.
- Result numeric fields are numbers; qualifiers/model represent non-detect and below-quantitation values.
- Unit has a known dimension and is compatible with the agent/method/result.
- Exposure-limit comparison requires compatible dimension, unit conversion, limit type, averaging/duration basis, and applicable effective date.
- Unsupported partial-shift, mixture, ceiling, or other interpretation returns “not automatically comparable” rather than a fabricated pass/fail.
- Professional interpretation/determination is not generated from comparison outcome alone.

## Governance/exchange rules

- Record revision is unique and sequential for a record.
- Revisions/import runs/resolutions are immutable after finalization.
- Package ID is unique; re-import is idempotent.
- Dataset ID/schema/integrity/manifest must validate before dry-run/apply.
- Missing dependencies and invalid schemas block affected records; governed apply remains atomic.
- Conflicts and external deletions require explicit resolution.
- Applied changes record source package and actors.

## Security limits for imported JSON

Implementation defines tested limits for file bytes, nesting depth, records, field length, array length, and total expanded content. Unknown fields are rejected for safety-critical schemas unless a versioned compatibility rule explicitly accepts them.

## Error requirements

Validation errors include stable code, human message, record/field path, offending value summary where safe, and remediation guidance. Import errors additionally identify package/record classification without exposing executable content.
