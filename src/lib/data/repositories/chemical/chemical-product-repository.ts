import type { ChemicalProduct } from "$lib/domain/chemical";
import { ChemicalRecordRepository } from "./chemical-repository";
import type { RecordRepositoryOptions } from "../record-repository";

export class ChemicalProductRepository extends ChemicalRecordRepository<ChemicalProduct> {
  constructor(database: IDBDatabase, options: Partial<RecordRepositoryOptions> = {}) {
    super(database, "chemical_products", { recordType: "ChemicalProduct", ...options });
  }
  listByManufacturer(id: string) { return this.queryIndex("byManufacturer", id); }
  listByProductName(name: string) { return this.queryIndex("byProductName", name); }
  listByProductCode(code: string) { return this.queryIndex("byProductCode", code); }
}
