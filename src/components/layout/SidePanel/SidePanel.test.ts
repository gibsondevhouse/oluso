import { fireEvent, render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";
import SidePanel from "./SidePanel.svelte";

describe("SidePanel", () => {
  beforeEach(() => localStorage.clear());

  it("renders the manager-facing work-context navigation", async () => {
    render(SidePanel, { props: { currentPath: "/dashboard", collapsed: false } });

    expect(screen.getByRole("link", { name: "Home" })).toBeInTheDocument();
    for (const section of ["Enterprise", "Chemicals", "Exposure", "Field & Assurance", "Review"]) {
      expect(screen.getByRole("button", { name: section })).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: "Navigator" })).toHaveAttribute("href", "/enterprise/navigator");
    expect(screen.getByRole("link", { name: "Locations" })).toHaveAttribute("href", "/operations/locations");

    await fireEvent.click(screen.getByRole("button", { name: "Chemicals" }));
    expect(screen.getByRole("link", { name: "Products" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Site Inventory" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Chemical Uses" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "SDS Review" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "Migration Review" })).not.toBeInTheDocument();
  });

  it("updates the active route and remembers the last expanded section", async () => {
    const rendered = render(SidePanel, { props: { currentPath: "/dashboard", collapsed: false } });
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");

    await rendered.rerender({ currentPath: "/operations/locations", collapsed: false });
    expect(screen.getByRole("link", { name: "Locations" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).not.toHaveAttribute("aria-current");

    await fireEvent.click(screen.getByRole("button", { name: "Review" }));
    expect(localStorage.getItem("oluso.navigation.expanded-section.v1")).toBe("review");
  });
});
