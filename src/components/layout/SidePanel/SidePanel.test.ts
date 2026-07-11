import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import SidePanel from "./SidePanel.svelte";

describe("SidePanel", () => {
  it("renders the documented MVP navigation items", async () => {
    render(SidePanel, {
      props: {
        currentPath: "/dashboard",
        collapsed: false,
      },
    });

    await fireEvent.click(screen.getByRole("button", { name: "Field Work" }));
    await fireEvent.click(screen.getByRole("button", { name: "Reports" }));
    await fireEvent.click(screen.getByRole("button", { name: "System" }));

    for (const item of [
      "Dashboard",
      "Locations",
      "Processes",
      "Equipment",
      "Chemicals",
      "Hazards",
      "Controls",
      "Risk Assessments",
      "SEGs",
      "Findings",
      "Corrective Actions",
      "Exports",
      "Settings",
    ]) {
      expect(screen.getByRole("link", { name: item })).toBeInTheDocument();
    }
  });

  it("updates active route state when the current path changes", async () => {
    const rendered = render(SidePanel, {
      props: {
        currentPath: "/dashboard",
        collapsed: false,
      },
    });

    expect(screen.getByRole("link", { name: "Dashboard" })).toHaveAttribute(
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
    expect(screen.getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
    );
  });
});
