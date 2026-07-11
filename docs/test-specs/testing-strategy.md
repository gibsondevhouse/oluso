# Testing Strategy Specification

## Purpose

Define the overall approach to testing OLUSO.  A comprehensive testing strategy ensures that unit, integration, UI and end‑to‑end tests work together to provide confidence in the application’s correctness, performance and accessibility.

## Test Types

1. **Unit Tests** — Verify individual functions, modules and components in isolation.  Examples: data validation functions, utility libraries, component rendering with basic props.  Use a testing framework like Jest for JavaScript/TypeScript and `cargo test` for Rust.

2. **Integration Tests** — Test how modules work together.  Examples: persistence module interactions with SQLite, data access functions returning expected results, multi‑component interactions.  Use Jest with an in‑memory database or a temporary file.

3. **End‑to‑End (E2E) Tests** — Simulate real user interactions in the application UI.  Examples: create a new record, edit it, archive it, and verify that it appears in the correct lists.  Use a framework like Playwright or Cypress.  E2E tests run against the packaged app or a development build with the UI and persistence layer fully functional.

4. **Accessibility Tests** — Automated checks using tools like axe‑core to detect common accessibility issues (missing labels, colour contrast, focus traps).  Supplement with manual testing.

5. **Performance Tests** — Ensure that queries and UI renderings remain performant with realistic data volumes.  Use profiling tools and benchmarking for database queries.  Not required for MVP but should be considered.

## Test Pyramid

Prioritise unit tests at the base, integration tests in the middle and a smaller number of E2E tests at the top.  Unit tests are fast and pinpoint bugs; integration tests ensure modules work together; E2E tests validate critical user flows.

## Testing Tools

* **JavaScript/TypeScript:** Jest for unit/integration tests, React Testing Library for component testing, Playwright for E2E.
* **Rust:** `cargo test` for unit tests in Tauri commands and migration logic.
* **Accessibility:** axe‑core via the Playwright or React Testing Library integrations.

## Test Data

* Use in‑memory SQLite databases for unit/integration tests; seed them with minimal data required for each test.
* E2E tests can run against a temporary file database.  Tests should clean up after themselves.
* Avoid using production seed data in tests; use specific fixtures defined in test code.

## Continuous Integration

* Configure a CI pipeline (e.g. GitHub Actions) to run all tests on every pull request.  Fail the build if any test fails or if code coverage drops below the target threshold.
* E2E tests may run in a headless mode to reduce infrastructure requirements.

## Manual Testing

* Complement automated tests with manual spot checks, particularly for accessibility, layout and user experience.  Use the `manual-acceptance-checklist.md` as a guide.

## Acceptance Criteria

* Automated tests cover at least the critical paths for each register, form and workflow.  Code coverage is measured and reported.
* CI runs all tests and prevents merging code that breaks existing functionality.
* Accessibility checks are integrated into the testing pipeline and reported.
* Manual acceptance criteria are documented and verified before release.