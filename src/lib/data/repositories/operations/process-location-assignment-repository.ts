import type { ProcessLocationAssignment } from "$lib/domain/operations";
import type { ListRecordOptions } from "../record-repository";
import { FoundationRepository } from "../foundation/foundation-repository";

export class ProcessLocationAssignmentRepository extends FoundationRepository<ProcessLocationAssignment> {
  constructor(database: IDBDatabase) { super(database, "process_location_assignments", "ProcessLocationAssignment"); }
  listByProcess(id: string, options: ListRecordOptions = {}) { return this.listByIndex("byProcess", id, options); }
  listByLocation(id: string, options: ListRecordOptions = {}) { return this.listByIndex("byLocation", id, options); }
}
