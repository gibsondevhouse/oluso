import { describe, expect, it } from "vitest";
import {
  findParentRedirect,
  findRoute,
  getRegisteredRoutePaths,
  getRegisteredRoutePatterns,
} from "./route-registry";

describe("route registry", () => {
  const persistedRegisterRoutes = [
    { kind: "locations", basePath: "/operations/locations" },
    { kind: "processes", basePath: "/operations/processes" },
    { kind: "equipment", basePath: "/operations/equipment" },
    { kind: "hazards", basePath: "/hse/hazards" },
    { kind: "controls", basePath: "/risk/controls" },
    { kind: "risk-assessments", basePath: "/risk/assessments" },
    { kind: "segs", basePath: "/hse/segs" },
    { kind: "exposure-monitoring", basePath: "/hse/exposure-monitoring" },
    { kind: "findings", basePath: "/field/findings" },
    { kind: "corrective-actions", basePath: "/actions/corrective-actions" },
    { kind: "incidents", basePath: "/incidents/log" },
    { kind: "compliance-items", basePath: "/compliance/items" },
  ] as const;

  const chemicalRoutes = [
    { kind: "chemical-substances", basePath: "/master/substances" },
    { kind: "chemical-products", basePath: "/master/products" },
    { kind: "chemical-inventory", basePath: "/master/inventory" },
    { kind: "chemical-uses", basePath: "/master/chemical-uses" },
  ] as const;

  it("registers the documented MVP shell routes", () => {
    expect(getRegisteredRoutePaths()).toEqual(
      expect.arrayContaining([
        "/dashboard",
        "/search",
        "/operations/locations",
        "/operations/processes",
        "/operations/equipment",
        "/master/substances",
        "/master/products",
        "/master/inventory",
        "/master/chemical-uses",
        "/migration/chemicals",
        "/hse/hazards",
        "/risk/controls",
        "/risk/assessments",
        "/hse/segs",
        "/hse/exposure-monitoring",
        "/field/findings",
        "/actions/corrective-actions",
        "/incidents/log",
        "/compliance/items",
        "/reports/exports",
        "/system/settings",
        "/not-found",
        "/error",
      ]),
    );
  });

  it("does not resolve unknown routes as registered routes", () => {
    expect(findRoute("/unknown/page")).toBeUndefined();
    expect(findRoute("/not-found")?.kind).toBe("not-found");
  });

  it("marks Locations and Settings as implemented MVP workflow routes", () => {
    expect(findRoute("/search")?.kind).toBe("global-search");
    expect(findRoute("/operations/locations")?.kind).toBe("locations");
    expect(findRoute("/field/findings")?.kind).toBe("findings");
    expect(findRoute("/system/settings")?.kind).toBe("settings");
  });

  it("resolves list, new, detail, and edit routes for persisted registers", () => {
    for (const registerRoute of persistedRegisterRoutes) {
      expect(findRoute(registerRoute.basePath)).toMatchObject({
        kind: registerRoute.kind,
        mode: "list",
      });
      expect(findRoute(`${registerRoute.basePath}/new`)).toMatchObject({
        kind: registerRoute.kind,
        mode: "new",
      });
      expect(findRoute(`${registerRoute.basePath}/record-1`)).toMatchObject({
        kind: registerRoute.kind,
        mode: "detail",
        recordId: "record-1",
      });
      expect(findRoute(`${registerRoute.basePath}/record-1/edit`)).toMatchObject({
        kind: registerRoute.kind,
        mode: "edit",
        recordId: "record-1",
      });
    }
  });

  it("publishes route patterns for each persisted register lifecycle surface", () => {
    for (const registerRoute of persistedRegisterRoutes) {
      expect(getRegisteredRoutePatterns()).toEqual(
        expect.arrayContaining([
          registerRoute.basePath,
          `${registerRoute.basePath}/new`,
          `${registerRoute.basePath}/:id`,
          `${registerRoute.basePath}/:id/edit`,
        ]),
      );
    }
  });

  it("resolves canonical Chemical list, create, detail, edit, and SDS routes", () => {
    for (const chemicalRoute of chemicalRoutes) {
      expect(findRoute(chemicalRoute.basePath)).toMatchObject({ kind: chemicalRoute.kind, mode: "list" });
      expect(findRoute(`${chemicalRoute.basePath}/new`)).toMatchObject({ kind: chemicalRoute.kind, mode: "new" });
      expect(findRoute(`${chemicalRoute.basePath}/record-1`)).toMatchObject({ kind: chemicalRoute.kind, mode: "detail", recordId: "record-1" });
      expect(findRoute(`${chemicalRoute.basePath}/record-1/edit`)).toMatchObject({ kind: chemicalRoute.kind, mode: "edit", recordId: "record-1" });
    }
    expect(findRoute("/master/products/product-1/sds/new")).toMatchObject({ mode: "sds-new", parentRecordId: "product-1" });
    expect(findRoute("/master/products/product-1/sds/sds-1/edit")).toMatchObject({ mode: "sds-edit", parentRecordId: "product-1", recordId: "sds-1" });
  });

  it("keeps Exports out of persisted register route patterns", () => {
    expect(getRegisteredRoutePatterns()).not.toEqual(
      expect.arrayContaining([
        "/reports/exports/new",
        "/reports/exports/:id",
        "/reports/exports/:id/edit",
      ]),
    );
    expect(findRoute("/reports/exports/report-1")).toBeUndefined();
    expect(findRoute("/reports/exports")?.kind).toBe("exports");
  });

  it("decodes record IDs from detail and edit routes", () => {
    expect(findRoute("/field/findings/finding%201")).toMatchObject({
      kind: "findings",
      mode: "detail",
      recordId: "finding 1",
    });
  });

  it("defines parent route redirects for MVP section paths", () => {
    expect(findParentRedirect("/")?.redirectTo).toBe("/dashboard");
    expect(findParentRedirect("/operations")?.redirectTo).toBe("/operations/locations");
    expect(findParentRedirect("/hse")?.redirectTo).toBe("/master/products");
    expect(findParentRedirect("/risk")?.redirectTo).toBe("/risk/controls");
    expect(findParentRedirect("/incidents")?.redirectTo).toBe("/incidents/log");
    expect(findParentRedirect("/compliance")?.redirectTo).toBe("/compliance/items");
  });
});
