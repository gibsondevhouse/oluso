import { afterEach, describe, expect, it } from "vitest";
import {
  deleteAdamaDatabase,
  initializeDatabaseIdentity,
  openAdamaDatabase,
  type MutationContext,
  type RecordEnvelope,
} from "../database";
import { RevisionRepository } from "../revisions";
import { IndexedDbRecordRepository } from "./record-repository";

interface ReferenceRecord extends RecordEnvelope {
  name: string;
  category: string;
}

const databases: IDBDatabase[] = [];
const names: string[] = [];

async function setup() {
  const name = `adama-repository-contract-${crypto.randomUUID()}`;
  names.push(name);
  const database = await openAdamaDatabase({ name });
  databases.push(database);
  await initializeDatabaseIdentity(database, {
    actorId: "user-hse",
    actorBusinessId: "PER-LOCAL",
    actorDisplayName: "HSE Lead",
    installationLabel: "HSE laptop",
    datasetId: "dataset-repository-contract",
    installationId: "installation-hse",
  });
  const ids = ["reference-1", "reference-2"];
  return {
    database,
    repository: new IndexedDbRecordRepository<ReferenceRecord>(database, "controls", {
      recordType: "Control",
      createId: () => ids.shift()!,
      now: () => new Date("2026-07-18T19:00:00.000Z"),
    }),
  };
}

const context: MutationContext = {
  actorId: "user-hse",
  installationId: "installation-hse",
  source: "local",
  reason: "Repository contract",
};

afterEach(async () => {
  for (const database of databases.splice(0)) database.close();
  for (const name of names.splice(0)) await deleteAdamaDatabase(name);
});

describe("IndexedDB mutable repository contract", () => {
  it("supports get, list, exists, count, update, archive, and restore semantics", async () => {
    const { repository } = await setup();
    const created = await repository.create(
      { businessId: "CTL-0001", name: "Local exhaust", category: "Engineering" },
      context,
    );
    expect(await repository.get(created.id)).toEqual(created);
    expect(await repository.exists(created.id)).toBe(true);
    expect(await repository.exists("missing")).toBe(false);
    expect(await repository.count()).toBe(1);

    const updated = await repository.update(
      created.id,
      { name: "Local exhaust ventilation" },
      1,
      context,
    );
    expect(updated).toMatchObject({ revision: 2, name: "Local exhaust ventilation" });
    const archived = await repository.archive(updated.id, 2, "Superseded control", context);
    expect(await repository.list()).toEqual([]);
    expect(await repository.list({ includeArchived: true })).toEqual([archived]);
    expect(await repository.count()).toBe(0);
    expect(await repository.count({ includeArchived: true })).toBe(1);
    expect(await repository.exists(archived.id)).toBe(false);
    expect(await repository.exists(archived.id, { includeArchived: true })).toBe(true);

    const restored = await repository.restore(archived.id, 3, context);
    expect(restored).toMatchObject({ revision: 4, lifecycleStatus: "active" });
  });

  it("attributes each successful mutation to immutable ordered history", async () => {
    const { database, repository } = await setup();
    const created = await repository.create(
      { businessId: "CTL-0001", name: "Local exhaust", category: "Engineering" },
      context,
    );
    const updated = await repository.update(created.id, { category: "Engineering - LEV" }, 1, context);
    await repository.archive(updated.id, 2, "Retired", context);

    const history = await new RevisionRepository(database).listForRecord<ReferenceRecord>(
      "Control",
      created.id,
    );
    expect(history.map((revision) => [revision.revision, revision.operation])).toEqual([
      [1, "create"],
      [2, "update"],
      [3, "archive"],
    ]);
    expect(history.every((revision) => revision.changedBy === "user-hse")).toBe(true);
    expect(history[1]?.before).toMatchObject({ revision: 1, category: "Engineering" });
    expect(history[1]?.after).toMatchObject({ revision: 2, category: "Engineering - LEV" });
  });

  it("rejects duplicate business IDs as a semantic constraint error", async () => {
    const { repository } = await setup();
    await repository.create(
      { businessId: "CTL-0001", name: "Local exhaust", category: "Engineering" },
      context,
    );
    await expect(
      repository.create(
        { businessId: "CTL-0001", name: "Duplicate", category: "Engineering" },
        context,
      ),
    ).rejects.toMatchObject({ code: "CONSTRAINT_VIOLATION" });
    expect(await repository.count({ includeArchived: true })).toBe(1);
  });
});
