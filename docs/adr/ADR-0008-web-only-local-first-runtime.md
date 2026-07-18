# ADR-0008 — Web-only local-first runtime

Status: Accepted
Date: 2026-07-18

## Context

The current repository uses SvelteKit inside Tauri and carries native Rust/SQLite behavior. The target users work on corporate laptops and need offline local operation plus manual package transfer, not native OS integration or two product variants.

## Decision

ADAMA HSE will ship as a SvelteKit SPA/PWA that runs in supported corporate browsers. The web application is the only target runtime.

- The application shell and required static assets are cacheable for offline use after first load.
- Durable records remain in the browser database on each installation.
- File import/export uses explicit browser file selection/download capabilities.
- OneDrive transfer is manual and outside the runtime.
- No application behavior requires Tauri commands, Rust, Node server APIs, or a remote backend.

## Consequences

- Browser support, storage durability, quota behavior, private/incognito limitations, PWA policy, update behavior, and offline readiness become deployment requirements.
- A user may use the app in a normal tab or installed PWA without different domain behavior.
- Tauri-specific paths, file APIs, packaging, updater, permissions, and security documentation are removed after migration gates pass.
- Corporate deployment may host the static application on an approved internal origin while all operational data remains local to the browser profile.

## Alternatives rejected

- Maintain Tauri and web builds: doubles persistence and release verification.
- Continue Tauri only: conflicts with the established corporate web deployment direction.
- Add a backend: expands intended use into hosted multi-user infrastructure without need.

## Removal gate

Do not remove the legacy runtime until browser persistence, offline operation, supported data migration, backup/recovery, and representative end-to-end workflows are verified.
