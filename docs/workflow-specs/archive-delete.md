# Archive, supersede, tombstone, and destructive recovery

Status: Governing
Last updated: 2026-07-18

## Archive

- Default removal from active use.
- Requires reason and expected revision.
- Preview identifies active descendants/dependencies and whether archive is allowed, blocked, or requires coordinated changes.
- Current state and immutable revision are written transactionally.
- Historical relationships remain resolvable.

## Restore

- Validates parent/dependency activity, uniqueness, and current revision.
- Creates a new revision and does not erase prior archive history.

## Supersede

Use for SDS revisions, exposure limits, assessments/determinations, and other versioned conclusions/documents. The prior record remains historically valid and linked to records that used it.

## Exchange tombstone

A tombstone communicates external deletion/retirement intent. Import preview shows local changes and dependency impact. User explicitly accepts, rejects, or resolves it; accepted handling is normally archive/supersede plus revision, not physical deletion.

## Destructive recovery

Physical deletion/reset is exceptional and limited to controlled recovery/privacy obligations under a separately documented procedure. It requires exact target/dataset identification, verified backup where lawful, impact analysis, explicit confirmation, and an audit/recovery record. No generic cascade delete is allowed.

## Acceptance criteria

- Normal users preserve history through archive/supersession.
- No dependent history is silently erased.
- Tombstones are reviewable and attributable.
- Destructive recovery cannot be triggered from ordinary register actions.
