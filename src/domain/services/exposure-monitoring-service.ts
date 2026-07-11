import {
  validateExposureMonitoringInput,
  type ExposureMonitoringInput,
  type ExposureMonitoringRecord,
} from "$lib/persistence/exposure-monitoring.types";
import type { DomainRepositorySet, RegisterRepository, TransactionCoordinator } from "../contracts";
import { RelationshipError } from "../errors";
import { BaseRegisterService } from "./base-register-service";

export class ExposureMonitoringService extends BaseRegisterService<
  ExposureMonitoringRecord,
  ExposureMonitoringInput
> {
  constructor(
    repository: RegisterRepository<ExposureMonitoringRecord, ExposureMonitoringInput>,
    private readonly repositories: Pick<
      DomainRepositorySet,
      "locations" | "processes" | "chemicals" | "hazards" | "segs"
    >,
    transactionCoordinator?: TransactionCoordinator,
  ) {
    super(repository, "Exposure monitoring record", transactionCoordinator);
  }

  protected validateInput(input: ExposureMonitoringInput) {
    return validateExposureMonitoringInput(input).errors;
  }

  protected validateRelationships(input: ExposureMonitoringInput) {
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
    const seg = this.ensureRelatedRecord(this.repositories.segs, input.segId, "Selected SEG");
    this.ensureRelatedRecord(this.repositories.chemicals, input.chemicalId, "Selected chemical");
    this.ensureRelatedRecord(this.repositories.hazards, input.hazardId, "Selected hazard");

    if (location && process?.locationId && process.locationId !== location.id) {
      throw new RelationshipError("Selected process does not belong to the selected location.");
    }
    if (location && seg?.locationId && seg.locationId !== location.id) {
      throw new RelationshipError("Selected SEG does not belong to the selected location.");
    }
    if (process && seg?.processId && seg.processId !== process.id) {
      throw new RelationshipError("Selected SEG does not belong to the selected process.");
    }
  }
}
