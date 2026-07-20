<script lang="ts">
  import { onMount } from "svelte";
  import { Database, HardDriveDownload, RefreshCw } from "lucide-svelte";
  import {
    inspectBrowserStorage,
    requestPersistentStorage,
    type StorageDiagnostics,
  } from "$lib/data/diagnostics";

  interface Props {
    inspect?: () => Promise<StorageDiagnostics>;
    requestPersistence?: () => Promise<boolean>;
  }

  let {
    inspect = inspectBrowserStorage,
    requestPersistence = requestPersistentStorage,
  }: Props = $props();
  let diagnostics = $state<StorageDiagnostics | null>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);
  let persistenceMessage = $state<string | null>(null);

  function formatBytes(value: number | null) {
    if (value === null) return "Unavailable";
    if (value < 1024) return `${value} bytes`;
    const units = ["KB", "MB", "GB", "TB"];
    let amount = value / 1024;
    let unit = units[0];
    for (let index = 1; amount >= 1024 && index < units.length; index += 1) {
      amount /= 1024;
      unit = units[index];
    }
    return `${amount.toFixed(amount >= 10 ? 0 : 1)} ${unit}`;
  }

  async function refresh() {
    loading = true;
    error = null;
    try {
      diagnostics = await inspect();
    } catch (cause) {
      diagnostics = null;
      error = cause instanceof Error ? cause.message : String(cause);
    } finally {
      loading = false;
    }
  }

  async function makePersistent() {
    persistenceMessage = null;
    try {
      const granted = await requestPersistence();
      persistenceMessage = granted
        ? "The browser granted durable local storage."
        : "The browser did not grant durable storage; maintain verified backups.";
      await refresh();
    } catch (cause) {
      persistenceMessage = cause instanceof Error ? cause.message : String(cause);
    }
  }

  onMount(() => {
    void refresh();
  });
</script>

<section class="diagnostics-panel" aria-labelledby="web-storage-title">
  <div class="diagnostics-header">
    <div>
      <p class="eyebrow">Phase 1 web foundation</p>
      <h2 id="web-storage-title">Web Database Readiness</h2>
    </div>
    <Database size={20} aria-hidden="true" />
  </div>

  {#if loading}
    <p class="settings-message" role="status">Inspecting browser storage…</p>
  {:else if error}
    <p class="error-message" role="alert">Browser storage diagnostics failed: {error}</p>
    <button class="secondary-button" type="button" onclick={refresh}>
      <RefreshCw size={16} aria-hidden="true" />
      Retry diagnostics
    </button>
  {:else if diagnostics}
    <dl class="diagnostics-list">
      <div>
        <dt>IndexedDB</dt>
        <dd>{diagnostics.indexedDbAvailable ? "Available" : "Unavailable"}</dd>
      </div>
      <div>
        <dt>Offline application shell</dt>
        <dd>{diagnostics.serviceWorkerSupported ? "Supported" : "Unsupported"}</dd>
      </div>
      <div>
        <dt>Durable storage</dt>
        <dd>{diagnostics.persisted === null ? "Unknown" : diagnostics.persisted ? "Granted" : "Not granted"}</dd>
      </div>
      <div>
        <dt>Storage usage</dt>
        <dd>{formatBytes(diagnostics.usageBytes)} of {formatBytes(diagnostics.quotaBytes)}</dd>
      </div>
      <div>
        <dt>Quota risk</dt>
        <dd class:risk-warning={diagnostics.risk === "warning" || diagnostics.risk === "critical"}>
          {diagnostics.risk}
        </dd>
      </div>
    </dl>

    {#if !diagnostics.indexedDbAvailable}
      <p class="error-message" role="alert">
        IndexedDB is unavailable. ADAMA HSE cannot safely use this browser for operational data.
      </p>
    {/if}
    {#if persistenceMessage}
      <p class="settings-message" role="status">{persistenceMessage}</p>
    {/if}
    <div class="action-row">
      {#if diagnostics.persistenceRequestSupported && diagnostics.persisted !== true}
        <button class="secondary-button" type="button" onclick={makePersistent}>
          <HardDriveDownload size={16} aria-hidden="true" />
          Request durable storage
        </button>
      {/if}
      <button class="secondary-button" type="button" onclick={refresh}>
        <RefreshCw size={16} aria-hidden="true" />
        Refresh diagnostics
      </button>
    </div>
  {/if}
</section>

<style>
  .diagnostics-panel {
    display: grid;
    gap: 16px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: var(--color-surface);
    box-shadow: var(--surface-shadow);
    padding: 18px;
  }

  .diagnostics-header,
  .action-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    flex-wrap: wrap;
  }

  .diagnostics-header h2,
  .eyebrow {
    margin: 0;
  }

  .diagnostics-header h2 {
    color: var(--color-text);
    font-size: 1.0625rem;
  }

  .eyebrow {
    margin-bottom: 3px;
    color: var(--color-muted);
    font-size: 0.72rem;
    font-weight: 760;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .diagnostics-list {
    display: grid;
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
    color: var(--color-text);
    font-size: 0.875rem;
    text-transform: capitalize;
  }

  .settings-message {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.875rem;
  }

  .error-message,
  .risk-warning {
    color: var(--color-danger-text);
  }

  .error-message {
    margin: 0;
    font-size: 0.875rem;
  }
</style>
