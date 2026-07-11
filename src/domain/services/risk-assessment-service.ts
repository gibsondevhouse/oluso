import {
  validateRiskAssessmentInput,
  type RiskAssessmentInput,
  type RiskAssessmentRecord,
} from "$lib/persistence/risk-assessment.types";
import type { DomainRepositorySet, RegisterRepository, TransactionCoordinator } from "../contracts";
import { RelationshipError } from "../errors";
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

    for (const controlId of input.controlIds) {
      const control = this.repositories.controls.getById(controlId);
      if (control && !control.hazardIds.includes(input.hazardId)) {
        throw new RelationshipError("Selected control is not linked to the selected hazard.");
      }
    }
  }
}
