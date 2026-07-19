import { afterEach, describe, expect, it } from "vitest";
import {
  deleteAdamaDatabase,
  getDatabaseIdentity,
  initializeDatabaseIdentity,
  openAdamaDatabase,
  type MutationContext,
} from "$lib/data/database";
import { IndexedDbRecordRepository } from "$lib/data/repositories";
import { RevisionRepository } from "$lib/data/revisions";
import type { FoundationLocation } from "$lib/domain/foundation";
import { FoundationLocationService } from "./location-service";

const databases: IDBDatabase[] = [];
const names: string[] = [];
const context: MutationContext = {
  actorId: "user-hse",
  installationId: "installation-hse",
  source: "local",
};

async function setup(label: string) {
  const name = `location-reclassify-${label}-${crypto.randomUUID()}`;
  names.push(name);
  const database = await openAdamaDatabase({ name });
  databases.push(database);
  await initializeDatabaseIdentity(database, {
    actorId: context.actorId,
    actorBusinessId: "USR-HSE",
    actorDisplayName: "HSE Lead",
    actorRole: "HSE Manager",
    actorInitials: "HL",
    installationLabel: "HSE laptop",
    installationId: context.installationId,
  });
  const repository = new IndexedDbRecordRepository<FoundationLocation>(database, "locations", {
    recordType: "Location",
    createId: (() => {
      const ids = ["country", "region", "site", "building", "leaf", "child"];
      return () => ids.shift() ?? crypto.randomUUID();
    })(),
  });
  const country = await repository.create({
    businessId: "LOC-US", name: "United States", nodeType: "Country", parentId: null,
    resolvedSiteId: null,
  }, context);
  const region = await repository.create({
    businessId: "LOC-GA", name: "Georgia", nodeType: "StateOrRegion", parentId: country.id,
    resolvedSiteId: null,
  }, context);
  const site = await repository.create({
    businessId: "LOC-TIF", name: "Tifton", nodeType: "Site", parentId: region.id,
    resolvedSiteId: "site",
  }, context);
  const building = await repository.create({
    businessId: "LOC-BLDG", name: "Unit 7", nodeType: "Building", parentId: site.id,
    resolvedSiteId: site.id,
  }, context);
  const leaf = await repository.create({
    businessId: "LOC-LEAF", name: "Storage", nodeType: "Unit", parentId: building.id,
    resolvedSiteId: site.id,
  }, context);
  return { database, repository, country, region, site, building, leaf };
}

afterEach(async () => {
  for (const database of databases.splice(0)) database.close();
  for (const name of names.splice(0)) await deleteAdamaDatabase(name);
});

describe("Location leaf reclassification", () => {
  it("permits a compatible leaf change with expected revision and immutable history", async () => {
    const { database, leaf } = await setup("valid");
    const changed = await new FoundationLocationService(database).reclassifyLeaf(
      leaf.id, "StorageArea", leaf.revision, context,
    );
    expect(changed).toMatchObject({ nodeType: "StorageArea", revision: 2, resolvedSiteId: "site" });
    expect((await new RevisionRepository(database).listForRecord("Location", leaf.id))).toHaveLength(2);
  });

  it("rejects a change when an active child exists", async () => {
    const { database, repository, leaf } = await setup("child");
    await repository.create({
      businessId: "LOC-CHILD", name: "Room", nodeType: "Room", parentId: leaf.id,
      resolvedSiteId: "site",
    }, context);
    await expect(new FoundationLocationService(database).reclassifyLeaf(
      leaf.id, "StorageArea", leaf.revision, context,
    )).rejects.toThrow(/child Locations/i);
  });

  it.each([
    ["processes", { locationId: "leaf", resolvedSiteId: "site" }],
    ["tasks", { locationId: "leaf", resolvedSiteId: "site" }],
    ["equipment", { locationId: "leaf" }],
    ["site_chemical_inventory", { storageLocationId: "leaf", siteId: "site" }],
    ["chemical_uses", { locationId: "leaf", siteId: "site" }],
    ["segs", { locationId: "leaf" }],
    ["exposure_scenarios", { locationId: "leaf" }],
  ] as const)("rejects a change with active %s dependencies", async (storeName, fields) => {
    const { database, leaf } = await setup(storeName);
    await new IndexedDbRecordRepository(database, storeName, {
      recordType: storeName,
      createId: () => `${storeName}-1`,
    }).create({ businessId: `DEP-${storeName}`, ...fields }, context);
    await expect(new FoundationLocationService(database).reclassifyLeaf(
      leaf.id, "StorageArea", leaf.revision, context,
    )).rejects.toThrow(/dependencies/i);
  });

  it("rejects incompatible parents, stale revisions, and rolls back state and dataset revision", async () => {
    const { database, leaf } = await setup("rollback");
    const beforeRevision = (await getDatabaseIdentity(database))!.dataset.datasetRevision;
    await expect(new FoundationLocationService(database).reclassifyLeaf(
      leaf.id, "OutdoorArea", leaf.revision, context,
    )).rejects.toThrow(/incompatible/i);
    expect((await getDatabaseIdentity(database))!.dataset.datasetRevision).toBe(beforeRevision);
    await expect(new FoundationLocationService(database).reclassifyLeaf(
      leaf.id, "StorageArea", 0, context,
    )).rejects.toMatchObject({ code: "STALE_REVISION" });
    expect((await getDatabaseIdentity(database))!.dataset.datasetRevision).toBe(beforeRevision);
    expect((await new RevisionRepository(database).listForRecord("Location", leaf.id))).toHaveLength(1);
  });
});
