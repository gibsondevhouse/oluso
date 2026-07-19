import type { FoundationRecordMetadata, FoundationRecordStatus } from "../foundation/validation";

export const LOCATION_FUNCTION_ASSIGNMENT_TYPES = [
  "Primary Function", "Supporting Function", "Occasional Function", "Contracted Function",
  "Tolling Function", "Shared Function", "Emergency Function", "Temporary Function",
  "Planned Function", "Other",
] as const;
export type LocationFunctionAssignmentType = (typeof LOCATION_FUNCTION_ASSIGNMENT_TYPES)[number];

export interface LocationFunctionAssignment extends FoundationRecordMetadata {
  locationId: string;
  operationalFunctionId: string;
  assignmentType: LocationFunctionAssignmentType;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isPrimary: boolean;
  scopeDescription: string;
  responsibleOrganizationId: string | null;
  responsiblePersonId: string | null;
  status: FoundationRecordStatus;
  notes: string;
}

export type LocationFunctionAssignmentFields = Omit<
  LocationFunctionAssignment,
  keyof FoundationRecordMetadata | "effectiveFrom" | "effectiveTo" | "isPrimary" | "scopeDescription" | "responsibleOrganizationId" | "responsiblePersonId" | "notes"
> & {
  businessId?: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isPrimary?: boolean;
  scopeDescription?: string;
  responsibleOrganizationId?: string | null;
  responsiblePersonId?: string | null;
  notes?: string;
};

export function assignmentIsEffective(
  assignment: Pick<LocationFunctionAssignment, "effectiveFrom" | "effectiveTo" | "status" | "lifecycleStatus">,
  onDate = new Date().toISOString().slice(0, 10),
) {
  return assignment.lifecycleStatus === "active" && assignment.status === "Active" &&
    (!assignment.effectiveFrom || assignment.effectiveFrom <= onDate) &&
    (!assignment.effectiveTo || assignment.effectiveTo >= onDate);
}
