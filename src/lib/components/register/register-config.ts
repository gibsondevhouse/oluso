import { get } from "svelte/store";
import type { DetailSection } from "./RecordDetailLayout.svelte";
import type { RelationshipItem, RelationshipSection } from "./RelationshipPanel.svelte";
import type {
  RegisterCollectionName,
  PersistedRegisterRecord,
} from "$lib/persistence/local-persistence";
import { olusoApplication } from "../../../application/oluso-application";
import {
  chemicalRecords,
  controlRecords,
  correctiveActionRecords,
  equipmentRecords,
  findingRecords,
  hazardRecords,
  locationRecords,
  processRecords,
  riskAssessmentRecords,
  segRecords,
} from "$lib/persistence/local-persistence";
import type { RegisterTableColumn } from "./register-table.types";
import {
  LOCATION_STATUSES,
  LOCATION_TYPES,
  type LocationInput,
  type LocationRecord,
  type LocationStatus,
  type LocationType,
} from "$lib/persistence/location.types";
import {
  FINDING_SEVERITIES,
  FINDING_STATUSES,
  FINDING_TYPES,
  getFindingSeverityTone,
  getFindingStatusTone,
  type FindingInput,
  type FindingRecord,
  type FindingSeverity,
  type FindingStatus,
  type FindingType,
} from "$lib/persistence/finding.types";
import {
  PROCESS_CATEGORIES,
  PROCESS_STATUSES,
  getProcessStatusLabel,
  getProcessStatusTone,
  type ProcessCategory,
  type ProcessInput,
  type ProcessRecord,
  type ProcessStatus,
} from "$lib/persistence/process.types";
import {
  CHEMICAL_HAZARD_CLASSES,
  CHEMICAL_SDS_STATUSES,
  CHEMICAL_STATUSES,
  getChemicalHazardTone,
  getChemicalSdsStatusTone,
  getChemicalStatusTone,
  type ChemicalHazardClass,
  type ChemicalInput,
  type ChemicalRecord,
  type ChemicalSdsStatus,
  type ChemicalStatus,
} from "$lib/persistence/chemical.types";
import {
  CONTROL_STATUSES,
  CONTROL_TYPES,
  getControlStatusLabel,
  getControlStatusTone,
  type ControlInput,
  type ControlRecord,
  type ControlStatus,
  type ControlType,
} from "$lib/persistence/control.types";
import {
  EQUIPMENT_STATUSES,
  EQUIPMENT_TYPES,
  getEquipmentStatusLabel,
  getEquipmentStatusTone,
  type EquipmentInput,
  type EquipmentRecord,
  type EquipmentStatus,
  type EquipmentType,
} from "$lib/persistence/equipment.types";
import {
  HAZARD_CATEGORIES,
  HAZARD_LIKELIHOODS,
  HAZARD_SEVERITIES,
  HAZARD_STATUSES,
  getHazardSeverityTone,
  getHazardStatusLabel,
  getHazardStatusTone,
  type HazardCategory,
  type HazardInput,
  type HazardLikelihood,
  type HazardRecord,
  type HazardSeverity,
  type HazardStatus,
} from "$lib/persistence/hazard.types";
import {
  RISK_ASSESSMENT_STATUSES,
  getRiskAssessmentStatusTone,
  type RiskAssessmentInput,
  type RiskAssessmentRecord,
  type RiskAssessmentStatus,
} from "$lib/persistence/risk-assessment.types";
import {
  EXPOSURE_LEVELS,
  MONITORING_FREQUENCIES,
  SEG_STATUSES,
  SEG_TYPES,
  getExposureLevelTone,
  getSegStatusLabel,
  getSegStatusTone,
  type ExposureLevel,
  type SegInput,
  type SegRecord,
  type SegStatus,
  type SegType,
} from "$lib/persistence/seg.types";
import {
  CORRECTIVE_ACTION_PRIORITIES,
  CORRECTIVE_ACTION_SOURCE_TYPES,
  CORRECTIVE_ACTION_STATUSES,
  CORRECTIVE_ACTION_TYPES,
  getCorrectiveActionPriorityTone,
  getCorrectiveActionStatusTone,
  type CorrectiveActionInput,
  type CorrectiveActionPriority,
  type CorrectiveActionRecord,
  type CorrectiveActionSourceType,
  type CorrectiveActionStatus,
  type CorrectiveActionType,
} from "$lib/persistence/corrective-action.types";
import { formatTimestamp } from "$lib/utils/date";

type FormValues = Record<string, string>;
type MaybePromise<T> = T | Promise<T>;

export type MvpRegisterKind =
  | "locations"
  | "findings"
  | "processes"
  | "equipment"
  | "chemicals"
  | "hazards"
  | "controls"
  | "risk-assessments"
  | "segs"
  | "corrective-actions";

export interface RecordFormFieldOption {
  value: string;
  label: string;
}

export interface RecordFormFieldConfig {
  name: string;
  label: string;
  type: "text" | "textarea" | "select" | "multiselect" | "checkbox";
  required?: boolean;
  helperText?: string;
  placeholder?: string;
  options?: RecordFormFieldOption[];
  rows?: number;
}

export interface RegisterContext {
  locations: LocationRecord[];
  processes: ProcessRecord[];
  equipment: EquipmentRecord[];
  chemicals: ChemicalRecord[];
  hazards: HazardRecord[];
  controls: ControlRecord[];
  riskAssessments: RiskAssessmentRecord[];
  segs: SegRecord[];
  findings: FindingRecord[];
  correctiveActions: CorrectiveActionRecord[];
}

export interface RegisterConfig<TRecord extends PersistedRegisterRecord = PersistedRegisterRecord> {
  kind: MvpRegisterKind;
  collection: RegisterCollectionName;
  basePath: string;
  breadcrumbs: string;
  title: string;
  recordLabel: string;
  pluralRecordLabel: string;
  summary: string;
  store: { subscribe: (run: (value: TRecord[]) => void) => () => void };
  load: () => void;
  create: (values: FormValues) => MaybePromise<TRecord>;
  update: (id: string, values: FormValues) => MaybePromise<TRecord>;
  validate: (values: FormValues) => Record<string, string | undefined>;
  getInitialValues: (record: TRecord | null, context: RegisterContext) => FormValues;
  fields: (context: RegisterContext) => RecordFormFieldConfig[];
  columns: (context: RegisterContext) => RegisterTableColumn<TRecord>[];
  detailSections: (record: TRecord, context: RegisterContext) => DetailSection[];
  relatedSections?: (record: TRecord, context: RegisterContext) => DetailSection[];
  relationshipSections?: (record: TRecord, context: RegisterContext) => RelationshipSection[];
  getRecordTitle: (record: TRecord) => string;
  getStatusLabel: (record: TRecord) => string;
  getStatusTone: (record: TRecord) => string;
  statusOptions: RecordFormFieldOption[];
  getStatusFilterValue: (record: TRecord) => string;
  emptyMessage: string;
  newActionLabel: string;
  saveLabel: string;
}

function option(value: string, label = value): RecordFormFieldOption {
  return { value, label };
}

function locationsById(context: RegisterContext) {
  return new Map(context.locations.map((location) => [location.id, location]));
}

function findingsById(context: RegisterContext) {
  return new Map(context.findings.map((finding) => [finding.id, finding]));
}

function processesById(context: RegisterContext) {
  return new Map(context.processes.map((process) => [process.id, process]));
}

function chemicalsById(context: RegisterContext) {
  return new Map(context.chemicals.map((chemical) => [chemical.id, chemical]));
}

function hazardsById(context: RegisterContext) {
  return new Map(context.hazards.map((hazard) => [hazard.id, hazard]));
}

function controlsById(context: RegisterContext) {
  return new Map(context.controls.map((control) => [control.id, control]));
}

function segsById(context: RegisterContext) {
  return new Map(context.segs.map((seg) => [seg.id, seg]));
}

function recordPath(kind: MvpRegisterKind, id: string) {
  return `${REGISTER_CONFIGS[kind].basePath}/${encodeURIComponent(id)}`;
}

function relatedItem(
  kind: MvpRegisterKind,
  record:
    | LocationRecord
    | ProcessRecord
    | EquipmentRecord
    | ChemicalRecord
    | HazardRecord
    | ControlRecord
    | RiskAssessmentRecord
    | SegRecord
    | FindingRecord
    | CorrectiveActionRecord,
  title: string,
  meta?: string,
): RelationshipItem {
  return {
    id: record.id,
    title,
    meta,
    href: recordPath(kind, record.id),
    archived: record.lifecycleStatus === "archived",
  };
}

function missingRelatedItem(id: string, title: string): RelationshipItem {
  return {
    id,
    title,
    meta: `Related record ID ${id} was not found.`,
    missing: true,
  };
}

function relationshipById<TRecord extends { id: string }>(
  id: string,
  recordsById: Map<string, TRecord>,
  kind: MvpRegisterKind,
  getTitle: (record: TRecord) => string,
  getMeta?: (record: TRecord) => string,
) {
  if (!id) {
    return [];
  }

  const record = recordsById.get(id);
  return record
    ? [
        {
          id: record.id,
          title: getTitle(record),
          meta: getMeta?.(record),
          href: recordPath(kind, record.id),
          archived: "lifecycleStatus" in record && record.lifecycleStatus === "archived",
        },
      ]
    : [missingRelatedItem(id, "Missing related record")];
}

function relationshipsByIds<TRecord extends { id: string }>(
  ids: string[],
  recordsById: Map<string, TRecord>,
  kind: MvpRegisterKind,
  getTitle: (record: TRecord) => string,
  getMeta?: (record: TRecord) => string,
) {
  return ids.flatMap((id) => relationshipById(id, recordsById, kind, getTitle, getMeta));
}

function commonUpdatedColumn<TRecord extends PersistedRegisterRecord>(): RegisterTableColumn<TRecord> {
  return {
    key: "updatedAt",
    label: "Updated",
    accessor: (record) => formatTimestamp(record.updatedAt),
    sortAccessor: (record) => record.updatedAt,
    sortable: true,
    searchable: false,
  };
}

