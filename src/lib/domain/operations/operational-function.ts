import type { FoundationRecordMetadata, FoundationRecordStatus } from "../foundation/validation";

export const OPERATIONAL_FUNCTION_CATEGORIES = [
  "Corporate Management", "Regional Management", "Site Management", "Manufacturing", "Formulation",
  "Toll Manufacturing", "Tolling", "Packaging", "Repackaging", "Warehousing", "Raw Material Storage",
  "Finished Goods Storage", "Bulk Storage", "Distribution", "Shipping", "Receiving", "Rail Operations",
  "Truck Operations", "Laboratory", "Quality Control", "Quality Assurance", "Research and Development",
  "Pilot Plant", "Maintenance", "Engineering", "Utilities", "Waste Management", "Environmental Operations",
  "Industrial Hygiene", "Occupational Health", "HSE", "Emergency Response", "Security", "Administration",
  "Training", "Contractor Support", "Other",
] as const;
export type OperationalFunctionCategory = (typeof OPERATIONAL_FUNCTION_CATEGORIES)[number];

export interface OperationalFunction extends FoundationRecordMetadata {
  name: string;
  functionCategory: OperationalFunctionCategory;
  description: string;
  status: FoundationRecordStatus;
}

export interface OperationalFunctionFields {
  businessId?: string;
  name: string;
  functionCategory: OperationalFunctionCategory;
  description?: string;
  status: FoundationRecordStatus;
}
