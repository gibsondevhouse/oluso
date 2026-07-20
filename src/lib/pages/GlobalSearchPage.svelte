<script lang="ts">
  import { onMount } from "svelte";
  import { Archive, RefreshCw, Search, SlidersHorizontal } from "lucide-svelte";
  import { getBrowserDatabase } from "$lib/data/database";
  import { ChemicalApplication } from "$lib/application/chemical";
  import RegisterState from "$lib/components/register/RegisterState.svelte";
  import { REGISTER_CONFIGS } from "$lib/components/register/register-config";
  import StatusPill from "$lib/components/ui/StatusPill.svelte";
  import { olusoApplication } from "../../application/oluso-application";
  import { foundationApplication } from "$lib/application/foundation";
  import { workspaceScope } from "$lib/workspace/scope";
  import type { PersistedRegisterRecord } from "$lib/persistence/local-persistence";
  import {
    GLOBAL_SEARCH_REGISTER_KINDS,
    TYPED_ENTERPRISE_SEARCH_OPTIONS,
    searchAllRegisters,
    searchTypedEnterpriseRecords,
    sortGlobalSearchResults,
    type GlobalSearchResultKind,
    type GlobalSearchResult,
    type TypedEnterpriseSearchContext,
  } from "$lib/search/global-search";

  type RegisterFilter = GlobalSearchResultKind | "all";

  let searchQuery = $state("");
  let registerFilter = $state<RegisterFilter>("all");
  let includeArchived = $state(false);
  let loading = $state(true);
  let errorMessage = $state<string | null>(null);
  let searchError = $state<string | null>(null);
  let results = $state<GlobalSearchResult[]>([]);
  let typedContext = $state<TypedEnterpriseSearchContext>({
    organizations: [], people: [], locations: [], operationalFunctions: [], processes: [], tasks: [],
    chemicalSubstances: [], chemicalProducts: [], siteChemicalInventory: [], chemicalUses: [], sdsRevisions: [],
  });
  let refreshNonce = $state(0);

  const registerOptions = [
    ...TYPED_ENTERPRISE_SEARCH_OPTIONS,
    ...GLOBAL_SEARCH_REGISTER_KINDS
      .filter((kind) => !TYPED_ENTERPRISE_SEARCH_OPTIONS.some((option) => option.kind === kind))
      .map((kind) => ({ kind, label: REGISTER_CONFIGS[kind].title })),
  ];
  const hasQuery = $derived(Boolean(searchQuery.trim()));
  const resultCount = $derived(results.length);
  const resultCountLabel = $derived(
    `${resultCount} ${resultCount === 1 ? "record" : "records"} found`,
  );

  onMount(() => {
    void initializeSearch();
  });

  $effect(() => {
    refreshNonce;

    if (loading || errorMessage || !hasQuery) {
      results = [];
      searchError = null;
      return;
    }

    try {
      const typedResults = searchTypedEnterpriseRecords(typedContext, searchQuery, { includeArchived });
      const nextResults = [
        ...typedResults,
        ...searchAllRegisters(olusoApplication, searchQuery, { includeArchived })
          .filter((result) => !typedResults.some((typedResult) => typedResult.href === result.href)),
      ].filter(resultMatchesWorkspaceScope);
      results =
        registerFilter === "all"
          ? sortGlobalSearchResults(nextResults)
          : sortGlobalSearchResults(nextResults.filter((result) => result.kind === registerFilter));
      searchError = null;
    } catch (error) {
      results = [];
      searchError = serializeError(error);
    }
  });

  function serializeError(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }

  async function initializeSearch() {
    loading = true;
    errorMessage = null;
    searchError = null;

    try {
      await olusoApplication.initialize();
      const adapter = await getBrowserDatabase();
      const chemicalApplication = new ChemicalApplication(adapter.database);
      const services = await foundationApplication.services();
      const [
        organizations,
        people,
        locations,
        operationalFunctions,
        processes,
        tasks,
        chemicalSubstances,
        chemicalProducts,
        siteChemicalInventory,
        chemicalUses,
        sdsRevisions,
      ] = await Promise.all([
        services.organizations.list(true), services.people.list(true), services.locations.list(true),
        services.operationalFunctions.list(true), services.processes.list(true), services.tasks.list(true),
        chemicalApplication.repositories.substances.list({ includeArchived: true }),
        chemicalApplication.repositories.products.list({ includeArchived: true }),
        chemicalApplication.repositories.inventory.list({ includeArchived: true }),
        chemicalApplication.repositories.uses.list({ includeArchived: true }),
        chemicalApplication.repositories.sds.list({ includeArchived: true }),
      ]);
      typedContext = {
        organizations,
        people,
        locations,
        operationalFunctions,
        processes,
        tasks,
        chemicalSubstances,
        chemicalProducts,
        siteChemicalInventory,
        chemicalUses,
        sdsRevisions,
      };
      refreshNonce += 1;
    } catch (error) {
      errorMessage = serializeError(error);
    } finally {
      loading = false;
    }
  }

  function clearSearch() {
    searchQuery = "";
    registerFilter = "all";
    includeArchived = false;
  }

  function locationMatchesScope(locationId?: string) {
    if (!locationId) return false;
    const location = typedContext.locations.find((item) => item.id === locationId);
    if (!location) return false;
    return (!$workspaceScope.countryId || location.id === $workspaceScope.countryId || location.resolvedCountryId === $workspaceScope.countryId)
      && (!$workspaceScope.siteId || location.id === $workspaceScope.siteId || location.resolvedSiteId === $workspaceScope.siteId)
      && (!$workspaceScope.locationId || location.id === $workspaceScope.locationId || location.parentId === $workspaceScope.locationId);
  }

  function genericRecordMatches(record: object) {
    const value = record as unknown as Record<string, unknown>;
    if ($workspaceScope.siteId) {
      const siteValues = [value.siteId, value.resolvedSiteId, value.primarySiteId].filter(Boolean);
      if (siteValues.length && !siteValues.includes($workspaceScope.siteId)) return false;
    }
    if ($workspaceScope.locationId) {
      const locationValues = Object.entries(value).filter(([key]) => key === "locationId" || key.endsWith("LocationId") || key.endsWith("LocationIds")).flatMap(([, item]) => Array.isArray(item) ? item : [item]);
      if (locationValues.length && !locationValues.includes($workspaceScope.locationId)) return false;
    }
    if ($workspaceScope.operationalFunctionId) {
      const functionValues = [value.operationalFunctionId, value.functionId].filter(Boolean);
      if (functionValues.length && !functionValues.includes($workspaceScope.operationalFunctionId)) return false;
    }
    return true;
  }

  function resultMatchesWorkspaceScope(result: GlobalSearchResult) {
    if (!$workspaceScope.organizationId && !$workspaceScope.countryId && !$workspaceScope.siteId && !$workspaceScope.locationId && !$workspaceScope.operationalFunctionId) return true;
    const rawId = result.id.split(":").at(-1) ?? "";
    if (result.kind === "organizations") return !$workspaceScope.organizationId || rawId === $workspaceScope.organizationId;
    if (result.kind === "people") {
      const person = typedContext.people.find((item) => item.id === rawId);
      return Boolean(person) && (!$workspaceScope.siteId || person?.primarySiteId === $workspaceScope.siteId);
    }
    if (result.kind === "locations") return locationMatchesScope(rawId);
    if (result.kind === "operational-functions") return !$workspaceScope.operationalFunctionId || rawId === $workspaceScope.operationalFunctionId;
    if (result.kind === "processes") {
      const process = typedContext.processes.find((item) => item.id === rawId);
      return Boolean(process)
        && (!$workspaceScope.siteId || process?.resolvedSiteId === $workspaceScope.siteId)
        && (!$workspaceScope.locationId || process?.primaryLocationId === $workspaceScope.locationId)
        && (!$workspaceScope.operationalFunctionId || process?.operationalFunctionId === $workspaceScope.operationalFunctionId);
    }
    if (result.kind === "tasks") {
      const task = typedContext.tasks.find((item) => item.id === rawId);
      const process = typedContext.processes.find((item) => item.id === task?.processId);
      return Boolean(task && process)
        && (!$workspaceScope.siteId || process?.resolvedSiteId === $workspaceScope.siteId)
        && (!$workspaceScope.locationId || task?.locationId === $workspaceScope.locationId)
        && (!$workspaceScope.operationalFunctionId || process?.operationalFunctionId === $workspaceScope.operationalFunctionId);
    }

    if (result.kind === "chemical-substances") {
      const substance = typedContext.chemicalSubstances?.find((item) => item.id === rawId);
      return substance ? genericRecordMatches(substance) : false;
    }
    if (result.kind === "chemical-products") {
      const product = typedContext.chemicalProducts?.find((item) => item.id === rawId);
      return product ? genericRecordMatches(product) : false;
    }
    if (result.kind === "chemical-inventory") {
      const inventory = typedContext.siteChemicalInventory?.find((item) => item.id === rawId);
      return inventory ? genericRecordMatches(inventory) : false;
    }
    if (result.kind === "chemical-uses") {
      const chemicalUse = typedContext.chemicalUses?.find((item) => item.id === rawId);
      return chemicalUse ? genericRecordMatches(chemicalUse) : false;
    }
    if (result.kind === "sds-revisions") {
      const revision = typedContext.sdsRevisions?.find((item) => item.id === rawId);
      return revision ? genericRecordMatches(revision) : false;
    }

    if (!(result.kind in REGISTER_CONFIGS)) return false;
    const config = REGISTER_CONFIGS[result.kind];
    const record = olusoApplication.getRecord(config.collection, rawId);
    return record ? genericRecordMatches(record) : false;
  }
