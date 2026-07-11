import { validateSegInput, type SegInput, type SegRecord } from "$lib/persistence/seg.types";
import type { DomainRepositorySet, RegisterRepository, TransactionCoordinator } from "../contracts";
import { RelationshipError } from "../errors";
import { BaseRegisterService } from "./base-register-service";

export class SEGService extends BaseRegisterService<SegRecord, SegInput> {
  constructor(
    repository: RegisterRepository<SegRecord, SegInput>,
    private readonly repositories: Pick<DomainRepositorySet, "locations" | "processes" | "chemicals" | "hazards">,
    transactionCoordinator?: TransactionCoordinator,
  ) {
    super(repository, "SEG", transactionCoordinator);
  }

  protected validateInput(input: SegInput) {
    return validateSegInput(input).errors;
  }

  protected validateRelationships(input: SegInput) {
    const location = this.ensureRelatedRecord(this.repositories.locations, input.locationId, "Selected location", true);
    const process = this.ensureRelatedRecord(this.repositories.processes, input.processId, "Selected process");
    this.ensureRelatedRecords(this.repositories.chemicals, input.chemicalIds, "Selected chemical");
    this.ensureRelatedRecords(this.repositories.hazards, input.hazardIds, "Selected hazard");

    if (location && process?.locationId && process.locationId !== location.id) {
      throw new RelationshipError("Selected process does not belong to the selected location.");
    }
  }
}
