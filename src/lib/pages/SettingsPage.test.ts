import { fireEvent, render, screen, waitFor, within } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";
import {
  localPersistenceRepository,
  persistenceDiagnostics,
  resetPersistenceStoresForTest,
} from "$lib/persistence/local-persistence";
import {
  CAMPAIGN_COLLECTION_NAMES,
  CAMPAIGN_REGISTER_DEFINITIONS,
} from "$lib/persistence/campaign-register.types";
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

  it("renders operational data controls", () => {
    render(SettingsPage);

    expect(
      screen.getByRole("heading", { level: 2, name: "Backup, Import & Restore" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Create backup" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear all data and re-seed" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear all data (start empty)" })).toBeInTheDocument();
    expect(screen.getByText("No persistence data path")).toBeInTheDocument();
  });

  it("clears every register without creating demo data", async () => {
    await localPersistenceRepository.initialize();
    render(SettingsPage);

    await fireEvent.click(screen.getByRole("button", { name: "Clear all data (start empty)" }));

    expect(
      screen.getByText(
        "This will permanently delete all records and start with an empty database. No demo data will be created. This cannot be undone.",
      ),
    ).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Clear and start empty" }));

    const registerLabels = [
      "Locations",
      "Processes",
      "Equipment",
      "Exposure Monitoring",
      "Chemicals",
      "Hazards",
      "Controls",
      "Risk Assessments",
      "SEGs",
      "Findings",
      "Incidents & Near Misses",
      "Compliance Support",
      "Corrective Actions",
      ...CAMPAIGN_REGISTER_DEFINITIONS.map((definition) => definition.title),
    ];

    await waitFor(() => {
      for (const label of registerLabels) {
        const row = screen.getByText(label).closest("div");
        expect(row).not.toBeNull();
        expect(within(row!).getByText("0 records")).toBeInTheDocument();
      }
    });

    const emptySnapshot = localPersistenceRepository.exportDatabase();
    expect(emptySnapshot.schemaVersion).toBe(14);
    expect(emptySnapshot.initializedAt).toBeTruthy();
    expect(emptySnapshot.updatedAt).toBeTruthy();
    expect([
      emptySnapshot.locations,
      emptySnapshot.findings,
      emptySnapshot.processes,
      emptySnapshot.equipment,
      emptySnapshot.exposureMonitoring,
      emptySnapshot.chemicals,
      emptySnapshot.complianceItems,
      emptySnapshot.hazards,
      emptySnapshot.controls,
      emptySnapshot.riskAssessments,
      emptySnapshot.segs,
      emptySnapshot.incidents,
      emptySnapshot.correctiveActions,
    ]).toEqual(Array.from({ length: 13 }, () => []));
    for (const collection of CAMPAIGN_COLLECTION_NAMES) {
      expect(emptySnapshot[collection]).toEqual([]);
    }

    await localPersistenceRepository.initialize();
    expect(localPersistenceRepository.exportDatabase()).toMatchObject(emptySnapshot);
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

    expect(within(locationsRow).getByText("4 records")).toBeInTheDocument();
  });
});
