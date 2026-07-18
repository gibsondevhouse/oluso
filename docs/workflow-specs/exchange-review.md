# Reviewed exchange workflow

Status: Governing
Last updated: 2026-07-18
Decision: [ADR-0010](../adr/ADR-0010-reviewed-exchange-protocol.md)

## Actors

- Exporter: local user producing a package.
- Importer/reviewer: local user evaluating and applying it.
- Source installation and receiving installation: explicit stable identities.

## Export

1. Show dataset ID/revision, installation, user, schema, and last exchange base.
2. Select package scope or all eligible changes since a known base.
3. Resolve required dependency closure for the selected records.
4. Include tombstones and durable review notes within scope.
5. Validate every outgoing record against its versioned schema.
6. Generate canonical manifest/payload and integrity hash.
7. Self-validate the artifact.
8. Download using a clear filename such as `adama-hse-exchange-<date>-<packageId>.json`.
9. Record package metadata without marking it imported/accepted elsewhere.

## Import validation

1. Select a file explicitly.
2. Check byte size and parse with bounded JSON limits.
3. Require the exchange artifact type/version.
4. Validate manifest, package identity, dataset ID, schema support, record schemas, dependency references, counts, and hash.
5. Reject packages from another dataset unless an explicit migration/import workflow handles them.
6. Reject a package that claims this receiving installation as an inappropriate source where loop rules prohibit it.
7. Detect an already applied package and show the existing import run without new mutation.

## Dry-run classification

For each record/tombstone, compare base, current local, and external revision/fingerprint:

| Classification | Meaning | Default handling |
| --- | --- | --- |
| New | Absent locally; dependencies valid. | Acceptable after preview. |
| Identical | Local and external semantic content match. | No-op. |
| Updated only locally | Local changed; external equals base/older. | Keep local; report stale external. |
| Updated only externally | External changed; local equals base. | Acceptable after preview. |
| Conflicting | Local and external both changed from base incompatibly. | Blocking manual resolution. |
| Deleted externally | External tombstone targets a local record. | Blocking review/impact decision. |
| Missing dependency | Required related record unavailable. | Blocking until dependency included/resolved. |
| Invalid schema | Record fails supported schema. | Reject/block. |
| Stale revision | Package revision/order cannot be reconciled safely. | Keep local; require review. |

Classification is deterministic and tested independently of the UI.

## Conflict resolution

- Show base, local, and external values with record/revision/actor/package metadata.
- Allow whole-record local/external selection or field-level merge only when the entity schema permits it.
- Re-run domain validation after any manual merge.
- Require resolver and rationale.
- Never auto-merge professional determination fields, delete intent, or incompatible relationship changes without explicit user choice.

## Apply

1. Show final accepted/no-op/rejected/resolved counts.
2. Generate and validate a rollback snapshot/package of current state.
3. Require final confirmation identifying dataset revision impact.
4. Apply all accepted records, revisions, notes, tombstones, resolutions, import history, and dataset revision in one transaction.
5. Re-run postconditions before commit.
6. On error, abort and retain the pre-import dataset.
7. On success, show resulting revisions and unresolved/rejected items.

## Rollback

Rollback is an attributed compensating/recovery operation linked to the `ImportRun`; it does not erase the import from history. The workflow validates that later local work will not be destroyed and requires explicit review if the dataset has advanced.

## Required tests

- Two installations edit different records.
- Both edit the same record/different fields.
- Both edit the same field.
- Local edit plus external tombstone.
- Dependency added/omitted/archived.
- Same package imported twice.
- Out-of-order/stale package.
- Dataset/schema mismatch.
- Truncated, oversized, deeply nested, duplicate-ID, and hash-invalid packages.
- Failure during apply and rollback generation.
- Review notes across repeated exchanges.
