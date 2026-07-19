import type { RecordEnvelope } from "$lib/data/database";

export const CHEMICAL_OPERATING_CONDITIONS = ["Routine", "Non-Routine", "Startup", "Shutdown", "Maintenance", "Upset", "Emergency", "Post-Release Cleanup", "Unknown"] as const;
export type ChemicalOperatingCondition = (typeof CHEMICAL_OPERATING_CONDITIONS)[number];
export const CHEMICAL_USE_FREQUENCIES = ["Continuous", "Multiple Times per Shift", "Daily", "Weekly", "Monthly", "Quarterly", "Annually", "Intermittent", "Campaign-Based", "As Needed", "Emergency Only", "Unknown"] as const;
export type ChemicalUseFrequency = (typeof CHEMICAL_USE_FREQUENCIES)[number];
export const DURATION_UNITS = ["Minutes per Event", "Hours per Event", "Hours per Shift", "Hours per Week", "Percentage of Shift", "Unknown"] as const;
export type DurationUnit = (typeof DURATION_UNITS)[number];
export const QUANTITY_SCALES = ["Trace", "Small", "Moderate", "Large", "Bulk", "Unknown"] as const;
export type QuantityScale = (typeof QUANTITY_SCALES)[number];
export const APPLICATION_METHODS = ["Closed Transfer", "Open Transfer", "Manual Charging", "Automated Charging", "Mixing", "Blending", "Grinding", "Milling", "Granulation", "Spraying", "Pouring", "Pumping", "Bag Dumping", "Sampling", "Cleaning", "Maintenance", "Spill Cleanup", "Other", "Unknown"] as const;
export type ApplicationMethod = (typeof APPLICATION_METHODS)[number];

export interface ChemicalUse extends RecordEnvelope {
  productId: string;
  siteId: string;
  locationId: string;
  processId: string;
  taskId?: string;
  operationalFunctionId: string;
  operatingCondition: ChemicalOperatingCondition;
  frequency: ChemicalUseFrequency;
  duration?: number;
  durationUnit: DurationUnit;
  quantityScale: QuantityScale;
  applicationMethod: ApplicationMethod;
  controlIds: string[];
  deferredControlNotes: string;
  evidenceReferenceIds: string[];
  status: "Active" | "Inactive" | "Needs Verification";
  notes: string;
}

export interface ChemicalUseInput extends Omit<ChemicalUse, keyof RecordEnvelope | "notes" | "controlIds" | "evidenceReferenceIds" | "deferredControlNotes" | "operationalFunctionId"> {
  businessId?: string;
  controlIds?: string[];
  deferredControlNotes?: string;
  evidenceReferenceIds?: string[];
  notes?: string;
  operationalFunctionId?: string;
}
