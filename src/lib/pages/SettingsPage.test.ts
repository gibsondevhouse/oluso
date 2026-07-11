import { render, screen, within } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";
import {
  localPersistenceRepository,
  persistenceDiagnostics,
  resetPersistenceStoresForTest,
} from "$lib/persistence/local-persistence";
import SettingsPage from "./SettingsPage.svelte";

describe("SettingsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    resetPersistenceStoresForTest();
  });

  it("renders persistence diagnostics", () => {
    persistenceDiagnostics.set({
      status: "ready",
      dataPath: "localStorage://oluso.persistence.v1",
      initializedAt: "2026-07-09T12:00:00.000Z",
      lastInitializationStatus: "Local persistence initialized.",
      lastMigrationStatus: "Schema v2 is ready.",
      lastError: null,
    });

    render(SettingsPage);

    expect(screen.getByRole("heading", { level: 1, name: "Settings" })).toBeInTheDocument();
    expect(screen.getAllByText("Persistence ready")).toHaveLength(2);
    expect(screen.getByText("localStorage://oluso.persistence.v1")).toBeInTheDocument();
    expect(screen.getByText("Schema v2 is ready.")).toBeInTheDocument();
  });

  it("renders persistence errors visibly", () => {
    persistenceDiagnostics.set({
      status: "error",
      dataPath: null,
      initializedAt: null,
      lastInitializationStatus: "Persistence operation failed.",
      lastMigrationStatus: "Migration did not complete.",
      lastError: "Persisted locations data is invalid.",
    });

    render(SettingsPage);

    expect(screen.getAllByText("Persistence error")).toHaveLength(2);
    expect(screen.getAllByText("Persisted locations data is invalid.")).toHaveLength(2);
  });

  it("excludes archived records from settings register counts", async () => {
    await localPersistenceRepository.initialize();
    localPersistenceRepository.archiveRecord("locations", "loc-demo-workshop", "Decommissioned.");

    render(SettingsPage);

    const locationsRow = screen.getByText("Locations").closest("div");

    if (!locationsRow) {
      throw new Error("Expected Locations count row to be rendered");
    }

    expect(within(locationsRow).getByText("2 records")).toBeInTheDocument();
  });
});
