import { LocationRepository } from "$lib/data/repositories/location";
import { ProcessLocationAssignmentRepository, ProcessRepository } from "$lib/data/repositories/operations";
import { CrossSiteRelationshipError, ValidationError } from "$lib/domain/foundation";
import {
  PROCESS_LOCATION_RELATIONSHIP_TYPES,
  type ProcessLocationAssignment,
  type ProcessLocationAssignmentFields,
} from "$lib/domain/operations";
import { FoundationService, type FoundationServiceOptions } from "../foundation/foundation-service";

export class ProcessLocationAssignmentService extends FoundationService<ProcessLocationAssignment> {
  constructor(
    repository: ProcessLocationAssignmentRepository,
    private readonly processes: ProcessRepository,
    private readonly locations: LocationRepository,
    options: FoundationServiceOptions,
  ) { super(repository, "PLA", "ProcessLocationAssignment", options); }

  async create(input: ProcessLocationAssignmentFields) {
    const normalized = await this.normalize(input);
    await this.requireSinglePrimary(normalized);
    return this.repository.create({ businessId: await this.businessId(input.businessId), ...normalized }, this.options.context());
  }
  async update(id: string, input: ProcessLocationAssignmentFields, expectedRevision: number) {
    const current = await this.requireMutable(id);
    const normalized = await this.normalize({ ...current, ...input });
    if (current.relationshipType === "Primary" && current.status === "Active" &&
      (normalized.relationshipType !== "Primary" || normalized.status !== "Active")) {
      throw new ValidationError([{ field: "relationshipType", message: "The active Primary assignment must be changed through the Process move workflow.", code: "PRIMARY_ASSIGNMENT_REQUIRED" }]);
    }
    await this.requireSinglePrimary(normalized, id);
    return this.repository.update(id, normalized, expectedRevision, this.options.context());
  }
  async archive(id: string, expectedRevision: number, reason: string) {
    const current = await this.requireMutable(id);
    if (current.relationshipType === "Primary" && current.status === "Active") {
      throw new ValidationError([{ field: "relationshipType", message: "The active Primary assignment cannot be archived while the Process is active.", code: "PRIMARY_ASSIGNMENT_REQUIRED" }]);
    }
    return super.archive(id, expectedRevision, reason);
  }
  private async normalize(input: ProcessLocationAssignmentFields) {
    if (!input.processId || !input.locationId || !PROCESS_LOCATION_RELATIONSHIP_TYPES.includes(input.relationshipType)) {
      throw new ValidationError([{ field: "relationshipType", message: "Process, Location, and relationship type are required.", code: "REQUIRED" }]);
    }
    if (input.effectiveFrom && input.effectiveTo && input.effectiveTo < input.effectiveFrom) {
      throw new ValidationError([{ field: "effectiveTo", message: "Effective end cannot precede effective start.", code: "INVALID_PERIOD" }]);
    }
    const process = await this.requireActiveRelationship(this.processes, input.processId, "processId");
    const location = await this.requireActiveRelationship(this.locations, input.locationId, "locationId");
    if (!location.resolvedSiteId || location.resolvedSiteId !== process.resolvedSiteId) {
      throw new CrossSiteRelationshipError("Process Location Assignment", process.resolvedSiteId, location.resolvedSiteId ?? "an unresolved Site");
    }
    return {
      processId: input.processId, locationId: input.locationId, relationshipType: input.relationshipType,
      sequence: input.sequence ?? null, effectiveFrom: input.effectiveFrom || null, effectiveTo: input.effectiveTo || null,
      status: input.status, notes: input.notes?.trim() ?? "",
    };
  }
  private async requireSinglePrimary(input: ProcessLocationAssignmentFields, currentId?: string) {
    if (input.relationshipType !== "Primary" || input.status !== "Active") return;
    const existing = await (this.repository as ProcessLocationAssignmentRepository).listByProcess(input.processId, { includeArchived: true });
    if (existing.some((assignment) => assignment.id !== currentId && assignment.lifecycleStatus === "active" && assignment.status === "Active" && assignment.relationshipType === "Primary")) {
      throw new ValidationError([{ field: "relationshipType", message: "A Process must have exactly one active Primary Location assignment.", code: "DUPLICATE_PRIMARY" }]);
    }
  }
  protected title(record: ProcessLocationAssignment) { return `${record.processId} · ${record.locationId}`; }
}
