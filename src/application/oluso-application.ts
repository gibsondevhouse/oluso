import type { ChemicalInput } from "$lib/persistence/chemical.types";
import type { ControlInput } from "$lib/persistence/control.types";
import type { CorrectiveActionInput } from "$lib/persistence/corrective-action.types";
import type { EquipmentInput } from "$lib/persistence/equipment.types";
import type { FindingInput } from "$lib/persistence/finding.types";
import type { HazardInput } from "$lib/persistence/hazard.types";
import {
  localPersistenceRepository,
  type PersistedRegisterRecord,
  type PersistenceRepositoryAdapter,
  type RegisterCollectionName,
} from "$lib/persistence/local-persistence";
import type { LocationInput } from "$lib/persistence/location.types";
import type { ProcessInput } from "$lib/persistence/process.types";
import type { RiskAssessmentInput } from "$lib/persistence/risk-assessment.types";
import type { SegInput } from "$lib/persistence/seg.types";
import { RecordNotFoundError } from "../domain/errors";
import { createDomainServices, type DomainServices } from "../domain/services";
import { createPersistenceRepositorySet } from "../repositories";

function getService(collection: RegisterCollectionName, services: DomainServices) {
  switch (collection) {
    case "locations":
      return services.locations;
    case "processes":
      return services.processes;
    case "equipment":
      return services.equipment;
    case "chemicals":
      return services.chemicals;
    case "hazards":
      return services.hazards;
    case "controls":
      return services.controls;
    case "riskAssessments":
      return services.riskAssessments;
    case "segs":
      return services.segs;
    case "findings":
      return services.findings;
    case "correctiveActions":
      return services.correctiveActions;
  }
}

export function createOlusoApplication(persistenceRepository: PersistenceRepositoryAdapter) {
  const services = createDomainServices(createPersistenceRepositorySet(persistenceRepository), {
    runInTransaction: (operation) => operation(),
  });

  return {
    services,
    initialize: () => persistenceRepository.initialize(),
    clearAllData: () => persistenceRepository.clearAllData(),
    getDataPath: () => persistenceRepository.getDataPath(),

    listLocations: () => services.locations.list(),
    createLocation: (input: LocationInput) => services.locations.create(input),
    updateLocation: (id: string, input: LocationInput) => services.locations.update(id, input),
    validateLocation: (input: LocationInput) => services.locations.validate(input),

    listProcesses: () => services.processes.list(),
    createProcess: (input: ProcessInput) => services.processes.create(input),
    updateProcess: (id: string, input: ProcessInput) => services.processes.update(id, input),
    validateProcess: (input: ProcessInput) => services.processes.validate(input),

    listEquipment: () => services.equipment.list(),
    createEquipment: (input: EquipmentInput) => services.equipment.create(input),
    updateEquipment: (id: string, input: EquipmentInput) => services.equipment.update(id, input),
    validateEquipment: (input: EquipmentInput) => services.equipment.validate(input),

    listChemicals: () => services.chemicals.list(),
    createChemical: (input: ChemicalInput) => services.chemicals.create(input),
    updateChemical: (id: string, input: ChemicalInput) => services.chemicals.update(id, input),
    validateChemical: (input: ChemicalInput) => services.chemicals.validate(input),

    listHazards: () => services.hazards.list(),
    createHazard: (input: HazardInput) => services.hazards.create(input),
    updateHazard: (id: string, input: HazardInput) => services.hazards.update(id, input),
    validateHazard: (input: HazardInput) => services.hazards.validate(input),

    listControls: () => services.controls.list(),
    createControl: (input: ControlInput) => services.controls.create(input),
    updateControl: (id: string, input: ControlInput) => services.controls.update(id, input),
    validateControl: (input: ControlInput) => services.controls.validate(input),

    listRiskAssessments: () => services.riskAssessments.list(),
    createRiskAssessment: (input: RiskAssessmentInput) => services.riskAssessments.create(input),
    updateRiskAssessment: (id: string, input: RiskAssessmentInput) =>
      services.riskAssessments.update(id, input),
    validateRiskAssessment: (input: RiskAssessmentInput) =>
      services.riskAssessments.validate(input),

    listSegs: () => services.segs.list(),
    createSeg: (input: SegInput) => services.segs.create(input),
    updateSeg: (id: string, input: SegInput) => services.segs.update(id, input),
    validateSeg: (input: SegInput) => services.segs.validate(input),

    listFindings: () => services.findings.list(),
    createFinding: (input: FindingInput) => services.findings.create(input),
    updateFinding: (id: string, input: FindingInput) => services.findings.update(id, input),
    validateFinding: (input: FindingInput) => services.findings.validate(input),

    listCorrectiveActions: () => services.correctiveActions.list(),
    createCorrectiveAction: (input: CorrectiveActionInput) =>
      services.correctiveActions.create(input),
    updateCorrectiveAction: (id: string, input: CorrectiveActionInput) =>
      services.correctiveActions.update(id, input),
    validateCorrectiveAction: (input: CorrectiveActionInput) =>
      services.correctiveActions.validate(input),

    getRecord(collection: RegisterCollectionName, id: string): PersistedRegisterRecord | null {
      try {
        return getService(collection, services).getById(id) as PersistedRegisterRecord;
      } catch (error) {
        if (error instanceof RecordNotFoundError) {
          return null;
        }

        throw error;
      }
    },

    listRegisterRecords(
      collection: RegisterCollectionName,
      options: { includeArchived?: boolean } = {},
    ): PersistedRegisterRecord[] {
      return getService(collection, services).list(options) as PersistedRegisterRecord[];
    },

    searchRegisterRecords(
      collection: RegisterCollectionName,
      query: string,
      options: { includeArchived?: boolean } = {},
    ): PersistedRegisterRecord[] {
      return getService(collection, services).search(query, options) as PersistedRegisterRecord[];
    },

    archiveRecord(collection: RegisterCollectionName, id: string, reason?: string) {
      return getService(collection, services).archive(id, reason);
    },

    restoreRecord(collection: RegisterCollectionName, id: string) {
      return getService(collection, services).restore(id);
    },
  };
}

export const olusoApplication = createOlusoApplication(localPersistenceRepository);

export type OlusoApplication = ReturnType<typeof createOlusoApplication>;
