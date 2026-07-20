import { beforeEach, describe, expect, it } from "vitest";
import { findRoute } from "./route-registry";
import {
  clearRecentNavigationForTest,
  readRecentNavigation,
  rememberRecentNavigation,
} from "./recent-navigation";

function route(path: string) {
  const found = findRoute(path);
  if (!found) throw new Error(`Expected route for ${path}`);
  return found;
}

describe("recent navigation", () => {
  beforeEach(() => {
    localStorage.clear();
    clearRecentNavigationForTest();
  });

  it("stores bounded recent portal destinations as a local UI preference", () => {
    rememberRecentNavigation(route("/operations/locations"), new Date("2026-07-20T12:00:00.000Z"));
    rememberRecentNavigation(route("/master/products"), new Date("2026-07-20T12:05:00.000Z"));

    expect(readRecentNavigation()).toEqual([
      expect.objectContaining({ path: "/master/products", title: "Chemical Products" }),
      expect.objectContaining({ path: "/operations/locations", title: "Locations" }),
    ]);
  });

  it("does not store Home, edit, or create routes", () => {
    rememberRecentNavigation(route("/home"));
    rememberRecentNavigation(route("/operations/locations/new"));
    rememberRecentNavigation(route("/operations/locations/location-1/edit"));

    expect(readRecentNavigation()).toEqual([]);
  });
});
