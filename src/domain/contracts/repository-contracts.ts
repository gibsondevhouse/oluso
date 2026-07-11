import type { ChemicalInput, ChemicalRecord } from "$lib/persistence/chemical.types";
import type { ControlInput, ControlRecord } from "$lib/persistence/control.types";
import type {
  CorrectiveActionInput,
  CorrectiveActionRecord,
} from "$lib/persistence/corrective-action.types";
import type { EquipmentInput, EquipmentRecord } from "$lib/persistence/equipment.types";
import type { FindingInput, FindingRecord } from "$lib/persistence/finding.types";
import type { HazardInput, HazardRecord } from "$lib/persistence/hazard.types";
import type { LifecycleMetadata } from "$lib/persistence/lifecycle.types";
import type { LocationInput, LocationRecord } from "$lib/persistence/location.types";
import type { ProcessInput, ProcessRecord } from "$lib/persistence/process.types";
import type {
  RiskAssessmentInput,
  RiskAssessmentRecord,
} from "$lib/persistence/risk-assessment.types";
import type { SegInput, SegRecord } from "$lib/persistence/seg.types";

export type MaybePromise<T> = T | Promise<T>;

export interface IdentifiedLifecycleRecord extends LifecycleMetadata {
  id: string;
}

export interface RegisterListOptions {
  includeArchived?: boolean;
}

export interface DomainValidationResult<TInput extends object> {
  valid: boolean;
  errors: Partial<Record<keyof TInput | string, string>>;
}

export interface RegisterRepository<TRecord extends IdentifiedLifecycleRecord, TInput extends object> {
  create(input: TInput): MaybePromise<TRecord>;
  update(id: string, input: TInput): MaybePromise<TRecord>;
  archive(id: string, reason?: string): MaybePromise<TRecord>;
  restore(id: string): MaybePromise<TRecord>;
  delete?(id: string): MaybePromise<void>;
  getById(id: string): TRecord | null;
  list(options?: RegisterListOptions): TRecord[];
}

export interface DomainService<TRecord extends IdentifiedLifecycleRecord, TInput extends object> {
  create(input: TInput): MaybePromise<TRecord>;
  update(id: string, input: TInput): MaybePromise<TRecord>;
  archive(id: string, reason?: string): MaybePromise<TRecord>;
  restore(id: string): MaybePromise<TRecord>;
  delete?(id: string): MaybePromise<void>;
  getById(id: string): TRecord;
  list(options?: RegisterListOptions): TRecord[];
  search(query: string, options?: RegisterListOptions): TRecord[];
  validate(input: TInput): DomainValidationResult<TInput>;
}

export interface TransactionCoordinator {
  runInTransaction<T>(operation: () => MaybePromise<T>): MaybePromise<T>;
}

export interface DomainRepositorySet {
  locations: RegisterRepository<LocationRecord, LocationInput>;
  processes: RegisterRepository<ProcessRecord, ProcessInput>;
  equipment: RegisterRepository<EquipmentRecord, EquipmentInput>;
  chemicals: RegisterRepository<ChemicalRecord, ChemicalInput>;
  hazards: RegisterRepository<HazardRecord, HazardInput>;
  controls: RegisterRepository<ControlRecord, ControlInput>;
  riskAssessments: RegisterRepository<RiskAssessmentRecord, RiskAssessmentInput>;
  segs: RegisterRepository<SegRecord, SegInput>;
  findings: RegisterRepository<FindingRecord, FindingInput>;
  correctiveActions: RegisterRepository<CorrectiveActionRecord, CorrectiveActionInput>;
}
