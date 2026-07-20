<script lang="ts">
  import { onMount } from "svelte";
  import ActivityFeed from "$lib/components/activity/ActivityFeed.svelte";
  import {
    buildActivityFeedReadModel,
    limitedActivityFromLegacyRecord,
    listActivityRevisions,
    type ActivityFeedItem,
  } from "$lib/application/portal";
  import { getBrowserDatabase, type RecordRevision } from "$lib/data/database";
  import {
    complianceItemRecords,
    correctiveActionRecords,
    findingRecords,
    incidentRecords,
    locationRecords,
    type PersistedRegisterRecord,
  } from "$lib/persistence/local-persistence";

  let loading = $state(true);
  let error = $state<string | null>(null);
  let revisions = $state<RecordRevision[]>([]);
  let query = $state("");
  let sourceFilter = $state("all");
  let typeFilter = $state("all");
  let timeFilter = $state("all");

  const limitedLegacyItems = $derived([
    ...$findingRecords.map((record) =>
      limitedActivityFromLegacyRecord(record, {
        recordType: "Finding",
        recordLabel: "Finding",
        href: (item) => `/field/findings/${encodeURIComponent(item.id)}`,
        title: titleForLegacy,
        scope: (item) => locationName(String((item as Record<string, unknown>).locationId ?? "")),
      }),
    ),
    ...$correctiveActionRecords.map((record) =>
      limitedActivityFromLegacyRecord(record, {
        recordType: "CorrectiveAction",
        recordLabel: "Corrective Action",
        href: (item) => `/actions/corrective-actions/${encodeURIComponent(item.id)}`,
        title: titleForLegacy,
        scope: () => "Corrective action register",
      }),
    ),
    ...$incidentRecords.map((record) =>
      limitedActivityFromLegacyRecord(record, {
        recordType: "Incident",
        recordLabel: "Incident / Near Miss",
        href: (item) => `/incidents/log/${encodeURIComponent(item.id)}`,
        title: titleForLegacy,
        scope: () => "Incident register",
      }),
    ),
    ...$complianceItemRecords.map((record) =>
      limitedActivityFromLegacyRecord(record, {
        recordType: "ComplianceSupport",
        recordLabel: "Compliance Support",
        href: (item) => `/compliance/items/${encodeURIComponent(item.id)}`,
        title: titleForLegacy,
        scope: () => "Compliance support",
      }),
    ),
  ]);
  const readModel = $derived(buildActivityFeedReadModel(revisions, limitedLegacyItems));
  const typeOptions = $derived([...new Set(readModel.items.map((item) => item.recordType))].sort());
  const filteredItems = $derived(readModel.items.filter(activityMatchesFilters));

  onMount(() => {
    void loadActivity();
  });

  async function loadActivity() {
    loading = true;
    error = null;
    try {
      const adapter = await getBrowserDatabase();
      revisions = await listActivityRevisions(adapter.database);
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause);
      revisions = [];
    } finally {
      loading = false;
    }
  }

  function titleForLegacy(record: PersistedRegisterRecord) {
    const values = record as Record<string, unknown>;
    return String(values.title ?? values.name ?? values.summary ?? record.id);
  }

  function locationName(id: string) {
    return $locationRecords.find((location) => location.id === id)?.name ?? "Scope not resolved";
  }

  function activityMatchesFilters(item: ActivityFeedItem) {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const haystack = [
      item.summary,
      item.recordType,
      item.recordTitle,
      item.actor,
      item.scopeLabel,
      item.sourceLabel,
      item.sourceRevisionId,
    ].join(" ").toLocaleLowerCase();

    if (normalizedQuery && !haystack.includes(normalizedQuery)) return false;
    if (sourceFilter !== "all" && item.sourceState !== sourceFilter) return false;
    if (typeFilter !== "all" && item.recordType !== typeFilter) return false;
    if (!matchesTimeFilter(item.timestamp)) return false;
    return true;
  }

  function matchesTimeFilter(timestamp: string) {
    if (timeFilter === "all") return true;
    const date = new Date(timestamp);
    if (Number.isNaN(date.getTime())) return false;
    const days = timeFilter === "7d" ? 7 : 30;
    return Date.now() - date.getTime() <= days * 24 * 60 * 60 * 1000;
  }
</script>

