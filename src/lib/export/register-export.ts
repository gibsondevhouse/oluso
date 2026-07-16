import type {
  PersistedRegisterRecord,
  RegisterCollectionName,
} from "$lib/persistence/local-persistence";
import {
  CAMPAIGN_RECORD_EXPORT_COLUMNS,
  CAMPAIGN_REGISTER_DEFINITIONS,
} from "$lib/persistence/campaign-register.types";

const CAMPAIGN_BASE_EXPORT_COLUMNS = CAMPAIGN_RECORD_EXPORT_COLUMNS as readonly string[];

export type ExportFormat = "csv" | "json";
export type ExportLifecycleScope = "active" | "all";

export interface ExportRegisterDefinition {
  collection: RegisterCollectionName;
  label: string;
  filenameStem: string;
  columns: string[];
}

export interface RegisterExportRequest {
  definition: ExportRegisterDefinition;
  records: PersistedRegisterRecord[];
  format: ExportFormat;
  lifecycleScope: ExportLifecycleScope;
  generatedAt: Date;
}

export interface RegisterExportFile {
  content: string;
  extension: ExportFormat;
  fileName: string;
  mimeType: string;
  recordCount: number;
}

export const EXPORT_REGISTERS: ExportRegisterDefinition[] = [
  {
    collection: "locations",
    label: "Locations",
    filenameStem: "locations",
    columns: [
      "id",
      "name",
      "type",
      "description",
      "status",
      "createdAt",
      "updatedAt",
      "lifecycleStatus",
      "archivedAt",
      "archivedReason",
    ],
  },
  {
    collection: "processes",
    label: "Processes",
    filenameStem: "processes",
    columns: [
      "id",
      "name",
      "locationId",
      "category",
      "description",
      "status",
      "createdAt",
      "updatedAt",
      "lifecycleStatus",
      "archivedAt",
      "archivedReason",
    ],
  },
  {
    collection: "equipment",
    label: "Equipment",
    filenameStem: "equipment",
    columns: [
      "id",
      "name",
      "type",
      "locationId",
      "processId",
      "description",
      "status",
      "notes",
      "createdAt",
      "updatedAt",
      "lifecycleStatus",
      "archivedAt",
      "archivedReason",
    ],
  },
  {
    collection: "exposureMonitoring",
    label: "Exposure Monitoring",
    filenameStem: "exposure-monitoring",
    columns: [
      "id",
      "sampleReference",
      "contextType",
      "segId",
      "contextDetail",
      "contaminant",
      "chemicalId",
      "hazardId",
      "locationId",
      "processId",
      "samplingDate",
      "sampleType",
      "result",
      "unit",
      "exposureLimit",
      "exposureLimitReference",
      "status",
      "evidenceReference",
      "notes",
      "createdAt",
      "updatedAt",
      "lifecycleStatus",
      "archivedAt",
      "archivedReason",
    ],
  },
  {
    collection: "chemicals",
    label: "Chemicals",
    filenameStem: "chemicals",
    columns: [
      "id",
      "name",
      "casNumber",
      "hazardClass",
      "processIds",
      "storageLocationId",
      "sdsStatus",
      "sdsReference",
      "sdsRevisionDate",
      "sdsReviewDate",
      "exposureLimitValue",
      "exposureLimitUnit",
      "exposureLimitSource",
      "exposureLimitAveragingPeriod",
      "quantity",
      "unit",
      "supplier",
      "status",
      "notes",
      "createdAt",
      "updatedAt",
      "lifecycleStatus",
      "archivedAt",
      "archivedReason",
    ],
  },
  {
    collection: "hazards",
    label: "Hazards",
    filenameStem: "hazards",
    columns: [
      "id",
      "title",
      "category",
      "locationId",
      "locationIds",
      "processIds",
      "chemicalIds",
      "severity",
      "likelihood",
      "description",
      "controls",
      "status",
      "createdAt",
      "updatedAt",
      "lifecycleStatus",
      "archivedAt",
      "archivedReason",
    ],
  },
  {
    collection: "controls",
    label: "Controls",
    filenameStem: "controls",
    columns: [
      "id",
      "name",
      "type",
      "hazardIds",
      "description",
      "owner",
      "verificationMethod",
      "verificationFrequency",
      "lastVerifiedAt",
      "status",
      "notes",
      "createdAt",
      "updatedAt",
      "lifecycleStatus",
      "archivedAt",
      "archivedReason",
    ],
  },
  {
    collection: "riskAssessments",
    label: "Risk Assessments",
    filenameStem: "risk-assessments",
    columns: [
      "id",
      "title",
      "hazardId",
      "controlIds",
      "inherentSeverity",
      "inherentLikelihood",
      "residualSeverity",
      "residualLikelihood",
      "assessor",
      "reviewStatus",
      "nextReviewDate",
      "notes",
      "createdAt",
      "updatedAt",
      "lifecycleStatus",
      "archivedAt",
      "archivedReason",
    ],
  },
  {
    collection: "segs",
    label: "SEGs",
    filenameStem: "segs",
    columns: [
      "id",
      "name",
      "type",
      "description",
      "locationId",
      "processId",
      "chemicalIds",
      "hazardIds",
      "agentType",
      "exposureLevel",
      "workerCount",
      "controls",
      "monitoringFrequency",
      "status",
      "createdAt",
      "updatedAt",
      "lifecycleStatus",
      "archivedAt",
      "archivedReason",
    ],
  },
  {
    collection: "findings",
    label: "Findings",
    filenameStem: "findings",
    columns: [
      "id",
      "title",
      "type",
      "description",
      "locationId",
      "processId",
      "hazardId",
      "activityDate",
      "equipmentId",
      "chemicalId",
      "controlId",
      "scope",
      "criteriaReference",
      "evidenceReference",
      "followUpRequired",
      "notes",
      "severity",
      "status",
      "reportedBy",
      "createdAt",
      "updatedAt",
      "lifecycleStatus",
      "archivedAt",
      "archivedReason",
    ],
  },
  {
    collection: "incidents",
    label: "Incidents & Near Misses",
    filenameStem: "incidents",
    columns: [
      "id",
      "title",
      "type",
      "occurredAt",
      "locationId",
      "processId",
      "equipmentId",
      "chemicalId",
      "hazardIds",
      "controlIds",
      "description",
      "actualOutcome",
      "potentialOutcome",
      "immediateActions",
      "investigationSummary",
      "immediateCauses",
      "contributingCauses",
      "evidenceReference",
      "reportingStatus",
      "status",
      "createdAt",
      "updatedAt",
      "lifecycleStatus",
      "archivedAt",
      "archivedReason",
    ],
  },
  {
    collection: "complianceItems",
    label: "Compliance Support",
    filenameStem: "compliance-items",
    columns: [
      "id",
      "itemType",
      "title",
      "requirementSource",
      "owner",
      "audienceOrScope",
      "segId",
      "locationId",
      "processId",
      "equipmentId",
      "issueDate",
      "dueDate",
      "expirationDate",
      "reviewDate",
      "recurrence",
      "status",
      "reviewStatus",
      "evidenceRequired",
      "evidenceReference",
      "notes",
      "createdAt",
      "updatedAt",
      "lifecycleStatus",
      "archivedAt",
      "archivedReason",
    ],
  },
  {
    collection: "correctiveActions",
    label: "Corrective Actions",
    filenameStem: "corrective-actions",
    columns: [
      "id",
      "title",
      "type",
      "description",
      "findingId",
      "sourceType",
      "sourceId",
      "sourceJustification",
      "assignedTo",
      "priority",
      "status",
      "dueDate",
      "completionSummary",
      "completedAt",
      "verificationRequired",
      "verificationMethod",
      "verificationResult",
      "evidenceReference",
      "verifiedAt",
      "closedAt",
      "closureNotes",
      "createdAt",
      "updatedAt",
      "lifecycleStatus",
      "archivedAt",
      "archivedReason",
    ],
  },
  ...CAMPAIGN_REGISTER_DEFINITIONS.map((definition) => ({
    collection: definition.collection,
    label: definition.title,
    filenameStem: definition.kind,
    columns: [
      ...CAMPAIGN_RECORD_EXPORT_COLUMNS,
      ...definition.fields
        .map((field) => field.name)
        .filter((field) => !CAMPAIGN_BASE_EXPORT_COLUMNS.includes(field)),
    ],
  })),
];

