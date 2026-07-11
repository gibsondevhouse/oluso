<script lang="ts">
  import { onMount } from "svelte";
  import { olusoApplication } from "../../application/oluso-application";
  import RegisterPageHeader from "$lib/components/register/RegisterPageHeader.svelte";
  import RegisterState from "$lib/components/register/RegisterState.svelte";
  import StatusPill from "$lib/components/ui/StatusPill.svelte";
  import {
    segRecords,
    locationRecords,
    getPersistenceStatusLabel,
    persistenceDiagnostics,
  } from "$lib/persistence/local-persistence";
  import type { SegInput, SegRecord, ExposureLevel, SegStatus, SegType } from "$lib/persistence/seg.types";
  import {
    SEG_STATUSES,
    SEG_TYPES,
    EXPOSURE_LEVELS,
    MONITORING_FREQUENCIES,
    getExposureLevelTone,
    getSegStatusTone,
    getSegStatusLabel,
  } from "$lib/persistence/seg.types";
  import { formatTimestamp } from "$lib/utils/date";

  type FormMode = "closed" | "create" | "edit";
  type SortKey = "name" | "agentType" | "exposure" | "location" | "status" | "updatedAt";
  type SortDirection = "asc" | "desc";
  type SegFormState = Omit<SegInput, "exposureLevel" | "status" | "type"> & {
    type: SegType | "";
    exposureLevel: ExposureLevel | "";
    status: SegStatus | "";
  };

  interface Props {
    autoInitialize?: boolean;
  }

  let { autoInitialize = true }: Props = $props();
  let formMode = $state<FormMode>("closed");
  let editingSeg = $state<SegRecord | null>(null);
  let form = $state<SegFormState>(createEmptyForm());
  let fieldErrors = $state<Partial<Record<keyof SegInput, string>>>({});
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
  const visibleSegs = $derived(getVisibleSegs());

  function createEmptyForm(): SegFormState {
    return {
      name: "",
      type: "Similar Exposure Group",
      description: "",
      locationId: "",
      processId: "",
      chemicalIds: [],
      hazardIds: [],
      agentType: "",
      exposureLevel: "",
      workerCount: "",
      controls: "",
      monitoringFrequency: "",
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
        olusoApplication.listSegs();
      }
    } catch (error) {
      pageError = error instanceof Error ? error.message : String(error);
    }
  }

  function startCreate() {
    pageError = null;
    fieldErrors = {};
    editingSeg = null;
    form = { ...createEmptyForm(), locationId: $locationRecords[0]?.id ?? "" };
    formMode = "create";
  }

  function startEdit(seg: SegRecord) {
    pageError = null;
    fieldErrors = {};
    editingSeg = seg;
    form = {
      name: seg.name,
      type: seg.type,
      description: seg.description,
      locationId: seg.locationId,
      processId: seg.processId,
      chemicalIds: seg.chemicalIds,
      hazardIds: seg.hazardIds,
      agentType: seg.agentType,
      exposureLevel: seg.exposureLevel,
      workerCount: seg.workerCount,
      controls: seg.controls,
      monitoringFrequency: seg.monitoringFrequency,
      status: seg.status,
    };
    formMode = "edit";
  }

  function closeForm() {
    pageError = null;
    fieldErrors = {};
    editingSeg = null;
    form = createEmptyForm();
    formMode = "closed";
  }

  function normalizeForm(): SegInput {
    return {
      ...form,
      type: (form.type || "Similar Exposure Group") as SegType,
      exposureLevel: form.exposureLevel || ("Low" as ExposureLevel),
      status: form.status || ("active" as SegStatus),
    };
  }

  function submitSeg() {
    pageError = null;
    const input = normalizeForm();
    const validation = olusoApplication.validateSeg(input);
    const nextErrors = { ...validation.errors };

    if (!form.type) nextErrors.type = "SEG type is required.";
    if (!form.exposureLevel) nextErrors.exposureLevel = "Exposure level is required.";

    fieldErrors = nextErrors;

    if (!validation.valid || Object.keys(nextErrors).length > 0) {
      pageError = "Fix the highlighted fields before saving the SEG.";
      return;
    }

    try {
      if (formMode === "edit" && editingSeg) {
        olusoApplication.updateSeg(editingSeg.id, input);
      } else {
        olusoApplication.createSeg(input);
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

  function getVisibleSegs() {
    const query = searchQuery.trim().toLowerCase();
    const exposureRank: Record<string, number> = { Low: 1, Medium: 2, High: 3, Critical: 4 };

    return $segRecords
      .filter((s) => {
        if (!query) return true;
        const locationName = locationNameById.get(s.locationId) ?? "";
        return [s.name, s.agentType, s.exposureLevel, s.status, locationName]
          .join(" ")
          .toLowerCase()
          .includes(query);
      })
      .sort((a, b) => {
        const dir = sortDirection === "asc" ? 1 : -1;
        if (sortKey === "name") return a.name.localeCompare(b.name) * dir;
        if (sortKey === "agentType") return a.agentType.localeCompare(b.agentType) * dir;
        if (sortKey === "exposure") return ((exposureRank[a.exposureLevel] ?? 0) - (exposureRank[b.exposureLevel] ?? 0)) * dir;
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

<section class="page" aria-labelledby="segs-title">
  <RegisterPageHeader
    breadcrumbs="HSE Registers"
    title="Similar Exposure Groups"
    titleId="segs-title"
    summary="Define Similar Exposure Groups for occupational hygiene monitoring and control."
    statusLabel={statusLabel}
    statusTone={persistenceTone}
    primaryActionLabel="New SEG"
    onPrimaryAction={startCreate}
  />

  {#if pageError}
    <p class="error-message">{pageError}</p>
  {/if}

  {#if formMode !== "closed"}
    <form
      class="record-form"
      aria-label={formMode === "edit" ? "Edit SEG" : "New SEG"}
      onsubmit={(e) => { e.preventDefault(); submitSeg(); }}
    >
      <div class="form-header">
        <h2>{formMode === "edit" ? "Edit SEG" : "New SEG"}</h2>
        {#if editingSeg}
          <span class="form-context">{editingSeg.id}</span>
        {/if}
      </div>

      <label>
        <span>Group Name</span>
        <input
          aria-invalid={fieldErrors.name ? "true" : "false"}
          aria-describedby={fieldErrors.name ? "seg-name-error" : undefined}
          bind:value={form.name}
        />
      </label>
      {#if fieldErrors.name}
        <p class="field-error" id="seg-name-error">{fieldErrors.name}</p>
      {/if}

      <div class="form-grid">
        <label>
          <span>SEG Type</span>
          <select
            aria-invalid={fieldErrors.type ? "true" : "false"}
            bind:value={form.type}
          >
            <option value="">Select SEG type</option>
            {#each SEG_TYPES as type}
              <option value={type}>{type}</option>
            {/each}
          </select>
        </label>
        {#if fieldErrors.type}
          <p class="field-error">{fieldErrors.type}</p>
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

        <label>
          <span>Agent Type</span>
          <input
            placeholder="e.g. Chemical, Noise, Dust"
            aria-invalid={fieldErrors.agentType ? "true" : "false"}
            bind:value={form.agentType}
          />
        </label>
        {#if fieldErrors.agentType}
          <p class="field-error">{fieldErrors.agentType}</p>
        {/if}
      </div>

      <div class="form-grid">
        <label>
          <span>Exposure Level</span>
          <select
            aria-invalid={fieldErrors.exposureLevel ? "true" : "false"}
            bind:value={form.exposureLevel}
          >
            <option value="">Select level</option>
            {#each EXPOSURE_LEVELS as lvl}
              <option value={lvl}>{lvl}</option>
            {/each}
          </select>
        </label>
        {#if fieldErrors.exposureLevel}
          <p class="field-error">{fieldErrors.exposureLevel}</p>
        {/if}

        <label>
          <span>Worker Count</span>
          <input type="number" min="0" bind:value={form.workerCount} />
        </label>
      </div>

      <div class="form-grid">
        <label>
          <span>Monitoring Frequency</span>
          <select bind:value={form.monitoringFrequency}>
            <option value="">Select frequency</option>
            {#each MONITORING_FREQUENCIES as freq}
              <option value={freq}>{freq}</option>
            {/each}
          </select>
        </label>

        <label>
          <span>Status</span>
          <select bind:value={form.status}>
            {#each SEG_STATUSES as s}
              <option value={s}>{getSegStatusLabel(s)}</option>
            {/each}
          </select>
        </label>
      </div>

      <label>
        <span>Description</span>
        <textarea rows="3" bind:value={form.description}></textarea>
      </label>

      <label>
        <span>Controls</span>
        <textarea rows="3" placeholder="Describe exposure controls in place..." bind:value={form.controls}></textarea>
      </label>

      <div class="action-row">
        <button class="button-link" type="submit">Save SEG</button>
        <button class="secondary-button" type="button" onclick={closeForm}>Cancel</button>
      </div>
    </form>
  {/if}

  {#if $persistenceDiagnostics.status === "loading"}
    <RegisterState title="Loading SEGs" message="Initializing local persistence and reading the SEGs register." live />
  {:else if $persistenceDiagnostics.status === "not_configured"}
    <RegisterState
      title="Persistence is not configured"
      message="SEGs cannot be read or saved until local persistence initializes."
      secondaryActionLabel="Initialize persistence"
      onSecondaryAction={initializePage}
    />
  {:else if $persistenceDiagnostics.status === "error"}
    <RegisterState
      title="SEGs could not load"
      message={$persistenceDiagnostics.lastError ?? "Local persistence reported an error."}
      secondaryActionLabel="Retry"
      onSecondaryAction={initializePage}
    />
  {:else if $segRecords.length === 0}
    <RegisterState
      title="No SEGs recorded"
      message="Add the first Similar Exposure Group to begin occupational hygiene monitoring."
      primaryActionLabel="New SEG"
      onPrimaryAction={startCreate}
    />
  {:else}
    <section class="register-panel" aria-labelledby="seg-count">
      <div class="register-toolbar">
        <div>
          <h2 id="seg-count">{visibleSegs.length} of {$segRecords.length} SEGs</h2>
          <span class="register-meta">Persisted at {$persistenceDiagnostics.dataPath}</span>
        </div>
        <label class="search-control">
          <span>Search</span>
          <input class="toolbar-input" placeholder="Search SEGs" bind:value={searchQuery} />
        </label>
      </div>

      {#if visibleSegs.length === 0}
        <RegisterState
          title="No SEGs match this search."
          message="Clear or revise the search query to view SEGs."
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
                    {getSortLabel("name", "Group")}
                  </button>
                </th>
                <th>
                  <button class="sort-button" type="button" onclick={() => toggleSort("agentType")}>
                    {getSortLabel("agentType", "Agent")}
                  </button>
                </th>
                <th>
                  <button class="sort-button" type="button" onclick={() => toggleSort("exposure")}>
                    {getSortLabel("exposure", "Exposure")}
                  </button>
                </th>
                <th>Workers</th>
                <th>
                  <button class="sort-button" type="button" onclick={() => toggleSort("location")}>
                    {getSortLabel("location", "Location")}
                  </button>
                </th>
                <th>Monitoring</th>
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
              {#each visibleSegs as seg (seg.id)}
                <tr>
                  <td>
                    <strong>{seg.name}</strong>
                    {#if seg.description}
                      <span>{seg.description}</span>
                    {/if}
                  </td>
                  <td>{seg.agentType}</td>
                  <td>
                    <StatusPill label={seg.exposureLevel} tone={getExposureLevelTone(seg.exposureLevel)} />
                  </td>
                  <td>{seg.workerCount || "—"}</td>
                  <td>{locationNameById.get(seg.locationId) ?? "Unknown"}</td>
                  <td>{seg.monitoringFrequency || "—"}</td>
                  <td>
                    <StatusPill label={getSegStatusLabel(seg.status)} tone={getSegStatusTone(seg.status)} />
                  </td>
                  <td>{formatTimestamp(seg.updatedAt)}</td>
                  <td>
                    <button class="secondary-button" type="button" onclick={() => startEdit(seg)}>
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
