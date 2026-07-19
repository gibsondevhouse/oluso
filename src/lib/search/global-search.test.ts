import { beforeEach, describe, expect, it } from "vitest";
import { olusoApplication } from "../../application/oluso-application";
import { resetPersistenceStoresForTest } from "$lib/persistence/local-persistence";
import { searchAllRegisters } from "./global-search";

describe("global register search", () => {
  beforeEach(() => {
    localStorage.clear();
    resetPersistenceStoresForTest();
  });

  it("searches records across register collections", async () => {
    await olusoApplication.initialize();

    const results = searchAllRegisters(olusoApplication, "acetone");

    expect(results.some((result) => result.registerTitle === "Chemicals")).toBe(false);
    expect(results.some((result) => result.registerTitle === "Exposure Monitoring")).toBe(true);
  });

  it("excludes archived records unless archive review is enabled", async () => {
    await olusoApplication.initialize();
    await olusoApplication.archiveRecord("locations", "loc-demo-workshop", "Search archive test.");

    expect(searchAllRegisters(olusoApplication, "workshop")).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recordTitle: "Workshop",
        }),
      ]),
    );

    expect(searchAllRegisters(olusoApplication, "workshop", { includeArchived: true })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recordTitle: "Workshop",
          archived: true,
        }),
      ]),
    );
  });
});
