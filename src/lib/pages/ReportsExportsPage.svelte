<script lang="ts">
  import { onMount } from "svelte";
  import { Download, FileJson, FileSpreadsheet, PackageCheck, RefreshCw } from "lucide-svelte";
  import { olusoApplication } from "../../application/oluso-application";
  import RegisterPageHeader from "$lib/components/register/RegisterPageHeader.svelte";
  import RegisterState from "$lib/components/register/RegisterState.svelte";
  import {
    getPersistenceStatusLabel,
    persistenceDiagnostics,
    type PersistedRegisterRecord,
    type RegisterCollectionName,
  } from "$lib/persistence/local-persistence";
  import {
    buildRegisterExport,
    createDataDownloadUrl,
    EXPORT_REGISTERS,
    getExportRegisterDefinition,
    getLifecycleScopeLabel,
    type ExportFormat,
    type ExportLifecycleScope,
    type RegisterExportFile,
  } from "$lib/export/register-export";
  import {
    applyExportPreset,
    buildAuditPackage,
    collectReviewPackageRegisters,
    type ExportPreset,
    type ReviewPackageFile,
  } from "$lib/export/review-package";

  interface Props {
    autoInitialize?: boolean;
  }

  interface ExportSummary {
    collection: RegisterCollectionName;
    label: string;
    activeCount: number;
    archivedCount: number;
    totalCount: number;
  }

  interface GeneratedExport extends RegisterExportFile {
    href: string;
    generatedAtLabel: string;
    lifecycleLabel: string;
    sizeLabel: string;
    registerLabel: string;
  }

  interface GeneratedPackage extends ReviewPackageFile {
    href: string;
    generatedAtLabel: string;
    sizeLabel: string;
  }

  let { autoInitialize = true }: Props = $props();
  let selectedCollection = $state<RegisterCollectionName>("locations");
  let exportFormat = $state<ExportFormat>("csv");
  let lifecycleScope = $state<ExportLifecycleScope>("active");
  let exportPreset = $state<ExportPreset>("full");
  let packagePreset = $state<ExportPreset>("review-ready");
  let packageFormat = $state<"json" | "html">("html");
  let summaries = $state<ExportSummary[]>([]);
  let generatedExport = $state<GeneratedExport | null>(null);
  let generatedPackage = $state<GeneratedPackage | null>(null);
  let pageError = $state<string | null>(null);
  let isGenerating = $state(false);

  const statusLabel = $derived(getPersistenceStatusLabel($persistenceDiagnostics.status));
  const persistenceTone = $derived(
    $persistenceDiagnostics.status === "not_configured" ? "neutral" : $persistenceDiagnostics.status,
  );
  const selectedSummary = $derived(
    summaries.find((summary) => summary.collection === selectedCollection) ?? null,
  );
  async function initializePage() {
    pageError = null;

    try {
      if ($persistenceDiagnostics.status !== "ready") {
        await olusoApplication.initialize();
      }

      loadExportSummaries();
    } catch (error) {
      pageError = error instanceof Error ? error.message : String(error);
    }
  }

  function loadExportSummaries() {
    summaries = EXPORT_REGISTERS.map((definition) => {
      const records = olusoApplication.listRegisterRecords(definition.collection, {
        includeArchived: true,
      }) as PersistedRegisterRecord[];
      const archivedCount = records.filter((record) => record.lifecycleStatus === "archived").length;

      return {
        collection: definition.collection,
        label: definition.label,
        activeCount: records.length - archivedCount,
        archivedCount,
        totalCount: records.length,
      };
    });
  }

  function getExportRecords() {
    const records = olusoApplication.listRegisterRecords(selectedCollection, {
      includeArchived: lifecycleScope === "all",
    }) as PersistedRegisterRecord[];
    return applyExportPreset(records, exportPreset);
  }

  function formatSize(bytes: number) {
    if (bytes < 1024) {
      return `${bytes} B`;
    }

    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  async function generateExport() {
    pageError = null;
    generatedExport = null;
    isGenerating = true;

    try {
      if ($persistenceDiagnostics.status !== "ready") {
        await olusoApplication.initialize();
      }

      const generatedAt = new Date();
      const definition = getExportRegisterDefinition(selectedCollection);
      const records = getExportRecords();
      const file = buildRegisterExport({
        definition,
        records,
        format: exportFormat,
        lifecycleScope,
        generatedAt,
      });

      generatedExport = {
        ...file,
        href: createDataDownloadUrl(file),
        generatedAtLabel: generatedAt.toLocaleString(),
        lifecycleLabel: getLifecycleScopeLabel(lifecycleScope),
        sizeLabel: formatSize(file.content.length),
        registerLabel: definition.label,
      };
      loadExportSummaries();
    } catch (error) {
      pageError = error instanceof Error ? error.message : String(error);
    } finally {
      isGenerating = false;
    }
  }

  async function generateReviewPackage() {
    pageError = null;
    generatedPackage = null;
    isGenerating = true;

    try {
      if ($persistenceDiagnostics.status !== "ready") await olusoApplication.initialize();
      const generatedAt = new Date();
      const registers = collectReviewPackageRegisters(
        (collection) =>
          olusoApplication.listRegisterRecords(collection, { includeArchived: true }) as PersistedRegisterRecord[],
        packagePreset,
        generatedAt,
      );
      const file = buildAuditPackage(registers, packageFormat, generatedAt);
      generatedPackage = {
        ...file,
        href: `data:${file.mimeType};charset=utf-8,${encodeURIComponent(file.content)}`,
        generatedAtLabel: generatedAt.toLocaleString(),
        sizeLabel: formatSize(file.content.length),
      };
    } catch (error) {
      pageError = error instanceof Error ? error.message : String(error);
    } finally {
      isGenerating = false;
    }
  }

  onMount(() => {
    if (autoInitialize) void initializePage();
  });
</script>

<section class="page" aria-labelledby="exports-title">
  <RegisterPageHeader
    breadcrumbs="Reports"
    title="Reports & Exports"
    titleId="exports-title"
    summary="Generate source-register exports and point-in-time review support packages."
    statusLabel={statusLabel}
    statusTone={persistenceTone}
  />

  {#if pageError}
    <p class="error-message" role="alert">{pageError}</p>
  {/if}

  {#if $persistenceDiagnostics.status === "loading"}
    <RegisterState title="Loading export data" message="Initializing local persistence and reading register data." live />
  {:else if $persistenceDiagnostics.status === "error"}
    <RegisterState
      title="Export data could not load"
      message={$persistenceDiagnostics.lastError ?? "Local persistence reported an error."}
      secondaryActionLabel="Retry"
      onSecondaryAction={initializePage}
    />
  {:else if $persistenceDiagnostics.status === "not_configured"}
    <RegisterState
      title="Persistence is not configured"
      message="Exports cannot be generated until local persistence initializes."
      secondaryActionLabel="Initialize persistence"
      onSecondaryAction={initializePage}
    />
  {:else}
    <div class="exports-layout">
      <form
        class="export-panel export-form"
        aria-label="Generate register export"
        onsubmit={(event) => {
          event.preventDefault();
          void generateExport();
        }}
      >
        <div class="panel-heading">
          <h2>Generate Export</h2>
          <button class="secondary-button icon-button" type="button" onclick={loadExportSummaries}>
            <RefreshCw size={16} aria-hidden="true" />
            Refresh counts
          </button>
        </div>

        <div class="form-grid">
          <label>
            <span>Register</span>
            <select bind:value={selectedCollection}>
              {#each EXPORT_REGISTERS as register (register.collection)}
                <option value={register.collection}>{register.label}</option>
              {/each}
            </select>
          </label>

          <label>
            <span>Format</span>
            <select bind:value={exportFormat}>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </label>
        </div>

        <label>
          <span>Lifecycle scope</span>
          <select bind:value={lifecycleScope}>
            <option value="active">Active records</option>
            <option value="all">Active and archived records</option>
          </select>
        </label>

        <label>
          <span>Export preset</span>
          <select bind:value={exportPreset}>
            <option value="full">Full register</option>
            <option value="review-ready">Needs review</option>
            <option value="evidence-gaps">Missing required evidence</option>
            <option value="overdue">Overdue records</option>
          </select>
        </label>

        <p class="projection-note">
          Register exports contain source records. Presets filter those records without creating a second source of truth.
        </p>

        {#if selectedSummary}
          <div class="selection-summary" aria-live="polite">
            <span>{selectedSummary.activeCount} active</span>
            <span>{selectedSummary.archivedCount} archived</span>
            <span>{selectedSummary.totalCount} total</span>
          </div>
        {/if}

        <button class="button-link icon-button" type="submit" disabled={isGenerating}>
          {#if exportFormat === "json"}
            <FileJson size={16} aria-hidden="true" />
          {:else}
            <FileSpreadsheet size={16} aria-hidden="true" />
          {/if}
          {isGenerating ? "Generating" : "Generate export"}
        </button>
      </form>

      <section class="export-panel" aria-labelledby="register-export-counts">
        <h2 id="register-export-counts">Available Registers</h2>
        <div class="summary-list">
          {#each summaries as summary (summary.collection)}
            <div class="summary-row">
              <strong>{summary.label}</strong>
              <span>{summary.activeCount} active</span>
              <span>{summary.archivedCount} archived</span>
            </div>
          {/each}
        </div>
      </section>
    </div>

    <section class="export-panel review-package-panel" aria-labelledby="review-package-title">
      <div class="panel-heading">
        <div>
          <h2 id="review-package-title">Review Support Package</h2>
          <p class="projection-note">Build a cross-register, point-in-time projection for review or audit support.</p>
        </div>
        <PackageCheck size={20} aria-hidden="true" />
      </div>
      <div class="form-grid">
        <label>
          <span>Package preset</span>
          <select bind:value={packagePreset}>
            <option value="review-ready">Needs review, overdue, or missing evidence</option>
            <option value="evidence-gaps">Missing required evidence</option>
            <option value="overdue">Overdue records</option>
            <option value="full">All source records</option>
          </select>
        </label>
        <label>
          <span>Package format</span>
          <select bind:value={packageFormat}>
            <option value="html">Printable HTML / PDF-ready</option>
            <option value="json">Structured JSON</option>
          </select>
        </label>
      </div>
      <button class="button-link icon-button" type="button" onclick={generateReviewPackage} disabled={isGenerating}>
        <PackageCheck size={16} aria-hidden="true" />
        {isGenerating ? "Generating" : "Generate review package"}
      </button>
    </section>

    {#if generatedExport}
      <section class="export-result" aria-labelledby="generated-export-title" aria-live="polite">
        <div class="result-header">
          <div>
            <h2 id="generated-export-title">Generated Export</h2>
            <p>
              {generatedExport.registerLabel} / {generatedExport.lifecycleLabel} / {generatedExport.recordCount}
              records / {generatedExport.sizeLabel}
            </p>
          </div>

          <a class="button-link icon-button" href={generatedExport.href} download={generatedExport.fileName}>
            <Download size={16} aria-hidden="true" />
            Download {generatedExport.extension.toUpperCase()}
          </a>
        </div>

        <dl class="export-metadata">
          <div>
            <dt>File name</dt>
            <dd>{generatedExport.fileName}</dd>
          </div>
          <div>
            <dt>Generated</dt>
            <dd>{generatedExport.generatedAtLabel}</dd>
          </div>
        </dl>

        <label class="preview-label">
          <span>Preview</span>
          <textarea readonly rows="10" value={generatedExport.content}></textarea>
        </label>
      </section>
    {/if}

    {#if generatedPackage}
      <section class="export-result" aria-labelledby="generated-package-title" aria-live="polite">
        <div class="result-header">
          <div>
            <h2 id="generated-package-title">Generated Review Package</h2>
            <p>{generatedPackage.recordCount} records / {generatedPackage.sizeLabel} / generated {generatedPackage.generatedAtLabel}</p>
          </div>
          <a class="button-link icon-button" href={generatedPackage.href} download={generatedPackage.fileName}>
            <Download size={16} aria-hidden="true" />
            Download {generatedPackage.extension.toUpperCase()}
          </a>
        </div>
        <p class="projection-note">
          This file is a review projection. Open the HTML package and use Print to save a PDF; return to the source records for edits.
        </p>
      </section>
    {/if}
  {/if}
</section>

<style>
  .exports-layout {
    display: grid;
    grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
    gap: 16px;
    align-items: start;
  }

  .export-panel,
  .export-result {
    display: grid;
    gap: 16px;
    border: 1px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-surface);
    padding: 18px;
  }

  .review-package-panel { max-width: 980px; margin-top: 16px; }
  .projection-note { margin: 0; color: var(--color-muted); font-size: 0.8125rem; line-height: 1.45; }

  .export-result {
    margin-top: 16px;
  }

  .panel-heading,
  .result-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .panel-heading h2,
  .result-header h2,
  .export-panel h2 {
    margin: 0;
    font-size: 1rem;
    line-height: 1.25;
  }

  .result-header p {
    margin: 4px 0 0;
    color: var(--color-muted);
    font-size: 0.875rem;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  label {
    display: grid;
    gap: 6px;
    color: var(--color-muted);
    font-size: 0.8125rem;
    font-weight: 700;
  }

  select,
  textarea {
    width: 100%;
    border: 1px solid var(--color-border-strong);
    border-radius: 6px;
    background: #ffffff;
    color: var(--color-text);
    font-size: 0.875rem;
  }

  select {
    min-height: 38px;
    padding: 0 10px;
  }

  textarea {
    min-height: 220px;
    resize: vertical;
    padding: 10px;
    font-family:
      "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
    font-size: 0.8125rem;
    line-height: 1.45;
  }

  .icon-button {
    gap: 8px;
  }

  .button-link:disabled {
    cursor: not-allowed;
    opacity: 0.62;
  }

  .selection-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .selection-summary span,
  .summary-row span {
    color: var(--color-muted);
    font-size: 0.8125rem;
  }

  .summary-list {
    display: grid;
    gap: 8px;
  }

  .summary-row {
    display: grid;
    grid-template-columns: minmax(140px, 1fr) auto auto;
    gap: 12px;
    align-items: center;
    border-top: 1px solid var(--color-border);
    padding-top: 8px;
  }

  .summary-row:first-child {
    border-top: 0;
    padding-top: 0;
  }

  .export-metadata {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
    margin: 0;
  }

  .export-metadata div {
    display: grid;
    gap: 4px;
  }

  .export-metadata dt {
    color: var(--color-muted);
    font-size: 0.75rem;
    font-weight: 700;
  }

  .export-metadata dd {
    margin: 0;
    overflow-wrap: anywhere;
    font-size: 0.875rem;
  }

  .preview-label {
    color: var(--color-muted);
  }

  @media (max-width: 860px) {
    .exports-layout,
    .form-grid,
    .export-metadata {
      grid-template-columns: 1fr;
    }

    .panel-heading,
    .result-header {
      flex-direction: column;
    }

    .summary-row {
      grid-template-columns: 1fr;
      gap: 4px;
    }
  }
</style>
