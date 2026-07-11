<script lang="ts">
  import { onMount } from "svelte";
  import { olusoApplication } from "../../application/oluso-application";
  import RegisterPageHeader from "$lib/components/register/RegisterPageHeader.svelte";
  import RegisterState from "$lib/components/register/RegisterState.svelte";
  import StatusPill from "$lib/components/ui/StatusPill.svelte";
  import {
    correctiveActionRecords,
    findingRecords,
    locationRecords,
    getPersistenceStatusLabel,
    persistenceDiagnostics,
  } from "$lib/persistence/local-persistence";
  import type {
    CorrectiveActionInput,
    CorrectiveActionRecord,
    CorrectiveActionStatus,
    CorrectiveActionPriority,
    CorrectiveActionType,
  } from "$lib/persistence/corrective-action.types";
  import {
    CORRECTIVE_ACTION_STATUSES,
    CORRECTIVE_ACTION_PRIORITIES,
    CORRECTIVE_ACTION_TYPES,
    getCorrectiveActionStatusTone,
    getCorrectiveActionPriorityTone,
  } from "$lib/persistence/corrective-action.types";
  import { formatTimestamp } from "$lib/utils/date";

  type FormMode = "closed" | "create" | "edit";
  type SortKey = "priority" | "title" | "finding" | "assignedTo" | "status" | "dueDate" | "updatedAt";
  type SortDirection = "asc" | "desc";
  type ActionFormState = Omit<CorrectiveActionInput, "priority" | "status" | "type"> & {
    type: CorrectiveActionType | "";
    priority: CorrectiveActionPriority | "";
    status: CorrectiveActionStatus | "";
  };

  interface Props {
    autoInitialize?: boolean;
  }

  let { autoInitialize = true }: Props = $props();
  let formMode = $state<FormMode>("closed");
  let editingAction = $state<CorrectiveActionRecord | null>(null);
  let form = $state<ActionFormState>(createEmptyForm());
  let fieldErrors = $state<Partial<Record<keyof CorrectiveActionInput, string>>>({});
  let pageError = $state<string | null>(null);
  let searchQuery = $state("");
  let filterStatus = $state<CorrectiveActionStatus | "">("");
  let sortKey = $state<SortKey>("dueDate");
  let sortDirection = $state<SortDirection>("asc");

  const statusLabel = $derived(getPersistenceStatusLabel($persistenceDiagnostics.status));
  const persistenceTone = $derived(
    $persistenceDiagnostics.status === "not_configured" ? "neutral" : $persistenceDiagnostics.status,
  );
  const locationNameById = $derived(
    new Map($locationRecords.map((l) => [l.id, l.name])),
  );
  const findingById = $derived(
    new Map($findingRecords.map((f) => [f.id, f])),
  );
  const visibleActions = $derived(getVisibleActions());
  const openCount = $derived($correctiveActionRecords.filter((a) => a.status === "Created").length);
  const inProgressCount = $derived($correctiveActionRecords.filter((a) => a.status === "In Progress").length);
  const closedCount = $derived($correctiveActionRecords.filter((a) => a.status === "Closed" || a.status === "Verified").length);

  function createEmptyForm(): ActionFormState {
    return {
      title: "",
      type: "Other",
      description: "",
      findingId: "",
      sourceType: "Finding",
      sourceId: "",
      sourceJustification: "",
      assignedTo: "",
      priority: "",
      status: "Created",
      dueDate: "",
      completionSummary: "",
      verificationRequired: true,
      verificationMethod: "",
      verificationResult: "",
      evidenceReference: "",
      closureNotes: "",
    };
  }

  async function initializePage() {
    pageError = null;
    try {
      if ($persistenceDiagnostics.status !== "ready") {
        await olusoApplication.initialize();
      } else {
        olusoApplication.listLocations();
        olusoApplication.listFindings();
        olusoApplication.listCorrectiveActions();
      }
    } catch (error) {
      pageError = error instanceof Error ? error.message : String(error);
    }
  }

  function startCreate(prefillFindingId?: string) {
    pageError = null;
    fieldErrors = {};
    editingAction = null;
    form = {
      ...createEmptyForm(),
      findingId: prefillFindingId ?? $findingRecords[0]?.id ?? "",
      sourceId: prefillFindingId ?? $findingRecords[0]?.id ?? "",
    };
    formMode = "create";
  }

  function startEdit(action: CorrectiveActionRecord) {
    pageError = null;
    fieldErrors = {};
    editingAction = action;
    form = {
      title: action.title,
      type: action.type,
      description: action.description,
      findingId: action.findingId,
      sourceType: action.sourceType,
      sourceId: action.sourceId,
      sourceJustification: action.sourceJustification,
      assignedTo: action.assignedTo,
      priority: action.priority,
      status: action.status,
      dueDate: action.dueDate,
      completionSummary: action.completionSummary,
      verificationRequired: action.verificationRequired,
      verificationMethod: action.verificationMethod,
      verificationResult: action.verificationResult,
      evidenceReference: action.evidenceReference,
      closureNotes: action.closureNotes,
    };
    formMode = "edit";
  }

  function closeForm() {
    pageError = null;
    fieldErrors = {};
    editingAction = null;
    form = createEmptyForm();
    formMode = "closed";
  }

  function normalizeForm(): CorrectiveActionInput {
    return {
      ...form,
      type: (form.type || "Other") as CorrectiveActionType,
      priority: form.priority || ("Medium" as CorrectiveActionPriority),
      status: form.status || ("Created" as CorrectiveActionStatus),
      sourceType: form.sourceType || "Finding",
      sourceId: form.sourceId || form.findingId,
    };
  }

  function submitAction() {
    pageError = null;
    const input = normalizeForm();
    const validation = olusoApplication.validateCorrectiveAction(input);
    const nextErrors = { ...validation.errors };

    if (!form.type) nextErrors.type = "Corrective action type is required.";
    if (!form.priority) nextErrors.priority = "Priority is required.";
    if (!form.status) nextErrors.status = "Status is required.";

    fieldErrors = nextErrors;

    if (!validation.valid || Object.keys(nextErrors).length > 0) {
      pageError = "Fix the highlighted fields before saving the corrective action.";
      return;
    }

    try {
      if (formMode === "edit" && editingAction) {
        olusoApplication.updateCorrectiveAction(editingAction.id, input);
      } else {
        olusoApplication.createCorrectiveAction(input);
      }
      closeForm();
    } catch (error) {
      pageError = error instanceof Error ? error.message : String(error);
    }
  }

  function toggleSort(nextKey: SortKey) {
    if (sortKey === nextKey) {
      sortDirection = sortDirection === "asc" ? "desc" : "asc";
      return;
    }
    sortKey = nextKey;
    sortDirection = nextKey === "dueDate" ? "asc" : nextKey === "updatedAt" ? "desc" : "asc";
  }

  function getSortLabel(key: SortKey, label: string) {
    if (sortKey !== key) return label;
    return `${label} ${sortDirection === "asc" ? "▲" : "▼"}`;
  }

  function getFindingLabel(findingId: string): string {
    const f = findingById.get(findingId);
    if (!f) return "Unknown finding";
    return f.title;
  }

  function getFindingLocation(findingId: string): string {
    const f = findingById.get(findingId);
    if (!f) return "";
    return locationNameById.get(f.locationId) ?? "";
  }

  function isOverdue(action: CorrectiveActionRecord): boolean {
    if (["Verified", "Closed", "Canceled"].includes(action.status)) return false;
    if (!action.dueDate) return false;
    return new Date(action.dueDate) < new Date();
  }

  function getVisibleActions() {
    const query = searchQuery.trim().toLowerCase();
    const priorityRank: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };
    const statusRank: Record<string, number> = {
      Created: 1,
      Assigned: 2,
      "In Progress": 3,
      Completed: 4,
      Verified: 5,
      Closed: 6,
      Deferred: 7,
      Reopened: 8,
      Blocked: 9,
      Canceled: 10,
    };

    return $correctiveActionRecords
      .filter((a) => {
        if (filterStatus && a.status !== filterStatus) return false;
        if (!query) return true;
        const findingTitle = getFindingLabel(a.findingId);
        return [a.title, a.description, a.assignedTo, a.priority, a.status, findingTitle]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const dir = sortDirection === "asc" ? 1 : -1;
        if (sortKey === "priority") return ((priorityRank[a.priority] ?? 0) - (priorityRank[b.priority] ?? 0)) * dir;
        if (sortKey === "title") return a.title.localeCompare(b.title) * dir;
        if (sortKey === "finding") return getFindingLabel(a.findingId).localeCompare(getFindingLabel(b.findingId)) * dir;
        if (sortKey === "assignedTo") return a.assignedTo.localeCompare(b.assignedTo) * dir;
        if (sortKey === "status") return ((statusRank[a.status] ?? 0) - (statusRank[b.status] ?? 0)) * dir;
        if (sortKey === "dueDate") return a.dueDate.localeCompare(b.dueDate) * dir;
        return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir;
      });
  }

  onMount(() => {
    if (autoInitialize) void initializePage();
  });
