import { beforeEach, describe, expect, it } from "vitest";
import { olusoApplication } from "../../application/oluso-application";
import { resetPersistenceStoresForTest } from "$lib/persistence/local-persistence";
import {
  searchAllRegisters,
  searchTypedEnterpriseRecords,
  sortGlobalSearchResults,
} from "./global-search";

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
      expect.objectContaining({
        kind: "operational-functions",
        recordTitle: "Tolling",
        href: "/enterprise/navigator",
        sourceState: "current",
        sourceLabel: "Current typed record",
      }),
    ]);
  });

  it("searches typed chemical Products and SDS revisions with stable routes", () => {
    const envelope = {
      businessId: "PROD-001", revision: 1, createdAt: "2026-07-19T00:00:00.000Z", createdBy: "user",
      updatedAt: "2026-07-19T00:00:00.000Z", updatedBy: "user", originInstallationId: "installation",
      lifecycleStatus: "active" as const, archivedAt: null, archivedBy: null, archiveReason: null, archivedReason: null,
    };
    const results = searchTypedEnterpriseRecords({
      organizations: [], people: [], locations: [], operationalFunctions: [], processes: [], tasks: [],
      chemicalSubstances: [],
      chemicalProducts: [{
        ...envelope, id: "product-1", productName: "Acelepryn", manufacturerUnknown: true,
        supplierOrganizationIds: [], productCode: "ACE-1", formulationType: "Granule",
        physicalState: "Solid", description: "", status: "Active",
      }],
      siteChemicalInventory: [],
      chemicalUses: [],
      sdsRevisions: [{
        ...envelope, id: "sds-1", businessId: "SDS-001", productId: "product-1",
        revisionDate: "2026-01-10", revisionDateUnknown: false, language: "English",
        jurisdiction: "United States", currentStatus: "Current", reviewStatus: "Accepted",
        notes: "",
      }],
    }, "Acelepryn");

    expect(results).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          kind: "chemical-products",
          recordTitle: "Acelepryn",
          href: "/master/products/product-1",
          matchedField: "Title",
        }),
        expect.objectContaining({
          kind: "sds-revisions",
          href: "/master/products/product-1/sds/sds-1",
        }),
      ]),
    );
  });

  it("ranks exact title and business ID matches before partial legacy matches", async () => {
    await olusoApplication.initialize();
    const typed = searchTypedEnterpriseRecords({
      organizations: [], people: [], locations: [], operationalFunctions: [], processes: [], tasks: [],
      chemicalProducts: [{
        businessId: "ACE-EXACT", revision: 1, createdAt: "2026-07-19T00:00:00.000Z", createdBy: "user",
        updatedAt: "2026-07-19T00:00:00.000Z", updatedBy: "user", originInstallationId: "installation",
        lifecycleStatus: "active" as const, archivedAt: null, archivedBy: null, archiveReason: null, archivedReason: null,
        id: "product-exact", productName: "Acetone", manufacturerUnknown: true, supplierOrganizationIds: [],
        formulationType: "Pure Substance", physicalState: "Liquid", description: "", status: "Active",
      }],
    }, "Acetone");
    const legacy = searchAllRegisters(olusoApplication, "Acetone");
    const sorted = sortGlobalSearchResults([...legacy, ...typed]);

    expect(sorted[0]).toMatchObject({
      sourceState: "current",
      recordTitle: "Acetone",
    });
  });
});
