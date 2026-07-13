import type {
  RegisterFilterValue,
  RegisterRecord,
  RegisterSortDirection,
  RegisterTableColumn,
} from "./register-table.types";

export interface PaginationResult<TRecord extends RegisterRecord> {
  records: TRecord[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalRecords: number;
  startRecord: number;
  endRecord: number;
}

export function cellValueToText(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  return String(value);
}

export function compareRegisterValues(first: unknown, second: unknown): number {
  if (first === null || first === undefined) {
    return second === null || second === undefined ? 0 : 1;
  }

  if (second === null || second === undefined) {
    return -1;
  }

  const firstDate = first instanceof Date ? first.getTime() : Date.parse(String(first));
  const secondDate = second instanceof Date ? second.getTime() : Date.parse(String(second));

  if (!Number.isNaN(firstDate) && !Number.isNaN(secondDate)) {
    return firstDate - secondDate;
  }

  if (typeof first === "number" && typeof second === "number") {
    return first - second;
  }

  return String(first).localeCompare(String(second), undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function filterRecordsBySearch<TRecord extends RegisterRecord>(
  records: TRecord[],
  columns: RegisterTableColumn<TRecord>[],
  searchQuery: string,
): TRecord[] {
  const query = searchQuery.trim().toLowerCase();

  if (!query) {
    return records;
  }

  const searchableColumns = columns.filter((column) => column.searchable !== false);

  return records.filter((record) =>
    searchableColumns.some((column) => {
      const value = cellValueToText(column.accessor(record));
      const description = cellValueToText(column.descriptionAccessor?.(record));
      return `${value} ${description}`.toLowerCase().includes(query);
    }),
  );
}

export function filterRecordsByStatus<TRecord extends RegisterRecord>(
  records: TRecord[],
  statusFilter: string,
  statusAccessor?: (record: TRecord) => string,
): TRecord[] {
  if (!statusFilter || !statusAccessor) {
    return records;
  }

  return records.filter((record) => statusAccessor(record) === statusFilter);
}

export function filterRecordsByValue<TRecord extends RegisterRecord>(
  records: TRecord[],
  filterValue: string,
  accessor?: (record: TRecord) => RegisterFilterValue,
): TRecord[] {
  if (!filterValue || !accessor) {
    return records;
  }

  return records.filter((record) => {
    const value = accessor(record);
    return Array.isArray(value) ? value.includes(filterValue) : value === filterValue;
  });
}

export function sortRecords<TRecord extends RegisterRecord>(
  records: TRecord[],
  columns: RegisterTableColumn<TRecord>[],
  sortKey: string,
  sortDirection: RegisterSortDirection,
): TRecord[] {
  const column = columns.find((candidate) => candidate.key === sortKey && candidate.sortable);

  if (!column) {
    return [...records];
  }

  const direction = sortDirection === "asc" ? 1 : -1;

  return [...records].sort((first, second) => {
    const accessor = column.sortAccessor ?? column.accessor;
    return compareRegisterValues(accessor(first), accessor(second)) * direction;
  });
}

export function getVisibleRegisterRows<TRecord extends RegisterRecord>({
  records,
  columns,
  searchQuery,
  statusFilter,
  statusAccessor,
  extraFilter,
  extraFilterAccessor,
  sortKey,
  sortDirection,
}: {
  records: TRecord[];
  columns: RegisterTableColumn<TRecord>[];
  searchQuery: string;
  statusFilter: string;
  statusAccessor?: (record: TRecord) => string;
  extraFilter?: string;
  extraFilterAccessor?: (record: TRecord) => RegisterFilterValue;
  sortKey: string;
  sortDirection: RegisterSortDirection;
}): TRecord[] {
  return sortRecords(
    filterRecordsByValue(
      filterRecordsByStatus(
        filterRecordsBySearch(records, columns, searchQuery),
        statusFilter,
        statusAccessor,
      ),
      extraFilter ?? "",
      extraFilterAccessor,
    ),
    columns,
    sortKey,
    sortDirection,
  );
}

export function clampPage(page: number, totalPages: number): number {
  if (totalPages <= 1) {
    return 1;
  }

  return Math.min(Math.max(page, 1), totalPages);
}

export function paginateRecords<TRecord extends RegisterRecord>(
  records: TRecord[],
  page: number,
  pageSize: number,
): PaginationResult<TRecord> {
  const normalizedPageSize = Math.max(1, pageSize);
  const totalRecords = records.length;
  const totalPages = Math.max(1, Math.ceil(totalRecords / normalizedPageSize));
  const currentPage = clampPage(page, totalPages);
  const startIndex = (currentPage - 1) * normalizedPageSize;
  const pageRecords = records.slice(startIndex, startIndex + normalizedPageSize);

  return {
    records: pageRecords,
    currentPage,
    pageSize: normalizedPageSize,
    totalPages,
    totalRecords,
    startRecord: totalRecords === 0 ? 0 : startIndex + 1,
    endRecord: Math.min(startIndex + pageRecords.length, totalRecords),
  };
}

export function formatRecordCount(count: number, total: number, singular: string, plural: string): string {
  const label = total === 1 ? singular : plural;

  if (count === total) {
    return `${total} ${label}`;
  }

  return `${count} of ${total} ${label}`;
}
