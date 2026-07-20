<script lang="ts">
  import { ArrowUpRight } from "lucide-svelte";
  export interface ConnectedRecord { label: string; value: string | number; href?: string; state?: string; }
  interface Props { records: ConnectedRecord[]; title?: string; }
  let { records, title = "Connected Records" }: Props = $props();
</script>

<section class="connected-records" aria-labelledby="connected-records-title">
  <h2 id="connected-records-title">{title}</h2>
  <dl>
    {#each records as record}
      <div><dt>{record.label}</dt><dd>{#if record.href}<a href={record.href}>{record.value}<ArrowUpRight size={14} /></a>{:else}{record.value}{/if}{#if record.state}<small>{record.state}</small>{/if}</dd></div>
    {/each}
  </dl>
</section>

<style>
  .connected-records { border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); padding: 16px; }
  h2 { margin: 0 0 10px; font-size: 1rem; }
  dl { display: grid; margin: 0; }
  dl div { display: grid; grid-template-columns: minmax(130px, .8fr) minmax(120px, 1fr); gap: 12px; border-top: 1px solid var(--color-border); padding: 9px 0; }
  dt { color: var(--color-muted); font-size: .8125rem; } dd { margin: 0; font-size: .8125rem; font-weight: 700; }
  a { display: inline-flex; align-items: center; gap: 5px; color: var(--color-action); text-decoration: none; }
  small { display: block; margin-top: 2px; color: var(--color-muted); font-weight: 500; }
</style>
