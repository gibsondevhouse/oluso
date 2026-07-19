import { afterEach, describe, expect, it } from "vitest";
import browserV14 from "./__fixtures__/browser-v14.json";
import nativeV10 from "./__fixtures__/native-v10.json";
import {
  deleteAdamaDatabase,
  getDatabaseIdentity,
  initializeDatabaseIdentity,
  openAdamaDatabase,
} from "../database";
import { requestToPromise, transactionToPromise } from "../database/idb-utils";
import { migrateLegacyDatabase } from "./legacy-migration";

const databases: IDBDatabase[] = [];
const databaseNames: string[] = [];

async function createDatabase(label: string) {
  const name = `adama-hse-migration-${label}-${crypto.randomUUID()}`;
  databaseNames.push(name);
  const database = await openAdamaDatabase({ name });
  databases.push(database);
  await initializeDatabaseIdentity(database, {
    actorId: "user-hse",
    actorBusinessId: "PER-LOCAL",
    actorDisplayName: "HSE Lead",
    installationLabel: "HSE laptop",
    datasetId: "dataset-migration-test",
    installationId: "installation-hse",
    now: () => new Date("2026-07-18T17:00:00.000Z"),
  });
  return database;
}

async function getAll<T>(database: IDBDatabase, storeName: string) {
  const transaction = database.transaction(storeName, "readonly");
  const completion = transactionToPromise(transaction);
  const values = await requestToPromise<T[]>(transaction.objectStore(storeName).getAll());
  await completion;
  return values;
}

afterEach(async () => {
  for (const database of databases.splice(0)) database.close();
  for (const name of databaseNames.splice(0)) await deleteAdamaDatabase(name);
});

const migrationOptions = {
  actorId: "user-hse",
  installationId: "installation-hse",
  migrationRunId: "migration-browser-v14",
  now: () => new Date("2026-07-18T18:00:00.000Z"),
};

describe("legacy database migration", () => {
  it("atomically migrates a browser v14 snapshot into canonical stores and revisions", async () => {
    const database = await createDatabase("browser");

    const result = await migrateLegacyDatabase(database, browserV14, migrationOptions);

    expect(result).toMatchObject({
      sourceKind: "browser-local-storage",
      sourceSchemaVersion: 14,
    });
    expect(result.importedRecordCount).toBeGreaterThan(30);
    expect(result.dataQualityFindingCount).toBeGreaterThan(0);
    expect(result.deferredRecordCount).toBeGreaterThan(0);

    const locations = await getAll<Record<string, unknown>>(database, "locations");
    expect(locations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: "legacy-site-tifton",
          nodeType: "Site",
          resolvedSiteId: "legacy-site-tifton",
          revision: 1,
        }),
        expect.objectContaining({
          id: "legacy-unit-7",
          nodeType: "Unit",
          resolvedSiteId: "legacy-site-tifton",
        }),
        expect.objectContaining({ nodeType: "Country", name: "United States" }),
        expect.objectContaining({ nodeType: "StateOrRegion", name: "Georgia" }),
      ]),
    );

    expect(await getAll(database, "chemical_substances")).toHaveLength(1);
    expect(await getAll(database, "chemical_products")).toHaveLength(1);
    expect(await getAll(database, "sds_revisions")).toHaveLength(1);
    expect(await getAll(database, "site_chemical_inventory")).toHaveLength(1);
    expect(await getAll(database, "chemical_uses")).toHaveLength(1);

    expect(await getAll(database, "sampling_plans")).toHaveLength(1);
    expect(await getAll(database, "sampling_events")).toHaveLength(1);
    expect(await getAll(database, "samples")).toHaveLength(1);
    expect(await getAll(database, "laboratory_results")).toHaveLength(1);
    expect(await getAll(database, "exposure_limit_comparisons")).toEqual([]);
    expect(await getAll(database, "professional_interpretations")).toEqual([]);
    expect(await getAll(database, "exposure_determinations")).toEqual([]);

    const migrationRuns = await getAll<Record<string, unknown>>(database, "migration_runs");
    expect(migrationRuns).toEqual([
      expect.objectContaining({
        id: "migration-browser-v14",
        status: "applied",
        deferredRecordCount: result.deferredRecordCount,
      }),
    ]);
    expect(migrationRuns[0]?.deferredRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ collection: "riskAssessments" }),
        expect.objectContaining({ collection: "exposureAssessments" }),
      ]),
    );

    expect(await getAll(database, "record_revisions")).toHaveLength(result.importedRecordCount);
    expect((await getDatabaseIdentity(database))?.dataset.datasetRevision).toBe(1);
  });

  it("migrates a native v10 export and preserves archived lifecycle evidence", async () => {
    const database = await createDatabase("native");
    const result = await migrateLegacyDatabase(database, nativeV10, {
      ...migrationOptions,
      migrationRunId: "migration-native-v10",
    });

    expect(result.sourceKind).toBe("tauri-sqlite");
    expect(result.sourceSchemaVersion).toBe(10);
    const storage = (await getAll<Record<string, unknown>>(database, "locations")).find(
      (record) => record.id === "native-storage-1",
    );
    expect(storage).toMatchObject({
      nodeType: "StorageArea",
      resolvedSiteId: "native-site-ocilla",
      lifecycleStatus: "archived",
      archiveReason: "Reconfigured",
    });
    expect(await getAll(database, "chemical_products")).toHaveLength(1);
    expect(await getAll(database, "sds_revisions")).toHaveLength(1);
  });

  it("rolls back every target and governance write when a migration cannot commit", async () => {
    const database = await createDatabase("atomic-failure");
    await migrateLegacyDatabase(database, browserV14, migrationOptions);
    const beforeIdentity = await getDatabaseIdentity(database);
    const beforeLocations = await getAll(database, "locations");
    const beforeRevisions = await getAll(database, "record_revisions");

    await expect(
      migrateLegacyDatabase(database, browserV14, {
        ...migrationOptions,
        migrationRunId: "migration-browser-v14-retry",
      }),
    ).rejects.toBeTruthy();

    expect(await getAll(database, "locations")).toEqual(beforeLocations);
    expect(await getAll(database, "record_revisions")).toEqual(beforeRevisions);
    expect(await getAll(database, "migration_runs")).toHaveLength(1);
    expect(await getDatabaseIdentity(database)).toEqual(beforeIdentity);
  });
});
