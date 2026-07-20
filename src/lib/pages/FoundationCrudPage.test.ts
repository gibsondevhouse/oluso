import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
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
  localStorage.clear();
  foundationApplication.close();
  await deleteAdamaDatabase(ADAMA_DATABASE_NAME);
  services = await foundationApplication.services();
  country = await services.locations.createCountry({ name: "United States", status: "Active" });
  state = await services.locations.createStateOrProvince({ name: "Georgia", parentId: country.id, status: "Active" });
  city = await services.locations.createCityOrMunicipality({ name: "Tifton", parentId: state.id, status: "Active" });
  site = await services.locations.createSite({ name: "Tifton Campus", parentId: city.id, status: "Active" });
  building = await services.locations.createOperationalNode({ name: "Building A", nodeType: "Building", parentId: site.id, status: "Active" });
  const manufacturing = (await services.operationalFunctions.list()).find((item) => item.name === "Manufacturing")!;
  await services.locationFunctionAssignments.create({ locationId: building.id, operationalFunctionId: manufacturing.id, assignmentType: "Primary Function", isPrimary: true, status: "Active" });
  await services.locationFunctionAssignments.create({ locationId: site.id, operationalFunctionId: manufacturing.id, assignmentType: "Supporting Function", status: "Active" });
  process = await services.processes.create({ name: "Packaging", processType: "Production", operationalFunctionId: manufacturing.id, primaryLocationId: building.id, status: "Active" });
  task = await services.tasks.create({ name: "Load packer", taskType: "Routine Operation", processId: process.id, locationId: building.id, routineClassification: "Normally Routine", status: "Active" });
  organization = await services.organizations.create({ name: "ADAMA Tifton", organizationType: "Corporate Group", status: "Active" });
  await services.organizationLocationAssignments.create({ organizationId: organization.id, locationId: site.id, relationshipType: "Operates", isPrimary: true, status: "Active" });
});

afterEach(async () => { foundationApplication.close(); await deleteAdamaDatabase(ADAMA_DATABASE_NAME); });

function renderRoute(path: string) {
  const route = findRoute(path);
  if (!route) throw new Error(`Expected registered route ${path}`);
  return render(RouteOutlet, { props: { route } });
}

describe("operational foundation workspaces", () => {
  it("provides geography, organization, and function navigator views with search and keyboard tree semantics", async () => {
    renderRoute("/enterprise/navigator");
    expect(await screen.findByRole("heading", { level: 1, name: "Enterprise Navigator" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "By Geography" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "By Organization" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "By Function" })).toBeInTheDocument();
    expect(screen.getByRole("tree", { name: "Enterprise hierarchy" })).toBeInTheDocument();
    expect(screen.getByLabelText("Search hierarchy")).toHaveAttribute("placeholder", "Search by name or code");
    expect(screen.getByText("Tifton Campus", { selector: "span" })).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "By Organization" }));
    expect(screen.getByText("ADAMA Tifton", { selector: "span" })).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "By Function" }));
    expect(screen.getByText("Manufacturing", { selector: "span" })).toBeInTheDocument();
  });

  it("keeps hierarchy exploration separate from Location search and filtering", async () => {
    renderRoute("/operations/locations");
    expect(await screen.findByRole("heading", { level: 1, name: "Locations" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Explore hierarchy" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByPlaceholderText("Search Locations")).not.toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "Search and filter Locations" }));
    expect(screen.getByPlaceholderText("Search Locations")).toBeInTheDocument();
    expect(screen.queryByRole("tree")).not.toBeInTheDocument();
  });

  it("guides Process creation through Site, Location, and compatible Function", async () => {
    renderRoute("/operations/processes/new");
    expect(await screen.findByRole("heading", { level: 2, name: "New process" })).toBeInTheDocument();
    const locationSelect = screen.getByLabelText("Primary location") as HTMLSelectElement;
    expect(Array.from(locationSelect.options).filter((item) => item.value)).toHaveLength(0);
    await fireEvent.change(screen.getByLabelText("Site"), { target: { value: site.id } });
    expect(Array.from(locationSelect.options).some((item) => item.value === building.id)).toBe(true);
    await fireEvent.change(locationSelect, { target: { value: building.id } });
    expect(Array.from((screen.getByLabelText("Operational Function") as HTMLSelectElement).options).some((item) => item.textContent?.includes("Manufacturing"))).toBe(true);
  });

  it("renders a Site as a contextual workspace with explicit states, actions, tabs, and Connected Records", async () => {
    renderRoute(`/operations/locations/${site.id}`);
    expect(await screen.findByRole("heading", { level: 1, name: "Tifton Campus" })).toBeInTheDocument();
    for (const state of ["Lifecycle", "Review", "Data quality", "Sync / exchange"]) expect(screen.getByText(state)).toBeInTheDocument();
    for (const action of ["Add Location", "Assign Function", "Add Process", "Record Inventory", "Document Chemical Use", "Start Baseline"]) expect(screen.getByRole("button", { name: action })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Physical Layout" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Connected Records" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Archive" })).not.toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: /More/ }));
    expect(screen.getByRole("menuitem", { name: "Archive…" })).toBeInTheDocument();
  });

  it("shows the Process chain and groups Tasks by operational work type", async () => {
    renderRoute(`/operations/processes/${process.id}`);
    expect(await screen.findByRole("heading", { level: 1, name: "Packaging" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Operational chain" })).toBeInTheDocument();
    expect(screen.getByText("Routine Work")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Load packer/ })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Connected Records" })).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("tab", { name: "History" }));
    await waitFor(() => expect(screen.getByRole("heading", { name: "Revision History" })).toBeInTheDocument());
  });
});
