import { requestToPromise, transactionToPromise } from "$lib/data/database/idb-utils";
import type { CurrentRecordStoreName } from "$lib/data/database/schema";
import type { MutationContext, RecordEnvelope } from "$lib/data/database/types";
import {
  IndexedDbRecordRepository,
  type CreateRecordInput,
  type ListRecordOptions,
  type RecordRepositoryOptions,
  type UpdateRecordInput,
} from "../record-repository";

export class ChemicalRecordRepository<TRecord extends RecordEnvelope> {
  private readonly base: IndexedDbRecordRepository<TRecord>;

  constructor(
    readonly database: IDBDatabase,
    readonly storeName: CurrentRecordStoreName,
    options: RecordRepositoryOptions,
  ) {
    this.base = new IndexedDbRecordRepository(database, storeName, options);
  }

  get(id: string, options?: ListRecordOptions) { return this.base.get(id, options); }
  list(options?: ListRecordOptions) { return this.base.list(options); }
  exists(id: string, options?: ListRecordOptions) { return this.base.exists(id, options); }
  count(options?: ListRecordOptions) { return this.base.count(options); }
  create(input: CreateRecordInput<TRecord>, context: MutationContext) { return this.base.create(input, context); }
  update(id: string, input: UpdateRecordInput<TRecord>, expectedRevision: number, context: MutationContext) {
    return this.base.update(id, input, expectedRevision, context);
  }
  archive(id: string, expectedRevision: number, reason: string, context: MutationContext) {
    return this.base.archive(id, expectedRevision, reason, context);
  }
  restore(id: string, expectedRevision: number, context: MutationContext) {
    return this.base.restore(id, expectedRevision, context);
  }
  async listActive() { return this.base.list(); }
  async listArchived() {
    return (await this.base.list({ includeArchived: true })).filter((record) => record.lifecycleStatus === "archived");
  }
  async getByBusinessId(businessId: string) {
    return (await this.queryIndex("byBusinessId", businessId, true))[0] ?? null;
  }

  async queryIndex(indexName: string, key: IDBValidKey | IDBKeyRange, includeArchived = false) {
    const transaction = this.database.transaction(this.storeName, "readonly");
    const completion = transactionToPromise(transaction);
    const records = await requestToPromise<TRecord[]>(
      transaction.objectStore(this.storeName).index(indexName).getAll(key),
    );
    await completion;
    return includeArchived ? records : records.filter((record) => record.lifecycleStatus === "active");
  }
}
