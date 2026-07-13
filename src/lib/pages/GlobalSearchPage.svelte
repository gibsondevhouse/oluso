<script lang="ts">
  import { onMount } from "svelte";
  import RegisterState from "$lib/components/register/RegisterState.svelte";
  import { REGISTER_CONFIGS, type MvpRegisterKind } from "$lib/components/register/register-config";
  import StatusPill from "$lib/components/ui/StatusPill.svelte";
  import { olusoApplication } from "../../application/oluso-application";
  import {
    GLOBAL_SEARCH_REGISTER_KINDS,
    searchAllRegisters,
    type GlobalSearchResult,
  } from "$lib/search/global-search";

  type RegisterFilter = MvpRegisterKind | "all";

  let searchQuery = $state("");
  let registerFilter = $state<RegisterFilter>("all");
  let includeArchived = $state(false);
  let loading = $state(true);
  let errorMessage = $state<string | null>(null);
  let searchError = $state<string | null>(null);
  let results = $state<GlobalSearchResult[]>([]);
  let refreshNonce = $state(0);

  const registerOptions = GLOBAL_SEARCH_REGISTER_KINDS.map((kind) => ({
    kind,
    label: REGISTER_CONFIGS[kind].title,
  }));
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
      const nextResults = searchAllRegisters(olusoApplication, searchQuery, { includeArchived });
      results =
        registerFilter === "all"
          ? nextResults
          : nextResults.filter((result) => result.kind === registerFilter);
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
</script>

<section class="page" aria-labelledby="global-search-title">
  <header class="page-header">
    <div class="breadcrumbs">Workspace</div>
    <h1 class="page-title" id="global-search-title">Global Search</h1>
    <p class="page-summary">
      Search active register records from one place, with optional archived-record review.
    </p>
  </header>

  <section class="search-panel" aria-labelledby="global-search-controls-title">
    <div class="search-panel-header">
      <h2 id="global-search-controls-title">Search registers</h2>
      <button class="secondary-button" type="button" onclick={initializeSearch} disabled={loading}>
        {loading ? "Refreshing..." : "Refresh"}
      </button>
    </div>

    <div class="search-controls">
      <label class="toolbar-control global-search-input">
        <span>Search</span>
        <input
          class="toolbar-input"
          placeholder="Search all registers"
          bind:value={searchQuery}
          disabled={loading}
        />
      </label>

      <label class="toolbar-control">
        <span>Register</span>
        <select class="toolbar-input" bind:value={registerFilter} disabled={loading}>
          <option value="all">All registers</option>
          {#each registerOptions as option}
            <option value={option.kind}>{option.label}</option>
          {/each}
        </select>
      </label>

      <label class="checkbox-control">
        <input type="checkbox" bind:checked={includeArchived} disabled={loading} />
        <span>Include archived records</span>
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
      title="Search all registers"
      message="Enter a search term to find matching records across the workspace."
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
              <p>{result.matchedText}</p>
            </div>
            <div class="result-meta">
              <span>{result.registerTitle}</span>
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
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
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
    font-size: 1rem;
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
    font-weight: 700;
  }

  .global-search-input {
    width: min(360px, 100%);
  }

  .checkbox-control {
    display: inline-flex;
    align-items: center;
    min-height: 36px;
    gap: 8px;
    color: var(--color-text);
    font-size: 0.875rem;
    font-weight: 650;
  }

  .checkbox-control input {
    width: 16px;
    height: 16px;
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
    border-top: 1px solid var(--color-border);
    padding: 14px 0;
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
    font-weight: 700;
    text-decoration: none;
    overflow-wrap: anywhere;
  }

  .result-title:hover {
    color: var(--color-accent);
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
