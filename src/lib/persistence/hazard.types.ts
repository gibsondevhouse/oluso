import type { LifecycleMetadata } from "./lifecycle.types";

export type HazardStatus = "active" | "mitigated" | "closed";
export type HazardSeverity = "Low" | "Medium" | "High" | "Critical";
export type HazardLikelihood = "Rare" | "Unlikely" | "Possible" | "Likely" | "Almost Certain";
export type HazardCategory =
  | "Chemical"
  | "Physical"
  | "Biological"
  | "Ergonomic"
  | "Environmental"
  | "Fire/Explosion"
  | "Confined Space"
  | "Equipment";

export interface HazardRecord extends LifecycleMetadata {
  id: string;
  title: string;
  category: HazardCategory;
  locationId: string;
  locationIds: string[];
  processIds: string[];
  chemicalIds: string[];
  severity: HazardSeverity;
  likelihood: HazardLikelihood;
  description: string;
  controls: string;
  status: HazardStatus;
  createdAt: string;
  updatedAt: string;
}

export interface HazardInput {
  title: string;
  category: HazardCategory;
  locationId: string;
  locationIds: string[];
  processIds: string[];
  chemicalIds: string[];
  severity: HazardSeverity;
  likelihood: HazardLikelihood;
  description: string;
  controls: string;
  status: HazardStatus;
}

export interface HazardValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof HazardInput, string>>;
}

export const HAZARD_STATUSES: HazardStatus[] = ["active", "mitigated", "closed"];
export const HAZARD_SEVERITIES: HazardSeverity[] = ["Low", "Medium", "High", "Critical"];
export const HAZARD_LIKELIHOODS: HazardLikelihood[] = [
  "Rare",
  "Unlikely",
  "Possible",
  "Likely",
  "Almost Certain",
];
export const HAZARD_CATEGORIES: HazardCategory[] = [
  "Chemical",
  "Physical",
  "Biological",
  "Ergonomic",
  "Environmental",
  "Fire/Explosion",
  "Confined Space",
  "Equipment",
];

export function validateHazardInput(input: HazardInput): HazardValidationResult {
  const errors: HazardValidationResult["errors"] = {};

  if (!input.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!input.category) {
    errors.category = "Category is required.";
  } else if (!HAZARD_CATEGORIES.includes(input.category)) {
    errors.category = `Category must be one of: ${HAZARD_CATEGORIES.join(", ")}.`;
  }

  if (!input.locationId.trim()) {
    errors.locationId = "Location is required.";
  }

  if (!HAZARD_SEVERITIES.includes(input.severity)) {
    errors.severity = "Severity is required.";
  }

  if (!HAZARD_LIKELIHOODS.includes(input.likelihood)) {
    errors.likelihood = "Likelihood is required.";
  }

  if (!HAZARD_STATUSES.includes(input.status)) {
    errors.status = "Status is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getHazardSeverityTone(severity: HazardSeverity) {
  return severity.toLowerCase() as "low" | "medium" | "high" | "critical";
}

export function getHazardStatusTone(status: HazardStatus) {
  if (status === "active") return "open";
  if (status === "mitigated") return "medium";
  return "closed";
}

export function getHazardStatusLabel(status: HazardStatus) {
  if (status === "mitigated") return "Mitigated";
  return status.charAt(0).toUpperCase() + status.slice(1);
}
