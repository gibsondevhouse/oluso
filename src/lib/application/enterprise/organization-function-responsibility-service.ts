import {
  OrganizationFunctionResponsibilityRepository,
  OrganizationRepository,
} from "$lib/data/repositories/enterprise";
import { LocationRepository } from "$lib/data/repositories/location";
import { OperationalFunctionRepository } from "$lib/data/repositories/operations";
import {
  ORGANIZATION_FUNCTION_RESPONSIBILITY_TYPES,
  hasValidEffectivePeriod,
  type OrganizationFunctionResponsibility,
  type OrganizationFunctionResponsibilityFields,
} from "$lib/domain/enterprise";
import { ValidationError } from "$lib/domain/foundation";
import { FoundationService, type FoundationServiceOptions } from "../foundation/foundation-service";

export class OrganizationFunctionResponsibilityService extends FoundationService<OrganizationFunctionResponsibility> {
  constructor(
    repository: OrganizationFunctionResponsibilityRepository,
    private readonly organizations: OrganizationRepository,
    private readonly functions: OperationalFunctionRepository,
    private readonly locations: LocationRepository,
    options: FoundationServiceOptions,
  ) { super(repository, "OFR", "OrganizationFunctionResponsibility", options); }

  async create(input: OrganizationFunctionResponsibilityFields) {
    const normalized = await this.normalize(input);
    return this.repository.create({ businessId: await this.businessId(input.businessId), ...normalized }, this.options.context());
  }
  async update(id: string, input: OrganizationFunctionResponsibilityFields, expectedRevision: number) {
    const current = await this.requireMutable(id);
    return this.repository.update(id, await this.normalize({ ...current, ...input }), expectedRevision, this.options.context());
  }
  private async normalize(input: OrganizationFunctionResponsibilityFields) {
    if (!input.organizationId || !input.operationalFunctionId || !ORGANIZATION_FUNCTION_RESPONSIBILITY_TYPES.includes(input.responsibilityType)) {
      throw new ValidationError([{ field: "responsibilityType", message: "Organization, Function, and responsibility type are required.", code: "REQUIRED" }]);
    }
    if (!hasValidEffectivePeriod(input.effectiveFrom, input.effectiveTo)) {
      throw new ValidationError([{ field: "effectiveTo", message: "Effective end cannot precede effective start.", code: "INVALID_PERIOD" }]);
    }
    await this.requireActiveRelationship(this.organizations, input.organizationId, "organizationId");
    await this.requireActiveRelationship(this.functions, input.operationalFunctionId, "operationalFunctionId");
    if (input.locationId) await this.requireActiveRelationship(this.locations, input.locationId, "locationId");
    return {
      organizationId: input.organizationId, operationalFunctionId: input.operationalFunctionId,
      locationId: input.locationId || null, responsibilityType: input.responsibilityType,
      effectiveFrom: input.effectiveFrom || null, effectiveTo: input.effectiveTo || null,
      isPrimary: input.isPrimary ?? false, scopeDescription: input.scopeDescription?.trim() ?? "",
      status: input.status, notes: input.notes?.trim() ?? "",
    };
  }
  protected title(record: OrganizationFunctionResponsibility) { return `${record.organizationId} · ${record.operationalFunctionId}`; }
}
