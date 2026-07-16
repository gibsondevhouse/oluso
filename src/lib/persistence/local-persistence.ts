import { writable, type Writable } from "svelte/store";
import type { FindingInput, FindingRecord } from "./finding.types";
import { FINDING_STATUSES, FINDING_TYPES } from "./finding.types";
import type { LocationInput, LocationRecord } from "./location.types";
import { LOCATION_TYPES } from "./location.types";
import type { ProcessInput, ProcessRecord } from "./process.types";
import { PROCESS_CATEGORIES } from "./process.types";
import type { ChemicalInput, ChemicalRecord } from "./chemical.types";
import { CHEMICAL_HAZARD_CLASSES, CHEMICAL_SDS_STATUSES } from "./chemical.types";
import type { ComplianceItemInput, ComplianceItemRecord } from "./compliance-item.types";
import {
  COMPLIANCE_ITEM_STATUSES,
  COMPLIANCE_ITEM_TYPES,
  COMPLIANCE_REVIEW_STATUSES,
} from "./compliance-item.types";
import type { ControlInput, ControlRecord } from "./control.types";
import { CONTROL_STATUSES, CONTROL_TYPES } from "./control.types";
import type { EquipmentInput, EquipmentRecord } from "./equipment.types";
import { EQUIPMENT_TYPES } from "./equipment.types";
import type {
  ExposureMonitoringInput,
  ExposureMonitoringRecord,
} from "./exposure-monitoring.types";
import {
  EXPOSURE_CONTEXT_TYPES,
  EXPOSURE_MONITORING_STATUSES,
  EXPOSURE_SAMPLE_TYPES,
} from "./exposure-monitoring.types";
import type { HazardInput, HazardRecord } from "./hazard.types";
import { HAZARD_CATEGORIES, HAZARD_LIKELIHOODS, HAZARD_SEVERITIES } from "./hazard.types";
import type { IncidentInput, IncidentRecord } from "./incident.types";
import {
  INCIDENT_REPORTING_STATUSES,
  INCIDENT_STATUSES,
  INCIDENT_TYPES,
} from "./incident.types";
import type {
  RiskAssessmentInput,
  RiskAssessmentRecord,
} from "./risk-assessment.types";
import { RISK_ASSESSMENT_STATUSES } from "./risk-assessment.types";
import type { SegInput, SegRecord } from "./seg.types";
import { SEG_TYPES } from "./seg.types";
import type { CorrectiveActionInput, CorrectiveActionRecord } from "./corrective-action.types";
import {
  CORRECTIVE_ACTION_SOURCE_TYPES,
  CORRECTIVE_ACTION_STATUSES,
  CORRECTIVE_ACTION_TYPES,
} from "./corrective-action.types";
import {
  CAMPAIGN_COLLECTION_NAMES,
  CAMPAIGN_REGISTER_DEFINITIONS,
  getCampaignRegisterDefinitionByCollection,
  isCampaignCollectionName,
  type CampaignCollectionName,
  type CampaignRecord,
} from "./campaign-register.types";
import type { LifecycleMetadata } from "./lifecycle.types";
import { ensureLifecycle, isActiveLifecycle, withActiveLifecycle } from "./lifecycle.types";

export type RegisterCollectionName =
  | "locations"
  | "findings"
  | "incidents"
  | "processes"
  | "equipment"
  | "exposureMonitoring"
  | "chemicals"
  | "complianceItems"
  | "hazards"
  | "controls"
  | "riskAssessments"
  | "segs"
  | "correctiveActions"
  | CampaignCollectionName;

export type PersistedRegisterRecord =
  | LocationRecord
  | FindingRecord
  | IncidentRecord
  | ProcessRecord
  | EquipmentRecord
  | ExposureMonitoringRecord
  | ChemicalRecord
  | ComplianceItemRecord
  | HazardRecord
  | ControlRecord
  | RiskAssessmentRecord
  | SegRecord
  | CorrectiveActionRecord
  | CampaignRecord;

export const REGISTER_COLLECTION_NAMES: RegisterCollectionName[] = [
  "locations",
  "processes",
  "equipment",
  "exposureMonitoring",
  "chemicals",
  "hazards",
  "controls",
  "riskAssessments",
  "segs",
  "findings",
  "incidents",
  "complianceItems",
  "correctiveActions",
  ...CAMPAIGN_COLLECTION_NAMES,
];

export type PersistenceStatus = "not_configured" | "loading" | "ready" | "error";

export interface PersistenceDiagnostics {
  status: PersistenceStatus;
  backend?: "localStorage" | "sqlite";
  connectionState?: "not_connected" | "connected" | "error";
  dataPath: string | null;
  schemaVersion?: number;
  databaseSizeBytes?: number;
  recordCounts?: Partial<Record<RegisterCollectionName, number>>;
  initializedAt: string | null;
  lastInitializationStatus: string;
  lastMigrationStatus: string;
  localStorageMigrationStatus?: string;
  lastError: string | null;
}

export interface PersistedDatabaseBase {
  schemaVersion: number;
  locations: LocationRecord[];
  findings: FindingRecord[];
  processes: ProcessRecord[];
  equipment: EquipmentRecord[];
  exposureMonitoring: ExposureMonitoringRecord[];
  chemicals: ChemicalRecord[];
  complianceItems: ComplianceItemRecord[];
  hazards: HazardRecord[];
  controls: ControlRecord[];
  riskAssessments: RiskAssessmentRecord[];
  segs: SegRecord[];
  incidents: IncidentRecord[];
  correctiveActions: CorrectiveActionRecord[];
  initializedAt: string;
  updatedAt: string;
}

export type PersistedDatabase = PersistedDatabaseBase &
  Record<CampaignCollectionName, CampaignRecord[]>;

interface PersistedDatabaseV3 {
  schemaVersion: 3;
  locations: LocationRecord[];
  findings: FindingRecord[];
  processes: ProcessRecord[];
  equipment: EquipmentRecord[];
  chemicals: ChemicalRecord[];
  hazards: HazardRecord[];
  controls: ControlRecord[];
  riskAssessments: RiskAssessmentRecord[];
  segs: SegRecord[];
  correctiveActions: CorrectiveActionRecord[];
  initializedAt: string;
  updatedAt: string;
}

interface PersistedDatabaseV4 {
  schemaVersion: 4;
  locations: LocationRecord[];
  findings: FindingRecord[];
  processes: ProcessRecord[];
  equipment: EquipmentRecord[];
  chemicals: ChemicalRecord[];
  hazards: HazardRecord[];
  controls: ControlRecord[];
  riskAssessments: RiskAssessmentRecord[];
  segs: SegRecord[];
  correctiveActions: CorrectiveActionRecord[];
  initializedAt: string;
  updatedAt: string;
}

interface PersistedDatabaseV5 {
  schemaVersion: 5;
  locations: LocationRecord[];
  findings: FindingRecord[];
  processes: ProcessRecord[];
  equipment: EquipmentRecord[];
  chemicals: ChemicalRecord[];
  hazards: HazardRecord[];
  controls: ControlRecord[];
  riskAssessments: RiskAssessmentRecord[];
  segs: SegRecord[];
  correctiveActions: CorrectiveActionRecord[];
  initializedAt: string;
  updatedAt: string;
}

interface PersistedDatabaseV2 {
  schemaVersion: 2;
  locations: LocationRecord[];
  findings: FindingRecord[];
  initializedAt: string;
  updatedAt: string;
}

interface PersistedDatabaseV1 {
  schemaVersion: 1;
  locations: LocationRecord[];
  initializedAt: string;
  updatedAt: string;
}

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

interface RepositoryOptions {
  storage?: StorageAdapter;
  storageKey?: string;
  now?: () => Date;
  createId?: () => string;
}

const SCHEMA_VERSION = 14;
const DEFAULT_STORAGE_KEY = "oluso.persistence.v1";
const DEFAULT_DATA_PATH = `localStorage://${DEFAULT_STORAGE_KEY}`;
const SEED_TIMESTAMP = "2026-07-09T00:00:00.000Z";

void DEFAULT_DATA_PATH;

type SeedRecord<TRecord extends LifecycleMetadata> = Omit<TRecord, keyof LifecycleMetadata>;

const initialDiagnostics: PersistenceDiagnostics = {
  status: "not_configured",
  backend: "localStorage",
  connectionState: "not_connected",
  dataPath: null,
  schemaVersion: SCHEMA_VERSION,
  databaseSizeBytes: undefined,
  recordCounts: undefined,
  initializedAt: null,
  lastInitializationStatus: "Persistence has not been initialized.",
  lastMigrationStatus: "No migration has run.",
  localStorageMigrationStatus: "Not applicable.",
  lastError: null,
};

export const persistenceDiagnostics = writable<PersistenceDiagnostics>(initialDiagnostics);
export const locationRecords = writable<LocationRecord[]>([]);
export const findingRecords = writable<FindingRecord[]>([]);
export const processRecords = writable<ProcessRecord[]>([]);
export const equipmentRecords = writable<EquipmentRecord[]>([]);
export const exposureMonitoringRecords = writable<ExposureMonitoringRecord[]>([]);
export const chemicalRecords = writable<ChemicalRecord[]>([]);
export const complianceItemRecords = writable<ComplianceItemRecord[]>([]);
export const hazardRecords = writable<HazardRecord[]>([]);
export const controlRecords = writable<ControlRecord[]>([]);
export const riskAssessmentRecords = writable<RiskAssessmentRecord[]>([]);
export const segRecords = writable<SegRecord[]>([]);
export const incidentRecords = writable<IncidentRecord[]>([]);
export const correctiveActionRecords = writable<CorrectiveActionRecord[]>([]);
export const campaignRecordStores = Object.fromEntries(
  CAMPAIGN_COLLECTION_NAMES.map((collection) => [collection, writable<CampaignRecord[]>([])]),
) as Record<CampaignCollectionName, Writable<CampaignRecord[]>>;

function defaultNow() {
  return new Date();
}

function createEmptyDatabase(timestamp: string): PersistedDatabase {
  return {
    schemaVersion: SCHEMA_VERSION,
    locations: [],
    findings: [],
    processes: [],
    equipment: [],
    exposureMonitoring: [],
    chemicals: [],
    complianceItems: [],
    hazards: [],
    controls: [],
    riskAssessments: [],
    segs: [],
    incidents: [],
    correctiveActions: [],
    ...emptyCampaignCollections(),
    initializedAt: timestamp,
    updatedAt: timestamp,
  };
}

function defaultCreateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getBrowserStorage(): StorageAdapter | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function serializeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function ensureLifecycleRecords<TRecord extends object>(records: TRecord[] | undefined): Array<TRecord & LifecycleMetadata> {
  return (records ?? []).map((record) => ensureLifecycle(record));
}

function activeRecords<TRecord extends LifecycleMetadata>(records: TRecord[]): TRecord[] {
  return records.filter(isActiveLifecycle);
}

function normalizeStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  }

  return [];
}

function normalizePicklistValue<TValue extends string>(
  value: unknown,
  allowedValues: readonly TValue[],
  fallback: TValue,
  aliases: Record<string, TValue> = {},
): TValue {
  if (typeof value === "string") {
    if ((allowedValues as readonly string[]).includes(value)) {
      return value as TValue;
    }

    if (aliases[value]) {
      return aliases[value];
    }
  }

  return fallback;
}

function normalizeLocationRecord(record: object): LocationRecord {
  const raw = record as Partial<LocationRecord>;

  return ensureLifecycle({
    ...raw,
    id: raw.id ?? "",
    name: raw.name ?? "",
    type: normalizePicklistValue(raw.type, LOCATION_TYPES, "Facility", {
      Workshop: "Production Area",
    }),
    parentLocationId: raw.parentLocationId ?? "",
    country: raw.country ?? "",
    stateProvince: raw.stateProvince ?? "",
    description: raw.description ?? "",
    status: raw.status === "inactive" ? "inactive" : "active",
    createdAt: raw.createdAt ?? SEED_TIMESTAMP,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? SEED_TIMESTAMP,
  }) as LocationRecord;
}

function normalizeProcessRecord(record: object): ProcessRecord {
  const raw = record as Partial<ProcessRecord>;

  return ensureLifecycle({
    ...raw,
    id: raw.id ?? "",
    name: raw.name ?? "",
    locationId: raw.locationId ?? "",
    category: normalizePicklistValue(raw.category, PROCESS_CATEGORIES, "Transfer", {
      Manufacturing: "Formulation",
      "Chemical Handling": "Transfer",
      Logistics: "Storage",
      "Quality Control": "Formulation",
      "Emergency Response": "Maintenance",
      Administrative: "Maintenance",
      Other: "Maintenance",
    }),
    description: raw.description ?? "",
    status:
      raw.status === "inactive" || raw.status === "under-review" ? raw.status : "active",
    createdAt: raw.createdAt ?? SEED_TIMESTAMP,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? SEED_TIMESTAMP,
  }) as ProcessRecord;
}

function normalizeEquipmentRecord(record: object): EquipmentRecord {
  const raw = record as Partial<EquipmentRecord>;

  return ensureLifecycle({
    ...raw,
    id: raw.id ?? "",
    name: raw.name ?? "",
    type: normalizePicklistValue(raw.type, EQUIPMENT_TYPES, "Other"),
    locationId: raw.locationId ?? "",
    processId: raw.processId ?? "",
    description: raw.description ?? "",
    status:
      raw.status === "inactive" || raw.status === "under-review" ? raw.status : "active",
    notes: raw.notes ?? "",
    createdAt: raw.createdAt ?? SEED_TIMESTAMP,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? SEED_TIMESTAMP,
  }) as EquipmentRecord;
}

function normalizeExposureMonitoringRecord(record: object): ExposureMonitoringRecord {
  const raw = record as Partial<ExposureMonitoringRecord>;

  return ensureLifecycle({
    ...raw,
    id: raw.id ?? "",
    sampleReference: raw.sampleReference ?? "",
    contextType: normalizePicklistValue(raw.contextType, EXPOSURE_CONTEXT_TYPES, "SEG"),
    segId: raw.segId ?? "",
    contextDetail: raw.contextDetail ?? "",
    contaminant: raw.contaminant ?? "",
    chemicalId: raw.chemicalId ?? "",
    hazardId: raw.hazardId ?? "",
    locationId: raw.locationId ?? "",
    processId: raw.processId ?? "",
    samplingDate: raw.samplingDate ?? "",
    sampleType: normalizePicklistValue(raw.sampleType, EXPOSURE_SAMPLE_TYPES, "Personal"),
    result: raw.result ?? "",
    unit: raw.unit ?? "",
    exposureLimit: raw.exposureLimit ?? "",
    exposureLimitReference: raw.exposureLimitReference ?? "",
    status: normalizePicklistValue(raw.status, EXPOSURE_MONITORING_STATUSES, "Pending"),
    evidenceReference: raw.evidenceReference ?? "",
    notes: raw.notes ?? "",
    createdAt: raw.createdAt ?? SEED_TIMESTAMP,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? SEED_TIMESTAMP,
  }) as ExposureMonitoringRecord;
}

function normalizeChemicalRecord(record: object): ChemicalRecord {
  const raw = record as Partial<ChemicalRecord>;

  return ensureLifecycle({
    ...raw,
    id: raw.id ?? "",
    name: raw.name ?? "",
    casNumber: raw.casNumber ?? "",
    hazardClass: normalizePicklistValue(raw.hazardClass, CHEMICAL_HAZARD_CLASSES, "Unknown", {
      "Non-hazardous": "Unknown",
      Oxidising: "Unknown",
      Explosive: "Flammable",
      Environmental: "Unknown",
      Irritant: "Unknown",
    }),
    processIds: normalizeStringArray((raw as { processIds?: unknown }).processIds),
    storageLocationId: raw.storageLocationId ?? "",
    sdsStatus: normalizePicklistValue(raw.sdsStatus, CHEMICAL_SDS_STATUSES, "Missing"),
    sdsReference: raw.sdsReference ?? "",
    sdsRevisionDate: raw.sdsRevisionDate ?? "",
    sdsReviewDate: raw.sdsReviewDate ?? "",
    exposureLimitValue: raw.exposureLimitValue ?? "",
    exposureLimitUnit: raw.exposureLimitUnit ?? "",
    exposureLimitSource: raw.exposureLimitSource ?? "",
    exposureLimitAveragingPeriod: raw.exposureLimitAveragingPeriod ?? "",
    quantity: raw.quantity ?? "",
    unit: raw.unit ?? "",
    supplier: raw.supplier ?? "",
    status:
      raw.status === "inactive" || raw.status === "restricted" ? raw.status : "active",
    notes: raw.notes ?? "",
    createdAt: raw.createdAt ?? SEED_TIMESTAMP,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? SEED_TIMESTAMP,
  }) as ChemicalRecord;
}

