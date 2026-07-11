import {
  validateControlInput,
  type ControlInput,
  type ControlRecord,
} from "$lib/persistence/control.types";
import type { DomainRepositorySet, RegisterRepository, TransactionCoordinator } from "../contracts";
import { BaseRegisterService } from "./base-register-service";

export class ControlService extends BaseRegisterService<ControlRecord, ControlInput> {
  constructor(
    repository: RegisterRepository<ControlRecord, ControlInput>,
    private readonly repositories: Pick<DomainRepositorySet, "hazards">,
    transactionCoordinator?: TransactionCoordinator,
  ) {
    super(repository, "Control", transactionCoordinator);
  }

  protected validateInput(input: ControlInput) {
    return validateControlInput(input).errors;
  }

  protected validateRelationships(input: ControlInput) {
    this.ensureRelatedRecords(this.repositories.hazards, input.hazardIds, "Selected hazard");
  }
}
