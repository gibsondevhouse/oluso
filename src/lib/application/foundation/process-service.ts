import { LocationRepository, ProcessRepository } from "$lib/data/repositories/foundation";
import {
  LocationFunctionAssignmentRepository,
  OperationalFunctionRepository,
  ProcessLocationAssignmentRepository,
} from "$lib/data/repositories/operations";
import {
  CrossSiteRelationshipError,
  ValidationError,
  assertValid,
  validateProcess,
  type Process,
  type ProcessFields,
} from "$lib/domain/foundation";
import { assignmentIsEffective } from "$lib/domain/operations";
import { FoundationService, type FoundationServiceOptions } from "./foundation-service";

export class ProcessService extends FoundationService<Process> {
  constructor(
    repository: ProcessRepository,
    private readonly locations: LocationRepository,
    private readonly functions: OperationalFunctionRepository,
    private readonly locationFunctions: LocationFunctionAssignmentRepository,
    private readonly processLocations: ProcessLocationAssignmentRepository,
    options: FoundationServiceOptions,
  ) {
    super(repository, "PROC", "Process", options);
  }

  async create(input: ProcessFields) {
    assertValid(validateProcess(input));
    const location = await this.validLocation(input.primaryLocationId);
    await this.validFunctionAtLocation(input.operationalFunctionId, location.id);
    const businessId = await this.businessId(input.businessId);
    return (this.repository as ProcessRepository).createWithPrimaryAssignment(
      {
        businessId,
        name: input.name.trim(),
        processType: input.processType,
        operationalFunctionId: input.operationalFunctionId,
        primaryLocationId: location.id,
        resolvedSiteId: location.resolvedSiteId!,
        description: input.description?.trim() ?? "",
        status: input.status,
      },
      {
        businessId: `PLA-${businessId}`,
        processId: "pending",
        locationId: location.id,
        relationshipType: "Primary",
        sequence: null,
        effectiveFrom: null,
        effectiveTo: null,
        status: "Active",
        notes: "Primary assignment created with the Process.",
      },
      this.options.context(),
    );
  }

  async update(id: string, input: ProcessFields, expectedRevision: number) {
    const current = await this.requireMutable(id);
    const merged = { ...current, ...input };
    assertValid(validateProcess(merged));
    const location = await this.validLocation(merged.primaryLocationId);
    await this.validFunctionAtLocation(merged.operationalFunctionId, location.id);
    const patch = {
      name: merged.name.trim(),
      processType: merged.processType,
      operationalFunctionId: merged.operationalFunctionId,
      primaryLocationId: location.id,
      resolvedSiteId: location.resolvedSiteId!,
      description: merged.description?.trim() ?? "",
      status: merged.status,
    };
    if (location.id !== current.primaryLocationId) {
      const assignments = await this.processLocations.listByProcess(id, { includeArchived: true });
      const primaries = assignments
        .filter((assignment) => assignment.lifecycleStatus === "active" && assignment.status === "Active" && assignment.relationshipType === "Primary");
      if (primaries.length !== 1) {
        throw new ValidationError([{ field: "primaryLocationId", message: "Process must have exactly one active Primary Location assignment before it can move.", code: "PRIMARY_ASSIGNMENT_REQUIRED" }]);
      }
      const supportingLocationIds = assignments
        .filter((assignment) => assignment.lifecycleStatus === "active" && assignment.status === "Active" && assignment.relationshipType !== "Primary")
        .map((assignment) => assignment.locationId);
      for (const supportingLocationId of supportingLocationIds) {
        const supportingLocation = await this.requireActiveRelationship(this.locations, supportingLocationId, "primaryLocationId");
        if (supportingLocation.resolvedSiteId !== location.resolvedSiteId) {
          throw new CrossSiteRelationshipError("Process Location Assignment", location.resolvedSiteId!, supportingLocation.resolvedSiteId ?? "an unresolved Site");
        }
      }
      return (this.repository as ProcessRepository).updateWithPrimaryAssignment(
        current, patch, expectedRevision, primaries[0]!, { locationId: location.id }, this.options.context(),
      );
    }
    return this.repository.update(
      id,
      patch,
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

  private async validFunctionAtLocation(operationalFunctionId: string, locationId: string) {
    const operationalFunction = await this.requireActiveRelationship(this.functions, operationalFunctionId, "operationalFunctionId");
    if (operationalFunction.status !== "Active") {
      throw new ValidationError([{ field: "operationalFunctionId", message: "Process requires an active Operational Function.", code: "INACTIVE_FUNCTION" }]);
    }
    const assignments = await this.locationFunctions.listByLocationAndFunction(locationId, operationalFunctionId, { includeArchived: true });
    if (!assignments.some((assignment) => assignmentIsEffective(assignment))) {
      throw new ValidationError([{ field: "operationalFunctionId", message: "Primary Location requires an active compatible Function assignment.", code: "LOCATION_FUNCTION_REQUIRED" }]);
    }
  }

  protected title(record: Process) {
    return record.name;
  }
}
