import { fireEvent, render, screen, within } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import type { RegisterRecord, RegisterTableColumn } from "./register-table.types";
import RegisterTable from "./RegisterTable.svelte";

interface DemoRecord extends RegisterRecord {
  name: string;
  status: "active" | "inactive";
  updatedAt: string;
}

const records: DemoRecord[] = [
  { id: "a", name: "Alpha", status: "active", updatedAt: "2026-07-09T12:00:00.000Z" },
  { id: "b", name: "Bravo", status: "inactive", updatedAt: "2026-07-09T13:00:00.000Z" },
  { id: "c", name: "Charlie", status: "active", updatedAt: "2026-07-09T14:00:00.000Z" },
];

function asDemoRecord(record: RegisterRecord) {
  return record as DemoRecord;
}

const columns: RegisterTableColumn<RegisterRecord>[] = [
  {
    key: "name",
    label: "Name",
    accessor: (record) => asDemoRecord(record).name,
    primary: true,
    sortable: true,
  },
  {
    key: "status",
    label: "Status",
    accessor: (record) => (asDemoRecord(record).status === "active" ? "Active" : "Inactive"),
    toneAccessor: (record) => asDemoRecord(record).status,
    cellKind: "status",
    sortable: true,
  },
];

function renderTable(overrides = {}) {
  return render(RegisterTable, {
    props: {
      records,
      columns,
      recordLabel: "record",
      pluralRecordLabel: "records",
      titleId: "demo-count",
      searchPlaceholder: "Search demo records",
      statusFilterLabel: "Demo status",
      statusFilterOptions: [
        { value: "active", label: "Active" },
        { value: "inactive", label: "Inactive" },
      ],
      statusAccessor: (record: RegisterRecord) => asDemoRecord(record).status,
      initialSortKey: "name",
      initialPageSize: 2,
      pageSizeOptions: [2, 3],
      ...overrides,
    },
  });
}

describe("RegisterTable", () => {
  it("searches and filters visible records", async () => {
    renderTable();

    expect(screen.getByRole("heading", { level: 2, name: "3 records" })).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search demo records")).toHaveAttribute(
      "name",
      "demo-count-search",
    );
    expect(screen.getByLabelText("Demo status")).toHaveAttribute(
      "name",
      "demo-count-status-filter",
    );

    await fireEvent.input(screen.getByPlaceholderText("Search demo records"), {
      target: { value: "charlie" },
    });

    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();

    await fireEvent.input(screen.getByPlaceholderText("Search demo records"), {
      target: { value: "" },
    });
    await fireEvent.change(screen.getByLabelText("Demo status"), {
      target: { value: "inactive" },
    });

    expect(screen.getByText("Bravo")).toBeInTheDocument();
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("sorts records and updates aria-sort", async () => {
    renderTable();

    const nameHeader = screen.getByRole("columnheader", { name: "Name ▲" });
    expect(nameHeader).toHaveAttribute("aria-sort", "ascending");

    await fireEvent.click(screen.getByRole("button", { name: "Sort by Name descending" }));

    const rows = screen.getAllByRole("row");
    expect(within(rows[1]).getByText("Charlie")).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: "Name ▼" })).toHaveAttribute(
      "aria-sort",
      "descending",
    );
  });

  it("paginates records", async () => {
    renderTable();

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.queryByText("Charlie")).not.toBeInTheDocument();
    expect(screen.getByText("Page 1 of 2")).toBeInTheDocument();
    expect(screen.getByLabelText("Rows per page")).toHaveAttribute(
      "name",
      "demo-count-page-size",
    );

    await fireEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
    expect(screen.getByText("Page 2 of 2")).toBeInTheDocument();
  });

  it("renders empty, no-match, loading, and error states", async () => {
    const onEmptyAction = vi.fn();
    const onRetry = vi.fn();

    const { rerender } = renderTable({
      records: [],
      emptyActionLabel: "Add new Record",
      onEmptyAction,
    });

    expect(screen.getByText("No records found")).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "Add new Record" }));
    expect(onEmptyAction).toHaveBeenCalledOnce();

    await rerender({
      records,
      columns,
      recordLabel: "record",
      pluralRecordLabel: "records",
      searchPlaceholder: "Search demo records",
      statusFilterOptions: [],
      initialSortKey: "name",
      initialPageSize: 2,
    });
    await fireEvent.input(screen.getByPlaceholderText("Search demo records"), {
      target: { value: "missing" },
    });
    expect(screen.getByText("Clear the current search or status filter to view records.")).toBeInTheDocument();

    await rerender({
      records,
      columns,
      recordLabel: "record",
      pluralRecordLabel: "records",
      loading: true,
      loadingMessage: "Loading demo records.",
    });
    expect(screen.getByText("Loading demo records.")).toBeInTheDocument();

    await rerender({
      records,
      columns,
      recordLabel: "record",
      pluralRecordLabel: "records",
      loading: false,
      error: "Demo load failed.",
      onRetry,
    });
    expect(screen.getByText("Demo load failed.")).toBeInTheDocument();
    await fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledOnce();
  });
});
