# Processes and tasks page specification

Status: Governing target
Active canonical routes: `/operations/processes`, `/operations/tasks`
Last updated: 2026-07-19

## Purpose

Maintain reusable process definitions and discrete work tasks without collapsing task/exposure conditions into a process record.

## Process fields

- Business ID, name, description, owner, status.
- Required primary Operational Function.
- Required Site and compatible primary physical Location.
- One active Primary Process Location assignment plus effective-dated same-Site supporting Locations.
- Procedure/document references.
- Related tasks and equipment.

## Task fields

- Business ID, name, description, status.
- Required parent process.
- Default/more-specific operational location.
- Task type and descriptive routine classification.
- Related equipment and chemical uses.

Task routine classification describes whether the activity is normally routine, normally non-routine, variable, emergency-only, or unknown. Operating condition, frequency, duration, controls, exposure routes, and deviations belong on Chemical Use, `ExposureScenario`, sampling, or event context.

## Interface

- Process register and detail with nested task list.
- Site → Location → assigned Function Process-create sequence.
- Process Location panel for Source, Destination, Transfer Path, Supporting, Storage, Staging, Waste, Emergency, and other same-Site relationships.
- Create task in current Process/Unit context.
- Relationship panels for chemical use, scenarios, controls, assurance, and data gaps.
- Archive/history/package attribution.

## Validation

- Task requires an active or historically valid process.
- Process primary Location requires the selected active Operational Function assignment.
- Every Process has exactly one active Primary Location assignment; active supporting Locations resolve to the same Site.
- Task location resolves to the same compatible Site scope as its process unless explicitly modeled as a multi-site process.
- Process archive impact identifies active tasks/scenarios before confirmation.

## Acceptance criteria

- Users can represent routine production, duct clearing, cleanup, and maintenance as distinct tasks.
- Process and task are independently searchable and revisioned.
- Scenario-specific exposure conditions are not forced into reusable master fields.
- Both active routes use typed IndexedDB services and are statically prohibited from importing legacy persistence.
