import { runMutationTransaction } from "$lib/data/revisions";
import {
  ChemicalProductRepository,
  DocumentReferenceRepository,
  SdsRevisionRepository,
} from "$lib/data/repositories/chemical";
import {
  ChemicalDuplicateError,
  ChemicalRelationshipError,
  ChemicalValidationError,
  SDS_CURRENT_STATUSES,
  SDS_REVIEW_STATUSES,
  assertEnum,
  optionalText,
  requiredText,
  type SdsRevision,
  type SdsRevisionInput,
  type SdsReviewStatus,
} from "$lib/domain/chemical";
import { ChemicalService, type FoundationOrganization, type FoundationPerson } from "./chemical-service";

const COMPLETED_REVIEWS: SdsReviewStatus[] = ["Accepted", "Needs Correction", "Rejected"];

export class SdsRevisionService extends ChemicalService {
  constructor(
    database: IDBDatabase,
    readonly repository = new SdsRevisionRepository(database),
    private readonly products = new ChemicalProductRepository(database),
    private readonly documents = new DocumentReferenceRepository(database),
  ) { super(database); }

  private async normalize(input: SdsRevisionInput) {
    await this.requireRecord(this.products, input.productId, "Product", true);
    if (input.manufacturerOrganizationId) await this.getFoundation<FoundationOrganization>("organizations", input.manufacturerOrganizationId, "Manufacturer Organization");
    if (input.documentReferenceId) await this.requireRecord(this.documents, input.documentReferenceId, "Document Reference", true);
    if (input.reviewedByPersonId) await this.getFoundation<FoundationPerson>("people", input.reviewedByPersonId, "Reviewer Person");
    const reviewStatus = assertEnum(input.reviewStatus ?? "Not Reviewed", SDS_REVIEW_STATUSES, "Review status");
    const reviewedAt = optionalText(input.reviewedAt);
    if (COMPLETED_REVIEWS.includes(reviewStatus) && (!reviewedAt || !input.reviewedByPersonId)) {
      throw new ChemicalValidationError("Completed SDS review requires a review date and Reviewer Person.");
    }
    const revisionDate = optionalText(input.revisionDate);
    if (!revisionDate && input.revisionDateUnknown !== true) {
      throw new ChemicalValidationError("Provide the SDS revision date or explicitly mark it unknown.");
    }
    return {
      productId: input.productId,
      manufacturerOrganizationId: optionalText(input.manufacturerOrganizationId),
      revisionDate,
      revisionDateUnknown: !revisionDate,
      effectiveDate: optionalText(input.effectiveDate), receivedDate: optionalText(input.receivedDate),
      language: requiredText(input.language, "Language"), jurisdiction: requiredText(input.jurisdiction, "Jurisdiction"),
      documentReferenceId: optionalText(input.documentReferenceId),
      currentStatus: assertEnum(input.currentStatus ?? "Pending Review", SDS_CURRENT_STATUSES, "Current status"),
      reviewStatus, reviewedAt, reviewedByPersonId: optionalText(input.reviewedByPersonId),
      supersedesSdsRevisionId: optionalText(input.supersedesSdsRevisionId), notes: optionalText(input.notes) ?? "",
    };
  }

  async addRevision(input: SdsRevisionInput) {
    const normalized = await this.normalize(input);
    if (normalized.currentStatus === "Current" && (await this.repository.getCurrentForProduct(input.productId, normalized.language, normalized.jurisdiction)).length) {
      throw new ChemicalDuplicateError("Use Mark Current to atomically supersede the existing current SDS revision.");
    }
    return this.repository.create({ businessId: this.businessId("SDS", input.businessId), ...normalized }, await this.context("Add SDS Revision"));
  }
  async updateRevision(id: string, input: SdsRevisionInput, expectedRevision: number) {
    return this.repository.update(id, await this.normalize(input), expectedRevision, await this.context("Update SDS Revision"));
  }

  async markCurrent(newRevisionId: string, expectedRevisions: Record<string, number>) {
    const context = await this.context("Mark SDS Revision Current");
    return runMutationTransaction(this.database, ["sds_revisions"], context, async (session) => {
      const next = await session.getRecord<SdsRevision>("sds_revisions", newRevisionId);
      if (!next || next.lifecycleStatus !== "active") throw new ChemicalRelationshipError("SDS Revision was not found or is archived.");
      const product = await session.getRecord<{ lifecycleStatus: string }>("chemical_products", next.productId);
      if (!product || product.lifecycleStatus !== "active") throw new ChemicalRelationshipError("Product was not found or is archived.");
      const revisions = await session.listRecords<SdsRevision>("sds_revisions");
      const previous = revisions.find((revision) =>
        revision.id !== next.id && revision.lifecycleStatus === "active" && revision.currentStatus === "Current" &&
        revision.productId === next.productId && revision.language === next.language && revision.jurisdiction === next.jurisdiction
      );
      const nextExpectedRevision = expectedRevisions[next.id];
      const previousExpectedRevision = previous ? expectedRevisions[previous.id] : undefined;
      if (nextExpectedRevision === undefined) throw new ChemicalValidationError("Expected revision is required for the SDS being activated.");
      if (previous && previousExpectedRevision === undefined) throw new ChemicalValidationError("Expected revision is required for the SDS being superseded.");
      let superseded: SdsRevision | undefined;
      if (previous) {
        superseded = await session.updateRecord<SdsRevision, Record<string, unknown>>({
          storeName: "sds_revisions", recordType: "SdsRevision", id: previous.id,
          expectedRevision: previousExpectedRevision!, patch: { currentStatus: "Superseded" }, operation: "supersede",
        });
      }
      const current = next.currentStatus === "Current" && !previous ? next : await session.updateRecord<SdsRevision, Record<string, unknown>>({
        storeName: "sds_revisions", recordType: "SdsRevision", id: next.id,
        expectedRevision: nextExpectedRevision, patch: { currentStatus: "Current", supersedesSdsRevisionId: previous?.id },
      });
      return { current, superseded };
    }, { additionalStoreNames: ["chemical_products"] });
  }

  async markUnavailable(id: string, expectedRevision: number) {
    const record = await this.repository.get(id); return this.updateRevision(id, { ...record, currentStatus: "Unavailable" }, expectedRevision);
  }
  async review(id: string, reviewStatus: SdsReviewStatus, reviewerPersonId: string, reviewedAt: string, expectedRevision: number) {
    const record = await this.repository.get(id); return this.updateRevision(id, { ...record, reviewStatus, reviewedByPersonId: reviewerPersonId, reviewedAt }, expectedRevision);
  }
  listHistory(productId: string) { return this.repository.listHistory(productId); }
  getCurrentForProduct(productId: string) { return this.repository.getCurrentForProduct(productId); }
}
