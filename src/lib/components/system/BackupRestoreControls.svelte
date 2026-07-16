<script lang="ts">
  import { onMount, tick } from "svelte";
  import { Download, RefreshCw, RotateCcw, Upload } from "lucide-svelte";
  import { olusoApplication } from "../../../application/oluso-application";
  import {
    buildDatabaseBackup,
    downloadDatabaseBackup,
    readBackupFile,
  } from "$lib/data/backup";
  import type { PersistedDatabase } from "$lib/persistence/local-persistence";

  type MaybePromise<T> = T | Promise<T>;

  interface BackupApplication {
    initialize(): MaybePromise<unknown>;
    exportDatabase(): MaybePromise<PersistedDatabase>;
    importDatabase(
      snapshot: unknown,
    ): MaybePromise<{ database: PersistedDatabase; importedCount: number }>;
    restoreDatabase(snapshot: unknown): MaybePromise<PersistedDatabase>;
  }

  interface Props {
    application?: BackupApplication;
    autoInitialize?: boolean;
  }

  let {
    application = olusoApplication as unknown as BackupApplication,
    autoInitialize = true,
  }: Props = $props();

  let ready = $state(false);
  let initializing = $state(false);
  let activeOperation = $state<"backup" | "import" | "restore" | null>(null);
  let importFile = $state<File | null>(null);
  let restoreFile = $state<File | null>(null);
  let showRestoreConfirmation = $state(false);
  let backupAcknowledged = $state(false);
  let statusMessage = $state<string | null>(null);
  let errorMessage = $state<string | null>(null);
  let restoreDialog = $state<HTMLDivElement | null>(null);

  const busy = $derived(initializing || activeOperation !== null);

  onMount(() => {
    if (autoInitialize) {
      void initializeControls();
    } else {
      ready = true;
    }
  });

  function serializeError(error: unknown) {
    return error instanceof Error ? error.message : String(error);
  }

  function clearFeedback() {
    statusMessage = null;
    errorMessage = null;
  }

  async function initializeControls() {
    initializing = true;
    clearFeedback();

    try {
      await application.initialize();
      ready = true;
    } catch (error) {
      ready = false;
      errorMessage = serializeError(error);
    } finally {
      initializing = false;
    }
  }

  async function createBackup() {
    activeOperation = "backup";
    clearFeedback();

    try {
      const database = await application.exportDatabase();
      const backup = buildDatabaseBackup(database);
      downloadDatabaseBackup(backup);
      statusMessage = `Backup created: ${backup.fileName}`;
    } catch (error) {
      errorMessage = serializeError(error);
    } finally {
      activeOperation = null;
    }
  }

  function selectImportFile(event: Event) {
    importFile = (event.currentTarget as HTMLInputElement).files?.[0] ?? null;
    clearFeedback();
  }

  function selectRestoreFile(event: Event) {
    restoreFile = (event.currentTarget as HTMLInputElement).files?.[0] ?? null;
    closeRestoreConfirmation();
    clearFeedback();
  }

  async function importMissingRecords() {
    if (!importFile) return;

    activeOperation = "import";
    clearFeedback();

    try {
      const snapshot = await readBackupFile(importFile);
      const result = await application.importDatabase(snapshot);
      const label = result.importedCount === 1 ? "record" : "records";
      statusMessage = `Imported ${result.importedCount} missing ${label}. Existing records were left unchanged.`;
    } catch (error) {
      errorMessage = serializeError(error);
    } finally {
      activeOperation = null;
    }
  }

  async function openRestoreConfirmation() {
    if (!restoreFile) return;

    backupAcknowledged = false;
    showRestoreConfirmation = true;
    await tick();
    restoreDialog?.focus();
  }

  function closeRestoreConfirmation() {
    if (activeOperation === "restore") return;
    showRestoreConfirmation = false;
    backupAcknowledged = false;
  }

  function handleRestoreDialogKeydown(event: KeyboardEvent) {
    event.stopPropagation();

    if (event.key === "Escape") {
      event.preventDefault();
      closeRestoreConfirmation();
    }
  }

  async function restoreDatabase() {
    if (!restoreFile || !backupAcknowledged) return;

    activeOperation = "restore";
    clearFeedback();

    try {
      const snapshot = await readBackupFile(restoreFile);
      await application.restoreDatabase(snapshot);
      showRestoreConfirmation = false;
      backupAcknowledged = false;
      statusMessage = `Restore complete. Current data was replaced from ${restoreFile.name}.`;
    } catch (error) {
      errorMessage = serializeError(error);
    } finally {
      activeOperation = null;
    }
  }
