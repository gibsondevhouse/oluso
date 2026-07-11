import type {
  DomainRepositorySet,
  IdentifiedLifecycleRecord,
  MaybePromise,
  RegisterListOptions,
  RegisterRepository,
} from "../domain/contracts";
import type { ChemicalInput, ChemicalRecord } from "$lib/persistence/chemical.types";
import type { ControlInput, ControlRecord } from "$lib/persistence/control.types";
import type {
  CorrectiveActionInput,
  CorrectiveActionRecord,
} from "$lib/persistence/corrective-action.types";
import type { EquipmentInput, EquipmentRecord } from "$lib/persistence/equipment.types";
import type { FindingInput, FindingRecord } from "$lib/persistence/finding.types";
import type { HazardInput, HazardRecord } from "$lib/persistence/hazard.types";
import type { LocationInput, LocationRecord } from "$lib/persistence/location.types";
import type { ProcessInput, ProcessRecord } from "$lib/persistence/process.types";
import type { RegisterCollectionName, PersistenceRepositoryAdapter } from "$lib/persistence/local-persistence";
import type {
  RiskAssessmentInput,
  RiskAssessmentRecord,
} from "$lib/persistence/risk-assessment.types";
import type { SegInput, SegRecord } from "$lib/persistence/seg.types";

interface RepositoryOperations<TRecord extends IdentifiedLifecycleRecord, TInput extends object> {
  create(input: TInput): MaybePromise<TRecord>;
  update(id: string, input: TInput): MaybePromise<TRecord>;
}

function createRegisterRepository<TRecord extends IdentifiedLifecycleRecord, TInput extends object>(
  persistenceRepository: PersistenceRepositoryAdapter,
  collection: RegisterCollectionName,
  operations: RepositoryOperations<TRecord, TInput>,
): RegisterRepository<TRecord, TInput> {
  return {
    create: (input) => operations.create(input),
    update: (id, input) => operations.update(id, input),
    archive: (id, reason) =>
      persistenceRepository.archiveRecord(collection, id, reason) as unknown as MaybePromise<TRecord>,
    restore: (id) =>
      persistenceRepository.restoreRecord(collection, id) as unknown as MaybePromise<TRecord>,
    getById: (id) => persistenceRepository.getRecord(collection, id) as TRecord | null,
    list: (options: RegisterListOptions = {}) =>
      persistenceRepository.listRegisterRecords(collection, options) as unknown as TRecord[],
  };
}

export function createPersistenceRepositorySet(
  persistenceRepository: PersistenceRepositoryAdapter,
): DomainRepositorySet {
  return {
    locations: createRegisterRepository<LocationRecord, LocationInput>(
      persistenceRepository,
      "locations",
      {
        create: (input) => persistenceRepository.createLocation(input),
        update: (id, input) => persistenceRepository.updateLocation(id, input),
      },
    ),
    processes: createRegisterRepository<ProcessRecord, ProcessInput>(
      persistenceRepository,
      "processes",
      {
        create: (input) => persistenceRepository.createProcess(input),
        update: (id, input) => persistenceRepository.updateProcess(id, input),
      },
    ),
    equipment: createRegisterRepository<EquipmentRecord, EquipmentInput>(
      persistenceRepository,
      "equipment",
      {
        create: (input) => persistenceRepository.createEquipment(input),
        update: (id, input) => persistenceRepository.updateEquipment(id, input),
      },
    ),
    chemicals: createRegisterRepository<ChemicalRecord, ChemicalInput>(
      persistenceRepository,
      "chemicals",
      {
        create: (input) => persistenceRepository.createChemical(input),
        update: (id, input) => persistenceRepository.updateChemical(id, input),
      },
    ),
    hazards: createRegisterRepository<HazardRecord, HazardInput>(
      persistenceRepository,
      "hazards",
      {
        create: (input) => persistenceRepository.createHazard(input),
        update: (id, input) => persistenceRepository.updateHazard(id, input),
      },
    ),
    controls: createRegisterRepository<ControlRecord, ControlInput>(
      persistenceRepository,
      "controls",
      {
        create: (input) => persistenceRepository.createControl(input),
        update: (id, input) => persistenceRepository.updateControl(id, input),
      },
    ),
    riskAssessments: createRegisterRepository<RiskAssessmentRecord, RiskAssessmentInput>(
      persistenceRepository,
      "riskAssessments",
      {
        create: (input) => persistenceRepository.createRiskAssessment(input),
        update: (id, input) => persistenceRepository.updateRiskAssessment(id, input),
      },
    ),
    segs: createRegisterRepository<SegRecord, SegInput>(persistenceRepository, "segs", {
      create: (input) => persistenceRepository.createSeg(input),
      update: (id, input) => persistenceRepository.updateSeg(id, input),
    }),
    findings: createRegisterRepository<FindingRecord, FindingInput>(
      persistenceRepository,
      "findings",
      {
        create: (input) => persistenceRepository.createFinding(input),
        update: (id, input) => persistenceRepository.updateFinding(id, input),
      },
    ),
    correctiveActions: createRegisterRepository<CorrectiveActionRecord, CorrectiveActionInput>(
      persistenceRepository,
      "correctiveActions",
      {
        create: (input) => persistenceRepository.createCorrectiveAction(input),
        update: (id, input) => persistenceRepository.updateCorrectiveAction(id, input),
      },
    ),
  };
}
