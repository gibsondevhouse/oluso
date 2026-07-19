import type { OperationalFunction } from "$lib/domain/operations";
import type { ListRecordOptions } from "../record-repository";
import { FoundationRepository } from "../foundation/foundation-repository";

export class OperationalFunctionRepository extends FoundationRepository<OperationalFunction> {
  constructor(database: IDBDatabase) { super(database, "operational_functions", "OperationalFunction"); }
  listByCategory(category: string, options: ListRecordOptions = {}) { return this.listByIndex("byFunctionCategory", category, options); }
  async findByName(name: string, options: ListRecordOptions = {}) {
    const normalized = name.trim().toLocaleLowerCase();
    return (await this.list(options)).find((item) => item.name.trim().toLocaleLowerCase() === normalized) ?? null;
  }
}