export const REGISTER_CONFIGS: Record<MvpRegisterKind, RegisterConfig> = {
  locations: {
    kind: "locations",
    collection: "locations",
    basePath: "/operations/locations",
    breadcrumbs: "Operations",
    title: "Locations",
    recordLabel: "location",
    pluralRecordLabel: "locations",
    summary: "Manage persisted operational locations used by HSE workflows.",
    store: locationRecords,
    load: () => olusoApplication.listLocations(),
    create: (values) => olusoApplication.createLocation(valuesToLocationInput(values)) as PersistedRegisterRecord,
    update: (id, values) => olusoApplication.updateLocation(id, valuesToLocationInput(values)) as PersistedRegisterRecord,
    validate: (values) => olusoApplication.validateLocation(valuesToLocationInput(values)).errors,
    getInitialValues: (record) => ({
      name: (record as LocationRecord | null)?.name ?? "",
      type: (record as LocationRecord | null)?.type ?? "",
      status: (record as LocationRecord | null)?.status ?? "active",
      description: (record as LocationRecord | null)?.description ?? "",
    }),
    fields: () => [
      { name: "name", label: "Name", type: "text", required: true },
      {
        name: "type",
        label: "Type",
        type: "select",
        required: true,
        options: [option("", "Select type"), ...LOCATION_TYPES.map((type) => option(type))],
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: LOCATION_STATUSES.map((status) => option(status, status === "active" ? "Active" : "Inactive")),
      },
      { name: "description", label: "Description", type: "textarea", rows: 4 },
    ],
    columns: () => [
      {
        key: "name",
        label: "Name",
        accessor: (record) => (record as LocationRecord).name,
        descriptionAccessor: (record) => (record as LocationRecord).description,
        primary: true,
        sortable: true,
      },
      {
        key: "type",
        label: "Type",
        accessor: (record) => (record as LocationRecord).type,
        sortable: true,
      },
      {
        key: "status",
        label: "Status",
        accessor: (record) => ((record as LocationRecord).status === "active" ? "Active" : "Inactive"),
        toneAccessor: (record) => (record as LocationRecord).status,
        cellKind: "status",
        sortable: true,
      },
      commonUpdatedColumn(),
    ],
    detailSections: (record) => [
      {
        title: "Location fields",
        fields: [
          { label: "Name", value: (record as LocationRecord).name },
          { label: "Type", value: (record as LocationRecord).type },
          { label: "Domain status", value: (record as LocationRecord).status },
          { label: "Description", value: (record as LocationRecord).description },
        ],
      },
    ],
    relationshipSections: (record, context) => locationRelationshipSections(record as LocationRecord, context),
    getRecordTitle: (record) => (record as LocationRecord).name,
    getStatusLabel: (record) => ((record as LocationRecord).status === "active" ? "Active" : "Inactive"),
    getStatusTone: (record) => (record as LocationRecord).status,
    statusOptions: LOCATION_STATUSES.map((status) => option(status, status === "active" ? "Active" : "Inactive")),
    getStatusFilterValue: (record) => (record as LocationRecord).status,
    emptyMessage: "Add the first operational location to start using the Locations register.",
    newActionLabel: "Add new Location",
    saveLabel: "Save location",
  },
  findings: {
    kind: "findings",
    collection: "findings",
    basePath: "/field/findings",
    breadcrumbs: "Field Work",
    title: "Findings",
    recordLabel: "finding",
    pluralRecordLabel: "findings",
    summary: "Record and track HSE findings from observations, inspections, audits, and field work.",
    store: findingRecords,
    load: () => {
      olusoApplication.listLocations();
      olusoApplication.listFindings();
    },
    create: (values) => olusoApplication.createFinding(valuesToFindingInput(values)) as PersistedRegisterRecord,
    update: (id, values) => olusoApplication.updateFinding(id, valuesToFindingInput(values)) as PersistedRegisterRecord,
    validate: (values) => olusoApplication.validateFinding(valuesToFindingInput(values)).errors,
    getInitialValues: (record, context) => ({
      title: (record as FindingRecord | null)?.title ?? "",
      type: (record as FindingRecord | null)?.type ?? "",
      locationId: (record as FindingRecord | null)?.locationId ?? context.locations[0]?.id ?? "",
      processId: (record as FindingRecord | null)?.processId ?? "",
      hazardId: (record as FindingRecord | null)?.hazardId ?? "",
      severity: (record as FindingRecord | null)?.severity ?? "",
      status: (record as FindingRecord | null)?.status ?? "Open",
      reportedBy: (record as FindingRecord | null)?.reportedBy ?? "",
      description: (record as FindingRecord | null)?.description ?? "",
    }),
    fields: (context) => [
      { name: "title", label: "Title", type: "text", required: true },
      {
        name: "type",
        label: "Finding Type",
        type: "select",
        required: true,
        options: [option("", "Select finding type"), ...FINDING_TYPES.map((type) => option(type))],
      },
      {
        name: "locationId",
        label: "Location",
        type: "select",
        required: true,
        options: [option("", "Select location"), ...context.locations.map((location) => option(location.id, location.name))],
      },
      {
        name: "processId",
        label: "Related Process",
        type: "select",
        options: [option("", "No related process"), ...context.processes.map((process) => option(process.id, process.name))],
      },
      {
        name: "hazardId",
        label: "Related Hazard",
        type: "select",
        options: [option("", "No related hazard"), ...context.hazards.map((hazard) => option(hazard.id, hazard.title))],
      },
      {
        name: "severity",
        label: "Severity",
        type: "select",
        required: true,
        options: [option("", "Select severity"), ...FINDING_SEVERITIES.map((severity) => option(severity))],
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: FINDING_STATUSES.map((status) => option(status)),
      },
      { name: "reportedBy", label: "Reported by", type: "text" },
      { name: "description", label: "Description", type: "textarea", rows: 4 },
    ],
    columns: (context) => [
      {
        key: "severity",
        label: "Severity",
        accessor: (record) => (record as FindingRecord).severity,
        toneAccessor: (record) => getFindingSeverityTone((record as FindingRecord).severity),
        cellKind: "status",
        sortable: true,
      },
      {
        key: "title",
        label: "Title",
        accessor: (record) => (record as FindingRecord).title,
        descriptionAccessor: (record) => (record as FindingRecord).description,
        primary: true,
        sortable: true,
      },
      {
        key: "location",
        label: "Location",
        accessor: (record) =>
          locationsById(context).get((record as FindingRecord).locationId)?.name ?? "Unknown location",
        sortable: true,
      },
      {
        key: "status",
        label: "Status",
        accessor: (record) => (record as FindingRecord).status,
        toneAccessor: (record) => getFindingStatusTone((record as FindingRecord).status),
        cellKind: "status",
        sortable: true,
      },
      commonUpdatedColumn(),
    ],
    detailSections: (record, context) => [
      {
        title: "Finding fields",
        fields: [
          { label: "Title", value: (record as FindingRecord).title },
          { label: "Finding type", value: (record as FindingRecord).type },
          { label: "Severity", value: (record as FindingRecord).severity },
          { label: "Domain status", value: (record as FindingRecord).status },
          { label: "Reported by", value: (record as FindingRecord).reportedBy },
          { label: "Description", value: (record as FindingRecord).description },
        ],
      },
      {
        title: "Related fields",
        fields: [
          {
            label: "Location",
            value: locationsById(context).get((record as FindingRecord).locationId)?.name ?? "Unknown location",
          },
        ],
      },
    ],
    relationshipSections: (record, context) => findingRelationshipSections(record as FindingRecord, context),
    getRecordTitle: (record) => (record as FindingRecord).title,
    getStatusLabel: (record) => (record as FindingRecord).status,
    getStatusTone: (record) => getFindingStatusTone((record as FindingRecord).status),
    statusOptions: FINDING_STATUSES.map((status) => option(status)),
    getStatusFilterValue: (record) => (record as FindingRecord).status,
    emptyMessage: "Findings capture field observations, audit issues, near misses, and other HSE work that may need follow-up.",
    newActionLabel: "Add new Finding",
    saveLabel: "Save finding",
  },
  processes: makeProcessConfig(),
  equipment: makeEquipmentConfig(),
  chemicals: makeChemicalConfig(),
  hazards: makeHazardConfig(),
  controls: makeControlConfig(),
  "risk-assessments": makeRiskAssessmentConfig(),
  segs: makeSegConfig(),
  "corrective-actions": makeCorrectiveActionConfig(),
};

function makeProcessConfig(): RegisterConfig {
  return {
    kind: "processes",
    collection: "processes",
    basePath: "/operations/processes",
    breadcrumbs: "Operations",
    title: "Processes",
    recordLabel: "process",
    pluralRecordLabel: "processes",
    summary: "Document and manage operational processes linked to locations and HSE controls.",
    store: processRecords,
    load: () => {
      olusoApplication.listLocations();
      olusoApplication.listProcesses();
    },
    create: (values) => olusoApplication.createProcess(valuesToProcessInput(values)) as PersistedRegisterRecord,
    update: (id, values) => olusoApplication.updateProcess(id, valuesToProcessInput(values)) as PersistedRegisterRecord,
    validate: (values) => olusoApplication.validateProcess(valuesToProcessInput(values)).errors,
    getInitialValues: (record, context) => ({
      name: (record as ProcessRecord | null)?.name ?? "",
      locationId: (record as ProcessRecord | null)?.locationId ?? "",
      category: (record as ProcessRecord | null)?.category ?? "",
      status: (record as ProcessRecord | null)?.status ?? "active",
      description: (record as ProcessRecord | null)?.description ?? "",
    }),
    fields: (context) => [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "locationId", label: "Location", type: "select", options: [option("", "No related location"), ...context.locations.map((l) => option(l.id, l.name))] },
      { name: "category", label: "Category", type: "select", required: true, options: [option("", "Select category"), ...PROCESS_CATEGORIES.map((category) => option(category))] },
      { name: "status", label: "Status", type: "select", required: true, options: PROCESS_STATUSES.map((status) => option(status, getProcessStatusLabel(status))) },
      { name: "description", label: "Description", type: "textarea", rows: 4 },
    ],
    columns: (context) => [
      { key: "name", label: "Name", accessor: (record) => (record as ProcessRecord).name, descriptionAccessor: (record) => (record as ProcessRecord).description, primary: true, sortable: true },
      { key: "category", label: "Category", accessor: (record) => (record as ProcessRecord).category, sortable: true },
      { key: "location", label: "Location", accessor: (record) => locationsById(context).get((record as ProcessRecord).locationId)?.name ?? "Unknown location", sortable: true },
      { key: "status", label: "Status", accessor: (record) => getProcessStatusLabel((record as ProcessRecord).status), toneAccessor: (record) => getProcessStatusTone((record as ProcessRecord).status), cellKind: "status", sortable: true },
      commonUpdatedColumn(),
    ],
    detailSections: (record, context) => [
      { title: "Process fields", fields: [
        { label: "Name", value: (record as ProcessRecord).name },
        { label: "Category", value: (record as ProcessRecord).category },
        { label: "Domain status", value: getProcessStatusLabel((record as ProcessRecord).status) },
        { label: "Description", value: (record as ProcessRecord).description },
      ] },
      { title: "Related fields", fields: [
        { label: "Location", value: locationsById(context).get((record as ProcessRecord).locationId)?.name ?? "Unknown location" },
      ] },
    ],
    relationshipSections: (record, context) => processRelationshipSections(record as ProcessRecord, context),
    getRecordTitle: (record) => (record as ProcessRecord).name,
    getStatusLabel: (record) => getProcessStatusLabel((record as ProcessRecord).status),
    getStatusTone: (record) => getProcessStatusTone((record as ProcessRecord).status),
    statusOptions: PROCESS_STATUSES.map((status) => option(status, getProcessStatusLabel(status))),
    getStatusFilterValue: (record) => (record as ProcessRecord).status,
    emptyMessage: "Add the first operational process to start building the Processes register.",
    newActionLabel: "New Process",
    saveLabel: "Save process",
  };
}

