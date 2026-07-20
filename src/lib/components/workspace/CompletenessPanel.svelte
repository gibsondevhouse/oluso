<script lang="ts">
  import { Check, CircleHelp, TriangleAlert } from "lucide-svelte";
  export interface CompletenessRule { label: string; complete: boolean; guidance?: string; }
  interface Props { rules: CompletenessRule[]; title?: string; }
  let { rules, title = "Record completeness" }: Props = $props();
  const completed = $derived(rules.filter((rule) => rule.complete));
  const incomplete = $derived(rules.filter((rule) => !rule.complete));
  const percentage = $derived(rules.length ? Math.round((completed.length / rules.length) * 100) : 100);
</script>

<section class="completeness-panel" aria-labelledby="completeness-title">
  <header><div><h2 id="completeness-title">{title}</h2><p>{completed.length} of {rules.length} explicit checks complete</p></div><strong>{percentage}%</strong></header>
  <div class="meter" role="progressbar" aria-label={title} aria-valuenow={percentage} aria-valuemin="0" aria-valuemax="100"><span style:width={`${percentage}%`}></span></div>
  {#if completed.length}
    <h3>Complete</h3><ul class="complete">{#each completed as rule}<li><Check size={15} /> {rule.label}</li>{/each}</ul>
  {/if}
  {#if incomplete.length}
    <h3>Needs attention</h3><ul class="incomplete">{#each incomplete as rule}<li><TriangleAlert size={15} /><span>{rule.label}{#if rule.guidance}<small>{rule.guidance}</small>{/if}</span></li>{/each}</ul>
  {:else if rules.length === 0}
    <p class="unscored"><CircleHelp size={15} /> No completeness rules are defined for this record type.</p>
  {/if}
</section>

<style>
  .completeness-panel { display: grid; gap: 10px; border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); padding: 16px; }
  header { display: flex; align-items: start; justify-content: space-between; gap: 12px; }
  h2, h3, p { margin: 0; }
  h2 { font-size: 1rem; } h3 { margin-top: 4px; color: var(--color-muted); font-size: .7rem; text-transform: uppercase; }
  header p, small { display: block; color: var(--color-muted); font-size: .75rem; }
  header strong { color: var(--color-action); font-size: 1.25rem; }
  .meter { height: 6px; overflow: hidden; border-radius: 999px; background: var(--color-surface-muted); }
  .meter span { display: block; height: 100%; border-radius: inherit; background: var(--color-action); }
  ul { display: grid; gap: 7px; margin: 0; padding: 0; list-style: none; }
  li, .unscored { display: flex; align-items: flex-start; gap: 7px; font-size: .8125rem; }
  .complete :global(svg) { color: var(--color-positive-text); } .incomplete :global(svg) { color: var(--color-warning-text); }
  .unscored { color: var(--color-muted); }
</style>
