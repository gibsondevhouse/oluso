import { AdamaDatabaseError, translateIndexedDbError } from "../database/errors";
import { abortTransaction, requestToPromise, transactionToPromise } from "../database/idb-utils";
import { ADAMA_DATABASE_VERSION, ADAMA_STORE_NAMES, type AdamaStoreName } from "../database/schema";
import type { DatasetMetadata, InstallationMetadata, LocalUserProfile } from "../database/types";

export const BACKUP_ARTIFACT_TYPE = "adama-hse-backup";
export const BACKUP_ARTIFACT_VERSION = 1;

export interface AdamaBackupPayload {
  artifactType: typeof BACKUP_ARTIFACT_TYPE;
  artifactVersion: typeof BACKUP_ARTIFACT_VERSION;
  schemaVersion: number;
  createdAt: string;
  datasetId: string;
  datasetRevision: number;
  installationId: string;
  storeCounts: Record<AdamaStoreName, number>;
  stores: Record<AdamaStoreName, unknown[]>;
}

export interface AdamaBackupArtifact extends AdamaBackupPayload {
  integrityHash: string;
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, entry]) => [key, stableValue(entry)]),
    );
  }
  return value;
}

export function canonicalStringify(value: unknown) {
  return JSON.stringify(stableValue(value));
}

export async function sha256Hex(value: string) {
  if (!globalThis.crypto?.subtle) {
    throw new AdamaDatabaseError(
      "This browser cannot calculate the required backup integrity hash.",
      "CRYPTO_UNAVAILABLE",
    );
  }
  const digest = await globalThis.crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function readAllStores(database: IDBDatabase) {
  const transaction = database.transaction([...ADAMA_STORE_NAMES], "readonly");
  const completion = transactionToPromise(transaction);
  const entries = ADAMA_STORE_NAMES.map(
    (storeName) =>
      [storeName, requestToPromise<unknown[]>(transaction.objectStore(storeName).getAll())] as const,
  );
  const resolved = await Promise.all(
    entries.map(async ([storeName, records]) => [storeName, await records] as const),
  );
  await completion;
  return Object.fromEntries(resolved) as Record<AdamaStoreName, unknown[]>;
}

export async function exportDatabaseBackup(
  database: IDBDatabase,
  now: () => Date = () => new Date(),
): Promise<AdamaBackupArtifact> {
  const stores = await readAllStores(database);
  const dataset = stores.dataset_metadata.find(
    (entry) => (entry as DatasetMetadata).id === "current",
  ) as DatasetMetadata | undefined;
  const installation = stores.installation_metadata.find(
    (entry) => (entry as InstallationMetadata).id === "current",
  ) as InstallationMetadata | undefined;
  if (!dataset || !installation) {
    throw new AdamaDatabaseError(
      "Database identity is missing; a complete backup cannot be created.",
      "IDENTITY_MISSING",
    );
  }

  const storeCounts = Object.fromEntries(
    ADAMA_STORE_NAMES.map((storeName) => [storeName, stores[storeName].length]),
  ) as Record<AdamaStoreName, number>;
  const payload: AdamaBackupPayload = {
    artifactType: BACKUP_ARTIFACT_TYPE,
    artifactVersion: BACKUP_ARTIFACT_VERSION,
    schemaVersion: ADAMA_DATABASE_VERSION,
    createdAt: now().toISOString(),
    datasetId: dataset.datasetId,
    datasetRevision: dataset.datasetRevision,
    installationId: installation.installationId,
    storeCounts,
    stores,
  };
  return { ...payload, integrityHash: await sha256Hex(canonicalStringify(payload)) };
}

function assertBackupShape(value: unknown): asserts value is AdamaBackupArtifact {
  if (!value || typeof value !== "object") {
    throw new AdamaDatabaseError("Backup file must contain an object.", "INVALID_BACKUP");
  }
  const backup = value as Partial<AdamaBackupArtifact>;
  if (
    backup.artifactType !== BACKUP_ARTIFACT_TYPE ||
    backup.artifactVersion !== BACKUP_ARTIFACT_VERSION ||
    backup.schemaVersion !== ADAMA_DATABASE_VERSION ||
    typeof backup.integrityHash !== "string" ||
    !backup.stores ||
    !backup.storeCounts
  ) {
    throw new AdamaDatabaseError(
      "Backup type, version, schema, or manifest is not supported.",
      "INVALID_BACKUP",
    );
  }
  for (const storeName of ADAMA_STORE_NAMES) {
    if (!Array.isArray(backup.stores[storeName])) {
      throw new AdamaDatabaseError(`Backup store ${storeName} is missing.`, "INVALID_BACKUP");
    }
    if (backup.storeCounts[storeName] !== backup.stores[storeName].length) {
      throw new AdamaDatabaseError(
        `Backup store ${storeName} does not match its manifest count.`,
        "INVALID_BACKUP",
      );
    }
  }
}

export async function validateDatabaseBackup(value: unknown): Promise<AdamaBackupArtifact> {
  assertBackupShape(value);
  const { integrityHash, ...payload } = value;
  const calculated = await sha256Hex(canonicalStringify(payload));
  if (calculated !== integrityHash) {
    throw new AdamaDatabaseError(
      "Backup integrity validation failed; no data was changed.",
      "BACKUP_INTEGRITY_FAILED",
    );
  }
  return value;
}

export async function restoreDatabaseBackup(database: IDBDatabase, value: unknown) {
  const backup = await validateDatabaseBackup(value);
  const identityTransaction = database.transaction(
    ["installation_metadata", "local_users"],
    "readonly",
  );
  const identityCompletion = transactionToPromise(identityTransaction);
  const localInstallation = await requestToPromise<InstallationMetadata | undefined>(
    identityTransaction.objectStore("installation_metadata").get("current"),
  );
  const localUsers = await requestToPromise<LocalUserProfile[]>(
    identityTransaction.objectStore("local_users").getAll(),
  );
  await identityCompletion;

  const transaction = database.transaction([...ADAMA_STORE_NAMES], "readwrite");
  const completion = transactionToPromise(transaction);

  try {
    for (const storeName of ADAMA_STORE_NAMES) {
      const store = transaction.objectStore(storeName);
      await requestToPromise(store.clear());
      let records = backup.stores[storeName];
      if (storeName === "installation_metadata" && localInstallation) {
        records = [localInstallation];
      } else if (storeName === "local_users") {
        const merged = new Map<string, unknown>();
        for (const user of backup.stores.local_users as LocalUserProfile[]) merged.set(user.id, user);
        for (const user of localUsers) merged.set(user.id, user);
        records = [...merged.values()];
      }
      for (const record of records) {
        await requestToPromise(store.add(record));
      }
    }
    await completion;
    return backup;
  } catch (error) {
    abortTransaction(transaction);
    try {
      await completion;
    } catch {
      // Preserve the primary failure.
    }
    throw translateIndexedDbError(error);
  }
}
