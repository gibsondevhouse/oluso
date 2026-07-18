# Exposure assessment and determination specification

Status: Governing target
Routes: `/ih/assessments`, `/ih/determinations`
Last updated: 2026-07-18

## Assessment

An assessment is created from exactly one exposure scenario and records:

- Assessor/date/method/purpose.
- Scenario revision/context.
- Evidence considered.
- Qualitative exposure potential.
- Frequency/duration/variability.
- Acute/chronic concern.
- Control effectiveness/reliability.
- Uncertainty, confidence, representativeness, data quality, and gaps.
- Monitoring priority/rationale.
- Review state and next review.

The UI permits drafts but blocks review-ready status until required assessment fields and scenario context pass validation.

## Determination

A determination is a separate professional record based on an assessment. It records determiner/date, conclusion/rationale, evidence/comparisons, limitations/confidence/applicability, required controls/monitoring/programs/surveillance/actions, and reassessment date.

## Review

- Submit an exact assessment/determination revision.
- Manager can accept, request changes, or reject with durable notes.
- Later edits create new revisions and identify whether re-review is required.
- Superseding preserves the prior determination.

## Safeguards

- No determination without an assessment.
- No assessment without a scenario.
- Comparison outcomes cannot auto-create/approve a determination.
- Unknown/missing data remains visible.
- Clinical medical information is prohibited.

## Acceptance criteria

- Reader can reconstruct the scenario/evidence/revisions supporting the conclusion.
- Review notes survive exchange.
- Required follow-up appears on dashboard and scenario detail.
