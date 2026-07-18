# Processes and tasks page specification

Status: Governing target
Canonical routes: `/master/processes`, `/master/tasks`
Last updated: 2026-07-18

## Purpose

Maintain reusable process definitions and discrete work tasks without collapsing task/exposure conditions into a process record.

## Process fields

- Business ID, name, description, owner, status.
- One or more valid operational locations/Site scope.
- Procedure/document references.
- Related tasks and equipment.

## Task fields

- Business ID, name, description, status.
- Required parent process.
- Default/more-specific operational location.
- Task category and expected work pattern.
- Related equipment and chemical uses.

Operating condition, frequency, duration, controls, and exposure routes that vary by scenario belong on `ExposureScenario`/relationships, not as one flattened task/process conclusion.

## Interface

- Process register and detail with nested task list.
- Create task in current Process/Unit context.
- Relationship panels for chemical use, scenarios, controls, assurance, and data gaps.
- Archive/history/package attribution.

## Validation

- Task requires an active or historically valid process.
- Task location resolves to the same compatible Site scope as its process unless explicitly modeled as a multi-site process.
- Process archive impact identifies active tasks/scenarios before confirmation.

## Acceptance criteria

- Users can represent routine production, duct clearing, cleanup, and maintenance as distinct tasks.
- Process and task are independently searchable and revisioned.
- Scenario-specific exposure conditions are not forced into reusable master fields.