</script>

<section class="page" aria-labelledby="ca-title">
  <RegisterPageHeader
    breadcrumbs="Actions"
    title="Corrective Actions"
    titleId="ca-title"
    summary="Manage corrective actions linked to findings, track status transitions and due dates."
    statusLabel={statusLabel}
    statusTone={persistenceTone}
    primaryActionLabel="New Action"
    onPrimaryAction={() => startCreate()}
  />

  {#if pageError}
    <p class="error-message">{pageError}</p>
  {/if}

  {#if formMode !== "closed"}
    <form
      class="record-form"
      aria-label={formMode === "edit" ? "Edit corrective action" : "New corrective action"}
      onsubmit={(e) => { e.preventDefault(); submitAction(); }}
    >
      <div class="form-header">
        <h2>{formMode === "edit" ? "Edit Corrective Action" : "New Corrective Action"}</h2>
        {#if editingAction}
          <span class="form-context">{editingAction.id}</span>
        {/if}
      </div>

      <label>
        <span>Title</span>
        <input
          aria-invalid={fieldErrors.title ? "true" : "false"}
          aria-describedby={fieldErrors.title ? "ca-title-error" : undefined}
          bind:value={form.title}
        />
      </label>
      {#if fieldErrors.title}
        <p class="field-error" id="ca-title-error">{fieldErrors.title}</p>
      {/if}

      <label>
        <span>Action Type</span>
        <select
          aria-invalid={fieldErrors.type ? "true" : "false"}
          aria-describedby={fieldErrors.type ? "ca-type-error" : undefined}
          bind:value={form.type}
        >
          <option value="">Select action type</option>
          {#each CORRECTIVE_ACTION_TYPES as type}
            <option value={type}>{type}</option>
          {/each}
        </select>
      </label>
      {#if fieldErrors.type}
        <p class="field-error" id="ca-type-error">{fieldErrors.type}</p>
      {/if}

      <label>
        <span>Linked Finding</span>
        <select
          aria-invalid={fieldErrors.findingId ? "true" : "false"}
          aria-describedby={fieldErrors.findingId ? "ca-finding-error" : undefined}
          bind:value={form.findingId}
        >
          <option value="">Select finding</option>
          {#each $findingRecords as finding (finding.id)}
            <option value={finding.id}>{finding.title} ({finding.severity})</option>
          {/each}
        </select>
      </label>
      {#if fieldErrors.findingId}
        <p class="field-error" id="ca-finding-error">{fieldErrors.findingId}</p>
      {/if}

      <div class="form-grid">
        <label>
          <span>Priority</span>
          <select
            aria-invalid={fieldErrors.priority ? "true" : "false"}
            bind:value={form.priority}
          >
            <option value="">Select priority</option>
            {#each CORRECTIVE_ACTION_PRIORITIES as p}
              <option value={p}>{p}</option>
            {/each}
          </select>
        </label>
        {#if fieldErrors.priority}
          <p class="field-error">{fieldErrors.priority}</p>
        {/if}

        <label>
          <span>Status</span>
          <select bind:value={form.status}>
            {#each CORRECTIVE_ACTION_STATUSES as s}
              <option value={s}>{s}</option>
            {/each}
          </select>
        </label>
      </div>

      <div class="form-grid">
        <label>
          <span>Assigned To</span>
          <input
            aria-invalid={fieldErrors.assignedTo ? "true" : "false"}
            aria-describedby={fieldErrors.assignedTo ? "ca-assigned-error" : undefined}
            bind:value={form.assignedTo}
          />
        </label>
        {#if fieldErrors.assignedTo}
          <p class="field-error" id="ca-assigned-error">{fieldErrors.assignedTo}</p>
        {/if}

        <label>
          <span>Due Date</span>
          <input
            type="date"
            aria-invalid={fieldErrors.dueDate ? "true" : "false"}
            aria-describedby={fieldErrors.dueDate ? "ca-due-error" : undefined}
            bind:value={form.dueDate}
          />
        </label>
        {#if fieldErrors.dueDate}
          <p class="field-error" id="ca-due-error">{fieldErrors.dueDate}</p>
        {/if}
      </div>

      <label>
        <span>Description</span>
        <textarea rows="3" bind:value={form.description}></textarea>
      </label>

      <label>
        <span>Evidence / Reference</span>
        <textarea rows="3" bind:value={form.evidenceReference}></textarea>
      </label>

      {#if form.status === "Closed"}
        <label>
          <span>Closure Notes</span>
          <textarea rows="3" placeholder="Describe how the action was resolved..." bind:value={form.closureNotes}></textarea>
        </label>
      {/if}

      <div class="action-row">
        <button class="button-link" type="submit">Save action</button>
        <button class="secondary-button" type="button" onclick={closeForm}>Cancel</button>
      </div>
    </form>
  {/if}

  {#if $persistenceDiagnostics.status === "loading"}
    <RegisterState title="Loading corrective actions" message="Initializing local persistence and reading the Corrective Actions register." live />
  {:else if $persistenceDiagnostics.status === "not_configured"}
    <RegisterState
      title="Persistence is not configured"
      message="Corrective actions cannot be read or saved until local persistence initializes."
      secondaryActionLabel="Initialize persistence"
      onSecondaryAction={initializePage}
    />
  {:else if $persistenceDiagnostics.status === "error"}
    <RegisterState
      title="Corrective actions could not load"
      message={$persistenceDiagnostics.lastError ?? "Local persistence reported an error."}
      secondaryActionLabel="Retry"
      onSecondaryAction={initializePage}
    />
  {:else if $correctiveActionRecords.length === 0}
    <RegisterState
      title="No corrective actions yet"
      message="Corrective actions are linked to findings and track remediation through created, in-progress, verified, and closed states."
      primaryActionLabel="New Action"
      onPrimaryAction={() => startCreate()}
    />
  {:else}
    <section class="register-panel" aria-labelledby="ca-count">
      <div class="register-toolbar">
        <div>
          <h2 id="ca-count">{visibleActions.length} of {$correctiveActionRecords.length} actions</h2>
          <div class="status-summary">
            <button
              class="status-filter-btn"
              class:active={filterStatus === "Created"}
              type="button"
              onclick={() => filterStatus = filterStatus === "Created" ? "" : "Created"}
            >
              <StatusPill label="Created" tone="open" />
              <span>{openCount}</span>
            </button>
            <button
              class="status-filter-btn"
              class:active={filterStatus === "In Progress"}
              type="button"
              onclick={() => filterStatus = filterStatus === "In Progress" ? "" : "In Progress"}
            >
              <StatusPill label="In Progress" tone="progress" />
              <span>{inProgressCount}</span>
            </button>
            <button
              class="status-filter-btn"
              class:active={filterStatus === "Closed"}
              type="button"
              onclick={() => filterStatus = filterStatus === "Closed" ? "" : "Closed"}
            >
              <StatusPill label="Closed" tone="closed" />
              <span>{closedCount}</span>
            </button>
          </div>
        </div>
        <label class="search-control">
          <span>Search</span>
          <input class="toolbar-input" placeholder="Search actions" bind:value={searchQuery} />
        </label>
      </div>

      {#if visibleActions.length === 0}
        <RegisterState
          title="No actions match this filter."
          message="Clear the search or status filter to view all corrective actions."
          secondaryActionLabel="Clear filters"
          onSecondaryAction={() => { searchQuery = ""; filterStatus = ""; }}
        />
      {:else}
        <div class="table-wrap">
          <table class="register-table">
            <thead>
              <tr>
                <th>
                  <button class="sort-button" type="button" onclick={() => toggleSort("priority")}>
                    {getSortLabel("priority", "Priority")}
                  </button>
                </th>
                <th>
                  <button class="sort-button" type="button" onclick={() => toggleSort("title")}>
                    {getSortLabel("title", "Title")}
                  </button>
                </th>
                <th>
                  <button class="sort-button" type="button" onclick={() => toggleSort("finding")}>
                    {getSortLabel("finding", "Finding")}
                  </button>
                </th>
                <th>
                  <button class="sort-button" type="button" onclick={() => toggleSort("assignedTo")}>
                    {getSortLabel("assignedTo", "Assigned To")}
                  </button>
                </th>
                <th>
                  <button class="sort-button" type="button" onclick={() => toggleSort("dueDate")}>
                    {getSortLabel("dueDate", "Due Date")}
                  </button>
                </th>
                <th>
                  <button class="sort-button" type="button" onclick={() => toggleSort("status")}>
                    {getSortLabel("status", "Status")}
                  </button>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each visibleActions as action (action.id)}
                <tr class:overdue={isOverdue(action)}>
                  <td>
                    <StatusPill label={action.priority} tone={getCorrectiveActionPriorityTone(action.priority)} />
                  </td>
                  <td>
                    <strong>{action.title}</strong>
                    {#if action.description}
                      <span>{action.description}</span>
                    {/if}
                  </td>
                  <td>
                    <strong>{getFindingLabel(action.findingId)}</strong>
                    {#if getFindingLocation(action.findingId)}
                      <span>{getFindingLocation(action.findingId)}</span>
                    {/if}
                  </td>
                  <td>{action.assignedTo}</td>
                  <td class:overdue-date={isOverdue(action)}>
                    {action.dueDate || "—"}
                    {#if isOverdue(action)}
                      <span class="overdue-label">Overdue</span>
                    {/if}
                  </td>
                  <td>
                    <StatusPill label={action.status} tone={getCorrectiveActionStatusTone(action.status)} />
                  </td>
                  <td>
                    <button class="secondary-button" type="button" onclick={() => startEdit(action)}>
                      Edit
                    </button>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
  {/if}
</section>

<style>
  .form-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .search-control {
    display: grid;
    width: min(280px, 100%);
    gap: 6px;
    color: var(--color-muted);
    font-size: 0.75rem;
    font-weight: 700;
  }

  .status-summary {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 6px;
  }

  .status-filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    border: 1px solid transparent;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    padding: 4px 6px;
    font-size: 0.8125rem;
    color: var(--color-muted);
    font-weight: 600;
  }

  .status-filter-btn:hover {
    background: var(--color-hover);
  }

  .status-filter-btn.active {
    border-color: var(--color-border-strong);
    background: var(--color-hover);
  }

  tr.overdue td {
    background: #fff8f7;
  }

  .overdue-date {
    color: var(--color-danger) !important;
    font-weight: 600;
  }

  .overdue-label {
    display: block;
    color: var(--color-danger);
    font-size: 0.75rem;
    font-weight: 700;
    margin-top: 2px;
  }

  @media (max-width: 640px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
