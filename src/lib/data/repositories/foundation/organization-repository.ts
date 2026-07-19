import type { Organization } from "$lib/domain/foundation";
import { FoundationRepository } from "./foundation-repository";

export class OrganizationRepository extends FoundationRepository<Organization> {
  constructor(database: IDBDatabase) {
    super(database, "organizations", "Organization");
  }
}
