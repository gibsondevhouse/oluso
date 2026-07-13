import { describe, expect, it } from "vitest";
import type { PersistedRegisterRecord } from "$lib/persistence/local-persistence";
import { applyExportPreset, buildAuditPackage, recordHasEvidenceGap, recordIsOverdue } from "./review-package";

const records = [
  { id: "open", title: "Needs evidence", status: "Active", evidenceRequired: true, evidenceReference: "", dueDate: "2026-07-01", createdAt: "2026-01-01", updatedAt: "2026-07-01", lifecycleStatus: "active", archivedAt: null, archivedReason: null },
  { id: "done", title: "Complete", status: "Complete", evidenceRequired: true, evidenceReference: "EV-1", dueDate: "2026-06-01", createdAt: "2026-01-01", updatedAt: "2026-07-01", lifecycleStatus: "active", archivedAt: null, archivedReason: null },
] as unknown as PersistedRegisterRecord[];

describe("review package utilities", () => {
  it("identifies evidence and due-date review gaps", () => {
    expect(recordHasEvidenceGap(records[0])).toBe(true);
    expect(recordIsOverdue(records[0], new Date("2026-07-12T00:00:00Z"))).toBe(true);
    expect(recordIsOverdue(records[1], new Date("2026-07-12T00:00:00Z"))).toBe(false);
    expect(applyExportPreset(records, "review-ready", new Date("2026-07-12T00:00:00Z"))).toEqual([records[0]]);
  });

  it("builds a source-labelled JSON and printable HTML package", () => {
    const registers = [{ collection: "complianceItems" as const, label: "Compliance Support", records }];
    const generatedAt = new Date("2026-07-12T12:00:00Z");
    const json = buildAuditPackage(registers, "json", generatedAt);
    const html = buildAuditPackage(registers, "html", generatedAt);

    expect(JSON.parse(json.content).manifest).toMatchObject({ recordCount: 2, evidenceGapCount: 1 });
    expect(html.content).toContain("point-in-time projection of source register records");
    expect(html.content).toContain("Print or save as PDF");
    expect(html.fileName).toContain("review-support-package");
  });
});
