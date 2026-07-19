import { afterEach, describe, expect, it } from "vitest";
import {
  ADAMA_DATABASE_VERSION,
  deleteAdamaDatabase,
  initializeDatabaseIdentity,
  openAdamaDatabase,
} from "../database";
import { requestToPromise, transactionToPromise } from "../database/idb-utils";

const databases: IDBDatabase[] = [];
const names: string[] = [];

afterEach(async () => {
  for (const database of databases.splice(0)) database.close();
  for (const name of names.splice(0)) await deleteAdamaDatabase(name);
});

function record(id: string, businessId: string, data: Record<string, unknown>) {
  return {
    id, businessId, revision: 4,
    createdAt: "2025-01-01T00:00:00.000Z", createdBy: "legacy-user",
    updatedAt: "2026-01-01T00:00:00.000Z", updatedBy: "legacy-user",
    originInstallationId: "legacy-installation", lifecycleStatus: "active",
    archivedAt: null, archivedBy: null, archiveReason: null, archivedReason: null,
    ...data,
  };
}

async function getAll<T = Record<string, unknown>>(database: IDBDatabase, storeName: string) {
  const transaction = database.transaction(storeName, "readonly");
  const completion = transactionToPromise(transaction);
  const result = await requestToPromise<T[]>(transaction.objectStore(storeName).getAll());
  await completion;
  return result;
}

async function seedVersionTwo(name: string, includeConflict = false) {
  const database = await openAdamaDatabase({ name, version: 2 });
  await initializeDatabaseIdentity(database, {
    actorId: "legacy-user", actorBusinessId: "PER-LEGACY", actorDisplayName: "Legacy User",
    actorInitials: "LU", installationLabel: "Legacy installation", installationId: "legacy-installation",
  });
  const stores = ["organizations", "locations", "processes", "tasks", "chemical_uses", "data_quality_findings"];
  const transaction = database.transaction(stores, "readwrite");
  const completion = transactionToPromise(transaction);
  transaction.objectStore("organizations").put(record("org-adama", "ORG-ADAMA", {
    name: "ADAMA United States", organizationType: "ADAMA Entity", status: "Active", description: "",
    primaryContactPersonId: null,
  }));
  transaction.objectStore("locations").put(record("loc-country", "LOC-US", {
    name: "United States", nodeType: "Country", parentId: null, resolvedSiteId: null, status: "Active", description: "",
  }));
  transaction.objectStore("locations").put(record("loc-state", "LOC-GA", {
    name: "Georgia", nodeType: "StateOrRegion", parentId: "loc-country", resolvedSiteId: null, status: "Active", description: "",
  }));
  transaction.objectStore("locations").put(record("loc-site", "LOC-TIF", {
    name: "Tifton Campus", nodeType: "Site", parentId: "loc-state", resolvedSiteId: "loc-site", status: "Active", description: "",
  }));
  transaction.objectStore("locations").put(record("loc-site-explicit", "LOC-EXPLICIT", {
    name: "Explicit City Campus", nodeType: "Site", parentId: "loc-state", resolvedSiteId: "loc-site-explicit",
    city: "Tifton", status: "Active", description: "",
  }));
  transaction.objectStore("locations").put(record("loc-unit", "LOC-U7", {
    name: "Unit 7", nodeType: "Unit", parentId: "loc-site", resolvedSiteId: "loc-site", status: "Active", description: "",
  }));
  transaction.objectStore("locations").put(record("loc-archived", "LOC-OLD", {
    name: "Retired Building", nodeType: "Building", parentId: "loc-site", resolvedSiteId: "loc-site",
    status: "Inactive", description: "", lifecycleStatus: "archived",
    archivedAt: "2025-12-01T00:00:00.000Z", archivedBy: "legacy-user",
    archiveReason: "Retired before migration", archivedReason: "Retired before migration",
  }));
  transaction.objectStore("processes").put(record("process-wdg", "PROC-WDG", {
    name: "WDG Production", processType: "Production", primaryLocationId: "loc-unit", resolvedSiteId: "loc-site",
    status: "Active", description: "",
  }));
  transaction.objectStore("processes").put(record("process-lab", "PROC-LAB", {
    name: "Release testing", processType: "Laboratory", primaryLocationId: "loc-unit", resolvedSiteId: "loc-site",
    status: "Active", description: "",
  }));
  transaction.objectStore("processes").put(record("process-ambiguous", "PROC-AMB", {
    name: "Special operation", processType: "Custom", primaryLocationId: "loc-unit", resolvedSiteId: "loc-site",
    status: "Active", description: "",
  }));
  transaction.objectStore("tasks").put(record("task-clear", "TASK-CLEAR", {
    name: "Clear blocked duct", taskType: "Maintenance", processId: "process-wdg", locationId: "loc-unit",
    resolvedSiteId: "loc-site", routineStatus: "Non-Routine", operatingCondition: "Maintenance",
    status: "Active", description: "",
  }));
  transaction.objectStore("chemical_uses").put(record("use-wdg", "USE-WDG", {
    productId: "product-wdg", siteId: "loc-site", locationId: "loc-unit", processId: "process-wdg",
    operatingCondition: "Routine", frequency: "Daily", status: "Active",
  }));
  if (includeConflict) {
    transaction.objectStore("data_quality_findings").put(record("existing-conflict", "DQF-V3-LOCATION-SITE-CITY-UNKNOWN-6C6F632D73697465", {
      title: "Existing business ID conflict", status: "Open", severity: "Moderate", recordType: "Location", recordId: "other",
    }));
  }
  await completion;
  database.close();
}

