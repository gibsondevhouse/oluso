import type { LifecycleMetadata } from "./lifecycle.types";
import type { HazardLikelihood, HazardSeverity } from "./hazard.types";

export type RiskAssessmentStatus = "Draft" | "In Review" | "Approved" | "Needs Review";

export interface RiskAssessmentRecord extends LifecycleMetadata {
  id: string;
  title: string;
  hazardId: string;
  controlIds: string[];
  inherentSeverity: HazardSeverity;
  inherentLikelihood: HazardLikelihood;
  residualSeverity: HazardSeverity;
  residualLikelihood: HazardLikelihood;
  assessor: string;
  reviewStatus: RiskAssessmentStatus;
  nextReviewDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface RiskAssessmentInput {
  title: string;
  hazardId: string;
  controlIds: string[];
  inherentSeverity: HazardSeverity;
  inherentLikelihood: HazardLikelihood;
  residualSeverity: HazardSeverity;
  residualLikelihood: HazardLikelihood;
  assessor: string;
  reviewStatus: RiskAssessmentStatus;
  nextReviewDate: string;
  notes: string;
}

export interface RiskAssessmentValidationResult {
  valid: boolean;
  errors: Partial<Record<keyof RiskAssessmentInput, string>>;
}

export const RISK_ASSESSMENT_STATUSES: RiskAssessmentStatus[] = [
  "Draft",
  "In Review",
  "Approved",
  "Needs Review",
];

export function validateRiskAssessmentInput(
  input: RiskAssessmentInput,
): RiskAssessmentValidationResult {
  const errors: RiskAssessmentValidationResult["errors"] = {};

  if (!input.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!input.hazardId.trim()) {
    errors.hazardId = "Related hazard is required.";
  }

  if (!input.inherentSeverity) {
    errors.inherentSeverity = "Inherent severity is required.";
  }

  if (!input.inherentLikelihood) {
    errors.inherentLikelihood = "Inherent likelihood is required.";
  }

  if (!input.residualSeverity) {
    errors.residualSeverity = "Residual severity is required.";
  }

  if (!input.residualLikelihood) {
    errors.residualLikelihood = "Residual likelihood is required.";
  }

  if (!RISK_ASSESSMENT_STATUSES.includes(input.reviewStatus)) {
    errors.reviewStatus = "Review status is required.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function getRiskAssessmentStatusTone(status: RiskAssessmentStatus) {
  if (status === "Approved") return "active";
  if (status === "In Review" || status === "Needs Review") return "medium";
  return "inactive";
}
