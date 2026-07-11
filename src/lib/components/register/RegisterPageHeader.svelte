<script lang="ts">
  import StatusPill from "$lib/components/ui/StatusPill.svelte";

  interface Props {
    breadcrumbs: string;
    title: string;
    titleId?: string;
    summary: string;
    statusLabel?: string;
    statusTone?: string;
    primaryActionLabel?: string;
    onPrimaryAction?: () => void;
  }

  let {
    breadcrumbs,
    title,
    titleId,
    summary,
    statusLabel,
    statusTone = "neutral",
    primaryActionLabel,
    onPrimaryAction,
  }: Props = $props();
</script>

<header class="page-header register-page-header">
  <div>
    <div class="breadcrumbs">{breadcrumbs}</div>
    <h1 class="page-title" id={titleId}>{title}</h1>
    <p class="page-summary">{summary}</p>
  </div>

  <div class="register-header-actions">
    {#if statusLabel}
      <StatusPill label={statusLabel} tone={statusTone} />
    {/if}
    {#if primaryActionLabel && onPrimaryAction}
      <button class="button-link" type="button" onclick={onPrimaryAction}>{primaryActionLabel}</button>
    {/if}
  </div>
</header>

<style>
  .register-page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 20px;
  }

  .register-header-actions {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
  }

  @media (max-width: 720px) {
    .register-page-header {
      flex-direction: column;
    }

    .register-header-actions {
      justify-content: flex-start;
    }
  }
</style>
