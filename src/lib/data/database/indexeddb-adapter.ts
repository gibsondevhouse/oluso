import { exportDatabaseBackup, getBackupStatus, recordVerifiedBackup, restoreDatabaseBackup } from "../backup/index";
import { inspectBrowserStorage, requestPersistentStorage } from "../diagnostics";
import { ExchangeStagingRepository } from "../exchange";
import { assertDatabaseIntegrity, inspectDatabaseIntegrity } from "../integrity";
import { migrateLegacyDatabase, type LegacyMigrationOptions } from "../legacy";
import { IndexedDbRecordRepository, type RecordRepositoryOptions } from "../repositories";
import type { RecordEnvelope } from "./types";
import { getDatabaseIdentity, initializeDatabaseIdentity, type InitializeIdentityOptions } from "./identity";
import { openAdamaDatabase, type OpenDatabaseOptions } from "./open-database";
import type { CurrentRecordStoreName } from "./schema";

export interface OpenIndexedDbAdapterOptions extends OpenDatabaseOptions {
  identity?: InitializeIdentityOptions;
}

export class AdamaIndexedDbAdapter {
  private closed = false;

  private constructor(readonly database: IDBDatabase) {}

  static async open(options: OpenIndexedDbAdapterOptions = {}) {
    const database = await openAdamaDatabase(options);
    const adapter = new AdamaIndexedDbAdapter(database);
    if (options.identity) {
      await initializeDatabaseIdentity(database, options.identity);
    }
    return adapter;
  }

  get name() {
    return this.database.name;
  }

  get version() {
    return this.database.version;
  }

  get isClosed() {
    return this.closed;
  }

  identity() {
    return getDatabaseIdentity(this.database);
  }

  repository<TRecord extends RecordEnvelope>(
    storeName: CurrentRecordStoreName,
    options: RecordRepositoryOptions,
  ) {
    return new IndexedDbRecordRepository<TRecord>(this.database, storeName, options);
  }

  staging() {
    return new ExchangeStagingRepository(this.database);
  }

  migrateLegacy(source: unknown, options: LegacyMigrationOptions) {
    return migrateLegacyDatabase(this.database, source, options);
  }

  exportBackup() {
    return exportDatabaseBackup(this.database);
  }

  restoreBackup(value: unknown) {
    return restoreDatabaseBackup(this.database, value);
  }

  recordVerifiedBackup(value: unknown) {
    return recordVerifiedBackup(this.database, value);
  }

  backupStatus() {
    return getBackupStatus(this.database);
  }

  inspectIntegrity() {
    return inspectDatabaseIntegrity(this.database);
  }

  assertIntegrity() {
    return assertDatabaseIntegrity(this.database);
  }

  inspectBrowserStorage() {
    return inspectBrowserStorage();
  }

  requestPersistentStorage() {
    return requestPersistentStorage();
  }

  close() {
    if (this.closed) return;
    this.closed = true;
    this.database.close();
  }
}
