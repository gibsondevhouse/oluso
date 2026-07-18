# Coding-agent rules

Last updated: 2026-07-18

## Authority

Follow the documentation authority order in [`docs/README.md`](../README.md). Current accepted ADRs and governing reset documents override legacy OLUSO campaign specs and existing implementation behavior.

## Architecture rules

- Target SvelteKit SPA/PWA only; do not add Tauri/Rust features.
- Use one IndexedDB adapter behind typed repositories.
- Do not add new `localStorage` record persistence.
- Do not implement parallel native/web behavior.
- Treat legacy persistence as migration-only.
- UI components do not access persistence directly.

## Domain rules

- Safety-critical entities use explicit types, schemas, services, repositories, and invariants.
- Generic campaign records are limited to low-risk reference data.
- An assessment requires a scenario; a determination requires an assessment.
- Monitoring calculations remain separate from professional interpretation/determination.
- Every accepted mutation creates an immutable revision.
- Backup, bulk import, exchange, and report export remain separate.

## Change rules

- Preserve user changes and unrelated dirty worktree files.
- Add migrations; do not rewrite released migration history.
- Do not remove legacy adapters/data before migration and rollback gates pass.
- Update applicable docs/tests with domain or contract changes.
- Avoid scope expansion into Future Modules.

## Verification

Run the strongest available checks relevant to the change. Report exact commands, failures, and unavailable target checks. Passing legacy tests does not waive new repository/migration/exchange requirements.

## Decision gaps

If implementation requires a material choice not established by current docs—especially supported browsers, encryption/signing, a persistence helper library, clinical data, cloud behavior, or professional calculation policy—stop and request/record the decision rather than hiding it in code.
