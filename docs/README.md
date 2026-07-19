# ADAMA HSE documentation

Last updated: 2026-07-18

This directory records the transition from the broad, desktop-first OLUSO implementation to the narrower, web-first ADAMA HSE product.

## Authority order

When documents disagree, use this order:

1. Accepted ADRs in [`docs/adr`](adr/README.md).
2. The current [product brief](00-project-brief.md), [domain model](04-domain-model.md), [scope boundaries](08-scope-boundaries.md), and [build plan](07-build-plan.md).
3. Current data, workflow, page, component, and test specifications.
4. Historical OLUSO documentation and campaign artifacts.
5. The existing implementation, which is evidence of current behavior but not automatically the target design.

## Current governing set

| Document | Role |
| --- | --- |
| [Repository audit](repository-audit-2026-07-18.md) | Records why the reset is required and what is retained, refactored, deferred, or removed. |
| [Feature inventory](feature-inventory.md) | Maps current implementation assets to retain, refactor, defer, remove, and new-work categories. |
| [File/module inventory](architecture-reset-module-inventory.md) | Summarizes the explicit file-by-file retain/refactor/defer/remove record. |
| [Legacy schema mapping](legacy-schema-mapping.md) | Maps browser versions 1–14 and native versions 1–10 into the target model. |
| [Phase 1 persistence status](phase-1-persistence-foundation-status.md) | Records implemented IndexedDB/PWA evidence and the remaining application-cutover gap. |
| [Project brief](00-project-brief.md) | Defines intended use, users, operating model, and success criteria. |
| [Product vision](01-product-vision.md) | Defines the desired operational outcome. |
| [Information architecture](02-information-architecture.md) | Defines the workflow-centered product structure. |
| [Navigation](03-sidebar-navigation.md) | Defines primary navigation and the Future Modules boundary. |
| [Domain model](04-domain-model.md) | Defines canonical entities, relationships, and invariants. |
| [User workflows](05-user-workflows.md) | Defines baseline, assessment, monitoring, exchange, and assurance flows. |
| [Design principles](06-design-principles.md) | Defines interaction and visual behavior. |
| [Build plan](07-build-plan.md) | Defines the controlled implementation sequence and exit gates. |
| [Scope boundaries](08-scope-boundaries.md) | Freezes expansion and establishes explicit deferrals. |
| [Routing](09-routing.md) | Defines target route ownership. |
| [UI architecture](10-ui-architecture.md) | Defines reusable screens and review surfaces. |
| [State management](11-state-management.md) | Defines durable, transient, derived, and exchange state. |
| [Roadmap](12-future-roadmap.md) | Summarizes phase ordering and reactivation gates. |

## Historical material

The following material is retained as history or implementation inventory and is not governing where it conflicts with the current set:

- `docs/OLUSO Project Delivery System/` — campaign-era Word documents.
- `docs/corporate-compliance-readiness-assessment.md` — a point-in-time assessment of the pre-reset Tauri implementation.
- Superseded ADRs, especially the desktop-runtime and native-SQLite decisions.
- Page and component specifications not yet revised for the ADAMA HSE workflow.

Do not delete historical material merely because it is superseded. Mark it clearly, use it to plan migration, and remove it only through an intentional documentation cleanup.

## Naming

- **ADAMA HSE** is the target product name used in current documentation.
- **OLUSO** is the legacy product/repository name and may remain in code, paths, historical records, and migration identifiers until a separate rename is approved.
