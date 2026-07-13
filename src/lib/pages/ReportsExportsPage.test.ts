import { fireEvent, render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";
import {
  localPersistenceRepository,
  resetPersistenceStoresForTest,
} from "$lib/persistence/local-persistence";
import ReportsExportsPage from "./ReportsExportsPage.svelte";

describe("ReportsExportsPage", () => {
  beforeEach(() => {
    localStorage.clear();
    resetPersistenceStoresForTest();
  });

  it("generates a CSV download for active register records", async () => {
    render(ReportsExportsPage);

    expect(await screen.findByRole("heading", { level: 2, name: "Generate Export" })).toBeInTheDocument();

    await fireEvent.change(screen.getByLabelText("Register"), {
      target: { value: "correctiveActions" },
    });
    await fireEvent.click(screen.getByRole("button", { name: /Generate export/ }));

    const download = await screen.findByRole("link", { name: "Download CSV" });
    const href = download.getAttribute("href") ?? "";

    expect(download.getAttribute("download")).toMatch(/^oluso-corrective-actions-active-.*\.csv$/);
    expect(decodeURIComponent(href)).toContain("data:text/csv;charset=utf-8");
    expect(decodeURIComponent(href)).toContain("ca-demo-clear-egress");
    expect(decodeURIComponent(href)).toContain("findingId");
  });

  it("can include archived records in an export", async () => {
    await localPersistenceRepository.initialize();
    localPersistenceRepository.archiveRecord("locations", "loc-demo-workshop", "No longer active.");

    render(ReportsExportsPage);

    expect((await screen.findAllByText("1 archived")).length).toBeGreaterThanOrEqual(1);
    await fireEvent.change(screen.getByLabelText("Lifecycle scope"), {
      target: { value: "all" },
    });
    await fireEvent.click(screen.getByRole("button", { name: /Generate export/ }));

    const download = await screen.findByRole("link", { name: "Download CSV" });
    const href = decodeURIComponent(download.getAttribute("href") ?? "");

    expect(download.getAttribute("download")).toMatch(/^oluso-locations-all-.*\.csv$/);
    expect(href).toContain("loc-demo-workshop");
    expect(href).toContain("archived");
    expect(href).toContain("No longer active.");
  });

  it("generates JSON exports as an array of register records", async () => {
    render(ReportsExportsPage);

    expect(await screen.findByRole("heading", { level: 2, name: "Generate Export" })).toBeInTheDocument();

    await fireEvent.change(screen.getByLabelText("Register"), {
      target: { value: "findings" },
    });
    await fireEvent.change(screen.getByLabelText("Format"), {
      target: { value: "json" },
    });
    await fireEvent.click(screen.getByRole("button", { name: /Generate export/ }));

    const download = await screen.findByRole("link", { name: "Download JSON" });
    const href = decodeURIComponent(download.getAttribute("href") ?? "");

    expect(download.getAttribute("download")).toMatch(/^oluso-findings-active-.*\.json$/);
    expect(href).toContain("data:application/json;charset=utf-8");
    expect(href).toContain('"id": "finding-demo-egress"');
    expect(href).toContain('"title": "Blocked emergency egress path"');
  });

  it("generates a printable cross-register review support package", async () => {
    render(ReportsExportsPage);

    expect(await screen.findByRole("heading", { level: 2, name: "Review Support Package" })).toBeInTheDocument();
    await fireEvent.change(screen.getByLabelText("Package preset"), { target: { value: "full" } });
    await fireEvent.click(screen.getByRole("button", { name: /Generate review package/ }));

    const download = await screen.findByRole("link", { name: "Download HTML" });
    const href = decodeURIComponent(download.getAttribute("href") ?? "");

    expect(download.getAttribute("download")).toMatch(/^oluso-review-support-package-.*\.html$/);
    expect(href).toContain("data:text/html;charset=utf-8");
    expect(href).toContain("point-in-time projection of source register records");
    expect(href).toContain("Print or save as PDF");
  });
});
