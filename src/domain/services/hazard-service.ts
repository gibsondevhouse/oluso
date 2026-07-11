import { validateHazardInput, type HazardInput, type HazardRecord } from "$lib/persistence/hazard.types";
import type { DomainRepositorySet, RegisterRepository, TransactionCoordinator } from "../contracts";
import { BaseRegisterService } from "./base-register-service";

export class HazardService extends BaseRegisterService<HazardRecord, HazardInput> {
  constructor(
    repository: RegisterRepository<HazardRecord, HazardInput>,
    private readonly repositories: Pick<DomainRepositorySet, "locations" | "processes" | "chemicals">,
    transactionCoordinator?: TransactionCoordinator,
  ) {
    super(repository, "Hazard", transactionCoordinator);
  }

  protected validateInput(input: HazardInput) {
    return validateHazardInput(input).errors;
  }

  protected validateRelationships(input: HazardInput) {
    this.ensureRelatedRecord(this.repositories.locations, input.locationId, "Selected location", true);
    this.ensureRelatedRecords(this.repositories.locations, input.locationIds, "Selected location");
    this.ensureRelatedRecords(this.repositories.processes, input.processIds, "Selected process");
    this.ensureRelatedRecords(this.repositories.chemicals, input.chemicalIds, "Selected chemical");
  }
}
