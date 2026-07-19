export class AdamaDatabaseError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AdamaDatabaseError";
  }
}

export class StorageUnavailableError extends AdamaDatabaseError {
  constructor(message = "Browser database storage is unavailable.", cause?: unknown) {
    super(message, "STORAGE_UNAVAILABLE", cause);
    this.name = "StorageUnavailableError";
  }
}

export class DatabaseBlockedError extends AdamaDatabaseError {
  constructor(message = "The database upgrade is blocked by another open application tab.") {
    super(message, "DATABASE_BLOCKED");
    this.name = "DatabaseBlockedError";
  }
}

export class RecordNotFoundError extends AdamaDatabaseError {
  constructor(recordType: string, id: string) {
    super(`${recordType} record ${id} was not found.`, "RECORD_NOT_FOUND");
    this.name = "RecordNotFoundError";
  }
}

export class StaleRevisionError extends AdamaDatabaseError {
  constructor(
    readonly recordType: string,
    readonly recordId: string,
    readonly expectedRevision: number,
    readonly currentRevision: number,
  ) {
    super(
      `${recordType} ${recordId} changed from revision ${expectedRevision} to ${currentRevision}.`,
      "STALE_REVISION",
    );
    this.name = "StaleRevisionError";
  }
}

export class IdentityNotInitializedError extends AdamaDatabaseError {
  constructor() {
    super("Dataset, installation, and local-user identity must be initialized.", "IDENTITY_MISSING");
    this.name = "IdentityNotInitializedError";
  }
}

export function translateIndexedDbError(error: unknown) {
  if (error instanceof AdamaDatabaseError) return error;
  if (error instanceof DOMException) {
    if (error.name === "QuotaExceededError") {
      return new AdamaDatabaseError(
        "The browser could not save the change because its storage quota was exceeded.",
        "QUOTA_EXCEEDED",
        error,
      );
    }
    if (error.name === "ConstraintError") {
      return new AdamaDatabaseError(
        "The change violates a unique record constraint.",
        "CONSTRAINT_VIOLATION",
        error,
      );
    }
  }
  return new AdamaDatabaseError("The browser database operation failed.", "DATABASE_OPERATION_FAILED", error);
}
