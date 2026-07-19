export type FoundationErrorCode =
  | "DUPLICATE_BUSINESS_ID"
  | "MISSING_RELATIONSHIP"
  | "ARCHIVED_RELATIONSHIP"
  | "INVALID_PARENT_TYPE"
  | "CIRCULAR_HIERARCHY"
  | "CIRCULAR_ORGANIZATION_HIERARCHY"
  | "CROSS_SITE_RELATIONSHIP"
  | "VALIDATION_FAILED"
  | "STALE_REVISION"
  | "DATABASE_UNAVAILABLE"
  | "TRANSACTION_FAILED"
  | "RECORD_NOT_FOUND"
  | "RECORD_ARCHIVED";

export class FoundationError extends Error {
  constructor(
    message: string,
    readonly code: FoundationErrorCode,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "FoundationError";
  }
}

export class DuplicateBusinessIdError extends FoundationError {
  readonly field = "businessId";
  constructor(readonly recordType: string, readonly businessId: string) {
    super(`${recordType} business ID ${businessId} is already in use.`, "DUPLICATE_BUSINESS_ID");
    this.name = "DuplicateBusinessIdError";
  }
}

export class MissingRelationshipError extends FoundationError {
  constructor(
    readonly recordType: string,
    readonly field: string,
    readonly relatedId: string,
  ) {
    super(
      `${recordType} requires an existing record for ${fieldLabel(field)} (${relatedId}).`,
      "MISSING_RELATIONSHIP",
    );
    this.name = "MissingRelationshipError";
  }
}

export class ArchivedRelationshipError extends FoundationError {
  constructor(
    readonly recordType: string,
    readonly field: string,
    readonly relatedId: string,
  ) {
    super(
      `${recordType} cannot use archived ${fieldLabel(field)} record ${relatedId}. Restore it first.`,
      "ARCHIVED_RELATIONSHIP",
    );
    this.name = "ArchivedRelationshipError";
  }
}

export class InvalidParentTypeError extends FoundationError {
  readonly field = "parentId";
  constructor(readonly nodeType: string, readonly parentType: string | null) {
    super(
      `${nodeType} cannot be placed under ${parentType ?? "a parent"}.`,
      "INVALID_PARENT_TYPE",
    );
    this.name = "InvalidParentTypeError";
  }
}

export class CircularHierarchyError extends FoundationError {
  readonly field = "parentId";
  constructor(readonly locationId: string, readonly parentId: string) {
    super(
      `Location ${locationId} cannot be moved under ${parentId} because that would create a circular hierarchy.`,
      "CIRCULAR_HIERARCHY",
    );
    this.name = "CircularHierarchyError";
  }
}

export class CircularOrganizationHierarchyError extends FoundationError {
  readonly field = "parentOrganizationId";
  constructor(readonly organizationId: string, readonly parentOrganizationId: string) {
    super(
      `Organization ${organizationId} cannot be placed under ${parentOrganizationId} because that would create a circular hierarchy.`,
      "CIRCULAR_ORGANIZATION_HIERARCHY",
    );
    this.name = "CircularOrganizationHierarchyError";
  }
}

export class CrossSiteRelationshipError extends FoundationError {
  readonly field = "locationId";
  constructor(readonly recordType: string, readonly expectedSiteId: string, readonly actualSiteId: string) {
    super(
      `${recordType} must remain within Site ${expectedSiteId}; the selected relationship resolves to ${actualSiteId}.`,
      "CROSS_SITE_RELATIONSHIP",
    );
    this.name = "CrossSiteRelationshipError";
  }
}

export interface ValidationIssue {
  field: string;
  message: string;
  code: string;
}

export class ValidationError extends FoundationError {
  constructor(readonly issues: ValidationIssue[]) {
    super(issues[0]?.message ?? "The record is invalid.", "VALIDATION_FAILED");
    this.name = "ValidationError";
  }
}

export class StaleRevisionError extends FoundationError {
  constructor(
    readonly recordType: string,
    readonly recordId: string,
    readonly expectedRevision: number,
    readonly currentRevision: number,
    cause?: unknown,
  ) {
    super(
      `${recordType} ${recordId} changed from revision ${expectedRevision} to ${currentRevision}. Reload before saving again.`,
      "STALE_REVISION",
      cause,
    );
    this.name = "StaleRevisionError";
  }
}

export class DatabaseUnavailableError extends FoundationError {
  constructor(cause?: unknown) {
    super("The browser database is unavailable. Check browser storage and try again.", "DATABASE_UNAVAILABLE", cause);
    this.name = "DatabaseUnavailableError";
  }
}

export class TransactionFailedError extends FoundationError {
  constructor(cause?: unknown) {
    super("The change could not be saved. No records were changed.", "TRANSACTION_FAILED", cause);
    this.name = "TransactionFailedError";
  }
}

export class RecordNotFoundError extends FoundationError {
  constructor(readonly recordType: string, readonly recordId: string, cause?: unknown) {
    super(`${recordType} record ${recordId} was not found.`, "RECORD_NOT_FOUND", cause);
    this.name = "RecordNotFoundError";
  }
}

export class RecordArchivedError extends FoundationError {
  constructor(readonly recordType: string, readonly recordId: string) {
    super(`${recordType} record ${recordId} is archived. Restore it before changing it.`, "RECORD_ARCHIVED");
    this.name = "RecordArchivedError";
  }
}

function fieldLabel(field: string) {
  return field.replace(/Id$/, "").replace(/([a-z])([A-Z])/g, "$1 $2").toLowerCase();
}
