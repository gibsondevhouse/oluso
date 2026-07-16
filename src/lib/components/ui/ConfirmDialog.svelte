<script lang="ts">
  import { onMount } from "svelte";

  interface Props {
    title: string;
    message: string;
    confirmLabel?: string;
    cancelLabel?: string;
    danger?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let {
    title,
    message,
    confirmLabel = "Confirm",
    cancelLabel = "Cancel",
    danger = false,
    onConfirm,
    onCancel,
  }: Props = $props();

  let dialogElement: HTMLDivElement | null = null;

  onMount(() => {
    dialogElement?.focus();
  });

  function handleDialogKeydown(event: KeyboardEvent) {
    event.stopPropagation();

    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
    }
  }
</script>

<div class="dialog-backdrop" role="presentation" onclick={onCancel}>
  <div
    class="dialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="confirm-dialog-title"
    tabindex="-1"
    bind:this={dialogElement}
    onclick={(e) => e.stopPropagation()}
    onkeydown={handleDialogKeydown}
  >
    <h2 id="confirm-dialog-title">{title}</h2>
    <p>{message}</p>
    <div class="action-row">
      <button
        class={danger ? "danger-button" : "button-link"}
        type="button"
        onclick={onConfirm}
      >
        {confirmLabel}
      </button>
      <button class="secondary-button" type="button" onclick={onCancel}>
        {cancelLabel}
      </button>
    </div>
  </div>
</div>

<style>
  .dialog-backdrop {
    position: fixed;
    inset: 0;
    z-index: 100;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(0, 0, 0, 0.52);
    padding: 24px;
    backdrop-filter: blur(8px);
  }

  .dialog {
    display: grid;
    gap: 14px;
    max-width: 420px;
    width: 100%;
    border: 1px solid var(--glass-border-subtle);
    border-radius: var(--radius-surface);
    background: var(--color-surface-solid);
    padding: 22px;
    box-shadow: var(--elevation-z3);
  }

  .dialog h2 {
    margin: 0;
    font-size: 1rem;
    font-weight: 760;
    line-height: 1.25;
  }

  .dialog p {
    margin: 0;
    color: var(--color-muted);
    font-size: 0.875rem;
  }
</style>
