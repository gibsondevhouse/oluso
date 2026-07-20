import { requestToPromise, transactionToPromise } from "$lib/data/database/idb-utils";
import type { AdamaStoreName } from "$lib/data/database/schema";

export async function readWorkspaceStore<T>(database: IDBDatabase, storeName: AdamaStoreName): Promise<T[]> {
  const transaction = database.transaction(storeName, "readonly");
  const completion = transactionToPromise(transaction);
  const records = await requestToPromise<T[]>(transaction.objectStore(storeName).getAll());
  await completion;
  return records;
}