<section class="page activity-page" aria-labelledby="activity-page-title">
  <header class="page-header">
    <div class="breadcrumbs">Home</div>
    <h1 class="page-title" id="activity-page-title">Activity</h1>
    <p class="page-summary">
      Review governed record revisions and clearly labeled limited legacy metadata without treating
      navigation history as audit activity.
    </p>
  </header>

  {#if error}
    <section class="activity-alert" role="alert" aria-labelledby="activity-error-title">
      <h2 id="activity-error-title">Activity source unavailable</h2>
      <p>{error}</p>
      <button type="button" onclick={loadActivity}>Retry</button>
    </section>
  {/if}

  <section class="activity-controls" aria-labelledby="activity-controls-title">
    <div>
      <h2 id="activity-controls-title">Filter Activity</h2>
      <p>{readModel.sourceSummary}</p>
    </div>
    <label>
      Search
      <input bind:value={query} placeholder="Search activity, actor, source, or scope" />
    </label>
    <label>
      Source
      <select bind:value={sourceFilter}>
        <option value="all">All sources</option>
        <option value="current">Immutable revisions</option>
        <option value="limited-history">Limited legacy history</option>
      </select>
    </label>
    <label>
      Record type
      <select bind:value={typeFilter}>
        <option value="all">All record types</option>
        {#each typeOptions as option}
          <option value={option}>{option}</option>
        {/each}
      </select>
    </label>
    <label>
      Time
      <select bind:value={timeFilter}>
        <option value="all">All retained activity</option>
        <option value="7d">Last 7 days</option>
        <option value="30d">Last 30 days</option>
      </select>
    </label>
  </section>

  <section class="activity-panel" aria-labelledby="activity-results-title">
    <div class="activity-panel-heading">
      <div>
        <h2 id="activity-results-title">Traceable Feed</h2>
        <p>
          Every immutable row links to a revision source. Limited-history rows disclose that they
          come from retained created/updated metadata.
        </p>
      </div>
      {#if loading}
        <span role="status">Loading revisions</span>
      {:else}
        <span>{filteredItems.length} shown</span>
      {/if}
    </div>

    <ActivityFeed items={filteredItems} />
  </section>
</section>

<style>
  .activity-page {
    display: grid;
    align-content: start;
    gap: 16px;
  }

  .activity-alert,
  .activity-controls,
  .activity-panel {
    display: grid;
    gap: 14px;
    max-width: 1180px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: rgba(15, 25, 27, 0.88);
    box-shadow: var(--surface-shadow);
    padding: 18px;
  }

  .activity-alert {
    border-color: var(--color-danger-border);
    background: var(--color-danger-soft);
  }

  .activity-alert h2,
  .activity-controls h2,
  .activity-panel h2,
  .activity-controls p,
  .activity-panel p {
    margin: 0;
  }

  .activity-alert p,
  .activity-controls p,
  .activity-panel p {
    color: var(--color-muted);
    font-size: 0.875rem;
  }

  .activity-controls {
    grid-template-columns: minmax(220px, 1.3fr) repeat(4, minmax(150px, 1fr));
    align-items: end;
  }

  .activity-controls label {
    display: grid;
    gap: 6px;
    color: var(--color-muted);
    font-size: 0.75rem;
    font-weight: 740;
  }

  .activity-controls input,
  .activity-controls select {
    min-height: 40px;
    border: 1px solid var(--color-field-border);
    border-radius: var(--radius-control);
    background: var(--color-field-bg);
    color: var(--color-text);
    padding: 8px 10px;
  }

  .activity-panel-heading {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 14px;
  }

  .activity-panel-heading span {
    flex: 0 0 auto;
    border: 1px solid var(--color-border);
    border-radius: 999px;
    color: var(--color-muted);
    font-size: 0.75rem;
    font-weight: 760;
    padding: 5px 9px;
  }

  .activity-alert button {
    width: fit-content;
    border: 1px solid var(--color-danger-border);
    border-radius: var(--radius-control);
    background: rgba(255, 255, 255, 0.04);
    color: var(--color-text);
    padding: 8px 11px;
  }

  @media (max-width: 1080px) {
    .activity-controls {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .activity-controls > div {
      grid-column: 1 / -1;
    }
  }

  @media (max-width: 640px) {
    .activity-controls,
    .activity-panel-heading {
      display: grid;
      grid-template-columns: 1fr;
    }
  }
</style>
