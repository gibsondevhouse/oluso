<script lang="ts">
  import { tick } from "svelte";
  import { Archive, ArrowRight, ExternalLink, X } from "lucide-svelte";

  export interface ContextPanelRecord {
    id: string;
    title: string;
    href?: string;
    meta?: string;
    archived?: boolean;
    missing?: boolean;
    sectionTitle?: string;
  }

  interface Props {
    record: ContextPanelRecord;
    onClose: () => void;
  }

  let { record, onClose }: Props = $props();
  let closeButton = $state<HTMLButtonElement | null>(null);

  $effect(() => {
    record.id;
    void tick().then(() => closeButton?.focus());
  });
</script>

<aside
  class="context-panel"
  class:missing={record.missing}
  aria-labelledby="context-panel-title"
  aria-describedby="context-panel-summary"
>
  <header>
    <div>
      <span>{record.sectionTitle ?? "Related record"}</span>
      <h2 id="context-panel-title">{record.title}</h2>
    </div>
    <button bind:this={closeButton} type="button" onclick={onClose} aria-label="Close context panel">
      <X size={17} aria-hidden="true" />
    </button>
  </header>

  <p id="context-panel-summary">
    Read-first inspection preserves the current workspace. Open the full record for edits,
    lifecycle actions, and complete revision context.
  </p>

  <dl>
    <div><dt>Status</dt><dd>{record.missing ? "Missing relationship" : record.archived ? "Archived" : "Available"}</dd></div>
    <div><dt>Relationship</dt><dd>{record.meta ?? "No relationship summary provided"}</dd></div>
    <div><dt>Record ID</dt><dd>{record.id}</dd></div>
  </dl>

  {#if record.archived}
    <p class="panel-warning">
      <Archive size={15} aria-hidden="true" />
      This related record is archived. Review the full workspace before relying on it for current work.
    </p>
  {/if}

  {#if record.missing || !record.href}
    <p class="panel-warning">
      This relationship points to a record that is unavailable in the local dataset.
    </p>
  {:else}
    <div class="panel-actions">
      <a href={record.href}>
        <ExternalLink size={15} aria-hidden="true" />
        Open full workspace
      </a>
      <a class="secondary" href={record.href}>
        <ArrowRight size={15} aria-hidden="true" />
        Continue
      </a>
    </div>
  {/if}
</aside>

<style>
  .context-panel {
    position: fixed;
    top: 76px;
    right: 18px;
    bottom: 48px;
    z-index: var(--z-depth-popover);
    display: grid;
    align-content: start;
    width: min(390px, calc(100vw - 36px));
    gap: 14px;
    overflow: auto;
    border: 1px solid var(--glass-border-strong);
    border-radius: var(--radius-surface);
    background: rgba(13, 22, 24, 0.98);
    box-shadow: var(--elevation-z3);
    padding: 16px;
  }

  .context-panel.missing {
    border-color: var(--color-warning-border);
  }

  .context-panel header {
    display: flex;
    align-items: start;
    justify-content: space-between;
    gap: 12px;
  }

  .context-panel header span {
    color: var(--color-accent-strong);
    font-size: 0.6875rem;
    font-weight: 780;
    text-transform: uppercase;
  }

  .context-panel h2,
  .context-panel p {
    margin: 0;
  }

  .context-panel h2 {
    color: var(--color-text);
    font-size: 1.125rem;
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .context-panel p,
  .context-panel dd {
    color: var(--color-muted);
    font-size: 0.84375rem;
    line-height: 1.45;
  }

  .context-panel button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex: 0 0 auto;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-control);
    background: rgba(255, 255, 255, 0.045);
    color: var(--color-text);
  }

  .context-panel dl {
    display: grid;
    gap: 1px;
    margin: 0;
    overflow: hidden;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-control);
    background: var(--glass-border-subtle);
  }

  .context-panel dl div {
    display: grid;
    gap: 4px;
    background: rgba(5, 12, 14, 0.42);
    padding: 10px;
  }

  .context-panel dt {
    color: var(--color-muted);
    font-size: 0.6875rem;
    font-weight: 760;
    text-transform: uppercase;
  }

  .context-panel dd {
    margin: 0;
    overflow-wrap: anywhere;
  }

  .panel-warning {
    display: flex;
    align-items: start;
    gap: 8px;
    border: 1px solid var(--color-warning-border);
    border-radius: var(--radius-control);
    background: var(--color-warning-soft);
    padding: 10px;
  }

  .panel-actions {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .panel-actions a {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    border: 1px solid var(--color-border-strong);
    border-radius: var(--radius-control);
    color: var(--color-text);
    font-size: 0.8125rem;
    font-weight: 760;
    padding: 8px 10px;
    text-decoration: none;
  }

  .panel-actions a.secondary {
    color: var(--color-accent-strong);
  }

  @media (max-width: 720px) {
    .context-panel {
      top: 64px;
      right: 10px;
      left: 10px;
      bottom: 42px;
      width: auto;
    }
  }
</style>
