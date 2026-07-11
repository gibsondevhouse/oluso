<script lang="ts" generics="TRecord extends RegisterRecord">
  import RegisterState from "$lib/components/register/RegisterState.svelte";
  import StatusPill from "$lib/components/ui/StatusPill.svelte";
  import type {
    RegisterRecord,
    RegisterSortDirection,
    RegisterStatusOption,
    RegisterTableAction,
    RegisterTableColumn,
  } from "./register-table.types";
  import {
    cellValueToText,
    clampPage,
    formatRecordCount,
    getVisibleRegisterRows,
    paginateRecords,
  } from "./register-table.utils";

  interface Props {
    records: TRecord[];
    columns: RegisterTableColumn<TRecord>[];
    recordLabel: string;
    pluralRecordLabel?: string;
    actions?: RegisterTableAction<TRecord>[];
    onRowOpen?: (record: TRecord) => void;
    titleId?: string;
    searchPlaceholder?: string;
    statusFilterLabel?: string;
    statusFilterOptions?: RegisterStatusOption[];
    statusAccessor?: (record: TRecord) => string;
    initialSortKey?: string;
    initialSortDirection?: RegisterSortDirection;
    initialPageSize?: number;
    pageSizeOptions?: number[];
    loading?: boolean;
    loadingMessage?: string;
    error?: string | null;
    onRetry?: () => void;
    emptyMessage?: string;
    emptyActionLabel?: string;
    onEmptyAction?: () => void;
  }

  let {
    records,
    columns,
    recordLabel,
    pluralRecordLabel,
    actions = [],
    onRowOpen,
    titleId = "register-count",
    searchPlaceholder = "Search records",
    statusFilterLabel = "Status",
    statusFilterOptions = [],
    statusAccessor,
    initialSortKey,
    initialSortDirection = "asc",
    initialPageSize = 5,
    pageSizeOptions = [5, 10, 25],
    loading = false,
    loadingMessage = "Loading register records.",
    error = null,
    onRetry,
    emptyMessage = "Add the first record to start using this register.",
    emptyActionLabel,
    onEmptyAction,
  }: Props = $props();

  let searchQuery = $state("");
  let statusFilter = $state("");
  let sortKey = $state(getInitialSortKey());
  let sortDirection = $state<RegisterSortDirection>(getInitialSortDirection());
  let currentPage = $state(1);
  let pageSize = $state(getInitialPageSize());

  const pluralLabel = $derived(pluralRecordLabel ?? `${recordLabel}s`);
  const visibleRecords = $derived(
    getVisibleRegisterRows({
      records,
      columns,
      searchQuery,
      statusFilter,
      statusAccessor,
      sortKey,
      sortDirection,
    }),
  );
  const page = $derived(paginateRecords(visibleRecords, currentPage, pageSize));
  const countText = $derived(formatRecordCount(visibleRecords.length, records.length, recordLabel, pluralLabel));
  const hasFilters = $derived(Boolean(searchQuery.trim() || statusFilter));

  function getInitialSortKey() {
    return initialSortKey ?? columns.find((column) => column.sortable)?.key ?? "";
  }

  function getInitialSortDirection() {
    return initialSortDirection;
  }

  function getInitialPageSize() {
    return initialPageSize;
  }

  function getControlId(controlName: string) {
    return `${titleId}-${controlName}`.replace(/[^a-zA-Z0-9_-]/g, "-");
  }

  $effect(() => {
    const nextPage = clampPage(currentPage, page.totalPages);
    if (currentPage !== nextPage) {
      currentPage = nextPage;
    }
  });

  function resetToFirstPage() {
    currentPage = 1;
  }

  function updateSearch(event: Event) {
    searchQuery = (event.currentTarget as HTMLInputElement).value;
    resetToFirstPage();
  }

  function updateStatusFilter(event: Event) {
    statusFilter = (event.currentTarget as HTMLSelectElement).value;
    resetToFirstPage();
  }

  function updatePageSize(event: Event) {
    pageSize = Number((event.currentTarget as HTMLSelectElement).value);
    resetToFirstPage();
  }

  function clearFilters() {
    searchQuery = "";
    statusFilter = "";
    resetToFirstPage();
  }

  function toggleSort(column: RegisterTableColumn<TRecord>) {
    if (!column.sortable) {
      return;
    }

    if (sortKey === column.key) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
    } else {
      sortKey = column.key;
      sortDirection = "asc";
    }

    resetToFirstPage();
  }

  function getAriaSort(column: RegisterTableColumn<TRecord>) {
    if (!column.sortable || sortKey !== column.key) {
      return "none";
    }

    return sortDirection === "asc" ? "ascending" : "descending";
  }

  function getSortLabel(column: RegisterTableColumn<TRecord>) {
    if (!column.sortable) {
      return column.label;
    }

    if (sortKey !== column.key) {
      return `Sort by ${column.label}`;
    }

    return `Sort by ${column.label} ${sortDirection === "asc" ? "descending" : "ascending"}`;
  }

  function getSortIndicator(column: RegisterTableColumn<TRecord>) {
    if (!column.sortable || sortKey !== column.key) {
      return "";
    }

    return sortDirection === "asc" ? " ▲" : " ▼";
  }

  function getActionClass(action: RegisterTableAction<TRecord>) {
    if (action.variant === "primary") {
      return "button-link";
    }

    if (action.variant === "danger") {
      return "danger-button";
    }

    return "secondary-button";
  }

  function openRow(record: TRecord) {
    onRowOpen?.(record);
  }

  function openRowFromKeyboard(event: KeyboardEvent, record: TRecord) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    openRow(record);
  }
