# SEG and membership page specification

Status: Governing target
Routes: `/ih/segs`, `/ih/segs/[id]/memberships`
Last updated: 2026-07-18

## Definition

SEG means Similar Exposure Group: a defined worker group expected to have sufficiently similar exposure potential for a stated scope. It does not mean Significant Environmental/Safety Aspect and does not group hazards generically.

## SEG fields

- Business ID and name.
- Group rationale.
- Roles/work patterns.
- Inclusion/exclusion criteria.
- Site/process/task scope where useful for definition.
- Owner/reviewer and review date.
- Status, evidence, data-quality findings, and revision metadata.

## Membership fields

- Person.
- SEG.
- Effective start/end.
- Membership basis and scope.
- Review state/notes.

## Interface

- Search/filter SEGs by Site/status/review date.
- Detail shows effective members for a selected date plus historical membership.
- Membership timeline identifies overlaps/gaps.
- Related scenarios, assessments, sampling, determinations, actions, and history.

## Validation

- Membership dates are ordered.
- Person/SEG dependencies exist.
- Overlaps are evaluated by scope and require justification when ambiguous.
- Ending or archiving a SEG does not erase historical scenarios/assessments.

## Acceptance criteria

- Current and historical membership can be answered for any date.
- SEG identity remains distinct from scenario conditions and determinations.
- Existing misdefined SEG records migrate only with explicit mapping/data-quality review.
