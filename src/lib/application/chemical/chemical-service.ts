import {
  getDatabaseIdentity,
  LocalIdentityService,
  RecordNotFoundError,
  type MutationContext,
  type RecordEnvelope,
} from "$lib/data/database";
import type { ChemicalRecordRepository } from "$lib/data/repositories/chemical";
import { ChemicalRelationshipError } from "$lib/domain/chemical";

export interface FoundationOrganization extends RecordEnvelope {
  name?: string;
  status?: string;
}
export interface FoundationPerson extends RecordEnvelope { status?: string; displayName?: string; name?: string }
export interface FoundationProcess extends RecordEnvelope { locationId?: string; primaryLocationId?: string; operationalFunctionId: string; resolvedSiteId: string | null; status?: string; name?: string }
export interface FoundationTask extends RecordEnvelope { processId: string; resolvedSiteId: string | null; status?: string; name?: string }

export class ChemicalService {
  protected readonly identity: LocalIdentityService;
  constructor(protected readonly database: IDBDatabase) {
    this.identity = new LocalIdentityService(database);
  }

  protected async context(reason: string): Promise<MutationContext> {
    return this.identity.mutationContext(reason);
  }

  protected businessId(prefix: string, requested?: string) {
    return requested?.trim() || `${prefix}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  }

  protected async requireRecord<T extends RecordEnvelope>(
    repository: Pick<ChemicalRecordRepository<T>, "get">,
    id: string,
    label: string,
    active = false,
  ) {
    let record: T;
    try {
      record = await repository.get(id, { includeArchived: true });
    } catch (error) {
      if (error instanceof RecordNotFoundError) throw new ChemicalRelationshipError(`${label} was not found.`);
      throw error;
    }
    if (active && record.lifecycleStatus !== "active") {
      throw new ChemicalRelationshipError(`${label} is archived and cannot receive a new active relationship.`);
    }
    return record;
  }

  protected async getFoundation<T extends RecordEnvelope>(storeName: string, id: string, label: string, active = true) {
    const transaction = this.database.transaction(storeName, "readonly");
    const record = await new Promise<T | undefined>((resolve, reject) => {
      const request = transaction.objectStore(storeName).get(id);
      request.onsuccess = () => resolve(request.result as T | undefined);
      request.onerror = () => reject(request.error);
    });
    if (!record) throw new ChemicalRelationshipError(`${label} was not found.`);
    if (active && (
      record.lifecycleStatus !== "active" ||
      String((record as T & { status?: string }).status ?? "").toLocaleLowerCase() === "inactive"
    )) {
      throw new ChemicalRelationshipError(`${label} is archived or inactive.`);
    }
    return record;
  }

  protected async datasetRevision() {
    return (await getDatabaseIdentity(this.database))?.dataset.datasetRevision ?? 0;
  }
}
