import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";
import { findRoute } from "$lib/navigation/route-registry";
import {
  localPersistenceRepository,
  resetPersistenceStoresForTest,
} from "$lib/persistence/local-persistence";
import RegisterCrudPage from "./RegisterCrudPage.svelte";

function renderRegisterRoute(path: string) {
  const route = findRoute(path);

  if (!route) {
    throw new Error(`Expected route to be registered: ${path}`);
  }

  return render(RegisterCrudPage, {
    props: {
      route,
    },
  });
}

describe("RegisterCrudPage", () => {
  beforeEach(() => {
    localStorage.clear();
    resetPersistenceStoresForTest();
  });

  it("searches, filters, and sorts records on the shared list route", async () => {
    renderRegisterRoute("/operations/locations");

    expect(
      await screen.findByRole("row", { name: "Open record loc-demo-main-facility" }),
    ).toBeInTheDocument();

    await fireEvent.input(screen.getByPlaceholderText("Search locations"), {
      target: { value: "workshop" },
    });
    expect(screen.getAllByText("Workshop").length).toBeGreaterThan(0);
    expect(
      screen.queryByRole("row", { name: "Open record loc-demo-main-facility" }),
    ).not.toBeInTheDocument();

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

  it("creates a record from the shared new route and opens its detail route", async () => {
    renderRegisterRoute("/operations/locations/new");

    expect(await screen.findByRole("form", { name: "Add new Location" })).toBeInTheDocument();

    await fireEvent.input(screen.getByLabelText("Name"), { target: { value: "North Yard" } });
    await fireEvent.change(screen.getByLabelText("Type"), { target: { value: "Outdoor Area" } });
    await fireEvent.change(screen.getByLabelText("Parent Location / Site"), {
      target: { value: "loc-demo-main-facility" },
    });
    await fireEvent.change(screen.getByLabelText("Country"), {
      target: { value: "United States" },
    });
    await fireEvent.change(screen.getByLabelText("State / Province"), {
      target: { value: "Michigan" },
    });
    await fireEvent.input(screen.getByLabelText("Description"), {
      target: { value: "Outdoor staging area." },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Save location" }));

    expect(await screen.findByRole("heading", { level: 1, name: "North Yard" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Location fields" })).toBeInTheDocument();
    expect(screen.getByText("Main Facility")).toBeInTheDocument();
    expect(screen.getByText("United States")).toBeInTheDocument();
    expect(screen.getByText("Michigan")).toBeInTheDocument();
  });

  it("renders location parent and child relationships", async () => {
    renderRegisterRoute("/operations/locations/loc-demo-main-facility");

    expect(await screen.findByRole("heading", { level: 1, name: "Main Facility" })).toBeInTheDocument();
    expect(screen.getByText("Parent location")).toBeInTheDocument();
    expect(screen.getByText("Chemical Storage Room, Workshop")).toBeInTheDocument();

    const childSection = screen
      .getByRole("heading", { level: 2, name: "Child Locations" })
      .closest("section");

    if (!childSection) {
      throw new Error("Expected Child Locations section");
    }

    expect(within(childSection).getByText("Chemical Storage Room")).toBeInTheDocument();
    expect(within(childSection).getByText("Workshop")).toBeInTheDocument();
  });

  it("filters register rows by site plant hierarchy", async () => {
    await localPersistenceRepository.initialize();
    localPersistenceRepository.createEquipment({
      name: "Secondary Site Forklift",
      type: "Forklift",
      locationId: "loc-demo-secondary-warehouse",
      processId: "",
      status: "active",
      description: "Forklift assigned to the secondary site warehouse.",
      notes: "",
    });

    renderRegisterRoute("/operations/equipment");

    expect(await screen.findByText("Workshop Dust Collector")).toBeInTheDocument();
    expect(screen.getByText("Secondary Site Forklift")).toBeInTheDocument();

    await fireEvent.change(screen.getByLabelText("Site / Plant"), {
      target: { value: "loc-demo-secondary-site" },
    });

    expect(screen.getByText("Secondary Site Forklift")).toBeInTheDocument();
    expect(screen.queryByText("Workshop Dust Collector")).not.toBeInTheDocument();
  });

  it("renders shared validation errors on invalid new routes", async () => {
    renderRegisterRoute("/field/findings/new");

    expect(await screen.findByRole("form", { name: "Add new Finding" })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "Save finding" }));

    expect(
      screen.getByText("Fix the highlighted fields before saving the finding."),
    ).toBeInTheDocument();
    expect(screen.getByText("Title is required.")).toBeInTheDocument();
    expect(screen.getByText("Finding type is required.")).toBeInTheDocument();
    expect(screen.getByText("Severity is required.")).toBeInTheDocument();
  });

  it("renders relationship panels with archive and restore controls", async () => {
    renderRegisterRoute("/field/findings/finding-demo-egress");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Blocked emergency egress path" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Related Location" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Related Corrective Actions" })).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: /More/ }));
    await fireEvent.click(screen.getByRole("menuitem", { name: "Archive…" }));
    await fireEvent.click(screen.getAllByRole("button", { name: "Archive" }).at(-1)!);
    expect(within(screen.getByLabelText("Record states")).getByText("Archived")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: /More/ }));
    await fireEvent.click(screen.getByRole("menuitem", { name: "Restore" }));
    await fireEvent.click(screen.getAllByRole("button", { name: "Restore" }).at(-1)!);
    expect(within(screen.getByLabelText("Record states")).getByText("Active")).toBeInTheDocument();
  });

  it("renders the shared not-found state for missing detail records", async () => {
    renderRegisterRoute("/field/findings/missing-finding");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Record not found" }),
    ).toBeInTheDocument();
    expect(screen.getByText(/may have been archived, removed, or is not available/)).toBeInTheDocument();
    expect(screen.queryByText("missing-finding")).not.toBeInTheDocument();
  });

  it("keeps archived records directly viewable", async () => {
    await localPersistenceRepository.initialize();
    await localPersistenceRepository.archiveRecord(
      "locations",
      "loc-demo-workshop",
      "Direct shared route review.",
    );

    renderRegisterRoute("/operations/locations/loc-demo-workshop");

    expect(await screen.findByRole("heading", { level: 1, name: "Workshop" })).toBeInTheDocument();
    expect(within(screen.getByLabelText("Record states")).getByText("Lifecycle")).toBeInTheDocument();
    expect(within(screen.getByLabelText("Record states")).getByText("Archived")).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: /More/ }));
    expect(screen.getByRole("menuitem", { name: "Restore" })).toBeInTheDocument();
    expect(screen.getByText("Direct shared route review.")).toBeInTheDocument();
  });
});