function makeEquipmentConfig(): RegisterConfig {
  return {
    kind: "equipment",
    collection: "equipment",
    basePath: "/operations/equipment",
    breadcrumbs: "Operations",
    title: "Equipment",
    recordLabel: "equipment item",
    pluralRecordLabel: "equipment items",
    summary: "Track HSE-relevant equipment linked to locations and operational processes.",
    store: equipmentRecords,
    load: () => {
      olusoApplication.listLocations();
      olusoApplication.listProcesses();
      olusoApplication.listEquipment();
    },
    create: (values) => olusoApplication.createEquipment(valuesToEquipmentInput(values)) as PersistedRegisterRecord,
    update: (id, values) => olusoApplication.updateEquipment(id, valuesToEquipmentInput(values)) as PersistedRegisterRecord,
    validate: (values) => olusoApplication.validateEquipment(valuesToEquipmentInput(values)).errors,
    getInitialValues: (record, context) => ({
      name: (record as EquipmentRecord | null)?.name ?? "",
      type: (record as EquipmentRecord | null)?.type ?? "",
      locationId: (record as EquipmentRecord | null)?.locationId ?? context.locations[0]?.id ?? "",
      processId: (record as EquipmentRecord | null)?.processId ?? "",
      status: (record as EquipmentRecord | null)?.status ?? "active",
      description: (record as EquipmentRecord | null)?.description ?? "",
      notes: (record as EquipmentRecord | null)?.notes ?? "",
    }),
    fields: (context) => [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "type", label: "Equipment Type", type: "select", required: true, options: [option("", "Select equipment type"), ...EQUIPMENT_TYPES.map((type) => option(type))] },
      { name: "locationId", label: "Location", type: "select", required: true, options: [option("", "Select location"), ...context.locations.map((location) => option(location.id, location.name))] },
      { name: "processId", label: "Related Process", type: "select", options: [option("", "No related process"), ...context.processes.map((process) => option(process.id, process.name))] },
      { name: "status", label: "Status", type: "select", required: true, options: EQUIPMENT_STATUSES.map((status) => option(status, getEquipmentStatusLabel(status))) },
      { name: "description", label: "Description", type: "textarea", rows: 4 },
      { name: "notes", label: "Notes", type: "textarea", rows: 4 },
    ],
    columns: (context) => [
      { key: "name", label: "Name", accessor: (record) => (record as EquipmentRecord).name, descriptionAccessor: (record) => (record as EquipmentRecord).description, primary: true, sortable: true },
      { key: "type", label: "Type", accessor: (record) => (record as EquipmentRecord).type, sortable: true },
      { key: "location", label: "Location", accessor: (record) => locationsById(context).get((record as EquipmentRecord).locationId)?.name ?? "Unknown location", sortable: true },
      { key: "process", label: "Process", accessor: (record) => processesById(context).get((record as EquipmentRecord).processId)?.name ?? "No related process", sortable: true },
      { key: "status", label: "Status", accessor: (record) => getEquipmentStatusLabel((record as EquipmentRecord).status), toneAccessor: (record) => getEquipmentStatusTone((record as EquipmentRecord).status), cellKind: "status", sortable: true },
      commonUpdatedColumn(),
    ],
    detailSections: (record, context) => [
      { title: "Equipment fields", fields: [
        { label: "Name", value: (record as EquipmentRecord).name },
        { label: "Equipment Type", value: (record as EquipmentRecord).type },
        { label: "Domain status", value: getEquipmentStatusLabel((record as EquipmentRecord).status) },
        { label: "Description", value: (record as EquipmentRecord).description },
        { label: "Notes", value: (record as EquipmentRecord).notes },
      ] },
      { title: "Related fields", fields: [
        { label: "Location", value: locationsById(context).get((record as EquipmentRecord).locationId)?.name ?? "Unknown location" },
        { label: "Process", value: processesById(context).get((record as EquipmentRecord).processId)?.name ?? "No related process" },
      ] },
    ],
    relationshipSections: (record, context) => equipmentRelationshipSections(record as EquipmentRecord, context),
    getRecordTitle: (record) => (record as EquipmentRecord).name,
    getStatusLabel: (record) => getEquipmentStatusLabel((record as EquipmentRecord).status),
    getStatusTone: (record) => getEquipmentStatusTone((record as EquipmentRecord).status),
    statusOptions: EQUIPMENT_STATUSES.map((status) => option(status, getEquipmentStatusLabel(status))),
    getStatusFilterValue: (record) => (record as EquipmentRecord).status,
    emptyMessage: "Add the first HSE-relevant equipment item to link assets to locations, processes, and downstream safety work.",
    newActionLabel: "New Equipment",
    saveLabel: "Save equipment",
  };
}

function makeChemicalConfig(): RegisterConfig {
  return {
    kind: "chemicals",
    collection: "chemicals",
    basePath: "/hse/chemicals",
    breadcrumbs: "HSE Registers",
    title: "Chemicals",
    recordLabel: "chemical",
    pluralRecordLabel: "chemicals",
    summary: "Track chemical substances, hazard classifications, and storage locations.",
    store: chemicalRecords,
    load: () => {
      olusoApplication.listLocations();
      olusoApplication.listChemicals();
    },
    create: (values) => olusoApplication.createChemical(valuesToChemicalInput(values)) as PersistedRegisterRecord,
    update: (id, values) => olusoApplication.updateChemical(id, valuesToChemicalInput(values)) as PersistedRegisterRecord,
    validate: (values) => olusoApplication.validateChemical(valuesToChemicalInput(values)).errors,
    getInitialValues: (record, context) => ({
      name: (record as ChemicalRecord | null)?.name ?? "",
      casNumber: (record as ChemicalRecord | null)?.casNumber ?? "",
      hazardClass: (record as ChemicalRecord | null)?.hazardClass ?? "Unknown",
      processIds: ((record as ChemicalRecord | null)?.processIds ?? []).join("|"),
      storageLocationId: (record as ChemicalRecord | null)?.storageLocationId ?? context.locations[0]?.id ?? "",
      sdsStatus: (record as ChemicalRecord | null)?.sdsStatus ?? "Missing",
      sdsReference: (record as ChemicalRecord | null)?.sdsReference ?? "",
      sdsRevisionDate: (record as ChemicalRecord | null)?.sdsRevisionDate ?? "",
      sdsReviewDate: (record as ChemicalRecord | null)?.sdsReviewDate ?? "",
      exposureLimitValue: (record as ChemicalRecord | null)?.exposureLimitValue ?? "",
      exposureLimitUnit: (record as ChemicalRecord | null)?.exposureLimitUnit ?? "",
      exposureLimitSource: (record as ChemicalRecord | null)?.exposureLimitSource ?? "",
      exposureLimitAveragingPeriod: (record as ChemicalRecord | null)?.exposureLimitAveragingPeriod ?? "",
      quantity: (record as ChemicalRecord | null)?.quantity ?? "",
      unit: (record as ChemicalRecord | null)?.unit ?? "",
      supplier: (record as ChemicalRecord | null)?.supplier ?? "",
      status: (record as ChemicalRecord | null)?.status ?? "active",
      notes: (record as ChemicalRecord | null)?.notes ?? "",
    }),
    fields: (context) => [
      { name: "name", label: "Chemical Name", type: "text", required: true },
      { name: "casNumber", label: "CAS Number", type: "text", placeholder: "e.g. 67-64-1" },
      { name: "hazardClass", label: "Classification", type: "select", required: true, options: CHEMICAL_HAZARD_CLASSES.map((hazardClass) => option(hazardClass)) },
      { name: "processIds", label: "Related Processes", type: "multiselect", helperText: "Optional. Select all processes that use or generate this chemical.", options: context.processes.map((process) => option(process.id, process.name)) },
      { name: "storageLocationId", label: "Storage Location", type: "select", required: true, options: [option("", "Select location"), ...context.locations.map((l) => option(l.id, l.name))] },
      { name: "sdsStatus", label: "SDS Status", type: "select", required: true, options: CHEMICAL_SDS_STATUSES.map((status) => option(status)) },
      { name: "sdsReference", label: "SDS Reference", type: "text" },
      { name: "sdsRevisionDate", label: "SDS Revision Date", type: "text", placeholder: "YYYY-MM-DD" },
      { name: "sdsReviewDate", label: "SDS Review Date", type: "text", placeholder: "YYYY-MM-DD" },
      { name: "exposureLimitValue", label: "Exposure Limit", type: "text" },
      { name: "exposureLimitUnit", label: "Exposure Limit Unit", type: "text", placeholder: "ppm, mg/m3" },
      { name: "exposureLimitSource", label: "Exposure Limit Source", type: "text" },
      { name: "exposureLimitAveragingPeriod", label: "Averaging Period", type: "text", placeholder: "8-hour TWA, STEL, Ceiling" },
      { name: "quantity", label: "Quantity", type: "text" },
      { name: "unit", label: "Unit", type: "text" },
      { name: "supplier", label: "Supplier", type: "text" },
      { name: "status", label: "Status", type: "select", required: true, options: CHEMICAL_STATUSES.map((status) => option(status, status.charAt(0).toUpperCase() + status.slice(1))) },
      { name: "notes", label: "Notes", type: "textarea", rows: 4 },
    ],
    columns: (context) => [
      { key: "name", label: "Name", accessor: (record) => (record as ChemicalRecord).name, descriptionAccessor: (record) => (record as ChemicalRecord).casNumber, primary: true, sortable: true },
      { key: "hazardClass", label: "Hazard", accessor: (record) => (record as ChemicalRecord).hazardClass, toneAccessor: (record) => getChemicalHazardTone((record as ChemicalRecord).hazardClass), cellKind: "status", sortable: true },
      { key: "sdsStatus", label: "SDS", accessor: (record) => (record as ChemicalRecord).sdsStatus, toneAccessor: (record) => getChemicalSdsStatusTone((record as ChemicalRecord).sdsStatus), cellKind: "status", sortable: true },
      { key: "location", label: "Storage", accessor: (record) => locationsById(context).get((record as ChemicalRecord).storageLocationId)?.name ?? "Unknown location", sortable: true },
      { key: "status", label: "Status", accessor: (record) => (record as ChemicalRecord).status, toneAccessor: (record) => getChemicalStatusTone((record as ChemicalRecord).status), cellKind: "status", sortable: true },
      commonUpdatedColumn(),
    ],
    detailSections: (record, context) => [
      { title: "Chemical fields", fields: [
        { label: "Name", value: (record as ChemicalRecord).name },
        { label: "CAS Number", value: (record as ChemicalRecord).casNumber },
        { label: "Classification", value: (record as ChemicalRecord).hazardClass },
        { label: "SDS Status", value: (record as ChemicalRecord).sdsStatus },
        { label: "SDS Reference", value: (record as ChemicalRecord).sdsReference },
        { label: "SDS Revision Date", value: (record as ChemicalRecord).sdsRevisionDate },
        { label: "SDS Review Date", value: (record as ChemicalRecord).sdsReviewDate },
        { label: "Exposure Limit", value: `${(record as ChemicalRecord).exposureLimitValue} ${(record as ChemicalRecord).exposureLimitUnit}`.trim() },
        { label: "Exposure Limit Source", value: (record as ChemicalRecord).exposureLimitSource },
        { label: "Averaging Period", value: (record as ChemicalRecord).exposureLimitAveragingPeriod },
        { label: "Quantity", value: `${(record as ChemicalRecord).quantity} ${(record as ChemicalRecord).unit}`.trim() },
        { label: "Supplier", value: (record as ChemicalRecord).supplier },
        { label: "Domain status", value: (record as ChemicalRecord).status },
        { label: "Notes", value: (record as ChemicalRecord).notes },
      ] },
      { title: "Related fields", fields: [
        { label: "Storage location", value: locationsById(context).get((record as ChemicalRecord).storageLocationId)?.name ?? "Unknown location" },
      ] },
    ],
    relationshipSections: (record, context) => chemicalRelationshipSections(record as ChemicalRecord, context),
    getRecordTitle: (record) => (record as ChemicalRecord).name,
    getStatusLabel: (record) => (record as ChemicalRecord).status,
    getStatusTone: (record) => getChemicalStatusTone((record as ChemicalRecord).status),
    statusOptions: CHEMICAL_STATUSES.map((status) => option(status, status.charAt(0).toUpperCase() + status.slice(1))),
    getStatusFilterValue: (record) => (record as ChemicalRecord).status,
    emptyMessage: "Add the first chemical to start building the chemical inventory.",
    newActionLabel: "Add Chemical",
    saveLabel: "Save chemical",
  };
}

