import { validateHazardInput, type HazardInput, type HazardRecord } from "$lib/persistence/hazard.types";
import type { DomainRepositorySet, RegisterRepository, TransactionCoordinator } from "../contracts";
import { RelationshipError } from "../errors";
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

    const locationIds = new Set([input.locationId, ...input.locationIds].filter(Boolean));
    for (const processId of input.processIds) {
      const process = this.repositories.processes.getById(processId);
      if (process?.locationId && !locationIds.has(process.locationId)) {
        throw new RelationshipError(
          "Selected process does not belong to one of the hazard's selected locations.",
        );
      }
    }
  }
}