</script>

<section class="page" aria-labelledby="global-search-title">
  <header class="page-header">
    <div class="breadcrumbs">Workspace</div>
    <h1 class="page-title" id="global-search-title">Search workspace</h1>
    <p class="page-summary">
      Search current typed records and retained legacy registers from one place, with optional archived-record review.
    </p>
  </header>

  <section class="search-panel" aria-labelledby="global-search-controls-title">
    <div class="search-panel-header">
      <h2 id="global-search-controls-title">Search records</h2>
      <button class="secondary-button" type="button" onclick={initializeSearch} disabled={loading}>
        <RefreshCw size={16} aria-hidden="true" />
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </div>

    <div class="search-controls">
      <label class="toolbar-control global-search-input">
        <span><Search size={14} aria-hidden="true" /> Search</span>
        <input
          class="toolbar-input"
          placeholder="Search all records"
          bind:value={searchQuery}
          disabled={loading}
        />
      </label>

      <label class="toolbar-control">
        <span><SlidersHorizontal size={14} aria-hidden="true" /> Type</span>
        <select class="toolbar-input" bind:value={registerFilter} disabled={loading}>
          <option value="all">All records</option>
          {#each registerOptions as option}
            <option value={option.kind}>{option.label}</option>
          {/each}
        </select>
      </label>

      <label class="checkbox-control">
        <input type="checkbox" bind:checked={includeArchived} disabled={loading} />
        <span><Archive size={14} aria-hidden="true" /> Include archived records</span>
      </label>
    </div>
  </section>

  {#if loading}
    <RegisterState title="Loading search" message="Preparing register data for search." live />
  {:else if errorMessage}
    <RegisterState
      title="Search could not load"
      message={errorMessage}
      secondaryActionLabel="Retry"
      onSecondaryAction={initializeSearch}
    />
  {:else if searchError}
    <RegisterState
      title="Search could not run"
      message={searchError}
      secondaryActionLabel="Retry"
      onSecondaryAction={() => (refreshNonce += 1)}
    />
  {:else if !hasQuery}
    <RegisterState
      title="Search all records"
      message="Enter a search term to find current typed records and retained legacy/reference records."
    />
  {:else if results.length === 0}
    <RegisterState
      title="No matching records"
      message="Clear or revise the search query and register filter."
      secondaryActionLabel="Clear search"
      onSecondaryAction={clearSearch}
    />
  {:else}
    <section class="search-results-panel" aria-labelledby="global-search-results-title">
      <div class="results-header">
        <h2 id="global-search-results-title">{resultCountLabel}</h2>
        <span class="register-meta">
          {includeArchived ? "Active and archived records" : "Active records only"}
        </span>
      </div>

      <ul class="search-results">
        {#each results as result (result.id)}
          <li class="search-result">
            <div class="result-main">
              <a class="result-title" href={result.href}>{result.recordTitle}</a>
              <p>{result.matchedField}: {result.matchedText}</p>
            </div>
            <div class="result-meta">
              <span>{result.registerTitle}</span>
              <span class="source-chip source-{result.sourceState}">{result.sourceLabel}</span>
              <StatusPill
                label={result.statusLabel}
                tone={result.statusTone}
                context={`${result.registerTitle} status`}
                compact
              />
              {#if result.archived}
                <StatusPill label="Archived" tone="inactive" context="lifecycle" compact />
              {:else}
                <StatusPill label="Active" tone="active" context="lifecycle" compact />
              {/if}
              <span>{result.linkedReferenceCount} linked {result.linkedReferenceCount === 1 ? "reference" : "references"}</span>
            </div>
          </li>
        {/each}
      </ul>
    </section>
  {/if}
</section>

<style>
  .search-panel,
  .search-results-panel {
    display: grid;
    gap: 16px;
    max-width: 980px;
    margin-bottom: 20px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: var(--color-surface);
    box-shadow: var(--surface-shadow);
    padding: 18px;
  }

  .search-panel-header,
  .results-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .search-panel-header h2,
  .results-header h2 {
    margin: 0;
    color: var(--color-text);
    font-size: 1.0625rem;
    font-weight: 760;
    line-height: 1.25;
  }

  .search-controls {
    display: flex;
    align-items: end;
    flex-wrap: wrap;
    gap: 12px;
  }

  .toolbar-control {
    display: grid;
    width: min(240px, 100%);
    gap: 6px;
    color: var(--color-muted);
    font-size: 0.75rem;
    font-weight: 760;
  }

  .toolbar-control > span,
  .checkbox-control span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .global-search-input {
    width: min(360px, 100%);
  }

  .checkbox-control {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    gap: 8px;
    border: 1px solid var(--color-field-border);
    border-radius: var(--radius-control);
    background: var(--color-field-bg);
    color: var(--color-text);
    font-size: 0.875rem;
    font-weight: 720;
    padding: 9px 11px;
  }

  .checkbox-control input {
    width: 17px;
    height: 17px;
    margin: 0;
    accent-color: var(--color-accent);
  }

  .search-results {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .search-result {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 16px;
    border-top: 1px solid var(--glass-border-subtle);
    padding: 16px 0;
  }

  .search-result:first-child {
    border-top: 0;
    padding-top: 0;
  }

  .search-result:last-child {
    padding-bottom: 0;
  }

  .result-main {
    display: grid;
    min-width: 0;
    gap: 4px;
  }

  .result-title {
    color: var(--color-text);
    font-weight: 760;
    text-decoration: none;
    overflow-wrap: anywhere;
  }

  .result-title:hover {
    color: var(--color-accent-strong);
    text-decoration: underline;
  }

  .result-main p {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.875rem;
    overflow-wrap: anywhere;
  }

  .result-meta {
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    flex-wrap: wrap;
    gap: 8px;
    color: var(--color-muted);
    font-size: 0.8125rem;
  }

  .source-chip {
    display: inline-flex;
    align-items: center;
    min-height: 22px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.035);
    color: var(--color-muted);
    font-size: 0.75rem;
    font-weight: 720;
    padding: 2px 8px;
  }

  .source-chip.source-current {
    border-color: var(--color-success-border);
    background: var(--color-success-soft);
    color: var(--color-success-text);
  }

  .source-chip.source-legacy {
    border-color: var(--color-warning-border);
    background: var(--color-warning-soft);
    color: var(--color-warning-text);
  }

  @media (max-width: 720px) {
    .search-panel-header,
    .results-header,
    .search-result {
      grid-template-columns: 1fr;
    }

    .search-panel-header,
    .results-header {
      align-items: stretch;
      flex-direction: column;
    }

    .search-controls,
    .result-meta {
      justify-content: flex-start;
    }

    .toolbar-control,
    .global-search-input {
      width: 100%;
    }
  }
</style>