function makeHazardConfig(): RegisterConfig {
  return {
    kind: "hazards",
    collection: "hazards",
    basePath: "/hse/hazards",
    breadcrumbs: "HSE Registers",
    title: "Hazards",
    recordLabel: "hazard",
    pluralRecordLabel: "hazards",
    summary: "Identify, assess, and control workplace hazards across all locations.",
    store: hazardRecords,
    load: () => {
      olusoApplication.listLocations();
      olusoApplication.listHazards();
    },
    create: (values) => olusoApplication.createHazard(valuesToHazardInput(values)) as PersistedRegisterRecord,
    update: (id, values) => olusoApplication.updateHazard(id, valuesToHazardInput(values)) as PersistedRegisterRecord,
    validate: (values) => olusoApplication.validateHazard(valuesToHazardInput(values)).errors,
    getInitialValues: (record, context) => ({
      title: (record as HazardRecord | null)?.title ?? "",
      category: (record as HazardRecord | null)?.category ?? "",
      locationId: (record as HazardRecord | null)?.locationId ?? context.locations[0]?.id ?? "",
      locationIds: ((record as HazardRecord | null)?.locationIds ?? []).join("|"),
      processIds: ((record as HazardRecord | null)?.processIds ?? []).join("|"),
      chemicalIds: ((record as HazardRecord | null)?.chemicalIds ?? []).join("|"),
      severity: (record as HazardRecord | null)?.severity ?? "",
      likelihood: (record as HazardRecord | null)?.likelihood ?? "",
      status: (record as HazardRecord | null)?.status ?? "active",
      description: (record as HazardRecord | null)?.description ?? "",
      controls: (record as HazardRecord | null)?.controls ?? "",
    }),
    fields: (context) => [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "category", label: "Category", type: "select", required: true, options: [option("", "Select category"), ...HAZARD_CATEGORIES.map((category) => option(category))] },
      { name: "locationId", label: "Location", type: "select", required: true, options: [option("", "Select location"), ...context.locations.map((l) => option(l.id, l.name))] },
      { name: "locationIds", label: "Additional Related Locations", type: "multiselect", options: context.locations.map((location) => option(location.id, location.name)) },
      { name: "processIds", label: "Related Processes", type: "multiselect", options: context.processes.map((process) => option(process.id, process.name)) },
      { name: "chemicalIds", label: "Related Chemicals", type: "multiselect", options: context.chemicals.map((chemical) => option(chemical.id, chemical.name)) },
      { name: "severity", label: "Severity", type: "select", required: true, options: [option("", "Select severity"), ...HAZARD_SEVERITIES.map((severity) => option(severity))] },
      { name: "likelihood", label: "Likelihood", type: "select", required: true, options: [option("", "Select likelihood"), ...HAZARD_LIKELIHOODS.map((likelihood) => option(likelihood))] },
      { name: "status", label: "Status", type: "select", required: true, options: HAZARD_STATUSES.map((status) => option(status, getHazardStatusLabel(status))) },
      { name: "description", label: "Description", type: "textarea", rows: 4 },
      { name: "controls", label: "Controls", type: "textarea", rows: 4 },
    ],
    columns: (context) => [
      { key: "severity", label: "Severity", accessor: (record) => (record as HazardRecord).severity, toneAccessor: (record) => getHazardSeverityTone((record as HazardRecord).severity), cellKind: "status", sortable: true },
      { key: "title", label: "Title", accessor: (record) => (record as HazardRecord).title, descriptionAccessor: (record) => (record as HazardRecord).description, primary: true, sortable: true },
      { key: "category", label: "Category", accessor: (record) => (record as HazardRecord).category, sortable: true },
      { key: "location", label: "Location", accessor: (record) => locationsById(context).get((record as HazardRecord).locationId)?.name ?? "Unknown location", sortable: true },
      { key: "status", label: "Status", accessor: (record) => getHazardStatusLabel((record as HazardRecord).status), toneAccessor: (record) => getHazardStatusTone((record as HazardRecord).status), cellKind: "status", sortable: true },
      commonUpdatedColumn(),
    ],
    detailSections: (record, context) => [
      { title: "Hazard fields", fields: [
        { label: "Title", value: (record as HazardRecord).title },
        { label: "Category", value: (record as HazardRecord).category },
        { label: "Severity", value: (record as HazardRecord).severity },
        { label: "Likelihood", value: (record as HazardRecord).likelihood },
        { label: "Domain status", value: getHazardStatusLabel((record as HazardRecord).status) },
        { label: "Description", value: (record as HazardRecord).description },
        { label: "Controls", value: (record as HazardRecord).controls },
      ] },
      { title: "Related fields", fields: [
        { label: "Location", value: locationsById(context).get((record as HazardRecord).locationId)?.name ?? "Unknown location" },
      ] },
    ],
    relationshipSections: (record, context) => hazardRelationshipSections(record as HazardRecord, context),
    getRecordTitle: (record) => (record as HazardRecord).title,
    getStatusLabel: (record) => getHazardStatusLabel((record as HazardRecord).status),
    getStatusTone: (record) => getHazardStatusTone((record as HazardRecord).status),
    statusOptions: HAZARD_STATUSES.map((status) => option(status, getHazardStatusLabel(status))),
    getStatusFilterValue: (record) => (record as HazardRecord).status,
    emptyMessage: "Add the first hazard to start assessing workplace risk.",
    newActionLabel: "New Hazard",
    saveLabel: "Save hazard",
  };
}

