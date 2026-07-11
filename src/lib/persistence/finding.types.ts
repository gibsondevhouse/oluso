import type { LifecycleMetadata } from "./lifecycle.types";

export type FindingSeverity = "Low" | "Medium" | "High" | "Critical";
export type FindingStatus =
  | "Draft"
  | "Open"
  | "Under Review"
  | "In Progress"
  | "Requires Action"
  | "Closed";
export type FindingType =
  | "Inspection Finding"
  | "Audit Finding"
  | "Observation"
  | "Near Miss"
  | "Environmental Finding"
  | "IH Observation"
  | "Unsafe Condition"
  | "Unsafe Behavior";

export interface FindingRecord extends LifecycleMetadata {
  id: string;
  title: string;
  type: FindingType;
  description: string;
  locationId: string;
  processId: string;
  hazardId: string;
  severity: FindingSeverity;
  status: FindingStatus;
  reportedBy: string;
  activityDate?: string;
  equipmentId?: string;
  chemicalId?: string;
  controlId?: string;
  scope?: string;
  criteriaReference?: string;
  evidenceReference?: string;
  followUpRequired?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FindingInput {
  title: string;
  type: FindingType;
  description: string;
  locationId: string;
  processId: string;
  hazardId: string;
  severity: FindingSeverity;
  status: FindingStatus;
  reportedBy: string;
  activityDate?: string;
  equipmentId?: string;
  chemicalId?: string;
  controlId?: string;
  scope?: string;
  criteriaReference?: string;
  evidenceReference?: string;
  followUpRequired?: boolean;
  notes?: string;
}

export interface FindingValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof FindingInput, string>>;
}

export const FINDING_SEVERITIES: FindingSeverity[] = ["Low", "Medium", "High", "Critical"];
export const FINDING_STATUSES: FindingStatus[] = [
  "Draft",
  "Open",
  "Under Review",
  "In Progress",
  "Requires Action",
  "Closed",
];
export const FINDING_TYPES: FindingType[] = [
  "Inspection Finding",
  "Audit Finding",
  "Observation",
  "Near Miss",
  "Environmental Finding",
  "IH Observation",
  "Unsafe Condition",
  "Unsafe Behavior",
];

export function validateFindingInput(input: FindingInput): FindingValidationResult {
  const errors: FindingValidationResult["errors"] = {};

  if (!input.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!input.type) {
    errors.type = "Finding type is required.";
  } else if (!FINDING_TYPES.includes(input.type)) {
    errors.type = `Finding type must be one of: ${FINDING_TYPES.join(", ")}.`;
  }

  if (!input.locationId.trim()) {
    errors.locationId = "Location is required.";
  }

  if (!FINDING_SEVERITIES.includes(input.severity)) {
    errors.severity = "Severity is required.";
  }

  if (!FINDING_STATUSES.includes(input.status)) {
    errors.status = "Status is required.";
  }

  if (
    (input.type === "Inspection Finding" || input.type === "Audit Finding") &&
    !input.scope?.trim()
  ) {
    errors.scope = "Scope is required for inspection and audit findings.";
  }

  if (input.type === "Audit Finding" && !input.criteriaReference?.trim()) {
    errors.criteriaReference = "Criteria reference is required for audit findings.";
  }

  if (
    input.followUpRequired !== undefined &&
    typeof input.followUpRequired !== "boolean"
  ) {
    errors.followUpRequired = "Follow-up required must be true or false.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getFindingSeverityTone(severity: FindingSeverity) {
  return severity.toLowerCase() as "low" | "medium" | "high" | "critical";
}

export function getFindingStatusTone(status: FindingStatus) {
  if (status === "In Progress" || status === "Under Review") {
    return "progress";
  }

  if (status === "Draft") {
    return "neutral";
  }

  return status === "Closed" ? "closed" : "open";
}
