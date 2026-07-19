import { translateIndexedDbError } from "./errors";

export function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.addEventListener("success", () => resolve(request.result), { once: true });
    request.addEventListener("error", () => reject(translateIndexedDbError(request.error)), {
      once: true,
    });
  });
}

export function transactionToPromise(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.addEventListener("complete", () => resolve(), { once: true });
    transaction.addEventListener(
      "abort",
      () => reject(translateIndexedDbError(transaction.error ?? new Error("Transaction aborted."))),
      { once: true },
    );
    transaction.addEventListener(
      "error",
      () => reject(translateIndexedDbError(transaction.error ?? new Error("Transaction failed."))),
      { once: true },
    );
  });
}

export function createUuid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    const value = character === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function abortTransaction(transaction: IDBTransaction) {
  try {
    transaction.abort();
  } catch {
    // The transaction may already have completed or aborted.
  }
}
