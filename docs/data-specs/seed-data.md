# Seed Data Specification

## Purpose

Define a strategy for generating and managing seed data during development and testing.  Seed data allows developers to test features with meaningful records without manually entering them each time the app is run.

## When to Seed

* **Development:** When developers run the app in a development environment with an empty database, seed data provides a realistic dataset for UI and performance testing.
* **Testing:** Automated tests may insert seed data before running scenarios.  The seed data should be deterministic and reset between tests.

Seed data should **not** be automatically inserted in production environments.  Users will create their own data.

## Seed Data Content

Include a small but representative set of records for each register:

* **Locations:** 3–5 sample locations (e.g. “Main Plant”, “Warehouse A”).
* **Processes:** a few processes per location (e.g. “Mixing”, “Packaging”).
* **Chemicals:** a handful of chemicals with hazard classes and CAS numbers.
* **Hazards:** sample hazards associated with chemicals and processes with varying severity/likelihood.
* **SEGs:** 2–3 SEGs grouping hazards.
* **Findings:** a few findings for each type and status.
* **Corrective Actions:** some open, in progress, closed and verified actions linked to findings.

Use realistic names and codes, but clearly mark seed data (e.g. codes starting with “SAMPLE‑”) so they are easy to identify and remove.

## Implementation

* Seed scripts reside in a separate directory (`src-tauri/seed/`) and are executed via a development command (e.g. `npm run seed`) or triggered by a developer toggle in the app.
* The seed process should first clear any existing data (in a development database only) to avoid duplicating records.
* Seed generation uses the same data access layer as the application, ensuring that validations and lifecycle rules are respected.

## Acceptance Criteria

* Developers can populate the database with seed data via a single command or toggle.
* Seed data covers all registers and demonstrates relationships (e.g. hazards linked to chemicals, findings linked to actions).
* Seed scripts do not run in production builds and are clearly documented.