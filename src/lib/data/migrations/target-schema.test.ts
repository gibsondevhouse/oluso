import { describe, expect, it } from "vitest";
import { ADAMA_DATABASE_VERSION } from "../database/schema";
import { TARGET_SCHEMA_MIGRATIONS } from "./target-schema";

describe("target schema migration registry", () => {
  it("contains one ordered immutable step for every released target version", () => {
    expect(TARGET_SCHEMA_MIGRATIONS.map((migration) => migration.version)).toEqual(
      Array.from({ length: ADAMA_DATABASE_VERSION }, (_, index) => index + 1),
    );
    expect(
      TARGET_SCHEMA_MIGRATIONS.every(
        (migration) => migration.description.trim() && typeof migration.apply === "function",
      ),
    ).toBe(true);
  });
});
