import { LocationRepository, ProcessRepository, TaskRepository } from "$lib/data/repositories/foundation";
import {
  CrossSiteRelationshipError,
  assertValid,
  validateTask,
  type Task,
  type TaskFields,
} from "$lib/domain/foundation";
import { FoundationService, type FoundationServiceOptions } from "./foundation-service";

export class TaskService extends FoundationService<Task> {
  constructor(
    repository: TaskRepository,
    private readonly processes: ProcessRepository,
    private readonly locations: LocationRepository,
    options: FoundationServiceOptions,
  ) {
    super(repository, "TASK", "Task", options);
  }

  async create(input: TaskFields) {
    assertValid(validateTask(input));
    const { process, location } = await this.validateRelationships(input);
    return this.repository.create(
      {
        businessId: await this.businessId(input.businessId),
        name: input.name.trim(),
        taskType: input.taskType,
        processId: process.id,
        locationId: location.id,
        resolvedSiteId: process.resolvedSiteId,
        description: input.description?.trim() ?? "",
        routineStatus: input.routineStatus,
        operatingCondition: input.operatingCondition,
        status: input.status,
      },
      this.options.context(),
    );
  }

  async update(id: string, input: TaskFields, expectedRevision: number) {
    const current = await this.requireMutable(id);
    const merged = { ...current, ...input };
    assertValid(validateTask(merged));
    const { process, location } = await this.validateRelationships(merged);
    return this.repository.update(
      id,
      {
        name: merged.name.trim(),
        taskType: merged.taskType,
        processId: process.id,
        locationId: location.id,
        resolvedSiteId: process.resolvedSiteId,
        description: merged.description?.trim() ?? "",
        routineStatus: merged.routineStatus,
        operatingCondition: merged.operatingCondition,
        status: merged.status,
      },
      expectedRevision,
      this.options.context(),
    );
  }

  async changeOperatingCondition(id: string, operatingCondition: TaskFields["operatingCondition"], expectedRevision: number) {
    const current = await this.requireMutable(id);
    return this.update(id, { ...current, operatingCondition }, expectedRevision);
  }

  async moveToProcess(id: string, processId: string, expectedRevision: number) {
    const current = await this.requireMutable(id);
    return this.update(id, { ...current, processId }, expectedRevision);
  }

  private async validateRelationships(input: TaskFields) {
    const process = await this.requireActiveRelationship(this.processes, input.processId, "processId");
    const location = await this.requireActiveRelationship(this.locations, input.locationId, "locationId");
    if (!location.resolvedSiteId || location.resolvedSiteId !== process.resolvedSiteId) {
      throw new CrossSiteRelationshipError(
        "Task",
        process.resolvedSiteId,
        location.resolvedSiteId ?? "an unresolved Site",
      );
    }
    return { process, location };
  }

  protected title(record: Task) {
    return record.name;
  }
}
