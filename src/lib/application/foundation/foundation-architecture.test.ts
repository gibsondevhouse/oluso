import { describe, expect, it } from "vitest";
import { CAMPAIGN_REGISTER_DEFINITIONS } from "$lib/persistence/campaign-register.types";
import { isFoundationRouteKind } from "$lib/navigation/route-registry";

const sourceByFile = import.meta.glob(
  [
    "/src/lib/domain/foundation/**/*.ts",
    "/src/lib/application/foundation/**/*.ts",
    "/src/lib/data/repositories/foundation/**/*.ts",
    "/src/lib/components/foundation/**/*.{ts,svelte}",
    "/src/lib/pages/FoundationCrudPage.svelte",
  ],
  { eager: true, query: "?raw", import: "default" },
) as Record<string, string>;
const forbiddenImports = [
  "$lib/persistence/local-persistence",
  "$lib/persistence/campaign-register.types",
  "application/oluso-application",
  "register-repository-adapter",
  "@tauri-apps",
];

describe("foundation architecture boundary", () => {
  it("prohibits legacy persistence, campaign adapters, and Tauri imports from typed foundation code", () => {
    const violations = Object.entries(sourceByFile)
      .filter(([file]) => !file.endsWith(".test.ts"))
      .flatMap(([file, source]) => {
        return forbiddenImports
          .filter((specifier) => source.includes(specifier))
          .map((specifier) => `${file}: ${specifier}`);
      });
    expect(violations).toEqual([]);
  });

  it("does not accept untyped unknown-record commands in the domain or application layer", () => {
    const violations = Object.entries(sourceByFile)
      .filter(([file]) => file.includes("/domain/foundation/") || file.includes("/application/foundation/"))
      .filter(([file]) => !file.endsWith(".test.ts"))
      .filter(([, source]) => source.includes("Record<string, unknown>"))
      .map(([file]) => file);
    expect(violations).toEqual([]);
  });

  it("keeps migrated entities out of generic campaign definitions and marks their routes as typed", () => {
    const migratedKinds = ["organizations", "people", "locations", "processes", "tasks"];
    expect(CAMPAIGN_REGISTER_DEFINITIONS.map((definition) => definition.kind)).not.toEqual(
      expect.arrayContaining(migratedKinds),
    );
    expect(migratedKinds.every((kind) => isFoundationRouteKind(kind as never))).toBe(true);
  });
});
