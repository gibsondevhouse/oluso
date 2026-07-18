# Dashboard page specification

Status: Governing target
Route: `/dashboard`
Last updated: 2026-07-18

## Purpose

Show where the baseline/exposure chain is incomplete and which reviews, conflicts, controls, actions, or reassessments require attention.

## Primary regions

1. Site/Unit selector.
2. Baseline completeness.
3. Industrial-hygiene workflow status.
4. Review exchange/conflict queue.
5. Due controls/actions/reassessment.
6. Data-quality findings.
7. Storage/offline/backup diagnostics.

## Completeness model

For the selected Site/Unit, show:

- Location hierarchy.
- Processes.
- Tasks.
- Equipment context.
- Chemical uses.
- SEG definitions/memberships.
- Exposure scenarios.
- Assessments/determinations.
- Controls/control verification.
- Monitoring history or rationale.
- Reassessment schedule.

Each row displays Complete, Partial, Draft, Missing, Stale, or Not Applicable plus a count/percentage only when a versioned rule defines the denominator. Selecting a row opens the source records or guided remediation step.

## Needs attention

Prioritize:

- Blocking import conflicts and invalid dependencies.
- Scenarios missing required assessment context.
- Assessments awaiting review.
- High-priority monitoring gaps.
- Failed/unverified controls.
- Overdue actions.
- Determinations/reassessments due.
- Backup overdue or storage at risk.

Do not show broad counts of training, permits, waste, or other deferred modules.

## States

- First use: start Country/State/Site and unit baseline.
- No selected scope: choose a Site/Unit.
- Partial baseline: explain gaps without implying failure/compliance.
- Storage failure: prominent non-dismissable write-risk state.
- Offline: normal local operation with informational update/transfer limitation.
- Unsupported/legacy data: link to migration/data-quality resolution.

## Acceptance criteria

- Every status derives from canonical records and links to source/remediation.
- Rule-set version and missing requirements are inspectable.
- Dashboard never stores an independent conclusion.
- Deferred modules do not influence readiness.
- Keyboard and print behavior is accessible.
