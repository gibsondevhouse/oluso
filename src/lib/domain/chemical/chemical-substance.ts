import type { RecordEnvelope } from "$lib/data/database";

export const SUBSTANCE_CLASSIFICATIONS = [
  "Active Ingredient", "Solvent", "Surfactant", "Carrier", "Impurity", "Preservative",
  "Colorant", "Intermediate", "Reaction Product", "Combustion Product", "Dust", "Fiber",
  "Gas", "Vapor", "Mist", "Fume", "Other", "Unknown",
] as const;
export type SubstanceClassification = (typeof SUBSTANCE_CLASSIFICATIONS)[number];

export const SUBSTANCE_PHYSICAL_FORMS = [
  "Solid", "Powder", "Granule", "Liquid", "Gas", "Vapor", "Aerosol", "Paste", "Slurry", "Mixed", "Unknown",
] as const;
export type SubstancePhysicalForm = (typeof SUBSTANCE_PHYSICAL_FORMS)[number];

export interface ChemicalSubstance extends RecordEnvelope {
  canonicalName: string;
  casNumber?: string;
  synonyms: string[];
  substanceClassifications: SubstanceClassification[];
  physicalForm: SubstancePhysicalForm;
  description: string;
  status: "Active" | "Inactive" | "Unknown";
}

export interface ChemicalSubstanceInput {
  businessId?: string;
  canonicalName: string;
  casNumber?: string;
  synonyms?: string[];
  substanceClassifications?: SubstanceClassification[];
  physicalForm: SubstancePhysicalForm;
  description?: string;
  status?: ChemicalSubstance["status"];
}
