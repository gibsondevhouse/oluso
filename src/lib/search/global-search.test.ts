import { beforeEach, describe, expect, it } from "vitest";
import { olusoApplication } from "../../application/oluso-application";
import { resetPersistenceStoresForTest } from "$lib/persistence/local-persistence";
import { searchAllRegisters, searchTypedEnterpriseRecords } from "./global-search";

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

  it("searches canonical enterprise records and Operational Functions", () => {
    const envelope = {
      businessId: "TEST-1", revision: 1, createdAt: "2026-07-19T00:00:00.000Z", createdBy: "user",
      updatedAt: "2026-07-19T00:00:00.000Z", updatedBy: "user", originInstallationId: "installation",
      lifecycleStatus: "active" as const, archivedAt: null, archivedBy: null, archiveReason: null, archivedReason: null,
    };
    const results = searchTypedEnterpriseRecords({
      organizations: [{ ...envelope, id: "org-1", name: "ADAMA North America", organizationType: "Regional Entity", parentOrganizationId: null, organizationCode: "", legalEntityCode: "", countryCode: "", primaryContactPersonId: null, status: "Active", description: "" }],
      people: [], locations: [], processes: [], tasks: [],
      operationalFunctions: [{ ...envelope, id: "func-1", name: "Tolling", functionCategory: "Tolling", status: "Active", description: "" }],
    }, "tolling");

    expect(results).toEqual([
      expect.objectContaining({ kind: "operational-functions", recordTitle: "Tolling", href: "/enterprise/navigator" }),
    ]);
  });
});
