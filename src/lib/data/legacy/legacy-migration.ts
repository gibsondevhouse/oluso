import type { MutableRecordStoreName } from "../database/schema";
import type { MutationContext, RecordEnvelope } from "../database/types";
import { runMutationTransaction } from "../revisions/mutation-transaction";
import { detectLegacySource, type DetectedLegacySource } from "./legacy-source";
import { LEGACY_COLLECTION_MAPPING } from "./legacy-mapping";

type SourceRecord = Record<string, unknown>;
type MigratedRecord = RecordEnvelope & Record<string, unknown>;

export interface LegacyMigrationOptions {
  actorId: string;
  installationId: string;
  now?: () => Date;
  migrationRunId?: string;
}

export interface LegacyMigrationResult {
  migrationRunId: string;
  sourceKind: DetectedLegacySource["kind"];
  sourceSchemaVersion: number;
  importedRecordCount: number;
  dataQualityFindingCount: number;
  deferredRecordCount: number;
  countsByStore: Record<string, number>;
}

interface PreparedMigration {
  records: Map<MutableRecordStoreName, MigratedRecord[]>;
  deferredRecords: Array<{ collection: string; record: SourceRecord }>;
  dataQualityFindings: MigratedRecord[];
}

const LEGACY_LOCATION_TYPE_MAP: Record<string, string> = {
  Facility: "Site",
  "Production Area": "Unit",
  Storage: "StorageArea",
  Lab: "Room",
  Office: "Room",
  "Utility Area": "Zone",
  "Outdoor Area": "OutdoorArea",
};

