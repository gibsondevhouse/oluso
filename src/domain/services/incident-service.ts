import {
  validateIncidentInput,
  type IncidentInput,
  type IncidentRecord,
} from "$lib/persistence/incident.types";
import type { DomainRepositorySet, RegisterRepository, TransactionCoordinator } from "../contracts";
import { RelationshipError } from "../errors";
import { BaseRegisterService } from "./base-register-service";

export class IncidentService extends BaseRegisterService<IncidentRecord, IncidentInput> {
  constructor(
    repository: RegisterRepository<IncidentRecord, IncidentInput>,
    private readonly repositories: Pick<
      DomainRepositorySet,
      "locations" | "processes" | "equipment" | "chemicals" | "hazards" | "controls"
    >,
    transactionCoordinator?: TransactionCoordinator,
  ) {
    super(repository, "Incident", transactionCoordinator);
  }

  protected validateInput(input: IncidentInput) {
    return validateIncidentInput(input).errors;
  }

  protected validateRelationships(input: IncidentInput) {
    const location = this.ensureRelatedRecord(
      this.repositories.locations,
      input.locationId,
      "Selected location",
      true,
    );
    const process = this.ensureRelatedRecord(
      this.repositories.processes,
      input.processId,
      "Selected process",
    );
    const equipment = this.ensureRelatedRecord(
      this.repositories.equipment,
      input.equipmentId,
      "Selected equipment",
    );
    this.ensureRelatedRecord(this.repositories.chemicals, input.chemicalId, "Selected chemical");
    this.ensureRelatedRecords(this.repositories.hazards, input.hazardIds, "Selected hazard");
    this.ensureRelatedRecords(this.repositories.controls, input.controlIds, "Selected control");

    if (location && process?.locationId && process.locationId !== location.id) {
      throw new RelationshipError("Selected process does not belong to the selected location.");
    }
    if (location && equipment?.locationId && equipment.locationId !== location.id) {
      throw new RelationshipError("Selected equipment does not belong to the selected location.");
    }
    if (process && equipment?.processId && equipment.processId !== process.id) {
      throw new RelationshipError("Selected equipment does not belong to the selected process.");
    }
  }
}
