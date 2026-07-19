import { OrganizationRepository } from "$lib/data/repositories/enterprise";
import { LocationRepository } from "$lib/data/repositories/location";
import { PersonRepository } from "$lib/data/repositories/foundation";
import { LocationFunctionAssignmentRepository, OperationalFunctionRepository } from "$lib/data/repositories/operations";
import { ValidationError } from "$lib/domain/foundation";
import { isPhysicalLocation } from "$lib/domain/location";
import {
  LOCATION_FUNCTION_ASSIGNMENT_TYPES,
  assignmentIsEffective,
  type LocationFunctionAssignment,
  type LocationFunctionAssignmentFields,
} from "$lib/domain/operations";
import { FoundationService, type FoundationServiceOptions } from "../foundation/foundation-service";

function periodsOverlap(left: LocationFunctionAssignmentFields, right: LocationFunctionAssignment) {
  const leftStart = left.effectiveFrom || "0000-01-01";
  const leftEnd = left.effectiveTo || "9999-12-31";
  const rightStart = right.effectiveFrom || "0000-01-01";
  const rightEnd = right.effectiveTo || "9999-12-31";
  return leftStart <= rightEnd && rightStart <= leftEnd;
}

export class LocationFunctionAssignmentService extends FoundationService<LocationFunctionAssignment> {
  constructor(
    repository: LocationFunctionAssignmentRepository,
    private readonly locations: LocationRepository,
    private readonly functions: OperationalFunctionRepository,
    private readonly organizations: OrganizationRepository,
    private readonly people: PersonRepository,
    options: FoundationServiceOptions,
  ) { super(repository, "LFA", "LocationFunctionAssignment", options); }

  async create(input: LocationFunctionAssignmentFields) {
    const normalized = await this.normalize(input);
    await this.rejectDuplicate(normalized);
    return this.repository.create({ businessId: await this.businessId(input.businessId), ...normalized }, this.options.context());
  }
  async update(id: string, input: LocationFunctionAssignmentFields, expectedRevision: number) {
    const current = await this.requireMutable(id);
    const normalized = await this.normalize({ ...current, ...input });
    await this.rejectDuplicate(normalized, id);
    return this.repository.update(id, normalized, expectedRevision, this.options.context());
  }
  isEffective(assignment: LocationFunctionAssignment, onDate?: string) { return assignmentIsEffective(assignment, onDate); }
  async hasActiveAssignment(locationId: string, operationalFunctionId: string, onDate?: string) {
    return (await (this.repository as LocationFunctionAssignmentRepository).listByLocationAndFunction(locationId, operationalFunctionId, { includeArchived: true }))
      .some((assignment) => assignmentIsEffective(assignment, onDate));
  }
  private async normalize(input: LocationFunctionAssignmentFields) {
    if (!input.locationId || !input.operationalFunctionId || !LOCATION_FUNCTION_ASSIGNMENT_TYPES.includes(input.assignmentType)) {
      throw new ValidationError([{ field: "assignmentType", message: "Location, Function, and assignment type are required.", code: "REQUIRED" }]);
    }
    if (input.effectiveFrom && input.effectiveTo && input.effectiveTo < input.effectiveFrom) {
      throw new ValidationError([{ field: "effectiveTo", message: "Effective end cannot precede effective start.", code: "INVALID_PERIOD" }]);
    }
    const location = await this.requireActiveRelationship(this.locations, input.locationId, "locationId");
    if (!isPhysicalLocation(location.nodeType)) throw new ValidationError([{ field: "locationId", message: "Operational Functions may only be assigned to physical Locations.", code: "GEOGRAPHIC_FUNCTION_PROHIBITED" }]);
    await this.requireActiveRelationship(this.functions, input.operationalFunctionId, "operationalFunctionId");
    if (input.responsibleOrganizationId) await this.requireActiveRelationship(this.organizations, input.responsibleOrganizationId, "responsibleOrganizationId");
    if (input.responsiblePersonId) await this.requireActiveRelationship(this.people, input.responsiblePersonId, "responsiblePersonId");
    return {
      locationId: input.locationId, operationalFunctionId: input.operationalFunctionId, assignmentType: input.assignmentType,
      effectiveFrom: input.effectiveFrom || null, effectiveTo: input.effectiveTo || null,
      isPrimary: input.isPrimary ?? false, scopeDescription: input.scopeDescription?.trim() ?? "",
      responsibleOrganizationId: input.responsibleOrganizationId || null, responsiblePersonId: input.responsiblePersonId || null,
      status: input.status, notes: input.notes?.trim() ?? "",
    };
  }
  private async rejectDuplicate(input: LocationFunctionAssignmentFields, currentId?: string) {
    const candidates = await (this.repository as LocationFunctionAssignmentRepository).listByLocationAndFunction(input.locationId, input.operationalFunctionId, { includeArchived: true });
    const duplicate = candidates.find((candidate) => candidate.id !== currentId && candidate.lifecycleStatus === "active" && candidate.status === "Active" && input.status === "Active" &&
      candidate.scopeDescription.trim().toLocaleLowerCase() === (input.scopeDescription ?? "").trim().toLocaleLowerCase() && periodsOverlap(input, candidate));
    if (duplicate) throw new ValidationError([{ field: "operationalFunctionId", message: "An overlapping active assignment already exists for this Location, Function, and scope.", code: "DUPLICATE_ACTIVE_ASSIGNMENT" }]);
  }
  protected title(record: LocationFunctionAssignment) { return `${record.locationId} · ${record.operationalFunctionId}`; }
}
