import { OPERATIONAL_FUNCTION_CATEGORIES } from "$lib/domain/operations";
import { requestToPromise } from "../database/idb-utils";

type StoredRecord = Record<string, unknown> & {
  id: string;
  businessId?: string;
  revision?: number;
  createdAt?: string;
  createdBy?: string;
  updatedAt?: string;
  updatedBy?: string;
  originInstallationId?: string;
  lastExchangePackageId?: string;
  lifecycleStatus?: "active" | "archived";
  archivedAt?: string | null;
  archivedBy?: string | null;
  archiveReason?: string | null;
  archivedReason?: string | null;
};

const MIGRATION_ID = "schema-v3-enterprise-location-functions";
const MIGRATION_ACTOR = "system:migration:v3";

const LEGACY_ORGANIZATION_TYPE_MAP: Record<string, string> = {
  Department: "Department",
  Contractor: "Contractor",
  "Temporary Agency": "Temporary Agency",
  Laboratory: "Laboratory Provider",
  "Waste Vendor": "Waste Vendor",
  "Service Vendor": "Service Vendor",
  Regulator: "Regulator",
  "Medical Provider": "Medical Provider",
  Other: "Other",
};

const PROCESS_FUNCTION_MAP: Record<string, string> = {
  Production: "Manufacturing",
  Warehouse: "Warehousing",
  Laboratory: "Laboratory",
  Maintenance: "Maintenance",
  Utilities: "Utilities",
  Administrative: "Administration",
};

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function businessKey(value: string) {
  return Array.from(value).map((character) => character.codePointAt(0)!.toString(16).padStart(2, "0")).join("").toUpperCase();
}

function envelope(id: string, businessId: string, timestamp: string, originInstallationId = MIGRATION_ID) {
  return {
    id,
    businessId,
    revision: 1,
    createdAt: timestamp,
    createdBy: MIGRATION_ACTOR,
    updatedAt: timestamp,
    updatedBy: MIGRATION_ACTOR,
    originInstallationId,
    lifecycleStatus: "active" as const,
    archivedAt: null,
    archivedBy: null,
    archiveReason: null,
    archivedReason: null,
  };
}

function finding(
  code: string,
  recordType: string,
  record: StoredRecord,
  message: string,
  timestamp: string,
  sourceEvidence: unknown = record,
) {
  const id = `migration-finding:v3:${recordType}:${record.id}:${code}`;
  return {
    ...envelope(id, `DQF-V3-${slug(`${recordType}-${code}`).toUpperCase()}-${businessKey(record.id)}`, timestamp, record.originInstallationId),
    title: message,
    code,
    findingCode: code,
    summary: message,
    details: message,
    recommendedResolution: "Review the preserved migration evidence and confirm or correct the enterprise mapping.",
    severity: "Moderate",
    status: "Open",
    recordType,
    recordId: record.id,
    sourceRecordType: recordType,
    sourceRecordId: record.id,
    sourceCollection: recordType,
    sourceEvidence: structuredClone(sourceEvidence),
  };
}

function revision(recordType: string, record: StoredRecord, timestamp: string) {
  return {
    id: `${recordType}:${record.id}:1`,
    recordType,
    recordId: record.id,
    revision: 1,
    operation: "import",
    changedAt: timestamp,
    changedBy: MIGRATION_ACTOR,
    changedInstallationId: record.originInstallationId ?? MIGRATION_ID,
    source: "migration",
    changeReason: "ADAMA enterprise, global Location, and operational Function schema upgrade",
    after: record,
  };
}

function normalizedTaskClassification(task: StoredRecord) {
  const condition = String(task.operatingCondition ?? "");
  const routineStatus = String(task.routineStatus ?? "");
  if (condition === "Emergency") return "Emergency Only";
  if (condition === "Routine" || routineStatus === "Routine") return "Normally Routine";
  if (condition || routineStatus === "Non-Routine") return "Normally Non-Routine";
  return "Unknown";
}