describe("enterprise, Location, and Function schema upgrade", () => {
  it("upgrades v2 records atomically while preserving identity, revision, lifecycle, and scenario evidence", async () => {
    const name = `enterprise-upgrade-${crypto.randomUUID()}`;
    names.push(name);
    await seedVersionTwo(name);
    const database = await openAdamaDatabase({ name });
    databases.push(database);
    expect(database.version).toBe(ADAMA_DATABASE_VERSION);

    for (const storeName of [
      "operational_functions", "location_function_assignments", "organization_location_assignments",
      "organization_function_responsibilities", "process_location_assignments",
    ]) expect([...database.objectStoreNames]).toContain(storeName);

    const locations = await getAll<Record<string, unknown> & { id: string }>(database, "locations");
    const state = locations.find((item) => item.id === "loc-state")!;
    const site = locations.find((item) => item.id === "loc-site")!;
    const unit = locations.find((item) => item.id === "loc-unit")!;
    const archived = locations.find((item) => item.id === "loc-archived")!;
    const explicitSite = locations.find((item) => item.id === "loc-site-explicit")!;
    const explicitCity = locations.find((item) => item.nodeType === "CityOrMunicipality" && item.name === "Tifton")!;
    expect(state).toMatchObject({ nodeType: "StateOrProvince", resolvedCountryId: "loc-country", resolvedStateOrProvinceId: "loc-state", revision: 4 });
    expect(site).toMatchObject({ id: "loc-site", parentId: "loc-state", resolvedCountryId: "loc-country", resolvedStateOrProvinceId: "loc-state", resolvedCityOrMunicipalityId: null, revision: 4 });
    expect(unit).toMatchObject({ resolvedSiteId: "loc-site", resolvedCountryId: "loc-country", revision: 4 });
    expect(archived).toMatchObject({
      id: "loc-archived", lifecycleStatus: "archived", revision: 4,
      archivedAt: "2025-12-01T00:00:00.000Z", archivedReason: "Retired before migration",
    });
    expect(explicitCity).toMatchObject({ parentId: "loc-state", resolvedCityOrMunicipalityId: explicitCity.id });
    expect(explicitSite).toMatchObject({
      id: "loc-site-explicit", parentId: explicitCity.id,
      resolvedStateOrProvinceId: "loc-state", resolvedCityOrMunicipalityId: explicitCity.id,
      resolvedCountyOrDistrictId: null, revision: 4,
    });
    expect(locations.filter((item) => item.nodeType === "CountyOrDistrict")).toEqual([]);

    expect(await getAll(database, "operational_functions")).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "operational-function:manufacturing", name: "Manufacturing" }),
      expect.objectContaining({ id: "operational-function:packaging", name: "Packaging" }),
    ]));
    expect(await getAll(database, "location_function_assignments")).toEqual(expect.arrayContaining([
      expect.objectContaining({ locationId: "loc-unit", operationalFunctionId: "operational-function:manufacturing", isPrimary: true }),
      expect.objectContaining({ locationId: "loc-unit", operationalFunctionId: "operational-function:laboratory", isPrimary: true }),
    ]));
    expect(await getAll(database, "location_function_assignments")).toHaveLength(2);
    expect(await getAll(database, "process_location_assignments")).toEqual(expect.arrayContaining([
      expect.objectContaining({ processId: "process-wdg", locationId: "loc-unit", relationshipType: "Primary" }),
      expect.objectContaining({ processId: "process-lab", locationId: "loc-unit", relationshipType: "Primary" }),
      expect.objectContaining({ processId: "process-ambiguous", locationId: "loc-unit", relationshipType: "Primary" }),
    ]));
    expect(await getAll(database, "process_location_assignments")).toHaveLength(3);
    const migratedProcesses = await getAll<Record<string, unknown> & { id: string }>(database, "processes");
    expect(migratedProcesses).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "process-wdg", operationalFunctionId: "operational-function:manufacturing", revision: 4 }),
      expect.objectContaining({ id: "process-lab", operationalFunctionId: "operational-function:laboratory", revision: 4 }),
    ]));
    expect(migratedProcesses.find((item) => item.id === "process-ambiguous")).not.toHaveProperty("operationalFunctionId");
    expect(await getAll(database, "tasks")).toEqual([
      expect.not.objectContaining({ operatingCondition: expect.anything(), routineStatus: expect.anything() }),
    ]);
    expect(await getAll(database, "tasks")).toEqual([
      expect.objectContaining({ routineClassification: "Normally Non-Routine", revision: 4 }),
    ]);
    expect(await getAll(database, "chemical_uses")).toEqual([
      expect.objectContaining({ operationalFunctionId: "operational-function:manufacturing", operatingCondition: "Routine", revision: 4 }),
    ]);
    const findings = await getAll<Record<string, unknown>>(database, "data_quality_findings");
    expect(findings).toEqual(expect.arrayContaining([
      expect.objectContaining({ findingCode: "SITE_CITY_UNKNOWN", recordId: "loc-site" }),
      expect.objectContaining({ findingCode: "TASK_OPERATING_CONDITION_MIGRATED", recordId: "task-clear" }),
      expect.objectContaining({ findingCode: "ORGANIZATION_CLASSIFICATION_AMBIGUOUS", recordId: "org-adama" }),
      expect.objectContaining({ findingCode: "PROCESS_FUNCTION_AMBIGUOUS", recordId: "process-ambiguous" }),
    ]));
    expect(findings).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ findingCode: "SITE_CITY_UNKNOWN", recordId: "loc-site-explicit" }),
    ]));
    expect(await getAll(database, "migration_runs")).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "schema-v3-enterprise-location-functions",
        migrationEvidence: {
          locationHierarchyBeforeUpgrade: expect.arrayContaining([
            expect.objectContaining({ id: "loc-state", nodeType: "StateOrRegion", parentId: "loc-country" }),
            expect.objectContaining({ id: "loc-site", parentId: "loc-state" }),
          ]),
        },
      }),
    ]));

    const counts = {
      functions: (await getAll(database, "operational_functions")).length,
      assignments: (await getAll(database, "location_function_assignments")).length,
      findings: findings.length,
    };
    database.close();
    databases.splice(databases.indexOf(database), 1);
    const reopened = await openAdamaDatabase({ name });
    databases.push(reopened);
    expect({
      functions: (await getAll(reopened, "operational_functions")).length,
      assignments: (await getAll(reopened, "location_function_assignments")).length,
      findings: (await getAll(reopened, "data_quality_findings")).length,
    }).toEqual(counts);
  });

  it("rolls back the entire versionchange transaction when migrated evidence conflicts", async () => {
    const name = `enterprise-upgrade-rollback-${crypto.randomUUID()}`;
    names.push(name);
    await seedVersionTwo(name, true);
    await expect(openAdamaDatabase({ name })).rejects.toBeTruthy();
    const versionTwo = await openAdamaDatabase({ name, version: 2 });
    databases.push(versionTwo);
    expect(versionTwo.version).toBe(2);
    // fake-indexeddb retains the created store name after an aborted versionchange,
    // but all migration writes and the database version still roll back.
    if ([...versionTwo.objectStoreNames].includes("operational_functions")) {
      expect(await getAll(versionTwo, "operational_functions")).toEqual([]);
    }
    expect(await getAll(versionTwo, "locations")).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: "loc-state", nodeType: "StateOrRegion", revision: 4 }),
    ]));
    expect(await getAll(versionTwo, "tasks")).toEqual([
      expect.objectContaining({ id: "task-clear", operatingCondition: "Maintenance", revision: 4 }),
    ]);
  });
});
