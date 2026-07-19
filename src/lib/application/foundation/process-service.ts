import { LocationRepository, ProcessRepository } from "$lib/data/repositories/foundation";
import {
  ValidationError,
  assertValid,
  validateProcess,
  type Process,
  type ProcessFields,
} from "$lib/domain/foundation";
import { FoundationService, type FoundationServiceOptions } from "./foundation-service";

export class ProcessService extends FoundationService<Process> {
  constructor(
    repository: ProcessRepository,
    private readonly locations: LocationRepository,
    options: FoundationServiceOptions,
  ) {
    super(repository, "PROC", "Process", options);
  }

  async create(input: ProcessFields) {
    assertValid(validateProcess(input));
    const location = await this.validLocation(input.primaryLocationId);
    return this.repository.create(
      {
        businessId: await this.businessId(input.businessId),
        name: input.name.trim(),
        processType: input.processType,
        primaryLocationId: location.id,
        resolvedSiteId: location.resolvedSiteId!,
        description: input.description?.trim() ?? "",
        status: input.status,
      },
      this.options.context(),
    );
  }

  async update(id: string, input: ProcessFields, expectedRevision: number) {
    const current = await this.requireMutable(id);
    const merged = { ...current, ...input };
    assertValid(validateProcess(merged));
    const location = await this.validLocation(merged.primaryLocationId);
    return this.repository.update(
      id,
      {
        name: merged.name.trim(),
        processType: merged.processType,
        primaryLocationId: location.id,
        resolvedSiteId: location.resolvedSiteId!,
        description: merged.description?.trim() ?? "",
        status: merged.status,
      },
      expectedRevision,
      this.options.context(),
    );
  }

  async moveToLocation(id: string, primaryLocationId: string, expectedRevision: number) {
    const current = await this.requireMutable(id);
    return this.update(id, { ...current, primaryLocationId }, expectedRevision);
  }

  private async validLocation(id: string) {
    const location = await this.requireActiveRelationship(this.locations, id, "primaryLocationId");
    if (!location.resolvedSiteId) {
      throw new ValidationError([{ field: "primaryLocationId", message: "Primary location must resolve to a Site.", code: "UNRESOLVED_SITE" }]);
    }
    return location;
  }

  protected title(record: Process) {
    return record.name;
  }
}
