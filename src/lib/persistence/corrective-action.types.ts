import type { LifecycleMetadata } from "./lifecycle.types";

export type CorrectiveActionStatus =
  | "Created"
  | "Assigned"
  | "In Progress"
  | "Completed"
  | "Verified"
  | "Closed"
  | "Canceled"
  | "Deferred"
  | "Reopened"
  | "Blocked";
export type CorrectiveActionPriority = "Low" | "Medium" | "High" | "Critical";
export type CorrectiveActionSourceType =
  | "Finding"
  | "Hazard"
  | "Incident"
  | "Compliance Item"
  | "Manual";
export type CorrectiveActionType =
  | "Engineering Control"
  | "Administrative Control"
  | "PPE"
  | "Training"
  | "Housekeeping"
  | "Maintenance"
  | "Investigation"
  | "Other";

export interface CorrectiveActionRecord extends LifecycleMetadata {
  id: string;
  title: string;
  type: CorrectiveActionType;
  description: string;
  findingId: string;
  sourceType: CorrectiveActionSourceType;
  sourceId: string;
  sourceJustification: string;
  assignedTo: string;
  priority: CorrectiveActionPriority;
  status: CorrectiveActionStatus;
  dueDate: string;
  completionSummary: string;
  completedAt: string | null;
  verificationRequired: boolean;
  verificationMethod: string;
  verificationResult: string;
  evidenceReference: string;
  verifiedAt: string | null;
  closedAt: string | null;
  closureNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface CorrectiveActionInput {
  title: string;
  type: CorrectiveActionType;
  description: string;
  findingId: string;
  sourceType: CorrectiveActionSourceType;
  sourceId: string;
  sourceJustification: string;
  assignedTo: string;
  priority: CorrectiveActionPriority;
  status: CorrectiveActionStatus;
  dueDate: string;
  completionSummary: string;
  verificationRequired: boolean;
  verificationMethod: string;
  verificationResult: string;
  evidenceReference: string;
  closureNotes: string;
}

export interface CorrectiveActionValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof CorrectiveActionInput, string>>;
}

export const CORRECTIVE_ACTION_STATUSES: CorrectiveActionStatus[] = [
  "Created",
  "Assigned",
  "In Progress",
  "Completed",
  "Verified",
  "Closed",
  "Canceled",
  "Deferred",
  "Reopened",
  "Blocked",
];
export const CORRECTIVE_ACTION_PRIORITIES: CorrectiveActionPriority[] = [
  "Low",
  "Medium",
  "High",
  "Critical",
];
export const CORRECTIVE_ACTION_SOURCE_TYPES: CorrectiveActionSourceType[] = [
  "Finding",
  "Hazard",
  "Incident",
  "Compliance Item",
  "Manual",
];
export const CORRECTIVE_ACTION_TYPES: CorrectiveActionType[] = [
  "Engineering Control",
  "Administrative Control",
  "PPE",
  "Training",
  "Housekeeping",
  "Maintenance",
  "Investigation",
  "Other",
];

const COMPLETION_STATUSES: CorrectiveActionStatus[] = ["Completed", "Verified", "Closed"];
const VERIFICATION_STATUSES: CorrectiveActionStatus[] = ["Verified", "Closed"];

export function validateCorrectiveActionInput(
  input: CorrectiveActionInput,
): CorrectiveActionValidationResult {
  const errors: CorrectiveActionValidationResult["errors"] = {};

  if (!input.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!input.type) {
    errors.type = "Corrective action type is required.";
  } else if (!CORRECTIVE_ACTION_TYPES.includes(input.type)) {
    errors.type = `Corrective action type must be one of: ${CORRECTIVE_ACTION_TYPES.join(", ")}.`;
  }

  if (!CORRECTIVE_ACTION_SOURCE_TYPES.includes(input.sourceType)) {
    errors.sourceType = "Source type is required.";
  }

  if (input.sourceType === "Manual") {
    if (!input.sourceJustification.trim()) {
      errors.sourceJustification = "Manual source justification is required.";
    }
  } else if (!input.sourceId.trim()) {
    errors.sourceId = "Source record is required.";
  }

  if (input.sourceType === "Finding" && !input.findingId.trim() && !input.sourceId.trim()) {
    errors.findingId = "Finding source is required.";
  }

  if (!input.assignedTo.trim()) {
    errors.assignedTo = "Assigned to is required.";
  }

  if (!CORRECTIVE_ACTION_PRIORITIES.includes(input.priority)) {
    errors.priority = "Priority is required.";
  }

  if (!CORRECTIVE_ACTION_STATUSES.includes(input.status)) {
    errors.status = "Status is required.";
  }

  if (!input.dueDate.trim()) {
    errors.dueDate = "Due date is required.";
  }

  if (COMPLETION_STATUSES.includes(input.status) && !input.completionSummary.trim()) {
    errors.completionSummary = "Completion summary is required before completion, verification, or closure.";
  }

  if (input.verificationRequired && VERIFICATION_STATUSES.includes(input.status)) {
    if (!input.verificationMethod.trim()) {
      errors.verificationMethod = "Verification method is required before verification or closure.";
    }

    if (!input.verificationResult.trim()) {
      errors.verificationResult = "Verification result is required before verification or closure.";
    }
  }

  if (input.status === "Closed" && input.verificationRequired && !input.verificationResult.trim()) {
    errors.verificationResult = "Verified actions require a verification result before closure.";
  }

  if (input.status === "Closed" && !input.closureNotes.trim()) {
    errors.closureNotes = "Closure summary is required when closing a corrective action.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getCorrectiveActionStatusTone(status: CorrectiveActionStatus) {
  if (status === "Created" || status === "Assigned" || status === "Reopened" || status === "Blocked") {
    return "open";
  }

  if (status === "In Progress" || status === "Completed" || status === "Deferred") {
    return "progress";
  }

  return "closed";
}

export function getCorrectiveActionPriorityTone(priority: CorrectiveActionPriority) {
  return priority.toLowerCase() as "low" | "medium" | "high" | "critical";
}
