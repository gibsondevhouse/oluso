import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";
import {
  locationRecords,
  persistenceDiagnostics,
  resetPersistenceStoresForTest,
} from "$lib/persistence/local-persistence";
import LocationsPage from "./LocationsPage.svelte";

function setReadyWithNoLocations() {
  persistenceDiagnostics.set({
    status: "ready",
    dataPath: "localStorage://oluso.persistence.v1",
    initializedAt: "2026-07-09T12:00:00.000Z",
    lastInitializationStatus: "Local persistence initialized.",
    lastMigrationStatus: "Schema v2 is ready.",
    lastError: null,
  });
  locationRecords.set([]);
}

describe("LocationsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    resetPersistenceStoresForTest();
  });

  it("creates and updates persisted Location records", async () => {
    render(LocationsPage);

    expect(await screen.findByText("Main Facility")).toBeInTheDocument();

    const addButtons = screen.getAllByRole("button", { name: "Add location" });
    await fireEvent.click(addButtons[addButtons.length - 1]);
    await fireEvent.input(screen.getByLabelText("Name"), { target: { value: "North Yard" } });
    await fireEvent.change(screen.getByLabelText("Type"), { target: { value: "Outdoor Area" } });
    await fireEvent.input(screen.getByLabelText("Description"), {
      target: { value: "Outdoor staging area." },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Save location" }));

    expect(await screen.findByText("North Yard")).toBeInTheDocument();

    const northYardRow = screen.getByText("North Yard").closest("tr");
    if (!northYardRow) {
      throw new Error("North Yard row was not rendered");
    }

    await fireEvent.click(within(northYardRow).getByRole("button", { name: "Edit" }));
    await fireEvent.input(screen.getByLabelText("Name"), {
      target: { value: "North Yard Updated" },
    });
    await fireEvent.change(screen.getByLabelText("Status"), { target: { value: "inactive" } });
    await fireEvent.click(screen.getByRole("button", { name: "Save location" }));

    expect(await screen.findByText("North Yard Updated")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Inactive Status" })).toBeInTheDocument();
  });

  it("renders the empty state CTA and opens the add form", async () => {
    setReadyWithNoLocations();

    render(LocationsPage, {
      props: {
        autoInitialize: false,
      },
    });

    expect(screen.getByText("No records found")).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "Add new Location" }));

    expect(screen.getByRole("form", { name: "Add location" })).toBeInTheDocument();
  });

  it("searches, sorts, and filters locations", async () => {
    render(LocationsPage);

    expect(await screen.findByText("Main Facility")).toBeInTheDocument();

    await fireEvent.input(screen.getByPlaceholderText("Search locations"), {
      target: { value: "workshop" },
    });
    expect(screen.getAllByText("Workshop").length).toBeGreaterThan(0);
    expect(screen.queryByText("Main Facility")).not.toBeInTheDocument();

    await fireEvent.input(screen.getByPlaceholderText("Search locations"), {
      target: { value: "" },
    });
    await fireEvent.change(screen.getByLabelText("Location status"), {
      target: { value: "inactive" },
    });
    expect(screen.getByText("No records found")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
    await fireEvent.click(screen.getByRole("button", { name: /Sort by Name descending/ }));
    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getAllByText("Workshop").length).toBeGreaterThan(0);
  });

  it("renders invalid form submission errors", async () => {
    setReadyWithNoLocations();

    render(LocationsPage, {
      props: {
        autoInitialize: false,
      },
    });

    const addButtons = screen.getAllByRole("button", { name: "Add location" });
    await fireEvent.click(addButtons[addButtons.length - 1]);
    await fireEvent.click(screen.getByRole("button", { name: "Save location" }));

    expect(
      screen.getByText("Fix the highlighted fields before saving the location."),
    ).toBeInTheDocument();
    expect(screen.getByText("Name is required.")).toBeInTheDocument();
    expect(screen.getByText("Type is required.")).toBeInTheDocument();
  });

  it("renders persistence error state visibly", () => {
    persistenceDiagnostics.set({
      status: "error",
      dataPath: null,
      initializedAt: null,
      lastInitializationStatus: "Persistence operation failed.",
      lastMigrationStatus: "Migration did not complete.",
      lastError: "Persisted locations data is invalid.",
    });

    render(LocationsPage, {
      props: {
        autoInitialize: false,
      },
    });

    expect(screen.getByText("Locations could not load")).toBeInTheDocument();
    expect(screen.getByText("Persisted locations data is invalid.")).toBeInTheDocument();
  });
});
