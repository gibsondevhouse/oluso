import type { SiteChemicalInventory } from "$lib/domain/chemical";
import { ChemicalRecordRepository } from "./chemical-repository";
import type { RecordRepositoryOptions } from "../record-repository";

export class SiteChemicalInventoryRepository extends ChemicalRecordRepository<SiteChemicalInventory> {
  constructor(database: IDBDatabase, options: Partial<RecordRepositoryOptions> = {}) {
    super(database, "site_chemical_inventory", { recordType: "SiteChemicalInventory", ...options });
  }
  listByProduct(id: string) { return this.queryIndex("byProduct", id); }
  listBySite(id: string) { return this.queryIndex("bySite", id); }
  listByStorageLocation(id: string) { return this.queryIndex("byStorageLocation", id); }
}
