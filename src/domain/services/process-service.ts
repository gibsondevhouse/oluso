import {
  validateProcessInput,
  type ProcessInput,
  type ProcessRecord,
} from "$lib/persistence/process.types";
import type { DomainRepositorySet, RegisterRepository, TransactionCoordinator } from "../contracts";
import { BaseRegisterService } from "./base-register-service";

export class ProcessService extends BaseRegisterService<ProcessRecord, ProcessInput> {
  constructor(
    repository: RegisterRepository<ProcessRecord, ProcessInput>,
    private readonly repositories: Pick<DomainRepositorySet, "locations">,
    transactionCoordinator?: TransactionCoordinator,
  ) {
    super(repository, "Process", transactionCoordinator);
  }

  protected validateInput(input: ProcessInput) {
    return validateProcessInput(input).errors;
  }

  protected validateRelationships(input: ProcessInput) {
    this.ensureRelatedRecord(this.repositories.locations, input.locationId, "Selected location");
  }
}
