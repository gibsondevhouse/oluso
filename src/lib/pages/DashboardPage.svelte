<script lang="ts">
  import { APP_ROUTES, isRegisterRouteKind } from "$lib/navigation/route-registry";
  import {
    findingRecords,
    getPersistenceStatusLabel,
    locationRecords,
    processRecords,
    equipmentRecords,
    chemicalRecords,
    controlRecords,
    hazardRecords,
    riskAssessmentRecords,
    segRecords,
    correctiveActionRecords,
    persistenceDiagnostics,
  } from "$lib/persistence/local-persistence";

  const liveRoutes = APP_ROUTES.filter((route) => isRegisterRouteKind(route.kind));
  const statusLabel = $derived(getPersistenceStatusLabel($persistenceDiagnostics.status));
  const openActions = $derived(
    $correctiveActionRecords.filter(
      (action) => !["Verified", "Closed", "Canceled"].includes(action.status),
    ).length,
  );
  const openFindings = $derived(
    $findingRecords.filter((f) => f.status === "Open").length,
  );
  const activeHazards = $derived(
    $hazardRecords.filter((h) => h.status === "active").length,
  );
  const chemicalsNeedingSds = $derived(
    $chemicalRecords.filter((chemical) => ["Missing", "Needs Review"].includes(chemical.sdsStatus)).length,
  );
  const controlsNeedingReview = $derived(
    $controlRecords.filter((control) => ["needs-review", "ineffective"].includes(control.status)).length,
  );
  const riskAssessmentsNeedingReview = $derived(
    $riskAssessmentRecords.filter((assessment) => assessment.reviewStatus === "Needs Review").length,
  );
</script>

