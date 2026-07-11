import type { LifecycleMetadata } from "./lifecycle.types";

export type SegStatus = "active" | "inactive" | "under-review";
export type ExposureLevel = "Low" | "Medium" | "High" | "Critical";
export type SegType =
  | "Similar Exposure Group"
  | "Task-Based Group"
  | "Area-Based Group"
  | "Role-Based Group";

export interface SegRecord extends LifecycleMetadata {
  id: string;
  name: string;
  type: SegType;
  description: string;
  locationId: string;
  processId: string;
  chemicalIds: string[];
  hazardIds: string[];
  agentType: string;
  exposureLevel: ExposureLevel;
  workerCount: string;
  controls: string;
  monitoringFrequency: string;
  status: SegStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SegInput {
  name: string;
  type: SegType;
  description: string;
  locationId: string;
  processId: string;
  chemicalIds: string[];
  hazardIds: string[];
  agentType: string;
  exposureLevel: ExposureLevel;
  workerCount: string;
  controls: string;
  monitoringFrequency: string;
  status: SegStatus;
}

export interface SegValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof SegInput, string>>;
}

export const SEG_STATUSES: SegStatus[] = ["active", "inactive", "under-review"];
export const SEG_TYPES: SegType[] = [
  "Similar Exposure Group",
  "Task-Based Group",
  "Area-Based Group",
  "Role-Based Group",
];
export const EXPOSURE_LEVELS: ExposureLevel[] = ["Low", "Medium", "High", "Critical"];
export const MONITORING_FREQUENCIES: string[] = [
  "Daily",
  "Weekly",
  "Monthly",
  "Quarterly",
  "Annually",
  "As Required",
];

export function validateSegInput(input: SegInput): SegValidationResult {
  const errors: SegValidationResult["errors"] = {};

  if (!input.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!input.type) {
    errors.type = "SEG type is required.";
  } else if (!SEG_TYPES.includes(input.type)) {
    errors.type = `SEG type must be one of: ${SEG_TYPES.join(", ")}.`;
  }

  if (!input.locationId.trim()) {
    errors.locationId = "Location is required.";
  }

  if (!input.agentType.trim()) {
    errors.agentType = "Agent type is required.";
  }

  if (!EXPOSURE_LEVELS.includes(input.exposureLevel)) {
    errors.exposureLevel = "Exposure level is required.";
  }

  if (!SEG_STATUSES.includes(input.status)) {
    errors.status = "Status is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getExposureLevelTone(level: ExposureLevel) {
  return level.toLowerCase() as "low" | "medium" | "high" | "critical";
}

export function getSegStatusTone(status: SegStatus) {
  if (status === "active") return "active";
  if (status === "under-review") return "medium";
  return "inactive";
}

export function getSegStatusLabel(status: SegStatus) {
  if (status === "under-review") return "Under Review";
  return status.charAt(0).toUpperCase() + status.slice(1);
}
