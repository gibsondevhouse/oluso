# Exposure scenario page specification

Status: Governing target
Routes: `/ih/scenarios`, `/ih/scenarios/[id]`
Last updated: 2026-07-18

## Purpose

Define the worker/work/agent/condition context that governs exposure assessment.

## Builder sections

1. SEG and affected population.
2. Site-resolvable location.
3. Process and task.
4. Exposure agent.
5. Operating condition.
6. Routes, frequency, duration, and variability.
7. Existing controls, PPE, reliability, and limitations.
8. Acute/chronic concerns.
9. Evidence, uncertainty, and data quality.

## Required promotion gate

A scenario cannot become `assessment-ready` without valid SEG, location, process, task, agent, and operating condition relationships.

Drafts may retain missing fields, but the interface lists them explicitly.

## Duplicate/splitting guidance

When operating condition, task, agent, routes, duration, controls, or affected population materially differs, prompt the user to create a separate scenario rather than broadening one record.

Examples kept separate:

- Routine enclosed prodiamine WDG operation.
- Duct-clearing during upset/blockage.
- Post-release cleanup with settled/resuspended particulate.

## Detail view

Show scenario context, current assessment/determination, monitoring priority/history, controls/verifications, actions, reassessment, data-quality findings, and revision/package history.

## Acceptance criteria

- Scenario context is sufficient to explain who/where/what/condition.
- Incompatible process/task/location links are rejected.
- Assessments originate from one scenario and retain its revision context.
