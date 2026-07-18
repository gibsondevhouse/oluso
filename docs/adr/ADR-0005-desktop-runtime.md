# ADR-0005 — Tauri desktop runtime

Status: Superseded by [ADR-0008](ADR-0008-web-only-local-first-runtime.md)
Superseded: 2026-07-18

## Historical decision

OLUSO selected Tauri to host the Svelte UI, provide native file access, and execute Rust-backed SQLite commands.

## Reason for supersession

ADAMA HSE targets corporate browsers and an installable PWA. Native packaging and a second persistence implementation add no operational benefit to the two-installation manual-exchange workflow.

## Removal consequence

Tauri dependencies, commands, Rust persistence, and packaging documentation remain only until browser persistence and legacy-data migration meet their documented gates. They are not a parallel product target.
