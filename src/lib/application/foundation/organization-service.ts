import { OrganizationRepository, PersonRepository } from "$lib/data/repositories/foundation";
import {
  assertValid,
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
    return this.repository.create(
      {
        businessId: await this.businessId(input.businessId),
        name: input.name.trim(),
        organizationType: input.organizationType,
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
    await this.validatePrimaryContact(merged.primaryContactPersonId);
    return this.repository.update(
      id,
      {
        name: merged.name.trim(),
        organizationType: merged.organizationType,
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

  protected title(record: Organization) {
    return record.name;
  }
}
