import {
  validateCorrectiveActionInput,
  type CorrectiveActionInput,
  type CorrectiveActionRecord,
} from "$lib/persistence/corrective-action.types";
import type { DomainRepositorySet, RegisterRepository, TransactionCoordinator } from "../contracts";
import { BaseRegisterService } from "./base-register-service";

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

export class CorrectiveActionService extends BaseRegisterService<
  CorrectiveActionRecord,
  CorrectiveActionInput
> {
  constructor(
    repository: RegisterRepository<CorrectiveActionRecord, CorrectiveActionInput>,
    private readonly repositories: Pick<
      DomainRepositorySet,
      "findings" | "hazards" | "incidents" | "complianceItems"
    >,
    transactionCoordinator?: TransactionCoordinator,
  ) {
    super(repository, "Corrective action", transactionCoordinator);
  }

  protected validateInput(input: CorrectiveActionInput) {
    const errors = { ...validateCorrectiveActionInput(input).errors };

    if (input.dueDate.trim() && !isValidIsoDate(input.dueDate.trim())) {
      errors.dueDate = "Due date must use YYYY-MM-DD.";
    }

    return errors;
  }

  protected validateRelationships(input: CorrectiveActionInput) {
    if (input.sourceType === "Finding") {
      this.ensureRelatedRecord(
        this.repositories.findings,
        input.sourceId || input.findingId,
        "Selected finding",
        true,
      );
      return;
    }

    if (input.sourceType === "Hazard") {
      this.ensureRelatedRecord(this.repositories.hazards, input.sourceId, "Selected hazard", true);
      return;
    }

    if (input.sourceType === "Incident") {
      this.ensureRelatedRecord(this.repositories.incidents, input.sourceId, "Selected incident", true);
      return;
    }

    if (input.sourceType === "Compliance Item") {
      this.ensureRelatedRecord(
        this.repositories.complianceItems,
        input.sourceId,
        "Selected compliance item",
        true,
      );
    }
  }
}
