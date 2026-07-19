import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  deleteAdamaDatabase,
  getDatabaseIdentity,
  initializeDatabaseIdentity,
  openAdamaDatabase,
  type MutationContext,
  type RecordEnvelope,
} from "$lib/data/database";
import { IndexedDbRecordRepository } from "$lib/data/repositories";
import { RevisionRepository } from "$lib/data/revisions";
import { ChemicalDuplicateError, ChemicalRelationshipError, ChemicalValidationError } from "$lib/domain/chemical";
import { ChemicalApplication } from "./chemical-application";

interface FoundationRecord extends RecordEnvelope {
  name: string;
  status: string;
  nodeType?: string;
  parentId?: string | null;
  resolvedSiteId?: string | null;
  locationId?: string;
  processId?: string;
}

const databases: IDBDatabase[] = [];
const names: string[] = [];
const context: MutationContext = { actorId: "user-hse", installationId: "installation-hse", source: "local" };
let database: IDBDatabase;
let chemicals: ChemicalApplication;
let ids: Record<string, string>;

async function foundation(
  storeName: "organizations" | "people" | "locations" | "processes" | "tasks" | "controls",
  id: string,
  businessId: string,
  data: Omit<FoundationRecord, keyof RecordEnvelope>,
) {
  return new IndexedDbRecordRepository<FoundationRecord>(database, storeName, {
    recordType: storeName,
    createId: () => id,
  }).create({ businessId, ...data }, context);
}

beforeEach(async () => {
  const name = `chemical-application-${crypto.randomUUID()}`;
  names.push(name);
  database = await openAdamaDatabase({ name });
  databases.push(database);
  await initializeDatabaseIdentity(database, {
    actorId: context.actorId,
    actorBusinessId: "USR-HSE",
    actorDisplayName: "HSE Manager",
    actorRole: "HSE Manager",
    actorInitials: "HM",
    installationLabel: "HSE laptop",
    installationId: context.installationId,
  });
  ids = {
    manufacturer: "org-manufacturer", supplier: "org-supplier", person: "person-reviewer",
    country: "loc-country", region: "loc-region", site: "loc-site", storage: "loc-storage", work: "loc-work",
    process: "process-main", task: "task-feeder", control: "control-lev",
  };
  await foundation("organizations", ids.manufacturer, "ORG-MFG", { name: "Example Manufacturer", status: "active" });
  await foundation("organizations", ids.supplier, "ORG-SUP", { name: "Example Supplier", status: "active" });
  await foundation("people", ids.person, "PER-REV", { name: "HSE Reviewer", status: "active" });
  await foundation("locations", ids.country, "LOC-US", { name: "United States", status: "active", nodeType: "Country", parentId: null, resolvedSiteId: null });
  await foundation("locations", ids.region, "LOC-GA", { name: "Georgia", status: "active", nodeType: "StateOrRegion", parentId: ids.country, resolvedSiteId: null });
  await foundation("locations", ids.site, "LOC-TIF", { name: "Tifton", status: "active", nodeType: "Site", parentId: ids.region, resolvedSiteId: ids.site });
  await foundation("locations", ids.storage, "LOC-U7", { name: "Unit 7 Warehouse", status: "active", nodeType: "StorageArea", parentId: ids.site, resolvedSiteId: ids.site });
  await foundation("locations", ids.work, "LOC-FEED", { name: "Feeder deck", status: "active", nodeType: "Unit", parentId: ids.site, resolvedSiteId: ids.site });
  await foundation("processes", ids.process, "PROC-WDG", { name: "Prodiamine WDG", status: "active", locationId: ids.work, resolvedSiteId: ids.site });
  await foundation("tasks", ids.task, "TASK-FEED", { name: "Feeder loading", status: "active", processId: ids.process, locationId: ids.work, resolvedSiteId: ids.site });
  await foundation("controls", ids.control, "CTL-LEV", { name: "Local exhaust", status: "active" });
  chemicals = new ChemicalApplication(database);
});

afterEach(async () => {
  for (const current of databases.splice(0)) current.close();
  for (const name of names.splice(0)) await deleteAdamaDatabase(name);
});

async function createSubstance(casNumber = "29091-21-2") {
  return chemicals.substances.create({
    canonicalName: " Prodiamine ", casNumber, synonyms: ["Prodiamine", "  PRODIAMINE technical name  ", "prodiamine technical name"],
    substanceClassifications: ["Active Ingredient"], physicalForm: "Powder",
  });
}

async function createProduct(name = "Prodiamine Technical") {
  return chemicals.products.create({
    productName: name, manufacturerOrganizationId: ids.manufacturer,
    supplierOrganizationIds: [ids.supplier], productCode: "PROD-TECH",
    formulationType: "Technical", physicalState: "Powder",
  });
}

