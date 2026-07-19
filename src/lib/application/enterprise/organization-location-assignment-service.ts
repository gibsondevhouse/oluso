import { LocationRepository } from "$lib/data/repositories/location";
import {
  OrganizationLocationAssignmentRepository,
  OrganizationRepository,
} from "$lib/data/repositories/enterprise";
import {
  ORGANIZATION_LOCATION_RELATIONSHIP_TYPES,
  hasValidEffectivePeriod,
  type OrganizationLocationAssignment,
  type OrganizationLocationAssignmentFields,
} from "$lib/domain/enterprise";
import { isGeographicLocation } from "$lib/domain/location";
import { ValidationError } from "$lib/domain/foundation";
import { FoundationService, type FoundationServiceOptions } from "../foundation/foundation-service";

export class OrganizationLocationAssignmentService extends FoundationService<OrganizationLocationAssignment> {
  constructor(
    repository: OrganizationLocationAssignmentRepository,
    private readonly organizations: OrganizationRepository,
    private readonly locations: LocationRepository,
    options: FoundationServiceOptions,
  ) { super(repository, "OLA", "OrganizationLocationAssignment", options); }

  async create(input: OrganizationLocationAssignmentFields) {
    const normalized = await this.normalize(input);
    return this.repository.create({ businessId: await this.businessId(input.businessId), ...normalized }, this.options.context());
  }

  async update(id: string, input: OrganizationLocationAssignmentFields, expectedRevision: number) {
    const current = await this.requireMutable(id);
    const normalized = await this.normalize({ ...current, ...input });
    return this.repository.update(id, normalized, expectedRevision, this.options.context());
  }

  private async normalize(input: OrganizationLocationAssignmentFields) {
    if (!input.organizationId || !input.locationId || !ORGANIZATION_LOCATION_RELATIONSHIP_TYPES.includes(input.relationshipType)) {
      throw new ValidationError([{ field: "relationshipType", message: "Organization, Location, and relationship type are required.", code: "REQUIRED" }]);
    }
    if (!hasValidEffectivePeriod(input.effectiveFrom, input.effectiveTo)) {
      throw new ValidationError([{ field: "effectiveTo", message: "Effective end cannot precede effective start.", code: "INVALID_PERIOD" }]);
    }
    await this.requireActiveRelationship(this.organizations, input.organizationId, "organizationId");
    const location = await this.requireActiveRelationship(this.locations, input.locationId, "locationId");
    if (["Owns", "Leases"].includes(input.relationshipType) && isGeographicLocation(location.nodeType)) {
      throw new ValidationError([{ field: "relationshipType", message: "Ownership and leasing cannot be assigned to geographic Locations.", code: "GEOGRAPHIC_OWNERSHIP_PROHIBITED" }]);
    }
    return {
      organizationId: input.organizationId, locationId: input.locationId, relationshipType: input.relationshipType,
      effectiveFrom: input.effectiveFrom || null, effectiveTo: input.effectiveTo || null,
      isPrimary: input.isPrimary ?? false, scopeDescription: input.scopeDescription?.trim() ?? "",
      status: input.status, notes: input.notes?.trim() ?? "",
    };
  }

  protected title(record: OrganizationLocationAssignment) { return `${record.organizationId} · ${record.locationId}`; }
}
