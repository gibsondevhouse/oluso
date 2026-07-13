import { fireEvent, render, screen } from "@testing-library/svelte";
import { within } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";
import { findRoute } from "$lib/navigation/route-registry";
import {
  localPersistenceRepository,
  resetPersistenceStoresForTest,
} from "$lib/persistence/local-persistence";
import RouteOutlet from "./RouteOutlet.svelte";

function renderRoute(path: string) {
  const route = findRoute(path);

  if (!route) {
    throw new Error(`Expected route to be registered: ${path}`);
  }

  return render(RouteOutlet, {
    props: {
      route,
    },
  });
}

async function mutatePersistedDatabase(mutator: (database: Record<string, unknown>) => void) {
  await localPersistenceRepository.initialize();
  const raw = localStorage.getItem("oluso.persistence.v1");

  if (!raw) {
    throw new Error("Expected persisted database");
  }

  const database = JSON.parse(raw) as Record<string, unknown>;
  mutator(database);
  localStorage.setItem("oluso.persistence.v1", JSON.stringify(database));
  resetPersistenceStoresForTest();
}

describe("RouteOutlet", () => {
  beforeEach(() => {
    localStorage.clear();
    resetPersistenceStoresForTest();
  });

  it("renders the Processes workflow route", async () => {
    const route = findRoute("/operations/processes");

    if (!route) {
      throw new Error("Expected processes route to be registered");
    }

    render(RouteOutlet, {
      props: {
        route,
      },
    });

    expect(screen.getByRole("heading", { level: 1, name: "Processes" })).toBeInTheDocument();
    expect(await screen.findByText("Chemical Receipt and Inspection")).toBeInTheDocument();
    expect(screen.getByText("Preventive Equipment Maintenance")).toBeInTheDocument();
    expect(screen.queryByText("No records to show")).not.toBeInTheDocument();
  });

  it("renders the Equipment workflow route", async () => {
    const route = findRoute("/operations/equipment");

    if (!route) {
      throw new Error("Expected equipment route to be registered");
    }

    render(RouteOutlet, {
      props: {
        route,
      },
    });

    expect(screen.getByRole("heading", { level: 1, name: "Equipment" })).toBeInTheDocument();
    expect(await screen.findByText("Workshop Dust Collector")).toBeInTheDocument();
    expect(screen.getByText("Flammable Storage Cabinet")).toBeInTheDocument();
  });

  it("renders the Locations workflow route", async () => {
    const route = findRoute("/operations/locations");

    if (!route) {
      throw new Error("Expected locations route to be registered");
    }

    render(RouteOutlet, {
      props: {
        route,
      },
    });

    expect(screen.getByRole("heading", { level: 1, name: "Locations" })).toBeInTheDocument();
    expect(
      await screen.findByRole("row", { name: "Open record loc-demo-main-facility" }),
    ).toBeInTheDocument();
  });

  it("renders the Controls workflow route", async () => {
    renderRoute("/risk/controls");

    expect(screen.getByRole("heading", { level: 1, name: "Controls" })).toBeInTheDocument();
    expect(await screen.findByText("Non-slip matting and spill signage")).toBeInTheDocument();
    expect(screen.getByText("Workshop hearing protection zone")).toBeInTheDocument();
  });

  it("renders the Risk Assessments workflow route", async () => {
    renderRoute("/risk/assessments");

    expect(screen.getByRole("heading", { level: 1, name: "Risk Assessments" })).toBeInTheDocument();
    expect(await screen.findByText("Chemical storage entry slip risk")).toBeInTheDocument();
  });

  it("renders the Findings workflow route", async () => {
    const route = findRoute("/field/findings");

    if (!route) {
      throw new Error("Expected findings route to be registered");
    }

    render(RouteOutlet, {
      props: {
        route,
      },
    });

    expect(screen.getByRole("heading", { level: 1, name: "Findings" })).toBeInTheDocument();
    expect(await screen.findByText("Blocked emergency egress path")).toBeInTheDocument();
  });

  it("renders the Reports & Exports workflow route", async () => {
    renderRoute("/reports/exports");

    expect(screen.getByRole("heading", { level: 1, name: "Reports & Exports" })).toBeInTheDocument();
    expect(await screen.findByRole("heading", { level: 2, name: "Generate Export" })).toBeInTheDocument();
    expect(screen.queryByText("No records to show")).not.toBeInTheDocument();
  });

  it.each([
    ["/operations/locations/new", "Type", "Production Area"],
    ["/operations/processes/new", "Category", "Waste Handling"],
    ["/operations/equipment/new", "Equipment Type", "Dust Collector"],
    ["/hse/chemicals/new", "Classification", "Dust/Formulated Solid"],
    ["/hse/hazards/new", "Category", "Fire/Explosion"],
    ["/risk/controls/new", "Control Type", "Engineering"],
    ["/risk/assessments/new", "Inherent Severity", "Critical"],
    ["/hse/segs/new", "SEG Type", "Task-Based Group"],
    ["/field/findings/new", "Finding Type", "Audit Finding"],
    ["/hse/exposure-monitoring/new", "Context Type", "Task"],
    ["/incidents/log/new", "Event Type", "Near Miss"],
    ["/compliance/items/new", "Item Type", "Controlled Document"],
    ["/actions/corrective-actions/new", "Corrective Action Type", "Engineering Control"],
  ])("renders controlled picklists for %s", async (path, label, optionLabel) => {
    renderRoute(path);

    const picklist = await screen.findByLabelText(label);
    expect(within(picklist).getByRole("option", { name: optionLabel })).toBeInTheDocument();
  });

  it.each([
    [
      "/operations/locations/loc-demo-main-facility",
      "Main Facility",
      ["Related Processes", "Related Equipment", "Related Findings", "Related Hazards"],
    ],
    [
      "/operations/processes/process-demo-chemical-receipt",
      "Chemical Receipt and Inspection",
      ["Related Location", "Related Chemicals", "Related Equipment", "Related Hazards", "Related SEGs", "Related Findings"],
    ],
    [
      "/operations/equipment/equipment-demo-dust-collector",
      "Workshop Dust Collector",
      ["Related Location", "Related Process"],
    ],
    ["/hse/chemicals/chem-demo-acetone", "Acetone", ["Related Processes", "Related Hazards", "Related SEGs"]],
    [
      "/hse/hazards/hazard-demo-slips",
      "Slip hazard near chemical storage entry",
      [
        "Related Locations",
        "Related Processes",
        "Related Chemicals",
        "Related Findings",
        "Related Controls",
        "Related Risk Assessments",
      ],
    ],
    [
      "/risk/controls/control-demo-slip-matting",
      "Non-slip matting and spill signage",
      ["Related Hazards", "Related Risk Assessments"],
    ],
    [
      "/risk/assessments/risk-demo-slip-storage-entry",
      "Chemical storage entry slip risk",
      ["Related Hazard", "Applied Controls"],
    ],
    [
      "/hse/segs/seg-demo-chemical-handlers",
      "Chemical Handlers",
      ["Related Process", "Related Chemicals", "Related Hazards"],
    ],
    [
      "/field/findings/finding-demo-egress",
      "Blocked emergency egress path",
      ["Related Location", "Related Process", "Related Hazard", "Related Corrective Actions"],
    ],
    [
      "/actions/corrective-actions/ca-demo-clear-egress",
      "Clear and re-mark emergency egress path",
      ["Source Record", "Related Location", "Related Process"],
    ],
  ])("renders relationship panels for %s", async (path, title, relationshipHeadings) => {
    renderRoute(path);

    expect(await screen.findByRole("heading", { level: 1, name: title })).toBeInTheDocument();
    for (const relationshipHeading of relationshipHeadings) {
      expect(
        screen.getByRole("heading", { level: 2, name: relationshipHeading }),
      ).toBeInTheDocument();
    }
  });

  it("renders clickable related record links", async () => {
    renderRoute("/field/findings/finding-demo-egress");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Blocked emergency egress path" }),
    ).toBeInTheDocument();
    const relatedLocation = screen
      .getByRole("heading", { level: 2, name: "Related Location" })
      .closest("section");

    if (!relatedLocation) {
      throw new Error("Expected related location section");
    }

    expect(within(relatedLocation).getByRole("link", { name: /Main Facility/ })).toHaveAttribute(
      "href",
      "/operations/locations/loc-demo-main-facility",
    );
  });

  it("renders a controlled warning when a related record is missing", async () => {
    await mutatePersistedDatabase((database) => {
      database.findings = (database.findings as Array<Record<string, unknown>>).map((finding) =>
        finding.id === "finding-demo-labeling"
          ? { ...finding, processId: "process-missing" }
          : finding,
      );
    });

    renderRoute("/field/findings/finding-demo-labeling");

    expect(
      await screen.findByRole("heading", {
        level: 1,
        name: "Secondary container label needs update",
      }),
    ).toBeInTheDocument();
    expect(screen.getByText("Related record ID process-missing was not found.")).toBeInTheDocument();
  });

  it("labels archived related records without hiding them", async () => {
    await localPersistenceRepository.initialize();
    localPersistenceRepository.archiveRecord(
      "processes",
      "process-demo-chemical-receipt",
      "No longer used.",
    );

    renderRoute("/operations/locations/loc-demo-main-facility");

    expect(await screen.findByRole("heading", { level: 1, name: "Main Facility" })).toBeInTheDocument();
    const relatedProcesses = screen
      .getByRole("heading", { level: 2, name: "Related Processes" })
      .closest("section");

    if (!relatedProcesses) {
      throw new Error("Expected related processes section");
    }

    expect(
      within(relatedProcesses).getByRole("link", { name: /Chemical Receipt and Inspection/ }),
    ).toHaveAttribute("href", "/operations/processes/process-demo-chemical-receipt");
    expect(
      within(relatedProcesses).getByRole("status", { name: "Archived related record" }),
    ).toBeInTheDocument();
  });

  it("shows empty relationship states when no related records exist", async () => {
    await localPersistenceRepository.initialize();
    const location = localPersistenceRepository.createLocation({
      name: "Standalone Office",
      type: "Office",
      description: "",
      status: "active",
    });

    renderRoute(`/operations/locations/${location.id}`);

    expect(await screen.findByRole("heading", { level: 1, name: "Standalone Office" })).toBeInTheDocument();
    expect(screen.getAllByText("No related records yet.")).toHaveLength(5);
  });

  it("opens a read-only detail page when a register row is clicked", async () => {
    const route = findRoute("/operations/locations");

    if (!route) {
      throw new Error("Expected locations route to be registered");
    }

    render(RouteOutlet, {
      props: {
        route,
      },
    });

    const workshopRow = await screen.findByRole("row", {
      name: "Open record loc-demo-workshop",
    });

    expect(screen.queryByRole("heading", { level: 1, name: "Workshop" })).not.toBeInTheDocument();
    await fireEvent.click(workshopRow);

    expect(await screen.findByRole("heading", { level: 1, name: "Workshop" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Metadata" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
  });

  it("renders register edit routes", async () => {
    const route = findRoute("/operations/locations/loc-demo-workshop/edit");

    if (!route) {
      throw new Error("Expected location edit route to be registered");
    }

    render(RouteOutlet, {
      props: {
        route,
      },
    });

    expect(await screen.findByRole("form", { name: "Edit Workshop" })).toBeInTheDocument();
    expect(screen.getByLabelText("Name")).toHaveValue("Workshop");
  });

  it("saves register edit routes without reloading in a reactive loop", async () => {
    renderRoute("/operations/locations/loc-demo-workshop/edit");

    expect(await screen.findByRole("form", { name: "Edit Workshop" })).toBeInTheDocument();

    await fireEvent.input(screen.getByLabelText("Name"), {
      target: { value: "Workshop Updated" },
    });
    await fireEvent.click(screen.getByRole("button", { name: "Save location" }));

    expect(
      await screen.findByRole("heading", { level: 1, name: "Workshop Updated" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("form", { name: "Edit Workshop" })).not.toBeInTheDocument();
  });

  it("renders register detail routes and lifecycle archive controls", async () => {
    const route = findRoute("/operations/locations/loc-demo-workshop");

    if (!route) {
      throw new Error("Expected location detail route to be registered");
    }

    render(RouteOutlet, {
      props: {
        route,
      },
    });

    expect(await screen.findByRole("heading", { level: 1, name: "Workshop" })).toBeInTheDocument();
    expect(screen.getByText("Metadata")).toBeInTheDocument();

    await fireEvent.click(screen.getByRole("button", { name: "Archive" }));
    await fireEvent.click(screen.getAllByRole("button", { name: "Archive" }).at(-1)!);

    expect(await screen.findByRole("status", { name: "Archived lifecycle" })).toBeInTheDocument();
    expect(screen.getByText("Archived from record detail page.")).toBeInTheDocument();
    expect(
      localPersistenceRepository
        .listLocations()
        .some((location) => location.id === "loc-demo-workshop"),
    ).toBe(false);

    await fireEvent.click(screen.getByRole("button", { name: "Restore" }));
    await fireEvent.click(screen.getAllByRole("button", { name: "Restore" }).at(-1)!);

    expect(screen.queryByRole("status", { name: "Archived lifecycle" })).not.toBeInTheDocument();
    expect(
      localPersistenceRepository
        .listLocations()
        .some((location) => location.id === "loc-demo-workshop"),
    ).toBe(true);
  });

  it("keeps archived records directly viewable by detail route", async () => {
    await localPersistenceRepository.initialize();
    localPersistenceRepository.archiveRecord("locations", "loc-demo-workshop", "Direct review.");

    const route = findRoute("/operations/locations/loc-demo-workshop");

    if (!route) {
      throw new Error("Expected location detail route to be registered");
    }

    render(RouteOutlet, {
      props: {
        route,
      },
    });

    expect(await screen.findByRole("heading", { level: 1, name: "Workshop" })).toBeInTheDocument();
    expect(screen.getByRole("status", { name: "Archived lifecycle" })).toBeInTheDocument();
    expect(screen.getByText("Direct review.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Restore" })).toBeInTheDocument();
  });

  it("does not open detail when a row action is clicked", async () => {
    const route = findRoute("/operations/locations");

    if (!route) {
      throw new Error("Expected locations route to be registered");
    }

    render(RouteOutlet, {
      props: {
        route,
      },
    });

    const workshopRow = await screen.findByRole("row", {
      name: "Open record loc-demo-workshop",
    });

    await fireEvent.click(within(workshopRow).getByRole("button", { name: "Edit" }));

    expect(await screen.findByRole("form", { name: "Edit Workshop" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { level: 1, name: "Workshop" })).not.toBeInTheDocument();
  });

  it("renders a shared record-not-found page for missing detail records", async () => {
    const route = findRoute("/field/findings/missing-finding");

    if (!route) {
      throw new Error("Expected finding detail route to be registered");
    }

    render(RouteOutlet, {
      props: {
        route,
      },
    });

    expect(
      await screen.findByRole("heading", { level: 1, name: "Record not found" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Attempted record ID: missing-finding")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to register list" })).toHaveAttribute(
      "href",
      "/field/findings",
    );
  });

  it("renders the not-found page for the not-found route", () => {
    const route = findRoute("/not-found");

    if (!route) {
      throw new Error("Expected not-found route to be registered");
    }

    render(RouteOutlet, {
      props: {
        route,
      },
    });

    expect(screen.getByRole("heading", { level: 1, name: "Page Not Found" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go to Dashboard" })).toHaveAttribute(
      "href",
      "/dashboard",
    );
  });
});
