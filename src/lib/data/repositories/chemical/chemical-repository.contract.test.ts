import { afterEach, describe, expect, it } from "vitest";
import { deleteAdamaDatabase, getDatabaseIdentity, initializeDatabaseIdentity, openAdamaDatabase, type MutationContext, type RecordEnvelope } from "$lib/data/database";
import { RevisionRepository } from "$lib/data/revisions";
import {
  ChemicalProductRepository, ChemicalSubstanceRepository, ChemicalUseRepository,
  DocumentReferenceRepository, ProductSubstanceRepository, SdsRevisionRepository,
  SiteChemicalInventoryRepository, type ChemicalRecordRepository,
} from ".";

const databases: IDBDatabase[] = [];
const names: string[] = [];
const context: MutationContext = { actorId: "user-hse", installationId: "installation-hse", source: "local" };

async function setup(label: string) {
  const name = `chemical-repository-${label}-${crypto.randomUUID()}`;
  names.push(name);
  const database = await openAdamaDatabase({ name });
  databases.push(database);
  await initializeDatabaseIdentity(database, {
    actorId: context.actorId, actorBusinessId: "USR-HSE", actorDisplayName: "HSE Lead",
    actorRole: "HSE Manager", actorInitials: "HL", installationLabel: "HSE laptop",
    installationId: context.installationId,
  });
  return database;
}

afterEach(async () => {
  for (const database of databases.splice(0)) database.close();
  for (const name of names.splice(0)) await deleteAdamaDatabase(name);
});

const cases = [
  ["substance", (db: IDBDatabase) => new ChemicalSubstanceRepository(db, { createId: () => "substance-1" }), { canonicalName: "Prodiamine", synonyms: [], substanceClassifications: ["Active Ingredient"], physicalForm: "Powder", description: "", status: "Active" }],
  ["product", (db: IDBDatabase) => new ChemicalProductRepository(db, { createId: () => "product-1" }), { productName: "Prodiamine Technical", manufacturerUnknown: true, supplierOrganizationIds: [], formulationType: "Technical", physicalState: "Powder", description: "", status: "Active" }],
  ["composition", (db: IDBDatabase) => new ProductSubstanceRepository(db, { createId: () => "composition-1" }), { productId: "product-1", substanceId: "substance-1", componentRole: "Unknown", concentrationUnit: "Not Disclosed", tradeSecret: false, compositionSource: "Unknown", notes: "", status: "Active" }],
  ["SDS", (db: IDBDatabase) => new SdsRevisionRepository(db, { createId: () => "sds-1" }), { productId: "product-1", revisionDateUnknown: true, language: "English", jurisdiction: "US", currentStatus: "Pending Review", reviewStatus: "Not Reviewed", notes: "" }],
  ["inventory", (db: IDBDatabase) => new SiteChemicalInventoryRepository(db, { createId: () => "inventory-1" }), { productId: "product-1", siteId: "site-1", storageLocationId: "storage-1", containerType: "Unknown", inventoryStatus: "Needs Verification", informationSource: "Unknown", notes: "" }],
  ["use", (db: IDBDatabase) => new ChemicalUseRepository(db, { createId: () => "use-1" }), { productId: "product-1", siteId: "site-1", locationId: "work-1", processId: "process-1", operatingCondition: "Unknown", frequency: "Unknown", durationUnit: "Unknown", quantityScale: "Unknown", applicationMethod: "Unknown", controlIds: [], deferredControlNotes: "", evidenceReferenceIds: [], status: "Needs Verification", notes: "" }],
  ["document", (db: IDBDatabase) => new DocumentReferenceRepository(db, { createId: () => "document-1" }), { title: "SDS", documentType: "Safety Data Sheet", externalSystem: "OneDrive", availabilityStatus: "Available", notes: "" }],
] as const;

describe.each(cases)("%s typed repository contract", (label, createRepository, data) => {
  it("creates, reads, updates, archives, restores, rejects stale writes, and writes history", async () => {
    const database = await setup(label);
    const repository = createRepository(database) as unknown as ChemicalRecordRepository<RecordEnvelope>;
    const before = (await getDatabaseIdentity(database))!.dataset.datasetRevision;
    const created = await repository.create({ businessId: `TEST-${label}`, ...data }, context);
    expect(await repository.get(created.id)).toEqual(created);
    expect(await repository.listActive()).toHaveLength(1);
    const updated = await repository.update(created.id, {}, created.revision, context);
    await expect(repository.update(created.id, {}, created.revision, context)).rejects.toMatchObject({ code: "STALE_REVISION" });
    const archived = await repository.archive(updated.id, updated.revision, "Contract test", context);
    expect(await repository.listActive()).toEqual([]);
    expect(await repository.listArchived()).toEqual([archived]);
    const restored = await repository.restore(archived.id, archived.revision, context);
    expect(restored.lifecycleStatus).toBe("active");
    expect(await repository.getByBusinessId(`TEST-${label}`)).toMatchObject({ id: created.id });
    expect((await getDatabaseIdentity(database))!.dataset.datasetRevision).toBe(before + 4);
    expect(await new RevisionRepository(database).listForRecord(
      label === "substance" ? "ChemicalSubstance" : label === "product" ? "ChemicalProduct" : label === "composition" ? "ProductSubstance" : label === "SDS" ? "SdsRevision" : label === "inventory" ? "SiteChemicalInventory" : label === "use" ? "ChemicalUse" : "DocumentReference",
      created.id,
    )).toHaveLength(4);
  });

  it("rejects duplicate business IDs without a partial second record", async () => {
    const database = await setup(`${label}-duplicate`);
    let counter = 0;
    const original = createRepository(database) as unknown as ChemicalRecordRepository<RecordEnvelope>;
    await original.create({ businessId: `DUP-${label}`, ...data }, context);
    const duplicate = new (original.constructor as new (database: IDBDatabase, options: { createId: () => string }) => ChemicalRecordRepository<RecordEnvelope>)(database, { createId: () => `duplicate-${counter++}` });
    await expect(duplicate.create({ businessId: `DUP-${label}`, ...data }, context)).rejects.toMatchObject({ code: "CONSTRAINT_VIOLATION" });
    expect(await original.count({ includeArchived: true })).toBe(1);
  });
});
