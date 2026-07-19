import { AdamaDatabaseError } from "../database/errors";

export const SUPPORTED_BROWSER_SCHEMA_VERSIONS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14,
] as const;
export const SUPPORTED_NATIVE_SCHEMA_VERSIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export type LegacySourceKind = "browser-local-storage" | "tauri-sqlite";

export interface DetectedLegacySource {
  kind: LegacySourceKind;
  schemaVersion: number;
  database: Record<string, unknown>;
  diagnostics?: Record<string, unknown>;
  fingerprint: {
    collections: string[];
    locationHasParent: boolean;
    locationHasGeography: boolean;
    hasCampaignCollections: boolean;
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function assertSupportedVersion(kind: LegacySourceKind, schemaVersion: number) {
  const supported =
    kind === "browser-local-storage"
      ? (SUPPORTED_BROWSER_SCHEMA_VERSIONS as readonly number[])
      : (SUPPORTED_NATIVE_SCHEMA_VERSIONS as readonly number[]);
  if (!supported.includes(schemaVersion)) {
    throw new AdamaDatabaseError(
      `Unsupported ${kind} schema version ${schemaVersion}.`,
      "UNSUPPORTED_LEGACY_SCHEMA",
    );
  }
}

export function detectLegacySource(value: unknown): DetectedLegacySource {
  if (!isRecord(value)) {
    throw new AdamaDatabaseError("Legacy source must contain a JSON object.", "INVALID_LEGACY_SOURCE");
  }

  const nativeDatabase = isRecord(value.database) ? value.database : null;
  const diagnostics = isRecord(value.diagnostics) ? value.diagnostics : undefined;
  const kind: LegacySourceKind =
    nativeDatabase && diagnostics?.backend === "sqlite"
      ? "tauri-sqlite"
      : "browser-local-storage";
  const database = nativeDatabase ?? value;
  const schemaVersion = database.schemaVersion;
  if (!Number.isInteger(schemaVersion)) {
    throw new AdamaDatabaseError(
      "Legacy source does not contain an integer schemaVersion.",
      "INVALID_LEGACY_SOURCE",
    );
  }
  assertSupportedVersion(kind, schemaVersion as number);

  const collections = Object.entries(database)
    .filter(([, entry]) => Array.isArray(entry))
    .map(([name]) => name)
    .sort();
  const locations = Array.isArray(database.locations) ? database.locations : [];
  const locationRecords = locations.filter(isRecord);

  return {
    kind,
    schemaVersion: schemaVersion as number,
    database,
    diagnostics,
    fingerprint: {
      collections,
      locationHasParent: locationRecords.some((record) => "parentLocationId" in record),
      locationHasGeography: locationRecords.some(
        (record) => "country" in record || "stateProvince" in record,
      ),
      hasCampaignCollections: collections.some((name) =>
        ["organizations", "people", "exposureAgents", "migrationBundles"].includes(name),
      ),
    },
  };
}
