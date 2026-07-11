import { describe, expect, it } from "vitest";
import type { PersistedRegisterRecord } from "$lib/persistence/local-persistence";
import {
  buildRegisterExport,
  createDataDownloadUrl,
  getExportRegisterDefinition,
  recordsToCsv,
  recordsToJson,
} from "./register-export";

describe("register export utilities", () => {
  it("formats register records as escaped CSV with lifecycle columns", () => {
    const definition = getExportRegisterDefinition("locations");
    const records = [
      {
        id: "loc-1",
        name: "Main, Facility",
        type: "Facility",
        description: 'Contains "quoted" text',
        status: "active",
        createdAt: "2026-07-11T00:00:00.000Z",
        updatedAt: "2026-07-11T00:00:00.000Z",
        lifecycleStatus: "active",
        archivedAt: null,
        archivedReason: null,
      },
    ] as PersistedRegisterRecord[];

    const csv = recordsToCsv(records, definition);

    expect(csv).toContain("id,name,type,description,status,createdAt,updatedAt,lifecycleStatus");
    expect(csv).toContain('"Main, Facility"');
    expect(csv).toContain('"Contains ""quoted"" text"');
    expect(csv).toContain("active");
  });

  it("formats register records as a JSON array", () => {
    const records = [
      {
        id: "finding-1",
        title: "Open finding",
        type: "Inspection Finding",
        description: "",
        locationId: "loc-1",
        processId: "",
        hazardId: "",
        severity: "High",
        status: "Open",
        reportedBy: "HSE",
        createdAt: "2026-07-11T00:00:00.000Z",
        updatedAt: "2026-07-11T00:00:00.000Z",
        lifecycleStatus: "archived",
        archivedAt: "2026-07-11T01:00:00.000Z",
        archivedReason: "test archive",
      },
    ] as PersistedRegisterRecord[];

    expect(JSON.parse(recordsToJson(records))).toEqual(records);
  });

  it("builds downloadable export file metadata", () => {
    const definition = getExportRegisterDefinition("locations");
    const file = buildRegisterExport({
      definition,
      records: [],
      format: "json",
      lifecycleScope: "all",
      generatedAt: new Date("2026-07-11T01:02:03.000Z"),
    });

    expect(file).toMatchObject({
      extension: "json",
      fileName: "oluso-locations-all-2026-07-11T010203Z.json",
      mimeType: "application/json",
      recordCount: 0,
    });
    expect(createDataDownloadUrl(file)).toBe("data:application/json;charset=utf-8,%5B%5D");
  });

  it.each([
    {
      collection: "exposureMonitoring" as const,
      label: "Exposure Monitoring",
      filenameStem: "exposure-monitoring",
      expectedColumns: ["sampleReference", "segId", "samplingDate", "result", "status"],
    },
    {
      collection: "incidents" as const,
      label: "Incidents & Near Misses",
      filenameStem: "incidents",
      expectedColumns: ["title", "type", "occurredAt", "reportingStatus", "status"],
    },
    {
      collection: "complianceItems" as const,
      label: "Compliance Support",
      filenameStem: "compliance-items",
      expectedColumns: ["itemType", "title", "dueDate", "reviewStatus", "evidenceReference"],
    },
  ])("exports the $label register", ({ collection, label, filenameStem, expectedColumns }) => {
    const definition = getExportRegisterDefinition(collection);

    expect(definition).toMatchObject({ collection, label, filenameStem });
    expect(definition.columns).toEqual(
      expect.arrayContaining([
        "id",
        ...expectedColumns,
        "createdAt",
        "updatedAt",
        "lifecycleStatus",
        "archivedAt",
        "archivedReason",
      ]),
    );
  });
});
