import type { FoundationRecordMetadata, FoundationRecordStatus } from "../foundation/validation";

export const PROCESS_LOCATION_RELATIONSHIP_TYPES = [
  "Primary", "Source", "Destination", "Transfer Path", "Supporting", "Storage", "Staging",
  "Waste Destination", "Emergency Support", "Other",
] as const;
export type ProcessLocationRelationshipType = (typeof PROCESS_LOCATION_RELATIONSHIP_TYPES)[number];

export interface ProcessLocationAssignment extends FoundationRecordMetadata {
  processId: string;
  locationId: string;
  relationshipType: ProcessLocationRelationshipType;
  sequence: number | null;
  effectiveFrom: string | null;
  effectiveTo: string | null;
  status: FoundationRecordStatus;
  notes: string;
}

export type ProcessLocationAssignmentFields = Omit<
  ProcessLocationAssignment,
  keyof FoundationRecordMetadata | "sequence" | "effectiveFrom" | "effectiveTo" | "notes"
> & {
  businessId?: string;
  sequence?: number | null;
  effectiveFrom?: string | null;
  effectiveTo?: string | null;
  notes?: string;
};
