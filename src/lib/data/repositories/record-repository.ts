import { RecordNotFoundError } from "../database/errors";
import { requestToPromise, transactionToPromise } from "../database/idb-utils";
import type { MutableRecordStoreName } from "../database/schema";
import type { MutationContext, RecordEnvelope } from "../database/types";
import {
  runMutationTransaction,
  type MutationTransactionOptions,
} from "../revisions/mutation-transaction";

type RecordData = Record<string, unknown>;

export type CreateRecordInput<TRecord extends RecordEnvelope> = Omit<
  TRecord,
  keyof RecordEnvelope
> & { businessId: string };

export type UpdateRecordInput<TRecord extends RecordEnvelope> = Partial<
  Omit<TRecord, keyof RecordEnvelope>
>;

export interface ListRecordOptions {
  includeArchived?: boolean;
}

export interface RecordRepositoryOptions extends MutationTransactionOptions {
  recordType: string;
}

export class IndexedDbRecordRepository<TRecord extends RecordEnvelope> {
  private readonly mutationOptions: MutationTransactionOptions;

  constructor(
    private readonly database: IDBDatabase,
    private readonly storeName: MutableRecordStoreName,
    private readonly options: RecordRepositoryOptions,
  ) {
    this.mutationOptions = { now: options.now, createId: options.createId };
  }

  async get(id: string, options: ListRecordOptions = {}) {
    const transaction = this.database.transaction(this.storeName, "readonly");
    const completion = transactionToPromise(transaction);
    const record = await requestToPromise<TRecord | undefined>(
      transaction.objectStore(this.storeName).get(id),
    );
    await completion;
    if (!record || (!options.includeArchived && record.lifecycleStatus === "archived")) {
      throw new RecordNotFoundError(this.options.recordType, id);
    }
    return record;
  }

  async list(options: ListRecordOptions = {}) {
    const transaction = this.database.transaction(this.storeName, "readonly");
    const completion = transactionToPromise(transaction);
    const records = await requestToPromise<TRecord[]>(
      transaction.objectStore(this.storeName).getAll(),
    );
    await completion;
    return options.includeArchived
      ? records
      : records.filter((record) => record.lifecycleStatus !== "archived");
  }

  async exists(id: string, options: ListRecordOptions = {}) {
    try {
      await this.get(id, options);
      return true;
    } catch (error) {
      if (error instanceof RecordNotFoundError) return false;
      throw error;
    }
  }

  async count(options: ListRecordOptions = {}) {
    if (options.includeArchived) {
      const transaction = this.database.transaction(this.storeName, "readonly");
      const completion = transactionToPromise(transaction);
      const count = await requestToPromise<number>(
        transaction.objectStore(this.storeName).count(),
      );
      await completion;
      return count;
    }
    return (await this.list()).length;
  }

  create(input: CreateRecordInput<TRecord>, context: MutationContext) {
    return runMutationTransaction(
      this.database,
      [this.storeName],
      context,
      (session) =>
        session.createRecord<TRecord, RecordData>({
          storeName: this.storeName,
          recordType: this.options.recordType,
          input: input as RecordData & { businessId: string },
        }),
      this.mutationOptions,
    );
  }

  update(
    id: string,
    input: UpdateRecordInput<TRecord>,
    expectedRevision: number,
    context: MutationContext,
  ) {
    return runMutationTransaction(
      this.database,
      [this.storeName],
      context,
      (session) =>
        session.updateRecord<TRecord, RecordData>({
          storeName: this.storeName,
          recordType: this.options.recordType,
          id,
          expectedRevision,
          patch: input as RecordData,
        }),
      this.mutationOptions,
    );
  }

  archive(id: string, expectedRevision: number, reason: string, context: MutationContext) {
    return runMutationTransaction(
      this.database,
      [this.storeName],
      context,
      (session) =>
        session.archiveRecord<TRecord>({
          storeName: this.storeName,
          recordType: this.options.recordType,
          id,
          expectedRevision,
          reason,
        }),
      this.mutationOptions,
    );
  }

  restore(id: string, expectedRevision: number, context: MutationContext) {
    return runMutationTransaction(
      this.database,
      [this.storeName],
      context,
      (session) =>
        session.restoreRecord<TRecord>({
          storeName: this.storeName,
          recordType: this.options.recordType,
          id,
          expectedRevision,
        }),
      this.mutationOptions,
    );
  }
}