</script>

<section class="register-panel" aria-labelledby={titleId}>
  <div class="register-toolbar register-table-toolbar">
    <div>
      <h2 id={titleId}>{countText}</h2>
      {#if records.length > 0}
        <span class="register-meta">
          Showing {page.startRecord}-{page.endRecord} of {visibleRecords.length}
        </span>
      {/if}
    </div>

    <div class="register-table-controls">
      <label class="toolbar-control">
        <span>Search</span>
        <input
          id={getControlId("search")}
          name={getControlId("search")}
          class="toolbar-input"
          placeholder={searchPlaceholder}
          value={searchQuery}
          oninput={updateSearch}
        />
      </label>

      {#if statusFilterOptions.length > 0}
        <label class="toolbar-control">
          <span>{statusFilterLabel}</span>
          <select
            id={getControlId("status-filter")}
            name={getControlId("status-filter")}
            class="toolbar-input"
            aria-label={statusFilterLabel}
            value={statusFilter}
            onchange={updateStatusFilter}
          >
            <option value="">All statuses</option>
            {#each statusFilterOptions as option}
              <option value={option.value}>{option.label}</option>
            {/each}
          </select>
        </label>
      {/if}
    </div>
  </div>

  {#if loading}
    <RegisterState title="Loading records" message={loadingMessage} live />
  {:else if error}
    <RegisterState
      title="Records could not load"
      message={error}
      secondaryActionLabel={onRetry ? "Retry" : undefined}
      onSecondaryAction={onRetry}
    />
  {:else if visibleRecords.length === 0}
    <RegisterState
      title="No records found"
      message={hasFilters ? "Clear the current search or status filter to view records." : emptyMessage}
      primaryActionLabel={!hasFilters ? emptyActionLabel : undefined}
      onPrimaryAction={!hasFilters ? onEmptyAction : undefined}
      secondaryActionLabel={hasFilters ? "Clear filters" : undefined}
      onSecondaryAction={hasFilters ? clearFilters : undefined}
    />
  {:else}
    <div class="table-wrap">
      <table class="register-table">
        <thead>
          <tr>
            {#each columns as column (column.key)}
              <th
                scope="col"
                aria-sort={column.sortable ? getAriaSort(column) : undefined}
                style:width={column.width}
              >
                {#if column.sortable}
                  <button
                    class="sort-button"
                    type="button"
                    aria-label={getSortLabel(column)}
                    onclick={() => toggleSort(column)}
                  >
                    {column.label}{getSortIndicator(column)}
                  </button>
                {:else}
                  {column.label}
                {/if}
              </th>
            {/each}
            {#if actions.length > 0}
              <th scope="col">Actions</th>
            {/if}
          </tr>
        </thead>
        <tbody>
          {#each page.records as record (record.id)}
            <tr
              class:clickable-row={Boolean(onRowOpen)}
              tabindex={onRowOpen ? 0 : undefined}
              aria-label={onRowOpen ? `Open record ${record.id}` : undefined}
              onclick={() => openRow(record)}
              onkeydown={(event) => openRowFromKeyboard(event, record)}
            >
              {#each columns as column (column.key)}
                {@const cellValue = cellValueToText(column.accessor(record))}
                {@const description = column.descriptionAccessor?.(record)}
                <td>
                  {#if column.cellKind === "status"}
                    <StatusPill
                      label={cellValue}
                      tone={column.toneAccessor?.(record) ?? cellValue}
                      context={column.label}
                      compact
                    />
                  {:else if column.primary}
                    <strong>{cellValue}</strong>
                    {#if description}
                      <span>{description}</span>
                    {/if}
                  {:else}
                    {cellValue}
                  {/if}
                </td>
              {/each}
              {#if actions.length > 0}
                <td>
                  <div class="row-actions">
                    {#each actions as action}
                      <button
                        class={getActionClass(action)}
                        type="button"
                        onclick={(event) => {
                          event.stopPropagation();
                          action.onSelect(record);
                        }}
                      >
                        {action.label}
                      </button>
                    {/each}
                  </div>
                </td>
              {/if}
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    {#if page.totalPages > 1}
      <nav class="pagination-controls" aria-label={`${pluralLabel} pages`}>
        <button
          class="secondary-button"
          type="button"
          disabled={page.currentPage === 1}
          onclick={() => (currentPage = page.currentPage - 1)}
        >
          Previous
        </button>
        <span>Page {page.currentPage} of {page.totalPages}</span>
        <button
          class="secondary-button"
          type="button"
          disabled={page.currentPage === page.totalPages}
          onclick={() => (currentPage = page.currentPage + 1)}
        >
          Next
        </button>
        <label class="page-size-control">
          <span>Rows per page</span>
          <select
            id={getControlId("page-size")}
            name={getControlId("page-size")}
            aria-label="Rows per page"
            value={pageSize}
            onchange={updatePageSize}
          >
            {#each pageSizeOptions as option}
              <option value={option}>{option}</option>
            {/each}
          </select>
        </label>
      </nav>
    {/if}
  {/if}
</section>

<style>
  .register-table-toolbar {
    align-items: flex-start;
  }

  .register-table-controls {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 10px;
  }

  .toolbar-control {
    display: grid;
    width: min(220px, 100%);
    gap: 6px;
    color: var(--color-muted);
    font-size: 0.75rem;
    font-weight: 700;
  }

  .row-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .clickable-row {
    cursor: pointer;
  }

  .clickable-row:hover {
    background: var(--color-hover);
  }

  .pagination-controls {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 10px;
    color: var(--color-muted);
    font-size: 0.8125rem;
  }

  .pagination-controls button:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  .page-size-control {
    display: flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
  }

  .page-size-control select {
    border: 1px solid var(--color-border-strong);
    border-radius: 6px;
    background: var(--color-surface);
    color: var(--color-text);
    padding: 6px 8px;
  }

  @media (max-width: 720px) {
    .register-table-controls {
      justify-content: flex-start;
      width: 100%;
    }

    .toolbar-control {
      width: 100%;
    }

    .page-size-control {
      margin-left: 0;
    }
  }
</style>
