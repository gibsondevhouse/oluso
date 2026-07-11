import {
  validateRiskAssessmentInput,
  type RiskAssessmentInput,
  type RiskAssessmentRecord,
} from "$lib/persistence/risk-assessment.types";
import type { DomainRepositorySet, RegisterRepository, TransactionCoordinator } from "../contracts";
import { BaseRegisterService } from "./base-register-service";

export class RiskAssessmentService extends BaseRegisterService<
  RiskAssessmentRecord,
  RiskAssessmentInput
> {
  constructor(
    repository: RegisterRepository<RiskAssessmentRecord, RiskAssessmentInput>,
    private readonly repositories: Pick<DomainRepositorySet, "hazards" | "controls">,
    transactionCoordinator?: TransactionCoordinator,
  ) {
    super(repository, "Risk assessment", transactionCoordinator);
  }

  protected validateInput(input: RiskAssessmentInput) {
    return validateRiskAssessmentInput(input).errors;
  }

  protected validateRelationships(input: RiskAssessmentInput) {
    this.ensureRelatedRecord(this.repositories.hazards, input.hazardId, "Selected hazard");
    this.ensureRelatedRecords(this.repositories.controls, input.controlIds, "Selected control");
  }
}
