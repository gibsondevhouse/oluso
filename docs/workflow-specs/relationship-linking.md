# Relationship linking workflow

Status: Governing
Last updated: 2026-07-18

## Principle

Relationships are typed domain facts, not arbitrary tags. Creating, replacing, or ending a relationship uses domain services, expected revisions, cross-record validation, and immutable history.

## Patterns

- Parent/child: Location hierarchy and Process → Task.
- Effective-dated: Person ↔ SEG membership.
- Context: Scenario → SEG/Location/Process/Task/Agent.
- Versioned basis: Result/Comparison → ExposureLimit revision.
- Source/follow-up: Assessment/Incident/Finding → Action → Verification.
- Evidence: Domain record → EvidenceReference/DocumentReference.

SEG ↔ Hazard is not a generic many-to-many target relationship. Exposure relevance is expressed through Exposure Scenario and Assessment.

## UI

- Searchable selection shows business ID, name, status, Site context, and archived/superseded state.
- Context filters narrow choices but do not hide the actual relationship rules.
- Historical views display inactive dependencies with clear status.
- Removing/ending a relationship shows impact and does not delete either record.
- Effective-dated relationships use an end date rather than destructive unlink where history matters.

## Validation

- Required target exists.
- Active use of archived/superseded target is allowed only by explicit rule/justification.
- Site/process/task relationships are compatible.
- Location relationships do not create cycles.
- Duplicate relationships/effective intervals are prevented or justified.
- Removing/replacing a required relationship cannot orphan an assessment, determination, sample, action, review, or revision.

## Acceptance criteria

- Relationship changes are transactional and revisioned.
- Historical records remain navigable.
- Domain-invalid generic links are impossible through UI or repository.
