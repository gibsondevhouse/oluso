import type { Organization } from "$lib/domain/enterprise";
import type { ListRecordOptions } from "../record-repository";
import { FoundationRepository } from "../foundation/foundation-repository";

export class OrganizationRepository extends FoundationRepository<Organization> {
  constructor(database: IDBDatabase) {
    super(database, "organizations", "Organization");
  }

  listChildren(parentOrganizationId: string, options: ListRecordOptions = {}) {
    return this.listByIndex("byParentOrganization", parentOrganizationId, options);
  }

  listByType(organizationType: string, options: ListRecordOptions = {}) {
    return this.listByIndex("byOrganizationType", organizationType, options);
  }

  async listDescendants(parentOrganizationId: string, options: ListRecordOptions = {}) {
    const descendants: Organization[] = [];
    const pending = [...await this.listChildren(parentOrganizationId, options)];
    const seen = new Set<string>();
    while (pending.length) {
      const organization = pending.shift()!;
      if (seen.has(organization.id)) continue;
      seen.add(organization.id);
      descendants.push(organization);
      pending.push(...await this.listChildren(organization.id, options));
    }
    return descendants;
  }
}
