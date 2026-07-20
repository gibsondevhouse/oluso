<script lang="ts">
  export interface RevisionItem { id: string; revision: number; operation: string; changedAt: string; changedBy: string; }
  interface Props { revisions: RevisionItem[]; }
  let { revisions }: Props = $props();
</script>

<section class="revision-timeline"><h2>Record History</h2>{#if revisions.length}<ol>{#each revisions as item (item.id)}<li><span class="marker"></span><div><strong>Revision {item.revision} · {item.operation}</strong><small>{new Date(item.changedAt).toLocaleString()} · {item.changedBy}</small></div></li>{/each}</ol>{:else}<p>No revision history is available.</p>{/if}</section>

<style>
  .revision-timeline { border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); padding: 16px; }
  h2 { margin: 0 0 12px; font-size: 1rem; } ol { display: grid; gap: 0; margin: 0; padding: 0; list-style: none; }
  li { display: grid; grid-template-columns: 14px 1fr; gap: 9px; min-height: 50px; } .marker { width: 9px; height: 9px; margin-top: 5px; border: 2px solid var(--color-action); border-radius: 50%; background: var(--color-surface); }
  li:not(:last-child) .marker::after { display: block; width: 1px; height: 42px; margin: 7px 0 0 2px; background: var(--color-border-strong); content: ""; }
  li div { display: grid; align-content: start; gap: 2px; } strong { font-size: .8125rem; } small, p { color: var(--color-muted); font-size: .75rem; } p { margin: 0; }
</style>
