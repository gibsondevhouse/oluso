import { ADAMA_DATABASE_VERSION } from "./schema";
import type {
  DatabaseIdentity,
  DatasetMetadata,
  InstallationMetadata,
  LocalUserProfile,
} from "./types";
import { abortTransaction, createUuid, requestToPromise, transactionToPromise } from "./idb-utils";
import { translateIndexedDbError } from "./errors";

export interface InitializeIdentityOptions {
  actorId: string;
  actorBusinessId: string;
  actorDisplayName: string;
  installationLabel: string;
  datasetId?: string;
  installationId?: string;
  now?: () => Date;
  createId?: () => string;
}

export async function initializeDatabaseIdentity(
  database: IDBDatabase,
  options: InitializeIdentityOptions,
): Promise<DatabaseIdentity> {
  const now = (options.now ?? (() => new Date()))().toISOString();
  const createId = options.createId ?? createUuid;
  const transaction = database.transaction(
    ["dataset_metadata", "installation_metadata", "local_users"],
    "readwrite",
  );
  const completion = transactionToPromise(transaction);

  try {
    const datasetStore = transaction.objectStore("dataset_metadata");
    const installationStore = transaction.objectStore("installation_metadata");
    const userStore = transaction.objectStore("local_users");

    const [existingDataset, existingInstallation, existingUser] = await Promise.all([
      requestToPromise<DatasetMetadata | undefined>(datasetStore.get("current")),
      requestToPromise<InstallationMetadata | undefined>(installationStore.get("current")),
      requestToPromise<LocalUserProfile | undefined>(userStore.get(options.actorId)),
    ]);

    const dataset: DatasetMetadata = existingDataset ?? {
      id: "current",
      datasetId: options.datasetId ?? createId(),
      schemaVersion: ADAMA_DATABASE_VERSION,
      datasetRevision: 0,
      createdAt: now,
      createdBy: options.actorId,
      updatedAt: now,
      updatedBy: options.actorId,
    };
    const installation: InstallationMetadata = existingInstallation ?? {
      id: "current",
      installationId: options.installationId ?? createId(),
      createdAt: now,
      updatedAt: now,
      label: options.installationLabel,
    };
    const localUser: LocalUserProfile = existingUser ?? {
      id: options.actorId,
      businessId: options.actorBusinessId,
      displayName: options.actorDisplayName,
      status: "active",
      createdAt: now,
      updatedAt: now,
    };

    datasetStore.put(dataset);
    installationStore.put(installation);
    userStore.put(localUser);
    await completion;

    return { dataset, installation, localUser };
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

export async function getDatabaseIdentity(database: IDBDatabase): Promise<DatabaseIdentity | null> {
  const transaction = database.transaction(
    ["dataset_metadata", "installation_metadata", "local_users"],
    "readonly",
  );
  const completion = transactionToPromise(transaction);
  const dataset = await requestToPromise<DatasetMetadata | undefined>(
    transaction.objectStore("dataset_metadata").get("current"),
  );
  const installation = await requestToPromise<InstallationMetadata | undefined>(
    transaction.objectStore("installation_metadata").get("current"),
  );
  const users = await requestToPromise<LocalUserProfile[]>(
    transaction.objectStore("local_users").getAll(),
  );
  await completion;
  const localUser = users.find((user) => user.status === "active");
  return dataset && installation && localUser ? { dataset, installation, localUser } : null;
}
