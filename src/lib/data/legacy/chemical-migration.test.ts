import { afterEach, describe, expect, it } from "vitest";
import browserV14 from "./__fixtures__/browser-v14.json";
import { ChemicalApplication } from "$lib/application/chemical";
import {
  deleteAdamaDatabase,
  getDatabaseIdentity,
  initializeDatabaseIdentity,
  openAdamaDatabase,
} from "../database";
import { requestToPromise, transactionToPromise } from "../database/idb-utils";
import { migrateLegacyDatabase } from "./legacy-migration";
import {
  localPersistenceRepository,
  resetPersistenceStoresForTest,
} from "$lib/persistence/local-persistence";

const databases: IDBDatabase[] = [];
const names: string[] = [];

async function setup(label: string) {
  const name = `chemical-migration-${label}-${crypto.randomUUID()}`;
  names.push(name);
  const database = await openAdamaDatabase({ name });
  databases.push(database);
  await initializeDatabaseIdentity(database, {
    actorId: "user-hse", actorBusinessId: "USR-HSE", actorDisplayName: "HSE Lead",
    actorRole: "HSE Manager", actorInitials: "HL", installationLabel: "HSE laptop",
    installationId: "installation-hse",
  });
  return database;
}

async function all<T = Record<string, unknown>>(database: IDBDatabase, storeName: string) {
  const transaction = database.transaction(storeName, "readonly");
  const completion = transactionToPromise(transaction);
  const result = await requestToPromise<T[]>(transaction.objectStore(storeName).getAll());
  await completion;
  return result;
}

function source() { return structuredClone(browserV14) as typeof browserV14; }
const options = { actorId: "user-hse", installationId: "installation-hse", now: () => new Date("2026-07-18T20:00:00.000Z") };

afterEach(async () => {
  for (const database of databases.splice(0)) database.close();
  for (const name of names.splice(0)) await deleteAdamaDatabase(name);
  localStorage.clear();
  resetPersistenceStoresForTest();
});

