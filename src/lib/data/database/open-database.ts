import { DatabaseBlockedError, StorageUnavailableError, translateIndexedDbError } from "./errors";
import {
  ADAMA_DATABASE_NAME,
  ADAMA_DATABASE_VERSION,
} from "./schema";
import { upgradeAdamaDatabase } from "../migrations";

export interface OpenDatabaseOptions {
  name?: string;
  version?: number;
  indexedDb?: IDBFactory;
  onBlocked?: (error: DatabaseBlockedError) => void;
  onVersionChange?: (database: IDBDatabase) => void;
}

export function openAdamaDatabase(options: OpenDatabaseOptions = {}): Promise<IDBDatabase> {
  const factory = options.indexedDb ?? globalThis.indexedDB;
  if (!factory) {
    return Promise.reject(new StorageUnavailableError());
  }

  const name = options.name ?? ADAMA_DATABASE_NAME;
  const version = options.version ?? ADAMA_DATABASE_VERSION;

  return new Promise((resolve, reject) => {
    let settled = false;
    let blockedError: DatabaseBlockedError | null = null;
    let request: IDBOpenDBRequest;

    try {
      request = factory.open(name, version);
    } catch (error) {
      reject(new StorageUnavailableError("The browser database could not be opened.", error));
      return;
    }

    request.addEventListener("upgradeneeded", (event) => {
      const transaction = request.transaction;
      if (!transaction) {
        reject(new StorageUnavailableError("The browser did not provide an upgrade transaction."));
        return;
      }
      upgradeAdamaDatabase(
        request.result,
        transaction,
        (event as IDBVersionChangeEvent).oldVersion,
      );
    });

    request.addEventListener("blocked", () => {
      blockedError = new DatabaseBlockedError();
      options.onBlocked?.(blockedError);
    });

    request.addEventListener("error", () => {
      if (settled) return;
      settled = true;
      reject(blockedError ?? translateIndexedDbError(request.error));
    });

    request.addEventListener("success", () => {
      if (settled) {
        request.result.close();
        return;
      }
      settled = true;
      const database = request.result;
      database.addEventListener("versionchange", () => {
        options.onVersionChange?.(database);
        database.close();
      });
      if (blockedError) {
        database.close();
        reject(blockedError);
        return;
      }
      resolve(database);
    });
  });
}

export function deleteAdamaDatabase(name = ADAMA_DATABASE_NAME, factory = globalThis.indexedDB) {
  if (!factory) return Promise.reject(new StorageUnavailableError());
  return new Promise<void>((resolve, reject) => {
    const request = factory.deleteDatabase(name);
    request.addEventListener("success", () => resolve(), { once: true });
    request.addEventListener("error", () => reject(translateIndexedDbError(request.error)), {
      once: true,
    });
    request.addEventListener("blocked", () => reject(new DatabaseBlockedError()), { once: true });
  });
}
