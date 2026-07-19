# Chemicals, SDS, inventory, and use page specification

Status: Implemented canonical slice
Canonical routes: `/master/substances`, `/master/products`, `/master/inventory`, `/master/chemical-uses`
Last updated: 2026-07-18

## Purpose

Maintain global chemical identity separately from commercial products, SDS history, site inventory, and actual work use.

## Views

### Substance

Canonical name, CAS number, synonyms, intrinsic identity/classification, linked products, agents, and history.

### Product

Trade/product name, manufacturer, formulation, related substances, status, SDS revisions, site inventories, uses, and history.

### SDS revision

Product/manufacturer, revision/effective date, document reference, current/superseded status, review metadata.

### Site inventory

Product, Site, storage location, quantity/unit, container type, maximum inventory, status, and observation date/source.

### Chemical use

Product, location, process, task, SEG where applicable, frequency, duration, operating condition, controls, and evidence.

## Rules

- Product and substance identity are not duplicated per Site.
- Several SDS revisions remain visible; current is explicit.
- Inventory does not imply use/exposure.
- Chemical use provides exposure-scenario input but does not itself make an exposure determination.
- Exposure limits are maintained under exposure agents, not chemical/product/inventory records.
- Archive/supersession preserves historical relationships.

## Acceptance criteria

- One product supports multiple sites/storage locations/uses.
- Multiple SDS revisions and related substances are represented without overwriting history.
- Legacy combined chemical records migrate or create reviewable mapping findings.

## Implemented application states and routes

- List, create, detail, edit, archive, restore, missing relationship, validation failure, stale revision, and database-unavailable states are represented on the canonical screens.
- SDS add/detail/edit and atomic Mark Current flows are nested under `/master/products/:productId/sds`.
- Migration evidence and finding disposition are available at `/migration/chemicals`.
- `/hse/chemicals` is a compatibility redirect to `/master/products`; the combined CRUD route is no longer registered.
- Typed Chemical domain, application, repository, and production UI modules are guarded by a static legacy-import boundary test.
