# Monitoring, sampling, and interpretation page specification

Status: Governing target
Routes: `/ih/sampling-plans`, `/ih/sampling-events`, `/ih/interpretations`, `/ih/determinations`
Last updated: 2026-07-18

## Purpose

Plan monitoring, capture actual samples/results, calculate reproducible exposure-limit comparisons, and record professional interpretations/determinations without collapsing these concepts into one row.

## Sampling plan workspace

- Source assessment/scenario and monitoring rationale.
- Population/SEG and representativeness strategy.
- Agents/analytes, methods, media/instruments, sample types, durations, number of samples, quality controls, and responsibilities.
- Status, review, revisions, and evidence.

## Sampling event workspace

- Actual date/time, location/task/condition, participants, deviations, weather/production context, calibration/chain-of-custody references.
- Nested samples with worker/area context, precise start/stop/duration, flow/volume, method/device/media.
- Nested laboratory/instrument results with numeric values, units, qualifiers, LOD/LOQ, methods, and reports.

## Comparison view

For each result/derived exposure:

- Selected versioned exposure limit and effective basis.
- Result qualifier, unit, sample duration, and operating condition.
- Explicit conversion/duration assumptions.
- Comparable/not comparable and calculated outcome.
- Limitations for partial shift, STEL, ceiling, mixtures, non-detects, uncertainty, and PPE.

The app must not store or display a bare `result > limit` compliance status.

## Interpretation and determination

Professional interpretation is an attributed record addressing quality, uncertainty, representativeness, sampled/unsampled workers, routine/abnormal conditions, PPE context, and implications.

Determination remains a separate attributed assessment conclusion with controls, programs/surveillance administration, actions, and reassessment.

## Acceptance criteria

- Numeric results and qualifiers are modeled correctly.
- Incompatible units/durations block calculation.
- TWA/STEL/ceiling bases are explicit.
- Comparisons are reproducible from stored inputs.
- Interpretation/determination cannot be inferred solely from calculated outcome.
- History preserves the limit and evidence revisions used.
