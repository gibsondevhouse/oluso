# Coding Agent Rules

## Purpose

Define the rules and guidelines that coding agents (automated or human) must follow when implementing features for OLUSO.  These rules ensure that implementation adheres to the documented architecture, avoids scope creep and maintains quality.

## General Principles

1. **Respect Documentation** — Implement features strictly according to the pre‑coding documentation (foundation docs, ADRs, component specs, page specs, data specs, workflow specs, test specs).  Do not invent product decisions or deviate from specifications.
2. **No Scope Creep** — Do not implement features, pages or components that are marked as “later” or “out of scope”.  If you encounter an unspecified requirement, raise it with the product owner rather than improvising.
3. **Follow Architecture** — Use the architecture patterns defined in `10-ui-architecture.md`, `11-state-management.md`, and ADRs.  Do not introduce new frameworks or libraries without approval.
4. **Component Reuse** — Use existing components whenever possible.  If a needed component spec does not exist, pause implementation until the spec is authored.
5. **Minimal Changes** — Change only the files listed as allowed in your implementation prompt.  Do not edit unrelated modules, documentation or configuration files.
6. **Error Handling** — Implement error states as defined in the specs.  Do not ignore errors or hide them from users.
7. **Testing First** — Write or update tests corresponding to the feature you implement.  Ensure all existing tests pass before submitting a PR.
8. **Commit Messages** — Use clear, descriptive commit messages referencing the feature and document sections you addressed.

## Decision Making

* If a question arises that is not answered by existing documentation, pause and request clarification from the product owner or architecture owner.
* Do not assume how a workflow should behave if it is not specified.  Suggest updates to the documentation if gaps are discovered.
* Follow ADRs for decisions on persistence, runtime and identity.  Do not change these without a new ADR.

## Code Quality

* Adhere to the project’s coding standards (lint rules, formatting tools).  Use Prettier and ESLint for JavaScript/TypeScript and `rustfmt`/`clippy` for Rust.
* Write clear, maintainable code with comments where needed.  Avoid premature optimisation; prioritise readability and adherence to design.
* Ensure that all user‑visible text is internationalisable if i18n support is planned.

## Communication

* Clearly state what you plan to implement and confirm the allowed file list before starting.
* Provide concise summary of changes and testing results when submitting for review.
* Tag relevant stakeholders (e.g. product owner) for review of user‑facing changes.

## Acceptance Criteria

* All changes comply with these rules and the pre‑coding documentation.
* No out‑of‑scope features or undocumented decisions are introduced.
* Tests are written and passing.