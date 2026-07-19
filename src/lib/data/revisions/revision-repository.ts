import { requestToPromise, transactionToPromise } from "../database/idb-utils";
import type { RecordRevision } from "../database/types";

export class RevisionRepository {
  constructor(private readonly database: IDBDatabase) {}

  async listForRecord<T = unknown>(recordType: string, recordId: string) {
    const transaction = this.database.transaction("record_revisions", "readonly");
    const completion = transactionToPromise(transaction);
    const index = transaction.objectStore("record_revisions").index("byRecord");
    const revisions = await requestToPromise<RecordRevision<T>[]>(
      index.getAll(IDBKeyRange.only([recordType, recordId])),
    );
    await completion;
    return revisions.sort((left, right) => left.revision - right.revision);
  }
}