function normalizeComplianceItemRecord(record: object): ComplianceItemRecord {
  const raw = record as Partial<ComplianceItemRecord>;

  return ensureLifecycle({
    ...raw,
    id: raw.id ?? "",
    itemType: normalizePicklistValue(raw.itemType, COMPLIANCE_ITEM_TYPES, "Obligation"),
    title: raw.title ?? "",
    requirementSource: raw.requirementSource ?? "",
    owner: raw.owner ?? "",
    audienceOrScope: raw.audienceOrScope ?? "",
    segId: raw.segId ?? "",
    locationId: raw.locationId ?? "",
    processId: raw.processId ?? "",
    equipmentId: raw.equipmentId ?? "",
    issueDate: raw.issueDate ?? "",
    dueDate: raw.dueDate ?? "",
    expirationDate: raw.expirationDate ?? "",
    reviewDate: raw.reviewDate ?? "",
    recurrence: raw.recurrence ?? "",
    status: normalizePicklistValue(raw.status, COMPLIANCE_ITEM_STATUSES, "Draft"),
    reviewStatus: normalizePicklistValue(
      raw.reviewStatus,
      COMPLIANCE_REVIEW_STATUSES,
      "Not Reviewed",
    ),
    evidenceRequired: normalizeBoolean(raw.evidenceRequired, false),
    evidenceReference: raw.evidenceReference ?? "",
    notes: raw.notes ?? "",
    createdAt: raw.createdAt ?? SEED_TIMESTAMP,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? SEED_TIMESTAMP,
  }) as ComplianceItemRecord;
}

function normalizeHazardRecord(record: object): HazardRecord {
  const raw = record as Partial<HazardRecord>;
  const locationId = raw.locationId ?? normalizeStringArray((raw as { locationIds?: unknown }).locationIds)[0] ?? "";
  const locationIds = Array.from(
    new Set([locationId, ...normalizeStringArray((raw as { locationIds?: unknown }).locationIds)].filter(Boolean)),
  );

  return ensureLifecycle({
    ...raw,
    id: raw.id ?? "",
    title: raw.title ?? "",
    category: normalizePicklistValue(raw.category, HAZARD_CATEGORIES, "Physical", {
      Psychosocial: "Ergonomic",
      Electrical: "Equipment",
      Mechanical: "Equipment",
      Fire: "Fire/Explosion",
      Other: "Equipment",
    }),
    locationId,
    locationIds,
    processIds: normalizeStringArray((raw as { processIds?: unknown }).processIds),
    chemicalIds: normalizeStringArray((raw as { chemicalIds?: unknown }).chemicalIds),
    severity:
      raw.severity === "Low" || raw.severity === "Medium" || raw.severity === "High" || raw.severity === "Critical"
        ? raw.severity
        : "Low",
    likelihood:
      raw.likelihood === "Rare" ||
      raw.likelihood === "Unlikely" ||
      raw.likelihood === "Possible" ||
      raw.likelihood === "Likely" ||
      raw.likelihood === "Almost Certain"
        ? raw.likelihood
        : "Possible",
    description: raw.description ?? "",
    controls: raw.controls ?? "",
    status:
      raw.status === "mitigated" || raw.status === "closed" ? raw.status : "active",
    createdAt: raw.createdAt ?? SEED_TIMESTAMP,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? SEED_TIMESTAMP,
  }) as HazardRecord;
}

function normalizeControlRecord(record: object): ControlRecord {
  const raw = record as Partial<ControlRecord>;

  return ensureLifecycle({
    ...raw,
    id: raw.id ?? "",
    name: raw.name ?? "",
    type: normalizePicklistValue(raw.type, CONTROL_TYPES, "Other"),
    hazardIds: normalizeStringArray((raw as { hazardIds?: unknown }).hazardIds),
    description: raw.description ?? "",
    owner: raw.owner ?? "",
    verificationMethod: raw.verificationMethod ?? "",
    verificationFrequency: raw.verificationFrequency ?? "",
    lastVerifiedAt: raw.lastVerifiedAt ?? "",
    status: normalizePicklistValue(raw.status, CONTROL_STATUSES, "needs-review"),
    notes: raw.notes ?? "",
    createdAt: raw.createdAt ?? SEED_TIMESTAMP,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? SEED_TIMESTAMP,
  }) as ControlRecord;
}

function normalizeRiskAssessmentRecord(record: object): RiskAssessmentRecord {
  const raw = record as Partial<RiskAssessmentRecord>;

  return ensureLifecycle({
    ...raw,
    id: raw.id ?? "",
    title: raw.title ?? "",
    hazardId: raw.hazardId ?? "",
    controlIds: normalizeStringArray((raw as { controlIds?: unknown }).controlIds),
    inherentSeverity: normalizePicklistValue(raw.inherentSeverity, HAZARD_SEVERITIES, "Low"),
    inherentLikelihood: normalizePicklistValue(raw.inherentLikelihood, HAZARD_LIKELIHOODS, "Possible"),
    residualSeverity: normalizePicklistValue(raw.residualSeverity, HAZARD_SEVERITIES, "Low"),
    residualLikelihood: normalizePicklistValue(raw.residualLikelihood, HAZARD_LIKELIHOODS, "Possible"),
    assessor: raw.assessor ?? "",
    reviewStatus: normalizePicklistValue(raw.reviewStatus, RISK_ASSESSMENT_STATUSES, "Draft"),
    nextReviewDate: raw.nextReviewDate ?? "",
    notes: raw.notes ?? "",
    createdAt: raw.createdAt ?? SEED_TIMESTAMP,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? SEED_TIMESTAMP,
  }) as RiskAssessmentRecord;
}

function normalizeSegRecord(record: object): SegRecord {
  const raw = record as Partial<SegRecord>;

  return ensureLifecycle({
    ...raw,
    id: raw.id ?? "",
    name: raw.name ?? "",
    type: normalizePicklistValue(raw.type, SEG_TYPES, "Similar Exposure Group"),
    description: raw.description ?? "",
    locationId: raw.locationId ?? "",
    processId: raw.processId ?? "",
    chemicalIds: normalizeStringArray((raw as { chemicalIds?: unknown }).chemicalIds),
    hazardIds: normalizeStringArray((raw as { hazardIds?: unknown }).hazardIds),
    agentType: raw.agentType ?? "",
    exposureLevel:
      raw.exposureLevel === "Low" ||
      raw.exposureLevel === "Medium" ||
      raw.exposureLevel === "High" ||
      raw.exposureLevel === "Critical"
        ? raw.exposureLevel
        : "Low",
    workerCount: raw.workerCount ?? "",
    controls: raw.controls ?? "",
    monitoringFrequency: raw.monitoringFrequency ?? "",
    status:
      raw.status === "inactive" || raw.status === "under-review" ? raw.status : "active",
    createdAt: raw.createdAt ?? SEED_TIMESTAMP,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? SEED_TIMESTAMP,
  }) as SegRecord;
}

function normalizeFindingRecord(record: object): FindingRecord {
  const raw = record as Partial<FindingRecord>;

  return ensureLifecycle({
    ...raw,
    id: raw.id ?? "",
    title: raw.title ?? "",
    type: normalizePicklistValue(raw.type, FINDING_TYPES, "Inspection Finding"),
    description: raw.description ?? "",
    locationId: raw.locationId ?? "",
    processId: raw.processId ?? "",
    hazardId: raw.hazardId ?? "",
    activityDate: raw.activityDate ?? (raw.createdAt ?? SEED_TIMESTAMP).slice(0, 10),
    equipmentId: raw.equipmentId ?? "",
    chemicalId: raw.chemicalId ?? "",
    controlId: raw.controlId ?? "",
    scope: raw.scope ?? "",
    criteriaReference: raw.criteriaReference ?? "",
    evidenceReference: raw.evidenceReference ?? "",
    followUpRequired: normalizeBoolean(raw.followUpRequired, false),
    notes: raw.notes ?? "",
    severity:
      raw.severity === "Low" || raw.severity === "Medium" || raw.severity === "High" || raw.severity === "Critical"
        ? raw.severity
        : "Low",
    status: normalizePicklistValue(raw.status, FINDING_STATUSES, "Open"),
    reportedBy: raw.reportedBy ?? "",
    createdAt: raw.createdAt ?? SEED_TIMESTAMP,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? SEED_TIMESTAMP,
  }) as FindingRecord;
}

function normalizeIncidentRecord(record: object): IncidentRecord {
  const raw = record as Partial<IncidentRecord>;

  return ensureLifecycle({
    ...raw,
    id: raw.id ?? "",
    title: raw.title ?? "",
    type: normalizePicklistValue(raw.type, INCIDENT_TYPES, "Near Miss"),
    occurredAt: raw.occurredAt ?? "",
    locationId: raw.locationId ?? "",
    processId: raw.processId ?? "",
    equipmentId: raw.equipmentId ?? "",
    chemicalId: raw.chemicalId ?? "",
    hazardIds: normalizeStringArray((raw as { hazardIds?: unknown }).hazardIds),
    controlIds: normalizeStringArray((raw as { controlIds?: unknown }).controlIds),
    description: raw.description ?? "",
    actualOutcome: raw.actualOutcome ?? "",
    potentialOutcome: raw.potentialOutcome ?? "",
    immediateActions: raw.immediateActions ?? "",
    investigationSummary: raw.investigationSummary ?? "",
    immediateCauses: raw.immediateCauses ?? "",
    contributingCauses: raw.contributingCauses ?? "",
    evidenceReference: raw.evidenceReference ?? "",
    reportingStatus: normalizePicklistValue(
      raw.reportingStatus,
      INCIDENT_REPORTING_STATUSES,
      "Not Evaluated",
    ),
    status: normalizePicklistValue(raw.status, INCIDENT_STATUSES, "Open"),
    createdAt: raw.createdAt ?? SEED_TIMESTAMP,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? SEED_TIMESTAMP,
  }) as IncidentRecord;
}

function normalizeCorrectiveActionStatus(value: unknown): CorrectiveActionRecord["status"] {
  if (value === "Open") {
    return "Created";
  }

  if (typeof value === "string" && (CORRECTIVE_ACTION_STATUSES as readonly string[]).includes(value)) {
    return value as CorrectiveActionRecord["status"];
  }

  return "Created";
}

function actionHasCompletion(status: CorrectiveActionRecord["status"]) {
  return status === "Completed" || status === "Verified" || status === "Closed";
}

function actionHasVerification(status: CorrectiveActionRecord["status"]) {
  return status === "Verified" || status === "Closed";
}

function normalizeBoolean(value: unknown, fallback: boolean) {
  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }

  return fallback;
}

function emptyCampaignCollections(): Record<CampaignCollectionName, CampaignRecord[]> {
  return Object.fromEntries(
    CAMPAIGN_COLLECTION_NAMES.map((collection) => [collection, []]),
  ) as unknown as Record<CampaignCollectionName, CampaignRecord[]>;
}

function normalizeCampaignArray(value: unknown): string[] {
  return normalizeStringArray(value);
}

function defaultCampaignRecordFields(
  collection: CampaignCollectionName,
  timestamp: string,
): CampaignRecord {
  const definition = getCampaignRegisterDefinitionByCollection(collection);

  return {
    id: "",
    businessId: "",
    title: "",
    type: definition.defaultType,
    status: definition.defaultStatus,
    summary: "",
    owner: "",
    locationId: "",
    processId: "",
    personId: "",
    organizationId: "",
    taskId: "",
    segId: "",
    chemicalId: "",
    equipmentId: "",
    hazardIds: [],
    controlIds: [],
    relatedRecordIds: [],
    effectiveFrom: "",
    effectiveTo: "",
    dueDate: "",
    reviewDate: "",
    evidenceReference: "",
    notes: "",
    createdAt: timestamp,
    updatedAt: timestamp,
    archivedAt: null,
    archivedReason: null,
    lifecycleStatus: "active",
  };
}

function normalizeCampaignRecord(
  collection: CampaignCollectionName,
  record: object,
): CampaignRecord {
  const raw = record as Partial<CampaignRecord>;
  const defaults = defaultCampaignRecordFields(
    collection,
    raw.createdAt ?? SEED_TIMESTAMP,
  );
  const definition = getCampaignRegisterDefinitionByCollection(collection);
  const normalized = ensureLifecycle({
    ...defaults,
    ...raw,
    id: raw.id ?? "",
    businessId: raw.businessId ?? "",
    title: raw.title ?? "",
    type:
      typeof raw.type === "string" && definition.typeOptions.includes(raw.type)
        ? raw.type
        : definition.defaultType,
    status:
      typeof raw.status === "string" && definition.statusOptions.includes(raw.status)
        ? raw.status
        : definition.defaultStatus,
    summary: raw.summary ?? "",
    owner: raw.owner ?? "",
    locationId: raw.locationId ?? "",
    processId: raw.processId ?? "",
    personId: raw.personId ?? "",
    organizationId: raw.organizationId ?? "",
    taskId: raw.taskId ?? "",
    segId: raw.segId ?? "",
    chemicalId: raw.chemicalId ?? "",
    equipmentId: raw.equipmentId ?? "",
    hazardIds: normalizeCampaignArray(raw.hazardIds),
    controlIds: normalizeCampaignArray(raw.controlIds),
    relatedRecordIds: normalizeCampaignArray(raw.relatedRecordIds),
    effectiveFrom: raw.effectiveFrom ?? "",
    effectiveTo: raw.effectiveTo ?? "",
    dueDate: raw.dueDate ?? "",
    reviewDate: raw.reviewDate ?? "",
    evidenceReference: raw.evidenceReference ?? "",
    notes: raw.notes ?? "",
    createdAt: raw.createdAt ?? SEED_TIMESTAMP,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? SEED_TIMESTAMP,
  }) as CampaignRecord;

  for (const field of definition.fields) {
    const value = (raw as Record<string, unknown>)[field.name];

    if (field.type === "checkbox") {
      normalized[field.name] = normalizeBoolean(value, field.defaultValue === true);
    } else if (field.type === "multiselect") {
      normalized[field.name] = normalizeCampaignArray(value);
    } else if (value === undefined || value === null) {
      const defaultValue = field.defaultValue;
      normalized[field.name] = Array.isArray(defaultValue)
        ? defaultValue
        : typeof defaultValue === "boolean"
          ? defaultValue
          : defaultValue ?? "";
    } else if (Array.isArray(value)) {
      normalized[field.name] = normalizeCampaignArray(value);
    } else if (typeof value === "boolean") {
      normalized[field.name] = value;
    } else {
      normalized[field.name] = String(value);
    }
  }

  return normalized;
}

function normalizeCampaignCollections(
  source: Partial<Record<CampaignCollectionName, unknown>>,
) {
  return Object.fromEntries(
    CAMPAIGN_COLLECTION_NAMES.map((collection) => [
      collection,
      Array.isArray(source[collection])
        ? (source[collection] as object[]).map((record) =>
            normalizeCampaignRecord(collection, record),
          )
        : [],
    ]),
  ) as Record<CampaignCollectionName, CampaignRecord[]>;
}

function createSeedCampaignRecords(): Record<CampaignCollectionName, CampaignRecord[]> {
  return Object.fromEntries(
    CAMPAIGN_REGISTER_DEFINITIONS.map((definition) => [
      definition.collection,
      definition.seed
        ? [
            withActiveLifecycle({
              ...defaultCampaignRecordFields(definition.collection, SEED_TIMESTAMP),
              ...definition.seed,
              createdAt: SEED_TIMESTAMP,
              updatedAt: SEED_TIMESTAMP,
            }) as CampaignRecord,
          ]
        : [],
    ]),
  ) as Record<CampaignCollectionName, CampaignRecord[]>;
}

function generateBusinessId(
  collection: CampaignCollectionName,
  records: CampaignRecord[],
) {
  const definition = getCampaignRegisterDefinitionByCollection(collection);
  const nextNumber = records.length + 1;
  return `${definition.businessPrefix}-${String(nextNumber).padStart(4, "0")}`;
}

