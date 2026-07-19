import { FOUNDATION_RECORD_STATUSES, requiredChoice, requiredText, result, validateBusinessId, type FoundationRecordMetadata, type FoundationRecordStatus } from "./validation";

export const ORGANIZATION_TYPES = [
  "ADAMA Entity",
  "Department",
  "Contractor",
  "Temporary Agency",
  "Laboratory",
  "Waste Vendor",
  "Service Vendor",
  "Regulator",
  "Medical Provider",
  "Other",
] as const;

export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export interface Organization extends FoundationRecordMetadata {
  name: string;
  organizationType: OrganizationType;
  status: FoundationRecordStatus;
  description: string;
  primaryContactPersonId: string | null;
}

export interface OrganizationFields {
  businessId?: string;
  name: string;
  organizationType: OrganizationType;
  status: FoundationRecordStatus;
  description?: string;
  primaryContactPersonId?: string | null;
}

export function validateOrganization(input: OrganizationFields) {
  return result([
    ...validateBusinessId(input.businessId),
    ...requiredText(input.name, "name", "Name"),
    ...requiredChoice(input.organizationType, ORGANIZATION_TYPES, "organizationType", "Organization type"),
    ...requiredChoice(input.status, FOUNDATION_RECORD_STATUSES, "status", "Status"),
  ]);
}
