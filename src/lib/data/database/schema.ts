export const ADAMA_DATABASE_NAME = "adama-hse";
export const ADAMA_DATABASE_VERSION = 1;

export const SYSTEM_STORE_NAMES = [
  "dataset_metadata",
  "installation_metadata",
  "local_users",
  "migration_runs",
  "settings",
] as const;

export const FOUNDATION_STORE_NAMES = [
  "organizations",
  "people",
  "locations",
  "processes",
  "tasks",
  "equipment",
  "chemical_substances",
  "chemical_products",
  "chemical_product_substances",
  "sds_revisions",
  "site_chemical_inventory",
  "chemical_uses",
  "exposure_agents",
  "exposure_limits",
  "hazards",
  "controls",
  "scenario_controls",
  "document_references",
  "evidence_references",
] as const;

export const INDUSTRIAL_HYGIENE_STORE_NAMES = [
  "segs",
  "seg_memberships",
  "exposure_scenarios",
  "exposure_assessments",
  "exposure_determinations",
  "sampling_plans",
  "sampling_events",
  "samples",
  "laboratory_results",
  "exposure_limit_comparisons",
  "professional_interpretations",
  "control_verifications",
  "program_applicability",
  "medical_surveillance_requirements",
] as const;

export const ASSURANCE_STORE_NAMES = [
  "observations",
  "inspections",
  "findings",
  "incidents",
  "investigations",
  "corrective_actions",
  "verifications",
] as const;

export const GOVERNANCE_STORE_NAMES = [
  "record_revisions",
  "reviews",
  "approvals",
  "exchange_packages",
  "exchange_staging",
  "import_runs",
  "conflict_resolutions",
  "tombstones",
  "review_notes",
  "data_quality_findings",
  "backup_manifests",
] as const;

export const CURRENT_RECORD_STORE_NAMES = [
  ...FOUNDATION_STORE_NAMES,
  ...INDUSTRIAL_HYGIENE_STORE_NAMES,
  ...ASSURANCE_STORE_NAMES,
] as const;

export const MUTABLE_RECORD_STORE_NAMES = [
  ...CURRENT_RECORD_STORE_NAMES,
  "data_quality_findings",
] as const;

export const ADAMA_STORE_NAMES = [
  ...SYSTEM_STORE_NAMES,
  ...CURRENT_RECORD_STORE_NAMES,
  ...GOVERNANCE_STORE_NAMES,
] as const;

export type SystemStoreName = (typeof SYSTEM_STORE_NAMES)[number];
export type CurrentRecordStoreName = (typeof CURRENT_RECORD_STORE_NAMES)[number];
export type MutableRecordStoreName = (typeof MUTABLE_RECORD_STORE_NAMES)[number];
export type GovernanceStoreName = (typeof GOVERNANCE_STORE_NAMES)[number];
export type AdamaStoreName = (typeof ADAMA_STORE_NAMES)[number];

function createStore(database: IDBDatabase, name: AdamaStoreName) {
  if (database.objectStoreNames.contains(name)) {
    return null;
  }

  return database.createObjectStore(name, { keyPath: "id" });
}

function createIndex(
  store: IDBObjectStore,
  name: string,
  keyPath: string | string[],
  options: IDBIndexParameters = {},
) {
  if (!store.indexNames.contains(name)) {
    store.createIndex(name, keyPath, options);
  }
}

function addRecordIndexes(store: IDBObjectStore) {
  createIndex(store, "byBusinessId", "businessId", { unique: true });
  createIndex(store, "byLifecycleStatus", "lifecycleStatus");
  createIndex(store, "byUpdatedAt", "updatedAt");
  createIndex(store, "byOriginInstallation", "originInstallationId");
  createIndex(store, "byExchangePackage", "lastExchangePackageId");
}