function valuesToCampaignRecordInput(
  collection: CampaignCollectionName,
  input: Record<string, unknown>,
  existing: CampaignRecord | null,
  timestamp: string,
  records: CampaignRecord[],
): CampaignRecord {
  const raw = input as Partial<CampaignRecord>;
  const base = existing ?? defaultCampaignRecordFields(collection, timestamp);
  const normalized = normalizeCampaignRecord(collection, {
    ...base,
    ...raw,
    businessId: raw.businessId?.trim() || base.businessId || generateBusinessId(collection, records),
    title: raw.title?.trim() ?? base.title,
    type: raw.type ?? base.type,
    status: raw.status ?? base.status,
    summary: raw.summary?.trim() ?? base.summary,
    owner: raw.owner?.trim() ?? base.owner,
    locationId: raw.locationId ?? base.locationId,
    processId: raw.processId ?? base.processId,
    personId: raw.personId ?? base.personId,
    organizationId: raw.organizationId ?? base.organizationId,
    taskId: raw.taskId ?? base.taskId,
    segId: raw.segId ?? base.segId,
    chemicalId: raw.chemicalId ?? base.chemicalId,
    equipmentId: raw.equipmentId ?? base.equipmentId,
    hazardIds: raw.hazardIds ?? base.hazardIds,
    controlIds: raw.controlIds ?? base.controlIds,
    relatedRecordIds: raw.relatedRecordIds ?? base.relatedRecordIds,
    effectiveFrom: raw.effectiveFrom ?? base.effectiveFrom,
    effectiveTo: raw.effectiveTo ?? base.effectiveTo,
    dueDate: raw.dueDate ?? base.dueDate,
    reviewDate: raw.reviewDate ?? base.reviewDate,
    evidenceReference: raw.evidenceReference?.trim() ?? base.evidenceReference,
    notes: raw.notes?.trim() ?? base.notes,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  });

  return normalized;
}

function normalizeCorrectiveActionRecord(record: object): CorrectiveActionRecord {
  const raw = record as Partial<CorrectiveActionRecord>;
  const status = normalizeCorrectiveActionStatus(raw.status);
  const sourceType = normalizePicklistValue(
    raw.sourceType,
    CORRECTIVE_ACTION_SOURCE_TYPES,
    "Finding",
  );
  const legacyFindingId = raw.findingId ?? "";
  const sourceId = raw.sourceId ?? (sourceType === "Finding" ? legacyFindingId : "");
  const findingId = sourceType === "Finding" ? sourceId || legacyFindingId : legacyFindingId;
  const fallbackTransitionAt = raw.updatedAt ?? raw.createdAt ?? SEED_TIMESTAMP;

  return ensureLifecycle({
    ...raw,
    id: raw.id ?? "",
    title: raw.title ?? "",
    type: normalizePicklistValue(raw.type, CORRECTIVE_ACTION_TYPES, "Other"),
    description: raw.description ?? "",
    findingId,
    sourceType,
    sourceId,
    sourceJustification: raw.sourceJustification ?? "",
    assignedTo: raw.assignedTo ?? "",
    priority:
      raw.priority === "Low" || raw.priority === "Medium" || raw.priority === "High" || raw.priority === "Critical"
        ? raw.priority
        : "Medium",
    status,
    dueDate: raw.dueDate ?? "",
    completionSummary: raw.completionSummary ?? "",
    completedAt: raw.completedAt ?? (actionHasCompletion(status) ? fallbackTransitionAt : null),
    verificationRequired: normalizeBoolean(raw.verificationRequired, true),
    verificationMethod: raw.verificationMethod ?? "",
    verificationResult: raw.verificationResult ?? "",
    evidenceReference: raw.evidenceReference ?? "",
    verifiedAt: raw.verifiedAt ?? (actionHasVerification(status) ? fallbackTransitionAt : null),
    closedAt: raw.closedAt ?? (status === "Closed" ? fallbackTransitionAt : null),
    closureNotes: raw.closureNotes ?? "",
    createdAt: raw.createdAt ?? SEED_TIMESTAMP,
    updatedAt: raw.updatedAt ?? raw.createdAt ?? SEED_TIMESTAMP,
  }) as CorrectiveActionRecord;
}

function getRegisterCollection(database: PersistedDatabase, collection: RegisterCollectionName) {
  if (isCampaignCollectionName(collection)) {
    return database[collection];
  }

  return database[collection] as PersistedRegisterRecord[];
}

function getRegisterStore(collection: RegisterCollectionName) {
  if (isCampaignCollectionName(collection)) {
    return campaignRecordStores[collection];
  }

  switch (collection) {
    case "locations":
      return locationRecords;
    case "findings":
      return findingRecords;
    case "incidents":
      return incidentRecords;
    case "processes":
      return processRecords;
    case "equipment":
      return equipmentRecords;
    case "exposureMonitoring":
      return exposureMonitoringRecords;
    case "chemicals":
      return chemicalRecords;
    case "complianceItems":
      return complianceItemRecords;
    case "hazards":
      return hazardRecords;
    case "controls":
      return controlRecords;
    case "riskAssessments":
      return riskAssessmentRecords;
    case "segs":
      return segRecords;
    case "correctiveActions":
      return correctiveActionRecords;
  }
}

export function getPersistenceStatusLabel(status: PersistenceStatus): string {
  switch (status) {
    case "not_configured":
      return "Persistence not configured";
    case "loading":
      return "Persistence loading";
    case "ready":
      return "Persistence ready";
    case "error":
      return "Persistence error";
  }
}

