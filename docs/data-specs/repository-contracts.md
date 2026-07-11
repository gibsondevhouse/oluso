# Repository Contracts

This specification defines the repository pattern and contracts used by **Olùṣọ́** for data persistence.  Repositories decouple the domain logic from the underlying storage engine (SQLite) and ensure consistent access patterns, validation, and error handling.  Coding agents must never bypass the repository layer or mutate global state directly.

## Base Repository Interface

All repositories implement the following base operations for their respective entity type `T`.  Methods must return immutable copies of domain entities and must never expose internal ORM or database objects.

- **`list(filters: dict | None, page: int = 1, page_size: int = 50) -> List[T]`**
  
  Returns a paginated list of records matching optional filter criteria.  Filters are key–value pairs that map field names to exact match values.  Pagination defaults to 50 records per page and must be enforced to prevent unbounded queries.

- **`search(query: str, filters: dict | None, page: int = 1, page_size: int = 50) -> List[T]`**
  
  Performs full‑text search across designated fields.  The `query` string may include multiple terms.  Filters are applied after search results are scored.

- **`count(filters: dict | None) -> int`**
  
  Returns the total number of records matching filters (without pagination).  Used for reporting and pagination metadata.

- **`get(id: uuid) -> T`**
  
  Retrieves a single record by UUID.  Raises `RecordNotFound` if the id does not exist or if the record is archived.

- **`create(data: dict) -> uuid`**
  
  Inserts a new record.  Must validate required fields, enforce foreign‑key constraints, apply defaults, and audit metadata.  Returns the generated UUID.

- **`update(id: uuid, data: dict) -> None`**
  
  Updates an existing record.  Must merge allowed fields, validate references, and update `modified_by` and `updated_at`.  Raises `RecordNotFound` if the id does not exist.

- **`delete(id: uuid, soft: bool = True) -> None`**
  
  Soft deletes a record by setting `archived_at` when `soft=True`.  When `soft=False`, permanently removes the record only after verifying that no foreign keys depend on it.  Never cascade delete child records except in migration scripts.

- **`exists(id: uuid) -> bool`**
  
  Returns `True` if the record exists and is not archived; otherwise `False`.

- **`restore(id: uuid) -> None`**
  
  Clears `archived_at` on a soft‑deleted record.  Raises `RecordNotFound` if the id does not exist or is not archived.


## Entity‑Specific Contracts

### LocationRepository

Extends BaseRepository with hierarchical queries:

- **`list_children(parent_id: uuid | None) -> List[Location]`**: returns immediate children of a given parent, or top‑level locations when `parent_id` is `None`.
- **`get_ancestors(id: uuid) -> List[Location]`**: returns the chain of ancestors from the root to the specified location.

### ProcessRepository

Extends BaseRepository with location scoping:

- **`list_by_location(location_id: uuid) -> List[Process]`**: returns processes at a specific location.
- **`attach_hazard(process_id: uuid, hazard_id: uuid) -> None`**: associates a hazard with a process.  Must ensure hazard’s location matches the process location.
- **`detach_hazard(process_id: uuid, hazard_id: uuid) -> None`**: removes association.

### ChemicalRepository

- **`list_by_location(location_id: uuid) -> List[Chemical]`**: returns chemicals stored at a location.
- **`list_by_hazard(hazard_id: uuid) -> List[Chemical]`**: returns chemicals associated with a hazard.

### HazardRepository

- **`list_by_process(process_id: uuid) -> List[Hazard]`**: returns hazards identified in a process.
- **`list_by_seg(seg_id: uuid) -> List[Hazard]`**: returns hazards associated with a SEG.
- **`attach_control(hazard_id: uuid, control_id: uuid) -> None`**: links a control to a hazard; ensures types are appropriate.
- **`detach_control(hazard_id: uuid, control_id: uuid) -> None`**: removes association.

### SEGRepository

- **`list_by_process(process_id: uuid) -> List[SEG]`**: returns SEGs for a process.
- **`assign_hazard(seg_id: uuid, hazard_id: uuid) -> None`**: links a hazard to the SEG.  Ensures hazard belongs to a process assigned to the SEG.

### ExposureRepository

- **`list_by_seg(seg_id: uuid, start: datetime | None, end: datetime | None) -> List[Exposure]`**: returns exposure measurements for a SEG within an optional time range.
- **`list_by_hazard(hazard_id: uuid, start: datetime | None, end: datetime | None) -> List[Exposure]`**: returns exposures for a hazard.
- **`aggregate(seg_id: uuid, hazard_id: uuid, period: str) -> List[Dict]`**: returns aggregated statistics (max, min, average) grouped by day/week/month.

### ControlRepository

- **`list_by_hazard(hazard_id: uuid) -> List[Control]`**: returns controls associated with a hazard.

### FieldFindingRepository

- **`list_by_location(location_id: uuid) -> List[FieldFinding]`**: returns findings at a location.
- **`list_by_hazard(hazard_id: uuid) -> List[FieldFinding]`**: returns findings related to a hazard.

### CorrectiveActionRepository

- **`list_by_finding(finding_id: uuid) -> List[CorrectiveAction]`**: returns actions for a field finding.
- **`list_by_assigned_to(user_id: uuid) -> List[CorrectiveAction]`**: returns actions assigned to a specific user.

### ReportRepository

- **`list_by_type(report_type: str) -> List[Report]`**: returns reports of a given type.
- **`generate(report_type: str, params: dict) -> uuid`**: orchestrates a report build job, capturing relevant data and storing file assets.  The repository should interact with the reporting service rather than implement generation logic itself.

## Error Handling

All repository methods must raise semantic exceptions rather than returning `None` or generic errors.  Examples include:

- `RecordNotFound(id: uuid)`: raised when an entity is not found.
- `ValidationError(field: str, message: str)`: raised when input data fails validation.
- `ForeignKeyError(foreign_key: str, id: uuid)`: raised when a referenced record does not exist.
- `ConcurrencyError(id: uuid)`: raised when an update would overwrite more recent changes (optimistic concurrency).

Repositories must never catch and silence database errors.  They may wrap low‑level exceptions in domain‑level errors with improved context.

## Concurrency and Transactions

Updates and deletes must be wrapped in database transactions.  Repositories must implement optimistic locking by comparing record revision IDs or `updated_at` timestamps.  When a conflict is detected, raise `ConcurrencyError`.  Do not implement pessimistic locks unless there is a specific legal requirement.

## Caching and Performance

Repositories may implement read caching for frequently accessed data (e.g., lookup tables).  Caches must be invalidated on write operations.  Do not cache search results or paginated lists at this stage; prefer database indexes and query optimization.

## Testing

All repository methods require unit tests covering:

- Happy path (creating, listing, updating, deleting records).
- Validation errors (missing required fields, foreign key violations).
- Concurrency handling (update after another writer has modified the record).
- Soft delete behavior (exclusion from lists and searches).
- Pagination and search filters.

Repositories must be instantiated with a transactional test database.  Tests must reset the database state between runs to ensure isolation.