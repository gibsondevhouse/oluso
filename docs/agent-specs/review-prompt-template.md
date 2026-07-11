# Review Prompt Template

Use this template when asking an agent to review code changes.  The goal of the review is to ensure adherence to specifications, coding standards and overall quality.  The reviewer should not introduce new functionality but may suggest improvements or identify issues.

```
## Context

Briefly describe the feature or bug fix being reviewed and reference the implementation prompt.

## Summary of Changes

Provide a high‑level overview of what the changes do.  Mention key files modified, new components added and major logic updates.

## Things to Look For

* Adherence to the specifications (page specs, component specs, data specs).
* Proper use of existing components; no reinventing the wheel.
* Compliance with coding standards and style guides.
* Adequate error handling and user feedback.
* Completeness of tests (unit, integration, E2E) and adequacy of test coverage.
* Accessibility considerations (labels, focus management, ARIA attributes).
* Performance considerations for data fetching and rendering.

## Questions for the Reviewer

List any specific areas where feedback is desired, such as alternative approaches, potential edge cases or uncertainties about the specification.

## Review Outcome

The reviewer should summarise whether the changes meet the requirements, list any issues discovered and recommend approval, changes requested or rejection.
```