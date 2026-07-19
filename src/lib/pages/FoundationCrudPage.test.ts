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
let city: Location;
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
  state = await services.locations.createStateOrProvince({ name: "Georgia", parentId: country.id, status: "Active" });
  city = await services.locations.createCityOrMunicipality({ name: "Tifton", parentId: state.id, status: "Active" });
  site = await services.locations.createSite({ name: "Tifton Campus", parentId: city.id, status: "Active" });
  building = await services.locations.createOperationalNode({
    name: "Building A",
    nodeType: "Building",
    parentId: site.id,
    status: "Active",
  });
  const manufacturing = (await services.operationalFunctions.list()).find((item) => item.name === "Manufacturing")!;
  await services.locationFunctionAssignments.create({
    locationId: building.id, operationalFunctionId: manufacturing.id,
    assignmentType: "Primary Function", isPrimary: true, status: "Active",
  });
  process = await services.processes.create({
    name: "Packaging",
    processType: "Production",
    operationalFunctionId: manufacturing.id,
    primaryLocationId: building.id,
    status: "Active",
  });
  task = await services.tasks.create({
    name: "Load packer",
    taskType: "Routine Operation",
    processId: process.id,
    locationId: building.id,
    routineClassification: "Normally Routine",
    status: "Active",
  });
  organization = await services.organizations.create({
    name: "ADAMA Tifton",
    organizationType: "Corporate Group",
    status: "Active",
  });
  await services.locationFunctionAssignments.create({
    locationId: site.id, operationalFunctionId: manufacturing.id,
    assignmentType: "Supporting Function", status: "Active",
  });
  await services.organizationLocationAssignments.create({
    organizationId: organization.id, locationId: site.id, relationshipType: "Operates", isPrimary: true, status: "Active",
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
  it("renders an integrated navigator with distinct enterprise node classes and assigned Functions", async () => {
    renderRoute("/enterprise/navigator");
    expect(await screen.findByRole("heading", { level: 1, name: "Enterprise Navigator" })).toBeInTheDocument();
    expect(screen.getByLabelText("Navigator legend")).toHaveTextContent("Organization");
    expect(await screen.findByText("ADAMA Tifton")).toBeInTheDocument();
    expect(screen.getByText("United States", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("Georgia", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("Tifton", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("Tifton Campus", { selector: "strong" })).toBeInTheDocument();
    expect(screen.getByText("Manufacturing")).toBeInTheDocument();
  });

  it("assigns several operational Functions from the Location detail checkbox panel", async () => {
    renderRoute(`/operations/locations/${building.id}`);
    expect((await screen.findAllByRole("heading", { level: 2, name: "Assigned Functions" })).length).toBeGreaterThan(0);
    const checkboxes = screen.getAllByRole("checkbox") as HTMLInputElement[];
    const manufacturing = checkboxes.find((item) => item.closest("label")?.querySelector("strong")?.textContent === "Manufacturing")!;
    const laboratory = checkboxes.find((item) => item.closest("label")?.querySelector("strong")?.textContent === "Laboratory")!;
    expect(manufacturing.checked).toBe(true);
    expect(laboratory.checked).toBe(false);
    await fireEvent.click(laboratory);
    await waitFor(async () => {
      const lab = (await services.operationalFunctions.list()).find((item) => item.name === "Laboratory")!;
      expect((await services.locationFunctionAssignments.list()).some((item) => item.locationId === building.id && item.operationalFunctionId === lab.id && item.status === "Active")).toBe(true);
    });
  });

  it("guides Process creation by Site, Location, and compatible Function", async () => {
    renderRoute("/operations/processes/new");
    expect(await screen.findByRole("form", { name: "Process form" })).toBeInTheDocument();

    const locationSelect = screen.getByLabelText("Primary location") as HTMLSelectElement;
    expect(Array.from(locationSelect.options).filter((item) => item.value)).toHaveLength(0);
    await fireEvent.change(screen.getByLabelText("Site"), { target: { value: site.id } });
    expect(Array.from(locationSelect.options).some((item) => item.value === building.id)).toBe(true);
    await fireEvent.change(locationSelect, { target: { value: building.id } });
    const functionSelect = screen.getByLabelText("Operational Function") as HTMLSelectElement;
    expect(Array.from(functionSelect.options).some((item) => item.textContent?.includes("Manufacturing"))).toBe(true);
  });

  it("adds an effective-dated same-Site supporting Location to a Process", async () => {
    renderRoute(`/operations/processes/${process.id}`);
    expect(await screen.findByRole("heading", { level: 2, name: "Process Locations" })).toBeInTheDocument();
    const form = screen.getByRole("form", { name: "Add Process Location" });
    await fireEvent.change(within(form).getByLabelText("Supporting Location"), { target: { value: site.id } });
    await fireEvent.change(within(form).getByLabelText("Relationship"), { target: { value: "Source" } });
    await fireEvent.input(within(form).getByLabelText("Sequence"), { target: { value: "1" } });
    await fireEvent.click(within(form).getByRole("button", { name: "Add supporting Location" }));

    await waitFor(async () => {
      expect((await services.processLocationAssignments.list()).some((item) =>
        item.processId === process.id && item.locationId === site.id && item.relationshipType === "Source" && item.sequence === 1,
      )).toBe(true);
    });
  });

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
    await fireEvent.change(screen.getByLabelText("Type"), { target: { value: "Laboratory Provider" } });
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
    expect(screen.getAllByText("Normally Routine", { selector: "dd" })).toHaveLength(1);
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
