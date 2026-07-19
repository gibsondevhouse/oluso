import type { Person } from "$lib/domain/foundation";
import type { ListRecordOptions } from "../record-repository";
import { FoundationRepository } from "./foundation-repository";

export class PersonRepository extends FoundationRepository<Person> {
  constructor(database: IDBDatabase) {
    super(database, "people", "Person");
  }

  listByOrganization(organizationId: string, options: ListRecordOptions = {}) {
    return this.listByIndex("byOrganization", organizationId, options);
  }

  listByPrimarySite(siteId: string, options: ListRecordOptions = {}) {
    return this.listByIndex("byPrimarySite", siteId, options);
  }
}
