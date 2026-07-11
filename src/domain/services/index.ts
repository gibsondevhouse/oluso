import type { DomainRepositorySet, TransactionCoordinator } from "../contracts";
import { ChemicalService } from "./chemical-service";
import { ComplianceItemService } from "./compliance-item-service";
import { ControlService } from "./control-service";
import { CorrectiveActionService } from "./corrective-action-service";
import { EquipmentService } from "./equipment-service";
import { ExposureMonitoringService } from "./exposure-monitoring-service";
import { FindingService } from "./finding-service";
import { HazardService } from "./hazard-service";
import { IncidentService } from "./incident-service";
import { LocationService } from "./location-service";
import { ProcessService } from "./process-service";
import { RiskAssessmentService } from "./risk-assessment-service";
import { SEGService } from "./seg-service";

export { BaseRegisterService } from "./base-register-service";
export { ChemicalService } from "./chemical-service";
export { ComplianceItemService } from "./compliance-item-service";
export { ControlService } from "./control-service";
export { CorrectiveActionService } from "./corrective-action-service";
export { EquipmentService } from "./equipment-service";
export { ExposureMonitoringService } from "./exposure-monitoring-service";
export { FindingService } from "./finding-service";
export { HazardService } from "./hazard-service";
export { IncidentService } from "./incident-service";
export { LocationService } from "./location-service";
export { ProcessService } from "./process-service";
export { RiskAssessmentService } from "./risk-assessment-service";
export { SEGService } from "./seg-service";

export function createDomainServices(
  repositories: DomainRepositorySet,
  transactionCoordinator?: TransactionCoordinator,
) {
  return {
    locations: new LocationService(repositories.locations, transactionCoordinator),
    processes: new ProcessService(repositories.processes, repositories, transactionCoordinator),
    equipment: new EquipmentService(repositories.equipment, repositories, transactionCoordinator),
    exposureMonitoring: new ExposureMonitoringService(
      repositories.exposureMonitoring,
      repositories,
      transactionCoordinator,
    ),
    chemicals: new ChemicalService(repositories.chemicals, repositories, transactionCoordinator),
    complianceItems: new ComplianceItemService(
      repositories.complianceItems,
      repositories,
      transactionCoordinator,
    ),
    hazards: new HazardService(repositories.hazards, repositories, transactionCoordinator),
    controls: new ControlService(repositories.controls, repositories, transactionCoordinator),
    riskAssessments: new RiskAssessmentService(
      repositories.riskAssessments,
      repositories,
      transactionCoordinator,
    ),
    segs: new SEGService(repositories.segs, repositories, transactionCoordinator),
    findings: new FindingService(repositories.findings, repositories, transactionCoordinator),
    incidents: new IncidentService(repositories.incidents, repositories, transactionCoordinator),
    correctiveActions: new CorrectiveActionService(
      repositories.correctiveActions,
      repositories,
      transactionCoordinator,
    ),
  };
}

export type DomainServices = ReturnType<typeof createDomainServices>;
