import { render, screen } from "@testing-library/svelte";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { foundationApplication } from "$lib/application/foundation";
import { ADAMA_DATABASE_NAME, deleteAdamaDatabase } from "$lib/data/database";
import DashboardPage from "./DashboardPage.svelte";

describe("DashboardPage", () => {
  beforeEach(async () => {
    localStorage.clear();
    foundationApplication.close();
    await deleteAdamaDatabase(ADAMA_DATABASE_NAME);
    const services = await foundationApplication.services();
    const country = await services.locations.createCountry({ name: "United States", status: "Active" });
    const state = await services.locations.createStateOrProvince({ name: "Georgia", parentId: country.id, status: "Active" });
    const city = await services.locations.createCityOrMunicipality({ name: "Tifton", parentId: state.id, status: "Active" });
    await services.locations.createSite({ name: "Tifton Campus", parentId: city.id, status: "Active" });
  });

  afterEach(async () => { foundationApplication.close(); await deleteAdamaDatabase(ADAMA_DATABASE_NAME); });

  it("summarizes the current work context without exposing persistence internals", async () => {
    render(DashboardPage);
    expect(screen.getByRole("heading", { level: 1, name: "Global HSE workspace" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open Navigator/ })).toHaveAttribute("href", "/enterprise/navigator");
    expect(await screen.findByText("Physical Locations")).toBeInTheDocument();
    expect(screen.getByText("Products present")).toBeInTheDocument();
    expect(screen.getByText("Open data gaps")).toBeInTheDocument();
    expect(screen.queryByText(/localStorage:\/\/|IndexedDB|Persistence ready/)).not.toBeInTheDocument();
  });
});
