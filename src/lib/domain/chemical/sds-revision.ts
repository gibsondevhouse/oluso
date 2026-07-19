import type { RecordEnvelope } from "$lib/data/database";

export const SDS_CURRENT_STATUSES = ["Current", "Superseded", "Pending Review", "Rejected", "Unavailable"] as const;
export type SdsCurrentStatus = (typeof SDS_CURRENT_STATUSES)[number];
export const SDS_REVIEW_STATUSES = ["Not Reviewed", "In Review", "Accepted", "Needs Correction", "Rejected"] as const;
export type SdsReviewStatus = (typeof SDS_REVIEW_STATUSES)[number];

export interface SdsRevision extends RecordEnvelope {
  productId: string;
  manufacturerOrganizationId?: string;
  revisionDate?: string;
  revisionDateUnknown: boolean;
  effectiveDate?: string;
  receivedDate?: string;
  language: string;
  jurisdiction: string;
  documentReferenceId?: string;
  currentStatus: SdsCurrentStatus;
  reviewStatus: SdsReviewStatus;
  reviewedAt?: string;
  reviewedByPersonId?: string;
  supersedesSdsRevisionId?: string;
  notes: string;
}

export interface SdsRevisionInput {
  businessId?: string;
  productId: string;
  manufacturerOrganizationId?: string;
  revisionDate?: string;
  revisionDateUnknown?: boolean;
  effectiveDate?: string;
  receivedDate?: string;
  language: string;
  jurisdiction: string;
  documentReferenceId?: string;
  currentStatus?: SdsCurrentStatus;
  reviewStatus?: SdsReviewStatus;
  reviewedAt?: string;
  reviewedByPersonId?: string;
  supersedesSdsRevisionId?: string;
  notes?: string;
}
