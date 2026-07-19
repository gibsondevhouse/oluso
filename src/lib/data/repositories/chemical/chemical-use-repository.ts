import type { ChemicalUse } from "$lib/domain/chemical";
import { ChemicalRecordRepository } from "./chemical-repository";
import type { RecordRepositoryOptions } from "../record-repository";

export class ChemicalUseRepository extends ChemicalRecordRepository<ChemicalUse> {
  constructor(database: IDBDatabase, options: Partial<RecordRepositoryOptions> = {}) {
    super(database, "chemical_uses", { recordType: "ChemicalUse", ...options });
  }
  listByProduct(id: string) { return this.queryIndex("byProduct", id); }
  listBySite(id: string) { return this.queryIndex("bySite", id); }
  listByLocation(id: string) { return this.queryIndex("byLocation", id); }
  listByProcess(id: string) { return this.queryIndex("byProcess", id); }
  listByTask(id: string) { return this.queryIndex("byTask", id); }
  listByOperationalFunction(id: string) { return this.queryIndex("byOperationalFunction", id); }
}
