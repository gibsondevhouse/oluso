<script lang="ts">
  import { onMount } from "svelte";
  import { olusoApplication } from "../../application/oluso-application";
  import RegisterPageHeader from "$lib/components/register/RegisterPageHeader.svelte";
  import RegisterState from "$lib/components/register/RegisterState.svelte";
  import StatusPill from "$lib/components/ui/StatusPill.svelte";
  import {
    chemicalRecords,
    locationRecords,
    getPersistenceStatusLabel,
    persistenceDiagnostics,
  } from "$lib/persistence/local-persistence";
  import type { ChemicalInput, ChemicalRecord } from "$lib/persistence/chemical.types";
  import {
    CHEMICAL_STATUSES,
    CHEMICAL_HAZARD_CLASSES,
    getChemicalStatusTone,
    getChemicalHazardTone,
  } from "$lib/persistence/chemical.types";
  import { formatTimestamp } from "$lib/utils/date";

  type FormMode = "closed" | "create" | "edit";
  type SortKey = "name" | "hazardClass" | "location" | "status" | "updatedAt";
  type SortDirection = "asc" | "desc";

  interface Props {
    autoInitialize?: boolean;
  }

  let { autoInitialize = true }: Props = $props();
  let formMode = $state<FormMode>("closed");
  let editingChemical = $state<ChemicalRecord | null>(null);
  let form = $state<ChemicalInput>(createEmptyForm());
  let fieldErrors = $state<Partial<Record<keyof ChemicalInput, string>>>({});
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
  const visibleChemicals = $derived(getVisibleChemicals());

  function createEmptyForm(): ChemicalInput {
    return {
      name: "",
      casNumber: "",
      hazardClass: "Unknown",
      storageLocationId: "",
      processIds: [],
      sdsStatus: "Missing",
      sdsReference: "",
      sdsRevisionDate: "",
      sdsReviewDate: "",
      exposureLimitValue: "",
      exposureLimitUnit: "",
      exposureLimitSource: "",
      exposureLimitAveragingPeriod: "",
      quantity: "",
      unit: "",
      supplier: "",
      status: "active",
      notes: "",
    };
  }

  async function initializePage() {
    pageError = null;
    try {
      if ($persistenceDiagnostics.status !== "ready") {
        await olusoApplication.initialize();
      } else {
        olusoApplication.listLocations();
        olusoApplication.listChemicals();
      }
    } catch (error) {
      pageError = error instanceof Error ? error.message : String(error);
    }
  }

  function startCreate() {
    pageError = null;
    fieldErrors = {};
    editingChemical = null;
    form = { ...createEmptyForm(), storageLocationId: $locationRecords[0]?.id ?? "" };
    formMode = "create";
  }

  function startEdit(chemical: ChemicalRecord) {
    pageError = null;
    fieldErrors = {};
    editingChemical = chemical;
    form = {
      name: chemical.name,
      casNumber: chemical.casNumber,
      hazardClass: chemical.hazardClass,
      storageLocationId: chemical.storageLocationId,
      processIds: chemical.processIds,
      sdsStatus: chemical.sdsStatus,
      sdsReference: chemical.sdsReference,
      sdsRevisionDate: chemical.sdsRevisionDate,
      sdsReviewDate: chemical.sdsReviewDate,
      exposureLimitValue: chemical.exposureLimitValue,
      exposureLimitUnit: chemical.exposureLimitUnit,
      exposureLimitSource: chemical.exposureLimitSource,
      exposureLimitAveragingPeriod: chemical.exposureLimitAveragingPeriod,
      quantity: chemical.quantity,
      unit: chemical.unit,
      supplier: chemical.supplier,
      status: chemical.status,
      notes: chemical.notes,
    };
    formMode = "edit";
  }

  function closeForm() {
    pageError = null;
    fieldErrors = {};
    editingChemical = null;
    form = createEmptyForm();
    formMode = "closed";
  }

  function submitChemical() {
    pageError = null;
    const validation = olusoApplication.validateChemical(form);
    fieldErrors = validation.errors;

    if (!validation.valid) {
      pageError = "Fix the highlighted fields before saving the chemical.";
      return;
    }

    try {
      if (formMode === "edit" && editingChemical) {
        olusoApplication.updateChemical(editingChemical.id, form);
      } else {
        olusoApplication.createChemical(form);
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

  function getVisibleChemicals() {
    const query = searchQuery.trim().toLowerCase();
    return $chemicalRecords
      .filter((c) => {
        if (!query) return true;
        const locationName = locationNameById.get(c.storageLocationId) ?? "";
        return [c.name, c.casNumber, c.hazardClass, c.supplier, c.status, locationName]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const dir = sortDirection === "asc" ? 1 : -1;
        if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
        if (sortKey === "hazardClass") return a.hazardClass.localeCompare(b.hazardClass) * dir;
        if (sortKey === "location") {
          return (locationNameById.get(a.storageLocationId) ?? "").localeCompare(
            locationNameById.get(b.storageLocationId) ?? "",
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

<section class="page" aria-labelledby="chemicals-title">
  <RegisterPageHeader
    breadcrumbs="HSE Registers"
    title="Chemicals"
    titleId="chemicals-title"
    summary="Track chemical substances, hazard classifications, and storage locations."
    statusLabel={statusLabel}
    statusTone={persistenceTone}
    primaryActionLabel="Add Chemical"
    onPrimaryAction={startCreate}
  />

  {#if pageError}
    <p class="error-message">{pageError}</p>
  {/if}

  {#if formMode !== "closed"}
    <form
      class="record-form"
      aria-label={formMode === "edit" ? "Edit chemical" : "Add chemical"}
      onsubmit={(e) => { e.preventDefault(); submitChemical(); }}
    >
      <div class="form-header">
        <h2>{formMode === "edit" ? "Edit Chemical" : "Add Chemical"}</h2>
        {#if editingChemical}
          <span class="form-context">{editingChemical.id}</span>
        {/if}
      </div>

      <div class="form-grid">
        <label>
          <span>Chemical Name</span>
          <input
            aria-invalid={fieldErrors.name ? "true" : "false"}
            aria-describedby={fieldErrors.name ? "chem-name-error" : undefined}
            bind:value={form.name}
          />
        </label>
        {#if fieldErrors.name}
          <p class="field-error" id="chem-name-error">{fieldErrors.name}</p>
        {/if}

        <label>
          <span>CAS Number</span>
          <input placeholder="e.g. 67-64-1" bind:value={form.casNumber} />
        </label>
      </div>

      <div class="form-grid">
        <label>
          <span>Hazard Class</span>
          <select
            aria-invalid={fieldErrors.hazardClass ? "true" : "false"}
            bind:value={form.hazardClass}
          >
            {#each CHEMICAL_HAZARD_CLASSES as cls}
              <option value={cls}>{cls}</option>
            {/each}
          </select>
        </label>

        <label>
          <span>Storage Location</span>
          <select
            aria-invalid={fieldErrors.storageLocationId ? "true" : "false"}
            aria-describedby={fieldErrors.storageLocationId ? "chem-loc-error" : undefined}
            bind:value={form.storageLocationId}
          >
            <option value="">Select location</option>
            {#each $locationRecords as location (location.id)}
              <option value={location.id}>{location.name}</option>
            {/each}
          </select>
        </label>
        {#if fieldErrors.storageLocationId}
          <p class="field-error" id="chem-loc-error">{fieldErrors.storageLocationId}</p>
        {/if}
      </div>

      <div class="form-grid">
        <label>
          <span>Quantity</span>
          <input placeholder="e.g. 50" bind:value={form.quantity} />
        </label>

        <label>
          <span>Unit</span>
          <input placeholder="e.g. L, kg, bottles" bind:value={form.unit} />
        </label>
      </div>

      <label>
        <span>Supplier</span>
        <input bind:value={form.supplier} />
      </label>

      <label>
        <span>Status</span>
        <select bind:value={form.status}>
          {#each CHEMICAL_STATUSES as s}
            <option value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          {/each}
        </select>
      </label>

      <label>
        <span>Notes</span>
        <textarea rows="3" bind:value={form.notes}></textarea>
      </label>

      <div class="action-row">
        <button class="button-link" type="submit">Save chemical</button>
        <button class="secondary-button" type="button" onclick={closeForm}>Cancel</button>
      </div>
    </form>
  {/if}

  {#if $persistenceDiagnostics.status === "loading"}
    <RegisterState
      title="Loading chemicals"
      message="Initializing local persistence and reading the Chemicals register."
      live
    />
  {:else if $persistenceDiagnostics.status === "not_configured"}
    <RegisterState
      title="Persistence is not configured"
      message="Chemicals cannot be read or saved until local persistence initializes."
      secondaryActionLabel="Initialize persistence"
      onSecondaryAction={initializePage}
    />
  {:else if $persistenceDiagnostics.status === "error"}
    <RegisterState
      title="Chemicals could not load"
      message={$persistenceDiagnostics.lastError ?? "Local persistence reported an error."}
      secondaryActionLabel="Retry"
      onSecondaryAction={initializePage}
    />
  {:else if $chemicalRecords.length === 0}
    <RegisterState
      title="No chemicals recorded"
      message="Add the first chemical to begin building the chemical inventory register."
      primaryActionLabel="Add Chemical"
      onPrimaryAction={startCreate}
    />
  {:else}
    <section class="register-panel" aria-labelledby="chemical-count">
      <div class="register-toolbar">
        <div>
          <h2 id="chemical-count">{visibleChemicals.length} of {$chemicalRecords.length} chemicals</h2>
          <span class="register-meta">Persisted at {$persistenceDiagnostics.dataPath}</span>
        </div>
        <label class="search-control">
          <span>Search</span>
          <input
            class="toolbar-input"
            placeholder="Search chemicals"
            bind:value={searchQuery}
          />
        </label>
      </div>

      {#if visibleChemicals.length === 0}
        <RegisterState
          title="No chemicals match this search."
          message="Clear or revise the search query to view chemicals."
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
                  <button class="sort-button" type="button" onclick={() => toggleSort("hazardClass")}>
                    {getSortLabel("hazardClass", "Hazard Class")}
                  </button>
                </th>
                <th>Qty / Unit</th>
                <th>
                  <button class="sort-button" type="button" onclick={() => toggleSort("location")}>
                    {getSortLabel("location", "Storage")}
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
              {#each visibleChemicals as chemical (chemical.id)}
                <tr>
                  <td>
                    <strong>{chemical.name}</strong>
                    {#if chemical.casNumber}
                      <span>CAS: {chemical.casNumber}</span>
                    {/if}
                  </td>
                  <td>
                    <StatusPill
                      label={chemical.hazardClass}
                      tone={getChemicalHazardTone(chemical.hazardClass)}
                    />
                  </td>
                  <td>{chemical.quantity || "—"}{chemical.unit ? ` ${chemical.unit}` : ""}</td>
                  <td>{locationNameById.get(chemical.storageLocationId) ?? "Unknown"}</td>
                  <td>
                    <StatusPill
                      label={chemical.status.charAt(0).toUpperCase() + chemical.status.slice(1)}
                      tone={getChemicalStatusTone(chemical.status)}
                    />
                  </td>
                  <td>{formatTimestamp(chemical.updatedAt)}</td>
                  <td>
                    <button class="secondary-button" type="button" onclick={() => startEdit(chemical)}>
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
