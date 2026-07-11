import {
  validateFindingInput,
  type FindingInput,
  type FindingRecord,
} from "$lib/persistence/finding.types";
import type { DomainRepositorySet, RegisterRepository, TransactionCoordinator } from "../contracts";
import { BaseRegisterService } from "./base-register-service";

export class FindingService extends BaseRegisterService<FindingRecord, FindingInput> {
  constructor(
    repository: RegisterRepository<FindingRecord, FindingInput>,
    private readonly repositories: Pick<DomainRepositorySet, "locations" | "processes" | "hazards">,
    transactionCoordinator?: TransactionCoordinator,
  ) {
    super(repository, "Finding", transactionCoordinator);
  }

  protected validateInput(input: FindingInput) {
    return validateFindingInput(input).errors;
  }

  protected validateRelationships(input: FindingInput) {
    this.ensureRelatedRecord(this.repositories.locations, input.locationId, "Selected location", true);
    this.ensureRelatedRecord(this.repositories.processes, input.processId, "Selected process");
    this.ensureRelatedRecord(this.repositories.hazards, input.hazardId, "Selected hazard");
  }
}