<section class="page" aria-labelledby="dashboard-title">
  <header class="page-header">
    <div class="breadcrumbs">Dashboard</div>
    <h1 class="page-title" id="dashboard-title">Dashboard</h1>
    <p class="page-summary">
      Resume field work, review open actions, and jump back into core HSE registers.
    </p>
  </header>

  <div class="dashboard-layout">
    <!-- Status strip -->
    <div class="status-strip">
      <span class="status-pill {$persistenceDiagnostics.status}">{statusLabel}</span>
      {#if $persistenceDiagnostics.dataPath}
        <span class="status-path">{$persistenceDiagnostics.dataPath}</span>
      {/if}
    </div>

    <!-- Key metrics -->
    <section class="panel-grid" aria-labelledby="metrics-title">
      <h2 class="sr-only" id="metrics-title">Key metrics</h2>

      <div class="metric-panel metric-alert" class:has-data={openFindings > 0}>
        <a href="/field/findings" class="metric-link">
          <span class="metric-label">Open Findings</span>
          <span class="metric-value">{openFindings}</span>
          <span class="metric-sub">of {$findingRecords.length} total</span>
        </a>
      </div>

      <div class="metric-panel metric-alert" class:has-data={openActions > 0}>
        <a href="/actions/corrective-actions" class="metric-link">
          <span class="metric-label">Open Actions</span>
          <span class="metric-value">{openActions}</span>
          <span class="metric-sub">of {$correctiveActionRecords.length} total</span>
        </a>
      </div>

      <div class="metric-panel metric-warn" class:has-data={activeHazards > 0}>
        <a href="/hse/hazards" class="metric-link">
          <span class="metric-label">Active Hazards</span>
          <span class="metric-value">{activeHazards}</span>
          <span class="metric-sub">of {$hazardRecords.length} total</span>
        </a>
      </div>

      <div class="metric-panel metric-warn" class:has-data={controlsNeedingReview > 0}>
        <a href="/risk/controls" class="metric-link">
          <span class="metric-label">Control Review</span>
          <span class="metric-value">{controlsNeedingReview}</span>
          <span class="metric-sub">needs attention</span>
        </a>
      </div>

      <div class="metric-panel metric-warn" class:has-data={riskAssessmentsNeedingReview > 0}>
        <a href="/risk/assessments" class="metric-link">
          <span class="metric-label">Risk Reviews</span>
          <span class="metric-value">{riskAssessmentsNeedingReview}</span>
          <span class="metric-sub">needs review</span>
        </a>
      </div>

      <div class="metric-panel">
        <a href="/operations/locations" class="metric-link">
          <span class="metric-label">Locations</span>
          <span class="metric-value">{$locationRecords.length}</span>
          <span class="metric-sub">registered</span>
        </a>
      </div>

      <div class="metric-panel">
        <a href="/operations/processes" class="metric-link">
          <span class="metric-label">Processes</span>
          <span class="metric-value">{$processRecords.length}</span>
          <span class="metric-sub">documented</span>
        </a>
      </div>

      <div class="metric-panel">
        <a href="/operations/equipment" class="metric-link">
          <span class="metric-label">Equipment</span>
          <span class="metric-value">{$equipmentRecords.length}</span>
          <span class="metric-sub">tracked</span>
        </a>
      </div>

      <div class="metric-panel">
        <a href="/hse/chemicals" class="metric-link">
          <span class="metric-label">Chemicals</span>
          <span class="metric-value">{$chemicalRecords.length}</span>
          <span class="metric-sub">in inventory</span>
        </a>
      </div>

      <div class="metric-panel metric-warn" class:has-data={chemicalsNeedingSds > 0}>
        <a href="/hse/chemicals" class="metric-link">
          <span class="metric-label">SDS Needs</span>
          <span class="metric-value">{chemicalsNeedingSds}</span>
          <span class="metric-sub">missing or review</span>
        </a>
      </div>

      <div class="metric-panel">
        <a href="/hse/segs" class="metric-link">
          <span class="metric-label">SEGs</span>
          <span class="metric-value">{$segRecords.length}</span>
          <span class="metric-sub">defined</span>
        </a>
      </div>
    </section>

    <!-- Quick navigation -->
    <section aria-labelledby="quick-links-title">
      <h2 class="section-title" id="quick-links-title">Registers</h2>
      <div class="quick-link-grid">
        {#each liveRoutes as route (route.path)}
          <a class="quick-link" href={route.path}>
            <span class="quick-link-section">{route.section}</span>
            <span class="quick-link-title">{route.title}</span>
            <span class="quick-link-summary">{route.summary}</span>
          </a>
        {/each}
      </div>
    </section>
  </div>
</section>

<style>
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  .dashboard-layout {
    display: grid;
    gap: 28px;
  }

  .status-strip {
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .status-path {
    color: var(--color-muted);
    font-size: 0.75rem;
  }

  .section-title {
    margin: 0 0 12px;
    color: var(--color-text);
    font-size: 1rem;
    font-weight: 700;
    line-height: 1.25;
  }

  .panel-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 10px;
  }

  .metric-panel {
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    overflow: hidden;
  }

  .metric-link {
    display: grid;
    gap: 2px;
    padding: 16px;
    text-decoration: none;
    color: inherit;
  }

  .metric-link:hover {
    background: var(--color-hover);
  }

  .metric-label {
    color: var(--color-muted);
    font-size: 0.75rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .metric-value {
    color: var(--color-text);
    font-size: 2rem;
    font-weight: 720;
    line-height: 1.1;
  }

  .metric-sub {
    color: var(--color-subtle);
    font-size: 0.75rem;
    line-height: 1.2;
  }

  .metric-alert.has-data {
    border-color: var(--color-danger-border);
    background: var(--color-danger-soft);
  }

  .metric-alert.has-data .metric-value {
    color: var(--color-danger);
  }

  .metric-warn.has-data {
    border-color: var(--color-warning-border);
    background: var(--color-warning-soft);
  }

  .metric-warn.has-data .metric-value {
    color: var(--color-warning-text);
  }

  .quick-link-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
  }

  .quick-link {
    display: grid;
    align-content: start;
    gap: 4px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    color: var(--color-text);
    padding: 14px;
    text-decoration: none;
  }

  .quick-link:hover {
    border-color: var(--color-border-strong);
    background: var(--color-hover);
  }

  .quick-link-section {
    color: var(--color-muted);
    font-size: 0.75rem;
    font-weight: 650;
    line-height: 1.2;
  }

  .quick-link-title {
    font-size: 0.9375rem;
    font-weight: 700;
    line-height: 1.25;
  }

  .quick-link-summary {
    color: var(--color-muted);
    font-size: 0.8125rem;
    line-height: 1.4;
    margin-top: 2px;
  }
</style>
