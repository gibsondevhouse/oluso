import {
  IdentityNotInitializedError,
  RecordNotFoundError,
  StaleRevisionError,
  translateIndexedDbError,
} from "../database/errors";
import { abortTransaction, createUuid, requestToPromise, transactionToPromise } from "../database/idb-utils";
import type { AdamaStoreName, MutableRecordStoreName } from "../database/schema";
import type {
  DatasetMetadata,
  MutationContext,
  RecordEnvelope,
  RecordRevision,
  RecordRevisionOperation,
} from "../database/types";

type RecordData = Record<string, unknown>;

export interface MutationTransactionOptions {
  now?: () => Date;
  createId?: () => string;
  additionalStoreNames?: AdamaStoreName[];
}

export interface CreateRecordOptions<TInput extends RecordData> {
  storeName: MutableRecordStoreName;
  recordType: string;
  id?: string;
  input: TInput & { businessId: string };
  operation?: Extract<RecordRevisionOperation, "create" | "import" | "resolve">;
}

export interface UpdateRecordOptions<TPatch extends RecordData> {
  storeName: MutableRecordStoreName;
  recordType: string;
  id: string;
  expectedRevision: number;
  patch: TPatch;
  operation?: Exclude<RecordRevisionOperation, "create">;
}

export class MutationSession {
  private mutationCount = 0;

  constructor(
    private readonly transaction: IDBTransaction,
    private readonly context: MutationContext,
    private readonly timestamp: string,
    private readonly createId: () => string,
  ) {}

  get count() {
    return this.mutationCount;
  }

  async createRecord<TRecord extends RecordEnvelope, TInput extends RecordData>(
    options: CreateRecordOptions<TInput>,
  ): Promise<TRecord> {
    const id = options.id ?? this.createId();
    const input = options.input;
    const record = {
      ...input,
      id,
      businessId: input.businessId,
      revision: 1,
      createdAt: this.timestamp,
      createdBy: this.context.actorId,
      updatedAt: this.timestamp,
      updatedBy: this.context.actorId,
      originInstallationId: this.context.installationId,
      lastExchangePackageId: this.context.exchangePackageId,
      lifecycleStatus: "active",
      archivedAt: null,
      archivedBy: null,
      archiveReason: null,
      archivedReason: null,
    } satisfies RecordEnvelope as unknown as TRecord;

    const store = this.transaction.objectStore(options.storeName);
    await requestToPromise(store.add(record));
    await this.appendRevision(options.recordType, record, undefined, options.operation ?? "create");
    this.mutationCount += 1;
    return record;
  }

  async updateRecord<TRecord extends RecordEnvelope, TPatch extends RecordData>(
    options: UpdateRecordOptions<TPatch>,
  ): Promise<TRecord> {
    const store = this.transaction.objectStore(options.storeName);
    const current = await requestToPromise<TRecord | undefined>(store.get(options.id));
    if (!current) throw new RecordNotFoundError(options.recordType, options.id);
    if (current.revision !== options.expectedRevision) {
      throw new StaleRevisionError(
        options.recordType,
        options.id,
        options.expectedRevision,
        current.revision,
      );
    }

    const next = {
      ...current,
      ...options.patch,
      id: current.id,
      businessId: current.businessId,
      revision: current.revision + 1,
      createdAt: current.createdAt,
      createdBy: current.createdBy,
      updatedAt: this.timestamp,
      updatedBy: this.context.actorId,
      originInstallationId: current.originInstallationId,
      lastExchangePackageId: this.context.exchangePackageId,
      lifecycleStatus: current.lifecycleStatus,
      archivedAt: current.archivedAt,
      archivedBy: current.archivedBy,
      archiveReason: current.archiveReason,
      archivedReason: current.archivedReason,
    } as TRecord;

    await requestToPromise(store.put(next));
    await this.appendRevision(
      options.recordType,
      next,
      current,
      options.operation ?? (this.context.source === "exchange" ? "import" : "update"),
    );
    this.mutationCount += 1;
    return next;
  }

  async archiveRecord<TRecord extends RecordEnvelope>(options: {
    storeName: MutableRecordStoreName;
    recordType: string;
    id: string;
    expectedRevision: number;
    reason: string;
  }): Promise<TRecord> {
    if (!options.reason.trim()) {
      throw new Error("Archive reason is required.");
    }
    return this.updateLifecycle<TRecord>(options, "archived", "archive");
  }

