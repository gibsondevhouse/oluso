import type { LifecycleMetadata } from "./lifecycle.types";

export type ProcessStatus = "active" | "inactive" | "under-review";
export type ProcessCategory =
  | "Formulation"
  | "Packaging"
  | "Storage"
  | "Transfer"
  | "Cleaning"
  | "Maintenance"
  | "Waste Handling";

export interface ProcessRecord extends LifecycleMetadata {
  id: string;
  name: string;
  locationId: string;
  category: ProcessCategory;
  description: string;
  status: ProcessStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ProcessInput {
  name: string;
  locationId: string;
  category: ProcessCategory;
  description: string;
  status: ProcessStatus;
}

export interface ProcessValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ProcessInput, string>>;
}

export const PROCESS_STATUSES: ProcessStatus[] = ["active", "inactive", "under-review"];
export const PROCESS_CATEGORIES: ProcessCategory[] = [
  "Formulation",
  "Packaging",
  "Storage",
  "Transfer",
  "Cleaning",
  "Maintenance",
  "Waste Handling",
];

export function validateProcessInput(input: ProcessInput): ProcessValidationResult {
  const errors: ProcessValidationResult["errors"] = {};

  if (!input.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!input.category.trim()) {
    errors.category = "Category is required.";
  } else if (!PROCESS_CATEGORIES.includes(input.category)) {
    errors.category = `Category must be one of: ${PROCESS_CATEGORIES.join(", ")}.`;
  }

  if (!PROCESS_STATUSES.includes(input.status)) {
    errors.status = "Status is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getProcessStatusTone(status: ProcessStatus) {
  if (status === "active") return "active";
  if (status === "under-review") return "medium";
  return "inactive";
}

export function getProcessStatusLabel(status: ProcessStatus) {
  if (status === "under-review") return "Under Review";
  return status.charAt(0).toUpperCase() + status.slice(1);
}