function makeControlConfig(): RegisterConfig {
  return {
    kind: "controls",
    collection: "controls",
    basePath: "/risk/controls",
    breadcrumbs: "Risk Management",
    title: "Controls",
    recordLabel: "control",
    pluralRecordLabel: "controls",
    summary: "Track controls linked to hazards with verification expectations.",
    store: controlRecords,
    load: () => {
      olusoApplication.listHazards();
      olusoApplication.listControls();
      olusoApplication.listRiskAssessments();
    },
    create: (values) => olusoApplication.createControl(valuesToControlInput(values)) as PersistedRegisterRecord,
    update: (id, values) => olusoApplication.updateControl(id, valuesToControlInput(values)) as PersistedRegisterRecord,
    validate: (values) => olusoApplication.validateControl(valuesToControlInput(values)).errors,
    getInitialValues: (record) => ({
      name: (record as ControlRecord | null)?.name ?? "",
      type: (record as ControlRecord | null)?.type ?? "",
      hazardIds: ((record as ControlRecord | null)?.hazardIds ?? []).join("|"),
      owner: (record as ControlRecord | null)?.owner ?? "",
      verificationMethod: (record as ControlRecord | null)?.verificationMethod ?? "",
      verificationFrequency: (record as ControlRecord | null)?.verificationFrequency ?? "",
      lastVerifiedAt: (record as ControlRecord | null)?.lastVerifiedAt ?? "",
      status: (record as ControlRecord | null)?.status ?? "needs-review",
      description: (record as ControlRecord | null)?.description ?? "",
      notes: (record as ControlRecord | null)?.notes ?? "",
    }),
    fields: (context) => [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "type", label: "Control Type", type: "select", required: true, options: [option("", "Select control type"), ...CONTROL_TYPES.map((type) => option(type))] },
      { name: "hazardIds", label: "Related Hazards", type: "multiselect", required: true, options: context.hazards.map((hazard) => option(hazard.id, hazard.title)) },
      { name: "owner", label: "Owner", type: "text" },
      { name: "verificationMethod", label: "Verification Method", type: "text" },
      { name: "verificationFrequency", label: "Verification Frequency", type: "text" },
      { name: "lastVerifiedAt", label: "Last Verified", type: "text", placeholder: "YYYY-MM-DD" },
      { name: "status", label: "Status", type: "select", required: true, options: CONTROL_STATUSES.map((status) => option(status, getControlStatusLabel(status))) },
      { name: "description", label: "Description", type: "textarea", rows: 4 },
      { name: "notes", label: "Notes", type: "textarea", rows: 4 },
    ],
    columns: () => [
      { key: "name", label: "Name", accessor: (record) => (record as ControlRecord).name, descriptionAccessor: (record) => (record as ControlRecord).description, primary: true, sortable: true },
      { key: "type", label: "Type", accessor: (record) => (record as ControlRecord).type, sortable: true },
      { key: "verificationFrequency", label: "Verification", accessor: (record) => (record as ControlRecord).verificationFrequency || "Not set", sortable: true },
      { key: "status", label: "Status", accessor: (record) => getControlStatusLabel((record as ControlRecord).status), toneAccessor: (record) => getControlStatusTone((record as ControlRecord).status), cellKind: "status", sortable: true },
      commonUpdatedColumn(),
    ],
    detailSections: (record) => [
      { title: "Control fields", fields: [
        { label: "Name", value: (record as ControlRecord).name },
        { label: "Control Type", value: (record as ControlRecord).type },
        { label: "Owner", value: (record as ControlRecord).owner },
        { label: "Verification Method", value: (record as ControlRecord).verificationMethod },
        { label: "Verification Frequency", value: (record as ControlRecord).verificationFrequency },
        { label: "Last Verified", value: (record as ControlRecord).lastVerifiedAt },
        { label: "Domain status", value: getControlStatusLabel((record as ControlRecord).status) },
        { label: "Description", value: (record as ControlRecord).description },
        { label: "Notes", value: (record as ControlRecord).notes },
      ] },
    ],
    relationshipSections: (record, context) => controlRelationshipSections(record as ControlRecord, context),
    getRecordTitle: (record) => (record as ControlRecord).name,
    getStatusLabel: (record) => getControlStatusLabel((record as ControlRecord).status),
    getStatusTone: (record) => getControlStatusTone((record as ControlRecord).status),
    statusOptions: CONTROL_STATUSES.map((status) => option(status, getControlStatusLabel(status))),
    getStatusFilterValue: (record) => (record as ControlRecord).status,
    emptyMessage: "Add the first control to connect hazard mitigation and verification work.",
    newActionLabel: "New Control",
    saveLabel: "Save control",
  };
}

function makeRiskAssessmentConfig(): RegisterConfig {
  return {
    kind: "risk-assessments",
    collection: "riskAssessments",
    basePath: "/risk/assessments",
    breadcrumbs: "Risk Management",
    title: "Risk Assessments",
    recordLabel: "risk assessment",
    pluralRecordLabel: "risk assessments",
    summary: "Assess hazards with linked controls, residual risk, and review state.",
    store: riskAssessmentRecords,
    load: () => {
      olusoApplication.listHazards();
      olusoApplication.listControls();
      olusoApplication.listRiskAssessments();
    },
    create: (values) => olusoApplication.createRiskAssessment(valuesToRiskAssessmentInput(values)) as PersistedRegisterRecord,
    update: (id, values) => olusoApplication.updateRiskAssessment(id, valuesToRiskAssessmentInput(values)) as PersistedRegisterRecord,
    validate: (values) => olusoApplication.validateRiskAssessment(valuesToRiskAssessmentInput(values)).errors,
    getInitialValues: (record, context) => ({
      title: (record as RiskAssessmentRecord | null)?.title ?? "",
      hazardId: (record as RiskAssessmentRecord | null)?.hazardId ?? context.hazards[0]?.id ?? "",
      controlIds: ((record as RiskAssessmentRecord | null)?.controlIds ?? []).join("|"),
      inherentSeverity: (record as RiskAssessmentRecord | null)?.inherentSeverity ?? "",
      inherentLikelihood: (record as RiskAssessmentRecord | null)?.inherentLikelihood ?? "",
      residualSeverity: (record as RiskAssessmentRecord | null)?.residualSeverity ?? "",
      residualLikelihood: (record as RiskAssessmentRecord | null)?.residualLikelihood ?? "",
      assessor: (record as RiskAssessmentRecord | null)?.assessor ?? "",
      reviewStatus: (record as RiskAssessmentRecord | null)?.reviewStatus ?? "Draft",
      nextReviewDate: (record as RiskAssessmentRecord | null)?.nextReviewDate ?? "",
      notes: (record as RiskAssessmentRecord | null)?.notes ?? "",
    }),
    fields: (context) => [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "hazardId", label: "Related Hazard", type: "select", required: true, options: [option("", "Select hazard"), ...context.hazards.map((hazard) => option(hazard.id, hazard.title))] },
      { name: "controlIds", label: "Applied Controls", type: "multiselect", options: context.controls.map((control) => option(control.id, control.name)) },
      { name: "inherentSeverity", label: "Inherent Severity", type: "select", required: true, options: [option("", "Select severity"), ...HAZARD_SEVERITIES.map((severity) => option(severity))] },
      { name: "inherentLikelihood", label: "Inherent Likelihood", type: "select", required: true, options: [option("", "Select likelihood"), ...HAZARD_LIKELIHOODS.map((likelihood) => option(likelihood))] },
      { name: "residualSeverity", label: "Residual Severity", type: "select", required: true, options: [option("", "Select severity"), ...HAZARD_SEVERITIES.map((severity) => option(severity))] },
      { name: "residualLikelihood", label: "Residual Likelihood", type: "select", required: true, options: [option("", "Select likelihood"), ...HAZARD_LIKELIHOODS.map((likelihood) => option(likelihood))] },
      { name: "assessor", label: "Assessor", type: "text" },
      { name: "reviewStatus", label: "Review Status", type: "select", required: true, options: RISK_ASSESSMENT_STATUSES.map((status) => option(status)) },
      { name: "nextReviewDate", label: "Next Review Date", type: "text", placeholder: "YYYY-MM-DD" },
      { name: "notes", label: "Notes", type: "textarea", rows: 4 },
    ],
    columns: (context) => [
      { key: "title", label: "Title", accessor: (record) => (record as RiskAssessmentRecord).title, descriptionAccessor: (record) => (record as RiskAssessmentRecord).notes, primary: true, sortable: true },
      { key: "hazard", label: "Hazard", accessor: (record) => hazardsById(context).get((record as RiskAssessmentRecord).hazardId)?.title ?? "Unknown hazard", sortable: true },
      { key: "residualRisk", label: "Residual", accessor: (record) => `${(record as RiskAssessmentRecord).residualSeverity} / ${(record as RiskAssessmentRecord).residualLikelihood}`, sortable: true },
      { key: "reviewStatus", label: "Review", accessor: (record) => (record as RiskAssessmentRecord).reviewStatus, toneAccessor: (record) => getRiskAssessmentStatusTone((record as RiskAssessmentRecord).reviewStatus), cellKind: "status", sortable: true },
      commonUpdatedColumn(),
    ],
    detailSections: (record, context) => [
      { title: "Risk assessment fields", fields: [
        { label: "Title", value: (record as RiskAssessmentRecord).title },
        { label: "Hazard", value: hazardsById(context).get((record as RiskAssessmentRecord).hazardId)?.title ?? "Unknown hazard" },
        { label: "Inherent Risk", value: `${(record as RiskAssessmentRecord).inherentSeverity} / ${(record as RiskAssessmentRecord).inherentLikelihood}` },
        { label: "Residual Risk", value: `${(record as RiskAssessmentRecord).residualSeverity} / ${(record as RiskAssessmentRecord).residualLikelihood}` },
        { label: "Assessor", value: (record as RiskAssessmentRecord).assessor },
        { label: "Review Status", value: (record as RiskAssessmentRecord).reviewStatus },
        { label: "Next Review Date", value: (record as RiskAssessmentRecord).nextReviewDate },
        { label: "Notes", value: (record as RiskAssessmentRecord).notes },
      ] },
    ],
    relationshipSections: (record, context) => riskAssessmentRelationshipSections(record as RiskAssessmentRecord, context),
    getRecordTitle: (record) => (record as RiskAssessmentRecord).title,
    getStatusLabel: (record) => (record as RiskAssessmentRecord).reviewStatus,
    getStatusTone: (record) => getRiskAssessmentStatusTone((record as RiskAssessmentRecord).reviewStatus),
    statusOptions: RISK_ASSESSMENT_STATUSES.map((status) => option(status)),
    getStatusFilterValue: (record) => (record as RiskAssessmentRecord).reviewStatus,
    emptyMessage: "Add the first risk assessment to document residual risk and review state.",
    newActionLabel: "New Risk Assessment",
    saveLabel: "Save risk assessment",
  };
}

