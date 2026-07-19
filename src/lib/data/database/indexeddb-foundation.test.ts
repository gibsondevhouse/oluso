import { afterEach, describe, expect, it } from "vitest";
import {
  ADAMA_STORE_NAMES,
  deleteAdamaDatabase,
  getDatabaseIdentity,
  initializeDatabaseIdentity,
  openAdamaDatabase,
  type MutationContext,
  type LocalUserProfile,
  type RecordEnvelope,
  StaleRevisionError,
} from ".";
import { requestToPromise, transactionToPromise } from "./idb-utils";
import {
  canonicalStringify,
  exportDatabaseBackup,
  restoreDatabaseBackup,
  sha256Hex,
  validateDatabaseBackup,
} from "../backup/index";
import { ExchangeStagingRepository } from "../exchange";
import { IndexedDbRecordRepository } from "../repositories";
import { RevisionRepository, runMutationTransaction } from "../revisions";

interface TestLocation extends RecordEnvelope {
  name: string;
  nodeType: "Country" | "StateOrRegion" | "Site" | "Unit";
  parentId: string | null;
  resolvedSiteId: string | null;
}

const databases: IDBDatabase[] = [];
const databaseNames: string[] = [];

function nextName(label: string) {
  const name = `adama-hse-test-${label}-${crypto.randomUUID()}`;
  databaseNames.push(name);
  return name;
}

async function createDatabase(label: string) {
  const database = await openAdamaDatabase({ name: nextName(label) });
  databases.push(database);
  return database;
}

async function initialize(database: IDBDatabase) {
  return initializeDatabaseIdentity(database, {
    actorId: "user-hse",
    actorBusinessId: "PER-0001",
    actorDisplayName: "HSE Lead",
    installationLabel: "HSE laptop",
    datasetId: "dataset-test",
    installationId: "installation-hse",
    now: () => new Date("2026-07-18T12:00:00.000Z"),
  });
}

const context: MutationContext = {
  actorId: "user-hse",
  installationId: "installation-hse",
  source: "local",
  reason: "Test mutation",
};

afterEach(async () => {
  for (const database of databases.splice(0)) database.close();
  for (const name of databaseNames.splice(0)) await deleteAdamaDatabase(name);
});

