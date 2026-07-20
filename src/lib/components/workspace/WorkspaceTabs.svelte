<script lang="ts">
  export interface WorkspaceTab { id: string; label: string; count?: number; }
  interface Props { tabs: WorkspaceTab[]; active: string; onChange: (id: string) => void; label?: string; }
  let { tabs, active, onChange, label = "Workspace sections" }: Props = $props();
</script>

<div class="workspace-tabs" role="tablist" aria-label={label}>
  {#each tabs as tab}
    <button type="button" role="tab" aria-selected={active === tab.id} tabindex={active === tab.id ? 0 : -1} onclick={() => onChange(tab.id)}>
      {tab.label}{#if tab.count !== undefined}<span>{tab.count}</span>{/if}
    </button>
  {/each}
</div>

<style>
  .workspace-tabs { display: flex; gap: 2px; overflow-x: auto; border-bottom: 1px solid var(--color-border); }
  button { position: relative; min-height: 44px; flex: 0 0 auto; border: 0; background: transparent; color: var(--color-muted); font-size: .875rem; font-weight: 700; padding: 0 12px; }
  button:hover { color: var(--color-text); background: var(--color-surface-subtle); }
  button[aria-selected="true"] { color: var(--color-action); }
  button[aria-selected="true"]::after { position: absolute; right: 10px; bottom: -1px; left: 10px; height: 2px; background: var(--color-action); content: ""; }
  span { min-width: 20px; margin-left: 6px; border-radius: 999px; background: var(--color-surface-muted); color: var(--color-muted); font-size: .6875rem; padding: 2px 5px; }
</style>
