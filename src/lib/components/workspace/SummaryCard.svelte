<script lang="ts">
  import { ArrowRight } from "lucide-svelte";
  interface Props { label: string; value: string | number; detail?: string; href?: string; tone?: "default" | "attention" | "critical"; }
  let { label, value, detail, href, tone = "default" }: Props = $props();
</script>

{#if href}
  <a class="summary-card" class:attention={tone === "attention"} class:critical={tone === "critical"} {href}>
    <span>{label}</span><strong>{value}</strong>{#if detail}<small>{detail}</small>{/if}<ArrowRight size={16} aria-hidden="true" />
  </a>
{:else}
  <div class="summary-card" class:attention={tone === "attention"} class:critical={tone === "critical"}>
    <span>{label}</span><strong>{value}</strong>{#if detail}<small>{detail}</small>{/if}
  </div>
{/if}

<style>
  .summary-card { position: relative; display: grid; gap: 5px; min-height: 112px; border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); color: var(--color-text); padding: 15px; text-decoration: none; }
  a:hover { border-color: var(--color-action); box-shadow: var(--elevation-z1); }
  span { color: var(--color-muted); font-size: .75rem; font-weight: 750; text-transform: uppercase; }
  strong { font-size: 1.75rem; line-height: 1; }
  small { color: var(--color-muted); }
  :global(svg) { position: absolute; right: 14px; bottom: 14px; color: var(--color-action); }
  .attention { border-left: 3px solid var(--color-warning); }
  .critical { border-left: 3px solid var(--color-danger); }
</style>
