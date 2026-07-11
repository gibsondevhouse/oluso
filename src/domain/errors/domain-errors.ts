export type DomainErrorCode =
  | "VALIDATION_ERROR"
  | "RELATIONSHIP_ERROR"
  | "DUPLICATE_RECORD"
  | "ARCHIVE_ERROR"
  | "RESTORE_ERROR"
  | "RECORD_NOT_FOUND"
  | "REPOSITORY_ERROR";

export class DomainError extends Error {
  readonly code: DomainErrorCode;
  readonly details?: unknown;

  constructor(code: DomainErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends DomainError {
  readonly fieldErrors: Record<string, string>;

  constructor(message: string, fieldErrors: Record<string, string> = {}) {
    super("VALIDATION_ERROR", message, fieldErrors);
    this.fieldErrors = fieldErrors;
  }
}

export class RelationshipError extends DomainError {
  constructor(message: string, details?: unknown) {
    super("RELATIONSHIP_ERROR", message, details);
  }
}

export class DuplicateRecordError extends DomainError {
  constructor(message: string, details?: unknown) {
    super("DUPLICATE_RECORD", message, details);
  }
}

export class ArchiveError extends DomainError {
  constructor(message: string, details?: unknown) {
    super("ARCHIVE_ERROR", message, details);
  }
}

export class RestoreError extends DomainError {
  constructor(message: string, details?: unknown) {
    super("RESTORE_ERROR", message, details);
  }
}

export class RecordNotFoundError extends DomainError {
  constructor(message: string, details?: unknown) {
    super("RECORD_NOT_FOUND", message, details);
  }
}

export class RepositoryError extends DomainError {
  constructor(message: string, details?: unknown) {
    super("REPOSITORY_ERROR", message, details);
  }
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
