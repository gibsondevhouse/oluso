<script lang="ts">
  import { onMount } from "svelte";
  import { olusoApplication } from "../../application/oluso-application";
  import RegisterPageHeader from "$lib/components/register/RegisterPageHeader.svelte";
  import RegisterState from "$lib/components/register/RegisterState.svelte";
  import StatusPill from "$lib/components/ui/StatusPill.svelte";
  import {
    processRecords,
    locationRecords,
    getPersistenceStatusLabel,
    persistenceDiagnostics,
  } from "$lib/persistence/local-persistence";
  import type { ProcessCategory, ProcessInput, ProcessRecord } from "$lib/persistence/process.types";
  import {
    PROCESS_STATUSES,
    PROCESS_CATEGORIES,
    getProcessStatusTone,
    getProcessStatusLabel,
  } from "$lib/persistence/process.types";
  import { formatTimestamp } from "$lib/utils/date";

  type FormMode = "closed" | "create" | "edit";
  type SortKey = "name" | "category" | "location" | "status" | "updatedAt";
  type SortDirection = "asc" | "desc";
  type ProcessFormState = Omit<ProcessInput, "category"> & {
    category: ProcessCategory | "";
  };

  interface Props {
    autoInitialize?: boolean;
  }

  let { autoInitialize = true }: Props = $props();
  let formMode = $state<FormMode>("closed");
  let editingProcess = $state<ProcessRecord | null>(null);
  let form = $state<ProcessFormState>(createEmptyForm());
  let fieldErrors = $state<Partial<Record<keyof ProcessInput, string>>>({});
  let pageError = $state<string | null>(null);
  let searchQuery = $state("");
  let sortKey = $state<SortKey>("updatedAt");
  let sortDirection = $state<SortDirection>("desc");

  const statusLabel = $derived(getPersistenceStatusLabel($persistenceDiagnostics.status));
  const persistenceTone = $derived(
    $persistenceDiagnostics.status === "not_configured" ? "neutral" : $persistenceDiagnostics.status,
  );
  const locationNameById = $derived(
    new Map($locationRecords.map((l) => [l.id, l.name])),
  );
  const visibleProcesses = $derived(getVisibleProcesses());

  function createEmptyForm(): ProcessFormState {
    return {
      name: "",
      locationId: "",
      category: "",
      description: "",
      status: "active",
    };
  }

  function normalizeForm(): ProcessInput {
    return {
      ...form,
      category: form.category as ProcessCategory,
    };
  }

  async function initializePage() {
    pageError = null;
    try {
      if ($persistenceDiagnostics.status !== "ready") {
        await olusoApplication.initialize();
      } else {
        olusoApplication.listLocations();
        olusoApplication.listProcesses();
      }
    } catch (error) {
      pageError = error instanceof Error ? error.message : String(error);
    }
  }

  function startCreate() {
    pageError = null;
    fieldErrors = {};
    editingProcess = null;
    form = { ...createEmptyForm(), locationId: $locationRecords[0]?.id ?? "" };
    formMode = "create";
  }

  function startEdit(process: ProcessRecord) {
    pageError = null;
    fieldErrors = {};
    editingProcess = process;
    form = {
      name: process.name,
      locationId: process.locationId,
      category: process.category,
      description: process.description,
      status: process.status,
    };
    formMode = "edit";
  }

  function closeForm() {
    pageError = null;
    fieldErrors = {};
    editingProcess = null;
    form = createEmptyForm();
    formMode = "closed";
  }

  function submitProcess() {
    pageError = null;
    const input = normalizeForm();
    const validation = olusoApplication.validateProcess(input);
    fieldErrors = validation.errors;

    if (!validation.valid) {
      pageError = "Fix the highlighted fields before saving the process.";
      return;
    }

    try {
      if (formMode === "edit" && editingProcess) {
        olusoApplication.updateProcess(editingProcess.id, input);
      } else {
        olusoApplication.createProcess(input);
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
    sortDirection = nextKey === "updatedAt" ? "desc" : "asc";
  }

  function getSortLabel(key: SortKey, label: string) {
    if (sortKey !== key) return label;
    return `${label} ${sortDirection === "asc" ? "▲" : "▼"}`;
  }

  function getVisibleProcesses() {
    const query = searchQuery.trim().toLowerCase();
    return $processRecords
      .filter((p) => {
        if (!query) return true;
        const locationName = locationNameById.get(p.locationId) ?? "";
        return [p.name, p.category, p.description, p.status, locationName]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const dir = sortDirection === "asc" ? 1 : -1;
        if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
        if (sortKey === "category") return a.category.localeCompare(b.category) * dir;
        if (sortKey === "location") {
          return (locationNameById.get(a.locationId) ?? "").localeCompare(
            locationNameById.get(b.locationId) ?? "",
          ) * dir;
        }
        if (sortKey === "status") return a.status.localeCompare(b.status) * dir;
        return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir;
      });
  }

  onMount(() => {
    if (autoInitialize) void initializePage();
  });
</script>

<section class="page" aria-labelledby="processes-title">
  <RegisterPageHeader
    breadcrumbs="Operations"
    title="Processes"
    titleId="processes-title"
    summary="Document and manage operational processes linked to locations and HSE controls."
    statusLabel={statusLabel}
    statusTone={persistenceTone}
    primaryActionLabel="New Process"
    onPrimaryAction={startCreate}
  />

  {#if pageError}
    <p class="error-message">{pageError}</p>
  {/if}

  {#if formMode !== "closed"}
    <form
      class="record-form"
      aria-label={formMode === "edit" ? "Edit process" : "New process"}
      onsubmit={(e) => { e.preventDefault(); submitProcess(); }}
    >
      <div class="form-header">
        <h2>{formMode === "edit" ? "Edit Process" : "New Process"}</h2>
        {#if editingProcess}
          <span class="form-context">{editingProcess.id}</span>
        {/if}
      </div>

      <label>
        <span>Name</span>
        <input
          aria-invalid={fieldErrors.name ? "true" : "false"}
          aria-describedby={fieldErrors.name ? "process-name-error" : undefined}
          bind:value={form.name}
        />
      </label>
      {#if fieldErrors.name}
        <p class="field-error" id="process-name-error">{fieldErrors.name}</p>
      {/if}

      <label>
        <span>Location</span>
        <select
          aria-invalid={fieldErrors.locationId ? "true" : "false"}
          aria-describedby={fieldErrors.locationId ? "process-location-error" : undefined}
          bind:value={form.locationId}
        >
          <option value="">Select location</option>
          {#each $locationRecords as location (location.id)}
            <option value={location.id}>{location.name}</option>
          {/each}
        </select>
      </label>
      {#if fieldErrors.locationId}
        <p class="field-error" id="process-location-error">{fieldErrors.locationId}</p>
      {/if}

      <label>
        <span>Category</span>
        <select
          aria-invalid={fieldErrors.category ? "true" : "false"}
          aria-describedby={fieldErrors.category ? "process-category-error" : undefined}
          bind:value={form.category}
        >
          <option value="">Select category</option>
          {#each PROCESS_CATEGORIES as cat}
            <option value={cat}>{cat}</option>
          {/each}
        </select>
      </label>
      {#if fieldErrors.category}
        <p class="field-error" id="process-category-error">{fieldErrors.category}</p>
      {/if}

      <label>
        <span>Status</span>
        <select bind:value={form.status}>
          {#each PROCESS_STATUSES as s}
            <option value={s}>{getProcessStatusLabel(s)}</option>
          {/each}
        </select>
      </label>

      <label>
        <span>Description</span>
        <textarea rows="4" bind:value={form.description}></textarea>
      </label>

      <div class="action-row">
        <button class="button-link" type="submit">Save process</button>
        <button class="secondary-button" type="button" onclick={closeForm}>Cancel</button>
      </div>
    </form>
  {/if}

  {#if $persistenceDiagnostics.status === "loading"}
    <RegisterState
      title="Loading processes"
      message="Initializing local persistence and reading the Processes register."
      live
    />
  {:else if $persistenceDiagnostics.status === "not_configured"}
    <RegisterState
      title="Persistence is not configured"
      message="Processes cannot be read or saved until local persistence initializes."
      secondaryActionLabel="Initialize persistence"
      onSecondaryAction={initializePage}
    />
  {:else if $persistenceDiagnostics.status === "error"}
    <RegisterState
      title="Processes could not load"
      message={$persistenceDiagnostics.lastError ?? "Local persistence reported an error."}
      secondaryActionLabel="Retry"
      onSecondaryAction={initializePage}
    />
  {:else if $processRecords.length === 0}
    <RegisterState
      title="No processes yet"
      message="Add the first operational process to start building the Processes register."
      primaryActionLabel="New Process"
      onPrimaryAction={startCreate}
    />
  {:else}
    <section class="register-panel" aria-labelledby="process-count">
      <div class="register-toolbar">
        <div>
          <h2 id="process-count">{visibleProcesses.length} of {$processRecords.length} processes</h2>
          <span class="register-meta">Persisted at {$persistenceDiagnostics.dataPath}</span>
        </div>
        <label class="search-control">
          <span>Search</span>
          <input
            class="toolbar-input"
            placeholder="Search processes"
            bind:value={searchQuery}
          />
        </label>
      </div>

      {#if visibleProcesses.length === 0}
        <RegisterState
          title="No processes match this search."
          message="Clear or revise the search query to view processes."
          secondaryActionLabel="Clear search"
          onSecondaryAction={() => (searchQuery = "")}
        />
      {:else}
        <div class="table-wrap">
          <table class="register-table">
            <thead>
              <tr>
                <th>
                  <button class="sort-button" type="button" onclick={() => toggleSort("name")}>
                    {getSortLabel("name", "Name")}
                  </button>
                </th>
                <th>
                  <button class="sort-button" type="button" onclick={() => toggleSort("category")}>
                    {getSortLabel("category", "Category")}
                  </button>
                </th>
                <th>
                  <button class="sort-button" type="button" onclick={() => toggleSort("location")}>
                    {getSortLabel("location", "Location")}
                  </button>
                </th>
                <th>
                  <button class="sort-button" type="button" onclick={() => toggleSort("status")}>
                    {getSortLabel("status", "Status")}
                  </button>
                </th>
                <th>
                  <button class="sort-button" type="button" onclick={() => toggleSort("updatedAt")}>
                    {getSortLabel("updatedAt", "Updated")}
                  </button>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {#each visibleProcesses as process (process.id)}
                <tr>
                  <td>
                    <strong>{process.name}</strong>
                    {#if process.description}
                      <span>{process.description}</span>
                    {/if}
                  </td>
                  <td>{process.category}</td>
                  <td>{locationNameById.get(process.locationId) ?? "Unknown location"}</td>
                  <td>
                    <StatusPill
                      label={getProcessStatusLabel(process.status)}
                      tone={getProcessStatusTone(process.status)}
                    />
                  </td>
                  <td>{formatTimestamp(process.updatedAt)}</td>
                  <td>
                    <button class="secondary-button" type="button" onclick={() => startEdit(process)}>
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
  .search-control {
    display: grid;
    width: min(280px, 100%);
    gap: 6px;
    color: var(--color-muted);
    font-size: 0.75rem;
    font-weight: 700;
  }
</style>
