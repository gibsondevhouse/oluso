<script lang="ts">
  import { ClipboardCheck } from "lucide-svelte";
  interface Props { state?: string; reviewer?: string; reviewedAt?: string; onSubmit?: () => void; }
  let { state = "Draft", reviewer, reviewedAt, onSubmit }: Props = $props();
</script>

<section class="review-panel"><div class="icon"><ClipboardCheck size={20} /></div><div><h2>Review</h2><p><strong>{state}</strong>{#if reviewer} · {reviewer}{/if}{#if reviewedAt} · {new Date(reviewedAt).toLocaleDateString()}{/if}</p></div>{#if onSubmit}<button type="button" onclick={onSubmit}>Submit for review</button>{/if}</section>

<style>
  .review-panel { display: grid; grid-template-columns: auto 1fr auto; align-items: center; gap: 12px; border: 1px solid var(--color-border); border-radius: var(--radius-surface); background: var(--color-surface); padding: 14px 16px; }
  .icon { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 50%; background: var(--color-info-soft); color: var(--color-info-text); }
  h2, p { margin: 0; } h2 { font-size: .875rem; } p { color: var(--color-muted); font-size: .75rem; }
  button { min-height: 34px; border: 1px solid var(--color-action); border-radius: var(--radius-control); background: var(--color-surface); color: var(--color-action); font-weight: 700; padding: 0 11px; }
  @media (max-width: 600px) { .review-panel { grid-template-columns: auto 1fr; } button { grid-column: 1 / -1; } }
</style>
