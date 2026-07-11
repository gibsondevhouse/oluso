import type { LifecycleMetadata } from "./lifecycle.types";

export type IncidentType =
  | "Near Miss"
  | "Injury or Illness"
  | "Property Damage"
  | "Environmental Release"
  | "Process Safety Event"
  | "Other";
export type IncidentStatus = "Open" | "Under Investigation" | "Action Required" | "Closed";
export type IncidentReportingStatus =
  | "Not Evaluated"
  | "Pending Review"
  | "Not Reportable"
  | "Reported";

export interface IncidentRecord extends LifecycleMetadata {
  id: string;
  title: string;
  type: IncidentType;
  occurredAt: string;
  locationId: string;
  processId: string;
  equipmentId: string;
  chemicalId: string;
  hazardIds: string[];
  controlIds: string[];
  description: string;
  actualOutcome: string;
  potentialOutcome: string;
  immediateActions: string;
  investigationSummary: string;
  immediateCauses: string;
  contributingCauses: string;
  evidenceReference: string;
  reportingStatus: IncidentReportingStatus;
  status: IncidentStatus;
  createdAt: string;
  updatedAt: string;
}

export interface IncidentInput {
  title: string;
  type: IncidentType;
  occurredAt: string;
  locationId: string;
  processId: string;
  equipmentId: string;
  chemicalId: string;
  hazardIds: string[];
  controlIds: string[];
  description: string;
  actualOutcome: string;
  potentialOutcome: string;
  immediateActions: string;
  investigationSummary: string;
  immediateCauses: string;
  contributingCauses: string;
  evidenceReference: string;
  reportingStatus: IncidentReportingStatus;
  status: IncidentStatus;
}

export interface IncidentValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof IncidentInput, string>>;
}

export const INCIDENT_TYPES: IncidentType[] = [
  "Near Miss",
  "Injury or Illness",
  "Property Damage",
  "Environmental Release",
  "Process Safety Event",
  "Other",
];
export const INCIDENT_STATUSES: IncidentStatus[] = [
  "Open",
  "Under Investigation",
  "Action Required",
  "Closed",
];
export const INCIDENT_REPORTING_STATUSES: IncidentReportingStatus[] = [
  "Not Evaluated",
  "Pending Review",
  "Not Reportable",
  "Reported",
];

export function validateIncidentInput(input: IncidentInput): IncidentValidationResult {
  const errors: IncidentValidationResult["errors"] = {};

  if (!input.title.trim()) errors.title = "Title is required.";
  if (!INCIDENT_TYPES.includes(input.type)) errors.type = "Event type is required.";
  if (!input.occurredAt.trim()) errors.occurredAt = "Event date and time are required.";
  if (!input.locationId.trim()) errors.locationId = "Location is required.";
  if (!input.description.trim()) errors.description = "Description is required.";
  if (!INCIDENT_REPORTING_STATUSES.includes(input.reportingStatus)) {
    errors.reportingStatus = "Reporting status is required.";
  }
  if (!INCIDENT_STATUSES.includes(input.status)) errors.status = "Status is required.";

  return { valid: Object.keys(errors).length === 0, errors };
}

export function getIncidentStatusTone(status: IncidentStatus) {
  if (status === "Closed") return "closed";
  if (status === "Under Investigation") return "progress";
  if (status === "Action Required") return "critical";
  return "open";
}
