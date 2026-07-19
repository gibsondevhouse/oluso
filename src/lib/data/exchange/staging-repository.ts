import { requestToPromise, transactionToPromise } from "../database/idb-utils";
import { createUuid } from "../database/idb-utils";

export interface ExchangeStagingRecord {
  id: string;
  packageId: string;
  createdAt: string;
  sourceFileName: string;
  status: "parsed" | "validated" | "classified" | "rejected";
  manifest: Record<string, unknown>;
  classifications: unknown[];
  validationErrors: string[];
}

export class ExchangeStagingRepository {
  constructor(
    private readonly database: IDBDatabase,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = createUuid,
  ) {}

  async stage(
    input: Omit<ExchangeStagingRecord, "id" | "createdAt">,
  ): Promise<ExchangeStagingRecord> {
    const record: ExchangeStagingRecord = {
      ...input,
      id: this.createId(),
      createdAt: this.now().toISOString(),
    };
    const transaction = this.database.transaction("exchange_staging", "readwrite");
    const completion = transactionToPromise(transaction);
    await requestToPromise(transaction.objectStore("exchange_staging").add(record));
    await completion;
    return record;
  }

  async list() {
    const transaction = this.database.transaction("exchange_staging", "readonly");
    const completion = transactionToPromise(transaction);
    const records = await requestToPromise<ExchangeStagingRecord[]>(
      transaction.objectStore("exchange_staging").getAll(),
    );
    await completion;
    return records;
  }

  async clear(id: string) {
    const transaction = this.database.transaction("exchange_staging", "readwrite");
    const completion = transactionToPromise(transaction);
    await requestToPromise(transaction.objectStore("exchange_staging").delete(id));
    await completion;
  }
}
