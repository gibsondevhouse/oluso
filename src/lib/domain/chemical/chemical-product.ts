import type { RecordEnvelope } from "$lib/data/database";

export const PRODUCT_FORMULATION_TYPES = [
  "Technical", "Wettable Powder", "Water-Dispersible Granule", "Emulsifiable Concentrate",
  "Suspension Concentrate", "Soluble Concentrate", "Flowable", "Granule", "Dust", "Solution",
  "Mixture", "Pure Substance", "Cleaning Product", "Maintenance Product", "Laboratory Reagent",
  "Waste Material", "Other", "Unknown",
] as const;
export type ProductFormulationType = (typeof PRODUCT_FORMULATION_TYPES)[number];

export const PRODUCT_PHYSICAL_STATES = [
  "Solid", "Powder", "Granule", "Liquid", "Gas", "Aerosol", "Paste", "Slurry", "Mixed", "Unknown",
] as const;
export type ProductPhysicalState = (typeof PRODUCT_PHYSICAL_STATES)[number];

export interface ChemicalProduct extends RecordEnvelope {
  productName: string;
  manufacturerOrganizationId?: string;
  manufacturerUnknown: boolean;
  supplierOrganizationIds: string[];
  productCode?: string;
  formulationType: ProductFormulationType;
  physicalState: ProductPhysicalState;
  description: string;
  status: "Active" | "Inactive" | "Unknown";
}

export interface ChemicalProductInput {
  businessId?: string;
  productName: string;
  manufacturerOrganizationId?: string;
  manufacturerUnknown?: boolean;
  supplierOrganizationIds?: string[];
  productCode?: string;
  formulationType: ProductFormulationType;
  physicalState: ProductPhysicalState;
  description?: string;
  status?: ChemicalProduct["status"];
}
