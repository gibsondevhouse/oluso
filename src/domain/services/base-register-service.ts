import type {
  DomainValidationResult,
  IdentifiedLifecycleRecord,
  MaybePromise,
  RegisterListOptions,
  RegisterRepository,
  TransactionCoordinator,
} from "../contracts";
import {
  ArchiveError,
  DomainError,
  DuplicateRecordError,
  RecordNotFoundError,
  RelationshipError,
  RepositoryError,
  RestoreError,
  ValidationError,
} from "../errors";

type FieldErrors<TInput extends object> = Partial<Record<keyof TInput | string, string>>;

function compactErrors<TInput extends object>(errors: FieldErrors<TInput>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(errors).filter((entry): entry is [string, string] => Boolean(entry[1])),
  );
}

function firstError(errors: Record<string, string>, fallback: string) {
  return Object.values(errors)[0] ?? fallback;
}

function inputId(input: object) {
  const value = (input as { id?: unknown }).id;
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isPromiseLike<T>(value: MaybePromise<T>): value is Promise<T> {
  return typeof (value as Promise<T>)?.then === "function";
}

function searchableRecordText(record: object) {
  return Object.values(record)
    .flatMap((value) => (Array.isArray(value) ? value : [value]))
    .filter((value): value is string | number | boolean => {
      return typeof value === "string" || typeof value === "number" || typeof value === "boolean";
    })
    .join(" ")
    .toLowerCase();
}

export abstract class BaseRegisterService<
  TRecord extends IdentifiedLifecycleRecord,
  TInput extends object,
> {
  protected constructor(
    protected readonly repository: RegisterRepository<TRecord, TInput>,
    private readonly recordLabel: string,
    private readonly transactionCoordinator?: TransactionCoordinator,
  ) {}

  create(input: TInput): MaybePromise<TRecord> {
    this.assertValidForWrite(input);
    this.assertNoDuplicateInputId(input);
    return this.withRepositoryErrors(() =>
      this.runInTransaction(() => this.repository.create(input)),
    );
  }

  update(id: string, input: TInput): MaybePromise<TRecord> {
    this.requireExistingRecord(id);
    this.assertValidForWrite(input, id);
    return this.withRepositoryErrors(() =>
      this.runInTransaction(() => this.repository.update(id, input)),
    );
  }

  archive(id: string, reason?: string): MaybePromise<TRecord> {
    const record = this.requireExistingRecord(id);
    if (record.lifecycleStatus === "archived") {
      throw new ArchiveError(`${this.recordLabel} is already archived.`, { id });
    }

    return this.withRepositoryErrors(() =>
      this.runInTransaction(() => this.repository.archive(id, reason)),
    );
  }

  restore(id: string): MaybePromise<TRecord> {
    const record = this.requireExistingRecord(id);
    if (record.lifecycleStatus === "active") {
      throw new RestoreError(`${this.recordLabel} is already active.`, { id });
    }

    return this.withRepositoryErrors(() =>
      this.runInTransaction(() => this.repository.restore(id)),
    );
  }

  delete(id: string): MaybePromise<void> {
    if (!this.repository.delete) {
      throw new RepositoryError(`${this.recordLabel} deletion is not supported.`);
    }

    this.requireExistingRecord(id);
    return this.withRepositoryErrors(() => this.runInTransaction(() => this.repository.delete?.(id)));
  }

  getById(id: string): TRecord {
    return this.requireExistingRecord(id);
  }

  list(options: RegisterListOptions = {}): TRecord[] {
    try {
      return this.repository.list(options);
    } catch (error) {
      throw this.toRepositoryError(error);
    }
  }

  search(query: string, options: RegisterListOptions = {}): TRecord[] {
    const normalizedQuery = query.trim().toLowerCase();
    const records = this.list(options);

    if (!normalizedQuery) {
      return records;
    }

    return records.filter((record) => searchableRecordText(record).includes(normalizedQuery));
  }

  validate(input: TInput): DomainValidationResult<TInput> {
    const errors: Record<string, string | undefined> = { ...this.validateInput(input) };

    try {
      this.validateRelationships(input);
    } catch (error) {
      if (error instanceof RelationshipError || error instanceof ValidationError) {
        errors["_relationship"] = error.message;
      } else {
        throw error;
      }
    }

    return {
      valid: Object.keys(compactErrors(errors)).length === 0,
      errors: errors as FieldErrors<TInput>,
    };
  }

  protected abstract validateInput(input: TInput): FieldErrors<TInput>;

  protected validateRelationships(_input: TInput, _existingId?: string): void {}

  protected ensureRelatedRecord<TLinkedRecord extends IdentifiedLifecycleRecord>(
    repository: Pick<RegisterRepository<TLinkedRecord, object>, "getById">,
    id: string,
    label: string,
    required = false,
  ) {
    const trimmedId = id.trim();

    if (!trimmedId) {
      if (required) {
        throw new RelationshipError(`${label} is required.`);
      }
      return null;
    }

    const record = repository.getById(trimmedId);

    if (!record) {
      throw new RelationshipError(`${label} was not found.`);
    }

    if (record.lifecycleStatus === "archived") {
      throw new RelationshipError(`${label} is archived and cannot be linked.`);
    }

    return record;
  }

  protected ensureRelatedRecords<TLinkedRecord extends IdentifiedLifecycleRecord>(
    repository: Pick<RegisterRepository<TLinkedRecord, object>, "getById">,
    ids: string[],
    label: string,
  ) {
    const normalizedIds = ids.map((id) => id.trim()).filter(Boolean);
    if (new Set(normalizedIds).size !== normalizedIds.length) {
      throw new RelationshipError(`${label} contains duplicate relationships.`);
    }

    for (const id of normalizedIds) {
      this.ensureRelatedRecord(repository, id, label);
    }
  }

  private assertValidForWrite(input: TInput, existingId?: string) {
    const errors = compactErrors(this.validateInput(input));
    if (Object.keys(errors).length > 0) {
      throw new ValidationError(firstError(errors, `${this.recordLabel} is invalid.`), errors);
    }

    this.validateRelationships(input, existingId);
  }

  private assertNoDuplicateInputId(input: TInput) {
    const id = inputId(input);

    if (id && this.repository.getById(id)) {
      throw new DuplicateRecordError(`Record ID ${id} already exists.`, { id });
    }
  }

  private requireExistingRecord(id: string) {
    if (!id.trim()) {
      throw new ValidationError("Record ID is required.", { id: "Record ID is required." });
    }

    const record = this.repository.getById(id);
    if (!record) {
      throw new RecordNotFoundError(`${this.recordLabel} was not found.`, { id });
    }

    return record;
  }

  private runInTransaction<T>(operation: () => MaybePromise<T>): MaybePromise<T> {
    return this.transactionCoordinator?.runInTransaction(operation) ?? operation();
  }

  private withRepositoryErrors<T>(operation: () => MaybePromise<T>): MaybePromise<T> {
    try {
      const result = operation();
      if (isPromiseLike(result)) {
        return result.catch((error: unknown) => {
          if (error instanceof DomainError) {
            throw error;
          }

          throw this.toRepositoryError(error);
        });
      }

      return result;
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }

      throw this.toRepositoryError(error);
    }
  }

  private toRepositoryError(error: unknown) {
    return new RepositoryError(error instanceof Error ? error.message : String(error), error);
  }
}
