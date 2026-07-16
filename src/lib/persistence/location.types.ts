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
  country: string;
  stateProvince: string;
  description: string;
  status: LocationStatus;
  createdAt: string;
  updatedAt: string;
}

export interface LocationInput {
  name: string;
  type: LocationType;
  parentLocationId?: string;
  country?: string;
  stateProvince?: string;
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

export const LOCATION_COUNTRIES = [
  "United States",
  "Canada",
  "Mexico",
  "United Kingdom",
  "Australia",
  "Other / International",
];

export const LOCATION_STATE_PROVINCES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "District of Columbia",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
  "Alberta",
  "British Columbia",
  "Manitoba",
  "New Brunswick",
  "Newfoundland and Labrador",
  "Nova Scotia",
  "Ontario",
  "Prince Edward Island",
  "Quebec",
  "Saskatchewan",
  "Other / International",
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

  if (input.country?.trim() && !LOCATION_COUNTRIES.includes(input.country.trim())) {
    errors.country = `Country must be one of: ${LOCATION_COUNTRIES.join(", ")}.`;
  }

  if (
    input.stateProvince?.trim() &&
    !LOCATION_STATE_PROVINCES.includes(input.stateProvince.trim())
  ) {
    errors.stateProvince = `State / province must be one of the configured options.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