export function getExportRegisterDefinition(
  collection: RegisterCollectionName,
): ExportRegisterDefinition {
  const definition = EXPORT_REGISTERS.find((register) => register.collection === collection);

  if (!definition) {
    throw new Error(`Unsupported export register: ${collection}`);
  }

  return definition;
}

export function getLifecycleScopeLabel(scope: ExportLifecycleScope): string {
  return scope === "all" ? "Active and archived records" : "Active records";
}

function formatTimestampForFileName(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z").replace(/[:]/g, "");
}

export function createExportFileName(
  definition: ExportRegisterDefinition,
  format: ExportFormat,
  lifecycleScope: ExportLifecycleScope,
  generatedAt: Date,
) {
  return `oluso-${definition.filenameStem}-${lifecycleScope}-${formatTimestampForFileName(generatedAt)}.${format}`;
}

function stringifyExportValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (Array.isArray(value)) {
    return value.join("; ");
  }

  if (typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function csvCell(value: unknown): string {
  const text = stringifyExportValue(value);

  if (/[",\n\r]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function recordsToCsv(
  records: PersistedRegisterRecord[],
  definition: ExportRegisterDefinition,
) {
  const header = definition.columns.join(",");
  const rows = records.map((record) =>
    definition.columns.map((column) => csvCell(record[column as keyof PersistedRegisterRecord])).join(","),
  );

  return [header, ...rows].join("\n");
}

export function recordsToJson(records: PersistedRegisterRecord[]) {
  return JSON.stringify(records, null, 2);
}

export function buildRegisterExport(request: RegisterExportRequest): RegisterExportFile {
  const content =
    request.format === "csv"
      ? recordsToCsv(request.records, request.definition)
      : recordsToJson(request.records);

  return {
    content,
    extension: request.format,
    fileName: createExportFileName(
      request.definition,
      request.format,
      request.lifecycleScope,
      request.generatedAt,
    ),
    mimeType: request.format === "csv" ? "text/csv" : "application/json",
    recordCount: request.records.length,
  };
}

export function createDataDownloadUrl(file: RegisterExportFile) {
  return `data:${file.mimeType};charset=utf-8,${encodeURIComponent(file.content)}`;
}
