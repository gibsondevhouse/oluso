import type { RecordEnvelope } from "$lib/data/database";

export const COMPONENT_ROLES = [
  "Active Ingredient", "Primary Component", "Secondary Component", "Solvent", "Carrier", "Surfactant",
  "Impurity", "Preservative", "Trade Secret Component", "Other", "Unknown",
] as const;
export type ComponentRole = (typeof COMPONENT_ROLES)[number];
export const CONCENTRATION_UNITS = [
  "Percent by Weight", "Percent by Volume", "Weight per Volume", "Parts per Million",
  "Parts per Billion", "Range Unknown", "Not Disclosed",
] as const;
export type ConcentrationUnit = (typeof CONCENTRATION_UNITS)[number];
export const COMPOSITION_SOURCES = [
  "Safety Data Sheet", "Product Label", "Technical Specification", "Manufacturer Communication",
  "Laboratory Analysis", "Regulatory Record", "Legacy Record", "Unknown",
] as const;
export type CompositionSource = (typeof COMPOSITION_SOURCES)[number];

export interface ProductSubstance extends RecordEnvelope {
  productId: string;
  substanceId: string;
  componentRole: ComponentRole;
  minimumConcentration?: number;
  maximumConcentration?: number;
  concentrationUnit: ConcentrationUnit;
  tradeSecret: boolean;
  compositionSource: CompositionSource;
  notes: string;
  status: "Active" | "Inactive";
}

export interface ProductSubstanceInput {
  businessId?: string;
  productId: string;
  substanceId: string;
  componentRole: ComponentRole;
  minimumConcentration?: number;
  maximumConcentration?: number;
  concentrationUnit: ConcentrationUnit;
  tradeSecret?: boolean;
  compositionSource: CompositionSource;
  notes?: string;
  status?: ProductSubstance["status"];
}
