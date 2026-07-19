import { LocationRepository, OrganizationRepository, PersonRepository } from "$lib/data/repositories/foundation";
import {
  ValidationError,
  assertValid,
  validatePerson,
  type Person,
  type PersonFields,
} from "$lib/domain/foundation";
import { FoundationService, type FoundationServiceOptions } from "./foundation-service";

export class PersonService extends FoundationService<Person> {
  constructor(
    repository: PersonRepository,
    private readonly organizations: OrganizationRepository,
    private readonly locations: LocationRepository,
    options: FoundationServiceOptions,
  ) {
    super(repository, "PER", "Person", options);
  }

  async create(input: PersonFields) {
    assertValid(validatePerson(input));
    await this.validateRelationships(input);
    return this.repository.create(
      {
        businessId: await this.businessId(input.businessId),
        displayName: input.displayName.trim(),
        personType: input.personType,
        organizationId: input.organizationId || null,
        employeeIdentifier: input.employeeIdentifier?.trim() ?? "",
        jobTitle: input.jobTitle?.trim() ?? "",
        department: input.department?.trim() ?? "",
        supervisorPersonId: input.supervisorPersonId || null,
        primarySiteId: input.primarySiteId || null,
        email: input.email?.trim() ?? "",
        phone: input.phone?.trim() ?? "",
        description: input.description?.trim() ?? "",
        status: input.status,
      },
      this.options.context(),
    );
  }

  async update(id: string, input: PersonFields, expectedRevision: number) {
    const current = await this.requireMutable(id);
    const merged = { ...current, ...input };
    assertValid(validatePerson(merged));
    if (merged.supervisorPersonId === id) {
      throw new ValidationError([{ field: "supervisorPersonId", message: "A person cannot supervise themselves.", code: "SELF_REFERENCE" }]);
    }
    await this.validateRelationships(merged);
    return this.repository.update(
      id,
      {
        displayName: merged.displayName.trim(),
        personType: merged.personType,
        organizationId: merged.organizationId || null,
        employeeIdentifier: merged.employeeIdentifier?.trim() ?? "",
        jobTitle: merged.jobTitle?.trim() ?? "",
        department: merged.department?.trim() ?? "",
        supervisorPersonId: merged.supervisorPersonId || null,
        primarySiteId: merged.primarySiteId || null,
        email: merged.email?.trim() ?? "",
        phone: merged.phone?.trim() ?? "",
        description: merged.description?.trim() ?? "",
        status: merged.status,
      },
      expectedRevision,
      this.options.context(),
    );
  }

  assignOrganization(id: string, organizationId: string | null, expectedRevision: number) {
    return this.updateFromCurrent(id, { organizationId }, expectedRevision);
  }

  assignSupervisor(id: string, supervisorPersonId: string | null, expectedRevision: number) {
    return this.updateFromCurrent(id, { supervisorPersonId }, expectedRevision);
  }

  assignPrimarySite(id: string, primarySiteId: string | null, expectedRevision: number) {
    return this.updateFromCurrent(id, { primarySiteId }, expectedRevision);
  }

  private async updateFromCurrent(id: string, patch: Partial<PersonFields>, expectedRevision: number) {
    const current = await this.requireMutable(id);
    return this.update(id, { ...current, ...patch }, expectedRevision);
  }

  private async validateRelationships(input: PersonFields) {
    if (input.organizationId) {
      await this.requireActiveRelationship(this.organizations, input.organizationId, "organizationId");
    }
    if (input.supervisorPersonId) {
      await this.requireActiveRelationship(this.repository, input.supervisorPersonId, "supervisorPersonId");
    }
    if (input.primarySiteId) {
      const site = await this.requireActiveRelationship(this.locations, input.primarySiteId, "primarySiteId");
      if (site.nodeType !== "Site") {
        throw new ValidationError([{ field: "primarySiteId", message: "Primary Site must reference a Site location.", code: "INVALID_SITE" }]);
      }
    }
  }

  protected title(record: Person) {
    return record.displayName;
  }
}
