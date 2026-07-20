import { describe, expect, it } from "vitest";
import {
  filterCommandIntents,
  getCommandIntents,
  getNavigationCommandIntents,
} from "./command-intents";

describe("command intents", () => {
  it("builds command navigation from current primary sidebar destinations", () => {
    const titles = getNavigationCommandIntents().map((intent) => intent.title);

    expect(titles).toEqual(expect.arrayContaining(["Home", "Search", "Chemicals & SDS"]));
    expect(titles).not.toContain("Environmental Inspections");
  });

  it("finds create/start commands by synonyms", () => {
    const matches = filterCommandIntents(getCommandIntents(), "follow up");

    expect(matches[0]).toMatchObject({
      title: "Add corrective action",
      href: "/actions/corrective-actions/new",
    });
  });
});
