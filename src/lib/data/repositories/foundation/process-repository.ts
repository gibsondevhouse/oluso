import type { Process } from "$lib/domain/foundation";
import type { ListRecordOptions } from "../record-repository";
import { FoundationRepository } from "./foundation-repository";

export class ProcessRepository extends FoundationRepository<Process> {
  constructor(database: IDBDatabase) {
    super(database, "processes", "Process");
  }

  listByLocation(locationId: string, options: ListRecordOptions = {}) {
    return this.listByIndex("byPrimaryLocation", locationId, options);
  }

  listByResolvedSite(siteId: string, options: ListRecordOptions = {}) {
    return this.listByIndex("byResolvedSite", siteId, options);
  }
}
