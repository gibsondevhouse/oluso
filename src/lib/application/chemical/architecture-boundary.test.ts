import { describe, expect, it } from "vitest";

const PROHIBITED = [
  "$lib/persistence/local-persistence",
  "$lib/persistence/campaign-register.types",
  "oluso-application",
  "@tauri-apps",
  "invoke(",
  "src-tauri",
];

describe("typed Chemical architecture boundary", () => {
  it("does not import or invoke legacy persistence, generic campaigns, or Tauri", () => {
    const modules = import.meta.glob(
      [
        "/src/lib/domain/chemical/**/*.{ts,svelte}",
        "/src/lib/application/chemical/**/*.{ts,svelte}",
        "/src/lib/data/repositories/chemical/**/*.{ts,svelte}",
        "/src/lib/pages/chemical/ChemicalMasterDataPage.svelte",
      ],
      { query: "?raw", import: "default", eager: true },
    ) as Record<string, string>;
    const violations = Object.entries(modules)
      .filter(([file]) => !file.endsWith("architecture-boundary.test.ts"))
      .flatMap(([file, contents]) => {
      return PROHIBITED.filter((token) => contents.includes(token)).map((token) => `${file}: ${token}`);
    });
    expect(violations).toEqual([]);
  });
});