  async importRecord<TRecord extends RecordEnvelope>(options: {
    storeName: MutableRecordStoreName;
    recordType: string;
    record: TRecord;
  }): Promise<TRecord> {
    const record = {
      ...options.record,
      revision: Math.max(1, options.record.revision),
      updatedBy: this.context.actorId,
      originInstallationId:
        options.record.originInstallationId || this.context.installationId,
      lastExchangePackageId: this.context.exchangePackageId,
    } as TRecord;
    await requestToPromise(this.transaction.objectStore(options.storeName).add(record));
    await this.appendRevision(options.recordType, record, undefined, "import");
    this.mutationCount += 1;
    return record;
  }

  async putMigrationRun(record: Record<string, unknown> & { id: string }) {
    await requestToPromise(this.transaction.objectStore("migration_runs").add(record));
  }

  async restoreRecord<TRecord extends RecordEnvelope>(options: {
    storeName: MutableRecordStoreName;
    recordType: string;
    id: string;
    expectedRevision: number;
  }): Promise<TRecord> {
    return this.updateLifecycle<TRecord>({ ...options, reason: "" }, "active", "restore");
  }

  private async updateLifecycle<TRecord extends RecordEnvelope>(
    options: {
      storeName: MutableRecordStoreName;
      recordType: string;
      id: string;
      expectedRevision: number;
      reason: string;
    },
    lifecycleStatus: "active" | "archived",
    operation: "archive" | "restore",
  ): Promise<TRecord> {
    const store = this.transaction.objectStore(options.storeName);
    const current = await requestToPromise<TRecord | undefined>(store.get(options.id));
    if (!current) throw new RecordNotFoundError(options.recordType, options.id);
    if (current.revision !== options.expectedRevision) {
      throw new StaleRevisionError(
        options.recordType,
        options.id,
        options.expectedRevision,
        current.revision,
      );
    }

    const next = {
      ...current,
      revision: current.revision + 1,
      updatedAt: this.timestamp,
      updatedBy: this.context.actorId,
      lastExchangePackageId: this.context.exchangePackageId,
      lifecycleStatus,
      archivedAt: lifecycleStatus === "archived" ? this.timestamp : null,
      archivedBy: lifecycleStatus === "archived" ? this.context.actorId : null,
      archiveReason: lifecycleStatus === "archived" ? options.reason.trim() : null,
      archivedReason: lifecycleStatus === "archived" ? options.reason.trim() : null,
    } as TRecord;

    await requestToPromise(store.put(next));
    await this.appendRevision(options.recordType, next, current, operation);
    this.mutationCount += 1;
    return next;
  }

  private async appendRevision<TRecord extends RecordEnvelope>(
    recordType: string,
    after: TRecord,
    before: TRecord | undefined,
    operation: RecordRevisionOperation,
  ) {
    const revision: RecordRevision<TRecord> = {
      id: `${recordType}:${after.id}:${after.revision}`,
      recordType,
      recordId: after.id,
      revision: after.revision,
      operation,
      changedAt: this.timestamp,
      changedBy: this.context.actorId,
      source: this.context.source,
      changeReason: this.context.reason,
      before,
      after,
      exchangePackageId: this.context.exchangePackageId,
    };
    await requestToPromise(this.transaction.objectStore("record_revisions").add(revision));
  }

  async advanceDatasetRevision() {
    if (this.mutationCount === 0) return;
    const store = this.transaction.objectStore("dataset_metadata");
    const dataset = await requestToPromise<DatasetMetadata | undefined>(store.get("current"));
    if (!dataset) throw new IdentityNotInitializedError();
    store.put({
      ...dataset,
      datasetRevision: dataset.datasetRevision + 1,
      updatedAt: this.timestamp,
      updatedBy: this.context.actorId,
    } satisfies DatasetMetadata);
  }
}

export async function runMutationTransaction<T>(
  database: IDBDatabase,
  storeNames: MutableRecordStoreName[],
  context: MutationContext,
  operation: (session: MutationSession) => Promise<T>,
  options: MutationTransactionOptions = {},
): Promise<T> {
  const uniqueStores = [
    ...new Set([
      ...storeNames,
      "record_revisions" as const,
      "dataset_metadata" as const,
      ...(options.additionalStoreNames ?? []),
    ]),
  ];
  const transaction = database.transaction(uniqueStores, "readwrite");
  const completion = transactionToPromise(transaction);
  const session = new MutationSession(
    transaction,
    context,
    (options.now ?? (() => new Date()))().toISOString(),
    options.createId ?? createUuid,
  );

  try {
    const result = await operation(session);
    await session.advanceDatasetRevision();
    await completion;
    return result;
  } catch (error) {
    abortTransaction(transaction);
    try {
      await completion;
    } catch {
      // Preserve the primary semantic error.
    }
    throw translateIndexedDbError(error);
  }
}
