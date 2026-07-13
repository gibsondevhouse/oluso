import { render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";
import {
  findingRecords,
  equipmentRecords,
  locationRecords,
  localPersistenceRepository,
  persistenceDiagnostics,
  resetPersistenceStoresForTest,
} from "$lib/persistence/local-persistence";
import { withActiveLifecycle } from "$lib/persistence/lifecycle.types";
import DashboardPage from "./DashboardPage.svelte";

describe("DashboardPage", () => {
  beforeEach(() => {
    localStorage.clear();
    resetPersistenceStoresForTest();
  });

  it("renders the dashboard route content", () => {
    persistenceDiagnostics.set({
      status: "ready",
      dataPath: "localStorage://oluso.persistence.v1",
      initializedAt: "2026-07-09T12:00:00.000Z",
      lastInitializationStatus: "Local persistence initialized.",
      lastMigrationStatus: "Schema v2 is ready.",
      lastError: null,
    });
    locationRecords.set([
      withActiveLifecycle({
        id: "loc-test",
        name: "Test Facility",
        type: "Facility" as const,
        parentLocationId: "",
        description: "",
        status: "active" as const,
        createdAt: "2026-07-09T12:00:00.000Z",
        updatedAt: "2026-07-09T12:00:00.000Z",
      }),
    ]);
    findingRecords.set([
      withActiveLifecycle({
        id: "finding-test",
        title: "Test finding",
        type: "Inspection Finding" as const,
        description: "",
        locationId: "loc-test",
        processId: "",
        hazardId: "",
        severity: "Low" as const,
        status: "Open" as const,
        reportedBy: "Tester",
        createdAt: "2026-07-09T12:00:00.000Z",
        updatedAt: "2026-07-09T12:00:00.000Z",
      }),
    ]);
    equipmentRecords.set([
      withActiveLifecycle({
        id: "equipment-test",
        name: "Test Dust Collector",
        type: "Dust Collector" as const,
        locationId: "loc-test",
        processId: "",
        description: "",
        status: "active" as const,
        notes: "",
        createdAt: "2026-07-09T12:00:00.000Z",
        updatedAt: "2026-07-09T12:00:00.000Z",
      }),
    ]);

    render(DashboardPage);

    expect(screen.getByRole("heading", { level: 1, name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByText("Persistence ready")).toBeInTheDocument();
    expect(screen.getByText("localStorage://oluso.persistence.v1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open Findings\s+1\s+of 1 total/ })).toHaveAttribute(
      "href",
      "/field/findings",
    );
    expect(screen.getByRole("link", { name: /Locations\s+1\s+registered/ })).toHaveAttribute(
      "href",
      "/operations/locations",
    );
    expect(screen.getByRole("link", { name: /Processes\s+0\s+documented/ })).toHaveAttribute(
      "href",
      "/operations/processes",
    );
    expect(screen.getByRole("link", { name: /Equipment\s+1\s+tracked/ })).toHaveAttribute(
      "href",
      "/operations/equipment",
    );
  });

  it("excludes archived records from dashboard counts", async () => {
    await localPersistenceRepository.initialize();
    localPersistenceRepository.archiveRecord("findings", "finding-demo-egress", "Closed out.");
    localPersistenceRepository.archiveRecord("locations", "loc-demo-workshop", "Decommissioned.");

    render(DashboardPage);

    expect(screen.getByRole("link", { name: /Open Findings\s+0\s+of 1 total/ })).toHaveAttribute(
      "href",
      "/field/findings",
    );
    expect(screen.getByRole("link", { name: /Locations\s+4\s+registered/ })).toHaveAttribute(
      "href",
      "/operations/locations",
    );
  });
});
