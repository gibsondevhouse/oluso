import { describe, expect, it } from "vitest";
import type { PersistedDatabase } from "$lib/persistence/local-persistence";
import {
  buildDatabaseBackup,
  createBackupFileName,
  parseBackupJson,
  readBackupFile,
} from "./backup";

const database = {
  schemaVersion: 10,
  locations: [],
  findings: [],
  processes: [],
  equipment: [],
  chemicals: [],
  hazards: [],
  controls: [],
  riskAssessments: [],
  segs: [],
  correctiveActions: [],
  initializedAt: "2026-07-11T12:00:00.000Z",
  updatedAt: "2026-07-11T12:00:00.000Z",
} as unknown as PersistedDatabase;

describe("database backup helpers", () => {
  it("builds a timestamped JSON download", () => {
    const createdAt = new Date(2026, 6, 11, 14, 5, 9);
    const backup = buildDatabaseBackup(database, createdAt);

    expect(createBackupFileName(createdAt)).toBe("oluso-backup-20260711-140509.json");
    expect(backup).toMatchObject({
      fileName: "oluso-backup-20260711-140509.json",
      mimeType: "application/json",
    });
    expect(JSON.parse(backup.content)).toEqual(database);
    expect(backup.href).toMatch(/^data:application\/json;charset=utf-8,/);
  });

  it("parses object backups and rejects invalid JSON payloads", () => {
    expect(parseBackupJson('{"schemaVersion":10}')).toEqual({ schemaVersion: 10 });
    expect(() => parseBackupJson("not-json")).toThrow(
      "The selected backup file does not contain valid JSON.",
    );
    expect(() => parseBackupJson("[]")).toThrow(
      "The selected backup file must contain a database object.",
    );
  });

  it("reads and parses an uploaded backup file", async () => {
    const file = new File(['{"schemaVersion":10}'], "backup.json", {
      type: "application/json",
    });

    await expect(readBackupFile(file)).resolves.toEqual({ schemaVersion: 10 });
  });
});