export function createSeedLocations(): LocationRecord[] {
  const records: SeedRecord<LocationRecord>[] = [
    {
      id: "loc-demo-main-facility",
      name: "Main Facility",
      type: "Facility",
      parentLocationId: "",
      country: "United States",
      stateProvince: "Michigan",
      description: "Primary operating location seeded for the MVP Locations workflow.",
      status: "active",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: "loc-demo-chemical-storage",
      name: "Chemical Storage Room",
      type: "Storage",
      parentLocationId: "loc-demo-main-facility",
      country: "United States",
      stateProvince: "Michigan",
      description: "Controlled storage area seeded so persistence can be verified immediately.",
      status: "active",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: "loc-demo-workshop",
      name: "Workshop",
      type: "Production Area",
      parentLocationId: "loc-demo-main-facility",
      country: "United States",
      stateProvince: "Michigan",
      description: "Maintenance and fabrication workshop area.",
      status: "active",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: "loc-demo-secondary-site",
      name: "Secondary Site",
      type: "Facility",
      parentLocationId: "",
      country: "United States",
      stateProvince: "Ohio",
      description: "Secondary plant seeded to demonstrate multi-plant filtering.",
      status: "active",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: "loc-demo-secondary-warehouse",
      name: "Secondary Warehouse",
      type: "Storage",
      parentLocationId: "loc-demo-secondary-site",
      country: "United States",
      stateProvince: "Ohio",
      description: "Storage area under the secondary plant.",
      status: "active",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  ];

  return records.map((record) => withActiveLifecycle(record));
}

export function createSeedFindings(locations: LocationRecord[]): FindingRecord[] {
  const primaryLocationId = locations[0]?.id ?? "loc-demo-main-facility";
  const secondaryLocationId = locations[1]?.id ?? primaryLocationId;

  const records: SeedRecord<FindingRecord>[] = [
    {
      id: "finding-demo-egress",
      title: "Blocked emergency egress path",
      type: "Inspection Finding",
      description: "Materials were staged in front of a marked egress path during field review.",
      locationId: primaryLocationId,
      processId: "process-demo-chemical-receipt",
      hazardId: "hazard-demo-slips",
      activityDate: "2026-07-08",
      equipmentId: "",
      chemicalId: "",
      controlId: "control-demo-slip-matting",
      scope: "Emergency egress route walkthrough",
      criteriaReference: "Internal emergency egress inspection criteria",
      evidenceReference: "Field photo set FW-2026-11",
      followUpRequired: true,
      notes: "",
      severity: "High",
      status: "Requires Action",
      reportedBy: "Demo HSE Lead",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: "finding-demo-labeling",
      title: "Secondary container label needs update",
      type: "Observation",
      description: "A secondary chemical container label was partially unreadable.",
      locationId: secondaryLocationId,
      processId: "",
      hazardId: "",
      activityDate: "2026-07-08",
      equipmentId: "equipment-demo-flammable-cabinet",
      chemicalId: "chem-demo-acetone",
      controlId: "",
      scope: "",
      criteriaReference: "",
      evidenceReference: "Walkthrough note FW-2026-12",
      followUpRequired: true,
      notes: "",
      severity: "Medium",
      status: "In Progress",
      reportedBy: "Demo Observer",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  ];

  return records.map((record) => withActiveLifecycle(record));
}

export function createSeedProcesses(locations: LocationRecord[]): ProcessRecord[] {
  const primaryLocationId = locations[0]?.id ?? "loc-demo-main-facility";
  const workshopId = locations[2]?.id ?? primaryLocationId;

  const records: SeedRecord<ProcessRecord>[] = [
    {
      id: "process-demo-chemical-receipt",
      name: "Chemical Receipt and Inspection",
      locationId: primaryLocationId,
      category: "Transfer",
      description: "Procedure for receiving, inspecting, and logging incoming chemical deliveries.",
      status: "active",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: "process-demo-equipment-maint",
      name: "Preventive Equipment Maintenance",
      locationId: workshopId,
      category: "Maintenance",
      description: "Scheduled maintenance checks and records for all production equipment.",
      status: "active",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  ];

  return records.map((record) => withActiveLifecycle(record));
}

export function createSeedEquipment(
  locations: LocationRecord[],
  processes: ProcessRecord[],
): EquipmentRecord[] {
  const storageId = locations[1]?.id ?? locations[0]?.id ?? "loc-demo-chemical-storage";
  const workshopId = locations[2]?.id ?? locations[0]?.id ?? "loc-demo-workshop";
  const maintenanceProcessId = processes.find((process) => process.id === "process-demo-equipment-maint")?.id ?? "";

  const records: SeedRecord<EquipmentRecord>[] = [
    {
      id: "equipment-demo-dust-collector",
      name: "Workshop Dust Collector",
      type: "Dust Collector",
      locationId: workshopId,
      processId: maintenanceProcessId,
      description: "Local exhaust equipment used during grinding and fabrication tasks.",
      status: "active",
      notes: "Track as HSE-relevant ventilation equipment, not a maintenance asset ledger.",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: "equipment-demo-flammable-cabinet",
      name: "Flammable Storage Cabinet",
      type: "Emergency Equipment",
      locationId: storageId,
      processId: "",
      description: "Approved cabinet used for storing flammable chemicals before transfer to use areas.",
      status: "active",
      notes: "Relevant to chemical storage controls and inspection findings.",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  ];

  return records.map((record) => withActiveLifecycle(record));
}

export function createSeedChemicals(locations: LocationRecord[]): ChemicalRecord[] {
  const storageId = locations[1]?.id ?? locations[0]?.id ?? "loc-demo-chemical-storage";

  const records: SeedRecord<ChemicalRecord>[] = [
    {
      id: "chem-demo-acetone",
      name: "Acetone",
      casNumber: "67-64-1",
      hazardClass: "Flammable",
      processIds: ["process-demo-chemical-receipt"],
      storageLocationId: storageId,
      sdsStatus: "Current",
      sdsReference: "SDS-ACETONE-2026",
      sdsRevisionDate: "2026-01-15",
      sdsReviewDate: "2027-01-15",
      exposureLimitValue: "250",
      exposureLimitUnit: "ppm",
      exposureLimitSource: "ACGIH TLV",
      exposureLimitAveragingPeriod: "8-hour TWA",
      quantity: "50",
      unit: "L",
      supplier: "ChemSupply Ltd.",
      status: "active",
      notes: "Keep away from ignition sources. Store in approved flammable cabinet.",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: "chem-demo-sodium-hydroxide",
      name: "Sodium Hydroxide",
      casNumber: "1310-73-2",
      hazardClass: "Corrosive",
      processIds: ["process-demo-chemical-receipt"],
      storageLocationId: storageId,
      sdsStatus: "Missing",
      sdsReference: "",
      sdsRevisionDate: "",
      sdsReviewDate: "",
      exposureLimitValue: "2",
      exposureLimitUnit: "mg/m3",
      exposureLimitSource: "OSHA PEL",
      exposureLimitAveragingPeriod: "Ceiling",
      quantity: "25",
      unit: "kg",
      supplier: "Industrial Chem Co.",
      status: "active",
      notes: "Use full PPE: gloves, face shield, and chemical-resistant apron.",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  ];

  return records.map((record) => withActiveLifecycle(record));
}

export function createSeedHazards(locations: LocationRecord[]): HazardRecord[] {
  const primaryLocationId = locations[0]?.id ?? "loc-demo-main-facility";
  const workshopId = locations[2]?.id ?? primaryLocationId;

  const records: SeedRecord<HazardRecord>[] = [
    {
      id: "hazard-demo-slips",
      title: "Slip hazard near chemical storage entry",
      category: "Physical",
      locationId: primaryLocationId,
      locationIds: [primaryLocationId],
      processIds: ["process-demo-chemical-receipt"],
      chemicalIds: ["chem-demo-acetone", "chem-demo-sodium-hydroxide"],
      severity: "Medium",
      likelihood: "Possible",
      description:
        "Wet floors near the storage room entrance create slip risk for personnel accessing chemicals.",
      controls: "Non-slip matting installed. Spill kit accessible. Signage posted.",
      status: "active",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: "hazard-demo-noise",
      title: "Elevated noise levels in workshop",
      category: "Physical",
      locationId: workshopId,
      locationIds: [workshopId],
      processIds: ["process-demo-equipment-maint"],
      chemicalIds: [],
      severity: "High",
      likelihood: "Likely",
      description: "Grinding and fabrication activities produce noise levels above 85dB.",
      controls: "Mandatory hearing protection. Signage at entry points. Noise monitoring scheduled.",
      status: "mitigated",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  ];

  return records.map((record) => withActiveLifecycle(record));
}

export function createSeedControls(hazards: HazardRecord[]): ControlRecord[] {
  const slipHazardId = hazards.find((hazard) => hazard.id === "hazard-demo-slips")?.id ?? hazards[0]?.id ?? "";
  const noiseHazardId = hazards.find((hazard) => hazard.id === "hazard-demo-noise")?.id ?? slipHazardId;

  const records: SeedRecord<ControlRecord>[] = [
    {
      id: "control-demo-slip-matting",
      name: "Non-slip matting and spill signage",
      type: "Engineering",
      hazardIds: [slipHazardId].filter(Boolean),
      description: "Floor matting, spill kit access, and posted signage for the chemical storage entry.",
      owner: "Facilities Lead",
      verificationMethod: "Monthly field inspection",
      verificationFrequency: "Monthly",
      lastVerifiedAt: "",
      status: "needs-review",
      notes: "Verify mat condition and signage placement during walkthroughs.",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: "control-demo-hearing-protection",
      name: "Workshop hearing protection zone",
      type: "PPE",
      hazardIds: [noiseHazardId].filter(Boolean),
      description: "Mandatory hearing protection and entry signage for high-noise workshop tasks.",
      owner: "HSE Officer",
      verificationMethod: "Field observation",
      verificationFrequency: "Quarterly",
      lastVerifiedAt: "",
      status: "active",
      notes: "Pair with noise monitoring review.",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  ];

  return records.map((record) => withActiveLifecycle(record));
}

export function createSeedRiskAssessments(
  hazards: HazardRecord[],
  controls: ControlRecord[],
): RiskAssessmentRecord[] {
  const slipHazardId = hazards.find((hazard) => hazard.id === "hazard-demo-slips")?.id ?? hazards[0]?.id ?? "";
  const slipControlId = controls.find((control) => control.id === "control-demo-slip-matting")?.id ?? "";

  const records: SeedRecord<RiskAssessmentRecord>[] = [
    {
      id: "risk-demo-slip-storage-entry",
      title: "Chemical storage entry slip risk",
      hazardId: slipHazardId,
      controlIds: [slipControlId].filter(Boolean),
      inherentSeverity: "Medium",
      inherentLikelihood: "Likely",
      residualSeverity: "Medium",
      residualLikelihood: "Possible",
      assessor: "Demo HSE Lead",
      reviewStatus: "Needs Review",
      nextReviewDate: "2026-10-01",
      notes: "Review after confirming matting condition and housekeeping controls.",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  ];

  return records.map((record) => withActiveLifecycle(record));
}

export function createSeedSegs(locations: LocationRecord[]): SegRecord[] {
  const primaryLocationId = locations[0]?.id ?? "loc-demo-main-facility";
  const workshopId = locations[2]?.id ?? primaryLocationId;

  const records: SeedRecord<SegRecord>[] = [
    {
      id: "seg-demo-chemical-handlers",
      name: "Chemical Handlers",
      type: "Similar Exposure Group",
      description: "Personnel who regularly handle, transfer, or work in proximity to stored chemicals.",
      locationId: primaryLocationId,
      processId: "process-demo-chemical-receipt",
      chemicalIds: ["chem-demo-acetone", "chem-demo-sodium-hydroxide"],
      hazardIds: ["hazard-demo-slips"],
      agentType: "Chemical",
      exposureLevel: "Medium",
      workerCount: "8",
      controls: "PPE provision, ventilation, training, SDS access.",
      monitoringFrequency: "Monthly",
      status: "active",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: "seg-demo-welders",
      name: "Welders and Fabricators",
      type: "Task-Based Group",
      description: "Workshop personnel performing welding, cutting, and grinding tasks.",
      locationId: workshopId,
      processId: "process-demo-equipment-maint",
      chemicalIds: [],
      hazardIds: ["hazard-demo-noise"],
      agentType: "Chemical / Physical",
      exposureLevel: "High",
      workerCount: "5",
      controls: "Welding screens, respiratory protection, LEV system, hearing protection.",
      monitoringFrequency: "Quarterly",
      status: "active",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  ];

  return records.map((record) => withActiveLifecycle(record));
}

export function createSeedExposureMonitoring(): ExposureMonitoringRecord[] {
  const records: SeedRecord<ExposureMonitoringRecord>[] = [
    {
      id: "exposure-demo-acetone-twa",
      sampleReference: "IH-2026-001",
      contextType: "SEG",
      segId: "seg-demo-chemical-handlers",
      contextDetail: "Chemical transfer task",
      contaminant: "Acetone vapor",
      chemicalId: "chem-demo-acetone",
      hazardId: "hazard-demo-slips",
      locationId: "loc-demo-main-facility",
      processId: "process-demo-chemical-receipt",
      samplingDate: "2026-07-08",
      sampleType: "Personal",
      result: "120",
      unit: "ppm",
      exposureLimit: "250",
      exposureLimitReference: "ACGIH TLV, 8-hour TWA",
      status: "Below Limit",
      evidenceReference: "IH worksheet IH-2026-001",
      notes: "Basic demonstration sample; advanced industrial hygiene calculations are deferred.",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  ];

  return records.map((record) => withActiveLifecycle(record));
}

export function createSeedIncidents(): IncidentRecord[] {
  const records: SeedRecord<IncidentRecord>[] = [
    {
      id: "incident-demo-grinding-near-miss",
      title: "Grinding spark near combustible packaging",
      type: "Near Miss",
      occurredAt: "2026-07-08T14:15",
      locationId: "loc-demo-workshop",
      processId: "process-demo-equipment-maint",
      equipmentId: "equipment-demo-dust-collector",
      chemicalId: "",
      hazardIds: ["hazard-demo-noise"],
      controlIds: ["control-demo-hearing-protection"],
      description: "Sparks from a grinding task reached packaging staged outside the work zone.",
      actualOutcome: "No injury, damage, or ignition occurred.",
      potentialOutcome: "Potential fire and employee exposure.",
      immediateActions: "Stopped work and cleared the staging area.",
      investigationSummary: "Review work-zone housekeeping and hot-work boundaries.",
      immediateCauses: "Packaging was staged inside the grinding exclusion zone.",
      contributingCauses: "Pre-task area check did not include temporary stored materials.",
      evidenceReference: "Field note NM-2026-004",
      reportingStatus: "Not Evaluated",
      status: "Under Investigation",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  ];

  return records.map((record) => withActiveLifecycle(record));
}

export function createSeedComplianceItems(): ComplianceItemRecord[] {
  const records: SeedRecord<ComplianceItemRecord>[] = [
    {
      id: "compliance-demo-air-permit-review",
      itemType: "Permit",
      title: "Air permit annual review",
      requirementSource: "Facility air permit AP-2025-14",
      owner: "Environmental Coordinator",
      audienceOrScope: "Workshop ventilation and chemical handling operations",
      segId: "",
      locationId: "loc-demo-main-facility",
      processId: "process-demo-chemical-receipt",
      equipmentId: "",
      issueDate: "2025-09-01",
      dueDate: "2026-08-15",
      expirationDate: "2026-09-01",
      reviewDate: "2026-08-15",
      recurrence: "Annual",
      status: "Due Soon",
      reviewStatus: "Needs Review",
      evidenceRequired: true,
      evidenceReference: "Permit file AP-2025-14",
      notes: "Tracking supports readiness and does not determine legal compliance.",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: "compliance-demo-chemical-training",
      itemType: "Training",
      title: "Annual chemical handling refresher",
      requirementSource: "Internal chemical safety program",
      owner: "HSE Officer",
      audienceOrScope: "Chemical Handlers SEG",
      segId: "seg-demo-chemical-handlers",
      locationId: "loc-demo-main-facility",
      processId: "process-demo-chemical-receipt",
      equipmentId: "",
      issueDate: "",
      dueDate: "2026-10-01",
      expirationDate: "",
      reviewDate: "2026-09-01",
      recurrence: "Annual",
      status: "Upcoming",
      reviewStatus: "Not Reviewed",
      evidenceRequired: true,
      evidenceReference: "",
      notes: "Status register only; learning management is out of scope.",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  ];

  return records.map((record) => withActiveLifecycle(record));
}

export function createSeedCorrectiveActions(findings: FindingRecord[]): CorrectiveActionRecord[] {
  const primaryFindingId = findings[0]?.id ?? "finding-demo-egress";
  const secondaryFindingId = findings[1]?.id ?? primaryFindingId;

  const records: SeedRecord<CorrectiveActionRecord>[] = [
    {
      id: "ca-demo-clear-egress",
      title: "Clear and re-mark emergency egress path",
      type: "Housekeeping",
      description: "Remove all materials staged in front of the egress route and repaint floor markings.",
      findingId: primaryFindingId,
      sourceType: "Finding",
      sourceId: primaryFindingId,
      sourceJustification: "",
      assignedTo: "Site Supervisor",
      priority: "High",
      status: "In Progress",
      dueDate: "2026-07-31",
      completionSummary: "",
      completedAt: null,
      verificationRequired: true,
      verificationMethod: "Field verification",
      verificationResult: "",
      evidenceReference: "",
      verifiedAt: null,
      closedAt: null,
      closureNotes: "",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
    {
      id: "ca-demo-relabel",
      title: "Relabel secondary chemical container",
      type: "Administrative Control",
      description: "Print and apply a new GHS-compliant label to the identified container.",
      findingId: secondaryFindingId,
      sourceType: "Finding",
      sourceId: secondaryFindingId,
      sourceJustification: "",
      assignedTo: "HSE Officer",
      priority: "Medium",
      status: "Created",
      dueDate: "2026-07-20",
      completionSummary: "",
      completedAt: null,
      verificationRequired: true,
      verificationMethod: "Label review",
      verificationResult: "",
      evidenceReference: "",
      verifiedAt: null,
      closedAt: null,
      closureNotes: "",
      createdAt: SEED_TIMESTAMP,
      updatedAt: SEED_TIMESTAMP,
    },
  ];

  return records.map((record) => withActiveLifecycle(record));
}

export function createLocalPersistenceRepository(options: RepositoryOptions = {}) {
  const storageKey = options.storageKey ?? DEFAULT_STORAGE_KEY;
  const now = options.now ?? defaultNow;
  const createId = options.createId ?? defaultCreateId;
  let storage = options.storage;

  function getDataPath() {
    return storageKey ? `localStorage://${storageKey}` : null;
  }

  function setDiagnostics(next: PersistenceDiagnostics) {
    persistenceDiagnostics.set(next);
  }

  function setLoadingStatus() {
    setDiagnostics({
      status: "loading",
      dataPath: getDataPath(),
      initializedAt: null,
      lastInitializationStatus: "Initializing local persistence.",
      lastMigrationStatus: "Migration pending.",
      lastError: null,
    });
  }

  function setErrorStatus(error: unknown, previous?: Partial<PersistenceDiagnostics>) {
    const lastError = serializeError(error);
    setDiagnostics({
      status: "error",
      dataPath: getDataPath(),
      initializedAt: previous?.initializedAt ?? null,
      lastInitializationStatus: "Persistence operation failed.",
      lastMigrationStatus: previous?.lastMigrationStatus ?? "Migration did not complete.",
      lastError,
    });
  }

  function requireStorage() {
    if (!storageKey.trim()) {
      throw new Error("Persistence data path is missing.");
    }

    storage ??= getBrowserStorage() ?? undefined;

    if (!storage) {
      throw new Error("Local storage is not available in this runtime.");
    }

    return storage;
  }

  function parseDatabase(raw: string): PersistedDatabase {
    const parsed = JSON.parse(raw) as Partial<
      | PersistedDatabase
      | PersistedDatabaseV5
      | PersistedDatabaseV4
      | PersistedDatabaseV3
      | PersistedDatabaseV2
      | PersistedDatabaseV1
    >;

    if (
      parsed.schemaVersion !== 1 &&
      parsed.schemaVersion !== 2 &&
      parsed.schemaVersion !== 3 &&
      parsed.schemaVersion !== 4 &&
      parsed.schemaVersion !== 5 &&
      parsed.schemaVersion !== 6 &&
      parsed.schemaVersion !== 7 &&
      parsed.schemaVersion !== 8 &&
      parsed.schemaVersion !== 9 &&
      parsed.schemaVersion !== 10 &&
      parsed.schemaVersion !== 11 &&
      parsed.schemaVersion !== 12 &&
      parsed.schemaVersion !== 13 &&
      parsed.schemaVersion !== SCHEMA_VERSION
    ) {
      throw new Error(`Unsupported persistence schema version: ${String(parsed.schemaVersion)}.`);
    }

    if (!Array.isArray(parsed.locations)) {
      throw new Error("Persisted locations data is invalid.");
    }

    // Migrate V1 → current schema
    if (parsed.schemaVersion === 1) {
      return {
        schemaVersion: SCHEMA_VERSION,
        locations: parsed.locations.map((record) => normalizeLocationRecord(record)),
        findings: [],
        processes: [],
        equipment: [],
        exposureMonitoring: [],
        chemicals: [],
        complianceItems: [],
        hazards: [],
        controls: [],
        riskAssessments: [],
        segs: [],
        incidents: [],
        correctiveActions: [],
        ...emptyCampaignCollections(),
        initializedAt: parsed.initializedAt ?? now().toISOString(),
        updatedAt: now().toISOString(),
      };
    }

    // Migrate V2 → current schema
    if (parsed.schemaVersion === 2) {
      const v2 = parsed as Partial<PersistedDatabaseV2>;
      return {
        schemaVersion: SCHEMA_VERSION,
        locations: (v2.locations ?? []).map((record) => normalizeLocationRecord(record)),
        findings: (v2.findings ?? []).map((record) => normalizeFindingRecord(record)),
        processes: [],
        equipment: [],
        exposureMonitoring: [],
        chemicals: [],
        complianceItems: [],
        hazards: [],
        controls: [],
        riskAssessments: [],
        segs: [],
        incidents: [],
        correctiveActions: [],
        ...emptyCampaignCollections(),
        initializedAt: v2.initializedAt ?? now().toISOString(),
        updatedAt: now().toISOString(),
      };
    }

    const parsedV3 = parsed as Partial<PersistedDatabase>;

    return {
      schemaVersion: SCHEMA_VERSION,
      locations: (parsedV3.locations ?? []).map((record) => normalizeLocationRecord(record)),
      findings: (parsedV3.findings ?? []).map((record) => normalizeFindingRecord(record)),
      processes: (parsedV3.processes ?? []).map((record) => normalizeProcessRecord(record)),
      equipment: (parsedV3.equipment ?? []).map((record) => normalizeEquipmentRecord(record)),
      exposureMonitoring: (parsedV3.exposureMonitoring ?? []).map((record) =>
        normalizeExposureMonitoringRecord(record),
      ),
      chemicals: (parsedV3.chemicals ?? []).map((record) => normalizeChemicalRecord(record)),
      complianceItems: (parsedV3.complianceItems ?? []).map((record) =>
        normalizeComplianceItemRecord(record),
      ),
      hazards: (parsedV3.hazards ?? []).map((record) => normalizeHazardRecord(record)),
      controls: (parsedV3.controls ?? []).map((record) => normalizeControlRecord(record)),
      riskAssessments: (parsedV3.riskAssessments ?? []).map((record) =>
        normalizeRiskAssessmentRecord(record),
      ),
      segs: (parsedV3.segs ?? []).map((record) => normalizeSegRecord(record)),
      incidents: (parsedV3.incidents ?? []).map((record) => normalizeIncidentRecord(record)),
      correctiveActions: (parsedV3.correctiveActions ?? []).map((record) =>
        normalizeCorrectiveActionRecord(record),
      ),
      ...normalizeCampaignCollections(parsedV3 as Partial<Record<CampaignCollectionName, unknown>>),
      initializedAt: parsedV3.initializedAt ?? now().toISOString(),
      updatedAt: parsedV3.updatedAt ?? now().toISOString(),
    };
  }

  function readStoredDatabase() {
    const activeStorage = requireStorage();
    const raw = activeStorage.getItem(storageKey);

    if (!raw) {
      return null;
    }

    const source = JSON.parse(raw) as Partial<Record<RegisterCollectionName, unknown>> & {
      schemaVersion?: number;
    };

    return {
      database: parseDatabase(raw),
      sourceSchemaVersion: source.schemaVersion,
      missingCollections: new Set(
        REGISTER_COLLECTION_NAMES.filter((collection) => !Array.isArray(source[collection])),
      ),
    };
  }

  function readDatabase(): PersistedDatabase | null {
    return readStoredDatabase()?.database ?? null;
  }

  function writeDatabase(database: PersistedDatabase) {
    const activeStorage = requireStorage();
    activeStorage.setItem(storageKey, JSON.stringify(database));
  }

  function createInitialDatabase(timestamp: string): PersistedDatabase {
    const locations = createSeedLocations();
    const findings = createSeedFindings(locations);
    const processes = createSeedProcesses(locations);
    const equipment = createSeedEquipment(locations, processes);
    const chemicals = createSeedChemicals(locations);
    const hazards = createSeedHazards(locations);
    const controls = createSeedControls(hazards);
    const segs = createSeedSegs(locations);

    return {
      schemaVersion: SCHEMA_VERSION,
      locations,
      findings,
      processes,
      equipment,
      exposureMonitoring: createSeedExposureMonitoring(),
      chemicals,
      complianceItems: createSeedComplianceItems(),
      hazards,
      controls,
      riskAssessments: createSeedRiskAssessments(hazards, controls),
      segs,
      incidents: createSeedIncidents(),
      correctiveActions: createSeedCorrectiveActions(findings),
      ...createSeedCampaignRecords(),
      initializedAt: timestamp,
      updatedAt: timestamp,
    };
  }

  function publishReady(database: PersistedDatabase, migrationStatus: string) {
    locationRecords.set(activeRecords(database.locations));
    findingRecords.set(activeRecords(database.findings));
    processRecords.set(activeRecords(database.processes));
    equipmentRecords.set(activeRecords(database.equipment));
    exposureMonitoringRecords.set(activeRecords(database.exposureMonitoring));
    chemicalRecords.set(activeRecords(database.chemicals));
    complianceItemRecords.set(activeRecords(database.complianceItems));
    hazardRecords.set(activeRecords(database.hazards));
    controlRecords.set(activeRecords(database.controls));
    riskAssessmentRecords.set(activeRecords(database.riskAssessments));
    segRecords.set(activeRecords(database.segs));
    incidentRecords.set(activeRecords(database.incidents));
    correctiveActionRecords.set(activeRecords(database.correctiveActions));
    for (const collection of CAMPAIGN_COLLECTION_NAMES) {
      campaignRecordStores[collection].set(activeRecords(database[collection]));
    }
    setDiagnostics({
      status: "ready",
      dataPath: getDataPath(),
      initializedAt: database.initializedAt,
      lastInitializationStatus: "Local persistence initialized.",
      lastMigrationStatus: migrationStatus,
      lastError: null,
    });
  }

  async function initialize() {
    setLoadingStatus();

    try {
      const timestamp = now().toISOString();
      const storedDatabase = readStoredDatabase();

      if (!storedDatabase) {
        const seededDatabase = createInitialDatabase(timestamp);
        writeDatabase(seededDatabase);
        publishReady(seededDatabase, `Created schema v${SCHEMA_VERSION} and seeded all registers.`);
        return seededDatabase;
      }

      const { database: existingDatabase, sourceSchemaVersion, missingCollections } = storedDatabase;
      const shouldSeedEmptyCollection = (collection: RegisterCollectionName) =>
        sourceSchemaVersion !== SCHEMA_VERSION || missingCollections.has(collection);

      // Seed empty legacy or missing collections while preserving valid, intentionally empty
      // collections in a current-schema database.
      const nextLocations =
        existingDatabase.locations.length === 0 && shouldSeedEmptyCollection("locations")
          ? createSeedLocations()
          : existingDatabase.locations;
      const nextFindings =
        existingDatabase.findings.length === 0 && shouldSeedEmptyCollection("findings")
          ? createSeedFindings(nextLocations)
          : existingDatabase.findings;
      const nextProcesses =
        existingDatabase.processes.length === 0 && shouldSeedEmptyCollection("processes")
          ? createSeedProcesses(nextLocations)
          : existingDatabase.processes;
      const nextEquipment =
        existingDatabase.equipment.length === 0 && shouldSeedEmptyCollection("equipment")
          ? createSeedEquipment(nextLocations, nextProcesses)
          : existingDatabase.equipment;
      const nextExposureMonitoring =
        existingDatabase.exposureMonitoring.length === 0 &&
        shouldSeedEmptyCollection("exposureMonitoring")
          ? createSeedExposureMonitoring()
          : existingDatabase.exposureMonitoring;
      const nextChemicals =
        existingDatabase.chemicals.length === 0 && shouldSeedEmptyCollection("chemicals")
          ? createSeedChemicals(nextLocations)
          : existingDatabase.chemicals;
      const nextComplianceItems =
        existingDatabase.complianceItems.length === 0 &&
        shouldSeedEmptyCollection("complianceItems")
          ? createSeedComplianceItems()
          : existingDatabase.complianceItems;
      const nextHazards =
        existingDatabase.hazards.length === 0 && shouldSeedEmptyCollection("hazards")
          ? createSeedHazards(nextLocations)
          : existingDatabase.hazards;
      const nextControls =
        existingDatabase.controls.length === 0 && shouldSeedEmptyCollection("controls")
          ? createSeedControls(nextHazards)
          : existingDatabase.controls;
      const nextRiskAssessments =
        existingDatabase.riskAssessments.length === 0 &&
        shouldSeedEmptyCollection("riskAssessments")
          ? createSeedRiskAssessments(nextHazards, nextControls)
          : existingDatabase.riskAssessments;
      const nextSegs =
        existingDatabase.segs.length === 0 && shouldSeedEmptyCollection("segs")
          ? createSeedSegs(nextLocations)
          : existingDatabase.segs;
      const nextIncidents =
        existingDatabase.incidents.length === 0 && shouldSeedEmptyCollection("incidents")
          ? createSeedIncidents()
          : existingDatabase.incidents;
      const nextCorrectiveActions =
        existingDatabase.correctiveActions.length === 0 &&
        shouldSeedEmptyCollection("correctiveActions")
          ? createSeedCorrectiveActions(nextFindings)
          : existingDatabase.correctiveActions;
      const campaignSeeds = createSeedCampaignRecords();
      const nextCampaignCollections = Object.fromEntries(
        CAMPAIGN_COLLECTION_NAMES.map((collection) => [
          collection,
          existingDatabase[collection].length === 0 && shouldSeedEmptyCollection(collection)
            ? campaignSeeds[collection]
            : existingDatabase[collection],
        ]),
      ) as Record<CampaignCollectionName, CampaignRecord[]>;

      const needsWrite =
        sourceSchemaVersion !== SCHEMA_VERSION || missingCollections.size > 0;

      if (needsWrite) {
        const migratedDatabase: PersistedDatabase = {
          schemaVersion: SCHEMA_VERSION,
          locations: nextLocations,
          findings: nextFindings,
          processes: nextProcesses,
          equipment: nextEquipment,
          exposureMonitoring: nextExposureMonitoring,
          chemicals: nextChemicals,
          complianceItems: nextComplianceItems,
          hazards: nextHazards,
          controls: nextControls,
          riskAssessments: nextRiskAssessments,
          segs: nextSegs,
          incidents: nextIncidents,
          correctiveActions: nextCorrectiveActions,
          ...nextCampaignCollections,
          initializedAt: existingDatabase.initializedAt,
          updatedAt: timestamp,
        };

        writeDatabase(migratedDatabase);
        publishReady(migratedDatabase, `Migrated to schema v${SCHEMA_VERSION}; seeded new registers.`);
        return migratedDatabase;
      }

      publishReady(existingDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return existingDatabase;
    } catch (error) {
      locationRecords.set([]);
      findingRecords.set([]);
      processRecords.set([]);
      equipmentRecords.set([]);
      exposureMonitoringRecords.set([]);
      chemicalRecords.set([]);
      complianceItemRecords.set([]);
      hazardRecords.set([]);
      controlRecords.set([]);
      riskAssessmentRecords.set([]);
      segRecords.set([]);
      incidentRecords.set([]);
      correctiveActionRecords.set([]);
      for (const collection of CAMPAIGN_COLLECTION_NAMES) {
        campaignRecordStores[collection].set([]);
      }
      setErrorStatus(error);
      throw error;
    }
  }

  // ── Locations ────────────────────────────────────────────────────────────

  function listLocations(): LocationRecord[] {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const records = activeRecords(database.locations);
      locationRecords.set(records);
      return records;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function createLocation(input: LocationInput): LocationRecord {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const timestamp = now().toISOString();
      const location: LocationRecord = withActiveLifecycle({
        id: createId(),
        name: input.name.trim(),
        type: input.type,
        parentLocationId: input.parentLocationId?.trim() ?? "",
        country: input.country?.trim() ?? "",
        stateProvince: input.stateProvince?.trim() ?? "",
        description: input.description.trim(),
        status: input.status,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      const nextDatabase = { ...database, locations: [...database.locations, location], updatedAt: timestamp };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return location;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function updateLocation(id: string, input: LocationInput): LocationRecord {
    if (!id.trim()) throw new Error("Location ID is required.");

    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const existing = database.locations.find((l) => l.id === id);
      if (!existing) throw new Error("Location was not found.");
      const timestamp = now().toISOString();
      const updatedLocation: LocationRecord = {
        ...existing,
        name: input.name.trim(),
        type: input.type,
        parentLocationId: input.parentLocationId?.trim() ?? "",
        country: input.country?.trim() ?? "",
        stateProvince: input.stateProvince?.trim() ?? "",
        description: input.description.trim(),
        status: input.status,
        updatedAt: timestamp,
      };
      const nextDatabase = {
        ...database,
        locations: database.locations.map((l) => (l.id === id ? updatedLocation : l)),
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return updatedLocation;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  // ── Findings ─────────────────────────────────────────────────────────────

  function listFindings(): FindingRecord[] {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const records = activeRecords(database.findings);
      findingRecords.set(records);
      return records;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function createFinding(input: FindingInput): FindingRecord {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const timestamp = now().toISOString();
      const finding: FindingRecord = withActiveLifecycle({
        id: createId(),
        title: input.title.trim(),
        type: input.type,
        description: input.description.trim(),
        locationId: input.locationId,
        processId: input.processId,
        hazardId: input.hazardId,
        activityDate: input.activityDate ?? timestamp.slice(0, 10),
        equipmentId: input.equipmentId ?? "",
        chemicalId: input.chemicalId ?? "",
        controlId: input.controlId ?? "",
        scope: input.scope?.trim() ?? "",
        criteriaReference: input.criteriaReference?.trim() ?? "",
        evidenceReference: input.evidenceReference?.trim() ?? "",
        followUpRequired: input.followUpRequired ?? false,
        notes: input.notes?.trim() ?? "",
        severity: input.severity,
        status: input.status,
        reportedBy: input.reportedBy.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      const nextDatabase = { ...database, findings: [...database.findings, finding], updatedAt: timestamp };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return finding;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function updateFinding(id: string, input: FindingInput): FindingRecord {
    if (!id.trim()) throw new Error("Finding ID is required.");

    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const existing = database.findings.find((f) => f.id === id);
      if (!existing) throw new Error("Finding was not found.");
      const timestamp = now().toISOString();
      const updatedFinding: FindingRecord = {
        ...existing,
        title: input.title.trim(),
        type: input.type,
        description: input.description.trim(),
        locationId: input.locationId,
        processId: input.processId,
        hazardId: input.hazardId,
        activityDate: input.activityDate ?? existing.activityDate ?? timestamp.slice(0, 10),
        equipmentId: input.equipmentId ?? "",
        chemicalId: input.chemicalId ?? "",
        controlId: input.controlId ?? "",
        scope: input.scope?.trim() ?? "",
        criteriaReference: input.criteriaReference?.trim() ?? "",
        evidenceReference: input.evidenceReference?.trim() ?? "",
        followUpRequired: input.followUpRequired ?? false,
        notes: input.notes?.trim() ?? "",
        severity: input.severity,
        status: input.status,
        reportedBy: input.reportedBy.trim(),
        updatedAt: timestamp,
      };
      const nextDatabase = {
        ...database,
        findings: database.findings.map((f) => (f.id === id ? updatedFinding : f)),
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return updatedFinding;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  // ── Incidents and Near Misses ────────────────────────────────────────────

  function listIncidents(): IncidentRecord[] {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const records = activeRecords(database.incidents);
      incidentRecords.set(records);
      return records;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function createIncident(input: IncidentInput): IncidentRecord {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const timestamp = now().toISOString();
      const incident: IncidentRecord = withActiveLifecycle({
        id: createId(),
        title: input.title.trim(),
        type: input.type,
        occurredAt: input.occurredAt,
        locationId: input.locationId,
        processId: input.processId,
        equipmentId: input.equipmentId,
        chemicalId: input.chemicalId,
        hazardIds: input.hazardIds,
        controlIds: input.controlIds,
        description: input.description.trim(),
        actualOutcome: input.actualOutcome.trim(),
        potentialOutcome: input.potentialOutcome.trim(),
        immediateActions: input.immediateActions.trim(),
        investigationSummary: input.investigationSummary.trim(),
        immediateCauses: input.immediateCauses.trim(),
        contributingCauses: input.contributingCauses.trim(),
        evidenceReference: input.evidenceReference.trim(),
        reportingStatus: input.reportingStatus,
        status: input.status,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      const nextDatabase = {
        ...database,
        incidents: [...database.incidents, incident],
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return incident;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function updateIncident(id: string, input: IncidentInput): IncidentRecord {
    if (!id.trim()) throw new Error("Incident ID is required.");

    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const existing = database.incidents.find((record) => record.id === id);
      if (!existing) throw new Error("Incident was not found.");
      const timestamp = now().toISOString();
      const updatedIncident: IncidentRecord = {
        ...existing,
        title: input.title.trim(),
        type: input.type,
        occurredAt: input.occurredAt,
        locationId: input.locationId,
        processId: input.processId,
        equipmentId: input.equipmentId,
        chemicalId: input.chemicalId,
        hazardIds: input.hazardIds,
        controlIds: input.controlIds,
        description: input.description.trim(),
        actualOutcome: input.actualOutcome.trim(),
        potentialOutcome: input.potentialOutcome.trim(),
        immediateActions: input.immediateActions.trim(),
        investigationSummary: input.investigationSummary.trim(),
        immediateCauses: input.immediateCauses.trim(),
        contributingCauses: input.contributingCauses.trim(),
        evidenceReference: input.evidenceReference.trim(),
        reportingStatus: input.reportingStatus,
        status: input.status,
        updatedAt: timestamp,
      };
      const nextDatabase = {
        ...database,
        incidents: database.incidents.map((record) =>
          record.id === id ? updatedIncident : record,
        ),
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return updatedIncident;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  // ── Processes ─────────────────────────────────────────────────────────────

  function listProcesses(): ProcessRecord[] {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const records = activeRecords(database.processes);
      processRecords.set(records);
      return records;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function createProcess(input: ProcessInput): ProcessRecord {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const timestamp = now().toISOString();
      const process: ProcessRecord = withActiveLifecycle({
        id: createId(),
        name: input.name.trim(),
        locationId: input.locationId,
        category: input.category,
        description: input.description.trim(),
        status: input.status,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      const nextDatabase = { ...database, processes: [...database.processes, process], updatedAt: timestamp };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return process;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function updateProcess(id: string, input: ProcessInput): ProcessRecord {
    if (!id.trim()) throw new Error("Process ID is required.");

    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const existing = database.processes.find((p) => p.id === id);
      if (!existing) throw new Error("Process was not found.");
      const timestamp = now().toISOString();
      const updatedProcess: ProcessRecord = {
        ...existing,
        name: input.name.trim(),
        locationId: input.locationId,
        category: input.category,
        description: input.description.trim(),
        status: input.status,
        updatedAt: timestamp,
      };
      const nextDatabase = {
        ...database,
        processes: database.processes.map((p) => (p.id === id ? updatedProcess : p)),
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return updatedProcess;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  // ── Equipment ─────────────────────────────────────────────────────────────

  function listEquipment(): EquipmentRecord[] {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const records = activeRecords(database.equipment);
      equipmentRecords.set(records);
      return records;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function createEquipment(input: EquipmentInput): EquipmentRecord {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const timestamp = now().toISOString();
      const equipment: EquipmentRecord = withActiveLifecycle({
        id: createId(),
        name: input.name.trim(),
        type: input.type,
        locationId: input.locationId,
        processId: input.processId,
        description: input.description.trim(),
        status: input.status,
        notes: input.notes.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      const nextDatabase = { ...database, equipment: [...database.equipment, equipment], updatedAt: timestamp };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return equipment;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function updateEquipment(id: string, input: EquipmentInput): EquipmentRecord {
    if (!id.trim()) throw new Error("Equipment ID is required.");

    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const existing = database.equipment.find((record) => record.id === id);
      if (!existing) throw new Error("Equipment was not found.");
      const timestamp = now().toISOString();
      const updatedEquipment: EquipmentRecord = {
        ...existing,
        name: input.name.trim(),
        type: input.type,
        locationId: input.locationId,
        processId: input.processId,
        description: input.description.trim(),
        status: input.status,
        notes: input.notes.trim(),
        updatedAt: timestamp,
      };
      const nextDatabase = {
        ...database,
        equipment: database.equipment.map((record) => (record.id === id ? updatedEquipment : record)),
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return updatedEquipment;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  // ── Exposure Monitoring ──────────────────────────────────────────────────

  function listExposureMonitoring(): ExposureMonitoringRecord[] {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const records = activeRecords(database.exposureMonitoring);
      exposureMonitoringRecords.set(records);
      return records;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function createExposureMonitoring(
    input: ExposureMonitoringInput,
  ): ExposureMonitoringRecord {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const timestamp = now().toISOString();
      const record: ExposureMonitoringRecord = withActiveLifecycle({
        id: createId(),
        sampleReference: input.sampleReference.trim(),
        contextType: input.contextType,
        segId: input.segId,
        contextDetail: input.contextDetail.trim(),
        contaminant: input.contaminant.trim(),
        chemicalId: input.chemicalId,
        hazardId: input.hazardId,
        locationId: input.locationId,
        processId: input.processId,
        samplingDate: input.samplingDate,
        sampleType: input.sampleType,
        result: input.result.trim(),
        unit: input.unit.trim(),
        exposureLimit: input.exposureLimit.trim(),
        exposureLimitReference: input.exposureLimitReference.trim(),
        status: input.status,
        evidenceReference: input.evidenceReference.trim(),
        notes: input.notes.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      const nextDatabase = {
        ...database,
        exposureMonitoring: [...database.exposureMonitoring, record],
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return record;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function updateExposureMonitoring(
    id: string,
    input: ExposureMonitoringInput,
  ): ExposureMonitoringRecord {
    if (!id.trim()) throw new Error("Exposure monitoring record ID is required.");

    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const existing = database.exposureMonitoring.find((record) => record.id === id);
      if (!existing) throw new Error("Exposure monitoring record was not found.");
      const timestamp = now().toISOString();
      const updatedRecord: ExposureMonitoringRecord = {
        ...existing,
        sampleReference: input.sampleReference.trim(),
        contextType: input.contextType,
        segId: input.segId,
        contextDetail: input.contextDetail.trim(),
        contaminant: input.contaminant.trim(),
        chemicalId: input.chemicalId,
        hazardId: input.hazardId,
        locationId: input.locationId,
        processId: input.processId,
        samplingDate: input.samplingDate,
        sampleType: input.sampleType,
        result: input.result.trim(),
        unit: input.unit.trim(),
        exposureLimit: input.exposureLimit.trim(),
        exposureLimitReference: input.exposureLimitReference.trim(),
        status: input.status,
        evidenceReference: input.evidenceReference.trim(),
        notes: input.notes.trim(),
        updatedAt: timestamp,
      };
      const nextDatabase = {
        ...database,
        exposureMonitoring: database.exposureMonitoring.map((record) =>
          record.id === id ? updatedRecord : record,
        ),
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return updatedRecord;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  // ── Chemicals ─────────────────────────────────────────────────────────────

  function listChemicals(): ChemicalRecord[] {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const records = activeRecords(database.chemicals);
      chemicalRecords.set(records);
      return records;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function createChemical(input: ChemicalInput): ChemicalRecord {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const timestamp = now().toISOString();
      const chemical: ChemicalRecord = withActiveLifecycle({
        id: createId(),
        name: input.name.trim(),
        casNumber: input.casNumber.trim(),
        hazardClass: input.hazardClass,
        processIds: input.processIds,
        storageLocationId: input.storageLocationId,
        sdsStatus: input.sdsStatus,
        sdsReference: input.sdsReference.trim(),
        sdsRevisionDate: input.sdsRevisionDate,
        sdsReviewDate: input.sdsReviewDate,
        exposureLimitValue: input.exposureLimitValue.trim(),
        exposureLimitUnit: input.exposureLimitUnit.trim(),
        exposureLimitSource: input.exposureLimitSource.trim(),
        exposureLimitAveragingPeriod: input.exposureLimitAveragingPeriod.trim(),
        quantity: input.quantity.trim(),
        unit: input.unit.trim(),
        supplier: input.supplier.trim(),
        status: input.status,
        notes: input.notes.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      const nextDatabase = { ...database, chemicals: [...database.chemicals, chemical], updatedAt: timestamp };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return chemical;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function updateChemical(id: string, input: ChemicalInput): ChemicalRecord {
    if (!id.trim()) throw new Error("Chemical ID is required.");

    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const existing = database.chemicals.find((c) => c.id === id);
      if (!existing) throw new Error("Chemical was not found.");
      const timestamp = now().toISOString();
      const updatedChemical: ChemicalRecord = {
        ...existing,
        name: input.name.trim(),
        casNumber: input.casNumber.trim(),
        hazardClass: input.hazardClass,
        processIds: input.processIds,
        storageLocationId: input.storageLocationId,
        sdsStatus: input.sdsStatus,
        sdsReference: input.sdsReference.trim(),
        sdsRevisionDate: input.sdsRevisionDate,
        sdsReviewDate: input.sdsReviewDate,
        exposureLimitValue: input.exposureLimitValue.trim(),
        exposureLimitUnit: input.exposureLimitUnit.trim(),
        exposureLimitSource: input.exposureLimitSource.trim(),
        exposureLimitAveragingPeriod: input.exposureLimitAveragingPeriod.trim(),
        quantity: input.quantity.trim(),
        unit: input.unit.trim(),
        supplier: input.supplier.trim(),
        status: input.status,
        notes: input.notes.trim(),
        updatedAt: timestamp,
      };
      const nextDatabase = {
        ...database,
        chemicals: database.chemicals.map((c) => (c.id === id ? updatedChemical : c)),
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return updatedChemical;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  // ── Compliance Support ───────────────────────────────────────────────────

  function listComplianceItems(): ComplianceItemRecord[] {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const records = activeRecords(database.complianceItems);
      complianceItemRecords.set(records);
      return records;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function createComplianceItem(input: ComplianceItemInput): ComplianceItemRecord {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const timestamp = now().toISOString();
      const item: ComplianceItemRecord = withActiveLifecycle({
        id: createId(),
        itemType: input.itemType,
        title: input.title.trim(),
        requirementSource: input.requirementSource.trim(),
        owner: input.owner.trim(),
        audienceOrScope: input.audienceOrScope.trim(),
        segId: input.segId,
        locationId: input.locationId,
        processId: input.processId,
        equipmentId: input.equipmentId,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        expirationDate: input.expirationDate,
        reviewDate: input.reviewDate,
        recurrence: input.recurrence.trim(),
        status: input.status,
        reviewStatus: input.reviewStatus,
        evidenceRequired: input.evidenceRequired,
        evidenceReference: input.evidenceReference.trim(),
        notes: input.notes.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      const nextDatabase = {
        ...database,
        complianceItems: [...database.complianceItems, item],
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return item;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function updateComplianceItem(
    id: string,
    input: ComplianceItemInput,
  ): ComplianceItemRecord {
    if (!id.trim()) throw new Error("Compliance item ID is required.");

    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const existing = database.complianceItems.find((record) => record.id === id);
      if (!existing) throw new Error("Compliance item was not found.");
      const timestamp = now().toISOString();
      const updatedItem: ComplianceItemRecord = {
        ...existing,
        itemType: input.itemType,
        title: input.title.trim(),
        requirementSource: input.requirementSource.trim(),
        owner: input.owner.trim(),
        audienceOrScope: input.audienceOrScope.trim(),
        segId: input.segId,
        locationId: input.locationId,
        processId: input.processId,
        equipmentId: input.equipmentId,
        issueDate: input.issueDate,
        dueDate: input.dueDate,
        expirationDate: input.expirationDate,
        reviewDate: input.reviewDate,
        recurrence: input.recurrence.trim(),
        status: input.status,
        reviewStatus: input.reviewStatus,
        evidenceRequired: input.evidenceRequired,
        evidenceReference: input.evidenceReference.trim(),
        notes: input.notes.trim(),
        updatedAt: timestamp,
      };
      const nextDatabase = {
        ...database,
        complianceItems: database.complianceItems.map((record) =>
          record.id === id ? updatedItem : record,
        ),
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return updatedItem;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  // ── Hazards ─────────────────────────────────────────────────────────────

  function listHazards(): HazardRecord[] {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const records = activeRecords(database.hazards);
      hazardRecords.set(records);
      return records;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function createHazard(input: HazardInput): HazardRecord {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const timestamp = now().toISOString();
      const hazard: HazardRecord = withActiveLifecycle({
        id: createId(),
        title: input.title.trim(),
        category: input.category,
        locationId: input.locationId,
        locationIds: Array.from(new Set([input.locationId, ...input.locationIds].filter(Boolean))),
        processIds: input.processIds,
        chemicalIds: input.chemicalIds,
        severity: input.severity,
        likelihood: input.likelihood,
        description: input.description.trim(),
        controls: input.controls.trim(),
        status: input.status,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      const nextDatabase = { ...database, hazards: [...database.hazards, hazard], updatedAt: timestamp };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return hazard;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function updateHazard(id: string, input: HazardInput): HazardRecord {
    if (!id.trim()) throw new Error("Hazard ID is required.");

    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const existing = database.hazards.find((h) => h.id === id);
      if (!existing) throw new Error("Hazard was not found.");
      const timestamp = now().toISOString();
      const updatedHazard: HazardRecord = {
        ...existing,
        title: input.title.trim(),
        category: input.category,
        locationId: input.locationId,
        locationIds: Array.from(new Set([input.locationId, ...input.locationIds].filter(Boolean))),
        processIds: input.processIds,
        chemicalIds: input.chemicalIds,
        severity: input.severity,
        likelihood: input.likelihood,
        description: input.description.trim(),
        controls: input.controls.trim(),
        status: input.status,
        updatedAt: timestamp,
      };
      const nextDatabase = {
        ...database,
        hazards: database.hazards.map((h) => (h.id === id ? updatedHazard : h)),
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return updatedHazard;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  // ── Controls ──────────────────────────────────────────────────────────────

  function listControls(): ControlRecord[] {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const records = activeRecords(database.controls);
      controlRecords.set(records);
      return records;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function createControl(input: ControlInput): ControlRecord {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const timestamp = now().toISOString();
      const control: ControlRecord = withActiveLifecycle({
        id: createId(),
        name: input.name.trim(),
        type: input.type,
        hazardIds: input.hazardIds,
        description: input.description.trim(),
        owner: input.owner.trim(),
        verificationMethod: input.verificationMethod.trim(),
        verificationFrequency: input.verificationFrequency.trim(),
        lastVerifiedAt: input.lastVerifiedAt,
        status: input.status,
        notes: input.notes.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      const nextDatabase = { ...database, controls: [...database.controls, control], updatedAt: timestamp };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return control;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function updateControl(id: string, input: ControlInput): ControlRecord {
    if (!id.trim()) throw new Error("Control ID is required.");

    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const existing = database.controls.find((control) => control.id === id);
      if (!existing) throw new Error("Control was not found.");
      const timestamp = now().toISOString();
      const updatedControl: ControlRecord = {
        ...existing,
        name: input.name.trim(),
        type: input.type,
        hazardIds: input.hazardIds,
        description: input.description.trim(),
        owner: input.owner.trim(),
        verificationMethod: input.verificationMethod.trim(),
        verificationFrequency: input.verificationFrequency.trim(),
        lastVerifiedAt: input.lastVerifiedAt,
        status: input.status,
        notes: input.notes.trim(),
        updatedAt: timestamp,
      };
      const nextDatabase = {
        ...database,
        controls: database.controls.map((control) => (control.id === id ? updatedControl : control)),
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return updatedControl;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  // ── Risk Assessments ──────────────────────────────────────────────────────

  function listRiskAssessments(): RiskAssessmentRecord[] {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const records = activeRecords(database.riskAssessments);
      riskAssessmentRecords.set(records);
      return records;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function createRiskAssessment(input: RiskAssessmentInput): RiskAssessmentRecord {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const timestamp = now().toISOString();
      const riskAssessment: RiskAssessmentRecord = withActiveLifecycle({
        id: createId(),
        title: input.title.trim(),
        hazardId: input.hazardId,
        controlIds: input.controlIds,
        inherentSeverity: input.inherentSeverity,
        inherentLikelihood: input.inherentLikelihood,
        residualSeverity: input.residualSeverity,
        residualLikelihood: input.residualLikelihood,
        assessor: input.assessor.trim(),
        reviewStatus: input.reviewStatus,
        nextReviewDate: input.nextReviewDate,
        notes: input.notes.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      const nextDatabase = {
        ...database,
        riskAssessments: [...database.riskAssessments, riskAssessment],
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return riskAssessment;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function updateRiskAssessment(id: string, input: RiskAssessmentInput): RiskAssessmentRecord {
    if (!id.trim()) throw new Error("Risk assessment ID is required.");

    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const existing = database.riskAssessments.find((riskAssessment) => riskAssessment.id === id);
      if (!existing) throw new Error("Risk assessment was not found.");
      const timestamp = now().toISOString();
      const updatedRiskAssessment: RiskAssessmentRecord = {
        ...existing,
        title: input.title.trim(),
        hazardId: input.hazardId,
        controlIds: input.controlIds,
        inherentSeverity: input.inherentSeverity,
        inherentLikelihood: input.inherentLikelihood,
        residualSeverity: input.residualSeverity,
        residualLikelihood: input.residualLikelihood,
        assessor: input.assessor.trim(),
        reviewStatus: input.reviewStatus,
        nextReviewDate: input.nextReviewDate,
        notes: input.notes.trim(),
        updatedAt: timestamp,
      };
      const nextDatabase = {
        ...database,
        riskAssessments: database.riskAssessments.map((riskAssessment) =>
          riskAssessment.id === id ? updatedRiskAssessment : riskAssessment,
        ),
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return updatedRiskAssessment;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  // ── SEGs ─────────────────────────────────────────────────────────────────

  function listSegs(): SegRecord[] {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const records = activeRecords(database.segs);
      segRecords.set(records);
      return records;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function createSeg(input: SegInput): SegRecord {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const timestamp = now().toISOString();
      const seg: SegRecord = withActiveLifecycle({
        id: createId(),
        name: input.name.trim(),
        type: input.type,
        description: input.description.trim(),
        locationId: input.locationId,
        processId: input.processId,
        chemicalIds: input.chemicalIds,
        hazardIds: input.hazardIds,
        agentType: input.agentType.trim(),
        exposureLevel: input.exposureLevel,
        workerCount: input.workerCount.trim(),
        controls: input.controls.trim(),
        monitoringFrequency: input.monitoringFrequency.trim(),
        status: input.status,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      const nextDatabase = { ...database, segs: [...database.segs, seg], updatedAt: timestamp };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return seg;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function updateSeg(id: string, input: SegInput): SegRecord {
    if (!id.trim()) throw new Error("SEG ID is required.");

    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const existing = database.segs.find((s) => s.id === id);
      if (!existing) throw new Error("SEG was not found.");
      const timestamp = now().toISOString();
      const updatedSeg: SegRecord = {
        ...existing,
        name: input.name.trim(),
        type: input.type,
        description: input.description.trim(),
        locationId: input.locationId,
        processId: input.processId,
        chemicalIds: input.chemicalIds,
        hazardIds: input.hazardIds,
        agentType: input.agentType.trim(),
        exposureLevel: input.exposureLevel,
        workerCount: input.workerCount.trim(),
        controls: input.controls.trim(),
        monitoringFrequency: input.monitoringFrequency.trim(),
        status: input.status,
        updatedAt: timestamp,
      };
      const nextDatabase = {
        ...database,
        segs: database.segs.map((s) => (s.id === id ? updatedSeg : s)),
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return updatedSeg;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  // ── Corrective Actions ────────────────────────────────────────────────────

  function listCorrectiveActions(): CorrectiveActionRecord[] {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const records = activeRecords(database.correctiveActions);
      correctiveActionRecords.set(records);
      return records;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function createCorrectiveAction(input: CorrectiveActionInput): CorrectiveActionRecord {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const timestamp = now().toISOString();
      const sourceId = input.sourceType === "Finding" ? input.sourceId || input.findingId : input.sourceId;
      const action: CorrectiveActionRecord = withActiveLifecycle({
        id: createId(),
        title: input.title.trim(),
        type: input.type,
        description: input.description.trim(),
        findingId: input.sourceType === "Finding" ? sourceId : input.findingId,
        sourceType: input.sourceType,
        sourceId,
        sourceJustification: input.sourceJustification.trim(),
        assignedTo: input.assignedTo.trim(),
        priority: input.priority,
        status: input.status,
        dueDate: input.dueDate,
        completionSummary: input.completionSummary.trim(),
        completedAt: actionHasCompletion(input.status) ? timestamp : null,
        verificationRequired: input.verificationRequired,
        verificationMethod: input.verificationMethod.trim(),
        verificationResult: input.verificationResult.trim(),
        evidenceReference: input.evidenceReference.trim(),
        verifiedAt: actionHasVerification(input.status) ? timestamp : null,
        closedAt: input.status === "Closed" ? timestamp : null,
        closureNotes: input.closureNotes.trim(),
        createdAt: timestamp,
        updatedAt: timestamp,
      });
      const nextDatabase = {
        ...database,
        correctiveActions: [...database.correctiveActions, action],
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return action;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function updateCorrectiveAction(id: string, input: CorrectiveActionInput): CorrectiveActionRecord {
    if (!id.trim()) throw new Error("Corrective action ID is required.");

    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const existing = database.correctiveActions.find((a) => a.id === id);
      if (!existing) throw new Error("Corrective action was not found.");
      const timestamp = now().toISOString();
      const sourceId = input.sourceType === "Finding" ? input.sourceId || input.findingId : input.sourceId;
      const isCompletingNow = actionHasCompletion(input.status) && !actionHasCompletion(existing.status);
      const isVerifyingNow = actionHasVerification(input.status) && !actionHasVerification(existing.status);
      const isClosingNow = input.status === "Closed" && existing.status !== "Closed";
      const updatedAction: CorrectiveActionRecord = {
        ...existing,
        title: input.title.trim(),
        type: input.type,
        description: input.description.trim(),
        findingId: input.sourceType === "Finding" ? sourceId : input.findingId,
        sourceType: input.sourceType,
        sourceId,
        sourceJustification: input.sourceJustification.trim(),
        assignedTo: input.assignedTo.trim(),
        priority: input.priority,
        status: input.status,
        dueDate: input.dueDate,
        completionSummary: input.completionSummary.trim(),
        completedAt: isCompletingNow ? timestamp : (existing.completedAt ?? null),
        verificationRequired: input.verificationRequired,
        verificationMethod: input.verificationMethod.trim(),
        verificationResult: input.verificationResult.trim(),
        evidenceReference: input.evidenceReference.trim(),
        verifiedAt: isVerifyingNow ? timestamp : (existing.verifiedAt ?? null),
        closedAt: isClosingNow ? timestamp : (existing.closedAt ?? null),
        closureNotes: input.closureNotes.trim(),
        updatedAt: timestamp,
      };
      const nextDatabase = {
        ...database,
        correctiveActions: database.correctiveActions.map((a) =>
          a.id === id ? updatedAction : a,
        ),
        updatedAt: timestamp,
      };
      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return updatedAction;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function createRegisterRecord(
    collection: CampaignCollectionName,
    input: Record<string, unknown>,
  ): CampaignRecord {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const timestamp = now().toISOString();
      const records = database[collection];
      const record = withActiveLifecycle({
        ...valuesToCampaignRecordInput(collection, input, null, timestamp, records),
        id: createId(),
        createdAt: timestamp,
        updatedAt: timestamp,
      }) as CampaignRecord;
      const nextDatabase = {
        ...database,
        [collection]: [...records, record],
        updatedAt: timestamp,
      } as PersistedDatabase;

      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return record;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function updateRegisterRecord(
    collection: CampaignCollectionName,
    id: string,
    input: Record<string, unknown>,
  ): CampaignRecord {
    if (!id.trim()) throw new Error("Record ID is required.");

    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const records = database[collection];
      const existing = records.find((record) => record.id === id);
      if (!existing) throw new Error("Record was not found.");
      const timestamp = now().toISOString();
      const updatedRecord = valuesToCampaignRecordInput(
        collection,
        input,
        existing,
        timestamp,
        records,
      );
      const nextDatabase = {
        ...database,
        [collection]: records.map((record) => (record.id === id ? updatedRecord : record)),
        updatedAt: timestamp,
      } as PersistedDatabase;

      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return updatedRecord;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function getRecord(collection: RegisterCollectionName, id: string): PersistedRegisterRecord | null {
    try {
      if (!id.trim()) {
        throw new Error("Record ID is required.");
      }

      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      return getRegisterCollection(database, collection).find((record) => record.id === id) ?? null;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function listRegisterRecords(collection: RegisterCollectionName, options: { includeArchived?: boolean } = {}) {
    try {
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const records = getRegisterCollection(database, collection);
      const visibleRecords = options.includeArchived ? records : activeRecords(records);

      if (!options.includeArchived) {
        getRegisterStore(collection).set(visibleRecords as never[]);
      }

      return visibleRecords;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function archiveRecord(
    collection: RegisterCollectionName,
    id: string,
    reason = "Archived from record detail page.",
  ): PersistedRegisterRecord {
    try {
      if (!id.trim()) throw new Error("Record ID is required.");
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const timestamp = now().toISOString();
      const records = getRegisterCollection(database, collection);
      const existing = records.find((record) => record.id === id);
      if (!existing) throw new Error("Record was not found.");

      const archivedRecord = {
        ...existing,
        archivedAt: timestamp,
        archivedReason: reason.trim() || null,
        lifecycleStatus: "archived" as const,
        updatedAt: timestamp,
      } satisfies PersistedRegisterRecord;
      const nextDatabase = {
        ...database,
        [collection]: records.map((record) => (record.id === id ? archivedRecord : record)),
        updatedAt: timestamp,
      } as PersistedDatabase;

      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return archivedRecord;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function restoreRecord(collection: RegisterCollectionName, id: string): PersistedRegisterRecord {
    try {
      if (!id.trim()) throw new Error("Record ID is required.");
      const database = readDatabase();
      if (!database) throw new Error("Persistence is not initialized.");
      const timestamp = now().toISOString();
      const records = getRegisterCollection(database, collection);
      const existing = records.find((record) => record.id === id);
      if (!existing) throw new Error("Record was not found.");

      const restoredRecord = {
        ...existing,
        archivedAt: null,
        archivedReason: null,
        lifecycleStatus: "active" as const,
        updatedAt: timestamp,
      } satisfies PersistedRegisterRecord;
      const nextDatabase = {
        ...database,
        [collection]: records.map((record) => (record.id === id ? restoredRecord : record)),
        updatedAt: timestamp,
      } as PersistedDatabase;

      writeDatabase(nextDatabase);
      publishReady(nextDatabase, `Schema v${SCHEMA_VERSION} is ready.`);
      return restoredRecord;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function exportDatabase(): PersistedDatabase {
    const database = readDatabase();
    if (!database) throw new Error("Persistence is not initialized.");
    return JSON.parse(JSON.stringify(database)) as PersistedDatabase;
  }

  function mergeCollection<TRecord extends { id: string }>(
    current: TRecord[],
    imported: TRecord[],
  ) {
    const currentIds = new Set(current.map((record) => record.id));
    const missing = imported.filter((record) => !currentIds.has(record.id));
    return { records: [...current, ...missing], importedCount: missing.length };
  }

  function importDatabase(snapshot: unknown) {
    const current = readDatabase();
    if (!current) throw new Error("Persistence is not initialized.");
    const imported = parseDatabase(JSON.stringify(snapshot));
    const locations = mergeCollection(current.locations, imported.locations);
    const findings = mergeCollection(current.findings, imported.findings);
    const incidents = mergeCollection(current.incidents, imported.incidents);
    const processes = mergeCollection(current.processes, imported.processes);
    const equipment = mergeCollection(current.equipment, imported.equipment);
    const exposureMonitoring = mergeCollection(
      current.exposureMonitoring,
      imported.exposureMonitoring,
    );
    const chemicals = mergeCollection(current.chemicals, imported.chemicals);
    const complianceItems = mergeCollection(current.complianceItems, imported.complianceItems);
    const hazards = mergeCollection(current.hazards, imported.hazards);
    const controls = mergeCollection(current.controls, imported.controls);
    const riskAssessments = mergeCollection(current.riskAssessments, imported.riskAssessments);
    const segs = mergeCollection(current.segs, imported.segs);
    const correctiveActions = mergeCollection(
      current.correctiveActions,
      imported.correctiveActions,
    );
    const campaignMerges = Object.fromEntries(
      CAMPAIGN_COLLECTION_NAMES.map((collection) => [
        collection,
        mergeCollection(current[collection], imported[collection]),
      ]),
    ) as Record<
      CampaignCollectionName,
      { records: CampaignRecord[]; importedCount: number }
    >;
    const database: PersistedDatabase = {
      ...current,
      schemaVersion: SCHEMA_VERSION,
      locations: locations.records,
      findings: findings.records,
      incidents: incidents.records,
      processes: processes.records,
      equipment: equipment.records,
      exposureMonitoring: exposureMonitoring.records,
      chemicals: chemicals.records,
      complianceItems: complianceItems.records,
      hazards: hazards.records,
      controls: controls.records,
      riskAssessments: riskAssessments.records,
      segs: segs.records,
      correctiveActions: correctiveActions.records,
      ...(Object.fromEntries(
        CAMPAIGN_COLLECTION_NAMES.map((collection) => [
          collection,
          campaignMerges[collection].records,
        ]),
      ) as Record<CampaignCollectionName, CampaignRecord[]>),
      updatedAt: now().toISOString(),
    };
    const importedCount = [
      locations,
      findings,
      incidents,
      processes,
      equipment,
      exposureMonitoring,
      chemicals,
      complianceItems,
      hazards,
      controls,
      riskAssessments,
      segs,
      correctiveActions,
      ...CAMPAIGN_COLLECTION_NAMES.map((collection) => campaignMerges[collection]),
    ].reduce((total, collection) => total + collection.importedCount, 0);

    writeDatabase(database);
    publishReady(database, `Imported ${importedCount} missing records into schema v${SCHEMA_VERSION}.`);
    return { database, importedCount };
  }

  function restoreDatabase(snapshot: unknown): PersistedDatabase {
    const database = parseDatabase(JSON.stringify(snapshot));
    const restored = { ...database, updatedAt: now().toISOString() };
    writeDatabase(restored);
    publishReady(restored, `Restored backup into schema v${SCHEMA_VERSION}.`);
    return restored;
  }

  function clearAllData() {
    try {
      const activeStorage = requireStorage();
      activeStorage.setItem(storageKey, "");
      locationRecords.set([]);
      findingRecords.set([]);
      processRecords.set([]);
      incidentRecords.set([]);
      chemicalRecords.set([]);
      complianceItemRecords.set([]);
      hazardRecords.set([]);
      equipmentRecords.set([]);
      exposureMonitoringRecords.set([]);
      controlRecords.set([]);
      riskAssessmentRecords.set([]);
      segRecords.set([]);
      correctiveActionRecords.set([]);
      for (const collection of CAMPAIGN_COLLECTION_NAMES) {
        campaignRecordStores[collection].set([]);
      }
      setDiagnostics({
        status: "not_configured",
        dataPath: getDataPath(),
        initializedAt: null,
        lastInitializationStatus: "Data cleared by user.",
        lastMigrationStatus: "No migration has run.",
        lastError: null,
      });
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  function clearAllDataWithoutSeed() {
    try {
      const timestamp = now().toISOString();
      const database = createEmptyDatabase(timestamp);
      writeDatabase(database);
      publishReady(database, `Schema v${SCHEMA_VERSION} is ready with no demo data.`);
      return database;
    } catch (error) {
      setErrorStatus(error);
      throw error;
    }
  }

  return {
    initialize,
    listLocations,
    createLocation,
    updateLocation,
    listFindings,
    createFinding,
    updateFinding,
    listIncidents,
    createIncident,
    updateIncident,
    listProcesses,
    createProcess,
    updateProcess,
    listEquipment,
    createEquipment,
    updateEquipment,
    listExposureMonitoring,
    createExposureMonitoring,
    updateExposureMonitoring,
    listChemicals,
    createChemical,
    updateChemical,
    listComplianceItems,
    createComplianceItem,
    updateComplianceItem,
    listHazards,
    createHazard,
    updateHazard,
    listControls,
    createControl,
    updateControl,
    listRiskAssessments,
    createRiskAssessment,
    updateRiskAssessment,
    listSegs,
    createSeg,
    updateSeg,
    listCorrectiveActions,
    createCorrectiveAction,
    updateCorrectiveAction,
    createRegisterRecord,
    updateRegisterRecord,
    getRecord,
    listRegisterRecords,
    archiveRecord,
    restoreRecord,
    exportDatabase,
    importDatabase,
    restoreDatabase,
    clearAllData,
    clearAllDataWithoutSeed,
    getDataPath,
  };
}

interface SqlitePersistenceSnapshot {
  database: PersistedDatabase;
  diagnostics: PersistenceDiagnostics;
}

export type PersistenceRepositoryAdapter = ReturnType<typeof createLocalPersistenceRepository>;
type LocalPersistenceRepository = PersistenceRepositoryAdapter;

function isTauriRuntime() {
  return (
    typeof window !== "undefined" &&
    (Boolean((window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__) ||
      Boolean((window as Window & { __TAURI__?: unknown }).__TAURI__))
  );
}

async function invokeSqliteCommand<T>(command: string, args?: Record<string, unknown>): Promise<T> {
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<T>(command, args);
}

function getLocalStorageSnapshot(storageKey = DEFAULT_STORAGE_KEY) {
  const storage = getBrowserStorage();
  return storage?.getItem(storageKey) ?? null;
}

function publishSqliteSnapshot(snapshot: SqlitePersistenceSnapshot) {
  const database = snapshot.database;
  locationRecords.set(activeRecords(database.locations));
  findingRecords.set(activeRecords(database.findings));
  processRecords.set(activeRecords(database.processes));
  equipmentRecords.set(activeRecords(database.equipment));
  exposureMonitoringRecords.set(activeRecords(database.exposureMonitoring));
  chemicalRecords.set(activeRecords(database.chemicals));
  complianceItemRecords.set(activeRecords(database.complianceItems));
  hazardRecords.set(activeRecords(database.hazards));
  controlRecords.set(activeRecords(database.controls));
  riskAssessmentRecords.set(activeRecords(database.riskAssessments));
  segRecords.set(activeRecords(database.segs));
  incidentRecords.set(activeRecords(database.incidents));
  correctiveActionRecords.set(activeRecords(database.correctiveActions));
  for (const collection of CAMPAIGN_COLLECTION_NAMES) {
    campaignRecordStores[collection].set(activeRecords(database[collection]));
  }
  persistenceDiagnostics.set({
    ...snapshot.diagnostics,
    backend: "sqlite",
    connectionState: snapshot.diagnostics.status === "error" ? "error" : "connected",
    schemaVersion: snapshot.diagnostics.schemaVersion ?? database.schemaVersion,
  });
}

function setSqliteLoadingStatus() {
  persistenceDiagnostics.set({
    status: "loading",
    backend: "sqlite",
    connectionState: "not_connected",
    dataPath: null,
    schemaVersion: SCHEMA_VERSION,
    databaseSizeBytes: undefined,
    recordCounts: undefined,
    initializedAt: null,
    lastInitializationStatus: "Initializing SQLite persistence.",
    lastMigrationStatus: "Migration pending.",
    localStorageMigrationStatus: "Checking for localStorage import.",
    lastError: null,
  });
}

function setSqliteErrorStatus(error: unknown) {
  const lastError = serializeError(error);
  persistenceDiagnostics.set({
    status: "error",
    backend: "sqlite",
    connectionState: "error",
    dataPath: null,
    schemaVersion: SCHEMA_VERSION,
    databaseSizeBytes: undefined,
    recordCounts: undefined,
    initializedAt: null,
    lastInitializationStatus: "SQLite persistence operation failed.",
    lastMigrationStatus: "Migration status unknown.",
    localStorageMigrationStatus: "Migration status unknown.",
    lastError,
  });
}

function getCreatedRecord<TRecord extends PersistedRegisterRecord>(
  before: PersistedDatabase | null,
  after: PersistedDatabase,
  collection: RegisterCollectionName,
) {
  const beforeIds = new Set(
    before ? getRegisterCollection(before, collection).map((record) => record.id) : [],
  );
  const created = getRegisterCollection(after, collection).find((record) => !beforeIds.has(record.id));

  if (!created) {
    throw new Error("Created record was not returned by SQLite.");
  }

  return created as TRecord;
}

function createSqlitePersistenceRepository(): LocalPersistenceRepository {
  let database: PersistedDatabase | null = null;

  function requireDatabase() {
    if (!database) {
      throw new Error("SQLite persistence is not initialized.");
    }

    return database;
  }

  function publish(snapshot: SqlitePersistenceSnapshot) {
    database = snapshot.database;
    publishSqliteSnapshot(snapshot);
  }

  function listCollection<TRecord extends PersistedRegisterRecord>(
    collection: RegisterCollectionName,
  ): TRecord[] {
    const records = activeRecords(getRegisterCollection(requireDatabase(), collection));
    getRegisterStore(collection).set(records as never[]);
    return records as TRecord[];
  }

  async function invokeSnapshot(command: string, args?: Record<string, unknown>) {
    try {
      const snapshot = await invokeSqliteCommand<SqlitePersistenceSnapshot>(command, args);
      publish(snapshot);
      return snapshot;
    } catch (error) {
      setSqliteErrorStatus(error);
      throw error;
    }
  }

  return {
    async initialize() {
      setSqliteLoadingStatus();
      const snapshot = await invokeSnapshot("oluso_initialize_persistence", {
        localStorageSnapshot: getLocalStorageSnapshot(),
      });
      return snapshot.database;
    },
    listLocations: () => listCollection<LocationRecord>("locations"),
    createLocation(input: LocationInput) {
      const before = database;
      return invokeSnapshot("oluso_create_record", { collection: "locations", input }).then((snapshot) =>
        getCreatedRecord<LocationRecord>(before, snapshot.database, "locations"),
      ) as unknown as LocationRecord;
    },
    updateLocation(id: string, input: LocationInput) {
      return invokeSnapshot("oluso_update_record", { collection: "locations", id, input }).then((snapshot) =>
        getRegisterCollection(snapshot.database, "locations").find((record) => record.id === id),
      ) as unknown as LocationRecord;
    },
    listFindings: () => listCollection<FindingRecord>("findings"),
    createFinding(input: FindingInput) {
      const before = database;
      return invokeSnapshot("oluso_create_record", { collection: "findings", input }).then((snapshot) =>
        getCreatedRecord<FindingRecord>(before, snapshot.database, "findings"),
      ) as unknown as FindingRecord;
    },
    updateFinding(id: string, input: FindingInput) {
      return invokeSnapshot("oluso_update_record", { collection: "findings", id, input }).then((snapshot) =>
        getRegisterCollection(snapshot.database, "findings").find((record) => record.id === id),
      ) as unknown as FindingRecord;
    },
    listIncidents: () => listCollection<IncidentRecord>("incidents"),
    createIncident(input: IncidentInput) {
      const before = database;
      return invokeSnapshot("oluso_create_record", { collection: "incidents", input }).then((snapshot) =>
        getCreatedRecord<IncidentRecord>(before, snapshot.database, "incidents"),
      ) as unknown as IncidentRecord;
    },
    updateIncident(id: string, input: IncidentInput) {
      return invokeSnapshot("oluso_update_record", { collection: "incidents", id, input }).then((snapshot) =>
        getRegisterCollection(snapshot.database, "incidents").find((record) => record.id === id),
      ) as unknown as IncidentRecord;
    },
    listProcesses: () => listCollection<ProcessRecord>("processes"),
    createProcess(input: ProcessInput) {
      const before = database;
      return invokeSnapshot("oluso_create_record", { collection: "processes", input }).then((snapshot) =>
        getCreatedRecord<ProcessRecord>(before, snapshot.database, "processes"),
      ) as unknown as ProcessRecord;
    },
    updateProcess(id: string, input: ProcessInput) {
      return invokeSnapshot("oluso_update_record", { collection: "processes", id, input }).then((snapshot) =>
        getRegisterCollection(snapshot.database, "processes").find((record) => record.id === id),
      ) as unknown as ProcessRecord;
    },
    listEquipment: () => listCollection<EquipmentRecord>("equipment"),
    createEquipment(input: EquipmentInput) {
      const before = database;
      return invokeSnapshot("oluso_create_record", { collection: "equipment", input }).then((snapshot) =>
        getCreatedRecord<EquipmentRecord>(before, snapshot.database, "equipment"),
      ) as unknown as EquipmentRecord;
    },
    updateEquipment(id: string, input: EquipmentInput) {
      return invokeSnapshot("oluso_update_record", { collection: "equipment", id, input }).then((snapshot) =>
        getRegisterCollection(snapshot.database, "equipment").find((record) => record.id === id),
      ) as unknown as EquipmentRecord;
    },
    listExposureMonitoring: () =>
      listCollection<ExposureMonitoringRecord>("exposureMonitoring"),
    createExposureMonitoring(input: ExposureMonitoringInput) {
      const before = database;
      return invokeSnapshot("oluso_create_record", {
        collection: "exposureMonitoring",
        input,
      }).then((snapshot) =>
        getCreatedRecord<ExposureMonitoringRecord>(
          before,
          snapshot.database,
          "exposureMonitoring",
        ),
      ) as unknown as ExposureMonitoringRecord;
    },
    updateExposureMonitoring(id: string, input: ExposureMonitoringInput) {
      return invokeSnapshot("oluso_update_record", {
        collection: "exposureMonitoring",
        id,
        input,
      }).then((snapshot) =>
        getRegisterCollection(snapshot.database, "exposureMonitoring").find(
          (record) => record.id === id,
        ),
      ) as unknown as ExposureMonitoringRecord;
    },
    listChemicals: () => listCollection<ChemicalRecord>("chemicals"),
    createChemical(input: ChemicalInput) {
      const before = database;
      return invokeSnapshot("oluso_create_record", { collection: "chemicals", input }).then((snapshot) =>
        getCreatedRecord<ChemicalRecord>(before, snapshot.database, "chemicals"),
      ) as unknown as ChemicalRecord;
    },
    updateChemical(id: string, input: ChemicalInput) {
      return invokeSnapshot("oluso_update_record", { collection: "chemicals", id, input }).then((snapshot) =>
        getRegisterCollection(snapshot.database, "chemicals").find((record) => record.id === id),
      ) as unknown as ChemicalRecord;
    },
    listComplianceItems: () => listCollection<ComplianceItemRecord>("complianceItems"),
    createComplianceItem(input: ComplianceItemInput) {
      const before = database;
      return invokeSnapshot("oluso_create_record", {
        collection: "complianceItems",
        input,
      }).then((snapshot) =>
        getCreatedRecord<ComplianceItemRecord>(before, snapshot.database, "complianceItems"),
      ) as unknown as ComplianceItemRecord;
    },
    updateComplianceItem(id: string, input: ComplianceItemInput) {
      return invokeSnapshot("oluso_update_record", {
        collection: "complianceItems",
        id,
        input,
      }).then((snapshot) =>
        getRegisterCollection(snapshot.database, "complianceItems").find(
          (record) => record.id === id,
        ),
      ) as unknown as ComplianceItemRecord;
    },
    listHazards: () => listCollection<HazardRecord>("hazards"),
    createHazard(input: HazardInput) {
      const before = database;
      return invokeSnapshot("oluso_create_record", { collection: "hazards", input }).then((snapshot) =>
        getCreatedRecord<HazardRecord>(before, snapshot.database, "hazards"),
      ) as unknown as HazardRecord;
    },
    updateHazard(id: string, input: HazardInput) {
      return invokeSnapshot("oluso_update_record", { collection: "hazards", id, input }).then((snapshot) =>
        getRegisterCollection(snapshot.database, "hazards").find((record) => record.id === id),
      ) as unknown as HazardRecord;
    },
    listControls: () => listCollection<ControlRecord>("controls"),
    createControl(input: ControlInput) {
      const before = database;
      return invokeSnapshot("oluso_create_record", { collection: "controls", input }).then((snapshot) =>
        getCreatedRecord<ControlRecord>(before, snapshot.database, "controls"),
      ) as unknown as ControlRecord;
    },
    updateControl(id: string, input: ControlInput) {
      return invokeSnapshot("oluso_update_record", { collection: "controls", id, input }).then((snapshot) =>
        getRegisterCollection(snapshot.database, "controls").find((record) => record.id === id),
      ) as unknown as ControlRecord;
    },
    listRiskAssessments: () => listCollection<RiskAssessmentRecord>("riskAssessments"),
    createRiskAssessment(input: RiskAssessmentInput) {
      const before = database;
      return invokeSnapshot("oluso_create_record", { collection: "riskAssessments", input }).then((snapshot) =>
        getCreatedRecord<RiskAssessmentRecord>(before, snapshot.database, "riskAssessments"),
      ) as unknown as RiskAssessmentRecord;
    },
    updateRiskAssessment(id: string, input: RiskAssessmentInput) {
      return invokeSnapshot("oluso_update_record", { collection: "riskAssessments", id, input }).then((snapshot) =>
        getRegisterCollection(snapshot.database, "riskAssessments").find((record) => record.id === id),
      ) as unknown as RiskAssessmentRecord;
    },
    listSegs: () => listCollection<SegRecord>("segs"),
    createSeg(input: SegInput) {
      const before = database;
      return invokeSnapshot("oluso_create_record", { collection: "segs", input }).then((snapshot) =>
        getCreatedRecord<SegRecord>(before, snapshot.database, "segs"),
      ) as unknown as SegRecord;
    },
    updateSeg(id: string, input: SegInput) {
      return invokeSnapshot("oluso_update_record", { collection: "segs", id, input }).then((snapshot) =>
        getRegisterCollection(snapshot.database, "segs").find((record) => record.id === id),
      ) as unknown as SegRecord;
    },
    listCorrectiveActions: () => listCollection<CorrectiveActionRecord>("correctiveActions"),
    createCorrectiveAction(input: CorrectiveActionInput) {
      const before = database;
      return invokeSnapshot("oluso_create_record", { collection: "correctiveActions", input }).then((snapshot) =>
        getCreatedRecord<CorrectiveActionRecord>(before, snapshot.database, "correctiveActions"),
      ) as unknown as CorrectiveActionRecord;
    },
    updateCorrectiveAction(id: string, input: CorrectiveActionInput) {
      return invokeSnapshot("oluso_update_record", { collection: "correctiveActions", id, input }).then((snapshot) =>
        getRegisterCollection(snapshot.database, "correctiveActions").find((record) => record.id === id),
      ) as unknown as CorrectiveActionRecord;
    },
    createRegisterRecord(collection: CampaignCollectionName, input: Record<string, unknown>) {
      const before = database;
      return invokeSnapshot("oluso_create_record", { collection, input }).then((snapshot) =>
        getCreatedRecord<CampaignRecord>(before, snapshot.database, collection),
      ) as unknown as CampaignRecord;
    },
    updateRegisterRecord(
      collection: CampaignCollectionName,
      id: string,
      input: Record<string, unknown>,
    ) {
      return invokeSnapshot("oluso_update_record", { collection, id, input }).then((snapshot) =>
        getRegisterCollection(snapshot.database, collection).find((record) => record.id === id),
      ) as unknown as CampaignRecord;
    },
    getRecord(collection: RegisterCollectionName, id: string) {
      if (!id.trim()) {
        throw new Error("Record ID is required.");
      }

      return getRegisterCollection(requireDatabase(), collection).find((record) => record.id === id) ?? null;
    },
    listRegisterRecords(collection: RegisterCollectionName, options: { includeArchived?: boolean } = {}) {
      const records = getRegisterCollection(requireDatabase(), collection);
      const visibleRecords = options.includeArchived ? records : activeRecords(records);

      if (!options.includeArchived) {
        getRegisterStore(collection).set(visibleRecords as never[]);
      }

      return visibleRecords;
    },
    archiveRecord(
      collection: RegisterCollectionName,
      id: string,
      reason = "Archived from record detail page.",
    ) {
      return invokeSnapshot("oluso_archive_record", { collection, id, reason }).then((snapshot) =>
        getRegisterCollection(snapshot.database, collection).find((record) => record.id === id),
      ) as unknown as PersistedRegisterRecord;
    },
    restoreRecord(collection: RegisterCollectionName, id: string) {
      return invokeSnapshot("oluso_restore_record", { collection, id }).then((snapshot) =>
        getRegisterCollection(snapshot.database, collection).find((record) => record.id === id),
      ) as unknown as PersistedRegisterRecord;
    },
    exportDatabase() {
      return JSON.parse(JSON.stringify(requireDatabase())) as PersistedDatabase;
    },
    importDatabase(snapshot: unknown) {
      const beforeCount = REGISTER_COLLECTION_NAMES.reduce(
        (total, collection) => total + getRegisterCollection(requireDatabase(), collection).length,
        0,
      );
      return invokeSnapshot("oluso_import_database", {
        database: snapshot,
        replace: false,
      }).then((result) => {
        const afterCount = REGISTER_COLLECTION_NAMES.reduce(
          (total, collection) =>
            total + getRegisterCollection(result.database, collection).length,
          0,
        );
        return { database: result.database, importedCount: Math.max(0, afterCount - beforeCount) };
      }) as unknown as { database: PersistedDatabase; importedCount: number };
    },
    restoreDatabase(snapshot: unknown) {
      return invokeSnapshot("oluso_import_database", {
        database: snapshot,
        replace: true,
      }).then((result) => result.database) as unknown as PersistedDatabase;
    },
    clearAllData() {
      return invokeSnapshot("oluso_reset_persistence").then(() => undefined) as unknown as void;
    },
    clearAllDataWithoutSeed() {
      const timestamp = defaultNow().toISOString();
      const emptyDatabase = createEmptyDatabase(timestamp);

      return invokeSnapshot("oluso_import_database", {
        database: emptyDatabase,
        replace: true,
      }).then((snapshot) => snapshot.database) as unknown as PersistedDatabase;
    },
    getDataPath() {
      return persistenceDiagnosticsDataPath();
    },
  };
}

function persistenceDiagnosticsDataPath() {
  let dataPath: string | null = null;
  const unsubscribe = persistenceDiagnostics.subscribe((diagnostics) => {
    dataPath = diagnostics.dataPath;
  });
  unsubscribe();
  return dataPath;
}

function createHybridPersistenceRepository(): LocalPersistenceRepository {
  const localRepository = createLocalPersistenceRepository();
  let sqliteRepository: LocalPersistenceRepository | null = null;

  function getRepository() {
    if (!isTauriRuntime()) {
      return localRepository;
    }

    sqliteRepository ??= createSqlitePersistenceRepository();
    return sqliteRepository;
  }

  return {
    initialize: (...args) => getRepository().initialize(...args),
    listLocations: () => getRepository().listLocations(),
    createLocation: (input) => getRepository().createLocation(input),
    updateLocation: (id, input) => getRepository().updateLocation(id, input),
    listFindings: () => getRepository().listFindings(),
    createFinding: (input) => getRepository().createFinding(input),
    updateFinding: (id, input) => getRepository().updateFinding(id, input),
    listIncidents: () => getRepository().listIncidents(),
    createIncident: (input) => getRepository().createIncident(input),
    updateIncident: (id, input) => getRepository().updateIncident(id, input),
    listProcesses: () => getRepository().listProcesses(),
    createProcess: (input) => getRepository().createProcess(input),
    updateProcess: (id, input) => getRepository().updateProcess(id, input),
    listEquipment: () => getRepository().listEquipment(),
    createEquipment: (input) => getRepository().createEquipment(input),
    updateEquipment: (id, input) => getRepository().updateEquipment(id, input),
    listExposureMonitoring: () => getRepository().listExposureMonitoring(),
    createExposureMonitoring: (input) => getRepository().createExposureMonitoring(input),
    updateExposureMonitoring: (id, input) => getRepository().updateExposureMonitoring(id, input),
    listChemicals: () => getRepository().listChemicals(),
    createChemical: (input) => getRepository().createChemical(input),
    updateChemical: (id, input) => getRepository().updateChemical(id, input),
    listComplianceItems: () => getRepository().listComplianceItems(),
    createComplianceItem: (input) => getRepository().createComplianceItem(input),
    updateComplianceItem: (id, input) => getRepository().updateComplianceItem(id, input),
    listHazards: () => getRepository().listHazards(),
    createHazard: (input) => getRepository().createHazard(input),
    updateHazard: (id, input) => getRepository().updateHazard(id, input),
    listControls: () => getRepository().listControls(),
    createControl: (input) => getRepository().createControl(input),
    updateControl: (id, input) => getRepository().updateControl(id, input),
    listRiskAssessments: () => getRepository().listRiskAssessments(),
    createRiskAssessment: (input) => getRepository().createRiskAssessment(input),
    updateRiskAssessment: (id, input) => getRepository().updateRiskAssessment(id, input),
    listSegs: () => getRepository().listSegs(),
    createSeg: (input) => getRepository().createSeg(input),
    updateSeg: (id, input) => getRepository().updateSeg(id, input),
    listCorrectiveActions: () => getRepository().listCorrectiveActions(),
    createCorrectiveAction: (input) => getRepository().createCorrectiveAction(input),
    updateCorrectiveAction: (id, input) => getRepository().updateCorrectiveAction(id, input),
    createRegisterRecord: (collection, input) =>
      getRepository().createRegisterRecord(collection, input),
    updateRegisterRecord: (collection, id, input) =>
      getRepository().updateRegisterRecord(collection, id, input),
    getRecord: (collection, id) => getRepository().getRecord(collection, id),
    listRegisterRecords: (collection, options) => getRepository().listRegisterRecords(collection, options),
    archiveRecord: (collection, id, reason) => getRepository().archiveRecord(collection, id, reason),
    restoreRecord: (collection, id) => getRepository().restoreRecord(collection, id),
    exportDatabase: () => getRepository().exportDatabase(),
    importDatabase: (snapshot) => getRepository().importDatabase(snapshot),
    restoreDatabase: (snapshot) => getRepository().restoreDatabase(snapshot),
    clearAllData: () => getRepository().clearAllData(),
    clearAllDataWithoutSeed: () => getRepository().clearAllDataWithoutSeed(),
    getDataPath: () => getRepository().getDataPath(),
  };
}

export const localPersistenceRepository = createHybridPersistenceRepository();

export function resetPersistenceStoresForTest() {
  persistenceDiagnostics.set(initialDiagnostics);
  locationRecords.set([]);
  findingRecords.set([]);
  processRecords.set([]);
  equipmentRecords.set([]);
  exposureMonitoringRecords.set([]);
  chemicalRecords.set([]);
  complianceItemRecords.set([]);
  hazardRecords.set([]);
  controlRecords.set([]);
  riskAssessmentRecords.set([]);
  segRecords.set([]);
  incidentRecords.set([]);
  correctiveActionRecords.set([]);
  for (const collection of CAMPAIGN_COLLECTION_NAMES) {
    campaignRecordStores[collection].set([]);
  }
}
