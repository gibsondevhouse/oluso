import type { SdsRevision } from "$lib/domain/chemical";
import { ChemicalRecordRepository } from "./chemical-repository";
import type { RecordRepositoryOptions } from "../record-repository";

export class SdsRevisionRepository extends ChemicalRecordRepository<SdsRevision> {
  constructor(database: IDBDatabase, options: Partial<RecordRepositoryOptions> = {}) {
    super(database, "sds_revisions", { recordType: "SdsRevision", ...options });
  }
  listHistory(productId: string) { return this.queryIndex("byProduct", productId, true); }
  async getCurrentForProduct(productId: string, language?: string, jurisdiction?: string) {
    return (await this.queryIndex("byProduct", productId)).filter((revision) =>
      revision.currentStatus === "Current" &&
      (!language || revision.language === language) &&
      (!jurisdiction || revision.jurisdiction === jurisdiction)
    );
  }
}
