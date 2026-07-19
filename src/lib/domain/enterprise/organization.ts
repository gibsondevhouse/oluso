import {
  FOUNDATION_RECORD_STATUSES,
  requiredChoice,
  requiredText,
  result,
  validateBusinessId,
  type FoundationRecordMetadata,
  type FoundationRecordStatus,
} from "../foundation/validation";

export const ORGANIZATION_TYPES = [
  "Corporate Group",
  "Regional Entity",
  "Legal Entity",
  "Country Organization",
  "Business Unit",
  "Site Organization",
  "Department",
  "Function",
  "Contractor",
  "Temporary Agency",
  "Laboratory Provider",
  "Medical Provider",
  "Service Vendor",
  "Waste Vendor",
  "Regulator",
  "Other",
] as const;

export type OrganizationType = (typeof ORGANIZATION_TYPES)[number];

export const ORGANIZATION_PARENT_TYPES: Partial<Record<OrganizationType, readonly OrganizationType[]>> = {
  "Corporate Group": [],
  "Regional Entity": ["Corporate Group", "Regional Entity"],
  "Legal Entity": ["Corporate Group", "Regional Entity"],
  "Country Organization": ["Corporate Group", "Regional Entity", "Legal Entity", "Country Organization"],
  "Business Unit": ["Corporate Group", "Regional Entity", "Legal Entity", "Country Organization", "Business Unit"],
  "Site Organization": ["Country Organization", "Business Unit"],
  Department: ["Corporate Group", "Regional Entity", "Legal Entity", "Country Organization", "Business Unit", "Site Organization", "Department", "Function"],
  Function: ["Corporate Group", "Regional Entity", "Legal Entity", "Country Organization", "Business Unit", "Site Organization", "Department", "Function"],
};

export interface Organization extends FoundationRecordMetadata {
  name: string;
  organizationType: OrganizationType;
  parentOrganizationId: string | null;
  organizationCode: string;
  legalEntityCode: string;
  countryCode: string;
  primaryContactPersonId: string | null;
  status: FoundationRecordStatus;
  description: string;
}

export interface OrganizationFields {
  businessId?: string;
  name: string;
  organizationType: OrganizationType;
  parentOrganizationId?: string | null;
  organizationCode?: string;
  legalEntityCode?: string;
  countryCode?: string;
  primaryContactPersonId?: string | null;
  status: FoundationRecordStatus;
  description?: string;
}

export function validateOrganization(input: OrganizationFields) {
  const issues = [
    ...validateBusinessId(input.businessId),
    ...requiredText(input.name, "name", "Name"),
    ...requiredChoice(input.organizationType, ORGANIZATION_TYPES, "organizationType", "Organization type"),
    ...requiredChoice(input.status, FOUNDATION_RECORD_STATUSES, "status", "Status"),
  ];
  if (input.organizationType === "Corporate Group" && input.parentOrganizationId) {
    issues.push({ field: "parentOrganizationId", message: "A Corporate Group cannot have a parent.", code: "INVALID_PARENT" });
  }
  return result(issues);
}

export function isInternalOrganizationType(type: OrganizationType) {
  return Object.hasOwn(ORGANIZATION_PARENT_TYPES, type);
}

export function isValidOrganizationParent(type: OrganizationType, parent: Organization | null) {
  if (!isInternalOrganizationType(type)) return true;
  const permitted = ORGANIZATION_PARENT_TYPES[type] ?? [];
  return permitted.length === 0 ? parent === null : Boolean(parent && permitted.includes(parent.organizationType));
}