function migrateRecords(transaction: IDBTransaction, timestamp: string) {
  const organizationsStore = transaction.objectStore("organizations");
  const locationsStore = transaction.objectStore("locations");
  const processesStore = transaction.objectStore("processes");
  const tasksStore = transaction.objectStore("tasks");
  const chemicalUsesStore = transaction.objectStore("chemical_uses");

  return Promise.all([
    requestToPromise<StoredRecord[]>(organizationsStore.getAll()),
    requestToPromise<StoredRecord[]>(locationsStore.getAll()),
    requestToPromise<StoredRecord[]>(processesStore.getAll()),
    requestToPromise<StoredRecord[]>(tasksStore.getAll()),
    requestToPromise<StoredRecord[]>(chemicalUsesStore.getAll()),
    requestToPromise<StoredRecord[]>(transaction.objectStore("data_quality_findings").getAll()),
    requestToPromise<Record<string, unknown> | undefined>(transaction.objectStore("dataset_metadata").get("current")),
  ]).then(([organizations, locations, processes, tasks, chemicalUses, existingFindings, dataset]) => {
    const findings: StoredRecord[] = [];
    const createdRecords: Array<{ recordType: string; record: StoredRecord }> = [];

    for (const organization of organizations) {
      const sourceType = String(organization.organizationType ?? "Other");
      const mappedType = LEGACY_ORGANIZATION_TYPE_MAP[sourceType] ?? "Other";
      organizationsStore.put({
        ...organization,
        organizationType: mappedType,
        parentOrganizationId: organization.parentOrganizationId ?? null,
        organizationCode: organization.organizationCode ?? "",
        legalEntityCode: organization.legalEntityCode ?? "",
        countryCode: organization.countryCode ?? "",
      });
      if (sourceType === "ADAMA Entity" || !LEGACY_ORGANIZATION_TYPE_MAP[sourceType]) {
        findings.push(finding(
          "ORGANIZATION_CLASSIFICATION_AMBIGUOUS",
          "Organization",
          organization,
          `Organization ${organization.businessId ?? organization.id} requires confirmation of its internal or external Organization type and hierarchy.`,
          timestamp,
        ));
      }
    }

    const normalizedLocations: StoredRecord[] = locations.map((record) => ({
      ...record,
      nodeType: record.nodeType === "StateOrRegion" ? "StateOrProvince" : record.nodeType,
      countryCode: record.countryCode ?? "",
      stateOrProvinceCode: record.stateOrProvinceCode ?? "",
      postalCode: record.postalCode ?? "",
      latitude: record.latitude ?? null,
      longitude: record.longitude ?? null,
      addressLine1: record.addressLine1 ?? "",
      addressLine2: record.addressLine2 ?? "",
    }));
    const locationById = new Map(normalizedLocations.map((location) => [location.id, location]));
    const derivedLocationIds = new Set<string>();
    const geographyKeyToId = new Map(
      normalizedLocations.map((location) => [
        `${String(location.parentId ?? "")}\u0000${String(location.nodeType)}\u0000${String(location.name ?? "").trim().toLocaleLowerCase()}`,
        location.id,
      ]),
    );
    const createGeographyNode = (
      source: StoredRecord,
      nodeType: "CountyOrDistrict" | "CityOrMunicipality",
      name: string,
      parentId: string,
    ) => {
      const key = `${parentId}\u0000${nodeType}\u0000${name.trim().toLocaleLowerCase()}`;
      const existingId = geographyKeyToId.get(key);
      if (existingId) return existingId;
      const id = `migration-location:v3:${nodeType}:${businessKey(`${parentId}:${name.trim().toLocaleLowerCase()}`)}`;
      const created: StoredRecord = {
        ...envelope(id, `LOC-V3-${nodeType === "CountyOrDistrict" ? "COUNTY" : "CITY"}-${businessKey(`${parentId}:${name}`)}`, timestamp, source.originInstallationId),
        name: name.trim(), nodeType, parentId,
        countryCode: "", stateOrProvinceCode: "", postalCode: "", latitude: null, longitude: null,
        addressLine1: "", addressLine2: "", status: "Active",
        description: "Created only from explicit source geography during the enterprise Location migration.",
      };
      normalizedLocations.push(created);
      locationById.set(id, created);
      geographyKeyToId.set(key, id);
      derivedLocationIds.add(id);
      return id;
    };
    for (const site of normalizedLocations.filter((location) => location.nodeType === "Site" && !derivedLocationIds.has(location.id))) {
      const parent = typeof site.parentId === "string" ? locationById.get(site.parentId) : undefined;
      if (!parent || !["StateOrProvince", "CountyOrDistrict"].includes(String(parent.nodeType))) continue;
      const explicitCounty = String(site.countyOrDistrict ?? site.county ?? site.district ?? "").trim();
      const explicitCity = String(site.cityOrMunicipality ?? site.city ?? site.municipality ?? "").trim();
      let geographyParentId = parent.id;
      if (parent.nodeType === "StateOrProvince" && explicitCounty) {
        geographyParentId = createGeographyNode(site, "CountyOrDistrict", explicitCounty, parent.id);
      }
      if (explicitCity) {
        geographyParentId = createGeographyNode(site, "CityOrMunicipality", explicitCity, geographyParentId);
      }
      if (geographyParentId !== parent.id || explicitCity) site.parentId = geographyParentId;
    }
    const resolvedById = new Map<string, {
      resolvedCountryId: string | null;
      resolvedStateOrProvinceId: string | null;
      resolvedCountyOrDistrictId: string | null;
      resolvedCityOrMunicipalityId: string | null;
      resolvedSiteId: string | null;
    }>();
    const resolving = new Set<string>();
    const resolve = (record: StoredRecord): ReturnType<typeof resolvedById.get> => {
      const cached = resolvedById.get(record.id);
      if (cached) return cached;
      if (resolving.has(record.id)) {
        const empty = { resolvedCountryId: null, resolvedStateOrProvinceId: null, resolvedCountyOrDistrictId: null, resolvedCityOrMunicipalityId: null, resolvedSiteId: null };
        resolvedById.set(record.id, empty);
        return empty;
      }
      resolving.add(record.id);
      const parent = typeof record.parentId === "string" ? locationById.get(record.parentId) : undefined;
      const inherited = parent ? resolve(parent) : undefined;
      const nodeType = String(record.nodeType);
      const result = {
        resolvedCountryId: nodeType === "Country" ? record.id : inherited?.resolvedCountryId ?? null,
        resolvedStateOrProvinceId: nodeType === "StateOrProvince" ? record.id : inherited?.resolvedStateOrProvinceId ?? null,
        resolvedCountyOrDistrictId: nodeType === "CountyOrDistrict" ? record.id : inherited?.resolvedCountyOrDistrictId ?? null,
        resolvedCityOrMunicipalityId: nodeType === "CityOrMunicipality" ? record.id : inherited?.resolvedCityOrMunicipalityId ?? null,
        resolvedSiteId: nodeType === "Site" ? record.id : inherited?.resolvedSiteId ?? null,
      };
      resolving.delete(record.id);
      resolvedById.set(record.id, result);
      return result;
    };
    for (const location of normalizedLocations) {
      const resolved = resolve(location)!;
      const migratedLocation = { ...location, ...resolved };
      locationsStore.put(migratedLocation);
      if (derivedLocationIds.has(location.id)) {
        createdRecords.push({ recordType: "Location", record: migratedLocation });
      }
      if (location.nodeType === "Site" && !resolved.resolvedCityOrMunicipalityId && !resolved.resolvedCountyOrDistrictId) {
        findings.push(finding(
          "SITE_CITY_UNKNOWN",
          "Location",
          location,
          `Site ${location.businessId ?? location.id} has no explicit City, Municipality, County, or District; no geography was invented.`,
          timestamp,
        ));
      }
    }

    const functionStore = transaction.objectStore("operational_functions");
    const functionIdByName = new Map<string, string>();
    for (const category of OPERATIONAL_FUNCTION_CATEGORIES) {
      const id = `operational-function:${slug(category)}`;
      functionIdByName.set(category, id);
      const record: StoredRecord = {
        ...envelope(id, `FUNC-${slug(category).toUpperCase()}`, timestamp),
        name: category,
        functionCategory: category,
        description: `Controlled ADAMA operational Function: ${category}.`,
        status: "Active",
      };
      functionStore.put(record);
      createdRecords.push({ recordType: "OperationalFunction", record });
    }

    const locationFunctionStore = transaction.objectStore("location_function_assignments");
    const processLocationStore = transaction.objectStore("process_location_assignments");
    const activeFunctionPairs = new Set<string>();
    const processFunctionById = new Map<string, string>();
    for (const process of processes) {
      const primaryLocationId = String(process.primaryLocationId ?? "");
      if (primaryLocationId) {
        const processLocationRecord: StoredRecord = {
          ...envelope(`process-location:${process.id}:primary`, `PLA-${businessKey(process.id)}-PRIMARY`, timestamp, process.originInstallationId),
          processId: process.id,
          locationId: primaryLocationId,
          relationshipType: "Primary",
          sequence: null,
          effectiveFrom: null,
          effectiveTo: null,
          status: "Active",
          notes: "Created from the preserved Process primary Location during schema migration.",
        };
        processLocationStore.put(processLocationRecord);
        createdRecords.push({ recordType: "ProcessLocationAssignment", record: processLocationRecord });
      }

      const functionName = PROCESS_FUNCTION_MAP[String(process.processType ?? "")];
      if (!functionName) {
        findings.push(finding(
          "PROCESS_FUNCTION_AMBIGUOUS",
          "Process",
          process,
          `Process ${process.businessId ?? process.id} requires confirmation of its Operational Function.`,
          timestamp,
        ));
        continue;
      }
      const operationalFunctionId = functionIdByName.get(functionName)!;
      processFunctionById.set(process.id, operationalFunctionId);
      processesStore.put({ ...process, operationalFunctionId });

      if (!primaryLocationId) continue;
      const pair = `${primaryLocationId}\u0000${operationalFunctionId}`;
      if (!activeFunctionPairs.has(pair)) {
        activeFunctionPairs.add(pair);
        const assignment: StoredRecord = {
          ...envelope(`location-function:${businessKey(primaryLocationId)}:${businessKey(operationalFunctionId)}`, `LFA-${businessKey(primaryLocationId)}-${slug(functionName).toUpperCase()}`, timestamp, process.originInstallationId),
          locationId: primaryLocationId,
          operationalFunctionId,
          assignmentType: "Primary Function",
          effectiveFrom: null,
          effectiveTo: null,
          isPrimary: true,
          scopeDescription: "Migrated from an explicit Process type and primary Location.",
          responsibleOrganizationId: null,
          responsiblePersonId: null,
          status: "Active",
          notes: "Review the migrated Function assignment scope and effective period.",
        };
        locationFunctionStore.put(assignment);
        createdRecords.push({ recordType: "LocationFunctionAssignment", record: assignment });
      }
    }

    for (const task of tasks) {
      const sourceCondition = task.operatingCondition;
      const sourceRoutineStatus = task.routineStatus;
      const next: StoredRecord = { ...task, routineClassification: normalizedTaskClassification(task) };
      delete next.operatingCondition;
      delete next.routineStatus;
      tasksStore.put(next);
      if (sourceCondition !== undefined || sourceRoutineStatus !== undefined) {
        findings.push(finding(
          "TASK_OPERATING_CONDITION_MIGRATED",
          "Task",
          task,
          `Task ${task.businessId ?? task.id} had a fixed operating condition removed from its reusable definition; the prior values remain in this migration evidence.`,
          timestamp,
          { operatingCondition: sourceCondition, routineStatus: sourceRoutineStatus, task },
        ));
      }
    }

    for (const use of chemicalUses) {
      const operationalFunctionId = processFunctionById.get(String(use.processId ?? ""));
      if (!operationalFunctionId) {
        findings.push(finding(
          "CHEMICAL_USE_FUNCTION_UNRESOLVED",
          "ChemicalUse",
          use,
          `Chemical Use ${use.businessId ?? use.id} could not derive an Operational Function from its Process.`,
          timestamp,
        ));
        continue;
      }
      chemicalUsesStore.put({ ...use, operationalFunctionId });
      const pair = `${String(use.locationId ?? "")}\u0000${operationalFunctionId}`;
      if (!activeFunctionPairs.has(pair)) {
        findings.push(finding(
          "CHEMICAL_USE_FUNCTION_ASSIGNMENT_MISSING",
          "ChemicalUse",
          use,
          `Chemical Use ${use.businessId ?? use.id} refers to a Location without the Process Function assignment.`,
          timestamp,
        ));
      }
    }

    const findingsStore = transaction.objectStore("data_quality_findings");
    const findingIdByBusinessId = new Map(existingFindings.map((item) => [item.businessId, item.id]));
    for (const item of findings) {
      const conflictingId = findingIdByBusinessId.get(item.businessId);
      if (conflictingId && conflictingId !== item.id) {
        throw new Error(`Migration finding business ID ${item.businessId} conflicts with ${conflictingId}.`);
      }
      findingsStore.put(item);
      createdRecords.push({ recordType: "DataQualityFinding", record: item });
    }
    const revisionsStore = transaction.objectStore("record_revisions");
    for (const created of createdRecords) revisionsStore.put(revision(created.recordType, created.record, timestamp));

    if (organizations.length || locations.length || processes.length || tasks.length || chemicalUses.length) {
      transaction.objectStore("migration_runs").put({
        id: MIGRATION_ID,
        status: "completed",
        sourceKind: "indexeddb-schema",
        sourceSchemaVersion: 2,
        targetSchemaVersion: 3,
        startedAt: timestamp,
        completedAt: timestamp,
        actorId: MIGRATION_ACTOR,
        preservedRecordCounts: {
          organizations: organizations.length,
          locations: locations.length,
          processes: processes.length,
          tasks: tasks.length,
          chemicalUses: chemicalUses.length,
        },
        migrationEvidence: {
          locationHierarchyBeforeUpgrade: locations.map((location) => ({
            id: location.id,
            businessId: location.businessId ?? null,
            nodeType: location.nodeType ?? null,
            parentId: location.parentId ?? null,
            resolvedSiteId: location.resolvedSiteId ?? null,
          })),
        },
        createdRecordCount: createdRecords.length,
        dataQualityFindingCount: findings.length,
      });
    }

    if (dataset) {
      transaction.objectStore("dataset_metadata").put({ ...dataset, schemaVersion: 3, updatedAt: timestamp, updatedBy: MIGRATION_ACTOR });
    }
  });
}

/**
 * Migrates released v2 records inside the versionchange transaction. Every write is
 * committed or rolled back with the structural upgrade.
 */
export function migrateEnterpriseLocationFunctionRecords(transaction: IDBTransaction) {
  const timestamp = new Date().toISOString();
  void migrateRecords(transaction, timestamp).catch(() => transaction.abort());
}
