# 05 — User workflows

Status: Governing
Last updated: 2026-07-18

## Workflow principles

- Preserve context from site baseline to exposure determination.
- Permit useful drafts while making missing and unknown information visible.
- Enforce stronger rules at promotion, review, determination, verification, and closure gates.
- Keep professional conclusions explicit and attributable.
- Never apply exchanged changes without a dry-run preview.
- Keep backup/restore, bulk baseline import, and review exchange separate.

## 1. Establish a site and unit baseline

1. Select or create Country, State/Region, and Site.
2. Select or create the operational Unit/Zone/Subzone hierarchy.
3. Define processes within the unit.
4. Break processes into tasks and operating conditions.
5. Link relevant equipment.
6. Link chemical products through `ChemicalUse`, not through inventory alone.
7. Identify people/roles and establish effective-dated SEG membership.
8. Record existing controls, evidence references, notes, and data gaps.
9. Review baseline completeness.

The workflow saves drafts throughout and retains the selected context. It must not require the user to visit every underlying register page.

Exit state: the unit has enough canonical context to create exposure scenarios, and outstanding gaps are explicit.

## 2. Create and assess an exposure scenario

1. Start from the unit, task, SEG, chemical use, or exposure-agent context.
2. Confirm SEG, location, process, task, agent, and operating condition.
3. Characterize routes, frequency, duration, variability, affected population, controls, PPE, and control reliability.
4. Record acute/chronic concerns, evidence, unknowns, and data-quality status.
5. Save as draft or promote to assessment-ready when required context is valid.
6. Create an assessment for that scenario.
7. Record qualitative judgment, uncertainty, confidence, representativeness, control evaluation, and data gaps.
8. Set a monitoring priority and rationale.
9. Submit for manager review or proceed to a determination according to status rules.

Exit state: the scenario and assessment explain the exposure potential and why additional evidence or action is or is not required.

## 3. Plan and perform monitoring

1. Create a sampling plan from an assessment/monitoring priority.
2. Define the population, scenarios, analytes/agents, methods, sample types, durations, quality controls, and responsibilities.
3. Record an actual sampling event, including deviations and operating conditions.
4. Record individual samples with precise timing and collection metadata.
5. Record laboratory/instrument results, qualifiers, units, LOD/LOQ, and report references.
6. Select applicable versioned exposure limits.
7. Calculate comparisons only when units, dimensions, duration, and basis are compatible.
8. Record a professional interpretation addressing representativeness, uncertainty, unusual conditions, PPE context, and implications.
9. Update or create the professional determination explicitly.

The system must not reduce this workflow to `result > limit`.

## 4. Issue and review a determination

1. Select the assessment and supporting evidence.
2. Record category, rationale, limitations, confidence, and applicability.
3. Identify required controls, monitoring, programs, surveillance administration, actions, and reassessment.
4. Submit the exact record revision for review.
5. The manager accepts, requests changes, or rejects with notes.
6. Any later conclusion supersedes rather than overwrites the prior determination.

Exit state: a reader can identify who made the conclusion, which evidence and scenario revision supported it, and what follow-up is required.

## 5. Verify controls and close actions

1. Create an action from a finding, incident, assessment, determination, control verification, or justified manual source.
2. Assign responsibility and a due date.
3. Record implementation evidence and mark completion.
4. A verifier records whether the action addressed the source condition.
5. Close only after required verification is accepted.
6. Trigger reassessment when the source, failed control, material change, monitoring result, or incident warrants it.

Completion is never treated as verification.

## 6. Exchange reviewed work between installations

1. Confirm local user, installation, dataset, schema, and dataset revision.
2. Select a scope or changes since a known base revision.
3. Generate a package with records, tombstones, review notes, manifest, and integrity hash.
4. Transfer the file manually through OneDrive.
5. Validate file structure, dataset identity, schema, package identity, dependencies, and integrity.
6. Run a non-mutating classification: New, Identical, Updated only locally, Updated only externally, Conflicting, Deleted externally, Missing dependency, Invalid schema, or Stale revision.
7. Show a summary and record-level side-by-side diff.
8. Require explicit resolution for blocking conflicts and external deletion decisions.
9. Create a pre-apply rollback package.
10. Apply accepted changes atomically, writing record revisions and import history.
11. Show the resulting dataset revision and unresolved/rejected items.

No exchange option may silently overwrite current records or ignore same-ID updates.

## 7. Back up and restore

1. Export a complete versioned snapshot with manifest and integrity hash.
2. Save it to a user-selected secure location.
3. Validate a selected backup before restore.
4. Show dataset identity, schema, record counts, creation time, and compatibility.
5. Create a backup of the current state before replacement.
6. Restore atomically and verify the resulting database.

Restore is disaster recovery. It is not collaboration and not a conflict-resolution shortcut.

## 8. Review baseline completeness

The dashboard computes completeness by site/unit from source records and links every gap to an action surface.

```text
Unit 7 baseline completeness

Locations                 Complete
Processes                 Complete
Tasks                     60%
Chemical uses             45%
SEGs                      Draft
Exposure scenarios        Missing
Controls                  Partial
Monitoring history        Missing
Reassessment schedule     Missing
```

Completeness definitions are versioned rules. A percentage is never shown without an explanation of its denominator and missing requirements.
