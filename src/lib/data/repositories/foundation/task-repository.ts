import type { Task } from "$lib/domain/foundation";
import type { ListRecordOptions } from "../record-repository";
import { FoundationRepository } from "./foundation-repository";

export class TaskRepository extends FoundationRepository<Task> {
  constructor(database: IDBDatabase) {
    super(database, "tasks", "Task");
  }

  listByProcess(processId: string, options: ListRecordOptions = {}) {
    return this.listByIndex("byProcess", processId, options);
  }

  listByLocation(locationId: string, options: ListRecordOptions = {}) {
    return this.listByIndex("byLocation", locationId, options);
  }

  listByResolvedSite(siteId: string, options: ListRecordOptions = {}) {
    return this.listByIndex("byResolvedSite", siteId, options);
  }
}
