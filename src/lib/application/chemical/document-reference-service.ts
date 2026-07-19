import { DocumentReferenceRepository } from "$lib/data/repositories/chemical";
import { DOCUMENT_AVAILABILITY_STATUSES, DOCUMENT_TYPES, EXTERNAL_SYSTEMS, ChemicalValidationError, assertEnum, optionalText, requiredText, type DocumentReferenceInput } from "$lib/domain/chemical";
import { ChemicalService } from "./chemical-service";

export class DocumentReferenceService extends ChemicalService {
  constructor(database: IDBDatabase, readonly repository = new DocumentReferenceRepository(database)) { super(database); }
  private normalize(input: DocumentReferenceInput) {
    const externalPath = optionalText(input.externalPath);
    const externalSystem = assertEnum(input.externalSystem, EXTERNAL_SYSTEMS, "External system");
    if (externalPath && externalSystem === "Unknown") throw new ChemicalValidationError("External system is required when an external path is supplied.");
    return {
      title: requiredText(input.title, "Document title"),
      documentType: assertEnum(input.documentType, DOCUMENT_TYPES, "Document type"),
      fileName: optionalText(input.fileName), externalPath, externalSystem,
      documentDate: optionalText(input.documentDate), revisionLabel: optionalText(input.revisionLabel),
      contentHash: optionalText(input.contentHash),
      availabilityStatus: assertEnum(input.availabilityStatus, DOCUMENT_AVAILABILITY_STATUSES, "Availability status"),
      notes: optionalText(input.notes) ?? "",
    };
  }
  async create(input: DocumentReferenceInput) { return this.repository.create({ businessId: this.businessId("DOC", input.businessId), ...this.normalize(input) }, await this.context("Create Document Reference")); }
  async update(id: string, input: DocumentReferenceInput, expectedRevision: number) { return this.repository.update(id, this.normalize(input), expectedRevision, await this.context("Update Document Reference")); }
  async updateAvailability(id: string, availabilityStatus: DocumentReferenceInput["availabilityStatus"], expectedRevision: number) {
    const record = await this.repository.get(id); return this.update(id, { ...record, availabilityStatus }, expectedRevision);
  }
  verifyReference(id: string) { return this.repository.get(id, { includeArchived: true }); }
  archive(id: string, expectedRevision: number, reason: string) { return this.context("Archive Document Reference").then((context) => this.repository.archive(id, expectedRevision, reason, context)); }
  restore(id: string, expectedRevision: number) { return this.context("Restore Document Reference").then((context) => this.repository.restore(id, expectedRevision, context)); }
}
