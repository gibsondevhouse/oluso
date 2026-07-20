import { fireEvent, render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";
import SidePanel from "./SidePanel.svelte";

describe("SidePanel", () => {
  beforeEach(() => localStorage.clear());

  it("renders the portal navigation sections and destinations", async () => {
    render(SidePanel, { props: { currentPath: "/home", collapsed: false } });

    for (const section of ["Operations", "The Plant", "Exposure"]) {
      expect(screen.getByRole("button", { name: section })).toHaveAttribute("aria-expanded", "true");
    }

    for (const item of [
      "Home",
      "Search",
      "Activity",
      "Actions",
      "Inspections & Observations",
      "Incidents",
      "Locations",
      "Functions, Processes & Tasks",
      "Equipment",
      "People",
      "Chemicals & SDS",
      "Similar Exposure Groups (SEGs)",
      "Assessments",
      "Monitoring & Sampling",
      "Controls & Reassessment",
      "Review Packets & Exports",
      "Profile & Local Actor",
      "Installation",
      "Storage, Backups & Diagnostics",
    ]) {
      expect(screen.getByRole("link", { name: item })).toBeInTheDocument();
    }

    await fireEvent.click(screen.getByRole("button", { name: "Future Modules" }));

    expect(
      screen
        .getAllByRole("link", { name: /Inspections\s+Future/ })
        .some((link) => link.getAttribute("href") === "/field/inspections"),
    ).toBe(true);
  });

  it("keeps the legacy dashboard path active on Home while redirecting", async () => {
    render(SidePanel, {
      props: {
        currentPath: "/dashboard",
        collapsed: false,
      },
    });

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
  });

  it("updates active route state when the current path changes", async () => {
    const rendered = render(SidePanel, {
      props: {
        currentPath: "/home",
        collapsed: false,
      },
    });

    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );

    await rendered.rerender({
      currentPath: "/operations/locations",
      collapsed: false,
    });

    expect(screen.getByRole("link", { name: "Locations" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