function makeSegConfig(): RegisterConfig {
  return {
    kind: "segs",
    collection: "segs",
    basePath: "/hse/segs",
    breadcrumbs: "HSE Registers",
    title: "SEGs",
    recordLabel: "SEG",
    pluralRecordLabel: "SEGs",
    summary: "Define Similar Exposure Groups for occupational hygiene monitoring and control.",
    store: segRecords,
    load: () => {
      olusoApplication.listLocations();
      olusoApplication.listSegs();
    },
    create: (values) => olusoApplication.createSeg(valuesToSegInput(values)) as PersistedRegisterRecord,
    update: (id, values) => olusoApplication.updateSeg(id, valuesToSegInput(values)) as PersistedRegisterRecord,
    validate: (values) => olusoApplication.validateSeg(valuesToSegInput(values)).errors,
    getInitialValues: (record, context) => ({
      name: (record as SegRecord | null)?.name ?? "",
      type: (record as SegRecord | null)?.type ?? "",
      locationId: (record as SegRecord | null)?.locationId ?? context.locations[0]?.id ?? "",
      processId: (record as SegRecord | null)?.processId ?? "",
      chemicalIds: ((record as SegRecord | null)?.chemicalIds ?? []).join("|"),
      hazardIds: ((record as SegRecord | null)?.hazardIds ?? []).join("|"),
      agentType: (record as SegRecord | null)?.agentType ?? "",
      exposureLevel: (record as SegRecord | null)?.exposureLevel ?? "",
      workerCount: (record as SegRecord | null)?.workerCount ?? "",
      monitoringFrequency: (record as SegRecord | null)?.monitoringFrequency ?? "",
      status: (record as SegRecord | null)?.status ?? "active",
      description: (record as SegRecord | null)?.description ?? "",
      controls: (record as SegRecord | null)?.controls ?? "",
    }),
    fields: (context) => [
      { name: "name", label: "Name", type: "text", required: true },
      { name: "type", label: "SEG Type", type: "select", required: true, options: [option("", "Select SEG type"), ...SEG_TYPES.map((type) => option(type))] },
      { name: "locationId", label: "Location", type: "select", required: true, options: [option("", "Select location"), ...context.locations.map((l) => option(l.id, l.name))] },
      { name: "processId", label: "Related Process", type: "select", options: [option("", "No related process"), ...context.processes.map((process) => option(process.id, process.name))] },
      { name: "chemicalIds", label: "Related Chemicals", type: "multiselect", options: context.chemicals.map((chemical) => option(chemical.id, chemical.name)) },
      { name: "hazardIds", label: "Related Hazards", type: "multiselect", options: context.hazards.map((hazard) => option(hazard.id, hazard.title)) },
      { name: "agentType", label: "Agent Type", type: "text", required: true },
      { name: "exposureLevel", label: "Exposure Level", type: "select", required: true, options: [option("", "Select exposure level"), ...EXPOSURE_LEVELS.map((level) => option(level))] },
      { name: "workerCount", label: "Worker Count", type: "text" },
      { name: "monitoringFrequency", label: "Monitoring Frequency", type: "select", options: [option("", "Select frequency"), ...MONITORING_FREQUENCIES.map((frequency) => option(frequency))] },
      { name: "status", label: "Status", type: "select", required: true, options: SEG_STATUSES.map((status) => option(status, getSegStatusLabel(status))) },
      { name: "description", label: "Description", type: "textarea", rows: 4 },
      { name: "controls", label: "Controls", type: "textarea", rows: 4 },
    ],
    columns: (context) => [
      { key: "name", label: "Name", accessor: (record) => (record as SegRecord).name, descriptionAccessor: (record) => (record as SegRecord).description, primary: true, sortable: true },
      { key: "agentType", label: "Agent", accessor: (record) => (record as SegRecord).agentType, sortable: true },
      { key: "location", label: "Location", accessor: (record) => locationsById(context).get((record as SegRecord).locationId)?.name ?? "Unknown location", sortable: true },
      { key: "exposureLevel", label: "Exposure", accessor: (record) => (record as SegRecord).exposureLevel, toneAccessor: (record) => getExposureLevelTone((record as SegRecord).exposureLevel), cellKind: "status", sortable: true },
      { key: "status", label: "Status", accessor: (record) => getSegStatusLabel((record as SegRecord).status), toneAccessor: (record) => getSegStatusTone((record as SegRecord).status), cellKind: "status", sortable: true },
      commonUpdatedColumn(),
    ],
    detailSections: (record, context) => [
      { title: "SEG fields", fields: [
        { label: "Name", value: (record as SegRecord).name },
        { label: "SEG Type", value: (record as SegRecord).type },
        { label: "Agent Type", value: (record as SegRecord).agentType },
        { label: "Exposure Level", value: (record as SegRecord).exposureLevel },
        { label: "Worker Count", value: (record as SegRecord).workerCount },
        { label: "Monitoring Frequency", value: (record as SegRecord).monitoringFrequency },
        { label: "Domain status", value: getSegStatusLabel((record as SegRecord).status) },
        { label: "Description", value: (record as SegRecord).description },
        { label: "Controls", value: (record as SegRecord).controls },
      ] },
      { title: "Related fields", fields: [
        { label: "Location", value: locationsById(context).get((record as SegRecord).locationId)?.name ?? "Unknown location" },
      ] },
    ],
    relationshipSections: (record, context) => segRelationshipSections(record as SegRecord, context),
    getRecordTitle: (record) => (record as SegRecord).name,
    getStatusLabel: (record) => getSegStatusLabel((record as SegRecord).status),
    getStatusTone: (record) => getSegStatusTone((record as SegRecord).status),
    statusOptions: SEG_STATUSES.map((status) => option(status, getSegStatusLabel(status))),
    getStatusFilterValue: (record) => (record as SegRecord).status,
    emptyMessage: "Add the first SEG to start grouping similar exposure profiles.",
    newActionLabel: "New SEG",
    saveLabel: "Save SEG",
  };
}

function makeCorrectiveActionConfig(): RegisterConfig {
  return {
    kind: "corrective-actions",
    collection: "correctiveActions",
    basePath: "/actions/corrective-actions",
    breadcrumbs: "Actions",
    title: "Corrective Actions",
    recordLabel: "corrective action",
    pluralRecordLabel: "corrective actions",
    summary: "Manage corrective actions linked to findings, track status and due dates.",
    store: correctiveActionRecords,
    load: () => {
      olusoApplication.listFindings();
      olusoApplication.listCorrectiveActions();
    },
    create: (values) => olusoApplication.createCorrectiveAction(valuesToCorrectiveActionInput(values)) as PersistedRegisterRecord,
    update: (id, values) => olusoApplication.updateCorrectiveAction(id, valuesToCorrectiveActionInput(values)) as PersistedRegisterRecord,
    validate: (values) => olusoApplication.validateCorrectiveAction(valuesToCorrectiveActionInput(values)).errors,
    getInitialValues: (record, context) => ({
      title: (record as CorrectiveActionRecord | null)?.title ?? "",
      type: (record as CorrectiveActionRecord | null)?.type ?? "",
      sourceType: (record as CorrectiveActionRecord | null)?.sourceType ?? "Finding",
      sourceId:
        (record as CorrectiveActionRecord | null)?.sourceId ??
        (record as CorrectiveActionRecord | null)?.findingId ??
        context.findings[0]?.id ??
        "",
      sourceJustification: (record as CorrectiveActionRecord | null)?.sourceJustification ?? "",
      assignedTo: (record as CorrectiveActionRecord | null)?.assignedTo ?? "",
      priority: (record as CorrectiveActionRecord | null)?.priority ?? "Medium",
      status: (record as CorrectiveActionRecord | null)?.status ?? "Created",
      dueDate: (record as CorrectiveActionRecord | null)?.dueDate ?? "",
      completionSummary: (record as CorrectiveActionRecord | null)?.completionSummary ?? "",
      verificationRequired: String((record as CorrectiveActionRecord | null)?.verificationRequired ?? true),
      verificationMethod: (record as CorrectiveActionRecord | null)?.verificationMethod ?? "",
      verificationResult: (record as CorrectiveActionRecord | null)?.verificationResult ?? "",
      evidenceReference: (record as CorrectiveActionRecord | null)?.evidenceReference ?? "",
      description: (record as CorrectiveActionRecord | null)?.description ?? "",
      closureNotes: (record as CorrectiveActionRecord | null)?.closureNotes ?? "",
    }),
    fields: (context) => [
      { name: "title", label: "Title", type: "text", required: true },
      { name: "type", label: "Corrective Action Type", type: "select", required: true, options: [option("", "Select action type"), ...CORRECTIVE_ACTION_TYPES.map((type) => option(type))] },
      { name: "sourceType", label: "Source Type", type: "select", required: true, options: CORRECTIVE_ACTION_SOURCE_TYPES.map((sourceType) => option(sourceType)) },
      {
        name: "sourceId",
        label: "Source Record ID",
        type: "text",
        helperText: `Known findings: ${context.findings.map((finding) => finding.id).join(", ") || "none"}. Known hazards: ${context.hazards.map((hazard) => hazard.id).join(", ") || "none"}.`,
      },
      { name: "sourceJustification", label: "Source Note", type: "textarea", rows: 3 },
      { name: "assignedTo", label: "Assigned To", type: "text", required: true },
      { name: "priority", label: "Priority", type: "select", required: true, options: CORRECTIVE_ACTION_PRIORITIES.map((priority) => option(priority)) },
      { name: "status", label: "Status", type: "select", required: true, options: CORRECTIVE_ACTION_STATUSES.map((status) => option(status)) },
      { name: "dueDate", label: "Due Date", type: "text", required: true, placeholder: "YYYY-MM-DD" },
      { name: "completionSummary", label: "Completion Summary", type: "textarea", rows: 3 },
      { name: "verificationRequired", label: "Verification required", type: "checkbox" },
      { name: "verificationMethod", label: "Verification Method", type: "text" },
      { name: "verificationResult", label: "Verification Result", type: "textarea", rows: 3 },
      { name: "evidenceReference", label: "Evidence / Reference", type: "textarea", rows: 3 },
      { name: "description", label: "Description", type: "textarea", rows: 4 },
      { name: "closureNotes", label: "Closure Summary", type: "textarea", rows: 4 },
    ],
    columns: (context) => [
      { key: "priority", label: "Priority", accessor: (record) => (record as CorrectiveActionRecord).priority, toneAccessor: (record) => getCorrectiveActionPriorityTone((record as CorrectiveActionRecord).priority), cellKind: "status", sortable: true },
      { key: "title", label: "Title", accessor: (record) => (record as CorrectiveActionRecord).title, descriptionAccessor: (record) => (record as CorrectiveActionRecord).description, primary: true, sortable: true },
      { key: "source", label: "Source", accessor: (record) => getActionSourceLabel(record as CorrectiveActionRecord, context), sortable: true },
      { key: "status", label: "Status", accessor: (record) => (record as CorrectiveActionRecord).status, toneAccessor: (record) => getCorrectiveActionStatusTone((record as CorrectiveActionRecord).status), cellKind: "status", sortable: true },
      { key: "dueDate", label: "Due", accessor: (record) => (record as CorrectiveActionRecord).dueDate, sortable: true },
      commonUpdatedColumn(),
    ],
    detailSections: (record, context) => [
      { title: "Corrective action fields", fields: [
        { label: "Title", value: (record as CorrectiveActionRecord).title },
        { label: "Corrective Action Type", value: (record as CorrectiveActionRecord).type },
        { label: "Priority", value: (record as CorrectiveActionRecord).priority },
        { label: "Domain status", value: (record as CorrectiveActionRecord).status },
        { label: "Source Type", value: (record as CorrectiveActionRecord).sourceType },
        { label: "Source Record", value: getActionSourceLabel(record as CorrectiveActionRecord, context) },
        { label: "Source Note", value: (record as CorrectiveActionRecord).sourceJustification },
        { label: "Assigned To", value: (record as CorrectiveActionRecord).assignedTo },
        { label: "Due Date", value: (record as CorrectiveActionRecord).dueDate },
        { label: "Completion Summary", value: (record as CorrectiveActionRecord).completionSummary },
        { label: "Completed At", value: (record as CorrectiveActionRecord).completedAt ? formatTimestamp((record as CorrectiveActionRecord).completedAt ?? "") : "" },
        { label: "Verification Required", value: (record as CorrectiveActionRecord).verificationRequired ? "Yes" : "No" },
        { label: "Verification Method", value: (record as CorrectiveActionRecord).verificationMethod },
        { label: "Verification Result", value: (record as CorrectiveActionRecord).verificationResult },
        { label: "Evidence / Reference", value: (record as CorrectiveActionRecord).evidenceReference },
        { label: "Verified At", value: (record as CorrectiveActionRecord).verifiedAt ? formatTimestamp((record as CorrectiveActionRecord).verifiedAt ?? "") : "" },
        { label: "Closed At", value: (record as CorrectiveActionRecord).closedAt ? formatTimestamp((record as CorrectiveActionRecord).closedAt ?? "") : "" },
        { label: "Description", value: (record as CorrectiveActionRecord).description },
        { label: "Closure Summary", value: (record as CorrectiveActionRecord).closureNotes },
      ] },
      { title: "Related fields", fields: [
        { label: "Source", value: getActionSourceLabel(record as CorrectiveActionRecord, context) },
      ] },
    ],
    relationshipSections: (record, context) =>
      correctiveActionRelationshipSections(record as CorrectiveActionRecord, context),
    getRecordTitle: (record) => (record as CorrectiveActionRecord).title,
    getStatusLabel: (record) => (record as CorrectiveActionRecord).status,
    getStatusTone: (record) => getCorrectiveActionStatusTone((record as CorrectiveActionRecord).status),
    statusOptions: CORRECTIVE_ACTION_STATUSES.map((status) => option(status)),
    getStatusFilterValue: (record) => (record as CorrectiveActionRecord).status,
    emptyMessage: "Add the first corrective action to start managing HSE follow-up work.",
    newActionLabel: "New Corrective Action",
    saveLabel: "Save corrective action",
  };
}

