import { afterEach, describe, expect, it } from "vitest";
import { deleteAdamaDatabase, openAdamaDatabase } from "./open-database";
import { translateIndexedDbError } from "./errors";

const databaseNames: string[] = [];
const connections: IDBDatabase[] = [];

function nextName(label: string) {
  const name = `adama-failure-${label}-${crypto.randomUUID()}`;
  databaseNames.push(name);
  return name;
}

function rawOpen(name: string, version: number) {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(name, version);
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(request.error), { once: true });
  });
}

afterEach(async () => {
  for (const connection of connections.splice(0)) connection.close();
  for (const name of databaseNames.splice(0)) await deleteAdamaDatabase(name);
});

describe("IndexedDB failure modes", () => {
  it("surfaces a blocked upgrade instead of silently waiting behind another tab", async () => {
    const name = nextName("blocked");
    const blocker = await rawOpen(name, 1);
    connections.push(blocker);
    let notifyBlocked!: () => void;
    const blocked = new Promise<void>((resolve) => {
      notifyBlocked = resolve;
    });
    const opening = openAdamaDatabase({
      name,
      version: 2,
      onBlocked: () => notifyBlocked(),
    });

    await blocked;
    blocker.close();

    await expect(opening).rejects.toMatchObject({ code: "DATABASE_BLOCKED" });
  });

  it("translates an unavailable browser database into a stable semantic error", async () => {
    const unavailable = {
      open() {
        throw new Error("IndexedDB disabled by policy");
      },
    } as unknown as IDBFactory;

    await expect(openAdamaDatabase({ indexedDb: unavailable })).rejects.toMatchObject({
      code: "STORAGE_UNAVAILABLE",
    });
  });

  it("translates quota and unique-constraint failures for visible recovery guidance", () => {
    expect(
      translateIndexedDbError(new DOMException("Quota exhausted", "QuotaExceededError")),
    ).toMatchObject({ code: "QUOTA_EXCEEDED" });
    expect(
      translateIndexedDbError(new DOMException("Duplicate key", "ConstraintError")),
    ).toMatchObject({ code: "CONSTRAINT_VIOLATION" });
  });
});
