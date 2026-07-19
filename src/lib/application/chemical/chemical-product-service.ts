import { ChemicalProductRepository } from "$lib/data/repositories/chemical";
import {
  ChemicalDuplicateError,
  ChemicalRelationshipError,
  PRODUCT_FORMULATION_TYPES,
  PRODUCT_PHYSICAL_STATES,
  assertEnum,
  dedupeStrings,
  normalizedIdentity,
  optionalText,
  requiredText,
  type ChemicalProduct,
  type ChemicalProductInput,
} from "$lib/domain/chemical";
import { ChemicalService, type FoundationOrganization } from "./chemical-service";

export class ChemicalProductService extends ChemicalService {
  constructor(database: IDBDatabase, readonly repository = new ChemicalProductRepository(database)) { super(database); }

  private async normalize(input: ChemicalProductInput) {
    const manufacturerUnknown = input.manufacturerUnknown === true;
    const manufacturerOrganizationId = optionalText(input.manufacturerOrganizationId);
    if (!manufacturerUnknown && !manufacturerOrganizationId) {
      throw new ChemicalRelationshipError("Manufacturer Organization is required unless explicitly marked unknown.");
    }
    if (manufacturerOrganizationId) {
      await this.getFoundation<FoundationOrganization>("organizations", manufacturerOrganizationId, "Manufacturer Organization");
    }
    const suppliers = dedupeStrings(input.supplierOrganizationIds);
    for (const id of suppliers) await this.getFoundation<FoundationOrganization>("organizations", id, "Supplier Organization");
    return {
      productName: requiredText(input.productName, "Product name"),
      manufacturerOrganizationId,
      manufacturerUnknown,
      supplierOrganizationIds: suppliers,
      productCode: optionalText(input.productCode),
      formulationType: assertEnum(input.formulationType, PRODUCT_FORMULATION_TYPES, "Formulation type"),
      physicalState: assertEnum(input.physicalState, PRODUCT_PHYSICAL_STATES, "Physical state"),
      description: optionalText(input.description) ?? "",
      status: input.status ?? "Active" as const,
    };
  }

  async findPotentialDuplicates(input: Pick<ChemicalProductInput, "productName" | "manufacturerOrganizationId" | "productCode">) {
    const all = await this.repository.list({ includeArchived: true });
    const name = normalizedIdentity(input.productName);
    const code = normalizedIdentity(input.productCode);
    return all.filter((record) =>
      normalizedIdentity(record.productName) === name &&
      (record.manufacturerOrganizationId ?? "") === (input.manufacturerOrganizationId?.trim() ?? "") &&
      normalizedIdentity(record.productCode) === code
    );
  }

  async create(input: ChemicalProductInput) {
    const normalized = await this.normalize(input);
    if ((await this.findPotentialDuplicates(normalized)).length) {
      throw new ChemicalDuplicateError("A Product with the same manufacturer, name, and product code already exists.");
    }
    return this.repository.create({ businessId: this.businessId("PROD", input.businessId), ...normalized }, await this.context("Create Chemical Product"));
  }
  async update(id: string, input: ChemicalProductInput, expectedRevision: number) {
    const normalized = await this.normalize(input);
    if ((await this.findPotentialDuplicates(normalized)).some((record) => record.id !== id)) {
      throw new ChemicalDuplicateError("A Product with the same manufacturer, name, and product code already exists.");
    }
    return this.repository.update(id, normalized, expectedRevision, await this.context("Update Chemical Product"));
  }
  listByManufacturer(id: string) { return this.repository.listByManufacturer(id); }
  async addSupplier(id: string, supplierId: string, expectedRevision: number) {
    const record = await this.repository.get(id); return this.update(id, { ...record, supplierOrganizationIds: [...record.supplierOrganizationIds, supplierId] }, expectedRevision);
  }
  async removeSupplier(id: string, supplierId: string, expectedRevision: number) {
    const record = await this.repository.get(id); return this.update(id, { ...record, supplierOrganizationIds: record.supplierOrganizationIds.filter((value) => value !== supplierId) }, expectedRevision);
  }
  archive(id: string, expectedRevision: number, reason: string) { return this.context("Archive Chemical Product").then((context) => this.repository.archive(id, expectedRevision, reason, context)); }
  restore(id: string, expectedRevision: number) { return this.context("Restore Chemical Product").then((context) => this.repository.restore(id, expectedRevision, context)); }
}
