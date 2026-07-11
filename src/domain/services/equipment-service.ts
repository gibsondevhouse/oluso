import {
  validateEquipmentInput,
  type EquipmentInput,
  type EquipmentRecord,
} from "$lib/persistence/equipment.types";
import type { DomainRepositorySet, RegisterRepository, TransactionCoordinator } from "../contracts";
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
    this.ensureRelatedRecord(this.repositories.locations, input.locationId, "Selected location");

    if (input.processId.trim()) {
      this.ensureRelatedRecord(this.repositories.processes, input.processId, "Selected process");
    }
  }
}
