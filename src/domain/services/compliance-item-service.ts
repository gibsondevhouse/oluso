import {
  validateComplianceItemInput,
  type ComplianceItemInput,
  type ComplianceItemRecord,
} from "$lib/persistence/compliance-item.types";
import type {
  DomainRepositorySet,
  IdentifiedLifecycleRecord,
  RegisterRepository,
  TransactionCoordinator,
} from "../contracts";
import { RelationshipError } from "../errors";
import { BaseRegisterService } from "./base-register-service";

type ComplianceRelationshipRepositories = Pick<
  DomainRepositorySet,
  "locations" | "processes" | "equipment" | "segs"
>;

export class ComplianceItemService extends BaseRegisterService<
  ComplianceItemRecord,
  ComplianceItemInput
> {
  constructor(
    repository: RegisterRepository<ComplianceItemRecord, ComplianceItemInput>,
    private readonly repositories: ComplianceRelationshipRepositories,
    transactionCoordinator?: TransactionCoordinator,
  ) {
    super(repository, "Compliance item", transactionCoordinator);
  }

  protected validateInput(input: ComplianceItemInput) {
    return validateComplianceItemInput(input).errors;
  }

  protected validateRelationships(input: ComplianceItemInput) {
    const location = this.getActiveRelatedRecord(
      this.repositories.locations,
      input.locationId,
      "Selected location",
    );
    const process = this.getActiveRelatedRecord(
      this.repositories.processes,
      input.processId,
      "Selected process",
    );
    const equipment = this.getActiveRelatedRecord(
      this.repositories.equipment,
      input.equipmentId,
      "Selected equipment",
    );
    const seg = this.getActiveRelatedRecord(
      this.repositories.segs,
      input.segId,
      "Selected SEG",
    );

    if (location && process && process.locationId !== location.id) {
      throw new RelationshipError("Selected process does not belong to the selected location.");
    }

    if (location && equipment && equipment.locationId !== location.id) {
      throw new RelationshipError("Selected equipment does not belong to the selected location.");
    }

    if (process && equipment && equipment.processId !== process.id) {
      throw new RelationshipError("Selected equipment does not belong to the selected process.");
    }

    if (location && seg && seg.locationId !== location.id) {
      throw new RelationshipError("Selected SEG does not belong to the selected location.");
    }

    if (process && seg && seg.processId !== process.id) {
      throw new RelationshipError("Selected SEG does not belong to the selected process.");
    }
  }

  private getActiveRelatedRecord<TRecord extends IdentifiedLifecycleRecord>(
    repository: Pick<RegisterRepository<TRecord, object>, "getById">,
    id: string,
    label: string,
  ): TRecord | null {
    const trimmedId = id.trim();
    if (!trimmedId) {
      return null;
    }

    const record = repository.getById(trimmedId);
    if (!record) {
      throw new RelationshipError(`${label} was not found.`);
    }

    if (record.lifecycleStatus === "archived") {
      throw new RelationshipError(`${label} is archived and cannot be linked.`);
    }

    return record;
  }
}
