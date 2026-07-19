import { describe, expect, it } from "vitest";
import browserV14 from "./__fixtures__/browser-v14.json";
import nativeV10 from "./__fixtures__/native-v10.json";
import { LEGACY_COLLECTION_MAPPING } from "./legacy-mapping";
import {
  detectLegacySource,
  SUPPORTED_BROWSER_SCHEMA_VERSIONS,
  SUPPORTED_NATIVE_SCHEMA_VERSIONS,
} from "./legacy-source";

function clone<T>(value: T): T {
  return structuredClone(value);
}

describe("legacy source detection", () => {
  it.each(SUPPORTED_BROWSER_SCHEMA_VERSIONS)(
    "recognizes browser schema version %i",
    (schemaVersion) => {
      const fixture = clone(browserV14) as Record<string, unknown>;
      fixture.schemaVersion = schemaVersion;

      const detected = detectLegacySource(fixture);

      expect(detected.kind).toBe("browser-local-storage");
      expect(detected.schemaVersion).toBe(schemaVersion);
    },
  );

  it.each(SUPPORTED_NATIVE_SCHEMA_VERSIONS)(
    "recognizes native schema version %i",
    (schemaVersion) => {
      const fixture = clone(nativeV10) as {
        database: Record<string, unknown>;
      };
      fixture.database.schemaVersion = schemaVersion;

      const detected = detectLegacySource(fixture);

      expect(detected.kind).toBe("tauri-sqlite");
      expect(detected.schemaVersion).toBe(schemaVersion);
    },
  );

  it("fingerprints the field-level v13/v14 location and campaign variants", () => {
    const detected = detectLegacySource(browserV14);

    expect(detected.fingerprint.locationHasParent).toBe(true);
    expect(detected.fingerprint.locationHasGeography).toBe(true);
    expect(detected.fingerprint.hasCampaignCollections).toBe(true);
  });

  it("assigns every fixture collection an explicit migration disposition", () => {
    const browser = detectLegacySource(browserV14);
    const native = detectLegacySource(nativeV10);
    const sourceCollections = new Set([
      ...browser.fingerprint.collections,
      ...native.fingerprint.collections,
    ]);

    expect([...sourceCollections].filter((name) => !LEGACY_COLLECTION_MAPPING[name])).toEqual([]);
  });

  it("rejects unsupported and malformed sources", () => {
    expect(() => detectLegacySource({ schemaVersion: 15, locations: [] })).toThrow(
      "Unsupported browser-local-storage schema version 15",
    );
    expect(() => detectLegacySource({ locations: [] })).toThrow("integer schemaVersion");
    expect(() => detectLegacySource([])).toThrow("JSON object");
  });
});
