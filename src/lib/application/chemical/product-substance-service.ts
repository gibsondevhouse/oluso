import { ProductSubstanceRepository, ChemicalProductRepository, ChemicalSubstanceRepository } from "$lib/data/repositories/chemical";
import {
  COMPONENT_ROLES, COMPOSITION_SOURCES, CONCENTRATION_UNITS,
  ChemicalDuplicateError, ChemicalValidationError,
  assertEnum, optionalNonNegative, optionalText,
  type ProductSubstanceInput,
} from "$lib/domain/chemical";
import { ChemicalService } from "./chemical-service";

export class ProductSubstanceService extends ChemicalService {
  constructor(
    database: IDBDatabase,
    readonly repository = new ProductSubstanceRepository(database),
    private readonly products = new ChemicalProductRepository(database),
    private readonly substances = new ChemicalSubstanceRepository(database),
  ) { super(database); }

  private async normalize(input: ProductSubstanceInput) {
    await this.requireRecord(this.products, input.productId, "Product", true);
    await this.requireRecord(this.substances, input.substanceId, "Substance", true);
    const minimumConcentration = optionalNonNegative(input.minimumConcentration, "Minimum concentration");
    const maximumConcentration = optionalNonNegative(input.maximumConcentration, "Maximum concentration");
    if (minimumConcentration !== undefined && maximumConcentration !== undefined && minimumConcentration > maximumConcentration) {
      throw new ChemicalValidationError("Minimum concentration cannot exceed maximum concentration.");
    }
    const concentrationUnit = assertEnum(input.concentrationUnit, CONCENTRATION_UNITS, "Concentration unit");
    if (["Percent by Weight", "Percent by Volume"].includes(concentrationUnit) &&
      [minimumConcentration, maximumConcentration].some((value) => value !== undefined && value > 100)) {
      throw new ChemicalValidationError("Percentage concentration cannot exceed 100.");
    }
    if (concentrationUnit === "Not Disclosed" && (minimumConcentration !== undefined || maximumConcentration !== undefined)) {
      throw new ChemicalValidationError("Not Disclosed composition cannot contain invented concentration values.");
    }
    return {
      productId: input.productId,
      substanceId: input.substanceId,
      componentRole: assertEnum(input.componentRole, COMPONENT_ROLES, "Component role"),
      minimumConcentration,
      maximumConcentration,
      concentrationUnit,
      tradeSecret: input.tradeSecret === true,
      compositionSource: assertEnum(input.compositionSource, COMPOSITION_SOURCES, "Composition source"),
      notes: optionalText(input.notes) ?? "",
      status: input.status ?? "Active" as const,
    };
  }
  async linkSubstance(input: ProductSubstanceInput) {
    const normalized = await this.normalize(input);
    if (await this.repository.findRelationship(input.productId, input.substanceId)) throw new ChemicalDuplicateError("This Product and Substance are already linked.");
    return this.repository.create({ businessId: this.businessId("COMP", input.businessId), ...normalized }, await this.context("Link Product Substance"));
  }
  async update(id: string, input: ProductSubstanceInput, expectedRevision: number) {
    const normalized = await this.normalize(input);
    const duplicate = await this.repository.findRelationship(input.productId, input.substanceId);
    if (duplicate && duplicate.id !== id) throw new ChemicalDuplicateError("This Product and Substance are already linked.");
    return this.repository.update(id, normalized, expectedRevision, await this.context("Update Product Composition"));
  }
  updateConcentration(id: string, input: ProductSubstanceInput, expectedRevision: number) { return this.update(id, input, expectedRevision); }
  updateSource(id: string, input: ProductSubstanceInput, expectedRevision: number) { return this.update(id, input, expectedRevision); }
  unlinkSubstance(id: string, expectedRevision: number, reason = "Composition relationship removed") { return this.context("Archive Product Composition").then((context) => this.repository.archive(id, expectedRevision, reason, context)); }
  listForProduct(id: string) { return this.repository.listForProduct(id); }
  listProductsForSubstance(id: string) { return this.repository.listProductsForSubstance(id); }
}
