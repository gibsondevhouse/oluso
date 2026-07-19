import { FOUNDATION_RECORD_STATUSES, requiredChoice, requiredText, result, validateBusinessId, type FoundationRecordMetadata, type FoundationRecordStatus } from "./validation";

export const TASK_TYPES = [
  "Routine Operation",
  "Startup",
  "Shutdown",
  "Cleaning",
  "Maintenance",
  "Troubleshooting",
  "Material Transfer",
  "Sampling",
  "Packaging",
  "Contractor Work",
  "Emergency Response",
  "Other",
] as const;

export const OPERATING_CONDITIONS = [
  "Routine",
  "Non-Routine",
  "Startup",
  "Shutdown",
  "Maintenance",
  "Upset",
  "Emergency",
  "Post-Release Cleanup",
] as const;

export const ROUTINE_STATUSES = ["Routine", "Non-Routine"] as const;

export type TaskType = (typeof TASK_TYPES)[number];
export type OperatingCondition = (typeof OPERATING_CONDITIONS)[number];
export type RoutineStatus = (typeof ROUTINE_STATUSES)[number];

export interface Task extends FoundationRecordMetadata {
  name: string;
  taskType: TaskType;
  processId: string;
  locationId: string;
  resolvedSiteId: string;
  description: string;
  routineStatus: RoutineStatus;
  operatingCondition: OperatingCondition;
  status: FoundationRecordStatus;
}

export interface TaskFields {
  businessId?: string;
  name: string;
  taskType: TaskType;
  processId: string;
  locationId: string;
  description?: string;
  routineStatus: RoutineStatus;
  operatingCondition: OperatingCondition;
  status: FoundationRecordStatus;
}

export function validateTask(input: TaskFields) {
  return result([
    ...validateBusinessId(input.businessId),
    ...requiredText(input.name, "name", "Name"),
    ...requiredChoice(input.taskType, TASK_TYPES, "taskType", "Task type"),
    ...requiredText(input.processId, "processId", "Process"),
    ...requiredText(input.locationId, "locationId", "Location"),
    ...requiredChoice(input.routineStatus, ROUTINE_STATUSES, "routineStatus", "Routine status"),
    ...requiredChoice(input.operatingCondition, OPERATING_CONDITIONS, "operatingCondition", "Operating condition"),
    ...requiredChoice(input.status, FOUNDATION_RECORD_STATUSES, "status", "Status"),
  ]);
}
