<script lang="ts">
  import { Clock3 } from "lucide-svelte";
  import { recentRecords } from "$lib/workspace/recent-records";
  interface Props { limit?: number; }
  let { limit = 5 }: Props = $props();
</script>

<section class="recent-records"><h2><Clock3 size={16} /> Recent records</h2>{#if $recentRecords.length}<ul>{#each $recentRecords.slice(0, limit) as record}<li><a href={record.path}><span>{record.title}</span><small>{record.context ?? "Record workspace"}</small></a></li>{/each}</ul>{:else}<p>Records you open will appear here.</p>{/if}</section>

<style>
  .recent-records { border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); }
  h2 { display: flex; align-items: center; gap: 7px; margin: 0; border-bottom: 1px solid var(--color-border); font-size: .875rem; padding: 12px 14px; }
  ul { margin: 0; padding: 0; list-style: none; } li + li { border-top: 1px solid var(--color-border); }
  a { display: grid; gap: 2px; color: var(--color-text); padding: 10px 14px; text-decoration: none; } a:hover { background: var(--color-surface-subtle); }
  span { font-size: .8125rem; font-weight: 700; } small, p { color: var(--color-muted); font-size: .75rem; } p { margin: 0; padding: 14px; }
</style>
