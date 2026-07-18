# 09 — Routing

Status: Target contract; migrate incrementally
Last updated: 2026-07-18

## Rules

- Routes express the ADAMA HSE workflow, not the underlying storage collections.
- Durable records have stable detail URLs and history subroutes.
- Guided workflow routes may compose several domain entities without duplicating them.
- Current legacy routes may remain during migration but are not target contracts unless listed here.
- Deferred campaign routes move under a Future Modules boundary or are hidden from primary navigation.

## Primary routes

| Route | Purpose |
| --- | --- |
| `/` | Redirect to `/dashboard`. |
| `/dashboard` | Site/unit completeness, reviews, conflicts, due work, and data quality. |
| `/baseline` | Baseline workspaces by site/unit. |
| `/baseline/[locationId]` | Guided unit/site baseline capture. |
| `/baseline/[locationId]/packet` | Review-ready baseline packet. |
| `/data-gaps` | Cross-record data-quality findings and incomplete workflow links. |

## Master-data routes

| Route family | Records |
| --- | --- |
| `/master/organizations` | Organizations. |
| `/master/people` | People/local identities where appropriate. |
| `/master/locations` | Hierarchical locations. |
| `/master/processes` | Processes and related tasks. |
| `/master/tasks` | Task register when direct access is needed. |
| `/master/equipment` | Equipment. |
| `/master/substances` | Chemical substances. |
| `/master/products` | Chemical products and SDS revisions. |
| `/master/inventory` | Site chemical inventory. |
| `/master/chemical-uses` | Chemical use contexts. |
| `/master/exposure-agents` | Exposure agents and versioned limits. |
| `/master/controls` | Reusable controls. |
| `/master/documents` | Document/evidence references. |

Each family supports:

```text
/family
/family/new
/family/[id]
/family/[id]/edit
/family/[id]/history
```

## Industrial-hygiene routes

| Route family | Purpose |
| --- | --- |
| `/ih/segs` | SEG definitions and membership access. |
| `/ih/segs/[id]/memberships` | Effective-dated SEG memberships. |
| `/ih/scenarios` | Exposure-scenario register and builder. |
| `/ih/assessments` | Structured qualitative assessments. |
| `/ih/sampling-plans` | Sampling strategies and plans. |
| `/ih/sampling-events` | Sampling execution, samples, and results. |
| `/ih/interpretations` | Professional interpretations. |
| `/ih/determinations` | Professional determinations. |
| `/ih/control-verification` | Scenario/control verification. |
| `/ih/reassessment` | Due and completed reassessment. |

Scenario detail is the primary occupational-health context hub and links to its assessment, monitoring, determination, controls, actions, and revision history.

## Assurance routes

```text
/assurance/observations
/assurance/inspections
/assurance/findings
/assurance/incidents
/assurance/investigations
/actions
```

Assurance records preserve links to Site, Unit, Process, Task, Equipment, Scenario, Agent/Hazard, and Control when known.

## Review-exchange routes

| Route | Purpose |
| --- | --- |
| `/exchange` | Status and package history. |
| `/exchange/export` | Build a scoped, versioned package. |
| `/exchange/import` | Select and validate a package. |
| `/exchange/import/[stagingId]/preview` | Dry-run classifications and dependency errors. |
| `/exchange/import/[stagingId]/conflicts` | Side-by-side resolution. |
| `/exchange/import/[stagingId]/apply` | Final confirmation and transactional apply. |
| `/exchange/import-runs/[id]` | Immutable import result and rollback reference. |

Package files are untrusted input. A selected file does not become a route parameter or mutate state before validation/staging.

## Reports, settings, and recovery

```text
/reports
/reports/baseline/[locationId]
/reports/scenario/[scenarioId]
/settings
/settings/identity
/settings/storage
/settings/backups
/settings/diagnostics
/recovery
```

## Query-state conventions

- Search, filters, sort, archive visibility, and pagination use query parameters.
- Selected entity identity uses path parameters.
- Unsaved forms, package contents, credentials, and sensitive notes never enter URLs.
- Site/unit context may use a query parameter only when it is a view filter; canonical record context remains in the data relationship.

## Migration aliases

Old routes may redirect to a canonical target when identity mapping is unambiguous. A redirect must not silently reinterpret a legacy generic record as a valid typed record. Records requiring migration review land on a data-quality/migration resolution view.
