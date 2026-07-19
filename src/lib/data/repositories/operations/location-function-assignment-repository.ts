import type { LocationFunctionAssignment } from "$lib/domain/operations";
import type { ListRecordOptions } from "../record-repository";
import { FoundationRepository } from "../foundation/foundation-repository";

export class LocationFunctionAssignmentRepository extends FoundationRepository<LocationFunctionAssignment> {
  constructor(database: IDBDatabase) { super(database, "location_function_assignments", "LocationFunctionAssignment"); }
  listByLocation(id: string, options: ListRecordOptions = {}) { return this.listByIndex("byLocation", id, options); }
  listByFunction(id: string, options: ListRecordOptions = {}) { return this.listByIndex("byFunction", id, options); }
  listByLocationAndFunction(locationId: string, operationalFunctionId: string, options: ListRecordOptions = {}) {
    return this.listByIndex("byLocationAndFunction", [locationId, operationalFunctionId], options);
  }
}