describe("IndexedDB foundation", () => {
  it("creates every target store and critical indexes", async () => {
    const database = await createDatabase("schema");
    expect(Array.from(database.objectStoreNames)).toEqual(
      expect.arrayContaining([...ADAMA_STORE_NAMES]),
    );

    const transaction = database.transaction([
      "organizations", "locations", "operational_functions", "location_function_assignments",
      "organization_location_assignments", "organization_function_responsibilities", "processes",
      "process_location_assignments", "exposure_scenarios", "record_revisions",
    ], "readonly");
    expect(Array.from(transaction.objectStore("organizations").indexNames)).toEqual(
      expect.arrayContaining(["byParentOrganization", "byOrganizationType", "byCountryCode"]),
    );
    expect(Array.from(transaction.objectStore("locations").indexNames)).toEqual(
      expect.arrayContaining([
        "byBusinessId", "byParent", "byNodeType", "byResolvedCountry",
        "byResolvedStateOrProvince", "byResolvedCountyOrDistrict",
        "byResolvedCityOrMunicipality", "byResolvedSite",
      ]),
    );
    expect(Array.from(transaction.objectStore("operational_functions").indexNames)).toEqual(
      expect.arrayContaining(["byName", "byFunctionCategory", "byLifecycleStatus"]),
    );
    expect(Array.from(transaction.objectStore("location_function_assignments").indexNames)).toEqual(
      expect.arrayContaining(["byLocation", "byFunction", "byLocationAndFunction", "byResponsibleOrganization", "byEffectiveFrom", "byStatus"]),
    );
    expect(Array.from(transaction.objectStore("organization_location_assignments").indexNames)).toEqual(
      expect.arrayContaining(["byOrganization", "byLocation", "byRelationshipType", "byOrganizationAndLocation"]),
    );
    expect(Array.from(transaction.objectStore("organization_function_responsibilities").indexNames)).toEqual(
      expect.arrayContaining(["byOrganization", "byFunction", "byLocation", "byResponsibilityType"]),
    );
    expect(Array.from(transaction.objectStore("processes").indexNames)).toEqual(
      expect.arrayContaining(["byOperationalFunction", "byPrimaryLocation", "byResolvedSite"]),
    );
    expect(Array.from(transaction.objectStore("process_location_assignments").indexNames)).toEqual(
      expect.arrayContaining(["byProcess", "byLocation", "byRelationshipType", "byProcessAndLocation"]),
    );
    expect(Array.from(transaction.objectStore("exposure_scenarios").indexNames)).toEqual(
      expect.arrayContaining(["byResolvedSite", "byOperationalFunction", "byOperatingCondition"]),
    );
    expect(Array.from(transaction.objectStore("record_revisions").indexNames)).toEqual(
      expect.arrayContaining(["byRecord", "byRecordRevision", "byExchangePackage"]),
    );
  });

  it("upgrades an existing version 1 database with typed foundation relationship indexes", async () => {
    const name = nextName("schema-upgrade");
    const versionOne = await openAdamaDatabase({ name, version: 1 });
    versionOne.close();
    const upgraded = await openAdamaDatabase({ name });
    databases.push(upgraded);

    const transaction = upgraded.transaction(["people", "processes", "tasks"], "readonly");
    expect(Array.from(transaction.objectStore("people").indexNames)).toEqual(
      expect.arrayContaining(["byOrganization", "bySupervisor", "byPrimarySite"]),
    );
    expect(Array.from(transaction.objectStore("processes").indexNames)).toContain("byPrimaryLocation");
    expect(Array.from(transaction.objectStore("tasks").indexNames)).toContain("byLocation");
  });

  it("initializes stable dataset, installation, and local-user identity", async () => {
    const database = await createDatabase("identity");
    const first = await initialize(database);
    const second = await initialize(database);
    const loaded = await getDatabaseIdentity(database);

    expect(first.dataset).toEqual(second.dataset);
    expect(first.installation).toEqual(second.installation);
    expect(loaded).toEqual(first);
    expect(loaded?.dataset.datasetRevision).toBe(0);
  });

  it("writes current state, immutable history, and dataset revision atomically", async () => {
    const database = await createDatabase("revisions");
    await initialize(database);
    const ids = ["location-country", "unused"];
    const repository = new IndexedDbRecordRepository<TestLocation>(database, "locations", {
      recordType: "Location",
      now: () => new Date("2026-07-18T13:00:00.000Z"),
      createId: () => ids.shift() ?? crypto.randomUUID(),
    });

    const created = await repository.create(
      {
        businessId: "LOC-US",
        name: "United States",
        nodeType: "Country",
        parentId: null,
        resolvedSiteId: null,
      },
      context,
    );
    const updated = await repository.update(
      created.id,
      { name: "United States of America" },
      created.revision,
      context,
    );

    expect(updated).toMatchObject({ id: "location-country", revision: 2 });
    const history = await new RevisionRepository(database).listForRecord<TestLocation>(
      "Location",
      created.id,
    );
    expect(history.map((revision) => revision.operation)).toEqual(["create", "update"]);
    expect(history[0]?.before).toBeUndefined();
    expect(history[1]?.before).toMatchObject({ name: "United States", revision: 1 });
    expect(history[1]?.after).toMatchObject({ name: "United States of America", revision: 2 });
    expect((await getDatabaseIdentity(database))?.dataset.datasetRevision).toBe(2);
  });

  it("rejects stale writes without changing current state or history", async () => {
    const database = await createDatabase("stale");
    await initialize(database);
    const repository = new IndexedDbRecordRepository<TestLocation>(database, "locations", {
      recordType: "Location",
      createId: () => "location-country",
    });
    const created = await repository.create(
      {
        businessId: "LOC-US",
        name: "United States",
        nodeType: "Country",
        parentId: null,
        resolvedSiteId: null,
      },
      context,
    );

    await expect(
      repository.update(created.id, { name: "Stale edit" }, 0, context),
    ).rejects.toBeInstanceOf(StaleRevisionError);
    expect(await repository.get(created.id)).toMatchObject({ name: "United States", revision: 1 });
    expect(await new RevisionRepository(database).listForRecord("Location", created.id)).toHaveLength(
      1,
    );
    expect((await getDatabaseIdentity(database))?.dataset.datasetRevision).toBe(1);
  });

  it("rolls back a multi-record transaction when any operation fails", async () => {
    const database = await createDatabase("rollback");
    await initialize(database);

    await expect(
      runMutationTransaction(
        database,
        ["locations", "processes"],
        context,
        async (session) => {
          await session.createRecord({
            storeName: "locations",
            recordType: "Location",
            input: { businessId: "LOC-1", name: "Site" },
          });
          await session.createRecord({
            storeName: "processes",
            recordType: "Process",
            input: { businessId: "PROC-1", name: "Process" },
          });
          throw new Error("Simulated invariant failure");
        },
        { createId: (() => { const ids = ["loc-1", "proc-1"]; return () => ids.shift()!; })() },
      ),
    ).rejects.toThrow();

    const locationRepository = new IndexedDbRecordRepository<TestLocation>(database, "locations", {
      recordType: "Location",
    });
    expect(await locationRepository.list({ includeArchived: true })).toEqual([]);
    expect((await getDatabaseIdentity(database))?.dataset.datasetRevision).toBe(0);
  });

  it("archives and restores with attributed immutable revisions", async () => {
    const database = await createDatabase("lifecycle");
    await initialize(database);
    const repository = new IndexedDbRecordRepository<TestLocation>(database, "locations", {
      recordType: "Location",
      createId: () => "location-country",
      now: () => new Date("2026-07-18T14:00:00.000Z"),
    });
    const created = await repository.create(
      {
        businessId: "LOC-US",
        name: "United States",
        nodeType: "Country",
        parentId: null,
        resolvedSiteId: null,
      },
      context,
    );
    const archived = await repository.archive(created.id, 1, "Duplicate legacy root", context);
    expect(archived).toMatchObject({
      revision: 2,
      lifecycleStatus: "archived",
      archivedBy: "user-hse",
      archiveReason: "Duplicate legacy root",
    });
    await expect(repository.get(created.id)).rejects.toThrow();
    const restored = await repository.restore(created.id, 2, context);
    expect(restored).toMatchObject({ revision: 3, lifecycleStatus: "active", archivedAt: null });
    const history = await new RevisionRepository(database).listForRecord("Location", created.id);
    expect(history.map((revision) => revision.operation)).toEqual(["create", "archive", "restore"]);
  });

  it("exports, validates, and restores an exact backup", async () => {
    const source = await createDatabase("backup-source");
    await initialize(source);
    const repository = new IndexedDbRecordRepository<TestLocation>(source, "locations", {
      recordType: "Location",
      createId: () => "location-country",
    });
    await repository.create(
      {
        businessId: "LOC-US",
        name: "United States",
        nodeType: "Country",
        parentId: null,
        resolvedSiteId: null,
      },
      context,
    );
    const backup = await exportDatabaseBackup(
      source,
      () => new Date("2026-07-18T15:00:00.000Z"),
    );
    expect((await validateDatabaseBackup(backup)).integrityHash).toBe(backup.integrityHash);

    const destination = await createDatabase("backup-destination");
    await initializeDatabaseIdentity(destination, {
      actorId: "different-user",
      actorBusinessId: "PER-9999",
      actorDisplayName: "Different User",
      installationLabel: "Replacement laptop",
      datasetId: "different-dataset",
      installationId: "different-installation",
    });
    await restoreDatabaseBackup(destination, backup);
    const restoredRepository = new IndexedDbRecordRepository<TestLocation>(
      destination,
      "locations",
      { recordType: "Location" },
    );
    expect(await restoredRepository.list()).toEqual(await repository.list());
    expect(await getDatabaseIdentity(destination)).toMatchObject({
      dataset: (await getDatabaseIdentity(source))!.dataset,
      installation: { installationId: "different-installation" },
      localUser: { id: "different-user" },
    });
    const restoredUsersTransaction = destination.transaction("local_users", "readonly");
    const restoredUsers = await requestToPromise<LocalUserProfile[]>(
      restoredUsersTransaction.objectStore("local_users").getAll(),
    );
    await transactionToPromise(restoredUsersTransaction);
    expect(restoredUsers.map((user) => user.id)).toEqual(
      expect.arrayContaining(["user-hse", "different-user"]),
    );

    const tampered = structuredClone(backup);
    (tampered.stores.locations[0] as TestLocation).name = "Tampered";
    await expect(validateDatabaseBackup(tampered)).rejects.toMatchObject({
      code: "BACKUP_INTEGRITY_FAILED",
    });
  });

  it("rolls back an internally valid backup when a restore fails partway", async () => {
    const source = await createDatabase("backup-invalid-source");
    await initialize(source);
    const sourceRepository = new IndexedDbRecordRepository<TestLocation>(source, "locations", {
      recordType: "Location",
      createId: () => "location-country",
    });
    await sourceRepository.create(
      {
        businessId: "LOC-US",
        name: "United States",
        nodeType: "Country",
        parentId: null,
        resolvedSiteId: null,
      },
      context,
    );
    const invalid = await exportDatabaseBackup(source);
    invalid.stores.locations.push(structuredClone(invalid.stores.locations[0]));
    invalid.storeCounts.locations = invalid.stores.locations.length;
    const { integrityHash: _previousHash, ...payload } = invalid;
    invalid.integrityHash = await sha256Hex(canonicalStringify(payload));

    const destination = await createDatabase("backup-invalid-destination");
    await initializeDatabaseIdentity(destination, {
      actorId: "destination-user",
      actorBusinessId: "PER-DEST",
      actorDisplayName: "Destination User",
      installationLabel: "Destination laptop",
      datasetId: "destination-dataset",
      installationId: "destination-installation",
    });
    const destinationBefore = await getDatabaseIdentity(destination);

    await expect(restoreDatabaseBackup(destination, invalid)).rejects.toMatchObject({
      code: "CONSTRAINT_VIOLATION",
    });
    expect(await getDatabaseIdentity(destination)).toEqual(destinationBefore);
    expect(
      await new IndexedDbRecordRepository<TestLocation>(destination, "locations", {
        recordType: "Location",
      }).list({ includeArchived: true }),
    ).toEqual([]);
  });

  it("keeps exchange staging isolated from durable domain records", async () => {
    const database = await createDatabase("staging");
    await initialize(database);
    const staging = new ExchangeStagingRepository(
      database,
      () => new Date("2026-07-18T16:00:00.000Z"),
      () => "staging-1",
    );
    const record = await staging.stage({
      packageId: "package-1",
      sourceFileName: "manager-review.json",
      status: "validated",
      manifest: { datasetId: "dataset-test" },
      classifications: [],
      validationErrors: [],
    });
    expect(await staging.list()).toEqual([record]);
    expect(
      await new IndexedDbRecordRepository<TestLocation>(database, "locations", {
        recordType: "Location",
      }).list(),
    ).toEqual([]);
    await staging.clear(record.id);
    expect(await staging.list()).toEqual([]);
  });
});
