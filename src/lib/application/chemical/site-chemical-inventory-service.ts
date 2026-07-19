import { ChemicalProductRepository, SiteChemicalInventoryRepository } from "$lib/data/repositories/chemical";
import {
  CONTAINER_TYPES, INVENTORY_INFORMATION_SOURCES, INVENTORY_STATUSES, QUANTITY_UNITS,
  ChemicalRelationshipError, ChemicalValidationError,
  assertEnum, optionalNonNegative, optionalText, requireUnitForValue,
  type SiteChemicalInventoryInput,
} from "$lib/domain/chemical";
import type { FoundationLocation } from "$lib/domain/foundation";
import { ChemicalService, type FoundationPerson } from "./chemical-service";

export class SiteChemicalInventoryService extends ChemicalService {
  constructor(
    database: IDBDatabase,
    readonly repository = new SiteChemicalInventoryRepository(database),
    private readonly products = new ChemicalProductRepository(database),
  ) { super(database); }

  private async normalize(input: SiteChemicalInventoryInput) {
    await this.requireRecord(this.products, input.productId, "Product", true);
    const site = await this.getFoundation<FoundationLocation>("locations", input.siteId, "Site");
    if (site.nodeType !== "Site") throw new ChemicalRelationshipError("Selected Site must be a Location with node type Site.");
    const storage = await this.getFoundation<FoundationLocation>("locations", input.storageLocationId, "Storage Location");
    if (storage.id !== site.id && storage.resolvedSiteId !== site.id) throw new ChemicalRelationshipError("Storage Location does not resolve to the selected Site.");
    if (input.verifiedByPersonId) await this.getFoundation<FoundationPerson>("people", input.verifiedByPersonId, "Verifier Person");
    const observedQuantity = optionalNonNegative(input.observedQuantity, "Observed quantity");
    const maximumInventory = optionalNonNegative(input.maximumInventory, "Maximum inventory");
    const containerCount = optionalNonNegative(input.containerCount, "Container count");
    requireUnitForValue(observedQuantity, input.quantityUnit, "Observed quantity");
    requireUnitForValue(maximumInventory, input.maximumInventoryUnit, "Maximum inventory");
    if (input.verifiedByPersonId && !input.observationDate?.trim()) throw new ChemicalValidationError("Observation date is required for verified inventory.");
    return {
      productId: input.productId, siteId: input.siteId, storageLocationId: input.storageLocationId,
      observedQuantity, quantityUnit: input.quantityUnit ? assertEnum(input.quantityUnit, QUANTITY_UNITS, "Quantity unit") : undefined,
      maximumInventory, maximumInventoryUnit: input.maximumInventoryUnit ? assertEnum(input.maximumInventoryUnit, QUANTITY_UNITS, "Maximum inventory unit") : undefined,
      containerType: assertEnum(input.containerType, CONTAINER_TYPES, "Container type"), containerCount,
      inventoryStatus: assertEnum(input.inventoryStatus, INVENTORY_STATUSES, "Inventory status"),
      observationDate: optionalText(input.observationDate),
      informationSource: assertEnum(input.informationSource, INVENTORY_INFORMATION_SOURCES, "Information source"),
      verifiedByPersonId: optionalText(input.verifiedByPersonId), notes: optionalText(input.notes) ?? "",
    };
  }
  async create(input: SiteChemicalInventoryInput) { return this.repository.create({ businessId: this.businessId("INV", input.businessId), ...await this.normalize(input) }, await this.context("Create Site Chemical Inventory")); }
  async update(id: string, input: SiteChemicalInventoryInput, expectedRevision: number) { return this.repository.update(id, await this.normalize(input), expectedRevision, await this.context("Update Site Chemical Inventory")); }
  async updateObservedQuantity(id: string, value: number | undefined, unit: SiteChemicalInventoryInput["quantityUnit"], expectedRevision: number) { const record = await this.repository.get(id); return this.update(id, { ...record, observedQuantity: value, quantityUnit: unit }, expectedRevision); }
  async updateMaximumInventory(id: string, value: number | undefined, unit: SiteChemicalInventoryInput["maximumInventoryUnit"], expectedRevision: number) { const record = await this.repository.get(id); return this.update(id, { ...record, maximumInventory: value, maximumInventoryUnit: unit }, expectedRevision); }
  async moveStorageLocation(id: string, storageLocationId: string, expectedRevision: number) { const record = await this.repository.get(id); return this.update(id, { ...record, storageLocationId }, expectedRevision); }
  async moveToSite(id: string, siteId: string, storageLocationId: string, expectedRevision: number) { const record = await this.repository.get(id); return this.update(id, { ...record, siteId, storageLocationId }, expectedRevision); }
  async markNeedsVerification(id: string, expectedRevision: number) { const record = await this.repository.get(id); return this.update(id, { ...record, inventoryStatus: "Needs Verification" }, expectedRevision); }
  listBySite(id: string) { return this.repository.listBySite(id); }
  listByProduct(id: string) { return this.repository.listByProduct(id); }
  archive(id: string, expectedRevision: number, reason: string) { return this.context("Archive Site Chemical Inventory").then((context) => this.repository.archive(id, expectedRevision, reason, context)); }
  restore(id: string, expectedRevision: number) { return this.context("Restore Site Chemical Inventory").then((context) => this.repository.restore(id, expectedRevision, context)); }
}
