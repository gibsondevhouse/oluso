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
    { kind: "chemicals", basePath: "/hse/chemicals" },
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

  it("registers the documented MVP shell routes", () => {
    expect(getRegisteredRoutePaths()).toEqual(
      expect.arrayContaining([
        "/dashboard",
        "/search",
        "/operations/locations",
        "/operations/processes",
        "/operations/equipment",
        "/hse/chemicals",
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
    expect(findParentRedirect("/hse")?.redirectTo).toBe("/hse/chemicals");
    expect(findParentRedirect("/risk")?.redirectTo).toBe("/risk/controls");
    expect(findParentRedirect("/incidents")?.redirectTo).toBe("/incidents/log");
    expect(findParentRedirect("/compliance")?.redirectTo).toBe("/compliance/items");
  });
});
