import type { MutationContext, RecordEnvelope } from "$lib/data/database";
import type { FoundationRepository } from "$lib/data/repositories/foundation/foundation-repository";
import {
  ArchivedRelationshipError,
  DuplicateBusinessIdError,
  MissingRelationshipError,
  RecordArchivedError,
  RecordNotFoundError,
  ValidationError,
} from "$lib/domain/foundation";

export interface FoundationServiceOptions {
  context: () => MutationContext;
  createId?: () => string;
}

export abstract class FoundationService<TRecord extends RecordEnvelope> {
  constructor(
    protected readonly repository: FoundationRepository<TRecord>,
    protected readonly prefix: string,
    protected readonly recordType: string,
    protected readonly options: FoundationServiceOptions,
  ) {}

  get(id: string, includeArchived = false) {
    return this.repository.get(id, { includeArchived });
  }

  list(includeArchived = false) {
    return this.repository.list({ includeArchived });
  }

  async search(query: string, includeArchived = false) {
    const normalized = query.trim().toLowerCase();
    const records = await this.list(includeArchived);
    if (!normalized) return records;
    return records.filter((record) => this.searchText(record).includes(normalized));
  }

  async archive(id: string, expectedRevision: number, reason: string) {
    const record = await this.requireMutable(id);
    if (!reason.trim()) {
      throw new ValidationError([{ field: "archivedReason", message: "Archive reason is required.", code: "REQUIRED" }]);
    }
    return this.repository.archive(record.id, expectedRevision, reason, this.options.context());
  }

  async restore(id: string, expectedRevision: number) {
    const record = await this.repository.get(id, { includeArchived: true });
    if (record.lifecycleStatus !== "archived") {
      throw new ValidationError([{ field: "lifecycleStatus", message: `${this.recordType} is already active.`, code: "NOT_ARCHIVED" }]);
    }
    return this.repository.restore(record.id, expectedRevision, this.options.context());
  }

  protected async requireMutable(id: string) {
    const record = await this.repository.get(id, { includeArchived: true });
    if (record.lifecycleStatus === "archived") throw new RecordArchivedError(this.recordType, id);
    return record;
  }

  protected async requireActiveRelationship<TRelated extends RecordEnvelope>(
    repository: FoundationRepository<TRelated>,
    relatedId: string,
    field: string,
  ) {
    let related: TRelated;
    try {
      related = await repository.get(relatedId, { includeArchived: true });
    } catch (error) {
      if (error instanceof RecordNotFoundError) {
        throw new MissingRelationshipError(this.recordType, field, relatedId);
      }
      throw error;
    }
    if (related.lifecycleStatus === "archived") {
      throw new ArchivedRelationshipError(this.recordType, field, relatedId);
    }
    return related;
  }

  protected async businessId(requested?: string) {
    if (requested?.trim()) {
      const normalized = requested.trim().toUpperCase();
      if (await this.repository.getByBusinessId(normalized, { includeArchived: true })) {
        throw new DuplicateBusinessIdError(this.recordType, normalized);
      }
      return normalized;
    }

    let sequence = (await this.repository.count({ includeArchived: true })) + 1;
    while (true) {
      const candidate = `${this.prefix}-${String(sequence).padStart(4, "0")}`;
      if (!(await this.repository.getByBusinessId(candidate, { includeArchived: true }))) return candidate;
      sequence += 1;
    }
  }

  protected searchText(record: TRecord) {
    return `${record.businessId} ${this.title(record)}`.toLowerCase();
  }

  protected abstract title(record: TRecord): string;
}
