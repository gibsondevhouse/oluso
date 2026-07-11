import type { LifecycleMetadata } from "./lifecycle.types";

export type ExposureContextType = "SEG" | "Person" | "Task";
export type ExposureSampleType = "Personal" | "Area" | "Task" | "Noise" | "Other";
export type ExposureMonitoringStatus =
  | "Pending"
  | "Below Limit"
  | "Above Limit"
  | "Needs Review";

export interface ExposureMonitoringRecord extends LifecycleMetadata {
  id: string;
  sampleReference: string;
  contextType: ExposureContextType;
  segId: string;
  contextDetail: string;
  contaminant: string;
  chemicalId: string;
  hazardId: string;
  locationId: string;
  processId: string;
  samplingDate: string;
  sampleType: ExposureSampleType;
  result: string;
  unit: string;
  exposureLimit: string;
  exposureLimitReference: string;
  status: ExposureMonitoringStatus;
  evidenceReference: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExposureMonitoringInput {
  sampleReference: string;
  contextType: ExposureContextType;
  segId: string;
  contextDetail: string;
  contaminant: string;
  chemicalId: string;
  hazardId: string;
  locationId: string;
  processId: string;
  samplingDate: string;
  sampleType: ExposureSampleType;
  result: string;
  unit: string;
  exposureLimit: string;
  exposureLimitReference: string;
  status: ExposureMonitoringStatus;
  evidenceReference: string;
  notes: string;
}

export interface ExposureMonitoringValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof ExposureMonitoringInput, string>>;
}

export const EXPOSURE_CONTEXT_TYPES: ExposureContextType[] = ["SEG", "Person", "Task"];
export const EXPOSURE_SAMPLE_TYPES: ExposureSampleType[] = [
  "Personal",
  "Area",
  "Task",
  "Noise",
  "Other",
];
export const EXPOSURE_MONITORING_STATUSES: ExposureMonitoringStatus[] = [
  "Pending",
  "Below Limit",
  "Above Limit",
  "Needs Review",
];

function isIsoDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function isNonNegativeNumber(value: string) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0;
}

export function deriveExposureMonitoringStatus(
  result: string,
  exposureLimit: string,
  fallback: ExposureMonitoringStatus,
): ExposureMonitoringStatus {
  if (!result.trim()) return "Pending";
  if (!isNonNegativeNumber(result)) return "Needs Review";
  if (!exposureLimit.trim() || !isNonNegativeNumber(exposureLimit)) return fallback;
  return Number(result) > Number(exposureLimit) ? "Above Limit" : "Below Limit";
}

export function validateExposureMonitoringInput(
  input: ExposureMonitoringInput,
): ExposureMonitoringValidationResult {
  const errors: ExposureMonitoringValidationResult["errors"] = {};

  if (!input.sampleReference.trim()) errors.sampleReference = "Sample reference is required.";
  if (!EXPOSURE_CONTEXT_TYPES.includes(input.contextType)) {
    errors.contextType = "Sampling context is required.";
  }
  if (input.contextType === "SEG" && !input.segId.trim()) {
    errors.segId = "SEG is required for SEG sampling context.";
  }
  if (input.contextType !== "SEG" && !input.contextDetail.trim()) {
    errors.contextDetail = `${input.contextType || "Selected"} context is required.`;
  }
  if (!input.contaminant.trim()) errors.contaminant = "Contaminant is required.";
  if (!input.locationId.trim()) errors.locationId = "Location is required.";
  if (!input.samplingDate.trim() || !isIsoDate(input.samplingDate.trim())) {
    errors.samplingDate = "Sampling date must use YYYY-MM-DD.";
  }
  if (!EXPOSURE_SAMPLE_TYPES.includes(input.sampleType)) {
    errors.sampleType = "Sampling type is required.";
  }
  if (input.result.trim() && !isNonNegativeNumber(input.result.trim())) {
    errors.result = "Result must be a non-negative number.";
  }
  if (input.result.trim() && !input.unit.trim()) errors.unit = "Unit is required when a result is entered.";
  if (input.exposureLimit.trim() && !isNonNegativeNumber(input.exposureLimit.trim())) {
    errors.exposureLimit = "Exposure limit must be a non-negative number.";
  }
  if (!EXPOSURE_MONITORING_STATUSES.includes(input.status)) {
    errors.status = "Status is required.";
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

export function getExposureMonitoringStatusTone(status: ExposureMonitoringStatus) {
  if (status === "Above Limit") return "critical";
  if (status === "Below Limit") return "active";
  if (status === "Needs Review") return "medium";
  return "neutral";
}
