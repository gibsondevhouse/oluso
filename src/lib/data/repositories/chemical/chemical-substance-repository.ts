import type { ChemicalSubstance } from "$lib/domain/chemical";
import { ChemicalRecordRepository } from "./chemical-repository";
import type { RecordRepositoryOptions } from "../record-repository";

export class ChemicalSubstanceRepository extends ChemicalRecordRepository<ChemicalSubstance> {
  constructor(database: IDBDatabase, options: Partial<RecordRepositoryOptions> = {}) {
    super(database, "chemical_substances", { recordType: "ChemicalSubstance", ...options });
  }
  async findByCasNumber(casNumber: string) { return (await this.queryIndex("byCASNumber", casNumber, true))[0] ?? null; }
  listByCanonicalName(name: string) { return this.queryIndex("byCanonicalName", name); }
}
