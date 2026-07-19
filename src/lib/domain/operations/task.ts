import {
  FOUNDATION_RECORD_STATUSES, requiredChoice, requiredText, result, validateBusinessId,
  type FoundationRecordMetadata, type FoundationRecordStatus,
} from "../foundation/validation";

export const TASK_TYPES = [
  "Routine Operation", "Startup", "Shutdown", "Cleaning", "Maintenance", "Troubleshooting",
  "Material Transfer", "Sampling", "Packaging", "Contractor Work", "Emergency Response", "Other",
] as const;
export const ROUTINE_CLASSIFICATIONS = [
  "Normally Routine", "Normally Non-Routine", "May Be Routine or Non-Routine", "Emergency Only", "Unknown",
] as const;
export type TaskType = (typeof TASK_TYPES)[number];
export type RoutineClassification = (typeof ROUTINE_CLASSIFICATIONS)[number];

export interface Task extends FoundationRecordMetadata {
  name: string;
  taskType: TaskType;
  processId: string;
  locationId: string;
  resolvedSiteId: string;
  description: string;
  routineClassification: RoutineClassification;
  status: FoundationRecordStatus;
}

export interface TaskFields {
  businessId?: string;
  name: string;
  taskType: TaskType;
  processId: string;
  locationId: string;
  description?: string;
  routineClassification: RoutineClassification;
  status: FoundationRecordStatus;
}

export function validateTask(input: TaskFields) {
  return result([
    ...validateBusinessId(input.businessId), ...requiredText(input.name, "name", "Name"),
    ...requiredChoice(input.taskType, TASK_TYPES, "taskType", "Task type"),
    ...requiredText(input.processId, "processId", "Process"),
    ...requiredText(input.locationId, "locationId", "Location"),
    ...requiredChoice(input.routineClassification, ROUTINE_CLASSIFICATIONS, "routineClassification", "Routine classification"),
    ...requiredChoice(input.status, FOUNDATION_RECORD_STATUSES, "status", "Status"),
  ]);
}
