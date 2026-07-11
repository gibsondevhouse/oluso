import type { LifecycleMetadata } from "./lifecycle.types";

export type ChemicalStatus = "active" | "inactive" | "restricted";
export type ChemicalClassification =
  | "Solvent"
  | "Active Ingredient"
  | "Surfactant"
  | "Dust/Formulated Solid"
  | "Corrosive"
  | "Flammable"
  | "Toxic"
  | "Unknown";
export type ChemicalHazardClass = ChemicalClassification;
export type ChemicalSdsStatus = "Current" | "Missing" | "Needs Review" | "Not Required";

export interface ChemicalRecord extends LifecycleMetadata {
  id: string;
  name: string;
  casNumber: string;
  hazardClass: ChemicalHazardClass;
  processIds: string[];
  storageLocationId: string;
  sdsStatus: ChemicalSdsStatus;
  sdsReference: string;
  sdsRevisionDate: string;
  sdsReviewDate: string;
  exposureLimitValue: string;
  exposureLimitUnit: string;
  exposureLimitSource: string;
  exposureLimitAveragingPeriod: string;
  quantity: string;
  unit: string;
  supplier: string;
  status: ChemicalStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChemicalInput {
  name: string;
  casNumber: string;
  hazardClass: ChemicalHazardClass;
  processIds: string[];
  storageLocationId: string;
  sdsStatus: ChemicalSdsStatus;
  sdsReference: string;
  sdsRevisionDate: string;
  sdsReviewDate: string;
  exposureLimitValue: string;
  exposureLimitUnit: string;
  exposureLimitSource: string;
  exposureLimitAveragingPeriod: string;
  quantity: string;
  unit: string;
  supplier: string;
  status: ChemicalStatus;
  notes: string;
}

export interface ChemicalValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ChemicalInput, string>>;
}

export const CHEMICAL_STATUSES: ChemicalStatus[] = ["active", "inactive", "restricted"];
export const CHEMICAL_SDS_STATUSES: ChemicalSdsStatus[] = [
  "Current",
  "Missing",
  "Needs Review",
  "Not Required",
];
export const CHEMICAL_HAZARD_CLASSES: ChemicalHazardClass[] = [
  "Solvent",
  "Active Ingredient",
  "Surfactant",
  "Dust/Formulated Solid",
  "Corrosive",
  "Flammable",
  "Toxic",
  "Unknown",
];

export function validateChemicalInput(input: ChemicalInput): ChemicalValidationResult {
  const errors: ChemicalValidationResult["errors"] = {};

  if (!input.name.trim()) {
    errors.name = "Chemical name is required.";
  }

  if (!input.hazardClass) {
    errors.hazardClass = "Classification is required.";
  } else if (!CHEMICAL_HAZARD_CLASSES.includes(input.hazardClass)) {
    errors.hazardClass = `Classification must be one of: ${CHEMICAL_HAZARD_CLASSES.join(", ")}.`;
  }

  if (!input.storageLocationId.trim()) {
    errors.storageLocationId = "Storage location is required.";
  }

  if (!CHEMICAL_STATUSES.includes(input.status)) {
    errors.status = "Status is required.";
  }

  if (!CHEMICAL_SDS_STATUSES.includes(input.sdsStatus)) {
    errors.sdsStatus = "SDS status is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getChemicalStatusTone(status: ChemicalStatus) {
  if (status === "active") return "active";
  if (status === "restricted") return "high";
  return "inactive";
}

export function getChemicalSdsStatusTone(status: ChemicalSdsStatus) {
  if (status === "Current" || status === "Not Required") return "active";
  if (status === "Needs Review") return "medium";
  return "critical";
}

export function getChemicalHazardTone(hazardClass: ChemicalHazardClass) {
  const dangerClasses: ChemicalHazardClass[] = ["Flammable", "Toxic"];
  const warningClasses: ChemicalHazardClass[] = ["Corrosive", "Dust/Formulated Solid"];
  if (dangerClasses.includes(hazardClass)) return "high";
  if (warningClasses.includes(hazardClass)) return "medium";
  return "low";
}
