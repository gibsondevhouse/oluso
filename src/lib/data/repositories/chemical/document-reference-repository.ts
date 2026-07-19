import type { DocumentReference } from "$lib/domain/chemical";
import { ChemicalRecordRepository } from "./chemical-repository";
import type { RecordRepositoryOptions } from "../record-repository";

export class DocumentReferenceRepository extends ChemicalRecordRepository<DocumentReference> {
  constructor(database: IDBDatabase, options: Partial<RecordRepositoryOptions> = {}) {
    super(database, "document_references", { recordType: "DocumentReference", ...options });
  }
  listByDocumentType(value: string) { return this.queryIndex("byDocumentType", value); }
  listByAvailability(value: string) { return this.queryIndex("byAvailabilityStatus", value); }
}
