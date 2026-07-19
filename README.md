# ADAMA HSE

ADAMA HSE is a local-only, web-first occupational health and HSE application. The repository retains the legacy name `oluso`, but the governing product direction is ADAMA HSE.

The application is being reset around a DOEHRS-inspired industrial-hygiene workflow:

```text
Location
  → Process
  → Task
  → SEG
  → Exposure Scenario
  → Exposure Assessment
  → Determination
  → Monitoring
  → Controls
  → Actions
  → Reassessment
```

## Current status

The repository already contains a functional SvelteKit/Svelte 5 application shell, shared register CRUD patterns, local persistence implementations, archive/restore behavior, search, reports, exports, backup controls, and automated tests. It is not being rewritten from scratch.

The current implementation is broader than the target and still contains a Tauri/Rust persistence path plus a browser `localStorage` path. Those are migration sources, not the target architecture. The migration branch now contains the target IndexedDB adapter, immutable revision transactions, legacy migration fixtures, backup/integrity services, browser diagnostics, and PWA shell; existing broad register routes have not completed their cutover yet.

The active reset is:

```text
SvelteKit SPA/PWA
  → browser persistence adapter
  → versioned IndexedDB database
  → JSON backup and exchange packages
  → manual OneDrive transfer between two installations
```

Tauri, Rust persistence, desktop-only configuration, and `localStorage` as the primary database will be removed only after browser persistence and data migration are verified.

## Product boundaries

- Local-only and offline-capable after first load.
- Designed for an HSE professional and HSE manager using separate browser databases.
- Collaboration occurs through reviewed exchange packages, not silent sync or a shared cloud database.
- OneDrive is a user-controlled transport location, not the system of record.
- Professional exposure determinations remain explicit, attributed, and reviewable.
- Clinical medical information is outside scope.
- Training, MOC, environmental, waste, and other broad campaign modules are deferred until the baseline and industrial-hygiene spine are dependable.

## Development

```bash
npm install
npm run dev
npm run check
npm test
npm run build
npm run verify
```

`npm run verify` runs the current Svelte/type checks, complete unit/contract/migration tests, production build, and PWA artifact checks. Formatting, lint, exchange, end-to-end, accessibility, and installed-browser gates will be added before Phase 7 exit.

## Governing documentation

- [Project direction and document status](docs/README.md)
- [Product brief](docs/00-project-brief.md)
- [Domain model](docs/04-domain-model.md)
- [Build plan](docs/07-build-plan.md)
- [Repository audit and reset record](docs/repository-audit-2026-07-18.md)
- [Phase 1 persistence foundation status](docs/phase-1-persistence-foundation-status.md)
- [Architecture decisions](docs/adr/README.md)

Historical OLUSO campaign documents and desktop-era specifications are retained for implementation inventory and migration context. They do not override the current project brief, domain model, build plan, or accepted ADRs.
