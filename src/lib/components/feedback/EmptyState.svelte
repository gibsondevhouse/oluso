<script lang="ts">
  import { Inbox } from "lucide-svelte";
  interface Props { title: string; message: string; actionLabel?: string; onAction?: () => void; }
  let { title, message, actionLabel, onAction }: Props = $props();
</script>
<section class="feedback-state"><Inbox size={24} /><h2>{title}</h2><p>{message}</p>{#if actionLabel && onAction}<button type="button" onclick={onAction}>{actionLabel}</button>{/if}</section>
<style>.feedback-state { display: grid; justify-items: center; gap: 8px; border: 1px dashed var(--color-border-strong); border-radius: var(--radius-surface); background: var(--color-surface); color: var(--color-muted); padding: 34px 20px; text-align: center; } h2, p { margin: 0; } h2 { color: var(--color-text); font-size: 1rem; } p { max-width: 480px; font-size: .875rem; } button { min-height: 36px; margin-top: 4px; border: 1px solid var(--color-action); border-radius: var(--radius-control); background: var(--color-action); color: white; font-weight: 700; padding: 0 12px; }</style>