function isRecord(value: unknown): value is SourceRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function records(source: DetectedLegacySource, collection: string) {
  const value = source.database[collection];
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function text(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function slug(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "") || "unknown";
}

function iso(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? fallback : parsed.toISOString();
}

function legacyLifecycle(record: SourceRecord) {
  return text(record.lifecycleStatus).toLowerCase() === "archived" ? "archived" : "active";
}

function envelope(
  record: SourceRecord,
  options: LegacyMigrationOptions,
  timestamp: string,
  sourceInstallationId: string,
  overrides: Partial<RecordEnvelope> = {},
): RecordEnvelope {
  const lifecycleStatus = legacyLifecycle(record);
  const createdAt = iso(record.createdAt, timestamp);
  const updatedAt = iso(record.updatedAt, createdAt);
  return {
    id: text(record.id),
    businessId: text(record.businessId),
    revision: 1,
    createdAt,
    createdBy: options.actorId,
    updatedAt,
    updatedBy: options.actorId,
    originInstallationId: sourceInstallationId,
    lastExchangePackageId: undefined,
    lifecycleStatus,
    archivedAt: lifecycleStatus === "archived" ? iso(record.archivedAt, updatedAt) : null,
    archivedBy: lifecycleStatus === "archived" ? options.actorId : null,
    archiveReason:
      lifecycleStatus === "archived"
        ? text(record.archiveReason, text(record.archivedReason, "Migrated archive"))
        : null,
    ...overrides,
  };
}

function addRecord(
  output: PreparedMigration,
  storeName: MutableRecordStoreName,
  record: MigratedRecord,
) {
  const storeRecords = output.records.get(storeName) ?? [];
  storeRecords.push(record);
  output.records.set(storeName, storeRecords);
}

function businessId(prefix: string, id: string) {
  return `MIG-${prefix}-${slug(id).toUpperCase()}`;
}

function directRecord(
  record: SourceRecord,
  options: LegacyMigrationOptions,
  timestamp: string,
  sourceInstallationId: string,
  prefix: string,
  additional: SourceRecord = {},
): MigratedRecord {
  const id = text(record.id);
  return {
    ...record,
    ...additional,
    ...envelope(record, options, timestamp, sourceInstallationId, {
      id,
      businessId: text(record.businessId, businessId(prefix, id)),
    }),
  };
}

function deterministicDerivedRecord(
  source: SourceRecord,
  suffix: string,
  prefix: string,
  options: LegacyMigrationOptions,
  timestamp: string,
  sourceInstallationId: string,
  data: SourceRecord,
): MigratedRecord {
  const sourceId = text(source.id);
  const id = `${sourceId}:${suffix}`;
  return {
    ...data,
    ...envelope(source, options, timestamp, sourceInstallationId, {
      id,
      businessId: businessId(prefix, id),
    }),
  };
}

function prepareLocations(
  source: DetectedLegacySource,
  output: PreparedMigration,
  options: LegacyMigrationOptions,
  timestamp: string,
  sourceInstallationId: string,
) {
  const sourceLocations = records(source, "locations");
  const byId = new Map(sourceLocations.map((record) => [text(record.id), record]));
  const siteFor = new Map<string, string>();
  const resolving = new Set<string>();
  const resolveSite = (record: SourceRecord): string => {
    const id = text(record.id);
    if (siteFor.has(id)) return siteFor.get(id)!;
    if (resolving.has(id)) return "";
    resolving.add(id);
    const parentId = text(record.parentLocationId);
    const nodeType = LEGACY_LOCATION_TYPE_MAP[text(record.type)] ?? "Zone";
    const resolved = nodeType === "Site" ? id : parentId && byId.has(parentId) ? resolveSite(byId.get(parentId)!) : "";
    resolving.delete(id);
    siteFor.set(id, resolved);
    return resolved;
  };

  const geography = new Map<string, { countryId: string; stateId: string }>();
  for (const record of sourceLocations) {
    const nodeType = LEGACY_LOCATION_TYPE_MAP[text(record.type)] ?? "Zone";
    if (nodeType !== "Site") continue;
    const country = text(record.country, "Unknown country");
    const state = text(record.stateProvince, "Unknown region");
    const key = `${country}\u0000${state}`;
    if (geography.has(key)) continue;
    const countryId = `legacy-geography:country:${slug(country)}`;
    const stateId = `legacy-geography:state:${slug(country)}:${slug(state)}`;
    addRecord(output, "locations", deterministicDerivedRecord(record, `country:${slug(country)}`, "LOC", options, timestamp, sourceInstallationId, {
      id: countryId,
      name: country,
      nodeType: "Country",
      parentId: null,
      resolvedSiteId: null,
    }));
    const countryRecord = output.records.get("locations")!.at(-1)!;
    countryRecord.id = countryId;
    countryRecord.businessId = businessId("LOC", countryId);
    addRecord(output, "locations", deterministicDerivedRecord(record, `state:${slug(country)}:${slug(state)}`, "LOC", options, timestamp, sourceInstallationId, {
      id: stateId,
      name: state,
      nodeType: "StateOrRegion",
      parentId: countryId,
      resolvedSiteId: null,
    }));
    const stateRecord = output.records.get("locations")!.at(-1)!;
    stateRecord.id = stateId;
    stateRecord.businessId = businessId("LOC", stateId);
    geography.set(key, { countryId, stateId });
  }

  for (const record of sourceLocations) {
    const id = text(record.id);
    const nodeType = LEGACY_LOCATION_TYPE_MAP[text(record.type)] ?? "Zone";
    let parentId: string | null = text(record.parentLocationId) || null;
    if (nodeType === "Site") {
      const key = `${text(record.country, "Unknown country")}\u0000${text(record.stateProvince, "Unknown region")}`;
      parentId = geography.get(key)?.stateId ?? null;
    }
    addRecord(output, "locations", directRecord(record, options, timestamp, sourceInstallationId, "LOC", {
      name: text(record.name, text(record.title)),
      nodeType,
      parentId,
      resolvedSiteId: nodeType === "Site" ? id : resolveSite(record) || null,
      legacyLocationType: text(record.type),
    }));
  }
}

function createFinding(
  output: PreparedMigration,
  sourceRecord: SourceRecord,
  collection: string,
  code: string,
  message: string,
  options: LegacyMigrationOptions,
  timestamp: string,
  sourceInstallationId: string,
) {
  const id = `migration-finding:${collection}:${text(sourceRecord.id, slug(message))}:${code}`;
  const finding = directRecord(
    { id, createdAt: sourceRecord.createdAt, updatedAt: sourceRecord.updatedAt },
    options,
    timestamp,
    sourceInstallationId,
    "DQF",
    {
      title: message,
      code,
      severity: "warning",
      status: "open",
      recordType: collection,
      recordId: text(sourceRecord.id),
      sourceCollection: collection,
    },
  );
  output.dataQualityFindings.push(finding);
  addRecord(output, "data_quality_findings", finding);
}

function prepareMigration(
  source: DetectedLegacySource,
  options: LegacyMigrationOptions,
  timestamp: string,
): PreparedMigration {
  const sourceInstallationId = `legacy:${source.kind}:${source.schemaVersion}`;
  const output: PreparedMigration = {
    records: new Map(),
    deferredRecords: [],
    dataQualityFindings: [],
  };
  prepareLocations(source, output, options, timestamp, sourceInstallationId);

  const siteByLocation = new Map<string, string>();
  for (const location of output.records.get("locations") ?? []) {
    const siteId = text(location.resolvedSiteId);
    if (siteId) siteByLocation.set(location.id, siteId);
    if (location.nodeType === "Site") siteByLocation.set(location.id, location.id);
  }

  const directMappings: Array<[string, MutableRecordStoreName, string]> = [
    ["organizations", "organizations", "ORG"],
    ["people", "people", "PER"],
    ["hazards", "hazards", "HAZ"],
    ["controls", "controls", "CTL"],
    ["segs", "segs", "SEG"],
    ["findings", "findings", "FND"],
    ["incidents", "incidents", "INC"],
    ["correctiveActions", "corrective_actions", "ACT"],
    ["documentReferences", "document_references", "DOC"],
    ["exposureAgents", "exposure_agents", "AGT"],
    ["exposureLimits", "exposure_limits", "OEL"],
    ["segMemberships", "seg_memberships", "SEGM"],
    ["inspections", "inspections", "INSP"],
    ["controlVerifications", "control_verifications", "CV"],
    ["programApplicabilities", "program_applicability", "PA"],
    ["medicalSurveillance", "medical_surveillance_requirements", "MSR"],
  ];
  for (const [collection, store, prefix] of directMappings) {
    for (const record of records(source, collection)) {
      addRecord(output, store, directRecord(record, options, timestamp, sourceInstallationId, prefix));
      if (collection === "segs" && ["exposureLevel", "monitoringFrequency", "existingControls"].some((field) => text(record[field]))) {
        createFinding(output, record, collection, "SEG_SCENARIO_FIELDS", "Legacy SEG exposure fields require an Exposure Scenario review.", options, timestamp, sourceInstallationId);
      }
    }
  }

  for (const record of records(source, "processes")) {
    const locationId = text(record.locationId);
    addRecord(output, "processes", directRecord(record, options, timestamp, sourceInstallationId, "PROC", {
      locationId,
      resolvedSiteId: siteByLocation.get(locationId) ?? null,
    }));
  }
  for (const record of records(source, "tasks")) {
    const locationId = text(record.locationId);
    addRecord(output, "tasks", directRecord(record, options, timestamp, sourceInstallationId, "TASK", {
      processId: text(record.processId),
      locationId,
      resolvedSiteId: siteByLocation.get(locationId) ?? null,
    }));
  }
  for (const record of records(source, "equipment")) {
    addRecord(output, "equipment", directRecord(record, options, timestamp, sourceInstallationId, "EQ", {
      locationId: text(record.locationId),
      processId: text(record.processId),
      taskId: text(record.taskId) || null,
    }));
  }

  for (const record of records(source, "chemicals")) {
    const sourceId = text(record.id);
    const productId = sourceId;
    const substanceId = `${sourceId}:substance`;
    addRecord(output, "chemical_products", directRecord(record, options, timestamp, sourceInstallationId, "PROD", {
      productName: text(record.name, text(record.title)),
      manufacturer: text(record.manufacturer, text(record.supplier)),
      status: "active",
    }));
    addRecord(output, "chemical_substances", deterministicDerivedRecord(record, "substance", "SUB", options, timestamp, sourceInstallationId, {
      canonicalName: text(record.substanceName, text(record.name, text(record.title))),
      casNumber: text(record.casNumber),
      synonyms: [],
    }));
    addRecord(output, "chemical_product_substances", deterministicDerivedRecord(record, "product-substance", "PS", options, timestamp, sourceInstallationId, {
      productId,
      substanceId,
    }));
    if (text(record.sdsReference) || text(record.sdsRevisionDate)) {
      addRecord(output, "sds_revisions", deterministicDerivedRecord(record, "sds", "SDS", options, timestamp, sourceInstallationId, {
        productId,
        manufacturer: text(record.manufacturer, text(record.supplier)),
        revisionDate: text(record.sdsRevisionDate),
        effectiveDate: text(record.sdsEffectiveDate),
        documentReference: text(record.sdsReference),
        currentStatus: "current",
      }));
    }
    const storageLocationId = text(record.storageLocationId);
    if (storageLocationId) {
      addRecord(output, "site_chemical_inventory", deterministicDerivedRecord(record, "inventory", "INV", options, timestamp, sourceInstallationId, {
        productId,
        siteId: siteByLocation.get(storageLocationId) ?? null,
        storageLocationId,
        quantity: text(record.quantity),
        unit: text(record.quantityUnit),
        inventoryStatus: "active",
      }));
    }
    for (const processId of stringArray(record.processIds)) {
      addRecord(output, "chemical_uses", deterministicDerivedRecord(record, `use:${slug(processId)}`, "USE", options, timestamp, sourceInstallationId, {
        productId,
        processId,
        taskId: null,
        locationId: storageLocationId || null,
        segId: null,
        operatingCondition: "unspecified",
      }));
      const added = output.records.get("chemical_uses")!.at(-1)!;
      added.id = `${sourceId}:use:${processId}`;
      added.businessId = businessId("USE", added.id);
    }
    if (text(record.exposureLimit)) {
      createFinding(output, record, "chemicals", "CHEMICAL_OEL_REVIEW", "Legacy chemical exposure limit requires explicit agent, type, unit, basis, and source review.", options, timestamp, sourceInstallationId);
    }
  }

  for (const record of records(source, "exposureMonitoring")) {
    const id = text(record.id);
    const agentTitle = text(record.agent, "Unspecified exposure agent");
    const agentId = `legacy-monitoring-agent:${slug(agentTitle)}`;
    if (!(output.records.get("exposure_agents") ?? []).some((agent) => agent.id === agentId)) {
      addRecord(output, "exposure_agents", deterministicDerivedRecord(record, `agent:${slug(agentTitle)}`, "AGT", options, timestamp, sourceInstallationId, {
        title: agentTitle,
        agentType: "unspecified",
      }));
      const agent = output.records.get("exposure_agents")!.at(-1)!;
      agent.id = agentId;
      agent.businessId = businessId("AGT", agentId);
    }
    const planId = `${id}:plan`;
    const eventId = `${id}:event`;
    const sampleId = `${id}:sample`;
    addRecord(output, "sampling_plans", deterministicDerivedRecord(record, "plan", "SPLN", options, timestamp, sourceInstallationId, {
      title: text(record.title),
      exposureScenarioId: null,
      legacySegId: text(record.segId) || null,
      status: "migration-review",
    }));
    addRecord(output, "sampling_events", deterministicDerivedRecord(record, "event", "SEVT", options, timestamp, sourceInstallationId, {
      samplingPlanId: planId,
      occurredAt: iso(record.sampledAt, iso(record.createdAt, timestamp)),
      operatingCondition: text(record.operatingCondition, "unspecified"),
    }));
    addRecord(output, "samples", deterministicDerivedRecord(record, "sample", "SAMP", options, timestamp, sourceInstallationId, {
      samplingEventId: eventId,
      sampleType: text(record.sampleType),
      personId: text(record.personId) || null,
      durationMinutes: null,
      method: null,
    }));
    addRecord(output, "laboratory_results", deterministicDerivedRecord(record, "result", "LAB", options, timestamp, sourceInstallationId, {
      sampleId,
      exposureAgentId: agentId,
      reportedValue: text(record.result),
      unit: text(record.unit),
      qualifier: "reported",
    }));
    createFinding(output, record, "exposureMonitoring", "MONITORING_CONTEXT_INCOMPLETE", "Legacy monitoring result requires sampling duration, method, scenario, and professional review.", options, timestamp, sourceInstallationId);
  }

  const conditionalCollections = ["exposureAssessments", "exposureDeterminations", "samplingCampaigns"];
  for (const collection of conditionalCollections) {
    for (const record of records(source, collection)) {
      output.deferredRecords.push({ collection, record });
      createFinding(output, record, collection, "TYPED_RELATIONSHIP_REQUIRED", `Legacy ${collection} record requires typed relationship review before migration.`, options, timestamp, sourceInstallationId);
    }
  }

  for (const [collection, mapping] of Object.entries(LEGACY_COLLECTION_MAPPING)) {
    if (mapping.disposition !== "defer") continue;
    for (const record of records(source, collection)) {
      output.deferredRecords.push({ collection, record });
      createFinding(output, record, collection, "DEFERRED_FUTURE_MODULE", `Legacy ${collection} record is retained as migration evidence in Future Modules.`, options, timestamp, sourceInstallationId);
    }
  }

  return output;
}

export async function migrateLegacyDatabase(
  database: IDBDatabase,
  sourceValue: unknown,
  options: LegacyMigrationOptions,
): Promise<LegacyMigrationResult> {
  const source = detectLegacySource(sourceValue);
  const timestamp = (options.now ?? (() => new Date()))().toISOString();
  const migrationRunId = options.migrationRunId ?? `migration:${source.kind}:${source.schemaVersion}:${timestamp}`;
  const prepared = prepareMigration(source, options, timestamp);
  const storeNames = [...prepared.records.keys()];
  const countsByStore = Object.fromEntries(
    [...prepared.records.entries()].map(([store, storeRecords]) => [store, storeRecords.length]),
  );
  const context: MutationContext = {
    actorId: options.actorId,
    installationId: options.installationId,
    source: "migration",
    reason: `Migrate ${source.kind} schema ${source.schemaVersion}`,
  };

  const importedRecordCount = [...prepared.records.values()].reduce(
    (total, storeRecords) => total + storeRecords.length,
    0,
  );
  const result: LegacyMigrationResult = {
    migrationRunId,
    sourceKind: source.kind,
    sourceSchemaVersion: source.schemaVersion,
    importedRecordCount,
    dataQualityFindingCount: prepared.dataQualityFindings.length,
    deferredRecordCount: prepared.deferredRecords.length,
    countsByStore,
  };

  return runMutationTransaction(
    database,
    storeNames,
    context,
    async (session) => {
      for (const [storeName, storeRecords] of prepared.records) {
        for (const record of storeRecords) {
          await session.importRecord({ storeName, recordType: storeName, record });
        }
      }
      await session.putMigrationRun({
        id: migrationRunId,
        status: "applied",
        sourceKind: source.kind,
        sourceSchemaVersion: source.schemaVersion,
        sourceFingerprint: source.fingerprint,
        startedAt: timestamp,
        completedAt: timestamp,
        actorId: options.actorId,
        installationId: options.installationId,
        countsByStore,
        importedRecordCount,
        deferredRecordCount: prepared.deferredRecords.length,
        deferredRecords: prepared.deferredRecords,
      });
      return result;
    },
    {
      now: options.now,
      additionalStoreNames: ["migration_runs"],
    },
  );
}
