# Repository contracts

Status: Governing target
Last updated: 2026-07-18

Repositories decouple domain/application services from IndexedDB. UI components and Svelte stores never access the database directly.

## Base read contract

```typescript
interface PageRequest<F> {
  filters?: F;
  search?: string;
  sort?: { field: string; direction: "asc" | "desc" }[];
  cursor?: string;
  pageSize?: number;
  includeArchived?: boolean;
}

interface Repository<T, Create, Update, Filters> {
  list(request: PageRequest<Filters>): Promise<Page<T>>;
  count(filters?: Filters): Promise<number>;
  get(id: string, options?: { includeArchived?: boolean }): Promise<T>;
  exists(id: string): Promise<boolean>;
}
```

List/query contracts use typed filters for operational entities. Unbounded reads require a documented export/report use case.

## Mutation context

```typescript
interface MutationContext {
  actorId: string;
  installationId: string;
  source: "local" | "migration" | "exchange" | "rollback";
  reason?: string;
  exchangePackageId?: string;
}

interface MutableRepository<T, Create, Update, Filters>
  extends Repository<T, Create, Update, Filters> {
  create(input: Create, context: MutationContext): Promise<T>;
  update(id: string, input: Update, expectedRevision: number, context: MutationContext): Promise<T>;
  archive(id: string, expectedRevision: number, reason: string, context: MutationContext): Promise<T>;
  restore(id: string, expectedRevision: number, context: MutationContext): Promise<T>;
}
```

Domain services orchestrate multi-repository operations within an injected transaction. A repository method must not create an incomplete cross-record state merely to fit a generic CRUD interface.

## Required semantic errors

- `RecordNotFound`.
- `ValidationError` with field/path details.
- `DependencyError` for missing/incompatible relationships.
- `ArchivedDependencyError` where active use is prohibited.
- `StaleRevisionError` with expected/current revision.
- `ConstraintError` for uniqueness/cross-record invariants.
- `StorageUnavailableError`.
- `QuotaExceededError`.
- `MigrationError`.
- `IntegrityError`.
- `ExchangeValidationError`.

Low-level DOM/IndexedDB errors are wrapped with a stable semantic code and retained diagnostic cause.

## Domain-specific contracts

### LocationRepository

- List children and ancestors.
- Resolve Site.
- Validate allowed parent types.
- Reject cycles and invalid reparenting.
- Identify descendants affected by archive/reparent.

### Chemical repositories

Separate contracts for substances, products, SDS revisions, inventory, chemical use, exposure agents, and limits. No `ChemicalRepository` may recreate the legacy combined record.

### SEGRepository and SEGMembershipRepository

- Query effective membership for a date/range.
- Detect conflicting/overlapping membership according to domain scope.
- Preserve ended memberships.

### ExposureScenarioRepository

- Query by Site/Unit, SEG, process/task, agent, condition, status, and data-quality state.
- Return assessment/monitoring/control completeness without flattening related entities into mutable scenario fields.

### Assessment and determination repositories

- Require scenario/assessment relationships.
- Query current and superseded conclusions.
- Preserve the exact revisions used for review.

### Sampling repositories

Separate plan, event, sample, result, comparison, and interpretation operations. Comparison writes require a validated versioned limit and reproducible calculation details.

### Governance repositories

Record revisions, reviews, approvals, import runs, conflict resolutions, tombstones, and data-quality findings have append-only/controlled-transition contracts. Generic update/delete is prohibited.

## Contract tests

The same contract suite runs against the production IndexedDB adapter and covers:

- CRUD/lifecycle and immutable revision writes.
- Expected-revision concurrency.
- Cross-record invariants and archived dependencies.
- Transaction rollback.
- Query/filter/index behavior.
- Migration-created records.
- Exchange attribution/idempotency.
- Storage/open/quota failure translation where simulatable.
