export const PERSON_LOCATION_ASSIGNMENT_TYPES = [
  "Primary Work Location", "Regular Work Location", "Occasional Work Location", "Temporary Assignment",
  "Contract Assignment", "Emergency Assignment", "Other",
] as const;

export interface PersonLocationAssignment {
  personId: string;
  locationId: string;
  assignmentType: (typeof PERSON_LOCATION_ASSIGNMENT_TYPES)[number];
  effectiveFrom: string | null;
  effectiveTo: string | null;
}

export interface PersonFunctionAssignment {
  personId: string;
  operationalFunctionId: string;
  locationId: string | null;
  roleTitle: string;
  effectiveFrom: string | null;
  effectiveTo: string | null;
}