function addDomainIndexes(name: CurrentRecordStoreName, store: IDBObjectStore) {
  switch (name) {
    case "locations":
      createIndex(store, "byParent", "parentId");
      createIndex(store, "byNodeType", "nodeType");
      createIndex(store, "byResolvedSite", "resolvedSiteId");
      break;
    case "processes":
      createIndex(store, "byResolvedSite", "resolvedSiteId");
      break;
    case "tasks":
      createIndex(store, "byProcess", "processId");
      createIndex(store, "byResolvedSite", "resolvedSiteId");
      break;
    case "equipment":
      createIndex(store, "byLocation", "locationId");
      createIndex(store, "byProcess", "processId");
      createIndex(store, "byTask", "taskId");
      break;
    case "sds_revisions":
      createIndex(store, "byProduct", "productId");
      createIndex(store, "byCurrentStatus", "currentStatus");
      break;
    case "site_chemical_inventory":
      createIndex(store, "byProduct", "productId");
      createIndex(store, "bySite", "siteId");
      createIndex(store, "byStorageLocation", "storageLocationId");
      break;
    case "chemical_uses":
      createIndex(store, "byProduct", "productId");
      createIndex(store, "byProcess", "processId");
      createIndex(store, "byTask", "taskId");
      createIndex(store, "byLocation", "locationId");
      break;
    case "exposure_limits":
      createIndex(store, "byAgent", "exposureAgentId");
      createIndex(store, "byCurrentStatus", "currentStatus");
      break;
    case "seg_memberships":
      createIndex(store, "byPerson", "personId");
      createIndex(store, "bySeg", "segId");
      createIndex(store, "byEffectiveFrom", "effectiveFrom");
      break;
    case "exposure_scenarios":
      createIndex(store, "bySeg", "segId");
      createIndex(store, "byLocation", "locationId");
      createIndex(store, "byProcess", "processId");
      createIndex(store, "byTask", "taskId");
      createIndex(store, "byAgent", "exposureAgentId");
      createIndex(store, "byOperatingCondition", "operatingCondition");
      break;
    case "exposure_assessments":
      createIndex(store, "byScenario", "exposureScenarioId");
      createIndex(store, "byReviewStatus", "reviewStatus");
      break;
    case "exposure_determinations":
      createIndex(store, "byAssessment", "exposureAssessmentId");
      createIndex(store, "byCurrentStatus", "currentStatus");
      break;
    case "sampling_plans":
      createIndex(store, "byScenario", "exposureScenarioId");
      break;
    case "sampling_events":
      createIndex(store, "byPlan", "samplingPlanId");
      createIndex(store, "byOccurredAt", "occurredAt");
      break;
    case "samples":
      createIndex(store, "byEvent", "samplingEventId");
      createIndex(store, "byPerson", "personId");
      break;
    case "laboratory_results":
      createIndex(store, "bySample", "sampleId");
      createIndex(store, "byAgent", "exposureAgentId");
      break;
    case "exposure_limit_comparisons":
      createIndex(store, "byResult", "laboratoryResultId");
      createIndex(store, "byLimit", "exposureLimitId");
      break;
    case "professional_interpretations":
      createIndex(store, "byEvent", "samplingEventId");
      createIndex(store, "byAssessment", "exposureAssessmentId");
      break;
    case "corrective_actions":
      createIndex(store, "bySource", ["sourceType", "sourceId"]);
      createIndex(store, "byDueDate", "dueDate");
      createIndex(store, "byAssignedPerson", "assignedPersonId");
      break;
    default:
      break;
  }
}

function addGovernanceIndexes(name: GovernanceStoreName, store: IDBObjectStore) {
  switch (name) {
    case "record_revisions":
      createIndex(store, "byRecord", ["recordType", "recordId"]);
      createIndex(store, "byRecordRevision", ["recordType", "recordId", "revision"], {
        unique: true,
      });
      createIndex(store, "byChangedAt", "changedAt");
      createIndex(store, "byExchangePackage", "exchangePackageId");
      break;
    case "reviews":
    case "approvals":
      createIndex(store, "byRecord", ["recordType", "recordId"]);
      createIndex(store, "byStatus", "status");
      break;
    case "exchange_packages":
      createIndex(store, "byPackageId", "packageId", { unique: true });
      createIndex(store, "byExportedAt", "exportedAt");
      break;
    case "exchange_staging":
      createIndex(store, "byPackageId", "packageId");
      createIndex(store, "byCreatedAt", "createdAt");
      break;
    case "import_runs":
      createIndex(store, "byPackageId", "packageId");
      createIndex(store, "byStartedAt", "startedAt");
      break;
    case "conflict_resolutions":
      createIndex(store, "byImportRun", "importRunId");
      createIndex(store, "byRecord", ["recordType", "recordId"]);
      break;
    case "tombstones":
      createIndex(store, "byRecord", ["recordType", "recordId"]);
      createIndex(store, "byPackageId", "exchangePackageId");
      break;
    case "review_notes":
      createIndex(store, "byRecord", ["recordType", "recordId"]);
      createIndex(store, "byPackageId", "exchangePackageId");
      break;
    case "data_quality_findings":
      createIndex(store, "byRecord", ["recordType", "recordId"]);
      createIndex(store, "byStatus", "status");
      createIndex(store, "bySeverity", "severity");
      break;
    case "backup_manifests":
      createIndex(store, "byCreatedAt", "createdAt");
      createIndex(store, "byDatasetRevision", "datasetRevision");
      break;
    default:
      break;
  }
}

export function createInitialAdamaSchema(
  database: IDBDatabase,
  transaction: IDBTransaction,
) {
  for (const name of SYSTEM_STORE_NAMES) {
    createStore(database, name);
  }

  for (const name of CURRENT_RECORD_STORE_NAMES) {
    const store = createStore(database, name) ?? transaction.objectStore(name);
    addRecordIndexes(store);
    addDomainIndexes(name, store);
  }

  for (const name of GOVERNANCE_STORE_NAMES) {
    const store = createStore(database, name) ?? transaction.objectStore(name);
    addGovernanceIndexes(name, store);
  }
}
