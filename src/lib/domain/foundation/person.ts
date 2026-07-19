import { FOUNDATION_RECORD_STATUSES, requiredChoice, requiredText, result, validateBusinessId, type FoundationRecordMetadata, type FoundationRecordStatus } from "./validation";

export const PERSON_TYPES = [
  "Employee",
  "Contractor",
  "Temporary Worker",
  "Inspector",
  "Investigator",
  "Owner",
  "External Contact",
] as const;

export type PersonType = (typeof PERSON_TYPES)[number];

export interface Person extends FoundationRecordMetadata {
  displayName: string;
  personType: PersonType;
  organizationId: string | null;
  employeeIdentifier: string;
  jobTitle: string;
  department: string;
  supervisorPersonId: string | null;
  primarySiteId: string | null;
  email: string;
  phone: string;
  description: string;
  status: FoundationRecordStatus;
}

export interface PersonFields {
  businessId?: string;
  displayName: string;
  personType: PersonType;
  organizationId?: string | null;
  employeeIdentifier?: string;
  jobTitle?: string;
  department?: string;
  supervisorPersonId?: string | null;
  primarySiteId?: string | null;
  email?: string;
  phone?: string;
  description?: string;
  status: FoundationRecordStatus;
}

export function validatePerson(input: PersonFields) {
  const issues = [
    ...validateBusinessId(input.businessId),
    ...requiredText(input.displayName, "displayName", "Display name"),
    ...requiredChoice(input.personType, PERSON_TYPES, "personType", "Person type"),
    ...requiredChoice(input.status, FOUNDATION_RECORD_STATUSES, "status", "Status"),
  ];
  if (input.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.email.trim())) {
    issues.push({ field: "email", message: "Enter a valid email address.", code: "INVALID_FORMAT" });
  }
  return result(issues);
}
