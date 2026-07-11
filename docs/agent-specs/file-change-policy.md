# File Change Policy

## Purpose

Define guidelines for which files coding agents may modify during implementation tasks.  By controlling file changes, we preserve the integrity of documentation and prevent accidental edits to unrelated modules.

## Principles

1. **Explicit Allowed List** — Each implementation prompt must specify the exact files or directories that may be modified.  Agents may only change files on this list.
2. **No Drive‑By Changes** — Do not fix unrelated bugs or refactor code outside the scope of the task.  Create a separate task or PR for such changes.
3. **Documentation Changes** — Do not modify documentation files (`docs/`) unless the task explicitly involves updating documentation.  Even then, ensure updates are agreed upon with the product owner.
4. **Generated Files** — Do not manually edit generated files (e.g. compiled JavaScript, built assets).  These are rebuilt automatically.
5. **Config & Build Files** — Changes to configuration (e.g. `package.json`, `tsconfig.json`) require architectural review and must be justified in the implementation prompt.
6. **Migration Scripts** — When adding new database features, you may add new migration files under `src-tauri/migrations/`, but never modify existing migration files.  Existing migrations are immutable once merged.
7. **Test Files** — You may create or update test files corresponding to the files being changed.  Do not delete tests without explicit reason.

## Implementation Guidance

* Before starting work, review the list of allowed files.  If you need to modify additional files, request an update to the prompt.
* After implementation, ensure that your changes are limited to the allowed set by running a diff and verifying paths.
* If your implementation requires updating docs or ADRs, communicate with the documentation owner to ensure consistency.

## Enforcement

Continuous Integration should include a script that checks the changed files against the allowed list in the prompt.  If unauthorized files are modified, the build should fail and require review.

## Acceptance Criteria

* Agents only modify files explicitly permitted in their prompts.
* No unintended changes appear in pull requests.
* Documentation and config files remain untouched unless authorised.