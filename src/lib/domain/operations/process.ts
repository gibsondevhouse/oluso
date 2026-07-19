import {
  FOUNDATION_RECORD_STATUSES, requiredChoice, requiredText, result, validateBusinessId,
  type FoundationRecordMetadata, type FoundationRecordStatus,
} from "../foundation/validation";

export const PROCESS_TYPES = [
  "Production", "Maintenance", "Warehouse", "Laboratory", "Utilities", "Administrative", "Emergency", "Other",
] as const;
export type ProcessType = (typeof PROCESS_TYPES)[number];

export interface Process extends FoundationRecordMetadata {
  name: string;
  processType: ProcessType;
  operationalFunctionId: string;
  primaryLocationId: string;
  resolvedSiteId: string;
  description: string;
  status: FoundationRecordStatus;
}

export interface ProcessFields {
  businessId?: string;
  name: string;
  processType: ProcessType;
  operationalFunctionId: string;
  primaryLocationId: string;
  description?: string;
  status: FoundationRecordStatus;
}

export function validateProcess(input: ProcessFields) {
  return result([
    ...validateBusinessId(input.businessId), ...requiredText(input.name, "name", "Name"),
    ...requiredChoice(input.processType, PROCESS_TYPES, "processType", "Process type"),
    ...requiredText(input.operationalFunctionId, "operationalFunctionId", "Operational function"),
    ...requiredText(input.primaryLocationId, "primaryLocationId", "Primary location"),
    ...requiredChoice(input.status, FOUNDATION_RECORD_STATUSES, "status", "Status"),
  ]);
}
