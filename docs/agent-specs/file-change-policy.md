# File-change policy

Last updated: 2026-07-18

- Preserve unrelated user/worktree changes.
- Use current governing documentation and accepted ADRs.
- Add new target IndexedDB migrations; never edit a released migration in place.
- Legacy `src-tauri/migrations` files are immutable migration-source history. Do not add native features.
- Do not delete `src-tauri`, legacy browser data readers, or historical docs before documented migration/removal gates pass.
- Domain changes include explicit types, validation, repository/service behavior, migration, and tests.
- Exchange schema changes include compatibility policy and round-trip/conflict tests.
- Generated artifacts/build outputs are not hand-edited.
- Historical Word/campaign documents are not governing; update current Markdown specs instead unless an explicit deliverable requires a revised document artifact.
