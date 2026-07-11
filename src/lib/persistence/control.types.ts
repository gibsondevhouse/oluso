import type { LifecycleMetadata } from "./lifecycle.types";

export type ControlStatus = "active" | "needs-review" | "ineffective" | "retired";
export type ControlType =
  | "Engineering"
  | "Administrative"
  | "PPE"
  | "Training"
  | "Housekeeping"
  | "Emergency"
  | "Other";

export interface ControlRecord extends LifecycleMetadata {
  id: string;
  name: string;
  type: ControlType;
  hazardIds: string[];
  description: string;
  owner: string;
  verificationMethod: string;
  verificationFrequency: string;
  lastVerifiedAt: string;
  status: ControlStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ControlInput {
  name: string;
  type: ControlType;
  hazardIds: string[];
  description: string;
  owner: string;
  verificationMethod: string;
  verificationFrequency: string;
  lastVerifiedAt: string;
  status: ControlStatus;
  notes: string;
}

export interface ControlValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ControlInput, string>>;
}

export const CONTROL_STATUSES: ControlStatus[] = ["active", "needs-review", "ineffective", "retired"];
export const CONTROL_TYPES: ControlType[] = [
  "Engineering",
  "Administrative",
  "PPE",
  "Training",
  "Housekeeping",
  "Emergency",
  "Other",
];

export function validateControlInput(input: ControlInput): ControlValidationResult {
  const errors: ControlValidationResult["errors"] = {};

  if (!input.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!CONTROL_TYPES.includes(input.type)) {
    errors.type = "Control type is required.";
  }

  if (input.hazardIds.length === 0) {
    errors.hazardIds = "At least one related hazard is required.";
  }

  if (!CONTROL_STATUSES.includes(input.status)) {
    errors.status = "Status is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getControlStatusLabel(status: ControlStatus) {
  if (status === "needs-review") return "Needs Review";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function getControlStatusTone(status: ControlStatus) {
  if (status === "active") return "active";
  if (status === "needs-review") return "medium";
  if (status === "ineffective") return "critical";
  return "inactive";
}
