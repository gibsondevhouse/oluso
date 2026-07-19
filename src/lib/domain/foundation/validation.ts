import { ValidationError, type ValidationIssue } from "./errors";

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

export type FoundationRecordStatus = "Draft" | "Active" | "Inactive";

export interface FoundationRecordMetadata {
  id: string;
  businessId: string;
  revision: number;
  createdAt: string;
  createdBy: string;
  updatedAt: string;
  updatedBy: string;
  originInstallationId: string;
  lastExchangePackageId?: string;
  lifecycleStatus: "active" | "archived";
  archivedAt: string | null;
  archivedBy: string | null;
  archiveReason: string | null;
  archivedReason: string | null;
}

export const FOUNDATION_RECORD_STATUSES = ["Draft", "Active", "Inactive"] as const;

export function requiredText(value: string | null | undefined, field: string, label: string) {
  return value?.trim()
    ? []
    : [{ field, message: `${label} is required.`, code: "REQUIRED" } satisfies ValidationIssue];
}

export function requiredChoice(
  value: string | null | undefined,
  choices: readonly string[],
  field: string,
  label: string,
) {
  if (!value?.trim()) {
    return [{ field, message: `${label} is required.`, code: "REQUIRED" } satisfies ValidationIssue];
  }
  return choices.includes(value)
    ? []
    : [{ field, message: `Select a valid ${label.toLowerCase()}.`, code: "INVALID_CHOICE" } satisfies ValidationIssue];
}

export function validateBusinessId(value: string | null | undefined) {
  if (!value?.trim()) return [];
  return /^[A-Z0-9][A-Z0-9._/-]*$/i.test(value.trim())
    ? []
    : [{
        field: "businessId",
        message: "Business ID may contain letters, numbers, periods, underscores, slashes, and hyphens.",
        code: "INVALID_FORMAT",
      } satisfies ValidationIssue];
}

export function result(issues: ValidationIssue[]): ValidationResult {
  return { valid: issues.length === 0, issues };
}

export function assertValid(validation: ValidationResult) {
  if (!validation.valid) throw new ValidationError(validation.issues);
}

export function issuesByField(validation: ValidationResult): Record<string, string> {
  return Object.fromEntries(validation.issues.map((issue) => [issue.field, issue.message]));
}
