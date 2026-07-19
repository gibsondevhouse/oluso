import { describe, expect, it } from "vitest";

const modules = import.meta.glob(
  [
    "/src/lib/domain/enterprise/**/*.{ts,svelte}",
    "/src/lib/domain/location/**/*.{ts,svelte}",
    "/src/lib/domain/operations/**/*.{ts,svelte}",
    "/src/lib/data/repositories/enterprise/**/*.{ts,svelte}",
    "/src/lib/data/repositories/location/**/*.{ts,svelte}",
    "/src/lib/data/repositories/operations/**/*.{ts,svelte}",
    "/src/lib/application/enterprise/**/*.{ts,svelte}",
    "/src/lib/application/location/**/*.{ts,svelte}",
    "/src/lib/application/operations/**/*.{ts,svelte}",
  ],
  { query: "?raw", import: "default", eager: true },
) as Record<string, string>;

const prohibited = [
  "$lib/persistence/local-persistence",
  "$lib/persistence/campaign-register.types",
  "application/oluso-application",
  "@tauri-apps",
  "invoke(",
  "src-tauri",
  "localStorage",
];

describe("typed enterprise, Location, and operations architecture boundary", () => {
  it("does not depend on legacy persistence, generic campaigns, Tauri, Rust commands, or raw localStorage", () => {
    const violations = Object.entries(modules)
      .filter(([file]) => !file.endsWith("enterprise-location-architecture.test.ts"))
      .flatMap(([file, contents]) =>
        prohibited
          .filter((token) => contents.includes(token))
          .map((token) => `${file}: ${token}`),
      );

    expect(violations).toEqual([]);
  });
});
