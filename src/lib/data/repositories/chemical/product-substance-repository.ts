import type { ProductSubstance } from "$lib/domain/chemical";
import { ChemicalRecordRepository } from "./chemical-repository";
import type { RecordRepositoryOptions } from "../record-repository";

export class ProductSubstanceRepository extends ChemicalRecordRepository<ProductSubstance> {
  constructor(database: IDBDatabase, options: Partial<RecordRepositoryOptions> = {}) {
    super(database, "chemical_product_substances", { recordType: "ProductSubstance", ...options });
  }
  listForProduct(productId: string) { return this.queryIndex("byProduct", productId); }
  listProductsForSubstance(substanceId: string) { return this.queryIndex("bySubstance", substanceId); }
  async findRelationship(productId: string, substanceId: string) {
    return (await this.queryIndex("byProductAndSubstance", [productId, substanceId], true))[0] ?? null;
  }
}
