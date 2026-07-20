<script lang="ts">
  import {
    Activity,
    AlertTriangle,
    ArrowRight,
    ClipboardList,
    Database,
    Factory,
    History,
    MapPinned,
    Search,
    UserRound,
  } from "lucide-svelte";
  import { buildHomeReadModel } from "$lib/application/portal";
  import {
    chemicalRecords,
    complianceItemRecords,
    controlRecords,
    correctiveActionRecords,
    equipmentRecords,
    exposureMonitoringRecords,
    findingRecords,
    hazardRecords,
    incidentRecords,
    locationRecords,
    persistenceDiagnostics,
    processRecords,
    riskAssessmentRecords,
    segRecords,
  } from "$lib/persistence/local-persistence";
  import { formatTimestamp } from "$lib/utils/date";

  const home = $derived(
    buildHomeReadModel({
      diagnostics: $persistenceDiagnostics,
      now: new Date(),
      locations: $locationRecords,
      processes: $processRecords,
      equipment: $equipmentRecords,
      chemicals: $chemicalRecords,
      hazards: $hazardRecords,
      controls: $controlRecords,
      riskAssessments: $riskAssessmentRecords,
      segs: $segRecords,
      exposureMonitoring: $exposureMonitoringRecords,
      findings: $findingRecords,
      incidents: $incidentRecords,
      complianceItems: $complianceItemRecords,
      correctiveActions: $correctiveActionRecords,
    }),
  );
</script>

