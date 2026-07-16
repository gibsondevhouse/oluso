<script lang="ts">
  import { AlertTriangle, CheckCircle2, Database } from "lucide-svelte";
  import {
    findingRecords,
    getPersistenceStatusLabel,
    correctiveActionRecords,
    hazardRecords,
    persistenceDiagnostics,
  } from "$lib/persistence/local-persistence";

  interface PrioritySignal {
    id: string;
    title: string;
    value: number;
    sub: string;
    href: string;
    state: "attention" | "steady";
  }

  const statusLabel = $derived(getPersistenceStatusLabel($persistenceDiagnostics.status));
  const openActions = $derived(
    $correctiveActionRecords.filter(
      (action) => !["Verified", "Closed", "Canceled"].includes(action.status),
    ).length,
  );
  const openFindings = $derived(
    $findingRecords.filter((finding) => finding.status === "Open").length,
  );
  const activeHazards = $derived(
    $hazardRecords.filter((hazard) => hazard.status === "active").length,
  );
  const prioritySignals = $derived(
    [
      {
        id: "open-findings",
        title: "Open Findings",
        value: openFindings,
        sub: `of ${$findingRecords.length} total`,
        href: "/field/findings",
        state: openFindings > 0 ? "attention" : "steady",
      },
      {
        id: "open-actions",
        title: "Open Actions",
        value: openActions,
        sub: `of ${$correctiveActionRecords.length} total`,
        href: "/actions/corrective-actions",
        state: openActions > 0 ? "attention" : "steady",
      },
      {
        id: "active-hazards",
        title: "Active Hazards",
        value: activeHazards,
        sub: `of ${$hazardRecords.length} total`,
        href: "/hse/hazards",
        state: activeHazards > 0 ? "attention" : "steady",
      },
    ] satisfies PrioritySignal[],
  );
</script>

<section class="page dashboard-page" aria-labelledby="dashboard-title">
  <header class="page-header dashboard-header">
    <div class="dashboard-title-block">
      <div class="breadcrumbs">Dashboard</div>
      <h1 class="page-title" id="dashboard-title">OLUSO Dashboard</h1>
      <p class="page-summary">
        Review the highest-priority HSE signals. Use the sidepanel to open workflows and registers.
      </p>
    </div>
    <div class="status-strip" aria-label="Persistence status">
      <Database size={16} aria-hidden="true" />
      <span class="status-pill {$persistenceDiagnostics.status}">{statusLabel}</span>
      {#if $persistenceDiagnostics.dataPath}
        <span class="status-path">{$persistenceDiagnostics.dataPath}</span>
      {/if}
    </div>
  </header>

  <section class="dashboard-panel" aria-labelledby="priority-signals-title">
    <div class="panel-heading">
      <div>
        <h2 id="priority-signals-title">Priority Signals</h2>
        <p>Only the critical health-check metrics stay on the dashboard; the sidepanel owns workflow navigation.</p>
      </div>
    </div>

    <div class="priority-list" aria-label="Priority Signals">
      {#each prioritySignals as signal (signal.id)}
        <a class="priority-row {signal.state}" href={signal.href}>
          <span class="priority-icon" aria-hidden="true">
            {#if signal.state === "attention"}
              <AlertTriangle size={18} />
            {:else}
              <CheckCircle2 size={18} />
            {/if}
          </span>
          <span class="priority-title">{signal.title}</span>
          <strong>{signal.value}</strong>
          <span>{signal.sub}</span>
        </a>
      {/each}
    </div>
  </section>
</section>

<style>
  .dashboard-page {
    max-width: 1180px;
    padding-block: 34px;
  }

  .dashboard-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 28px;
    margin-bottom: 28px;
  }

  .dashboard-title-block {
    display: grid;
    gap: 8px;
    min-width: 0;
  }

  .status-strip {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 10px;
    min-width: 240px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: var(--glass-bg-subtle);
    box-shadow: var(--elevation-z0);
    padding: 10px 12px;
    color: var(--color-muted);
  }

  .status-path {
    max-width: 320px;
    overflow: hidden;
    color: var(--color-muted);
    font-size: 0.75rem;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dashboard-panel {
    display: grid;
    gap: 20px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: linear-gradient(180deg, rgba(22, 33, 36, 0.84), rgba(14, 23, 25, 0.82));
    box-shadow: var(--surface-shadow);
    padding: 20px;
  }

  .panel-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
    padding-bottom: 18px;
    border-bottom: 1px solid var(--glass-border-subtle);
  }

  .panel-heading h2 {
    margin: 0;
    color: var(--color-text);
    font-size: 1.125rem;
    font-weight: 760;
    letter-spacing: 0;
    line-height: 1.2;
  }

  .panel-heading p {
    max-width: 680px;
    margin: 6px 0 0;
    color: var(--color-muted);
    font-size: 0.9375rem;
  }

  .panel-heading > span {
    color: var(--color-muted);
    font-size: 0.75rem;
    font-weight: 680;
    white-space: nowrap;
  }

  .priority-list {
    display: grid;
    gap: 0;
    overflow: hidden;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: rgba(7, 12, 14, 0.34);
  }

  .priority-row {
    display: grid;
    grid-template-columns: auto minmax(180px, 1fr) auto minmax(130px, 0.6fr);
    align-items: center;
    gap: 14px;
    border-bottom: 1px solid var(--glass-border-subtle);
    color: var(--color-text);
    padding: 18px;
    text-decoration: none;
    transition:
      background-color var(--motion-duration-fast) var(--motion-ease-standard),
      border-color var(--motion-duration-fast) var(--motion-ease-standard);
  }

  .priority-row:hover,
  .workflow-row:hover {
    border-color: var(--glass-border);
    background: rgba(255, 255, 255, 0.045);
  }

  .priority-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 34px;
    height: 34px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-control);
    background: rgba(255, 255, 255, 0.04);
    color: var(--color-success-text);
  }

  .priority-row strong {
    color: var(--color-text);
    font-size: 2rem;
    font-weight: 760;
    line-height: 1;
  }

  .priority-row > span:last-child {
    color: var(--color-muted);
    font-size: 0.875rem;
    text-align: right;
  }

  .priority-title {
    font-size: 1rem;
    font-weight: 720;
  }

  .priority-row.attention strong {
    color: var(--color-warning-text);
  }

  .priority-row.attention .priority-icon {
    border-color: var(--color-warning-border);
    background: var(--color-warning-soft);
    color: var(--color-warning-text);
  }

  @media (max-width: 860px) {
    .dashboard-header,
    .panel-heading {
      align-items: flex-start;
      flex-direction: column;
    }

    .status-strip {
      justify-content: flex-start;
      min-width: 0;
      width: 100%;
    }

    .status-path {
      max-width: 100%;
    }
  }

  @media (max-width: 640px) {
    .dashboard-page {
      padding-block: 28px;
    }

    .priority-row {
      grid-template-columns: 1fr;
      gap: 8px;
      padding: 18px 0;
    }

    .priority-icon {
      display: none;
    }

    .priority-row > span:last-child {
      text-align: left;
    }

  }
</style>
