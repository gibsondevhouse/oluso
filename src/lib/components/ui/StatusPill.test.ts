import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import StatusPill from "./StatusPill.svelte";

describe("StatusPill", () => {
  it("renders a non-interactive accessible status label", () => {
    render(StatusPill, {
      props: {
        label: "Active",
        tone: "active",
        context: "location",
      },
    });

    const chip = screen.getByRole("status", { name: "Active location" });
    expect(chip).toHaveTextContent("Active");
    expect(chip).toHaveClass("active");
  });

  it("normalizes state classes and supports compact rendering", () => {
    render(StatusPill, {
      props: {
        label: "In Progress",
        state: "In Progress",
        compact: true,
      },
    });

    const chip = screen.getByRole("status", { name: "In Progress" });
    expect(chip).toHaveClass("in-progress");
    expect(chip).toHaveClass("compact");
  });
});
