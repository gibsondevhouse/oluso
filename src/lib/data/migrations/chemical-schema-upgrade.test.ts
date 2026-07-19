import { afterEach, describe, expect, it } from "vitest";
import { ADAMA_DATABASE_VERSION, deleteAdamaDatabase, openAdamaDatabase } from "../database";

const names: string[] = [];
const databases: IDBDatabase[] = [];

afterEach(async () => {
  for (const database of databases.splice(0)) database.close();
  for (const name of names.splice(0)) await deleteAdamaDatabase(name);
});

describe("canonical Chemical schema upgrade", () => {
  it("adds version-2 identity and Chemical indexes to a released version-1 database", async () => {
    const name = `chemical-schema-upgrade-${crypto.randomUUID()}`;
    names.push(name);
    const versionOne = await openAdamaDatabase({ name, version: 1 });
    expect(versionOne.version).toBe(1);
    versionOne.close();
    const upgraded = await openAdamaDatabase({ name });
    databases.push(upgraded);
    expect(upgraded.version).toBe(ADAMA_DATABASE_VERSION);
    const transaction = upgraded.transaction(["local_users", "chemical_substances", "chemical_product_substances", "chemical_uses"], "readonly");
    expect([...transaction.objectStore("local_users").indexNames]).toContain("byInstallationAndCurrent");
    expect([...transaction.objectStore("chemical_substances").indexNames]).toContain("byCASNumber");
    expect([...transaction.objectStore("chemical_product_substances").indexNames]).toContain("byProductAndSubstance");
    expect([...transaction.objectStore("chemical_uses").indexNames]).toContain("byOperatingCondition");
  });
});
