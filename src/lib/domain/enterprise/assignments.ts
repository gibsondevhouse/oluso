import type { FoundationRecordMetadata, FoundationRecordStatus } from "../foundation/validation";

export const ORGANIZATION_LOCATION_RELATIONSHIP_TYPES = [
  "Owns", "Leases", "Operates", "Manages", "Occupies", "Supports",
  "Provides HSE Support To", "Provides Laboratory Support To", "Provides Maintenance Support To",
  "Provides Medical Support To", "Has Regulatory Jurisdiction Over", "Contracts Work At", "Other",
] as const;
export type OrganizationLocationRelationshipType = (typeof ORGANIZATION_LOCATION_RELATIONSHIP_TYPES)[number];

export interface OrganizationLocationAssignment extends FoundationRecordMetadata {
  organizationId: string;
  locationId: string;
  relationshipType: OrganizationLocationRelationshipType;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isPrimary: boolean;
  scopeDescription: string;
  status: FoundationRecordStatus;
  notes: string;
}

export type OrganizationLocationAssignmentFields = Omit<
  OrganizationLocationAssignment,
  keyof FoundationRecordMetadata | "effectiveFrom" | "effectiveTo" | "isPrimary" | "scopeDescription" | "notes"
> & {
  businessId?: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isPrimary?: boolean;
  scopeDescription?: string;
  notes?: string;
};

export const ORGANIZATION_FUNCTION_RESPONSIBILITY_TYPES = [
  "Accountable", "Responsible", "Supporting", "Consulted", "Oversight",
  "Contracted Operator", "Service Provider", "Regulatory Authority", "Other",
] as const;
export type OrganizationFunctionResponsibilityType = (typeof ORGANIZATION_FUNCTION_RESPONSIBILITY_TYPES)[number];

export interface OrganizationFunctionResponsibility extends FoundationRecordMetadata {
  organizationId: string;
  operationalFunctionId: string;
  locationId: string | null;
  responsibilityType: OrganizationFunctionResponsibilityType;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  isPrimary: boolean;
  scopeDescription: string;
  status: FoundationRecordStatus;
  notes: string;
}

export type OrganizationFunctionResponsibilityFields = Omit<
  OrganizationFunctionResponsibility,
  keyof FoundationRecordMetadata | "effectiveFrom" | "effectiveTo" | "isPrimary" | "scopeDescription" | "notes"
> & {
  businessId?: string;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  isPrimary?: boolean;
  scopeDescription?: string;
  notes?: string;
};

export function hasValidEffectivePeriod(effectiveFrom?: string | null, effectiveTo?: string | null) {
  return !effectiveFrom || !effectiveTo || effectiveTo >= effectiveFrom;
}

export function organizationAssignmentIsEffective(
  assignment: Pick<OrganizationLocationAssignment | OrganizationFunctionResponsibility,
    "effectiveFrom" | "effectiveTo" | "status" | "lifecycleStatus">,
  onDate = new Date().toISOString().slice(0, 10),
) {
  return assignment.lifecycleStatus === "active" && assignment.status === "Active" &&
    (!assignment.effectiveFrom || assignment.effectiveFrom <= onDate) &&
    (!assignment.effectiveTo || assignment.effectiveTo >= onDate);
}