function locationRelationshipSections(record: LocationRecord, context: RegisterContext): RelationshipSection[] {
  return [
    {
      title: "Related Processes",
      items: context.processes
        .filter((process) => process.locationId === record.id)
        .map((process) => relatedItem("processes", process, process.name, process.category)),
    },
    {
      title: "Related Equipment",
      items: context.equipment
        .filter((equipment) => equipment.locationId === record.id)
        .map((equipment) => relatedItem("equipment", equipment, equipment.name, equipment.type)),
    },
    {
      title: "Related Findings",
      items: context.findings
        .filter((finding) => finding.locationId === record.id)
        .map((finding) => relatedItem("findings", finding, finding.title, finding.type)),
    },
    {
      title: "Related Hazards",
      items: context.hazards
        .filter((hazard) => hazard.locationId === record.id || hazard.locationIds.includes(record.id))
        .map((hazard) => relatedItem("hazards", hazard, hazard.title, hazard.category)),
    },
  ];
}

function processRelationshipSections(record: ProcessRecord, context: RegisterContext): RelationshipSection[] {
  return [
    {
      title: "Related Location",
      items: relationshipById(
        record.locationId,
        locationsById(context),
        "locations",
        (location) => location.name,
        (location) => location.type,
      ),
    },
    {
      title: "Related Chemicals",
      items: context.chemicals
        .filter((chemical) => chemical.processIds.includes(record.id))
        .map((chemical) => relatedItem("chemicals", chemical, chemical.name, chemical.hazardClass)),
    },
    {
      title: "Related Equipment",
      items: context.equipment
        .filter((equipment) => equipment.processId === record.id)
        .map((equipment) => relatedItem("equipment", equipment, equipment.name, equipment.type)),
    },
    {
      title: "Related Hazards",
      items: context.hazards
        .filter((hazard) => hazard.processIds.includes(record.id))
        .map((hazard) => relatedItem("hazards", hazard, hazard.title, hazard.category)),
    },
    {
      title: "Related SEGs",
      items: context.segs
        .filter((seg) => seg.processId === record.id)
        .map((seg) => relatedItem("segs", seg, seg.name, seg.type)),
    },
    {
      title: "Related Findings",
      items: context.findings
        .filter((finding) => finding.processId === record.id)
        .map((finding) => relatedItem("findings", finding, finding.title, finding.type)),
    },
  ];
}

function equipmentRelationshipSections(record: EquipmentRecord, context: RegisterContext): RelationshipSection[] {
  return [
    {
      title: "Related Location",
      items: relationshipById(
        record.locationId,
        locationsById(context),
        "locations",
        (location) => location.name,
        (location) => location.type,
      ),
    },
    {
      title: "Related Process",
      items: relationshipById(
        record.processId,
        processesById(context),
        "processes",
        (process) => process.name,
        (process) => process.category,
      ),
    },
  ];
}

function chemicalRelationshipSections(record: ChemicalRecord, context: RegisterContext): RelationshipSection[] {
  return [
    {
      title: "Related Processes",
      items: relationshipsByIds(
        record.processIds,
        processesById(context),
        "processes",
        (process) => process.name,
        (process) => process.category,
      ),
    },
    {
      title: "Related Hazards",
      items: context.hazards
        .filter((hazard) => hazard.chemicalIds.includes(record.id))
        .map((hazard) => relatedItem("hazards", hazard, hazard.title, hazard.category)),
    },
    {
      title: "Related SEGs",
      items: context.segs
        .filter((seg) => seg.chemicalIds.includes(record.id))
        .map((seg) => relatedItem("segs", seg, seg.name, seg.type)),
    },
  ];
}

function hazardRelationshipSections(record: HazardRecord, context: RegisterContext): RelationshipSection[] {
  return [
    {
      title: "Related Locations",
      items: relationshipsByIds(
        record.locationIds.length > 0 ? record.locationIds : [record.locationId],
        locationsById(context),
        "locations",
        (location) => location.name,
        (location) => location.type,
      ),
    },
    {
      title: "Related Processes",
      items: relationshipsByIds(
        record.processIds,
        processesById(context),
        "processes",
        (process) => process.name,
        (process) => process.category,
      ),
    },
    {
      title: "Related Chemicals",
      items: relationshipsByIds(
        record.chemicalIds,
        chemicalsById(context),
        "chemicals",
        (chemical) => chemical.name,
        (chemical) => chemical.hazardClass,
      ),
    },
    {
      title: "Related Findings",
      items: context.findings
        .filter((finding) => finding.hazardId === record.id)
        .map((finding) => relatedItem("findings", finding, finding.title, finding.type)),
    },
    {
      title: "Related Controls",
      items: context.controls
        .filter((control) => control.hazardIds.includes(record.id))
        .map((control) => relatedItem("controls", control, control.name, control.type)),
    },
    {
      title: "Related Risk Assessments",
      items: context.riskAssessments
        .filter((riskAssessment) => riskAssessment.hazardId === record.id)
        .map((riskAssessment) =>
          relatedItem("risk-assessments", riskAssessment, riskAssessment.title, riskAssessment.reviewStatus),
        ),
    },
  ];
}

function controlRelationshipSections(record: ControlRecord, context: RegisterContext): RelationshipSection[] {
  return [
    {
      title: "Related Hazards",
      items: relationshipsByIds(
        record.hazardIds,
        hazardsById(context),
        "hazards",
        (hazard) => hazard.title,
        (hazard) => hazard.category,
      ),
    },
    {
      title: "Related Risk Assessments",
      items: context.riskAssessments
        .filter((riskAssessment) => riskAssessment.controlIds.includes(record.id))
        .map((riskAssessment) =>
          relatedItem("risk-assessments", riskAssessment, riskAssessment.title, riskAssessment.reviewStatus),
        ),
    },
  ];
}

function riskAssessmentRelationshipSections(
  record: RiskAssessmentRecord,
  context: RegisterContext,
): RelationshipSection[] {
  return [
    {
      title: "Related Hazard",
      items: relationshipById(
        record.hazardId,
        hazardsById(context),
        "hazards",
        (hazard) => hazard.title,
        (hazard) => hazard.category,
      ),
    },
    {
      title: "Applied Controls",
      items: relationshipsByIds(
        record.controlIds,
        controlsById(context),
        "controls",
        (control) => control.name,
        (control) => control.type,
      ),
    },
  ];
}

