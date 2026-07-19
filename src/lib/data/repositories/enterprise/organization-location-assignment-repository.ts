import type { OrganizationLocationAssignment } from "$lib/domain/enterprise";
import type { ListRecordOptions } from "../record-repository";
import { FoundationRepository } from "../foundation/foundation-repository";

export class OrganizationLocationAssignmentRepository extends FoundationRepository<OrganizationLocationAssignment> {
  constructor(database: IDBDatabase) { super(database, "organization_location_assignments", "OrganizationLocationAssignment"); }
  listByOrganization(id: string, options: ListRecordOptions = {}) { return this.listByIndex("byOrganization", id, options); }
  listByLocation(id: string, options: ListRecordOptions = {}) { return this.listByIndex("byLocation", id, options); }
}
