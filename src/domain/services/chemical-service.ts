import {
  validateChemicalInput,
  type ChemicalInput,
  type ChemicalRecord,
} from "$lib/persistence/chemical.types";
import type { DomainRepositorySet, RegisterRepository, TransactionCoordinator } from "../contracts";
import { BaseRegisterService } from "./base-register-service";

export class ChemicalService extends BaseRegisterService<ChemicalRecord, ChemicalInput> {
  constructor(
    repository: RegisterRepository<ChemicalRecord, ChemicalInput>,
    private readonly repositories: Pick<DomainRepositorySet, "locations" | "processes">,
    transactionCoordinator?: TransactionCoordinator,
  ) {
    super(repository, "Chemical", transactionCoordinator);
  }

  protected validateInput(input: ChemicalInput) {
    return validateChemicalInput(input).errors;
  }

  protected validateRelationships(input: ChemicalInput) {
    this.ensureRelatedRecord(
      this.repositories.locations,
      input.storageLocationId,
      "Selected storage location",
      true,
    );
    this.ensureRelatedRecords(this.repositories.processes, input.processIds, "Selected process");
  }
}
