import { describe, expect, it } from "vitest";
import type { RecordRevision } from "$lib/data/database";
import type { PersistedRegisterRecord } from "$lib/persistence/local-persistence";
import {
  activityItemFromRevision,
  buildActivityFeedReadModel,
  limitedActivityFromLegacyRecord,
} from "./activity-query-service";

describe("activity query service", () => {
  it("maps immutable revisions to traceable activity rows", () => {
    const revision: RecordRevision = {
      id: "rev-location-1",
      recordType: "Location",
      recordId: "loc-1",
      revision: 2,
      operation: "update",
      changedAt: "2026-07-20T13:00:00.000Z",
      changedBy: "user-1",
      changedInstallationId: "install-1",
      source: "local",
      after: {
        id: "loc-1",
        name: "Tifton Campus",
        businessId: "LOC-001",
        resolvedSiteId: "site-1",
      },
    };

    expect(activityItemFromRevision(revision)).toMatchObject({
      eventType: "Updated",
      recordType: "Location",
      recordTitle: "Tifton Campus",
      href: "/operations/locations/loc-1",
      sourceRevisionId: "rev-location-1",
      sourceState: "current",
      sourceLabel: "Immutable record revision",
    });
  });

  it("labels legacy metadata as limited history rather than audit history", () => {
    const item = limitedActivityFromLegacyRecord(
      {
        id: "finding-1",
        title: "Open guardrail finding",
        createdAt: "2026-07-18T12:00:00.000Z",
        updatedAt: "2026-07-19T12:00:00.000Z",
      } as PersistedRegisterRecord,
      {
        recordType: "Finding",
        recordLabel: "Finding",
        href: (record) => `/field/findings/${record.id}`,
        title: (record) => String((record as Record<string, unknown>).title),
      },
    );

    expect(item).toMatchObject({
      sourceState: "limited-history",
      sourceLabel: "Limited legacy history",
      sourceRevisionId: "No governed revision retained",
      href: "/field/findings/finding-1",
    });
  });

  it("sorts revision and limited-history rows by timestamp with stable tie breaking", () => {
    const revision: RecordRevision = {
      id: "rev-process-1",
      recordType: "Process",
      recordId: "process-1",
      revision: 1,
      operation: "create",
      changedAt: "2026-07-18T12:00:00.000Z",
      changedBy: "user-1",
      changedInstallationId: "install-1",
      source: "local",
      after: { id: "process-1", name: "Packaging", businessId: "PRO-001" },
    };
    const limited = limitedActivityFromLegacyRecord(
      {
        id: "action-1",
        title: "Clear aisle",
        createdAt: "2026-07-19T12:00:00.000Z",
        updatedAt: "2026-07-19T12:00:00.000Z",
      } as PersistedRegisterRecord,
      {
        recordType: "CorrectiveAction",
        recordLabel: "Corrective Action",
        href: (record) => `/actions/corrective-actions/${record.id}`,
        title: (record) => String((record as Record<string, unknown>).title),
      },
    );

    const model = buildActivityFeedReadModel([revision], [limited]);

    expect(model.items[0]).toMatchObject({ recordTitle: "Clear aisle" });
    expect(model.sourceSummary).toBe("1 revision-sourced events; 1 limited-history metadata rows.");
  });
});
