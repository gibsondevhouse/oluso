import { AdamaDatabaseError } from "../database/errors";
import { requestToPromise, transactionToPromise } from "../database/idb-utils";
import { MUTABLE_RECORD_STORE_NAMES } from "../database/schema";
import type { DatasetMetadata, RecordEnvelope, RecordRevision } from "../database/types";

export interface IntegrityFinding {
  code:
    | "IDENTITY_MISSING"
    | "INVALID_RECORD_ENVELOPE"
    | "REVISION_MISSING"
    | "REVISION_STATE_MISMATCH";
  storeName: string;
  recordId: string;
  message: string;
}

export interface DatabaseIntegrityReport {
  status: "healthy" | "corrupt";
  checkedAt: string;
  datasetId: string | null;
  datasetRevision: number | null;
  currentRecordCount: number;
  revisionCount: number;
  findings: IntegrityFinding[];
}

function isRecordEnvelope(value: unknown): value is RecordEnvelope {
  if (!value || typeof value !== "object") return false;
  const record = value as Partial<RecordEnvelope>;
  return (
    typeof record.id === "string" &&
    typeof record.businessId === "string" &&
    Number.isInteger(record.revision) &&
    Number(record.revision) >= 1 &&
    typeof record.createdAt === "string" &&
    typeof record.updatedAt === "string" &&
    typeof record.createdBy === "string" &&
    typeof record.updatedBy === "string" &&
    typeof record.originInstallationId === "string" &&
    (record.lifecycleStatus === "active" || record.lifecycleStatus === "archived")
  );
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, entry]) => entry !== undefined)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableValue(entry)]),
    );
  }
  return value;
}

function equivalent(left: unknown, right: unknown) {
  return JSON.stringify(stableValue(left)) === JSON.stringify(stableValue(right));
}

export async function inspectDatabaseIntegrity(
  database: IDBDatabase,
  now: () => Date = () => new Date(),
): Promise<DatabaseIntegrityReport> {
  const storeNames = [
    "dataset_metadata" as const,
    "record_revisions" as const,
    ...MUTABLE_RECORD_STORE_NAMES,
  ];
  const transaction = database.transaction(storeNames, "readonly");
  const completion = transactionToPromise(transaction);
  const datasetPromise = requestToPromise<DatasetMetadata | undefined>(
    transaction.objectStore("dataset_metadata").get("current"),
  );
  const revisionsPromise = requestToPromise<RecordRevision[]>(
    transaction.objectStore("record_revisions").getAll(),
  );
  const recordPromises = MUTABLE_RECORD_STORE_NAMES.map(async (storeName) => [
    storeName,
    await requestToPromise<unknown[]>(transaction.objectStore(storeName).getAll()),
  ] as const);
  const [dataset, revisions, storeEntries] = await Promise.all([
    datasetPromise,
    revisionsPromise,
    Promise.all(recordPromises),
  ]);
  await completion;

  const findings: IntegrityFinding[] = [];
  if (!dataset) {
    findings.push({
      code: "IDENTITY_MISSING",
      storeName: "dataset_metadata",
      recordId: "current",
      message: "Dataset identity is missing.",
    });
  }
  const revisionsByRecord = new Map<string, RecordRevision[]>();
  for (const revision of revisions) {
    const key = revision.recordId;
    const group = revisionsByRecord.get(key) ?? [];
    group.push(revision);
    revisionsByRecord.set(key, group);
  }

  let currentRecordCount = 0;
  for (const [storeName, storeRecords] of storeEntries) {
    for (const value of storeRecords) {
      currentRecordCount += 1;
      if (!isRecordEnvelope(value)) {
        const id = value && typeof value === "object" ? String((value as { id?: unknown }).id ?? "unknown") : "unknown";
        findings.push({
          code: "INVALID_RECORD_ENVELOPE",
          storeName,
          recordId: id,
          message: `${storeName} record ${id} has invalid lifecycle or revision metadata.`,
        });
        continue;
      }
      const key = value.id;
      const recordRevisions = (revisionsByRecord.get(key) ?? []).sort(
        (left, right) => left.revision - right.revision,
      );
      const latest = recordRevisions.at(-1);
      if (!latest || latest.revision !== value.revision) {
        findings.push({
          code: "REVISION_MISSING",
          storeName,
          recordId: value.id,
          message: `${storeName} record ${value.id} has no matching immutable revision ${value.revision}.`,
        });
      } else if (!equivalent(latest.after, value)) {
        findings.push({
          code: "REVISION_STATE_MISMATCH",
          storeName,
          recordId: value.id,
          message: `${storeName} record ${value.id} differs from its immutable revision ${value.revision}.`,
        });
      }
    }
  }

  return {
    status: findings.length === 0 ? "healthy" : "corrupt",
    checkedAt: now().toISOString(),
    datasetId: dataset?.datasetId ?? null,
    datasetRevision: dataset?.datasetRevision ?? null,
    currentRecordCount,
    revisionCount: revisions.length,
    findings,
  };
}

export async function assertDatabaseIntegrity(database: IDBDatabase) {
  const report = await inspectDatabaseIntegrity(database);
  if (report.status === "corrupt") {
    throw new AdamaDatabaseError(
      `Database integrity check found ${report.findings.length} problem(s).`,
      "DATABASE_INTEGRITY_FAILED",
      report,
    );
  }
  return report;
}
