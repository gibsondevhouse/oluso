import { fireEvent, render, screen, waitFor, within } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { foundationApplication, type FoundationServices } from "$lib/application/foundation";
import { ADAMA_DATABASE_NAME, deleteAdamaDatabase } from "$lib/data/database";
import { findRoute } from "$lib/navigation/route-registry";
import type { Location, Organization, Process, Task } from "$lib/domain/foundation";
import RouteOutlet from "./RouteOutlet.svelte";

let services: FoundationServices;
let country: Location;
let state: Location;
let site: Location;
let building: Location;
let process: Process;
let task: Task;
let organization: Organization;

beforeEach(async () => {
  foundationApplication.close();
  await deleteAdamaDatabase(ADAMA_DATABASE_NAME);
  services = await foundationApplication.services();
  country = await services.locations.createCountry({ name: "United States", status: "Active" });
  state = await services.locations.createStateOrRegion({ name: "Georgia", parentId: country.id, status: "Active" });
  site = await services.locations.createSite({ name: "Tifton", parentId: state.id, status: "Active" });
  building = await services.locations.createOperationalNode({
    name: "Building A",
    nodeType: "Building",
    parentId: site.id,
    status: "Active",
  });
  process = await services.processes.create({
    name: "Packaging",
    processType: "Production",
    primaryLocationId: building.id,
    status: "Active",
  });
  task = await services.tasks.create({
    name: "Load packer",
    taskType: "Routine Operation",
    processId: process.id,
    locationId: building.id,
    routineStatus: "Routine",
    operatingCondition: "Routine",
    status: "Active",
  });
  organization = await services.organizations.create({
    name: "ADAMA Tifton",
    organizationType: "ADAMA Entity",
    status: "Active",
  });
});

afterEach(async () => {
  vi.restoreAllMocks();
  foundationApplication.close();
  await deleteAdamaDatabase(ADAMA_DATABASE_NAME);
});

function renderRoute(path: string) {
  const route = findRoute(path);
  if (!route) throw new Error(`Expected registered route ${path}`);
  return render(RouteOutlet, { props: { route } });
}

describe("foundation route cutover", () => {
  it("loads typed records, search/filter controls, offline state, and the Location hierarchy tree", async () => {
    renderRoute("/operations/locations");

    expect(await screen.findByRole("heading", { level: 2, name: "Location tree" })).toBeInTheDocument();
    expect(screen.getByText("Offline-ready · Typed IndexedDB workflow")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Building A/ })).toBeInTheDocument();
    expect(screen.getByRole("row", { name: `Open record ${building.id}` })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search locations")).toBeInTheDocument();
    expect(screen.getByLabelText("Site")).toBeInTheDocument();
  });

  it("dynamically filters Location parents by valid node type and prevents descendant choices", async () => {
    renderRoute(`/operations/locations/${building.id}/edit`);
    expect(await screen.findByRole("form", { name: "Location form" })).toBeInTheDocument();

    const parentSelect = screen.getByLabelText("Parent location") as HTMLSelectElement;
    expect(Array.from(parentSelect.options).some((option) => option.value === site.id)).toBe(true);
    expect(Array.from(parentSelect.options).some((option) => option.value === building.id)).toBe(false);
    expect(Array.from(parentSelect.options).some((option) => option.value === country.id)).toBe(false);
  });

  it("creates an Organization through IndexedDB without writing legacy localStorage", async () => {
    const setItem = vi.spyOn(Storage.prototype, "setItem");
    renderRoute("/people/organizations/new");
    expect(await screen.findByRole("form", { name: "Organization form" })).toBeInTheDocument();

    await fireEvent.input(screen.getByLabelText("Name"), { target: { value: "Safety Laboratory" } });
    await fireEvent.change(screen.getByLabelText("Type"), { target: { value: "Laboratory" } });
    await fireEvent.click(screen.getByRole("button", { name: "Create organization" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Safety Laboratory" })).toBeInTheDocument();
    expect((await services.organizations.list()).some((record) => record.name === "Safety Laboratory")).toBe(true);
    expect(setItem).not.toHaveBeenCalled();
  });

  it("keeps invalid values visible and focuses the first invalid field", async () => {
    renderRoute("/people/workers/new");
    expect(await screen.findByRole("form", { name: "Person form" })).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Create person" }));

    const name = screen.getByLabelText("Display name");
    expect(await screen.findByText("Display name is required.")).toBeInTheDocument();
    expect(name).toHaveFocus();
    expect(name).toHaveValue("");
  });

  it("preserves edits and reports a stale revision without a partial write", async () => {
    renderRoute(`/people/organizations/${organization.id}/edit`);
    expect(await screen.findByRole("form", { name: "Organization form" })).toBeInTheDocument();

    await services.organizations.update(
      organization.id,
      { ...organization, description: "Concurrent update" },
      organization.revision,
    );
    await fireEvent.input(screen.getByLabelText("Description"), { target: { value: "My unsaved edit" } });
    await fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(/changed from revision 1 to 2/i);
    expect(screen.getByLabelText("Description")).toHaveValue("My unsaved edit");
    expect((await services.organizations.get(organization.id)).description).toBe("Concurrent update");
  });

  it("shows revision context, requires an archive reason, and restores the record", async () => {
    renderRoute(`/operations/locations/${building.id}`);
    expect(await screen.findByRole("heading", { level: 1, name: "Building A" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Immutable revision history" })).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    const archiveDialog = screen.getByRole("dialog");
    await fireEvent.click(within(archiveDialog).getByRole("button", { name: "Archive" }));
    expect(screen.getByText("Archive reason is required.")).toBeInTheDocument();
    await fireEvent.input(within(archiveDialog).getByLabelText("Archive reason"), {
      target: { value: "Building decommissioned" },
    });
    await fireEvent.click(within(archiveDialog).getByRole("button", { name: "Archive" }));
    expect(await screen.findByRole("status", { name: "Archived lifecycle" })).toBeInTheDocument();
    expect(screen.getByText("Building decommissioned")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    await fireEvent.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Restore" }));
    await waitFor(() => {
      expect(screen.queryByRole("status", { name: "Archived lifecycle" })).not.toBeInTheDocument();
    });
  });

  it("renders typed Process and Task relationship context and intentional downstream slots", async () => {
    const processView = renderRoute(`/operations/processes/${process.id}`);
    expect(await screen.findByRole("heading", { level: 1, name: "Packaging" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Tasks" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Load packer/ })).toBeInTheDocument();
    expect(screen.getAllByText("0 — foundation slot ready", { selector: "dd" }).length).toBeGreaterThan(0);

    processView.unmount();
    renderRoute(`/operations/tasks/${task.id}`);
    expect(await screen.findByRole("heading", { level: 1, name: "Load packer" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Parent Process" })).toBeInTheDocument();
    expect(screen.getAllByText("Routine", { selector: "dd" })).toHaveLength(2);
  });

  it("reloads persisted IndexedDB records while offline-ready and handles missing records", async () => {
    const view = renderRoute("/people/organizations");
    expect(await screen.findByRole("row", { name: `Open record ${organization.id}` })).toBeInTheDocument();
    view.unmount();
    foundationApplication.close();

    const reloaded = renderRoute("/people/organizations");
    expect(await screen.findByRole("row", { name: `Open record ${organization.id}` })).toBeInTheDocument();
    expect(screen.getByText("Offline-ready · Typed IndexedDB workflow")).toBeInTheDocument();

    reloaded.unmount();
    renderRoute("/people/organizations/missing-organization");
    expect(await screen.findByRole("heading", { level: 1, name: "Record not found" })).toBeInTheDocument();
  });
});
