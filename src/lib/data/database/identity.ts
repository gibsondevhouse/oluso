import { ADAMA_DATABASE_VERSION } from "./schema";
import type {
  DatabaseIdentity,
  DatasetMetadata,
  InstallationMetadata,
  LocalUserProfile,
  MutationContext,
} from "./types";
import { abortTransaction, createUuid, requestToPromise, transactionToPromise } from "./idb-utils";
import { IdentityNotInitializedError, translateIndexedDbError } from "./errors";

export const LOCAL_USER_ROLES: readonly LocalUserProfile["role"][] = [
  "HSE Coordinator",
  "HSE Manager",
  "Site Manager",
  "Plant Manager",
  "Reviewer",
  "Industrial Hygienist",
  "Administrator",
  "Other",
] as const;

export interface InitializeInstallationOptions {
  installationLabel?: string;
  datasetId?: string;
  installationId?: string;
  now?: () => Date;
  createId?: () => string;
}

export interface InitializeIdentityOptions extends InitializeInstallationOptions {
  actorId: string;
  actorBusinessId: string;
  actorDisplayName: string;
  actorRole?: LocalUserProfile["role"];
  actorInitials?: string;
  employeeIdentifier?: string;
  email?: string;
  installationLabel: string;
}

export interface ConfigureLocalUserInput {
  displayName: string;
  role: LocalUserProfile["role"];
  initials: string;
  employeeIdentifier?: string;
  email?: string;
  businessId?: string;
  personId?: string;
}

export interface UpdateLocalUserInput extends Partial<ConfigureLocalUserInput> {}

