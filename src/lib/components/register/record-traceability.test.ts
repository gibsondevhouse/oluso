import { describe, expect, it } from "vitest";
import {
  getRecordActivity,
  getRecordEvidenceState,
  getRecordOwner,
  getRecordSource,
  type TraceableRecord,
} from "./record-traceability";

const base: TraceableRecord = {
  id: "record-1",
  createdAt: "2026-07-10T10:00:00.000Z",
  updatedAt: "2026-07-11T10:00:00.000Z",
  lifecycleStatus: "active",
  archivedAt: null,
  archivedReason: null,
};

describe("record traceability", () => {
  it("derives owner, source, and evidence state from common register fields", () => {
    const record = {
      ...base,
      owner: "HSE Lead",
      requirementSource: "Permit AP-12",
      evidenceRequired: true,
      evidenceReference: "Evidence E-14",
    };

    expect(getRecordOwner(record)).toBe("HSE Lead");
    expect(getRecordSource(record)).toBe("Permit AP-12");
    expect(getRecordEvidenceState(record)).toMatchObject({ label: "Referenced", reference: "Evidence E-14" });
  });

  it("shows missing required evidence and lifecycle activity", () => {
    const record = {
      ...base,
      lifecycleStatus: "archived" as const,
      evidenceRequired: true,
      archivedAt: "2026-07-12T10:00:00.000Z",
      archivedReason: "Superseded",
    };

    expect(getRecordEvidenceState(record).label).toBe("Missing required evidence");
    expect(getRecordActivity(record).map((item) => item.label)).toEqual(["Archived", "Updated", "Created"]);
  });
});
