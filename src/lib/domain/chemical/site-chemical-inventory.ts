import type { RecordEnvelope } from "$lib/data/database";

export const INVENTORY_STATUSES = ["Present", "Temporarily Absent", "Planned", "Discontinued", "Unknown", "Needs Verification"] as const;
export type InventoryStatus = (typeof INVENTORY_STATUSES)[number];
export const QUANTITY_UNITS = ["Pounds", "Kilograms", "Gallons", "Liters", "US Tons", "Metric Tons", "Cubic Feet", "Cubic Meters", "Containers", "Bags", "Drums", "Totes", "Unknown"] as const;
export type QuantityUnit = (typeof QUANTITY_UNITS)[number];
export const CONTAINER_TYPES = ["Bag", "Supersack", "Drum", "Tote", "Tank", "Bulk Tank", "Railcar", "Tank Truck", "Cylinder", "Bottle", "Pail", "Bin", "Hopper", "Silo", "Mixed", "Other", "Unknown"] as const;
export type ContainerType = (typeof CONTAINER_TYPES)[number];
export const INVENTORY_INFORMATION_SOURCES = ["Physical Count", "Inventory System", "Operator Interview", "Purchase Record", "Shipping Record", "Legacy Record", "Manager Estimate", "Other", "Unknown"] as const;
export type InventoryInformationSource = (typeof INVENTORY_INFORMATION_SOURCES)[number];

export interface SiteChemicalInventory extends RecordEnvelope {
  productId: string;
  siteId: string;
  storageLocationId: string;
  observedQuantity?: number;
  quantityUnit?: QuantityUnit;
  maximumInventory?: number;
  maximumInventoryUnit?: QuantityUnit;
  containerType: ContainerType;
  containerCount?: number;
  inventoryStatus: InventoryStatus;
  observationDate?: string;
  informationSource: InventoryInformationSource;
  verifiedByPersonId?: string;
  notes: string;
}

export interface SiteChemicalInventoryInput extends Omit<SiteChemicalInventory, keyof RecordEnvelope | "notes"> {
  businessId?: string;
  notes?: string;
}
