<script lang="ts">
  import { onDestroy } from "svelte";
  import { RefreshCw, Trash2 } from "lucide-svelte";
  import { olusoApplication } from "../../application/oluso-application";
  import ConfirmDialog from "$lib/components/ui/ConfirmDialog.svelte";
  import BackupRestoreControls from "$lib/components/system/BackupRestoreControls.svelte";
  import {
    campaignRecordStores,
    getPersistenceStatusLabel,
    persistenceDiagnostics,
    locationRecords,
    findingRecords,
    processRecords,
    equipmentRecords,
    exposureMonitoringRecords,
    chemicalRecords,
    complianceItemRecords,
    hazardRecords,
    controlRecords,
    riskAssessmentRecords,
    segRecords,
    incidentRecords,
    correctiveActionRecords,
  } from "$lib/persistence/local-persistence";
  import {
    CAMPAIGN_REGISTER_DEFINITIONS,
    type CampaignCollectionName,
  } from "$lib/persistence/campaign-register.types";

  let retryMessage = $state<string | null>(null);
  let showClearConfirm = $state(false);
  let showEmptyClearConfirm = $state(false);
  let campaignRecordCounts = $state(
    Object.fromEntries(
      CAMPAIGN_REGISTER_DEFINITIONS.map((definition) => [definition.collection, 0]),
    ) as Record<CampaignCollectionName, number>,
  );

  const statusLabel = $derived(getPersistenceStatusLabel($persistenceDiagnostics.status));
  const campaignCountUnsubscribers = CAMPAIGN_REGISTER_DEFINITIONS.map((definition) =>
    campaignRecordStores[definition.collection].subscribe((records) => {
      campaignRecordCounts = {
        ...campaignRecordCounts,
        [definition.collection]: records.length,
      };
    }),
  );

  onDestroy(() => {
    for (const unsubscribe of campaignCountUnsubscribers) {
      unsubscribe();
    }
  });

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

  function confirmClearDataWithoutSeed() {
    showEmptyClearConfirm = true;
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

  async function clearAndStartEmpty() {
    showEmptyClearConfirm = false;
    retryMessage = null;

    try {
      await olusoApplication.clearAllDataWithoutSeed();
      retryMessage = "All data cleared. The database is empty.";
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
          <RefreshCw size={16} aria-hidden="true" />
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
          <dt>Equipment</dt>
          <dd>{$equipmentRecords.length} records</dd>
        </div>
        <div>
          <dt>Exposure Monitoring</dt>
          <dd>{$exposureMonitoringRecords.length} records</dd>
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
          <dt>Controls</dt>
          <dd>{$controlRecords.length} records</dd>
        </div>
        <div>
          <dt>Risk Assessments</dt>
          <dd>{$riskAssessmentRecords.length} records</dd>
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
          <dt>Incidents &amp; Near Misses</dt>
          <dd>{$incidentRecords.length} records</dd>
        </div>
        <div>
          <dt>Compliance Support</dt>
          <dd>{$complianceItemRecords.length} records</dd>
        </div>
        <div>
          <dt>Corrective Actions</dt>
          <dd>{$correctiveActionRecords.length} records</dd>
        </div>
        {#each CAMPAIGN_REGISTER_DEFINITIONS as definition}
          <div>
            <dt>{definition.title}</dt>
            <dd>{campaignRecordCounts[definition.collection]} records</dd>
          </div>
        {/each}
      </dl>
    </section>

    <BackupRestoreControls autoInitialize={false} />

    <!-- Data Management -->
    <section class="diagnostics-panel danger-panel" aria-labelledby="data-mgmt-title">
      <div class="diagnostics-header">
        <h2 id="data-mgmt-title">Data Management</h2>
      </div>

      <p class="settings-message">
        Clearing all data will remove every record from local storage and re-seed the application
        with demo data. This action cannot be undone.
      </p>

      <p class="settings-message">
        To begin without demo data, clear all records and start with an empty database instead.
        This action also cannot be undone.
      </p>

      <div class="action-row">
        <button class="danger-button" type="button" onclick={confirmClearData}>
          <Trash2 size={16} aria-hidden="true" />
          Clear all data and re-seed
        </button>
        <button class="danger-button" type="button" onclick={confirmClearDataWithoutSeed}>
          <Trash2 size={16} aria-hidden="true" />
          Clear all data (start empty)
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

{#if showEmptyClearConfirm}
  <ConfirmDialog
    title="Clear all data and start empty?"
    message="This will permanently delete all records and start with an empty database. No demo data will be created. This cannot be undone."
    confirmLabel="Clear and start empty"
    danger
    onConfirm={clearAndStartEmpty}
    onCancel={() => (showEmptyClearConfirm = false)}
  />
{/if}

<style>
  .settings-layout {
    display: grid;
    gap: 18px;
    max-width: 980px;
  }

  .diagnostics-panel {
    display: grid;
    gap: 16px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: linear-gradient(180deg, rgba(22, 33, 36, 0.86), rgba(14, 23, 25, 0.84));
    box-shadow: var(--surface-shadow);
    padding: 18px;
  }

  .danger-panel {
    border-color: var(--color-danger-border);
    background:
      linear-gradient(180deg, rgba(249, 112, 102, 0.1), rgba(14, 23, 25, 0.84)),
      var(--color-danger-soft);
  }

  .diagnostics-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .diagnostics-header h2 {
    margin: 0;
    color: var(--color-text);
    font-size: 1.0625rem;
    font-weight: 760;
    line-height: 1.25;
  }

  .diagnostics-list {
    display: grid;
    gap: 0;
    margin: 0;
    border-top: 1px solid var(--glass-border-subtle);
  }

  .diagnostics-list div {
    display: grid;
    grid-template-columns: minmax(160px, 0.35fr) 1fr;
    gap: 16px;
    border-bottom: 1px solid var(--glass-border-subtle);
    padding: 12px 0;
  }

  dt {
    color: var(--color-muted);
    font-size: 0.8125rem;
    font-weight: 760;
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
