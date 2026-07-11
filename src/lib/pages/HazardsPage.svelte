<script lang="ts">
  import { onMount } from "svelte";
  import { olusoApplication } from "../../application/oluso-application";
  import RegisterPageHeader from "$lib/components/register/RegisterPageHeader.svelte";
  import RegisterState from "$lib/components/register/RegisterState.svelte";
  import StatusPill from "$lib/components/ui/StatusPill.svelte";
  import {
    hazardRecords,
    locationRecords,
    getPersistenceStatusLabel,
    persistenceDiagnostics,
  } from "$lib/persistence/local-persistence";
  import type { HazardInput, HazardRecord, HazardSeverity, HazardStatus } from "$lib/persistence/hazard.types";
  import {
    HAZARD_STATUSES,
    HAZARD_SEVERITIES,
    HAZARD_LIKELIHOODS,
    HAZARD_CATEGORIES,
    getHazardSeverityTone,
    getHazardStatusTone,
    getHazardStatusLabel,
  } from "$lib/persistence/hazard.types";
  import { formatTimestamp } from "$lib/utils/date";

  type FormMode = "closed" | "create" | "edit";
  type SortKey = "severity" | "title" | "category" | "location" | "status" | "updatedAt";
  type SortDirection = "asc" | "desc";
  type HazardFormState = Omit<HazardInput, "severity" | "status" | "category" | "likelihood"> & {
    severity: HazardSeverity | "";
    status: HazardStatus | "";
    category: string;
    likelihood: string;
  };

  interface Props {
    autoInitialize?: boolean;
  }

  let { autoInitialize = true }: Props = $props();
  let formMode = $state<FormMode>("closed");
  let editingHazard = $state<HazardRecord | null>(null);
  let form = $state<HazardFormState>(createEmptyForm());
  let fieldErrors = $state<Partial<Record<keyof HazardInput, string>>>({});
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
  const visibleHazards = $derived(getVisibleHazards());

  function createEmptyForm(): HazardFormState {
    return {
      title: "",
      category: "",
      locationId: "",
      locationIds: [],
      processIds: [],
      chemicalIds: [],
      severity: "",
      likelihood: "",
      description: "",
      controls: "",
      status: "active",
    };
  }

  async function initializePage() {
    pageError = null;
    try {
      if ($persistenceDiagnostics.status !== "ready") {
        await olusoApplication.initialize();
      } else {
        olusoApplication.listLocations();
        olusoApplication.listHazards();
      }
    } catch (error) {
      pageError = error instanceof Error ? error.message : String(error);
    }
  }

  function startCreate() {
    pageError = null;
    fieldErrors = {};
    editingHazard = null;
    form = { ...createEmptyForm(), locationId: $locationRecords[0]?.id ?? "" };
    formMode = "create";
  }

  function startEdit(hazard: HazardRecord) {
    pageError = null;
    fieldErrors = {};
    editingHazard = hazard;
    form = {
      title: hazard.title,
      category: hazard.category,
      locationId: hazard.locationId,
      locationIds: hazard.locationIds,
      processIds: hazard.processIds,
      chemicalIds: hazard.chemicalIds,
      severity: hazard.severity,
      likelihood: hazard.likelihood,
      description: hazard.description,
      controls: hazard.controls,
      status: hazard.status,
    };
    formMode = "edit";
  }

  function closeForm() {
    pageError = null;
    fieldErrors = {};
    editingHazard = null;
    form = createEmptyForm();
    formMode = "closed";
  }

  function normalizeForm(): HazardInput {
    return {
      ...form,
      severity: form.severity || ("Low" as HazardSeverity),
      status: form.status || ("active" as HazardStatus),
      category: form.category as HazardInput["category"],
      likelihood: form.likelihood as HazardInput["likelihood"],
    };
  }

  function submitHazard() {
    pageError = null;
    const input = normalizeForm();
    const validation = olusoApplication.validateHazard(input);
    const nextErrors = { ...validation.errors };

    if (!form.severity) nextErrors.severity = "Severity is required.";
    if (!form.category) nextErrors.category = "Category is required.";
    if (!form.likelihood) nextErrors.likelihood = "Likelihood is required.";

    fieldErrors = nextErrors;

    if (!validation.valid || Object.keys(nextErrors).length > 0) {
      pageError = "Fix the highlighted fields before saving the hazard.";
      return;
    }

    try {
      if (formMode === "edit" && editingHazard) {
        olusoApplication.updateHazard(editingHazard.id, input);
      } else {
        olusoApplication.createHazard(input);
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

  function getVisibleHazards() {
    const query = searchQuery.trim().toLowerCase();
    const severityRank: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };
    const statusRank: Record<string, number> = { active: 1, mitigated: 2, closed: 3 };

    return $hazardRecords
      .filter((h) => {
        if (!query) return true;
        const locationName = locationNameById.get(h.locationId) ?? "";
        return [h.title, h.category, h.severity, h.likelihood, h.status, locationName]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const dir = sortDirection === "asc" ? 1 : -1;
        if (sortKey === "severity") return ((severityRank[a.severity] ?? 0) - (severityRank[b.severity] ?? 0)) * dir;
        if (sortKey === "title") return a.title.localeCompare(b.title) * dir;
        if (sortKey === "category") return a.category.localeCompare(b.category) * dir;
        if (sortKey === "location") {
          return (locationNameById.get(a.locationId) ?? "").localeCompare(
            locationNameById.get(b.locationId) ?? "",
          ) * dir;
        }
        if (sortKey === "status") return ((statusRank[a.status] ?? 0) - (statusRank[b.status] ?? 0)) * dir;
        return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * dir;
      });
  }

  onMount(() => {
    if (autoInitialize) void initializePage();
  });
</script>

<section class="page" aria-labelledby="hazards-title">
  <RegisterPageHeader
    breadcrumbs="HSE Registers"
    title="Hazards"
    titleId="hazards-title"
    summary="Identify, assess, and control workplace hazards across all locations."
    statusLabel={statusLabel}
    statusTone={persistenceTone}
    primaryActionLabel="New Hazard"
    onPrimaryAction={startCreate}
  />

  {#if pageError}
    <p class="error-message">{pageError}</p>
  {/if}

  {#if formMode !== "closed"}
    <form
      class="record-form"
      aria-label={formMode === "edit" ? "Edit hazard" : "New hazard"}
      onsubmit={(e) => { e.preventDefault(); submitHazard(); }}
    >
      <div class="form-header">
        <h2>{formMode === "edit" ? "Edit Hazard" : "New Hazard"}</h2>
        {#if editingHazard}
          <span class="form-context">{editingHazard.id}</span>
        {/if}
      </div>

      <label>
        <span>Title</span>
        <input
          aria-invalid={fieldErrors.title ? "true" : "false"}
          aria-describedby={fieldErrors.title ? "hazard-title-error" : undefined}
          bind:value={form.title}
        />
      </label>
      {#if fieldErrors.title}
        <p class="field-error" id="hazard-title-error">{fieldErrors.title}</p>
      {/if}

      <div class="form-grid">
        <label>
          <span>Category</span>
          <select
            aria-invalid={fieldErrors.category ? "true" : "false"}
            bind:value={form.category}
          >
            <option value="">Select category</option>
            {#each HAZARD_CATEGORIES as cat}
              <option value={cat}>{cat}</option>
            {/each}
          </select>
        </label>
        {#if fieldErrors.category}
          <p class="field-error">{fieldErrors.category}</p>
        {/if}

        <label>
          <span>Location</span>
          <select
            aria-invalid={fieldErrors.locationId ? "true" : "false"}
            bind:value={form.locationId}
          >
            <option value="">Select location</option>
            {#each $locationRecords as location (location.id)}
              <option value={location.id}>{location.name}</option>
            {/each}
          </select>
        </label>
        {#if fieldErrors.locationId}
          <p class="field-error">{fieldErrors.locationId}</p>
        {/if}
      </div>

      <div class="form-grid">
        <label>
          <span>Severity</span>
          <select
            aria-invalid={fieldErrors.severity ? "true" : "false"}
            bind:value={form.severity}
          >
            <option value="">Select severity</option>
            {#each HAZARD_SEVERITIES as sev}
              <option value={sev}>{sev}</option>
            {/each}
          </select>
        </label>
        {#if fieldErrors.severity}
          <p class="field-error">{fieldErrors.severity}</p>
        {/if}

        <label>
          <span>Likelihood</span>
          <select
            aria-invalid={fieldErrors.likelihood ? "true" : "false"}
            bind:value={form.likelihood}
          >
            <option value="">Select likelihood</option>
            {#each HAZARD_LIKELIHOODS as lik}
              <option value={lik}>{lik}</option>
            {/each}
          </select>
        </label>
        {#if fieldErrors.likelihood}
          <p class="field-error">{fieldErrors.likelihood}</p>
        {/if}
      </div>

      <label>
        <span>Status</span>
        <select bind:value={form.status}>
          {#each HAZARD_STATUSES as s}
            <option value={s}>{getHazardStatusLabel(s)}</option>
          {/each}
        </select>
      </label>

      <label>
        <span>Description</span>
        <textarea rows="3" bind:value={form.description}></textarea>
      </label>

      <label>
        <span>Controls</span>
        <textarea rows="3" placeholder="Describe existing or planned controls..." bind:value={form.controls}></textarea>
      </label>

      <div class="action-row">
        <button class="button-link" type="submit">Save hazard</button>
        <button class="secondary-button" type="button" onclick={closeForm}>Cancel</button>
      </div>
    </form>
  {/if}

  {#if $persistenceDiagnostics.status === "loading"}
    <RegisterState title="Loading hazards" message="Initializing local persistence and reading the Hazards register." live />
  {:else if $persistenceDiagnostics.status === "not_configured"}
    <RegisterState
      title="Persistence is not configured"
      message="Hazards cannot be read or saved until local persistence initializes."
      secondaryActionLabel="Initialize persistence"
      onSecondaryAction={initializePage}
    />
  {:else if $persistenceDiagnostics.status === "error"}
    <RegisterState
      title="Hazards could not load"
      message={$persistenceDiagnostics.lastError ?? "Local persistence reported an error."}
      secondaryActionLabel="Retry"
      onSecondaryAction={initializePage}
    />
  {:else if $hazardRecords.length === 0}
    <RegisterState
      title="No hazards recorded"
      message="Add the first hazard to begin the hazard register."
      primaryActionLabel="New Hazard"
      onPrimaryAction={startCreate}
    />
  {:else}
    <section class="register-panel" aria-labelledby="hazard-count">
      <div class="register-toolbar">
        <div>
          <h2 id="hazard-count">{visibleHazards.length} of {$hazardRecords.length} hazards</h2>
          <span class="register-meta">Persisted at {$persistenceDiagnostics.dataPath}</span>
        </div>
        <label class="search-control">
          <span>Search</span>
          <input class="toolbar-input" placeholder="Search hazards" bind:value={searchQuery} />
        </label>
      </div>

      {#if visibleHazards.length === 0}
        <RegisterState
          title="No hazards match this search."
          message="Clear or revise the search query to view hazards."
          secondaryActionLabel="Clear search"
          onSecondaryAction={() => (searchQuery = "")}
        />
      {:else}
        <div class="table-wrap">
          <table class="register-table">
            <thead>
              <tr>
                <th>
                  <button class="sort-button" type="button" onclick={() => toggleSort("severity")}>
                    {getSortLabel("severity", "Severity")}
                  </button>
                </th>
                <th>
                  <button class="sort-button" type="button" onclick={() => toggleSort("title")}>
                    {getSortLabel("title", "Title")}
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
                <th>Likelihood</th>
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
              {#each visibleHazards as hazard (hazard.id)}
                <tr>
                  <td>
                    <StatusPill label={hazard.severity} tone={getHazardSeverityTone(hazard.severity)} />
                  </td>
                  <td>
                    <strong>{hazard.title}</strong>
                    {#if hazard.description}
                      <span>{hazard.description}</span>
                    {/if}
                  </td>
                  <td>{hazard.category}</td>
                  <td>{locationNameById.get(hazard.locationId) ?? "Unknown"}</td>
                  <td>{hazard.likelihood}</td>
                  <td>
                    <StatusPill label={getHazardStatusLabel(hazard.status)} tone={getHazardStatusTone(hazard.status)} />
                  </td>
                  <td>{formatTimestamp(hazard.updatedAt)}</td>
                  <td>
                    <button class="secondary-button" type="button" onclick={() => startEdit(hazard)}>
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

  @media (max-width: 640px) {
    .form-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
