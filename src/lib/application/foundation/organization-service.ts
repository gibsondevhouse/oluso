import { OrganizationRepository, PersonRepository } from "$lib/data/repositories/foundation";
import {
  CircularOrganizationHierarchyError,
  ValidationError,
  assertValid,
  isInternalOrganizationType,
  isValidOrganizationParent,
  validateOrganization,
  type Organization,
  type OrganizationFields,
} from "$lib/domain/foundation";
import { FoundationService, type FoundationServiceOptions } from "./foundation-service";

export class OrganizationService extends FoundationService<Organization> {
  constructor(
    repository: OrganizationRepository,
    private readonly people: PersonRepository,
    options: FoundationServiceOptions,
  ) {
    super(repository, "ORG", "Organization", options);
  }

  async create(input: OrganizationFields) {
    assertValid(validateOrganization(input));
    await this.validatePrimaryContact(input.primaryContactPersonId);
    await this.validateParent(input.organizationType, input.parentOrganizationId ?? null);
    return this.repository.create(
      {
        businessId: await this.businessId(input.businessId),
        name: input.name.trim(),
        organizationType: input.organizationType,
        parentOrganizationId: input.parentOrganizationId || null,
        organizationCode: input.organizationCode?.trim() ?? "",
        legalEntityCode: input.legalEntityCode?.trim() ?? "",
        countryCode: input.countryCode?.trim().toUpperCase() ?? "",
        status: input.status,
        description: input.description?.trim() ?? "",
        primaryContactPersonId: input.primaryContactPersonId || null,
      },
      this.options.context(),
    );
  }

  async update(id: string, input: OrganizationFields, expectedRevision: number) {
    const current = await this.requireMutable(id);
    const merged = { ...current, ...input };
    assertValid(validateOrganization(merged));
    if (merged.parentOrganizationId === id) throw new CircularOrganizationHierarchyError(id, id);
    const descendants = await (this.repository as OrganizationRepository).listDescendants(id, { includeArchived: true });
    if (merged.parentOrganizationId && descendants.some((candidate) => candidate.id === merged.parentOrganizationId)) {
      throw new CircularOrganizationHierarchyError(id, merged.parentOrganizationId);
    }
    await this.validateParent(merged.organizationType, merged.parentOrganizationId ?? null);
    await this.validatePrimaryContact(merged.primaryContactPersonId);
    return this.repository.update(
      id,
      {
        name: merged.name.trim(),
        organizationType: merged.organizationType,
        parentOrganizationId: merged.parentOrganizationId || null,
        organizationCode: merged.organizationCode?.trim() ?? "",
        legalEntityCode: merged.legalEntityCode?.trim() ?? "",
        countryCode: merged.countryCode?.trim().toUpperCase() ?? "",
        status: merged.status,
        description: merged.description?.trim() ?? "",
        primaryContactPersonId: merged.primaryContactPersonId || null,
      },
      expectedRevision,
      this.options.context(),
    );
  }

  private async validatePrimaryContact(personId?: string | null) {
    if (personId) await this.requireActiveRelationship(this.people, personId, "primaryContactPersonId");
  }

  private async validateParent(organizationType: OrganizationFields["organizationType"], parentId: string | null) {
    if (!isInternalOrganizationType(organizationType)) {
      return parentId
        ? this.requireActiveRelationship(this.repository, parentId, "parentOrganizationId")
        : null;
    }
    if (organizationType === "Corporate Group") {
      if (parentId) throw new ValidationError([{ field: "parentOrganizationId", message: "A Corporate Group cannot have a parent.", code: "INVALID_PARENT" }]);
      return null;
    }
    if (!parentId) {
      throw new ValidationError([{ field: "parentOrganizationId", message: `${organizationType} requires a parent Organization.`, code: "REQUIRED" }]);
    }
    const parent = await this.requireActiveRelationship(this.repository, parentId, "parentOrganizationId");
    if (!isValidOrganizationParent(organizationType, parent)) {
      throw new ValidationError([{ field: "parentOrganizationId", message: `${organizationType} cannot be placed under ${parent.organizationType}.`, code: "INVALID_PARENT" }]);
    }
    return parent;
  }

  listChildren(id: string, includeArchived = false) {
    return (this.repository as OrganizationRepository).listChildren(id, { includeArchived });
  }

  listDescendants(id: string, includeArchived = false) {
    return (this.repository as OrganizationRepository).listDescendants(id, { includeArchived });
  }

  protected title(record: Organization) {
    return record.name;
  }
}
