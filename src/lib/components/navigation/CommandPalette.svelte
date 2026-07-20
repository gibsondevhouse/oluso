<script lang="ts">
  import { goto } from "$app/navigation";
  import { tick } from "svelte";
  import { Search, X } from "lucide-svelte";
  import { SIDEBAR_CONFIG } from "$lib/navigation/sidebar.config";
  import { recentRecords } from "$lib/workspace/recent-records";
  interface Props { open: boolean; onClose: () => void; }
  let { open, onClose }: Props = $props();
  let query = $state("");
  let searchInput = $state<HTMLInputElement>();
  const navigationItems = SIDEBAR_CONFIG.sections.flatMap((section) => section.children.map((item) => ({ ...item, section: section.title })));
  const results = $derived(navigationItems.filter((item) => `${item.title} ${item.section} ${item.description ?? ""}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 12));
  $effect(() => { if (open) { query = ""; void tick().then(() => searchInput?.focus()); } });
  async function select(path: string) { onClose(); await goto(path); }
  function keydown(event: KeyboardEvent) { if (event.key === "Escape") onClose(); }
</script>

{#if open}
  <div class="palette-backdrop" role="presentation" onclick={(event) => { if (event.target === event.currentTarget) onClose(); }} onkeydown={keydown}>
    <div class="command-palette" role="dialog" aria-modal="true" aria-labelledby="command-title">
      <header><Search size={18} /><label for="command-search" id="command-title">Go to a workspace or record</label><button type="button" aria-label="Close command palette" onclick={onClose}><X size={18} /></button></header>
      <input id="command-search" bind:this={searchInput} bind:value={query} placeholder="Search pages and workspaces…" autocomplete="off" />
      <div class="results">
        {#if !query && $recentRecords.length}
          <h2>Recent records</h2>{#each $recentRecords.slice(0, 5) as record}<button type="button" onclick={() => void select(record.path)}><span>{record.title}</span><small>{record.context ?? "Recently viewed"}</small></button>{/each}
        {/if}
        <h2>{query ? "Matching workspaces" : "Navigate"}</h2>
        {#each results as item}<button type="button" onclick={() => void select(item.route)}><span>{item.title}</span><small>{item.section}</small></button>{/each}
        {#if results.length === 0}<p>No matching workspace. Try a record name in Global Search.</p>{/if}
      </div>
      <footer><span><kbd>Esc</kbd> close</span><span><kbd>⌘</kbd><kbd>K</kbd> open anywhere</span></footer>
    </div>
  </div>
{/if}

<style>
  .palette-backdrop { position: fixed; z-index: 100; inset: 0; display: grid; place-items: start center; background: rgba(32, 37, 34, .36); padding: min(14vh, 110px) 18px 18px; }
  .command-palette { width: min(620px, 100%); overflow: hidden; border: 1px solid var(--color-border-strong); border-radius: 12px; background: var(--color-surface); box-shadow: var(--elevation-z3); }
  header { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 9px; border-bottom: 1px solid var(--color-border); color: var(--color-muted); padding: 11px 14px; }
  header label { color: var(--color-text); font-size: .8125rem; font-weight: 750; } header button { display: grid; place-items: center; border: 0; background: transparent; color: var(--color-muted); }
  input { width: 100%; min-height: 56px; border: 0; border-bottom: 1px solid var(--color-border); background: var(--color-surface); color: var(--color-text); font-size: 1.05rem; padding: 0 16px; outline: 0; }
  .results { max-height: 390px; overflow-y: auto; padding: 8px; }
  h2 { margin: 10px 8px 5px; color: var(--color-muted); font-size: .6875rem; text-transform: uppercase; }
  .results button { display: grid; grid-template-columns: 1fr auto; gap: 12px; width: 100%; min-height: 42px; border: 0; border-radius: var(--radius-control); background: transparent; color: var(--color-text); padding: 7px 9px; text-align: left; }
  .results button:hover, .results button:focus { background: var(--color-surface-subtle); }
  .results span { font-weight: 650; } small, p { color: var(--color-muted); font-size: .75rem; } p { padding: 10px; }
  footer { display: flex; justify-content: space-between; border-top: 1px solid var(--color-border); background: var(--color-surface-subtle); color: var(--color-muted); font-size: .6875rem; padding: 8px 12px; }
  kbd { margin: 0 2px; border: 1px solid var(--color-border); border-radius: 4px; background: var(--color-surface); padding: 1px 4px; }
</style>