</script>

<section class="backup-controls" aria-labelledby="backup-controls-title">
  <div class="section-heading">
    <div>
      <h2 id="backup-controls-title">Backup, Import &amp; Restore</h2>
      <p>Create a complete JSON snapshot, merge missing records, or replace the current database.</p>
    </div>
    {#if initializing}
      <span class="status-pill loading" role="status">Preparing data tools</span>
    {:else if ready}
      <span class="status-pill ready" role="status">Data tools ready</span>
    {/if}
  </div>

  {#if errorMessage}
    <p class="error-message" role="alert">{errorMessage}</p>
  {/if}

  {#if statusMessage}
    <p
      class="success-message"
      role="status"
      aria-label={statusMessage}
      aria-live="polite"
    >
      {statusMessage}
    </p>
  {/if}

  {#if !ready && !initializing}
    <div class="unavailable-state">
      <p>Data tools could not initialize.</p>
      <button class="secondary-button" type="button" onclick={initializeControls}>
        <RefreshCw size={16} aria-hidden="true" />
        Retry initialization
      </button>
    </div>
  {:else}
    <div class="control-grid" aria-busy={busy}>
      <section class="control-card" aria-labelledby="create-backup-title">
        <h3 id="create-backup-title">Create backup</h3>
        <p>Download all current register data and lifecycle history as a JSON file.</p>
        <button
          class="button-link"
          type="button"
          disabled={!ready || busy}
          onclick={createBackup}
        >
          <Download size={16} aria-hidden="true" />
          {activeOperation === "backup" ? "Creating backup…" : "Create backup"}
        </button>
      </section>

      <section class="control-card" aria-labelledby="import-backup-title">
        <h3 id="import-backup-title">Import missing records</h3>
        <p>Add records that do not already exist. Existing records are not replaced.</p>
        <label for="backup-import-file">Backup JSON file</label>
        <input
          id="backup-import-file"
          name="backup-import-file"
          type="file"
          accept=".json,application/json"
          disabled={!ready || busy}
          onchange={selectImportFile}
        />
        <button
          class="secondary-button"
          type="button"
          disabled={!ready || busy || !importFile}
          onclick={importMissingRecords}
        >
          <Upload size={16} aria-hidden="true" />
          {activeOperation === "import" ? "Importing…" : "Import missing records"}
        </button>
      </section>

      <section class="control-card danger-card" aria-labelledby="restore-backup-title">
        <h3 id="restore-backup-title">Restore and replace</h3>
        <p>Replace all current data with a selected backup. This cannot be undone.</p>
        <label for="backup-restore-file">Restore JSON file</label>
        <input
          id="backup-restore-file"
          name="backup-restore-file"
          type="file"
          accept=".json,application/json"
          disabled={!ready || busy}
          onchange={selectRestoreFile}
        />
        <button
          class="danger-button"
          type="button"
          disabled={!ready || busy || !restoreFile}
          onclick={openRestoreConfirmation}
        >
          <RotateCcw size={16} aria-hidden="true" />
          Restore and replace
        </button>
      </section>
    </div>
  {/if}
</section>

{#if showRestoreConfirmation && restoreFile}
  <div class="dialog-backdrop" role="presentation" onclick={closeRestoreConfirmation}>
    <div
      class="restore-dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="restore-confirmation-title"
      aria-describedby="restore-confirmation-message"
      tabindex="-1"
      bind:this={restoreDialog}
      onclick={(event) => event.stopPropagation()}
      onkeydown={handleRestoreDialogKeydown}
    >
      <h2 id="restore-confirmation-title">Replace all current data?</h2>
      <p id="restore-confirmation-message">
        Restoring <strong>{restoreFile.name}</strong> will replace every current record with the
        contents of this backup.
      </p>

      <label class="acknowledgement">
        <input
          name="backup-acknowledgement"
          type="checkbox"
          checked={backupAcknowledged}
          disabled={activeOperation === "restore"}
          onchange={(event) =>
            (backupAcknowledged = (event.currentTarget as HTMLInputElement).checked)}
        />
        <span>I have created a backup of the current data.</span>
      </label>

      <div class="action-row">
        <button
          class="danger-button"
          type="button"
          disabled={!backupAcknowledged || activeOperation === "restore"}
          onclick={restoreDatabase}
        >
          <RotateCcw size={16} aria-hidden="true" />
          {activeOperation === "restore" ? "Replacing data…" : "Replace current data"}
        </button>
        <button
          class="secondary-button"
          type="button"
          disabled={activeOperation === "restore"}
          onclick={closeRestoreConfirmation}
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
{/if}

<style>
  .backup-controls,
  .control-card {
    display: grid;
    gap: 16px;
  }

  .backup-controls {
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: linear-gradient(180deg, rgba(22, 33, 36, 0.86), rgba(14, 23, 25, 0.84));
    box-shadow: var(--surface-shadow);
    padding: 18px;
  }

  .section-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
  }

  h2,
  h3,
  p {
    margin: 0;
  }

  h2 {
    color: var(--color-text);
    font-size: 1.0625rem;
    font-weight: 760;
  }

  h3 {
    color: var(--color-text);
    font-size: 0.9375rem;
    font-weight: 760;
  }

  .section-heading p,
  .control-card p,
  .unavailable-state p {
    margin-top: 4px;
    color: var(--color-muted);
    font-size: 0.875rem;
    line-height: 1.45;
  }

  .success-message {
    border: 1px solid var(--color-success-border);
    border-left: 3px solid var(--color-success-text);
    border-radius: var(--radius-surface);
    background: var(--color-success-soft);
    color: var(--color-success-text);
    padding: 12px 14px;
    font-size: 0.875rem;
  }

  .unavailable-state {
    display: grid;
    justify-items: start;
    gap: 12px;
  }

  .control-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
  }

  .control-card {
    align-content: start;
    justify-items: start;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: rgba(7, 12, 14, 0.28);
    padding: 16px;
  }

  .danger-card {
    border-color: var(--color-danger-border);
    background: var(--color-danger-soft);
  }

  label {
    color: var(--color-text);
    font-size: 0.8125rem;
    font-weight: 760;
  }

  input[type="file"] {
    width: 100%;
    min-width: 0;
    border: 1px solid var(--color-field-border);
    border-radius: var(--radius-control);
    background: var(--color-field-bg);
    color: var(--color-muted);
    font-size: 0.8125rem;
    padding: 8px;
  }

  input[type="file"]::file-selector-button {
    min-height: 30px;
    margin-right: 10px;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-control);
    background: rgba(255, 255, 255, 0.06);
    color: var(--color-text);
    font: inherit;
    font-weight: 720;
    padding: 0 10px;
  }

  .dialog-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.42);
    padding: 24px;
  }

  .restore-dialog {
    display: grid;
    gap: 16px;
    width: min(100%, 480px);
    border: 1px solid var(--color-danger-border);
    border-radius: var(--radius-surface);
    background: var(--color-surface-solid);
    padding: 22px;
    box-shadow: var(--elevation-z3);
  }

  .restore-dialog h2 {
    font-size: 1rem;
  }

  .restore-dialog p {
    color: var(--color-muted);
    font-size: 0.875rem;
    line-height: 1.5;
  }

  .acknowledgement {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-weight: 650;
    line-height: 1.4;
  }

  .acknowledgement input {
    flex: 0 0 auto;
    width: 16px;
    height: 16px;
    margin-top: 1px;
  }

  @media (max-width: 780px) {
    .control-grid {
      grid-template-columns: 1fr;
    }

    .section-heading {
      flex-direction: column;
    }
  }
</style>
