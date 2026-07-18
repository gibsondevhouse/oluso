# Seed and fixture data

Status: Governing target
Last updated: 2026-07-18

Production databases are not automatically populated with fictional operational records.

Development/test fixtures are TypeScript data builders stored with relevant tests and must:

- Use target typed schemas and the record envelope.
- Be deterministic where assertions require it.
- Include Site hierarchy, process/task, chemical product/use, SEG/membership, scenario/assessment, sampling/result, determination, action, and revision examples.
- Include routine, upset/blockage, and cleanup scenarios as separate records.
- Include archived/superseded dependencies and data-quality gaps.
- Use synthetic data unless a separately approved fixture process sanitizes real records.
- Never include clinical medical information.

Migration fixtures are separate from development seeds and preserve each supported legacy schema sufficiently to test conversion.

No new seed mechanism is added under `src-tauri`.
