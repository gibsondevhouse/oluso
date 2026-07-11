import {
  validateEquipmentInput,
  type EquipmentInput,
  type EquipmentRecord,
} from "$lib/persistence/equipment.types";
import type { DomainRepositorySet, RegisterRepository, TransactionCoordinator } from "../contracts";
import { RelationshipError } from "../errors";
import { BaseRegisterService } from "./base-register-service";

export class EquipmentService extends BaseRegisterService<EquipmentRecord, EquipmentInput> {
  constructor(
    repository: RegisterRepository<EquipmentRecord, EquipmentInput>,
    private readonly repositories: Pick<DomainRepositorySet, "locations" | "processes">,
    transactionCoordinator?: TransactionCoordinator,
  ) {
    super(repository, "Equipment", transactionCoordinator);
  }

  protected validateInput(input: EquipmentInput) {
    return validateEquipmentInput(input).errors;
  }

  protected validateRelationships(input: EquipmentInput) {
    const location = this.ensureRelatedRecord(
      this.repositories.locations,
      input.locationId,
      "Selected location",
      true,
    );

    if (input.processId.trim()) {
      const process = this.ensureRelatedRecord(
        this.repositories.processes,
        input.processId,
        "Selected process",
      );
      if (location && process?.locationId && process.locationId !== location.id) {
        throw new RelationshipError("Selected process does not belong to the selected location.");
      }
    }
  }
}
