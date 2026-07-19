import { AdamaDatabaseError } from "$lib/data/database";

export class ChemicalValidationError extends AdamaDatabaseError {
  constructor(message: string, readonly fields: Record<string, string> = {}) {
    super(message, "CHEMICAL_VALIDATION_FAILED");
    this.name = "ChemicalValidationError";
  }
}

export class ChemicalRelationshipError extends AdamaDatabaseError {
  constructor(message: string) {
    super(message, "CHEMICAL_RELATIONSHIP_INVALID");
    this.name = "ChemicalRelationshipError";
  }
}

export class ChemicalDuplicateError extends AdamaDatabaseError {
  constructor(message: string) {
    super(message, "CHEMICAL_DUPLICATE_IDENTITY");
    this.name = "ChemicalDuplicateError";
  }
}
