import type { LifecycleMetadata } from "./lifecycle.types";

export type EquipmentStatus = "active" | "inactive" | "under-review";
export type EquipmentType =
  | "Tank"
  | "Pump"
  | "Mixer"
  | "Conveyor"
  | "Forklift"
  | "Ventilation"
  | "Dust Collector"
  | "Emergency Equipment"
  | "Tooling"
  | "Other";

export interface EquipmentRecord extends LifecycleMetadata {
  id: string;
  name: string;
  type: EquipmentType;
  locationId: string;
  processId: string;
  description: string;
  status: EquipmentStatus;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentInput {
  name: string;
  type: EquipmentType;
  locationId: string;
  processId: string;
  description: string;
  status: EquipmentStatus;
  notes: string;
}

export interface EquipmentValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof EquipmentInput, string>>;
}

export const EQUIPMENT_STATUSES: EquipmentStatus[] = ["active", "inactive", "under-review"];
export const EQUIPMENT_TYPES: EquipmentType[] = [
  "Tank",
  "Pump",
  "Mixer",
  "Conveyor",
  "Forklift",
  "Ventilation",
  "Dust Collector",
  "Emergency Equipment",
  "Tooling",
  "Other",
];

export function validateEquipmentInput(input: EquipmentInput): EquipmentValidationResult {
  const errors: EquipmentValidationResult["errors"] = {};

  if (!input.name.trim()) {
    errors.name = "Name is required.";
  }

  if (!input.type.trim()) {
    errors.type = "Equipment type is required.";
  } else if (!EQUIPMENT_TYPES.includes(input.type)) {
    errors.type = `Equipment type must be one of: ${EQUIPMENT_TYPES.join(", ")}.`;
  }

  if (!input.locationId.trim()) {
    errors.locationId = "Location is required.";
  }

  if (!EQUIPMENT_STATUSES.includes(input.status)) {
    errors.status = "Status is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getEquipmentStatusTone(status: EquipmentStatus) {
  if (status === "active") return "active";
  if (status === "under-review") return "medium";
  return "inactive";
}

export function getEquipmentStatusLabel(status: EquipmentStatus) {
  if (status === "under-review") return "Under Review";
  return status.charAt(0).toUpperCase() + status.slice(1);
}
