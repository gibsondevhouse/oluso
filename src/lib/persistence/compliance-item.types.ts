import type { LifecycleMetadata } from "./lifecycle.types";

export type ComplianceItemType =
  | "Training"
  | "Permit"
  | "Obligation"
  | "Controlled Document";

export type ComplianceItemStatus =
  | "Draft"
  | "Active"
  | "Upcoming"
  | "Due Soon"
  | "Overdue"
  | "Complete"
  | "Needs Evidence"
  | "Expired"
  | "Superseded"
  | "Cancelled";

export type ComplianceReviewStatus =
  | "Not Reviewed"
  | "In Review"
  | "Reviewed"
  | "Needs Review";

export interface ComplianceItemRecord extends LifecycleMetadata {
  id: string;
  itemType: ComplianceItemType;
  title: string;
  requirementSource: string;
  owner: string;
  audienceOrScope: string;
  segId: string;
  locationId: string;
  processId: string;
  equipmentId: string;
  issueDate: string;
  dueDate: string;
  expirationDate: string;
  reviewDate: string;
  recurrence: string;
  status: ComplianceItemStatus;
  reviewStatus: ComplianceReviewStatus;
  evidenceRequired: boolean;
  evidenceReference: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ComplianceItemInput {
  itemType: ComplianceItemType;
  title: string;
  requirementSource: string;
  owner: string;
  audienceOrScope: string;
  segId: string;
  locationId: string;
  processId: string;
  equipmentId: string;
  issueDate: string;
  dueDate: string;
  expirationDate: string;
  reviewDate: string;
  recurrence: string;
  status: ComplianceItemStatus;
  reviewStatus: ComplianceReviewStatus;
  evidenceRequired: boolean;
  evidenceReference: string;
  notes: string;
}

export interface ComplianceItemValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ComplianceItemInput, string>>;
}

export const COMPLIANCE_ITEM_TYPES: ComplianceItemType[] = [
  "Training",
  "Permit",
  "Obligation",
  "Controlled Document",
];

export const COMPLIANCE_ITEM_STATUSES: ComplianceItemStatus[] = [
  "Draft",
  "Active",
  "Upcoming",
  "Due Soon",
  "Overdue",
  "Complete",
  "Needs Evidence",
  "Expired",
  "Superseded",
  "Cancelled",
];

export const COMPLIANCE_REVIEW_STATUSES: ComplianceReviewStatus[] = [
  "Not Reviewed",
  "In Review",
  "Reviewed",
  "Needs Review",
];

function isValidIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

export function validateComplianceItemInput(
  input: ComplianceItemInput,
): ComplianceItemValidationResult {
  const errors: ComplianceItemValidationResult["errors"] = {};

  if (!COMPLIANCE_ITEM_TYPES.includes(input.itemType)) {
    errors.itemType = "Compliance item type is required.";
  }

  if (!input.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!input.requirementSource.trim()) {
    errors.requirementSource = "Requirement source is required.";
  }

  if (!input.owner.trim()) {
    errors.owner = "Owner is required.";
  }

  if (!COMPLIANCE_ITEM_STATUSES.includes(input.status)) {
    errors.status = "Status is required.";
  }

  if (!COMPLIANCE_REVIEW_STATUSES.includes(input.reviewStatus)) {
    errors.reviewStatus = "Review status is required.";
  }

  for (const [field, label] of [
    ["issueDate", "Issue date"],
    ["dueDate", "Due date"],
    ["expirationDate", "Expiration date"],
    ["reviewDate", "Review date"],
  ] as const) {
    const value = input[field].trim();
    if (value && !isValidIsoDate(value)) {
      errors[field] = `${label} must use YYYY-MM-DD.`;
    }
  }

  if (
    input.issueDate.trim() &&
    input.expirationDate.trim() &&
    isValidIsoDate(input.issueDate.trim()) &&
    isValidIsoDate(input.expirationDate.trim()) &&
    input.expirationDate.trim() < input.issueDate.trim()
  ) {
    errors.expirationDate = "Expiration date cannot be earlier than the issue date.";
  }

  if (
    input.evidenceRequired &&
    input.status === "Complete" &&
    !input.evidenceReference.trim()
  ) {
    errors.evidenceReference = "Evidence reference is required before marking this item complete.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getComplianceItemStatusTone(status: ComplianceItemStatus) {
  if (status === "Active" || status === "Complete") return "active";
  if (status === "Upcoming" || status === "Due Soon") return "medium";
  if (status === "Overdue" || status === "Needs Evidence" || status === "Expired") {
    return "critical";
  }
  return "inactive";
}

export function getComplianceReviewStatusTone(status: ComplianceReviewStatus) {
  if (status === "Reviewed") return "active";
  if (status === "In Review" || status === "Needs Review") return "medium";
  return "inactive";
}
