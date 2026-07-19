import type { RecordEnvelope } from "$lib/data/database";

export const DOCUMENT_TYPES = [
  "Safety Data Sheet", "Laboratory Report", "Product Label", "Technical Specification", "Photograph",
  "Procedure", "Permit", "Drawing", "Inspection Record", "Training Evidence", "Sampling Record",
  "Regulatory Correspondence", "Other",
] as const;
export type DocumentType = (typeof DOCUMENT_TYPES)[number];
export const EXTERNAL_SYSTEMS = [
  "OneDrive", "SharePoint", "Network Drive", "Local Company Folder", "Email", "Regulatory Website",
  "Manufacturer Website", "Other", "Unknown",
] as const;
export type ExternalSystem = (typeof EXTERNAL_SYSTEMS)[number];
export const DOCUMENT_AVAILABILITY_STATUSES = [
  "Available", "Missing", "Access Restricted", "Link Broken", "Needs Verification", "Superseded", "Unknown",
] as const;
export type DocumentAvailabilityStatus = (typeof DOCUMENT_AVAILABILITY_STATUSES)[number];

export interface DocumentReference extends RecordEnvelope {
  title: string;
  documentType: DocumentType;
  fileName?: string;
  externalPath?: string;
  externalSystem: ExternalSystem;
  documentDate?: string;
  revisionLabel?: string;
  contentHash?: string;
  availabilityStatus: DocumentAvailabilityStatus;
  notes: string;
}

export interface DocumentReferenceInput {
  businessId?: string;
  title: string;
  documentType: DocumentType;
  fileName?: string;
  externalPath?: string;
  externalSystem: ExternalSystem;
  documentDate?: string;
  revisionLabel?: string;
  contentHash?: string;
  availabilityStatus: DocumentAvailabilityStatus;
  notes?: string;
}
