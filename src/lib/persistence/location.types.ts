import type { LifecycleMetadata } from "./lifecycle.types";

export type LocationStatus = "active" | "inactive";
export type LocationType =
  | "Facility"
  | "Production Area"
  | "Storage"
  | "Lab"
  | "Office"
  | "Utility Area"
  | "Outdoor Area";

export interface LocationRecord extends LifecycleMetadata {
  id: string;
  name: string;
  type: LocationType;
  parentLocationId: string;
  description: string;
  status: LocationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LocationInput {
  name: string;
  type: LocationType;
  parentLocationId?: string;
  description: string;
  status: LocationStatus;
}

export interface LocationValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof LocationInput, string>>;
}

export const LOCATION_STATUSES: LocationStatus[] = ["active", "inactive"];
export const LOCATION_TYPES: LocationType[] = [
  "Facility",
  "Production Area",
  "Storage",
  "Lab",
  "Office",
  "Utility Area",
  "Outdoor Area",
];

export function validateLocationInput(input: LocationInput): LocationValidationResult {
  const errors: LocationValidationResult["errors"] = {};

  if (!input.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!input.type.trim()) {
    errors.type = "Type is required.";
  } else if (!LOCATION_TYPES.includes(input.type)) {
    errors.type = `Type must be one of: ${LOCATION_TYPES.join(", ")}.`;
  }

  if (!LOCATION_STATUSES.includes(input.status)) {
    errors.status = "Status must be active or inactive.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