describe("canonical Chemical master data", () => {
  it("requires a canonical name and normalizes CAS numbers and synonyms", async () => {
    await expect(chemicals.substances.create({ canonicalName: " ", physicalForm: "Unknown" })).rejects.toBeInstanceOf(ChemicalValidationError);
    await expect(createSubstance("29091 A 21-2")).rejects.toBeInstanceOf(ChemicalValidationError);
    await expect(createSubstance()).rejects.toThrow(/synonym cannot be identical/i);
    const created = await chemicals.substances.create({
      canonicalName: " Prodiamine ", casNumber: "29091 – 21 – 2", synonyms: ["Barricade compound", "barricade compound"],
      substanceClassifications: ["Active Ingredient"], physicalForm: "Powder",
    });
    expect(created).toMatchObject({ canonicalName: "Prodiamine", casNumber: "29091-21-2", synonyms: ["Barricade compound"] });
  });

  it("enforces unique CAS identity", async () => {
    await chemicals.substances.create({ canonicalName: "Prodiamine", casNumber: "29091-21-2", physicalForm: "Powder" });
    await expect(chemicals.substances.create({ canonicalName: "Duplicate", casNumber: "29091-21-2", physicalForm: "Solid" })).rejects.toBeInstanceOf(ChemicalDuplicateError);
  });

  it("validates Product organizations and detects canonical duplicates", async () => {
    await expect(chemicals.products.create({ productName: "Unknown maker", formulationType: "Other", physicalState: "Unknown" })).rejects.toBeInstanceOf(ChemicalRelationshipError);
    const product = await createProduct();
    expect(product).toMatchObject({ manufacturerOrganizationId: ids.manufacturer, supplierOrganizationIds: [ids.supplier] });
    await expect(createProduct(" prodiamine   technical ")).rejects.toBeInstanceOf(ChemicalDuplicateError);
  });

  it("links Product composition without duplicating relationships or invalid concentrations", async () => {
    const substance = await chemicals.substances.create({ canonicalName: "Prodiamine", physicalForm: "Powder" });
    const product = await createProduct();
    const input = {
      productId: product.id, substanceId: substance.id, componentRole: "Active Ingredient" as const,
      minimumConcentration: 95, maximumConcentration: 100, concentrationUnit: "Percent by Weight" as const,
      compositionSource: "Safety Data Sheet" as const,
    };
    expect(await chemicals.composition.linkSubstance(input)).toMatchObject({ minimumConcentration: 95, maximumConcentration: 100 });
    await expect(chemicals.composition.linkSubstance(input)).rejects.toBeInstanceOf(ChemicalDuplicateError);
    await expect(chemicals.composition.update("missing", { ...input, minimumConcentration: 101 }, 1)).rejects.toBeInstanceOf(ChemicalValidationError);
  });

  it("preserves Document References even when the external file is missing", async () => {
    const document = await chemicals.documents.create({
      title: "Prodiamine SDS", documentType: "Safety Data Sheet", fileName: "prodiamine.pdf",
      externalSystem: "OneDrive", externalPath: "HSE/SDS/prodiamine.pdf", availabilityStatus: "Missing",
    });
    expect(document).toMatchObject({ availabilityStatus: "Missing", externalSystem: "OneDrive" });
    await expect(chemicals.documents.create({
      title: "Bad reference", documentType: "Safety Data Sheet", externalSystem: "Unknown",
      externalPath: "somewhere/file.pdf", availabilityStatus: "Unknown",
    })).rejects.toBeInstanceOf(ChemicalValidationError);
  });

  it("atomically marks a new SDS current and supersedes prior history", async () => {
    const product = await createProduct();
    const oldRevision = await chemicals.sds.addRevision({
      productId: product.id, revisionDate: "2024-01-01", language: "English", jurisdiction: "United States",
      currentStatus: "Current",
    });
    const nextRevision = await chemicals.sds.addRevision({
      productId: product.id, revisionDate: "2026-05-15", language: "English", jurisdiction: "United States",
      currentStatus: "Pending Review",
    });
    const result = await chemicals.sds.markCurrent(nextRevision.id, {
      [oldRevision.id]: oldRevision.revision, [nextRevision.id]: nextRevision.revision,
    });
    expect(result.current).toMatchObject({ currentStatus: "Current", supersedesSdsRevisionId: oldRevision.id, revision: 2 });
    expect(result.superseded).toMatchObject({ currentStatus: "Superseded", revision: 2 });
    expect(await chemicals.sds.listHistory(product.id)).toHaveLength(2);
  });

  it("rolls back the full SDS transition when expected revisions are incomplete", async () => {
    const product = await createProduct();
    const oldRevision = await chemicals.sds.addRevision({ productId: product.id, revisionDate: "2024-01-01", language: "English", jurisdiction: "US", currentStatus: "Current" });
    const nextRevision = await chemicals.sds.addRevision({ productId: product.id, revisionDate: "2026-01-01", language: "English", jurisdiction: "US" });
    const datasetBefore = (await getDatabaseIdentity(database))!.dataset.datasetRevision;
    await expect(chemicals.sds.markCurrent(nextRevision.id, { [nextRevision.id]: 1 })).rejects.toBeInstanceOf(ChemicalValidationError);
    expect(await chemicals.repositories.sds.get(oldRevision.id)).toMatchObject({ currentStatus: "Current", revision: 1 });
    expect((await getDatabaseIdentity(database))!.dataset.datasetRevision).toBe(datasetBefore);
  });

  it("rejects a stale SDS transition without superseding the current revision", async () => {
    const product = await createProduct();
    const oldRevision = await chemicals.sds.addRevision({ productId: product.id, revisionDate: "2024-01-01", language: "English", jurisdiction: "US", currentStatus: "Current" });
    const nextRevision = await chemicals.sds.addRevision({ productId: product.id, revisionDate: "2026-01-01", language: "English", jurisdiction: "US" });
    await expect(chemicals.sds.markCurrent(nextRevision.id, { [oldRevision.id]: 0, [nextRevision.id]: 1 })).rejects.toMatchObject({ code: "STALE_REVISION" });
    expect(await chemicals.repositories.sds.get(oldRevision.id)).toMatchObject({ currentStatus: "Current", revision: 1 });
    expect(await chemicals.repositories.sds.get(nextRevision.id)).toMatchObject({ currentStatus: "Pending Review", revision: 1 });
  });

  it("stores inventory separately from Product and supports multiple storage observations", async () => {
    const product = await createProduct();
    const common = {
      productId: product.id, siteId: ids.site, storageLocationId: ids.storage,
      observedQuantity: 10000, quantityUnit: "Pounds" as const, maximumInventory: 15000,
      maximumInventoryUnit: "Pounds" as const, containerType: "Supersack" as const,
      containerCount: 20, inventoryStatus: "Present" as const, observationDate: "2026-07-18",
      informationSource: "Physical Count" as const, verifiedByPersonId: ids.person,
    };
    await chemicals.inventory.create(common);
    await chemicals.inventory.create({ ...common, observedQuantity: 500, containerCount: 1 });
    expect(await chemicals.inventory.listByProduct(product.id)).toHaveLength(2);
    expect(product).not.toHaveProperty("observedQuantity");
  });

  it("rejects inventory whose storage Location does not resolve to its Site", async () => {
    const product = await createProduct();
    await expect(chemicals.inventory.create({
      productId: product.id, siteId: ids.storage, storageLocationId: ids.storage,
      containerType: "Unknown", inventoryStatus: "Needs Verification", informationSource: "Unknown",
    })).rejects.toBeInstanceOf(ChemicalRelationshipError);
  });

  it("creates operational Chemical Use without inventory or exposure conclusions", async () => {
    const product = await createProduct();
    const use = await chemicals.uses.create({
      productId: product.id, siteId: ids.site, locationId: ids.work, processId: ids.process, taskId: ids.task,
      operatingCondition: "Routine", frequency: "Daily", duration: 2, durationUnit: "Hours per Shift",
      quantityScale: "Bulk", applicationMethod: "Bag Dumping", controlIds: [ids.control], status: "Active",
    });
    expect(use).toMatchObject({ taskId: ids.task, operatingCondition: "Routine", controlIds: [ids.control] });
    expect(use).not.toHaveProperty("exposureLimit");
    expect(use).not.toHaveProperty("exposureDetermination");
    expect(await chemicals.inventory.listByProduct(product.id)).toEqual([]);
  });

  it("rejects Task/Process incompatibility and cross-Site relationships", async () => {
    const product = await createProduct();
    const otherProcess = await foundation("processes", "process-other", "PROC-OTHER", { name: "Other", status: "active", locationId: ids.work, resolvedSiteId: ids.site });
    await expect(chemicals.uses.create({
      productId: product.id, siteId: ids.site, locationId: ids.work, processId: otherProcess.id, taskId: ids.task,
      operatingCondition: "Routine", frequency: "Daily", durationUnit: "Unknown", quantityScale: "Unknown",
      applicationMethod: "Unknown", status: "Active",
    })).rejects.toThrow(/does not belong/i);
  });

  it("creates immutable attributed revisions and increments dataset revision once per accepted mutation", async () => {
    const before = (await getDatabaseIdentity(database))!.dataset.datasetRevision;
    const product = await createProduct();
    const after = (await getDatabaseIdentity(database))!.dataset.datasetRevision;
    expect(after).toBe(before + 1);
    const history = await new RevisionRepository(database).listForRecord("ChemicalProduct", product.id);
    expect(history).toEqual([expect.objectContaining({ changedBy: context.actorId, changedInstallationId: context.installationId })]);
  });

  it("exposes all required canonical chemical indexes", () => {
    const transaction = database.transaction([
      "chemical_substances", "chemical_products", "chemical_product_substances", "sds_revisions",
      "site_chemical_inventory", "chemical_uses", "document_references",
    ], "readonly");
    expect([...transaction.objectStore("chemical_substances").indexNames]).toEqual(expect.arrayContaining(["byCASNumber", "byCanonicalName"]));
    expect([...transaction.objectStore("chemical_products").indexNames]).toEqual(expect.arrayContaining(["byManufacturer", "byProductCode"]));
    expect([...transaction.objectStore("chemical_product_substances").indexNames]).toEqual(expect.arrayContaining(["byProductAndSubstance"]));
    expect([...transaction.objectStore("sds_revisions").indexNames]).toEqual(expect.arrayContaining(["byReviewStatus", "byLanguageAndJurisdiction"]));
    expect([...transaction.objectStore("site_chemical_inventory").indexNames]).toEqual(expect.arrayContaining(["byProductAndSite", "byInventoryStatus"]));
    expect([...transaction.objectStore("chemical_uses").indexNames]).toEqual(expect.arrayContaining(["bySite", "byOperatingCondition"]));
    expect([...transaction.objectStore("document_references").indexNames]).toEqual(expect.arrayContaining(["byAvailabilityStatus", "byContentHash"]));
  });

  it("demonstrates the Prodiamine acceptance scenario without collapsing inventory, use, or exposure", async () => {
    const substance = await chemicals.substances.create({
      canonicalName: "Prodiamine", casNumber: "29091-21-2",
      substanceClassifications: ["Active Ingredient"], physicalForm: "Powder",
    });
    const product = await createProduct();
    await chemicals.composition.linkSubstance({
      productId: product.id, substanceId: substance.id, componentRole: "Active Ingredient",
      minimumConcentration: 95, maximumConcentration: 100, concentrationUnit: "Percent by Weight",
      compositionSource: "Safety Data Sheet",
    });
    const oldSds = await chemicals.sds.addRevision({
      productId: product.id, revisionDate: "2024-01-01", language: "English",
      jurisdiction: "United States", currentStatus: "Current",
    });
    const newSds = await chemicals.sds.addRevision({
      productId: product.id, revisionDate: "2026-06-01", language: "English",
      jurisdiction: "United States", currentStatus: "Pending Review",
    });
    await chemicals.sds.markCurrent(newSds.id, { [oldSds.id]: 1, [newSds.id]: 1 });
    const inventoryInput = {
      productId: product.id, siteId: ids.site, observedQuantity: 10000, quantityUnit: "Pounds" as const,
      maximumInventory: 15000, maximumInventoryUnit: "Pounds" as const, containerType: "Supersack" as const,
      inventoryStatus: "Present" as const, observationDate: "2026-07-18",
      informationSource: "Physical Count" as const, verifiedByPersonId: ids.person,
    };
    await chemicals.inventory.create({ ...inventoryInput, storageLocationId: ids.storage });
    await chemicals.inventory.create({ ...inventoryInput, storageLocationId: ids.work, observedQuantity: 500 });
    const useInput = {
      productId: product.id, siteId: ids.site, locationId: ids.work, processId: ids.process,
      frequency: "Daily" as const, duration: 1, durationUnit: "Hours per Event" as const,
      quantityScale: "Bulk" as const, applicationMethod: "Bag Dumping" as const, status: "Active" as const,
    };
    await chemicals.uses.create({ ...useInput, taskId: ids.task, operatingCondition: "Routine" });
    await chemicals.uses.create({ ...useInput, taskId: ids.task, operatingCondition: "Upset", frequency: "As Needed" });
    await chemicals.uses.create({ ...useInput, taskId: undefined, operatingCondition: "Post-Release Cleanup", applicationMethod: "Spill Cleanup" });

    expect(await chemicals.repositories.products.list()).toHaveLength(1);
    expect(await chemicals.repositories.substances.list()).toHaveLength(1);
    expect(await chemicals.inventory.listByProduct(product.id)).toHaveLength(2);
    expect((await chemicals.uses.listByProduct(product.id)).map((record) => record.operatingCondition)).toEqual(
      expect.arrayContaining(["Routine", "Upset", "Post-Release Cleanup"]),
    );
    expect((await chemicals.sds.listHistory(product.id)).map((record) => record.currentStatus).sort()).toEqual(["Current", "Superseded"]);
    expect(product).not.toHaveProperty("siteId");
    expect(product).not.toHaveProperty("exposureLimit");
  });
});
