# Record lifecycle workflow

Status: Governing
Last updated: 2026-07-18

## Separate state dimensions

Do not force every entity into one universal status enum. Keep these dimensions distinct where applicable:

- Draft/readiness.
- Active/inactive/archive.
- Review/approval.
- Completion/verification/closure.
- Current/superseded.
- Exchange conflict/tombstone state.

## Common transitions

- Create: revision 1 with actor/installation attribution.
- Update: requires expected revision and creates the next immutable revision.
- Archive: requires reason, records actor/time, preserves dependencies/history.
- Restore: validates parents/dependencies/uniqueness and creates a new revision.
- Supersede: creates/activates a new current conclusion/revision object while retaining the prior record.
- Complete: records that work was performed; does not imply verification.
- Verify: records independent confirmation and evidence.
- Close: allowed only after domain-required verification/review.
- Tombstone: represents reviewable external deletion/retirement intent.

## Drafts

Draft domain records may be persisted when a workflow spans field sessions. They are visible as incomplete and cannot be promoted/reviewed until required gates pass. Temporary unsaved form input remains distinct from a saved draft.

## History

Audit history is required now, not a future feature. Every accepted transition writes `RecordRevision` in the same transaction as current state. History includes operation, actor, source, reason, before/after, and exchange package where applicable.

## UI

- Show only valid transitions for the record and current revision.
- Confirm archive, supersession, tombstone resolution, and destructive recovery actions with impact summaries.
- Show archived/superseded dependencies on historical records.
- If revision changed while editing, show compare/reload/copy-draft recovery rather than overwrite.

## Acceptance criteria

- Lifecycle behavior is typed per domain and revisioned.
- Completion, verification, closure, archive, and approval cannot be conflated.
- History reconstructs every accepted transition.
- Exchange tombstones never trigger blind hard deletion.
