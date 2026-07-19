import { AdamaDatabaseError } from "../database/errors";
import { requestToPromise, transactionToPromise } from "../database/idb-utils";
import type { DatasetMetadata } from "../database/types";
import { calculateBackupStatus, type BackupStatus, type BackupStatusInput } from "./backup-status";
import { validateDatabaseBackup, type AdamaBackupArtifact } from "./backup-service";

export interface VerifiedBackupManifest {
  id: string;
  status: "verified";
  datasetId: string;
  datasetRevision: number;
  artifactCreatedAt: string;
  verifiedAt: string;
  integrityHash: string;
}

export async function recordVerifiedBackup(
  database: IDBDatabase,
  artifactValue: unknown,
  now: () => Date = () => new Date(),
): Promise<VerifiedBackupManifest> {
  const artifact = await validateDatabaseBackup(artifactValue);
  const transaction = database.transaction(
    ["dataset_metadata", "backup_manifests"],
    "readwrite",
  );
  const completion = transactionToPromise(transaction);
  const dataset = await requestToPromise<DatasetMetadata | undefined>(
    transaction.objectStore("dataset_metadata").get("current"),
  );
  if (!dataset || dataset.datasetId !== artifact.datasetId) {
    transaction.abort();
    try {
      await completion;
    } catch {
      // Preserve the semantic error below.
    }
    throw new AdamaDatabaseError(
      "The verified backup belongs to a different dataset.",
      "BACKUP_DATASET_MISMATCH",
    );
  }
  if (artifact.datasetRevision > dataset.datasetRevision) {
    transaction.abort();
    try {
      await completion;
    } catch {
      // Preserve the semantic error below.
    }
    throw new AdamaDatabaseError(
      "The backup revision is newer than the current dataset.",
      "BACKUP_REVISION_MISMATCH",
    );
  }
  const manifest: VerifiedBackupManifest = {
    id: artifact.integrityHash,
    status: "verified",
    datasetId: artifact.datasetId,
    datasetRevision: artifact.datasetRevision,
    artifactCreatedAt: artifact.createdAt,
    verifiedAt: now().toISOString(),
    integrityHash: artifact.integrityHash,
  };
  await requestToPromise(transaction.objectStore("backup_manifests").put(manifest));
  await completion;
  return manifest;
}

export async function getBackupStatus(
  database: IDBDatabase,
  options: Pick<BackupStatusInput, "now" | "maxAgeDays" | "maxRevisionDelta"> = {},
): Promise<BackupStatus> {
  const transaction = database.transaction(
    ["dataset_metadata", "backup_manifests"],
    "readonly",
  );
  const completion = transactionToPromise(transaction);
  const [dataset, manifests] = await Promise.all([
    requestToPromise<DatasetMetadata | undefined>(
      transaction.objectStore("dataset_metadata").get("current"),
    ),
    requestToPromise<VerifiedBackupManifest[]>(
      transaction.objectStore("backup_manifests").getAll(),
    ),
  ]);
  await completion;
  if (!dataset) {
    throw new AdamaDatabaseError("Dataset identity is missing.", "IDENTITY_MISSING");
  }
  const latest = manifests
    .filter((manifest) => manifest.status === "verified" && manifest.datasetId === dataset.datasetId)
    .sort((left, right) => right.verifiedAt.localeCompare(left.verifiedAt))[0];
  return calculateBackupStatus({
    datasetRevision: dataset.datasetRevision,
    lastBackupRevision: latest?.datasetRevision,
    lastBackupAt: latest?.verifiedAt,
    ...options,
  });
}

export function isBackupArtifact(value: unknown): value is AdamaBackupArtifact {
  return value !== null && typeof value === "object" && "integrityHash" in value;
}