function initialsFor(displayName: string) {
  return displayName
    .trim()
    .split(/\s+/)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

function assertProfileInput(input: ConfigureLocalUserInput) {
  if (!input.displayName.trim()) throw new Error("Display name is required.");
  if (!LOCAL_USER_ROLES.includes(input.role)) throw new Error("A valid local user role is required.");
  if (!input.initials.trim()) throw new Error("Initials are required.");
  if (input.email?.trim() && !/^\S+@\S+\.\S+$/.test(input.email.trim())) {
    throw new Error("Email must be a valid address.");
  }
}

export async function initializeInstallationIdentity(
  database: IDBDatabase,
  options: InitializeInstallationOptions = {},
) {
  const now = (options.now ?? (() => new Date()))().toISOString();
  const createId = options.createId ?? createUuid;
  const transaction = database.transaction(
    ["dataset_metadata", "installation_metadata"],
    "readwrite",
  );
  const completion = transactionToPromise(transaction);
  try {
    const datasetStore = transaction.objectStore("dataset_metadata");
    const installationStore = transaction.objectStore("installation_metadata");
    const [existingDataset, existingInstallation] = await Promise.all([
      requestToPromise<DatasetMetadata | undefined>(datasetStore.get("current")),
      requestToPromise<InstallationMetadata | undefined>(installationStore.get("current")),
    ]);
    const systemActor = "system:installation";
    const dataset: DatasetMetadata = existingDataset ?? {
      id: "current",
      datasetId: options.datasetId ?? createId(),
      schemaVersion: ADAMA_DATABASE_VERSION,
      datasetRevision: 0,
      createdAt: now,
      createdBy: systemActor,
      updatedAt: now,
      updatedBy: systemActor,
    };
    const installation: InstallationMetadata = existingInstallation ?? {
      id: "current",
      installationId: options.installationId ?? createId(),
      createdAt: now,
      updatedAt: now,
      label: options.installationLabel?.trim() || "Unconfigured installation",
    };
    datasetStore.put(dataset);
    installationStore.put(installation);
    await completion;
    return { dataset, installation };
  } catch (error) {
    abortTransaction(transaction);
    try { await completion; } catch { /* Preserve primary failure. */ }
    throw translateIndexedDbError(error);
  }
}

export class LocalIdentityService {
  constructor(
    private readonly database: IDBDatabase,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = createUuid,
  ) {}

  async getInstallation() {
    const transaction = this.database.transaction("installation_metadata", "readonly");
    const completion = transactionToPromise(transaction);
    const installation = await requestToPromise<InstallationMetadata | undefined>(
      transaction.objectStore("installation_metadata").get("current"),
    );
    await completion;
    return installation ?? null;
  }

  async getCurrentUser() {
    const installation = await this.getInstallation();
    if (!installation) return null;
    const transaction = this.database.transaction("local_users", "readonly");
    const completion = transactionToPromise(transaction);
    const users = await requestToPromise<LocalUserProfile[]>(
      transaction.objectStore("local_users").index("byInstallation").getAll(installation.installationId),
    );
    await completion;
    return users.find((user) => user.isCurrentForInstallation && user.status === "active") ?? null;
  }

  async configureUser(input: ConfigureLocalUserInput, requestedId?: string) {
    assertProfileInput(input);
    const installation = await this.getInstallation();
    if (!installation) throw new IdentityNotInitializedError();
    const timestamp = this.now().toISOString();
    const transaction = this.database.transaction("local_users", "readwrite");
    const completion = transactionToPromise(transaction);
    try {
      const store = transaction.objectStore("local_users");
      const existing = await requestToPromise<LocalUserProfile[]>(
        store.index("byInstallation").getAll(installation.installationId),
      );
      for (const user of existing) {
        if (user.isCurrentForInstallation) {
          store.put({ ...user, isCurrentForInstallation: false, updatedAt: timestamp });
        }
      }
      const id = requestedId ?? this.createId();
      const prior = await requestToPromise<LocalUserProfile | undefined>(store.get(id));
      const user: LocalUserProfile = {
        id,
        businessId: input.businessId?.trim() || prior?.businessId || `USR-${id.slice(0, 8).toUpperCase()}`,
        displayName: input.displayName.trim(),
        role: input.role,
        initials: input.initials.trim().toUpperCase(),
        employeeIdentifier: input.employeeIdentifier?.trim() || undefined,
        email: input.email?.trim() || undefined,
        installationId: installation.installationId,
        isCurrentForInstallation: true,
        personId: input.personId?.trim() || undefined,
        status: "active",
        createdAt: prior?.createdAt ?? timestamp,
        updatedAt: timestamp,
      };
      store.put(user);
      await completion;
      return user;
    } catch (error) {
      abortTransaction(transaction);
      try { await completion; } catch { /* Preserve primary failure. */ }
      throw translateIndexedDbError(error);
    }
  }

  async updateUser(input: UpdateLocalUserInput) {
    const current = await this.getCurrentUser();
    if (!current) throw new IdentityNotInitializedError();
    return this.configureUser(
      {
        displayName: input.displayName ?? current.displayName,
        role: input.role ?? current.role,
        initials: input.initials ?? current.initials,
        employeeIdentifier: input.employeeIdentifier ?? current.employeeIdentifier,
        email: input.email ?? current.email,
        businessId: current.businessId,
        personId: input.personId ?? current.personId,
      },
      current.id,
    );
  }

  async updateInstallationLabel(label: string) {
    const normalized = label.trim();
    if (!normalized) throw new Error("Installation label is required.");
    const transaction = this.database.transaction("installation_metadata", "readwrite");
    const completion = transactionToPromise(transaction);
    const store = transaction.objectStore("installation_metadata");
    const current = await requestToPromise<InstallationMetadata | undefined>(store.get("current"));
    if (!current) {
      transaction.abort();
      throw new IdentityNotInitializedError();
    }
    const updated = { ...current, label: normalized, updatedAt: this.now().toISOString() };
    store.put(updated);
    await completion;
    return updated;
  }

  async assertMutationIdentityReady() {
    const [installation, user] = await Promise.all([this.getInstallation(), this.getCurrentUser()]);
    if (!installation || !user || !user.displayName.trim() || !user.initials.trim()) {
      throw new IdentityNotInitializedError();
    }
    return { installation, user };
  }

  async mutationContext(reason?: string): Promise<MutationContext> {
    const { installation, user } = await this.assertMutationIdentityReady();
    return {
      actorId: user.id,
      installationId: installation.installationId,
      source: "local",
      reason,
    };
  }
}

export async function initializeDatabaseIdentity(
  database: IDBDatabase,
  options: InitializeIdentityOptions,
): Promise<DatabaseIdentity> {
  const { dataset, installation } = await initializeInstallationIdentity(database, options);
  const service = new LocalIdentityService(database, options.now, options.createId);
  const existing = await service.getCurrentUser();
  const localUser = existing ?? await service.configureUser({
    displayName: options.actorDisplayName,
    role: options.actorRole ?? "Other",
    initials: options.actorInitials ?? (initialsFor(options.actorDisplayName) || "USER"),
    employeeIdentifier: options.employeeIdentifier,
    email: options.email,
    businessId: options.actorBusinessId,
  }, options.actorId);
  return { dataset, installation, localUser };
}

export async function getDatabaseIdentity(database: IDBDatabase): Promise<DatabaseIdentity | null> {
  const transaction = database.transaction(
    ["dataset_metadata", "installation_metadata"],
    "readonly",
  );
  const completion = transactionToPromise(transaction);
  const dataset = await requestToPromise<DatasetMetadata | undefined>(
    transaction.objectStore("dataset_metadata").get("current"),
  );
  const installation = await requestToPromise<InstallationMetadata | undefined>(
    transaction.objectStore("installation_metadata").get("current"),
  );
  await completion;
  const localUser = await new LocalIdentityService(database).getCurrentUser();
  return dataset && installation && localUser ? { dataset, installation, localUser } : null;
}
