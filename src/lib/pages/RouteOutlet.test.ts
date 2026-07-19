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
    expect(await screen.findByText("Create the first Site-resolved process.")).toBeInTheDocument();
    expect(screen.getByText("Offline-ready · Typed IndexedDB workflow")).toBeInTheDocument();
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
    expect(await screen.findByText("Create a Country to begin the operational location hierarchy.")).toBeInTheDocument();
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
    ["/operations/locations/new", "Type", "Site"],
    ["/operations/processes/new", "Type", "Warehouse"],
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
