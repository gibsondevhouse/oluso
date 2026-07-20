import { fireEvent, render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import browserV14 from "$lib/data/legacy/__fixtures__/browser-v14.json";
import { foundationApplication } from "$lib/application/foundation";
import {
  ADAMA_DATABASE_NAME,
  deleteAdamaDatabase,
  initializeDatabaseIdentity,
  openAdamaDatabase,
} from "$lib/data/database";
import { migrateLegacyDatabase } from "$lib/data/legacy";
import { findRoute } from "$lib/navigation/route-registry";
import RouteOutlet from "./RouteOutlet.svelte";

beforeEach(async () => {
  foundationApplication.close();
  await deleteAdamaDatabase(ADAMA_DATABASE_NAME);
  const database = await openAdamaDatabase();
  await initializeDatabaseIdentity(database, {
    actorId: "migration-user",
    actorBusinessId: "PER-MIGRATION",
    actorDisplayName: "Migration User",
    installationLabel: "Migration test",
    datasetId: "dataset-migration-screen",
    installationId: "installation-migration-screen",
  });
  await migrateLegacyDatabase(database, browserV14, {
    actorId: "migration-user",
    installationId: "installation-migration-screen",
    migrationRunId: "foundation-screen-migration",
  });
  database.close();
});

afterEach(async () => {
  foundationApplication.close();
  await deleteAdamaDatabase(ADAMA_DATABASE_NAME);
});

function renderRoute(path: string) {
  const route = findRoute(path);
  if (!route) throw new Error(`Expected route ${path}`);
  return render(RouteOutlet, { props: { route } });
}

describe("legacy foundation migration screens", () => {
  it("renders normalized Organization, Person, Location, Process, and Task fixtures in typed screens", async () => {
    let view = renderRoute("/people/organizations/legacy-org-adama");
    expect(await screen.findByRole("heading", { level: 1, name: "ADAMA US" })).toBeInTheDocument();
    expect(screen.getByText("Other")).toBeInTheDocument();
    view.unmount();

    view = renderRoute("/people/workers/legacy-person-hse-manager");
    expect(await screen.findByRole("heading", { level: 1, name: "HSE Manager" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ADAMA US/ })).toBeInTheDocument();
    view.unmount();

    view = renderRoute("/operations/locations/legacy-site-tifton");
    expect(await screen.findByRole("heading", { level: 1, name: "Tifton" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "United States" }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole("link", { name: "Georgia" }).length).toBeGreaterThan(0);
    view.unmount();

    view = renderRoute("/operations/processes/legacy-process-prodiamine");
    expect(await screen.findByRole("heading", { level: 1, name: "Prodiamine WDG" })).toBeInTheDocument();
  await fireEvent.click(screen.getByRole("tab", { name: "Tasks" }));
    expect(screen.getByRole("link", { name: /Clear blocked duct/ })).toBeInTheDocument();
    view.unmount();

    renderRoute("/operations/tasks/legacy-task-duct-clearing");
    expect(await screen.findByRole("heading", { level: 1, name: "Clear blocked duct" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Prodiamine WDG/ })).toBeInTheDocument();
  });
});
