<script lang="ts">
  import { olusoApplication } from "../../application/oluso-application";
  import ConfirmDialog from "$lib/components/ui/ConfirmDialog.svelte";
  import {
    getPersistenceStatusLabel,
    persistenceDiagnostics,
    locationRecords,
    findingRecords,
    processRecords,
    chemicalRecords,
    hazardRecords,
    segRecords,
    correctiveActionRecords,
  } from "$lib/persistence/local-persistence";

  let retryMessage = $state<string | null>(null);
  let showClearConfirm = $state(false);

  const statusLabel = $derived(getPersistenceStatusLabel($persistenceDiagnostics.status));

  async function retryInitialization() {
    retryMessage = null;

    try {
      await olusoApplication.initialize();
      retryMessage = "Persistence initialized successfully.";
    } catch (error) {
      retryMessage = error instanceof Error ? error.message : String(error);
    }
  }

  function confirmClearData() {
    showClearConfirm = true;
  }

  async function clearAndReinitialize() {
    showClearConfirm = false;
    retryMessage = null;

    try {
      await olusoApplication.clearAllData();
      await olusoApplication.initialize();
      retryMessage = "All data cleared and re-seeded successfully.";
    } catch (error) {
      retryMessage = error instanceof Error ? error.message : String(error);
    }
  }
</script>

<section class="page" aria-labelledby="settings-title">
  <header class="page-header">
    <div class="breadcrumbs">System</div>
    <h1 class="page-title" id="settings-title">Settings</h1>
    <p class="page-summary">
      Review local application diagnostics, persistence health, and data management options.
    </p>
  </header>

  <div class="settings-layout">
    <!-- Persistence Diagnostics -->
    <section class="diagnostics-panel" aria-labelledby="diagnostics-title">
      <div class="diagnostics-header">
        <h2 id="diagnostics-title">Persistence Diagnostics</h2>
        <span class="status-pill {$persistenceDiagnostics.status}">{statusLabel}</span>
      </div>

      <dl class="diagnostics-list">
        <div>
          <dt>Status</dt>
          <dd>{statusLabel}</dd>
        </div>
        <div>
          <dt>Backend</dt>
          <dd>{$persistenceDiagnostics.backend ?? "localStorage"}</dd>
        </div>
        <div>
          <dt>Connection state</dt>
          <dd>{$persistenceDiagnostics.connectionState ?? "not_connected"}</dd>
        </div>
        <div>
          <dt>Data path</dt>
          <dd>{$persistenceDiagnostics.dataPath ?? "No persistence data path"}</dd>
        </div>
        <div>
          <dt>Schema version</dt>
          <dd>v{$persistenceDiagnostics.schemaVersion ?? 5}</dd>
        </div>
        <div>
          <dt>Database size</dt>
          <dd>
            {$persistenceDiagnostics.databaseSizeBytes === undefined
              ? "Unknown"
              : `${$persistenceDiagnostics.databaseSizeBytes} bytes`}
          </dd>
        </div>
        <div>
          <dt>Initialized at</dt>
          <dd>{$persistenceDiagnostics.initializedAt ?? "Not initialized"}</dd>
        </div>
        <div>
          <dt>Last initialization</dt>
          <dd>{$persistenceDiagnostics.lastInitializationStatus}</dd>
        </div>
        <div>
          <dt>Last migration</dt>
          <dd>{$persistenceDiagnostics.lastMigrationStatus}</dd>
        </div>
        <div>
          <dt>localStorage migration</dt>
          <dd>{$persistenceDiagnostics.localStorageMigrationStatus ?? "Not applicable"}</dd>
        </div>
        <div>
          <dt>Last error</dt>
          <dd>{$persistenceDiagnostics.lastError ?? "None"}</dd>
        </div>
      </dl>

      {#if $persistenceDiagnostics.status === "error"}
        <p class="error-message">{$persistenceDiagnostics.lastError}</p>
      {/if}

      {#if retryMessage}
        <p class="settings-message">{retryMessage}</p>
      {/if}

      <div class="action-row">
        <button class="secondary-button" type="button" onclick={retryInitialization}>
          Retry initialization
        </button>
      </div>
    </section>

    <!-- Record Counts -->
    <section class="diagnostics-panel" aria-labelledby="record-counts-title">
      <div class="diagnostics-header">
        <h2 id="record-counts-title">Register Record Counts</h2>
      </div>

      <dl class="diagnostics-list">
        <div>
          <dt>Locations</dt>
          <dd>{$locationRecords.length} records</dd>
        </div>
        <div>
          <dt>Processes</dt>
          <dd>{$processRecords.length} records</dd>
        </div>
        <div>
          <dt>Chemicals</dt>
          <dd>{$chemicalRecords.length} records</dd>
        </div>
        <div>
          <dt>Hazards</dt>
          <dd>{$hazardRecords.length} records</dd>
        </div>
        <div>
          <dt>SEGs</dt>
          <dd>{$segRecords.length} records</dd>
        </div>
        <div>
          <dt>Findings</dt>
          <dd>{$findingRecords.length} records</dd>
        </div>
        <div>
          <dt>Corrective Actions</dt>
          <dd>{$correctiveActionRecords.length} records</dd>
        </div>
      </dl>
    </section>

    <!-- Data Management -->
    <section class="diagnostics-panel danger-panel" aria-labelledby="data-mgmt-title">
      <div class="diagnostics-header">
        <h2 id="data-mgmt-title">Data Management</h2>
      </div>

      <p class="settings-message">
        Clearing all data will remove every record from local storage and re-seed the application
        with demo data. This action cannot be undone.
      </p>

      <div class="action-row">
        <button class="danger-button" type="button" onclick={confirmClearData}>
          Clear all data and re-seed
        </button>
      </div>
    </section>
  </div>
</section>

{#if showClearConfirm}
  <ConfirmDialog
    title="Clear all data?"
    message="This will permanently delete all records and replace them with demo seed data. This cannot be undone."
    confirmLabel="Clear and re-seed"
    danger
    onConfirm={clearAndReinitialize}
    onCancel={() => (showClearConfirm = false)}
  />
{/if}

<style>
  .settings-layout {
    display: grid;
    gap: 20px;
    max-width: 840px;
  }

  .diagnostics-panel {
    display: grid;
    gap: 16px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    padding: 18px;
  }

  .danger-panel {
    border-color: var(--color-danger-border);
    background: var(--color-danger-soft);
  }

  .diagnostics-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .diagnostics-header h2 {
    margin: 0;
    font-size: 1rem;
    line-height: 1.25;
  }

  .diagnostics-list {
    display: grid;
    gap: 0;
    margin: 0;
    border-top: 1px solid var(--color-border);
  }

  .diagnostics-list div {
    display: grid;
    grid-template-columns: minmax(160px, 0.35fr) 1fr;
    gap: 16px;
    border-bottom: 1px solid var(--color-border);
    padding: 12px 0;
  }

  dt {
    color: var(--color-muted);
    font-size: 0.8125rem;
    font-weight: 700;
  }

  dd {
    margin: 0;
    min-width: 0;
    overflow-wrap: anywhere;
    color: var(--color-text);
    font-size: 0.875rem;
  }

  .settings-message {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.875rem;
  }

  @media (max-width: 640px) {
    .diagnostics-list div {
      grid-template-columns: 1fr;
      gap: 4px;
    }
  }
</style>
