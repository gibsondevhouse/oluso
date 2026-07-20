<script lang="ts">
  export interface RelationshipItem { id: string; name: string; type?: string; detail?: string; href?: string; status?: string; }
  interface Props { title: string; items: RelationshipItem[]; emptyMessage?: string; }
  let { title, items, emptyMessage = "No connected records yet." }: Props = $props();
</script>

<section class="relationship-list">
  <h2>{title}</h2>
  {#if items.length}
    <ul>{#each items as item (item.id)}<li><div>{#if item.href}<a href={item.href}>{item.name}</a>{:else}<strong>{item.name}</strong>{/if}{#if item.detail}<small>{item.detail}</small>{/if}</div><div class="meta">{#if item.type}<span>{item.type}</span>{/if}{#if item.status}<span>{item.status}</span>{/if}</div></li>{/each}</ul>
  {:else}<p>{emptyMessage}</p>{/if}
</section>

<style>
  .relationship-list { border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); }
  h2 { margin: 0; border-bottom: 1px solid var(--color-border); font-size: 1rem; padding: 13px 15px; }
  ul { margin: 0; padding: 0; list-style: none; }
  li { display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--color-border); padding: 11px 15px; } li:last-child { border-bottom: 0; }
  li > div:first-child { display: grid; gap: 2px; }
  a, strong { color: var(--color-text); font-size: .875rem; text-decoration: none; } a:hover { color: var(--color-action); text-decoration: underline; }
  small, p { color: var(--color-muted); font-size: .75rem; } p { margin: 0; padding: 15px; }
  .meta { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 5px; }
  .meta span { border-radius: 999px; background: var(--color-surface-muted); color: var(--color-muted); font-size: .6875rem; font-weight: 700; padding: 3px 7px; }
</style>