<section class="page home-page" aria-labelledby="home-title">
  <header class="home-header">
    <div class="home-title-block">
      <div class="breadcrumbs">Home</div>
      <h1 class="page-title" id="home-title">HSE Operations Portal</h1>
      <p class="page-summary">
        Start with current work, attention items, plant context, and local data health.
      </p>
    </div>

    <div class="local-status" aria-label="Local data status">
      <Database size={16} aria-hidden="true" />
      <span>{home.localStatusLabel}</span>
      <small title={home.localStatusDetail}>{home.localStatusDetail}</small>
    </div>
  </header>

  <section class="context-strip" aria-labelledby="home-context-title">
    <div class="context-copy">
      <span class="section-kicker">Working Context</span>
      <h2 id="home-context-title">{home.context.title}</h2>
      <p>{home.context.detail}</p>
    </div>
    <a class="secondary-button" href={home.context.href}>
      <MapPinned size={16} aria-hidden="true" />
      Open context
    </a>
  </section>

  {#if home.storageNotice}
    <section class="storage-notice tone-{home.storageNotice.tone}" aria-labelledby="home-storage-title">
      <AlertTriangle size={18} aria-hidden="true" />
      <div>
        <h2 id="home-storage-title">{home.storageNotice.title}</h2>
        <p>{home.storageNotice.message}</p>
      </div>
      <a href={home.storageNotice.href}>Review diagnostics</a>
    </section>
  {/if}

  {#if home.firstUse}
    <section class="first-use" aria-labelledby="home-first-use-title">
      <h2 id="home-first-use-title">Start local HSE records</h2>
      <p>
        No active local records are loaded yet. Create a Location first, then add Processes,
        Chemicals, Findings, and Actions as domain dependencies become available.
      </p>
      <div class="action-row">
        <a class="button-link" href="/operations/locations/new">Add Location</a>
        <a class="secondary-button" href="/search">Open Search</a>
      </div>
    </section>
  {/if}

  <div class="home-grid">
    <section class="home-panel continue-panel" aria-labelledby="continue-title">
      <div class="panel-heading">
        <div>
          <span class="section-kicker">Resume</span>
          <h2 id="continue-title">Continue Working</h2>
        </div>
        <History size={18} aria-hidden="true" />
      </div>

      {#if home.continueWork.length}
        <ul class="row-list">
          {#each home.continueWork as item (item.sourceId)}
            <li>
              <a class="work-row" href={item.href}>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.reason}</small>
                </span>
                <span>{item.summary}</span>
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="empty-copy">No draft or in-progress work is available from current records.</p>
      {/if}
    </section>

    <section class="home-panel attention-panel" aria-labelledby="attention-title">
      <div class="panel-heading">
        <div>
          <span class="section-kicker">Review</span>
          <h2 id="attention-title">Needs Attention</h2>
        </div>
        <AlertTriangle size={18} aria-hidden="true" />
      </div>

      {#if home.attention.length}
        <ul class="row-list">
          {#each home.attention as item (item.sourceId)}
            <li>
              <a class="attention-row tone-{item.tone}" href={item.href}>
                <span class="attention-icon" aria-hidden="true">
                  {#if item.tone === "critical"}
                    <AlertTriangle size={16} />
                  {:else}
                    <ClipboardList size={16} />
                  {/if}
                </span>
                <span>
                  <strong>{item.title}</strong>
                  <small>{item.sourceLabel} · {item.sourceState}</small>
                </span>
                <span>{item.summary}</span>
              </a>
            </li>
          {/each}
        </ul>
      {:else}
        <p class="empty-copy">No open attention items are available from current governed fields.</p>
      {/if}
    </section>
  </div>

  <section class="home-panel" aria-labelledby="plant-status-title">
    <div class="panel-heading">
      <div>
        <span class="section-kicker">Plant</span>
        <h2 id="plant-status-title">Today at the Plant</h2>
      </div>
      <Factory size={18} aria-hidden="true" />
    </div>

    <div class="status-grid">
      {#each home.plantStatus as item (item.id)}
        <a class="status-row tone-{item.tone}" href={item.href} title={item.derivationRule}>
          <span>
            <strong>{item.label}</strong>
            <small>{item.detail}</small>
          </span>
          <b>{item.value}</b>
        </a>
      {/each}
    </div>
  </section>

  <div class="home-grid lower-grid">
    <section class="home-panel" aria-labelledby="quick-actions-title">
      <div class="panel-heading">
        <div>
          <span class="section-kicker">Start</span>
          <h2 id="quick-actions-title">Quick Actions</h2>
        </div>
        <Search size={18} aria-hidden="true" />
      </div>

      <div class="quick-actions">
        {#each home.quickActions as action (action.id)}
          <a class="quick-action" href={action.href}>
            <span>
              <strong>{action.title}</strong>
              <small>{action.description}</small>
            </span>
            <ArrowRight size={16} aria-hidden="true" />
          </a>
        {/each}
      </div>
    </section>

    <section class="home-panel" aria-labelledby="activity-title">
      <div class="panel-heading">
        <div>
          <span class="section-kicker">Change</span>
          <h2 id="activity-title">Recent Activity</h2>
        </div>
        <a class="panel-link" href="/activity">
          <Activity size={16} aria-hidden="true" />
          Open feed
        </a>
      </div>

      {#if home.activity.length}
        <ul class="activity-list">
          {#each home.activity as item (item.sourceId)}
            <li>
              <a href={item.href}>
                <span>
                  <strong>{item.recordTitle}</strong>
                  <small>{item.summary}</small>
                </span>
                <time datetime={item.timestamp}>{formatTimestamp(item.timestamp)}</time>
              </a>
            </li>
          {/each}
        </ul>
        <p class="source-note">
          Activity shown here is limited where records expose only created/updated metadata.
        </p>
      {:else}
        <p class="empty-copy">No recent record metadata is available yet.</p>
      {/if}
    </section>
  </div>

  <section class="home-panel responsibilities-panel" aria-labelledby="responsibilities-title">
    <div class="panel-heading">
      <div>
        <span class="section-kicker">Owners</span>
        <h2 id="responsibilities-title">My Responsibilities</h2>
      </div>
      <UserRound size={18} aria-hidden="true" />
    </div>

    {#if home.responsibilities.length}
      <div class="responsibility-grid">
        {#each home.responsibilities as summary (summary.id)}
          <a class="responsibility-row" href={summary.href} title={summary.derivationRule}>
            <span>
              <strong>{summary.owner}</strong>
              <small>{summary.sourceLabel}</small>
            </span>
            <span>
              <b>{summary.openCount}</b>
              <small>{summary.overdueCount} due now</small>
            </span>
          </a>
        {/each}
      </div>
    {:else}
      <p class="empty-copy">No owner-assigned open work is available from current records.</p>
    {/if}
  </section>

  <p class="home-boundary">
    Home uses source records and explicit statuses only. It does not determine legal compliance,
    exposure acceptability, or professional approval.
  </p>
</section>

<style>
  .home-page {
    max-width: 1240px;
    padding-block: 30px 44px;
  }

  .home-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 18px;
  }

  .home-title-block {
    display: grid;
    min-width: 0;
    gap: 8px;
  }

  .local-status {
    display: grid;
    grid-template-columns: auto auto;
    align-items: center;
    justify-content: end;
    min-width: min(320px, 100%);
    gap: 4px 8px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: var(--glass-bg-subtle);
    box-shadow: var(--elevation-z0);
    padding: 10px 12px;
    color: var(--color-muted);
  }

  .local-status span {
    color: var(--color-text);
    font-size: 0.8125rem;
    font-weight: 760;
  }

  .local-status small {
    grid-column: 1 / -1;
    max-width: 300px;
    overflow: hidden;
    color: var(--color-muted);
    font-size: 0.75rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .context-strip,
  .first-use,
  .storage-notice,
  .home-panel {
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: linear-gradient(180deg, rgba(22, 33, 36, 0.86), rgba(14, 23, 25, 0.84));
    box-shadow: var(--surface-shadow);
  }

  .context-strip {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    margin-bottom: 16px;
    padding: 18px;
  }

  .context-copy {
    display: grid;
    gap: 4px;
    min-width: 0;
  }

  .context-copy h2,
  .storage-notice h2,
  .first-use h2,
  .panel-heading h2 {
    margin: 0;
    color: var(--color-text);
    font-size: 1.0625rem;
    font-weight: 760;
    line-height: 1.25;
  }

  .panel-link {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-control);
    color: var(--color-accent-strong);
    font-size: 0.75rem;
    font-weight: 760;
    padding: 6px 9px;
    text-decoration: none;
  }

  .context-copy p,
  .first-use p,
  .storage-notice p,
  .empty-copy,
  .source-note,
  .home-boundary {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .section-kicker {
    color: var(--color-accent-strong);
    font-size: 0.6875rem;
    font-weight: 760;
    letter-spacing: 0;
    line-height: 1.2;
    text-transform: uppercase;
  }

  .storage-notice {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
    border-left: 3px solid var(--color-warning-text);
    padding: 14px 16px;
  }

  .storage-notice.tone-critical {
    border-left-color: var(--color-danger);
  }

  .storage-notice a {
    color: var(--color-text);
    font-size: 0.8125rem;
    font-weight: 740;
  }

  .first-use {
    display: grid;
    gap: 12px;
    max-width: 760px;
    margin-bottom: 18px;
    padding: 18px;
  }

  .home-grid {
    display: grid;
    grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
    gap: 16px;
    margin-bottom: 16px;
  }

  .lower-grid {
    grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
    margin-top: 16px;
  }

  .home-panel {
    display: grid;
    align-content: start;
    gap: 14px;
    min-width: 0;
    padding: 16px;
  }

  .panel-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--glass-border-subtle);
    color: var(--color-muted);
  }

  .row-list,
  .activity-list {
    display: grid;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .work-row,
  .attention-row,
  .activity-list a,
  .status-row,
  .quick-action,
  .responsibility-row {
    color: var(--color-text);
    text-decoration: none;
  }

  .work-row,
  .attention-row {
    display: grid;
    align-items: center;
    gap: 12px;
    border-bottom: 1px solid var(--glass-border-subtle);
    padding: 13px 0;
  }

  .work-row {
    grid-template-columns: minmax(0, 1fr) minmax(160px, 0.85fr) auto;
  }

  .attention-row {
    grid-template-columns: auto minmax(0, 0.9fr) minmax(180px, 1fr);
  }

  .row-list li:last-child .work-row,
  .row-list li:last-child .attention-row {
    border-bottom: 0;
    padding-bottom: 0;
  }

  .work-row:hover,
  .attention-row:hover,
  .activity-list a:hover,
  .status-row:hover,
  .quick-action:hover,
  .responsibility-row:hover {
    color: var(--color-accent-strong);
  }

  .work-row strong,
  .attention-row strong,
  .activity-list strong,
  .status-row strong,
  .quick-action strong,
  .responsibility-row strong {
    display: block;
    color: inherit;
    font-size: 0.9375rem;
    font-weight: 760;
    line-height: 1.3;
    overflow-wrap: anywhere;
  }

  .work-row small,
  .attention-row small,
  .activity-list small,
  .status-row small,
  .quick-action small,
  .responsibility-row small {
    display: block;
    color: var(--color-muted);
    font-size: 0.75rem;
    line-height: 1.35;
    overflow-wrap: anywhere;
  }

  .work-row > span:nth-child(2),
  .attention-row > span:last-child {
    color: var(--color-muted);
    font-size: 0.8125rem;
    line-height: 1.4;
  }

  .attention-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--color-warning-border);
    border-radius: var(--radius-control);
    background: var(--color-warning-soft);
    color: var(--color-warning-text);
  }

  .attention-row.tone-critical .attention-icon {
    border-color: var(--color-danger-border);
    background: var(--color-danger-soft);
    color: var(--color-danger);
  }

  .status-grid,
  .quick-actions,
  .responsibility-grid {
    display: grid;
    gap: 10px;
  }

  .status-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .status-row {
    display: grid;
    min-height: 132px;
    align-content: space-between;
    gap: 14px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-control);
    background: rgba(7, 12, 14, 0.34);
    padding: 14px;
  }

  .status-row b {
    color: var(--color-text);
    font-size: 2rem;
    font-weight: 760;
    line-height: 1;
  }

  .status-row.tone-attention b {
    color: var(--color-warning-text);
  }

  .status-row.tone-warning b {
    color: var(--color-brand-blue);
  }

  .status-row.tone-steady b {
    color: var(--color-success-text);
  }

  .quick-action,
  .responsibility-row,
  .activity-list a {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-control);
    background: rgba(7, 12, 14, 0.34);
    padding: 13px;
  }

  .activity-list {
    gap: 8px;
  }

  .activity-list time {
    flex: 0 0 auto;
    color: var(--color-muted);
    font-size: 0.75rem;
    white-space: nowrap;
  }

  .source-note {
    border-top: 1px solid var(--glass-border-subtle);
    padding-top: 10px;
  }

  .responsibility-row > span:last-child {
    display: grid;
    min-width: 76px;
    justify-items: end;
  }

  .responsibility-row b {
    color: var(--color-warning-text);
    font-size: 1.25rem;
    line-height: 1;
  }

  .home-boundary {
    margin-top: 16px;
    max-width: 920px;
  }

  @media (max-width: 980px) {
    .home-header,
    .context-strip {
      align-items: stretch;
      flex-direction: column;
    }

    .local-status {
      justify-content: start;
    }

    .home-grid,
    .lower-grid,
    .status-grid {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 680px) {
    .home-page {
      padding: 22px 18px 34px;
    }

    .work-row,
    .attention-row,
    .storage-notice {
      grid-template-columns: 1fr;
    }

    .attention-icon {
      display: none;
    }

    .activity-list a {
      align-items: flex-start;
      flex-direction: column;
    }
  }
</style>
