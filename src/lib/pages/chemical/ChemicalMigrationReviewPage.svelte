<script lang="ts">
  import { getBrowserDatabase, type RecordEnvelope } from "$lib/data/database";
  import { IndexedDbRecordRepository } from "$lib/data/repositories";
  import { olusoApplication } from "../../../application/oluso-application";

  interface MigrationRun {
    id: string;
    status: string;
    sourceKind: string;
    sourceSchemaVersion: number;
    startedAt: string;
    completedAt: string;
    importedRecordCount: number;
    deferredRecordCount: number;
    sourceEvidence?: { chemicals?: Array<Record<string, unknown>> };
    chemicalMappings?: Array<{ sourceRecordId: string; productId: string; substanceId?: string; sdsRevisionId?: string; inventoryId?: string; chemicalUseIds: string[] }>;
  }
  interface MigrationFinding extends RecordEnvelope {
    findingCode?: string;
    code?: string;
    summary?: string;
    title?: string;
    details?: string;
    severity: string;
    status: string;
    sourceRecordType?: string;
    sourceRecordId?: string;
    recordType?: string;
    recordId?: string;
    sourceEvidence?: Record<string, unknown>;
  }

  let loading = $state(true);
  let migrating = $state(false);
  let error = $state<string | null>(null);
  let message = $state<string | null>(null);
  let runs = $state<MigrationRun[]>([]);
  let findings = $state<MigrationFinding[]>([]);

  async function getAll<T>(database: IDBDatabase, storeName: string) {
    const transaction = database.transaction(storeName, "readonly");
    return new Promise<T[]>((resolve, reject) => {
      const request = transaction.objectStore(storeName).getAll();
      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  async function load() {
    loading = true; error = null;
    try {
      const adapter = await getBrowserDatabase();
      [runs, findings] = await Promise.all([
        getAll<MigrationRun>(adapter.database, "migration_runs"),
        getAll<MigrationFinding>(adapter.database, "data_quality_findings"),
      ]);
      runs.sort((left, right) => right.startedAt.localeCompare(left.startedAt));
      findings = findings.filter((finding) => (finding.sourceRecordType ?? finding.recordType) === "chemicals");
    } catch (cause) { error = cause instanceof Error ? cause.message : String(cause); }
    finally { loading = false; }
  }

  async function migrateCurrentDataset() {
    migrating = true; error = null; message = null;
    try {
      const adapter = await getBrowserDatabase();
      const { installation, user } = await adapter.localIdentity().assertMutationIdentityReady();
      const snapshot = await olusoApplication.exportDatabase();
      const result = await adapter.migrateLegacy(snapshot, {
        actorId: user.id,
        installationId: installation.installationId,
        migrationRunId: `chemical-migration:${crypto.randomUUID()}`,
      });
      message = result.alreadyApplied
        ? `This legacy source was already migrated; no records or dataset revisions were changed.`
        : `Migration applied atomically: ${result.importedRecordCount} records and ${result.dataQualityFindingCount} findings.`;
      await load();
    } catch (cause) { error = cause instanceof Error ? cause.message : String(cause); }
    finally { migrating = false; }
  }

  async function updateFinding(finding: MigrationFinding, status: string) {
    error = null;
    try {
      const adapter = await getBrowserDatabase();
      const repository = new IndexedDbRecordRepository<MigrationFinding>(adapter.database, "data_quality_findings", { recordType: "DataQualityFinding" });
      await repository.update(finding.id, { status }, finding.revision, await adapter.localIdentity().mutationContext(`Set migration finding to ${status}`));
      await load();
    } catch (cause) { error = cause instanceof Error ? cause.message : String(cause); }
  }

  function sourceId(record: Record<string, unknown>) { return typeof record.id === "string" ? record.id : "unknown"; }
  $effect(() => { void load(); });
</script>

<section class="migration-page" aria-labelledby="migration-title">
  <header class="migration-header"><div><p class="eyebrow">Controlled Migration</p><h1 id="migration-title">Chemical Migration Review</h1><p>Review source evidence, canonical mappings, and uncertainty without rewriting the original legacy row.</p></div><button class="primary" onclick={migrateCurrentDataset} disabled={migrating}>{migrating ? "Migrating…" : "Migrate current legacy dataset"}</button></header>
  {#if error}<p class="alert" role="alert">{error}</p>{/if}{#if message}<p class="success" role="status">{message}</p>{/if}
  {#if loading}<div class="panel" role="status">Loading migration evidence…</div>{:else if runs.length === 0}<div class="panel empty"><h2>No chemical migration has run</h2><p>The legacy register remains untouched. Start migration to create reviewable canonical candidates and data-quality findings.</p></div>{:else}
    {#each runs as run}
      <section class="panel"><div class="run-header"><div><h2>{run.sourceKind} schema {run.sourceSchemaVersion}</h2><p>{new Date(run.completedAt).toLocaleString()} · {run.importedRecordCount} records · {run.deferredRecordCount} deferred</p></div><span>{run.status}</span></div>
        {#each run.sourceEvidence?.chemicals ?? [] as source}
          {@const id = sourceId(source)}
          {@const mapping = run.chemicalMappings?.find((candidate) => candidate.sourceRecordId === id)}
          <article class="mapping"><div><h3>{String(source.name ?? source.title ?? id)}</h3><details><summary>Open original legacy evidence</summary><pre>{JSON.stringify(source, null, 2)}</pre></details></div>
            <div class="targets">{#if mapping?.productId}<a href={`/master/products/${mapping.productId}`}>Mapped Product</a>{/if}{#if mapping?.substanceId}<a href={`/master/substances/${mapping.substanceId}`}>Mapped Substance</a>{/if}{#if mapping?.sdsRevisionId}<a href={`/master/products/${mapping.productId}/sds/${mapping.sdsRevisionId}`}>Mapped SDS</a>{/if}{#if mapping?.inventoryId}<a href={`/master/inventory/${mapping.inventoryId}`}>Mapped Inventory</a>{/if}{#each mapping?.chemicalUseIds ?? [] as useId}<a href={`/master/chemical-uses/${useId}`}>Mapped Chemical Use</a>{/each}</div>
            <div class="finding-list"><h4>Data-quality findings</h4>{#each findings.filter((finding) => (finding.sourceRecordId ?? finding.recordId) === id) as finding}<div class="finding"><div><strong>{finding.findingCode ?? finding.code}</strong><p>{finding.summary ?? finding.title}</p><small>{finding.severity} · {finding.status}</small></div><div class="actions">{#if finding.status !== "Resolved"}<button onclick={() => updateFinding(finding, "In Review")}>Review</button><button onclick={() => updateFinding(finding, "Accepted as Known")}>Accept known uncertainty</button><button onclick={() => updateFinding(finding, "Resolved")}>Resolve</button>{/if}</div></div>{:else}<p>No unresolved findings for this source row.</p>{/each}</div>
          </article>
        {/each}
      </section>
    {/each}
  {/if}
</section>

<style>
  .migration-page { display: grid; gap: 16px; padding: 26px; } .migration-header, .run-header, .finding, .actions { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
  h1, h2, h3, h4, p { margin: 0; } .migration-header p, .run-header p, .empty, small { color: var(--color-muted); } .eyebrow { color: var(--color-accent-strong) !important; font-size: .72rem; font-weight: 780; text-transform: uppercase; letter-spacing: .08em; }
  .panel, .mapping { display: grid; gap: 16px; border: 1px solid var(--glass-border-subtle); border-radius: var(--radius-surface); background: rgba(15,25,27,.88); padding: 20px; }
  .mapping { border-radius: var(--radius-control); background: rgba(5,12,14,.45); } .targets { display: flex; gap: 12px; flex-wrap: wrap; } a { color: var(--color-accent-strong); } details { margin-top: 8px; } summary { color: var(--color-accent-strong); cursor: pointer; } pre { max-height: 300px; overflow: auto; border-radius: var(--radius-control); background: #071012; padding: 12px; white-space: pre-wrap; }
  .finding-list { display: grid; gap: 10px; } .finding { border-top: 1px solid var(--glass-border-subtle); padding-top: 10px; } .finding p { margin-top: 4px; color: var(--color-muted); }
  button, .primary { border: 1px solid var(--color-border); border-radius: var(--radius-control); background: rgba(255,255,255,.04); color: var(--color-text); padding: 8px 11px; cursor: pointer; } .primary { border: 0; background: var(--color-accent); color: #071312; font-weight: 780; }
  .alert, .success { border-radius: var(--radius-control); padding: 12px; } .alert { background: var(--color-danger-soft); color: var(--color-danger-text); } .success { background: var(--color-success-soft); color: var(--color-success-text); }
</style>