function segRelationshipSections(record: SegRecord, context: RegisterContext): RelationshipSection[] {
  return [
    {
      title: "Related Process",
      items: relationshipById(
        record.processId,
        processesById(context),
        "processes",
        (process) => process.name,
        (process) => process.category,
      ),
    },
    {
      title: "Related Chemicals",
      items: relationshipsByIds(
        record.chemicalIds,
        chemicalsById(context),
        "chemicals",
        (chemical) => chemical.name,
        (chemical) => chemical.hazardClass,
      ),
    },
    {
      title: "Related Hazards",
      items: relationshipsByIds(
        record.hazardIds,
        hazardsById(context),
        "hazards",
        (hazard) => hazard.title,
        (hazard) => hazard.category,
      ),
    },
  ];
}

function getActionSourceLabel(record: CorrectiveActionRecord, context: RegisterContext) {
  if (record.sourceType === "Finding") {
    return findingsById(context).get(record.sourceId || record.findingId)?.title ?? "Unknown finding";
  }

  if (record.sourceType === "Hazard") {
    return hazardsById(context).get(record.sourceId)?.title ?? "Unknown hazard";
  }

  if (record.sourceType === "Manual") {
    return record.sourceJustification || "Manual source";
  }

  return record.sourceId || record.sourceJustification || record.sourceType;
}

function findingRelationshipSections(record: FindingRecord, context: RegisterContext): RelationshipSection[] {
  return [
    {
      title: "Related Location",
      items: relationshipById(
        record.locationId,
        locationsById(context),
        "locations",
        (location) => location.name,
        (location) => location.type,
      ),
    },
    {
      title: "Related Process",
      items: relationshipById(
        record.processId,
        processesById(context),
        "processes",
        (process) => process.name,
        (process) => process.category,
      ),
    },
    {
      title: "Related Hazard",
      items: relationshipById(
        record.hazardId,
        hazardsById(context),
        "hazards",
        (hazard) => hazard.title,
        (hazard) => hazard.category,
      ),
    },
    {
      title: "Related Corrective Actions",
      items: context.correctiveActions
        .filter((action) => action.sourceType === "Finding" && (action.sourceId || action.findingId) === record.id)
        .map((action) => relatedItem("corrective-actions", action, action.title, action.type)),
    },
  ];
}

function correctiveActionRelationshipSections(
  record: CorrectiveActionRecord,
  context: RegisterContext,
): RelationshipSection[] {
  const findingId = record.sourceType === "Finding" ? record.sourceId || record.findingId : record.findingId;
  const finding = findingsById(context).get(findingId);

  return [
    {
      title: "Source Record",
      items:
        record.sourceType === "Finding"
          ? relationshipById(
              findingId,
              findingsById(context),
              "findings",
              (relatedFinding) => relatedFinding.title,
              (relatedFinding) => relatedFinding.type,
            )
          : record.sourceType === "Hazard"
            ? relationshipById(
                record.sourceId,
                hazardsById(context),
                "hazards",
                (hazard) => hazard.title,
                (hazard) => hazard.category,
              )
            : [],
    },
    {
      title: "Related Location",
      items: finding
        ? relationshipById(
            finding.locationId,
            locationsById(context),
            "locations",
            (location) => location.name,
            (location) => location.type,
          )
        : [],
    },
    {
      title: "Related Process",
      items: finding
        ? relationshipById(
            finding.processId,
            processesById(context),
            "processes",
            (process) => process.name,
            (process) => process.category,
          )
        : [],
    },
  ];
}

function valuesToLocationInput(values: FormValues): LocationInput {
  return {
    name: values.name ?? "",
    type: (values.type ?? "") as LocationType,
    description: values.description ?? "",
    status: (values.status ?? "active") as LocationStatus,
  };
}

function valuesToFindingInput(values: FormValues): FindingInput {
  return {
    title: values.title ?? "",
    type: (values.type ?? "") as FindingType,
    description: values.description ?? "",
    locationId: values.locationId ?? "",
    processId: values.processId ?? "",
    hazardId: values.hazardId ?? "",
    severity: (values.severity ?? "") as FindingSeverity,
    status: (values.status ?? "Open") as FindingStatus,
    reportedBy: values.reportedBy ?? "",
  };
}

function valuesToProcessInput(values: FormValues): ProcessInput {
  return {
    name: values.name ?? "",
    locationId: values.locationId ?? "",
    category: (values.category ?? "") as ProcessCategory,
    description: values.description ?? "",
    status: (values.status ?? "active") as ProcessStatus,
  };
}

function valuesToEquipmentInput(values: FormValues): EquipmentInput {
  return {
    name: values.name ?? "",
    type: (values.type ?? "") as EquipmentType,
    locationId: values.locationId ?? "",
    processId: values.processId ?? "",
    description: values.description ?? "",
    status: (values.status ?? "active") as EquipmentStatus,
    notes: values.notes ?? "",
  };
}

function valuesToChemicalInput(values: FormValues): ChemicalInput {
  return {
    name: values.name ?? "",
    casNumber: values.casNumber ?? "",
    hazardClass: (values.hazardClass ?? "Unknown") as ChemicalHazardClass,
    processIds: parseMultiValue(values.processIds),
    storageLocationId: values.storageLocationId ?? "",
    sdsStatus: (values.sdsStatus ?? "Missing") as ChemicalSdsStatus,
    sdsReference: values.sdsReference ?? "",
    sdsRevisionDate: values.sdsRevisionDate ?? "",
    sdsReviewDate: values.sdsReviewDate ?? "",
    exposureLimitValue: values.exposureLimitValue ?? "",
    exposureLimitUnit: values.exposureLimitUnit ?? "",
    exposureLimitSource: values.exposureLimitSource ?? "",
    exposureLimitAveragingPeriod: values.exposureLimitAveragingPeriod ?? "",
    quantity: values.quantity ?? "",
    unit: values.unit ?? "",
    supplier: values.supplier ?? "",
    status: (values.status ?? "active") as ChemicalStatus,
    notes: values.notes ?? "",
  };
}

function valuesToHazardInput(values: FormValues): HazardInput {
  return {
    title: values.title ?? "",
    category: (values.category ?? "") as HazardCategory,
    locationId: values.locationId ?? "",
    locationIds: parseMultiValue(values.locationIds),
    processIds: parseMultiValue(values.processIds),
    chemicalIds: parseMultiValue(values.chemicalIds),
    severity: (values.severity ?? "") as HazardSeverity,
    likelihood: (values.likelihood ?? "") as HazardLikelihood,
    description: values.description ?? "",
    controls: values.controls ?? "",
    status: (values.status ?? "active") as HazardStatus,
  };
}

function valuesToControlInput(values: FormValues): ControlInput {
  return {
    name: values.name ?? "",
    type: (values.type ?? "") as ControlType,
    hazardIds: parseMultiValue(values.hazardIds),
    description: values.description ?? "",
    owner: values.owner ?? "",
    verificationMethod: values.verificationMethod ?? "",
    verificationFrequency: values.verificationFrequency ?? "",
    lastVerifiedAt: values.lastVerifiedAt ?? "",
    status: (values.status ?? "needs-review") as ControlStatus,
    notes: values.notes ?? "",
  };
}

function valuesToRiskAssessmentInput(values: FormValues): RiskAssessmentInput {
  return {
    title: values.title ?? "",
    hazardId: values.hazardId ?? "",
    controlIds: parseMultiValue(values.controlIds),
    inherentSeverity: (values.inherentSeverity ?? "") as HazardSeverity,
    inherentLikelihood: (values.inherentLikelihood ?? "") as HazardLikelihood,
    residualSeverity: (values.residualSeverity ?? "") as HazardSeverity,
    residualLikelihood: (values.residualLikelihood ?? "") as HazardLikelihood,
    assessor: values.assessor ?? "",
    reviewStatus: (values.reviewStatus ?? "Draft") as RiskAssessmentStatus,
    nextReviewDate: values.nextReviewDate ?? "",
    notes: values.notes ?? "",
  };
}

function valuesToSegInput(values: FormValues): SegInput {
  return {
    name: values.name ?? "",
    type: (values.type ?? "") as SegType,
    description: values.description ?? "",
    locationId: values.locationId ?? "",
    processId: values.processId ?? "",
    chemicalIds: parseMultiValue(values.chemicalIds),
    hazardIds: parseMultiValue(values.hazardIds),
    agentType: values.agentType ?? "",
    exposureLevel: (values.exposureLevel ?? "") as ExposureLevel,
    workerCount: values.workerCount ?? "",
    controls: values.controls ?? "",
    monitoringFrequency: values.monitoringFrequency ?? "",
    status: (values.status ?? "active") as SegStatus,
  };
}

function valuesToCorrectiveActionInput(values: FormValues): CorrectiveActionInput {
  const sourceType = (values.sourceType ?? "Finding") as CorrectiveActionSourceType;
  const sourceId = values.sourceId ?? "";

  return {
    title: values.title ?? "",
    type: (values.type ?? "") as CorrectiveActionType,
    description: values.description ?? "",
    findingId: sourceType === "Finding" ? sourceId : values.findingId ?? "",
    sourceType,
    sourceId,
    sourceJustification: values.sourceJustification ?? "",
    assignedTo: values.assignedTo ?? "",
    priority: (values.priority ?? "Medium") as CorrectiveActionPriority,
    status: (values.status ?? "Created") as CorrectiveActionStatus,
    dueDate: values.dueDate ?? "",
    completionSummary: values.completionSummary ?? "",
    verificationRequired: values.verificationRequired !== "false",
    verificationMethod: values.verificationMethod ?? "",
    verificationResult: values.verificationResult ?? "",
    evidenceReference: values.evidenceReference ?? "",
    closureNotes: values.closureNotes ?? "",
  };
}

function parseMultiValue(value: string | undefined): string[] {
  return (value ?? "").split("|").filter(Boolean);
}

export function getRegisterConfig(kind: MvpRegisterKind): RegisterConfig {
  return REGISTER_CONFIGS[kind];
}

export function getActiveContext(): RegisterContext {
  return {
    locations: get(locationRecords),
    processes: get(processRecords),
    equipment: get(equipmentRecords),
    chemicals: get(chemicalRecords),
    hazards: get(hazardRecords),
    controls: get(controlRecords),
    riskAssessments: get(riskAssessmentRecords),
    segs: get(segRecords),
    findings: get(findingRecords),
    correctiveActions: get(correctiveActionRecords),
  };
}
