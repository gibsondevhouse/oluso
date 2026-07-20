import { render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";
import {
  findingRecords,
  locationRecords,
  localPersistenceRepository,
  persistenceDiagnostics,
  resetPersistenceStoresForTest,
} from "$lib/persistence/local-persistence";
import { withActiveLifecycle } from "$lib/persistence/lifecycle.types";
import HomePage from "./HomePage.svelte";

describe("HomePage", () => {
  beforeEach(() => {
    localStorage.clear();
    resetPersistenceStoresForTest();
  });

  it("renders the task-driven portal Home sections", () => {
    persistenceDiagnostics.set({
      status: "ready",
      dataPath: "localStorage://oluso.persistence.v1",
      initializedAt: "2026-07-09T12:00:00.000Z",
      lastInitializationStatus: "Local persistence initialized.",
      lastMigrationStatus: "Schema v14 is ready.",
      lastError: null,
    });
    locationRecords.set([
      withActiveLifecycle({
        id: "loc-test",
        name: "Test Facility",
        type: "Facility" as const,
        parentLocationId: "",
        country: "United States",
        stateProvince: "Georgia",
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
        severity: "High" as const,
        status: "Requires Action" as const,
        reportedBy: "Tester",
        createdAt: "2026-07-09T12:00:00.000Z",
        updatedAt: "2026-07-09T12:00:00.000Z",
      }),
    ]);

    render(HomePage);

    expect(screen.getByRole("heading", { level: 1, name: "HSE Operations Portal" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Continue Working" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Needs Attention" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Today at the Plant" })).toBeInTheDocument();
    expect(screen.getByText("Saved locally")).toBeInTheDocument();
    expect(screen.getByText("localStorage://oluso.persistence.v1")).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("link", { name: /Test finding/ })
        .some((link) => link.getAttribute("href") === "/field/findings/finding-test"),
    ).toBe(true);
    expect(screen.getByRole("link", { name: /Find a record/ })).toHaveAttribute("href", "/search");
    expect(screen.getByRole("link", { name: /Open feed/ })).toHaveAttribute("href", "/activity");
    expect(screen.queryByRole("tab")).not.toBeInTheDocument();
  });

  it("excludes archived records from Home attention because stores publish active records", async () => {
    await localPersistenceRepository.initialize();
    localPersistenceRepository.archiveRecord("findings", "finding-demo-egress", "Closed out.");

    render(HomePage);

    expect(screen.queryByRole("link", { name: /Blocked emergency egress path/ })).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Needs Attention" })).toBeInTheDocument();
  });
});
