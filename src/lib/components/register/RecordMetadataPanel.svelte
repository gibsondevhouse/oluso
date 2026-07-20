<script lang="ts">
  import { formatTimestamp } from "$lib/utils/date";
  import type { LifecycleMetadata } from "$lib/persistence/lifecycle.types";

  interface Props {
    record: LifecycleMetadata & {
      id: string;
      createdAt: string;
      updatedAt: string;
    };
  }

  let { record }: Props = $props();

  const isArchived = $derived(record.lifecycleStatus === "archived");
</script>

<section class="detail-panel" aria-labelledby="metadata-title">
  <div class="detail-header">
    <h2 id="metadata-title">Metadata</h2>
  </div>
  <dl class="detail-list">
    <div>
      <dt>ID</dt>
      <dd>{record.id}</dd>
    </div>
    <div>
      <dt>Created at</dt>
      <dd>{formatTimestamp(record.createdAt)}</dd>
    </div>
    <div>
      <dt>Updated at</dt>
      <dd>{formatTimestamp(record.updatedAt)}</dd>
    </div>
    <div>
      <dt>Lifecycle</dt>
      <dd>{isArchived ? "Archived" : "Active"}</dd>
    </div>
    {#if record.archivedAt}
      <div>
        <dt>Archived at</dt>
        <dd>{formatTimestamp(record.archivedAt)}</dd>
      </div>
    {/if}
    {#if record.archivedReason}
      <div>
        <dt>Archived reason</dt>
        <dd>{record.archivedReason}</dd>
      </div>
    {/if}
  </dl>
</section>

<style>
  .detail-panel {
    display: grid;
    gap: 12px;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: var(--color-surface);
    box-shadow: var(--surface-shadow);
    padding: 18px;
  }

  .detail-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .detail-header h2 {
    margin: 0;
    color: var(--color-text);
    font-size: 1.0625rem;
    font-weight: 760;
    line-height: 1.25;
  }

  .detail-list {
    display: grid;
    gap: 0;
    margin: 0;
    border-top: 1px solid var(--glass-border-subtle);
  }

  .detail-list div {
    display: grid;
    grid-template-columns: minmax(140px, 0.3fr) 1fr;
    gap: 16px;
    border-bottom: 1px solid var(--glass-border-subtle);
    padding: 11px 0;
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
  }

  @media (max-width: 720px) {
    .detail-list div {
      grid-template-columns: 1fr;
      gap: 4px;
    }
  }
</style>
