import { render, screen } from "@testing-library/svelte";
import { beforeEach, describe, expect, it } from "vitest";
import { resetPersistenceStoresForTest } from "$lib/persistence/local-persistence";
import AppShell from "./AppShell.svelte";

describe("AppShell", () => {
  beforeEach(() => {
    resetPersistenceStoresForTest();
  });

  it("renders the desktop shell regions", () => {
    render(AppShell, {
      props: {
        currentPath: "/dashboard",
      },
    });

    expect(screen.getByRole("navigation", { name: "Main sections" })).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByText("Desktop Workspace")).toBeInTheDocument();
    expect(screen.getByLabelText("Persistence status")).toHaveTextContent(
      "Persistence not configured",
    );
    expect(screen.queryByText("Saved locally")).not.toBeInTheDocument();
  });
});
