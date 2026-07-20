import { fireEvent, render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";
import {
  localPersistenceRepository,
  resetPersistenceStoresForTest,
} from "$lib/persistence/local-persistence";
import { findRoute } from "$lib/navigation/route-registry";
import { rememberRecentNavigation } from "$lib/navigation/recent-navigation";
import CommandPalette from "./CommandPalette.svelte";

describe("CommandPalette", () => {
  beforeEach(() => {
    localStorage.clear();
    resetPersistenceStoresForTest();
  });

  it("renders navigation and create/start intents", async () => {
    const route = findRoute("/operations/locations");
    if (!route) throw new Error("Expected route");
    rememberRecentNavigation(route, new Date("2026-07-20T12:00:00.000Z"));

    render(CommandPalette, {
      props: {
        open: true,
        onClose: () => undefined,
      },
    });

    expect(screen.getByRole("dialog", { name: "Command Palette" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Recent" })).toBeInTheDocument();
    expect(
      screen
        .getAllByRole("button", { name: /Locations/ })
        .some((button) => button.textContent?.includes("Recently opened")),
    ).toBe(true);
    expect(
      screen
        .getAllByRole("button", { name: /Home/ })
        .some((button) => button.textContent?.includes("Home destination")),
    ).toBe(true);
    await fireEvent.input(screen.getByLabelText("Search commands and records"), {
      target: { value: "finding" },
    });

    expect(screen.getByRole("button", { name: /Add finding/ })).toBeInTheDocument();
  });

  it("adds read-only record results from global search", async () => {
    await localPersistenceRepository.initialize();

    render(CommandPalette, {
      props: {
        open: true,
        onClose: () => undefined,
      },
    });

    await fireEvent.input(screen.getByLabelText("Search commands and records"), {
      target: { value: "egress" },
    });

    expect(await screen.findByRole("button", { name: /Blocked emergency egress path/ })).toBeInTheDocument();
  });
});
