import { validateSegInput, type SegInput, type SegRecord } from "$lib/persistence/seg.types";
import type { DomainRepositorySet, RegisterRepository, TransactionCoordinator } from "../contracts";
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
    this.ensureRelatedRecord(this.repositories.locations, input.locationId, "Selected location", true);
    this.ensureRelatedRecord(this.repositories.processes, input.processId, "Selected process");
    this.ensureRelatedRecords(this.repositories.chemicals, input.chemicalIds, "Selected chemical");
    this.ensureRelatedRecords(this.repositories.hazards, input.hazardIds, "Selected hazard");
  }
}
