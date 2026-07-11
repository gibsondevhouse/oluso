import { describe, expect, it } from "vitest";
import type { RegisterRecord, RegisterTableColumn } from "./register-table.types";
import {
  filterRecordsBySearch,
  filterRecordsByStatus,
  formatRecordCount,
  getVisibleRegisterRows,
  paginateRecords,
  sortRecords,
} from "./register-table.utils";

interface TestRecord extends RegisterRecord {
  name: string;
  status: "active" | "inactive";
  priority: number;
}

const records: TestRecord[] = [
  { id: "1", name: "Bravo", status: "active", priority: 2 },
  { id: "2", name: "Alpha", status: "inactive", priority: 1 },
  { id: "3", name: "Charlie", status: "active", priority: 3 },
];

const columns: RegisterTableColumn<TestRecord>[] = [
  {
    key: "name",
    label: "Name",
    accessor: (record) => record.name,
    sortable: true,
  },
  {
    key: "status",
    label: "Status",
    accessor: (record) => record.status,
    sortable: true,
  },
  {
    key: "priority",
    label: "Priority",
    accessor: (record) => record.priority,
    sortable: true,
    searchable: false,
  },
];

describe("register table utilities", () => {
  it("sorts records ascending and descending", () => {
    expect(sortRecords(records, columns, "name", "asc").map((record) => record.name)).toEqual([
      "Alpha",
      "Bravo",
      "Charlie",
    ]);
    expect(sortRecords(records, columns, "priority", "desc").map((record) => record.priority)).toEqual([
      3,
      2,
      1,
    ]);
  });

  it("filters by searchable text and status", () => {
    expect(filterRecordsBySearch(records, columns, "alp")).toEqual([records[1]]);
    expect(filterRecordsByStatus(records, "active", (record) => record.status)).toEqual([
      records[0],
      records[2],
    ]);
  });

  it("combines search, status filter, and sort", () => {
    expect(
      getVisibleRegisterRows({
        records,
        columns,
        searchQuery: "",
        statusFilter: "active",
        statusAccessor: (record) => record.status,
        sortKey: "name",
        sortDirection: "desc",
      }).map((record) => record.name),
    ).toEqual(["Charlie", "Bravo"]);
  });

  it("paginates with bounded page numbers", () => {
    const firstPage = paginateRecords(records, 1, 2);
    expect(firstPage.records.map((record) => record.name)).toEqual(["Bravo", "Alpha"]);
    expect(firstPage.totalPages).toBe(2);
    expect(firstPage.startRecord).toBe(1);
    expect(firstPage.endRecord).toBe(2);

    const clampedPage = paginateRecords(records, 99, 2);
    expect(clampedPage.currentPage).toBe(2);
    expect(clampedPage.records.map((record) => record.name)).toEqual(["Charlie"]);
  });

  it("formats filtered and unfiltered count labels", () => {
    expect(formatRecordCount(2, 2, "location", "locations")).toBe("2 locations");
    expect(formatRecordCount(1, 3, "finding", "findings")).toBe("1 of 3 findings");
  });
});
