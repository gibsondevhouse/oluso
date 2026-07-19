import { describe, expect, it } from "vitest";
import { calculateBackupStatus } from "./backup-status";

describe("backup status", () => {
  it("uses both elapsed time and dataset revision delta", () => {
    expect(calculateBackupStatus({ datasetRevision: 5 })).toMatchObject({ status: "never" });
    expect(
      calculateBackupStatus({
        datasetRevision: 20,
        lastBackupRevision: 0,
        lastBackupAt: "2026-07-17T00:00:00.000Z",
        now: new Date("2026-07-18T00:00:00.000Z"),
        maxRevisionDelta: 20,
      }),
    ).toMatchObject({ status: "due", revisionsSinceBackup: 20 });
    expect(
      calculateBackupStatus({
        datasetRevision: 1,
        lastBackupRevision: 1,
        lastBackupAt: "2026-07-01T00:00:00.000Z",
        now: new Date("2026-07-18T00:00:00.000Z"),
        maxAgeDays: 7,
      }),
    ).toMatchObject({ status: "overdue", revisionsSinceBackup: 0 });
  });
});
