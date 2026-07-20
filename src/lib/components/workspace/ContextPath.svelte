<script lang="ts">
  interface PathItem { label: string; href?: string; }
  interface Props { items: PathItem[]; label?: string; }
  let { items, label = "Context" }: Props = $props();
</script>

<nav class="context-path" aria-label={label}>
  <ol>
    {#each items as item, index}
      <li>
        {#if index > 0}<span aria-hidden="true">›</span>{/if}
        {#if item.href}<a href={item.href}>{item.label}</a>{:else}<span>{item.label}</span>{/if}
      </li>
    {/each}
  </ol>
</nav>

<style>
  ol { display: flex; flex-wrap: wrap; gap: 6px; margin: 0; padding: 0; list-style: none; }
  li { display: inline-flex; align-items: center; gap: 6px; color: var(--color-muted); font-size: .8125rem; }
  a { color: inherit; text-decoration: none; }
  a:hover { color: var(--color-action); text-decoration: underline; }
</style>
