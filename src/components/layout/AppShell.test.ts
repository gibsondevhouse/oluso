import { render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";
import { resetPersistenceStoresForTest } from "$lib/persistence/local-persistence";
import AppShell from "./AppShell.svelte";

describe("AppShell", () => {
  beforeEach(() => {
    localStorage.clear();
    resetPersistenceStoresForTest();
  });

  it("renders the operational shell, persistent scope, and accessible shortcuts", () => {
    render(AppShell, { props: { currentPath: "/dashboard" } });
    expect(screen.getByRole("navigation", { name: "Main sections" })).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toHaveAttribute("id", "main-content");
    expect(screen.getAllByText("ADAMA HSE")).toHaveLength(2);
    expect(screen.getByText("Operational workspace")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open command palette" })).toBeInTheDocument();
    expect(screen.getByLabelText("Global workspace scope")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Skip to main content" })).toHaveAttribute("href", "#main-content");
    expect(screen.queryByText(/IndexedDB|persistence data path/i)).not.toBeInTheDocument();
  });
});
