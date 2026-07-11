import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";
import {
  findingRecords,
  locationRecords,
  persistenceDiagnostics,
  resetPersistenceStoresForTest,
} from "$lib/persistence/local-persistence";
import { withActiveLifecycle } from "$lib/persistence/lifecycle.types";
import type { FindingRecord } from "$lib/persistence/finding.types";
import type { LocationRecord } from "$lib/persistence/location.types";
import FindingsPage from "./FindingsPage.svelte";

function setReady({
  locations = [
    withActiveLifecycle({
      id: "loc-test-main",
      name: "Main Facility",
      type: "Facility" as const,
      description: "",
      status: "active" as const,
      createdAt: "2026-07-09T12:00:00.000Z",
      updatedAt: "2026-07-09T12:00:00.000Z",
    }),
  ],
  findings = [],
}: { locations?: LocationRecord[]; findings?: FindingRecord[] } = {}) {
  persistenceDiagnostics.set({
    status: "ready",
    dataPath: "localStorage://oluso.persistence.v1",
    initializedAt: "2026-07-09T12:00:00.000Z",
    lastInitializationStatus: "Local persistence initialized.",
    lastMigrationStatus: "Schema v2 is ready.",
    lastError: null,
  });
  locationRecords.set(locations);
  findingRecords.set(findings);
}

describe("FindingsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    resetPersistenceStoresForTest();
  });

  it("creates and edits persisted Finding records", async () => {
    render(FindingsPage);

    expect(await screen.findByText("Blocked emergency egress path")).toBeInTheDocument();

    const newFindingButtons = screen.getAllByRole("button", { name: "New Finding" });
    await fireEvent.click(newFindingButtons[newFindingButtons.length - 1]);
    await fireEvent.input(screen.getByLabelText("Title"), {
      target: { value: "Spill kit missing contents" },
    });
    await fireEvent.change(screen.getByLabelText("Severity"), { target: { value: "Critical" } });
    await fireEvent.input(screen.getByLabelText("Reported by"), { target: { value: "Jordan" } });
    await fireEvent.input(screen.getByLabelText("Description"), {
      target: { value: "Absorbent pads were missing from the spill kit." },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Save finding" }));

    expect(await screen.findByText("Spill kit missing contents")).toBeInTheDocument();

    const findingRow = screen.getByText("Spill kit missing contents").closest("tr");
    if (!findingRow) {
      throw new Error("Finding row was not rendered");
    }

    await fireEvent.click(within(findingRow).getByRole("button", { name: "Edit" }));
    await fireEvent.input(screen.getByLabelText("Title"), {
      target: { value: "Spill kit restocked" },
    });
    await fireEvent.change(screen.getByLabelText("Status"), { target: { value: "Closed" } });
    await fireEvent.click(screen.getByRole("button", { name: "Save finding" }));

    expect(await screen.findByText("Spill kit restocked")).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Closed Status" })).toBeInTheDocument();
  });

  it("filters findings with client-side search", async () => {
    render(FindingsPage);

    expect(await screen.findByText("Blocked emergency egress path")).toBeInTheDocument();
    await fireEvent.input(screen.getByPlaceholderText("Search findings"), {
      target: { value: "label" },
    });

    expect(screen.getByText("Secondary container label needs update")).toBeInTheDocument();
    expect(screen.queryByText("Blocked emergency egress path")).not.toBeInTheDocument();
  });

  it("sorts findings by severity", async () => {
    render(FindingsPage);

    expect(await screen.findByText("Blocked emergency egress path")).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "Sort by Severity" }));

    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Medium")).toBeInTheDocument();
  });

  it("filters findings by status", async () => {
    render(FindingsPage);

    expect(await screen.findByText("Blocked emergency egress path")).toBeInTheDocument();
    await fireEvent.change(screen.getByLabelText("Finding status"), {
      target: { value: "In Progress" },
    });

    expect(screen.getByText("Secondary container label needs update")).toBeInTheDocument();
    expect(screen.queryByText("Blocked emergency egress path")).not.toBeInTheDocument();
  });

  it("prevents invalid submission", async () => {
    setReady({ locations: [], findings: [] });

    render(FindingsPage, {
      props: {
        autoInitialize: false,
      },
    });

    const newFindingButtons = screen.getAllByRole("button", { name: "New Finding" });
    await fireEvent.click(newFindingButtons[newFindingButtons.length - 1]);
    await fireEvent.click(screen.getByRole("button", { name: "Save finding" }));

    expect(
      screen.getByText("Fix the highlighted fields before saving the finding."),
    ).toBeInTheDocument();
    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Location is required.")).toBeInTheDocument();
    expect(screen.getByText("Severity is required.")).toBeInTheDocument();
  });

  it("renders the empty state CTA", async () => {
    setReady();

    render(FindingsPage, {
      props: {
        autoInitialize: false,
      },
    });

    expect(screen.getByText("No records found")).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "Add new Finding" }));
    expect(screen.getByRole("form", { name: "New finding" })).toBeInTheDocument();
  });

  it("renders persistence error state visibly", () => {
    persistenceDiagnostics.set({
      status: "error",
      dataPath: null,
      initializedAt: null,
      lastInitializationStatus: "Persistence operation failed.",
      lastMigrationStatus: "Migration did not complete.",
      lastError: "Persisted findings data is invalid.",
    });

    render(FindingsPage, {
      props: {
        autoInitialize: false,
      },
    });

    expect(screen.getByText("Findings could not load")).toBeInTheDocument();
    expect(screen.getByText("Persisted findings data is invalid.")).toBeInTheDocument();
  });
});
