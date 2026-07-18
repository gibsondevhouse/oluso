# Unit baseline workspace specification

Status: Governing target
Route: `/baseline/[locationId]`
Last updated: 2026-07-18

## Purpose

Capture a plant/unit baseline in one contextual workspace without requiring users to navigate among disconnected registers.

## Preconditions

- `locationId` resolves to a Site or operational descendant.
- Local user/dataset/installation identities are initialized.
- Browser database is writable.

## Workspace sections

1. Location hierarchy and unit description.
2. Processes and tasks.
3. Equipment.
4. Chemical inventory/use.
5. People, roles, SEGs, and membership gaps.
6. Exposure scenarios.
7. Existing controls and reliability.
8. Notes, evidence references, and data-quality findings.
9. Completeness summary and review packet.

## Behavior

- Maintain Unit/Site context while editing nested canonical records.
- Save explicit drafts; do not rely on temporary form state for a walkthrough spanning restarts.
- Reuse existing master records and identify likely duplicates.
- Show archived dependencies but prevent new active use when prohibited.
- Allow gap creation when information cannot be resolved in the field.
- Do not create a generic baseline blob as a substitute for canonical entities.

## Completeness

Each section shows rule-set version, Complete/Partial/Draft/Missing/Not Applicable, and actionable missing requirements.

## Acceptance criteria

- Unit 7 can be captured end-to-end without visiting every register.
- The user can resume after browser/laptop restart.
- Every created item appears in its canonical register and history.
- Review packet links to exact record revisions and gaps.
