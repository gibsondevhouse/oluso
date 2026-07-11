<script lang="ts">
  interface Props {
    label: string;
    state?: string;
    tone?: string;
    context?: string;
    compact?: boolean;
  }

  let { label, state, tone = "neutral", context, compact = false }: Props = $props();

  const normalizedState = $derived((state ?? tone ?? label).toLowerCase().replace(/\s+/g, "-"));
  const accessibleLabel = $derived(context ? `${label} ${context}` : label);
</script>

<span
  class="status-pill {normalizedState}"
  class:compact
  role="status"
  aria-label={accessibleLabel}
>
  {label}
</span>

<style>
  .compact {
    min-height: 22px;
    font-size: 0.6875rem;
    padding: 0 7px;
  }
</style>
