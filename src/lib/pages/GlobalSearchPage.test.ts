import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";
import {
  localPersistenceRepository,
  resetPersistenceStoresForTest,
} from "$lib/persistence/local-persistence";
import GlobalSearchPage from "./GlobalSearchPage.svelte";

describe("GlobalSearchPage", () => {
  beforeEach(() => {
    localStorage.clear();
    resetPersistenceStoresForTest();
  });

  it("finds records across registers and links to their detail routes", async () => {
    render(GlobalSearchPage);

    const input = await screen.findByPlaceholderText("Search all registers");
    await fireEvent.input(input, { target: { value: "egress" } });

    const result = await screen.findByRole("link", { name: "Blocked emergency egress path" });
    expect(result).toHaveAttribute("href", "/field/findings/finding-demo-egress");
    const resultItem = result.closest("li");
    if (!resultItem) {
      throw new Error("Expected finding result item.");
    }

    expect(within(resultItem).getByText("Findings")).toBeInTheDocument();
    expect(screen.getByText("3 records found")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Emergency Egress Walkthrough" })).toHaveAttribute(
      "href",
      "/field/inspections/insp-demo-egress-walkthrough",
    );
  });

  it("filters global results by register", async () => {
    render(GlobalSearchPage);

    const input = await screen.findByPlaceholderText("Search all registers");
    await fireEvent.input(input, { target: { value: "acetone" } });
    expect(await screen.findByRole("link", { name: "Acetone" })).toBeInTheDocument();

    await fireEvent.change(screen.getByLabelText("Register"), {
      target: { value: "exposure-monitoring" },
    });

    expect(screen.queryByRole("link", { name: "Acetone" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "IH-2026-001" })).toHaveAttribute(
      "href",
      "/hse/exposure-monitoring/exposure-demo-acetone-twa",
    );
  });

  it("can include archived records when requested", async () => {
    await localPersistenceRepository.initialize();
    await localPersistenceRepository.archiveRecord(
      "locations",
      "loc-demo-workshop",
      "Search page archive test.",
    );

    render(GlobalSearchPage);

    const input = await screen.findByPlaceholderText("Search all registers");
    await fireEvent.input(input, { target: { value: "workshop" } });

    expect(screen.queryByRole("link", { name: "Workshop" })).not.toBeInTheDocument();

    await fireEvent.click(screen.getByLabelText("Include archived records"));

    const resultItem = (await screen.findByRole("link", { name: "Workshop" })).closest("li");
    if (!resultItem) {
      throw new Error("Expected archived workshop result item.");
    }

    expect(within(resultItem).getByRole("status", { name: "Archived lifecycle" })).toBeInTheDocument();
  });
});
