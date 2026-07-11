<script lang="ts">
  interface Props {
    title: string;
    message: string;
    primaryActionLabel?: string;
    secondaryActionLabel?: string;
    onPrimaryAction?: () => void;
    onSecondaryAction?: () => void;
    live?: boolean;
  }

  let {
    title,
    message,
    primaryActionLabel,
    secondaryActionLabel,
    onPrimaryAction,
    onSecondaryAction,
    live = false,
  }: Props = $props();
</script>

<section class="empty-state" aria-live={live ? "polite" : undefined}>
  <h2>{title}</h2>
  <p>{message}</p>

  {#if (primaryActionLabel && onPrimaryAction) || (secondaryActionLabel && onSecondaryAction)}
    <div class="action-row">
      {#if primaryActionLabel && onPrimaryAction}
        <button class="button-link" type="button" onclick={onPrimaryAction}>{primaryActionLabel}</button>
      {/if}
      {#if secondaryActionLabel && onSecondaryAction}
        <button class="secondary-button" type="button" onclick={onSecondaryAction}>
          {secondaryActionLabel}
        </button>
      {/if}
    </div>
  {/if}
</section>
