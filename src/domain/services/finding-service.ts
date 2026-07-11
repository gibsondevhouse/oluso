import {
  validateFindingInput,
  type FindingInput,
  type FindingRecord,
} from "$lib/persistence/finding.types";
import type { DomainRepositorySet, RegisterRepository, TransactionCoordinator } from "../contracts";
import { RelationshipError } from "../errors";
import { BaseRegisterService } from "./base-register-service";

export class FindingService extends BaseRegisterService<FindingRecord, FindingInput> {
  constructor(
    repository: RegisterRepository<FindingRecord, FindingInput>,
    private readonly repositories: Pick<
      DomainRepositorySet,
      "locations" | "processes" | "equipment" | "chemicals" | "hazards" | "controls"
    >,
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
    this.ensureRelatedRecord(this.repositories.equipment, input.equipmentId ?? "", "Selected equipment");
    this.ensureRelatedRecord(this.repositories.chemicals, input.chemicalId ?? "", "Selected chemical");
    this.ensureRelatedRecord(this.repositories.hazards, input.hazardId, "Selected hazard");
    this.ensureRelatedRecord(this.repositories.controls, input.controlId ?? "", "Selected control");

    const locationId = input.locationId.trim();
    const processId = input.processId.trim();
    const equipmentId = input.equipmentId?.trim() ?? "";
    const process = processId ? this.repositories.processes.getById(processId) : null;
    const equipment = equipmentId ? this.repositories.equipment.getById(equipmentId) : null;

    if (process && locationId && process.locationId !== locationId) {
      throw new RelationshipError("Selected process does not belong to the selected location.");
    }

    if (equipment && locationId && equipment.locationId !== locationId) {
      throw new RelationshipError("Selected equipment does not belong to the selected location.");
    }
  }
}
