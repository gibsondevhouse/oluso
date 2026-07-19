import {
  AdamaDatabaseError,
  RecordNotFoundError as DatabaseRecordNotFoundError,
  StaleRevisionError as DatabaseStaleRevisionError,
  StorageUnavailableError,
} from "$lib/data/database/errors";
import { requestToPromise, transactionToPromise } from "$lib/data/database/idb-utils";
import type { CurrentRecordStoreName } from "$lib/data/database/schema";
import type { MutationContext, RecordEnvelope } from "$lib/data/database/types";
import {
  IndexedDbRecordRepository,
  type CreateRecordInput,
  type ListRecordOptions,
  type RecordRepositoryOptions,
  type UpdateRecordInput,
} from "$lib/data/repositories/record-repository";
import {
  DatabaseUnavailableError,
  DuplicateBusinessIdError,
  RecordNotFoundError,
  StaleRevisionError,
  TransactionFailedError,
} from "$lib/domain/foundation/errors";

export abstract class FoundationRepository<TRecord extends RecordEnvelope> {
  protected readonly records: IndexedDbRecordRepository<TRecord>;

  constructor(
    protected readonly database: IDBDatabase,
    protected readonly storeName: CurrentRecordStoreName,
    protected readonly recordType: string,
    options: Omit<RecordRepositoryOptions, "recordType"> = {},
  ) {
    this.records = new IndexedDbRecordRepository(database, storeName, { ...options, recordType });
  }

  async get(id: string, options: ListRecordOptions = {}) {
    try {
      return await this.records.get(id, options);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async list(options: ListRecordOptions = {}) {
    try {
      return await this.records.list(options);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async exists(id: string, options: ListRecordOptions = {}) {
    try {
      return await this.records.exists(id, options);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async count(options: ListRecordOptions = {}) {
    try {
      return await this.records.count(options);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async getByBusinessId(businessId: string, options: ListRecordOptions = {}) {
    const normalized = businessId.trim().toUpperCase();
    const transaction = this.database.transaction(this.storeName, "readonly");
    const completion = transactionToPromise(transaction);
    try {
      const record = await requestToPromise<TRecord | undefined>(
        transaction.objectStore(this.storeName).index("byBusinessId").get(normalized),
      );
      await completion;
      if (!record || (!options.includeArchived && record.lifecycleStatus === "archived")) return null;
      return record;
    } catch (error) {
      throw this.translate(error);
    }
  }

  async create(input: CreateRecordInput<TRecord>, context: MutationContext) {
    try {
      return await this.records.create(input, context);
    } catch (error) {
      if (error instanceof AdamaDatabaseError && error.code === "CONSTRAINT_VIOLATION") {
        throw new DuplicateBusinessIdError(this.recordType, input.businessId);
      }
      throw this.translate(error);
    }
  }

  async update(
    id: string,
    input: UpdateRecordInput<TRecord>,
    expectedRevision: number,
    context: MutationContext,
  ) {
    try {
      return await this.records.update(id, input, expectedRevision, context);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async archive(id: string, expectedRevision: number, reason: string, context: MutationContext) {
    try {
      return await this.records.archive(id, expectedRevision, reason, context);
    } catch (error) {
      throw this.translate(error);
    }
  }

  async restore(id: string, expectedRevision: number, context: MutationContext) {
    try {
      return await this.records.restore(id, expectedRevision, context);
    } catch (error) {
      throw this.translate(error);
    }
  }

  protected async listByIndex(
    indexName: string,
    value: IDBValidKey,
    options: ListRecordOptions = {},
  ) {
    const transaction = this.database.transaction(this.storeName, "readonly");
    const completion = transactionToPromise(transaction);
    try {
      const records = await requestToPromise<TRecord[]>(
        transaction.objectStore(this.storeName).index(indexName).getAll(IDBKeyRange.only(value)),
      );
      await completion;
      return options.includeArchived
        ? records
        : records.filter((record) => record.lifecycleStatus === "active");
    } catch (error) {
      throw this.translate(error);
    }
  }

  protected translate(error: unknown): Error {
    if (error instanceof DatabaseStaleRevisionError) {
      return new StaleRevisionError(
        error.recordType,
        error.recordId,
        error.expectedRevision,
        error.currentRevision,
        error,
      );
    }
    if (error instanceof DatabaseRecordNotFoundError) {
      return new RecordNotFoundError(this.recordType, extractRecordId(error.message), error);
    }
    if (error instanceof StorageUnavailableError) return new DatabaseUnavailableError(error);
    if (error instanceof AdamaDatabaseError) return new TransactionFailedError(error);
    return error instanceof Error ? error : new TransactionFailedError(error);
  }
}

function extractRecordId(message: string) {
  const match = message.match(/record (.+) was not found/);
  return match?.[1] ?? "unknown";
}