describe("canonical legacy Chemical migration", () => {
  it("splits one combined row into typed reviewable records without moving exposure limits onto them", async () => {
    const database = await setup("split");
    await migrateLegacyDatabase(database, source(), { ...options, migrationRunId: "chemical-split" });
    const [product] = await all(database, "chemical_products");
    const [substance] = await all(database, "chemical_substances");
    const [composition] = await all(database, "chemical_product_substances");
    const [document] = await all(database, "document_references");
    const [sds] = await all(database, "sds_revisions");
    const [inventory] = await all(database, "site_chemical_inventory");
    const [use] = await all(database, "chemical_uses");
    expect(product).toMatchObject({ productName: "Prodiamine WDG Product", manufacturerUnknown: true, supplierOrganizationIds: [] });
    expect(product).not.toHaveProperty("quantity");
    expect(substance).toMatchObject({ casNumber: "29091-21-2", physicalForm: "Unknown" });
    expect(composition).toMatchObject({ productId: product.id, substanceId: substance.id, compositionSource: "Legacy Record", concentrationUnit: "Not Disclosed" });
    expect(document).toMatchObject({ documentType: "Safety Data Sheet", availabilityStatus: "Needs Verification" });
    expect(sds).toMatchObject({ productId: product.id, currentStatus: "Pending Review", reviewStatus: "Not Reviewed", documentReferenceId: document.id });
    expect(inventory).toMatchObject({ productId: product.id, observedQuantity: 1200, quantityUnit: "Kilograms", inventoryStatus: "Needs Verification" });
    expect(use).toMatchObject({ productId: product.id, siteId: "legacy-site-tifton", processId: "legacy-process-prodiamine", operatingCondition: "Unknown", frequency: "Unknown" });
    for (const record of [product, substance, composition, sds, inventory, use]) {
      expect(record).not.toHaveProperty("exposureLimit");
      expect(record).not.toHaveProperty("exposureLimitValue");
    }
    const run = (await all<Record<string, unknown>>(database, "migration_runs"))[0];
    expect(run.sourceEvidence).toMatchObject({ chemicals: [expect.objectContaining({ exposureLimit: "3 mg/m3" })] });
    expect(run.chemicalMappings).toEqual([expect.objectContaining({ sourceRecordId: "legacy-chemical-prodiamine", productId: product.id })]);
  });

  it("creates findings instead of inventing malformed CAS, manufacturer, and current SDS state", async () => {
    const database = await setup("findings");
    const snapshot = source();
    snapshot.chemicals[0]!.casNumber = "CAS pending";
    snapshot.chemicals[0]!.sdsRevisionDate = "";
    await migrateLegacyDatabase(database, snapshot, { ...options, migrationRunId: "chemical-findings" });
    expect(await all(database, "chemical_substances")).toEqual([]);
    expect(await all(database, "chemical_product_substances")).toEqual([]);
    const codes = (await all<Array<Record<string, unknown>>[number]>(database, "data_quality_findings")).map((finding) => finding.findingCode);
    expect(codes).toEqual(expect.arrayContaining([
      "CAS_MALFORMED", "SUPPLIER_NOT_CONFIRMED_MANUFACTURER", "COMPOSITION_UNDETERMINED",
      "SDS_REVISION_DATE_MISSING", "SDS_CURRENT_STATUS_UNCERTAIN", "CHEMICAL_OEL_REVIEW",
    ]));
  });

  it("deduplicates repeated legacy identity while retaining separate observations and source mappings", async () => {
    const database = await setup("duplicates");
    const snapshot = source();
    snapshot.chemicals.push({ ...structuredClone(snapshot.chemicals[0]!), id: "legacy-chemical-copy", quantity: "1400" });
    await migrateLegacyDatabase(database, snapshot, { ...options, migrationRunId: "chemical-duplicates" });
    expect(await all(database, "chemical_products")).toHaveLength(1);
    expect(await all(database, "chemical_substances")).toHaveLength(1);
    expect(await all(database, "chemical_product_substances")).toHaveLength(1);
    expect(await all(database, "site_chemical_inventory")).toHaveLength(2);
    const run = (await all<{ chemicalMappings: unknown[] }>(database, "migration_runs"))[0];
    expect(run.chemicalMappings).toHaveLength(2);
  });

  it("reuses an existing unambiguous canonical Product and Substance", async () => {
    const database = await setup("existing");
    const application = new ChemicalApplication(database);
    const product = await application.products.create({ productName: "Prodiamine WDG Product", manufacturerUnknown: true, formulationType: "Unknown", physicalState: "Unknown" });
    const substance = await application.substances.create({ canonicalName: "Prodiamine", casNumber: "29091-21-2", physicalForm: "Unknown" });
    await migrateLegacyDatabase(database, source(), { ...options, migrationRunId: "chemical-existing" });
    expect(await all(database, "chemical_products")).toHaveLength(1);
    expect(await all(database, "chemical_substances")).toHaveLength(1);
    const [composition] = await all(database, "chemical_product_substances");
    expect(composition).toMatchObject({ productId: product.id, substanceId: substance.id });
  });

  it("preserves unknown units as an explicit review condition", async () => {
    const database = await setup("unit");
    const snapshot = source();
    snapshot.chemicals[0]!.quantityUnit = "rail wagons";
    await migrateLegacyDatabase(database, snapshot, { ...options, migrationRunId: "chemical-unit" });
    expect((await all<Record<string, unknown>>(database, "site_chemical_inventory"))[0]).toMatchObject({ quantityUnit: "Unknown" });
    expect(await all<Record<string, unknown>>(database, "data_quality_findings")).toEqual(
      expect.arrayContaining([expect.objectContaining({ findingCode: "QUANTITY_UNIT_UNCLEAR" })]),
    );
  });

  it("generates unique business IDs when seeded legacy records contain blank identifiers", async () => {
    const database = await setup("blank-business-ids");
    const snapshot = source() as unknown as Record<string, unknown> & {
      inspections: Array<Record<string, unknown>>;
    };
    snapshot.inspections = [
      { id: "legacy-inspection-a", businessId: "", title: "Inspection A" },
      { id: "legacy-inspection-b", businessId: "   ", title: "Inspection B" },
    ];

    await migrateLegacyDatabase(database, snapshot, {
      ...options,
      migrationRunId: "chemical-blank-business-ids",
    });

    expect((await all<Record<string, unknown>>(database, "inspections")).map((record) => record.businessId)).toEqual([
      "MIG-INSP-LEGACY-INSPECTION-A",
      "MIG-INSP-LEGACY-INSPECTION-B",
    ]);
  });

  it("migrates the actual seeded browser database used by the review screen", async () => {
    localStorage.clear();
    resetPersistenceStoresForTest();
    await localPersistenceRepository.initialize();
    const snapshot = await localPersistenceRepository.exportDatabase();
    const database = await setup("seeded-browser-database");
    const application = new ChemicalApplication(database);
    await application.products.create({
      productName: "Campaign QA Product",
      manufacturerUnknown: true,
      formulationType: "Unknown",
      physicalState: "Unknown",
    });

    const result = await migrateLegacyDatabase(database, snapshot, {
      ...options,
      migrationRunId: "chemical-seeded-browser-database",
    });
    const datasetRevision = (await getDatabaseIdentity(database))!.dataset.datasetRevision;
    const retry = await migrateLegacyDatabase(database, snapshot, {
      ...options,
      migrationRunId: "chemical-seeded-browser-database-retry",
    });

    expect(result.importedRecordCount).toBeGreaterThan(0);
    expect(retry).toEqual({ ...result, alreadyApplied: true });
    expect(await all(database, "chemical_products")).toHaveLength(3);
    expect(await all(database, "migration_runs")).toHaveLength(1);
    expect((await getDatabaseIdentity(database))!.dataset.datasetRevision).toBe(datasetRevision);
  });
});
