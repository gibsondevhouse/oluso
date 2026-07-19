import type { OrganizationFunctionResponsibility } from "$lib/domain/enterprise";
import type { ListRecordOptions } from "../record-repository";
import { FoundationRepository } from "../foundation/foundation-repository";

export class OrganizationFunctionResponsibilityRepository extends FoundationRepository<OrganizationFunctionResponsibility> {
  constructor(database: IDBDatabase) { super(database, "organization_function_responsibilities", "OrganizationFunctionResponsibility"); }
  listByOrganization(id: string, options: ListRecordOptions = {}) { return this.listByIndex("byOrganization", id, options); }
  listByFunction(id: string, options: ListRecordOptions = {}) { return this.listByIndex("byFunction", id, options); }
  listByLocation(id: string, options: ListRecordOptions = {}) { return this.listByIndex("byLocation", id, options); }
}
