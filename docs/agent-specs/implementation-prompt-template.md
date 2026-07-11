# Implementation Prompt Template

This template defines the structure for prompts given to coding agents when implementing a feature.  Use it verbatim and fill in the placeholders with feature‑specific information.  Do not omit sections unless explicitly stated.

```
## Objective

Describe in one sentence what the feature aims to achieve.

## Problem

Explain the problem or user story motivating this feature.  Reference relevant documentation sections (page specs, data specs, workflow specs).

## Files Allowed to Change

List the specific files or directories that the agent may modify.  All other files are off‑limits.

## Required Changes

Enumerate the specific code or component changes required to implement the feature.  Be precise (e.g. “Add a new route in `src/router/index.ts`”, “Create a component in `src/components/RegisterTable.tsx`”).

## UI/UX Requirements

Summarise the design and interaction requirements from component and page specs.  Include expected visual states, interactions and accessibility considerations.

## Data & Persistence Requirements

Specify any new data fields, queries or persistence functions needed.  Reference data specs and validation rules.

## Error Handling

Define how errors should be handled and surfaced to the user according to the specs.

## Tests

List the tests that must be added or updated (unit, integration, E2E) to cover the new feature.  Reference test spec sections.

## Acceptance Criteria

Define the conditions that must be met for the feature to be considered complete.  These are derived from the page spec and workflow spec.

## Out‑of‑Scope Items

List any related features or enhancements that are explicitly out of scope for this prompt.

## Required Response Format

State how the agent should respond (e.g. “Provide a pull request with commit messages summarising each change; include notes on test coverage”).
```